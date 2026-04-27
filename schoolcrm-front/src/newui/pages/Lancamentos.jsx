import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

const TIPOS = [
  { id: "PROVA",      label: "Prova",       cor: "#3F6FB0" },
  { id: "TRABALHO",   label: "Trabalho",    cor: "#4FAE85" },
  { id: "SIMULADO",   label: "Simulado",    cor: "#B5832A" },
  { id: "RECUPERACAO",label: "Recuperação", cor: "#A8473A" },
];
const BIMESTRES = [1, 2, 3, 4];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function tipoLabel(t) { return TIPOS.find((x) => x.id === t)?.label || t; }
function tipoCor(t)   { return TIPOS.find((x) => x.id === t)?.cor || "var(--ink-3)"; }
function fmtData(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function fmtDataBR(iso) {
  if (!iso) return "";
  const [y, m, da] = iso.split("-");
  return `${da}/${m}/${y}`;
}

/** Transforma vínculos do professor em turmas únicas */
function vinculos2turmas(vArr) {
  const map = new Map();
  vArr.forEach((v) => {
    const t = v.turma;
    if (t?.id && !map.has(t.id))
      map.set(t.id, { id: t.id, nome: t.nome, serieNome: t.serie?.nome || "" });
  });
  return [...map.values()];
}

/* ═══════════════════════════════════════════════════════════════ */
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
  const [dataAula,        setDataAula]        = useState(todayIso);
  const [historico,       setHistorico]       = useState({}); // { "2026-04-26": [{alunoId,presente,...}] }
  const [chamada,         setChamada]         = useState({}); // { [alunoId]: boolean }
  const [salvandoChamada, setSalvandoChamada] = useState(false);
  const [msgChamada,      setMsgChamada]      = useState(null); // { tipo: "ok"|"err", txt }

  /* ── carrega turmas + matérias (modo depende do role) ── */
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

  /* ── carrega alunos quando turma muda ── */
  const loadAlunos = useCallback(() => {
    if (!turmaId) return;
    api
      .get(`/vinculos/aluno-turma/turma/${turmaId}`)
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : [];
        const lista = raw
          .map((at) => ({
            id: at.aluno?.id || at.alunoId,
            nome: at.aluno?.nome || at.alunoNome,
          }))
          .filter((a) => a.id)
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setAlunos(lista);
      })
      .catch(() => setAlunos([]));
  }, [turmaId]);

  useEffect(() => { loadAlunos(); }, [loadAlunos]);

  /* ── carrega avaliações ── */
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

  /* ── carrega histórico de presenças quando turma/matéria muda ── */
  const loadHistorico = useCallback(() => {
    if (!turmaId || !materiaId) { setHistorico({}); return; }
    api
      .get(`/presencas/turma/${turmaId}/materia/${materiaId}`)
      .then((r) => setHistorico(typeof r.data === "object" && r.data !== null ? r.data : {}))
      .catch(() => setHistorico({}));
  }, [turmaId, materiaId]);

  useEffect(() => { loadHistorico(); }, [loadHistorico]);

  /* ── preenche chamada a partir do histórico / padrão todos presentes ── */
  useEffect(() => {
    if (!alunos.length) return;
    const registros = historico[dataAula] || [];
    const init = {};
    alunos.forEach((a) => { init[a.id] = true; }); // default = presente
    registros.forEach((r) => { init[r.alunoId] = r.presente; });
    setChamada(init);
  }, [dataAula, historico, alunos]);

  /* ── salvar chamada ── */
  const salvarChamada = async () => {
    if (!turmaId || !materiaId || !dataAula || !alunos.length) return;
    setSalvandoChamada(true);
    setMsgChamada(null);
    let erros = 0;
    for (const aluno of alunos) {
      try {
        await api.post("/presencas/lancar", {
          alunoId:   String(aluno.id),
          turmaId:   String(turmaId),
          materiaId: String(materiaId),
          presente:  String(chamada[aluno.id] ?? true),
          data:      dataAula,
        });
      } catch { erros++; }
    }
    setSalvandoChamada(false);
    setMsgChamada(
      erros > 0
        ? { tipo: "err", txt: `${erros} erro(s) ao salvar chamada.` }
        : { tipo: "ok",  txt: `Chamada de ${fmtDataBR(dataAula)} salva!` }
    );
    loadHistorico();
    setTimeout(() => setMsgChamada(null), 4000);
  };

  /* ── helpers de display ── */
  const avaliacoesFiltradas = useMemo(
    () => avaliacoes.filter((a) => a.bimestre === bimestre),
    [avaliacoes, bimestre]
  );
  const turmaAtual   = turmas.find((t) => String(t.id) === String(turmaId));
  const materiaAtual = materias.find((m) => String(m.id) === String(materiaId));
  const v            = materiaAtual ? visual(materiaAtual.nome) : null;

  /* ── datas com chamada registrada (para o histórico) ── */
  const datasComChamada = useMemo(
    () => Object.keys(historico).sort().reverse(),
    [historico]
  );
  const totalFaltasHoje = useMemo(
    () => alunos.filter((a) => chamada[a.id] === false).length,
    [alunos, chamada]
  );

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="page">
      {/* ── Cabeçalho ── */}
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
              disabled={!turmaId || !materiaId || !alunos.length || salvandoChamada}
              onClick={salvarChamada}
            >
              <Icon name="check" size={13} />
              {salvandoChamada ? "Salvando…" : "Salvar chamada"}
            </button>
          )}
        </div>
      </div>

      {/* ── Abas ── */}
      <div className="filter-row" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 0, marginBottom: 0 }}>
        {["avaliacoes", "chamada"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 4px",
              fontSize: 13,
              fontWeight: 600,
              color: aba === id ? "var(--accent)" : "var(--ink-3)",
              borderBottom: aba === id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
              fontFamily: "inherit",
              transition: "color .12s",
            }}
          >
            {id === "avaliacoes" ? "Avaliações & notas" : "Chamada / Frequência"}
          </button>
        ))}
      </div>

      {/* ── Filtros comuns: turma + matéria ── */}
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

        {/* bimestre só aparece na aba de avaliações */}
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

        {/* data só aparece na aba de chamada */}
        {aba === "chamada" && (
          <div className="field">
            <label>Data da aula</label>
            <input
              className="input"
              type="date"
              value={dataAula}
              onChange={(e) => setDataAula(e.target.value)}
              style={{ width: 160 }}
            />
          </div>
        )}
      </div>

      {/* ══════════ ABA AVALIAÇÕES ══════════ */}
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

      {/* ══════════ ABA CHAMADA ══════════ */}
      {aba === "chamada" && (
        <>
          {/* feedback */}
          {msgChamada && (
            <div
              className="card"
              style={{
                borderColor: msgChamada.tipo === "ok" ? "var(--ok)" : "var(--bad)",
                marginBottom: 12,
                padding: "10px 16px",
              }}
            >
              <div style={{ color: msgChamada.tipo === "ok" ? "var(--ok)" : "var(--bad)", fontSize: 13, fontWeight: 600 }}>
                {msgChamada.txt}
              </div>
            </div>
          )}

          {!turmaId || !materiaId ? (
            <div className="empty">
              <div className="t">Selecione turma e matéria</div>
              <div className="s">PARA REGISTRAR A CHAMADA</div>
            </div>
          ) : alunos.length === 0 ? (
            <div className="empty">
              <div className="t">Nenhum aluno nesta turma</div>
              <div className="s">VERIFIQUE OS VÍNCULOS NA SEÇÃO PESSOAS</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

              {/* Lista de chamada */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* barra de resumo */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg)",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                      {alunos.length} aluno{alunos.length !== 1 ? "s" : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>
                      ✓ {alunos.length - totalFaltasHoje} presentes
                    </span>
                    {totalFaltasHoje > 0 && (
                      <span style={{ fontSize: 12, color: "var(--bad)", fontWeight: 600 }}>
                        ✗ {totalFaltasHoje} falta{totalFaltasHoje !== 1 ? "s" : ""}
                      </span>
                    )}
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

                {/* linhas por aluno */}
                {alunos.map((a, i) => {
                  const presente = chamada[a.id] ?? true;
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "10px 16px",
                        borderBottom: i < alunos.length - 1 ? "1px solid var(--border)" : "none",
                        background: presente ? "transparent" : "color-mix(in srgb, var(--bad) 5%, var(--panel))",
                        transition: "background .15s",
                      }}
                    >
                      {/* avatar */}
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          background: presente
                            ? "color-mix(in srgb, var(--ok) 15%, var(--panel))"
                            : "color-mix(in srgb, var(--bad) 15%, var(--panel))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700,
                          color: presente ? "var(--ok)" : "var(--bad)",
                        }}
                      >
                        {(a.nome || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </div>

                      {/* nome */}
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        {a.nome}
                      </div>

                      {/* toggle presente/ausente */}
                      <button
                        type="button"
                        onClick={() =>
                          setChamada((prev) => ({ ...prev, [a.id]: !prev[a.id] }))
                        }
                        style={{
                          padding: "5px 14px",
                          borderRadius: 20,
                          border: "1.5px solid",
                          borderColor: presente ? "var(--ok)" : "var(--bad)",
                          background: presente
                            ? "color-mix(in srgb, var(--ok) 10%, var(--panel))"
                            : "color-mix(in srgb, var(--bad) 10%, var(--panel))",
                          color: presente ? "var(--ok)" : "var(--bad)",
                          fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                          transition: "all .12s",
                          minWidth: 90, textAlign: "center",
                        }}
                      >
                        {presente ? "✓ Presente" : "✗ Falta"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Histórico de chamadas */}
              {datasComChamada.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 700, fontSize: 12,
                      color: "var(--ink-3)", letterSpacing: ".06em", textTransform: "uppercase",
                    }}
                  >
                    Histórico de chamadas ({datasComChamada.length})
                  </div>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {datasComChamada.map((data) => {
                      const regs      = historico[data] || [];
                      const presentes = regs.filter((r) => r.presente).length;
                      const total     = regs.length;
                      const isSel     = data === dataAula;
                      return (
                        <button
                          key={data}
                          type="button"
                          onClick={() => setDataAula(data)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            width: "100%", padding: "9px 16px",
                            background: isSel
                              ? "color-mix(in srgb,var(--accent) 8%,var(--panel))"
                              : "none",
                            border: "none",
                            borderBottom: "1px solid var(--border)",
                            cursor: "pointer", fontFamily: "inherit",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                              color: isSel ? "var(--accent)" : "var(--ink-2)",
                              minWidth: 80,
                            }}
                          >
                            {fmtDataBR(data)}
                          </div>
                          <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--ok)", fontWeight: 600 }}>
                              {presentes}P
                            </span>
                            {total - presentes > 0 && (
                              <span style={{ fontSize: 11, color: "var(--bad)", fontWeight: 600 }}>
                                {total - presentes}F
                              </span>
                            )}
                          </div>
                          {isSel && (
                            <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>
                              EDITANDO
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modais avaliações ── */}
      {modal?.mode === "new" && (
        <NovaAvaliacaoModal
          turmaId={turmaId}
          materiaId={materiaId}
          bimestre={bimestre}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadAvaliacoes(); }}
        />
      )}
      {modal?.mode === "lancar" && (
        <LancarNotasModal
          avaliacao={modal.a}
          alunos={alunos}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadAvaliacoes(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════ */
function LancarNotasModal({ avaliacao, alunos, onClose, onSaved }) {
  const [valores,   setValores]   = useState({});
  const [saving,    setSaving]    = useState(false);
  const [erro,      setErro]      = useState("");
  const [salvosOk,  setSalvosOk]  = useState(0);

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
