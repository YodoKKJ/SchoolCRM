import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

const ANO_ATUAL = new Date().getFullYear();

const ROLES = [
  { id: "TODOS", label: "Todos", cor: "var(--ink-2)" },
  { id: "ALUNO", label: "Alunos", cor: "#3F6FB0" },
  { id: "PROFESSOR", label: "Professores", cor: "#2F7F5E" },
  { id: "COORDENACAO", label: "Coordenação", cor: "#B5832A" },
  { id: "DIRECAO", label: "Direção", cor: "#9C5580" },
];

const AVATAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

function roleLabel(r) {
  return (
    { ALUNO: "Aluno", PROFESSOR: "Professor", COORDENACAO: "Coordenação", DIRECAO: "Direção", MASTER: "Master" }[r] ||
    r ||
    "—"
  );
}
function roleColor(r) {
  return (
    { ALUNO: "#3F6FB0", PROFESSOR: "#2F7F5E", COORDENACAO: "#B5832A", DIRECAO: "#9C5580", MASTER: "#A8473A" }[r] ||
    "var(--ink-3)"
  );
}
function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "—";
}
function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return String(d);
  }
}
function fmtMoney(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function Usuarios() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [lista, setLista] = useState([]);
  const [role, setRole] = useState("TODOS");
  const [apenasAtivos, setApenasAtivos] = useState(true);
  const [busca, setBusca] = useState("");
  const [ficha, setFicha] = useState(null);
  const [novoOpen, setNovoOpen] = useState(false);

  const load = () => {
    setLoading(true);
    setErro("");
    api
      .get("/usuarios")
      .then((r) => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Não foi possível carregar os usuários."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { TODOS: 0, ALUNO: 0, PROFESSOR: 0, COORDENACAO: 0, DIRECAO: 0, MASTER: 0 };
    lista.forEach((u) => {
      if (apenasAtivos && u.ativo === false) return;
      c.TODOS++;
      if (c[u.role] != null) c[u.role]++;
    });
    return c;
  }, [lista, apenasAtivos]);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((u) => {
      if (role !== "TODOS" && u.role !== role) return false;
      if (apenasAtivos && u.ativo === false) return false;
      if (q && ![u.nome, u.login].some((s) => (s || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [lista, role, apenasAtivos, busca]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Pessoas · Usuários</div>
          <h1 className="page-title">Usuários do sistema</h1>
          <div className="page-subtitle">
            {loading
              ? "carregando…"
              : `${counts.TODOS} ${apenasAtivos ? "ativos" : "total"} · ${counts.ALUNO} alunos · ${counts.PROFESSOR} professores · ${
                  counts.COORDENACAO + counts.DIRECAO
                } equipe`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setNovoOpen(true)}>
            <Icon name="plus" /> Novo usuário
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      {/* Filtro por role */}
      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className="role-chip"
              data-on={role === r.id}
              onClick={() => setRole(r.id)}
            >
              <span className="dotx" style={{ background: r.cor }} />
              <span className="lbl">{r.label}</span>
              <span className="n">{counts[r.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, position: "relative", maxWidth: 420 }}>
            <input
              className="input"
              placeholder="Buscar por nome ou login…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
            <Icon
              name="search"
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
              }}
            />
          </div>
          <label
            className="row"
            style={{ gap: 6, fontSize: 12, color: "var(--ink-2)", cursor: "pointer", userSelect: "none" }}
          >
            <input
              type="checkbox"
              checked={apenasAtivos}
              onChange={(e) => setApenasAtivos(e.target.checked)}
            />
            Apenas ativos
          </label>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Login</th>
              <th>Perfil</th>
              <th>Contato</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} onClick={() => setFicha(u)} style={{ cursor: "pointer" }}>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <span className={`avatar sm ${avatarColor(u.id)}`}>{iniciais(u.nome)}</span>
                    <span className="strong">{u.nome}</span>
                  </div>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-2)" }}>
                    @{u.login}
                  </span>
                </td>
                <td>
                  <span
                    className="pill"
                    style={{
                      background: "transparent",
                      borderColor: roleColor(u.role),
                      color: roleColor(u.role),
                    }}
                  >
                    <span className="dot" style={{ background: roleColor(u.role) }} /> {roleLabel(u.role)}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                    {u.telefone || "—"}
                  </span>
                </td>
                <td>
                  {u.ativo === false ? (
                    <span className="pill pill--err">
                      <span className="dot" /> inativo
                    </span>
                  ) : (
                    <span className="pill pill--ok">
                      <span className="dot" /> ativo
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ficha && <FichaDrawer u={ficha} onClose={() => setFicha(null)} onChanged={load} />}
      {novoOpen && <NovoUsuarioModal onClose={() => setNovoOpen(false)} onSaved={() => { setNovoOpen(false); load(); }} />}
    </div>
  );
}

/* ============================= FICHA DRAWER ============================= */

function FichaDrawer({ u, onClose, onChanged }) {
  const isAluno = u.role === "ALUNO";
  const isProf = u.role === "PROFESSOR";
  const [tab, setTab] = useState("dados");
  const [editOpen, setEditOpen] = useState(false);

  // Dados gerais do aluno (turma atual, responsaveis, contratos) — KPIs do header
  const [alunoMeta, setAlunoMeta] = useState({ turma: null, responsaveis: [], contratos: [], boletim: null });
  const [metaLoading, setMetaLoading] = useState(false);

  // Histórico
  const [historico, setHistorico] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  // Financeiro — contas a receber
  const [contas, setContas] = useState([]);
  const [contasLoading, setContasLoading] = useState(false);

  // Professor — turmas e matérias
  const [profVinculos, setProfVinculos] = useState([]);
  const [profLoading, setProfLoading] = useState(false);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  // Fetch meta quando aluno
  useEffect(() => {
    if (!isAluno) return;
    setMetaLoading(true);
    Promise.all([
      api.get(`/vinculos/aluno-turma?alunoId=${u.id}&anoLetivo=${ANO_ATUAL}`).then((r) => r.data).catch(() => []),
      api.get(`/fin/responsaveis/aluno/${u.id}`).then((r) => r.data).catch(() => []),
      api.get(`/fin/contratos?alunoId=${u.id}`).then((r) => r.data).catch(() => []),
    ])
      .then(async ([vinculos, resps, contratos]) => {
        const atual = Array.isArray(vinculos) && vinculos[0] ? vinculos[0].turma : null;
        let boletim = null;
        if (atual?.id) {
          boletim = await api
            .get(`/notas/boletim/${u.id}/${atual.id}`)
            .then((r) => r.data)
            .catch(() => null);
        }
        setAlunoMeta({
          turma: atual,
          responsaveis: Array.isArray(resps) ? resps : [],
          contratos: Array.isArray(contratos) ? contratos : [],
          boletim,
        });
      })
      .finally(() => setMetaLoading(false));
  }, [u.id, isAluno]);

  // Lazy fetch por aba
  useEffect(() => {
    if (!isAluno) return;
    if (tab === "historico" && historico.length === 0 && !histLoading) {
      setHistLoading(true);
      api
        .get(`/vinculos/aluno-turma/historico/${u.id}`)
        .then((r) => setHistorico(Array.isArray(r.data) ? r.data : []))
        .catch(() => setHistorico([]))
        .finally(() => setHistLoading(false));
    }
    if (tab === "financeiro" && contas.length === 0 && !contasLoading) {
      setContasLoading(true);
      api
        .get(`/fin/contas-receber?alunoId=${u.id}`)
        .then((r) => setContas(Array.isArray(r.data) ? r.data : []))
        .catch(() => setContas([]))
        .finally(() => setContasLoading(false));
    }
  }, [tab, isAluno, u.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isProf) return;
    if (tab === "turmas" && profVinculos.length === 0 && !profLoading) {
      setProfLoading(true);
      api
        .get(`/vinculos/professor-turma-materia`)
        .then((r) => {
          const all = Array.isArray(r.data) ? r.data : [];
          setProfVinculos(all.filter((v) => v.professor?.id === u.id));
        })
        .catch(() => setProfVinculos([]))
        .finally(() => setProfLoading(false));
    }
  }, [tab, isProf, u.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async () => {
    try {
      await api.patch(`/usuarios/${u.id}/status`);
      onChanged?.();
      onClose();
    } catch {
      // silencioso — backend pode retornar erro que usuario já mostra
    }
  };

  const mediaKpi = alunoMeta.boletim?.disciplinas?.length
    ? alunoMeta.boletim.disciplinas.reduce((a, d) => a + (d.mediaAnual || 0), 0) /
      alunoMeta.boletim.disciplinas.length
    : null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div className="row" style={{ gap: 14, alignItems: "center" }}>
            <span
              className={`avatar ${avatarColor(u.id)}`}
              style={{ width: 56, height: 56, fontSize: 18 }}
            >
              {iniciais(u.nome)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="card-eyebrow" style={{ marginBottom: 2 }}>
                Ficha · {roleLabel(u.role)}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                  color: "var(--ink)",
                }}
              >
                {u.nome}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                }}
              >
                @{u.login}
                {alunoMeta.turma ? ` · ${alunoMeta.turma.nome}` : ""}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn sm" type="button" onClick={() => setEditOpen(true)}>
              <Icon name="edit" size={12} /> Editar
            </button>
            <button className="icon-btn" type="button" onClick={onClose}>
              <Icon name="x" />
            </button>
          </div>
        </div>

        {isAluno && (
          <div className="ficha-kpis">
            <KpiSm
              label="Média anual"
              value={mediaKpi != null ? mediaKpi.toFixed(1) : "—"}
              tone={mediaKpi == null ? "neutral" : mediaKpi >= 6 ? "ok" : "bad"}
            />
            <KpiSm
              label="Frequência"
              value={
                alunoMeta.boletim?.frequenciaGeral != null
                  ? `${Math.round(alunoMeta.boletim.frequenciaGeral)}%`
                  : "—"
              }
              tone={
                alunoMeta.boletim?.frequenciaGeral == null
                  ? "neutral"
                  : alunoMeta.boletim.frequenciaGeral >= 75
                  ? "ok"
                  : "bad"
              }
            />
            <KpiSm
              label="Responsáveis"
              value={alunoMeta.responsaveis.length}
              tone={alunoMeta.responsaveis.length > 0 ? "ok" : "warn"}
            />
            <KpiSm
              label="Contrato"
              value={alunoMeta.contratos.length > 0 ? "Ativo" : "Sem"}
              tone={alunoMeta.contratos.length > 0 ? "ok" : "warn"}
            />
          </div>
        )}

        <div className="drawer-tabs">
          <button type="button" className={tab === "dados" ? "on" : ""} onClick={() => setTab("dados")}>
            Dados
          </button>
          {isAluno && (
            <>
              <button
                type="button"
                className={tab === "academico" ? "on" : ""}
                onClick={() => setTab("academico")}
              >
                Acadêmico
              </button>
              <button
                type="button"
                className={tab === "historico" ? "on" : ""}
                onClick={() => setTab("historico")}
              >
                Histórico
              </button>
              <button
                type="button"
                className={tab === "financeiro" ? "on" : ""}
                onClick={() => setTab("financeiro")}
              >
                Financeiro
              </button>
            </>
          )}
          {isProf && (
            <button type="button" className={tab === "turmas" ? "on" : ""} onClick={() => setTab("turmas")}>
              Turmas & matérias
            </button>
          )}
          <button type="button" className={tab === "acesso" ? "on" : ""} onClick={() => setTab("acesso")}>
            Acesso
          </button>
        </div>

        <div className="drawer-body">
          {tab === "dados" && <TabDados u={u} alunoMeta={alunoMeta} isAluno={isAluno} />}

          {tab === "academico" && isAluno && (
            <TabAcademico meta={alunoMeta} loading={metaLoading} />
          )}

          {tab === "historico" && isAluno && (
            <TabHistorico historico={historico} loading={histLoading} />
          )}

          {tab === "financeiro" && isAluno && (
            <TabFinanceiro contratos={alunoMeta.contratos} contas={contas} loading={contasLoading} />
          )}

          {tab === "turmas" && isProf && <TabTurmasProf vinculos={profVinculos} loading={profLoading} />}

          {tab === "acesso" && <TabAcesso u={u} onToggleStatus={toggleStatus} />}
        </div>

        {editOpen && (
          <EditarUsuarioModal
            u={u}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              onChanged?.();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ============================= FICHA SECTIONS ============================= */

function FichaSec({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "var(--panel-2)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FichaRow({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 10,
        padding: "9px 14px",
        borderBottom: "1px solid var(--line)",
        fontSize: 12.5,
      }}
    >
      <div style={{ color: "var(--ink-3)" }}>{label}</div>
      <div style={{ color: "var(--ink)", fontWeight: 500 }}>{value ?? "—"}</div>
    </div>
  );
}

function KpiSm({ label, value, tone = "neutral" }) {
  const bg =
    tone === "ok"
      ? "rgba(47,127,94,.06)"
      : tone === "warn"
      ? "rgba(200,140,60,.06)"
      : tone === "bad"
      ? "rgba(168,71,58,.06)"
      : "var(--panel-2)";
  const color = tone === "ok" ? "#2F7F5E" : tone === "warn" ? "#C88C3C" : tone === "bad" ? "#A8473A" : "var(--ink)";
  return (
    <div className="kpi-sm" style={{ background: bg }}>
      <div className="kpi-l">{label}</div>
      <div className="kpi-v" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/* ============================= TABS ============================= */

function TabDados({ u, alunoMeta, isAluno }) {
  return (
    <>
      <FichaSec title="Identificação">
        <FichaRow label="Nome completo" value={u.nome} />
        <FichaRow
          label="Login"
          value={<span style={{ fontFamily: "var(--font-mono)" }}>@{u.login}</span>}
        />
        <FichaRow label="Perfil" value={roleLabel(u.role)} />
        {u.dataNascimento && <FichaRow label="Nascimento" value={fmtDate(u.dataNascimento)} />}
      </FichaSec>

      {isAluno && (u.nomeMae || u.nomePai || u.telefone) && (
        <FichaSec title="Filiação & contato">
          <FichaRow label="Mãe" value={u.nomeMae || "—"} />
          <FichaRow
            label="Pai"
            value={u.nomePai || <span style={{ color: "var(--ink-4)" }}>não informado</span>}
          />
          <FichaRow
            label="Telefone"
            value={<span style={{ fontFamily: "var(--font-mono)" }}>{u.telefone || "—"}</span>}
          />
        </FichaSec>
      )}

      {!isAluno && u.telefone && (
        <FichaSec title="Contato">
          <FichaRow
            label="Telefone"
            value={<span style={{ fontFamily: "var(--font-mono)" }}>{u.telefone}</span>}
          />
        </FichaSec>
      )}

      {isAluno && alunoMeta.responsaveis.length > 0 && (
        <FichaSec title="Responsáveis">
          {alunoMeta.responsaveis.map((r) => (
            <FichaRow
              key={r.id}
              label={r.tipo === "PRINCIPAL" ? "Principal" : "Secundário"}
              value={
                <>
                  {r.pessoaNome}
                  {r.parentesco ? (
                    <span style={{ color: "var(--ink-3)", fontSize: 11, marginLeft: 6 }}>
                      · {r.parentesco}
                    </span>
                  ) : null}
                </>
              }
            />
          ))}
        </FichaSec>
      )}
    </>
  );
}

function TabAcademico({ meta, loading }) {
  if (loading) return <div style={{ padding: 20, color: "var(--ink-3)" }}>carregando…</div>;
  if (!meta.turma) {
    return (
      <div className="empty">
        <div className="t">Sem turma atual</div>
        <div className="s">ALUNO NÃO ESTÁ MATRICULADO EM {ANO_ATUAL}</div>
      </div>
    );
  }
  const b = meta.boletim;
  return (
    <>
      <FichaSec title="Turma atual">
        <FichaRow label="Turma" value={meta.turma.nome} />
        <FichaRow label="Série" value={meta.turma.serie?.nome || "—"} />
        <FichaRow label="Ano letivo" value={meta.turma.anoLetivo} />
      </FichaSec>

      {b?.disciplinas?.length > 0 && (
        <FichaSec title="Médias por matéria">
          <div className="mini-grade" style={{ padding: 14 }}>
            {b.disciplinas.map((d) => {
              const v = visual(d.materiaNome);
              const nota = d.mediaAnual || 0;
              return (
                <div key={d.materiaId} className="mg-row">
                  <div className="mg-m">
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: v.cor,
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                    {d.materiaNome}
                  </div>
                  <div className="mg-bar">
                    <div
                      style={{
                        width: `${Math.min(100, (nota / 10) * 100)}%`,
                        background: nota >= 6 ? "var(--ok)" : "var(--bad)",
                      }}
                    />
                  </div>
                  <div className="mg-n">{nota.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </FichaSec>
      )}
    </>
  );
}

function TabHistorico({ historico, loading }) {
  if (loading) return <div style={{ padding: 20, color: "var(--ink-3)" }}>carregando…</div>;
  if (!historico.length) {
    return (
      <div className="empty">
        <div className="t">Sem histórico</div>
        <div className="s">NENHUMA MATRÍCULA ENCONTRADA</div>
      </div>
    );
  }
  return (
    <FichaSec title="Histórico de matrículas">
      <div className="timeline" style={{ padding: 16 }}>
        {historico.map((h, i) => (
          <div key={i} className="tl-item">
            <span className="tl-dot" style={{ background: "var(--accent)" }} />
            {i < historico.length - 1 && <span className="tl-line" />}
            <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>
              {h.turma?.nome || "—"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--ink-3)",
                marginTop: 2,
              }}
            >
              {h.turma?.serie?.nome || "—"} · {h.turma?.anoLetivo || "—"}
            </div>
          </div>
        ))}
      </div>
    </FichaSec>
  );
}

function TabFinanceiro({ contratos, contas, loading }) {
  if (loading) return <div style={{ padding: 20, color: "var(--ink-3)" }}>carregando…</div>;
  return (
    <>
      {contratos.length === 0 ? (
        <div className="empty">
          <div className="t">Sem contrato ativo</div>
          <div className="s">ALUNO NÃO TEM CONTRATO FINANCEIRO</div>
        </div>
      ) : (
        <FichaSec title="Contratos">
          {contratos.map((c) => (
            <FichaRow
              key={c.id}
              label={`Ano ${c.anoLetivo || "—"}`}
              value={
                <>
                  {fmtMoney(c.valorTotal)}
                  <span style={{ color: "var(--ink-3)", fontSize: 11, marginLeft: 6 }}>
                    · {c.numParcelas || "—"}x
                  </span>
                </>
              }
            />
          ))}
        </FichaSec>
      )}

      {contas.length > 0 && (
        <FichaSec title="Últimas parcelas">
          <div style={{ padding: 14 }}>
            <div className="parcelas-mini">
              {contas.slice(0, 12).map((p) => {
                const tone =
                  p.status === "PAGO" ? "pago" : p.status === "VENCIDO" ? "pendente" : "pendente";
                return (
                  <div key={p.id} className={`pcl ${tone}`}>
                    <div className="pcl-m">
                      {p.numParcela ? `${p.numParcela}/${p.totalParcelas || "?"}` : "—"}
                    </div>
                    <div className="pcl-v">{fmtMoney(p.valor)}</div>
                    <div className="pcl-s">{fmtDate(p.dataVencimento)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </FichaSec>
      )}
    </>
  );
}

function TabTurmasProf({ vinculos, loading }) {
  if (loading) return <div style={{ padding: 20, color: "var(--ink-3)" }}>carregando…</div>;
  if (!vinculos.length) {
    return (
      <div className="empty">
        <div className="t">Sem vínculos</div>
        <div className="s">PROFESSOR NÃO TEM TURMAS ATRIBUÍDAS</div>
      </div>
    );
  }

  // agrupa por turma
  const porTurma = new Map();
  vinculos.forEach((v) => {
    const k = v.turma?.id;
    if (!porTurma.has(k)) porTurma.set(k, { turma: v.turma, materias: [] });
    porTurma.get(k).materias.push(v.materia);
  });

  return (
    <FichaSec title={`${porTurma.size} turma(s)`}>
      {[...porTurma.values()].map((g) => (
        <div
          key={g.turma?.id}
          style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{g.turma?.nome}</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--ink-3)",
              marginTop: 2,
            }}
          >
            {g.turma?.serie?.nome} · {g.turma?.anoLetivo}
          </div>
          <div className="row" style={{ gap: 4, flexWrap: "wrap", marginTop: 8 }}>
            {g.materias.map((m, i) => {
              const v = visual(m?.nome || "");
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: v.cor,
                    color: "white",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                  }}
                >
                  {m?.nome}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </FichaSec>
  );
}

function TabAcesso({ u, onToggleStatus }) {
  return (
    <>
      <FichaSec title="Acesso">
        <FichaRow
          label="Login"
          value={<span style={{ fontFamily: "var(--font-mono)" }}>@{u.login}</span>}
        />
        <FichaRow
          label="Status"
          value={
            u.ativo === false ? (
              <span className="pill pill--err">
                <span className="dot" /> inativo
              </span>
            ) : (
              <span className="pill pill--ok">
                <span className="dot" /> ativo
              </span>
            )
          }
        />
      </FichaSec>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="btn"
          type="button"
          onClick={onToggleStatus}
          style={{ color: u.ativo === false ? "var(--ok)" : "var(--bad)" }}
        >
          {u.ativo === false ? "Reativar usuário" : "Desativar usuário"}
        </button>
      </div>
    </>
  );
}

/* ============================= MODAIS ============================= */

function NovoUsuarioModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: "",
    login: "",
    senha: "",
    role: "ALUNO",
    dataNascimento: "",
    nomeMae: "",
    nomePai: "",
    telefone: "",
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!form.nome.trim() || !form.login.trim() || !form.senha) {
      return setErro("Nome, login e senha são obrigatórios.");
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.dataNascimento) delete payload.dataNascimento;
      await api.post("/usuarios", payload);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const isAluno = form.role === "ALUNO";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Novo usuário</div>
            <div className="modal-title">Cadastrar usuário</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div style={{ gridColumn: "span 2" }}>
              <div className="field">
                <label>Nome completo</label>
                <input
                  className="input"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="field">
              <label>Login</label>
              <input
                className="input"
                value={form.login}
                onChange={(e) => set("login", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Senha</label>
              <input
                type="password"
                className="input"
                value={form.senha}
                onChange={(e) => set("senha", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Perfil</label>
              <select className="select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
                <option value="COORDENACAO">Coordenação</option>
                <option value="DIRECAO">Direção</option>
              </select>
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                className="input"
                value={form.telefone}
                onChange={(e) => set("telefone", e.target.value)}
                placeholder="(11) 98765-4321"
              />
            </div>
            {isAluno && (
              <>
                <div className="field">
                  <label>Nascimento</label>
                  <input
                    type="date"
                    className="input"
                    value={form.dataNascimento}
                    onChange={(e) => set("dataNascimento", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Nome da mãe</label>
                  <input
                    className="input"
                    value={form.nomeMae}
                    onChange={(e) => set("nomeMae", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Nome do pai</label>
                  <input
                    className="input"
                    value={form.nomePai}
                    onChange={(e) => set("nomePai", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          {erro && <div style={{ marginTop: 4, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Criar usuário"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditarUsuarioModal({ u, onClose, onSaved }) {
  const [form, setForm] = useState({
    nome: u.nome || "",
    login: u.login || "",
    role: u.role || "ALUNO",
    dataNascimento: u.dataNascimento || "",
    nomeMae: u.nomeMae || "",
    nomePai: u.nomePai || "",
    telefone: u.telefone || "",
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.dataNascimento) delete payload.dataNascimento;
      await api.put(`/usuarios/${u.id}`, payload);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const isAluno = form.role === "ALUNO";

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Editar usuário</div>
            <div className="modal-title">{u.nome}</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div style={{ gridColumn: "span 2" }}>
              <div className="field">
                <label>Nome completo</label>
                <input
                  className="input"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label>Login</label>
              <input
                className="input"
                value={form.login}
                onChange={(e) => set("login", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Perfil</label>
              <select className="select" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
                <option value="COORDENACAO">Coordenação</option>
                <option value="DIRECAO">Direção</option>
              </select>
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                className="input"
                value={form.telefone}
                onChange={(e) => set("telefone", e.target.value)}
              />
            </div>
            {isAluno && (
              <>
                <div className="field">
                  <label>Nascimento</label>
                  <input
                    type="date"
                    className="input"
                    value={form.dataNascimento}
                    onChange={(e) => set("dataNascimento", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Nome da mãe</label>
                  <input
                    className="input"
                    value={form.nomeMae}
                    onChange={(e) => set("nomeMae", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Nome do pai</label>
                  <input
                    className="input"
                    value={form.nomePai}
                    onChange={(e) => set("nomePai", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          {erro && <div style={{ marginTop: 4, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
