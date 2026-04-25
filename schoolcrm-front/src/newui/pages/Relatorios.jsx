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

// ── Relatórios financeiros com modals de filtro ────────────────────────────
const FIN_REL_LIST = [
  {
    id: "cr",
    label: "CR por período",
    desc: "Contas a receber filtradas por período, status e tipo.",
    filtros: ["periodo", "status_cr", "tipo_cr"],
    buildUrl: (f) =>
      `/relatorios/financeiro/contas-receber?de=${f.de}&ate=${f.ate}${f.status ? `&status=${f.status}` : ""}${f.tipo ? `&tipo=${f.tipo}` : ""}`,
    filename: (f) => `cr_${f.de}_${f.ate}.pdf`,
  },
  {
    id: "cp",
    label: "CP por período",
    desc: "Contas a pagar filtradas por período, status, tipo e categoria.",
    filtros: ["periodo", "status_cp", "tipo_cp", "categoria_cp"],
    buildUrl: (f) =>
      `/relatorios/financeiro/contas-pagar?de=${f.de}&ate=${f.ate}${f.status ? `&status=${f.status}` : ""}${f.tipo ? `&tipo=${f.tipo}` : ""}${f.categoria ? `&categoria=${f.categoria}` : ""}`,
    filename: (f) => `cp_${f.de}_${f.ate}.pdf`,
  },
  {
    id: "inadimplencia",
    label: "Inadimplência",
    desc: "CR vencidas e saldo devedor por aluno.",
    filtros: ["data_base"],
    buildUrl: (f) =>
      `/relatorios/financeiro/inadimplencia${f.dataBase ? `?dataBase=${f.dataBase}` : ""}`,
    filename: () => "inadimplencia.pdf",
  },
  {
    id: "fluxo-caixa",
    label: "Fluxo de caixa",
    desc: "Entradas e saídas do período selecionado.",
    filtros: ["periodo"],
    buildUrl: (f) => `/relatorios/financeiro/fluxo-caixa?de=${f.de}&ate=${f.ate}`,
    filename: (f) => `fluxo_caixa_${f.de}_${f.ate}.pdf`,
  },
  {
    id: "folha",
    label: "Folha de pagamento",
    desc: "Salários e benefícios dos funcionários no mês.",
    filtros: ["mes_referencia"],
    buildUrl: (f) => `/relatorios/financeiro/folha-pagamento?mes=${f.mes}`,
    filename: (f) => `folha_${f.mes}.pdf`,
  },
];

function FinRelatorios() {
  const [modalRel, setModalRel]   = useState(null);
  const [filtros, setFiltros]     = useState({});
  const [gerando, setGerando]     = useState(false);
  const [erro, setErro]           = useState("");

  const abrirModal = (rel) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const primeiroDiaMes = hoje.slice(0, 7) + "-01";
    setFiltros({ de: primeiroDiaMes, ate: hoje, dataBase: hoje, mes: hoje.slice(0, 7) });
    setErro("");
    setModalRel(rel);
  };

  const set = (k, v) => setFiltros((prev) => ({ ...prev, [k]: v }));

  const gerar = async () => {
    if (!modalRel) return;
    setGerando(true);
    setErro("");
    try {
      const url = modalRel.buildUrl(filtros);
      const fname = modalRel.filename(filtros);
      await downloadFile(url, fname);
      setModalRel(null);
    } catch (err) {
      setErro(`Erro ao gerar: ${err.message}`);
    } finally {
      setGerando(false);
    }
  };

  const tem = (nome) => modalRel?.filtros?.includes(nome);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {FIN_REL_LIST.map((r) => (
          <div key={r.id} className="card" style={{ padding: 16 }}>
            <div className="strong" style={{ marginBottom: 4 }}>{r.label}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, lineHeight: 1.5 }}>
              {r.desc}
            </div>
            <button
              className="btn"
              type="button"
              onClick={() => abrirModal(r)}
              style={{ width: "100%" }}
            >
              <Icon name="download" size={12} /> Gerar PDF
            </button>
          </div>
        ))}
      </div>

      {modalRel && (
        <div className="modal-overlay" onClick={() => setModalRel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">Relatório financeiro</div>
                <div className="modal-title">{modalRel.label}</div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setModalRel(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>

              {tem("periodo") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className="field">
                    <label>Data inicial *</label>
                    <input className="input" type="date" value={filtros.de || ""} onChange={(e) => set("de", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Data final *</label>
                    <input className="input" type="date" value={filtros.ate || ""} onChange={(e) => set("ate", e.target.value)} />
                  </div>
                </div>
              )}

              {tem("data_base") && (
                <div className="field">
                  <label>Data base</label>
                  <input className="input" type="date" value={filtros.dataBase || ""} onChange={(e) => set("dataBase", e.target.value)} />
                </div>
              )}

              {tem("mes_referencia") && (
                <div className="field">
                  <label>Mês de referência *</label>
                  <input className="input" type="month" value={filtros.mes || ""} onChange={(e) => set("mes", e.target.value)} />
                </div>
              )}

              {tem("status_cr") && (
                <div className="field">
                  <label>Status</label>
                  <select className="input" value={filtros.status || ""} onChange={(e) => set("status", e.target.value)}>
                    <option value="">Todos</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              )}

              {tem("tipo_cr") && (
                <div className="field">
                  <label>Tipo</label>
                  <select className="input" value={filtros.tipo || ""} onChange={(e) => set("tipo", e.target.value)}>
                    <option value="">Todos</option>
                    <option value="MENSALIDADE">Mensalidade</option>
                    <option value="MATRICULA">Matrícula</option>
                    <option value="UNIFORME">Uniforme</option>
                    <option value="EVENTO">Evento</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              )}

              {tem("status_cp") && (
                <div className="field">
                  <label>Status</label>
                  <select className="input" value={filtros.status || ""} onChange={(e) => set("status", e.target.value)}>
                    <option value="">Todos</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              )}

              {tem("tipo_cp") && (
                <div className="field">
                  <label>Tipo</label>
                  <select className="input" value={filtros.tipo || ""} onChange={(e) => set("tipo", e.target.value)}>
                    <option value="">Todos</option>
                    <option value="SALARIO">Salário</option>
                    <option value="CONTA_FIXA">Conta Fixa</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              )}

              {tem("categoria_cp") && (
                <div className="field">
                  <label>Categoria</label>
                  <select className="input" value={filtros.categoria || ""} onChange={(e) => set("categoria", e.target.value)}>
                    <option value="">Todas</option>
                    {["AGUA","LUZ","INTERNET","ALUGUEL","SALARIO","LIMPEZA","MANUTENCAO","MATERIAL","OUTRO"].map((c) => (
                      <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase().replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              )}

              {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setModalRel(null)} disabled={gerando}>
                Cancelar
              </button>
              <button className="btn accent" type="button" onClick={gerar} disabled={gerando}>
                <Icon name="download" size={12} />
                {gerando ? " gerando…" : " Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
