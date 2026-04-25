import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const ANO_ATUAL = new Date().getFullYear();
const AVATAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

/* ─── helpers ──────────────────────────────────────────────────── */
function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "—";
}
function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}
function fmtMoney(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

/* ─── StatusPill ───────────────────────────────────────────────── */
function StatusPill({ s }) {
  const map = {
    PAGO:             { bg: "var(--ok)",    t: "Pago"      },
    PENDENTE:         { bg: "var(--warn)",  t: "Pendente"  },
    VENCIDO:          { bg: "var(--bad)",   t: "Vencido"   },
    CANCELADO:        { bg: "var(--ink-3)", t: "Cancelado" },
    PARCIALMENTE_PAGO:{ bg: "#3F6FB0",      t: "Parcial"   },
  };
  const v = map[s] || { bg: "var(--ink-3)", t: s };
  return <span className="pill" style={{ background: v.bg, color: "#fff", fontSize: 10 }}>{v.t}</span>;
}

function Row({ label, value, strong }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{label}</span>
      <span className={strong ? "strong" : ""} style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function FinContratos() {
  const [contratos,  setContratos]  = useState([]);
  const [anoLetivo,  setAnoLetivo]  = useState(ANO_ATUAL);
  const [busca,      setBusca]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [erro,       setErro]       = useState("");
  const [drawer,     setDrawer]     = useState(null);
  const [modalNovo,  setModalNovo]  = useState(false);

  const load = () => {
    setLoading(true);
    setErro("");
    api.get(`/fin/contratos?anoLetivo=${anoLetivo}`)
      .then((r) => setContratos(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar contratos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [anoLetivo]); // eslint-disable-line

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return contratos;
    return contratos.filter((c) =>
      `${c.alunoNome || ""} ${c.responsavelPrincipalNome || ""} ${c.serieNome || ""}`.toLowerCase().includes(q)
    );
  }, [contratos, busca]);

  const totalAnual = useMemo(() =>
    contratos.reduce((s, c) => s + Number(c.valorTotal || 0), 0), [contratos]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro · Contratos</div>
          <h1 className="page-title">Contratos de matrícula</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${contratos.length} contratos · valor anual ${fmtMoney(totalAnual)}`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModalNovo(true)}>
            <Icon name="plus" /> Novo contrato
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div className="field" style={{ width: 120 }}>
          <label>Ano letivo</label>
          <input className="input" type="number" value={anoLetivo} onChange={(e) => setAnoLetivo(Number(e.target.value))} />
        </div>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div className="search" style={{ width: "100%", minWidth: 0, background: "var(--panel)" }}>
            <Icon name="search" size={13} />
            <input
              style={{ border: 0, outline: 0, background: "transparent", flex: 1, color: "var(--ink)", fontFamily: "inherit", fontSize: 13 }}
              placeholder="Buscar por aluno, responsável ou série…"
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
              <th>Responsável principal</th>
              <th style={{ width: 140 }}>Série</th>
              <th style={{ width: 110, textAlign: "right" }}>Mensalidade</th>
              <th style={{ width: 80,  textAlign: "right" }}>Parcelas</th>
              <th style={{ width: 130, textAlign: "right" }}>Valor anual</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtrados.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Nenhum contrato encontrado.</td></tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className="row-link" onClick={() => setDrawer(c.id)}>
                <td><span className={`avatar ${avatarColor(c.alunoId)}`}>{iniciais(c.alunoNome)}</span></td>
                <td><span className="strong">{c.alunoNome}</span></td>
                <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{c.responsavelPrincipalNome}</td>
                <td>{c.serieNome}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtMoney(c.valorMensal)}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{c.numParcelas}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}><strong>{fmtMoney(c.valorTotal)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <ContratoDrawer contratoId={drawer} onClose={() => setDrawer(null)} onChanged={() => { setDrawer(null); load(); }} />
      )}
      {modalNovo && (
        <NovoContratoModal anoLetivo={anoLetivo} onClose={() => setModalNovo(false)} onSaved={() => { setModalNovo(false); load(); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DRAWER DO CONTRATO — lista parcelas com ações
══════════════════════════════════════════════════════════════ */
function ContratoDrawer({ contratoId, onClose, onChanged }) {
  const [c,             setC]            = useState(null);
  const [formas,        setFormas]       = useState([]);
  const [erro,          setErro]         = useState("");
  const [msg,           setMsg]          = useState({ t: "", ok: true });
  const [confirmCancel, setConfirmCancel]= useState(false);

  /* modais de parcela */
  const [modalBaixar,  setModalBaixar]  = useState(null); // parcela obj
  const [modalHistCR,  setModalHistCR]  = useState(null); // { crId, desc }

  const flash = (t, ok = true) => { setMsg({ t, ok }); setTimeout(() => setMsg({ t: "", ok: true }), 3500); };

  const recarregar = () => {
    api.get(`/fin/contratos/${contratoId}`)
      .then((r) => setC(r.data))
      .catch(() => setErro("Erro ao carregar contrato."));
  };

  useEffect(() => {
    recarregar();
    api.get("/fin/formas-pagamento", { params: { apenasAtivas: true } })
      .then((r) => setFormas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, [contratoId]); // eslint-disable-line

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cancelarContrato = async () => {
    try {
      await api.delete(`/fin/contratos/${contratoId}`);
      onChanged();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao cancelar.");
      setConfirmCancel(false);
    }
  };

  const cancelarParcela = async (crId) => {
    if (!window.confirm("Cancelar esta parcela?")) return;
    try {
      await api.patch(`/fin/contas-receber/${crId}/cancelar`);
      flash("Parcela cancelada.");
      recarregar();
    } catch (err) { flash(typeof err.response?.data === "string" ? err.response.data : "Erro ao cancelar.", false); }
  };

  if (!c) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <aside className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-body" style={{ color: "var(--ink-3)", fontSize: 13 }}>{erro || "carregando…"}</div>
        </aside>
      </div>
    );
  }

  const parcelas = c.parcelas || [];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <span className={`avatar lg ${avatarColor(c.alunoId)}`}>{iniciais(c.alunoNome)}</span>
            <div>
              <div className="card-eyebrow">Contrato {c.anoLetivo}</div>
              <div className="modal-title">{c.alunoNome}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{c.serieNome} · {c.numParcelas} parcelas</div>
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div className="drawer-body">
          {msg.t && (
            <div className="card mb-4" style={{ borderColor: msg.ok ? "var(--ok)" : "var(--bad)", padding: "8px 12px", marginBottom: 12 }}>
              <div style={{ color: msg.ok ? "var(--ok)" : "var(--bad)", fontSize: 12 }}>{msg.t}</div>
            </div>
          )}

          {/* Valores */}
          <section style={{ marginBottom: 14 }}>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Valores</div>
            <div className="card" style={{ padding: 12 }}>
              <Row label="Valor base"  value={fmtMoney(c.valorBase)} />
              <Row label="Desconto"    value={fmtMoney(c.desconto)} />
              <Row label="Acréscimo"   value={fmtMoney(c.acrescimo)} />
              <Row label="Mensalidade" value={fmtMoney(c.valorMensal)} strong />
              <Row label="Total anual" value={fmtMoney(c.valorTotal)}  strong />
            </div>
          </section>

          {/* Responsáveis */}
          <section style={{ marginBottom: 14 }}>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Responsáveis</div>
            <div className="card" style={{ padding: 12 }}>
              <Row label="Principal"  value={c.responsavelPrincipalNome} />
              {c.responsavelSecundarioNome && <Row label="Secundário" value={c.responsavelSecundarioNome} />}
            </div>
          </section>

          {/* Parcelas */}
          <section>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Parcelas</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 46 }}>#</th>
                    <th style={{ width: 95 }}>Vencimento</th>
                    <th style={{ textAlign: "right", width: 95 }}>Valor</th>
                    <th style={{ textAlign: "right", width: 95 }}>Pago</th>
                    <th style={{ width: 80 }}>Status</th>
                    <th style={{ width: 130, textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {parcelas.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>Nenhuma parcela.</td></tr>
                  )}
                  {parcelas.map((p) => {
                    const podeBaixar = p.status === "PENDENTE" || p.status === "VENCIDO" || p.status === "PARCIALMENTE_PAGO";
                    const temHistorico = p.status === "PAGO" || p.status === "PARCIALMENTE_PAGO";
                    return (
                      <tr key={p.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{p.numParcela}/{p.totalParcelas}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmtDate(p.dataVencimento)}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmtMoney(p.valor)}</td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: p.valorPago ? "var(--ok)" : "var(--ink-3)" }}>
                          {p.valorPago ? fmtMoney(p.valorPago) : "—"}
                        </td>
                        <td><StatusPill s={p.status} /></td>
                        <td style={{ textAlign: "right" }}>
                          <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                            {podeBaixar && (
                              <button className="btn sm accent" type="button" onClick={() => setModalBaixar(p)}>
                                <Icon name="check" size={10} /> Baixar
                              </button>
                            )}
                            {temHistorico && (
                              <button className="btn sm" type="button"
                                onClick={() => setModalHistCR({ crId: p.id, desc: `Parcela ${p.numParcela}/${p.totalParcelas}` })}>
                                Histórico
                              </button>
                            )}
                            {podeBaixar && (
                              <button className="btn sm" type="button"
                                style={{ color: "var(--bad)" }}
                                onClick={() => cancelarParcela(p.id)}>
                                <Icon name="x" size={10} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="drawer-footer">
          {erro && <div style={{ color: "var(--bad)", fontSize: 12, marginBottom: 8 }}>{erro}</div>}
          {confirmCancel ? (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span style={{ color: "var(--bad)", fontSize: 12 }}>Cancelar este contrato?</span>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn" type="button" onClick={() => setConfirmCancel(false)}>Voltar</button>
                <button className="btn" type="button" onClick={cancelarContrato}
                  style={{ background: "var(--bad)", borderColor: "var(--bad)", color: "#fff" }}>
                  Cancelar contrato
                </button>
              </div>
            </div>
          ) : (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button className="btn" type="button" onClick={() => setConfirmCancel(true)} style={{ color: "var(--bad)" }}>
                Cancelar contrato
              </button>
              <button className="btn" type="button" onClick={onClose}>Fechar</button>
            </div>
          )}
        </div>
      </aside>

      {/* modal de baixa da parcela */}
      {modalBaixar && (
        <BaixarCRModal
          parcela={modalBaixar}
          formas={formas}
          onClose={() => setModalBaixar(null)}
          onSaved={() => { setModalBaixar(null); flash("Pagamento registrado!"); recarregar(); }}
        />
      )}

      {/* modal de histórico */}
      {modalHistCR && (
        <HistoricoCRModal
          crId={modalHistCR.crId}
          descricao={modalHistCR.desc}
          onClose={() => setModalHistCR(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL: BAIXAR PARCELA (com juros e multa)
══════════════════════════════════════════════════════════════ */
function BaixarCRModal({ parcela, formas, onClose, onSaved }) {
  /* saldo devedor: considera o que já foi pago + juros/multa já aplicados */
  const valorBase    = Number(parcela.valor    || 0);
  const jurosExist   = Number(parcela.jurosAplicado  || 0);
  const multaExist   = Number(parcela.multaAplicada  || 0);
  const jaPago       = Number(parcela.valorPago || 0);
  const saldoInicial = valorBase + jurosExist + multaExist - jaPago;

  const [valorPago,    setValorPago]    = useState(saldoInicial > 0 ? saldoInicial.toFixed(2) : "0.00");
  const [dataPag,      setDataPag]      = useState(todayIso());
  const [formaId,      setFormaId]      = useState("");
  const [juros,        setJuros]        = useState(jurosExist > 0 ? jurosExist.toFixed(2) : "");
  const [multa,        setMulta]        = useState(multaExist > 0 ? multaExist.toFixed(2) : "");
  const [obs,          setObs]          = useState("");
  const [saving,       setSaving]       = useState(false);
  const [erro,         setErro]         = useState("");

  /* recalcula sugestão de valorPago quando juros/multa mudam */
  const totalDevido = valorBase + Number(juros || 0) + Number(multa || 0) - jaPago;

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    const vp    = Number(String(valorPago).replace(",", "."));
    const jv    = Number(juros  || 0);
    const mv    = Number(multa  || 0);
    const maxEsp = valorBase + jv + mv - jaPago;
    if (vp <= 0) { setErro("Informe um valor pago maior que zero."); return; }
    if (vp > maxEsp + 0.01) {
      setErro(`Valor pago (${fmtMoney(vp)}) não pode ser maior que o saldo devedor (${fmtMoney(maxEsp)}).`);
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/fin/contas-receber/${parcela.id}/baixar`, {
        valorPago:        vp,
        dataPagamento:    dataPag,
        formaPagamentoId: formaId ? Number(formaId) : null,
        jurosAplicado:    jv > 0 ? jv : null,
        multaAplicada:    mv > 0 ? mv : null,
        observacoes:      obs || null,
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao registrar pagamento.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 520 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Registrar pagamento</div>
            <div className="modal-title">
              Parcela {parcela.numParcela}/{parcela.totalParcelas}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              Venc. {fmtDate(parcela.dataVencimento)} · valor {fmtMoney(parcela.valor)}
              {jaPago > 0 && ` · já pago ${fmtMoney(jaPago)}`}
              {` · saldo devedor `}<strong>{fmtMoney(saldoInicial)}</strong>
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div className="modal-body" style={{ display: "grid", gap: 14 }}>
          {/* linha: juros + multa */}
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Juros (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={juros}
                onChange={(e) => {
                  setJuros(e.target.value);
                  const novo = valorBase + Number(e.target.value || 0) + Number(multa || 0) - jaPago;
                  if (novo > 0) setValorPago(novo.toFixed(2));
                }}
                placeholder="0,00"
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Multa (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={multa}
                onChange={(e) => {
                  setMulta(e.target.value);
                  const novo = valorBase + Number(juros || 0) + Number(e.target.value || 0) - jaPago;
                  if (novo > 0) setValorPago(novo.toFixed(2));
                }}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* total atualizado */}
          {(Number(juros || 0) > 0 || Number(multa || 0) > 0) && (
            <div style={{
              background: "color-mix(in srgb,var(--warn) 8%,var(--panel))",
              border: "1px solid var(--warn)",
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 12,
              color: "var(--ink-2)",
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span>Total com encargos:</span>
              <strong style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{fmtMoney(totalDevido)}</strong>
            </div>
          )}

          {/* linha: valor pago + data */}
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor pago (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
              />
              <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
                Pode ser menor que o total para pagamento parcial
              </div>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Data do pagamento</label>
              <input className="input" type="date" value={dataPag} onChange={(e) => setDataPag(e.target.value)} />
            </div>
          </div>

          {/* forma de pagamento */}
          <div className="field">
            <label>Forma de pagamento</label>
            <select className="input" value={formaId} onChange={(e) => setFormaId(e.target.value)}>
              <option value="">— não informar —</option>
              {formas.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>

          {/* observações */}
          <div className="field">
            <label>Observações</label>
            <textarea className="input" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
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

/* ═══════════════════════════════════════════════════════════════
   MODAL: HISTÓRICO DE PAGAMENTOS DA CR
══════════════════════════════════════════════════════════════ */
function HistoricoCRModal({ crId, descricao, onClose }) {
  const [registros, setRegistros] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get(`/fin/contas-receber/${crId}/historico`)
      .then((r) => setRegistros(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRegistros([]))
      .finally(() => setLoading(false));
  }, [crId]);

  const totalPago = registros.reduce((s, r) => s + Number(r.valorPago || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 560 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Histórico de pagamentos</div>
            <div className="modal-title">{descricao}</div>
            {!loading && registros.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                {registros.length} registro{registros.length !== 1 ? "s" : ""} · total pago {fmtMoney(totalPago)}
              </div>
            )}
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Carregando…</div>
          ) : registros.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              Nenhum registro de pagamento.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Valor pago</th>
                  <th style={{ textAlign: "right" }}>Juros</th>
                  <th style={{ textAlign: "right" }}>Multa</th>
                  <th>Forma</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {r.dataPagamento ? fmtDate(r.dataPagamento) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--ok)" }}>
                      {fmtMoney(r.valorPago)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: r.jurosAplicado ? "var(--warn)" : "var(--ink-3)" }}>
                      {r.jurosAplicado ? fmtMoney(r.jurosAplicado) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: r.multaAplicada ? "var(--warn)" : "var(--ink-3)" }}>
                      {r.multaAplicada ? fmtMoney(r.multaAplicada) : "—"}
                    </td>
                    <td style={{ fontSize: 11, color: "var(--ink-2)" }}>{r.formaPagamentoNome || "—"}</td>
                    <td style={{ fontSize: 11, color: "var(--ink-3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.observacoes}>
                      {r.observacoes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {registros.length > 1 && (
                <tfoot>
                  <tr style={{ background: "var(--bg)" }}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>Total</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: "var(--ok)" }}>
                      {fmtMoney(totalPago)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--warn)" }}>
                      {registros.some(r => r.jurosAplicado) ? fmtMoney(registros.reduce((s,r) => s + Number(r.jurosAplicado || 0), 0)) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--warn)" }}>
                      {registros.some(r => r.multaAplicada) ? fmtMoney(registros.reduce((s,r) => s + Number(r.multaAplicada || 0), 0)) : "—"}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn accent" type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL: NOVO CONTRATO
══════════════════════════════════════════════════════════════ */
function NovoContratoModal({ anoLetivo, onClose, onSaved }) {
  const [alunos,      setAlunos]     = useState([]);
  const [responsaveis,setResponsaveis]=useState([]);
  const [series,      setSeries]     = useState([]);

  const [alunoId,              setAlunoId]    = useState("");
  const [responsavelPrincipalId, setRespId]   = useState("");
  const [serieId,              setSerieId]    = useState("");
  const [valorBase,            setValorBase]  = useState("");
  const [desconto,             setDesconto]   = useState("0");
  const [acrescimo,            setAcrescimo]  = useState("0");
  const [numParcelas,          setNumParcelas]= useState("12");
  const [diaVencimento,        setDiaVenc]    = useState("10");
  const [saving,               setSaving]     = useState(false);
  const [erro,                 setErro]       = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/usuarios").catch(() => ({ data: [] })),
      api.get("/fin/pessoas").catch(() => ({ data: [] })),
      api.get("/turmas/series").catch(() => ({ data: [] })),
    ]).then(([u, p, s]) => {
      setAlunos((Array.isArray(u.data) ? u.data : []).filter((x) => x.role === "ALUNO").sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
      setResponsaveis((Array.isArray(p.data) ? p.data : []).filter((x) => x.tipoPessoa === "FISICA" && x.ativo !== false).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
      setSeries(Array.isArray(s.data) ? s.data : []);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!alunoId || !responsavelPrincipalId || !serieId) {
      setErro("Preencha aluno, responsável e série."); return;
    }
    setSaving(true);
    try {
      const body = {
        alunoId: Number(alunoId),
        responsavelPrincipalId: Number(responsavelPrincipalId),
        serieId: Number(serieId),
        anoLetivo,
        desconto:      Number(desconto  || 0),
        acrescimo:     Number(acrescimo || 0),
        numParcelas:   Number(numParcelas),
        diaVencimento: Number(diaVencimento),
      };
      if (valorBase) body.valorBase = Number(valorBase);
      await api.post("/fin/contratos", body);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 640 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Novo contrato — {anoLetivo}</div>
            <div className="modal-title">Cadastrar contrato de matrícula</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Aluno</label>
              <select className="input" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
                <option value="">— selecione —</option>
                {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Série</label>
              <select className="input" value={serieId} onChange={(e) => setSerieId(e.target.value)}>
                <option value="">— selecione —</option>
                {series.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Responsável principal</label>
            <select className="input" value={responsavelPrincipalId} onChange={(e) => setRespId(e.target.value)}>
              <option value="">— selecione —</option>
              {responsaveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor base mensal (opcional)</label>
              <input className="input" type="number" step="0.01" value={valorBase} onChange={(e) => setValorBase(e.target.value)} placeholder="usar valor da série" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Desconto</label>
              <input className="input" type="number" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Acréscimo</label>
              <input className="input" type="number" step="0.01" value={acrescimo} onChange={(e) => setAcrescimo(e.target.value)} />
            </div>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Nº de parcelas</label>
              <input className="input" type="number" min="1" max="60" value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Dia de vencimento</label>
              <input className="input" type="number" min="1" max="28" value={diaVencimento} onChange={(e) => setDiaVenc(e.target.value)} />
            </div>
          </div>
          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Criar contrato"}
          </button>
        </div>
      </form>
    </div>
  );
}
