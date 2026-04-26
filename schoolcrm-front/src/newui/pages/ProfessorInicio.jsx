import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

/* ─── helpers ─────────────────────────────────────────────────── */
function avg(arr) {
  if (!arr?.length) return null;
  const vals = arr.filter((v) => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function mediaColor(v) {
  if (v == null) return "var(--ink-3)";
  if (v >= 7) return "var(--ok)";
  if (v >= 5) return "var(--warn)";
  return "var(--bad)";
}
function freqColor(v) {
  if (v == null) return "var(--ink-3)";
  if (v >= 75) return "var(--ok)";
  if (v >= 60) return "var(--warn)";
  return "var(--bad)";
}
function fmtMedia(v) {
  return v != null ? Number(v).toFixed(1) : "—";
}

const DIAS_NOME  = ["", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS_FULL  = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

/* ─── CSS responsivo ──────────────────────────────────────────── */
const RESP_CSS = `
  .prof-kpi-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .prof-main {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .prof-left  { display: flex; flex-direction: column; gap: 20px; }
  .prof-sidebar { display: flex; flex-direction: column; gap: 16px; }
  .prof-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .prof-turmas-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .prof-section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-3);
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  .prof-action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px 10px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    transition: border-color .15s, transform .1s;
    -webkit-tap-highlight-color: transparent;
  }
  .prof-action-card:hover  { border-color: var(--accent); }
  .prof-action-card:active { transform: scale(.96); }
  .prof-action-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--accent) 10%, var(--panel));
    display: flex; align-items: center; justify-content: center;
    color: var(--accent);
  }
  .prof-action-label { font-size: 12px; font-weight: 700; color: var(--ink); }
  .prof-action-desc  { font-size: 10px; color: var(--ink-3); text-align: center; }

  /* progress bar */
  .prof-bar-track {
    height: 5px; background: var(--border); border-radius: 3px; overflow: hidden;
  }
  .prof-bar-fill  { height: 100%; border-radius: 3px; transition: width .5s ease; }

  @media (min-width: 640px) {
    .prof-kpi-grid      { grid-template-columns: repeat(4, 1fr); }
    .prof-actions-grid  { grid-template-columns: repeat(4, 1fr); }
    .prof-turmas-grid   { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .prof-main          { grid-template-columns: 1fr 300px; }
  }
`;

/* ─── ProgressBar ─────────────────────────────────────────────── */
function ProgressBar({ pct, color }) {
  return (
    <div className="prof-bar-track">
      <div
        className="prof-bar-fill"
        style={{ width: `${Math.min(100, pct ?? 0)}%`, background: color }}
      />
    </div>
  );
}

/* ─── TurmaCard ───────────────────────────────────────────────── */
function TurmaCard({ turma, resumo }) {
  const alunos  = resumo?.alunos ?? [];
  const medias  = alunos.map((a) => a.mediaGeral).filter((v) => v != null);
  const freqs   = alunos.map((a) => a.frequenciaGeral).filter((v) => v != null);
  const mT      = avg(medias);
  const fT      = avg(freqs);
  const risco   = alunos.filter((a) => a.emRisco).length;

  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 2 }}>
            {resumo?.turmaNome || turma.nome}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {turma.serieNome && <span>{turma.serieNome} · </span>}
            {alunos.length} aluno{alunos.length !== 1 ? "s" : ""}
          </div>
          {turma.materias.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {turma.materias.map((m) => (
                <span
                  key={m}
                  className="pill"
                  style={{
                    fontSize: 9,
                    background: "color-mix(in srgb,var(--accent) 12%,var(--panel))",
                    color: "var(--accent)",
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        {risco > 0 && (
          <span
            className="pill"
            style={{ background: "var(--bad)", color: "#fff", fontSize: 10, flexShrink: 0, marginLeft: 8 }}
          >
            {risco} em risco
          </span>
        )}
      </div>

      {/* Média */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
          <span>Média geral</span>
          <span style={{ fontWeight: 700, color: mediaColor(mT) }}>{fmtMedia(mT)}</span>
        </div>
        <ProgressBar pct={(mT ?? 0) / 10 * 100} color={mediaColor(mT)} />
      </div>

      {/* Frequência */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>
          <span>Frequência</span>
          <span style={{ fontWeight: 700, color: freqColor(fT) }}>
            {fT != null ? `${fT.toFixed(0)}%` : "—"}
          </span>
        </div>
        <ProgressBar pct={fT} color={freqColor(fT)} />
      </div>
    </div>
  );
}

/* ─── ProfessorInicio ─────────────────────────────────────────── */
export default function ProfessorInicio({ onNav }) {
  const [vinculos, setVinculos] = useState([]);
  const [resumos,  setResumos]  = useState({});
  const [horarios, setHorarios] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const nome         = localStorage.getItem("nome") || "Professor";
  const primeiroNome = nome.trim().split(/\s+/)[0];

  /* ── load ── */
  useEffect(() => {
    Promise.all([
      api.get("/vinculos/professor-turma-materia/minhas").then((r) => r.data).catch(() => []),
      api.get("/horarios/minhas").then((r) => r.data).catch(() => []),
    ])
      .then(([vincs, hors]) => {
        const vArr = Array.isArray(vincs) ? vincs : [];
        const hArr = Array.isArray(hors) ? hors : [];
        setVinculos(vArr);
        setHorarios(hArr);

        const turmaIds = [...new Set(vArr.map((v) => v.turma?.id ?? v.turmaId).filter(Boolean))];
        return Promise.all(
          turmaIds.map((id) =>
            api
              .get(`/notas/turma/${id}/resumo`)
              .then((r) => ({ id, ...r.data }))
              .catch(() => ({ id, alunos: [], turmaNome: "" }))
          )
        );
      })
      .then((results) => {
        const map = {};
        results.forEach((r) => { map[r.id] = r; });
        setResumos(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── turmas derivadas ── */
  const turmas = useMemo(() => {
    const seen = new Set();
    const list = [];
    vinculos.forEach((v) => {
      const id = v.turma?.id ?? v.turmaId;
      if (!id || seen.has(id)) return;
      seen.add(id);
      list.push({
        id,
        nome:      v.turma?.nome     ?? v.turmaNome     ?? String(id),
        serieNome: v.turma?.serie?.nome ?? v.turmaSerieNome ?? "",
        materias: vinculos
          .filter((vv) => (vv.turma?.id ?? vv.turmaId) === id)
          .map((vv) => vv.materia?.nome ?? vv.materiaNome ?? "")
          .filter(Boolean),
      });
    });
    return list;
  }, [vinculos]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    let alunos = 0;
    const mediasAll = [];
    let emRisco = 0;
    turmas.forEach((t) => {
      const r = resumos[t.id];
      if (!r?.alunos) return;
      alunos += r.alunos.length;
      r.alunos.forEach((a) => {
        if (a.mediaGeral != null) mediasAll.push(a.mediaGeral);
        if (a.emRisco) emRisco++;
      });
    });
    return { turmas: turmas.length, alunos, media: avg(mediasAll), emRisco };
  }, [turmas, resumos]);

  /* ── risco ── */
  const risco = useMemo(() => {
    const list = [];
    turmas.forEach((t) => {
      const r = resumos[t.id];
      if (!r?.alunos) return;
      r.alunos
        .filter((a) => a.emRisco)
        .forEach((a) => list.push({ ...a, turmaNome: r.turmaNome || t.nome }));
    });
    return list.sort((a, b) => (a.mediaGeral ?? 99) - (b.mediaGeral ?? 99));
  }, [turmas, resumos]);

  /* ── horários hoje ── */
  const diaSemanaHoje = new Date().getDay(); // 0=Dom…6=Sáb
  const aulasHoje = useMemo(
    () =>
      horarios
        .filter((h) => Number(h.diaSemana) === diaSemanaHoje)
        .sort((a, b) => (a.ordemAula ?? 0) - (b.ordemAula ?? 0)),
    [horarios, diaSemanaHoje]
  );

  const hojeLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  });

  /* ── render ── */
  return (
    <>
      <style>{RESP_CSS}</style>
      <div className="page" style={{ maxWidth: "100%" }}>

        {/* Cabeçalho */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Painel do Professor</div>
            <h1 className="page-title">Olá, {primeiroNome}! 👋</h1>
            <div className="page-subtitle" style={{ textTransform: "capitalize" }}>{hojeLabel}</div>
          </div>
          <div className="row">
            <button className="btn accent" type="button" onClick={() => onNav?.("academico", "lancamentos")}>
              <Icon name="edit" size={13} /> Lançar nota
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="prof-kpi-grid">
          {[
            { label: "Minhas turmas", val: kpis.turmas,                                      color: "var(--accent)" },
            { label: "Total alunos",  val: kpis.alunos,                                      color: "var(--ok)"     },
            { label: "Média geral",   val: loading ? "…" : fmtMedia(kpis.media),             color: mediaColor(kpis.media) },
            { label: "Em risco",      val: loading ? "…" : kpis.emRisco,                     color: kpis.emRisco > 0 ? "var(--bad)" : "var(--ok)" },
          ].map((k) => (
            <div key={k.label} className="card kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
              <div className="label" style={{ fontSize: 11 }}>{k.label}</div>
              <div className="value" style={{ color: k.color, fontSize: 22, fontWeight: 700 }}>
                {loading ? "…" : k.val}
              </div>
            </div>
          ))}
        </div>

        {/* Layout principal */}
        <div className="prof-main">
          {/* Coluna esquerda */}
          <div className="prof-left">

            {/* Ações rápidas */}
            <section>
              <div className="prof-section-label">Ações rápidas</div>
              <div className="prof-actions-grid">
                {[
                  { label: "Lançamentos", icon: "edit",      section: "academico",  page: "lancamentos", desc: "Notas e avaliações" },
                  { label: "Atrasos",     icon: "clock",     section: "academico",  page: "atrasos",     desc: "Registrar faltas"   },
                  { label: "Boletins",    icon: "clipboard", section: "academico",  page: "boletins",    desc: "Desempenho alunos"  },
                  { label: "Comunicação", icon: "mail",      section: "comunicacao",page: null,          desc: "Mensagens"          },
                ].map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className="prof-action-card"
                    onClick={() => onNav?.(a.section, a.page)}
                  >
                    <div className="prof-action-icon">
                      <Icon name={a.icon} size={20} />
                    </div>
                    <div className="prof-action-label">{a.label}</div>
                    <div className="prof-action-desc">{a.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Aulas de hoje */}
            {aulasHoje.length > 0 && (
              <section>
                <div className="prof-section-label">
                  Hoje · {DIAS_FULL[diaSemanaHoje]}
                </div>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {aulasHoje.map((h, i) => (
                    <div
                      key={h.id ?? i}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px",
                        borderBottom: i < aulasHoje.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: "color-mix(in srgb,var(--accent) 12%,var(--panel))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "var(--accent)",
                      }}>
                        {h.ordemAula ?? i + 1}ª
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
                          {h.materiaNome}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                          {h.turmaNome}{h.turmaSerieNome ? ` · ${h.turmaSerieNome}` : ""}
                        </div>
                      </div>
                      {h.horarioInicio && (
                        <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", flexShrink: 0 }}>
                          {h.horarioInicio}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Minhas turmas */}
            <section>
              <div className="prof-section-label">
                Minhas turmas{!loading && turmas.length > 0 ? ` (${turmas.length})` : ""}
              </div>
              {loading ? (
                <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  Carregando…
                </div>
              ) : turmas.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
                    Nenhuma turma atribuída
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
                    A coordenação deve vincular você a uma turma e matéria.
                  </div>
                </div>
              ) : (
                <div className="prof-turmas-grid">
                  {turmas.map((t) => (
                    <TurmaCard key={t.id} turma={t} resumo={resumos[t.id]} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar direita */}
          <aside className="prof-sidebar">
            {/* Alunos em risco */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                  Alunos em risco
                </div>
                {risco.length > 0 && (
                  <span className="pill" style={{ background: "var(--bad)", color: "#fff", fontSize: 10 }}>
                    {risco.length}
                  </span>
                )}
              </div>
              {loading ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Carregando…</div>
              ) : risco.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>Nenhum aluno em risco</div>
                </div>
              ) : (
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {risco.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 16px",
                        borderBottom: i < risco.length - 1 ? "1px solid var(--border)" : "none",
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: "color-mix(in srgb,var(--bad) 15%,var(--panel))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "var(--bad)",
                      }}>
                        {(a.alunoNome || "?")[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 600, color: "var(--ink)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {a.alunoNome}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{a.turmaNome}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: mediaColor(a.mediaGeral) }}>
                          {fmtMedia(a.mediaGeral)}
                        </div>
                        {a.frequenciaGeral != null && (
                          <div style={{ fontSize: 9, color: freqColor(a.frequenciaGeral) }}>
                            {a.frequenciaGeral.toFixed(0)}% freq
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Semana */}
            {horarios.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{
                  padding: "12px 16px", borderBottom: "1px solid var(--border)",
                  fontWeight: 700, fontSize: 13, color: "var(--ink)",
                }}>
                  Minha semana
                </div>
                <div style={{ padding: "6px 0" }}>
                  {[1, 2, 3, 4, 5].map((dia) => {
                    const aulas = horarios.filter((h) => Number(h.diaSemana) === dia);
                    if (!aulas.length) return null;
                    const isHoje = dia === diaSemanaHoje;
                    const materias = [...new Set(aulas.map((h) => h.materiaNome))];
                    return (
                      <div
                        key={dia}
                        style={{
                          padding: "8px 16px",
                          display: "flex", gap: 10, alignItems: "flex-start",
                          background: isHoje
                            ? "color-mix(in srgb,var(--accent) 6%,var(--panel))"
                            : "transparent",
                        }}
                      >
                        <div style={{
                          fontSize: 11, fontWeight: 700, width: 28, flexShrink: 0, paddingTop: 2,
                          color: isHoje ? "var(--accent)" : "var(--ink-3)",
                        }}>
                          {DIAS_NOME[dia]}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, flex: 1 }}>
                          {materias.map((m) => (
                            <span
                              key={m}
                              className="pill"
                              style={{
                                fontSize: 9,
                                background: isHoje
                                  ? "color-mix(in srgb,var(--accent) 16%,var(--panel))"
                                  : "var(--bg)",
                                color: isHoje ? "var(--accent)" : "var(--ink-2)",
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
