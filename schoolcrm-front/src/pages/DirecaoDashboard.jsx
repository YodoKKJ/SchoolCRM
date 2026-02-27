import { useState, useEffect, useRef, Component } from "react";
import axios from "axios";
import { BoletimImpresso } from "./BoletimPDF";
import {
    Home, Users, School, BookOpen, LogOut,
    GraduationCap, UserCheck, LayoutGrid, BookMarked, Menu,
    Trash2, Pencil, ArrowLeft, UserPlus, ChevronDown, Search, X,
    FileText, DollarSign, Lock, ClipboardList, ChevronRight, Clock, CalendarDays
} from "lucide-react";

const api = axios.create({ baseURL: "http://localhost:8080" });

let redirectingTo401 = false;

// Hook debounce — espera Xms após parar de digitar
function useDebounce(value, delay = 400) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

// Barra de pesquisa reutilizável
function BarraBusca({ campos, campoBusca, setCampoBusca, termoBusca, setTermoBusca }) {
    return (
        <div className="dd-search-wrap">
            <select className="dd-search-select" value={campoBusca}
                    onChange={e => { setCampoBusca(e.target.value); setTermoBusca(""); }}>
                {campos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <div className="dd-search-input-wrap">
                <Search size={12} className="dd-search-icon" />
                <input className="dd-search-input" value={termoBusca}
                       onChange={e => setTermoBusca(e.target.value)}
                       placeholder="Pesquisar..." />
                {termoBusca && (
                    <button className="dd-search-clear" onClick={() => setTermoBusca("")}>
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}

api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return config;
});

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

const C = {
    primary: "#1A759F",
    primaryDark: "#184E77",
    primaryLight: "#52B69A",
    accent: "#99D98C",
    bg: "#f8fafb",
    sidebar: "#ffffff",
    border: "#e8edf2",
    text: "#1a2332",
    textMuted: "#6b7a8d",
};

const modulos = [
    {
        id: "geral",
        label: null, // sem título na seção principal
        items: [
            { id: "inicio", label: "Início", icon: Home },
        ]
    },
    {
        id: "academico",
        label: "Acadêmico",
        items: [
            { id: "turmas", label: "Turmas", icon: School },
            { id: "materias", label: "Matérias", icon: BookOpen },
            { id: "horarios", label: "Horários", icon: CalendarDays },
            { id: "atrasos", label: "Atrasos", icon: Clock },
            { id: "lancamentos", label: "Lançamentos", icon: BookMarked },
            { id: "boletins", label: "Boletins", icon: ClipboardList },
        ]
    },
    {
        id: "gestao",
        label: "Gestão",
        items: [
            { id: "usuarios", label: "Usuários", icon: Users },
        ]
    },
    {
        id: "financeiro",
        label: "Financeiro",
        items: [
            { id: "financeiro", label: "Financeiro", icon: DollarSign, disabled: true },
        ]
    },
    {
        id: "relatorios",
        label: "Relatórios",
        items: [
            { id: "relatorios", label: "Relatórios", icon: FileText, disabled: true },
        ]
    },
];

// helper para buscar label de qualquer aba
const allMenuItems = modulos.flatMap(m => m.items);

// ---- SEARCH SELECT ----
function SearchSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const divRef = useRef(null);

    const selected = options.find(o => String(o.value) === String(value));
    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (divRef.current && !divRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const handleOpen = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
        setOpen(prev => !prev);
    };

    return (
        <div ref={el => divRef.current = el} style={{ flex: 1, position: "relative" }}>
            <button type="button" onClick={handleOpen}
                    className="w-full flex items-center justify-between gap-2 text-left text-sm transition"
                    style={{
                        border: `1px solid ${open ? '#0d1f18' : '#eaeef2'}`,
                        borderRadius: "8px",
                        padding: "8px 12px",
                        background: "white",
                        color: selected ? '#0d1f18' : '#9aaa9f',
                    }}>
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown size={14} color='#9aaa9f'
                             style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>

            {open && (
                <div style={{
                    position: "fixed",
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                    zIndex: 9999,
                    background: "white",
                    border: '1px solid #eaeef2',
                    borderRadius: '4px',
                    boxShadow: "0 8px 32px rgba(26,117,159,0.15)",
                    overflow: "hidden",
                }}>
                    <div className="p-2" style={{ borderBottom: '1px solid #eaeef2' }}>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: C.bg }}>
                            <Search size={13} color='#9aaa9f' />
                            <input autoFocus placeholder="Buscar..." value={search}
                                   onChange={e => setSearch(e.target.value)}
                                   className="flex-1 text-xs outline-none bg-transparent"
                                   style={{ color: '#0d1f18' }}
                                   onClick={e => e.stopPropagation()} />
                        </div>
                    </div>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {filtered.length === 0 && (
                            <p className="px-4 py-3 text-xs text-center" style={{ color: '#9aaa9f' }}>Nenhum resultado</p>
                        )}
                        {filtered.map(o => {
                            const active = String(o.value) === String(value);
                            return (
                                <button key={o.value} type="button"
                                        onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                        className="w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2"
                                        style={{
                                            color: active ? '#1a4d3a' : '#0d1f18',
                                            background: active ? '#f0f5f2' : 'transparent',
                                            fontWeight: active ? 600 : 400,
                                        }}>
                                    {active && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#1a4d3a' }} />}
                                    {o.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- DASHBOARD ----
const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
* { box-sizing: border-box; }
:root { font-family: 'DM Sans', sans-serif; }
.dd-sidebar { background: #0d1f18; }
.dd-sidebar-logo-wrap { border-bottom: 1px solid rgba(255,255,255,0.07); }
.dd-user-wrap { border-bottom: 1px solid rgba(255,255,255,0.07); }
.dd-nav-section-label { font-size:10px; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:rgba(255,255,255,.3); padding: 0 12px; margin-bottom:4px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; border:none; background:none; width:100%; }
.dd-nav-section-label:hover { color:rgba(255,255,255,.5); }
.dd-nav-btn { display:flex; align-items:center; gap:10px; padding:9px 12px; font-size:13px; font-weight:400; color:rgba(255,255,255,.45); border:none; background:transparent; width:100%; text-align:left; cursor:pointer; border-left:2px solid transparent; transition:color .15s, background .15s, border-color .15s; }
.dd-nav-btn:hover { color:rgba(255,255,255,.8); background:rgba(255,255,255,.04); }
.dd-nav-btn.active { color:#7ec8a0; border-left-color:#7ec8a0; background:rgba(126,200,160,.07); font-weight:500; }
.dd-nav-btn.disabled { color:rgba(255,255,255,.18); cursor:default; }
.dd-badge-soon { font-size:9px; letter-spacing:.08em; text-transform:uppercase; padding:2px 6px; background:rgba(255,255,255,.06); color:rgba(255,255,255,.25); }
.dd-header { background:#fff; border-bottom:1px solid #eaeef2; position:sticky; top:0; z-index:10; }
.dd-page-title { font-family:'Playfair Display', serif; font-size:22px; font-weight:700; color:#0d1f18; letter-spacing:-.02em; line-height:1; }
.dd-page-sub { font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:#9aaa9f; margin-top:3px; }
.dd-card { background:#fff; border:1px solid #eaeef2; border-top:2px solid var(--accent, #0d1f18); }
.dd-card-num { font-family:'Playfair Display', serif; font-size:30px; font-weight:700; color:#0d1f18; line-height:1; }
.dd-card-label { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#9aaa9f; margin-top:4px; }
.dd-section { background:#fff; border:1px solid #eaeef2; }
.dd-section-header { border-bottom:1px solid #eaeef2; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; }
.dd-section-title { font-size:13px; font-weight:500; color:#0d1f18; letter-spacing:.01em; }
.dd-section-count { font-size:11px; color:#9aaa9f; letter-spacing:.04em; }
.dd-table th { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#9aaa9f; padding:10px 20px; text-align:left; background:#f8faf8; border-bottom:1px solid #eaeef2; }
.dd-table td { padding:12px 20px; border-bottom:1px solid #f2f5f2; font-size:13px; color:#2a3a2e; }
.dd-table tr:last-child td { border-bottom:none; }
.dd-table tr:hover td { background:#fafcfa; }
.dd-badge { font-size:11px; font-weight:500; padding:3px 10px; letter-spacing:.02em; }
.dd-input { border:none; border-bottom:1.5px solid #d4ddd8; background:transparent; padding:9px 0; font-size:14px; font-family:'DM Sans',sans-serif; color:#0d1f18; outline:none; width:100%; transition:border-color .2s; }
.dd-input:focus { border-bottom-color:#0d1f18; }
.dd-input::placeholder { color:#b8c4be; }
.dd-input-wrap { position:relative; }
.dd-input-line { position:absolute; bottom:-1.5px; left:0; height:1.5px; background:#0d1f18; width:0; transition:width .25s ease; }
.dd-input-wrap:focus-within .dd-input-line { width:100%; }
.dd-label { font-size:10px; font-weight:500; letter-spacing:.1em; text-transform:uppercase; color:#9aaa9f; display:block; margin-bottom:6px; }
.dd-btn-primary { background:#0d1f18; color:#fff; border:none; padding:11px 20px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:background .2s; }
.dd-btn-primary:hover { background:#1a4d3a; }
.dd-btn-primary:disabled { opacity:.4; cursor:default; }
.dd-btn-ghost { background:#f4f7f4; color:#5a7060; border:none; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; transition:background .2s; }
.dd-btn-ghost:hover { background:#ebf0eb; }
.dd-btn-danger { background:#fdf0f0; color:#b94040; border:none; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; }
.dd-btn-danger:hover { background:#fbe0e0; }
.dd-btn-edit { background:#f0f5f2; color:#3a6649; border:none; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; }
.dd-btn-edit:hover { background:#e4ede7; }
.dd-btn-toggle-on { background:#fdf0f0; color:#b94040; border:none; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; }
.dd-btn-toggle-off { background:#f0f5f2; color:#3a6649; border:none; padding:7px 14px; font-family:'DM Sans',sans-serif; font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; cursor:pointer; }
.dd-modal-overlay { position:fixed; inset:0; background:rgba(13,31,24,.55); z-index:50; display:flex; align-items:center; justify-content:center; padding:24px; }
.dd-modal { background:#fff; width:100%; max-width:420px; padding:32px; }
.dd-modal-title { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:#0d1f18; }
.dd-modal-sub { font-size:12px; color:#9aaa9f; margin-top:2px; letter-spacing:.04em; }
.dd-err { font-size:12px; color:#b94040; padding:10px 14px; background:#fdf0f0; border-left:3px solid #b94040; margin-top:4px; }
.dd-ok { font-size:12px; color:#3a6649; padding:10px 14px; background:#f0f5f2; border-left:3px solid #7ec8a0; margin-top:4px; }
.dd-search-wrap { display:flex; gap:8px; align-items:center; }
.dd-search-select { font-size:11px; padding:8px 12px; border:1px solid #eaeef2; background:white; color:#5a7060; outline:none; letter-spacing:.04em; font-family:'DM Sans',sans-serif; }
.dd-search-input-wrap { position:relative; flex:1; }
.dd-search-input { width:100%; padding:8px 32px 8px 32px; font-size:12px; border:1px solid #eaeef2; background:white; color:#0d1f18; outline:none; font-family:'DM Sans',sans-serif; transition:border-color .15s; }
.dd-search-input:focus { border-color:#0d1f18; }
.dd-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#9aaa9f; pointer-events:none; }
.dd-search-clear { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:#9aaa9f; cursor:pointer; padding:0; }
`;

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 48, textAlign: "center", color: "#6b7a8d" }}>
                    <p style={{ fontSize: 15, marginBottom: 16 }}>Algo deu errado ao carregar esta seção.</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{ background: "#0d1f18", color: "#fff", border: "none", padding: "10px 24px",
                            fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer" }}>
                        Tentar novamente
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function DirecaoDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const [colapsados, setColapsados] = useState({});
    const nome = localStorage.getItem("nome") || "Direção";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };
    const toggleColapso = (id) => setColapsados(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <>
            <style>{GLOBAL_STYLE}</style>
            <div style={{ display:"flex", minHeight:"100vh", background:"#f5f8f5" }}>
                {/* overlay mobile */}
                {sidebarAberta && (
                    <div style={{ position:"fixed", inset:0, background:"rgba(13,31,24,.4)", zIndex:20 }}
                         onClick={() => setSidebarAberta(false)} />
                )}

                {/* ── Sidebar ── */}
                <aside className="dd-sidebar" style={{
                    width:210, flexShrink:0, display:"flex", flexDirection:"column",
                    position:"sticky", top:0, height:"100vh", overflowY:"auto",
                }}>
                    {/* logo */}
                    <div className="dd-sidebar-logo-wrap" style={{ padding:"24px 20px 20px", display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:28, height:28, border:"1.5px solid rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,.5)" strokeWidth="1.2"/>
                                <circle cx="8" cy="8" r="2" fill="#7ec8a0"/>
                            </svg>
                        </div>
                        <div>
                            <p style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:13, letterSpacing:"0.08em", color:"rgba(255,255,255,.75)", lineHeight:1 }}>DomGestão</p>
                            <p style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,.3)", marginTop:3 }}>Direção</p>
                        </div>
                    </div>

                    {/* user */}
                    <div className="dd-user-wrap" style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:28, height:28, background:"rgba(126,200,160,.15)", border:"1px solid rgba(126,200,160,.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:12, fontWeight:600, color:"#7ec8a0" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:500, color:"rgba(255,255,255,.65)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nome}</p>
                            <p style={{ fontSize:10, color:"rgba(255,255,255,.25)", letterSpacing:"0.04em" }}>Administrador</p>
                        </div>
                    </div>

                    {/* nav */}
                    <nav style={{ flex:1, padding:"16px 8px", display:"flex", flexDirection:"column", gap:16, overflowY:"auto" }}>
                        {modulos.map(modulo => {
                            const colapsado = !!colapsados[modulo.id];
                            return (
                                <div key={modulo.id}>
                                    {modulo.label && (
                                        <button className="dd-nav-section-label" onClick={() => toggleColapso(modulo.id)}>
                                            <span>{modulo.label}</span>
                                            <ChevronRight size={11} style={{ opacity:.4, transform: colapsado ? "rotate(0deg)" : "rotate(90deg)", transition:"transform .2s" }} />
                                        </button>
                                    )}
                                    {!colapsado && modulo.items.map(item => {
                                        const Icon = item.icon;
                                        const active = aba === item.id;
                                        return (
                                            <button key={item.id}
                                                    className={`dd-nav-btn${active ? " active" : ""}${item.disabled ? " disabled" : ""}`}
                                                    disabled={item.disabled}
                                                    onClick={() => { if (!item.disabled) { setAba(item.id); setSidebarAberta(false); } }}>
                                                <Icon size={14} style={{ flexShrink:0 }} />
                                                <span style={{ flex:1 }}>{item.label}</span>
                                                {item.disabled && <span className="dd-badge-soon">Em breve</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </nav>

                    {/* logout */}
                    <div style={{ padding:"12px 8px", borderTop:"1px solid rgba(255,255,255,.06)" }}>
                        <button className="dd-nav-btn" onClick={logout} style={{ color:"rgba(255,100,100,.5)" }}>
                            <LogOut size={14} />
                            <span>Sair</span>
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
                    {/* header */}
                    <header className="dd-header" style={{ padding:"18px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                            <button style={{ display:"none", background:"none", border:"none", cursor:"pointer" }}
                                    className="md:block" onClick={() => setSidebarAberta(true)}>
                                <Menu size={18} color="#0d1f18" />
                            </button>
                            <div>
                                <h1 className="dd-page-title">{allMenuItems.find(m => m.id === aba)?.label}</h1>
                                <p className="dd-page-sub">DomGestão — Sistema Escolar</p>
                            </div>
                        </div>
                        <div style={{ width:32, height:32, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:600, color:"#7ec8a0", letterSpacing:".04em" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                    </header>

                    <main style={{ flex:1, padding:"28px 32px", display:"flex", flexDirection:"column", gap:0 }}>
                        {aba === "inicio" && <ErrorBoundary key="inicio"><Inicio /></ErrorBoundary>}
                        {aba === "usuarios" && <ErrorBoundary key="usuarios"><Usuarios /></ErrorBoundary>}
                        {aba === "turmas" && <ErrorBoundary key="turmas"><Turmas /></ErrorBoundary>}
                        {aba === "materias" && <ErrorBoundary key="materias"><Materias /></ErrorBoundary>}
                        {aba === "horarios" && <ErrorBoundary key="horarios"><Horarios /></ErrorBoundary>}
                        {aba === "atrasos" && <ErrorBoundary key="atrasos"><Atrasos /></ErrorBoundary>}
                        {aba === "lancamentos" && <ErrorBoundary key="lancamentos"><Lancamentos /></ErrorBoundary>}
                        {aba === "boletins" && <ErrorBoundary key="boletins"><Boletins /></ErrorBoundary>}
                    </main>
                </div>
            </div>
        </>
    );
}

// ---- INÍCIO ----
function Inicio() {
    const [stats, setStats] = useState({ alunos: 0, professores: 0, turmas: 0, materias: 0 });
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        Promise.all([api.get("/usuarios"), api.get("/turmas"), api.get("/materias")])
            .then(([u, t, m]) => {
                const listaUsuarios = u.data || [];
                setUsuarios(listaUsuarios);
                setStats({
                    alunos: listaUsuarios.filter(x => x.role === "ALUNO").length,
                    professores: listaUsuarios.filter(x => x.role === "PROFESSOR").length,
                    turmas: (t.data || []).length,
                    materias: (m.data || []).length,
                });
            })
            .catch(() => {});
    }, []);

    const cards = [
        { label: "Alunos", value: stats.alunos, accent: "#0d1f18" },
        { label: "Professores", value: stats.professores, accent: "#2d6a4f" },
        { label: "Turmas", value: stats.turmas, accent: "#7ec8a0" },
        { label: "Matérias", value: stats.materias, accent: "#b7dfc8" },
    ];

    const roleBadge = (role) => ({
        bg: role === "ALUNO" ? "#f0f5f2" : role === "PROFESSOR" ? "#e8f3ec" : "#eef5f0",
        color: role === "ALUNO" ? "#3a6649" : role === "PROFESSOR" ? "#2d6a4f" : "#1a4d3a",
    });

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
                {cards.map(card => (
                    <div key={card.label} className="dd-card" style={{ "--accent": card.accent, padding:"20px 20px 18px" }}>
                        <p className="dd-card-num">{card.value}</p>
                        <p className="dd-card-label">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Usuários Recentes</span>
                    <span className="dd-section-count">{usuarios.length} registros</span>
                </div>
                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                    <tr>{["Nome", "Login", "Perfil"].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                    {usuarios.slice(0, 8).map(u => {
                        const rb = roleBadge(u.role);
                        return (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                        <div style={{ width:26, height:26, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"#7ec8a0", flexShrink:0 }}>
                                            {u.nome.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight:500 }}>{u.nome}</span>
                                    </div>
                                </td>
                                <td style={{ color:"#9aaa9f" }}>{u.login}</td>
                                <td>
                                    <span className="dd-badge" style={{ background:rb.bg, color:rb.color }}>{u.role}</span>
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

// ---- USUÁRIOS ----
function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState({ nome: "", login: "", senha: "", role: "ALUNO" });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [editando, setEditando] = useState(null);
    const [formEdit, setFormEdit] = useState({ nome: "", login: "", senha: "" });
    const [msgEdit, setMsgEdit] = useState({ texto: "", tipo: "" });
    const [campoBusca, setCampoBusca] = useState("nome");
    const [termoBusca, setTermoBusca] = useState("");
    const termoDebounced = useDebounce(termoBusca);

    const carregar = (nome, role) => {
        const params = {};
        if (nome) params.nome = nome;
        if (role) params.role = role;
        api.get("/usuarios/buscar", { params }).then(r => {
            setUsuarios(Array.isArray(r.data) ? r.data : []);
        });
    };

    useEffect(() => {
        const nome = campoBusca === "nome" ? termoDebounced : undefined;
        const role = campoBusca === "role" ? termoDebounced : undefined;
        carregar(nome, role);
    }, [termoDebounced, campoBusca]);

    const cadastrar = async (e) => {
        e.preventDefault();
        try {
            await api.post("/usuarios", form);
            setMsg({ texto: "Usuário cadastrado com sucesso!", tipo: "ok" });
            setForm({ nome: "", login: "", senha: "", role: "ALUNO" });
            carregar();
        } catch { setMsg({ texto: "Erro ao cadastrar. Login já existe?", tipo: "erro" }); }
    };

    const abrirEdicao = (u) => {
        setEditando(u);
        setFormEdit({ nome: u.nome, login: u.login, senha: "" });
        setMsgEdit({ texto: "", tipo: "" });
    };

    const salvarEdicao = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/usuarios/${editando.id}`, formEdit);
            setMsgEdit({ texto: "Usuário atualizado com sucesso!", tipo: "ok" });
            carregar();
            setTimeout(() => setEditando(null), 1000);
        } catch (err) {
            const raw = err.response?.data;
            const msg = typeof raw === "string" ? raw : (raw?.message || "Erro ao atualizar.");
            setMsgEdit({ texto: msg, tipo: "erro" });
        }
    };

    const toggleStatus = async (u) => {
        const acao = u.ativo ? "inativar" : "ativar";
        if (!confirm(`Deseja ${acao} o usuário "${u.nome}"?`)) return;
        try {
            await api.patch(`/usuarios/${u.id}/status`);
            carregar();
        } catch { alert("Erro ao alterar status."); }
    };





    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Modal de edição */}
            {editando && (
                <div className="dd-modal-overlay">
                    <div className="dd-modal">
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                            <div>
                                <p className="dd-modal-title">Editar Usuário</p>
                                <p className="dd-modal-sub">{editando.role}</p>
                            </div>
                            <button onClick={() => setEditando(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f", padding:4 }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={salvarEdicao} style={{ display:"flex", flexDirection:"column", gap:20 }}>
                            {[
                                { key:"nome", label:"Nome", type:"text", placeholder:"Nome completo" },
                                { key:"login", label:"Login", type:"text", placeholder:"Login" },
                                { key:"senha", label:"Nova Senha", type:"password", placeholder:"••••••••", hint:"deixe em branco para manter" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="dd-label">{f.label} {f.hint && <span style={{ textTransform:"none", letterSpacing:0, fontWeight:300, color:"#b8c4be" }}>— {f.hint}</span>}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type} placeholder={f.placeholder}
                                               value={formEdit[f.key]}
                                               onChange={e => setFormEdit({ ...formEdit, [f.key]: e.target.value })} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}

                            {msgEdit.texto && <div className={msgEdit.tipo === "ok" ? "dd-ok" : "dd-err"}>{msgEdit.texto}</div>}

                            <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                <button type="button" onClick={() => setEditando(null)} className="dd-btn-ghost" style={{ flex:1 }}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" style={{ flex:1 }}>Salvar →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Formulário cadastro */}
            <div className="dd-section" style={{ padding:"24px" }}>
                <p className="dd-section-title" style={{ marginBottom:20 }}>Novo Usuário</p>
                <form onSubmit={cadastrar} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16 }}>
                    {[
                        { key:"nome", label:"Nome", type:"text", placeholder:"Nome completo" },
                        { key:"login", label:"Login", type:"text", placeholder:"Login" },
                        { key:"senha", label:"Senha", type:"password", placeholder:"••••••••" },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="dd-label">{f.label}</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" type={f.type} placeholder={f.placeholder}
                                       value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                    ))}
                    <div>
                        <label className="dd-label">Perfil</label>
                        <SearchSelect
                            options={[
                                { value: "ALUNO", label: "Aluno" },
                                { value: "PROFESSOR", label: "Professor" },
                                { value: "DIRECAO", label: "Direção" },
                            ]}
                            value={form.role}
                            onChange={v => setForm({ ...form, role: v })}
                            placeholder="Selecione..." />
                    </div>
                    <button type="submit" className="dd-btn-primary" style={{ gridColumn:"1/-1", marginTop:4 }}>
                        Cadastrar Usuário →
                    </button>
                </form>
                {msg.texto && <div className={msg.tipo === "ok" ? "dd-ok" : "dd-err"} style={{ marginTop:12 }}>{msg.texto}</div>}
            </div>

            {/* Tabela de usuários */}
            <div className="dd-section">
                <div className="dd-section-header" style={{ flexDirection:"column", alignItems:"stretch", gap:12 }}>
                    <div className="flex items-center justify-between">
                        <span className="dd-section-title">Todos os Usuários</span>
                        <span className="dd-section-count">{usuarios.length} registros</span>
                    </div>
                    <BarraBusca
                        campos={[
                            { value: "nome", label: "Nome" },
                            { value: "role", label: "Perfil" },
                        ]}
                        campoBusca={campoBusca} setCampoBusca={setCampoBusca}
                        termoBusca={termoBusca} setTermoBusca={setTermoBusca}
                    />
                    {campoBusca === "role" && (
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {["ALUNO", "PROFESSOR", "DIRECAO"].map(r => (
                                <button key={r} onClick={() => setTermoBusca(termoBusca === r ? "" : r)}
                                        className="dd-badge"
                                        style={{ background: termoBusca === r ? "#0d1f18" : "#f0f5f2", color: termoBusca === r ? "#7ec8a0" : "#3a6649", cursor:"pointer", border:"none" }}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Nome","Login","Perfil","Status",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                    {usuarios.map(u => {
                        const roleBg = { ALUNO:"#f0f5f2", PROFESSOR:"#e8f3ec", DIRECAO:"#eef5f0" };
                        const roleClr = { ALUNO:"#3a6649", PROFESSOR:"#2d6a4f", DIRECAO:"#1a4d3a" };
                        const inativo = !u.ativo;
                        return (
                            <tr key={u.id} style={{ opacity: inativo ? 0.5 : 1 }}>
                                <td>
                                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                        <div style={{ width:26, height:26, background: inativo ? "#ccc" : "#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color: inativo ? "#fff" : "#7ec8a0", flexShrink:0 }}>
                                            {u.nome.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight:500 }}>{u.nome}</span>
                                    </div>
                                </td>
                                <td style={{ color:"#9aaa9f" }}>{u.login}</td>
                                <td><span className="dd-badge" style={{ background: roleBg[u.role]||"#f0f5f2", color: roleClr[u.role]||"#3a6649" }}>{u.role}</span></td>
                                <td><span className="dd-badge" style={{ background: u.ativo?"#f0f5f2":"#fdf0f0", color: u.ativo?"#3a6649":"#b94040" }}>{u.ativo?"Ativo":"Inativo"}</span></td>
                                <td style={{ textAlign:"right" }}>
                                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                        <button className="dd-btn-edit" onClick={() => abrirEdicao(u)}>Editar</button>
                                        <button className={u.ativo ? "dd-btn-toggle-on" : "dd-btn-toggle-off"} onClick={() => toggleStatus(u)}>
                                            {u.ativo ? "Inativar" : "Ativar"}
                                        </button>
                                    </div>
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

// ---- TURMAS ----
function Turmas() {
    const [turmas, setTurmas] = useState([]);
    const [series, setSeries] = useState([]);
    const [formSerie, setFormSerie] = useState({ nome: "" });
    const [formTurma, setFormTurma] = useState({ nome: "", serieId: "", anoLetivo: String(new Date().getFullYear()) });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [turmaSelecionada, setTurmaSelecionada] = useState(null);
    const [campoBusca, setCampoBusca] = useState("nome");
    const [termoBusca, setTermoBusca] = useState("");
    const termoDebounced = useDebounce(termoBusca);

    const carregarSeries = () => {
        api.get("/turmas/series").then(r => setSeries(Array.isArray(r.data) ? r.data : []));
    };

    const buscarTurmas = (nome, serieId) => {
        const params = {};
        if (nome) params.nome = nome;
        if (serieId) params.serieId = serieId;
        api.get("/turmas/buscar", { params }).then(r => setTurmas(Array.isArray(r.data) ? r.data : []));
    };

    const carregar = () => {
        buscarTurmas();
        carregarSeries();
    };

    useEffect(() => { carregarSeries(); buscarTurmas(); }, []);

    useEffect(() => {
        if (!termoDebounced) { buscarTurmas(); return; }
        const nome = campoBusca === "nome" ? termoDebounced : undefined;
        const serieId = campoBusca === "serie"
            ? (series.find(s => s.nome.toLowerCase().includes(termoDebounced.toLowerCase()))?.id)
            : undefined;
        buscarTurmas(nome, serieId);
    }, [termoDebounced, campoBusca]);



    const excluirSerie = async (s) => {
        if (!confirm(`Excluir série "${s.nome}"?`)) return;
        try { await api.delete(`/turmas/series/${s.id}`); carregar(); }
        catch { setMsg({ texto: "Erro ao excluir. Há turmas vinculadas a essa série?", tipo: "erro" }); }
    };

    const excluirTurma = async (t) => {
        if (!confirm(`Excluir turma "${t.nome}"?`)) return;
        try { await api.delete(`/turmas/${t.id}`); carregar(); }
        catch { setMsg({ texto: "Erro ao excluir. Há vínculos ativos nessa turma?", tipo: "erro" }); }
    };

    if (turmaSelecionada) {
        return <EditarTurma turma={turmaSelecionada} onVoltar={() => { setTurmaSelecionada(null); carregar(); }} />;
    }

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div className="dd-section" style={{ padding:24 }}>
                    <p className="dd-section-title" style={{ marginBottom:16 }}>Nova Série</p>
                    <form onSubmit={async e => {
                        e.preventDefault();
                        if (!formSerie.nome.trim()) return;
                        try {
                            await api.post("/turmas/series", formSerie);
                            setFormSerie({ nome: "" });
                            setMsg({ texto: "Série criada!", tipo: "ok" });
                            carregar();
                        } catch { setMsg({ texto: "Erro ao criar série.", tipo: "erro" }); }
                    }} style={{ display:"flex", gap:8 }}>
                        <div className="dd-input-wrap" style={{ flex:1 }}>
                            <input className="dd-input" placeholder="Ex: 1º Ano" value={formSerie.nome}
                                   onChange={e => setFormSerie({ nome: e.target.value })} />
                            <div className="dd-input-line" />
                        </div>
                        <button type="submit" className="dd-btn-primary">Adicionar</button>
                    </form>
                    <div style={{ marginTop:16, display:"flex", flexWrap:"wrap", gap:8 }}>
                        {series.map(s => (
                            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6, background:"#f0f5f2", padding:"4px 10px 4px 12px" }}>
                                <span style={{ fontSize:12, fontWeight:500, color:"#2d6a4f" }}>{s.nome}</span>
                                <button onClick={() => excluirSerie(s)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f", padding:0, display:"flex" }}>
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dd-section" style={{ padding:24 }}>
                    <p className="dd-section-title" style={{ marginBottom:16 }}>Nova Turma</p>
                    <form onSubmit={async e => {
                        e.preventDefault();
                        try {
                            await api.post("/turmas", formTurma);
                            setMsg({ texto: "Turma cadastrada!", tipo: "ok" });
                            setFormTurma({ nome: "", serieId: "", anoLetivo: String(new Date().getFullYear()) });
                            carregar();
                        } catch { setMsg({ texto: "Erro ao cadastrar.", tipo: "erro" }); }
                    }} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                        <div>
                            <label className="dd-label">Nome</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" placeholder="Nome da turma" value={formTurma.nome}
                                       onChange={e => setFormTurma({ ...formTurma, nome: e.target.value })} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                        <div>
                            <label className="dd-label">Série</label>
                            <SearchSelect
                                options={series.map(s => ({ value: s.id, label: s.nome }))}
                                value={formTurma.serieId}
                                onChange={v => setFormTurma({ ...formTurma, serieId: v })}
                                placeholder="Selecione a série..." />
                        </div>
                        <div>
                            <label className="dd-label">Ano Letivo</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" type="number" placeholder="Ex: 2026" value={formTurma.anoLetivo}
                                       onChange={e => setFormTurma({ ...formTurma, anoLetivo: e.target.value })} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                        <button type="submit" className="dd-btn-primary">Cadastrar Turma →</button>
                    </form>
                </div>
            </div>

            <div className="dd-section">
                <div className="dd-section-header" style={{ flexDirection:"column", alignItems:"stretch", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span className="dd-section-title">Turmas Cadastradas</span>
                        <span className="dd-section-count">{turmas.length} turmas</span>
                    </div>
                    <BarraBusca campos={[{value:"nome",label:"Nome da Turma"},{value:"serie",label:"Série"}]}
                                campoBusca={campoBusca} setCampoBusca={setCampoBusca}
                                termoBusca={termoBusca} setTermoBusca={setTermoBusca} />
                </div>
                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Turma","Série","Ano",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                    {turmas.map(t => (
                        <tr key={t.id}>
                            <td style={{ fontWeight:500 }}>{t.nome}</td>
                            <td><span className="dd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>{t.serie?.nome}</span></td>
                            <td style={{ color:"#9aaa9f" }}>{t.anoLetivo}</td>
                            <td style={{ textAlign:"right" }}>
                                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                    <button className="dd-btn-edit" onClick={() => setTurmaSelecionada(t)}>Gerenciar</button>
                                    <button className="dd-btn-danger" onClick={() => excluirTurma(t)}><Trash2 size={12} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---- EDITAR TURMA ----
function EditarTurma({ turma, onVoltar }) {
    const [vinculosAluno, setVinculosAluno] = useState([]);
    const [vinculosProf, setVinculosProf] = useState([]);
    const [todosAlunos, setTodosAlunos] = useState([]);
    const [todosProfessores, setTodosProfessores] = useState([]);
    const [todasMaterias, setTodasMaterias] = useState([]);
    const [formAluno, setFormAluno] = useState({ alunoId: "" });
    const [formProf, setFormProf] = useState({ professorId: "", materiaId: "" });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [nomeTurma, setNomeTurma] = useState(turma.nome);
    const [anoLetivoTurma, setAnoLetivoTurma] = useState(String(turma.anoLetivo || ""));
    const [editandoNome, setEditandoNome] = useState(false);
    const [salvandoNome, setSalvandoNome] = useState(false);

    const carregar = () => {
        api.get(`/vinculos/aluno-turma/turma/${turma.id}`).then(r => setVinculosAluno(Array.isArray(r.data) ? r.data : [])).catch(() => setVinculosAluno([]));
        api.get(`/vinculos/professor-turma-materia/turma/${turma.id}`).then(r => setVinculosProf(Array.isArray(r.data) ? r.data : [])).catch(() => setVinculosProf([]));
    };

    useEffect(() => {
        api.get("/usuarios").then(r => {
            const data = Array.isArray(r.data) ? r.data : [];
            setTodosAlunos(data.filter(u => u.role === "ALUNO"));
            setTodosProfessores(data.filter(u => u.role === "PROFESSOR"));
        }).catch(() => {});
        api.get("/materias").then(r => setTodasMaterias(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        carregar();
    }, []);



    const vincularAluno = async e => {
        e.preventDefault();
        if (!formAluno.alunoId) return;
        try {
            await api.post("/vinculos/aluno-turma", { alunoId: formAluno.alunoId, turmaId: String(turma.id) });
            setMsg({ texto: "Aluno adicionado!", tipo: "ok" });
            setFormAluno({ alunoId: "" });
            carregar();
        } catch { setMsg({ texto: "Erro ao vincular.", tipo: "erro" }); }
    };

    const vincularProf = async e => {
        e.preventDefault();
        if (!formProf.professorId || !formProf.materiaId) return;
        try {
            await api.post("/vinculos/professor-turma-materia", { professorId: formProf.professorId, turmaId: String(turma.id), materiaId: formProf.materiaId });
            setMsg({ texto: "Professor adicionado!", tipo: "ok" });
            setFormProf({ professorId: "", materiaId: "" });
            carregar();
        } catch { setMsg({ texto: "Erro ao vincular.", tipo: "erro" }); }
    };

    const removerAluno = async v => {
        try {
            await api.delete("/vinculos/aluno-turma", { data: { alunoId: String(v.aluno.id), turmaId: String(turma.id) } });
            setMsg({ texto: "Aluno removido!", tipo: "ok" });
            carregar();
        } catch { setMsg({ texto: "Erro ao remover.", tipo: "erro" }); }
    };

    const removerProf = async v => {
        try {
            await api.delete("/vinculos/professor-turma-materia", { data: { professorId: String(v.professor.id), turmaId: String(turma.id), materiaId: String(v.materia.id) } });
            setMsg({ texto: "Professor removido!", tipo: "ok" });
            carregar();
        } catch { setMsg({ texto: "Erro ao remover.", tipo: "erro" }); }
    };

    const alunosDisponiveis = todosAlunos
        .filter(a => !vinculosAluno.some(v => v.aluno?.id === a.id))
        .map(a => ({ value: a.id, label: a.nome }));

    const salvarNomeTurma = async () => {
        if (!nomeTurma.trim()) return;
        setSalvandoNome(true);
        try {
            await api.put(`/turmas/${turma.id}`, { nome: nomeTurma.trim(), anoLetivo: anoLetivoTurma });
            turma.nome = nomeTurma.trim();
            turma.anoLetivo = parseInt(anoLetivoTurma);
            setMsg({ texto: "Turma atualizada!", tipo: "ok" });
            setEditandoNome(false);
        } catch (err) {
            const raw = err.response?.data;
            setMsg({ texto: typeof raw === "string" ? raw : "Erro ao atualizar.", tipo: "erro" });
        }
        setSalvandoNome(false);
    };

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <button className="dd-btn-ghost" onClick={onVoltar} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <ArrowLeft size={13} /> Voltar
                </button>
                {!editandoNome ? (
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div>
                            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#0d1f18", letterSpacing:"-.02em" }}>
                                {nomeTurma}
                            </h2>
                            <p className="dd-section-count">{turma.serie?.nome} — {anoLetivoTurma}</p>
                        </div>
                        <button className="dd-btn-edit" onClick={() => setEditandoNome(true)} style={{ display:"flex", alignItems:"center", gap:4 }}>
                            <Pencil size={11} /> Editar
                        </button>
                    </div>
                ) : (
                    <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1, maxWidth:280 }}>
                            <div className="dd-input-wrap">
                                <input className="dd-input" value={nomeTurma} onChange={e => setNomeTurma(e.target.value)}
                                       placeholder="Nome da turma" style={{ fontSize:16, fontWeight:600 }} />
                                <div className="dd-input-line" />
                            </div>
                            <div className="dd-input-wrap">
                                <input className="dd-input" type="number" value={anoLetivoTurma} onChange={e => setAnoLetivoTurma(e.target.value)}
                                       placeholder="Ano letivo" style={{ fontSize:13 }} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                        <button className="dd-btn-primary" onClick={salvarNomeTurma} disabled={salvandoNome} style={{ fontSize:11 }}>
                            {salvandoNome ? "Salvando..." : "Salvar"}
                        </button>
                        <button className="dd-btn-ghost" onClick={() => { setNomeTurma(turma.nome); setAnoLetivoTurma(String(turma.anoLetivo || "")); setEditandoNome(false); }} style={{ fontSize:11 }}>
                            Cancelar
                        </button>
                    </div>
                )}
            </div>

            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {/* Alunos */}
                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Alunos</span>
                        <span className="dd-section-count">{vinculosAluno.length} alunos</span>
                    </div>
                    <div style={{ padding:"16px", borderBottom:"1px solid #eaeef2" }}>
                        <form onSubmit={vincularAluno} style={{ display:"flex", gap:8 }}>
                            <SearchSelect options={alunosDisponiveis} value={formAluno.alunoId}
                                          onChange={v => setFormAluno({ alunoId: v })} placeholder="Buscar aluno..." />
                            <button type="submit" className="dd-btn-primary"><UserPlus size={13} /></button>
                        </form>
                    </div>
                    {vinculosAluno.length === 0
                        ? <p style={{ padding:"24px", textAlign:"center", fontSize:12, color:"#9aaa9f" }}>Nenhum aluno vinculado</p>
                        : vinculosAluno.map(v => (
                            <div key={v.aluno?.id} style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #f2f5f2" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{ width:26, height:26, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"#7ec8a0" }}>
                                        {v.aluno?.nome?.charAt(0)}
                                    </div>
                                    <span style={{ fontSize:13 }}>{v.aluno?.nome}</span>
                                </div>
                                <button className="dd-btn-danger" onClick={() => removerAluno(v)}>Remover</button>
                            </div>
                        ))
                    }
                </div>

                {/* Professores */}
                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Professores</span>
                        <span className="dd-section-count">{vinculosProf.length} professores</span>
                    </div>
                    <div style={{ padding:"16px", borderBottom:"1px solid #eaeef2" }}>
                        <form onSubmit={vincularProf} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                            <SearchSelect options={todosProfessores.map(p=>({value:p.id,label:p.nome}))} value={formProf.professorId}
                                          onChange={v => setFormProf({ ...formProf, professorId: v })} placeholder="Buscar professor..." />
                            <div style={{ display:"flex", gap:8 }}>
                                <SearchSelect options={todasMaterias.map(m=>({value:m.id,label:m.nome}))} value={formProf.materiaId}
                                              onChange={v => setFormProf({ ...formProf, materiaId: v })} placeholder="Selecionar matéria..." />
                                <button type="submit" className="dd-btn-primary"><UserPlus size={13} /></button>
                            </div>
                        </form>
                    </div>
                    {vinculosProf.length === 0
                        ? <p style={{ padding:"24px", textAlign:"center", fontSize:12, color:"#9aaa9f" }}>Nenhum professor vinculado</p>
                        : vinculosProf.map((v, i) => (
                            <div key={i} style={{ padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #f2f5f2" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                    <div style={{ width:26, height:26, background:"#2d6a4f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"#fff" }}>
                                        {v.professor?.nome?.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ fontSize:13, fontWeight:500 }}>{v.professor?.nome}</p>
                                        <p style={{ fontSize:11, color:"#9aaa9f" }}>{v.materia?.nome}</p>
                                    </div>
                                </div>
                                <button className="dd-btn-danger" onClick={() => removerProf(v)}>Remover</button>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

// ---- MATÉRIAS ----
function Materias() {
    const [materias, setMaterias] = useState([]);
    const [form, setForm] = useState({ nome: "" });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [termoBusca, setTermoBusca] = useState("");
    const termoDebounced = useDebounce(termoBusca);

    const buscar = (nome) => {
        const params = {};
        if (nome) params.nome = nome;
        api.get("/materias/buscar", { params }).then(r => setMaterias(Array.isArray(r.data) ? r.data : []));
    };

    useEffect(() => { buscar(termoDebounced); }, [termoDebounced]);



    const excluirMateria = async (m) => {
        if (!confirm(`Excluir matéria "${m.nome}"?`)) return;
        try { await api.delete(`/materias/${m.id}`); buscar(termoDebounced); }
        catch { setMsg({ texto: "Erro ao excluir. Há vínculos ativos com essa matéria?", tipo: "erro" }); }
    };

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div className="dd-section" style={{ padding:24 }}>
                <p className="dd-section-title" style={{ marginBottom:16 }}>Nova Matéria</p>
                <form onSubmit={async e => {
                    e.preventDefault();
                    await api.post("/materias", form);
                    setForm({ nome: "" });
                    buscar(termoDebounced);
                }} style={{ display:"flex", gap:8 }}>
                    <div className="dd-input-wrap" style={{ flex:1 }}>
                        <input className="dd-input" placeholder="Ex: Matemática" value={form.nome}
                               onChange={e => setForm({ nome: e.target.value })} />
                        <div className="dd-input-line" />
                    </div>
                    <button type="submit" className="dd-btn-primary">Adicionar</button>
                </form>
            </div>

            <div className="dd-section">
                <div className="dd-section-header" style={{ flexDirection:"column", alignItems:"stretch", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span className="dd-section-title">Matérias Cadastradas</span>
                        <span className="dd-section-count">{materias.length} matérias</span>
                    </div>
                    <div className="dd-search-input-wrap">
                        <Search size={12} className="dd-search-icon" />
                        <input className="dd-search-input" value={termoBusca}
                               onChange={e => setTermoBusca(e.target.value)} placeholder="Pesquisar por nome..." />
                        {termoBusca && <button className="dd-search-clear" onClick={() => setTermoBusca("")}><X size={12}/></button>}
                    </div>
                </div>
                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["#","Nome",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                    {materias.map(m => (
                        <tr key={m.id}>
                            <td style={{ color:"#9aaa9f", width:40 }}>{m.id}</td>
                            <td style={{ fontWeight:500 }}>{m.nome}</td>
                            <td style={{ textAlign:"right" }}>
                                <button className="dd-btn-danger" onClick={() => excluirMateria(m)}>Excluir</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}



// ---- LANÇAMENTOS ----
function Lancamentos() {
    // ── seleção
    const [turmas, setTurmas] = useState([]);
    const [turmaId, setTurmaId] = useState("");
    const [materias, setMaterias] = useState([]);
    const [materiaId, setMateriaId] = useState("");
    const [aba, setAba] = useState("notas"); // "notas" | "presenca"

    // ── notas
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [avaliacaoSel, setAvaliacaoSel] = useState(null);
    const [notasEdit, setNotasEdit] = useState({});
    const [formAv, setFormAv] = useState({ tipo:"PROVA", descricao:"", peso:"1.0", bonificacao:false, bimestre:"1" });
    const [criandoAv, setCriandoAv] = useState(false);
    const [bimestroFiltro, setBimestroFiltro] = useState("");

    // ── presença
    const [dataAula, setDataAula] = useState(new Date().toISOString().slice(0,10));
    const [chamada, setChamada] = useState({}); // { alunoId: true/false }
    const [presencasExistentes, setPresencasExistentes] = useState({});
    const [historicoPresenca, setHistoricoPresenca] = useState({});

    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);

    const flash = (texto, tipo="ok") => {
        setMsg({ texto, tipo });
        setTimeout(() => setMsg({ texto:"", tipo:"" }), 3000);
    };

    useEffect(() => {
        api.get("/turmas").then(r => setTurmas(r.data || []));
        api.get("/materias").then(r => setMaterias(r.data || []));
    }, []);

    // carrega alunos da turma
    useEffect(() => {
        if (!turmaId) return;
        api.get(`/vinculos/aluno-turma/turma/${turmaId}`)
            .then(r => setAlunos((r.data || []).map(v => v.aluno).filter(Boolean)));
    }, [turmaId]);

    // carrega avaliações
    useEffect(() => {
        if (!turmaId || !materiaId) return;
        api.get("/notas/avaliacoes", { params: { turmaId, materiaId } })
            .then(r => { setAvaliacoes(r.data || []); setAvaliacaoSel(null); setNotasEdit({}); });
    }, [turmaId, materiaId]);

    // carrega histórico de presença
    useEffect(() => {
        if (!turmaId || !materiaId) return;
        api.get(`/presencas/turma/${turmaId}/materia/${materiaId}`)
            .then(r => setHistoricoPresenca(r.data || {}));
    }, [turmaId, materiaId]);

    // quando muda a data, preenche chamada com registros existentes
    useEffect(() => {
        if (!dataAula || !historicoPresenca[dataAula]) {
            // inicia todos como presente por padrão
            const init = {};
            alunos.forEach(a => init[a.id] = true);
            setChamada(init);
            setPresencasExistentes({});
        } else {
            const registros = historicoPresenca[dataAula];
            const nova = {};
            const exist = {};
            registros.forEach(r => { nova[r.alunoId] = r.presente; exist[r.alunoId] = r.presencaId; });
            // alunos sem registro = presente por padrão
            alunos.forEach(a => { if (nova[a.id] === undefined) nova[a.id] = true; });
            setChamada(nova);
            setPresencasExistentes(exist);
        }
    }, [dataAula, historicoPresenca, alunos]);

    // quando seleciona avaliação, preenche notas existentes
    const selecionarAvaliacao = (av) => {
        setAvaliacaoSel(av);
        const init = {};
        av.notas.forEach(n => init[n.alunoId] = String(n.valor));
        setNotasEdit(init);
    };

    const criarAvaliacao = async (e) => {
        e.preventDefault();
        try {
            await api.post("/notas/avaliacao", { turmaId: String(turmaId), materiaId: String(materiaId), ...formAv, bimestre: formAv.bimestre });
            flash("Avaliação criada!");
            setCriandoAv(false);
            setFormAv({ tipo:"PROVA", descricao:"", peso:"1.0", bonificacao:false, bimestre:"1" });
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
        } catch { flash("Erro ao criar avaliação.", "erro"); }
    };

    const salvarNotas = async () => {
        if (!avaliacaoSel) return;
        setSalvando(true);
        let erros = 0;
        for (const aluno of alunos) {
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
        flash(erros > 0 ? `${erros} erro(s) ao salvar.` : "Notas salvas!", erros > 0 ? "erro" : "ok");
        const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
        setAvaliacoes(r.data || []);
        if (avaliacaoSel) {
            const updated = (r.data || []).find(a => a.id === avaliacaoSel.id);
            if (updated) selecionarAvaliacao(updated);
        }
    };

    const deletarAvaliacao = async (av, e) => {
        e.stopPropagation();
        if (!confirm(`Excluir a avaliação "${av.descricao || av.tipo}" e todas as suas notas? Esta ação não pode ser desfeita.`)) return;
        try {
            await api.delete(`/notas/avaliacao/${av.id}`);
            if (avaliacaoSel?.id === av.id) setAvaliacaoSel(null);
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
            flash("Avaliação excluída.");
        } catch { flash("Erro ao excluir avaliação.", "erro"); }
    };

    const salvarChamada = async () => {
        if (!turmaId || !materiaId || !dataAula) return;
        setSalvando(true);
        let erros = 0;
        for (const aluno of alunos) {
            try {
                await api.post("/presencas/lancar", {
                    alunoId: String(aluno.id),
                    turmaId: String(turmaId),
                    materiaId: String(materiaId),
                    presente: String(chamada[aluno.id] ?? true),
                    data: dataAula
                });
            } catch { erros++; }
        }
        setSalvando(false);
        flash(erros > 0 ? `${erros} erro(s) ao salvar.` : "Chamada salva!", erros > 0 ? "erro" : "ok");
        const r = await api.get(`/presencas/turma/${turmaId}/materia/${materiaId}`);
        setHistoricoPresenca(r.data || {});
    };

    const tipoLabel = { PROVA:"Prova", TRABALHO:"Trabalho", SIMULADO:"Simulado (bônus)" };
    const tipoColor = { PROVA:{ bg:"#f0f5f2", color:"#2d6a4f" }, TRABALHO:{ bg:"#f5f3ee", color:"#7a5c2e" }, SIMULADO:{ bg:"#f0f0f8", color:"#4a4a8a" } };

    // ── render seletor ──────────────────────────────────────────────────────
    const semSelecao = !turmaId || !materiaId;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Seletor turma + matéria */}
            <div className="dd-section" style={{ padding:24 }}>
                <p className="dd-section-title" style={{ marginBottom:20 }}>Selecionar Turma e Matéria</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                        <label className="dd-label">Turma</label>
                        <select className="dd-search-input" style={{ width:"100%", paddingLeft:12 }}
                                value={turmaId} onChange={e => { setTurmaId(e.target.value); setMateriaId(""); }}>
                            <option value="">Selecione a turma...</option>
                            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome} — {t.serie?.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="dd-label">Matéria</label>
                        <select className="dd-search-input" style={{ width:"100%", paddingLeft:12 }}
                                value={materiaId} onChange={e => setMateriaId(e.target.value)} disabled={!turmaId}>
                            <option value="">Selecione a matéria...</option>
                            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                    </div>
                </div>
                {!semSelecao && (
                    <div style={{ display:"flex", gap:0, marginTop:20, borderBottom:"2px solid #eaeef2" }}>
                        {[["notas","Notas"],["presenca","Presença"]].map(([id,label]) => (
                            <button key={id} onClick={() => setAba(id)}
                                    style={{ padding:"10px 24px", background:"none", border:"none", cursor:"pointer",
                                        fontSize:12, fontWeight:500, letterSpacing:".06em", textTransform:"uppercase",
                                        color: aba===id ? "#0d1f18" : "#9aaa9f",
                                        borderBottom: aba===id ? "2px solid #0d1f18" : "2px solid transparent",
                                        marginBottom:-2 }}>
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            {semSelecao && (
                <div style={{ padding:"48px", textAlign:"center", color:"#9aaa9f", fontSize:13, background:"#fff", border:"1px solid #eaeef2" }}>
                    Selecione uma turma e matéria para começar.
                </div>
            )}

            {/* ── ABA NOTAS ─────────────────────────────────────────────── */}
            {!semSelecao && aba === "notas" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                    {/* Lista de avaliações */}
                    <div className="dd-section">
                        <div className="dd-section-header">
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                <span className="dd-section-title">Avaliações</span>
                                <div style={{ display:"flex", gap:0 }}>
                                    {[["", "Todos"], ["1","1º Bim"], ["2","2º Bim"], ["3","3º Bim"], ["4","4º Bim"]].map(([val, label], i, arr) => (
                                        <button key={val} type="button"
                                                onClick={() => setBimestroFiltro(val)}
                                                style={{ padding:"4px 10px", border:"1px solid #eaeef2",
                                                    borderRight: i < arr.length - 1 ? "none" : "1px solid #eaeef2",
                                                    background: bimestroFiltro === val ? "#0d1f18" : "white",
                                                    color: bimestroFiltro === val ? "#7ec8a0" : "#9aaa9f",
                                                    fontSize:10, fontWeight:500, letterSpacing:".05em",
                                                    textTransform:"uppercase", cursor:"pointer" }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="dd-btn-primary" onClick={() => setCriandoAv(true)}>
                                + Nova Avaliação
                            </button>
                        </div>

                        {(() => {
                            const lista = bimestroFiltro
                                ? avaliacoes.filter(av => String(av.bimestre) === bimestroFiltro)
                                : avaliacoes;
                            if (lista.length === 0) return (
                                <p style={{ padding:"32px", textAlign:"center", fontSize:12, color:"#9aaa9f" }}>
                                    {avaliacoes.length === 0
                                        ? "Nenhuma avaliação criada para essa turma/matéria."
                                        : "Nenhuma avaliação no bimestre selecionado."}
                                </p>
                            );
                            return (
                                <div style={{ display:"flex", flexDirection:"column" }}>
                                    {lista.map(av => {
                                        const tc = tipoColor[av.tipo] || tipoColor.PROVA;
                                        const ativa = avaliacaoSel?.id === av.id;
                                        const lancadas = av.notas.length;
                                        return (
                                            <div key={av.id} onClick={() => selecionarAvaliacao(av)}
                                                 style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:16,
                                                     borderBottom:"1px solid #f2f5f2", cursor:"pointer",
                                                     background: ativa ? "#f8faf8" : "white",
                                                     borderLeft: ativa ? "3px solid #0d1f18" : "3px solid transparent" }}>
                                                <span className="dd-badge" style={{ background:tc.bg, color:tc.color, flexShrink:0 }}>
                                                    {tipoLabel[av.tipo]}
                                                </span>
                                                <span style={{ fontSize:10, fontWeight:600, color:"#1A759F", background:"#e8f3fb",
                                                    padding:"2px 7px", letterSpacing:".04em", flexShrink:0 }}>
                                                    {av.bimestre || 1}º BIM
                                                </span>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <p style={{ fontSize:13, fontWeight:500, color:"#0d1f18" }}>
                                                        {av.descricao || tipoLabel[av.tipo]}
                                                    </p>
                                                    <p style={{ fontSize:11, color:"#9aaa9f", marginTop:2 }}>
                                                        Peso {av.peso} · {av.dataAplicacao || "sem data"}
                                                        {av.bonificacao && " · ✦ Bônus"}
                                                    </p>
                                                </div>
                                                <span style={{ fontSize:11, color:"#9aaa9f" }}>
                                                    {lancadas}/{alunos.length} notas
                                                </span>
                                                <button
                                                    onClick={(e) => deletarAvaliacao(av, e)}
                                                    title="Excluir avaliação"
                                                    style={{ background:"none", border:"none", cursor:"pointer",
                                                        color:"#c0392b", padding:"4px 6px", borderRadius:4,
                                                        fontSize:14, lineHeight:1, flexShrink:0,
                                                        opacity: 0.6 }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
                                                >✕</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Tabela de notas da avaliação selecionada */}
                    {avaliacaoSel && (
                        <div className="dd-section">
                            <div className="dd-section-header">
                                <div>
                                    <span className="dd-section-title">{avaliacaoSel.descricao || tipoLabel[avaliacaoSel.tipo]}</span>
                                    <p style={{ fontSize:11, color:"#9aaa9f", marginTop:2 }}>
                                        {avaliacaoSel.bonificacao
                                            ? "Bônus — valor entre 0.00 e 1.00, não entra no denominador da média"
                                            : `Peso ${avaliacaoSel.peso} — nota de 0 a 10`}
                                    </p>
                                </div>
                                <button className="dd-btn-primary" onClick={salvarNotas} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar Notas →"}
                                </button>
                            </div>
                            <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                                <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th style={{ width:180 }}>Nota {avaliacaoSel.bonificacao ? "(0.00–1.00)" : "(0–10)"}</th>
                                    <th style={{ width:80 }}>Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {alunos.map(aluno => {
                                    const val = notasEdit[aluno.id] ?? "";
                                    const temNota = avaliacaoSel.notas.some(n => n.alunoId === aluno.id);
                                    return (
                                        <tr key={aluno.id}>
                                            <td>
                                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                    <div style={{ width:26, height:26, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color:"#7ec8a0", flexShrink:0 }}>
                                                        {aluno.nome.charAt(0)}
                                                    </div>
                                                    <span style={{ fontWeight:500, fontSize:13 }}>{aluno.nome}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={avaliacaoSel.bonificacao ? 1 : 10}
                                                    step={avaliacaoSel.bonificacao ? 0.01 : 0.1}
                                                    value={val}
                                                    onChange={e => setNotasEdit(prev => ({ ...prev, [aluno.id]: e.target.value }))}
                                                    placeholder="—"
                                                    className="dd-input"
                                                    style={{ width:120, padding:"6px 0", fontSize:15, fontFamily:"'Playfair Display',serif", fontWeight:700 }}
                                                />
                                            </td>
                                            <td>
                                                {temNota
                                                    ? <span className="dd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>Lançada</span>
                                                    : <span className="dd-badge" style={{ background:"#f5f3ee", color:"#7a5c2e" }}>Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── ABA PRESENÇA ──────────────────────────────────────────── */}
            {!semSelecao && aba === "presenca" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <div className="dd-section" style={{ padding:24 }}>
                        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:16 }}>
                            <div>
                                <label className="dd-label">Data da Aula</label>
                                <div className="dd-input-wrap" style={{ width:180 }}>
                                    <input className="dd-input" type="date" value={dataAula}
                                           onChange={e => setDataAula(e.target.value)} />
                                    <div className="dd-input-line" />
                                </div>
                            </div>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                {Object.keys(historicoPresenca).length > 0 && (
                                    <span style={{ fontSize:11, color:"#9aaa9f" }}>
                                        {Object.keys(historicoPresenca).length} aula(s) registrada(s)
                                    </span>
                                )}
                                <button className="dd-btn-ghost"
                                        onClick={() => { const init={}; alunos.forEach(a=>init[a.id]=true); setChamada(init); }}>
                                    Todos Presentes
                                </button>
                                <button className="dd-btn-primary" onClick={salvarChamada} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar Chamada →"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="dd-section">
                        <div className="dd-section-header">
                            <span className="dd-section-title">Chamada — {dataAula}</span>
                            <span className="dd-section-count">
                                {Object.values(chamada).filter(Boolean).length}/{alunos.length} presentes
                            </span>
                        </div>
                        <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                            <tr>
                                <th>Aluno</th>
                                <th style={{ width:160, textAlign:"center" }}>Presença</th>
                            </tr>
                            </thead>
                            <tbody>
                            {alunos.map(aluno => {
                                const presente = chamada[aluno.id] ?? true;
                                return (
                                    <tr key={aluno.id}>
                                        <td>
                                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                <div style={{ width:26, height:26, background: presente ? "#0d1f18" : "#e8e8e8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600, color: presente ? "#7ec8a0" : "#aaa", flexShrink:0, transition:"background .15s" }}>
                                                    {aluno.nome.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight:500, fontSize:13, color: presente ? "#0d1f18" : "#aaa", transition:"color .15s" }}>
                                                    {aluno.nome}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign:"center" }}>
                                            <div style={{ display:"flex", gap:0, justifyContent:"center" }}>
                                                <button onClick={() => setChamada(p => ({...p, [aluno.id]: true}))}
                                                        style={{ padding:"6px 16px", border:"1px solid #eaeef2", borderRight:"none", background: presente ? "#0d1f18" : "white", color: presente ? "#7ec8a0" : "#9aaa9f", fontSize:11, fontWeight:500, cursor:"pointer", letterSpacing:".04em", transition:"all .15s" }}>
                                                    P
                                                </button>
                                                <button onClick={() => setChamada(p => ({...p, [aluno.id]: false}))}
                                                        style={{ padding:"6px 16px", border:"1px solid #eaeef2", background: !presente ? "#b94040" : "white", color: !presente ? "white" : "#9aaa9f", fontSize:11, fontWeight:500, cursor:"pointer", letterSpacing:".04em", transition:"all .15s" }}>
                                                    F
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mini histórico de frequência */}
                    {Object.keys(historicoPresenca).length > 0 && (
                        <div className="dd-section">
                            <div className="dd-section-header">
                                <span className="dd-section-title">Histórico de Frequência</span>
                            </div>
                            <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
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
                                    const registros = Object.values(historicoPresenca).flatMap(d => d).filter(r => r.alunoId === aluno.id);
                                    const total = registros.length;
                                    const presentes = registros.filter(r => r.presente).length;
                                    const pct = total > 0 ? Math.round((presentes/total)*100) : 0;
                                    return (
                                        <tr key={aluno.id}>
                                            <td style={{ fontWeight:500 }}>{aluno.nome}</td>
                                            <td style={{ color:"#2d6a4f" }}>{presentes}</td>
                                            <td style={{ color:"#b94040" }}>{total - presentes}</td>
                                            <td>
                                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                                    <div style={{ flex:1, height:4, background:"#eaeef2", overflow:"hidden" }}>
                                                        <div style={{ width:`${pct}%`, height:"100%", background: pct >= 75 ? "#7ec8a0" : pct >= 50 ? "#e6a817" : "#b94040", transition:"width .3s" }} />
                                                    </div>
                                                    <span style={{ fontSize:12, fontWeight:500, color: pct >= 75 ? "#2d6a4f" : pct >= 50 ? "#a05c00" : "#b94040", width:36, textAlign:"right" }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal nova avaliação */}
            {criandoAv && (
                <div className="dd-modal-overlay">
                    <div className="dd-modal">
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                            <div>
                                <p className="dd-modal-title">Nova Avaliação</p>
                                <p className="dd-modal-sub">{turmas.find(t=>String(t.id)===String(turmaId))?.nome} · {materias.find(m=>String(m.id)===String(materiaId))?.nome}</p>
                            </div>
                            <button onClick={() => setCriandoAv(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={criarAvaliacao} style={{ display:"flex", flexDirection:"column", gap:20 }}>
                            <div>
                                <label className="dd-label">Tipo</label>
                                <div style={{ display:"flex", gap:0 }}>
                                    {["PROVA","TRABALHO","SIMULADO"].map(t => (
                                        <button key={t} type="button" onClick={() => setFormAv(p => ({...p, tipo:t, bonificacao: t==="SIMULADO"}))}
                                                style={{ flex:1, padding:"9px", border:"1px solid #eaeef2", borderRight: t!=="SIMULADO"?"none":"1px solid #eaeef2",
                                                    background: formAv.tipo===t ? "#0d1f18" : "white",
                                                    color: formAv.tipo===t ? "#7ec8a0" : "#9aaa9f",
                                                    fontSize:11, fontWeight:500, letterSpacing:".06em", textTransform:"uppercase", cursor:"pointer" }}>
                                            {t==="SIMULADO" ? "Bônus" : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="dd-label">Bimestre</label>
                                <div style={{ display:"flex", gap:0 }}>
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
                                <label className="dd-label">Descrição</label>
                                <div className="dd-input-wrap">
                                    <input className="dd-input" placeholder="Ex: Prova bimestral 1"
                                           value={formAv.descricao} onChange={e => setFormAv(p => ({...p, descricao:e.target.value}))} />
                                    <div className="dd-input-line" />
                                </div>
                            </div>
                            {formAv.tipo !== "SIMULADO" && (
                                <div>
                                    <label className="dd-label">Peso</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type="number" min="0.1" max="10" step="0.1"
                                               value={formAv.peso} onChange={e => setFormAv(p => ({...p, peso:e.target.value}))} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            )}
                            {formAv.tipo === "SIMULADO" && (
                                <div className="dd-ok" style={{ fontSize:12 }}>
                                    ✦ Bônus — a nota (0.00 a 1.00) é somada à média final sem entrar no denominador.
                                </div>
                            )}
                            <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                <button type="button" onClick={() => setCriandoAv(false)} className="dd-btn-ghost" style={{ flex:1 }}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" style={{ flex:1 }}>Criar Avaliação →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


// ---- ATRASOS ----
function Atrasos() {
    const hoje = new Date().toISOString().slice(0, 10);
    const [dataSel, setDataSel] = useState(hoje);
    const [alunos, setAlunos] = useState([]);
    const [busca, setBusca] = useState("");
    const [alunoSel, setAlunoSel] = useState(null);
    const [obs, setObs] = useState("");
    const [registros, setRegistros] = useState([]);
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [historico, setHistorico] = useState([]);
    const [verHistorico, setVerHistorico] = useState(false);

    const flash = (texto, tipo="ok") => {
        setMsg({ texto, tipo });
        setTimeout(() => setMsg({ texto:"", tipo:"" }), 3000);
    };

    const carregarDia = (data) => {
        setCarregando(true);
        api.get("/atrasos/historico", { params: { data } })
            .then(r => setRegistros(r.data || []))
            .catch(() => {})
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        api.get("/usuarios").then(r =>
            setAlunos((r.data || []).filter(u => u.role === "ALUNO" && u.ativo))
        );
    }, []);

    useEffect(() => {
        carregarDia(dataSel);
    }, [dataSel]);

    const alunosFiltrados = busca.length >= 2
        ? alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))
        : [];

    const selecionarAluno = (aluno) => {
        setAlunoSel(aluno);
        setBusca(aluno.nome);
        setVerHistorico(false);
        setHistorico([]);
    };

    const verHistoricoAluno = async (aluno) => {
        const r = await api.get(`/atrasos/aluno/${aluno.id}`);
        setHistorico(r.data || []);
        setVerHistorico(true);
    };

    const registrar = async () => {
        if (!alunoSel) return;
        setSalvando(true);
        try {
            const r = await api.post("/atrasos", {
                alunoId: String(alunoSel.id),
                observacao: obs || null,
                data: dataSel
            });
            flash(`Atraso registrado — ${r.data.aluno} às ${r.data.horario}`);
            setAlunoSel(null);
            setBusca("");
            setObs("");
            carregarDia(dataSel);
        } catch (e) {
            flash(e.response?.status === 409 ? "Aluno já tem atraso registrado neste dia." : "Erro ao registrar.", "erro");
        }
        setSalvando(false);
    };

    const remover = async (id) => {
        await api.delete(`/atrasos/${id}`);
        carregarDia(dataSel);
    };

    const horaAgora = new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" });
    const dataSelDisplay = new Date(dataSel + "T12:00:00").toLocaleDateString("pt-BR");
    const eHoje = dataSel === hoje;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Header do dia */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                <div className="dd-section" style={{ borderTop:"2px solid #0d1f18", padding:"20px" }}>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:"#0d1f18", lineHeight:1 }}>
                        {carregando ? "—" : registros.length}
                    </p>
                    <p style={{ fontSize:11, letterSpacing:".06em", textTransform:"uppercase", color:"#9aaa9f", marginTop:4 }}>
                        Atrasos {eHoje ? "hoje" : "no dia"}
                    </p>
                </div>
                <div className="dd-section" style={{ borderTop:"2px solid #7ec8a0", padding:"20px" }}>
                    <p style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:"#0d1f18", lineHeight:1 }}>
                        {horaAgora}
                    </p>
                    <p style={{ fontSize:11, letterSpacing:".06em", textTransform:"uppercase", color:"#9aaa9f", marginTop:4 }}>
                        Agora
                    </p>
                </div>
                <div className="dd-section" style={{ borderTop:"2px solid #1A759F", padding:"20px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <input
                            type="date"
                            value={dataSel}
                            max={hoje}
                            onChange={e => setDataSel(e.target.value)}
                            style={{ border:"none", background:"transparent", fontFamily:"'Playfair Display',serif",
                                fontSize:16, fontWeight:700, color:"#0d1f18", outline:"none", cursor:"pointer", width:"100%" }}
                        />
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                        <p style={{ fontSize:11, letterSpacing:".06em", textTransform:"uppercase", color:"#9aaa9f" }}>
                            Filtrar data
                        </p>
                        {!eHoje && (
                            <button onClick={() => setDataSel(hoje)}
                                    style={{ fontSize:10, padding:"2px 8px", background:"#0d1f18", color:"#7ec8a0",
                                        border:"none", cursor:"pointer", letterSpacing:".04em" }}>
                                HOJE
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            {/* Registro de atraso */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Registrar Atraso</span>
                    {!eHoje && <span className="dd-section-count">para {dataSelDisplay}</span>}
                </div>
                <div style={{ padding:24, display:"flex", flexDirection:"column", gap:20 }}>

                    {/* Busca de aluno */}
                    <div style={{ position:"relative" }}>
                        <label className="dd-label">Buscar Aluno</label>
                        <div className="dd-input-wrap">
                            <input
                                className="dd-input"
                                placeholder="Digite o nome do aluno..."
                                value={busca}
                                onChange={e => { setBusca(e.target.value); setAlunoSel(null); setVerHistorico(false); }}
                                autoComplete="off"
                            />
                            <div className="dd-input-line" />
                        </div>

                        {/* Dropdown sugestões */}
                        {alunosFiltrados.length > 0 && !alunoSel && (
                            <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:99,
                                background:"white", border:"1px solid #eaeef2",
                                boxShadow:"0 8px 24px rgba(13,31,24,.1)", maxHeight:220, overflowY:"auto" }}>
                                {alunosFiltrados.map(a => (
                                    <button key={a.id} onClick={() => selecionarAluno(a)}
                                            style={{ width:"100%", textAlign:"left", padding:"11px 16px",
                                                background:"none", border:"none", borderBottom:"1px solid #f2f5f2",
                                                cursor:"pointer", fontSize:13, color:"#0d1f18",
                                                fontFamily:"'DM Sans',sans-serif", display:"flex",
                                                alignItems:"center", gap:10 }}>
                                        <div style={{ width:24, height:24, background:"#0d1f18", flexShrink:0,
                                            display:"flex", alignItems:"center", justifyContent:"center",
                                            fontSize:10, fontWeight:600, color:"#7ec8a0" }}>
                                            {a.nome.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight:500 }}>{a.nome}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Aluno selecionado */}
                    {alunoSel && (
                        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 16px",
                            background:"#f8faf8", border:"1px solid #eaeef2", borderLeft:"3px solid #7ec8a0" }}>
                            <div style={{ width:36, height:36, background:"#0d1f18", display:"flex",
                                alignItems:"center", justifyContent:"center", fontSize:14,
                                fontWeight:600, color:"#7ec8a0", flexShrink:0 }}>
                                {alunoSel.nome.charAt(0)}
                            </div>
                            <div style={{ flex:1 }}>
                                <p style={{ fontWeight:500, fontSize:14, color:"#0d1f18" }}>{alunoSel.nome}</p>
                                <p style={{ fontSize:11, color:"#9aaa9f" }}>
                                    Selecionado · clique em "Ver Histórico" para conferir ocorrências anteriores
                                </p>
                            </div>
                            <button className="dd-btn-ghost" onClick={() => verHistoricoAluno(alunoSel)}
                                    style={{ fontSize:11, whiteSpace:"nowrap" }}>
                                Ver Histórico
                            </button>
                            <button onClick={() => { setAlunoSel(null); setBusca(""); setVerHistorico(false); }}
                                    style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f", padding:4 }}>
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Histórico do aluno */}
                    {verHistorico && historico.length > 0 && (
                        <div style={{ background:"#fdf9f0", border:"1px solid #e8d9a0", padding:"12px 16px" }}>
                            <p style={{ fontSize:11, fontWeight:500, letterSpacing:".08em", textTransform:"uppercase",
                                color:"#a05c00", marginBottom:8 }}>
                                ⚠ {historico.length} atraso(s) registrado(s) para este aluno
                            </p>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                                {historico.slice(0,5).map(h => (
                                    <p key={h.id} style={{ fontSize:12, color:"#7a5c2e" }}>
                                        {new Date(h.data).toLocaleDateString("pt-BR")} às {h.horario}
                                        {h.turma !== "—" ? ` · ${h.turma}` : ""}
                                        {h.observacao ? ` — ${h.observacao}` : ""}
                                    </p>
                                ))}
                                {historico.length > 5 && (
                                    <p style={{ fontSize:11, color:"#9aaa9f" }}>... e mais {historico.length - 5}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Observação opcional */}
                    <div>
                        <label className="dd-label">Observação (opcional)</label>
                        <div className="dd-input-wrap">
                            <input className="dd-input" placeholder="Ex: Problema no transporte..."
                                   value={obs} onChange={e => setObs(e.target.value)} />
                            <div className="dd-input-line" />
                        </div>
                    </div>

                    <button className="dd-btn-primary" onClick={registrar}
                            disabled={!alunoSel || salvando}
                            style={{ alignSelf:"flex-start", padding:"12px 32px" }}>
                        {salvando ? "Registrando..." : "Registrar Atraso →"}
                    </button>
                </div>
            </div>

            {/* Lista do dia */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Atrasos — {dataSelDisplay}</span>
                    <span className="dd-section-count">{registros.length} registro(s)</span>
                </div>
                {registros.length === 0
                    ? <p style={{ padding:"40px", textAlign:"center", fontSize:13, color:"#9aaa9f" }}>
                        {carregando ? "Carregando..." : "Nenhum atraso registrado neste dia."}
                    </p>
                    : <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                        <tr>
                            <th>Aluno</th>
                            <th style={{ width:80 }}>Horário</th>
                            <th>Turma</th>
                            <th>Observação</th>
                            <th style={{ width:60 }}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {registros.map((r, i) => (
                            <tr key={r.id}>
                                <td>
                                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                        <div style={{ width:26, height:26, background:"#0d1f18", flexShrink:0,
                                            display:"flex", alignItems:"center", justifyContent:"center",
                                            fontSize:10, fontWeight:600, color:"#7ec8a0" }}>
                                            {r.alunoNome.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight:500, fontSize:13 }}>{r.alunoNome}</span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
                                        fontSize:15, color:"#0d1f18" }}>
                                        {r.horario}
                                    </span>
                                </td>
                                <td style={{ color:"#9aaa9f", fontSize:12 }}>{r.turma}</td>
                                <td style={{ color:"#9aaa9f", fontSize:12 }}>{r.observacao || "—"}</td>
                                <td>
                                    <button onClick={() => remover(r.id)} className="dd-btn-danger"
                                            title="Remover registro">
                                        <Trash2 size={13} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                }
            </div>
        </div>
    );
}

// ---- BOLETINS ----
function Boletins() {
    const [alunos, setAlunos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [alunoId, setAlunoId] = useState("");
    const [turmaId, setTurmaId] = useState("");
    const [boletim, setBoletim] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [logo, setLogo] = useState(() => localStorage.getItem("escola_logo") || null);
    const [gerando, setGerando] = useState(false);
    const [preview, setPreview] = useState(false);
    const boletimRef = useRef(null);

    useEffect(() => {
        api.get("/usuarios").then(r => setAlunos((r.data || []).filter(u => u.role === "ALUNO" && u.ativo)));
        api.get("/turmas").then(r => setTurmas(r.data || []));
    }, []);

    const handleLogo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setLogo(dataUrl);
            localStorage.setItem("escola_logo", dataUrl);
        };
        reader.readAsDataURL(file);
    };

    const gerarBoletim = async () => {
        if (!alunoId || !turmaId) return;
        setCarregando(true);
        setBoletim(null);
        setPreview(false);
        try {
            const r = await api.get(`/notas/boletim/${alunoId}/${turmaId}`);
            setBoletim(r.data);
            setPreview(true);
        } catch (e) {
            alert("Erro ao gerar boletim.");
        } finally {
            setCarregando(false);
        }
    };

    const baixarPDF = async () => {
        if (!boletimRef.current) return;
        setGerando(true);
        try {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import("jspdf"),
                import("html2canvas"),
            ]);
            const canvas = await html2canvas(boletimRef.current, {
                scale: 2, useCORS: true, backgroundColor: "#fff",
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
            const nome = (boletim?.aluno?.nome || "aluno").replace(/\s+/g,"_").toLowerCase();
            pdf.save(`boletim_${nome}.pdf`);
        } catch (e) {
            alert("Erro ao gerar PDF.\nInstale as dependências:\nnpm install jspdf html2canvas");
        }
        setGerando(false);
    };

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Configuração do logo */}
            <div className="dd-section" style={{ padding:24 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <p className="dd-section-title">Logo da Escola</p>
                    {logo && (
                        <button onClick={() => { setLogo(null); localStorage.removeItem("escola_logo"); }}
                                className="dd-btn-ghost" style={{ fontSize:10 }}>Remover logo</button>
                    )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:20 }}>
                    <div style={{ width:100, height:64, border:"1px solid #eaeef2", display:"flex",
                        alignItems:"center", justifyContent:"center", overflow:"hidden", background:"#f8faf8" }}>
                        {logo
                            ? <img src={logo} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} alt="logo" />
                            : <span style={{ fontSize:10, color:"#9aaa9f", textAlign:"center" }}>Sem logo</span>
                        }
                    </div>
                    <div>
                        <label className="dd-label">Carregar imagem (PNG, JPG)</label>
                        <input type="file" accept="image/*" onChange={handleLogo}
                               style={{ fontSize:12, color:"#0d1f18", fontFamily:"'DM Sans',sans-serif" }} />
                        <p style={{ fontSize:11, color:"#9aaa9f", marginTop:4 }}>
                            Salvo localmente no navegador. Recomendado: fundo transparente, proporção ~3:2.
                        </p>
                    </div>
                </div>
            </div>

            {/* Seletor aluno + turma */}
            <div className="dd-section" style={{ padding:24 }}>
                <p className="dd-section-title" style={{ marginBottom:20 }}>Gerar Boletim</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:16, alignItems:"flex-end" }}>
                    <div>
                        <label className="dd-label">Aluno</label>
                        <SearchSelect
                            options={alunos.map(a => ({ value: a.id, label: a.nome }))}
                            value={alunoId} onChange={setAlunoId}
                            placeholder="Selecione o aluno..." />
                    </div>
                    <div>
                        <label className="dd-label">Turma</label>
                        <SearchSelect
                            options={turmas.map(t => ({ value: t.id, label: `${t.nome} — ${t.serie?.nome || ""}` }))}
                            value={turmaId} onChange={setTurmaId}
                            placeholder="Selecione a turma..." />
                    </div>
                    <button onClick={gerarBoletim} disabled={!alunoId || !turmaId || carregando}
                            className="dd-btn-primary" style={{ whiteSpace:"nowrap" }}>
                        {carregando ? "Carregando..." : "Gerar →"}
                    </button>
                </div>
            </div>

            {/* Preview + PDF */}
            {preview && boletim && (
                <div className="dd-section">
                    <div className="dd-section-header">
                        <div>
                            <span className="dd-section-title">{boletim.aluno?.nome}</span>
                            <p style={{ fontSize:11, color:"#9aaa9f", marginTop:2 }}>
                                {boletim.turma?.nome} · {boletim.turma?.anoLetivo}
                            </p>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                            <button className="dd-btn-ghost" onClick={() => setPreview(p => !p)}>
                                {preview ? "Ocultar preview" : "Ver preview"}
                            </button>
                            <button className="dd-btn-primary" onClick={baixarPDF} disabled={gerando}>
                                {gerando ? "Gerando..." : "Baixar PDF →"}
                            </button>
                        </div>
                    </div>

                    {/* Preview visual */}
                    <div style={{ padding:20, background:"#f2f4f2", overflowX:"auto" }}>
                        <div ref={boletimRef} style={{ transformOrigin:"top left" }}>
                            <BoletimImpresso boletim={boletim} logo={logo} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// HORÁRIOS — Grade de aulas
// ═══════════════════════════════════════════════════════════════
const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DIAS_LABEL = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };
const DEFAULT_HORARIOS = ["07:30", "08:18", "09:06", "10:09", "10:57"];

function Horarios() {
    const [turmas, setTurmas] = useState([]);
    const [turmaId, setTurmaId] = useState("");
    const [professores, setProfessores] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [editMode, setEditMode] = useState(false);
    const [horariosConfig, setHorariosConfig] = useState([...DEFAULT_HORARIOS]);
    const [editingSlot, setEditingSlot] = useState(null); // { dia, ordem }
    const [allHorarios, setAllHorarios] = useState([]);
    const [viewAll, setViewAll] = useState(true);
    const [vinculosTurma, setVinculosTurma] = useState([]); // vinculos professor-turma-materia

    // Grid state: grid[dia][ordem] = { professorId, materiaId }
    const [grid, setGrid] = useState({});

    useEffect(() => {
        Promise.all([
            api.get("/turmas"),
            api.get("/usuarios/buscar?role=PROFESSOR"),
            api.get("/materias"),
            api.get("/horarios"),
        ]).then(([t, p, m, h]) => {
            setTurmas(t.data || []);
            setProfessores(p.data || []);
            setMaterias(m.data || []);
            setAllHorarios(h.data || []);
        });
    }, []);

    // Carrega horários e vínculos da turma selecionada
    useEffect(() => {
        if (!turmaId) { setHorarios([]); setGrid({}); setVinculosTurma([]); return; }
        setLoading(true);
        Promise.all([
            api.get(`/horarios/turma/${turmaId}`),
            api.get(`/vinculos/professor-turma-materia/turma/${turmaId}`),
        ]).then(([r, v]) => {
            const data = r.data || [];
            setHorarios(data);
            setVinculosTurma(Array.isArray(v.data) ? v.data : []);
            // Monta o grid
            const g = {};
            for (const h of data) {
                if (!g[h.diaSemana]) g[h.diaSemana] = {};
                g[h.diaSemana][h.ordemAula] = {
                    professorId: h.professorId,
                    materiaId: h.materiaId,
                };
            }
            setGrid(g);
            // Detecta horários do backend
            const hrs = [...new Set(data.map(h => h.horarioInicio))].sort();
            if (hrs.length > 0) setHorariosConfig(hrs.length >= 5 ? hrs : [...DEFAULT_HORARIOS]);
        })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [turmaId]);

    const setSlot = (dia, ordem, field, value) => {
        setGrid(prev => {
            const g = { ...prev };
            if (!g[dia]) g[dia] = {};
            g[dia] = { ...g[dia], [ordem]: { ...(g[dia][ordem] || {}), [field]: value } };
            return g;
        });
    };

    const clearSlot = (dia, ordem) => {
        setGrid(prev => {
            const g = { ...prev };
            if (g[dia]) {
                const d = { ...g[dia] };
                delete d[ordem];
                g[dia] = d;
            }
            return g;
        });
        setEditingSlot(null);
    };

    const salvarGrade = async () => {
        if (!turmaId) return;
        setSalvando(true);
        setMsg({ texto: "", tipo: "" });

        const aulas = [];
        DIAS.forEach(dia => {
            horariosConfig.forEach((hr, idx) => {
                const ordem = idx + 1;
                const slot = grid[dia]?.[ordem];
                if (slot?.professorId && slot?.materiaId) {
                    aulas.push({
                        diaSemana: dia,
                        ordemAula: ordem,
                        horarioInicio: hr,
                        professorId: slot.professorId,
                        materiaId: slot.materiaId,
                    });
                }
            });
        });

        try {
            await api.post("/horarios/lote", { turmaId, aulas });
            setMsg({ texto: "Grade de horários salva com sucesso!", tipo: "ok" });
            setEditMode(false);
            // Recarrega
            const r = await api.get(`/horarios/turma/${turmaId}`);
            setHorarios(r.data || []);
            const ha = await api.get("/horarios");
            setAllHorarios(ha.data || []);
        } catch (e) {
            setMsg({ texto: e.response?.data || "Erro ao salvar horários", tipo: "err" });
        }
        setSalvando(false);
    };

    const limparGrade = async () => {
        if (!turmaId) return;
        if (!window.confirm("Tem certeza que deseja limpar todos os horários desta turma?")) return;
        try {
            await api.delete(`/horarios/turma/${turmaId}`);
            setGrid({});
            setHorarios([]);
            setMsg({ texto: "Horários removidos", tipo: "ok" });
            const ha = await api.get("/horarios");
            setAllHorarios(ha.data || []);
        } catch {
            setMsg({ texto: "Erro ao limpar horários", tipo: "err" });
        }
    };

    // Agrupa allHorarios por turma para a visão geral
    const turmasComHorario = [...new Set(allHorarios.map(h => h.turmaId))];
    const turmaMap = {};
    turmas.forEach(t => { turmaMap[t.id] = t; });

    // Helper para pegar nome do prof + materia de um slot do allHorarios
    const getSlotLabel = (turmaIdView, dia, ordem) => {
        const h = allHorarios.find(
            x => x.turmaId === turmaIdView && x.diaSemana === dia && x.ordemAula === ordem
        );
        if (!h) return null;
        // Pega só sobrenome do professor
        const nomeProf = h.professorNome?.split(" ")[0] || "";
        return `${nomeProf} (${h.materiaNome})`;
    };

    // Detecta horários usados na visão geral
    const horariosUsados = [...new Set(allHorarios.map(h => h.horarioInicio))].sort();
    const hrsView = horariosUsados.length >= 1 ? horariosUsados : DEFAULT_HORARIOS;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* ── Toggle: Visão Geral vs Editar Turma ── */}
            <div style={{ display: "flex", gap: 8 }}>
                <button
                    className={viewAll ? "dd-btn-primary" : "dd-btn-ghost"}
                    onClick={() => setViewAll(true)}
                    style={{ fontSize: 11 }}>
                    Visão Geral
                </button>
                <button
                    className={!viewAll ? "dd-btn-primary" : "dd-btn-ghost"}
                    onClick={() => setViewAll(false)}
                    style={{ fontSize: 11 }}>
                    Editar Horários
                </button>
            </div>

            {msg.texto && (
                <div className={msg.tipo === "ok" ? "dd-ok" : "dd-err"}>{msg.texto}</div>
            )}

            {/* ═══════ VISÃO GERAL — todas as turmas lado a lado ═══════ */}
            {viewAll && (
                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Grade de Horários — Visão Geral</span>
                        <span className="dd-section-count">{turmasComHorario.length} turma(s) com horário</span>
                    </div>
                    <div style={{ padding: 20, overflowX: "auto" }}>
                        {turmasComHorario.length === 0 ? (
                            <p style={{ color: "#9aaa9f", fontSize: 13, textAlign: "center", padding: 32 }}>
                                Nenhum horário cadastrado ainda. Use "Editar Horários" para começar.
                            </p>
                        ) : (
                            DIAS.map(dia => {
                                return (
                                    <div key={dia} style={{ marginBottom: 20 }}>
                                        <p style={{
                                            fontSize: 12, fontWeight: 600, letterSpacing: ".08em",
                                            textTransform: "uppercase", color: "#0d1f18", marginBottom: 8,
                                            paddingBottom: 4, borderBottom: "2px solid #0d1f18", display: "inline-block"
                                        }}>
                                            {DIAS_LABEL[dia]}
                                        </p>
                                        <table className="dd-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                            <tr>
                                                <th style={{ width: 70 }}>Horário</th>
                                                {turmasComHorario.map(tid => (
                                                    <th key={tid}>{turmaMap[tid]?.nome || `Turma ${tid}`}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {hrsView.map((hr, idx) => (
                                                <tr key={hr}>
                                                    <td style={{ fontWeight: 500, fontSize: 12, color: "#5a7060" }}>{hr}</td>
                                                    {turmasComHorario.map(tid => {
                                                        const label = getSlotLabel(tid, dia, idx + 1);
                                                        return (
                                                            <td key={tid} style={{
                                                                fontSize: 12,
                                                                color: label ? "#0d1f18" : "#d4ddd8",
                                                                fontWeight: label ? 400 : 300,
                                                            }}>
                                                                {label || "—"}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* ═══════ MODO EDIÇÃO — seleciona turma e edita grade ═══════ */}
            {!viewAll && (
                <>
                    {/* Seletor de turma */}
                    <div className="dd-section" style={{ padding: 20 }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label className="dd-label">Selecione a Turma</label>
                                <SearchSelect
                                    options={turmas.map(t => ({ value: t.id, label: `${t.nome}${t.serie ? ` — ${t.serie.nome}` : ""}` }))}
                                    value={turmaId}
                                    onChange={v => { setTurmaId(v); setEditMode(false); }}
                                    placeholder="Escolha uma turma"
                                />
                            </div>
                            {turmaId && (
                                <div style={{ display: "flex", gap: 8 }}>
                                    {!editMode ? (
                                        <button className="dd-btn-primary" onClick={() => setEditMode(true)}>
                                            Editar Grade
                                        </button>
                                    ) : (
                                        <>
                                            <button className="dd-btn-primary" onClick={salvarGrade} disabled={salvando}>
                                                {salvando ? "Salvando..." : "Salvar Grade →"}
                                            </button>
                                            <button className="dd-btn-ghost" onClick={() => setEditMode(false)}>
                                                Cancelar
                                            </button>
                                        </>
                                    )}
                                    <button className="dd-btn-danger" onClick={limparGrade}>
                                        <Trash2 size={12} /> Limpar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {loading && (
                        <p style={{ color: "#9aaa9f", fontSize: 13, textAlign: "center", padding: 20 }}>
                            Carregando...
                        </p>
                    )}

                    {/* Grade de horários */}
                    {turmaId && !loading && (
                        <div className="dd-section">
                            <div className="dd-section-header">
                                <span className="dd-section-title">
                                    Grade — {turmas.find(t => String(t.id) === String(turmaId))?.nome || ""}
                                </span>
                                {!editMode && (
                                    <span className="dd-section-count">
                                        {horarios.length} aula(s) cadastrada(s)
                                    </span>
                                )}
                            </div>
                            {editMode && vinculosTurma.length === 0 && (
                                <div style={{ padding: "12px 20px", background: "#fdf8f0", borderBottom: "1px solid #eaeef2",
                                    fontSize: 12, color: "#7a5c2e", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>⚠</span>
                                    Nenhum professor vinculado a esta turma. Vincule professores primeiro na aba <b>Turmas → Gerenciar</b>.
                                </div>
                            )}
                            <div style={{ padding: 0, overflowX: "auto" }}>
                                <table style={{
                                    width: "100%", borderCollapse: "collapse", fontSize: 12,
                                    fontFamily: "'DM Sans', sans-serif"
                                }}>
                                    <thead>
                                    <tr>
                                        <th style={{
                                            padding: "10px 12px", background: "#f8faf8",
                                            borderBottom: "1px solid #eaeef2", fontSize: 10,
                                            fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase",
                                            color: "#9aaa9f", textAlign: "left", width: 80,
                                        }}>
                                            Horário
                                        </th>
                                        {DIAS.map(dia => (
                                            <th key={dia} style={{
                                                padding: "10px 12px", background: "#f8faf8",
                                                borderBottom: "1px solid #eaeef2", fontSize: 10,
                                                fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase",
                                                color: "#9aaa9f", textAlign: "center", minWidth: 140,
                                            }}>
                                                {DIAS_LABEL[dia]}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {horariosConfig.map((hr, idx) => {
                                        const ordem = idx + 1;
                                        return (
                                            <tr key={hr}>
                                                <td style={{
                                                    padding: "10px 12px", borderBottom: "1px solid #f2f5f2",
                                                    fontWeight: 500, color: "#5a7060", verticalAlign: "top",
                                                }}>
                                                    {editMode ? (
                                                        <input
                                                            value={hr}
                                                            onChange={e => {
                                                                const newConfig = [...horariosConfig];
                                                                newConfig[idx] = e.target.value;
                                                                setHorariosConfig(newConfig);
                                                            }}
                                                            style={{
                                                                width: 56, border: "1px solid #eaeef2", padding: "4px 6px",
                                                                fontSize: 12, fontFamily: "'DM Sans',sans-serif",
                                                                textAlign: "center", outline: "none", color: "#0d1f18",
                                                            }}
                                                        />
                                                    ) : hr}
                                                </td>
                                                {DIAS.map(dia => {
                                                    const slot = grid[dia]?.[ordem];
                                                    const isEditing = editingSlot?.dia === dia && editingSlot?.ordem === ordem;
                                                    const prof = professores.find(p => String(p.id) === String(slot?.professorId));
                                                    const mat = materias.find(m => String(m.id) === String(slot?.materiaId));

                                                    if (!editMode) {
                                                        // Modo visualização
                                                        return (
                                                            <td key={dia} style={{
                                                                padding: "8px 10px", borderBottom: "1px solid #f2f5f2",
                                                                textAlign: "center", fontSize: 12,
                                                                color: slot ? "#0d1f18" : "#d4ddd8",
                                                            }}>
                                                                {slot && prof && mat ? (
                                                                    <>
                                                                        <span style={{ fontWeight: 500 }}>{prof.nome?.split(" ")[0]}</span>
                                                                        <br />
                                                                        <span style={{ fontSize: 11, color: "#5a7060" }}>({mat.nome})</span>
                                                                    </>
                                                                ) : "—"}
                                                            </td>
                                                        );
                                                    }

                                                    // Modo edição
                                                    if (isEditing) {
                                                        // Professores vinculados à turma (únicos)
                                                        const profsVinculados = [];
                                                        const profsIds = new Set();
                                                        for (const v of vinculosTurma) {
                                                            const pid = v.professor?.id;
                                                            if (pid && !profsIds.has(pid)) {
                                                                profsIds.add(pid);
                                                                profsVinculados.push(v.professor);
                                                            }
                                                        }
                                                        // Matérias do professor selecionado nesta turma
                                                        const selectedProfId = slot?.professorId;
                                                        const matsDoProf = selectedProfId
                                                            ? vinculosTurma
                                                                .filter(v => String(v.professor?.id) === String(selectedProfId))
                                                                .map(v => v.materia)
                                                                .filter(Boolean)
                                                            : [];

                                                        return (
                                                            <td key={dia} style={{
                                                                padding: "6px 8px", borderBottom: "1px solid #f2f5f2",
                                                                background: "#f0f5f2", verticalAlign: "top",
                                                            }}>
                                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                                    <select
                                                                        value={slot?.professorId || ""}
                                                                        onChange={e => {
                                                                            const newProfId = e.target.value;
                                                                            setSlot(dia, ordem, "professorId", newProfId);
                                                                            // Auto-limpa matéria se professor mudou
                                                                            const matsValidas = vinculosTurma
                                                                                .filter(v => String(v.professor?.id) === String(newProfId))
                                                                                .map(v => String(v.materia?.id));
                                                                            if (!matsValidas.includes(String(slot?.materiaId))) {
                                                                                // Se só tem 1 matéria, auto-seleciona
                                                                                setSlot(dia, ordem, "materiaId", matsValidas.length === 1 ? matsValidas[0] : "");
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            fontSize: 11, padding: "4px 6px",
                                                                            border: "1px solid #d4ddd8",
                                                                            fontFamily: "'DM Sans',sans-serif",
                                                                            outline: "none", background: "#fff",
                                                                        }}
                                                                    >
                                                                        <option value="">Professor...</option>
                                                                        {profsVinculados.map(p => (
                                                                            <option key={p.id} value={p.id}>{p.nome}</option>
                                                                        ))}
                                                                    </select>
                                                                    <select
                                                                        value={slot?.materiaId || ""}
                                                                        onChange={e => setSlot(dia, ordem, "materiaId", e.target.value)}
                                                                        disabled={!selectedProfId}
                                                                        style={{
                                                                            fontSize: 11, padding: "4px 6px",
                                                                            border: "1px solid #d4ddd8",
                                                                            fontFamily: "'DM Sans',sans-serif",
                                                                            outline: "none",
                                                                            background: selectedProfId ? "#fff" : "#f5f5f5",
                                                                            color: selectedProfId ? "#0d1f18" : "#b8c4be",
                                                                        }}
                                                                    >
                                                                        <option value="">{selectedProfId ? "Matéria..." : "Selecione professor primeiro"}</option>
                                                                        {matsDoProf.map(m => (
                                                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                                                                        <button
                                                                            onClick={() => setEditingSlot(null)}
                                                                            style={{
                                                                                fontSize: 10, padding: "3px 8px",
                                                                                background: "#0d1f18", color: "#fff",
                                                                                border: "none", cursor: "pointer",
                                                                                fontFamily: "'DM Sans',sans-serif",
                                                                            }}>
                                                                            OK
                                                                        </button>
                                                                        <button
                                                                            onClick={() => clearSlot(dia, ordem)}
                                                                            style={{
                                                                                fontSize: 10, padding: "3px 8px",
                                                                                background: "#fdf0f0", color: "#b94040",
                                                                                border: "none", cursor: "pointer",
                                                                                fontFamily: "'DM Sans',sans-serif",
                                                                            }}>
                                                                            Limpar
                                                                        </button>
                                                                    </div>
                                                                    {profsVinculados.length === 0 && (
                                                                        <p style={{ fontSize: 9, color: "#b94040", textAlign: "center", margin: 0 }}>
                                                                            Nenhum professor vinculado a esta turma
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    // Célula clicável no modo edição
                                                    return (
                                                        <td key={dia}
                                                            onClick={() => setEditingSlot({ dia, ordem })}
                                                            style={{
                                                                padding: "8px 10px", borderBottom: "1px solid #f2f5f2",
                                                                textAlign: "center", fontSize: 12,
                                                                cursor: "pointer",
                                                                color: slot?.professorId ? "#0d1f18" : "#b8c4be",
                                                                background: slot?.professorId ? "transparent" : "#fafcfa",
                                                                transition: "background .15s",
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "#f0f5f2"}
                                                            onMouseLeave={e => e.currentTarget.style.background = slot?.professorId ? "transparent" : "#fafcfa"}
                                                        >
                                                            {slot?.professorId && prof && mat ? (
                                                                <>
                                                                    <span style={{ fontWeight: 500 }}>{prof.nome?.split(" ")[0]}</span>
                                                                    <br />
                                                                    <span style={{ fontSize: 11, color: "#5a7060" }}>({mat.nome})</span>
                                                                </>
                                                            ) : (
                                                                <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>

                                {/* Botão adicionar mais linhas de horário */}
                                {editMode && (
                                    <div style={{ padding: "12px 20px", borderTop: "1px solid #eaeef2", display: "flex", gap: 8 }}>
                                        <button
                                            className="dd-btn-ghost"
                                            onClick={() => setHorariosConfig(prev => [...prev, ""])}
                                            style={{ fontSize: 11 }}>
                                            + Adicionar Horário
                                        </button>
                                        {horariosConfig.length > 1 && (
                                            <button
                                                className="dd-btn-danger"
                                                onClick={() => setHorariosConfig(prev => prev.slice(0, -1))}
                                                style={{ fontSize: 11 }}>
                                                Remover Último
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}