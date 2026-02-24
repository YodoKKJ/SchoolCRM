import { useState, useEffect } from "react";
import axios from "axios";
import {
    Home, Users, School, BookOpen, LogOut,
    GraduationCap, UserCheck, LayoutGrid, BookMarked, Menu,
    Trash2, Pencil, ArrowLeft, UserPlus, ChevronDown, Search, X
} from "lucide-react";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return config;
});

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

const menuItems = [
    { id: "inicio", label: "Início", icon: Home },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "turmas", label: "Turmas", icon: School },
    { id: "materias", label: "Matérias", icon: BookOpen },
];

// ---- SEARCH SELECT ----
function SearchSelect({ options, value, onChange, placeholder }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const divRef = { current: null };

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
                        border: `1px solid ${open ? C.primary : C.border}`,
                        borderRadius: "8px",
                        padding: "8px 12px",
                        background: "white",
                        color: selected ? C.text : C.textMuted,
                    }}>
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown size={14} color={C.textMuted}
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
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(26,117,159,0.15)",
                    overflow: "hidden",
                }}>
                    <div className="p-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: C.bg }}>
                            <Search size={13} color={C.textMuted} />
                            <input autoFocus placeholder="Buscar..." value={search}
                                   onChange={e => setSearch(e.target.value)}
                                   className="flex-1 text-xs outline-none bg-transparent"
                                   style={{ color: C.text }}
                                   onClick={e => e.stopPropagation()} />
                        </div>
                    </div>
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        {filtered.length === 0 && (
                            <p className="px-4 py-3 text-xs text-center" style={{ color: C.textMuted }}>Nenhum resultado</p>
                        )}
                        {filtered.map(o => {
                            const active = String(o.value) === String(value);
                            return (
                                <button key={o.value} type="button"
                                        onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                        className="w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2"
                                        style={{
                                            color: active ? C.primary : C.text,
                                            background: active ? `${C.primary}10` : "transparent",
                                            fontWeight: active ? 600 : 400,
                                        }}>
                                    {active && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.primary }} />}
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
export default function DirecaoDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const nome = localStorage.getItem("nome") || "Direção";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    return (
        <div className="flex min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
            {sidebarAberta && (
                <div className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
                     onClick={() => setSidebarAberta(false)} />
            )}

            <aside className={`fixed z-30 top-0 left-0 h-screen w-52 flex flex-col transition-transform duration-300
                ${sidebarAberta ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:sticky md:top-0`}
                   style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}>

                <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                         style={{ background: `linear-gradient(135deg, ${C.primaryLight}, ${C.primary})` }}>
                        <GraduationCap size={16} color="white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-none" style={{ color: C.primaryDark }}>DomGestão</p>
                        <p className="text-xs mt-0.5" style={{ color: C.primaryLight }}>Direção</p>
                    </div>
                </div>

                <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                         style={{ background: C.primary }}>
                        {nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: C.text }}>{nome}</p>
                        <p className="text-xs" style={{ color: C.textMuted }}>Administrador</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
                    {menuItems.map(item => {
                        const Icon = item.icon;
                        const active = aba === item.id;
                        return (
                            <button key={item.id}
                                    onClick={() => { setAba(item.id); setSidebarAberta(false); }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left transition-all"
                                    style={{
                                        background: active ? `${C.primary}15` : "transparent",
                                        color: active ? C.primary : C.textMuted,
                                        borderLeft: active ? `3px solid ${C.primary}` : "3px solid transparent",
                                    }}>
                                <Icon size={16} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="px-3 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
                    <button onClick={logout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left transition-all hover:bg-red-50"
                            style={{ color: C.textMuted }}>
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
                        style={{ background: "white", borderBottom: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-3">
                        <button className="md:hidden" onClick={() => setSidebarAberta(true)}>
                            <Menu size={20} color={C.text} />
                        </button>
                        <div>
                            <h1 className="text-sm font-semibold" style={{ color: C.text }}>
                                {menuItems.find(m => m.id === aba)?.label}
                            </h1>
                            <p className="text-xs" style={{ color: C.textMuted }}>DomGestão — Sistema Escolar</p>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                         style={{ background: C.primary }}>
                        {nome.charAt(0).toUpperCase()}
                    </div>
                </header>

                <main className="flex-1 p-6">
                    {aba === "inicio" && <Inicio />}
                    {aba === "usuarios" && <Usuarios />}
                    {aba === "turmas" && <Turmas />}
                    {aba === "materias" && <Materias />}
                </main>
            </div>
        </div>
    );
}

// ---- INÍCIO ----
function Inicio() {
    const [stats, setStats] = useState({ alunos: 0, professores: 0, turmas: 0, materias: 0 });
    const [usuarios, setUsuarios] = useState([]);

    useEffect(() => {
        Promise.all([api.get("/usuarios"), api.get("/turmas"), api.get("/materias")])
            .then(([u, t, m]) => {
                setUsuarios(u.data);
                setStats({
                    alunos: u.data.filter(x => x.role === "ALUNO").length,
                    professores: u.data.filter(x => x.role === "PROFESSOR").length,
                    turmas: t.data.length,
                    materias: m.data.length,
                });
            });
    }, []);

    const cards = [
        { label: "Alunos", value: stats.alunos, icon: GraduationCap, color: "#1A759F" },
        { label: "Professores", value: stats.professores, icon: UserCheck, color: "#52B69A" },
        { label: "Turmas", value: stats.turmas, icon: LayoutGrid, color: "#168AAD" },
        { label: "Matérias", value: stats.materias, icon: BookMarked, color: "#1E6091" },
    ];

    const roleColor = (role) => ({
        bg: role === "ALUNO" ? "#e8f4fd" : role === "PROFESSOR" ? "#e8f8f2" : "#e8f0f8",
        text: role === "ALUNO" ? "#1A759F" : role === "PROFESSOR" ? "#52B69A" : "#1E6091",
    });

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(card => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white rounded-xl p-5 flex items-center gap-4"
                             style={{ border: `1px solid ${C.border}`, borderTop: `3px solid ${card.color}` }}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                 style={{ background: `${card.color}15` }}>
                                <Icon size={18} color={card.color} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: C.text }}>{card.value}</p>
                                <p className="text-xs" style={{ color: C.textMuted }}>{card.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Usuários Recentes</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>{usuarios.length} registros</span>
                </div>
                <table className="w-full">
                    <thead>
                    <tr style={{ background: "#f8fafb", borderBottom: `1px solid ${C.border}` }}>
                        {["Nome", "Login", "Perfil"].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                style={{ color: C.textMuted }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.slice(0, 8).map((u, i) => {
                        const rc = roleColor(u.role);
                        return (
                            <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                             style={{ background: rc.text }}>{u.nome.charAt(0)}</div>
                                        <span className="text-sm font-medium" style={{ color: C.text }}>{u.nome}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-sm" style={{ color: C.textMuted }}>{u.login}</td>
                                <td className="px-5 py-3">
                                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                              style={{ background: rc.bg, color: rc.text }}>{u.role}</span>
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
    const [editando, setEditando] = useState(null); // usuário sendo editado
    const [formEdit, setFormEdit] = useState({ nome: "", login: "", senha: "" });
    const [msgEdit, setMsgEdit] = useState({ texto: "", tipo: "" });

    const carregar = () => {
        api.get("/usuarios").then(r => {
            const data = Array.isArray(r.data) ? r.data : [];
            setUsuarios(data);
        });
    };

    useEffect(() => { carregar(); }, []);

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
            const msg = err.response?.data || "Erro ao atualizar.";
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

    const inputStyle = {
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "13px",
        outline: "none",
        width: "100%",
        color: C.text,
    };

    const roleColor = (role) => ({
        bg: role === "ALUNO" ? "#e8f4fd" : role === "PROFESSOR" ? "#e8f8f2" : "#e8f0f8",
        text: role === "ALUNO" ? "#1A759F" : role === "PROFESSOR" ? "#52B69A" : "#1E6091",
    });

    return (
        <div className="flex flex-col gap-5">

            {/* Modal de edição */}
            {editando && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-base font-bold" style={{ color: C.text }}>Editar Usuário</p>
                                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{editando.role}</p>
                            </div>
                            <button onClick={() => setEditando(null)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                                    style={{ color: C.textMuted }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={salvarEdicao} className="flex flex-col gap-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: C.textMuted }}>Nome</label>
                                <input type="text" value={formEdit.nome}
                                       onChange={e => setFormEdit({ ...formEdit, nome: e.target.value })}
                                       style={inputStyle} placeholder="Nome completo" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: C.textMuted }}>Login</label>
                                <input type="text" value={formEdit.login}
                                       onChange={e => setFormEdit({ ...formEdit, login: e.target.value })}
                                       style={inputStyle} placeholder="Login" />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: C.textMuted }}>
                                    Nova Senha <span style={{ color: C.textMuted, fontWeight: 400 }}>(deixe em branco para não alterar)</span>
                                </label>
                                <input type="password" value={formEdit.senha}
                                       onChange={e => setFormEdit({ ...formEdit, senha: e.target.value })}
                                       style={inputStyle} placeholder="••••••••" />
                            </div>

                            {msgEdit.texto && (
                                <p className="text-xs px-3 py-2 rounded-lg"
                                   style={{ background: msgEdit.tipo === "ok" ? "#e8f8f2" : "#fde8e8", color: msgEdit.tipo === "ok" ? "#52B69A" : "#e53e3e" }}>
                                    {msgEdit.texto}
                                </p>
                            )}

                            <div className="flex gap-2 mt-1">
                                <button type="button" onClick={() => setEditando(null)}
                                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
                                        style={{ background: "#f1f5f9", color: C.textMuted }}>
                                    Cancelar
                                </button>
                                <button type="submit"
                                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition"
                                        style={{ background: C.primary }}>
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Formulário cadastro */}
            <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.border}` }}>
                <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Novo Usuário</p>
                <form onSubmit={cadastrar} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { key: "nome", placeholder: "Nome completo", type: "text" },
                        { key: "login", placeholder: "Login", type: "text" },
                        { key: "senha", placeholder: "Senha", type: "password" },
                    ].map(f => (
                        <input key={f.key} type={f.type} placeholder={f.placeholder}
                               value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                               style={inputStyle} />
                    ))}
                    <SearchSelect
                        options={[
                            { value: "ALUNO", label: "Aluno" },
                            { value: "PROFESSOR", label: "Professor" },
                            { value: "DIRECAO", label: "Direção" },
                        ]}
                        value={form.role}
                        onChange={v => setForm({ ...form, role: v })}
                        placeholder="Selecione o perfil..." />
                    <button type="submit" className="md:col-span-4 py-2.5 rounded-lg text-sm font-semibold text-white transition"
                            style={{ background: C.primary }}>
                        Cadastrar Usuário
                    </button>
                </form>
                {msg.texto && (
                    <p className="mt-3 text-xs px-3 py-2 rounded-lg"
                       style={{ background: msg.tipo === "ok" ? "#e8f8f2" : "#fde8e8", color: msg.tipo === "ok" ? "#52B69A" : "#e53e3e" }}>
                        {msg.texto}
                    </p>
                )}
            </div>

            {/* Tabela de usuários */}
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Todos os Usuários</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>{usuarios.length} registros</span>
                </div>
                <table className="w-full">
                    <thead>
                    <tr style={{ background: "#f8fafb", borderBottom: `1px solid ${C.border}` }}>
                        {["Nome", "Login", "Perfil", "Status", ""].map((h, i) => (
                            <th key={i} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                style={{ color: C.textMuted }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map((u, i) => {
                        const rc = roleColor(u.role);
                        const inativo = !u.ativo;
                        return (
                            <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}`, background: inativo ? "#fafafa" : (i % 2 === 0 ? "white" : "#fafbfc"), opacity: inativo ? 0.6 : 1 }}>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                             style={{ background: inativo ? "#aaa" : rc.text }}>{u.nome.charAt(0)}</div>
                                        <span className="text-sm font-medium" style={{ color: inativo ? C.textMuted : C.text }}>{u.nome}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-sm" style={{ color: C.textMuted }}>{u.login}</td>
                                <td className="px-5 py-3">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                          style={{ background: rc.bg, color: rc.text }}>{u.role}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                          style={{ background: u.ativo ? "#e8f8f2" : "#fde8e8", color: u.ativo ? "#52B69A" : "#e53e3e" }}>
                                        {u.ativo ? "Ativo" : "Inativo"}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button onClick={() => abrirEdicao(u)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                                                style={{ background: "#e8f4fd", color: C.primary }}>
                                            <Pencil size={12} /> Editar
                                        </button>
                                        <button onClick={() => toggleStatus(u)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                                                style={{ background: u.ativo ? "#fde8e8" : "#e8f8f2", color: u.ativo ? "#e53e3e" : "#52B69A" }}>
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
    const [formTurma, setFormTurma] = useState({ nome: "", serieId: "", anoLetivo: "2026" });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });
    const [turmaSelecionada, setTurmaSelecionada] = useState(null);

    const carregar = () => {
        api.get("/turmas").then(r => {
            const data = Array.isArray(r.data) ? r.data : [];
            setTurmas(data);
        });
        api.get("/turmas/series").then(r => {
            const data = Array.isArray(r.data) ? r.data : [];
            setSeries(data);
        });
    };
    useEffect(() => { carregar(); }, []);

    const inputStyle = { border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", outline: "none", width: "100%", color: C.text };
    const btnStyle = { background: C.primary, color: "white", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" };

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
        <div className="flex flex-col gap-5">
            {msg.texto && (
                <div className="text-sm px-4 py-3 rounded-lg"
                     style={{ background: msg.tipo === "ok" ? "#e8f8f2" : "#fde8e8", color: msg.tipo === "ok" ? "#52B69A" : "#e53e3e" }}>
                    {msg.texto}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.border}` }}>
                    <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Nova Série</p>
                    <form onSubmit={async e => {
                        e.preventDefault();
                        await api.post("/turmas/series", formSerie);
                        setFormSerie({ nome: "" });
                        carregar();
                    }} className="flex gap-2">
                        <input placeholder="Ex: 1º Ano" value={formSerie.nome}
                               onChange={e => setFormSerie({ nome: e.target.value })} style={inputStyle} />
                        <button type="submit" style={btnStyle}>Adicionar</button>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {series.map(s => (
                            <div key={s.id} className="flex items-center gap-1 rounded-full pr-1"
                                 style={{ background: "#e8f4fd" }}>
                                <span className="text-xs px-3 py-1.5 font-medium" style={{ color: C.primary }}>{s.nome}</span>
                                <button onClick={() => excluirSerie(s)}
                                        className="w-4 h-4 rounded-full flex items-center justify-center transition hover:opacity-70"
                                        style={{ background: `${C.primary}25`, color: C.primary }}>
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.border}` }}>
                    <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Nova Turma</p>
                    <form onSubmit={async e => {
                        e.preventDefault();
                        try {
                            await api.post("/turmas", formTurma);
                            setMsg({ texto: "Turma cadastrada!", tipo: "ok" });
                            setFormTurma({ nome: "", serieId: "", anoLetivo: "2026" });
                            carregar();
                        } catch { setMsg({ texto: "Erro ao cadastrar.", tipo: "erro" }); }
                    }} className="flex flex-col gap-3">
                        <input placeholder="Nome da turma" value={formTurma.nome}
                               onChange={e => setFormTurma({ ...formTurma, nome: e.target.value })} style={inputStyle} />
                        <SearchSelect
                            options={series.map(s => ({ value: s.id, label: s.nome }))}
                            value={formTurma.serieId}
                            onChange={v => setFormTurma({ ...formTurma, serieId: v })}
                            placeholder="Selecione a série..." />
                        <button type="submit" style={{ ...btnStyle, padding: "10px", width: "100%" }}>Cadastrar Turma</button>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Turmas Cadastradas</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>{turmas.length} turmas</span>
                </div>
                <table className="w-full">
                    <thead>
                    <tr style={{ background: "#f8fafb", borderBottom: `1px solid ${C.border}` }}>
                        {["Turma", "Série", "Ano Letivo", ""].map((h, i) => (
                            <th key={i} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                style={{ color: C.textMuted }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {turmas.map((t, i) => (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                            <td className="px-5 py-3 text-sm font-medium" style={{ color: C.text }}>{t.nome}</td>
                            <td className="px-5 py-3">
                                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                          style={{ background: "#e8f4fd", color: C.primary }}>{t.serie?.nome}</span>
                            </td>
                            <td className="px-5 py-3 text-sm" style={{ color: C.textMuted }}>{t.anoLetivo}</td>
                            <td className="px-5 py-3 text-right">
                                <div className="flex items-center gap-2 justify-end">
                                    <button onClick={() => setTurmaSelecionada(t)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                                            style={{ background: "#e8f4fd", color: C.primary }}>
                                        <Pencil size={12} /> Gerenciar
                                    </button>
                                    <button onClick={() => excluirTurma(t)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                                            style={{ background: "#fde8e8", color: "#e53e3e" }}>
                                        <Trash2 size={12} />
                                    </button>
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

    const carregar = () => {
        api.get(`/vinculos/aluno-turma/turma/${turma.id}`).then(r => setVinculosAluno(r.data));
        api.get(`/vinculos/professor-turma-materia/turma/${turma.id}`).then(r => setVinculosProf(r.data));
    };

    useEffect(() => {
        api.get("/usuarios").then(r => {
            setTodosAlunos(r.data.filter(u => u.role === "ALUNO"));
            setTodosProfessores(r.data.filter(u => u.role === "PROFESSOR"));
        });
        api.get("/materias").then(r => setTodasMaterias(r.data));
        carregar();
    }, []);

    const btnPrimary = { background: C.primary, color: "white", borderRadius: "8px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, flexShrink: 0 };
    const btnDanger = { background: "#fde8e8", color: "#e53e3e", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: 500 };

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

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
                <button onClick={onVoltar}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                        style={{ background: "#e8f4fd", color: C.primary }}>
                    <ArrowLeft size={14} /> Voltar
                </button>
                <div>
                    <h2 className="text-base font-bold" style={{ color: C.text }}>Gerenciar: {turma.nome}</h2>
                    <p className="text-xs" style={{ color: C.textMuted }}>{turma.serie?.nome} — {turma.anoLetivo}</p>
                </div>
            </div>

            {msg.texto && (
                <div className="text-sm px-4 py-3 rounded-lg"
                     style={{ background: msg.tipo === "ok" ? "#e8f8f2" : "#fde8e8", color: msg.tipo === "ok" ? "#52B69A" : "#e53e3e" }}>
                    {msg.texto}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl" style={{ border: `1px solid ${C.border}` }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>Alunos da Turma</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#e8f4fd", color: C.primary }}>
                            {vinculosAluno.length} alunos
                        </span>
                    </div>
                    <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <form onSubmit={vincularAluno} className="flex gap-2">
                            <SearchSelect
                                options={alunosDisponiveis}
                                value={formAluno.alunoId}
                                onChange={v => setFormAluno({ alunoId: v })}
                                placeholder="Buscar aluno..." />
                            <button type="submit" style={btnPrimary}><UserPlus size={14} /></button>
                        </form>
                    </div>
                    <div>
                        {vinculosAluno.length === 0 && (
                            <p className="px-5 py-6 text-sm text-center" style={{ color: C.textMuted }}>Nenhum aluno vinculado</p>
                        )}
                        {vinculosAluno.map(v => (
                            <div key={v.aluno?.id} className="px-5 py-3 flex items-center justify-between"
                                 style={{ borderBottom: `1px solid ${C.border}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                         style={{ background: C.primary }}>{v.aluno?.nome?.charAt(0)}</div>
                                    <span className="text-sm" style={{ color: C.text }}>{v.aluno?.nome}</span>
                                </div>
                                <button onClick={() => removerAluno(v)} style={btnDanger}
                                        className="flex items-center gap-1 hover:opacity-80 transition">
                                    <Trash2 size={11} /> Remover
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl" style={{ border: `1px solid ${C.border}` }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>Professores da Turma</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#e8f8f2", color: C.primaryLight }}>
                            {vinculosProf.length} professores
                        </span>
                    </div>
                    <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <form onSubmit={vincularProf} className="flex flex-col gap-2">
                            <SearchSelect
                                options={todosProfessores.map(p => ({ value: p.id, label: p.nome }))}
                                value={formProf.professorId}
                                onChange={v => setFormProf({ ...formProf, professorId: v })}
                                placeholder="Buscar professor..." />
                            <div className="flex gap-2">
                                <SearchSelect
                                    options={todasMaterias.map(m => ({ value: m.id, label: m.nome }))}
                                    value={formProf.materiaId}
                                    onChange={v => setFormProf({ ...formProf, materiaId: v })}
                                    placeholder="Selecionar matéria..." />
                                <button type="submit" style={btnPrimary}><UserPlus size={14} /></button>
                            </div>
                        </form>
                    </div>
                    <div>
                        {vinculosProf.length === 0 && (
                            <p className="px-5 py-6 text-sm text-center" style={{ color: C.textMuted }}>Nenhum professor vinculado</p>
                        )}
                        {vinculosProf.map((v, i) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between"
                                 style={{ borderBottom: `1px solid ${C.border}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                         style={{ background: C.primaryLight }}>{v.professor?.nome?.charAt(0)}</div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: C.text }}>{v.professor?.nome}</p>
                                        <p className="text-xs" style={{ color: C.textMuted }}>{v.materia?.nome}</p>
                                    </div>
                                </div>
                                <button onClick={() => removerProf(v)} style={btnDanger}
                                        className="flex items-center gap-1 hover:opacity-80 transition">
                                    <Trash2 size={11} /> Remover
                                </button>
                            </div>
                        ))}
                    </div>
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

    const carregar = () => api.get("/materias").then(r => setMaterias(r.data));
    useEffect(() => { carregar(); }, []);

    const inputStyle = { border: `1px solid ${C.border}`, borderRadius: "8px", padding: "8px 12px", fontSize: "13px", outline: "none", flex: 1, color: C.text };

    const excluirMateria = async (m) => {
        if (!confirm(`Excluir matéria "${m.nome}"?`)) return;
        try { await api.delete(`/materias/${m.id}`); carregar(); }
        catch { setMsg({ texto: "Erro ao excluir. Há vínculos ativos com essa matéria?", tipo: "erro" }); }
    };

    return (
        <div className="flex flex-col gap-5">
            {msg.texto && (
                <div className="text-sm px-4 py-3 rounded-lg"
                     style={{ background: msg.tipo === "ok" ? "#e8f8f2" : "#fde8e8", color: msg.tipo === "ok" ? "#52B69A" : "#e53e3e" }}>
                    {msg.texto}
                </div>
            )}

            <div className="bg-white rounded-xl p-5" style={{ border: `1px solid ${C.border}` }}>
                <p className="text-sm font-semibold mb-4" style={{ color: C.text }}>Nova Matéria</p>
                <form onSubmit={async e => {
                    e.preventDefault();
                    await api.post("/materias", form);
                    setForm({ nome: "" });
                    carregar();
                }} className="flex gap-2">
                    <input placeholder="Ex: Matemática" value={form.nome}
                           onChange={e => setForm({ nome: e.target.value })} style={inputStyle} />
                    <button type="submit" style={{ background: C.primary, color: "white", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600 }}>
                        Adicionar
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span className="text-sm font-semibold" style={{ color: C.text }}>Matérias Cadastradas</span>
                    <span className="text-xs" style={{ color: C.textMuted }}>{materias.length} matérias</span>
                </div>
                <table className="w-full">
                    <thead>
                    <tr style={{ background: "#f8fafb", borderBottom: `1px solid ${C.border}` }}>
                        {["#", "Nome", ""].map((h, i) => (
                            <th key={i} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                                style={{ color: C.textMuted }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {materias.map((m, i) => (
                        <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                            <td className="px-5 py-3 text-sm" style={{ color: C.textMuted }}>{m.id}</td>
                            <td className="px-5 py-3 text-sm font-medium" style={{ color: C.text }}>{m.nome}</td>
                            <td className="px-5 py-3 text-right">
                                <button onClick={() => excluirMateria(m)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ml-auto hover:opacity-80"
                                        style={{ background: "#fde8e8", color: "#e53e3e" }}>
                                    <Trash2 size={12} /> Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}