import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../Icon";

async function downloadFile(path, filename) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const RELATORIOS_TURMA = [
  {
    id: "medias",
    label: "Médias por bimestre",
    desc: "Crosstab com média de cada aluno por matéria e bimestre.",
    icone: "clipboard",
    bimestre: true,
  },
  {
    id: "frequencia",
    label: "Frequência",
    desc: "Percentual de presença por aluno e matéria.",
    icone: "clock",
    bimestre: true,
  },
  {
    id: "situacao",
    label: "Situação final",
    desc: "Aprovados, em recuperação e reprovados com médias anuais.",
    icone: "check",
    bimestre: false,
  },
];

export default function Relatorios() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [bimestre, setBimestre] = useState(0);
  const [downloading, setDownloading] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get("/turmas")
      .then((r) => {
        const lista = Array.isArray(r.data) ? r.data : [];
        setTurmas(lista);
        if (lista.length && !turmaId) setTurmaId(String(lista[0].id));
      })
      .catch(() => {});
  }, []);

  const turmaAtual = turmas.find((t) => String(t.id) === String(turmaId));

  const baixar = async (tipo, ext = "pdf") => {
    setErro("");
    setDownloading(tipo);
    try {
      const url =
        tipo === "boletins_zip"
          ? `/relatorios/boletim/turma/${turmaId}/zip`
          : `/relatorios/turma/${turmaId}?tipo=${tipo}&bimestre=${bimestre}`;
      const filename = `relatorio_${tipo}_${turmaAtual?.nome || turmaId}.${ext}`;
      await downloadFile(url, filename);
    } catch (err) {
      setErro(`Erro ao gerar: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Relatórios</div>
          <h1 className="page-title">Central de relatórios</h1>
          <div className="page-subtitle">
            {turmaAtual
              ? `${turmaAtual.nome}${turmaAtual.serieNome ? " · " + turmaAtual.serieNome : ""}`
              : "selecione uma turma"}
          </div>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div className="field" style={{ minWidth: 260 }}>
          <label>Turma</label>
          <select className="input" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {t.serieNome ? ` · ${t.serieNome}` : ""}
                {t.anoLetivo ? ` (${t.anoLetivo})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {[
            { id: 0, label: "Ano todo" },
            { id: 1, label: "1º bim" },
            { id: 2, label: "2º bim" },
            { id: 3, label: "3º bim" },
            { id: 4, label: "4º bim" },
          ].map((b) => (
            <button
              key={b.id}
              type="button"
              className={`chip ${bimestre === b.id ? "active" : ""}`}
              onClick={() => setBimestre(b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Relatórios de turma */}
      <section style={{ marginBottom: 24 }}>
        <div className="card-eyebrow" style={{ marginBottom: 8 }}>Relatórios de turma (PDF)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {RELATORIOS_TURMA.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="strong" style={{ marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.5 }}>
                {r.desc}
              </div>
              <button
                className="btn"
                type="button"
                disabled={!turmaId || downloading === r.id}
                onClick={() => baixar(r.id)}
                style={{ width: "100%" }}
              >
                <Icon name="download" size={12} />
                {downloading === r.id ? " gerando…" : " Baixar PDF"}
              </button>
            </div>
          ))}

          {/* Boletins em lote (ZIP) */}
          <div className="card" style={{ padding: 16 }}>
            <div className="strong" style={{ marginBottom: 4 }}>Boletins da turma</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.5 }}>
              Um boletim individual por aluno, compactado em arquivo ZIP.
            </div>
            <button
              className="btn"
              type="button"
              disabled={!turmaId || downloading === "boletins_zip"}
              onClick={() => baixar("boletins_zip", "zip")}
              style={{ width: "100%" }}
            >
              <Icon name="download" size={12} />
              {downloading === "boletins_zip" ? " gerando…" : " Baixar ZIP"}
            </button>
          </div>
        </div>
      </section>

      {/* Relatórios financeiros */}
      <section>
        <div className="card-eyebrow" style={{ marginBottom: 8 }}>Relatórios financeiros</div>
        <FinRelatorios />
      </section>
    </div>
  );
}

function FinRelatorios() {
  const [downloading, setDownloading] = useState(null);
  const [erro, setErro] = useState("");
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const baixarFin = async (tipo) => {
    setErro("");
    setDownloading(tipo);
    try {
      const url = `/fin/relatorios/${tipo}?mes=${mes}`;
      await downloadFile(url, `relatorio_financeiro_${tipo}_${mes}.pdf`);
    } catch (err) {
      setErro(`Erro ao gerar: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      {erro && (
        <div style={{ color: "var(--bad)", fontSize: 12, marginBottom: 8 }}>{erro}</div>
      )}
      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <div className="field">
          <label>Mês de referência</label>
          <input className="input" type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ width: 160 }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {[
          { id: "inadimplencia", label: "Inadimplência", desc: "CR vencidas e saldo devedor por aluno." },
          { id: "fluxo-caixa", label: "Fluxo de caixa", desc: "Entradas e saídas do mês selecionado." },
        ].map((r) => (
          <div key={r.id} className="card" style={{ padding: 16 }}>
            <div className="strong" style={{ marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.5 }}>
              {r.desc}
            </div>
            <button
              className="btn"
              type="button"
              disabled={downloading === r.id}
              onClick={() => baixarFin(r.id)}
              style={{ width: "100%" }}
            >
              <Icon name="download" size={12} />
              {downloading === r.id ? " gerando…" : " Baixar PDF"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
