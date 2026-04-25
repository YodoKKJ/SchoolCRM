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
  { id: "TODOS",     label: "Todos" },
  { id: "PENDENTE",  label: "Pendentes" },
  { id: "VENCIDO",   label: "Vencidos" },
  { id: "PAGO",      label: "Pagos" },
  { id: "CANCELADO", label: "Cancelados" },
];

const TIPOS_CP = ["FOLHA", "FORNECEDOR", "IMPOSTO", "ALUGUEL", "SERVICO", "OUTRO"];
const CATS_CP  = ["FIXO", "VARIAVEL", "OUTRO"];

export default function FinPagar() {
  const [lista, setLista] = useState([]);
  const [status, setStatus] = useState("PENDENTE");
  const [vencDe, setVencDe] = useState("");
  const [vencAte, setVencAte] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null); // { mode: "baixar" | "new" | "edit" | "cancel", cp? }

  const load = () => {
    setLoading(true);
    setErro("");
    const params = new URLSearchParams();
    if (status !== "TODOS") params.append("status", status);
    if (vencDe) params.append("vencimentoDe", vencDe);
    if (vencAte) params.append("vencimentoAte", vencAte);
    api
      .get(`/fin/contas-pagar?${params}`)
      .then((r) => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar contas a pagar."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, vencDe, vencAte]);

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((c) =>
      `${c.descricao || ""} ${c.pessoaNome || ""} ${c.categoria || ""}`.toLowerCase().includes(q)
    );
  }, [lista, busca]);

  const totalSaldo = useMemo(() =>
    filtrada
      .filter((c) => c.status !== "PAGO" && c.status !== "CANCELADO")
      .reduce((s, c) => s + Math.max(0, Number(c.valor || 0) - Number(c.valorPago || 0)), 0),
    [filtrada]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro · Contas a Pagar</div>
          <h1 className="page-title">CP / Despesas</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${filtrada.length} registros — saldo a pagar ${fmtMoney(totalSaldo)}`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> Nova despesa
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
              placeholder="Buscar descrição, fornecedor…"
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
              <th style={{ width: 120 }}>Tipo</th>
              <th style={{ width: 150 }}>Fornecedor</th>
              <th style={{ width: 120, textAlign: "right" }}>Valor</th>
              <th style={{ width: 110 }}>Vencimento</th>
              <th style={{ width: 100 }}>Status</th>
              <th style={{ width: 140, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtrada.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}
            {filtrada.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="strong">{c.descricao}</span>
                  {c.mesReferencia && (
                    <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                      ref: {c.mesReferencia}
                    </div>
                  )}
                </td>
                <td>
                  <span className="pill" style={{ fontSize: 10 }}>{c.tipo}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{c.pessoaNome || "—"}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {fmtMoney(c.valor)}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(c.dataVencimento)}</td>
                <td><StatusPill s={c.statusComputado || c.status} /></td>
                <td style={{ textAlign: "right" }}>
                  <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                    {c.status !== "PAGO" && c.status !== "CANCELADO" && (
                      <>
                        <button className="btn sm" type="button" onClick={() => setModal({ mode: "edit", cp: c })}>
                          <Icon name="edit" size={11} />
                        </button>
                        <button className="btn sm accent" type="button" onClick={() => setModal({ mode: "baixar", cp: c })}>
                          <Icon name="check" size={11} /> Baixar
                        </button>
                      </>
                    )}
                    {c.status !== "PAGO" && c.status !== "CANCELADO" && (
                      <button
                        className="btn sm"
                        type="button"
                        style={{ color: "var(--bad)" }}
                        onClick={() => setModal({ mode: "cancel", cp: c })}
                      >
                        <Icon name="x" size={11} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.mode === "baixar" && (
        <BaixarModal cp={modal.cp} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {modal?.mode === "new" && (
        <CPModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {modal?.mode === "edit" && (
        <CPModal cp={modal.cp} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
      {modal?.mode === "cancel" && (
        <CancelModal cp={modal.cp} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

function StatusPill({ s }) {
  const map = {
    PAGO:             { bg: "var(--ok)",            t: "Pago" },
    PENDENTE:         { bg: "var(--warn, #d97706)", t: "Pendente" },
    VENCIDO:          { bg: "var(--bad)",           t: "Vencido" },
    CANCELADO:        { bg: "var(--ink-3)",         t: "Cancelado" },
    PARCIALMENTE_PAGO:{ bg: "#3F6FB0",              t: "Parcial" },
  };
  const v = map[s] || { bg: "var(--ink-3)", t: s };
  return <span className="pill" style={{ background: v.bg, color: "#fff", fontSize: 10 }}>{v.t}</span>;
}

function BaixarModal({ cp, onClose, onSaved }) {
  const saldo = Math.max(0, Number(cp.valor || 0) - Number(cp.valorPago || 0));
  const [valorPago, setValorPago]       = useState(saldo.toFixed(2));
  const [dataPagamento, setDataPag]     = useState(todayIso());
  const [observacoes, setObservacoes]   = useState("");
  const [saving, setSaving]             = useState(false);
  const [erro, setErro]                 = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      await api.patch(`/fin/contas-pagar/${cp.id}/baixar`, {
        valorPago: Number(String(valorPago).replace(",", ".")),
        dataPagamento,
        observacoes,
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao baixar.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 480 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Registrar pagamento</div>
            <div className="modal-title">{cp.descricao}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {cp.pessoaNome || ""} · venc {fmtDate(cp.dataVencimento)} · saldo {fmtMoney(saldo)}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor pago</label>
              <input className="input" type="number" step="0.01" min="0.01" value={valorPago} onChange={(e) => setValorPago(e.target.value)} autoFocus />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Data do pagamento</label>
              <input className="input" type="date" value={dataPagamento} onChange={(e) => setDataPag(e.target.value)} />
            </div>
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
            {saving ? "salvando…" : "Confirmar pagamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CPModal({ cp, onClose, onSaved }) {
  const isEdit = !!cp;
  const [descricao,      setDescricao]    = useState(cp?.descricao    || "");
  const [tipo,           setTipo]         = useState(cp?.tipo         || "FORNECEDOR");
  const [categoria,      setCategoria]    = useState(cp?.categoria    || "VARIAVEL");
  const [valor,          setValor]        = useState(cp?.valor        || "");
  const [dataVencimento, setDataVenc]     = useState(cp?.dataVencimento || todayIso());
  const [mesReferencia,  setMesRef]       = useState(cp?.mesReferencia || "");
  const [pessoas,        setPessoas]      = useState([]);
  const [pessoaId,       setPessoaId]     = useState(cp?.pessoaId     || "");
  const [observacoes,    setObservacoes]  = useState(cp?.observacoes  || "");
  const [saving,         setSaving]       = useState(false);
  const [erro,           setErro]         = useState("");

  useEffect(() => {
    api.get("/fin/pessoas")
      .then((r) => setPessoas((Array.isArray(r.data) ? r.data : []).filter((p) => p.ativo !== false)))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!descricao.trim() || !valor || !dataVencimento) {
      setErro("Preencha descrição, valor e vencimento."); return;
    }
    setSaving(true);
    try {
      const body = {
        descricao: descricao.trim(),
        tipo,
        categoria,
        valor: Number(valor),
        dataVencimento,
        mesReferencia: mesReferencia || null,
        observacoes,
        ...(pessoaId ? { pessoaId: Number(pessoaId) } : {}),
      };
      if (isEdit) await api.put(`/fin/contas-pagar/${cp.id}`, body);
      else        await api.post("/fin/contas-pagar", body);
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
            <div className="card-eyebrow">{isEdit ? "Editar despesa" : "Nova despesa"}</div>
            <div className="modal-title">{isEdit ? cp.descricao : "Cadastrar conta a pagar"}</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
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
                {TIPOS_CP.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Categoria</label>
              <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {CATS_CP.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor</label>
              <input className="input" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Vencimento</label>
              <input className="input" type="date" value={dataVencimento} onChange={(e) => setDataVenc(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Mês de referência</label>
              <input className="input" type="month" value={mesReferencia} onChange={(e) => setMesRef(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Fornecedor / credor (opcional)</label>
            <select className="input" value={pessoaId} onChange={(e) => setPessoaId(e.target.value)}>
              <option value="">— sem vínculo —</option>
              {pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
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
            {saving ? "salvando…" : isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CancelModal({ cp, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [erro,   setErro]   = useState("");

  const submit = async () => {
    setSaving(true);
    try {
      await api.patch(`/fin/contas-pagar/${cp.id}/cancelar`);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao cancelar.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 440 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Cancelar despesa</div>
            <div className="modal-title">Confirmar cancelamento</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
            Cancelar <strong>{cp.descricao}</strong> ({fmtMoney(cp.valor)})? Esta ação não pode ser desfeita.
          </p>
          {erro && <div style={{ marginTop: 12, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Voltar</button>
          <button
            className="btn"
            type="button"
            onClick={submit}
            disabled={saving}
            style={{ background: "var(--bad)", borderColor: "var(--bad)", color: "#fff" }}
          >
            {saving ? "cancelando…" : "Cancelar despesa"}
          </button>
        </div>
      </div>
    </div>
  );
}
