import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

function fmtMoney(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

const STATUS_OPCOES = [
  { id: "TODOS", label: "Todos" },
  { id: "PENDENTE", label: "Pendentes" },
  { id: "VENCIDO", label: "Vencidos" },
  { id: "PAGO", label: "Pagos" },
  { id: "CANCELADO", label: "Cancelados" },
];

export default function FinReceber() {
  const [lista, setLista] = useState([]);
  const [status, setStatus] = useState("PENDENTE");
  const [vencDe, setVencDe] = useState("");
  const [vencAte, setVencAte] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null); // { mode: "baixar", cr } | { mode: "new" } | { mode: "cancel", cr }

  const load = () => {
    setLoading(true);
    setErro("");
    const params = new URLSearchParams();
    if (status !== "TODOS") params.append("status", status);
    if (vencDe) params.append("vencimentoDe", vencDe);
    if (vencAte) params.append("vencimentoAte", vencAte);
    api
      .get(`/fin/contas-receber?${params}`)
      .then((r) => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar contas a receber."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, vencDe, vencAte]);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((c) =>
      `${c.descricao || ""} ${c.alunoNome || ""} ${c.pessoaNome || ""}`.toLowerCase().includes(q)
    );
  }, [lista, busca]);

  const totais = useMemo(() => {
    let totalValor = 0;
    let totalPago = 0;
    let totalSaldo = 0;
    for (const c of filtrada) {
      totalValor += Number(c.valor || 0);
      totalPago += Number(c.valorPago || 0);
      const saldo = Number(c.valor || 0) + Number(c.jurosAplicado || 0) + Number(c.multaAplicada || 0) - Number(c.valorPago || 0);
      if (c.status !== "PAGO" && c.status !== "CANCELADO") totalSaldo += Math.max(0, saldo);
    }
    return { totalValor, totalPago, totalSaldo };
  }, [filtrada]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro · Contas a Receber</div>
          <h1 className="page-title">CR / Mensalidades</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${filtrada.length} parcelas — saldo a receber ${fmtMoney(totais.totalSaldo)}`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> CR avulsa
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          {STATUS_OPCOES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip ${status === s.id ? "active" : ""}`}
              onClick={() => setStatus(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" type="date" value={vencDe} onChange={(e) => setVencDe(e.target.value)} style={{ width: 140 }} />
          <span style={{ color: "var(--ink-3)" }}>até</span>
          <input className="input" type="date" value={vencAte} onChange={(e) => setVencAte(e.target.value)} style={{ width: 140 }} />
        </div>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div className="search" style={{ width: "100%", minWidth: 0, background: "var(--panel)" }}>
            <Icon name="search" size={13} />
            <input
              style={{ border: 0, outline: 0, background: "transparent", flex: 1, color: "var(--ink)", fontFamily: "inherit", fontSize: 13 }}
              placeholder="Buscar descrição, aluno ou pessoa…"
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
              <th>Descrição</th>
              <th style={{ width: 200 }}>Aluno / Pessoa</th>
              <th style={{ width: 110, textAlign: "right" }}>Valor</th>
              <th style={{ width: 110, textAlign: "right" }}>Pago</th>
              <th style={{ width: 110 }}>Vencimento</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 110, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtrada.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Nenhuma conta encontrada.</td></tr>
            )}
            {filtrada.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="strong">{c.descricao}</span>
                  {c.numParcela && (
                    <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                      Parcela {c.numParcela}/{c.totalParcelas}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: 12 }}>{c.alunoNome || c.pessoaNome || "—"}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtMoney(c.valor)}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtMoney(c.valorPago)}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(c.dataVencimento)}</td>
                <td><StatusPill s={c.statusComputado || c.status} /></td>
                <td style={{ textAlign: "right" }}>
                  {c.status !== "PAGO" && c.status !== "CANCELADO" && (
                    <button className="btn sm accent" type="button" onClick={() => setModal({ mode: "baixar", cr: c })}>
                      <Icon name="check" size={11} /> Baixar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.mode === "baixar" && (
        <BaixarModal cr={modal.cr} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {modal?.mode === "new" && (
        <NovaCRModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

function StatusPill({ s }) {
  const map = {
    PAGO: { bg: "var(--ok)", t: "Pago" },
    PENDENTE: { bg: "var(--warn, #d97706)", t: "Pendente" },
    VENCIDO: { bg: "var(--bad)", t: "Vencido" },
    CANCELADO: { bg: "var(--ink-3)", t: "Cancelado" },
    PARCIALMENTE_PAGO: { bg: "#3F6FB0", t: "Parcial" },
  };
  const v = map[s] || { bg: "var(--ink-3)", t: s };
  return <span className="pill" style={{ background: v.bg, color: "#fff", fontSize: 10 }}>{v.t}</span>;
}

function BaixarModal({ cr, onClose, onSaved }) {
  const saldoSugerido = Math.max(0, Number(cr.valor || 0) + Number(cr.jurosAplicado || 0) + Number(cr.multaAplicada || 0) - Number(cr.valorPago || 0));
  const [valorPago, setValorPago] = useState(saldoSugerido.toFixed(2));
  const [dataPagamento, setDataPagamento] = useState(todayIso());
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      await api.patch(`/fin/contas-receber/${cr.id}/baixar`, {
        valorPago: Number(String(valorPago).replace(",", ".")),
        dataPagamento,
        observacoes,
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao baixar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 480 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Registrar pagamento</div>
            <div className="modal-title">{cr.descricao}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {cr.alunoNome || cr.pessoaNome || ""} · venc {fmtDate(cr.dataVencimento)}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor pago</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                autoFocus
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Data do pagamento</label>
              <input
                className="input"
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Observações</label>
            <textarea
              className="input"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
            Saldo devedor estimado: {fmtMoney(saldoSugerido)}
          </div>
          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Confirmar pagamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NovaCRModal({ onClose, onSaved }) {
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("OUTRO");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(todayIso());
  const [pessoas, setPessoas] = useState([]);
  const [pessoaId, setPessoaId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api.get("/fin/pessoas").then((r) => {
      setPessoas((Array.isArray(r.data) ? r.data : []).filter((p) => p.ativo !== false));
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!descricao.trim() || !valor || !dataVencimento) {
      setErro("Preencha descrição, valor e vencimento.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        descricao: descricao.trim(),
        tipo,
        valor: Number(valor),
        dataVencimento,
        observacoes,
      };
      if (pessoaId) body.pessoaId = Number(pessoaId);
      await api.post("/fin/contas-receber", body);
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
            <div className="card-eyebrow">Nova conta a receber (avulsa)</div>
            <div className="modal-title">CR sem contrato</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label>Descrição</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="MATRICULA">Matrícula</option>
                <option value="MENSALIDADE">Mensalidade</option>
                <option value="MATERIAL">Material</option>
                <option value="UNIFORME">Uniforme</option>
                <option value="EVENTO">Evento</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Vencimento</label>
              <input
                className="input"
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Pagador (opcional)</label>
            <select className="input" value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
              <option value="">— sem vínculo —</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Observações</label>
            <textarea className="input" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>
          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}
