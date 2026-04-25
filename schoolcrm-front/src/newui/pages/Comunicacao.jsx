import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const AVATAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}
function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "—";
}
function fmtDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return String(d); }
}

const DEST_MAP = {
  TODOS:      { label: "Todos",       cor: "#3F6FB0" },
  PROFESSORES:{ label: "Professores", cor: "#2F7F5E" },
  ALUNOS:     { label: "Alunos",      cor: "#B5832A" },
  TURMA:      { label: "Turma",       cor: "#6A4FA6" },
};

export default function Comunicacao() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(null); // { mode: "new" } | { mode: "view", c }

  const load = () => {
    setLoading(true);
    setErro("");
    api
      .get("/comunicados")
      .then((r) => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar comunicados."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((c) =>
      `${c.titulo || ""} ${c.corpo || ""} ${c.remetenteNome || ""}`.toLowerCase().includes(q)
    );
  }, [lista, busca]);

  const excluir = async (id) => {
    try {
      await api.delete(`/comunicados/${id}`);
      load();
    } catch {}
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Comunicação</div>
          <h1 className="page-title">Comunicados</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${filtrada.length} comunicados ativos`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> Novo comunicado
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div style={{ flex: 1, maxWidth: 380 }}>
          <div className="search" style={{ width: "100%", minWidth: 0, background: "var(--panel)" }}>
            <Icon name="search" size={13} />
            <input
              style={{ border: 0, outline: 0, background: "transparent", flex: 1, color: "var(--ink)", fontFamily: "inherit", fontSize: 13 }}
              placeholder="Buscar título, corpo ou remetente…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {!loading && filtrada.length === 0 && (
          <div className="empty">
            <div className="t">Nenhum comunicado</div>
            <div className="s">CLIQUE EM "NOVO COMUNICADO" PARA COMEÇAR</div>
          </div>
        )}
        {filtrada.map((c) => {
          const dest = DEST_MAP[c.destinatarios] || { label: c.destinatarios, cor: "var(--ink-3)" };
          return (
            <div
              key={c.id}
              className="card"
              style={{ padding: 16, cursor: "pointer" }}
              onClick={() => setModal({ mode: "view", c })}
            >
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span
                      className="pill"
                      style={{ background: dest.cor, color: "#fff", fontSize: 10 }}
                    >
                      {dest.label}
                      {c.turmaNome ? ` · ${c.turmaNome}` : ""}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                      {fmtDateTime(c.dataPublicacao)}
                    </span>
                  </div>
                  <div className="strong" style={{ fontSize: 15, marginBottom: 4 }}>{c.titulo}</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {(c.corpo || "").length > 200 ? c.corpo.slice(0, 200) + "…" : c.corpo}
                  </div>
                  {c.remetenteNome && (
                    <div className="row" style={{ gap: 8, marginTop: 10, alignItems: "center" }}>
                      <span className={`avatar sm ${avatarColor(c.remetenteId)}`}>
                        {iniciais(c.remetenteNome)}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.remetenteNome}</span>
                    </div>
                  )}
                </div>
                <button
                  className="icon-btn"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); excluir(c.id); }}
                  style={{ color: "var(--bad)", marginLeft: 12 }}
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal?.mode === "new" && (
        <NovoComunicadoModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {modal?.mode === "view" && (
        <VerComunicadoModal
          c={modal.c}
          onClose={() => setModal(null)}
          onExcluir={() => { excluir(modal.c.id); setModal(null); }}
        />
      )}
    </div>
  );
}

function NovoComunicadoModal({ onClose, onSaved }) {
  const [titulo, setTitulo]           = useState("");
  const [corpo, setCorpo]             = useState("");
  const [destinatarios, setDest]      = useState("TODOS");
  const [turmaId, setTurmaId]         = useState("");
  const [turmas, setTurmas]           = useState([]);
  const [saving, setSaving]           = useState(false);
  const [erro, setErro]               = useState("");

  useEffect(() => {
    api.get("/turmas").then((r) => setTurmas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!titulo.trim()) { setErro("Informe o título."); return; }
    if (destinatarios === "TURMA" && !turmaId) { setErro("Selecione a turma."); return; }
    setSaving(true);
    try {
      const body = { titulo: titulo.trim(), corpo, destinatarios };
      if (destinatarios === "TURMA") body.turmaId = String(turmaId);
      await api.post("/comunicados", body);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 600 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Novo comunicado</div>
            <div className="modal-title">Publicar comunicado</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label>Título</label>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
          </div>

          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>Destinatários</div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {Object.entries(DEST_MAP).map(([id, { label }]) => (
                <button
                  key={id}
                  type="button"
                  className={`chip ${destinatarios === id ? "active" : ""}`}
                  onClick={() => setDest(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {destinatarios === "TURMA" && (
            <div className="field">
              <label>Turma</label>
              <select className="input" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                <option value="">— selecione —</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}{t.serieNome ? ` · ${t.serieNome}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Mensagem</label>
            <textarea
              className="input"
              rows={6}
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              placeholder="Digite o conteúdo do comunicado…"
            />
          </div>

          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "publicando…" : "Publicar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VerComunicadoModal({ c, onClose, onExcluir }) {
  const dest = DEST_MAP[c.destinatarios] || { label: c.destinatarios, cor: "var(--ink-3)" };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 640 }}>
        <div className="modal-header">
          <div>
            <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span className="pill" style={{ background: dest.cor, color: "#fff", fontSize: 10 }}>
                {dest.label}{c.turmaNome ? ` · ${c.turmaNome}` : ""}
              </span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                {fmtDateTime(c.dataPublicacao)}
              </span>
            </div>
            <div className="modal-title">{c.titulo}</div>
            {c.remetenteNome && (
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
                por {c.remetenteNome}
              </div>
            )}
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {c.corpo || "—"}
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn"
            type="button"
            onClick={onExcluir}
            style={{ color: "var(--bad)" }}
          >
            <Icon name="x" size={11} /> Excluir
          </button>
          <button className="btn" type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
