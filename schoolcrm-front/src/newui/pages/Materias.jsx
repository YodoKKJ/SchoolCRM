import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

export default function Materias() {
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState([]);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(null); // { mode: "new" } | { mode: "confirm-del", m }

  const load = () => {
    setLoading(true);
    setErro("");
    api
      .get("/materias")
      .then((r) => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Não foi possível carregar as matérias."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((m) => (m.nome || "").toLowerCase().includes(q));
  }, [lista, busca]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Matérias</div>
          <h1 className="page-title">Componentes curriculares</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${lista.length} matérias cadastradas`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> Nova matéria
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div className="search" style={{ width: "100%", minWidth: 0, background: "var(--panel)" }}>
            <Icon name="search" size={13} />
            <input
              style={{
                border: 0,
                outline: 0,
                background: "transparent",
                flex: 1,
                color: "var(--ink)",
                fontFamily: "inherit",
                fontSize: 13,
              }}
              placeholder="Buscar matéria…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Sigla</th>
              <th>Nome</th>
              <th style={{ width: 140, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={3} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  {busca ? "Nenhuma matéria bate com a busca." : "Nenhuma matéria cadastrada."}
                </td>
              </tr>
            )}
            {filtered.map((m) => {
              const v = visual(m.nome);
              return (
                <tr key={m.id}>
                  <td>
                    <span
                      style={{
                        display: "inline-grid",
                        placeItems: "center",
                        width: 30,
                        height: 30,
                        borderRadius: 4,
                        background: v.cor,
                        color: "white",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {v.sigla}
                    </span>
                  </td>
                  <td>
                    <span className="strong">{m.nome}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn sm"
                      type="button"
                      style={{ color: "var(--bad)" }}
                      onClick={() => setModal({ mode: "confirm-del", m })}
                    >
                      <Icon name="x" size={11} /> Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal?.mode === "new" && (
        <MateriaNovaModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal?.mode === "confirm-del" && (
        <ConfirmDelModal
          m={modal.m}
          onClose={() => setModal(null)}
          onDeleted={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function MateriaNovaModal({ onClose, onSaved }) {
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const v = visual(nome || "—");

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!nome.trim()) {
      setErro("Informe o nome da matéria.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/materias", { nome: nome.trim() });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 480 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Nova matéria</div>
            <div className="modal-title">Cadastrar nova matéria</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0 20px" }}>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 64,
                height: 64,
                borderRadius: 10,
                background: v.cor,
                color: "white",
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {v.sigla}
            </span>
          </div>
          <div className="field">
            <label>Nome da matéria</label>
            <input
              className="input"
              placeholder="ex: Matemática"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
            A sigla e a cor são geradas automaticamente a partir do nome.
          </div>
          {erro && (
            <div style={{ marginTop: 12, color: "var(--bad)", fontSize: 12 }}>{erro}</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Criar matéria"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDelModal({ m, onClose, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const submit = async () => {
    setErro("");
    setSaving(true);
    try {
      await api.delete(`/materias/${m.id}`);
      onDeleted();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao excluir.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Excluir matéria</div>
            <div className="modal-title">Confirmar exclusão</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
            Tem certeza que deseja excluir a matéria <strong>{m.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          {erro && <div style={{ marginTop: 12, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn"
            type="button"
            onClick={submit}
            disabled={saving}
            style={{ background: "var(--bad)", borderColor: "var(--bad)", color: "#fff" }}
          >
            {saving ? "excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
