import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

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
function thisMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FinDashboard() {
  const [mes, setMes] = useState(thisMonthStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setLoading(true);
    setErro("");
    api
      .get(`/fin/dashboard?mes=${mes}`)
      .then((r) => setData(r.data))
      .catch(() => setErro("Erro ao carregar dashboard."))
      .finally(() => setLoading(false));
  }, [mes]);

  const kpis = data?.kpis || {};
  const grafico = data?.grafico || [];
  const proximos = data?.proximosVencimentos || [];
  const inadimplentes = data?.inadimplentes || [];

  // Escala simples para barras: max receita ou despesa do gráfico
  const maxBar = useMemo(() => {
    let m = 0;
    for (const g of grafico) {
      m = Math.max(m, Number(g.receitas || 0), Number(g.despesas || 0));
    }
    return m || 1;
  }, [grafico]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro · Dashboard</div>
          <h1 className="page-title">Visão geral do mês</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `Mês ${mes}`}
          </div>
        </div>
        <div className="row">
          <input
            className="input"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            style={{ width: 160 }}
          />
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        <KPI label="Receitas no mês" value={fmtMoney(kpis.totalEntradas)} sub={`CR ${fmtMoney(kpis.crRecebidoMes)}`} cor="var(--ok)" />
        <KPI label="Despesas no mês" value={fmtMoney(kpis.totalSaidas)} sub={`CP ${fmtMoney(kpis.cpPagoMes)}`} cor="var(--bad)" />
        <KPI
          label="Saldo do mês"
          value={fmtMoney(kpis.saldoMes)}
          sub={Number(kpis.saldoMes || 0) >= 0 ? "no azul" : "no vermelho"}
          cor={Number(kpis.saldoMes || 0) >= 0 ? "var(--ok)" : "var(--bad)"}
        />
        <KPI label="Inadimplência" value={fmtMoney(kpis.crVencido)} sub="CR vencidos" cor="var(--warn, #d97706)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 18 }}>
        <KPI label="A receber (no prazo)" value={fmtMoney(kpis.crAReceber)} cor="var(--ink-2)" />
        <KPI label="A pagar (no prazo)" value={fmtMoney(kpis.cpAPagar)} cor="var(--ink-2)" />
      </div>

      {/* Gráfico simples — barras dos últimos 6 meses */}
      <section style={{ marginBottom: 18 }}>
        <div className="card-eyebrow" style={{ marginBottom: 6 }}>Últimos 6 meses</div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${grafico.length || 6}, 1fr)`, gap: 14, alignItems: "end", height: 180 }}>
            {grafico.map((g, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", gap: 4, alignItems: "end", height: 140 }}>
                  <div
                    title={`Receitas: ${fmtMoney(g.receitas)}`}
                    style={{
                      width: 16,
                      height: `${(Number(g.receitas) / maxBar) * 100}%`,
                      background: "var(--ok)",
                      minHeight: 1,
                    }}
                  />
                  <div
                    title={`Despesas: ${fmtMoney(g.despesas)}`}
                    style={{
                      width: 16,
                      height: `${(Number(g.despesas) / maxBar) * 100}%`,
                      background: "var(--bad)",
                      minHeight: 1,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                  {g.mesNome}
                </div>
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 16, marginTop: 12, fontSize: 11, color: "var(--ink-3)" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--ok)", marginRight: 4 }} />Receitas</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--bad)", marginRight: 4 }} />Despesas</span>
          </div>
        </div>
      </section>

      {/* Próximos vencimentos */}
      <section style={{ marginBottom: 18 }}>
        <div className="card-eyebrow" style={{ marginBottom: 6 }}>Próximos vencimentos · 7 dias</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Tipo</th>
                <th>Descrição</th>
                <th style={{ width: 200 }}>Pessoa / Aluno</th>
                <th style={{ width: 110, textAlign: "right" }}>Valor</th>
                <th style={{ width: 110 }}>Vencimento</th>
                <th style={{ width: 70, textAlign: "right" }}>Dias</th>
              </tr>
            </thead>
            <tbody>
              {proximos.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: "center", color: "var(--ink-3)" }}>
                    Nada vencendo nos próximos 7 dias.
                  </td>
                </tr>
              )}
              {proximos.map((p, i) => (
                <tr key={`${p.modulo}-${p.id}-${i}`}>
                  <td>
                    <span
                      className="pill"
                      style={{
                        background: p.modulo === "CR" ? "var(--ok)" : "var(--bad)",
                        color: "#fff",
                        fontSize: 10,
                      }}
                    >
                      {p.modulo}
                    </span>
                  </td>
                  <td><span className="strong">{p.descricao}</span></td>
                  <td>{p.alunoNome || p.pessoaNome || "—"}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {fmtMoney(p.valor)}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(p.dataVencimento)}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {p.diasRestantes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inadimplentes */}
      <section style={{ marginBottom: 18 }}>
        <div className="card-eyebrow" style={{ marginBottom: 6 }}>Inadimplência</div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th style={{ width: 200 }}>Pessoa / Aluno</th>
                <th style={{ width: 110, textAlign: "right" }}>Valor</th>
                <th style={{ width: 110, textAlign: "right" }}>Saldo</th>
                <th style={{ width: 110 }}>Vencimento</th>
                <th style={{ width: 70, textAlign: "right" }}>Atraso</th>
              </tr>
            </thead>
            <tbody>
              {inadimplentes.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 30, textAlign: "center", color: "var(--ok)" }}>
                    🎉 Sem inadimplência.
                  </td>
                </tr>
              )}
              {inadimplentes.map((p) => (
                <tr key={p.id}>
                  <td><span className="strong">{p.descricao}</span></td>
                  <td>{p.alunoNome || p.pessoaNome || "—"}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {fmtMoney(p.valor)}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--bad)" }}>
                    <strong>{fmtMoney(p.saldoDevedor)}</strong>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(p.dataVencimento)}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--bad)" }}>
                    {p.diasAtraso}d
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KPI({ label, value, sub, cor }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="card-eyebrow" style={{ marginBottom: 4 }}>{label}</div>
      <div className="strong" style={{ fontSize: 22, color: cor || "var(--ink)", fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
