import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

/* ─── helpers ──────────────────────────────────────────────────── */
function fmtPhone(p) {
  if (!p) return "—";
  const d = String(p).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return p;
}

function fmtCpf(cpf) {
  if (!cpf) return "—";
  const d = String(cpf).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return cpf;
}

const TIPO_COLORS = {
  PRINCIPAL:  { bg: "var(--ok)",    color: "#fff" },
  SECUNDARIO: { bg: "var(--accent)", color: "#fff" },
};

const PARENTESCO_OPTS = ["PAI", "MAE", "AVO", "TIO", "RESPONSAVEL", "OUTRO"];
const PARENTESCO_LABEL = {
  PAI: "Pai", MAE: "Mãe", AVO: "Avó/Avô",
  TIO: "Tio/Tia", RESPONSAVEL: "Responsável", OUTRO: "Outro",
};

/* ─── componente principal ─────────────────────────────────────── */
export default function Responsaveis() {
  const [alunos,   setAlunos]   = useState([]);
  const [pessoas,  setPessoas]  = useState([]);  // /fin/pessoas para o select
  const [alunoId,  setAlunoId]  = useState("");
  const [resps,    setResps]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [busca,    setBusca]    = useState("");
  const [msg,      setMsg]      = useState({ t: "", ok: true });

  /* modais */
  const [modalVinc, setModalVinc] = useState(false);
  const [editando,  setEditando]  = useState(null); // { id, tipo, parentesco }
  const [form,      setForm]      = useState({ pessoaId: "", tipo: "PRINCIPAL", parentesco: "PAI" });
  const [salvando,  setSalvando]  = useState(false);

  const flash = (t, ok = true) => {
    setMsg({ t, ok });
    setTimeout(() => setMsg({ t: "", ok: true }), 3500);
  };

  /* ── loaders ─────────────────────────────────────────────────── */
  useEffect(() => {
    api.get("/usuarios", { params: { role: "ALUNO" } })
      .then((r) => setAlunos((Array.isArray(r.data) ? r.data : []).filter((u) => u.ativo !== false)))
      .catch(() => {});
    api.get("/fin/pessoas")
      .then((r) => setPessoas((Array.isArray(r.data) ? r.data : []).filter((p) => p.ativo !== false)))
      .catch(() => {});
  }, []);

  const carregarResps = (id) => {
    if (!id) { setResps([]); return; }
    setLoading(true);
    api.get(`/fin/responsaveis/aluno/${id}`)
      .then((r) => setResps(Array.isArray(r.data) ? r.data : []))
      .catch(() => setResps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregarResps(alunoId); }, [alunoId]);

  /* ── ações ───────────────────────────────────────────────────── */
  const vincular = async () => {
    if (!form.pessoaId || !alunoId) return;
    setSalvando(true);
    try {
      await api.post("/fin/responsaveis", {
        pessoaId: Number(form.pessoaId),
        alunoId:  Number(alunoId),
        tipo:        form.tipo,
        parentesco:  form.parentesco,
      });
      flash("Responsável vinculado!");
      setModalVinc(false);
      carregarResps(alunoId);
    } catch (e) {
      flash(typeof e.response?.data === "string" ? e.response.data : "Erro ao vincular.", false);
    } finally { setSalvando(false); }
  };

  const atualizar = async () => {
    if (!editando) return;
    setSalvando(true);
    try {
      await api.put(`/fin/responsaveis/${editando.id}`, {
        tipo:       editando.tipo,
        parentesco: editando.parentesco,
      });
      flash("Vínculo atualizado!");
      setEditando(null);
      carregarResps(alunoId);
    } catch (e) {
      flash(typeof e.response?.data === "string" ? e.response.data : "Erro ao atualizar.", false);
    } finally { setSalvando(false); }
  };

  const remover = async (id) => {
    if (!window.confirm("Remover este responsável do aluno?")) return;
    try {
      await api.delete(`/fin/responsaveis/${id}`);
      flash("Vínculo removido.");
      carregarResps(alunoId);
    } catch (e) {
      flash(typeof e.response?.data === "string" ? e.response.data : "Erro ao remover.", false);
    }
  };

  /* ── derivados ──────────────────────────────────────────────── */
  const alunosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return alunos;
    return alunos.filter((a) => a.nome?.toLowerCase().includes(q));
  }, [alunos, busca]);

  const alunoSel = alunos.find((a) => String(a.id) === String(alunoId));
  const podeAdicionar = resps.length < 2;

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Pessoas · Vínculos</div>
          <h1 className="page-title">Responsáveis por aluno</h1>
          <div className="page-subtitle">
            Gerencie quem é responsável financeiro de cada aluno (máx. 2 por aluno)
          </div>
        </div>
      </div>

      {/* flash */}
      {msg.t && (
        <div className="card mb-4" style={{ borderColor: msg.ok ? "var(--ok)" : "var(--bad)", padding: "10px 14px" }}>
          <div style={{ color: msg.ok ? "var(--ok)" : "var(--bad)", fontSize: 13 }}>{msg.t}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>

        {/* ── coluna esquerda: lista de alunos ─────────────────── */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
            <div className="search" style={{ background: "var(--bg)", margin: 0 }}>
              <Icon name="search" size={13} />
              <input
                style={{ border: 0, outline: 0, background: "transparent", flex: 1, color: "var(--ink)", fontFamily: "inherit", fontSize: 13 }}
                placeholder="Buscar aluno…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 560 }}>
            {alunosFiltrados.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                Nenhum aluno encontrado.
              </div>
            )}
            {alunosFiltrados.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAlunoId(String(a.id))}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: String(a.id) === alunoId ? "color-mix(in srgb,var(--accent) 10%,var(--panel))" : "none",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: String(a.id) === alunoId ? "var(--accent)" : "var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: String(a.id) === alunoId ? "#fff" : "var(--ink-2)",
                    flexShrink: 0,
                  }}
                >
                  {(a.nome || "?")[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: String(a.id) === alunoId ? "var(--accent)" : "var(--ink)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {a.nome}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                    {a.login || `#${a.id}`}
                  </div>
                </div>
                <Icon name="chev" size={12} style={{ marginLeft: "auto", color: "var(--ink-3)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── coluna direita: responsáveis do aluno ─────────────── */}
        <div>
          {!alunoId ? (
            <div className="card" style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.25 }}>👤</div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", fontWeight: 500 }}>Selecione um aluno</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                Escolha um aluno na lista ao lado para ver e gerenciar seus responsáveis.
              </div>
            </div>
          ) : (
            <>
              {/* header do aluno selecionado */}
              <div className="card mb-4">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="card-eyebrow">Aluno selecionado</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{alunoSel?.nome}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                      {loading ? "carregando…" : `${resps.length} responsável${resps.length !== 1 ? "is" : ""} cadastrado${resps.length !== 1 ? "s" : ""}`}
                    </div>
                  </div>
                  {podeAdicionar && (
                    <button
                      className="btn accent"
                      type="button"
                      onClick={() => {
                        setForm({
                          pessoaId: "",
                          tipo: resps.length === 0 ? "PRINCIPAL" : "SECUNDARIO",
                          parentesco: "PAI",
                        });
                        setModalVinc(true);
                      }}
                    >
                      <Icon name="plus" size={13} /> Vincular responsável
                    </button>
                  )}
                  {!podeAdicionar && (
                    <span className="pill" style={{ fontSize: 11, background: "var(--ok)", color: "#fff" }}>
                      2/2 responsáveis
                    </span>
                  )}
                </div>
              </div>

              {/* cards dos responsáveis */}
              {loading ? (
                <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}>Carregando…</div>
              ) : resps.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.25 }}>🔗</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Nenhum responsável vinculado.</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                    Clique em "Vincular responsável" para adicionar.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {resps.map((r) => (
                    <div key={r.id} className="card">
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        {/* avatar */}
                        <div
                          style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: "var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, fontWeight: 700, color: "var(--ink-2)",
                            flexShrink: 0,
                          }}
                        >
                          {(r.pessoaNome || "?")[0].toUpperCase()}
                        </div>

                        {/* dados */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                              {r.pessoaNome}
                            </span>
                            <span
                              className="pill"
                              style={{ ...(TIPO_COLORS[r.tipo] || {}), fontSize: 10 }}
                            >
                              {r.tipo === "PRINCIPAL" ? "Principal" : "Secundário"}
                            </span>
                            {r.parentesco && (
                              <span className="pill" style={{ fontSize: 10 }}>
                                {PARENTESCO_LABEL[r.parentesco] || r.parentesco}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--ink-2)", flexWrap: "wrap" }}>
                            {r.pessoaCpf && (
                              <span style={{ fontFamily: "var(--font-mono)" }}>
                                CPF {fmtCpf(r.pessoaCpf)}
                              </span>
                            )}
                            {r.pessoaTelefone && (
                              <span>{fmtPhone(r.pessoaTelefone)}</span>
                            )}
                            {r.pessoaEmail && (
                              <span>{r.pessoaEmail}</span>
                            )}
                          </div>
                        </div>

                        {/* ações */}
                        <div className="row" style={{ gap: 6, flexShrink: 0 }}>
                          <button
                            className="btn sm"
                            type="button"
                            onClick={() => setEditando({ id: r.id, tipo: r.tipo, parentesco: r.parentesco || "PAI" })}
                          >
                            <Icon name="edit" size={11} /> Editar
                          </button>
                          <button
                            className="btn sm"
                            type="button"
                            style={{ color: "var(--bad)" }}
                            onClick={() => remover(r.id)}
                          >
                            <Icon name="trash" size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ──────────── modal vincular ──────────── */}
      {modalVinc && (
        <div className="modal-overlay" onClick={() => setModalVinc(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 500 }}>
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Novo vínculo</div>
                <div className="modal-title">Vincular responsável</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  Aluno: <strong>{alunoSel?.nome}</strong>
                </div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setModalVinc(false)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div className="field">
                <label>Pessoa (responsável)</label>
                <select
                  className="input"
                  value={form.pessoaId}
                  onChange={(e) => setForm((f) => ({ ...f, pessoaId: e.target.value }))}
                  autoFocus
                >
                  <option value="">— selecione uma pessoa —</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}{p.cpf ? ` — ${fmtCpf(p.cpf)}` : ""}{p.telefone ? ` — ${fmtPhone(p.telefone)}` : ""}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                  Não encontrou? Cadastre primeiro em{" "}
                  <strong>Pessoas → Pessoas</strong>.
                </div>
              </div>
              <div className="row" style={{ gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select className="input" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="SECUNDARIO">Secundário</option>
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Parentesco</label>
                  <select className="input" value={form.parentesco} onChange={(e) => setForm((f) => ({ ...f, parentesco: e.target.value }))}>
                    {PARENTESCO_OPTS.map((p) => (
                      <option key={p} value={p}>{PARENTESCO_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setModalVinc(false)}>Cancelar</button>
              <button
                className="btn accent"
                type="button"
                disabled={!form.pessoaId || salvando}
                onClick={vincular}
              >
                {salvando ? "salvando…" : "Vincular"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────── modal editar vínculo ──────────── */}
      {editando && (
        <div className="modal-overlay" onClick={() => setEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Editar vínculo</div>
                <div className="modal-title">Alterar tipo e parentesco</div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setEditando(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div className="row" style={{ gap: 12 }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Tipo</label>
                  <select
                    className="input"
                    value={editando.tipo}
                    onChange={(e) => setEditando((ed) => ({ ...ed, tipo: e.target.value }))}
                  >
                    <option value="PRINCIPAL">Principal</option>
                    <option value="SECUNDARIO">Secundário</option>
                  </select>
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Parentesco</label>
                  <select
                    className="input"
                    value={editando.parentesco}
                    onChange={(e) => setEditando((ed) => ({ ...ed, parentesco: e.target.value }))}
                  >
                    {PARENTESCO_OPTS.map((p) => (
                      <option key={p} value={p}>{PARENTESCO_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn accent" type="button" disabled={salvando} onClick={atualizar}>
                {salvando ? "salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
