import { useState, useEffect } from "react";
import axios from "axios";
import {
    Home, BookOpen, LogOut, GraduationCap,
    Menu, ChevronRight, Search, X, UserPlus, ArrowLeft, CalendarDays
} from "lucide-react";

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

@media (max-width: 767px) {
  .pd-sidebar {
    position: fixed !important;
    top: 0; left: 0; bottom: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform .25s ease;
    width: 210px !important;
  }
  .pd-sidebar.open { transform: translateX(0); }
  .pd-hamburger { display: flex !important; }
  .pd-header { padding: 14px 16px !important; }
  .pd-main { padding: 16px !important; }
  .pd-modal { max-width: 100% !important; padding: 20px !important; }
  .pd-section { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .pd-table { min-width: 480px; }
}
`;

// ── Helpers ────────────────────────────────────────────────────
function flash(setMsg, texto, tipo = "ok") {
    setMsg({ texto, tipo });
    setTimeout(() => setMsg({ texto: "", tipo: "" }), 3000);
}

// ── SearchSelect reutilizável ──────────────────────────────────
function SearchSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const ref = { current: null };
    const selected = options.find(o => String(o.value) === String(value));
    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(""); } };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    return (
        <div ref={el => ref.current = el} style={{ flex:1, position:"relative" }}>
            <button type="button" onClick={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setCoords({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX, width: r.width });
                setOpen(p => !p);
            }} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
                border:`1px solid ${open ? "#0d1f18" : "#eaeef2"}`, padding:"8px 12px", background:"white",
                color: selected ? "#0d1f18" : "#9aaa9f", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }}>
                    <path d="M2 4l4 4 4-4" stroke="#9aaa9f" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
            </button>
            {open && (
                <div style={{ position:"fixed", top:coords.top, left:coords.left, width:coords.width, zIndex:9999,
                    background:"white", border:"1px solid #eaeef2", boxShadow:"0 8px 32px rgba(13,31,24,.12)", overflow:"hidden" }}>
                    <div style={{ padding:8, borderBottom:"1px solid #eaeef2" }}>
                        <div style={{ position:"relative" }}>
                            <Search size={12} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:"#9aaa9f" }} />
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                                   placeholder="Buscar..." onClick={e => e.stopPropagation()}
                                   style={{ width:"100%", padding:"6px 8px 6px 26px", border:"1px solid #eaeef2",
                                       fontSize:12, outline:"none", fontFamily:"'DM Sans',sans-serif", color:"#0d1f18" }} />
                        </div>
                    </div>
                    <div style={{ maxHeight:200, overflowY:"auto" }}>
                        {filtered.length === 0
                            ? <p style={{ padding:"12px 16px", fontSize:12, color:"#9aaa9f", textAlign:"center" }}>Nenhum resultado</p>
                            : filtered.map(o => {
                                const active = String(o.value) === String(value);
                                return (
                                    <button key={o.value} type="button"
                                            onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                            style={{ width:"100%", textAlign:"left", padding:"10px 16px", fontSize:13,
                                                background: active ? "#f0f5f2" : "transparent", color: active ? "#1a4d3a" : "#0d1f18",
                                                fontWeight: active ? 500 : 400, border:"none", cursor:"pointer",
                                                display:"flex", alignItems:"center", gap:8, fontFamily:"'DM Sans',sans-serif" }}>
                                        {active && <div style={{ width:6, height:6, background:"#7ec8a0", flexShrink:0 }} />}
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

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ProfessorDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const nome = localStorage.getItem("nome") || "Professor";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    const menu = [
        { id:"inicio",     label:"Início",      icon:Home },
        { id:"notas",      label:"Lançar Notas", icon:BookOpen },
        { id:"presenca",   label:"Chamada",      icon:GraduationCap },
        { id:"horarios",   label:"Horários",     icon:CalendarDays },
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

                    <main className="pd-main" style={{ flex:1, padding:"28px 32px" }}>
                        {aba === "inicio"   && <Inicio />}
                        {aba === "notas"    && <LancarNotas />}
                        {aba === "presenca" && <Chamada />}
                        {aba === "horarios" && <HorariosView />}
                    </main>
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════
// INÍCIO — visão geral das turmas do professor
// ═══════════════════════════════════════════════════════════════
function Inicio() {
    const [vinculos, setVinculos] = useState([]);

    useEffect(() => {
        api.get("/vinculos/professor-turma-materia/minhas").then(r => setVinculos(r.data || []));
    }, []);

    // Agrupa por turma
    const porTurma = vinculos.reduce((acc, v) => {
        const key = v.turma?.id;
        if (!acc[key]) acc[key] = { turma: v.turma, materias: [] };
        acc[key].materias.push(v.materia);
        return acc;
    }, {});

    const turmas = Object.values(porTurma);

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            {/* Resumo */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                    { label:"Turmas", value: turmas.length, accent:"#0d1f18" },
                    { label:"Matérias", value: vinculos.length, accent:"#2d6a4f" },
                    { label:"Aulas / semana", value:"—", accent:"#7ec8a0" },
                ].map(c => (
                    <div key={c.label} className="pd-section" style={{ borderTop:`2px solid ${c.accent}`, padding:"20px" }}>
                        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, color:"#0d1f18", lineHeight:1 }}>{c.value}</p>
                        <p style={{ fontSize:11, letterSpacing:".06em", textTransform:"uppercase", color:"#9aaa9f", marginTop:4 }}>{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Turmas */}
            <div className="pd-section">
                <div className="pd-section-header">
                    <span className="pd-section-title">Minhas Turmas</span>
                    <span className="pd-section-count">{turmas.length} turma(s)</span>
                </div>
                {turmas.length === 0
                    ? <p style={{ padding:"40px", textAlign:"center", fontSize:13, color:"#9aaa9f" }}>
                        Nenhuma turma vinculada. Solicite à direção.
                    </p>
                    : <table className="pd-table">
                        <thead>
                        <tr>
                            <th>Turma</th>
                            <th>Série</th>
                            <th>Matérias que leciona</th>
                        </tr>
                        </thead>
                        <tbody>
                        {turmas.map(({ turma, materias }) => (
                            <tr key={turma?.id}>
                                <td style={{ fontWeight:500 }}>{turma?.nome}</td>
                                <td style={{ color:"#9aaa9f" }}>{turma?.serie?.nome}</td>
                                <td>
                                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                        {materias.map(m => (
                                            <span key={m?.id} className="pd-badge"
                                                  style={{ background:"#f0f5f2", color:"#2d6a4f" }}>
                                                {m?.nome}
                                            </span>
                                        ))}
                                    </div>
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

// ═══════════════════════════════════════════════════════════════
// LANÇAR NOTAS
// ═══════════════════════════════════════════════════════════════
function LancarNotas() {
    const [vinculos, setVinculos] = useState([]);
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

    useEffect(() => {
        api.get("/vinculos/professor-turma-materia/minhas").then(r => setVinculos(r.data || []));
    }, []);

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
        const init = {};
        av.notas.forEach(n => init[n.alunoId] = String(n.valor));
        setNotasEdit(init);
    };

    const criarAvaliacao = async (e) => {
        e.preventDefault();
        try {
            await api.post("/notas/avaliacao", { turmaId: String(turmaId), materiaId: String(materiaId), ...formAv, bimestre: formAv.bimestre });
            flash(setMsg, "Avaliação criada!");
            setCriandoAv(false);
            setFormAv({ tipo:"PROVA", descricao:"", peso:"1.0", bonificacao:false, bimestre:"1" });
            const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
            setAvaliacoes(r.data || []);
        } catch { flash(setMsg, "Erro ao criar avaliação.", "erro"); }
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
        flash(setMsg, erros > 0 ? `${erros} erro(s) ao salvar.` : "Notas salvas!", erros > 0 ? "erro" : "ok");
        const r = await api.get("/notas/avaliacoes", { params: { turmaId, materiaId } });
        setAvaliacoes(r.data || []);
        if (avaliacaoSel) {
            const updated = (r.data || []).find(a => a.id === avaliacaoSel.id);
            if (updated) selecionarAv(updated);
        }
    };

    const tipoLabel = { PROVA:"Prova", TRABALHO:"Trabalho", SIMULADO:"Bônus" };
    const tipoColor = { PROVA:{ bg:"#f0f5f2", color:"#2d6a4f" }, TRABALHO:{ bg:"#f5f3ee", color:"#7a5c2e" }, SIMULADO:{ bg:"#f0f0f8", color:"#4a4a8a" } };

    const semSelecao = !turmaId || !materiaId;

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Seletor */}
            <div className="pd-section" style={{ padding:24 }}>
                <p className="pd-section-title" style={{ marginBottom:20 }}>Selecionar Turma e Matéria</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                        <label className="pd-label">Turma</label>
                        <SearchSelect
                            options={turmas.map(t => ({ value: t.id, label: `${t.nome} — ${t.serie?.nome || ""}` }))}
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
                                                Peso {av.peso} · {av.dataAplicacao || "sem data"}
                                                {av.bonificacao && " · ✦ Bônus"}
                                            </p>
                                        </div>
                                        <span style={{ fontSize:11, color:"#9aaa9f" }}>
                                            {av.notas.length}/{alunos.length} notas
                                        </span>
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
                                        {avaliacaoSel.bonificacao
                                            ? "Bônus — valor entre 0.00 e 1.00"
                                            : `Peso ${avaliacaoSel.peso} — nota de 0 a 10`}
                                    </p>
                                </div>
                                <button className="pd-btn-primary" onClick={salvarNotas} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar Notas →"}
                                </button>
                            </div>
                            <table className="pd-table">
                                <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th style={{ width:200 }}>Nota {avaliacaoSel.bonificacao ? "(0.00–1.00)" : "(0–10)"}</th>
                                    <th style={{ width:100 }}>Status</th>
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
                                                       onChange={e => setNotasEdit(p => ({ ...p, [aluno.id]: e.target.value }))}
                                                       placeholder="—"
                                                       className="pd-input"
                                                       style={{ width:120, fontSize:16, fontFamily:"'Playfair Display',serif", fontWeight:700 }} />
                                            </td>
                                            <td>
                                                {temNota
                                                    ? <span className="pd-badge" style={{ background:"#f0f5f2", color:"#2d6a4f" }}>Lançada</span>
                                                    : <span className="pd-badge" style={{ background:"#f5f3ee", color:"#7a5c2e" }}>Pendente</span>
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

            {/* Modal nova avaliação */}
            {criandoAv && (
                <div className="pd-modal-overlay">
                    <div className="pd-modal">
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
                            <div>
                                <p className="pd-modal-title">Nova Avaliação</p>
                                <p className="pd-modal-sub">
                                    {turmas.find(t => String(t.id)===String(turmaId))?.nome} · {materiasDaTurma.find(m => String(m.id)===String(materiaId))?.nome}
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
                                <div style={{ display:"flex" }}>
                                    {["PROVA","TRABALHO","SIMULADO"].map((t, i) => (
                                        <button key={t} type="button"
                                                onClick={() => setFormAv(p => ({ ...p, tipo:t, bonificacao: t==="SIMULADO" }))}
                                                style={{ flex:1, padding:"9px", border:"1px solid #eaeef2",
                                                    borderRight: i < 2 ? "none" : "1px solid #eaeef2",
                                                    background: formAv.tipo===t ? "#0d1f18" : "white",
                                                    color: formAv.tipo===t ? "#7ec8a0" : "#9aaa9f",
                                                    fontSize:11, fontWeight:500, letterSpacing:".06em",
                                                    textTransform:"uppercase", cursor:"pointer" }}>
                                            {t==="SIMULADO" ? "Bônus" : t}
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
                            {formAv.tipo !== "SIMULADO" && (
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
                            <div style={{ display:"flex", gap:8, marginTop:4 }}>
                                <button type="button" onClick={() => setCriandoAv(false)} className="pd-btn-ghost" style={{ flex:1 }}>Cancelar</button>
                                <button type="submit" className="pd-btn-primary" style={{ flex:1 }}>Criar →</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// CHAMADA (PRESENÇA)
// ═══════════════════════════════════════════════════════════════
function Chamada() {
    const [vinculos, setVinculos] = useState([]);
    const [turmaId, setTurmaId] = useState("");
    const [materiaId, setMateriaId] = useState("");
    const [alunos, setAlunos] = useState([]);
    const [dataAula, setDataAula] = useState(new Date().toISOString().slice(0,10));
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

    useEffect(() => {
        api.get("/vinculos/professor-turma-materia/minhas").then(r => setVinculos(r.data || []));
    }, []);

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
        api.get(`/horarios/turma/${turmaId}/dia/${diaSemana}`)
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
                            options={turmas.map(t => ({ value: t.id, label: `${t.nome} — ${t.serie?.nome || ""}` }))}
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
                                    <span className="pd-section-title">{idx + 1}ª Aula — {aula.horarioInicio}</span>
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
// HORÁRIOS — Visualização (somente leitura)
// ═══════════════════════════════════════════════════════════════
const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DIAS_LABEL = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };

function HorariosView() {
    const [horarios, setHorarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroTurma, setFiltroTurma] = useState("todas");

    useEffect(() => {
        setLoading(true);
        api.get("/horarios/minhas")
            .then(r => setHorarios(r.data || []))
            .finally(() => setLoading(false));
    }, []);

    const turmaIds = [...new Set(horarios.map(h => h.turmaId))];

    const turmasFiltradas = filtroTurma === "todas"
        ? turmaIds
        : turmaIds.filter(id => String(id) === String(filtroTurma));

    const horariosUsados = [...new Set(horarios.map(h => h.horarioInicio))].sort();

    const getSlot = (turmaId, dia, ordem) => {
        return horarios.find(
            h => h.turmaId === turmaId && h.diaSemana === dia && h.ordemAula === ordem
        );
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
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", color: "#9aaa9f" }}>
                        Filtrar turma:
                    </label>
                    <select
                        value={filtroTurma}
                        onChange={e => setFiltroTurma(e.target.value)}
                        style={{
                            fontSize: 12, padding: "6px 12px", border: "1px solid #eaeef2",
                            fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#0d1f18",
                            background: "white",
                        }}
                    >
                        <option value="todas">Todas as minhas turmas</option>
                        {turmaIds.map(id => (
                            <option key={id} value={id}>{horarios.find(h => h.turmaId === id)?.turmaNome || `Turma ${id}`}</option>
                        ))}
                    </select>
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
                                            {horarios.find(h => h.turmaId === tid)?.turmaNome || `Turma ${tid}`}
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