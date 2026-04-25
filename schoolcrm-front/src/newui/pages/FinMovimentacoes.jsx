import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const fmt = (v) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function fmtDate(d) {
  if (!d) return "—";
  try {
    const [y, m, dia] = String(d).slice(0, 10).split("-");
    return `${dia}/${m}/${y}`;
  } catch { return String(d); }
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastDayOfMonth(yearMonth) {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export default function FinMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [resumo, setResumo] = useState({ entradas: 0, saidas: 0, saldo: 0 });
  const [mes, setMes] = useState(mesAtual);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => {
    const de = mes + "-01";
    const ate = mes + "-" + String(lastDayOfMonth(mes)).padStart(2, "0");
    api
      .get("/fin/movimentacoes", { params: { de, ate } })
      .then((r) => setMovimentacoes(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    api
      .get("/fin/movimentacoes/resumo", { params: { de, ate } })
      .then((r) => setResumo(r.data || {}))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [mes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api
      .get("/fin/formas-pagamento", { params: { apenasAtivas: true } })
      .then((r) => setFormasPagamento(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    api
      .get("/fin/pessoas", { params: { ativo: true } })
      .then((r) => setPessoas(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const abrirModal = () => {
    const d = new Date();
    const hoje = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setForm({
      tipo: "ENTRADA",
      descricao: "",
      valor: "",
      dataMovimentacao: hoje,
      formaPagamentoId: "",
      pessoaId: "",
      observacoes: "",
    });
    setErro("");
    setModal(true);
  };

  const ff = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.descricao) { setErro("Informe a descrição."); return; }
    if (!form.valor || Number(form.valor) <= 0) { setErro("Informe um valor válido."); return; }
    setSaving(true);
    setErro("");
    try {
      await api.post("/fin/movimentacoes", {
        ...form,
        valor: Number(form.valor),
        formaPagamentoId: form.formaPagamentoId ? Number(form.formaPagamentoId) : null,
        pessoaId: form.pessoaId ? Number(form.pessoaId) : null,
      });
      setModal(false);
      load();
    } catch (err) {
      setErro(
        typeof err.response?.data === "string" ? err.response.data : "Erro ao registrar."
      );
    } finally {
      setSaving(false);
    }
  };

  const deletar = async (id) => {
    await api.delete(`/fin/movimentacoes/${id}`).catch(() => {});
    setConfirmDel(null);
    load();
  };

  const saldo = Number(resumo.saldo ?? 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro</div>
          <h1 className="page-title">Movimentações</h1>
          <div className="page-subtitle">Caixa rápido — entradas e saídas avulsas</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <input
              className="input"
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
          </div>
          <button className="btn accent" type="button" onClick={abrirModal}>
            <Icon name="plus" /> Nova movimentação
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Entradas", valor: resumo.entradas, cor: "var(--ok)" },
          { label: "Saídas", valor: resumo.saidas, cor: "var(--bad)" },
          {
            label: "Saldo",
            valor: resumo.saldo,
            cor: saldo >= 0 ? "var(--ok)" : "var(--bad)",
          },
        ].map((c) => (
          <div key={c.label} className="card" style={{ padding: "16px 20px" }}>
            <div className="card-eyebrow">{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.cor, marginTop: 6 }}>
              {fmt(c.valor)}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Forma Pgto</th>
              <th>Pessoa</th>
              <th>Por</th>
              <th style={{ width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {movimentacoes.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty" style={{ padding: "32px 0" }}>
                    <div className="t">Nenhuma movimentação</div>
                    <div className="s">NENHUMA MOVIMENTAÇÃO NESTE MÊS</div>
                  </div>
                </td>
              </tr>
            )}
            {movimentacoes.map((m) => (
              <tr key={m.id}>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {fmtDate(m.dataMovimentacao)}
                </td>
                <td>
                  <span
                    className="pill"
                    style={{
                      background:
                        m.tipo === "ENTRADA" ? "var(--ok-bg)" : "var(--bad-bg)",
                      color: m.tipo === "ENTRADA" ? "var(--ok)" : "var(--bad)",
                      fontSize: 10,
                    }}
                  >
                    {m.tipo}
                  </span>
                </td>
                <td className="strong">{m.descricao}</td>
                <td
                  style={{
                    fontWeight: 600,
                    color: m.tipo === "ENTRADA" ? "var(--ok)" : "var(--bad)",
                  }}
                >
                  {fmt(m.valor)}
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {m.formaPagamentoNome || "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {m.pessoaNome || "—"}
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {m.createdByNome || "—"}
                </td>
                <td>
                  <button
                    className="icon-btn"
                    type="button"
                    style={{ color: "var(--bad)" }}
                    onClick={() => setConfirmDel(m.id)}
                  >
                    <Icon name="x" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nova movimentação */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvar}
            style={{ width: 440 }}
          >
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Caixa rápido</div>
                <div className="modal-title">Nova movimentação</div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setModal(false)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 12 }}>
              {/* Tipo */}
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>
                  Tipo *
                </div>
                <div className="row" style={{ gap: 8 }}>
                  {["ENTRADA", "SAIDA"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`chip ${form.tipo === t ? "active" : ""}`}
                      onClick={() => ff("tipo", t)}
                    >
                      {t === "ENTRADA" ? "Entrada" : "Saída"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Descrição *</label>
                <input
                  className="input"
                  required
                  autoFocus
                  value={form.descricao}
                  onChange={(e) => ff("descricao", e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Valor (R$) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.valor}
                    onChange={(e) => ff("valor", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Data *</label>
                  <input
                    className="input"
                    type="date"
                    required
                    value={form.dataMovimentacao}
                    onChange={(e) => ff("dataMovimentacao", e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Forma de pagamento</label>
                <select
                  className="input"
                  value={form.formaPagamentoId}
                  onChange={(e) => ff("formaPagamentoId", e.target.value)}
                >
                  <option value="">— não informar —</option>
                  {formasPagamento.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Pessoa / empresa</label>
                <select
                  className="input"
                  value={form.pessoaId}
                  onChange={(e) => ff("pessoaId", e.target.value)}
                >
                  <option value="">— sem pessoa —</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Observações</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.observacoes}
                  onChange={(e) => ff("observacoes", e.target.value)}
                />
              </div>
              {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button className="btn accent" type="submit" disabled={saving}>
                {saving ? "registrando…" : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 380 }}>
            <div className="modal-header">
              <div className="modal-title">Remover movimentação?</div>
              <button className="icon-btn" type="button" onClick={() => setConfirmDel(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
                Esta ação não pode ser desfeita.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setConfirmDel(null)}>
                Cancelar
              </button>
              <button
                className="btn"
                type="button"
                style={{ color: "var(--bad)" }}
                onClick={() => deletar(confirmDel)}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
