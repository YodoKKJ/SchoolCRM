import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

/* ── constantes ── */
const TIPOS = [
  { id: "PROVA",       label: "Prova",        cor: "#3F6FB0" },
  { id: "TRABALHO",    label: "Trabalho",     cor: "#4FAE85" },
  { id: "SIMULADO",    label: "Simulado",     cor: "#B5832A" },
  { id: "RECUPERACAO", label: "Recuperação",  cor: "#A8473A" },
];
const BIMESTRES = [1, 2, 3, 4];
const DIAS_PT   = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

/* ── helpers ── */
function todayIso() { return new Date().toISOString().slice(0, 10); }
function tipoLabel(t) { return TIPOS.find((x) => x.id === t)?.label || t; }
function tipoCor(t)   { return TIPOS.find((x) => x.id === t)?.cor   || "var(--ink-3)"; }
function fmtData(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function fmtDataBR(iso) {
  if (!iso) return "";
  const [y, m, da] = iso.split("-");
  return `${da}/${m}/${y}`;
}
function diaSemana(iso) {
  try { return DIAS_PT[new Date(iso + "T12:00").getDay()]; } catch { return ""; }
}
function iniciais(nome = "") {
  return nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

/** Vínculos do professor → turmas únicas */
function vinculos2turmas(vArr) {
  const map = new Map();
  vArr.forEach((v) => {
    const t = v.turma;
    if (t?.id && !map.has(t.id))
      map.set(t.id, { id: t.id, nome: t.nome, serieNome: t.serie?.nome || "" });
  });
  return [...map.values()];
}

/* ════════════════════════════════════════════════════════════════
   Componente principal
   ════════════════════════════════════════════════════════════════ */
export default function Lancamentos() {
  const role   = localStorage.getItem("role");
  const isProf = role === "PROFESSOR";

  /* ── seleção ── */
  const [aba,       setAba]       = useState("avaliacoes"); // "avaliacoes" | "chamada"
  const [vinculos,  setVinculos]  = useState([]);
  const [turmas,    setTurmas]    = useState([]);
  const [materias,  setMaterias]  = useState([]);
  const [turmaId,   setTurmaId]   = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [bimestre,  setBimestre]  = useState(1);
  const [alunos,    setAlunos]    = useState([]);

  /* ── avaliações ── */
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [erro,       setErro]       = useState("");
  const [modal,      setModal]      = useState(null);

  /* ── chamada ── */
  const [historico,    setHistorico]    = useState({}); // { "2026-04-26": [{ alunoId, alunoNome, presente, ordemAula },...] }
  const [aulaModal,    setAulaModal]    = useState(null); // null | { data, ordemAula, registros }

  /* ── carrega turmas + matérias ── */
  useEffect(() => {
    if (isProf) {
      api.get("/vinculos/professor-turma-materia/minhas")
        .then((r) => {
          const vArr = Array.isArray(r.data) ? r.data : [];
          setVinculos(vArr);
          const ts = vinculos2turmas(vArr);
          setTurmas(ts);
          if (ts.length) setTurmaId(String(ts[0].id));
        })
        .catch(() => {});
    } else {
      Promise.all([
        api.get("/turmas").catch(() => ({ data: [] })),
        api.get("/materias").catch(() => ({ data: [] })),
      ]).then(([t, m]) => {
        const ts = Array.isArray(t.data) ? t.data : [];
        setTurmas(ts);
        setMaterias(Array.isArray(m.data) ? m.data : []);
        if (ts.length && !turmaId) setTurmaId(String(ts[0].id));
      });
    }
  }, []);

  /* ── professor: matérias da turma selecionada ── */
  useEffect(() => {
    if (!isProf || !turmaId) return;
    const mats = vinculos
      .filter((v) => String(v.turma?.id) === String(turmaId))
      .map((v) => v.materia)
      .filter(Boolean)
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
    setMaterias(mats);
    setMateriaId(mats.length === 1 ? String(mats[0].id) : "");
  }, [isProf, turmaId, vinculos]);

  /* ── alunos da turma ── */
  const loadAlunos = useCallback(() => {
    if (!turmaId) return;
    api
      .get(`/vinculos/aluno-turma/turma/${turmaId}`)
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : [];
        setAlunos(
          raw
            .map((at) => ({ id: at.aluno?.id || at.alunoId, nome: at.aluno?.nome || at.alunoNome }))
            .filter((a) => a.id)
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
        );
      })
      .catch(() => setAlunos([]));
  }, [turmaId]);

  useEffect(() => { loadAlunos(); }, [loadAlunos]);

  /* ── avaliações ── */
  const loadAvaliacoes = useCallback(() => {
    if (!turmaId || !materiaId) { setAvaliacoes([]); return; }
    setLoading(true);
    setErro("");
    api
      .get(`/notas/avaliacoes?turmaId=${turmaId}&materiaId=${materiaId}`)
      .then((r) => setAvaliacoes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar avaliações."))
      .finally(() => setLoading(false));
  }, [turmaId, materiaId]);

  useEffect(() => { loadAvaliacoes(); }, [loadAvaliacoes]);

  /* ── histórico de presenças ── */
  const loadHistorico = useCallback(() => {
    if (!turmaId || !materiaId) { setHistorico({}); return; }
    api
      .get(`/presencas/turma/${turmaId}/materia/${materiaId}`)
      .then((r) => setHistorico(typeof r.data === "object" && r.data ? r.data : {}))
      .catch(() => setHistorico({}));
  }, [turmaId, materiaId]);

  useEffect(() => { loadHistorico(); }, [loadHistorico]);

  /* ── helpers de display ── */
  const avaliacoesFiltradas = useMemo(
    () => avaliacoes.filter((a) => a.bimestre === bimestre),
    [avaliacoes, bimestre]
  );
  const turmaAtual   = turmas.find((t) => String(t.id) === String(turmaId));
  const materiaAtual = materias.find((m) => String(m.id) === String(materiaId));
  const v            = materiaAtual ? visual(materiaAtual.nome) : null;

  /* ── aulas: agrupa por (data, ordemAula) — permite múltiplas por dia ── */
  const aulas = useMemo(() => {
    const list = [];
    Object.entries(historico).forEach(([data, regs]) => {
      // agrupa por ordemAula (null → chave especial "null")
      const byOrdem = new Map();
      regs.forEach((r) => {
        const key = r.ordemAula ?? null;
        if (!byOrdem.has(key)) byOrdem.set(key, []);
        byOrdem.get(key).push(r);
      });
      byOrdem.forEach((aulaRegs, ordemAula) => {
        list.push({
          data,
          ordemAula,
          presentes: aulaRegs.filter((r) => r.presente).length,
          faltas:    aulaRegs.filter((r) => !r.presente).length,
          total:     aulaRegs.length,
          registros: aulaRegs,
        });
      });
    });
    // ordena: data desc, depois ordemAula asc
    return list.sort((a, b) => {
      const dc = b.data.localeCompare(a.data);
      if (dc !== 0) return dc;
      return (a.ordemAula ?? 0) - (b.ordemAula ?? 0);
    });
  }, [historico]);

  /* ── abre modal para nova aula ── */
  const novaAula = () => {
    setAulaModal({ data: todayIso(), ordemAula: null, registros: [] });
  };

  /* ── abre modal para editar aula existente ── */
  const editarAula = (aula) => {
    setAulaModal({ data: aula.data, ordemAula: aula.ordemAula, registros: aula.registros });
  };

  /* ── callback após salvar aula ── */
  const onAulaSalva = () => {
    setAulaModal(null);
    loadHistorico();
  };

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="page">
      {/* cabeçalho */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Lançamentos</div>
          <h1 className="page-title">
            {aba === "chamada" ? "Chamada / Frequência" : "Avaliações & notas"}
          </h1>
          <div className="page-subtitle">
            {turmaAtual && materiaAtual
              ? `${turmaAtual.nome} · ${materiaAtual.nome}${aba === "avaliacoes" ? ` · ${bimestre}º bim` : ""}`
              : "selecione turma e matéria"}
          </div>
        </div>
        <div className="row">
          {aba === "avaliacoes" ? (
            <button
              className="btn accent"
              type="button"
              disabled={!turmaId || !materiaId}
              onClick={() => setModal({ mode: "new" })}
            >
              <Icon name="plus" size={13} /> Nova avaliação
            </button>
          ) : (
            <button
              className="btn accent"
              type="button"
              disabled={!turmaId || !materiaId || !alunos.length}
              onClick={novaAula}
            >
              <Icon name="plus" size={13} /> Nova aula
            </button>
          )}
        </div>
      </div>

      {/* abas */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
        {[
          { id: "avaliacoes", label: "Avaliações & notas" },
          { id: "chamada",    label: "Chamada / Frequência" },
        ].map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 16px", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              color: aba === a.id ? "var(--accent)" : "var(--ink-3)",
              borderBottom: aba === a.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1, transition: "color .12s",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* filtros: turma + matéria + bimestre/vazio */}
      <div className="filter-row" style={{ marginTop: 16 }}>
        <div className="field" style={{ minWidth: 200 }}>
          <label>Turma</label>
          <select className="input" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">— turma —</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}{t.serieNome ? ` · ${t.serieNome}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 200 }}>
          <label>Matéria</label>
          <select className="input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            <option value="">— matéria —</option>
            {materias.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        {aba === "avaliacoes" && (
          <div className="row" style={{ gap: 6 }}>
            {BIMESTRES.map((b) => (
              <button
                key={b}
                type="button"
                className={`chip ${bimestre === b ? "active" : ""}`}
                onClick={() => setBimestre(b)}
              >
                {b}º bim
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════ ABA AVALIAÇÕES ══════ */}
      {aba === "avaliacoes" && (
        <>
          {erro && (
            <div className="card" style={{ borderColor: "var(--bad)", marginBottom: 12 }}>
              <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
            </div>
          )}
          {!turmaId || !materiaId ? (
            <div className="empty">
              <div className="t">Selecione turma e matéria</div>
              <div className="s">PARA VER E LANÇAR AVALIAÇÕES</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Tipo</th>
                    <th>Descrição</th>
                    <th style={{ width: 110 }}>Data</th>
                    <th style={{ width: 60 }}>Peso</th>
                    <th style={{ width: 100 }}>Notas</th>
                    <th style={{ width: 110, textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && avaliacoesFiltradas.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                        Nenhuma avaliação no {bimestre}º bimestre.
                      </td>
                    </tr>
                  )}
                  {avaliacoesFiltradas.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="pill" style={{ background: tipoCor(a.tipo), color: "#fff", fontSize: 10 }}>
                          {tipoLabel(a.tipo)}
                        </span>
                      </td>
                      <td>
                        <span className="strong">{a.descricao || "—"}</span>
                        {v && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{materiaAtual?.nome}</div>}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtData(a.dataAplicacao)}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{a.peso}</td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          <strong>{a.notas?.length || 0}</strong>
                          <span style={{ color: "var(--ink-3)" }}> / {alunos.length}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn sm" type="button" onClick={() => setModal({ mode: "lancar", a })}>
                          <Icon name="edit" size={11} /> Lançar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════ ABA CHAMADA ══════ */}
      {aba === "chamada" && (
        <>
          {!turmaId || !materiaId ? (
            <div className="empty">
              <div className="t">Selecione turma e matéria</div>
              <div className="s">PARA REGISTRAR CHAMADAS</div>
            </div>
          ) : aulas.length === 0 ? (
            <div className="empty">
              <div className="t">Nenhuma aula registrada</div>
              <div className="s">CLIQUE EM "NOVA AULA" PARA COMEÇAR</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* header da lista */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", borderBottom: "1px solid var(--border)",
                  background: "var(--bg)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", letterSpacing: ".08em", textTransform: "uppercase" }}>
                  {aulas.length} aula{aulas.length !== 1 ? "s" : ""} registrada{aulas.length !== 1 ? "s" : ""}
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  Total de frequência: {
                    (() => {
                      const tot = aulas.reduce((s, a) => s + a.total, 0);
                      const pre = aulas.reduce((s, a) => s + a.presentes, 0);
                      return tot > 0 ? `${((pre / tot) * 100).toFixed(0)}%` : "—";
                    })()
                  }
                </span>
              </div>

              {/* linhas de aulas */}
              {aulas.map((aula, i) => {
                const pct = aula.total > 0 ? Math.round((aula.presentes / aula.total) * 100) : null;
                const cor = pct == null ? "var(--ink-3)" : pct >= 75 ? "var(--ok)" : pct >= 60 ? "var(--warn)" : "var(--bad)";
                const aulasNoDia = aulas.filter((a) => a.data === aula.data);
                const idxNoDia   = aulasNoDia.findIndex((a) => a.ordemAula === aula.ordemAula) + 1;
                const mostraIdx  = aulasNoDia.length > 1;
                return (
                  <div
                    key={`${aula.data}-${aula.ordemAula ?? "leg"}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 16px",
                      borderBottom: i < aulas.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {/* data */}
                    <div style={{ minWidth: 90 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", fontFamily: "var(--font-mono)" }}>
                        {fmtDataBR(aula.data)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {diaSemana(aula.data)}
                        {mostraIdx && (
                          <span style={{ marginLeft: 4, color: "var(--accent)", fontWeight: 700 }}>
                            · {idxNoDia}ª aula
                          </span>
                        )}
                      </div>
                    </div>

                    {/* badges */}
                    <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center", flexWrap: "wrap" }}>
                      <span className="pill" style={{ background: "color-mix(in srgb,var(--ok) 12%,var(--panel))", color: "var(--ok)", fontSize: 11, fontWeight: 700 }}>
                        ✓ {aula.presentes} presente{aula.presentes !== 1 ? "s" : ""}
                      </span>
                      {aula.faltas > 0 && (
                        <span className="pill" style={{ background: "color-mix(in srgb,var(--bad) 12%,var(--panel))", color: "var(--bad)", fontSize: 11, fontWeight: 700 }}>
                          ✗ {aula.faltas} falta{aula.faltas !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* percentual */}
                    {pct != null && (
                      <div style={{ fontSize: 15, fontWeight: 700, color: cor, minWidth: 40, textAlign: "right" }}>
                        {pct}%
                      </div>
                    )}

                    {/* editar */}
                    <button
                      className="btn sm"
                      type="button"
                      onClick={() => editarAula(aula)}
                    >
                      <Icon name="edit" size={11} /> Editar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modais avaliações ── */}
      {modal?.mode === "new" && (
        <NovaAvaliacaoModal
          turmaId={turmaId} materiaId={materiaId} bimestre={bimestre}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadAvaliacoes(); }}
        />
      )}
      {modal?.mode === "lancar" && (
        <LancarNotasModal
          avaliacao={modal.a} alunos={alunos}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadAvaliacoes(); }}
        />
      )}

      {/* ── Modal de aula (chamada) ── */}
      {aulaModal && (
        <AulaModal
          turmaId={turmaId}
          materiaId={materiaId}
          alunos={alunos}
          data={aulaModal.data}
          ordemAula={aulaModal.ordemAula}
          todasAulas={aulas}
          registrosExistentes={aulaModal.registros}
          onClose={() => setAulaModal(null)}
          onSaved={onAulaSalva}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Modal de Aula — cria nova aula ou edita existente
   ════════════════════════════════════════════════════════════════ */
function AulaModal({ turmaId, materiaId, alunos, data: dataInicial, ordemAula: ordemAulaInicial, todasAulas, registrosExistentes, onClose, onSaved }) {
  const [data,     setData]     = useState(dataInicial || todayIso());
  const [chamada,  setChamada]  = useState(() => {
    const init = {};
    alunos.forEach((a) => { init[a.id] = true; }); // padrão: todos presentes
    registrosExistentes.forEach((r) => { init[r.alunoId] = Boolean(r.presente); });
    return init;
  });
  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState("");

  const isEdicao    = registrosExistentes.length > 0;
  const totalFaltas = alunos.filter((a) => chamada[a.id] === false).length;

  const salvar = async () => {
    if (!data || !alunos.length) return;
    setSalvando(true);
    setErro("");

    // Nova aula: calcula próximo ordemAula para esta data
    let ordemAula = ordemAulaInicial;
    if (!isEdicao) {
      const aulasNaData = (todasAulas || []).filter((a) => a.data === data);
      const maxOrdem    = aulasNaData.reduce((mx, a) => Math.max(mx, a.ordemAula ?? 0), 0);
      ordemAula = maxOrdem + 1;
    }

    let erros = 0;
    for (const aluno of alunos) {
      try {
        await api.post("/presencas/lancar", {
          alunoId:   String(aluno.id),
          turmaId:   String(turmaId),
          materiaId: String(materiaId),
          presente:  String(chamada[aluno.id] ?? true),
          data,
          ordemAula: String(ordemAula),
        });
      } catch { erros++; }
    }
    setSalvando(false);
    if (erros > 0) {
      setErro(`${erros} erro(s) ao salvar. Tente novamente.`);
    } else {
      onSaved();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 540, maxHeight: "85vh", display: "flex", flexDirection: "column" }}
      >
        {/* header */}
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{isEdicao ? "Editar chamada" : "Nova aula"}</div>
            <div className="modal-title">Registro de presença</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
              {alunos.length} aluno{alunos.length !== 1 ? "s" : ""}
              {" · "}
              <span style={{ color: "var(--ok)", fontWeight: 600 }}>
                {alunos.length - totalFaltas} presentes
              </span>
              {totalFaltas > 0 && (
                <>
                  {" · "}
                  <span style={{ color: "var(--bad)", fontWeight: 600 }}>
                    {totalFaltas} falta{totalFaltas !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        {/* data + ações rápidas */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Data da aula</label>
            <input
              className="input"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{ width: 160 }}
            />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn sm"
              onClick={() => {
                const todos = {};
                alunos.forEach((a) => { todos[a.id] = true; });
                setChamada(todos);
              }}
            >
              Todos presentes
            </button>
            <button
              type="button"
              className="btn sm"
              onClick={() => {
                const todos = {};
                alunos.forEach((a) => { todos[a.id] = false; });
                setChamada(todos);
              }}
            >
              Todos ausentes
            </button>
          </div>
        </div>

        {/* lista de alunos */}
        <div className="modal-body" style={{ overflow: "auto", padding: 0 }}>
          {alunos.map((a, i) => {
            const presente = chamada[a.id] ?? true;
            return (
              <div
                key={a.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 20px",
                  borderBottom: i < alunos.length - 1 ? "1px solid var(--border)" : "none",
                  background: presente
                    ? "transparent"
                    : "color-mix(in srgb, var(--bad) 4%, var(--panel))",
                  transition: "background .12s",
                }}
              >
                {/* avatar */}
                <div
                  style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: presente
                      ? "color-mix(in srgb, var(--ok) 14%, var(--panel))"
                      : "color-mix(in srgb, var(--bad) 14%, var(--panel))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: presente ? "var(--ok)" : "var(--bad)",
                  }}
                >
                  {iniciais(a.nome)}
                </div>

                {/* nome */}
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  {a.nome}
                </div>

                {/* toggle */}
                <button
                  type="button"
                  onClick={() => setChamada((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                  style={{
                    padding: "5px 14px", borderRadius: 20, cursor: "pointer",
                    border: "1.5px solid",
                    borderColor: presente ? "var(--ok)" : "var(--bad)",
                    background: presente
                      ? "color-mix(in srgb, var(--ok) 10%, var(--panel))"
                      : "color-mix(in srgb, var(--bad) 10%, var(--panel))",
                    color: presente ? "var(--ok)" : "var(--bad)",
                    fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                    transition: "all .12s", minWidth: 90, textAlign: "center",
                  }}
                >
                  {presente ? "✓ Presente" : "✗ Falta"}
                </button>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="modal-footer">
          {erro && <div style={{ color: "var(--bad)", fontSize: 12, flex: 1 }}>{erro}</div>}
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button
            className="btn accent"
            type="button"
            onClick={salvar}
            disabled={salvando || !data}
          >
            {salvando ? "Salvando…" : isEdicao ? "Salvar alterações" : "Registrar aula"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Modal Nova Avaliação
   ════════════════════════════════════════════════════════════════ */
function NovaAvaliacaoModal({ turmaId, materiaId, bimestre, onClose, onSaved }) {
  const [tipo,          setTipo]          = useState("PROVA");
  const [descricao,     setDescricao]     = useState("");
  const [peso,          setPeso]          = useState("1.0");
  const [dataAplicacao, setDataAplicacao] = useState(new Date().toISOString().slice(0, 10));
  const [saving,        setSaving]        = useState(false);
  const [erro,          setErro]          = useState("");

  const isPesoEditavel = tipo !== "SIMULADO" && tipo !== "RECUPERACAO";

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      await api.post("/notas/avaliacao", {
        turmaId:      String(turmaId),
        materiaId:    String(materiaId),
        tipo,
        descricao,
        peso:         isPesoEditavel ? peso : "1.0",
        dataAplicacao,
        bimestre:     String(bimestre),
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 520 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{bimestre}º bimestre</div>
            <div className="modal-title">Nova avaliação</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>Tipo</div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {TIPOS.map((t) => (
                <button key={t.id} type="button" className={`chip ${tipo === t.id ? "active" : ""}`}
                  onClick={() => setTipo(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Descrição</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="ex: P1 — Equações de 1º grau" autoFocus />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Data</label>
              <input className="input" type="date" value={dataAplicacao}
                onChange={(e) => setDataAplicacao(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Peso {!isPesoEditavel && "(fixo)"}</label>
              <input className="input" type="number" step="0.1" min="0.1" max="10"
                value={isPesoEditavel ? peso : "1.0"}
                onChange={(e) => setPeso(e.target.value)}
                disabled={!isPesoEditavel} />
            </div>
          </div>
          {tipo === "SIMULADO" && (
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              Simulados são bonificações: nota de 0.0 a 1.0 somada à média.
            </div>
          )}
          {tipo === "RECUPERACAO" && (
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              Recuperação substitui a média do bimestre se for maior.
            </div>
          )}
          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Criar avaliação"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Modal Lançar Notas
   ════════════════════════════════════════════════════════════════ */
function LancarNotasModal({ avaliacao, alunos, onClose, onSaved }) {
  const [valores,  setValores]  = useState({});
  const [saving,   setSaving]   = useState(false);
  const [erro,     setErro]     = useState("");
  const [salvosOk, setSalvosOk] = useState(0);

  useEffect(() => {
    const inicial = {};
    for (const n of avaliacao.notas || []) inicial[n.alunoId] = String(n.valor);
    setValores(inicial);
  }, [avaliacao]);

  const set = (alunoId, val) => setValores((s) => ({ ...s, [alunoId]: val }));

  const lancarTodos = async () => {
    setErro("");
    setSaving(true);
    setSalvosOk(0);
    let ok = 0, fail = 0;
    for (const aluno of alunos) {
      const raw = valores[aluno.id];
      if (raw === undefined || raw === null || String(raw).trim() === "") continue;
      try {
        await api.post("/notas/lancar", {
          avaliacaoId: String(avaliacao.id),
          alunoId:     String(aluno.id),
          valor:       String(raw).replace(",", "."),
        });
        ok++;
      } catch { fail++; }
      setSalvosOk(ok);
    }
    setSaving(false);
    if (fail === 0) onSaved();
    else setErro(`${ok} lançadas, ${fail} falharam.`);
  };

  const isSimulado = avaliacao.tipo === "SIMULADO";
  const max = isSimulado ? 1 : 10;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}
        style={{ width: 600, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{tipoLabel(avaliacao.tipo)} · {avaliacao.bimestre}º bim</div>
            <div className="modal-title">{avaliacao.descricao || "Lançar notas"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              Notas de 0 a {max}{isSimulado ? " (bonificação)" : ""}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ overflow: "auto" }}>
          <table className="table" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Aluno</th>
                <th style={{ width: 120, textAlign: "right" }}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: 30, textAlign: "center", color: "var(--ink-3)" }}>
                    Nenhum aluno vinculado à turma.
                  </td>
                </tr>
              )}
              {alunos.map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}</td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      className="input"
                      type="number" min="0" max={max} step="0.1"
                      value={valores[a.id] ?? ""}
                      onChange={(e) => set(a.id, e.target.value)}
                      style={{ width: 80, textAlign: "right" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {erro && <div style={{ marginTop: 12, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Fechar</button>
          <button className="btn accent" type="button" onClick={lancarTodos} disabled={saving}>
            {saving ? `salvando ${salvosOk}/${alunos.length}…` : "Lançar notas"}
          </button>
        </div>
      </div>
    </div>
  );
}
