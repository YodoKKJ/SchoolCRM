import { useState, useEffect } from "react";
import axios from "axios";
import SearchSelect from "../components/SearchSelect";
import {
    Home, BookOpen, LogOut, GraduationCap,
    Menu, ChevronRight, Search, X, UserPlus, ArrowLeft, CalendarDays, Megaphone, Send, Trash2
} from "lucide-react";

const api = axios.create({ baseURL: "" });
api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return config;
});

/** Formata o nome de exibição de uma turma: "Série — Nome" */
const fmtTurma = (t) => t ? (t.serie?.nome ? `${t.serie.nome} — ${t.nome}` : t.nome) : "";
/** Formata usando campos separados (ex: dados de horário) */
const fmtTurmaNomes = (serieNome, turmaNome) => serieNome ? `${serieNome} — ${turmaNome}` : (turmaNome || "");

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

// ── Design tokens — idênticos ao DirecaoDashboard ──────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
* { box-sizing: border-box; }
:root { font-family: 'DM Sans', sans-serif; }
.pd-sidebar { background: #0d1f18; }
.pd-nav-btn { display:flex; align-items:center; gap:10px; padding:9px 12px; font-size:13px; font-weight:400; color:rgba(255,255,255,.45); border:none; background:transparent; width:100%; text-align:left; cursor:pointer; border-left:2px solid transparent; transition:color .15s, background .15s, border-color .15s; }
.pd-nav-btn:hover { color:rgba(255,255,255,.8); background:rgba(255,255,255,.04); }
.pd-nav-btn.active { color:#7ec8a0; border-left-color:#7ec8a0; background:rgba(126,200,160,.07); font-weight:500; }
.pd-nav-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.3); padding:0 12px; margin-bottom:4px; }
.pd-section { background:#fff; border:1px solid #eaeef2; }
.pd-section-header { border-bottom:1px solid #eaeef2; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
.pd-section-title { font-size:13px; font-weight:500; color:#0d1f18; letter-spacing:.01em; }
.pd-section-count { font-size:11px; color:#9aaa9f; letter-spacing:.04em; }
.pd-page-title { font-family:'Playfair Display', serif; font-size:22px; font-weight:700; color:#0d1f18; letter-spacing:-.02em; line-height:1; }
.pd-page-sub { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#9aaa9f; margin-top:3px; }
.pd-table { width:100%; border-collapse:collapse; }
.pd-table th { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#9aaa9f; padding:10px 20px; text-align:left; background:#f8faf8; border-bottom:1px solid #eaeef2; }
.pd-table td { padding:12px 20px; border-bottom:1px solid #f2f5f2; font-size:13px; color:#2a3a2e; }
.pd-table tr:last-child td { border-bottom:none; }
.pd-table tr:hover td { background:#fafcfa; }
.pd-badge { font-size:11px; font-weight:500; padding:3px 10px; letter-spacing:.02em; }
.pd-btn-primary { background:#0d1f18; color:#fff; border:none; padding:11px 20px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:background .2s; }
.pd-btn-primary:hover { background:#1a4d3a; }
.pd-btn-primary:disabled { opacity:.4; cursor:default; }
.pd-btn-ghost { background:#f4f7f4; color:#5a7060; border:none; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; }
.pd-btn-ghost:hover { background:#ebf0eb; }
.pd-input { border:none; border-bottom:1.5px solid #d4ddd8; background:transparent; padding:9px 0; font-size:14px; font-family:'DM Sans',sans-serif; color:#0d1f18; outline:none; width:100%; transition:border-color .2s; }
.pd-input:focus { border-bottom-color:#0d1f18; }
.pd-input::placeholder { color:#b8c4be; }
.pd-input-wrap { position:relative; }
.pd-input-line { position:absolute; bottom:-1.5px; left:0; height:1.5px; background:#0d1f18; width:0; transition:width .25s ease; }
.pd-input-wrap:focus-within .pd-input-line { width:100%; }
.pd-label { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#9aaa9f; display:block; margin-bottom:6px; }
.pd-ok { font-size:12px; color:#3a6649; padding:10px 14px; background:#f0f5f2; border-left:3px solid #7ec8a0; }
.pd-err { font-size:12px; color:#b94040; padding:10px 14px; background:#fdf0f0; border-left:3px solid #b94040; }
.pd-modal-overlay { position:fixed; inset:0; background:rgba(13,31,24,.55); z-index:50; display:flex; align-items:center; justify-content:center; padding:24px; }
.pd-modal { background:#fff; width:100%; max-width:420px; padding:32px; }
.pd-modal-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:#0d1f18; }
.pd-modal-sub { font-size:12px; color:#9aaa9f; margin-top:2px; letter-spacing:.04em; }
.pd-search-input { width:100%; padding:8px 32px 8px 32px; font-size:12px; border:1px solid #eaeef2; background:white; color:#0d1f18; outline:none; font-family:'DM Sans',sans-serif; transition:border-color .15s; }
.pd-search-input:focus { border-color:#0d1f18; }
.pd-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#9aaa9f; pointer-events:none; }
.pd-search-clear { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#9aaa9f; cursor:pointer; padding:0; }

/* ── Responsivo ─────────────────────────────────────────────── */
.pd-hamburger { display:none; background:none; border:none; cursor:pointer; padding:4px; align-items:center; justify-content:center; }
.pd-ano-selector { display:flex; gap:6px; }
.pd-ano-btn { padding:4px 14px; border-radius:20px; border:1px solid #d0dbd4; background:#fff; font-size:12px; font-weight:600; color:#5a7060; cursor:pointer; transition:background .15s, color .15s; }
.pd-ano-btn:hover { background:#f0f5f2; }
.pd-ano-btn--active { background:#0d1f18; color:#fff; border-color:#0d1f18; }

@media (max-width: 1100px) {
  .pd-sidebar { width: 180px !important; flex-shrink: 0; }
  .pd-nav-btn { font-size: 12px !important; padding: 8px 10px !important; }
}

@media (max-width: 900px) {
  .pd-sidebar {
    position: fixed !important;
    top: 0; left: 0; bottom: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform .25s ease;
    width: 220px !important;
  }
  .pd-sidebar.open { transform: translateX(0); }
  .pd-hamburger { display: flex !important; }
  .pd-header { padding: 14px 16px !important; }
  .pd-main { padding: 16px !important; }
  .pd-modal { max-width: 100% !important; padding: 20px !important; }
  .pd-section { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .pd-table { min-width: 480px; }
}

@media (max-width: 479px) {
  .pd-page-title { font-size: 18px !important; }
}
`;

// ── Helpers ────────────────────────────────────────────────────
function flash(setMsg, texto, tipo = "ok") {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg({ texto: "", tipo: "" }), 3000);
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ProfessorDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const [vinculos, setVinculos] = useState([]);
    const [anoSelecionado, setAnoSelecionado] = useState(null);
    const nome = localStorage.getItem("nome") || "Professor";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    useEffect(() => {
        api.get("/vinculos/professor-turma-materia/minhas").then(r => {
            const vs = r.data || [];
            setVinculos(vs);
            const maxAno = Math.max(0, ...vs.map(v => v.turma?.anoLetivo || 0));
            if (maxAno > 0) setAnoSelecionado(maxAno);
        });
    }, []);

    const anosDisponiveis = [...new Set(vinculos.map(v => v.turma?.anoLetivo).filter(Boolean))]
        .sort((a, b) => b - a);
    const vinculosFiltrados = anoSelecionado
        ? vinculos.filter(v => v.turma?.anoLetivo === anoSelecionado)
        : vinculos;

    const menu = [
        { id:"inicio",       label:"Início",       icon:Home },
        { id:"notas",        label:"Lançar Notas",  icon:BookOpen },
        { id:"presenca",     label:"Chamada",       icon:GraduationCap },
        { id:"horarios",     label:"Horários",      icon:CalendarDays },
        { id:"comunicados",  label:"Comunicados",   icon:Megaphone },
    ];

    return (
        <>
            <style>{STYLE}</style>
            <div style={{ display:"flex", minHeight:"100vh", background:"#f5f8f5" }}>

                {sidebarAberta && (
                    <div style={{ position:"fixed", inset:0, background:"rgba(13,31,24,.4)", zIndex:20 }}
                         onClick={() => setSidebarAberta(false)} />
                )}

                {/* ── Sidebar ── */}
                <aside className={`pd-sidebar${sidebarAberta ? " open" : ""}`} style={{ width:210, flexShrink:0, display:"flex", flexDirection:"column",
                    position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>

                    {/* logo */}
                    <div style={{ padding:"24px 20px 20px", display:"flex", alignItems:"center", gap:12,
                        borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                        <div style={{ width:28, height:28, border:"1.5px solid rgba(255,255,255,.2)", display:"flex",
                            alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,.5)" strokeWidth="1.2"/>
                                <circle cx="8" cy="8" r="2" fill="#7ec8a0"/>
                            </svg>
                        </div>
                        <div>
                            <p style={{ fontWeight:500, fontSize:13, letterSpacing:".08em", color:"rgba(255,255,255,.75)", lineHeight:1 }}>DomGestão</p>
                            <p style={{ fontSize:10, letterSpacing:".1em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginTop:3 }}>Professor</p>
                        </div>
                    </div>

                    {/* user */}
                    <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:10,
                        borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                        <div style={{ width:28, height:28, background:"rgba(126,200,160,.15)",
                            border:"1px solid rgba(126,200,160,.3)", display:"flex", alignItems:"center",
                            justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:600, color:"#7ec8a0" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,.65)",
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nome}</p>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:".04em" }}>Professor</p>
                        </div>
                    </div>

                    {/* nav */}
                    <nav style={{ flex:1, padding:"16px 8px", display:"flex", flexDirection:"column", gap:2 }}>
                        <p className="pd-nav-label" style={{ marginBottom:8 }}>Menu</p>
                        {menu.map(item => {
                            const Icon = item.icon;
                            return (
                                <button key={item.id} className={`pd-nav-btn${aba===item.id?" active":""}`}
                                        onClick={() => { setAba(item.id); setSidebarAberta(false); }}>
                                    <Icon size={14} style={{ flexShrink:0 }} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                        <button className="pd-nav-btn" onClick={logout} style={{ color:"rgba(255,100,100,.5)" }}>
                            <LogOut size={14} />
                            <span>Sair</span>
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
                    <header className="pd-header" style={{ background:"#fff", borderBottom:"1px solid #eaeef2", padding:"18px 32px",
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        position:"sticky", top:0, zIndex:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                            <button className="pd-hamburger" onClick={() => setSidebarAberta(true)}>
                                <Menu size={20} color="#0d1f18" />
                            </button>
                            <div>
                                <h1 className="pd-page-title">{menu.find(m => m.id===aba)?.label}</h1>
                                <p className="pd-page-sub">DomGestão — Sistema Escolar</p>
                            </div>
                        </div>
                        <div style={{ width:32, height:32, background:"#0d1f18", display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:12, fontWeight:600, color:"#7ec8a0" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                    </header>

                    <main className="pd-main" style={{ flex:1, padding:"28px 32px", display:"flex", flexDirection:"column", gap:20 }}>
                        {anosDisponiveis.length > 1 && (
                            <div className="pd-ano-selector">
                                {anosDisponiveis.map(ano => (
                                    <button
                                        key={ano}
                                        className={`pd-ano-btn${ano === anoSelecionado ? " pd-ano-btn--active" : ""}`}
                                        onClick={() => setAnoSelecionado(ano)}
                                    >
                                        {ano}
                                    </button>
                                ))}
                            </div>
                        )}
                        {aba === "inicio"      && <Inicio vinculos={vinculosFiltrados} />}
                        {aba === "notas"       && <LancarNotas vinculos={vinculosFiltrados} />}
                        {aba === "presenca"    && <Chamada vinculos={vinculosFiltrados} />}
                        {aba === "horarios"    && <HorariosView />}
                        {aba === "comunicados" && <ComunicadosProfessor vinculos={vinculosFiltrados} />}
                    </main>
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════
// INÍCIO — visão geral das turmas do professor
// ═══════════════════════════════════════════════════════════════
function Inicio({ vinculos }) {
    const [resumos, setResumos] = useState({});   // { turmaId: { ...resumo, carregando } }

    const porTurma = vinculos.reduce((acc, v) => {
        const key = v.turma?.id;
        if (!acc[key]) acc[key] = { turma: v.turma, materias: [] };
        acc[key].materias.push(v.materia);
        return acc;
    }, {});
    const turmas = Object.values(porTurma);

    useEffect(() => {
        turmas.forEach(({ turma }) => {
            if (!turma?.id || resumos[turma.id]) return;
            setResumos(prev => ({ ...prev, [turma.id]: { carregando: true } }));
            api.get(`/notas/turma/${turma.id}/resumo`)
               .then(r => setResumos(prev => ({ ...prev, [turma.id]: { ...r.data, carregando: false } })))
               .catch(() => setResumos(prev => ({ ...prev, [turma.id]: { carregando: false, erro: true } })));
        });
    }, [vinculos.length]); // eslint-disable-line

    const totalEmRisco = Object.values(resumos).reduce((s, r) => s + (r.emRiscoCount || 0), 0);
    const totalAlunos  = Object.values(resumos).reduce((s, r) => s + (r.totalAlunos  || 0), 0);

    const corSit = s => s === "Em Risco" ? "#b94040" : s === "Aprovando" ? "#3a7a5a" : "#9aaa9f";
    const bgSit  = s => s === "Em Risco" ? "#fdf0f0" : s === "Aprovando" ? "#f0f5f2" : "#f5f7f5";

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            {/* Cards gerais */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
                {[
                    { label:"Turmas",     value: turmas.length,    accent:"#0d1f18" },
                    { label:"Matérias",   value: vinculos.length,  accent:"#2d6a4f" },
                    { label:"Alunos",     value: totalAlunos || "—", accent:"#7ec8a0" },
                    { label:"Em Risco",   value: totalEmRisco || "0", accent: totalEmRisco > 0 ? "#e63946" : "#b7dfc8",
                      valueColor: totalEmRisco > 0 ? "#e63946" : undefined },
                ].map(c => (
                    <div key={c.label} className="pd-section" style={{ borderTop:`2px solid ${c.accent}`, padding:"20px" }}>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700,
                                    color: c.valueColor || "#0d1f18", lineHeight:1 }}>{c.value}</p>
                        <p style={{ fontSize:11, letterSpacing:".06em", textTransform:"uppercase", color:"#9aaa9f", marginTop:4 }}>{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Painel por turma */}
            {turmas.map(({ turma, materias }) => {
                const res = resumos[turma?.id];
                const alunos = res?.alunos || [];
                const emRisco = alunos.filter(a => a.emRisco);

                return (
                    <div key={turma?.id} className="pd-section">
                        {/* cabeçalho turma */}
                        <div className="pd-section-header" style={{ flexWrap:"wrap", gap:8 }}>
                            <div>
                                <span className="pd-section-title">{turma?.nome}</span>
                                <span style={{ marginLeft:8, fontSize:11, color:"#9aaa9f" }}>{turma?.serie?.nome}</span>
                            </div>
                            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                                {materias.map(m => (
                                    <span key={m?.id} className="pd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>{m?.nome}</span>
                                ))}
                                {res && !res.carregando && !res.erro && (
                                    <>
                                        <span style={{ fontSize:12, color:"#9aaa9f" }}>·</span>
                                        <span style={{ fontSize:12, color:"#5a7060" }}>{res.totalAlunos} alunos</span>
                                        <span style={{ fontSize:12, color:"#9aaa9f" }}>·</span>
                                        <span style={{ fontSize:12, fontWeight:600, color:"#0d1f18" }}>
                                            Média: {res.mediaTurma ?? "—"}
                                        </span>
                                        {res.emRiscoCount > 0 && (
                                            <span className="pd-badge" style={{ background:"#fdf0f0", color:"#b94040" }}>
                                                ⚠ {res.emRiscoCount} em risco
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {res?.carregando && (
                            <p style={{ padding:"20px", color:"#9aaa9f", fontSize:13, textAlign:"center" }}>Carregando...</p>
                        )}

                        {!res?.carregando && alunos.length === 0 && (
                            <p style={{ padding:"20px", color:"#9aaa9f", fontSize:13, textAlign:"center" }}>Nenhum aluno vinculado.</p>
                        )}

                        {!res?.carregando && alunos.length > 0 && (
                            <>
                                {/* Alunos em risco — destaque vermelho */}
                                {emRisco.length > 0 && (
                                    <div style={{ margin:"0 20px 16px", border:"1px solid #f5c6c6", borderRadius:6, overflow:"hidden" }}>
                                        <div style={{ background:"#fdf0f0", padding:"8px 14px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid #f5c6c6" }}>
                                            <span style={{ fontSize:14 }}>⚠</span>
                                            <span style={{ fontSize:12, fontWeight:600, color:"#b94040", letterSpacing:".02em" }}>
                                                {emRisco.length} aluno{emRisco.length > 1 ? "s" : ""} em risco de reprovação
                                            </span>
                                        </div>
                                        <table className="pd-table" style={{ margin:0 }}>
                                            <thead>
                                                <tr>
                                                    <th>Aluno</th>
                                                    <th>Média</th>
                                                    <th>Frequência</th>
                                                    <th>Disciplinas com problema</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {emRisco.map(a => {
                                                    const discRisco = (a.disciplinas || []).filter(d => d.emRisco);
                                                    return (
                                                        <tr key={a.alunoId}>
                                                            <td style={{ fontWeight:500 }}>{a.alunoNome}</td>
                                                            <td>
                                                                <span style={{ fontWeight:700, color: a.mediaGeral !== null && a.mediaGeral < 6 ? "#b94040" : "#0d1f18" }}>
                                                                    {a.mediaGeral ?? "—"}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight:700, color: a.frequenciaGeral < 75 ? "#b94040" : "#0d1f18" }}>
                                                                    {a.frequenciaGeral?.toFixed(1)}%
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                                                    {discRisco.map(d => (
                                                                        <span key={d.materiaNome} style={{ fontSize:10, background:"#fdf0f0", color:"#b94040", padding:"2px 7px", borderRadius:3 }}>
                                                                            {d.materiaNome}
                                                                            {d.mediaAnual < 6 && ` (${d.mediaAnual})`}
                                                                            {d.frequencia < 75 && ` ${d.frequencia.toFixed(0)}%`}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Todos os alunos */}
                                <div style={{ overflowX:"auto" }}>
                                    <table className="pd-table">
                                        <thead>
                                            <tr>
                                                <th>Aluno</th>
                                                <th>Média Geral</th>
                                                <th>Frequência</th>
                                                <th>Situação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alunos.map(a => (
                                                <tr key={a.alunoId}>
                                                    <td style={{ fontWeight:500 }}>{a.alunoNome}</td>
                                                    <td style={{ fontWeight:700, color: a.mediaGeral !== null && a.mediaGeral < 6 ? "#b94040" : "#0d1f18" }}>
                                                        {a.mediaGeral ?? "—"}
                                                    </td>
                                                    <td style={{ fontWeight:600, color: a.frequenciaGeral < 75 ? "#b94040" : "#3a7a5a" }}>
                                                        {a.frequenciaGeral?.toFixed(1)}%
                                                    </td>
                                                    <td>
                                                        <span className="pd-badge" style={{ color:corSit(a.situacao), background:bgSit(a.situacao) }}>
                                                            {a.situacao}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}

            {turmas.length === 0 && (
                <div className="pd-section" style={{ padding:"40px", textAlign:"center" }}>
                    <p style={{ fontSize:13, color:"#9aaa9f" }}>Nenhuma turma vinculada. Solicite à direção.</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// LANÇAR NOTAS
// ═══════════════════════════════════════════════════════════════
function LancarNotas({ vinculos }) {
    const [turmaId, setTurmaId] = useState("");
    const [materiaId, setMateriaId] = useState("");
    const [alunos, setAlunos] = useState([]);
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [avaliacaoSel, setAvaliacaoSel] = useState(null);
    const [notasEdit, setNotasEdit] = useState({});
    const [criandoAv, setCriandoAv] = useState(false);
    const [formAv, setFormAv] = useState({ tipo:"PROVA", descricao:"", peso:"1.0", bonificacao:false, bimestre:"1" });
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);
    const [notasComErro, setNotasComErro] = useState({});
    const [modalParticipantes, setModalParticipantes] = useState(null); // avaliação RECUPERACAO sendo editada
    const [participantesSel, setParticipantesSel] = useState(new Set());
    const [salvandoPart, setSalvandoPart] = useState(false);

    // turmas únicas do professor
    const turmas = [...new Map(vinculos.map(v => [v.turma?.id, v.turma])).values()].filter(Boolean);
    // matérias do professor nessa turma
    const materiasDaTurma = vinculos
        .filter(v => String(v.turma?.id) === String(turmaId))
        .map(v => v.materia).filter(Boolean);

    useEffect(() => {
        if (!turmaId) return;
        api.get(`/vinculos/aluno-turma/turma/${turmaId}`)
            .then(r => setAlunos((r.data || []).map(v => v.aluno).filter(Boolean)));
    }, [turmaId]);

    useEffect(() => {
        if (!turmaId || !materiaId) return;
        api.get("/notas/avaliacoes", { params: { turmaId, materiaId } })
            .then(r => { setAvaliacoes(r.data || []); setAvaliacaoSel(null); setNotasEdit({}); });
    }, [turmaId, materiaId]);

    const selecionarAv = (av) => {
        setAvaliacaoSel(av);
        setNotasComErro({});
        const init = {};
        av.notas.forEach(n => init[n.alunoId] = String(n.valor));
        setNotasEdit(init);
    };

    const abrirModalParticipantes = (av) => {
        setModalParticipantes(av);
        const ids = new Set((av.recuperacaoParticipantes || []).map(p => p.alunoId));
        // Se não tem participantes ainda, seleciona todos por padrão
        setParticipantesSel(ids.size > 0 ? ids : new Set(alunos.map(a => a.id)));
    };

    const salvarParticipantes = async () => {
        if (!modalParticipantes) return;
        setSalvandoPart(true);
        try {
            await api.put(`/notas/avaliacao/${modalParticipantes.id}/participantes`, {
                alunoIds: [...participantesSel]
            });
            flash(setMsg, "Participantes salvos!");
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
            // Atualiza a avaliação selecionada se for a mesma
            if (avaliacaoSel?.id === modalParticipantes.id) {
                const updated = (r.data || []).find(a => a.id === modalParticipantes.id);
                if (updated) selecionarAv(updated);
            }
            setModalParticipantes(null);
        } catch { flash(setMsg, "Erro ao salvar participantes.", "erro"); }
        setSalvandoPart(false);
    };

    const criarAvaliacao = async (e) => {
        e.preventDefault();
        try {
            const resp = await api.post("/notas/avaliacao", { turmaId: String(turmaId), materiaId: String(materiaId), ...formAv, bimestre: formAv.bimestre });
            const novaAv = resp.data;
            flash(setMsg, "Avaliação criada!");
            setCriandoAv(false);
            setFormAv({ tipo:"PROVA", descricao:"", peso:"1.0", bonificacao:false, bimestre:"1" });
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
            // Para RECUPERACAO, abre o modal de participantes automaticamente
            if (formAv.tipo === "RECUPERACAO") {
                const avCriada = (r.data || []).find(a => a.id === novaAv.id);
                if (avCriada) abrirModalParticipantes(avCriada);
            }
        } catch { flash(setMsg, "Erro ao criar avaliação.", "erro"); }
    };

    const salvarNotas = async () => {
        if (!avaliacaoSel) return;
        const alunosAlvo = avaliacaoSel.tipo === "RECUPERACAO"
            ? alunos.filter(a => (avaliacaoSel.recuperacaoParticipantes || []).some(p => p.alunoId === a.id))
            : alunos;

        // Valida tudo antes de qualquer chamada à API
        const errosValidacao = {};
        for (const aluno of alunosAlvo) {
            const val = notasEdit[aluno.id];
            if (val === undefined || val === "") continue;
            const num = parseFloat(val);
            if (isNaN(num)) {
                errosValidacao[aluno.id] = true;
            } else if (avaliacaoSel.bonificacao) {
                if (num < 0 || num > 1) errosValidacao[aluno.id] = true;
            } else {
                if (num < 0 || num > 10) errosValidacao[aluno.id] = true;
            }
        }
        if (Object.keys(errosValidacao).length > 0) {
            setNotasComErro(errosValidacao);
            const nomes = alunosAlvo.filter(a => errosValidacao[a.id]).map(a => a.nome).join(", ");
            flash(setMsg, `Nota inválida — corrija antes de salvar: ${nomes}`, "erro");
            return;
        }

        setNotasComErro({});
        setSalvando(true);
        let erros = 0;
        for (const aluno of alunosAlvo) {
            const val = notasEdit[aluno.id];
            if (val === undefined || val === "") continue;
            try {
                await api.post("/notas/lancar", {
                    avaliacaoId: String(avaliacaoSel.id),
                    alunoId: String(aluno.id),
                    valor: val
                });
            } catch { erros++; }
        }
        setSalvando(false);
        flash(setMsg, erros > 0 ? `${erros} erro(s) ao salvar.` : "Notas salvas!", erros > 0 ? "erro" : "ok");
        const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
        setAvaliacoes(r.data || []);
        if (avaliacaoSel) {
            const updated = (r.data || []).find(a => a.id === avaliacaoSel.id);
            if (updated) selecionarAv(updated);
        }
    };

    const tipoLabel = { PROVA:"Prova", TRABALHO:"Trabalho", SIMULADO:"Bônus", RECUPERACAO:"Recuperação" };
    const tipoColor = {
        PROVA:{ bg:"#f0f5f2", color:"#2d6a4f" },
        TRABALHO:{ bg:"#f5f3ee", color:"#7a5c2e" },
        SIMULADO:{ bg:"#f0f0f8", color:"#4a4a8a" },
        RECUPERACAO:{ bg:"#fff3e0", color:"#b45309" }
    };

    const semSelecao = !turmaId || !materiaId;

    // Alunos visíveis na tabela de notas
    const alunosNaTabela = avaliacaoSel?.tipo === "RECUPERACAO"
        ? alunos.filter(a => (avaliacaoSel.recuperacaoParticipantes || []).some(p => p.alunoId === a.id))
        : alunos;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Seletor */}
            <div className="pd-section" style={{ padding:24 }}>
                <p className="pd-section-title" style={{ marginBottom:20 }}>Selecionar Turma e Matéria</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                        <label className="pd-label">Turma</label>
                        <SearchSelect
                            options={turmas.map(t => ({ value: t.id, label: fmtTurma(t) }))}
                            value={turmaId}
                            onChange={v => { setTurmaId(v); setMateriaId(""); }}
                            placeholder="Selecione a turma..." />
                    </div>
                    <div>
                        <label className="pd-label">Matéria</label>
                        <SearchSelect
                            options={materiasDaTurma.map(m => ({ value: m.id, label: m.nome }))}
                            value={materiaId}
                            onChange={setMateriaId}
                            placeholder={turmaId ? "Selecione a matéria..." : "Primeiro selecione a turma"} />
                    </div>
                </div>
            </div>

            {msg.texto && <div className={msg.tipo==="ok"?"pd-ok":"pd-err"}>{msg.texto}</div>}

            {semSelecao && (
                <div style={{ padding:"48px", textAlign:"center", color:"#9aaa9f", fontSize:13,
                    background:"#fff", border:"1px solid #eaeef2" }}>
                    Selecione uma turma e matéria para lançar notas.
                </div>
            )}

            {!semSelecao && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {/* Lista avaliações */}
                    <div className="pd-section">
                        <div className="pd-section-header">
                            <span className="pd-section-title">Avaliações</span>
                            <button className="pd-btn-primary" onClick={() => setCriandoAv(true)}>
                                + Nova Avaliação
                            </button>
                        </div>
                        {avaliacoes.length === 0
                            ? <p style={{ padding:"32px", textAlign:"center", fontSize:12, color:"#9aaa9f" }}>
                                Nenhuma avaliação criada ainda.
                            </p>
                            : avaliacoes.map(av => {
                                const tc = tipoColor[av.tipo] || tipoColor.PROVA;
                                const ativa = avaliacaoSel?.id === av.id;
                                const isRec = av.tipo === "RECUPERACAO";
                                return (
                                    <div key={av.id} onClick={() => selecionarAv(av)}
                                         style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:16,
                                             borderBottom:"1px solid #f2f5f2", cursor:"pointer",
                                             background: ativa ? "#f8faf8" : "white",
                                             borderLeft: ativa ? "3px solid #0d1f18" : "3px solid transparent" }}>
                                        <span className="pd-badge" style={{ background:tc.bg, color:tc.color, flexShrink:0 }}>
                                            {tipoLabel[av.tipo]}
                                        </span>
                                        <div style={{ flex:1 }}>
                                            <p style={{ fontSize:13, fontWeight:500, color:"#0d1f18" }}>
                                                {av.descricao || tipoLabel[av.tipo]}
                                            </p>
                                            <p style={{ fontSize:11, color:"#9aaa9f", marginTop:2 }}>
                                                {isRec
                                                    ? `${av.bimestre}º Bimestre · substitui média se maior`
                                                    : `Peso ${av.peso} · ${av.dataAplicacao || "sem data"}${av.bonificacao ? " · ✦ Bônus" : ""}`
                                                }
                                            </p>
                                        </div>
                                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                            {isRec && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); abrirModalParticipantes(av); }}
                                                    style={{ fontSize:11, padding:"4px 10px", border:"1px solid #f0c070",
                                                        background:"#fff8e8", color:"#b45309", borderRadius:4, cursor:"pointer" }}>
                                                    Participantes ({(av.recuperacaoParticipantes || []).length})
                                                </button>
                                            )}
                                            <span style={{ fontSize:11, color:"#9aaa9f" }}>
                                                {isRec
                                                    ? `${av.notas.length}/${(av.recuperacaoParticipantes || []).length} notas`
                                                    : `${av.notas.length}/${alunos.length} notas`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>

                    {/* Tabela de notas */}
                    {avaliacaoSel && (
                        <div className="pd-section">
                            <div className="pd-section-header">
                                <div>
                                    <span className="pd-section-title">{avaliacaoSel.descricao || tipoLabel[avaliacaoSel.tipo]}</span>
                                    <p style={{ fontSize:11, color:"#9aaa9f", marginTop:2 }}>
                                        {avaliacaoSel.tipo === "RECUPERACAO"
                                            ? `Recuperação · ${avaliacaoSel.bimestre}º Bimestre · nota de 0 a 10`
                                            : avaliacaoSel.bonificacao
                                                ? "Bônus — valor entre 0.00 e 1.00"
                                                : `Peso ${avaliacaoSel.peso} — nota de 0 a 10`}
                                    </p>
                                </div>
                                <div style={{ display:"flex", gap:8 }}>
                                    {avaliacaoSel.tipo === "RECUPERACAO" && (
                                        <button className="pd-btn-ghost"
                                                onClick={() => abrirModalParticipantes(avaliacaoSel)}
                                                style={{ fontSize:12 }}>
                                            Editar Participantes
                                        </button>
                                    )}
                                    <button className="pd-btn-primary" onClick={salvarNotas} disabled={salvando}>
                                        {salvando ? "Salvando..." : "Salvar Notas →"}
                                    </button>
                                </div>
                            </div>
                            {avaliacaoSel.tipo === "RECUPERACAO" && alunosNaTabela.length === 0 && (
                                <div style={{ padding:"32px", textAlign:"center", fontSize:12, color:"#9aaa9f" }}>
                                    Nenhum participante selecionado.{" "}
                                    <button onClick={() => abrirModalParticipantes(avaliacaoSel)}
                                            style={{ background:"none", border:"none", color:"#b45309", cursor:"pointer", fontSize:12, textDecoration:"underline" }}>
                                        Adicionar participantes
                                    </button>
                                </div>
                            )}
                            {alunosNaTabela.length > 0 && (
                                <table className="pd-table">
                                    <thead>
                                    <tr>
                                        <th>Aluno</th>
                                        <th style={{ width:200 }}>Nota {avaliacaoSel.bonificacao ? "(0.00–1.00)" : "(0–10)"}</th>
                                        <th style={{ width:100 }}>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {alunosNaTabela.map(aluno => {
                                        const val = notasEdit[aluno.id] ?? "";
                                        const temNota = avaliacaoSel.notas.some(n => n.alunoId === aluno.id);
                                        const temErro = !!notasComErro[aluno.id];
                                        return (
                                            <tr key={aluno.id} style={{ background: temErro ? "#fff5f5" : undefined }}>
                                                <td>
                                                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                        <div style={{ width:26, height:26, background:"#0d1f18", display:"flex",
                                                            alignItems:"center", justifyContent:"center", fontSize:11,
                                                            fontWeight:600, color:"#7ec8a0", flexShrink:0 }}>
                                                            {aluno.nome.charAt(0)}
                                                        </div>
                                                        <span style={{ fontWeight:500 }}>{aluno.nome}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <input type="number"
                                                           min={0} max={avaliacaoSel.bonificacao ? 1 : 10}
                                                           step={avaliacaoSel.bonificacao ? 0.01 : 0.1}
                                                           value={val}
                                                           onChange={e => {
                                                               setNotasEdit(p => ({ ...p, [aluno.id]: e.target.value }));
                                                               if (notasComErro[aluno.id]) setNotasComErro(p => { const n = {...p}; delete n[aluno.id]; return n; });
                                                           }}
                                                           placeholder="—"
                                                           className="pd-input"
                                                           style={{ width:120, fontSize:16, fontFamily:"'Playfair Display',serif", fontWeight:700,
                                                               outline: temErro ? "2px solid #c0392b" : undefined,
                                                               borderRadius: temErro ? 2 : undefined }} />
                                                </td>
                                                <td>
                                                    {temErro
                                                        ? <span className="pd-badge" style={{ background:"#fdf0f0", color:"#c0392b" }}>Inválida</span>
                                                        : temNota
                                                            ? <span className="pd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>Lançada</span>
                                                            : <span className="pd-badge" style={{ background:"#f5f3ee", color:"#7a5c2e" }}>Pendente</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal nova avaliação */}
            {criandoAv && (
                <div className="pd-modal-overlay">
                    <div className="pd-modal">
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                            <div>
                                <p className="pd-modal-title">Nova Avaliação</p>
                                <p className="pd-modal-sub">
                                    {fmtTurma(turmas.find(t => String(t.id)===String(turmaId)))} · {materiasDaTurma.find(m => String(m.id)===String(materiaId))?.nome}
                                </p>
                            </div>
                            <button onClick={() => setCriandoAv(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={criarAvaliacao} style={{ display:"flex", flexDirection:"column", gap:20 }}>
                            <div>
                                <label className="pd-label">Bimestre</label>
                                <div style={{ display:"flex" }}>
                                    {["1","2","3","4"].map((b, i) => (
                                        <button key={b} type="button"
                                                onClick={() => setFormAv(p => ({...p, bimestre:b}))}
                                                style={{ flex:1, padding:"9px", border:"1px solid #eaeef2",
                                                    borderRight: i < 3 ? "none" : "1px solid #eaeef2",
                                                    background: formAv.bimestre===b ? "#0d1f18" : "white",
                                                    color: formAv.bimestre===b ? "#7ec8a0" : "#9aaa9f",
                                                    fontSize:11, fontWeight:500, letterSpacing:".06em",
                                                    textTransform:"uppercase", cursor:"pointer" }}>
                                            {b}º
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="pd-label">Tipo</label>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:0 }}>
                                    {["PROVA","TRABALHO","SIMULADO","RECUPERACAO"].map((t, i, arr) => (
                                        <button key={t} type="button"
                                                onClick={() => setFormAv(p => ({ ...p, tipo:t, bonificacao: t==="SIMULADO" }))}
                                                style={{ flex:"1 0 auto", padding:"9px", border:"1px solid #eaeef2",
                                                    borderRight: i < arr.length - 1 ? "none" : "1px solid #eaeef2",
                                                    background: formAv.tipo===t ? (t==="RECUPERACAO" ? "#7a3800" : "#0d1f18") : "white",
                                                    color: formAv.tipo===t ? (t==="RECUPERACAO" ? "#ffd08a" : "#7ec8a0") : "#9aaa9f",
                                                    fontSize:11, fontWeight:500, letterSpacing:".06em",
                                                    textTransform:"uppercase", cursor:"pointer" }}>
                                            {t==="SIMULADO" ? "Bônus" : t==="RECUPERACAO" ? "Recup." : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="pd-label">Descrição</label>
                                <div className="pd-input-wrap">
                                    <input className="pd-input" placeholder="Ex: Prova bimestral 1"
                                           value={formAv.descricao}
                                           onChange={e => setFormAv(p => ({ ...p, descricao:e.target.value }))} />
                                    <div className="pd-input-line" />
                                </div>
                            </div>
                            {formAv.tipo !== "SIMULADO" && formAv.tipo !== "RECUPERACAO" && (
                                <div>
                                    <label className="pd-label">Peso</label>
                                    <div className="pd-input-wrap">
                                        <input className="pd-input" type="number" min="0.1" max="10" step="0.1"
                                               value={formAv.peso}
                                               onChange={e => setFormAv(p => ({ ...p, peso:e.target.value }))} />
                                        <div className="pd-input-line" />
                                    </div>
                                </div>
                            )}
                            {formAv.tipo === "SIMULADO" && (
                                <div className="pd-ok">✦ Bônus — somado à média final sem entrar no denominador.</div>
                            )}
                            {formAv.tipo === "RECUPERACAO" && (
                                <div style={{ background:"#fff8e8", border:"1px solid #f0c070", borderRadius:6, padding:"12px 14px", fontSize:12, color:"#7a4800" }}>
                                    ↩ Recuperação — substitui a média do bimestre se a nota for maior. Após criar, você escolherá quais alunos participam.
                                </div>
                            )}
                            <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                <button type="button" onClick={() => setCriandoAv(false)} className="pd-btn-ghost" style={{ flex:1 }}>Cancelar</button>
                                <button type="submit" className="pd-btn-primary" style={{ flex:1 }}>Criar →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal participantes da recuperação */}
            {modalParticipantes && (
                <div className="pd-modal-overlay">
                    <div className="pd-modal" style={{ maxWidth:480 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                                <p className="pd-modal-title">Participantes da Recuperação</p>
                                <p className="pd-modal-sub">
                                    {modalParticipantes.bimestre}º Bimestre · {modalParticipantes.descricao || "Recuperação"}
                                </p>
                            </div>
                            <button onClick={() => setModalParticipantes(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                            <button type="button" className="pd-btn-ghost" style={{ fontSize:11 }}
                                    onClick={() => setParticipantesSel(new Set(alunos.map(a => a.id)))}>
                                Selecionar todos
                            </button>
                            <button type="button" className="pd-btn-ghost" style={{ fontSize:11 }}
                                    onClick={() => setParticipantesSel(new Set())}>
                                Desmarcar todos
                            </button>
                        </div>

                        <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:340, overflowY:"auto", marginBottom:20 }}>
                            {alunos.map(aluno => {
                                const marcado = participantesSel.has(aluno.id);
                                return (
                                    <label key={aluno.id}
                                           style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px",
                                               border:"1px solid", borderColor: marcado ? "#f0c070" : "#eaeef2",
                                               borderRadius:6, cursor:"pointer",
                                               background: marcado ? "#fff8e8" : "white" }}>
                                        <input type="checkbox" checked={marcado}
                                               onChange={() => setParticipantesSel(prev => {
                                                   const next = new Set(prev);
                                                   next.has(aluno.id) ? next.delete(aluno.id) : next.add(aluno.id);
                                                   return next;
                                               })}
                                               style={{ accentColor:"#b45309", width:15, height:15, flexShrink:0 }} />
                                        <div style={{ width:26, height:26, background:"#0d1f18", display:"flex",
                                            alignItems:"center", justifyContent:"center", fontSize:11,
                                            fontWeight:600, color:"#7ec8a0", flexShrink:0 }}>
                                            {aluno.nome.charAt(0)}
                                        </div>
                                        <span style={{ fontSize:13, fontWeight:500, color:"#0d1f18" }}>{aluno.nome}</span>
                                    </label>
                                );
                            })}
                        </div>

                        <p style={{ fontSize:11, color:"#9aaa9f", marginBottom:16 }}>
                            {participantesSel.size} de {alunos.length} aluno(s) selecionado(s)
                        </p>

                        <div style={{ display:"flex", gap:8 }}>
                            <button type="button" onClick={() => setModalParticipantes(null)} className="pd-btn-ghost" style={{ flex:1 }}>
                                Cancelar
                            </button>
                            <button type="button" onClick={salvarParticipantes} className="pd-btn-primary"
                                    disabled={salvandoPart} style={{ flex:1 }}>
                                {salvandoPart ? "Salvando..." : "Salvar Participantes →"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CHAMADA (PRESENÇA)
// ═══════════════════════════════════════════════════════════════
function Chamada({ vinculos }) {
    const [turmaId, setTurmaId] = useState("");
    const [materiaId, setMateriaId] = useState("");
    const [alunos, setAlunos] = useState([]);
    // toLocaleDateString('en-CA') dá YYYY-MM-DD no fuso do usuário (evita data UTC ≠ data local)
    const [dataAula, setDataAula] = useState(new Date().toLocaleDateString("en-CA"));
    const [chamadaPorAula, setChamadaPorAula] = useState({}); // { ordemAula: { alunoId: bool } }
    const [aulasNoDia, setAulasNoDia] = useState([]);
    const [loadingAulas, setLoadingAulas] = useState(false);
    const [historico, setHistorico] = useState({});
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);
    const [abaLocal, setAbaLocal] = useState("chamada"); // "chamada" | "historico"
    const [aulasColapsadas, setAulasColapsadas] = useState(new Set());
    const toggleAulaColapsada = (ordemAula) =>
        setAulasColapsadas(prev => {
            const next = new Set(prev);
            next.has(ordemAula) ? next.delete(ordemAula) : next.add(ordemAula);
            return next;
        });

    const DIAS_SEMANA = ["DOM","SEG","TER","QUA","QUI","SEX","SAB"];
    const DIAS_LABEL_PT = { SEG:"Segunda",TER:"Terça",QUA:"Quarta",QUI:"Quinta",SEX:"Sexta",SAB:"Sábado",DOM:"Domingo" };

    const turmas = [...new Map(vinculos.map(v => [v.turma?.id, v.turma])).values()].filter(Boolean);
    const materiasDaTurma = vinculos
        .filter(v => String(v.turma?.id) === String(turmaId))
        .map(v => v.materia).filter(Boolean);

    useEffect(() => {
        if (!turmaId) return;
        api.get(`/vinculos/aluno-turma/turma/${turmaId}`)
            .then(r => setAlunos((r.data || []).map(v => v.aluno).filter(Boolean)));
    }, [turmaId]);

    useEffect(() => {
        if (!turmaId || !materiaId) return;
        api.get(`/presencas/turma/${turmaId}/materia/${materiaId}`)
            .then(r => setHistorico(r.data || {}));
    }, [turmaId, materiaId]);

    // Busca quantas aulas da matéria existem nesse dia da semana
    useEffect(() => {
        if (!turmaId || !materiaId || !dataAula) { setAulasNoDia([]); return; }
        const diaSemana = DIAS_SEMANA[new Date(dataAula + "T12:00").getDay()];
        setLoadingAulas(true);
        api.get(`/horarios/turma/${turmaId}/dia/${diaSemana}?data=${dataAula}`)
            .then(r => {
                const filtradas = (r.data || []).filter(h => String(h.materiaId) === String(materiaId));
                setAulasNoDia(filtradas);
            })
            .catch(() => setAulasNoDia([]))
            .finally(() => setLoadingAulas(false));
    }, [turmaId, materiaId, dataAula]);

    // Preenche chamadaPorAula ao mudar aulasNoDia, historico, dataAula ou alunos
    useEffect(() => {
        if (aulasNoDia.length === 0) { setChamadaPorAula({}); return; }
        const novaMap = {};
        aulasNoDia.forEach(aula => {
            const init = {};
            alunos.forEach(a => { init[a.id] = true; });
            (historico[dataAula] || [])
                .filter(r => r.ordemAula === aula.ordemAula)
                .forEach(r => { init[r.alunoId] = r.presente; });
            novaMap[aula.ordemAula] = init;
        });
        setChamadaPorAula(novaMap);
    }, [aulasNoDia, historico, dataAula, alunos]);

    const salvarChamada = async () => {
        setSalvando(true);
        let erros = 0;
        for (const aula of aulasNoDia) {
            for (const aluno of alunos) {
                try {
                    await api.post("/presencas/lancar", {
                        alunoId: String(aluno.id),
                        turmaId: String(turmaId),
                        materiaId: String(materiaId),
                        presente: String(chamadaPorAula[aula.ordemAula]?.[aluno.id] ?? true),
                        data: dataAula,
                        ordemAula: String(aula.ordemAula),
                        horarioInicio: aula.horarioInicio,
                    });
                } catch { erros++; }
            }
        }
        setSalvando(false);
        flash(setMsg, erros > 0 ? `${erros} erro(s).` : "Chamada salva!", erros > 0 ? "erro" : "ok");
        const r = await api.get(`/presencas/turma/${turmaId}/materia/${materiaId}`);
        setHistorico(r.data || {});
    };

    const semSelecao = !turmaId || !materiaId;
    const diaSemana = dataAula ? DIAS_SEMANA[new Date(dataAula + "T12:00").getDay()] : null;
    const diaSemanaLabel = diaSemana ? (DIAS_LABEL_PT[diaSemana] || diaSemana) : "";
    const materiaNome = materiasDaTurma.find(m => String(m.id) === String(materiaId))?.nome || "";
    const bloqueado = !loadingAulas && aulasNoDia.length === 0;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Seletor */}
            <div className="pd-section" style={{ padding:24 }}>
                <p className="pd-section-title" style={{ marginBottom:20 }}>Selecionar Turma e Matéria</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                        <label className="pd-label">Turma</label>
                        <SearchSelect
                            options={turmas.map(t => ({ value: t.id, label: fmtTurma(t) }))}
                            value={turmaId}
                            onChange={v => { setTurmaId(v); setMateriaId(""); }}
                            placeholder="Selecione a turma..." />
                    </div>
                    <div>
                        <label className="pd-label">Matéria</label>
                        <SearchSelect
                            options={materiasDaTurma.map(m => ({ value: m.id, label: m.nome }))}
                            value={materiaId}
                            onChange={setMateriaId}
                            placeholder={turmaId ? "Selecione a matéria..." : "Primeiro selecione a turma"} />
                    </div>
                </div>

                {!semSelecao && (
                    <div style={{ display:"flex", gap:0, marginTop:20, borderBottom:"2px solid #eaeef2" }}>
                        {[["chamada","Chamada do Dia"],["historico","Histórico"]].map(([id, label]) => (
                            <button key={id} onClick={() => setAbaLocal(id)}
                                    style={{ padding:"10px 24px", background:"none", border:"none", cursor:"pointer",
                                        fontSize:12, fontWeight:500, letterSpacing:".06em", textTransform:"uppercase",
                                        color: abaLocal===id ? "#0d1f18" : "#9aaa9f",
                                        borderBottom: abaLocal===id ? "2px solid #0d1f18" : "2px solid transparent",
                                        marginBottom:-2 }}>
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {msg.texto && <div className={msg.tipo==="ok"?"pd-ok":"pd-err"}>{msg.texto}</div>}

            {semSelecao && (
                <div style={{ padding:"48px", textAlign:"center", color:"#9aaa9f", fontSize:13,
                    background:"#fff", border:"1px solid #eaeef2" }}>
                    Selecione uma turma e matéria para fazer a chamada.
                </div>
            )}

            {/* ── ABA CHAMADA ── */}
            {!semSelecao && abaLocal === "chamada" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div className="pd-section" style={{ padding:24 }}>
                        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16 }}>
                            <div>
                                <label className="pd-label">Data da Aula</label>
                                <div className="pd-input-wrap" style={{ width:180 }}>
                                    <input className="pd-input" type="date" value={dataAula}
                                           onChange={e => setDataAula(e.target.value)} />
                                    <div className="pd-input-line" />
                                </div>
                            </div>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                <button className="pd-btn-ghost" disabled={bloqueado || loadingAulas}
                                        onClick={() => {
                                            const m = {};
                                            aulasNoDia.forEach(aula => {
                                                const p = {};
                                                alunos.forEach(a => { p[a.id] = true; });
                                                m[aula.ordemAula] = p;
                                            });
                                            setChamadaPorAula(m);
                                        }}>
                                    Todos Presentes
                                </button>
                                <button className="pd-btn-primary" onClick={salvarChamada}
                                        disabled={salvando || bloqueado || loadingAulas}>
                                    {salvando ? "Salvando..." : "Salvar Chamada →"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loadingAulas && (
                        <div className="pd-section" style={{ padding:24, textAlign:"center", color:"#9aaa9f", fontSize:13 }}>
                            Verificando horários...
                        </div>
                    )}

                    {/* Sem aulas → bloqueado */}
                    {!loadingAulas && bloqueado && (
                        <div className="pd-section" style={{ padding:24, textAlign:"center" }}>
                            <span style={{ fontSize:13, color:"#b94040", fontWeight:500 }}>
                                Sem aulas de {materiaNome} na {diaSemanaLabel}. Chamada bloqueada.
                            </span>
                        </div>
                    )}

                    {/* Seção por período */}
                    {!loadingAulas && aulasNoDia.map((aula, idx) => (
                        <div key={aula.ordemAula} className="pd-section">
                            <div className="pd-section-header"
                                 onClick={() => toggleAulaColapsada(aula.ordemAula)}
                                 style={{ cursor:"pointer", userSelect:"none" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    <span style={{
                                        fontSize:14, color:"#9aaa9f",
                                        display:"inline-block",
                                        transition:"transform .2s",
                                        transform: aulasColapsadas.has(aula.ordemAula) ? "rotate(-90deg)" : "rotate(0deg)"
                                    }}>▾</span>
                                    <span className="pd-section-title">
                                        {idx + 1}ª Aula — {aula.horarioInicio}
                                        {aula.dataFimVigencia && (
                                            <span style={{ marginLeft:6, fontSize:10, background:"#f59e0b", color:"#fff", padding:"1px 7px", borderRadius:4, verticalAlign:"middle", fontWeight:600 }}>
                                                Horário Antigo
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <span className="pd-section-count">
                                    {Object.values(chamadaPorAula[aula.ordemAula] || {}).filter(Boolean).length}/{alunos.length} presentes
                                </span>
                            </div>
                            {!aulasColapsadas.has(aula.ordemAula) && (
                            <table className="pd-table">
                                <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th style={{ width:160, textAlign:"center" }}>Presença</th>
                                </tr>
                                </thead>
                                <tbody>
                                {alunos.map(aluno => {
                                    const presente = chamadaPorAula[aula.ordemAula]?.[aluno.id] ?? true;
                                    return (
                                        <tr key={aluno.id}>
                                            <td>
                                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                    <div style={{ width:26, height:26,
                                                        background: presente ? "#0d1f18" : "#e8e8e8",
                                                        display:"flex", alignItems:"center", justifyContent:"center",
                                                        fontSize:11, fontWeight:600,
                                                        color: presente ? "#7ec8a0" : "#aaa",
                                                        flexShrink:0, transition:"background .15s" }}>
                                                        {aluno.nome.charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight:500, fontSize:13,
                                                        color: presente ? "#0d1f18" : "#aaa",
                                                        transition:"color .15s" }}>
                                                        {aluno.nome}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign:"center" }}>
                                                <div style={{ display:"flex", justifyContent:"center" }}>
                                                    <button onClick={() => setChamadaPorAula(p => ({
                                                                ...p,
                                                                [aula.ordemAula]: { ...p[aula.ordemAula], [aluno.id]: true }
                                                            }))}
                                                            style={{ padding:"6px 20px", border:"1px solid #eaeef2", borderRight:"none",
                                                                background: presente ? "#0d1f18" : "white",
                                                                color: presente ? "#7ec8a0" : "#9aaa9f",
                                                                fontSize:11, fontWeight:600, cursor:"pointer",
                                                                letterSpacing:".06em", transition:"all .15s" }}>P</button>
                                                    <button onClick={() => setChamadaPorAula(p => ({
                                                                ...p,
                                                                [aula.ordemAula]: { ...p[aula.ordemAula], [aluno.id]: false }
                                                            }))}
                                                            style={{ padding:"6px 20px", border:"1px solid #eaeef2",
                                                                background: !presente ? "#b94040" : "white",
                                                                color: !presente ? "white" : "#9aaa9f",
                                                                fontSize:11, fontWeight:600, cursor:"pointer",
                                                                letterSpacing:".06em", transition:"all .15s" }}>F</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── ABA HISTÓRICO ── */}
            {!semSelecao && abaLocal === "historico" && (
                <div className="pd-section">
                    <div className="pd-section-header">
                        <span className="pd-section-title">Frequência por Aluno</span>
                        <span className="pd-section-count">{Object.keys(historico).length} dia(s) registrado(s)</span>
                    </div>
                    {alunos.length === 0 || Object.keys(historico).length === 0
                        ? <p style={{ padding:"40px", textAlign:"center", fontSize:13, color:"#9aaa9f" }}>
                            Nenhuma chamada registrada ainda.
                        </p>
                        : <table className="pd-table">
                            <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Presenças</th>
                                <th>Faltas</th>
                                <th>Frequência</th>
                            </tr>
                            </thead>
                            <tbody>
                            {alunos.map(aluno => {
                                const registros = Object.values(historico).flatMap(d => d).filter(r => r.alunoId === aluno.id);
                                const total = registros.length;
                                const pres = registros.filter(r => r.presente).length;
                                const pct = total > 0 ? Math.round((pres/total)*100) : 0;
                                return (
                                    <tr key={aluno.id}>
                                        <td style={{ fontWeight:500 }}>{aluno.nome}</td>
                                        <td style={{ color:"#2d6a4f" }}>{pres}</td>
                                        <td style={{ color:"#b94040" }}>{total - pres}</td>
                                        <td>
                                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                <div style={{ flex:1, height:4, background:"#eaeef2", overflow:"hidden" }}>
                                                    <div style={{ width:`${pct}%`, height:"100%", transition:"width .3s",
                                                        background: pct >= 75 ? "#7ec8a0" : pct >= 50 ? "#e6a817" : "#b94040" }} />
                                                </div>
                                                <span style={{ fontSize:12, fontWeight:500, width:36, textAlign:"right",
                                                    color: pct >= 75 ? "#2d6a4f" : pct >= 50 ? "#a05c00" : "#b94040" }}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    }

                    {/* Histórico por data, agrupado por período */}
                    {Object.keys(historico).length > 0 && (
                        <div style={{ borderTop:"1px solid #eaeef2" }}>
                            <div style={{ padding:"12px 20px", borderBottom:"1px solid #f2f5f2" }}>
                                <span style={{ fontSize:10, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:"#9aaa9f" }}>
                                    Detalhe por data
                                </span>
                            </div>
                            {Object.entries(historico).sort((a,b) => b[0].localeCompare(a[0])).map(([data, registros]) => {
                                const porOrdem = registros.reduce((acc, r) => {
                                    const k = r.ordemAula != null ? r.ordemAula : "leg";
                                    if (!acc[k]) acc[k] = [];
                                    acc[k].push(r);
                                    return acc;
                                }, {});
                                const ordens = Object.keys(porOrdem).sort((a,b) =>
                                    a === "leg" ? 1 : b === "leg" ? -1 : Number(a) - Number(b));
                                return (
                                    <div key={data} style={{ borderBottom:"1px solid #f2f5f2" }}>
                                        <div style={{ padding:"10px 20px", background:"#fafbfa" }}>
                                            <span style={{ fontSize:13, fontWeight:500, color:"#0d1f18" }}>{data}</span>
                                        </div>
                                        {ordens.map(ok => {
                                            const regs = porOrdem[ok];
                                            const pres = regs.filter(r => r.presente).length;
                                            const tot = regs.length;
                                            const hr = ok !== "leg" ? regs[0]?.horarioInicio : null;
                                            const label = ok === "leg" ? "—" : `${ok}ª Aula${hr ? ` — ${hr}` : ""}`;
                                            return (
                                                <div key={ok} style={{ padding:"8px 20px 8px 32px", display:"flex",
                                                    alignItems:"center", justifyContent:"space-between",
                                                    borderBottom:"1px solid #f9faf9" }}>
                                                    <span style={{ fontSize:12, color:"#5a6f5c" }}>{label}</span>
                                                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                                        <span style={{ fontSize:12, color:"#2d6a4f" }}>{pres} pres.</span>
                                                        <span style={{ fontSize:12, color:"#b94040" }}>{tot-pres} falt.</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// COMUNICADOS — Professor pode criar e ver
// ═══════════════════════════════════════════════════════════════
function ComunicadosProfessor({ vinculos }) {
    const [comunicados, setComunicados] = useState([]);
    const [form, setForm] = useState({ titulo:"", corpo:"", destinatarios:"TODOS", turmaId:"" });
    const [criando, setCriando] = useState(false);
    const [msg, setMsg] = useState({ texto:"", tipo:"" });

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    // Turmas únicas do professor a partir dos vínculos
    const turmas = [...new Map(vinculos.map(v => [v.turma?.id, v.turma])).values()].filter(Boolean);

    const carregar = () => {
        api.get("/comunicados").then(r => setComunicados(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    };
    useEffect(() => { carregar(); }, []);

    const salvar = async e => {
        e.preventDefault();
        if (!form.titulo.trim() || !form.corpo.trim()) return flash("Título e texto são obrigatórios.", "err");
        if (form.destinatarios === "TURMA" && !form.turmaId) return flash("Selecione a turma.", "err");
        const payload = { titulo: form.titulo, corpo: form.corpo, destinatarios: form.destinatarios };
        if (form.destinatarios === "TURMA") payload.turmaId = form.turmaId;
        try {
            await api.post("/comunicados", payload);
            setForm({ titulo:"", corpo:"", destinatarios:"TODOS", turmaId:"" });
            setCriando(false);
            flash("Comunicado publicado!");
            carregar();
        } catch(err) { flash(err.response?.data || "Erro ao publicar.", "err"); }
    };

    const DEST_LABELS = { TODOS:"Todos", PROFESSORES:"Professores", ALUNOS:"Alunos" };
    const fmtTurmaLocal = t => t ? (t.serie?.nome ? `${t.serie.nome} — ${t.nome}` : t.nome) : "";

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {msg.texto && <div className={`pd-msg ${msg.tipo}`}>{msg.texto}</div>}
            <div className="pd-section">
                <div className="pd-section-header">
                    <span className="pd-section-title">Comunicados</span>
                    <span className="pd-section-count">{comunicados.length}</span>
                    <button className="pd-btn-primary" style={{ marginLeft:"auto", padding:"6px 14px", fontSize:12 }}
                            onClick={() => setCriando(v => !v)}>
                        {criando ? "Cancelar" : <><Megaphone size={13} style={{ marginRight:6 }} />Novo</>}
                    </button>
                </div>

                {criando && (
                    <div style={{ padding:24, borderBottom:"1px solid #eaeef2" }}>
                        <form onSubmit={salvar} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"end" }}>
                                <div>
                                    <label className="pd-label">Título</label>
                                    <div className="pd-input-wrap">
                                        <input className="pd-input" value={form.titulo}
                                               onChange={e => setForm(f => ({...f, titulo:e.target.value}))}
                                               placeholder="Assunto do comunicado" required />
                                        <div className="pd-input-line" />
                                    </div>
                                </div>
                                <div>
                                    <label className="pd-label">Destinatários</label>
                                    <SearchSelect
                                        value={form.destinatarios}
                                        onChange={v => setForm(f => ({...f, destinatarios:v, turmaId:""}))}
                                        options={[
                                            { value: "TODOS", label: "Todos" },
                                            { value: "PROFESSORES", label: "Professores" },
                                            { value: "ALUNOS", label: "Alunos" },
                                            { value: "TURMA", label: "Turma específica" },
                                        ]}
                                    />
                                </div>
                            </div>
                            {form.destinatarios === "TURMA" && (
                                <div>
                                    <label className="pd-label">Turma</label>
                                    <SearchSelect
                                        value={form.turmaId}
                                        onChange={v => setForm(f => ({...f, turmaId:v}))}
                                        placeholder="Selecione…"
                                        options={[{ value: "", label: "Selecione…" }, ...turmas.map(t => ({ value: String(t.id), label: fmtTurmaLocal(t) }))]}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="pd-label">Mensagem</label>
                                <textarea className="pd-input" rows={4} value={form.corpo}
                                          onChange={e => setForm(f => ({...f, corpo:e.target.value}))}
                                          placeholder="Escreva aqui…"
                                          style={{ resize:"vertical", lineHeight:1.6 }} required />
                            </div>
                            <div>
                                <button type="submit" className="pd-btn-primary"
                                        style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                                    <Send size={13} />Publicar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ padding:"0 20px" }}>
                    {comunicados.length === 0 && (
                        <p style={{ color:"#9aaa9f", fontSize:13, padding:"24px 0", textAlign:"center" }}>
                            Nenhum comunicado disponível.
                        </p>
                    )}
                    {comunicados.map(c => (
                        <div key={c.id} style={{ padding:"16px 0", borderBottom:"1px solid #f0f4f1" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                                <span style={{ fontWeight:600, fontSize:14, color:"#0d1f18" }}>{c.titulo}</span>
                                <span style={{ fontSize:10, fontWeight:500, letterSpacing:".08em", textTransform:"uppercase",
                                               background:"#e8f5ec", color:"#3a7a5a", padding:"2px 8px" }}>
                                    {c.destinatarios === "TURMA" ? `Turma ${c.turmaId}` : (DEST_LABELS[c.destinatarios] || c.destinatarios)}
                                </span>
                            </div>
                            <p style={{ fontSize:13, color:"#3a4a40", lineHeight:1.6, whiteSpace:"pre-wrap", margin:"0 0 6px" }}>{c.corpo}</p>
                            <p style={{ fontSize:11, color:"#9aaa9f" }}>
                                {c.autorNome} · {c.dataPublicacao ? new Date(c.dataPublicacao).toLocaleString("pt-BR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : ""}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HORÁRIOS — Visualização (somente leitura)
// ═══════════════════════════════════════════════════════════════
const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DIAS_LABEL = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };

function HorariosView() {
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroTurma, setFiltroTurma] = useState("todas");
    const [apenasMinhas, setApenasMinhas] = useState(false);
    const [myId, setMyId] = useState(() => Number(localStorage.getItem("userId")) || 0);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get("/horarios/minhas"),
            myId === 0 ? api.get("/vinculos/professor-turma-materia/minhas") : Promise.resolve(null),
        ]).then(([hRes, vRes]) => {
            setHorarios(hRes.data || []);
            if (vRes) {
                const vid = vRes.data?.[0]?.professor?.id ?? vRes.data?.[0]?.id?.professorId ?? 0;
                if (vid) setMyId(vid);
            }
        }).finally(() => setLoading(false));
    }, []);

    const turmaIds = [...new Set(horarios.map(h => h.turmaId))];

    const turmasFiltradas = filtroTurma === "todas"
        ? turmaIds
        : turmaIds.filter(id => String(id) === String(filtroTurma));

    const horariosUsados = [...new Set(horarios.map(h => h.horarioInicio))].sort();

    const getSlot = (turmaId, dia, ordem) => {
        const slot = horarios.find(
            h => h.turmaId === turmaId && h.diaSemana === dia && h.ordemAula === ordem
        );
        if (!slot) return null;
        if (apenasMinhas && slot.professorId !== myId) return null;
        return slot;
    };

    if (loading) {
        return <p style={{ color: "#9aaa9f", fontSize: 13, textAlign: "center", padding: 40 }}>Carregando horários...</p>;
    }

    if (horarios.length === 0) {
        return (
            <div className="pd-section" style={{ padding: 40, textAlign: "center" }}>
                <CalendarDays size={32} color="#d4ddd8" style={{ marginBottom: 12 }} />
                <p style={{ color: "#9aaa9f", fontSize: 13 }}>Nenhum horário cadastrado ainda.</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Filtro por turma */}
            <div className="pd-section" style={{ padding: "12px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aaa9f" }}>
                        Filtrar turma:
                    </label>
                    <SearchSelect
                        value={filtroTurma}
                        onChange={v => setFiltroTurma(v)}
                        options={[
                            { value: "todas", label: "Todas as minhas turmas" },
                            ...turmaIds.map(id => ({
                                value: String(id),
                                label: fmtTurmaNomes(horarios.find(h => h.turmaId === id)?.turmaSerieNome, horarios.find(h => h.turmaId === id)?.turmaNome) || `Turma ${id}`
                            }))
                        ]}
                    />

                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
                        <input
                            type="checkbox"
                            checked={apenasMinhas}
                            onChange={e => setApenasMinhas(e.target.checked)}
                            style={{ accentColor: "#0d1f18", width: 14, height: 14, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 12, color: "#0d1f18", fontWeight: apenasMinhas ? 600 : 400 }}>
                            Apenas minhas aulas
                        </span>
                    </label>
                </div>
            </div>

            {/* Grade por dia */}
            {DIAS.map(dia => {
                const temAula = turmasFiltradas.some(tid =>
                    horariosUsados.some((_, idx) => getSlot(tid, dia, idx + 1))
                );
                if (!temAula) return null;

                return (
                    <div key={dia} className="pd-section">
                        <div className="pd-section-header">
                            <span className="pd-section-title" style={{
                                borderLeft: "3px solid #0d1f18", paddingLeft: 10
                            }}>
                                {DIAS_LABEL[dia]}
                            </span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                            <table className="pd-table">
                                <thead>
                                <tr>
                                    <th style={{ width: 70 }}>Horário</th>
                                    {turmasFiltradas.map(tid => (
                                        <th key={tid} style={{ textAlign: "center" }}>
                                            {fmtTurmaNomes(horarios.find(h => h.turmaId === tid)?.turmaSerieNome, horarios.find(h => h.turmaId === tid)?.turmaNome) || `Turma ${tid}`}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {horariosUsados.map((hr, idx) => (
                                    <tr key={hr}>
                                        <td style={{ fontWeight: 500, fontSize: 12, color: "#5a7060" }}>{hr}</td>
                                        {turmasFiltradas.map(tid => {
                                            const slot = getSlot(tid, dia, idx + 1);
                                            if (!slot) {
                                                return <td key={tid} style={{ textAlign: "center", color: "#d4ddd8" }}>—</td>;
                                            }
                                            const nomeProf = slot.professorNome?.split(" ")[0] || "";
                                            return (
                                                <td key={tid} style={{ textAlign: "center" }}>
                                                    <span style={{ fontWeight: 500 }}>{nomeProf}</span>
                                                    <br />
                                                    <span style={{ fontSize: 11, color: "#5a7060" }}>({slot.materiaNome})</span>
                                                </td>
                                            );
                                        })}
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