import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import api from "../api";
import Icon from "../Icon";
import ProfessorInicio from "./ProfessorInicio";

const ANO_LETIVO = new Date().getFullYear();

/* ─── helpers ─────────────────────────────────────────────────── */
function avg(arr, key) {
  if (!arr?.length) return 0;
  const vals = arr.map((x) => x[key]).filter((v) => v != null);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function fmt1(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function fmtPct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

/* ─── cores ────────────────────────────────────────────────────── */
const C_OK   = "var(--ok)";
const C_WARN = "var(--warn)";
const C_BAD  = "var(--bad)";
const C_BLUE = "var(--accent)";

/* tooltip customizado para os gráficos */
function BTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--ink)",
        boxShadow: "0 4px 16px rgba(0,0,0,.12)",
        minWidth: 130,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.fill || p.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--ink-2)" }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === "number" ? fmt1(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── KPI card ─────────────────────────────────────────────────── */
function KpiCard({ label, value, hint, color, loading }) {
  return (
    <div className="card kpi">
      {color && (
        <div
          style={{
            width: 3,
            height: 32,
            background: color,
            borderRadius: 2,
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      )}
      <div className="label">{label}</div>
      <div className="value">{loading ? "…" : value ?? "—"}</div>
      <div className="delta">{hint}</div>
    </div>
  );
}

/* ─── Linha de aluno em risco ──────────────────────────────────── */
function AlertaRow({ aluno }) {
  const media = aluno.mediaGeral ?? 0;
  const freq  = aluno.frequenciaGeral ?? 0;
  const gravidade = media < 4 || freq < 60 ? "critico" : "atencao";
  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{aluno.alunoNome}</td>
      <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{aluno.turmaNome}</td>
      <td>
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600,
            color: media >= 6 ? C_OK : media >= 4 ? C_WARN : C_BAD,
          }}
        >
          {fmt1(media)}
        </span>
      </td>
      <td>
        <div
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              overflow: "hidden",
              minWidth: 60,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(freq, 100)}%`,
                background: freq >= 75 ? C_OK : freq >= 60 ? C_WARN : C_BAD,
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-2)", whiteSpace: "nowrap" }}>
            {fmtPct(freq)}
          </span>
        </div>
      </td>
      <td>
        <span
          className={`pill ${gravidade === "critico" ? "pill--bad" : "pill--warn"}`}
          style={{ fontSize: 10 }}
        >
          {gravidade === "critico" ? "Crítico" : "Atenção"}
        </span>
      </td>
    </tr>
  );
}

/* ─── MAIN ─────────────────────────────────────────────────────── */
export default function Inicio({ onNav }) {
  const role      = typeof window !== "undefined" ? localStorage.getItem("role")      : null;
  const escolaNome = typeof window !== "undefined" ? localStorage.getItem("escolaNome") || "Escola" : "Escola";

  /* ── Professor vê painel específico ── */
  if (role === "PROFESSOR") return <ProfessorInicio onNav={onNav} />;

  /* estado base */
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingAcad, setLoadingAcad] = useState(false);
  const [erro, setErro] = useState("");

  const [countAlunos,     setCountAlunos]     = useState(null);
  const [countProfessores,setCountProfessores] = useState(null);
  const [countTurmas,     setCountTurmas]      = useState(null);
  const [countMaterias,   setCountMaterias]    = useState(null);

  /* dados acadêmicos por turma */
  const [turmasData, setTurmasData] = useState([]); // [{turmaId, turmaNome, media, freq, emRisco:[]}]

  /* ── fetch base ─────────────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    setLoadingBase(true);
    Promise.all([
      api.get("/usuarios").then((r) => r.data).catch(() => []),
      api.get("/turmas").then((r) => r.data).catch(() => []),
      api.get("/materias").then((r) => r.data).catch(() => []),
      api.get(`/vinculos/aluno-turma/ocupados-no-ano/${ANO_LETIVO}`).then((r) => r.data).catch(() => []),
    ]).then(([usuarios, turmas, materias, ocupados]) => {
      if (!alive) return;
      const lista = Array.isArray(usuarios) ? usuarios : [];
      const tDoAno = (Array.isArray(turmas) ? turmas : []).filter((x) => x.anoLetivo === ANO_LETIVO);
      setCountAlunos(Array.isArray(ocupados) ? ocupados.length : 0);
      setCountProfessores(lista.filter((x) => x.role === "PROFESSOR").length);
      setCountTurmas(tDoAno.length);
      setCountMaterias(Array.isArray(materias) ? materias.length : 0);

      /* agora busca resumo de cada turma */
      if (tDoAno.length > 0) {
        setLoadingAcad(true);
        const promises = tDoAno.map((t) =>
          api.get(`/notas/turma/${t.id}/resumo`).then((r) => ({ ok: true, data: r.data, turmaId: t.id })).catch(() => ({ ok: false, turmaId: t.id }))
        );
        Promise.all(promises).then((results) => {
          if (!alive) return;
          const td = results
            .filter((r) => r.ok && r.data)
            .map((r) => {
              const alunos = Array.isArray(r.data.alunos) ? r.data.alunos : [];
              return {
                turmaId:   r.turmaId,
                turmaNome: r.data.turmaNome || `Turma ${r.turmaId}`,
                serie:     r.data.serie || "",
                media:     avg(alunos, "mediaGeral"),
                freq:      avg(alunos, "frequenciaGeral"),
                emRisco:   alunos
                  .filter((a) => a.emRisco)
                  .map((a) => ({ ...a, turmaNome: r.data.turmaNome || `Turma ${r.turmaId}` })),
              };
            });
          setTurmasData(td);
        }).finally(() => {
          if (alive) setLoadingAcad(false);
        });
      }
    }).catch(() => {
      if (alive) setErro("Não foi possível carregar os indicadores.");
    }).finally(() => {
      if (alive) setLoadingBase(false);
    });

    return () => { alive = false; };
  }, []);

  /* ── derivados ──────────────────────────────────────────────── */
  const mediaGeral = useMemo(() => {
    if (!turmasData.length) return null;
    const vals = turmasData.map((t) => t.media).filter((v) => v > 0);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [turmasData]);

  const freqGeral = useMemo(() => {
    if (!turmasData.length) return null;
    const vals = turmasData.map((t) => t.freq).filter((v) => v > 0);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [turmasData]);

  const todosEmRisco = useMemo(
    () => turmasData.flatMap((t) => t.emRisco),
    [turmasData]
  );

  const chartBarData = useMemo(
    () =>
      turmasData
        .filter((t) => t.media > 0 || t.freq > 0)
        .map((t) => ({
          name:  t.turmaNome.length > 12 ? t.turmaNome.slice(0, 12) + "…" : t.turmaNome,
          media: parseFloat(t.media.toFixed(2)),
          freq:  parseFloat((t.freq / 10).toFixed(2)), // escala 0-10 para caber no mesmo eixo
          freqReal: t.freq,
        })),
    [turmasData]
  );

  const chartPieData = useMemo(() => {
    const total   = countAlunos ?? 0;
    const risco   = todosEmRisco.length;
    const regular = Math.max(0, total - risco);
    return [
      { name: "Regulares", value: regular },
      { name: "Em risco",  value: risco  },
    ];
  }, [countAlunos, todosEmRisco]);

  const loading = loadingBase;

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="page">
      {/* header */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Visão geral · {ANO_LETIVO}</div>
          <h1 className="page-title">Início</h1>
          <div className="page-subtitle">{escolaNome}</div>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      {/* KPIs — 6 cards */}
      <div className="grid g-6 mb-4" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <KpiCard label="Alunos ativos"   value={countAlunos}     hint={`ano letivo ${ANO_LETIVO}`}         loading={loading} />
        <KpiCard label="Professores"     value={countProfessores} hint="cadastrados"                        loading={loading} />
        <KpiCard label="Turmas"          value={countTurmas}     hint={`ano ${ANO_LETIVO}`}                 loading={loading} />
        <KpiCard label="Matérias"        value={countMaterias}   hint="no catálogo"                         loading={loading} />
        <KpiCard
          label="Média geral"
          value={loadingAcad ? "…" : mediaGeral != null ? fmt1(mediaGeral) : "—"}
          hint="média das turmas"
          color={mediaGeral != null ? (mediaGeral >= 6 ? C_OK : mediaGeral >= 4 ? C_WARN : C_BAD) : undefined}
          loading={false}
        />
        <KpiCard
          label="Em risco"
          value={loadingAcad ? "…" : todosEmRisco.length}
          hint="alunos abaixo do mínimo"
          color={todosEmRisco.length > 0 ? C_WARN : C_OK}
          loading={false}
        />
      </div>

      {/* linha de gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>
        {/* Bar chart — desempenho por turma */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-eyebrow">Acadêmico</div>
              <div className="card-title">Desempenho por turma</div>
            </div>
            {loadingAcad && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>carregando…</span>}
          </div>
          {chartBarData.length === 0 && !loadingAcad ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-3)", fontSize: 13 }}>
              Nenhum dado de notas disponível ainda.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={chartBarData}
                margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                barCategoryGap="30%"
                barGap={3}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--ink-3)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: "var(--ink-3)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<BTooltip />} cursor={{ fill: "var(--bg-hover, rgba(0,0,0,.04))" }} />
                <Bar dataKey="media" name="Média" radius={[3, 3, 0, 0]}>
                  {chartBarData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.media >= 6 ? C_OK : entry.media >= 4 ? C_WARN : C_BAD}
                    />
                  ))}
                </Bar>
                <Bar dataKey="freq" name="Freq. ÷10" radius={[3, 3, 0, 0]} fill={C_BLUE} opacity={0.45} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            {[
              { color: C_OK,   label: "Média ≥ 6" },
              { color: C_WARN, label: "Média 4–6" },
              { color: C_BAD,  label: "Média < 4" },
              { color: C_BLUE, label: "Frequência ÷10" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, opacity: l.label.includes("÷") ? 0.6 : 1 }} />
                <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut — regular vs em risco */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <div>
              <div className="card-eyebrow">Situação</div>
              <div className="card-title">Alunos</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {(countAlunos == null || countAlunos === 0) && !loading ? (
              <div style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>Sem dados</div>
            ) : (
              <>
                <div style={{ position: "relative" }}>
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={chartPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={70}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill={C_OK}   />
                        <Cell fill={C_WARN} />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
                      {loading ? "…" : countAlunos ?? "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>total</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 8 }}>
                  {chartPieData.map((d, i) => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: i === 0 ? C_OK : C_WARN }} />
                        <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Frequência geral */}
      <div className="card mb-4">
        <div className="card-header" style={{ marginBottom: 10 }}>
          <div>
            <div className="card-eyebrow">Presença</div>
            <div className="card-title">Frequência geral das turmas</div>
          </div>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: freqGeral != null
                ? freqGeral >= 75 ? C_OK : freqGeral >= 60 ? C_WARN : C_BAD
                : "var(--ink-3)",
            }}
          >
            {loadingAcad ? "…" : freqGeral != null ? fmtPct(freqGeral) : "—"}
          </span>
        </div>

        {turmasData.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {turmasData.map((t) => (
              <div key={t.turmaId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 120,
                    fontSize: 12,
                    color: "var(--ink-2)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flexShrink: 0,
                  }}
                >
                  {t.turmaNome}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--border)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(t.freq, 100)}%`,
                      background:
                        t.freq >= 75 ? C_OK : t.freq >= 60 ? C_WARN : C_BAD,
                      borderRadius: 3,
                      transition: "width .4s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 44,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--ink-2)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {fmtPct(t.freq)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "var(--ink-3)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
            {loadingAcad ? "Carregando dados de frequência…" : "Nenhuma turma com dados de frequência."}
          </div>
        )}
      </div>

      {/* Alertas — alunos em risco */}
      {(todosEmRisco.length > 0 || loadingAcad) && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-eyebrow">Alertas</div>
              <div className="card-title">Alunos em risco</div>
            </div>
            {todosEmRisco.length > 0 && (
              <span className="pill pill--warn">{todosEmRisco.length} aluno{todosEmRisco.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          {loadingAcad ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "16px 0" }}>Carregando…</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Turma</th>
                  <th>Média</th>
                  <th>Frequência</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {todosEmRisco.map((a, i) => (
                  <AlertaRow key={`${a.alunoNome}-${i}`} aluno={a} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* estado vazio: sem turmas/sem dados acadêmicos e não carregando */}
      {!loadingBase && !loadingAcad && turmasData.length === 0 && todosEmRisco.length === 0 && (
        <div className="card">
          <div className="empty">
            <div className="t">Sem dados acadêmicos</div>
            <div className="s">CADASTRE TURMAS E LANÇAMENTOS PARA VER OS INDICADORES</div>
          </div>
        </div>
      )}
    </div>
  );
}
