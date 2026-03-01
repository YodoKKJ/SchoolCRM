import { useState, useEffect } from "react";
import axios from "axios";
import { Home, BookOpen, BarChart2, CalendarDays, LogOut } from "lucide-react";

const api = axios.create({ baseURL: "" });
api.interceptors.request.use(cfg => {
    cfg.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return cfg;
});
api.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) { localStorage.clear(); window.location.href = "/"; }
        return Promise.reject(err);
    }
);

// ── Estilos idênticos ao DirecaoDashboard ─────────────────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
* { box-sizing: border-box; }
:root { font-family: 'DM Sans', sans-serif; }
.ad-sidebar { background: #0d1f18; }
.ad-nav-btn { display:flex; align-items:center; gap:10px; padding:9px 12px; font-size:13px; font-weight:400; color:rgba(255,255,255,.45); border:none; background:transparent; width:100%; text-align:left; cursor:pointer; border-left:2px solid transparent; transition:color .15s,background .15s,border-color .15s; font-family:'DM Sans',sans-serif; }
.ad-nav-btn:hover { color:rgba(255,255,255,.8); background:rgba(255,255,255,.04); }
.ad-nav-btn.active { color:#7ec8a0; border-left-color:#7ec8a0; background:rgba(126,200,160,.07); font-weight:500; }
.ad-header { background:#fff; border-bottom:1px solid #eaeef2; position:sticky; top:0; z-index:10; }
.ad-page-title { font-family:'Playfair Display', serif; font-size:22px; font-weight:700; color:#0d1f18; letter-spacing:-.02em; line-height:1; }
.ad-page-sub { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#9aaa9f; margin-top:3px; }
.ad-card { background:#fff; border:1px solid #eaeef2; border-top:2px solid var(--accent, #0d1f18); }
.ad-card-num { font-family:'Playfair Display', serif; font-size:30px; font-weight:700; color:#0d1f18; line-height:1; }
.ad-card-label { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#9aaa9f; margin-top:4px; }
.ad-section { background:#fff; border:1px solid #eaeef2; }
.ad-section-header { border-bottom:1px solid #eaeef2; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
.ad-section-title { font-size:13px; font-weight:500; color:#0d1f18; letter-spacing:.01em; }
.ad-section-sub { font-size:11px; color:#9aaa9f; letter-spacing:.04em; }
.ad-table { width:100%; border-collapse:collapse; }
.ad-table th { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#9aaa9f; padding:10px 20px; text-align:left; background:#f8faf8; border-bottom:1px solid #eaeef2; }
.ad-table td { padding:12px 20px; border-bottom:1px solid #f2f5f2; font-size:13px; color:#2a3a2e; }
.ad-table tr:last-child td { border-bottom:none; }
.ad-table tr:hover td { background:#fafcfa; }
.ad-badge { font-size:11px; font-weight:500; padding:3px 10px; letter-spacing:.02em; }
.ad-nav-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.3); padding:0 12px; margin-bottom:4px; }
.ad-empty { font-size:13px; color:#9aaa9f; padding:24px 20px; text-align:center; }
`;

const DIAS = ["SEG","TER","QUA","QUI","SEX"];
const DIA_LABEL = { SEG:"Segunda",TER:"Terça",QUA:"Quarta",QUI:"Quinta",SEX:"Sexta" };

// Paleta de cores por matéria
const CORES_MATERIA = ["#1a4d3a","#1A759F","#6d597a","#b56576","#457b9d","#2a9d8f","#e76f51","#264653"];

function corNota(v) {
    if (v === null || v === undefined) return "#9aaa9f";
    if (v >= 7) return "#3a6649";
    if (v >= 5) return "#9a6c2a";
    return "#b94040";
}
function bgNota(v) {
    if (v === null || v === undefined) return "#f8faf8";
    if (v >= 7) return "#f0f5f2";
    if (v >= 5) return "#fdf6ed";
    return "#fdf0f0";
}
function corFreq(pct) {
    if (pct >= 75) return "#3a6649";
    if (pct >= 60) return "#9a6c2a";
    return "#b94040";
}
function bgFreq(pct) {
    if (pct >= 75) return "#f0f5f2";
    if (pct >= 60) return "#fdf6ed";
    return "#fdf0f0";
}

function fmt(n) {
    if (n === null || n === undefined) return "—";
    return parseFloat(n).toFixed(1);
}

function mediaMateria(notas) {
    const normais = notas.filter(n => !n.avaliacao?.bonificacao);
    if (!normais.length) return null;
    const pesoTotal = normais.reduce((s, n) => s + (n.avaliacao?.peso ?? 1), 0);
    if (!pesoTotal) return null;
    return normais.reduce((s, n) => s + parseFloat(n.valor) * (n.avaliacao?.peso ?? 1), 0) / pesoTotal;
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

// ── Menus ─────────────────────────────────────────────────────────
const MENU = [
    { id:"inicio",     label:"Início",     icon:Home },
    { id:"boletim",    label:"Boletim",    icon:BookOpen },
    { id:"frequencia", label:"Frequência", icon:BarChart2 },
    { id:"horarios",   label:"Horários",   icon:CalendarDays },
];

// ── Seção Início ──────────────────────────────────────────────────
function Inicio({ turmas, notas, frequencias }) {
    const turma = turmas[0]?.turma;
    const porMateria = agruparPorMateria(notas);
    const medias = Object.values(porMateria).map(m => mediaMateria(m.notas)).filter(v => v !== null);
    const mediaGeral = medias.length ? medias.reduce((a,b)=>a+b,0)/medias.length : null;
    const freqVals = Object.values(frequencias).map(f => f.percentualPresenca).filter(v=>v!=null);
    const freqMedia = freqVals.length ? freqVals.reduce((a,b)=>a+b,0)/freqVals.length : null;

    const cards = [
        { label:"Turma", valor: turma?.nome ?? "—", sub: turma?.serie?.nome ?? "—", accent:"#1a4d3a" },
        { label:"Ano Letivo", valor: turma?.anoLetivo ?? "—", sub:"Em curso", accent:"#1A759F" },
        { label:"Média Geral", valor: mediaGeral !== null ? fmt(mediaGeral) : "—",
          sub: mediaGeral !== null ? (mediaGeral>=7?"Aprovado":mediaGeral>=5?"Recuperação":"Reprovado") : "Sem notas",
          accent: mediaGeral !== null ? (mediaGeral>=7?"#3a6649":mediaGeral>=5?"#9a6c2a":"#b94040") : "#9aaa9f" },
        { label:"Frequência Média", valor: freqMedia !== null ? fmt(freqMedia)+"%" : "—",
          sub: freqMedia !== null ? (freqMedia>=75?"Regular":"Atenção — abaixo de 75%") : "Sem registros",
          accent: freqMedia !== null ? (freqMedia>=75?"#3a6649":freqMedia>=60?"#9a6c2a":"#b94040") : "#9aaa9f" },
    ];

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            {/* Cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:16 }}>
                {cards.map(c => (
                    <div key={c.label} className="ad-card" style={{ "--accent":c.accent, padding:"20px 24px" }}>
                        <p className="ad-card-label">{c.label}</p>
                        <p className="ad-card-num" style={{ color:c.accent, fontSize:26 }}>{c.valor}</p>
                        <p style={{ fontSize:11, color:"#9aaa9f", marginTop:6 }}>{c.sub}</p>
                    </div>
                ))}
            </div>

            {/* Resumo por matéria */}
            {Object.keys(porMateria).length > 0 && (
                <div className="ad-section">
                    <div className="ad-section-header">
                        <span className="ad-section-title">Resumo por Matéria</span>
                        <span className="ad-section-sub">{Object.keys(porMateria).length} matérias</span>
                    </div>
                    <table className="ad-table">
                        <thead>
                            <tr>
                                <th>Matéria</th>
                                <th>Média</th>
                                <th>Situação</th>
                                <th>Frequência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(porMateria).map(({ materia, notas: nts }) => {
                                const media = mediaMateria(nts);
                                const freqKey = Object.keys(frequencias).find(k => k.endsWith(`_${materia.id}`));
                                const freq = freqKey ? frequencias[freqKey] : null;
                                return (
                                    <tr key={materia.id}>
                                        <td style={{ fontWeight:500 }}>{materia.nome}</td>
                                        <td>
                                            <span className="ad-badge" style={{ color:corNota(media), background:bgNota(media) }}>
                                                {fmt(media)}
                                            </span>
                                        </td>
                                        <td style={{ fontSize:12, color: media !== null ? corNota(media) : "#9aaa9f" }}>
                                            {media === null ? "—" : media>=7 ? "Aprovado" : media>=5 ? "Recuperação" : "Reprovado"}
                                        </td>
                                        <td>
                                            {freq ? (
                                                <span className="ad-badge" style={{ color:corFreq(freq.percentualPresenca), background:bgFreq(freq.percentualPresenca) }}>
                                                    {fmt(freq.percentualPresenca)}%
                                                </span>
                                            ) : <span style={{ color:"#9aaa9f" }}>—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Seção Boletim ─────────────────────────────────────────────────
function Boletim({ notas }) {
    const porMateria = agruparPorMateria(notas);

    if (!Object.keys(porMateria).length) return (
        <div className="ad-section"><p className="ad-empty">Nenhuma nota lançada ainda.</p></div>
    );

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {Object.values(porMateria).map(({ materia, notas: nts }, idx) => {
                const media = mediaMateria(nts);
                const accent = CORES_MATERIA[idx % CORES_MATERIA.length];
                return (
                    <div key={materia.id} className="ad-section" style={{ borderTop:`2px solid ${accent}`, overflow:"hidden" }}>
                        {/* cabeçalho matéria */}
                        <div className="ad-section-header">
                            <span className="ad-section-title" style={{ color:accent, fontSize:15, fontWeight:600 }}>{materia.nome}</span>
                            <span className="ad-badge" style={{ color:corNota(media), background:bgNota(media), fontSize:13 }}>
                                Média: {fmt(media)}
                            </span>
                        </div>

                        {/* bimestres sempre visíveis */}
                        <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
                            {[1,2,3,4].map(bim => {
                                const nBim = nts.filter(n => (n.avaliacao?.bimestre ?? 1) === bim && !n.avaliacao?.bonificacao);
                                const bonus = nts.filter(n => (n.avaliacao?.bimestre ?? 1) === bim && n.avaliacao?.bonificacao);
                                const mBim = mediaMateria(nBim);
                                return (
                                    <div key={bim} style={{ background:"#f8faf8", border:"1px solid #eaeef2", borderRadius:8, padding:"12px 14px" }}>
                                        <p style={{ fontSize:10, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"#9aaa9f", marginBottom:10 }}>
                                            {bim}º Bimestre
                                        </p>
                                        {nBim.length === 0 && bonus.length === 0 ? (
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
                                                {nBim.length > 0 && (
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
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Seção Frequência ──────────────────────────────────────────────
function Frequencia({ frequencias, carregando }) {
    if (carregando) return <div className="ad-section"><p className="ad-empty">Carregando...</p></div>;

    const entries = Object.values(frequencias ?? {});

    if (!entries.length) return <div className="ad-section"><p className="ad-empty">Nenhum registro de frequência encontrado.</p></div>;

    return (
        <div className="ad-section">
            <div className="ad-section-header">
                <span className="ad-section-title">Frequência por Matéria</span>
                <span className="ad-section-sub">Mínimo: 75%</span>
            </div>
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
                                            <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background: pct>=75?"#7ec8a0":pct>=60?"#e9c46a":"#e63946", borderRadius:3, transition:"width .4s" }} />
                                        </div>
                                        <span style={{ fontSize:12, fontWeight:600, color:corFreq(pct), minWidth:36 }}>
                                            {fmt(pct)}%
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className="ad-badge" style={{ color:corFreq(pct), background:bgFreq(pct) }}>
                                        {pct>=75?"Regular":pct>=60?"Atenção":"Irregular"}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ── Seção Horários ────────────────────────────────────────────────
function Horarios({ horarios }) {
    if (!horarios.length) return (
        <div className="ad-section"><p className="ad-empty">Nenhum horário cadastrado.</p></div>
    );

    const porDia = {};
    DIAS.forEach(d => { porDia[d] = []; });
    horarios.forEach(h => { if (porDia[h.diaSemana]) porDia[h.diaSemana].push(h); });
    DIAS.forEach(d => porDia[d].sort((a,b) => (a.ordemAula??0)-(b.ordemAula??0)));

    const corMap = {};
    let ci = 0;
    horarios.forEach(h => { if (!corMap[h.materiaId]) corMap[h.materiaId] = CORES_MATERIA[ci++ % CORES_MATERIA.length]; });

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {DIAS.map((dia, i) => (
                <div key={dia} className="ad-section" style={{ borderTop: i===0?"1px solid #eaeef2":"none" }}>
                    <div className="ad-section-header">
                        <span className="ad-section-title">{DIA_LABEL[dia]}</span>
                        <span className="ad-section-sub">{porDia[dia].length} aula{porDia[dia].length!==1?"s":""}</span>
                    </div>
                    {porDia[dia].length === 0 ? (
                        <p className="ad-empty" style={{ padding:"12px 20px", textAlign:"left" }}>Sem aulas</p>
                    ) : (
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Ordem</th>
                                    <th>Horário</th>
                                    <th>Matéria</th>
                                    <th>Professor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {porDia[dia].map(h => (
                                    <tr key={h.id}>
                                        <td style={{ color:"#9aaa9f", width:60 }}>{h.ordemAula}ª</td>
                                        <td style={{ color:"#9aaa9f", width:80 }}>{h.horarioInicio ?? "—"}</td>
                                        <td>
                                            <span style={{ fontWeight:500, color:corMap[h.materiaId], borderLeft:`3px solid ${corMap[h.materiaId]}`, paddingLeft:8 }}>
                                                {h.materiaNome}
                                            </span>
                                        </td>
                                        <td style={{ color:"#5a7060" }}>{h.professorNome}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Dashboard principal ───────────────────────────────────────────
export default function AlunoDashboard() {
    const nome = localStorage.getItem("nome") || "Aluno";
    const [aba, setAba] = useState("inicio");

    const [turmas, setTurmas] = useState([]);
    const [notas, setNotas] = useState([]);
    const [frequencias, setFrequencias] = useState({});
    const [horarios, setHorarios] = useState([]);
    const [carregandoFreq, setCarregandoFreq] = useState(false);

    useEffect(() => {
        api.get("/vinculos/aluno-turma/minhas").then(r => setTurmas(Array.isArray(r.data)?r.data:[])).catch(()=>{});
        api.get("/notas/minhas").then(r => setNotas(Array.isArray(r.data)?r.data:[])).catch(()=>{});
        api.get("/horarios/minhas").then(r => setHorarios(Array.isArray(r.data)?r.data:[])).catch(()=>{});
    }, []);

    useEffect(() => {
        if (!turmas.length || !notas.length) return;
        const turmaId = turmas[0]?.turma?.id;
        if (!turmaId) return;
        const materiasMap = {};
        notas.forEach(n => { const m = n.avaliacao?.materia; if (m) materiasMap[m.id] = m; });
        const materias = Object.values(materiasMap);
        if (!materias.length) return;
        setCarregandoFreq(true);
        Promise.all(materias.map(mat =>
            api.get(`/presencas/minhas/${turmaId}/${mat.id}`)
               .then(r => ({ key:`${turmaId}_${mat.id}`, materiaNome:mat.nome, ...r.data }))
               .catch(()=>null)
        )).then(res => {
            const f = {};
            res.filter(Boolean).forEach(x => { f[x.key] = x; });
            setFrequencias(f);
            setCarregandoFreq(false);
        });
    }, [turmas, notas]);

    return (
        <>
            <style>{STYLE}</style>
            <div style={{ display:"flex", minHeight:"100vh", background:"#f5f8f5" }}>

                {/* ── Sidebar (sticky, igual ao DirecaoDashboard) ── */}
                <aside className="ad-sidebar" style={{
                    width:210, flexShrink:0, display:"flex", flexDirection:"column",
                    position:"sticky", top:0, height:"100vh", overflowY:"auto",
                }}>
                    {/* logo */}
                    <div style={{ padding:"24px 20px 20px", display:"flex", alignItems:"center", gap:12, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
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
                    <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                        <div style={{ width:28, height:28, background:"rgba(126,200,160,.15)", border:"1px solid rgba(126,200,160,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:600, color:"#7ec8a0" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,.65)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nome}</p>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:"0.04em" }}>{turmas[0]?.turma?.nome ?? "—"}</p>
                        </div>
                    </div>

                    {/* nav */}
                    <nav style={{ flex:1, padding:"16px 8px", display:"flex", flexDirection:"column", gap:2 }}>
                        {MENU.map(item => {
                            const Icon = item.icon;
                            return (
                                <button key={item.id} className={`ad-nav-btn${aba===item.id?" active":""}`}
                                        onClick={() => setAba(item.id)}>
                                    <Icon size={14} style={{ flexShrink:0 }} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* logout */}
                    <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                        <button className="ad-nav-btn" onClick={() => { localStorage.clear(); window.location.href="/"; }}
                                style={{ color:"rgba(255,100,100,.5)" }}>
                            <LogOut size={14} />
                            <span>Sair</span>
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
                    {/* header */}
                    <header className="ad-header" style={{ padding:"18px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                            <h1 className="ad-page-title">{MENU.find(m=>m.id===aba)?.label}</h1>
                            <p className="ad-page-sub">DomGestão — Portal do Aluno</p>
                        </div>
                        <div style={{ width:32, height:32, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:"#7ec8a0", letterSpacing:".04em" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                    </header>

                    <main style={{ flex:1, padding:"28px 32px", display:"flex", flexDirection:"column", gap:24 }}>
                        {aba==="inicio"     && <Inicio turmas={turmas} notas={notas} frequencias={frequencias} />}
                        {aba==="boletim"    && <Boletim notas={notas} />}
                        {aba==="frequencia" && <Frequencia frequencias={frequencias} carregando={carregandoFreq} />}
                        {aba==="horarios"   && <Horarios horarios={horarios} />}
                    </main>
                </div>
            </div>
        </>
    );
}
