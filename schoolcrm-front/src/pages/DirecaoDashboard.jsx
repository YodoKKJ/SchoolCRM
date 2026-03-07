import { useState, useEffect, useRef, Component } from "react";
import axios from "axios";
import { BoletimImpresso } from "./BoletimPDF";
import {
    Home, Users, School, BookOpen, LogOut,
    GraduationCap, UserCheck, LayoutGrid, BookMarked, Menu,
    Trash2, Pencil, ArrowLeft, UserPlus, ChevronDown, Search, X,
    FileText, DollarSign, Lock, ClipboardList, ChevronRight, Clock, CalendarDays,
    TrendingUp, TrendingDown, ArrowLeftRight, Settings, BarChart2, Briefcase,
    Receipt, Building2, CheckCircle2, AlertCircle, Ban, Wallet, CreditCard
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const api = axios.create({ baseURL: "" });

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
            { id: "fin-dashboard",     label: "Dashboard",       icon: BarChart2 },
            { id: "fin-pessoas",       label: "Pessoas",          icon: Building2 },
            { id: "fin-funcionarios",  label: "Funcionários",     icon: Briefcase },
            { id: "fin-contratos",     label: "Contratos / CR",   icon: Receipt },
            { id: "fin-pagar",         label: "Contas a Pagar",   icon: TrendingDown },
            { id: "fin-movimentacoes", label: "Movimentações",    icon: ArrowLeftRight },
            { id: "fin-config",        label: "Configurações",    icon: Settings },
        ]
    },
    {
        id: "relatorios",
        label: "Relatórios",
        items: [
            { id: "relatorios", label: "Relatórios", icon: FileText },
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
@media print {
  body > * { display:none !important; }
  .print-section { display:block !important; position:fixed; inset:0; background:white; z-index:9999; padding:24px; }
  .print-section .dd-btn-edit { display:none; }
}

/* ── Responsivo ─────────────────────────────────────────────── */
.dd-hamburger { display:none; background:none; border:none; cursor:pointer; padding:4px; align-items:center; justify-content:center; }
.dd-cards-grid { display:grid; gap:12px; grid-template-columns:repeat(4,1fr); }
.dd-table-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }

@media (max-width: 767px) {
  .dd-sidebar {
    position: fixed !important;
    top: 0; left: 0; bottom: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform .25s ease;
    width: 210px !important;
  }
  .dd-sidebar.open { transform: translateX(0); }
  .dd-hamburger { display: flex !important; }
  .dd-header { padding: 14px 16px !important; }
  .dd-main { padding: 16px !important; }
  .dd-cards-grid { grid-template-columns: 1fr 1fr !important; }
  .dd-modal { max-width: 100% !important; padding: 20px !important; }
  .dd-search-wrap { flex-direction: column; align-items: stretch; }
  .dd-table-wrap { overflow-x: auto; }
  .dd-section { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .dd-table { min-width: 480px; }
}
@media (max-width: 479px) {
  .dd-cards-grid { grid-template-columns: 1fr !important; }
}
`;

// ---- RELATÓRIOS ----
function calcSituacao(disciplinas, freqGeral) {
    if (!disciplinas || disciplinas.length === 0) return "Cursando";
    if (disciplinas.some(d => d.mediaAnual == null)) return "Cursando";
    if ((freqGeral != null && Number(freqGeral) < 75) || disciplinas.some(d => Number(d.mediaAnual) < 6)) return "Reprovado";
    return "Aprovado";
}

function Relatorios({ anoLetivo }) {
    const [turmas, setTurmas] = useState([]);
    const [turmaSel, setTurmaSel] = useState(null);
    const [bimestreSel, setBimestreSel] = useState("0");
    const [tipoRel, setTipoRel] = useState("medias");
    const [relatorio, setRelatorio] = useState(null);
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        api.get("/turmas/buscar").then(r =>
            setTurmas(Array.isArray(r.data) ? r.data.filter(t => t.anoLetivo === anoLetivo) : [])
        );
    }, [anoLetivo]);

    const gerarRelatorio = async () => {
        if (!turmaSel) return;
        setCarregando(true);
        setRelatorio(null);
        try {
            const vincR = await api.get(`/vinculos/aluno-turma/turma/${turmaSel.id}`);
            const vinculos = Array.isArray(vincR.data) ? vincR.data : [];
            const boletins = await Promise.all(
                vinculos.map(v =>
                    api.get(`/notas/boletim/${v.aluno.id}/${turmaSel.id}`)
                        .then(r => r.data).catch(() => null)
                )
            );
            setRelatorio(boletins.filter(Boolean).sort((a, b) =>
                (a.aluno?.nome ?? "").localeCompare(b.aluno?.nome ?? "")
            ));
        } catch { alert("Erro ao gerar relatório."); }
        finally { setCarregando(false); }
    };

    const materias = relatorio
        ? [...new Map(relatorio.flatMap(b =>
            (b.disciplinas || []).map(d => [d.materiaId, d.materiaNome])
          )).entries()].map(([id, nome]) => ({ id, nome }))
        : [];

    const getMedia = (disciplinas, materiaId) => {
        const disc = disciplinas?.find(d => d.materiaId === materiaId);
        if (!disc) return null;
        const bim = Number(bimestreSel);
        if (bim === 0) return disc.mediaAnual != null ? Number(disc.mediaAnual) : null;
        const bimData = disc.bimestres?.[bim];
        return bimData?.media != null ? Number(bimData.media) : null;
    };

    const getFreq = (disciplinas, materiaId) => {
        const disc = disciplinas?.find(d => d.materiaId === materiaId);
        return disc?.frequenciaMateria ?? null;
    };

    const mediaClr = v => v === null ? "#aaa" : v < 6 ? "#b94040" : v < 7 ? "#c47a00" : "#2d6a4f";
    const freqClr  = v => v === null ? "#aaa" : v < 75 ? "#b94040" : "#2d6a4f";
    const sitClr   = s => s === "Aprovado" ? "#2d6a4f" : s === "Reprovado" ? "#b94040" : "#888";

    const tituloRel = tipoRel === "medias" ? "Médias"
        : tipoRel === "frequencia" ? "Frequência"
        : "Situação Final";

    // Contadores para situação final
    const contadores = relatorio && tipoRel === "situacao" ? relatorio.reduce((acc, b) => {
        const sit = calcSituacao(b.disciplinas, b.frequenciaGeral);
        acc[sit] = (acc[sit] || 0) + 1;
        return acc;
    }, {}) : null;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div className="dd-section" style={{ padding:24 }}>
                <p className="dd-section-title" style={{ marginBottom:20 }}>Gerar Relatório</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:16, alignItems:"flex-end" }}>
                    <div>
                        <label className="dd-label">Turma ({anoLetivo})</label>
                        <SearchSelect
                            options={turmas.map(t => ({ value: String(t.id), label: t.nome }))}
                            value={turmaSel ? String(turmaSel.id) : ""}
                            onChange={v => { setTurmaSel(turmas.find(t => String(t.id) === v) || null); setRelatorio(null); }}
                            placeholder="Selecione a turma..." />
                    </div>
                    <div>
                        <label className="dd-label">Tipo</label>
                        <SearchSelect
                            options={[
                                { value: "medias",    label: "Médias por matéria" },
                                { value: "frequencia", label: "Frequência" },
                                { value: "situacao",  label: "Situação Final" },
                            ]}
                            value={tipoRel}
                            onChange={v => { setTipoRel(v); setRelatorio(null); }}
                            placeholder="" />
                    </div>
                    <div>
                        <label className="dd-label">Período</label>
                        <SearchSelect
                            options={[
                                { value: "0", label: "Ano completo" },
                                { value: "1", label: "1º Bimestre" },
                                { value: "2", label: "2º Bimestre" },
                                { value: "3", label: "3º Bimestre" },
                                { value: "4", label: "4º Bimestre" },
                            ]}
                            value={bimestreSel}
                            onChange={v => { setBimestreSel(v); setRelatorio(null); }}
                            placeholder=""
                            disabled={tipoRel === "situacao"} />
                    </div>
                    <button className="dd-btn-primary" onClick={gerarRelatorio}
                            disabled={!turmaSel || carregando} style={{ height:40, alignSelf:"flex-end" }}>
                        {carregando ? "Gerando..." : "Gerar →"}
                    </button>
                </div>
            </div>

            {relatorio && (
                <div className="dd-section print-section">
                    <div className="dd-section-header">
                        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                            <span className="dd-section-title">
                                {tituloRel} — {turmaSel.nome}
                                {tipoRel === "medias" && ` — ${bimestreSel === "0" ? "Ano completo" : `${bimestreSel}º Bimestre`}`}
                            </span>
                            <span className="dd-section-count">{relatorio.length} alunos</span>
                        </div>
                        <button className="dd-btn-edit" onClick={() => window.print()}>Imprimir / PDF</button>
                    </div>

                    {/* ── Cartões de resumo (situação final) ── */}
                    {tipoRel === "situacao" && contadores && (
                        <div style={{ display:"flex", gap:12, padding:"12px 20px", borderBottom:"1px solid #eaeef2" }}>
                            {[["Aprovado","#2d6a4f","#f0f5f2"],["Reprovado","#b94040","#fdf0f0"],["Cursando","#888","#f5f5f5"]].map(([sit, cor, bg]) => (
                                contadores[sit] > 0 && (
                                    <div key={sit} style={{ background:bg, border:`1px solid ${cor}22`, padding:"8px 18px", display:"flex", flexDirection:"column", alignItems:"center" }}>
                                        <span style={{ fontSize:22, fontWeight:700, color:cor }}>{contadores[sit]}</span>
                                        <span style={{ fontSize:10, letterSpacing:".08em", textTransform:"uppercase", color:cor }}>{sit}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    )}

                    <div style={{ overflowX:"auto" }}>
                        <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign:"left" }}>Aluno</th>
                                    {tipoRel === "situacao" ? (
                                        <>
                                            <th style={{ textAlign:"center" }}>Situação</th>
                                            <th style={{ textAlign:"center" }}>Freq. Geral</th>
                                            <th style={{ textAlign:"left" }}>Matérias em risco / reprovadas</th>
                                        </>
                                    ) : (
                                        <>
                                            {materias.map(m => <th key={m.id} style={{ textAlign:"center" }}>{m.nome}</th>)}
                                            <th style={{ textAlign:"center" }}>{tipoRel === "medias" ? "Média Geral" : "Freq. Geral"}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {relatorio.map(b => {
                                    const discs = b.disciplinas || [];

                                    if (tipoRel === "situacao") {
                                        const sit = calcSituacao(discs, b.frequenciaGeral);
                                        const reprovadas = discs.filter(d => d.mediaAnual != null && Number(d.mediaAnual) < 6).map(d => d.materiaNome);
                                        const emRisco    = discs.filter(d => d.mediaAnual != null && Number(d.mediaAnual) >= 6 && Number(d.mediaAnual) < 7).map(d => d.materiaNome);
                                        const faltaFreq  = b.frequenciaGeral != null && Number(b.frequenciaGeral) < 75;
                                        const problemas  = [
                                            ...reprovadas.map(n => `${n} (nota)`),
                                            ...(faltaFreq ? ["Frequência insuficiente"] : []),
                                            ...(sit === "Cursando" ? [] : emRisco.map(n => `${n} (em risco)`)),
                                        ];
                                        return (
                                            <tr key={b.aluno?.id}>
                                                <td style={{ fontWeight:500 }}>{b.aluno?.nome ?? "—"}</td>
                                                <td style={{ textAlign:"center", fontWeight:700, color:sitClr(sit) }}>{sit}</td>
                                                <td style={{ textAlign:"center", fontWeight:600, color:freqClr(b.frequenciaGeral) }}>
                                                    {b.frequenciaGeral != null ? `${Number(b.frequenciaGeral).toFixed(1)}%` : "—"}
                                                </td>
                                                <td style={{ fontSize:12, color:"#5a7060" }}>
                                                    {problemas.length > 0 ? problemas.join(", ") : (sit === "Aprovado" ? "—" : "—")}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const geral = tipoRel === "medias"
                                        ? (() => {
                                            const vals = materias.map(m => getMedia(discs, m.id)).filter(v => v !== null);
                                            return vals.length > 0 ? (vals.reduce((a, c) => a + c, 0) / vals.length).toFixed(1) : null;
                                          })()
                                        : b.frequenciaGeral;
                                    return (
                                        <tr key={b.aluno?.id}>
                                            <td style={{ fontWeight:500 }}>{b.aluno?.nome ?? "—"}</td>
                                            {materias.map(m => {
                                                const val = tipoRel === "medias" ? getMedia(discs, m.id) : getFreq(discs, m.id);
                                                return (
                                                    <td key={m.id} style={{ textAlign:"center", fontWeight:600,
                                                        color: tipoRel === "medias" ? mediaClr(val) : freqClr(val) }}>
                                                        {val !== null ? (tipoRel === "medias" ? val.toFixed(1) : `${val}%`) : "—"}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ textAlign:"center", fontWeight:700,
                                                color: tipoRel === "medias" ? mediaClr(geral !== null ? Number(geral) : null) : freqClr(geral) }}>
                                                {geral !== null ? (tipoRel === "medias" ? geral : `${Number(geral).toFixed(1)}%`) : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

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

    const anoAtual = new Date().getFullYear();
    const [anoLetivo, setAnoLetivo] = useState(anoAtual);
    const [anosDisponiveis, setAnosDisponiveis] = useState([anoAtual + 1, anoAtual]);
    useEffect(() => {
        api.get("/turmas").then(r => {
            const anosExistentes = (r.data || []).map(t => t.anoLetivo).filter(Boolean);
            const todos = [...new Set([anoAtual + 1, anoAtual, ...anosExistentes])].sort((a, b) => b - a);
            setAnosDisponiveis(todos);
        }).catch(() => {});
    }, []);

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
                <aside className={`dd-sidebar${sidebarAberta ? " open" : ""}`} style={{
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

                    {/* ano letivo */}
                    <div style={{ padding:"10px 20px 14px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
                        <p style={{ fontSize:9, color:"rgba(255,255,255,.3)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:6 }}>Ano Letivo</p>
                        <select value={anoLetivo} onChange={e => setAnoLetivo(Number(e.target.value))}
                                style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.12)", color:"#7ec8a0", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, padding:"6px 10px", cursor:"pointer", outline:"none" }}>
                            {anosDisponiveis.map(ano => <option key={ano} value={ano} style={{ background:"#1a2e23", color:"#7ec8a0" }}>{ano}</option>)}
                        </select>
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
                            <button className="dd-hamburger" onClick={() => setSidebarAberta(true)}>
                                <Menu size={20} color="#0d1f18" />
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

                    <main className="dd-main" style={{ flex:1, padding:"28px 32px", display:"flex", flexDirection:"column", gap:0 }}>
                        {aba === "inicio" && <ErrorBoundary key={`inicio-${anoLetivo}`}><Inicio anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "usuarios" && <ErrorBoundary key="usuarios"><Usuarios /></ErrorBoundary>}
                        {aba === "turmas" && <ErrorBoundary key={`turmas-${anoLetivo}`}><Turmas anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "materias" && <ErrorBoundary key="materias"><Materias /></ErrorBoundary>}
                        {aba === "horarios" && <ErrorBoundary key={`horarios-${anoLetivo}`}><Horarios anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "atrasos" && <ErrorBoundary key="atrasos"><Atrasos /></ErrorBoundary>}
                        {aba === "lancamentos" && <ErrorBoundary key={`lancamentos-${anoLetivo}`}><Lancamentos anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "boletins" && <ErrorBoundary key={`boletins-${anoLetivo}`}><Boletins anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "relatorios" && <ErrorBoundary key={`relatorios-${anoLetivo}`}><Relatorios anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "fin-dashboard"    && <ErrorBoundary key="fin-dashboard"><FinDashboard /></ErrorBoundary>}
                        {aba === "fin-pessoas"      && <ErrorBoundary key="fin-pessoas"><FinPessoas /></ErrorBoundary>}
                        {aba === "fin-funcionarios" && <ErrorBoundary key="fin-funcionarios"><FinFuncionarios /></ErrorBoundary>}
                        {aba === "fin-contratos"    && <ErrorBoundary key="fin-contratos"><FinContratos anoLetivo={anoLetivo} /></ErrorBoundary>}
                        {aba === "fin-pagar"        && <ErrorBoundary key="fin-pagar"><FinContasPagar /></ErrorBoundary>}
                        {aba === "fin-movimentacoes" && <ErrorBoundary key="fin-movimentacoes"><FinMovimentacoes /></ErrorBoundary>}
                        {aba === "fin-config"       && <ErrorBoundary key="fin-config"><FinConfiguracoes anoLetivo={anoLetivo} /></ErrorBoundary>}
                    </main>
                </div>
            </div>
        </>
    );
}

// ---- INÍCIO ----
function Inicio({ anoLetivo }) {
    const [stats, setStats] = useState({ alunos: 0, professores: 0, turmas: 0, materias: 0 });
    const [alunosDoAno, setAlunosDoAno] = useState([]);

    useEffect(() => {
        Promise.all([
            api.get("/usuarios"),
            api.get("/turmas"),
            api.get("/materias"),
            api.get(`/vinculos/aluno-turma/ocupados-no-ano/${anoLetivo}`),
        ]).then(([u, t, m, a]) => {
            const listaUsuarios = u.data || [];
            const turmasDoAno = (t.data || []).filter(x => x.anoLetivo === anoLetivo);
            setAlunosDoAno(listaUsuarios.filter(u => (a.data || []).includes(u.id)));
            setStats({
                alunos: (a.data || []).length,
                professores: listaUsuarios.filter(x => x.role === "PROFESSOR").length,
                turmas: turmasDoAno.length,
                materias: (m.data || []).length,
            });
        }).catch(() => {});
    }, [anoLetivo]);

    const cards = [
        { label: "Alunos", sublabel: `em ${anoLetivo}`, value: stats.alunos, accent: "#0d1f18" },
        { label: "Professores", sublabel: "total", value: stats.professores, accent: "#2d6a4f" },
        { label: "Turmas", sublabel: `em ${anoLetivo}`, value: stats.turmas, accent: "#7ec8a0" },
        { label: "Matérias", sublabel: "total", value: stats.materias, accent: "#b7dfc8" },
    ];

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <div className="dd-cards-grid" style={{ gap:16 }}>
                {cards.map(card => (
                    <div key={card.label} className="dd-card" style={{ "--accent": card.accent, padding:"20px 20px 18px" }}>
                        <p className="dd-card-num">{card.value}</p>
                        <p className="dd-card-label">{card.label}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginTop:2, letterSpacing:".04em" }}>{card.sublabel}</p>
                    </div>
                ))}
            </div>

            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Alunos matriculados em {anoLetivo}</span>
                    <span className="dd-section-count">{alunosDoAno.length} alunos</span>
                </div>
                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                    <tr>{["Nome", "Login"].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                    {alunosDoAno.slice(0, 8).map(u => (
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
                        </tr>
                    ))}
                    {alunosDoAno.length === 0 && (
                        <tr><td colSpan={2} style={{ textAlign:"center", color:"#9aaa9f", padding:20 }}>Nenhum aluno matriculado em {anoLetivo}</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---- USUÁRIOS ----
function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [idsComVinculos, setIdsComVinculos] = useState(new Set());
    const [form, setForm] = useState({ nome: "", login: "", senha: "", role: "ALUNO", dataNascimento: "", nomePai: "", nomeMae: "" });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [editando, setEditando] = useState(null);
    const [formEdit, setFormEdit] = useState({ nome: "", login: "", senha: "", dataNascimento: "", nomePai: "", nomeMae: "" });
    const [msgEdit, setMsgEdit] = useState({ texto: "", tipo: "" });
    const [campoBusca, setCampoBusca] = useState("nome");
    const [termoBusca, setTermoBusca] = useState("");
    const termoDebounced = useDebounce(termoBusca);
    const [historicoAluno, setHistoricoAluno] = useState(null);
    const [historico, setHistorico] = useState([]);

    const carregarVinculos = () => {
        api.get("/usuarios/com-vinculos").then(r => {
            setIdsComVinculos(new Set(Array.isArray(r.data) ? r.data : []));
        }).catch(() => {});
    };

    const carregar = (nome, role) => {
        const params = {};
        if (nome) params.nome = nome;
        if (role) params.role = role;
        api.get("/usuarios/buscar", { params }).then(r => {
            setUsuarios(Array.isArray(r.data) ? r.data : []);
        });
        carregarVinculos();
    };

    useEffect(() => {
        carregarVinculos();
    }, []);

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
            setForm({ nome: "", login: "", senha: "", role: "ALUNO", dataNascimento: "", nomePai: "", nomeMae: "" });
            carregar();
        } catch { setMsg({ texto: "Erro ao cadastrar. Login já existe?", tipo: "erro" }); }
    };

    const abrirEdicao = (u) => {
        setEditando(u);
        setFormEdit({
            nome: u.nome, login: u.login, senha: "",
            dataNascimento: u.dataNascimento || "",
            nomePai: u.nomePai || "",
            nomeMae: u.nomeMae || "",
        });
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

    const excluirUsuario = async (u) => {
        if (!confirm(`Excluir permanentemente o usuário "${u.nome}"?`)) return;
        try {
            await api.delete(`/usuarios/${u.id}`);
            carregar();
        } catch (err) {
            const raw = err.response?.data;
            alert(typeof raw === "string" ? raw : "Erro ao excluir.");
        }
    };

    const verHistorico = async (u) => {
        setHistoricoAluno(u);
        setHistorico([]);
        try {
            const r = await api.get(`/vinculos/aluno-turma/historico/${u.id}`);
            setHistorico(Array.isArray(r.data) ? r.data : []);
        } catch { setHistorico([]); }
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

                            {editando?.role === "ALUNO" && (<>
                                <div style={{ borderTop:"1px solid #eef0ec", paddingTop:16 }}>
                                    <p className="dd-label" style={{ marginBottom:12, color:"#6b7a8d" }}>Dados do aluno</p>
                                    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                                        <div>
                                            <label className="dd-label">Data de Nascimento</label>
                                            <div className="dd-input-wrap">
                                                <input className="dd-input" type="date" value={formEdit.dataNascimento}
                                                       onChange={e => setFormEdit({ ...formEdit, dataNascimento: e.target.value })} />
                                                <div className="dd-input-line" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="dd-label">Nome do Pai</label>
                                            <div className="dd-input-wrap">
                                                <input className="dd-input" type="text" placeholder="Nome do pai"
                                                       value={formEdit.nomePai}
                                                       onChange={e => setFormEdit({ ...formEdit, nomePai: e.target.value })} />
                                                <div className="dd-input-line" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="dd-label">Nome da Mãe</label>
                                            <div className="dd-input-wrap">
                                                <input className="dd-input" type="text" placeholder="Nome da mãe"
                                                       value={formEdit.nomeMae}
                                                       onChange={e => setFormEdit({ ...formEdit, nomeMae: e.target.value })} />
                                                <div className="dd-input-line" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>)}

                            {msgEdit.texto && <div className={msgEdit.tipo === "ok" ? "dd-ok" : "dd-err"}>{msgEdit.texto}</div>}

                            <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                <button type="button" onClick={() => setEditando(null)} className="dd-btn-ghost" style={{ flex:1 }}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" style={{ flex:1 }}>Salvar →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal histórico do aluno */}
            {historicoAluno && (
                <div className="dd-modal-overlay">
                    <div className="dd-modal" style={{ maxWidth:480 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                                <p className="dd-modal-title">Histórico de Turmas</p>
                                <p className="dd-modal-sub">{historicoAluno.nome}</p>
                            </div>
                            <button onClick={() => setHistoricoAluno(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f", padding:4 }}>
                                <X size={16} />
                            </button>
                        </div>

                        {historico.length === 0 ? (
                            <p style={{ color:"#9aaa9f", fontSize:13, textAlign:"center", padding:"24px 0" }}>Nenhuma turma encontrada.</p>
                        ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                {historico.map((v, i) => (
                                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#f8fafb", borderRadius:6, border:"1px solid #eef0ec" }}>
                                        <div style={{ width:36, height:36, background:"#0d1f18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#7ec8a0", flexShrink:0 }}>
                                            {v.turma?.anoLetivo ?? "—"}
                                        </div>
                                        <div>
                                            <p style={{ fontSize:13, fontWeight:600, color:"#1a2332", margin:0 }}>{v.turma?.nome ?? "—"}</p>
                                            <p style={{ fontSize:11, color:"#9aaa9f", margin:0 }}>{v.turma?.serie?.nome ?? ""}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={() => setHistoricoAluno(null)} className="dd-btn-ghost" style={{ width:"100%", marginTop:20 }}>Fechar</button>
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
                    {form.role === "ALUNO" && (<>
                        <div>
                            <label className="dd-label">Data de Nascimento</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" type="date" value={form.dataNascimento}
                                       onChange={e => setForm({ ...form, dataNascimento: e.target.value })} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                        <div>
                            <label className="dd-label">Nome do Pai</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" type="text" placeholder="Nome do pai"
                                       value={form.nomePai} onChange={e => setForm({ ...form, nomePai: e.target.value })} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                        <div>
                            <label className="dd-label">Nome da Mãe</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" type="text" placeholder="Nome da mãe"
                                       value={form.nomeMae} onChange={e => setForm({ ...form, nomeMae: e.target.value })} />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                    </>)}
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
                                        {u.role === "ALUNO" && (
                                            <button className="dd-btn-edit" onClick={() => verHistorico(u)}>Histórico</button>
                                        )}
                                        <button className="dd-btn-edit" onClick={() => abrirEdicao(u)}>Editar</button>
                                        {idsComVinculos.has(u.id) ? (
                                            <button className={u.ativo ? "dd-btn-toggle-on" : "dd-btn-toggle-off"} onClick={() => toggleStatus(u)}>
                                                {u.ativo ? "Inativar" : "Ativar"}
                                            </button>
                                        ) : (
                                            <button className="dd-btn-danger" onClick={() => excluirUsuario(u)}>
                                                <Trash2 size={12} />
                                            </button>
                                        )}
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
function Turmas({ anoLetivo }) {
    const [turmas, setTurmas] = useState([]);
    const [series, setSeries] = useState([]);
    const [formTurma, setFormTurma] = useState({ nome: "", serieId: "", anoLetivo: String(anoLetivo) });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [turmaSelecionada, setTurmaSelecionada] = useState(null);
    const [turmaParaPromover, setTurmaParaPromover] = useState(null);
    const [promovendo, setPromovendo] = useState(false);
    const [resultadoPromocao, setResultadoPromocao] = useState(null);
    const [alunosPromocao, setAlunosPromocao] = useState([]);
    const [carregandoPromocao, setCarregandoPromocao] = useState(false);
    const [serieDestinoId, setSerieDestinoId] = useState("");
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



    const excluirTurma = async (t) => {
        if (!confirm(`Excluir turma "${t.nome}"?`)) return;
        try { await api.delete(`/turmas/${t.id}`); carregar(); }
        catch { setMsg({ texto: "Erro ao excluir. Há vínculos ativos nessa turma?", tipo: "erro" }); }
    };

    const sortSeries = (a, b) => {
        const parse = nome => {
            const m = nome.match(/^(\d+)[º°o]?\s*(EF|EM)/i);
            if (!m) return { tipo: "ZZ", num: 999 };
            return { tipo: m[2].toUpperCase(), num: parseInt(m[1]) };
        };
        const pa = parse(a.nome), pb = parse(b.nome);
        if (pa.tipo !== pb.tipo) return pa.tipo.localeCompare(pb.tipo);
        return pa.num - pb.num;
    };

    const abrirModalPromocao = async (turma) => {
        setTurmaParaPromover(turma);
        setResultadoPromocao(null);
        setAlunosPromocao([]);
        setCarregandoPromocao(true);
        const seriesOrdenadas = [...series].sort(sortSeries);
        const idxAtual = seriesOrdenadas.findIndex(s => s.id === turma.serie.id);
        const proxSerie = seriesOrdenadas[idxAtual + 1] || seriesOrdenadas[idxAtual];
        setSerieDestinoId(String(proxSerie?.id || ""));
        try {
            const vincR = await api.get(`/vinculos/aluno-turma/turma/${turma.id}`);
            const vinculos = Array.isArray(vincR.data) ? vincR.data : [];
            const lista = await Promise.all(
                vinculos.map(async v => {
                    try {
                        const bolR = await api.get(`/notas/boletim/${v.aluno.id}/${turma.id}`);
                        const disc = bolR.data?.disciplinas || [];
                        const vals = disc.filter(d => d.mediaAnual != null).map(d => Number(d.mediaAnual));
                        const mediaGeral = vals.length > 0 ? vals.reduce((a, c) => a + c, 0) / vals.length : null;
                        return { aluno: v.aluno, mediaGeral, selecionado: true };
                    } catch {
                        return { aluno: v.aluno, mediaGeral: null, selecionado: true };
                    }
                })
            );
            setAlunosPromocao(lista.sort((a, b) => (a.aluno.nome || "").localeCompare(b.aluno.nome || "")));
        } catch {
            alert("Erro ao carregar alunos da turma.");
            setTurmaParaPromover(null);
        } finally {
            setCarregandoPromocao(false);
        }
    };

    const promoverTurma = async () => {
        if (!turmaParaPromover || !serieDestinoId) return;
        const selecionados = alunosPromocao.filter(a => a.selecionado);
        setPromovendo(true);
        try {
            const novoAno = turmaParaPromover.anoLetivo + 1;
            const r = await api.post("/turmas", {
                nome: turmaParaPromover.nome,
                serieId: serieDestinoId,
                anoLetivo: String(novoAno),
            });
            const novaTurma = r.data;
            let matriculados = 0, jaMatriculados = 0;
            if (selecionados.length > 0) {
                const resultados = await Promise.all(
                    selecionados.map(async ({ aluno }) => {
                        try {
                            await api.post("/vinculos/aluno-turma", {
                                alunoId: String(aluno.id),
                                turmaId: String(novaTurma.id),
                            });
                            return "ok";
                        } catch (e) {
                            return e.response?.status === 409 ? "conflict" : "error";
                        }
                    })
                );
                matriculados = resultados.filter(r => r === "ok").length;
                jaMatriculados = resultados.filter(r => r === "conflict").length;
            }
            setResultadoPromocao({ criada: novaTurma, matriculados, jaMatriculados });
            carregar();
        } catch (e) {
            const raw = e.response?.data;
            alert(typeof raw === "string" ? raw : "Erro ao promover turma.");
            setTurmaParaPromover(null);
        } finally {
            setPromovendo(false);
        }
    };

    if (turmaSelecionada) {
        return <EditarTurma turma={turmaSelecionada} onVoltar={() => { setTurmaSelecionada(null); carregar(); }} />;
    }

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            {/* Modal: promoção de turma */}
            {turmaParaPromover && !resultadoPromocao && (
                <div className="dd-modal-overlay">
                    <div className="dd-modal" style={{ maxWidth:560, width:"100%" }}>
                        {/* Cabeçalho */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                                <p className="dd-modal-title">Promover Turma</p>
                                <p className="dd-modal-sub">{turmaParaPromover.nome} · {turmaParaPromover.serie?.nome} · {turmaParaPromover.anoLetivo} → {turmaParaPromover.anoLetivo + 1}</p>
                            </div>
                            <button onClick={() => setTurmaParaPromover(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f", padding:4 }}><X size={16} /></button>
                        </div>

                        {/* Série destino */}
                        <div style={{ marginBottom:20 }}>
                            <label className="dd-label">Série de destino</label>
                            <select value={serieDestinoId} onChange={e => setSerieDestinoId(e.target.value)}
                                    style={{ width:"100%", padding:"8px 12px", border:"1px solid #eaeef2", background:"#fff", fontSize:13, color:"#0d1f18", outline:"none", fontFamily:"'DM Sans',sans-serif" }}>
                                {[...series].sort(sortSeries).map(s => (
                                    <option key={s.id} value={String(s.id)}>{s.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lista de alunos */}
                        <div style={{ marginBottom:16 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                                <label className="dd-label" style={{ margin:0 }}>
                                    Alunos a matricular ({alunosPromocao.filter(a => a.selecionado).length}/{alunosPromocao.length})
                                </label>
                                {!carregandoPromocao && alunosPromocao.length > 0 && (
                                    <div style={{ display:"flex", gap:8 }}>
                                        <button className="dd-btn-ghost" style={{ padding:"4px 10px", fontSize:11 }}
                                                onClick={() => setAlunosPromocao(p => p.map(a => ({ ...a, selecionado: true })))}>
                                            Todos
                                        </button>
                                        <button className="dd-btn-ghost" style={{ padding:"4px 10px", fontSize:11 }}
                                                onClick={() => setAlunosPromocao(p => p.map(a => ({ ...a, selecionado: false })))}>
                                            Nenhum
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ border:"1px solid #eaeef2", maxHeight:260, overflowY:"auto" }}>
                                {carregandoPromocao ? (
                                    <div style={{ padding:"24px", textAlign:"center", color:"#9aaa9f", fontSize:13 }}>Carregando alunos...</div>
                                ) : alunosPromocao.length === 0 ? (
                                    <div style={{ padding:"24px", textAlign:"center", color:"#9aaa9f", fontSize:13 }}>Nenhum aluno nesta turma.</div>
                                ) : alunosPromocao.map((a, i) => (
                                    <label key={a.aluno.id} style={{
                                        display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
                                        cursor:"pointer", borderBottom: i < alunosPromocao.length - 1 ? "1px solid #f2f5f2" : "none",
                                        background: a.selecionado ? "#fafcfa" : "#fff",
                                    }}>
                                        <input type="checkbox" checked={a.selecionado}
                                               onChange={() => setAlunosPromocao(p => p.map((x, j) => j === i ? { ...x, selecionado: !x.selecionado } : x))}
                                               style={{ width:14, height:14, accentColor:"#0d1f18", cursor:"pointer", flexShrink:0 }} />
                                        <span style={{ flex:1, fontSize:13, color:"#0d1f18", fontWeight:500 }}>{a.aluno.nome}</span>
                                        <span style={{ fontSize:12, color: a.mediaGeral === null ? "#9aaa9f" : a.mediaGeral < 6 ? "#b94040" : "#2d6a4f", fontWeight:600, minWidth:60, textAlign:"right" }}>
                                            {a.mediaGeral !== null ? `Média ${a.mediaGeral.toFixed(1)}` : "Sem notas"}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Ações */}
                        <div style={{ display:"flex", gap:8 }}>
                            <button onClick={() => setTurmaParaPromover(null)} className="dd-btn-ghost" style={{ flex:1 }}>Cancelar</button>
                            <button onClick={promoverTurma} className="dd-btn-primary" style={{ flex:1 }}
                                    disabled={promovendo || carregandoPromocao || !serieDestinoId}>
                                {promovendo ? "Promovendo..." : `Promover ${alunosPromocao.filter(a => a.selecionado).length} aluno(s) →`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: resultado da promoção */}
            {resultadoPromocao && (
                <div className="dd-modal-overlay">
                    <div className="dd-modal" style={{ maxWidth:400, textAlign:"center" }}>
                        <div style={{ width:48, height:48, background:"#f0f5f2", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                            <GraduationCap size={24} style={{ color:"#2d6a4f" }} />
                        </div>
                        <p className="dd-modal-title" style={{ marginBottom:8 }}>Turma promovida!</p>
                        <p style={{ color:"#6b7a8d", fontSize:13, marginBottom:20 }}>
                            Turma <strong>{resultadoPromocao.criada.nome}</strong> criada para {resultadoPromocao.criada.anoLetivo}.
                            <br/>{resultadoPromocao.matriculados} aluno(s) matriculado(s)
                            {resultadoPromocao.jaMatriculados > 0 && `, ${resultadoPromocao.jaMatriculados} já tinham turma em ${resultadoPromocao.criada.anoLetivo}`}.
                        </p>
                        <button className="dd-btn-primary" style={{ width:"100%" }}
                                onClick={() => { setResultadoPromocao(null); setTurmaParaPromover(null); }}>Fechar</button>
                    </div>
                </div>
            )}

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

            <div className="dd-section">
                <div className="dd-section-header" style={{ flexDirection:"column", alignItems:"stretch", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span className="dd-section-title">Turmas Cadastradas</span>
                        <span className="dd-section-count">{turmas.filter(t => t.anoLetivo === anoLetivo).length} turmas</span>
                    </div>
                    <BarraBusca campos={[{value:"nome",label:"Nome da Turma"},{value:"serie",label:"Série"}]}
                                campoBusca={campoBusca} setCampoBusca={setCampoBusca}
                                termoBusca={termoBusca} setTermoBusca={setTermoBusca} />
                </div>
                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Turma","Série","Ano",""].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                    {turmas.filter(t => t.anoLetivo === anoLetivo).map(t => (
                        <tr key={t.id}>
                            <td style={{ fontWeight:500 }}>{t.nome}</td>
                            <td><span className="dd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>{t.serie?.nome}</span></td>
                            <td style={{ color:"#9aaa9f" }}>{t.anoLetivo}</td>
                            <td style={{ textAlign:"right" }}>
                                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                    <button className="dd-btn-edit" onClick={() => abrirModalPromocao(t)}>
                                        Promover
                                    </button>
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
    const [alunosOcupados, setAlunosOcupados] = useState(new Set());
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
        if (turma.anoLetivo) {
            api.get(`/vinculos/aluno-turma/ocupados-no-ano/${turma.anoLetivo}`)
                .then(r => setAlunosOcupados(new Set(Array.isArray(r.data) ? r.data : [])))
                .catch(() => {});
        }
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
        } catch (err) {
            const raw = err.response?.data;
            setMsg({ texto: typeof raw === "string" ? raw : "Erro ao vincular.", tipo: "erro" });
        }
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
        .filter(a => !alunosOcupados.has(a.id))
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
function Lancamentos({ anoLetivo }) {
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
    const [notasComErro, setNotasComErro] = useState({});
    const [modalParticipantes, setModalParticipantes] = useState(null);
    const [participantesSel, setParticipantesSel] = useState(new Set());
    const [salvandoPart, setSalvandoPart] = useState(false);

    // ── presença
    const [dataAula, setDataAula] = useState(new Date().toISOString().slice(0,10));
    const [chamadaPorAula, setChamadaPorAula] = useState({}); // { ordemAula: { alunoId: bool } }
    const [aulasNoDia, setAulasNoDia] = useState([]);
    const [loadingAulas, setLoadingAulas] = useState(false);
    const [historicoPresenca, setHistoricoPresenca] = useState({});
    const [aulasColapsadas, setAulasColapsadas] = useState(new Set());
    const toggleAulaColapsada = (ordemAula) =>
        setAulasColapsadas(prev => {
            const next = new Set(prev);
            next.has(ordemAula) ? next.delete(ordemAula) : next.add(ordemAula);
            return next;
        });
    const DIAS_SEMANA = ["DOM","SEG","TER","QUA","QUI","SEX","SAB"];
    const DIAS_LABEL_PT = { SEG:"Segunda",TER:"Terça",QUA:"Quarta",QUI:"Quinta",SEX:"Sexta",SAB:"Sábado",DOM:"Domingo" };

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

    // Busca quantas aulas da matéria existem nesse dia da semana
    useEffect(() => {
        if (!turmaId || !materiaId || !dataAula) { setAulasNoDia([]); return; }
        const diaSemana = DIAS_SEMANA[new Date(dataAula + "T12:00").getDay()];
        setLoadingAulas(true);
        api.get(`/horarios/turma/${turmaId}/dia/${diaSemana}`)
            .then(r => {
                const filtradas = (r.data || []).filter(h => String(h.materiaId) === String(materiaId));
                setAulasNoDia(filtradas);
            })
            .catch(() => setAulasNoDia([]))
            .finally(() => setLoadingAulas(false));
    }, [turmaId, materiaId, dataAula]);

    // Preenche chamadaPorAula ao mudar aulasNoDia, historicoPresenca, dataAula ou alunos
    useEffect(() => {
        if (aulasNoDia.length === 0) { setChamadaPorAula({}); return; }
        const novaMap = {};
        aulasNoDia.forEach(aula => {
            const init = {};
            alunos.forEach(a => { init[a.id] = true; });
            (historicoPresenca[dataAula] || [])
                .filter(r => r.ordemAula === aula.ordemAula)
                .forEach(r => { init[r.alunoId] = r.presente; });
            novaMap[aula.ordemAula] = init;
        });
        setChamadaPorAula(novaMap);
    }, [aulasNoDia, historicoPresenca, dataAula, alunos]);

    // quando seleciona avaliação, preenche notas existentes
    const selecionarAvaliacao = (av) => {
        setAvaliacaoSel(av);
        setNotasComErro({});
        const init = {};
        av.notas.forEach(n => init[n.alunoId] = String(n.valor));
        setNotasEdit(init);
    };

    const abrirModalParticipantes = (av) => {
        setModalParticipantes(av);
        const ids = new Set((av.recuperacaoParticipantes || []).map(p => p.alunoId));
        setParticipantesSel(ids.size > 0 ? ids : new Set(alunos.map(a => a.id)));
    };

    const salvarParticipantes = async () => {
        if (!modalParticipantes) return;
        setSalvandoPart(true);
        try {
            await api.put(`/notas/avaliacao/${modalParticipantes.id}/participantes`, {
                alunoIds: [...participantesSel]
            });
            flash("Participantes salvos!");
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
            if (avaliacaoSel?.id === modalParticipantes.id) {
                const updated = (r.data || []).find(a => a.id === modalParticipantes.id);
                if (updated) selecionarAvaliacao(updated);
            }
            setModalParticipantes(null);
        } catch { flash("Erro ao salvar participantes.", "erro"); }
        setSalvandoPart(false);
    };

    const criarAvaliacao = async (e) => {
        e.preventDefault();
        try {
            const resp = await api.post("/notas/avaliacao", { turmaId: String(turmaId), materiaId: String(materiaId), ...formAv, bimestre: formAv.bimestre });
            const novaAv = resp.data;
            flash("Avaliação criada!");
            setCriandoAv(false);
            setFormAv({ tipo:"PROVA", descricao:"", peso:"1.0", bonificacao:false, bimestre:"1" });
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
            if (formAv.tipo === "RECUPERACAO") {
                const avCriada = (r.data || []).find(a => a.id === novaAv.id);
                if (avCriada) abrirModalParticipantes(avCriada);
            }
        } catch { flash("Erro ao criar avaliação.", "erro"); }
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
            flash(`Nota inválida — corrija antes de salvar: ${nomes}`, "erro");
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
        flash(erros > 0 ? `${erros} erro(s) ao salvar.` : "Chamada salva!", erros > 0 ? "erro" : "ok");
        const r = await api.get(`/presencas/turma/${turmaId}/materia/${materiaId}`);
        setHistoricoPresenca(r.data || {});
    };

    const tipoLabel = { PROVA:"Prova", TRABALHO:"Trabalho", SIMULADO:"Simulado (bônus)", RECUPERACAO:"Recuperação" };
    const tipoColor = { PROVA:{ bg:"#f0f5f2", color:"#2d6a4f" }, TRABALHO:{ bg:"#f5f3ee", color:"#7a5c2e" }, SIMULADO:{ bg:"#f0f0f8", color:"#4a4a8a" }, RECUPERACAO:{ bg:"#fff3e0", color:"#b45309" } };
    const alunosNaTabela = avaliacaoSel?.tipo === "RECUPERACAO"
        ? alunos.filter(a => (avaliacaoSel.recuperacaoParticipantes || []).some(p => p.alunoId === a.id))
        : alunos;

    // ── render seletor ──────────────────────────────────────────────────────
    const semSelecao = !turmaId || !materiaId;
    const diaSemana = dataAula ? DIAS_SEMANA[new Date(dataAula + "T12:00").getDay()] : null;
    const diaSemanaLabel = diaSemana ? (DIAS_LABEL_PT[diaSemana] || diaSemana) : "";
    const materiaNome = materias.find(m => String(m.id) === String(materiaId))?.nome || "";
    const bloqueado = !loadingAulas && aulasNoDia.length === 0;

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
                            {turmas.filter(t => t.anoLetivo === anoLetivo).map(t => <option key={t.id} value={t.id}>{t.nome} — {t.serie?.nome}</option>)}
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
                                        const isRec = av.tipo === "RECUPERACAO";
                                        return (
                                            <div key={av.id} onClick={() => selecionarAvaliacao(av)}
                                                 style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:16,
                                                     borderBottom:"1px solid #f2f5f2", cursor:"pointer",
                                                     background: ativa ? "#f8faf8" : "white",
                                                     borderLeft: ativa ? "3px solid #0d1f18" : "3px solid transparent" }}>
                                                <span className="dd-badge" style={{ background:tc.bg, color:tc.color, flexShrink:0 }}>
                                                    {tipoLabel[av.tipo] || av.tipo}
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
                                                        {isRec
                                                            ? "Substitui a média do bimestre se a nota for maior"
                                                            : `Peso ${av.peso} · ${av.dataAplicacao || "sem data"}${av.bonificacao ? " · ✦ Bônus" : ""}`
                                                        }
                                                    </p>
                                                </div>
                                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
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
                                        {avaliacaoSel.tipo === "RECUPERACAO"
                                            ? `Recuperação · ${avaliacaoSel.bimestre}º Bimestre · nota de 0 a 10`
                                            : avaliacaoSel.bonificacao
                                                ? "Bônus — valor entre 0.00 e 1.00, não entra no denominador da média"
                                                : `Peso ${avaliacaoSel.peso} — nota de 0 a 10`}
                                    </p>
                                </div>
                                <div style={{ display:"flex", gap:8 }}>
                                    {avaliacaoSel.tipo === "RECUPERACAO" && (
                                        <button className="dd-btn-ghost" style={{ fontSize:12 }}
                                                onClick={() => abrirModalParticipantes(avaliacaoSel)}>
                                            Editar Participantes
                                        </button>
                                    )}
                                    <button className="dd-btn-primary" onClick={salvarNotas} disabled={salvando}>
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
                                <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
                                    <thead>
                                    <tr>
                                        <th>Aluno</th>
                                        <th style={{ width:180 }}>Nota {avaliacaoSel.bonificacao ? "(0.00–1.00)" : "(0–10)"}</th>
                                        <th style={{ width:80 }}>Status</th>
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
                                                        onChange={e => {
                                                            setNotasEdit(prev => ({ ...prev, [aluno.id]: e.target.value }));
                                                            if (notasComErro[aluno.id]) setNotasComErro(p => { const n = {...p}; delete n[aluno.id]; return n; });
                                                        }}
                                                        placeholder="—"
                                                        className="dd-input"
                                                        style={{ width:120, padding:"6px 0", fontSize:15, fontFamily:"'Playfair Display',serif", fontWeight:700,
                                                            outline: temErro ? "2px solid #c0392b" : undefined,
                                                            borderRadius: temErro ? 2 : undefined }}
                                                    />
                                                </td>
                                                <td>
                                                    {temErro
                                                        ? <span className="dd-badge" style={{ background:"#fdf0f0", color:"#c0392b" }}>Inválida</span>
                                                        : temNota
                                                            ? <span className="dd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>Lançada</span>
                                                            : <span className="dd-badge" style={{ background:"#f5f3ee", color:"#7a5c2e" }}>Pendente</span>
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
                                <button className="dd-btn-ghost" disabled={bloqueado || loadingAulas}
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
                                <button className="dd-btn-primary" onClick={salvarChamada}
                                        disabled={salvando || bloqueado || loadingAulas}>
                                    {salvando ? "Salvando..." : "Salvar Chamada →"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loadingAulas && (
                        <div className="dd-section" style={{ padding:24, textAlign:"center", color:"#9aaa9f", fontSize:13 }}>
                            Verificando horários...
                        </div>
                    )}

                    {/* Sem aulas → bloqueado */}
                    {!loadingAulas && bloqueado && (
                        <div className="dd-section" style={{ padding:24, textAlign:"center" }}>
                            <span style={{ fontSize:13, color:"#b94040", fontWeight:500 }}>
                                Sem aulas de {materiaNome} na {diaSemanaLabel}. Chamada bloqueada.
                            </span>
                        </div>
                    )}

                    {/* Seção por período */}
                    {!loadingAulas && aulasNoDia.map((aula, idx) => (
                        <div key={aula.ordemAula} className="dd-section">
                            <div className="dd-section-header"
                                 onClick={() => toggleAulaColapsada(aula.ordemAula)}
                                 style={{ cursor:"pointer", userSelect:"none" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    <span style={{
                                        fontSize:14, color:"#9aaa9f",
                                        display:"inline-block",
                                        transition:"transform .2s",
                                        transform: aulasColapsadas.has(aula.ordemAula) ? "rotate(-90deg)" : "rotate(0deg)"
                                    }}>▾</span>
                                    <span className="dd-section-title">{idx + 1}ª Aula — {aula.horarioInicio}</span>
                                </div>
                                <span className="dd-section-count">
                                    {Object.values(chamadaPorAula[aula.ordemAula] || {}).filter(Boolean).length}/{alunos.length} presentes
                                </span>
                            </div>
                            {!aulasColapsadas.has(aula.ordemAula) && (
                            <table className="dd-table" style={{ width:"100%", borderCollapse:"collapse" }}>
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
                                                    <button onClick={() => setChamadaPorAula(p => ({
                                                                ...p,
                                                                [aula.ordemAula]: { ...p[aula.ordemAula], [aluno.id]: true }
                                                            }))}
                                                            style={{ padding:"6px 16px", border:"1px solid #eaeef2", borderRight:"none", background: presente ? "#0d1f18" : "white", color: presente ? "#7ec8a0" : "#9aaa9f", fontSize:11, fontWeight:500, cursor:"pointer", letterSpacing:".04em", transition:"all .15s" }}>
                                                        P
                                                    </button>
                                                    <button onClick={() => setChamadaPorAula(p => ({
                                                                ...p,
                                                                [aula.ordemAula]: { ...p[aula.ordemAula], [aluno.id]: false }
                                                            }))}
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
                            )}
                        </div>
                    ))}

                    {/* Histórico de frequência */}
                    {Object.keys(historicoPresenca).length > 0 && (
                        <div className="dd-section">
                            <div className="dd-section-header">
                                <span className="dd-section-title">Histórico de Frequência</span>
                                <span className="dd-section-count">{Object.keys(historicoPresenca).length} dia(s) registrado(s)</span>
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
                                <div style={{ display:"flex", gap:0, flexWrap:"wrap" }}>
                                    {["PROVA","TRABALHO","SIMULADO","RECUPERACAO"].map((t, i, arr) => (
                                        <button key={t} type="button" onClick={() => setFormAv(p => ({...p, tipo:t, bonificacao: t==="SIMULADO"}))}
                                                style={{ flex:"1 0 auto", padding:"9px", border:"1px solid #eaeef2",
                                                    borderRight: i < arr.length - 1 ? "none" : "1px solid #eaeef2",
                                                    background: formAv.tipo===t ? (t==="RECUPERACAO" ? "#7a3800" : "#0d1f18") : "white",
                                                    color: formAv.tipo===t ? (t==="RECUPERACAO" ? "#ffd08a" : "#7ec8a0") : "#9aaa9f",
                                                    fontSize:11, fontWeight:500, letterSpacing:".06em", textTransform:"uppercase", cursor:"pointer" }}>
                                            {t==="SIMULADO" ? "Bônus" : t==="RECUPERACAO" ? "Recup." : t}
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
                            {formAv.tipo !== "SIMULADO" && formAv.tipo !== "RECUPERACAO" && (
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
                            {formAv.tipo === "RECUPERACAO" && (
                                <div style={{ background:"#fff8e8", border:"1px solid #f0c070", borderRadius:6, padding:"12px 14px", fontSize:12, color:"#7a4800" }}>
                                    ↩ Recuperação — substitui a média do bimestre se a nota for maior. Após criar, você escolherá quais alunos participam.
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

            {/* Modal participantes da recuperação */}
            {modalParticipantes && (
                <div className="dd-modal-overlay">
                    <div className="dd-modal" style={{ maxWidth:480 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                                <p className="dd-modal-title">Participantes da Recuperação</p>
                                <p className="dd-modal-sub">
                                    {modalParticipantes.bimestre}º Bimestre · {modalParticipantes.descricao || "Recuperação"}
                                </p>
                            </div>
                            <button onClick={() => setModalParticipantes(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                            <button type="button" className="dd-btn-ghost" style={{ fontSize:11 }}
                                    onClick={() => setParticipantesSel(new Set(alunos.map(a => a.id)))}>
                                Selecionar todos
                            </button>
                            <button type="button" className="dd-btn-ghost" style={{ fontSize:11 }}
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
                            <button type="button" onClick={() => setModalParticipantes(null)} className="dd-btn-ghost" style={{ flex:1 }}>
                                Cancelar
                            </button>
                            <button type="button" onClick={salvarParticipantes} className="dd-btn-primary"
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
function Boletins({ anoLetivo }) {
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
                            options={turmas.filter(t => t.anoLetivo === anoLetivo).map(t => ({ value: t.id, label: `${t.nome} — ${t.serie?.nome || ""}` }))}
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

function Horarios({ anoLetivo }) {
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
            // Recarrega (erros de reload não desfazem o save)
            try {
                const r = await api.get(`/horarios/turma/${turmaId}`);
                setHorarios(r.data || []);
                const ha = await api.get("/horarios");
                setAllHorarios(ha.data || []);
            } catch {
                // Reload falhou mas o save foi bem-sucedido
            }
        } catch (e) {
            const msg = typeof e.response?.data === "string"
                ? e.response.data
                : e.response?.data?.mensagem || "Erro ao salvar horários";
            setMsg({ texto: msg, tipo: "err" });
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
                                    options={turmas.filter(t => t.anoLetivo === anoLetivo).map(t => ({ value: t.id, label: `${t.nome}${t.serie ? ` — ${t.serie.nome}` : ""}` }))}
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
// ═══════════════════════════════════════════════════════════════
// MÓDULO FINANCEIRO
// ═══════════════════════════════════════════════════════════════

const fmt = v => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtData = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—";
const mesAtual = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; };
const statusColors = {
    PENDENTE:  { bg:"#fff8e1", color:"#c47a00" },
    PAGO:      { bg:"#f0f5f2", color:"#2d6a4f" },
    CANCELADO: { bg:"#f5f5f5", color:"#9aaa9f" },
    VENCIDO:   { bg:"#fdf0f0", color:"#b94040" },
};
const statusBadge = s => statusColors[s] ?? { bg:"#f5f5f5", color:"#9aaa9f" };

// ---- FIN DASHBOARD ----
function FinDashboard() {
    const [mes, setMes] = useState(mesAtual());
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        setCarregando(true);
        api.get("/fin/dashboard", { params: { mes } })
            .then(r => setDados(r.data))
            .catch(() => setDados(null))
            .finally(() => setCarregando(false));
    }, [mes]);

    const kpis = dados?.kpis ?? {};
    const grafico = dados?.grafico ?? [];
    const proximosVenc = dados?.proximosVencimentos ?? [];
    const inadimplentes = dados?.inadimplentes ?? [];

    const kpiCards = [
        { label: "Total Entradas",  valor: kpis.totalEntradas,  cor: "#2d6a4f", Icone: TrendingUp },
        { label: "Total Saídas",    valor: kpis.totalSaidas,    cor: "#b94040", Icone: TrendingDown },
        { label: "Saldo do Mês",    valor: kpis.saldoMes,       cor: Number(kpis.saldoMes??0)>=0?"#2d6a4f":"#b94040", Icone: Wallet },
        { label: "CR a Receber",    valor: kpis.crAReceber,     cor: "#c47a00", Icone: CreditCard },
        { label: "CP a Pagar",      valor: kpis.cpAPagar,       cor: "#c47a00", Icone: TrendingDown },
        { label: "Inadimplência",   valor: kpis.crVencido,      cor: "#b94040", Icone: AlertCircle },
    ];

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <label className="dd-label" style={{ margin:0 }}>Mês de referência</label>
                <input type="month" value={mes} onChange={e => setMes(e.target.value)}
                    style={{ border:"1px solid #eaeef2", padding:"6px 10px", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"#fff", color:"#0d1f18" }} />
                {carregando && <span style={{ fontSize:11, color:"#9aaa9f" }}>Carregando...</span>}
            </div>

            <div className="dd-cards-grid">
                {kpiCards.map(c => (
                    <div key={c.label} className="dd-card" style={{ "--accent": c.cor, borderRadius:4, padding:"18px 20px" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                            <span className="dd-card-label">{c.label}</span>
                            <c.Icone size={16} color={c.cor} />
                        </div>
                        <div className="dd-card-num" style={{ color: c.cor, fontSize:22 }}>{fmt(c.valor)}</div>
                    </div>
                ))}
            </div>

            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Receitas vs Despesas — últimos 6 meses</span>
                </div>
                <div style={{ padding:"20px 20px 12px" }}>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={grafico} margin={{ top:4, right:16, left:0, bottom:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eaeef2" />
                            <XAxis dataKey="mesNome" tick={{ fontSize:11, fill:"#9aaa9f" }} />
                            <YAxis tick={{ fontSize:11, fill:"#9aaa9f" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v, n) => [fmt(v), n==="receitas"?"Receitas":"Despesas"]} labelStyle={{ fontWeight:600, fontSize:12 }} contentStyle={{ fontSize:12, border:"1px solid #eaeef2" }} />
                            <Legend wrapperStyle={{ fontSize:12, paddingTop:8 }} formatter={n => n==="receitas"?"Receitas":"Despesas"} />
                            <Bar dataKey="receitas" fill="#52B69A" radius={[3,3,0,0]} />
                            <Bar dataKey="despesas" fill="#e07070" radius={[3,3,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Próximos vencimentos (7 dias)</span>
                        <span className="dd-section-count">{proximosVenc.length}</span>
                    </div>
                    {proximosVenc.length === 0
                        ? <p style={{ padding:"20px", fontSize:12, color:"#9aaa9f", textAlign:"center" }}>Nenhum vencimento nos próximos 7 dias</p>
                        : <div className="dd-table-wrap">
                            <table className="dd-table" style={{ width:"100%" }}>
                                <thead><tr>
                                    <th>Módulo</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Dias</th>
                                </tr></thead>
                                <tbody>
                                    {proximosVenc.map((v, i) => (
                                        <tr key={i}>
                                            <td><span className="dd-badge" style={{ background: v.modulo==="CR"?"#f0f5f2":"#fdf0f0", color: v.modulo==="CR"?"#2d6a4f":"#b94040", borderRadius:3 }}>{v.modulo}</span></td>
                                            <td style={{ maxWidth:180 }}><div style={{ fontSize:12 }}>{v.descricao}</div>{(v.alunoNome||v.pessoaNome) && <div style={{ fontSize:11, color:"#9aaa9f" }}>{v.alunoNome||v.pessoaNome}</div>}</td>
                                            <td style={{ fontWeight:500 }}>{fmt(v.valor)}</td>
                                            <td>{fmtData(v.dataVencimento)}</td>
                                            <td><span style={{ fontWeight:600, color: v.diasRestantes<=2?"#b94040":"#c47a00" }}>{v.diasRestantes}d</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                    }
                </div>

                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Inadimplentes</span>
                        <span className="dd-section-count">{inadimplentes.length}</span>
                    </div>
                    {inadimplentes.length === 0
                        ? <p style={{ padding:"20px", fontSize:12, color:"#9aaa9f", textAlign:"center" }}>Nenhuma inadimplência</p>
                        : <div className="dd-table-wrap">
                            <table className="dd-table" style={{ width:"100%" }}>
                                <thead><tr>
                                    <th>Aluno / Pessoa</th><th>Valor</th><th>Vencimento</th><th>Atraso</th>
                                </tr></thead>
                                <tbody>
                                    {inadimplentes.map((v, i) => (
                                        <tr key={i}>
                                            <td><div style={{ fontSize:12, fontWeight:500 }}>{v.alunoNome||v.pessoaNome||"—"}</div>{v.pessoaTelefone && <div style={{ fontSize:11, color:"#9aaa9f" }}>{v.pessoaTelefone}</div>}</td>
                                            <td style={{ fontWeight:500, color:"#b94040" }}>{fmt(v.valor)}</td>
                                            <td>{fmtData(v.dataVencimento)}</td>
                                            <td><span style={{ fontWeight:600, color:"#b94040" }}>{v.diasAtraso}d</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                    }
                </div>
            </div>
        </div>
    );
}

// ---- FIN PESSOAS ----
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(cpf[10]);
}
function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    let sum = 0, pos = 5;
    for (let i = 0; i < 12; i++) { sum += parseInt(cnpj[i]) * pos--; if (pos < 2) pos = 9; }
    let r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (r !== parseInt(cnpj[12])) return false;
    sum = 0; pos = 6;
    for (let i = 0; i < 13; i++) { sum += parseInt(cnpj[i]) * pos--; if (pos < 2) pos = 9; }
    r = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return r === parseInt(cnpj[13]);
}

function FinPessoas() {
    const [pessoas, setPessoas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [formasBusca, setFormasBusca] = useState([{ value:"nome", label:"Nome" }, { value:"cpf", label:"CPF" }, { value:"cnpj", label:"CNPJ" }]);
    const [campoBusca, setCampoBusca] = useState("nome");
    const [termoBusca, setTermoBusca] = useState("");
    const [filtraTipo, setFiltraTipo] = useState("");
    const termoD = useDebounce(termoBusca);
    const [modal, setModal] = useState(null); // null | { modo:"criar"|"editar", dados:obj }
    const [form, setForm] = useState({});
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    const carregar = () => {
        const params = {};
        if (termoD) params[campoBusca] = termoD;
        if (filtraTipo) params.tipoPessoa = filtraTipo;
        api.get("/fin/pessoas", { params }).then(r => setPessoas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    };

    useEffect(() => {
        const params = {};
        if (termoD) params[campoBusca] = termoD;
        if (filtraTipo) params.tipoPessoa = filtraTipo;
        api.get("/fin/pessoas", { params })
            .then(r => setPessoas(Array.isArray(r.data) ? r.data : []))
            .catch(() => {});
    }, [termoD, filtraTipo, refreshKey]);
    useEffect(() => {
        api.get("/usuarios/buscar").then(r => setUsuarios(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    const abrirCriar = () => {
        setForm({ tipoPessoa:"FISICA", nome:"", cpf:"", cnpj:"", email:"", telefone:"", endereco:"", cep:"", cidade:"", estado:"", observacoes:"", usuarioId:"" });
        setModal({ modo:"criar" });
    };
    const abrirEditar = p => {
        setForm({ tipoPessoa:p.tipoPessoa||"FISICA", nome:p.nome||"", cpf:p.cpf||"", cnpj:p.cnpj||"", email:p.email||"", telefone:p.telefone||"", endereco:p.endereco||"", cep:p.cep||"", cidade:p.cidade||"", estado:p.estado||"", observacoes:p.observacoes||"", usuarioId:p.usuarioId||"" });
        setModal({ modo:"editar", dados:p });
    };

    const salvar = async e => {
        e.preventDefault();
        if (form.tipoPessoa === "FISICA" && form.cpf) {
            if (!validarCPF(form.cpf)) { flash("CPF inválido. Verifique os 11 dígitos.", "err"); return; }
        }
        if (form.tipoPessoa === "JURIDICA" && form.cnpj) {
            if (!validarCNPJ(form.cnpj)) { flash("CNPJ inválido. Verifique os 14 dígitos.", "err"); return; }
        }
        setSalvando(true);
        try {
            const body = { ...form, usuarioId: form.usuarioId ? Number(form.usuarioId) : null };
            if (modal.modo === "criar") await api.post("/fin/pessoas", body);
            else await api.put(`/fin/pessoas/${modal.dados.id}`, body);
            setModal(null);
            flash("Pessoa salva com sucesso!");
            setRefreshKey(k => k + 1);
        } catch(err) {
            flash(err.response?.data || "Erro ao salvar.", "err");
        } finally { setSalvando(false); }
    };

    const toggleAtivo = async p => {
        await api.patch(`/fin/pessoas/${p.id}/status`).catch(() => {});
        setRefreshKey(k => k + 1);
    };

    const deletar = async p => {
        if (!window.confirm(`Remover "${p.nome}"?`)) return;
        try {
            await api.delete(`/fin/pessoas/${p.id}`);
            flash("Pessoa removida.");
            setRefreshKey(k => k + 1);
        } catch(err) {
            flash(err.response?.data || "Erro ao remover.", "err");
        }
    };

    const ff = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                    <BarraBusca campos={[{ value:"nome", label:"Nome" },{ value:"cpf", label:"CPF" },{ value:"cnpj", label:"CNPJ" }]}
                        campoBusca={campoBusca} setCampoBusca={setCampoBusca} termoBusca={termoBusca} setTermoBusca={setTermoBusca} />
                </div>
                <select value={filtraTipo} onChange={e => setFiltraTipo(e.target.value)}
                    style={{ fontSize:11, padding:"8px 12px", border:"1px solid #eaeef2", background:"white", color:"#5a7060", outline:"none", fontFamily:"'DM Sans',sans-serif" }}>
                    <option value="">Todos os tipos</option>
                    <option value="FISICA">Pessoa Física</option>
                    <option value="JURIDICA">Pessoa Jurídica</option>
                </select>
                <button className="dd-btn-primary" onClick={abrirCriar} style={{ whiteSpace:"nowrap" }}>+ Nova Pessoa</button>
            </div>

            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Cadastro de Pessoas</span>
                    <span className="dd-section-count">{pessoas.length} registro(s)</span>
                </div>
                <div className="dd-table-wrap">
                    <table className="dd-table" style={{ width:"100%" }}>
                        <thead><tr>
                            <th>Nome</th><th>Tipo</th><th>Documento</th><th>Telefone</th><th>Vínculo</th><th>Status</th><th></th>
                        </tr></thead>
                        <tbody>
                            {pessoas.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center", color:"#9aaa9f", padding:24 }}>Nenhuma pessoa encontrada</td></tr>}
                            {pessoas.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight:500 }}>{p.nome}</td>
                                    <td><span className="dd-badge" style={{ background: p.tipoPessoa==="FISICA"?"#f0f5f2":"#f0f0ff", color: p.tipoPessoa==="FISICA"?"#2d6a4f":"#4040aa", borderRadius:3 }}>{p.tipoPessoa==="FISICA"?"PF":"PJ"}</span></td>
                                    <td style={{ fontSize:12, color:"#5a7060" }}>{p.cpf||p.cnpj||"—"}</td>
                                    <td style={{ fontSize:12 }}>{p.telefone||"—"}</td>
                                    <td style={{ fontSize:11, color:"#9aaa9f" }}>{p.usuarioNome||"—"}</td>
                                    <td><span className="dd-badge" style={{ background: p.ativo?"#f0f5f2":"#fdf0f0", color: p.ativo?"#2d6a4f":"#b94040", borderRadius:3 }}>{p.ativo?"Ativo":"Inativo"}</span></td>
                                    <td>
                                        <div style={{ display:"flex", gap:6 }}>
                                            <button className="dd-btn-edit" onClick={() => abrirEditar(p)}>Editar</button>
                                            <button className={p.ativo?"dd-btn-toggle-on":"dd-btn-toggle-off"} onClick={() => toggleAtivo(p)}>{p.ativo?"Desativar":"Ativar"}</button>
                                            <button className="dd-btn-danger" onClick={() => deletar(p)}>Remover</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
                    <div className="dd-modal" style={{ maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                                <p className="dd-modal-title">{modal.modo==="criar"?"Nova Pessoa":"Editar Pessoa"}</p>
                                <p className="dd-modal-sub">CRM Financeiro</p>
                            </div>
                            <button onClick={() => setModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"} style={{ marginBottom:12 }}>{msg.texto}</div>}
                        <form onSubmit={salvar} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                            <div>
                                <label className="dd-label">Tipo de Pessoa *</label>
                                <div style={{ display:"flex", gap:16, marginTop:4 }}>
                                    {["FISICA","JURIDICA"].map(t => (
                                        <label key={t} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer" }}>
                                            <input type="radio" name="tipoPessoa" value={t} checked={form.tipoPessoa===t} onChange={e => ff("tipoPessoa", e.target.value)} />
                                            {t==="FISICA"?"Pessoa Física":"Pessoa Jurídica"}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {[
                                { k:"nome", label:"Nome *", span:2 },
                                { k:"cpf", label:"CPF (somente números)", show: form.tipoPessoa==="FISICA", onlyDigits:true, maxLength:11, placeholder:"00000000000" },
                                { k:"cnpj", label:"CNPJ (somente números)", show: form.tipoPessoa==="JURIDICA", onlyDigits:true, maxLength:14, placeholder:"00000000000000" },
                                { k:"email", label:"E-mail" },
                                { k:"telefone", label:"Telefone" },
                                { k:"cep", label:"CEP" },
                                { k:"endereco", label:"Endereço", span:2 },
                                { k:"cidade", label:"Cidade" },
                                { k:"estado", label:"Estado (UF)" },
                            ].filter(f => f.show !== false).map(f => (
                                <div key={f.k} style={{ gridColumn: f.span===2?"1/-1":"auto" }}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" value={form[f.k]||""}
                                            onChange={e => ff(f.k, f.onlyDigits ? e.target.value.replace(/\D/g, '') : e.target.value)}
                                            maxLength={f.maxLength} inputMode={f.onlyDigits ? "numeric" : "text"}
                                            placeholder={f.placeholder || ""} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label className="dd-label">Observações</label>
                                <textarea value={form.observacoes||""} onChange={e => ff("observacoes", e.target.value)}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", resize:"vertical", outline:"none", minHeight:60 }} />
                            </div>
                            <div>
                                <label className="dd-label">Vínculo com usuário do sistema (opcional)</label>
                                <select value={form.usuarioId||""} onChange={e => ff("usuarioId", e.target.value)}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">— Sem vínculo —</option>
                                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.login})</option>)}
                                </select>
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Salvando...":"Salvar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- FIN FUNCIONARIOS ----
function FinFuncionarios() {
    const [funcionarios, setFuncionarios] = useState([]);
    const [pessoas, setPessoas] = useState([]);
    const [expandido, setExpandido] = useState(null);
    const [beneficios, setBeneficios] = useState({});
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({});
    const [formBenef, setFormBenef] = useState({ funcionarioId:"", tipo:"VALE_REFEICAO", valor:"", descricao:"" });
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [benefRefreshKey, setBenefRefreshKey] = useState(0);

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    const carregar = () => {
        api.get("/fin/funcionarios").then(r => setFuncionarios(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    };
    const carregarBeneficios = id => {
        api.get(`/fin/funcionarios/${id}/beneficios`).then(r => setBeneficios(b => ({ ...b, [id]: Array.isArray(r.data) ? r.data : [] }))).catch(() => {});
    };

    useEffect(() => {
        api.get("/fin/funcionarios").then(r => setFuncionarios(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, [refreshKey]);

    useEffect(() => {
        api.get("/fin/pessoas", { params: { ativo: true } }).then(r => setPessoas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (expandido) {
            api.get(`/fin/funcionarios/${expandido}/beneficios`)
                .then(r => setBeneficios(b => ({ ...b, [expandido]: Array.isArray(r.data) ? r.data : [] })))
                .catch(() => {});
        }
    }, [expandido, benefRefreshKey]);

    const toggleExpand = id => {
        setExpandido(e => e === id ? null : id);
        if (!beneficios[id]) carregarBeneficios(id);
    };

    const abrirCriar = () => {
        setForm({ pessoaId:"", cargo:"", salarioBase:"", cargaHoraria:"", dataAdmissao:"" });
        setModal({ modo:"criar" });
    };
    const abrirEditar = f => {
        setForm({ pessoaId: f.pessoaId||"", cargo: f.cargo||"", salarioBase: f.salarioBase||"", cargaHoraria: f.cargaHoraria||"", dataAdmissao: f.dataAdmissao||"" });
        setModal({ modo:"editar", dados: f });
    };

    const salvar = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            const body = { ...form, pessoaId: Number(form.pessoaId), salarioBase: Number(form.salarioBase), cargaHoraria: form.cargaHoraria ? Number(form.cargaHoraria) : null };
            if (modal.modo === "criar") await api.post("/fin/funcionarios", body);
            else await api.put(`/fin/funcionarios/${modal.dados.id}`, body);
            setModal(null);
            flash("Funcionário salvo!");
            setRefreshKey(k => k + 1);
        } catch(err) { flash(err.response?.data || "Erro ao salvar.", "err"); }
        finally { setSalvando(false); }
    };

    const toggleAtivo = async f => {
        await api.patch(`/fin/funcionarios/${f.id}/status`).catch(() => {});
        setRefreshKey(k => k + 1);
    };

    const adicionarBeneficio = async e => {
        e.preventDefault();
        try {
            await api.post(`/fin/funcionarios/${formBenef.funcionarioId}/beneficios`, { ...formBenef, valor: Number(formBenef.valor) });
            setFormBenef(b => ({ ...b, tipo:"VALE_REFEICAO", valor:"", descricao:"" }));
            setBenefRefreshKey(k => k + 1);
        } catch(err) { flash(err.response?.data || "Erro ao adicionar benefício.", "err"); }
    };

    const toggleBeneficio = async (b, funcId) => {
        await api.patch(`/fin/beneficios/${b.id}/status`).catch(() => {});
        setBenefRefreshKey(k => k + 1);
    };
    const deletarBeneficio = async (b, funcId) => {
        await api.delete(`/fin/beneficios/${b.id}`).catch(() => {});
        setBenefRefreshKey(k => k + 1);
    };

    const ff = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const tiposBenef = ["VALE_REFEICAO","VALE_TRANSPORTE","BONUS","HORA_EXTRA","OUTRO"];

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div style={{ display:"flex", justifyContent:"flex-end" }}>
                <button className="dd-btn-primary" onClick={abrirCriar}>+ Novo Funcionário</button>
            </div>

            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Funcionários</span>
                    <span className="dd-section-count">{funcionarios.length}</span>
                </div>
                <div className="dd-table-wrap">
                    <table className="dd-table" style={{ width:"100%" }}>
                        <thead><tr>
                            <th></th><th>Nome</th><th>Cargo</th><th>Salário Base</th><th>Total c/ Benef.</th><th>C.H.</th><th>Status</th><th></th>
                        </tr></thead>
                        <tbody>
                            {funcionarios.length === 0 && <tr><td colSpan={8} style={{ textAlign:"center", color:"#9aaa9f", padding:24 }}>Nenhum funcionário cadastrado</td></tr>}
                            {funcionarios.map(f => (
                                <>
                                    <tr key={f.id} style={{ cursor:"pointer" }} onClick={() => toggleExpand(f.id)}>
                                        <td style={{ width:32 }}><ChevronRight size={14} style={{ transform: expandido===f.id?"rotate(90deg)":"none", transition:".2s", color:"#9aaa9f" }} /></td>
                                        <td style={{ fontWeight:500 }}>{f.pessoaNome||"—"}</td>
                                        <td>{f.cargo||"—"}</td>
                                        <td>{fmt(f.salarioBase)}</td>
                                        <td style={{ fontWeight:500, color:"#2d6a4f" }}>{fmt(f.salarioTotal)}</td>
                                        <td style={{ fontSize:12 }}>{f.cargaHoraria ? `${f.cargaHoraria}h` : "—"}</td>
                                        <td><span className="dd-badge" style={{ background: f.ativo?"#f0f5f2":"#fdf0f0", color: f.ativo?"#2d6a4f":"#b94040", borderRadius:3 }}>{f.ativo?"Ativo":"Inativo"}</span></td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div style={{ display:"flex", gap:6 }}>
                                                <button className="dd-btn-edit" onClick={() => abrirEditar(f)}>Editar</button>
                                                <button className={f.ativo?"dd-btn-toggle-on":"dd-btn-toggle-off"} onClick={() => toggleAtivo(f)}>{f.ativo?"Desativar":"Ativar"}</button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandido === f.id && (
                                        <tr key={`benef-${f.id}`}>
                                            <td colSpan={8} style={{ background:"#f8faf8", padding:"16px 24px" }}>
                                                <p style={{ fontSize:12, fontWeight:600, color:"#0d1f18", marginBottom:12 }}>Benefícios de {f.pessoaNome}</p>
                                                <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:12, fontSize:12 }}>
                                                    <thead><tr style={{ borderBottom:"1px solid #eaeef2" }}>
                                                        <th style={{ padding:"6px 12px", textAlign:"left", color:"#9aaa9f", fontSize:10, textTransform:"uppercase" }}>Tipo</th>
                                                        <th style={{ padding:"6px 12px", textAlign:"left", color:"#9aaa9f", fontSize:10, textTransform:"uppercase" }}>Valor</th>
                                                        <th style={{ padding:"6px 12px", textAlign:"left", color:"#9aaa9f", fontSize:10, textTransform:"uppercase" }}>Descrição</th>
                                                        <th style={{ padding:"6px 12px", textAlign:"left", color:"#9aaa9f", fontSize:10, textTransform:"uppercase" }}>Status</th>
                                                        <th></th>
                                                    </tr></thead>
                                                    <tbody>
                                                        {(beneficios[f.id]||[]).length === 0 && <tr><td colSpan={5} style={{ padding:"12px", color:"#9aaa9f", textAlign:"center" }}>Nenhum benefício</td></tr>}
                                                        {(beneficios[f.id]||[]).map(b => (
                                                            <tr key={b.id} style={{ borderBottom:"1px solid #f2f5f2" }}>
                                                                <td style={{ padding:"8px 12px" }}>{b.tipo}</td>
                                                                <td style={{ padding:"8px 12px", fontWeight:500 }}>{fmt(b.valor)}</td>
                                                                <td style={{ padding:"8px 12px", color:"#9aaa9f" }}>{b.descricao||"—"}</td>
                                                                <td style={{ padding:"8px 12px" }}><span style={{ fontSize:10, padding:"2px 8px", background: b.ativo?"#f0f5f2":"#fdf0f0", color: b.ativo?"#2d6a4f":"#b94040", borderRadius:3 }}>{b.ativo?"Ativo":"Inativo"}</span></td>
                                                                <td style={{ padding:"8px 12px" }}>
                                                                    <div style={{ display:"flex", gap:4 }}>
                                                                        <button className={b.ativo?"dd-btn-toggle-on":"dd-btn-toggle-off"} style={{ fontSize:10, padding:"3px 8px" }} onClick={() => toggleBeneficio(b, f.id)}>{b.ativo?"Des.":"Ativ."}</button>
                                                                        <button className="dd-btn-danger" style={{ fontSize:10, padding:"3px 8px" }} onClick={() => deletarBeneficio(b, f.id)}>Rem.</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <form onSubmit={e => { setFormBenef(b => ({ ...b, funcionarioId: f.id })); adicionarBeneficio(e); }} style={{ display:"flex", gap:8, alignItems:"flex-end", flexWrap:"wrap" }}>
                                                    <div>
                                                        <label className="dd-label">Tipo</label>
                                                        <select value={formBenef.tipo} onChange={e => setFormBenef(b => ({ ...b, tipo: e.target.value }))}
                                                            style={{ fontSize:12, padding:"6px 8px", border:"1px solid #eaeef2", fontFamily:"'DM Sans',sans-serif", outline:"none" }}>
                                                            {tiposBenef.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="dd-label">Valor</label>
                                                        <input type="number" step="0.01" value={formBenef.valor} onChange={e => setFormBenef(b => ({ ...b, valor: e.target.value }))}
                                                            placeholder="0,00" required
                                                            style={{ fontSize:12, padding:"6px 8px", border:"1px solid #eaeef2", fontFamily:"'DM Sans',sans-serif", outline:"none", width:100 }} />
                                                    </div>
                                                    <div>
                                                        <label className="dd-label">Descrição</label>
                                                        <input value={formBenef.descricao} onChange={e => setFormBenef(b => ({ ...b, descricao: e.target.value }))}
                                                            placeholder="Opcional"
                                                            style={{ fontSize:12, padding:"6px 8px", border:"1px solid #eaeef2", fontFamily:"'DM Sans',sans-serif", outline:"none", width:160 }} />
                                                    </div>
                                                    <button type="submit" className="dd-btn-primary" style={{ fontSize:11, padding:"7px 14px" }} onClick={() => setFormBenef(b => ({ ...b, funcionarioId: f.id }))}>+ Adicionar</button>
                                                </form>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
                    <div className="dd-modal" style={{ maxWidth:460 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div>
                                <p className="dd-modal-title">{modal.modo==="criar"?"Novo Funcionário":"Editar Funcionário"}</p>
                                <p className="dd-modal-sub">Dados trabalhistas</p>
                            </div>
                            <button onClick={() => setModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={salvar} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            <div>
                                <label className="dd-label">Pessoa (cadastrada) *</label>
                                <select value={form.pessoaId||""} onChange={e => ff("pessoaId", e.target.value)} required
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">Selecione uma pessoa...</option>
                                    {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome} {p.cpf ? `(${p.cpf})` : ""}</option>)}
                                </select>
                            </div>
                            {[
                                { k:"cargo", label:"Cargo *", required:true },
                                { k:"salarioBase", label:"Salário Base (R$) *", type:"number", step:"0.01", required:true },
                                { k:"cargaHoraria", label:"Carga Horária (h/semana)", type:"number" },
                                { k:"dataAdmissao", label:"Data de Admissão", type:"date" },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type||"text"} step={f.step} required={f.required} value={form[f.k]||""} onChange={e => ff(f.k, e.target.value)} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Salvando...":"Salvar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- FIN CONTRATOS / CR ----
function FinContratos({ anoLetivo }) {
    const [alunos, setAlunos] = useState([]);
    const [alunoSel, setAlunoSel] = useState("");
    const [contratos, setContratos] = useState([]);
    const [parcelas, setParcelas] = useState({}); // { [contratoId]: [] }
    const [expandido, setExpandido] = useState(null);
    const [series, setSeries] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [modalContrato, setModalContrato] = useState(false);
    const [modalBaixar, setModalBaixar] = useState(null); // { crId, valor }
    const [formContrato, setFormContrato] = useState({ anoLetivo: String(anoLetivo), serieId:"", numParcelas:"12", desconto:"0", acrescimo:"0", mesInicio:"" });
    const [formBaixar, setFormBaixar] = useState({ dataPagamento:"", valorPago:"", formaPagamentoId:"", observacoes:"" });
    const [modalCRAvulsa, setModalCRAvulsa] = useState(false);
    const [formCRAvulsa, setFormCRAvulsa] = useState({ descricao:"", valor:"", dataVencimento:"", pessoaId:"", formaPagamentoId:"", observacoes:"" });
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    useEffect(() => {
        api.get("/usuarios/buscar", { params: { role:"ALUNO" } }).then(r => setAlunos(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        api.get("/turmas/series").then(r => setSeries(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        api.get("/fin/formas-pagamento", { params: { apenasAtivas: true } }).then(r => setFormasPagamento(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (!alunoSel) { setContratos([]); return; }
        api.get(`/fin/contratos/aluno/${alunoSel}`).then(r => setContratos(Array.isArray(r.data) ? r.data : [])).catch(() => setContratos([]));
    }, [alunoSel]);

    const carregarParcelas = id => {
        api.get("/fin/contas-receber", { params: { contratoId: id } }).then(r => setParcelas(p => ({ ...p, [id]: Array.isArray(r.data) ? r.data : [] }))).catch(() => {});
    };

    const toggleExpand = id => {
        setExpandido(e => e === id ? null : id);
        if (!parcelas[id]) carregarParcelas(id);
    };

    const criarContrato = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.post("/fin/contratos", { ...formContrato, alunoId: Number(alunoSel), serieId: Number(formContrato.serieId), numParcelas: Number(formContrato.numParcelas), desconto: Number(formContrato.desconto||0), acrescimo: Number(formContrato.acrescimo||0) });
            setModalContrato(false);
            flash("Contrato criado!");
            api.get(`/fin/contratos/aluno/${alunoSel}`).then(r => setContratos(Array.isArray(r.data) ? r.data : []));
        } catch(err) { flash(err.response?.data || "Erro ao criar contrato.", "err"); }
        finally { setSalvando(false); }
    };

    const baixarParcela = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.patch(`/fin/contas-receber/${modalBaixar.crId}/baixar`, { ...formBaixar, valorPago: Number(formBaixar.valorPago), formaPagamentoId: formBaixar.formaPagamentoId ? Number(formBaixar.formaPagamentoId) : null });
            setModalBaixar(null);
            flash("Parcela baixada!");
            carregarParcelas(modalBaixar.contratoId);
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const cancelarParcela = async (crId, contratoId) => {
        if (!window.confirm("Cancelar esta parcela?")) return;
        try {
            await api.patch(`/fin/contas-receber/${crId}/cancelar`);
            flash("Parcela cancelada.");
            carregarParcelas(contratoId);
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
    };

    const criarCRAvulsa = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.post("/fin/contas-receber", { ...formCRAvulsa, valor: Number(formCRAvulsa.valor), pessoaId: formCRAvulsa.pessoaId ? Number(formCRAvulsa.pessoaId) : null, formaPagamentoId: formCRAvulsa.formaPagamentoId ? Number(formCRAvulsa.formaPagamentoId) : null });
            setModalCRAvulsa(false);
            flash("CR avulsa criada!");
            if (alunoSel) {
                api.get(`/fin/contratos/aluno/${alunoSel}`).then(r => setContratos(Array.isArray(r.data) ? r.data : [])).catch(() => {});
            }
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const computarStatus = cr => {
        if (cr.status !== "PENDENTE") return cr.status;
        if (cr.dataVencimento && cr.dataVencimento < new Date().toISOString().slice(0,10)) return "VENCIDO";
        return "PENDENTE";
    };

    const fc = (k, v) => setFormContrato(f => ({ ...f, [k]: v }));

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                    <label className="dd-label">Selecionar aluno</label>
                    <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)}
                        style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                        <option value="">— Selecione um aluno —</option>
                        {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                </div>
                {alunoSel && <button className="dd-btn-primary" onClick={() => { setFormContrato(f => ({ ...f, anoLetivo: String(anoLetivo), mesInicio: mesAtual() })); setModalContrato(true); }}>+ Novo Contrato</button>}
                <button className="dd-btn-ghost" onClick={() => { setFormCRAvulsa({ descricao:"", valor:"", dataVencimento:"", pessoaId:"", formaPagamentoId:"", observacoes:"" }); setModalCRAvulsa(true); }}>+ CR Avulsa</button>
            </div>

            {alunoSel && (
                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Contratos de {alunos.find(a=>String(a.id)===String(alunoSel))?.nome || ""}</span>
                        <span className="dd-section-count">{contratos.length}</span>
                    </div>
                    {contratos.length === 0
                        ? <p style={{ padding:20, fontSize:12, color:"#9aaa9f", textAlign:"center" }}>Nenhum contrato. Crie o primeiro acima.</p>
                        : contratos.map(c => (
                            <div key={c.id} style={{ borderBottom:"1px solid #eaeef2" }}>
                                <div style={{ padding:"12px 20px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", background: expandido===c.id?"#f8faf8":"white" }}
                                    onClick={() => toggleExpand(c.id)}>
                                    <ChevronRight size={14} style={{ transform: expandido===c.id?"rotate(90deg)":"none", transition:".2s", color:"#9aaa9f", flexShrink:0 }} />
                                    <div style={{ flex:1 }}>
                                        <span style={{ fontWeight:500, fontSize:13 }}>Contrato {c.anoLetivo} — {c.serieName||`Série ID ${c.serieId}`}</span>
                                        <span style={{ marginLeft:12, fontSize:11, color:"#9aaa9f" }}>{c.numParcelas} parcelas</span>
                                    </div>
                                    <span style={{ fontSize:13, fontWeight:600, color:"#0d1f18" }}>{fmt(c.valorTotal)}</span>
                                    <span className="dd-badge" style={{ background: c.status==="ATIVO"?"#f0f5f2":"#fdf0f0", color: c.status==="ATIVO"?"#2d6a4f":"#b94040", borderRadius:3, fontSize:10 }}>{c.status}</span>
                                </div>

                                {expandido === c.id && (
                                    <div style={{ padding:"0 20px 16px", background:"#f8faf8" }}>
                                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12, padding:"12px 0" }}>
                                            {[["Valor Base", fmt(c.valorBase)], ["Desconto", fmt(c.desconto)], ["Acréscimo", fmt(c.acrescimo)], ["Total", fmt(c.valorTotal)]].map(([l,v]) => (
                                                <div key={l}><span style={{ fontSize:10, color:"#9aaa9f", textTransform:"uppercase" }}>{l}</span><br /><span style={{ fontSize:14, fontWeight:600 }}>{v}</span></div>
                                            ))}
                                        </div>
                                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                                            <thead><tr style={{ borderBottom:"1px solid #eaeef2" }}>
                                                {["#","Vencimento","Valor","Status","Pago em","Valor Pago",""].map(h => (
                                                    <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"#9aaa9f", fontSize:10, textTransform:"uppercase" }}>{h}</th>
                                                ))}
                                            </tr></thead>
                                            <tbody>
                                                {(parcelas[c.id]||[]).map((cr, idx) => {
                                                    const st = computarStatus(cr);
                                                    const sc = statusBadge(st);
                                                    return (
                                                        <tr key={cr.id} style={{ borderBottom:"1px solid #f2f5f2" }}>
                                                            <td style={{ padding:"8px 10px", color:"#9aaa9f" }}>{idx+1}</td>
                                                            <td style={{ padding:"8px 10px" }}>{fmtData(cr.dataVencimento)}</td>
                                                            <td style={{ padding:"8px 10px", fontWeight:500 }}>{fmt(cr.valor)}</td>
                                                            <td style={{ padding:"8px 10px" }}><span className="dd-badge" style={{ ...sc, borderRadius:3, fontSize:10 }}>{st}</span></td>
                                                            <td style={{ padding:"8px 10px", color:"#9aaa9f" }}>{cr.dataPagamento ? fmtData(cr.dataPagamento) : "—"}</td>
                                                            <td style={{ padding:"8px 10px" }}>{cr.valorPago ? fmt(cr.valorPago) : "—"}</td>
                                                            <td style={{ padding:"8px 10px" }}>
                                                                {st === "PENDENTE" || st === "VENCIDO" ? (
                                                                    <div style={{ display:"flex", gap:4 }}>
                                                                        <button className="dd-btn-edit" style={{ fontSize:10, padding:"3px 8px" }}
                                                                            onClick={() => { setFormBaixar({ dataPagamento: new Date().toISOString().slice(0,10), valorPago: String(cr.valor), formaPagamentoId:"", observacoes:"" }); setModalBaixar({ crId: cr.id, contratoId: c.id, valor: cr.valor }); }}>Baixar</button>
                                                                        <button className="dd-btn-danger" style={{ fontSize:10, padding:"3px 8px" }} onClick={() => cancelarParcela(cr.id, c.id)}>Cancelar</button>
                                                                    </div>
                                                                ) : null}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    }
                </div>
            )}

            {/* Modal Contrato */}
            {modalContrato && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalContrato(false)}>
                    <div className="dd-modal" style={{ maxWidth:440 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Novo Contrato</p><p className="dd-modal-sub">Gera parcelas automaticamente</p></div>
                            <button onClick={() => setModalContrato(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={criarContrato} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            <div>
                                <label className="dd-label">Série *</label>
                                <select value={formContrato.serieId} onChange={e => fc("serieId", e.target.value)} required
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">Selecione a série...</option>
                                    {series.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                </select>
                            </div>
                            {[
                                { k:"anoLetivo", label:"Ano Letivo *", type:"number", required:true },
                                { k:"numParcelas", label:"Número de Parcelas *", type:"number", required:true },
                                { k:"desconto", label:"Desconto (R$)", type:"number", step:"0.01" },
                                { k:"acrescimo", label:"Acréscimo (R$)", type:"number", step:"0.01" },
                                { k:"mesInicio", label:"Mês de início (1ª parcela) *", type:"month", required:true },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type||"text"} step={f.step} required={f.required} value={formContrato[f.k]||""} onChange={e => fc(f.k, e.target.value)} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModalContrato(false)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Criando...":"Criar Contrato"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Baixar Parcela */}
            {modalBaixar && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalBaixar(null)}>
                    <div className="dd-modal" style={{ maxWidth:380 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Dar Baixa</p><p className="dd-modal-sub">{fmt(modalBaixar.valor)}</p></div>
                            <button onClick={() => setModalBaixar(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={baixarParcela} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            {[
                                { k:"dataPagamento", label:"Data de Pagamento *", type:"date", required:true },
                                { k:"valorPago", label:"Valor Pago (R$) *", type:"number", step:"0.01", required:true },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type} step={f.step} required={f.required} value={formBaixar[f.k]||""} onChange={e => setFormBaixar(b => ({ ...b, [f.k]: e.target.value }))} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label className="dd-label">Forma de Pagamento</label>
                                <select value={formBaixar.formaPagamentoId||""} onChange={e => setFormBaixar(b => ({ ...b, formaPagamentoId: e.target.value }))}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">— Não informar —</option>
                                    {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModalBaixar(null)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Baixando...":"Confirmar Baixa"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal CR Avulsa */}
            {modalCRAvulsa && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalCRAvulsa(false)}>
                    <div className="dd-modal" style={{ maxWidth:420 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Nova CR Avulsa</p><p className="dd-modal-sub">Recebimento avulso</p></div>
                            <button onClick={() => setModalCRAvulsa(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={criarCRAvulsa} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            {[
                                { k:"descricao", label:"Descrição *", required:true },
                                { k:"valor", label:"Valor (R$) *", type:"number", step:"0.01", required:true },
                                { k:"dataVencimento", label:"Vencimento *", type:"date", required:true },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type||"text"} step={f.step} required={f.required} value={formCRAvulsa[f.k]||""} onChange={e => setFormCRAvulsa(b => ({ ...b, [f.k]: e.target.value }))} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label className="dd-label">Pessoa (opcional)</label>
                                <select value={formCRAvulsa.pessoaId||""} onChange={e => setFormCRAvulsa(b => ({ ...b, pessoaId: e.target.value }))}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">— Sem pessoa —</option>
                                    {[...alunos.map(a => ({ id:a.id, nome:a.nome+" (aluno)" }))].map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModalCRAvulsa(false)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Salvando...":"Criar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- FIN CONTAS A PAGAR ----
function FinContasPagar() {
    const [contas, setContas] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [filtros, setFiltros] = useState({ status:"", tipo:"", mesReferencia:"" });
    const [modalBaixar, setModalBaixar] = useState(null);
    const [modalGerarFolha, setModalGerarFolha] = useState(false);
    const [modalGerarRec, setModalGerarRec] = useState(false);
    const [modalModelo, setModalModelo] = useState(null);
    const [mesFolha, setMesFolha] = useState(mesAtual());
    const [mesRec, setMesRec] = useState(mesAtual());
    const [formBaixar, setFormBaixar] = useState({ dataPagamento:"", valorPago:"", formaPagamentoId:"", observacoes:"" });
    const [formModelo, setFormModelo] = useState({ descricao:"", categoria:"CONTA_FIXA", valor:"", diaVencimento:"", observacoes:"" });
    const [mostrarModelos, setMostrarModelos] = useState(false);
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    const carregar = () => {
        const params = {};
        if (filtros.status) params.status = filtros.status;
        if (filtros.tipo) params.tipo = filtros.tipo;
        if (filtros.mesReferencia) params.mesReferencia = filtros.mesReferencia;
        api.get("/fin/contas-pagar", { params }).then(r => setContas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    };

    useEffect(() => { carregar(); }, [filtros]);
    useEffect(() => {
        api.get("/fin/formas-pagamento", { params: { apenasAtivas: true } }).then(r => setFormasPagamento(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        api.get("/fin/contas-pagar-modelo").then(r => setModelos(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    const baixarConta = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.patch(`/fin/contas-pagar/${modalBaixar.id}/baixar`, { ...formBaixar, valorPago: Number(formBaixar.valorPago), formaPagamentoId: formBaixar.formaPagamentoId ? Number(formBaixar.formaPagamentoId) : null });
            setModalBaixar(null);
            flash("Conta baixada!");
            carregar();
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const cancelarConta = async id => {
        if (!window.confirm("Cancelar esta conta?")) return;
        try { await api.patch(`/fin/contas-pagar/${id}/cancelar`); flash("Cancelada."); carregar(); }
        catch(err) { flash(err.response?.data || "Erro.", "err"); }
    };

    const gerarFolha = async () => {
        setSalvando(true);
        try {
            const r = await api.post("/fin/contas-pagar/gerar-folha", { mes: mesFolha });
            setModalGerarFolha(false);
            flash(`Folha gerada: ${r.data.geradas} conta(s). ${r.data.ignoradas} já existia(m).`);
            carregar();
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const gerarRecorrentes = async () => {
        setSalvando(true);
        try {
            const r = await api.post("/fin/contas-pagar/gerar-recorrentes", { mes: mesRec });
            setModalGerarRec(false);
            flash(`Recorrentes geradas: ${r.data.geradas} conta(s). ${r.data.ignoradas} já existia(m).`);
            carregar();
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const salvarModelo = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            if (modalModelo.modo === "criar") await api.post("/fin/contas-pagar-modelo", { ...formModelo, valor: Number(formModelo.valor), diaVencimento: formModelo.diaVencimento ? Number(formModelo.diaVencimento) : null });
            else await api.put(`/fin/contas-pagar-modelo/${modalModelo.dados.id}`, { ...formModelo, valor: Number(formModelo.valor), diaVencimento: formModelo.diaVencimento ? Number(formModelo.diaVencimento) : null });
            setModalModelo(null);
            api.get("/fin/contas-pagar-modelo").then(r => setModelos(Array.isArray(r.data) ? r.data : []));
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const deletarModelo = async id => {
        if (!window.confirm("Remover modelo?")) return;
        await api.delete(`/fin/contas-pagar-modelo/${id}`).catch(() => {});
        api.get("/fin/contas-pagar-modelo").then(r => setModelos(Array.isArray(r.data) ? r.data : []));
    };

    const computarStatus = cp => {
        if (cp.status !== "PENDENTE") return cp.status;
        if (cp.dataVencimento && cp.dataVencimento < new Date().toISOString().slice(0,10)) return "VENCIDO";
        return "PENDENTE";
    };

    const ff = (k, v) => setFiltros(f => ({ ...f, [k]: v }));

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            {/* Filtros e ações */}
            <div style={{ display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
                {[
                    { k:"status", opts:[["","Todos status"],["PENDENTE","Pendente"],["PAGO","Pago"],["CANCELADO","Cancelado"]] },
                    { k:"tipo",   opts:[["","Todos tipos"],["SALARIO","Salário"],["CONTA_FIXA","Conta Fixa"],["FORNECEDOR","Fornecedor"],["OUTRO","Outro"]] },
                ].map(f => (
                    <select key={f.k} value={filtros[f.k]} onChange={e => ff(f.k, e.target.value)}
                        style={{ fontSize:11, padding:"8px 10px", border:"1px solid #eaeef2", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", color:"#5a7060" }}>
                        {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                ))}
                <input type="month" value={filtros.mesReferencia} onChange={e => ff("mesReferencia", e.target.value)}
                    style={{ fontSize:11, padding:"8px 10px", border:"1px solid #eaeef2", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }} />
                <button className="dd-btn-ghost" onClick={() => setModalGerarFolha(true)}>Gerar Folha</button>
                <button className="dd-btn-ghost" onClick={() => setModalGerarRec(true)}>Gerar Recorrentes</button>
                <button className="dd-btn-ghost" onClick={() => setMostrarModelos(m => !m)}>{mostrarModelos?"Ocultar Modelos":"Ver Modelos"}</button>
            </div>

            {/* Tabela CP */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Contas a Pagar</span>
                    <span className="dd-section-count">{contas.length}</span>
                </div>
                <div className="dd-table-wrap">
                    <table className="dd-table" style={{ width:"100%" }}>
                        <thead><tr>
                            <th>Descrição</th><th>Tipo</th><th>Valor</th><th>Vencimento</th><th>Mês Ref.</th><th>Status</th><th>Pessoa/Func.</th><th></th>
                        </tr></thead>
                        <tbody>
                            {contas.length === 0 && <tr><td colSpan={8} style={{ textAlign:"center", color:"#9aaa9f", padding:24 }}>Nenhuma conta encontrada</td></tr>}
                            {contas.map(cp => {
                                const st = computarStatus(cp);
                                const sc = statusBadge(st);
                                return (
                                    <tr key={cp.id}>
                                        <td style={{ fontWeight:500 }}>{cp.descricao}</td>
                                        <td style={{ fontSize:11 }}>{cp.tipo}</td>
                                        <td style={{ fontWeight:500 }}>{fmt(cp.valor)}</td>
                                        <td>{fmtData(cp.dataVencimento)}</td>
                                        <td style={{ fontSize:11, color:"#9aaa9f" }}>{cp.mesReferencia||"—"}</td>
                                        <td><span className="dd-badge" style={{ ...sc, borderRadius:3 }}>{st}</span></td>
                                        <td style={{ fontSize:11, color:"#9aaa9f" }}>{cp.pessoaNome||cp.funcionarioNome||"—"}</td>
                                        <td>
                                            {(st==="PENDENTE"||st==="VENCIDO") && (
                                                <div style={{ display:"flex", gap:6 }}>
                                                    <button className="dd-btn-edit" style={{ fontSize:10 }} onClick={() => { setFormBaixar({ dataPagamento: new Date().toISOString().slice(0,10), valorPago: String(cp.valor), formaPagamentoId:"", observacoes:"" }); setModalBaixar(cp); }}>Baixar</button>
                                                    <button className="dd-btn-danger" style={{ fontSize:10 }} onClick={() => cancelarConta(cp.id)}>Cancelar</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modelos */}
            {mostrarModelos && (
                <div className="dd-section">
                    <div className="dd-section-header">
                        <span className="dd-section-title">Modelos de Contas Fixas</span>
                        <button className="dd-btn-primary" style={{ fontSize:11 }} onClick={() => { setFormModelo({ descricao:"", categoria:"CONTA_FIXA", valor:"", diaVencimento:"", observacoes:"" }); setModalModelo({ modo:"criar" }); }}>+ Novo Modelo</button>
                    </div>
                    <div className="dd-table-wrap">
                        <table className="dd-table" style={{ width:"100%" }}>
                            <thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Dia Venc.</th><th>Ativo</th><th></th></tr></thead>
                            <tbody>
                                {modelos.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", color:"#9aaa9f", padding:16 }}>Nenhum modelo</td></tr>}
                                {modelos.map(m => (
                                    <tr key={m.id}>
                                        <td style={{ fontWeight:500 }}>{m.descricao}</td>
                                        <td style={{ fontSize:11 }}>{m.categoria}</td>
                                        <td>{fmt(m.valor)}</td>
                                        <td style={{ fontSize:12 }}>Dia {m.diaVencimento||"—"}</td>
                                        <td><span style={{ fontSize:10, padding:"2px 8px", background: m.ativo?"#f0f5f2":"#fdf0f0", color: m.ativo?"#2d6a4f":"#b94040", borderRadius:3 }}>{m.ativo?"Sim":"Não"}</span></td>
                                        <td><div style={{ display:"flex", gap:4 }}>
                                            <button className="dd-btn-edit" style={{ fontSize:10 }} onClick={() => { setFormModelo({ descricao:m.descricao, categoria:m.categoria, valor:m.valor, diaVencimento:m.diaVencimento||"", observacoes:m.observacoes||"" }); setModalModelo({ modo:"editar", dados:m }); }}>Editar</button>
                                            <button className="dd-btn-danger" style={{ fontSize:10 }} onClick={() => deletarModelo(m.id)}>Rem.</button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Baixar CP */}
            {modalBaixar && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalBaixar(null)}>
                    <div className="dd-modal" style={{ maxWidth:380 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Dar Baixa</p><p className="dd-modal-sub">{modalBaixar.descricao}</p></div>
                            <button onClick={() => setModalBaixar(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={baixarConta} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            {[
                                { k:"dataPagamento", label:"Data de Pagamento *", type:"date", required:true },
                                { k:"valorPago", label:"Valor Pago (R$) *", type:"number", step:"0.01", required:true },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type} step={f.step} required={f.required} value={formBaixar[f.k]||""} onChange={e => setFormBaixar(b => ({ ...b, [f.k]: e.target.value }))} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label className="dd-label">Forma de Pagamento</label>
                                <select value={formBaixar.formaPagamentoId||""} onChange={e => setFormBaixar(b => ({ ...b, formaPagamentoId: e.target.value }))}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">— Não informar —</option>
                                    {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModalBaixar(null)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Baixando...":"Confirmar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Gerar Folha */}
            {modalGerarFolha && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalGerarFolha(false)}>
                    <div className="dd-modal" style={{ maxWidth:340 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Gerar Folha de Pagamento</p><p className="dd-modal-sub">Salários de todos os funcionários ativos</p></div>
                            <button onClick={() => setModalGerarFolha(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <div style={{ marginBottom:16 }}>
                            <label className="dd-label">Mês de Referência</label>
                            <input type="month" value={mesFolha} onChange={e => setMesFolha(e.target.value)}
                                style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }} />
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                            <button className="dd-btn-ghost" onClick={() => setModalGerarFolha(false)}>Cancelar</button>
                            <button className="dd-btn-primary" disabled={salvando} onClick={gerarFolha}>{salvando?"Gerando...":"Gerar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Gerar Recorrentes */}
            {modalGerarRec && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalGerarRec(false)}>
                    <div className="dd-modal" style={{ maxWidth:340 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Gerar Contas Recorrentes</p><p className="dd-modal-sub">Instâncias de todos os modelos ativos</p></div>
                            <button onClick={() => setModalGerarRec(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <div style={{ marginBottom:16 }}>
                            <label className="dd-label">Mês de Referência</label>
                            <input type="month" value={mesRec} onChange={e => setMesRec(e.target.value)}
                                style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }} />
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                            <button className="dd-btn-ghost" onClick={() => setModalGerarRec(false)}>Cancelar</button>
                            <button className="dd-btn-primary" disabled={salvando} onClick={gerarRecorrentes}>{salvando?"Gerando...":"Gerar"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Modelo */}
            {modalModelo && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModalModelo(null)}>
                    <div className="dd-modal" style={{ maxWidth:400 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">{modalModelo.modo==="criar"?"Novo Modelo":"Editar Modelo"}</p></div>
                            <button onClick={() => setModalModelo(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={salvarModelo} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            <div>
                                <label className="dd-label">Categoria</label>
                                <select value={formModelo.categoria} onChange={e => setFormModelo(m => ({ ...m, categoria: e.target.value }))}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    {["CONTA_FIXA","FORNECEDOR","OUTRO"].map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
                                </select>
                            </div>
                            {[
                                { k:"descricao", label:"Descrição *", required:true },
                                { k:"valor", label:"Valor (R$) *", type:"number", step:"0.01", required:true },
                                { k:"diaVencimento", label:"Dia de Vencimento (1-31)", type:"number" },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type||"text"} step={f.step} required={f.required} value={formModelo[f.k]||""} onChange={e => setFormModelo(m => ({ ...m, [f.k]: e.target.value }))} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModalModelo(null)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Salvando...":"Salvar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- FIN MOVIMENTACOES ----
function FinMovimentacoes() {
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [resumo, setResumo] = useState({ entradas:0, saidas:0, saldo:0 });
    const [mes, setMes] = useState(mesAtual());
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [pessoas, setPessoas] = useState([]);
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ tipo:"ENTRADA", descricao:"", valor:"", data:"", formaPagamentoId:"", pessoaId:"", observacoes:"" });
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    const carregar = () => {
        const de = mes + "-01";
        const ultimo = new Date(Number(mes.split("-")[0]), Number(mes.split("-")[1]), 0).getDate();
        const ate = mes + "-" + String(ultimo).padStart(2,"0");
        api.get("/fin/movimentacoes", { params: { de, ate } }).then(r => setMovimentacoes(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        api.get("/fin/movimentacoes/resumo", { params: { de, ate } }).then(r => setResumo(r.data || {})).catch(() => {});
    };

    useEffect(() => { carregar(); }, [mes]);
    useEffect(() => {
        api.get("/fin/formas-pagamento", { params: { apenasAtivas: true } }).then(r => setFormasPagamento(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        api.get("/fin/pessoas", { params: { ativo: true } }).then(r => setPessoas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    const abrirModal = () => {
        const hoje = new Date();
        const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
        setForm({ tipo:"ENTRADA", descricao:"", valor:"", dataMovimentacao: dataHoje, formaPagamentoId:"", pessoaId:"", observacoes:"" });
        setModal(true);
    };

    const salvar = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.post("/fin/movimentacoes", { ...form, valor: Number(form.valor), formaPagamentoId: form.formaPagamentoId ? Number(form.formaPagamentoId) : null, pessoaId: form.pessoaId ? Number(form.pessoaId) : null });
            setModal(false);
            flash("Movimentação registrada!");
            carregar();
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const deletar = async id => {
        if (!window.confirm("Remover esta movimentação?")) return;
        try { await api.delete(`/fin/movimentacoes/${id}`); flash("Removida."); carregar(); }
        catch(err) { flash(err.response?.data || "Erro.", "err"); }
    };

    const ff = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <div>
                    <label className="dd-label" style={{ margin:0, marginRight:8 }}>Mês</label>
                    <input type="month" value={mes} onChange={e => setMes(e.target.value)}
                        style={{ border:"1px solid #eaeef2", padding:"6px 10px", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", background:"#fff" }} />
                </div>
                <button className="dd-btn-primary" onClick={abrirModal}>+ Nova Movimentação</button>
            </div>

            {/* KPI cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {[
                    { label:"Entradas", valor: resumo.entradas, cor:"#2d6a4f" },
                    { label:"Saídas",   valor: resumo.saidas,   cor:"#b94040" },
                    { label:"Saldo",    valor: resumo.saldo,    cor: Number(resumo.saldo??0)>=0?"#2d6a4f":"#b94040" },
                ].map(c => (
                    <div key={c.label} className="dd-card" style={{ "--accent": c.cor, padding:"16px 20px" }}>
                        <span className="dd-card-label">{c.label}</span>
                        <div className="dd-card-num" style={{ color: c.cor, fontSize:20, marginTop:6 }}>{fmt(c.valor)}</div>
                    </div>
                ))}
            </div>

            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Movimentações</span>
                    <span className="dd-section-count">{movimentacoes.length}</span>
                </div>
                <div className="dd-table-wrap">
                    <table className="dd-table" style={{ width:"100%" }}>
                        <thead><tr>
                            <th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Forma Pgto</th><th>Pessoa</th><th>Por</th><th></th>
                        </tr></thead>
                        <tbody>
                            {movimentacoes.length === 0 && <tr><td colSpan={8} style={{ textAlign:"center", color:"#9aaa9f", padding:24 }}>Nenhuma movimentação neste mês</td></tr>}
                            {movimentacoes.map(m => (
                                <tr key={m.id}>
                                    <td>{fmtData(m.dataMovimentacao)}</td>
                                    <td><span className="dd-badge" style={{ background: m.tipo==="ENTRADA"?"#f0f5f2":"#fdf0f0", color: m.tipo==="ENTRADA"?"#2d6a4f":"#b94040", borderRadius:3 }}>{m.tipo}</span></td>
                                    <td style={{ fontWeight:500 }}>{m.descricao}</td>
                                    <td style={{ fontWeight:600, color: m.tipo==="ENTRADA"?"#2d6a4f":"#b94040" }}>{fmt(m.valor)}</td>
                                    <td style={{ fontSize:11, color:"#9aaa9f" }}>{m.formaPagamentoNome||"—"}</td>
                                    <td style={{ fontSize:11, color:"#9aaa9f" }}>{m.pessoaNome||"—"}</td>
                                    <td style={{ fontSize:11, color:"#9aaa9f" }}>{m.createdByNome||"—"}</td>
                                    <td><button className="dd-btn-danger" style={{ fontSize:10 }} onClick={() => deletar(m.id)}>Rem.</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal && (
                <div className="dd-modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
                    <div className="dd-modal" style={{ maxWidth:440 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                            <div><p className="dd-modal-title">Nova Movimentação</p><p className="dd-modal-sub">Caixa rápido</p></div>
                            <button onClick={() => setModal(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#9aaa9f" }}><X size={18} /></button>
                        </div>
                        <form onSubmit={salvar} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                            <div>
                                <label className="dd-label">Tipo *</label>
                                <div style={{ display:"flex", gap:16, marginTop:4 }}>
                                    {["ENTRADA","SAIDA"].map(t => (
                                        <label key={t} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer" }}>
                                            <input type="radio" name="tipo" value={t} checked={form.tipo===t} onChange={e => ff("tipo", e.target.value)} />
                                            {t==="ENTRADA"?"Entrada":"Saída"}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {[
                                { k:"descricao", label:"Descrição *", required:true },
                                { k:"valor", label:"Valor (R$) *", type:"number", step:"0.01", required:true },
                                { k:"dataMovimentacao", label:"Data *", type:"date", required:true },
                            ].map(f => (
                                <div key={f.k}>
                                    <label className="dd-label">{f.label}</label>
                                    <div className="dd-input-wrap">
                                        <input className="dd-input" type={f.type||"text"} step={f.step} required={f.required} value={form[f.k]||""} onChange={e => ff(f.k, e.target.value)} />
                                        <div className="dd-input-line" />
                                    </div>
                                </div>
                            ))}
                            <div>
                                <label className="dd-label">Forma de Pagamento (opcional)</label>
                                <select value={form.formaPagamentoId||""} onChange={e => ff("formaPagamentoId", e.target.value)}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">— Não informar —</option>
                                    {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="dd-label">Pessoa / Empresa (opcional)</label>
                                <select value={form.pessoaId||""} onChange={e => ff("pessoaId", e.target.value)}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }}>
                                    <option value="">— Sem pessoa —</option>
                                    {pessoas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="dd-label">Observações</label>
                                <textarea value={form.observacoes||""} onChange={e => ff("observacoes", e.target.value)}
                                    style={{ width:"100%", border:"1px solid #eaeef2", padding:"8px 10px", fontSize:13, fontFamily:"'DM Sans',sans-serif", resize:"vertical", outline:"none", minHeight:56 }} />
                            </div>
                            <div style={{ display:"flex", gap:8, marginTop:8 }}>
                                <button type="button" className="dd-btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                                <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Salvando...":"Registrar"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- FIN CONFIGURACOES ----
function FinConfiguracoes({ anoLetivo }) {
    const [config, setConfig] = useState(null);
    const [formas, setFormas] = useState([]);
    const [series, setSeries] = useState([]);
    const [seriesValores, setSeriesValores] = useState({});
    const [formConfig, setFormConfig] = useState({});
    const [formForma, setFormForma] = useState({ nome:"" });
    const [anoSeries, setAnoSeries] = useState(String(anoLetivo));
    const [msg, setMsg] = useState({ texto:"", tipo:"" });
    const [salvando, setSalvando] = useState(false);

    const flash = (texto, tipo="ok") => { setMsg({ texto, tipo }); setTimeout(() => setMsg({ texto:"", tipo:"" }), 3500); };

    const carregarConfig = () => {
        api.get("/fin/configuracao").then(r => { setConfig(r.data); setFormConfig({ numParcelasPadrao: r.data.numParcelasPadrao||12, jurosMensal: r.data.jurosMensal||0, multaAtraso: r.data.multaAtraso||0, diaVencimentoPadrao: r.data.diaVencimentoPadrao||10 }); }).catch(() => {});
    };
    const carregarFormas = () => {
        api.get("/fin/formas-pagamento").then(r => setFormas(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    };
    const carregarSeriesValores = ano => {
        api.get("/turmas/series").then(async r => {
            const sers = Array.isArray(r.data) ? r.data : [];
            setSeries(sers);
            const res = await api.get("/fin/serie-valores", { params: { anoLetivo: ano } }).catch(() => ({ data: [] }));
            const mapa = {};
            (Array.isArray(res.data) ? res.data : []).forEach(sv => { mapa[sv.serieId] = sv.valor; });
            setSeriesValores(mapa);
        }).catch(() => {});
    };

    useEffect(() => { carregarConfig(); carregarFormas(); carregarSeriesValores(anoSeries); }, []);
    useEffect(() => { carregarSeriesValores(anoSeries); }, [anoSeries]);

    const salvarConfig = async e => {
        e.preventDefault();
        setSalvando(true);
        try {
            await api.put("/fin/configuracao", { ...formConfig, numParcelasPadrao: Number(formConfig.numParcelasPadrao), jurosMensal: Number(formConfig.jurosMensal), multaAtraso: Number(formConfig.multaAtraso), diaVencimentoPadrao: Number(formConfig.diaVencimentoPadrao) });
            flash("Configuração salva!");
            carregarConfig();
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
        finally { setSalvando(false); }
    };

    const criarForma = async e => {
        e.preventDefault();
        try {
            await api.post("/fin/formas-pagamento", formForma);
            setFormForma({ nome:"" });
            carregarFormas();
        } catch(err) { flash(err.response?.data || "Erro ao criar forma.", "err"); }
    };

    const toggleForma = async id => {
        await api.patch(`/fin/formas-pagamento/${id}/status`).catch(() => {});
        carregarFormas();
    };

    const deletarForma = async id => {
        if (!window.confirm("Remover forma de pagamento?")) return;
        await api.delete(`/fin/formas-pagamento/${id}`).catch(err => flash(err.response?.data || "Erro.", "err"));
        carregarFormas();
    };

    const salvarValorSerie = async (serieId, valor) => {
        if (!valor && valor !== 0) return;
        try {
            await api.post("/fin/serie-valores", { serieId: Number(serieId), anoLetivo: Number(anoSeries), valor: Number(valor) });
            flash("Valor salvo!");
        } catch(err) { flash(err.response?.data || "Erro.", "err"); }
    };

    const fc = (k, v) => setFormConfig(f => ({ ...f, [k]: v }));

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {msg.texto && <div className={msg.tipo==="ok"?"dd-ok":"dd-err"}>{msg.texto}</div>}

            {/* Config Global */}
            <div className="dd-section">
                <div className="dd-section-header"><span className="dd-section-title">Configuração Global</span></div>
                <div style={{ padding:24 }}>
                    <form onSubmit={salvarConfig} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                        {[
                            { k:"numParcelasPadrao",  label:"Parcelas Padrão",       type:"number" },
                            { k:"diaVencimentoPadrao",label:"Dia Vencimento Padrão", type:"number" },
                            { k:"jurosMensal",        label:"Juros Mensal (%)",      type:"number", step:"0.01" },
                            { k:"multaAtraso",        label:"Multa por Atraso (%)",  type:"number", step:"0.01" },
                        ].map(f => (
                            <div key={f.k}>
                                <label className="dd-label">{f.label}</label>
                                <div className="dd-input-wrap">
                                    <input className="dd-input" type={f.type} step={f.step} value={formConfig[f.k]??""} onChange={e => fc(f.k, e.target.value)} />
                                    <div className="dd-input-line" />
                                </div>
                            </div>
                        ))}
                        <div style={{ gridColumn:"1/-1", marginTop:4 }}>
                            <button type="submit" className="dd-btn-primary" disabled={salvando}>{salvando?"Salvando...":"Salvar Configuração"}</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Formas de Pagamento</span>
                    <span className="dd-section-count">{formas.length}</span>
                </div>
                <div style={{ padding:"16px 20px" }}>
                    <form onSubmit={criarForma} style={{ display:"flex", gap:8, alignItems:"flex-end", marginBottom:16 }}>
                        <div style={{ flex:1 }}>
                            <label className="dd-label">Nova Forma de Pagamento</label>
                            <div className="dd-input-wrap">
                                <input className="dd-input" value={formForma.nome} onChange={e => setFormForma({ nome: e.target.value })} placeholder="PIX, Dinheiro, Boleto..." required />
                                <div className="dd-input-line" />
                            </div>
                        </div>
                        <button type="submit" className="dd-btn-primary" style={{ fontSize:11 }}>Adicionar</button>
                    </form>
                    <table className="dd-table" style={{ width:"100%" }}>
                        <thead><tr><th>Nome</th><th>Status</th><th></th></tr></thead>
                        <tbody>
                            {formas.length === 0 && <tr><td colSpan={3} style={{ textAlign:"center", color:"#9aaa9f", padding:16 }}>Nenhuma forma de pagamento</td></tr>}
                            {formas.map(f => (
                                <tr key={f.id}>
                                    <td style={{ fontWeight:500 }}>{f.nome}</td>
                                    <td><span style={{ fontSize:10, padding:"2px 8px", background: f.ativo?"#f0f5f2":"#fdf0f0", color: f.ativo?"#2d6a4f":"#b94040", borderRadius:3 }}>{f.ativo?"Ativa":"Inativa"}</span></td>
                                    <td><div style={{ display:"flex", gap:6 }}>
                                        <button className={f.ativo?"dd-btn-toggle-on":"dd-btn-toggle-off"} style={{ fontSize:10 }} onClick={() => toggleForma(f.id)}>{f.ativo?"Desativar":"Ativar"}</button>
                                        <button className="dd-btn-danger" style={{ fontSize:10 }} onClick={() => deletarForma(f.id)}>Rem.</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Valores por Série */}
            <div className="dd-section">
                <div className="dd-section-header">
                    <span className="dd-section-title">Valores de Mensalidade por Série</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <label className="dd-label" style={{ margin:0 }}>Ano Letivo</label>
                        <input type="number" value={anoSeries} onChange={e => setAnoSeries(e.target.value)}
                            style={{ width:80, border:"1px solid #eaeef2", padding:"4px 8px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" }} />
                    </div>
                </div>
                <div style={{ padding:"16px 20px" }}>
                    <table className="dd-table" style={{ width:"100%" }}>
                        <thead><tr><th>Série</th><th>Valor Mensal (R$)</th><th></th></tr></thead>
                        <tbody>
                            {series.length === 0 && <tr><td colSpan={3} style={{ textAlign:"center", color:"#9aaa9f", padding:16 }}>Nenhuma série encontrada</td></tr>}
                            {series.map(s => {
                                const val = seriesValores[s.id] ?? "";
                                return (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight:500 }}>{s.nome}</td>
                                        <td>
                                            <input type="number" step="0.01" defaultValue={val}
                                                id={`sv-${s.id}`}
                                                style={{ width:140, border:"1px solid #eaeef2", padding:"6px 8px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none" }}
                                                placeholder="Não definido" />
                                        </td>
                                        <td>
                                            <button className="dd-btn-edit" style={{ fontSize:10 }}
                                                onClick={() => {
                                                    const el = document.getElementById(`sv-${s.id}`);
                                                    if (el && el.value) salvarValorSerie(s.id, el.value);
                                                }}>Salvar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
