import { useState, useEffect } from "react";
import axios from "axios";
import { Home, BookOpen, LogOut, CalendarDays, BarChart2, Menu, ChevronDown, ChevronRight, Megaphone, FileText } from "lucide-react";

const api = axios.create({ baseURL: "" });
api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return config;
});

let redirectingTo401 = false;
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 && !redirectingTo401) {
            redirectingTo401 = true;
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("nome");
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

// ── Design tokens — idênticos ao DirecaoDashboard ──────────────────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
* { box-sizing: border-box; }
:root { font-family: 'DM Sans', sans-serif; }

.ad-sidebar { background: #0d1f18; }
.ad-sidebar-logo-wrap { border-bottom: 1px solid rgba(255,255,255,0.07); }
.ad-user-wrap { border-bottom: 1px solid rgba(255,255,255,0.07); }
.ad-nav-btn { display:flex; align-items:center; gap:10px; padding:9px 12px; font-size:13px; font-weight:400; color:rgba(255,255,255,.45); border:none; background:transparent; width:100%; text-align:left; cursor:pointer; border-left:2px solid transparent; transition:color .15s, background .15s, border-color .15s; }
.ad-nav-btn:hover { color:rgba(255,255,255,.8); background:rgba(255,255,255,.04); }
.ad-nav-btn.active { color:#7ec8a0; border-left-color:#7ec8a0; background:rgba(126,200,160,.07); font-weight:500; }
.ad-header { background:#fff; border-bottom:1px solid #eaeef2; position:sticky; top:0; z-index:10; }
.ad-page-title { font-family:'Playfair Display', serif; font-size:22px; font-weight:700; color:#0d1f18; letter-spacing:-.02em; line-height:1; }
.ad-page-sub { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#9aaa9f; margin-top:3px; }
.ad-card { background:#fff; border:1px solid #eaeef2; border-top:2px solid var(--accent, #0d1f18); padding:18px 20px; }
.ad-card-num { font-family:'Playfair Display', serif; font-size:28px; font-weight:700; color:#0d1f18; line-height:1; }
.ad-card-label { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#9aaa9f; margin-top:4px; }
.ad-section { background:#fff; border:1px solid #eaeef2; }
.ad-section-header { border-bottom:1px solid #eaeef2; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
.ad-section-title { font-size:13px; font-weight:500; color:#0d1f18; letter-spacing:.01em; }
.ad-section-count { font-size:11px; color:#9aaa9f; letter-spacing:.04em; }
.ad-table { width:100%; border-collapse:collapse; }
.ad-table th { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#9aaa9f; padding:10px 20px; text-align:left; background:#f8faf8; border-bottom:1px solid #eaeef2; }
.ad-table td { padding:12px 20px; border-bottom:1px solid #f2f5f2; font-size:13px; color:#2a3a2e; }
.ad-table tr:last-child td { border-bottom:none; }
.ad-table tr:hover td { background:#fafcfa; }
.ad-badge { font-size:11px; font-weight:500; padding:3px 10px; letter-spacing:.02em; display:inline-block; }
.ad-accordion-row { border-bottom:1px solid #eaeef2; }
.ad-accordion-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#0d1f18; text-align:left; }
.ad-accordion-btn:hover { background:#f8faf8; }
.ad-accordion-body { padding:0 20px 16px; }
.ad-progress-bar-bg { background:#eaeef2; height:6px; border-radius:3px; overflow:hidden; }
.ad-progress-bar-fill { height:100%; border-radius:3px; transition:width .4s ease; }
.ad-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.ad-cards-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.ad-hamburger { display:none; background:none; border:none; cursor:pointer; padding:4px; align-items:center; justify-content:center; }
.ad-ano-selector { display:flex; gap:6px; }
.ad-ano-btn { padding:4px 14px; border-radius:20px; border:1px solid #d0dbd4; background:#fff; font-size:12px; font-weight:600; color:#5a7060; cursor:pointer; transition:background .15s, color .15s; }
.ad-ano-btn:hover { background:#f0f5f2; }
.ad-ano-btn--active { background:#0d1f18; color:#fff; border-color:#0d1f18; }

@media (max-width: 1100px) {
  .ad-sidebar { width: 180px !important; flex-shrink: 0; }
  .ad-nav-btn { font-size: 12px !important; padding: 8px 10px !important; }
}

@media (max-width: 900px) {
  .ad-sidebar {
    position: fixed !important;
    top: 0; left: 0; bottom: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform .25s ease;
    width: 220px !important;
  }
  .ad-sidebar.open { transform: translateX(0); }
  .ad-hamburger { display: flex !important; }
  .ad-header { padding: 14px 16px !important; }
  .ad-main { padding: 16px !important; }
  .ad-cards-grid { grid-template-columns: 1fr 1fr !important; }
  .ad-modal { max-width: 100% !important; padding: 20px !important; }
}

@media (max-width: 479px) {
  .ad-cards-grid { grid-template-columns: 1fr !important; }
  .ad-page-title { font-size: 18px !important; }
}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => (n === null || n === undefined) ? "—" : parseFloat(n).toFixed(1);

const corNota = v => {
    if (v === null || v === undefined) return "#9aaa9f";
    if (v >= 7) return "#3a6649";
    if (v >= 5) return "#9a6c2a";
    return "#b94040";
};
const bgNota = v => {
    if (v === null || v === undefined) return "#f8faf8";
    if (v >= 7) return "#f0f5f2";
    if (v >= 5) return "#fdf6ed";
    return "#fdf0f0";
};
const corFreq = v => {
    if (v >= 75) return "#3a6649";
    if (v >= 60) return "#9a6c2a";
    return "#b94040";
};
const bgFreq = v => {
    if (v >= 75) return "#f0f5f2";
    if (v >= 60) return "#fdf6ed";
    return "#fdf0f0";
};

const CORES_MATERIA = ["#1a4d3a","#1A759F","#6d597a","#b56576","#457b9d","#2a9d8f","#e76f51","#264653"];

// Calcula média de uma matéria agrupando por bimestre, aplicando bônus e recuperação
// por bimestre (igual ao RelatorioService.java no backend).
function mediaMateria(notas) {
    // Agrupa por bimestre
    const porBim = {};
    notas.forEach(n => {
        const bim = n.avaliacao?.bimestre ?? 1;
        if (!porBim[bim]) porBim[bim] = [];
        porBim[bim].push(n);
    });

    const mediasBim = [];
    for (const bimNotas of Object.values(porBim)) {
        const normais      = bimNotas.filter(n => !n.avaliacao?.bonificacao && n.avaliacao?.tipo !== "RECUPERACAO");
        const recuperacao  = bimNotas.find(n => n.avaliacao?.tipo === "RECUPERACAO");
        const bonificacoes = bimNotas.filter(n => n.avaliacao?.bonificacao);

        if (!normais.length && !recuperacao) continue;

        let media = null;
        if (normais.length) {
            const pesoTotal = normais.reduce((s, n) => s + (n.avaliacao?.peso ?? 1), 0);
            if (pesoTotal) media = normais.reduce((s, n) => s + parseFloat(n.valor) * (n.avaliacao?.peso ?? 1), 0) / pesoTotal;
        }
        if (recuperacao) {
            const recVal = parseFloat(recuperacao.valor);
            media = media === null ? recVal : Math.max(media, recVal);
        }
        if (media === null) continue;

        // Aplica bônus por bimestre, máximo 10 (igual ao backend)
        const bonus = bonificacoes.reduce((s, n) => s + parseFloat(n.valor), 0);
        media = Math.min(10, media + bonus);

        mediasBim.push(media);
    }

    if (!mediasBim.length) return null;
    return mediasBim.reduce((a, b) => a + b, 0) / mediasBim.length;
}

function agruparPorMateria(notas) {
    const m = {};
    notas.forEach(n => {
        const mat = n.avaliacao?.materia;
        if (!mat) return;
        if (!m[mat.id]) m[mat.id] = { materia: mat, notas: [] };
        m[mat.id].notas.push(n);
    });
    return m;
}

const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DIA_LABEL = { SEG: "Segunda-feira", TER: "Terça-feira", QUA: "Quarta-feira", QUI: "Quinta-feira", SEX: "Sexta-feira" };

// ── Seção: Início ─────────────────────────────────────────────────────────────
function Inicio({ vinculos, notas, turmaId, config = { mediaMinima: 6.0, freqMinima: 75.0 } }) {
    const porMateria = agruparPorMateria(notas);
    const [frequencias, setFrequencias] = useState({});
    const [proximas, setProximas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        if (!turmaId) { setCarregando(false); return; }
        const materias = Object.values(porMateria).map(m => m.materia);
        const today = new Date().toISOString().split("T")[0];
        const in30  = new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0];

        Promise.all([
            materias.length
                ? Promise.all(materias.map(mat =>
                    api.get(`/presencas/minhas/${turmaId}/${mat.id}`)
                       .then(r => ({ key: mat.id, ...r.data }))
                       .catch(() => null)
                  )).then(res => {
                      const f = {};
                      res.filter(Boolean).forEach(x => { f[x.key] = x; });
                      setFrequencias(f);
                  })
                : Promise.resolve(),
            api.get(`/notas/calendario?turmaId=${turmaId}&from=${today}&to=${in30}`)
               .then(r => setProximas(Array.isArray(r.data) ? r.data : []))
               .catch(() => {}),
        ]).finally(() => setCarregando(false));
    }, [turmaId, notas.length]); // eslint-disable-line

    const mediasArr = Object.values(porMateria).map(m => mediaMateria(m.notas)).filter(v => v !== null);
    const mediaGeral = mediasArr.length ? mediasArr.reduce((a,b)=>a+b,0)/mediasArr.length : null;
    const freqVals = Object.values(frequencias).map(f => f.percentualPresenca ?? 0);
    const freqMedia = freqVals.length ? freqVals.reduce((a,b)=>a+b,0)/freqVals.length : null;

    const situacaoMateria = (media, freq) => {
        if (media === null) return { label:"Em Curso", color:"#9aaa9f", bg:"#f5f7f5" };
        if (freq !== null && freq < config.freqMinima) return { label:"Freq. Insuficiente", color:"#b94040", bg:"#fdf0f0" };
        if (media < config.mediaMinima) return { label:"Reprovado", color:"#b94040", bg:"#fdf0f0" };
        return { label:"Aprovado", color:"#3a7a5a", bg:"#f0f5f2" };
    };

    const { label: sitLabel, color: sitColor } = (() => {
        if (!mediasArr.length) return { label:"Em Curso", color:"#9aaa9f" };
        if (freqVals.some(f => f < config.freqMinima) || mediasArr.some(m => m < config.mediaMinima))
            return { label:"Em Risco", color:"#b94040" };
        return { label:"Aprovando", color:"#3a7a5a" };
    })();

    const TIPO_CORES = { PROVA:"#1a4d3a", TRABALHO:"#1A759F", SIMULADO:"#6d597a", RECUPERACAO:"#b45309" };

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {/* ── Cards ── */}
            <div className="ad-cards-grid" style={{ gridTemplateColumns:"repeat(4,1fr)" }}>
                <div className="ad-card" style={{ "--accent":"#7ec8a0" }}>
                    <div className="ad-card-num">{mediaGeral !== null ? fmt(mediaGeral) : "—"}</div>
                    <div className="ad-card-label">Média Geral</div>
                </div>
                <div className="ad-card" style={{ "--accent": freqMedia !== null && freqMedia < config.freqMinima ? "#e63946" : "#52b69a" }}>
                    <div className="ad-card-num" style={{ color: freqMedia !== null && freqMedia < config.freqMinima ? "#e63946" : undefined }}>
                        {freqMedia !== null ? `${fmt(freqMedia)}%` : carregando ? "..." : "—"}
                    </div>
                    <div className="ad-card-label">Frequência Geral</div>
                </div>
                <div className="ad-card" style={{ "--accent": sitColor }}>
                    <div className="ad-card-num" style={{ fontSize:18, color: sitColor }}>{sitLabel}</div>
                    <div className="ad-card-label">Situação</div>
                </div>
                <div className="ad-card" style={{ "--accent":"#168aad" }}>
                    <div className="ad-card-num">{carregando ? "..." : proximas.length || "0"}</div>
                    <div className="ad-card-label">Provas em 30 dias</div>
                </div>
            </div>

            {/* ── Situação por Matéria ── */}
            {Object.values(porMateria).length > 0 && (
                <div className="ad-section">
                    <div className="ad-section-header">
                        <span className="ad-section-title">Situação por Matéria</span>
                        <span className="ad-section-count">{`Aprovação: média ≥ ${config.mediaMinima} e freq. ≥ ${config.freqMinima}%`}</span>
                    </div>
                    <div className="ad-table-wrap">
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Matéria</th>
                                    <th>Média</th>
                                    <th>Frequência</th>
                                    <th>Situação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(porMateria).map(({ materia, notas: nts }) => {
                                    const media = mediaMateria(nts);
                                    const freqEntry = frequencias[materia.id];
                                    const freq = freqEntry?.percentualPresenca ?? null;
                                    const sit = situacaoMateria(media, freq);
                                    return (
                                        <tr key={materia.id}>
                                            <td style={{ fontWeight:500 }}>{materia.nome}</td>
                                            <td>
                                                {media !== null
                                                    ? <span style={{ fontWeight:700, color:corNota(media) }}>{fmt(media)}</span>
                                                    : <span style={{ color:"#9aaa9f" }}>—</span>}
                                            </td>
                                            <td>
                                                {freq !== null ? (
                                                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                                        <div style={{ width:56, height:5, background:"#eaeef2", borderRadius:3, overflow:"hidden" }}>
                                                            <div style={{ height:"100%", width:`${Math.min(freq,100)}%`, background:corFreq(freq), borderRadius:3 }} />
                                                        </div>
                                                        <span style={{ fontSize:12, fontWeight:600, color:corFreq(freq) }}>{fmt(freq)}%</span>
                                                    </div>
                                                ) : <span style={{ color:"#9aaa9f", fontSize:12 }}>{carregando ? "..." : "—"}</span>}
                                            </td>
                                            <td>
                                                <span className="ad-badge" style={{ color:sit.color, background:sit.bg }}>{sit.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Próximas Avaliações ── */}
            <div className="ad-section">
                <div className="ad-section-header">
                    <span className="ad-section-title">Próximas Avaliações</span>
                    <span className="ad-section-count">próximos 30 dias</span>
                </div>
                {carregando ? (
                    <p style={{ color:"#9aaa9f", fontSize:13, padding:"20px", textAlign:"center" }}>Carregando...</p>
                ) : proximas.length === 0 ? (
                    <p style={{ color:"#9aaa9f", fontSize:13, padding:"20px", textAlign:"center" }}>Nenhuma avaliação agendada nos próximos 30 dias.</p>
                ) : (
                    <div className="ad-table-wrap">
                        <table className="ad-table">
                            <thead>
                                <tr><th>Data</th><th>Matéria</th><th>Tipo</th><th>Descrição</th><th>Bim.</th></tr>
                            </thead>
                            <tbody>
                                {[...proximas].sort((a,b) => (a.dataAplicacao||"").localeCompare(b.dataAplicacao||"")).map(av => (
                                    <tr key={av.id}>
                                        <td style={{ fontWeight:600, whiteSpace:"nowrap", color:"#0d1f18" }}>
                                            {av.dataAplicacao
                                                ? new Date(av.dataAplicacao + "T12:00:00").toLocaleDateString("pt-BR", { day:"2-digit", month:"short" })
                                                : "—"}
                                        </td>
                                        <td style={{ fontWeight:500 }}>{av.materiaNome || "—"}</td>
                                        <td>
                                            <span className="ad-badge" style={{ background:"#f0f5f2", color: TIPO_CORES[av.tipo] || "#1a4d3a", fontSize:10 }}>
                                                {av.tipo}
                                            </span>
                                        </td>
                                        <td style={{ color:"#5a7060" }}>{av.descricao || "—"}</td>
                                        <td style={{ color:"#9aaa9f" }}>{av.bimestre ? `${av.bimestre}º` : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Turmas (compacto) */}
            {vinculos.length > 0 && (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{ fontSize:11, color:"#9aaa9f" }}>Turmas:</span>
                    {vinculos.map((v,i) => (
                        <span key={i} style={{ background:"#f0f5f2", color:"#3a7a5a", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:500 }}>
                            {v.turma?.nome ?? "—"} · {v.turma?.anoLetivo}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Seção: Boletim ────────────────────────────────────────────────────────────
function Boletim({ notas, turmaId, config = { mediaMinima: 6.0, freqMinima: 75.0 } }) {
    const porMateria = agruparPorMateria(notas);
    const [baixando, setBaixando] = useState(false);
    const [erroPdf, setErroPdf] = useState(null);
    const [expandidas, setExpandidas] = useState(new Set()); // materia IDs expandidas (padrão: todas recolhidas)

    const toggleMateria = (id) => setExpandidas(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const baixarPdf = async () => {
        if (!turmaId) { setErroPdf("Turma não identificada."); return; }
        setBaixando(true);
        setErroPdf(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`/relatorios/boletim/meu/${turmaId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const txt = await res.text();
                setErroPdf(txt || "Erro ao gerar boletim.");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "boletim.pdf"; a.click();
            URL.revokeObjectURL(url);
        } catch {
            setErroPdf("Falha na conexão com o servidor.");
        } finally {
            setBaixando(false);
        }
    };

    if (notas.length === 0) {
        return <div style={{ color:"#9aaa9f", fontSize:13, padding:"24px 0" }}>Nenhuma nota registrada.</div>;
    }

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* botão PDF */}
            <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"flex-end" }}>
                {erroPdf && <span style={{ fontSize:12, color:"#e05252" }}>{erroPdf}</span>}
                <button onClick={baixarPdf} disabled={baixando}
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px",
                                 background: baixando ? "#9aaa9f" : "#0d1f18", color:"#fff",
                                 border:"none", borderRadius:6, fontSize:13, fontWeight:500,
                                 cursor: baixando ? "not-allowed" : "pointer", transition:"background .15s" }}>
                    <FileText size={14} />
                    {baixando ? "Gerando..." : "Baixar Boletim PDF"}
                </button>
            </div>
            {Object.values(porMateria).map(({ materia, notas: nts }, idx) => {
                const media = mediaMateria(nts);
                const accent = CORES_MATERIA[idx % CORES_MATERIA.length];
                const sitColor = media === null ? "#9aaa9f" : media >= config.mediaMinima ? "#3a7a5a" : "#b94040";
                const sitLabel = media === null ? "Em Curso" : media >= config.mediaMinima ? "Aprovado" : "Reprovado";
                const sitBg    = media === null ? "#f5f7f5" : media >= config.mediaMinima ? "#f0f5f2" : "#fdf0f0";
                const aberta   = expandidas.has(materia.id);
                return (
                    <div key={materia.id} className="ad-section" style={{ borderTop:`2px solid ${accent}`, overflow:"hidden" }}>
                        {/* cabeçalho matéria — clicável para expandir */}
                        <div className="ad-section-header"
                             style={{ cursor:"pointer", userSelect:"none" }}
                             onClick={() => toggleMateria(materia.id)}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <ChevronRight size={15} style={{ flexShrink:0, color: accent, transition:".2s", transform: aberta ? "rotate(90deg)" : "none" }} />
                                <span className="ad-section-title" style={{ color:accent, fontSize:15, fontWeight:600 }}>{materia.nome}</span>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span className="ad-badge" style={{ color:sitColor, background:sitBg, fontSize:11 }}>{sitLabel}</span>
                                <span className="ad-badge" style={{ color:corNota(media), background:bgNota(media), fontSize:13 }}>
                                    Média: {fmt(media)}
                                </span>
                            </div>
                        </div>

                        {/* bimestres — visíveis apenas quando expandido */}
                        {aberta && <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
                            {[1,2,3,4].map(bim => {
                                const nBim = nts.filter(n => (n.avaliacao?.bimestre ?? 1) === bim && !n.avaliacao?.bonificacao && n.avaliacao?.tipo !== "RECUPERACAO");
                                const bonus = nts.filter(n => (n.avaliacao?.bimestre ?? 1) === bim && n.avaliacao?.bonificacao);
                                const recBim = nts.filter(n => (n.avaliacao?.bimestre ?? 1) === bim && n.avaliacao?.tipo === "RECUPERACAO");
                                const mBim = mediaMateria([...nBim, ...bonus, ...recBim]);
                                return (
                                    <div key={bim} style={{ background:"#f8faf8", border:"1px solid #eaeef2", borderRadius:8, padding:"12px 14px" }}>
                                        <p style={{ fontSize:10, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"#9aaa9f", marginBottom:10 }}>
                                            {bim}º Bimestre
                                        </p>
                                        {nBim.length === 0 && bonus.length === 0 && recBim.length === 0 ? (
                                            <p style={{ fontSize:12, color:"#9aaa9f" }}>Sem notas</p>
                                        ) : (
                                            <>
                                                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                                    <tbody>
                                                        {nBim.map(n => (
                                                            <tr key={n.id}>
                                                                <td style={{ fontSize:12, color:"#5a7060", paddingBottom:5, paddingRight:8 }}>
                                                                    {n.avaliacao?.descricao || n.avaliacao?.tipo || "Avaliação"}
                                                                </td>
                                                                <td style={{ fontSize:13, fontWeight:600, color:corNota(parseFloat(n.valor)), textAlign:"right", paddingBottom:5 }}>
                                                                    {fmt(n.valor)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {recBim.map(n => {
                                                            const recVal = parseFloat(n.valor);
                                                            const mediaBase = mediaMateria(nBim);
                                                            const aplicou = mediaBase === null || recVal >= mediaBase;
                                                            return (
                                                                <tr key={n.id}>
                                                                    <td style={{ fontSize:12, color:"#b45309", paddingBottom:5, paddingRight:8 }}>
                                                                        ↩ {n.avaliacao?.descricao || "Recuperação"}
                                                                        {aplicou && <span style={{ fontSize:10, marginLeft:4, color:"#b45309" }}>✓</span>}
                                                                    </td>
                                                                    <td style={{ fontSize:13, fontWeight:600, color:"#b45309", textAlign:"right", paddingBottom:5 }}>
                                                                        {fmt(recVal)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                        {bonus.map(n => (
                                                            <tr key={n.id}>
                                                                <td style={{ fontSize:12, color:"#7ec8a0", paddingBottom:5, paddingRight:8 }}>
                                                                    +{n.avaliacao?.descricao || "Bônus"}
                                                                </td>
                                                                <td style={{ fontSize:13, fontWeight:600, color:"#7ec8a0", textAlign:"right", paddingBottom:5 }}>
                                                                    +{fmt(n.valor)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {(nBim.length > 0 || recBim.length > 0) && (
                                                    <div style={{ borderTop:"1px solid #eaeef2", paddingTop:7, marginTop:4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                                        <span style={{ fontSize:10, color:"#9aaa9f", letterSpacing:".06em", textTransform:"uppercase" }}>Média bim.</span>
                                                        <span style={{ fontSize:14, fontWeight:700, color:corNota(mBim), fontFamily:"'Playfair Display',serif" }}>
                                                            {fmt(mBim)}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>}
                    </div>
                );
            })}
        </div>
    );
}

// ── Seção Frequência ──────────────────────────────────────────────
function Frequencia({ notas, turmaId, config = { mediaMinima: 6.0, freqMinima: 75.0 } }) {
    const [frequencias, setFrequencias] = useState({});
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        const porMateria = agruparPorMateria(notas);
        const materias = Object.values(porMateria).map(m => m.materia);
        if (!turmaId || !materias.length) return;
        setCarregando(true);
        Promise.all(materias.map(mat =>
            api.get(`/presencas/minhas/${turmaId}/${mat.id}`)
               .then(r => ({ key: `${turmaId}_${mat.id}`, materiaNome: mat.nome, ...r.data }))
               .catch(() => null)
        )).then(res => {
            const f = {};
            res.filter(Boolean).forEach(x => { f[x.key] = x; });
            setFrequencias(f);
            setCarregando(false);
        });
    }, [notas, turmaId]);

    if (carregando) return <div className="ad-section"><p className="ad-empty">Carregando...</p></div>;

    const entries = Object.values(frequencias);
    if (!entries.length) return <div className="ad-section"><p className="ad-empty">Nenhum registro de frequência encontrado.</p></div>;

    return (
        <div className="ad-section">
            <div className="ad-section-header">
                <span className="ad-section-title">Frequência por Matéria</span>
                <span className="ad-section-count">{`Mínimo: ${config.freqMinima}%`}</span>
            </div>
            <div className="ad-table-wrap">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Matéria</th>
                            <th>Aulas</th>
                            <th>Presenças</th>
                            <th>Faltas</th>
                            <th>%</th>
                            <th>Situação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(f => {
                            const pct = f.percentualPresenca ?? 0;
                            return (
                                <tr key={f.key ?? f.materiaNome}>
                                    <td style={{ fontWeight:500 }}>{f.materiaNome}</td>
                                    <td style={{ color:"#9aaa9f" }}>{f.totalAulas}</td>
                                    <td style={{ color:"#3a6649" }}>{f.presentes}</td>
                                    <td style={{ color: f.faltas > 0 ? "#b94040" : "#9aaa9f" }}>{f.faltas}</td>
                                    <td>
                                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                            <div style={{ width:72, height:6, background:"#eaeef2", borderRadius:3, overflow:"hidden" }}>
                                                <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background: pct>=config.freqMinima?"#7ec8a0":pct>=60?"#e9c46a":"#e63946", borderRadius:3, transition:"width .4s" }} />
                                            </div>
                                            <span style={{ fontSize:12, fontWeight:600, color:corFreq(pct), minWidth:36 }}>
                                                {fmt(pct)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="ad-badge" style={{ color:corFreq(pct), background:bgFreq(pct) }}>
                                            {pct>=config.freqMinima?"Regular":pct>=60?"Atenção":"Irregular"}
                                        </span>
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

// ── Seção: Horários ───────────────────────────────────────────────────────────
function Horarios() {
    const [horarios, setHorarios] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        api.get("/horarios/minhas")
            .then(r => setHorarios(Array.isArray(r.data) ? r.data : []))
            .catch(() => setHorarios([]))
            .finally(() => setCarregando(false));
    }, []);

    const porDia = DIAS.reduce((acc, dia) => {
        acc[dia] = horarios.filter(h => h.diaSemana === dia || h.dia === dia);
        return acc;
    }, {});

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {carregando ? (
                <div style={{ color:"#9aaa9f", fontSize:13 }}>Carregando...</div>
            ) : horarios.length === 0 ? (
                <div style={{ color:"#9aaa9f", fontSize:13, padding:"24px 0" }}>Nenhum horário registrado.</div>
            ) : DIAS.map(dia => {
                const aulas = porDia[dia];
                if (aulas.length === 0) return null;
                return (
                    <div key={dia} className="ad-section">
                        <div className="ad-section-header">
                            <span className="ad-section-title">{DIA_LABEL[dia]}</span>
                            <span className="ad-section-count">{aulas.length} aula{aulas.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Aula</th>
                                        <th>Horário</th>
                                        <th>Matéria</th>
                                        <th>Professor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aulas.sort((a, b) => (a.ordemAula ?? 0) - (b.ordemAula ?? 0)).map((h, i) => (
                                        <tr key={i}>
                                            <td style={{ color:"#9aaa9f", fontWeight:500 }}>{h.ordemAula ?? "—"}ª</td>
                                            <td style={{ fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" }}>
                                                {h.horarioInicio ?? "—"}
                                            </td>
                                            <td>{h.materiaNome ?? "—"}</td>
                                            <td>{h.professorNome ?? "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Comunicados (somente leitura para aluno) ──────────────────────────────────
function ComunicadosAluno() {
    const [comunicados, setComunicados] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        const carregar = () =>
            api.get("/comunicados")
                .then(r => setComunicados(Array.isArray(r.data) ? r.data : []))
                .catch(() => {})
                .finally(() => setCarregando(false));
        carregar();
        const timer = setInterval(carregar, 30_000);
        return () => clearInterval(timer);
    }, []);

    const DEST_LABELS = { TODOS:"Todos", PROFESSORES:"Professores", ALUNOS:"Alunos" };

    if (carregando) return <p style={{ color:"#9aaa9f", fontSize:13, textAlign:"center", padding:40 }}>Carregando...</p>;

    return (
        <div className="ad-section">
            <div className="ad-section-header">
                <span className="ad-section-title">Comunicados da Escola</span>
                <span className="ad-section-count">{comunicados.length}</span>
            </div>
            <div style={{ padding:"0 20px" }}>
                {comunicados.length === 0 && (
                    <p style={{ color:"#9aaa9f", fontSize:13, padding:"32px 0", textAlign:"center" }}>
                        Nenhum comunicado disponível no momento.
                    </p>
                )}
                {comunicados.map(c => (
                    <div key={c.id} style={{ padding:"16px 0", borderBottom:"1px solid #f0f4f1" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                            <span style={{ fontWeight:600, fontSize:14, color:"#0d1f18" }}>{c.titulo}</span>
                            <span style={{ fontSize:10, fontWeight:500, letterSpacing:".08em", textTransform:"uppercase",
                                           background:"#e8f5ec", color:"#3a7a5a", padding:"2px 8px" }}>
                                {c.destinatarios === "TURMA" ? "Sua Turma" : (DEST_LABELS[c.destinatarios] || c.destinatarios)}
                            </span>
                        </div>
                        <p style={{ fontSize:13, color:"#3a4a40", lineHeight:1.6, whiteSpace:"pre-wrap", margin:"0 0 6px" }}>{c.corpo}</p>
                        <p style={{ fontSize:11, color:"#9aaa9f" }}>
                            {c.autorNome} · {c.dataPublicacao
                                ? new Date(c.dataPublicacao).toLocaleString("pt-BR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                                : ""}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
const abas = [
    { id: "inicio",       label: "Início",      icon: Home },
    { id: "boletim",      label: "Boletim",     icon: BookOpen },
    { id: "frequencia",   label: "Frequência",  icon: BarChart2 },
    { id: "horarios",     label: "Horários",    icon: CalendarDays },
    { id: "comunicados",  label: "Comunicados", icon: Megaphone },
];

export default function AlunoDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const [vinculos, setVinculos] = useState([]);
    const [notas, setNotas] = useState([]);
    const [anoSelecionado, setAnoSelecionado] = useState(null);
    const [config, setConfig] = useState({ mediaMinima: 6.0, freqMinima: 75.0 });
    const nome = localStorage.getItem("nome") || "Aluno";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    useEffect(() => {
      // /notas/config expõe apenas mediaMinima e freqMinima (sem dados financeiros sensíveis)
      api.get('/notas/config')
        .then(r => setConfig({ mediaMinima: Number(r.data.mediaMinima) || 6.0, freqMinima: Number(r.data.freqMinima) || 75.0 }))
        .catch(() => {}); // fallback to defaults silently
    }, []);

    useEffect(() => {
        api.get("/vinculos/aluno-turma/minhas")
            .then(r => setVinculos(Array.isArray(r.data) ? r.data : []))
            .catch(() => setVinculos([]));
        api.get("/notas/minhas")
            .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
            .catch(() => setNotas([]));
    }, []);

    // Dados filtrados pelo ano selecionado
    const anosDisponiveis = [...new Set(vinculos.map(v => v.turma?.anoLetivo).filter(Boolean))]
        .sort((a, b) => b - a);
    // anoEfetivo: ano selecionado pelo usuário (se válido) ou o mais recente disponível
    const anoEfetivo = (anoSelecionado != null && anosDisponiveis.includes(anoSelecionado))
        ? anoSelecionado
        : (anosDisponiveis[0] ?? null);
    const vinculosAno = vinculos.filter(v => v.turma?.anoLetivo === anoEfetivo);
    // Suporte a múltiplas turmas no mesmo ano
    const turmaIdsAno = new Set(vinculosAno.map(v => v.turma?.id).filter(Boolean));
    const turmaIdAno = [...turmaIdsAno][0] ?? null;
    const notasAno = notas.filter(n => turmaIdsAno.has(n.avaliacao?.turma?.id));

    return (
        <>
            <style>{STYLE}</style>
            <div style={{ display:"flex", minHeight:"100vh", background:"#f5f8f5" }}>

                {/* overlay mobile */}
                {sidebarAberta && (
                    <div style={{ position:"fixed", inset:0, background:"rgba(13,31,24,.4)", zIndex:20 }}
                         onClick={() => setSidebarAberta(false)} />
                )}

                {/* ── Sidebar ── */}
                <aside className={`ad-sidebar${sidebarAberta ? " open" : ""}`} style={{
                    width:210, flexShrink:0, display:"flex", flexDirection:"column",
                    position:"sticky", top:0, height:"100vh", overflowY:"auto",
                }}>
                    {/* logo */}
                    <div className="ad-sidebar-logo-wrap" style={{ padding:"24px 20px 20px", display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:28, height:28, border:"1.5px solid rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,.5)" strokeWidth="1.2"/>
                                <circle cx="8" cy="8" r="2" fill="#7ec8a0"/>
                            </svg>
                        </div>
                        <div>
                            <p style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:13, letterSpacing:"0.08em", color:"rgba(255,255,255,.75)", lineHeight:1 }}>DomGestão</p>
                            <p style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginTop:3 }}>Aluno</p>
                        </div>
                    </div>

                    {/* user */}
                    <div className="ad-user-wrap" style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:28, height:28, background:"rgba(126,200,160,.15)", border:"1px solid rgba(126,200,160,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:600, color:"#7ec8a0" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,.65)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nome}</p>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:"0.04em" }}>Estudante</p>
                        </div>
                    </div>

                    {/* nav */}
                    <nav style={{ flex:1, padding:"16px 8px", display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
                        {abas.map(item => {
                            const Icon = item.icon;
                            return (
                                <button key={item.id}
                                        className={`ad-nav-btn${aba === item.id ? " active" : ""}`}
                                        onClick={() => { setAba(item.id); setSidebarAberta(false); }}>
                                    <Icon size={14} style={{ flexShrink:0 }} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* logout */}
                    <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                        <button className="ad-nav-btn" onClick={logout} style={{ color:"rgba(255,100,100,.5)" }}>
                            <LogOut size={14} />
                            <span>Sair</span>
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
                    {/* header */}
                    <header className="ad-header" style={{ padding:"18px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                            <button className="ad-hamburger" onClick={() => setSidebarAberta(true)}>
                                <Menu size={20} color="#0d1f18" />
                            </button>
                            <div>
                                <h1 className="ad-page-title">{abas.find(a => a.id === aba)?.label}</h1>
                                <p className="ad-page-sub">DomGestão — Sistema Escolar</p>
                            </div>
                        </div>
                        <div style={{ width:32, height:32, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:"#7ec8a0", letterSpacing:".04em" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                    </header>

                    <main className="ad-main" style={{ flex:1, padding:"28px 32px", display:"flex", flexDirection:"column", gap:20 }}>
                        {anosDisponiveis.length > 0 && (
                            <div className="ad-ano-selector">
                                {anosDisponiveis.map(ano => (
                                    <button
                                        key={ano}
                                        className={`ad-ano-btn${ano === anoEfetivo ? " ad-ano-btn--active" : ""}`}
                                        onClick={() => setAnoSelecionado(ano)}
                                    >
                                        {ano}
                                    </button>
                                ))}
                            </div>
                        )}
                        {aba === "inicio"      && <Inicio vinculos={vinculosAno} notas={notasAno} turmaId={turmaIdAno} config={config} />}
                        {aba === "boletim"     && <Boletim notas={notasAno} turmaId={turmaIdAno} config={config} />}
                        {aba === "frequencia"  && <Frequencia notas={notasAno} turmaId={turmaIdAno} config={config} />}
                        {aba === "horarios"    && <Horarios />}
                        {aba === "comunicados" && <ComunicadosAluno />}
                    </main>
                </div>
            </div>
        </>
    );
}
