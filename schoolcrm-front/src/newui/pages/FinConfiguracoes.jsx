import { useEffect, useRef, useState } from "react";
import api from "../api";
import Icon from "../Icon";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (v) =>
  v == null ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "geral",      label: "Geral" },
  { id: "pagamentos", label: "Pagamentos" },
  { id: "whatsapp",   label: "WhatsApp" },
  { id: "sicoob",     label: "Sicoob / Boletos" },
];

export default function FinConfiguracoes() {
  const [tab, setTab] = useState("geral");
  const [flash, setFlash] = useState({ msg: "", tipo: "" });

  const showFlash = (msg, tipo = "ok") => {
    setFlash({ msg, tipo });
    setTimeout(() => setFlash({ msg: "", tipo: "" }), 3500);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro</div>
          <h1 className="page-title">Configurações</h1>
          <div className="page-subtitle">Parâmetros do módulo financeiro</div>
        </div>
      </div>

      {flash.msg && (
        <div
          className="card mb-4"
          style={{ borderColor: flash.tipo === "ok" ? "var(--ok)" : "var(--bad)", padding: "10px 16px" }}
        >
          <span style={{ color: flash.tipo === "ok" ? "var(--ok)" : "var(--bad)", fontSize: 13 }}>
            {flash.msg}
          </span>
        </div>
      )}

      {/* Sub-tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--border)",
          marginBottom: 20,
          gap: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: tab === t.id ? "var(--ink)" : "var(--ink-3)",
              borderBottom: tab === t.id ? "2px solid var(--ink)" : "2px solid transparent",
              marginBottom: -2,
              fontFamily: "inherit",
              transition: "color .15s",
            }}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral"      && <TabGeral      onFlash={showFlash} />}
      {tab === "pagamentos" && <TabPagamentos  onFlash={showFlash} />}
      {tab === "whatsapp"   && <TabWhatsapp    onFlash={showFlash} />}
      {tab === "sicoob"     && <TabSicoob      onFlash={showFlash} />}
    </div>
  );
}

// ═══ ABA GERAL ════════════════════════════════════════════════════════════════
function TabGeral({ onFlash }) {
  const [formConfig, setFormConfig] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/fin/configuracoes")
      .then((r) =>
        setFormConfig({
          numParcelasPadrao:   r.data.numParcelasPadrao   ?? 12,
          jurosAtrasoPct:      r.data.jurosAtrasoPct      ?? 0,
          multaAtrasoPct:      r.data.multaAtrasoPct      ?? 0,
          diaVencimentoPadrao: r.data.diaVencimentoPadrao ?? 10,
          mediaMinima:         r.data.mediaMinima         ?? 6,
          freqMinima:          r.data.freqMinima          ?? 75,
        })
      )
      .catch(() => {});
  }, []);

  const fc = (k, v) => setFormConfig((f) => ({ ...f, [k]: v }));

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/fin/configuracoes", {
        numParcelasPadrao:   Number(formConfig.numParcelasPadrao),
        jurosAtrasoPct:      Number(formConfig.jurosAtrasoPct),
        multaAtrasoPct:      Number(formConfig.multaAtrasoPct),
        diaVencimentoPadrao: Number(formConfig.diaVencimentoPadrao),
        mediaMinima:         Number(formConfig.mediaMinima),
        freqMinima:          Number(formConfig.freqMinima),
      });
      onFlash("Configuração salva!");
    } catch (err) {
      onFlash(
        typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.",
        "err"
      );
    } finally {
      setSaving(false);
    }
  };

  const FIELDS = [
    { k: "numParcelasPadrao",   label: "Parcelas padrão",            type: "number" },
    { k: "diaVencimentoPadrao", label: "Dia de vencimento padrão",   type: "number" },
    { k: "jurosAtrasoPct",      label: "Juros por atraso (%)",        type: "number", step: "0.01" },
    { k: "multaAtrasoPct",      label: "Multa por atraso (%)",        type: "number", step: "0.01" },
    { k: "mediaMinima",         label: "Média mínima para aprovação", type: "number", step: "0.1" },
    { k: "freqMinima",          label: "Frequência mínima (%)",       type: "number", step: "0.1" },
  ];

  return (
    <div className="card" style={{ padding: 24, maxWidth: 640 }}>
      <div className="card-eyebrow" style={{ marginBottom: 16 }}>Configuração global</div>
      <form
        onSubmit={salvar}
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
      >
        {FIELDS.map((f) => (
          <div key={f.k} className="field">
            <label>{f.label}</label>
            <input
              className="input"
              type={f.type}
              step={f.step}
              value={formConfig[f.k] ?? ""}
              onChange={(e) => fc(f.k, e.target.value)}
            />
          </div>
        ))}
        <div style={{ gridColumn: "1/-1", marginTop: 4 }}>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Salvar configuração"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ═══ ABA PAGAMENTOS ═══════════════════════════════════════════════════════════
function TabPagamentos({ onFlash }) {
  const [formas, setFormas]           = useState([]);
  const [formForma, setFormForma]     = useState({ nome: "" });
  const [series, setSeries]           = useState([]);
  const [seriesValores, setSeriesValores] = useState({});
  const [anoSeries, setAnoSeries]     = useState(String(new Date().getFullYear()));

  const loadFormas = () =>
    api.get("/fin/formas-pagamento").then((r) => setFormas(Array.isArray(r.data) ? r.data : [])).catch(() => {});

  const loadSeriesValores = (ano) => {
    api
      .get("/turmas/series")
      .then(async (r) => {
        const sers = Array.isArray(r.data) ? r.data : [];
        setSeries(sers);
        const res = await api
          .get("/fin/serie-valores", { params: { anoLetivo: ano } })
          .catch(() => ({ data: [] }));
        const mapa = {};
        (Array.isArray(res.data) ? res.data : []).forEach(
          (sv) => { mapa[sv.serieId] = sv.valorPadrao; }
        );
        setSeriesValores(mapa);
      })
      .catch(() => {});
  };

  useEffect(() => { loadFormas(); loadSeriesValores(anoSeries); }, []);
  useEffect(() => { loadSeriesValores(anoSeries); }, [anoSeries]); // eslint-disable-line react-hooks/exhaustive-deps

  const criarForma = async (e) => {
    e.preventDefault();
    try {
      await api.post("/fin/formas-pagamento", formForma);
      setFormForma({ nome: "" });
      loadFormas();
    } catch (err) {
      onFlash(typeof err.response?.data === "string" ? err.response.data : "Erro.", "err");
    }
  };

  const toggleForma = async (id) => {
    await api.patch(`/fin/formas-pagamento/${id}/status`).catch(() => {});
    loadFormas();
  };

  const deletarForma = async (id) => {
    await api.delete(`/fin/formas-pagamento/${id}`).catch((err) =>
      onFlash(typeof err.response?.data === "string" ? err.response.data : "Erro.", "err")
    );
    loadFormas();
  };

  const salvarValorSerie = async (serieId, valor) => {
    if (!valor && valor !== 0) return;
    try {
      await api.post("/fin/serie-valores", {
        serieId: Number(serieId),
        anoLetivo: Number(anoSeries),
        valorPadrao: Number(valor),
      });
      onFlash("Valor salvo!");
      loadSeriesValores(anoSeries);
    } catch (err) {
      onFlash(typeof err.response?.data === "string" ? err.response.data : "Erro.", "err");
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Formas de pagamento */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-eyebrow" style={{ marginBottom: 12 }}>Formas de pagamento</div>
        <form
          onSubmit={criarForma}
          style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16 }}
        >
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Nova forma</label>
            <input
              className="input"
              value={formForma.nome}
              onChange={(e) => setFormForma({ nome: e.target.value })}
              placeholder="PIX, Dinheiro, Boleto…"
              required
            />
          </div>
          <button className="btn accent" type="submit" style={{ fontSize: 12 }}>
            Adicionar
          </button>
        </form>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {formas.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--ink-3)", padding: 12 }}>
                  Nenhuma forma de pagamento
                </td>
              </tr>
            )}
            {formas.map((f) => (
              <tr key={f.id}>
                <td className="strong">{f.nome}</td>
                <td>
                  <span
                    className="pill"
                    style={{
                      background: f.ativo ? "var(--ok-bg)" : "var(--bad-bg)",
                      color: f.ativo ? "var(--ok)" : "var(--bad)",
                      fontSize: 10,
                    }}
                  >
                    {f.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="btn"
                      type="button"
                      style={{ fontSize: 11 }}
                      onClick={() => toggleForma(f.id)}
                    >
                      {f.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      style={{ fontSize: 11, color: "var(--bad)" }}
                      onClick={() => deletarForma(f.id)}
                    >
                      Rem.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Valores por série */}
      <div className="card" style={{ padding: 20 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}
        >
          <div className="card-eyebrow">Mensalidade padrão por série</div>
          <div className="field" style={{ marginBottom: 0, minWidth: 100 }}>
            <label style={{ fontSize: 10 }}>Ano letivo</label>
            <input
              className="input"
              type="number"
              value={anoSeries}
              onChange={(e) => setAnoSeries(e.target.value)}
              style={{ width: 90 }}
            />
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Série</th>
              <th>Valor mensal (R$)</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {series.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--ink-3)", padding: 12 }}>
                  Nenhuma série encontrada
                </td>
              </tr>
            )}
            {series.map((s) => {
              const val = seriesValores[s.id] ?? "";
              return (
                <tr key={s.id}>
                  <td className="strong">{s.nome}</td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      defaultValue={val}
                      key={`sv-${s.id}-${val}`}
                      id={`sv-${s.id}`}
                      placeholder="Não definido"
                      style={{ width: 140 }}
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn"
                      type="button"
                      style={{ fontSize: 11 }}
                      onClick={() => {
                        const el = document.getElementById(`sv-${s.id}`);
                        if (el?.value) salvarValorSerie(s.id, el.value);
                      }}
                    >
                      Salvar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══ ABA WHATSAPP ══════════════════════════════════════════════════════════════
function fmtDH(dt) {
  if (!dt) return "—";
  try { return new Date(dt).toLocaleString("pt-BR"); } catch { return String(dt); }
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: checked ? "var(--ok)" : "var(--border)",
        position: "relative", transition: "background .2s", flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3, left: checked ? 22 : 4, transition: "left .2s",
        }}
      />
    </button>
  );
}

const WPP_TABS = [
  { id: "config",    label: "Configuração" },
  { id: "templates", label: "Templates" },
  { id: "teste",     label: "Teste" },
  { id: "historico", label: "Histórico" },
];

function TabWhatsapp({ onFlash }) {
  const [form, setForm]         = useState({});
  const [loaded, setLoaded]     = useState(false);
  const [dashboard, setDashboard] = useState({});
  const [notifs, setNotifs]     = useState([]);
  const [abaWpp, setAbaWpp]     = useState("config");
  const [saving, setSaving]     = useState(false);
  const [testando, setTestando] = useState(false);
  const [formTeste, setFormTeste] = useState({ telefone: "", mensagem: "" });

  const carregar = () => {
    api.get("/whatsapp/config").then((r) => {
      setForm({
        ativo:                r.data.ativo               ?? false,
        apiUrl:               r.data.apiUrl              || "",
        instanceName:         r.data.instanceName        || "",
        apiKey:               r.data.apiKey              || "",
        diasAntesPrimeiro:    r.data.diasAntesPrimeiro   ?? 3,
        diasAntesSegundo:     r.data.diasAntesSegundo    ?? 1,
        horaEnvio:            r.data.horaEnvio           ?? 8,
        templateMensagem:     r.data.templateMensagem    || "",
        templateVencido:      r.data.templateVencido     || "",
        notificarVencidos:    r.data.notificarVencidos   ?? false,
      });
      setLoaded(true);
    }).catch(() => {
      setForm({
        ativo: false, apiUrl: "", instanceName: "", apiKey: "",
        diasAntesPrimeiro: 3, diasAntesSegundo: 1, horaEnvio: 8,
        templateMensagem: "", templateVencido: "", notificarVencidos: false,
      });
      setLoaded(true);
    });
    api.get("/whatsapp/dashboard").then((r) => setDashboard(r.data || {})).catch(() => {});
  };

  const carregarNotifs = () =>
    api.get("/whatsapp/notificacoes").then((r) => setNotifs(Array.isArray(r.data) ? r.data : [])).catch(() => {});

  useEffect(() => { carregar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (abaWpp === "historico") carregarNotifs(); }, [abaWpp]); // eslint-disable-line react-hooks/exhaustive-deps

  const ff = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/whatsapp/config", {
        ...form,
        diasAntesPrimeiro: Number(form.diasAntesPrimeiro),
        diasAntesSegundo:  Number(form.diasAntesSegundo),
        horaEnvio:         Number(form.horaEnvio),
      });
      onFlash("Configuração WhatsApp salva!");
      carregar();
    } catch (err) {
      onFlash(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.", "err");
    } finally {
      setSaving(false);
    }
  };

  const testarConexao = async () => {
    setTestando(true);
    try {
      const r = await api.post("/whatsapp/testar-conexao");
      if (r.data.status === "ok") onFlash("Conexão OK! " + (r.data.detalhe || ""));
      else onFlash("Falha: " + (r.data.detalhe || ""), "err");
    } catch (err) {
      const d = err.response?.data;
      onFlash("Erro: " + (typeof d === "object" ? d.detalhe || JSON.stringify(d) : d || "Falha"), "err");
    } finally {
      setTestando(false);
    }
  };

  const enviarTeste = async (e) => {
    e.preventDefault();
    if (!formTeste.telefone.trim()) { onFlash("Informe o telefone.", "err"); return; }
    try {
      await api.post("/whatsapp/enviar-teste", formTeste);
      onFlash("Mensagem de teste enviada!");
    } catch (err) {
      const d = err.response?.data;
      onFlash("Erro: " + (typeof d === "object" ? d.detalhe || JSON.stringify(d) : d || "Falha"), "err");
    }
  };

  const dispararAgora = async () => {
    try {
      await api.post("/whatsapp/disparar-agora");
      onFlash("Job executado! Verifique o histórico.");
      carregarNotifs();
    } catch {
      onFlash("Erro ao disparar job.", "err");
    }
  };

  if (!loaded) return <div style={{ color: "var(--ink-3)", padding: 24 }}>Carregando…</div>;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* header */}
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            WhatsApp — Lembretes Automáticos
          </span>
          <span
            className="pill"
            style={{
              background: form.ativo ? "var(--ok-bg)" : "var(--bad-bg)",
              color: form.ativo ? "var(--ok)" : "var(--bad)",
              fontSize: 10,
            }}
          >
            {form.ativo ? "ATIVO" : "INATIVO"}
          </span>
        </div>
        {(dashboard.enviadasHoje > 0 || dashboard.enviadasMes > 0) && (
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
            Hoje: {dashboard.enviadasHoje ?? 0} · Mês: {dashboard.enviadasMes ?? 0}
          </span>
        )}
      </div>

      {/* sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        {WPP_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 14px", fontSize: 12, fontWeight: 600,
              color: abaWpp === t.id ? "var(--ink)" : "var(--ink-3)",
              borderBottom: abaWpp === t.id ? "2px solid var(--ink)" : "2px solid transparent",
              marginBottom: -1, fontFamily: "inherit",
            }}
            onClick={() => setAbaWpp(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* ── Configuração ── */}
        {abaWpp === "config" && (
          <form onSubmit={salvar} style={{ display: "grid", gap: 16, maxWidth: 580 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Ativar envio automático
              <Toggle checked={form.ativo} onChange={(v) => ff("ativo", v)} />
            </label>

            <div
              style={{
                fontSize: 11, color: "var(--ink-3)",
                background: "rgba(37,99,235,.06)",
                padding: "10px 14px", borderRadius: 6,
              }}
            >
              Integração via <strong>Evolution API</strong> (gratuita, self-hosted).
              Configure a URL, instância e API Key da sua Evolution API.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="field">
                <label>URL da Evolution API</label>
                <input
                  className="input"
                  value={form.apiUrl}
                  onChange={(e) => ff("apiUrl", e.target.value)}
                  placeholder="https://evo.meusite.com"
                />
              </div>
              <div className="field">
                <label>Nome da instância</label>
                <input
                  className="input"
                  value={form.instanceName}
                  onChange={(e) => ff("instanceName", e.target.value)}
                  placeholder="schoolcrm"
                />
              </div>
            </div>

            <div className="field">
              <label>API Key</label>
              <input
                className="input"
                type="password"
                value={form.apiKey}
                onChange={(e) => ff("apiKey", e.target.value)}
                placeholder="Chave da instância"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div className="field">
                <label>1º lembrete (dias antes)</label>
                <input className="input" type="number" min="1" max="30"
                  value={form.diasAntesPrimeiro ?? ""} onChange={(e) => ff("diasAntesPrimeiro", e.target.value)} />
              </div>
              <div className="field">
                <label>2º lembrete (dias antes)</label>
                <input className="input" type="number" min="1" max="30"
                  value={form.diasAntesSegundo ?? ""} onChange={(e) => ff("diasAntesSegundo", e.target.value)} />
              </div>
              <div className="field">
                <label>Horário de envio (h)</label>
                <input className="input" type="number" min="0" max="23"
                  value={form.horaEnvio ?? ""} onChange={(e) => ff("horaEnvio", e.target.value)} />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, cursor: "pointer" }}>
              Notificar boletos vencidos
              <Toggle checked={form.notificarVencidos} onChange={(v) => ff("notificarVencidos", v)} />
            </label>

            <div className="row" style={{ gap: 8 }}>
              <button className="btn accent" type="submit" disabled={saving}>
                {saving ? "salvando…" : "Salvar configuração"}
              </button>
              <button className="btn" type="button" onClick={testarConexao} disabled={testando}>
                {testando ? "testando…" : "Testar conexão"}
              </button>
            </div>
          </form>
        )}

        {/* ── Templates ── */}
        {abaWpp === "templates" && (
          <form onSubmit={salvar} style={{ display: "grid", gap: 16, maxWidth: 580 }}>
            <div
              style={{
                fontSize: 11, color: "var(--ink-3)",
                background: "rgba(37,99,235,.06)",
                padding: "10px 14px", borderRadius: 6,
              }}
            >
              Variáveis: <code>{"{nome}"}</code> <code>{"{valor}"}</code> <code>{"{vencimento}"}</code>{" "}
              <code>{"{descricao}"}</code> <code>{"{diasAtraso}"}</code> — Use <code>*texto*</code> para <strong>negrito</strong>.
            </div>

            <div className="field">
              <label>Template — Lembrete (antes do vencimento)</label>
              <textarea
                className="input"
                rows={5}
                value={form.templateMensagem}
                onChange={(e) => ff("templateMensagem", e.target.value)}
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            {form.templateMensagem && (
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>Preview</div>
                <div
                  style={{
                    background: "#dcf8c6", padding: "12px 16px",
                    borderRadius: "8px 8px 0 8px", fontSize: 13,
                    lineHeight: 1.6, color: "#111", maxWidth: 400, whiteSpace: "pre-wrap",
                  }}
                >
                  {form.templateMensagem
                    .replace("{nome}", "Maria da Silva")
                    .replace("{valor}", "450,00")
                    .replace("{vencimento}", "25/03/2026")
                    .replace("{descricao}", "Mensalidade Mar/2026")
                    .replace("{diasAtraso}", "0")}
                </div>
              </div>
            )}

            <div className="field">
              <label>Template — Boleto vencido</label>
              <textarea
                className="input"
                rows={5}
                value={form.templateVencido}
                onChange={(e) => ff("templateVencido", e.target.value)}
                style={{ resize: "vertical", lineHeight: 1.6 }}
              />
            </div>

            <div>
              <button className="btn accent" type="submit" disabled={saving}>
                {saving ? "salvando…" : "Salvar templates"}
              </button>
            </div>
          </form>
        )}

        {/* ── Teste ── */}
        {abaWpp === "teste" && (
          <div style={{ display: "grid", gap: 16, maxWidth: 480 }}>
            <div
              style={{
                fontSize: 11, color: "var(--ink-3)",
                background: "rgba(37,99,235,.06)",
                padding: "10px 14px", borderRadius: 6,
              }}
            >
              Envie uma mensagem de teste para verificar a conexão.
            </div>
            <form onSubmit={enviarTeste} style={{ display: "grid", gap: 14 }}>
              <div className="field">
                <label>Telefone (com DDD) *</label>
                <input
                  className="input"
                  value={formTeste.telefone}
                  onChange={(e) => setFormTeste((f) => ({ ...f, telefone: e.target.value }))}
                  placeholder="(62) 99999-9999"
                  required
                />
              </div>
              <div className="field">
                <label>Mensagem (opcional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formTeste.mensagem}
                  onChange={(e) => setFormTeste((f) => ({ ...f, mensagem: e.target.value }))}
                  placeholder="Deixe vazio para mensagem padrão de teste"
                  style={{ resize: "vertical" }}
                />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn accent" type="submit" style={{ fontSize: 12 }}>
                  Enviar teste
                </button>
                <button className="btn" type="button" style={{ fontSize: 12 }} onClick={dispararAgora}>
                  Disparar lembretes agora
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Histórico ── */}
        {abaWpp === "historico" && (
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Últimas 100 notificações</span>
              <button className="btn" type="button" style={{ fontSize: 11 }} onClick={carregarNotifs}>
                Atualizar
              </button>
            </div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Pessoa</th>
                    <th>Telefone</th>
                    <th>Boleto</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {notifs.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: 24 }}>
                        Nenhuma notificação enviada ainda
                      </td>
                    </tr>
                  )}
                  {notifs.map((n) => (
                    <tr key={n.id}>
                      <td style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                        {fmtDH(n.enviadoEm)}
                      </td>
                      <td className="strong" style={{ fontSize: 12 }}>{n.pessoaNome || "—"}</td>
                      <td style={{ fontSize: 11, color: "var(--ink-3)" }}>{n.telefone}</td>
                      <td style={{ fontSize: 11 }}>{n.crDescricao || "—"}</td>
                      <td>
                        <span
                          className="pill"
                          style={{
                            background: n.tipo === "VENCIDO" ? "var(--bad-bg)" : "rgba(37,99,235,.1)",
                            color: n.tipo === "VENCIDO" ? "var(--bad)" : "#2563eb",
                            fontSize: 9,
                          }}
                        >
                          {n.tipo}
                        </span>
                      </td>
                      <td>
                        <span
                          className="pill"
                          style={{
                            background: n.status === "ENVIADO" ? "var(--ok-bg)" : "var(--bad-bg)",
                            color: n.status === "ENVIADO" ? "var(--ok)" : "var(--bad)",
                            fontSize: 9,
                          }}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 10, color: "var(--bad)", maxWidth: 180,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}
                        title={n.erroDetalhe || ""}
                      >
                        {n.erroDetalhe || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ ABA SICOOB ════════════════════════════════════════════════════════════════
function TabSicoob({ onFlash }) {
  const [sicoobConfig, setSicoobConfig]   = useState(null);
  const [sicoobForm, setSicoobForm]       = useState({});
  const [sicoobTestResult, setSicoobTestResult] = useState(null);
  const [salvandoSicoob, setSalvandoSicoob] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certSenha, setCertSenha]         = useState("");
  const [certTipo, setCertTipo]           = useState("PFX");
  const [showSecrets, setShowSecrets]     = useState({});

  const [convenios, setConvenios]         = useState([]);
  const [convModal, setConvModal]         = useState(null); // null | { modo, dados? }
  const [convForm, setConvForm]           = useState({});
  const [salvandoConv, setSalvandoConv]   = useState(false);

  const certInputRef = useRef();

  const carregarSicoob = () => {
    api
      .get("/fin/sicoob-config")
      .then((r) => {
        setSicoobConfig(r.data);
        setSicoobForm({
          ambiente:                  r.data.ambiente                  || "SANDBOX",
          clientId:                  r.data.clientId                  || "",
          clientSecret:              r.data.clientSecret              || "",
          accessToken:               r.data.accessToken               || "",
          numeroBeneficiario:        r.data.numeroBeneficiario        || "",
          numeroContratoCobranca:    r.data.numeroContratoCobranca    || "",
          cooperativa:               r.data.cooperativa               || "",
          contaCorrente:             r.data.contaCorrente             || "",
          digitoConta:               r.data.digitoConta               || "",
          agencia:                   r.data.agencia                   || "",
          digitoAgencia:             r.data.digitoAgencia             || "",
          codigoBancoCorrespondente: r.data.codigoBancoCorrespondente || "",
          codigoContaEmpresa:        r.data.codigoContaEmpresa        || "",
          emiteBoletos:              r.data.emiteBoletos              ?? true,
          recebePix:                 r.data.recebePix                 ?? false,
          webhookSecret:             r.data.webhookSecret             || "",
          baseUrl:                   r.data.baseUrl                   || "",
          tokenUrl:                  r.data.tokenUrl                  || "",
          modalidade:                r.data.modalidade                ?? 1,
          especieDocumento:          r.data.especieDocumento          || "DM",
          aceite:                    r.data.aceite                    ?? false,
        });
      })
      .catch(() => {
        setSicoobConfig({ ativo: false, ambiente: "SANDBOX", temCertificado: false });
        setSicoobForm({
          ambiente: "SANDBOX", clientId: "", clientSecret: "", accessToken: "",
          numeroBeneficiario: "", numeroContratoCobranca: "", cooperativa: "", contaCorrente: "",
          digitoConta: "", agencia: "", digitoAgencia: "", codigoBancoCorrespondente: "",
          codigoContaEmpresa: "", emiteBoletos: true, recebePix: false,
          webhookSecret: "",
          baseUrl: "https://sandbox.sicoob.com.br/sicoob/sandbox/cobranca-bancaria/v3",
          tokenUrl: "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token",
          modalidade: 1, especieDocumento: "DM", aceite: false,
        });
      });
    api
      .get("/fin/sicoob-config/convenios")
      .then((r) => setConvenios(Array.isArray(r.data) ? r.data : []))
      .catch(() => setConvenios([]));
  };

  useEffect(() => { carregarSicoob(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sfc = (k, v) => setSicoobForm((f) => ({ ...f, [k]: v }));

  const salvarSicoob = async (e) => {
    e.preventDefault();
    setSalvandoSicoob(true);
    try {
      const res = await api.put("/fin/sicoob-config", sicoobForm);
      setSicoobConfig(res.data);
      onFlash("Configuração Sicoob salva!");
    } catch (err) {
      onFlash(err.response?.data?.erro || "Erro ao salvar.", "err");
    } finally {
      setSalvandoSicoob(false);
    }
  };

  const toggleSicoob = async () => {
    try {
      const res = await api.put("/fin/sicoob-config", { ativo: !sicoobConfig?.ativo });
      setSicoobConfig(res.data);
      onFlash(res.data.ativo ? "Integração ativada!" : "Integração desativada.");
    } catch (err) {
      onFlash(err.response?.data?.erro || "Erro.", "err");
    }
  };

  const uploadCertificado = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCert(true);
    try {
      const fd = new FormData();
      fd.append("arquivo", file);
      fd.append("tipo", certTipo);
      if (certSenha) fd.append("senha", certSenha);
      const res = await api.post("/fin/sicoob-config/certificado", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSicoobConfig(res.data);
      setCertSenha("");
      onFlash("Certificado enviado!");
    } catch (err) {
      onFlash(err.response?.data?.erro || "Erro no upload.", "err");
    } finally {
      setUploadingCert(false);
      e.target.value = "";
    }
  };

  const removerCertificado = async () => {
    try {
      const res = await api.delete("/fin/sicoob-config/certificado");
      setSicoobConfig(res.data);
      onFlash("Certificado removido.");
    } catch (err) {
      onFlash(err.response?.data?.erro || "Erro.", "err");
    }
  };

  const testarConexao = async () => {
    try {
      const res = await api.get("/fin/sicoob-config/testar");
      setSicoobTestResult(res.data);
    } catch {
      onFlash("Erro ao testar.", "err");
    }
  };

  // ── convênios ──
  const abrirConvCriar = () => {
    setConvForm({
      cnab: 240, numero: "", descricao: "", situacao: "ATIVA",
      numeroCarteira: "", codigoCarteira: "", nossoNumeroPeloBanco: false,
      nossoNumeroAtual: "", percentualJuros: "0.00", percentualMulta: "0.00",
      percentualDesconto: "0.00", apiId: "", modalidade: 1,
      especieDocumento: "DM", aceite: false, mensagens: "",
    });
    setConvModal({ modo: "criar" });
  };

  const abrirConvEditar = (c) => {
    setConvForm({ ...c });
    setConvModal({ modo: "editar", dados: c });
  };

  const cfc = (k, v) => setConvForm((f) => ({ ...f, [k]: v }));

  const salvarConvenio = async (e) => {
    e.preventDefault();
    setSalvandoConv(true);
    try {
      if (convModal.modo === "editar") {
        await api.put(`/fin/sicoob-config/convenios/${convModal.dados.id}`, convForm);
      } else {
        await api.post("/fin/sicoob-config/convenios", convForm);
      }
      onFlash(convModal.modo === "editar" ? "Convênio atualizado!" : "Convênio criado!");
      setConvModal(null);
      carregarSicoob();
    } catch (err) {
      onFlash(err.response?.data?.erro || "Erro ao salvar convênio.", "err");
    } finally {
      setSalvandoConv(false);
    }
  };

  const deletarConvenio = async (id) => {
    await api.delete(`/fin/sicoob-config/convenios/${id}`).catch((err) =>
      onFlash(err.response?.data?.erro || "Erro.", "err")
    );
    carregarSicoob();
  };

  if (!sicoobConfig) return <div style={{ color: "var(--ink-3)", padding: 24 }}>Carregando…</div>;

  return (
    <div style={{ display: "grid", gap: 20 }}>

      {/* Status header */}
      <div className="card" style={{ padding: "14px 20px" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            Integração Sicoob — Boletos Híbridos
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span
              className="pill"
              style={{
                background: sicoobConfig.ativo ? "var(--ok-bg)" : "var(--bad-bg)",
                color: sicoobConfig.ativo ? "var(--ok)" : "var(--bad)",
                fontSize: 10,
              }}
            >
              {sicoobConfig.ativo ? "ATIVA" : "INATIVA"}
            </span>
            {sicoobConfig.ambiente && (
              <span
                className="pill"
                style={{
                  background:
                    sicoobConfig.ambiente === "PRODUCAO"
                      ? "var(--bad-bg)"
                      : "rgba(37,99,235,.1)",
                  color:
                    sicoobConfig.ambiente === "PRODUCAO" ? "var(--bad)" : "#2563eb",
                  fontSize: 10,
                }}
              >
                {sicoobConfig.ambiente}
              </span>
            )}
          </div>
        </div>

        {/* Status tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
            marginTop: 12,
          }}
        >
          {[
            { label: "Client ID",    ok: !!sicoobConfig.clientId },
            { label: "Access Token", ok: !!sicoobConfig.accessToken },
            { label: "Beneficiário", ok: !!sicoobConfig.numeroBeneficiario },
            { label: "Convênio",     ok: convenios.some((c) => c.situacao === "ATIVA") },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                padding: "10px 14px",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--panel)",
              }}
            >
              <div style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 4 }}>
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: c.ok ? "var(--ok)" : "var(--bad)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.ok ? "var(--ok)" : "var(--bad)",
                    display: "inline-block",
                  }}
                />
                {c.ok ? "Configurado" : "Pendente"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conta bancária + OAuth2 form */}
      <form className="card" style={{ padding: 24 }} onSubmit={salvarSicoob}>
        <div
          className="card-eyebrow"
          style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}
        >
          Dados da conta bancária
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field" style={{ gridColumn: "1/-1" }}>
            <label>Banco</label>
            <input
              className="input"
              value="Sicoob — Banco Cooperativo do Brasil S.A. (756)"
              disabled
              style={{ color: "var(--ink-3)" }}
            />
          </div>
          {[
            { k: "contaCorrente",      label: "Nº Conta *" },
            { k: "digitoConta",        label: "Dígito conta", style: { maxWidth: 100 } },
            { k: "agencia",            label: "Agência *" },
            { k: "digitoAgencia",      label: "Dígito agência", style: { maxWidth: 100 } },
            { k: "numeroBeneficiario", label: "Código beneficiário *" },
            { k: "cooperativa",        label: "Cooperativa" },
            { k: "codigoBancoCorrespondente", label: "Cód. banco correspondente" },
            { k: "codigoContaEmpresa",  label: "Cód. conta empresa" },
          ].map(({ k, label, style: st }) => (
            <div key={k} className="field" style={st}>
              <label>{label}</label>
              <input
                className="input"
                value={sicoobForm[k] || ""}
                onChange={(e) => sfc(k, e.target.value)}
              />
            </div>
          ))}
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={sicoobForm.emiteBoletos ?? true}
                onChange={(e) => sfc("emiteBoletos", e.target.checked)}
              />
              Emite boletos
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={sicoobForm.recebePix ?? false}
                onChange={(e) => sfc("recebePix", e.target.checked)}
              />
              Recebe PIX
            </label>
          </div>
        </div>

        <div className="card-eyebrow" style={{ margin: "20px 0 12px" }}>
          Credenciais OAuth2
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="field">
            <label>Ambiente</label>
            <select
              className="input"
              value={sicoobForm.ambiente || "SANDBOX"}
              onChange={(e) => sfc("ambiente", e.target.value)}
            >
              <option value="SANDBOX">Sandbox (Homologação)</option>
              <option value="PRODUCAO">Produção</option>
            </select>
          </div>
          <div className="field">
            <label>Client ID</label>
            <input
              className="input"
              value={sicoobForm.clientId || ""}
              onChange={(e) => sfc("clientId", e.target.value)}
              placeholder="Fornecido pelo Sicoob"
            />
          </div>
          {[
            { k: "clientSecret",   label: "Client Secret",  secret: "clientSecret" },
            { k: "accessToken",    label: "Access Token",   secret: "accessToken",   span: true, hint: "sandbox: gerado no portal · produção: renovado automaticamente" },
            { k: "webhookSecret",  label: "Webhook Secret", secret: "webhook" },
          ].map(({ k, label, secret, span, hint }) => (
            <div key={k} className="field" style={span ? { gridColumn: "1/-1" } : {}}>
              <label>
                {label}
                {hint && <span style={{ fontWeight: 400, fontSize: 10, color: "var(--ink-3)", marginLeft: 6 }}>({hint})</span>}
              </label>
              <div className="row" style={{ gap: 6 }}>
                <input
                  className="input"
                  style={{ flex: 1 }}
                  type={showSecrets[secret] ? "text" : "password"}
                  value={sicoobForm[k] || ""}
                  onChange={(e) => sfc(k, e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="btn"
                  style={{ fontSize: 11, whiteSpace: "nowrap" }}
                  onClick={() => setShowSecrets((s) => ({ ...s, [secret]: !s[secret] }))}
                >
                  {showSecrets[secret] ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          ))}
          <div className="field">
            <label>Base URL</label>
            <input
              className="input"
              value={sicoobForm.baseUrl || ""}
              onChange={(e) => sfc("baseUrl", e.target.value)}
              style={{ fontSize: 11 }}
            />
          </div>
          <div className="field">
            <label>Token URL</label>
            <input
              className="input"
              value={sicoobForm.tokenUrl || ""}
              onChange={(e) => sfc("tokenUrl", e.target.value)}
              style={{ fontSize: 11 }}
            />
          </div>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 16 }}>
          <button className="btn accent" type="submit" disabled={salvandoSicoob}>
            {salvandoSicoob ? "salvando…" : "Salvar conta"}
          </button>
          <button className="btn" type="button" onClick={testarConexao}>
            Testar configuração
          </button>
          <button
            className="btn"
            type="button"
            style={{ color: sicoobConfig.ativo ? "var(--bad)" : "var(--ok)" }}
            onClick={toggleSicoob}
          >
            {sicoobConfig.ativo ? "Desativar integração" : "Ativar integração"}
          </button>
        </div>

        {/* Resultado do teste */}
        {sicoobTestResult && (
          <div
            className="card"
            style={{ marginTop: 14, padding: 14, background: "var(--panel)" }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 10,
                color: sicoobTestResult.prontoParaHomologacao ? "var(--ok)" : "var(--bad)",
              }}
            >
              {sicoobTestResult.prontoParaHomologacao
                ? "Pronto para homologação!"
                : "Configuração incompleta"}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 6,
              }}
            >
              {Object.entries(sicoobTestResult)
                .filter(([k]) => !["prontoParaHomologacao", "ambiente", "ativo"].includes(k))
                .map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      fontSize: 11,
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 8px",
                      background: "var(--bg)",
                      borderRadius: 3,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ color: "var(--ink-3)" }}>{k}</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: String(v).startsWith("OK")
                          ? "var(--ok)"
                          : String(v).startsWith("FALHA") || String(v) === "AUSENTE"
                          ? "var(--bad)"
                          : "var(--ink)",
                      }}
                    >
                      {String(v).length > 50 ? String(v).slice(0, 50) + "…" : String(v)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </form>

      {/* Certificado digital */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-eyebrow" style={{ marginBottom: 12 }}>
          Certificado digital (mTLS)
        </div>
        {sicoobConfig.temCertificado ? (
          <div
            style={{
              padding: "12px 16px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--panel)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="strong" style={{ fontSize: 13 }}>
                {sicoobConfig.certNomeArquivo}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                Tipo: {sicoobConfig.certTipo}
                {sicoobConfig.certValidade && (
                  <span>
                    {" · "}Validade:{" "}
                    {new Date(sicoobConfig.certValidade).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <label className="btn" style={{ cursor: "pointer" }}>
                Substituir
                <input
                  type="file"
                  accept=".pfx,.p12,.pem,.crt,.cer"
                  onChange={uploadCertificado}
                  hidden
                />
              </label>
              <button
                className="btn"
                type="button"
                style={{ color: "var(--bad)" }}
                onClick={removerCertificado}
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              border: "2px dashed var(--border)",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12 }}>
              Envie o certificado digital fornecido pelo Sicoob (.pfx, .p12 ou .pem)
            </div>
            <div
              className="row"
              style={{ gap: 12, justifyContent: "center", alignItems: "flex-end", flexWrap: "wrap" }}
            >
              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 10 }}>Tipo</label>
                <select
                  className="input"
                  value={certTipo}
                  onChange={(e) => setCertTipo(e.target.value)}
                  style={{ width: 110 }}
                >
                  <option value="PFX">PFX / P12</option>
                  <option value="PEM">PEM / CRT</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 10 }}>Senha (se houver)</label>
                <input
                  className="input"
                  type="password"
                  value={certSenha}
                  onChange={(e) => setCertSenha(e.target.value)}
                  placeholder="Opcional"
                  style={{ width: 140 }}
                />
              </div>
              <label className="btn accent" style={{ cursor: "pointer" }}>
                {uploadingCert ? "enviando…" : "+ Enviar certificado"}
                <input
                  ref={certInputRef}
                  type="file"
                  accept=".pfx,.p12,.pem,.crt,.cer"
                  onChange={uploadCertificado}
                  hidden
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Convênios */}
      <div className="card" style={{ padding: 20 }}>
        <div
          className="row"
          style={{ justifyContent: "space-between", marginBottom: 12 }}
        >
          <div className="card-eyebrow">Convênios de cobrança</div>
          <button className="btn" type="button" style={{ fontSize: 11 }} onClick={abrirConvCriar}>
            + Novo convênio
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Descrição</th>
              <th>Situação</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {convenios.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: 12 }}>
                  Nenhum convênio
                </td>
              </tr>
            )}
            {convenios.map((c) => (
              <tr key={c.id}>
                <td className="strong">{c.numero}</td>
                <td style={{ color: "var(--ink-2)" }}>{c.descricao || "—"}</td>
                <td>
                  <span
                    className="pill"
                    style={{
                      background: c.situacao === "ATIVA" ? "var(--ok-bg)" : "var(--bad-bg)",
                      color: c.situacao === "ATIVA" ? "var(--ok)" : "var(--bad)",
                      fontSize: 10,
                    }}
                  >
                    {c.situacao}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="btn"
                      type="button"
                      style={{ fontSize: 11 }}
                      onClick={() => abrirConvEditar(c)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn"
                      type="button"
                      style={{ fontSize: 11, color: "var(--bad)" }}
                      onClick={() => deletarConvenio(c.id)}
                    >
                      Rem.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal convênio */}
      {convModal && (
        <div className="modal-overlay" onClick={() => setConvModal(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvarConvenio}
            style={{ width: 580 }}
          >
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Sicoob</div>
                <div className="modal-title">
                  {convModal.modo === "criar" ? "Novo convênio" : "Editar convênio"}
                </div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setConvModal(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
            >
              {[
                { k: "numero",          label: "Número do convênio *", span: true, required: true },
                { k: "descricao",       label: "Descrição" },
                { k: "numeroCarteira",  label: "Nº carteira" },
                { k: "codigoCarteira",  label: "Cód. carteira" },
                { k: "nossoNumeroAtual", label: "Nosso número atual" },
                { k: "percentualJuros", label: "Juros (%)", type: "number", step: "0.001" },
                { k: "percentualMulta", label: "Multa (%)", type: "number", step: "0.001" },
                { k: "apiId",           label: "API ID" },
              ].map(({ k, label, span, required, type, step }) => (
                <div key={k} className="field" style={span ? { gridColumn: "1/-1" } : {}}>
                  <label>{label}</label>
                  <input
                    className="input"
                    type={type || "text"}
                    step={step}
                    required={required}
                    value={convForm[k] ?? ""}
                    onChange={(e) => cfc(k, e.target.value)}
                  />
                </div>
              ))}
              <div className="field">
                <label>Situação</label>
                <select
                  className="input"
                  value={convForm.situacao || "ATIVA"}
                  onChange={(e) => cfc("situacao", e.target.value)}
                >
                  <option value="ATIVA">Ativa</option>
                  <option value="INATIVA">Inativa</option>
                </select>
              </div>
              <div className="field">
                <label>CNAB</label>
                <select
                  className="input"
                  value={convForm.cnab || 240}
                  onChange={(e) => cfc("cnab", Number(e.target.value))}
                >
                  <option value={240}>CNAB 240</option>
                  <option value={400}>CNAB 400</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setConvModal(null)}>
                Cancelar
              </button>
              <button className="btn accent" type="submit" disabled={salvandoConv}>
                {salvandoConv ? "salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
