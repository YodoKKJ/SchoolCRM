import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

/* ─── helpers ──────────────────────────────────────────────────── */
function fmtMoney(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return String(d); }
}
function todayIso() { return new Date().toISOString().slice(0, 10); }
function mesAtual() { return new Date().toISOString().slice(0, 7); }

const STATUS_OPTS = [
  { id: "",                  label: "Todos"     },
  { id: "PENDENTE",          label: "Pendentes" },
  { id: "VENCIDO",           label: "Vencidos"  },
  { id: "PARCIALMENTE_PAGO", label: "Parcial"   },
  { id: "PAGO",              label: "Pagos"     },
  { id: "CANCELADO",         label: "Cancelados"},
];
const TIPOS_CP = ["SALARIO", "CONTA_FIXA", "FORNECEDOR", "OUTRO"];
const CATS_CP  = ["AGUA","LUZ","INTERNET","ALUGUEL","SALARIO","LIMPEZA","MANUTENCAO","MATERIAL","OUTRO"];

/* ─── StatusPill ───────────────────────────────────────────────── */
function StatusPill({ s }) {
  const map = {
    PAGO:             { bg: "var(--ok)",   t: "Pago"      },
    PENDENTE:         { bg: "var(--warn)",  t: "Pendente"  },
    VENCIDO:          { bg: "var(--bad)",   t: "Vencido"   },
    CANCELADO:        { bg: "var(--ink-3)", t: "Cancelado" },
    PARCIALMENTE_PAGO:{ bg: "#3F6FB0",      t: "Parcial"   },
  };
  const v = map[s] || { bg: "var(--ink-3)", t: s };
  return (
    <span className="pill" style={{ background: v.bg, color: "#fff", fontSize: 10 }}>
      {v.t}
    </span>
  );
}

/* ─── componente principal ─────────────────────────────────────── */
export default function FinPagar() {
  const [aba, setAba]             = useState("contas");  // "contas" | "modelos"
  const [contas, setContas]       = useState([]);
  const [modelos, setModelos]     = useState([]);
  const [formas, setFormas]       = useState([]);
  const [pessoas, setPessoas]     = useState([]);

  /* filtros */
  const [statusFiltro, setStatusFiltro] = useState("");
  const [tipoFiltro,   setTipoFiltro]   = useState("");
  const [mesRef,       setMesRef]       = useState("");   // sem filtro de mês por padrão
  const [busca,        setBusca]        = useState("");

  const [loading,  setLoading]  = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg,      setMsg]      = useState({ t: "", ok: true });

  /* modais */
  const [modalBaixar,   setModalBaixar]   = useState(null);
  const [modalCP,       setModalCP]       = useState(null);   // { mode: "new"|"edit", cp? }
  const [modalCancelar, setModalCancelar] = useState(null);
  const [modalHistCP,   setModalHistCP]   = useState(null);   // { cp, registros[] }
  const [modalFolha,    setModalFolha]    = useState(false);
  const [modalRec,      setModalRec]      = useState(false);
  const [modalModelo,   setModalModelo]   = useState(null);   // { mode:"criar"|"editar", dados? }

  const [mesFolha,     setMesFolha]     = useState(mesAtual());
  const [mesRecInput,  setMesRecInput]  = useState(mesAtual());

  const flash = (t, ok = true) => { setMsg({ t, ok }); setTimeout(() => setMsg({ t: "", ok: true }), 3500); };

  /* ── loaders ─────────────────────────────────────────────────── */
  const carregarContas = () => {
    setLoading(true);
    const params = {};
    if (statusFiltro) params.status  = statusFiltro;
    if (tipoFiltro)   params.tipo    = tipoFiltro;
    if (mesRef)       params.mesReferencia = mesRef;
    api.get("/fin/contas-pagar", { params })
      .then((r) => setContas(Array.isArray(r.data) ? r.data : []))
      .catch(() => flash("Erro ao carregar contas a pagar.", false))
      .finally(() => setLoading(false));
  };

  const carregarModelos = () =>
    api.get("/fin/modelos-cp")
      .then((r) => setModelos(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

  useEffect(() => { carregarContas(); }, [statusFiltro, tipoFiltro, mesRef]); // eslint-disable-line
  useEffect(() => {
    carregarModelos();
    api.get("/fin/formas-pagamento", { params: { apenasAtivas: true } })
      .then((r) => setFormas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get("/fin/pessoas", { params: { ativo: true } })
      .then((r) => setPessoas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  /* ── derivados ──────────────────────────────────────────────── */
  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return contas;
    return contas.filter((c) =>
      `${c.descricao||""} ${c.pessoaNome||""} ${c.funcionarioNome||""} ${c.categoria||""}`.toLowerCase().includes(q)
    );
  }, [contas, busca]);

  const resumo = useMemo(() => {
    let pendente = 0, vencido = 0, pago = 0, nVencido = 0;
    contas.forEach((cp) => {
      const st = cp.status;
      const total = Number(cp.valor || 0) + Number(cp.jurosAplicado || 0) + Number(cp.multaAplicada || 0);
      const saldo = total - Number(cp.valorPago || 0);
      if (st === "PAGO")              pago     += Number(cp.valorPago || 0);
      else if (st === "PARCIALMENTE_PAGO") { pago += Number(cp.valorPago || 0); pendente += saldo; }
      else if (st === "VENCIDO")      { vencido += total; nVencido++; }
      else if (st === "PENDENTE")     pendente += total;
    });
    return { pendente, vencido, pago, nVencido };
  }, [contas]);

  /* aviso de modelos não gerados no mês */
  const avisoPendentes = useMemo(() => {
    const ativos = modelos.filter((m) => m.ativo);
    if (!ativos.length) return null;
    const refAtual = mesAtual();
    const gerados = new Set(
      contas.filter((c) => c.modeloId && c.mesReferencia === refAtual).map((c) => c.modeloId)
    );
    const pendentes = ativos.filter((m) => !gerados.has(m.id));
    if (!pendentes.length) return null;
    const nomeMes = new Date(refAtual + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { nomeMes, pendentes, total: ativos.length };
  }, [modelos, contas]);

  /* ── ações ───────────────────────────────────────────────────── */
  const gerarFolha = async () => {
    setSalvando(true);
    try {
      const r = await api.post("/fin/contas-pagar/gerar-folha", { mes: mesFolha });
      setModalFolha(false);
      flash(`Folha gerada: ${r.data.geradas} conta(s). ${r.data.ignoradas} já existia(m).`);
      carregarContas();
    } catch (err) { flash(typeof err.response?.data === "string" ? err.response.data : "Erro ao gerar folha.", false); }
    finally { setSalvando(false); }
  };

  const gerarRecorrentes = async () => {
    setSalvando(true);
    try {
      const r = await api.post("/fin/contas-pagar/gerar-recorrentes", { mes: mesRecInput });
      setModalRec(false);
      flash(`Recorrentes geradas: ${r.data.geradas} conta(s). ${r.data.ignoradas} já existia(m).`);
      carregarContas();
    } catch (err) { flash(typeof err.response?.data === "string" ? err.response.data : "Erro ao gerar recorrentes.", false); }
    finally { setSalvando(false); }
  };

  const verHistoricoCP = async (cp) => {
    try {
      const r = await api.get(`/fin/contas-pagar/${cp.id}/historico`);
      setModalHistCP({ cp, registros: Array.isArray(r.data) ? r.data : [] });
    } catch { flash("Erro ao carregar histórico.", false); }
  };

  const toggleModeloAtivo = async (id) => {
    try { await api.patch(`/fin/modelos-cp/${id}/status`); carregarModelos(); }
    catch (err) { flash(typeof err.response?.data === "string" ? err.response.data : "Erro.", false); }
  };

  const deletarModelo = async (id) => {
    if (!window.confirm("Remover modelo?")) return;
    try { await api.delete(`/fin/modelos-cp/${id}`); flash("Modelo removido."); carregarModelos(); }
    catch (err) { flash(typeof err.response?.data === "string" ? err.response.data : "Erro.", false); }
  };

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="page">
      {/* cabeçalho */}
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro · Contas a Pagar</div>
          <h1 className="page-title">A Pagar / Despesas</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${filtrada.length} registro${filtrada.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="row">
          <button className="btn" type="button" onClick={() => setModalRec(true)}>
            Gerar Recorrentes
          </button>
          <button className="btn" type="button" onClick={() => setModalFolha(true)}>
            <Icon name="users" size={13} /> Gerar Folha
          </button>
          <button className="btn accent" type="button" onClick={() => setModalCP({ mode: "new" })}>
            <Icon name="plus" size={13} /> Nova despesa
          </button>
        </div>
      </div>

      {/* flash */}
      {msg.t && (
        <div
          className="card mb-4"
          style={{ borderColor: msg.ok ? "var(--ok)" : "var(--bad)", padding: "10px 14px" }}
        >
          <div style={{ color: msg.ok ? "var(--ok)" : "var(--bad)", fontSize: 13 }}>{msg.t}</div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid g-3 mb-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "A pagar (pendente)",      valor: resumo.pendente, color: "var(--warn)" },
          { label: `Vencidas (${resumo.nVencido})`, valor: resumo.vencido, color: "var(--bad)" },
          { label: "Pagas (período)",          valor: resumo.pago,    color: "var(--ok)"  },
        ].map((c) => (
          <div key={c.label} className="card kpi" style={{ borderLeft: `3px solid ${c.color}` }}>
            <div className="label">{c.label}</div>
            <div className="value" style={{ fontSize: 18, color: c.color }}>
              {loading ? "…" : fmtMoney(c.valor)}
            </div>
          </div>
        ))}
      </div>

      {/* aviso modelos não gerados */}
      {avisoPendentes && (
        <div
          className="card mb-4"
          style={{ borderColor: "var(--warn)", background: "color-mix(in srgb,var(--warn) 8%,var(--panel))" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="clock" size={15} style={{ color: "var(--warn)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--warn)", flex: 1 }}>
              <strong>{avisoPendentes.nomeMes}:</strong>{" "}
              {avisoPendentes.pendentes.length === avisoPendentes.total
                ? "nenhuma conta recorrente foi gerada"
                : `${avisoPendentes.pendentes.length} de ${avisoPendentes.total} modelos ainda não gerados (${avisoPendentes.pendentes.map((m) => m.descricao).join(", ")})`}
            </span>
            <button
              className="btn sm"
              type="button"
              onClick={() => { setMesRecInput(mesRef); setModalRec(true); }}
            >
              Gerar agora
            </button>
          </div>
        </div>
      )}

      {/* abas */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
        {[
          { id: "contas",  label: `Contas (${contas.length})` },
          { id: "modelos", label: `Modelos (${modelos.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAba(t.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: aba === t.id ? "var(--accent)" : "var(--ink-3)",
              borderBottom: aba === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* aba contas */}
      {aba === "contas" && (
        <>
          {/* filtros */}
          <div className="filter-row" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {STATUS_OPTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`chip ${statusFiltro === s.id ? "active" : ""}`}
                  onClick={() => setStatusFiltro(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <select
                className="input"
                style={{ width: 160 }}
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
              >
                <option value="">Todos tipos</option>
                {TIPOS_CP.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
              <input
                className="input"
                type="month"
                value={mesRef}
                onChange={(e) => setMesRef(e.target.value)}
                style={{ width: 150 }}
              />
              <div className="search" style={{ background: "var(--panel)", minWidth: 220 }}>
                <Icon name="search" size={13} />
                <input
                  style={{ border: 0, outline: 0, background: "transparent", flex: 1, color: "var(--ink)", fontFamily: "inherit", fontSize: 13 }}
                  placeholder="Buscar…"
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
                  <th style={{ width: 100 }}>Tipo</th>
                  <th style={{ width: 150 }}>Credor / Func.</th>
                  <th style={{ width: 110, textAlign: "right" }}>Valor</th>
                  <th style={{ width: 110, textAlign: "right" }}>Pago</th>
                  <th style={{ width: 100 }}>Vencimento</th>
                  <th style={{ width: 80 }}>Mês Ref.</th>
                  <th style={{ width: 95 }}>Status</th>
                  <th style={{ width: 160, textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Carregando…</td></tr>
                )}
                {!loading && filtrada.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Nenhuma conta encontrada.</td></tr>
                )}
                {filtrada.map((c) => {
                  const pago    = c.status === "PAGO" || c.status === "PARCIALMENTE_PAGO" || c.status === "CANCELADO";
                  const podeBaixar = c.status === "PENDENTE" || c.status === "VENCIDO" || c.status === "PARCIALMENTE_PAGO";
                  const credor  = c.pessoaNome || c.funcionarioNome || "—";
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="strong">{c.descricao}</span>
                        {c.observacoes && (
                          <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{c.observacoes}</div>
                        )}
                      </td>
                      <td><span className="pill" style={{ fontSize: 10 }}>{(c.tipo||"—").replace("_"," ")}</span></td>
                      <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{credor}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtMoney(c.valor)}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: c.valorPago ? "var(--ok)" : "var(--ink-3)" }}>
                        {c.valorPago ? fmtMoney(c.valorPago) : "—"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(c.dataVencimento)}</td>
                      <td style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{c.mesReferencia || "—"}</td>
                      <td><StatusPill s={c.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                          {podeBaixar && (
                            <button className="btn sm accent" type="button"
                              onClick={() => setModalBaixar(c)}>
                              <Icon name="check" size={11} /> Baixar
                            </button>
                          )}
                          {podeBaixar && (
                            <button className="btn sm" type="button"
                              onClick={() => setModalCP({ mode: "edit", cp: c })}>
                              <Icon name="edit" size={11} />
                            </button>
                          )}
                          {(c.status === "PAGO" || c.status === "PARCIALMENTE_PAGO") && (
                            <button className="btn sm" type="button"
                              onClick={() => verHistoricoCP(c)}>
                              Histórico
                            </button>
                          )}
                          {podeBaixar && (
                            <button className="btn sm" type="button"
                              style={{ color: "var(--bad)" }}
                              onClick={() => setModalCancelar(c)}>
                              <Icon name="x" size={11} />
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
        </>
      )}

      {/* aba modelos */}
      {aba === "modelos" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Modelos de Contas Fixas</div>
            <button className="btn accent" type="button" style={{ fontSize: 12 }}
              onClick={() => setModalModelo({ mode: "criar" })}>
              <Icon name="plus" size={12} /> Novo modelo
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: "right" }}>Valor</th>
                <th>Dia Venc.</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th style={{ width: 100, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {modelos.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Nenhum modelo cadastrado.</td></tr>
              )}
              {modelos.map((m) => (
                <tr key={m.id}>
                  <td className="strong">{m.descricao}</td>
                  <td style={{ fontSize: 11, color: "var(--ink-2)" }}>{(m.categoria || "—").replace("_", " ")}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtMoney(m.valor)}</td>
                  <td style={{ fontSize: 12 }}>Dia {m.diaVencimento || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--ink-2)" }}>{m.pessoaNome || "—"}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleModeloAtivo(m.id)}
                      className="pill"
                      style={{
                        background: m.ativo ? "var(--ok)" : "var(--bad)",
                        color: "#fff",
                        fontSize: 10,
                        cursor: "pointer",
                        border: "none",
                      }}
                    >
                      {m.ativo ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                      <button className="btn sm" type="button"
                        onClick={() => setModalModelo({ mode: "editar", dados: m })}>
                        <Icon name="edit" size={11} />
                      </button>
                      <button className="btn sm" type="button"
                        style={{ color: "var(--bad)" }}
                        onClick={() => deletarModelo(m.id)}>
                        <Icon name="trash" size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ──────────── MODAIS ──────────── */}

      {/* baixar */}
      {modalBaixar && (
        <BaixarModal
          cp={modalBaixar}
          formas={formas}
          onClose={() => setModalBaixar(null)}
          onSaved={() => { setModalBaixar(null); carregarContas(); }}
        />
      )}

      {/* criar / editar conta */}
      {modalCP && (
        <CPModal
          cp={modalCP.cp}
          pessoas={pessoas}
          onClose={() => setModalCP(null)}
          onSaved={() => { setModalCP(null); carregarContas(); }}
        />
      )}

      {/* cancelar */}
      {modalCancelar && (
        <CancelarModal
          cp={modalCancelar}
          onClose={() => setModalCancelar(null)}
          onSaved={() => { setModalCancelar(null); carregarContas(); }}
        />
      )}

      {/* histórico */}
      {modalHistCP && (
        <HistoricoModal
          cp={modalHistCP.cp}
          registros={modalHistCP.registros}
          onClose={() => setModalHistCP(null)}
        />
      )}

      {/* gerar folha */}
      {modalFolha && (
        <div className="modal-overlay" onClick={() => setModalFolha(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 360 }}>
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Folha de pagamento</div>
                <div className="modal-title">Gerar Folha</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Salários de todos os funcionários ativos</div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setModalFolha(false)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Mês de referência</label>
                <input className="input" type="month" value={mesFolha} onChange={(e) => setMesFolha(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setModalFolha(false)}>Cancelar</button>
              <button className="btn accent" type="button" disabled={salvando} onClick={gerarFolha}>
                {salvando ? "Gerando…" : "Gerar folha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* gerar recorrentes */}
      {modalRec && (
        <div className="modal-overlay" onClick={() => setModalRec(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 360 }}>
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Contas recorrentes</div>
                <div className="modal-title">Gerar Recorrentes</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  Instâncias de todos os modelos ativos ({modelos.filter((m) => m.ativo).length} modelo{modelos.filter((m) => m.ativo).length !== 1 ? "s" : ""})
                </div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setModalRec(false)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="field">
                <label>Mês de referência</label>
                <input className="input" type="month" value={mesRecInput} onChange={(e) => setMesRecInput(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setModalRec(false)}>Cancelar</button>
              <button className="btn accent" type="button" disabled={salvando} onClick={gerarRecorrentes}>
                {salvando ? "Gerando…" : "Gerar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modelo de conta */}
      {modalModelo && (
        <ModeloModal
          dados={modalModelo.dados}
          pessoas={pessoas}
          onClose={() => setModalModelo(null)}
          onSaved={() => { setModalModelo(null); carregarModelos(); flash("Modelo salvo!"); }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Modal: baixar conta
──────────────────────────────────────────────────────────────── */
function BaixarModal({ cp, formas, onClose, onSaved }) {
  const saldo = Math.max(0, Number(cp.valor || 0) + Number(cp.jurosAplicado || 0) + Number(cp.multaAplicada || 0) - Number(cp.valorPago || 0));
  const [valorPago,     setValorPago]     = useState(saldo.toFixed(2));
  const [dataPagamento, setDataPagamento] = useState(todayIso());
  const [formaId,       setFormaId]       = useState("");
  const [obs,           setObs]           = useState("");
  const [saving,        setSaving]        = useState(false);
  const [erro,          setErro]          = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      await api.patch(`/fin/contas-pagar/${cp.id}/baixar`, {
        valorPago: Number(String(valorPago).replace(",", ".")),
        dataPagamento,
        formaPagamentoId: formaId ? Number(formaId) : null,
        observacoes: obs,
      });
      onSaved();
    } catch (err) { setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao baixar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 480 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Registrar pagamento</div>
            <div className="modal-title">{cp.descricao}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {cp.pessoaNome || ""}{cp.pessoaNome ? " · " : ""}venc {fmtDate(cp.dataVencimento)} · saldo {fmtMoney(saldo)}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor pago (R$)</label>
              <input className="input" type="number" step="0.01" min="0.01" autoFocus value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Data de pagamento</label>
              <input className="input" type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Forma de pagamento</label>
            <select className="input" value={formaId} onChange={(e) => setFormaId(e.target.value)}>
              <option value="">— não informar —</option>
              {formas.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
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

/* ────────────────────────────────────────────────────────────────
   Modal: criar / editar conta a pagar
──────────────────────────────────────────────────────────────── */
function CPModal({ cp, pessoas, onClose, onSaved }) {
  const isEdit = !!cp;
  const [descricao,  setDescricao]  = useState(cp?.descricao      || "");
  const [tipo,       setTipo]       = useState(cp?.tipo           || "FORNECEDOR");
  const [categoria,  setCategoria]  = useState(cp?.categoria      || "OUTRO");
  const [valor,      setValor]      = useState(cp?.valor          || "");
  const [dataVenc,   setDataVenc]   = useState(cp?.dataVencimento || todayIso());
  const [mesRef,     setMesRefL]    = useState(cp?.mesReferencia  || mesAtual());
  const [pessoaId,   setPessoaId]   = useState(cp?.pessoaId       || "");
  const [obs,        setObs]        = useState(cp?.observacoes    || "");
  const [saving,     setSaving]     = useState(false);
  const [erro,       setErro]       = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || !dataVenc) {
      setErro("Preencha descrição, valor e vencimento."); return;
    }
    setSaving(true);
    try {
      const body = {
        descricao: descricao.trim(), tipo, categoria,
        valor: Number(valor), dataVencimento: dataVenc,
        mesReferencia: mesRef || null, observacoes: obs,
        ...(pessoaId ? { pessoaId: Number(pessoaId) } : {}),
      };
      if (isEdit) await api.put(`/fin/contas-pagar/${cp.id}`, body);
      else        await api.post("/fin/contas-pagar", body);
      onSaved();
    } catch (err) { setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 580 }}>
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
            <input className="input" autoFocus value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS_CP.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
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
              <label>Valor (R$)</label>
              <input className="input" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Vencimento</label>
              <input className="input" type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Mês referência</label>
              <input className="input" type="month" value={mesRef} onChange={(e) => setMesRefL(e.target.value)} />
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
            <textarea className="input" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
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

/* ────────────────────────────────────────────────────────────────
   Modal: cancelar conta
──────────────────────────────────────────────────────────────── */
function CancelarModal({ cp, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [erro,   setErro]   = useState("");

  const submit = async () => {
    setSaving(true);
    try { await api.patch(`/fin/contas-pagar/${cp.id}/cancelar`); onSaved(); }
    catch (err) { setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao cancelar."); setSaving(false); }
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
          <button className="btn" type="button" disabled={saving} onClick={submit}
            style={{ background: "var(--bad)", borderColor: "var(--bad)", color: "#fff" }}>
            {saving ? "cancelando…" : "Cancelar despesa"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Modal: histórico de pagamentos
──────────────────────────────────────────────────────────────── */
function HistoricoModal({ cp, registros, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 540 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Histórico de pagamentos</div>
            <div className="modal-title">{cp.descricao}</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          {registros.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              Nenhum registro de pagamento.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                  <th>Forma</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(r.dataPagamento)}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtMoney(r.valorPago)}</td>
                    <td style={{ fontSize: 11, color: "var(--ink-2)" }}>{r.formaPagamentoNome || "—"}</td>
                    <td style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.observacoes || "—"}</td>
                  </tr>
                ))}
              </tbody>
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

/* ────────────────────────────────────────────────────────────────
   Modal: criar / editar modelo de conta fixa
──────────────────────────────────────────────────────────────── */
function ModeloModal({ dados, pessoas, onClose, onSaved }) {
  const isEdit = !!dados;
  const [descricao,   setDescricao]  = useState(dados?.descricao      || "");
  const [categoria,   setCategoria]  = useState(dados?.categoria      || "CONTA_FIXA");
  const [valor,       setValor]      = useState(dados?.valor          || "");
  const [diaVenc,     setDiaVenc]    = useState(dados?.diaVencimento  || "");
  const [pessoaId,    setPessoaId]   = useState(dados?.pessoaId       || "");
  const [obs,         setObs]        = useState(dados?.observacoes    || "");
  const [saving,      setSaving]     = useState(false);
  const [erro,        setErro]       = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || !diaVenc) {
      setErro("Preencha descrição, valor e dia de vencimento."); return;
    }
    setSaving(true);
    try {
      const body = {
        descricao: descricao.trim(), categoria,
        valor: Number(valor), diaVencimento: Number(diaVenc),
        observacoes: obs,
        ...(pessoaId ? { pessoaId: Number(pessoaId) } : {}),
      };
      if (isEdit) await api.put(`/fin/modelos-cp/${dados.id}`, body);
      else        await api.post("/fin/modelos-cp", body);
      onSaved();
    } catch (err) { setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar."); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 520 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{isEdit ? "Editar modelo" : "Novo modelo"}</div>
            <div className="modal-title">Modelo de conta fixa / recorrente</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label>Descrição</label>
            <input className="input" autoFocus value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Categoria</label>
              <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                {["CONTA_FIXA","AGUA","LUZ","INTERNET","ALUGUEL","LIMPEZA","MANUTENCAO","MATERIAL","SALARIO","OUTRO"].map((c) => (
                  <option key={c} value={c}>{c.replace("_"," ")}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor (R$)</label>
              <input className="input" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Dia vencimento (1–31)</label>
              <input className="input" type="number" min="1" max="31" value={diaVenc} onChange={(e) => setDiaVenc(e.target.value)} />
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
            <textarea className="input" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
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
