import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const AVATAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "—";
}
function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}
function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function Atrasos() {
  const [aba, setAba] = useState("hoje"); // hoje | historico
  const [hoje, setHoje] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [dataFiltro, setDataFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null); // { mode: "new" } | { mode: "del", a }

  const loadHoje = () => {
    setLoading(true);
    api
      .get("/atrasos/hoje")
      .then((r) => setHoje(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar atrasos."))
      .finally(() => setLoading(false));
  };

  const loadHistorico = () => {
    setLoading(true);
    const url = dataFiltro ? `/atrasos/historico?data=${dataFiltro}` : "/atrasos/historico";
    api
      .get(url)
      .then((r) => setHistorico(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar histórico."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (aba === "hoje") loadHoje();
    else loadHistorico();
  }, [aba, dataFiltro]);

  const lista = aba === "hoje" ? hoje : historico;
  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((a) => (a.alunoNome || "").toLowerCase().includes(q));
  }, [lista, busca]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Atrasos</div>
          <h1 className="page-title">Registro de atrasos</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${filtrada.length} registros`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> Registrar atraso
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div className="row" style={{ gap: 6 }}>
          <button
            type="button"
            className={`chip ${aba === "hoje" ? "active" : ""}`}
            onClick={() => setAba("hoje")}
          >
            Hoje
          </button>
          <button
            type="button"
            className={`chip ${aba === "historico" ? "active" : ""}`}
            onClick={() => setAba("historico")}
          >
            Histórico
          </button>
        </div>
        {aba === "historico" && (
          <div className="field" style={{ minWidth: 180 }}>
            <input
              className="input"
              type="date"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
              placeholder="Filtrar por dia"
            />
          </div>
        )}
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
              placeholder="Buscar aluno…"
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
              <th style={{ width: 48 }}></th>
              <th>Aluno</th>
              <th style={{ width: 140 }}>Turma</th>
              <th style={{ width: 160 }}>Registrado em</th>
              <th>Observação</th>
              <th style={{ width: 80, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrada.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  {aba === "hoje" ? "Nenhum atraso registrado hoje." : "Sem registros para esse filtro."}
                </td>
              </tr>
            )}
            {filtrada.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className={`avatar ${avatarColor(a.alunoId)}`}>{iniciais(a.alunoNome)}</span>
                </td>
                <td>
                  <span className="strong">{a.alunoNome}</span>
                </td>
                <td>{a.turma || "—"}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{a.registradoEm}</td>
                <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{a.observacao || "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="btn sm"
                    type="button"
                    style={{ color: "var(--bad)" }}
                    onClick={() => setModal({ mode: "del", a })}
                  >
                    <Icon name="x" size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.mode === "new" && (
        <NovoAtrasoModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            if (aba === "hoje") loadHoje();
            else loadHistorico();
          }}
        />
      )}
      {modal?.mode === "del" && (
        <ConfirmDelModal
          a={modal.a}
          onClose={() => setModal(null)}
          onDeleted={() => {
            setModal(null);
            if (aba === "hoje") loadHoje();
            else loadHistorico();
          }}
        />
      )}
    </div>
  );
}

function NovoAtrasoModal({ onClose, onSaved }) {
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState("");
  const [data, setData] = useState(todayIso());
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api
      .get("/usuarios")
      .then((r) => {
        const lista = (Array.isArray(r.data) ? r.data : [])
          .filter((u) => u.role === "ALUNO")
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setAlunos(lista);
      })
      .catch(() => {});
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return alunos;
    return alunos.filter((a) => (a.nome || "").toLowerCase().includes(q));
  }, [alunos, busca]);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!alunoId) {
      setErro("Selecione um aluno.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/atrasos", {
        alunoId: String(alunoId),
        data,
        observacao,
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao registrar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 520 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Registrar atraso</div>
            <div className="modal-title">Novo registro de atraso</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label>Buscar aluno</label>
            <input
              className="input"
              placeholder="digite o nome…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Aluno</label>
            <select
              className="input"
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              size={6}
              style={{ height: "auto" }}
            >
              {filtrados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Data</label>
              <input
                className="input"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Observação (opcional)</label>
            <textarea
              className="input"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="ex: chegou às 8h15, justificou no portão"
            />
          </div>
          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Registrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDelModal({ a, onClose, onDeleted }) {
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const submit = async () => {
    setErro("");
    setSaving(true);
    try {
      await api.delete(`/atrasos/${a.id}`);
      onDeleted();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao remover.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Remover atraso</div>
            <div className="modal-title">Confirmar remoção</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
            Remover o registro de atraso de <strong>{a.alunoNome}</strong> em <strong>{a.registradoEm}</strong>?
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
            {saving ? "removendo…" : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}
