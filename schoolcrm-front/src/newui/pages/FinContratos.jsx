import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const ANO_ATUAL = new Date().getFullYear();
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
function fmtMoney(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return String(d);
  }
}

export default function FinContratos() {
  const [contratos, setContratos] = useState([]);
  const [anoLetivo, setAnoLetivo] = useState(ANO_ATUAL);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [modalNovo, setModalNovo] = useState(false);

  const load = () => {
    setLoading(true);
    setErro("");
    api
      .get(`/fin/contratos?anoLetivo=${anoLetivo}`)
      .then((r) => setContratos(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar contratos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [anoLetivo]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return contratos;
    return contratos.filter((c) =>
      `${c.alunoNome || ""} ${c.responsavelPrincipalNome || ""} ${c.serieNome || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [contratos, busca]);

  const totalAnual = useMemo(
    () => contratos.reduce((s, c) => s + Number(c.valorTotal || 0), 0),
    [contratos]
  );

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
          <input
            className="input"
            type="number"
            value={anoLetivo}
            onChange={(e) => setAnoLetivo(Number(e.target.value))}
          />
        </div>
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
              <th style={{ width: 80, textAlign: "right" }}>Parcelas</th>
              <th style={{ width: 130, textAlign: "right" }}>Valor anual</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtrados.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  Nenhum contrato encontrado.
                </td>
              </tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className="row-link" onClick={() => setDrawer(c.id)}>
                <td>
                  <span className={`avatar ${avatarColor(c.alunoId)}`}>{iniciais(c.alunoNome)}</span>
                </td>
                <td>
                  <span className="strong">{c.alunoNome}</span>
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-2)" }}>
                  {c.responsavelPrincipalNome}
                </td>
                <td>{c.serieNome}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {fmtMoney(c.valorMensal)}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {c.numParcelas}
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  <strong>{fmtMoney(c.valorTotal)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <ContratoDrawer
          contratoId={drawer}
          onClose={() => setDrawer(null)}
          onChanged={() => {
            setDrawer(null);
            load();
          }}
        />
      )}

      {modalNovo && (
        <NovoContratoModal
          anoLetivo={anoLetivo}
          onClose={() => setModalNovo(false)}
          onSaved={() => {
            setModalNovo(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function ContratoDrawer({ contratoId, onClose, onChanged }) {
  const [c, setC] = useState(null);
  const [erro, setErro] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    api
      .get(`/fin/contratos/${contratoId}`)
      .then((r) => setC(r.data))
      .catch(() => setErro("Erro ao carregar contrato."));
  }, [contratoId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const cancelar = async () => {
    try {
      await api.delete(`/fin/contratos/${contratoId}`);
      onChanged();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao cancelar.");
      setConfirmCancel(false);
    }
  };

  if (!c) {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <aside className="drawer" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-body">{erro || "carregando…"}</div>
        </aside>
      </div>
    );
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <span className={`avatar lg ${avatarColor(c.alunoId)}`}>{iniciais(c.alunoNome)}</span>
            <div>
              <div className="card-eyebrow">Contrato {c.anoLetivo}</div>
              <div className="modal-title">{c.alunoNome}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {c.serieNome} · {c.numParcelas} parcelas
              </div>
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="drawer-body">
          <section style={{ marginBottom: 14 }}>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Valores</div>
            <div className="card" style={{ padding: 12 }}>
              <Row label="Valor base" value={fmtMoney(c.valorBase)} />
              <Row label="Desconto" value={fmtMoney(c.desconto)} />
              <Row label="Acréscimo" value={fmtMoney(c.acrescimo)} />
              <Row label="Mensalidade" value={fmtMoney(c.valorMensal)} strong />
              <Row label="Total anual" value={fmtMoney(c.valorTotal)} strong />
            </div>
          </section>

          <section style={{ marginBottom: 14 }}>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Responsáveis</div>
            <div className="card" style={{ padding: 12 }}>
              <Row label="Principal" value={c.responsavelPrincipalNome} />
              {c.responsavelSecundarioNome && (
                <Row label="Secundário" value={c.responsavelSecundarioNome} />
              )}
            </div>
          </section>

          <section>
            <div className="card-eyebrow" style={{ marginBottom: 6 }}>Parcelas</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>#</th>
                    <th>Vencimento</th>
                    <th style={{ textAlign: "right" }}>Valor</th>
                    <th style={{ textAlign: "right" }}>Pago</th>
                    <th style={{ width: 90 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(c.parcelas || []).map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        {p.numParcela}/{p.totalParcelas}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        {fmtDate(p.dataVencimento)}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        {fmtMoney(p.valor)}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        {fmtMoney(p.valorPago)}
                      </td>
                      <td>
                        <StatusPill s={p.status} />
                      </td>
                    </tr>
                  ))}
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
                <button className="btn" type="button" onClick={() => setConfirmCancel(false)}>
                  Voltar
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={cancelar}
                  style={{ background: "var(--bad)", borderColor: "var(--bad)", color: "#fff" }}
                >
                  Cancelar contrato
                </button>
              </div>
            </div>
          ) : (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <button className="btn" type="button" onClick={() => setConfirmCancel(true)} style={{ color: "var(--bad)" }}>
                Cancelar contrato
              </button>
              <button className="btn" type="button" onClick={onClose}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{label}</span>
      <span className={strong ? "strong" : ""} style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
        {value}
      </span>
    </div>
  );
}

function StatusPill({ s }) {
  const map = {
    PAGO: { bg: "var(--ok)", t: "Pago" },
    PENDENTE: { bg: "var(--warn, #d97706)", t: "Pendente" },
    VENCIDO: { bg: "var(--bad)", t: "Vencido" },
    CANCELADO: { bg: "var(--ink-3)", t: "Cancelado" },
  };
  const v = map[s] || { bg: "var(--ink-3)", t: s };
  return (
    <span className="pill" style={{ background: v.bg, color: "#fff", fontSize: 10 }}>
      {v.t}
    </span>
  );
}

function NovoContratoModal({ anoLetivo, onClose, onSaved }) {
  const [alunos, setAlunos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [series, setSeries] = useState([]);

  const [alunoId, setAlunoId] = useState("");
  const [responsavelPrincipalId, setRespId] = useState("");
  const [serieId, setSerieId] = useState("");
  const [valorBase, setValorBase] = useState("");
  const [desconto, setDesconto] = useState("0");
  const [acrescimo, setAcrescimo] = useState("0");
  const [numParcelas, setNumParcelas] = useState("12");
  const [diaVencimento, setDiaVencimento] = useState("10");

  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/usuarios").catch(() => ({ data: [] })),
      api.get("/fin/pessoas").catch(() => ({ data: [] })),
      api.get("/turmas/series").catch(() => ({ data: [] })),
    ]).then(([u, p, s]) => {
      setAlunos(
        (Array.isArray(u.data) ? u.data : [])
          .filter((x) => x.role === "ALUNO")
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
      );
      setResponsaveis(
        (Array.isArray(p.data) ? p.data : [])
          .filter((x) => x.tipoPessoa === "FISICA" && x.ativo !== false)
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
      );
      setSeries(Array.isArray(s.data) ? s.data : []);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!alunoId || !responsavelPrincipalId || !serieId) {
      setErro("Preencha aluno, responsável e série.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        alunoId: Number(alunoId),
        responsavelPrincipalId: Number(responsavelPrincipalId),
        serieId: Number(serieId),
        anoLetivo,
        desconto: Number(desconto || 0),
        acrescimo: Number(acrescimo || 0),
        numParcelas: Number(numParcelas),
        diaVencimento: Number(diaVencimento),
      };
      if (valorBase) body.valorBase = Number(valorBase);
      await api.post("/fin/contratos", body);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 640 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Novo contrato — {anoLetivo}</div>
            <div className="modal-title">Cadastrar contrato de matrícula</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Aluno</label>
              <select className="input" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
                <option value="">— selecione —</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Série</label>
              <select className="input" value={serieId} onChange={(e) => setSerieId(e.target.value)}>
                <option value="">— selecione —</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Responsável principal</label>
            <select className="input" value={responsavelPrincipalId} onChange={(e) => setRespId(e.target.value)}>
              <option value="">— selecione —</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Valor base mensal (opcional)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={valorBase}
                onChange={(e) => setValorBase(e.target.value)}
                placeholder="usar valor da série"
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Desconto</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Acréscimo</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={acrescimo}
                onChange={(e) => setAcrescimo(e.target.value)}
              />
            </div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Nº de parcelas</label>
              <input
                className="input"
                type="number"
                min="1"
                max="60"
                value={numParcelas}
                onChange={(e) => setNumParcelas(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Dia de vencimento</label>
              <input
                className="input"
                type="number"
                min="1"
                max="28"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
              />
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
