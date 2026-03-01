import { useState, useEffect } from "react";
import axios from "axios";
import { Home, BookOpen, LogOut, CalendarDays, BarChart2, Menu, ChevronDown } from "lucide-react";

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

@media (max-width: 767px) {
  .ad-sidebar {
    position: fixed !important;
    top: 0; left: 0; bottom: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform .25s ease;
    width: 210px !important;
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
}
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const notaClr = v => {
    if (v === null || v === undefined) return { bg: "#f5f5f5", fg: "#9aaa9f" };
    if (v >= 7) return { bg: "#f0f7f4", fg: "#2d6a4f" };
    if (v >= 5) return { bg: "#fdf8ec", fg: "#92600a" };
    return { bg: "#fdf0f0", fg: "#b94040" };
};
const notaLabel = v => {
    if (v === null || v === undefined) return "—";
    if (v >= 7) return "Aprovado";
    if (v >= 5) return "Recuperação";
    return "Reprovado";
};
const freqClr = v => {
    if (v === null) return { bg: "#f5f5f5", fg: "#9aaa9f" };
    if (v >= 75) return { bg: "#f0f7f4", fg: "#2d6a4f" };
    if (v >= 60) return { bg: "#fdf8ec", fg: "#92600a" };
    return { bg: "#fdf0f0", fg: "#b94040" };
};
const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

// ── Seção: Início ─────────────────────────────────────────────────────────────
function Inicio({ vinculos, notas }) {
    const totalMaterias = vinculos.length;
    const notasValidas = notas.filter(n => n.media !== null && n.media !== undefined);
    const mediaGeral = notasValidas.length
        ? (notasValidas.reduce((s, n) => s + Number(n.media), 0) / notasValidas.length).toFixed(1)
        : null;
    const aprovadas = notasValidas.filter(n => Number(n.media) >= 7).length;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div className="ad-cards-grid">
                <div className="ad-card" style={{ "--accent":"#7ec8a0" }}>
                    <div className="ad-card-num">{totalMaterias}</div>
                    <div className="ad-card-label">Matérias</div>
                </div>
                <div className="ad-card" style={{ "--accent":"#52b69a" }}>
                    <div className="ad-card-num">{mediaGeral ?? "—"}</div>
                    <div className="ad-card-label">Média Geral</div>
                </div>
                <div className="ad-card" style={{ "--accent":"#168aad" }}>
                    <div className="ad-card-num">{aprovadas}/{notasValidas.length}</div>
                    <div className="ad-card-label">Aprovadas</div>
                </div>
            </div>

            {vinculos.length > 0 && (
                <div className="ad-section">
                    <div className="ad-section-header">
                        <span className="ad-section-title">Minhas turmas</span>
                        <span className="ad-section-count">{vinculos.length} vínculo{vinculos.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="ad-table-wrap">
                        <table className="ad-table">
                            <thead>
                                <tr>
                                    <th>Turma</th>
                                    <th>Matéria</th>
                                    <th>Professor</th>
                                    <th>Ano</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vinculos.map((v, i) => (
                                    <tr key={i}>
                                        <td>{v.turmaNome ?? "—"}</td>
                                        <td>{v.materiaNome ?? "—"}</td>
                                        <td>{v.professorNome ?? "—"}</td>
                                        <td>{v.anoLetivo ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Seção: Boletim ────────────────────────────────────────────────────────────
function Boletim({ notas }) {
    const porMateria = agruparPorMateria(notas);

    if (notas.length === 0) {
        return <div style={{ color:"#9aaa9f", fontSize:13, padding:"24px 0" }}>Nenhuma nota registrada.</div>;
    }

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
                <span className="ad-section-title">Frequência</span>
            </div>
            <div className="ad-table-wrap">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Matéria</th>
                            <th>Turma</th>
                            <th>Frequência</th>
                            <th style={{ minWidth:120 }}>Barra</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vinculos.map((v, i) => {
                            const key = `${v.turmaId}-${v.materiaId}`;
                            const freq = frequencias[key];
                            const pct = freq?.percentual !== null && freq?.percentual !== undefined ? Number(freq.percentual) : null;
                            const { bg, fg } = freqClr(pct);
                            return (
                                <tr key={i}>
                                    <td>{v.materiaNome ?? "—"}</td>
                                    <td>{v.turmaNome ?? "—"}</td>
                                    <td>
                                        {pct !== null ? (
                                            <span className="ad-badge" style={{ background:bg, color:fg }}>{pct.toFixed(0)}%</span>
                                        ) : <span style={{ color:"#9aaa9f" }}>—</span>}
                                    </td>
                                    <td>
                                        {pct !== null && (
                                            <div className="ad-progress-bar-bg">
                                                <div className="ad-progress-bar-fill"
                                                     style={{ width:`${Math.min(pct,100)}%`, background: pct >= 75 ? "#7ec8a0" : pct >= 60 ? "#f4a261" : "#e36464" }} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
                            <span className="ad-section-title">{dia}</span>
                            <span className="ad-section-count">{aulas.length} aula{aulas.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="ad-table-wrap">
                            <table className="ad-table">
                                <thead>
                                    <tr>
                                        <th>Horário</th>
                                        <th>Matéria</th>
                                        <th>Professor</th>
                                        <th>Sala</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aulas.sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || "")).map((h, i) => (
                                        <tr key={i}>
                                            <td style={{ fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" }}>
                                                {h.horaInicio ?? "—"}{h.horaFim ? ` – ${h.horaFim}` : ""}
                                            </td>
                                            <td>{h.materiaNome ?? "—"}</td>
                                            <td>{h.professorNome ?? "—"}</td>
                                            <td>{h.sala ?? "—"}</td>
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

// ── Dashboard principal ───────────────────────────────────────────────────────
const abas = [
    { id: "inicio",    label: "Início",      icon: Home },
    { id: "boletim",   label: "Boletim",     icon: BookOpen },
    { id: "frequencia",label: "Frequência",  icon: BarChart2 },
    { id: "horarios",  label: "Horários",    icon: CalendarDays },
];

export default function AlunoDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const [vinculos, setVinculos] = useState([]);
    const [notas, setNotas] = useState([]);
    const nome = localStorage.getItem("nome") || "Aluno";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    useEffect(() => {
        api.get("/vinculos/aluno-turma/minhas")
            .then(r => setVinculos(Array.isArray(r.data) ? r.data : []))
            .catch(() => setVinculos([]));
        api.get("/notas/minhas")
            .then(r => setNotas(Array.isArray(r.data) ? r.data : []))
            .catch(() => setNotas([]));
    }, []);

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
                        {aba === "inicio"     && <Inicio vinculos={vinculos} notas={notas} />}
                        {aba === "boletim"    && <Boletim notas={notas} />}
                        {aba === "frequencia" && <Frequencia vinculos={vinculos} />}
                        {aba === "horarios"   && <Horarios />}
                    </main>
                </div>
            </div>
        </>
    );
}
