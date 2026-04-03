import { useState, useEffect } from "react";
import axios from "axios";
import {
    Building2, Plus, Pencil, Trash2, ExternalLink, LogOut, Shield,
    Menu, X, CheckCircle2, XCircle, Search
} from "lucide-react";

// ── API instance ──────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: "" });

api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("masterToken") || localStorage.getItem("token")}`;
    if (config.method === "get") {
        config.params = { ...config.params, _t: Date.now() };
    }
    return config;
});

let redirectingTo401 = false;
api.interceptors.response.use(
    r => r,
    error => {
        if (error.response?.status === 401 && !redirectingTo401) {
            redirectingTo401 = true;
            localStorage.removeItem("token");
            localStorage.removeItem("masterToken");
            localStorage.removeItem("role");
            localStorage.removeItem("nome");
            window.location.href = "/master/login";
        }
        return Promise.reject(error);
    }
);

// ── Toast ─────────────────────────────────────────────────────────────────────
const _toastListeners = [];
function showToast(msg, tipo = "ok") { const text = typeof msg === "string" ? msg : JSON.stringify(msg); _toastListeners.forEach(fn => fn(text, tipo)); }

function ToastContainer() {
    const [toasts, setToasts] = useState([]);
    useEffect(() => {
        const handler = (msg, tipo) => {
            const id = Date.now() + Math.random();
            setToasts(t => [...t, { id, msg, tipo }]);
            setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
        };
        _toastListeners.push(handler);
        return () => { const i = _toastListeners.indexOf(handler); if (i >= 0) _toastListeners.splice(i, 1); };
    }, []);
    if (toasts.length === 0) return null;
    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: "12px 18px",
                    background: t.tipo === "err" ? "#fdf0f0" : "#eef2ff",
                    borderLeft: `3px solid ${t.tipo === "err" ? "#b94040" : "#4f46e5"}`,
                    color: t.tipo === "err" ? "#b94040" : "#3730a3",
                    fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                    boxShadow: "0 2px 12px rgba(0,0,0,.12)",
                    minWidth: 220, maxWidth: 380,
                }}>
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
let _confirmResolve = null;
const _confirmListeners = [];
function showConfirm(msg) {
    return new Promise(resolve => {
        _confirmResolve = resolve;
        _confirmListeners.forEach(fn => fn(msg));
    });
}

function ConfirmDialog() {
    const [state, setState] = useState({ visible: false, msg: "" });
    useEffect(() => {
        const handler = (msg) => setState({ visible: true, msg });
        _confirmListeners.push(handler);
        return () => { const i = _confirmListeners.indexOf(handler); if (i >= 0) _confirmListeners.splice(i, 1); };
    }, []);
    if (!state.visible) return null;
    const resolve = val => {
        setState({ visible: false, msg: "" });
        if (_confirmResolve) { _confirmResolve(val); _confirmResolve = null; }
    };
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,35,.55)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
             onClick={() => resolve(false)}>
            <div style={{ background: "#fff", padding: 32, maxWidth: 400, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.18)", borderRadius: 8 }}
                 onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: 14, color: "#1e1b4b", margin: "0 0 24px", lineHeight: 1.6, whiteSpace: "pre-line" }}>{state.msg}</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => resolve(false)}
                            style={{ background: "#f0f0f8", color: "#6b6b8d", border: "none", padding: "9px 20px",
                                     fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500,
                                     letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", borderRadius: 4 }}>
                        Cancelar
                    </button>
                    <button onClick={() => resolve(true)}
                            style={{ background: "#dc2626", color: "#fff", border: "none", padding: "9px 20px",
                                     fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500,
                                     letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", borderRadius: 4 }}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Slug generation ───────────────────────────────────────────────────────────
function gerarSlug(nome) {
    return nome
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
    sidebar: "#0f0f23",
    sidebarHover: "#1a1a3e",
    accent: "#4f46e5",
    accentLight: "#eef2ff",
    bg: "#f5f5fa",
    card: "#ffffff",
    border: "#e5e5ef",
    text: "#1e1b4b",
    textMuted: "#6b6b8d",
    success: "#16a34a",
    successBg: "#f0fdf4",
    danger: "#dc2626",
    dangerBg: "#fef2f2",
};

export default function MasterDashboard() {
    useEffect(() => { document.title = "Skolyo — Master"; }, []);
    const [escolas, setEscolas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Create form
    const [showCreate, setShowCreate] = useState(false);
    const [createNome, setCreateNome] = useState("");
    const [createCnpj, setCreateCnpj] = useState("");
    const [createSlug, setCreateSlug] = useState("");
    const [slugManual, setSlugManual] = useState(false);
    const [createCorPrimaria, setCreateCorPrimaria] = useState("#7ec8a0");
    const [createCorSecundaria, setCreateCorSecundaria] = useState("#3a8d5c");
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editId, setEditId] = useState(null);
    const [editNome, setEditNome] = useState("");
    const [editCnpj, setEditCnpj] = useState("");
    const [editSlug, setEditSlug] = useState("");
    const [editAtivo, setEditAtivo] = useState(true);
    const [editCorPrimaria, setEditCorPrimaria] = useState("#7ec8a0");
    const [editCorSecundaria, setEditCorSecundaria] = useState("#3a8d5c");

    const nome = localStorage.getItem("nome") || "Admin";

    useEffect(() => { fetchEscolas(); }, []);

    useEffect(() => {
        if (!slugManual) setCreateSlug(gerarSlug(createNome));
    }, [createNome, slugManual]);

    const fetchEscolas = async () => {
        try {
            const res = await api.get("/escolas");
            setEscolas(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            showToast("Erro ao carregar escolas", "err");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!createNome.trim()) { showToast("Nome obrigatorio", "err"); return; }
        setSaving(true);
        try {
            await api.post("/escolas", {
                nome: createNome.trim(),
                cnpj: createCnpj.trim() || null,
                slug: createSlug.trim() || gerarSlug(createNome),
                corPrimaria: createCorPrimaria,
                corSecundaria: createCorSecundaria,
            });
            showToast("Escola criada com sucesso");
            setShowCreate(false);
            setCreateNome(""); setCreateCnpj(""); setCreateSlug(""); setSlugManual(false);
            setCreateCorPrimaria("#7ec8a0"); setCreateCorSecundaria("#3a8d5c");
            fetchEscolas();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data || "Erro ao criar escola", "err");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (e) => {
        setEditId(e.id);
        setEditNome(e.nome);
        setEditCnpj(e.cnpj || "");
        setEditSlug(e.slug);
        setEditAtivo(e.ativo !== false);
        setEditCorPrimaria(e.corPrimaria || "#7ec8a0");
        setEditCorSecundaria(e.corSecundaria || "#3a8d5c");
    };

    const cancelEdit = () => setEditId(null);

    const handleUpdate = async () => {
        if (!editNome.trim()) { showToast("Nome obrigatorio", "err"); return; }
        setSaving(true);
        try {
            await api.put(`/escolas/${editId}`, {
                nome: editNome.trim(),
                cnpj: editCnpj.trim() || null,
                slug: editSlug.trim(),
                ativo: editAtivo,
                corPrimaria: editCorPrimaria,
                corSecundaria: editCorSecundaria,
            });
            showToast("Escola atualizada");
            setEditId(null);
            fetchEscolas();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data || "Erro ao atualizar", "err");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (escola) => {
        const ok = await showConfirm(`Deseja realmente excluir a escola "${escola.nome}"?\n\nEsta acao nao pode ser desfeita.`);
        if (!ok) return;
        try {
            await api.delete(`/escolas/${escola.id}`);
            showToast("Escola removida");
            fetchEscolas();
        } catch (err) {
            showToast(err.response?.data?.message || err.response?.data || "Erro ao excluir", "err");
        }
    };

    const handleAcessar = async (escola) => {
        try {
            const res = await api.post("/auth/master-impersonate", { escolaId: escola.id });
            const { token, escolaSlug, escolaNome, corPrimaria, corSecundaria } = res.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", "MASTER");
            localStorage.setItem("escolaSlug", escolaSlug);
            localStorage.setItem("escolaNome", escolaNome);
            localStorage.setItem("corPrimaria", corPrimaria || "#7ec8a0");
            localStorage.setItem("corSecundaria", corSecundaria || "#3a8d5c");
            // Abre nova aba com o dashboard da escola
            window.open(`/escola/${escolaSlug}/direcao`, "_blank");
        } catch (err) {
            showToast(err.response?.data || "Erro ao acessar escola", "err");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("masterToken");
        localStorage.removeItem("role");
        localStorage.removeItem("nome");
        localStorage.removeItem("userId");
        localStorage.removeItem("escolaSlug");
        localStorage.removeItem("escolaNome");
        window.location.href = "/master/login";
    };

    const listaEscolas = Array.isArray(escolas) ? escolas : [];
    const filtered = listaEscolas.filter(e => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (e.nome || "").toLowerCase().includes(s)
            || (e.slug || "").toLowerCase().includes(s)
            || (e.cnpj || "").toLowerCase().includes(s);
    });

    const totalEscolas = listaEscolas.length;
    const ativas = listaEscolas.filter(e => e.ativo !== false).length;
    const inativas = totalEscolas - ativas;

    // ── Inline styles ─────────────────────────────────────────────────────────
    const sInput = {
        width: "100%", border: `1px solid ${C.border}`, borderRadius: 6,
        padding: "10px 12px", fontSize: 14, fontFamily: "'DM Sans',sans-serif",
        color: C.text, outline: "none", background: "#fff",
        transition: "border-color .2s",
    };
    const sLabel = {
        display: "block", fontSize: 11, fontWeight: 500, letterSpacing: ".08em",
        textTransform: "uppercase", color: C.textMuted, marginBottom: 6,
    };
    const sBtn = (bg, color) => ({
        background: bg, color, border: "none", borderRadius: 6,
        padding: "9px 18px", fontFamily: "'DM Sans',sans-serif",
        fontSize: 12, fontWeight: 500, letterSpacing: ".06em",
        textTransform: "uppercase", cursor: "pointer", transition: "opacity .2s",
    });
    const sIconBtn = (bg, color) => ({
        background: bg, color, border: "none", borderRadius: 6,
        width: 34, height: 34, display: "inline-flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", transition: "opacity .2s",
    });

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
            `}</style>

            <ToastContainer />
            <ConfirmDialog />

            <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", background: C.bg }}>

                {/* ── Sidebar overlay (mobile) ── */}
                {sidebarOpen && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 998 }}
                         onClick={() => setSidebarOpen(false)} />
                )}

                {/* ── Sidebar ── */}
                <aside style={{
                    width: 260, background: C.sidebar, color: "#fff",
                    display: "flex", flexDirection: "column",
                    position: "fixed", top: 0, bottom: 0, left: sidebarOpen ? 0 : -260,
                    zIndex: 999, transition: "left .25s ease",
                    ...(window.innerWidth >= 900 ? { position: "sticky", left: 0 } : {}),
                }}>
                    {/* Logo area */}
                    <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Shield size={18} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: ".02em" }}>Skolyo</div>
                                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", textTransform: "uppercase" }}>Painel Master</div>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav style={{ flex: 1, padding: "16px 12px" }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 12px", borderRadius: 8,
                            background: "rgba(79,70,229,.15)", color: "#a5b4fc",
                            fontSize: 13, fontWeight: 500, cursor: "pointer",
                        }}>
                            <Building2 size={18} />
                            Escolas
                        </div>
                    </nav>

                    {/* User / Logout */}
                    <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginBottom: 4, padding: "0 12px" }}>
                            {nome}
                        </div>
                        <button onClick={handleLogout} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            background: "transparent", border: "none", color: "rgba(255,255,255,.5)",
                            fontSize: 13, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                            transition: "background .15s, color .15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; }}>
                            <LogOut size={16} />
                            Sair
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <main style={{ flex: 1, minWidth: 0, padding: "0 24px 40px" }}>

                    {/* Top bar */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "20px 0", position: "sticky", top: 0, background: C.bg, zIndex: 10,
                    }}>
                        <button onClick={() => setSidebarOpen(true)} style={{
                            background: "none", border: "none", cursor: "pointer", color: C.text,
                            display: window.innerWidth >= 900 ? "none" : "block",
                        }}>
                            <Menu size={22} />
                        </button>
                        <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: ".08em", textTransform: "uppercase" }}>
                            Painel Master
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                        {[
                            { label: "Total de Escolas", value: totalEscolas, color: C.accent, bg: C.accentLight, icon: Building2 },
                            { label: "Escolas Ativas", value: ativas, color: C.success, bg: C.successBg, icon: CheckCircle2 },
                            { label: "Escolas Inativas", value: inativas, color: C.danger, bg: C.dangerBg, icon: XCircle },
                        ].map((st, i) => (
                            <div key={i} style={{
                                background: C.card, borderRadius: 10, padding: "20px 24px",
                                border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 16,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, background: st.bg,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <st.icon size={20} color={st.color} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>{st.label}</div>
                                    <div style={{ fontSize: 28, fontWeight: 600, color: C.text, fontFamily: "'Playfair Display',serif" }}>{st.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Header + actions */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        flexWrap: "wrap", gap: 12, marginBottom: 20,
                    }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: "'Playfair Display',serif" }}>
                            Escolas
                        </h1>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ position: "relative" }}>
                                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted }} />
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar escola..."
                                    style={{ ...sInput, width: 220, paddingLeft: 32 }}
                                />
                            </div>
                            <button onClick={() => { setShowCreate(true); setCreateNome(""); setCreateCnpj(""); setCreateSlug(""); setSlugManual(false); }}
                                    style={sBtn(C.accent, "#fff")}>
                                <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                                Criar Escola
                            </button>
                        </div>
                    </div>

                    {/* Create form */}
                    {showCreate && (
                        <div style={{
                            background: C.card, borderRadius: 10, border: `1px solid ${C.accent}`,
                            padding: 24, marginBottom: 20, boxShadow: "0 2px 12px rgba(79,70,229,.08)",
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 16 }}>Nova Escola</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={sLabel}>Nome *</label>
                                    <input value={createNome} onChange={e => setCreateNome(e.target.value)} style={sInput} placeholder="Nome da escola" />
                                </div>
                                <div>
                                    <label style={sLabel}>CNPJ</label>
                                    <input value={createCnpj} onChange={e => setCreateCnpj(e.target.value)} style={sInput} placeholder="00.000.000/0000-00" />
                                </div>
                                <div>
                                    <label style={sLabel}>Slug (auto)</label>
                                    <input value={createSlug}
                                           onChange={e => { setCreateSlug(e.target.value); setSlugManual(true); }}
                                           style={sInput} placeholder="nome-da-escola" />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={sLabel}>Cor Primária</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <input type="color" value={createCorPrimaria} onChange={e => setCreateCorPrimaria(e.target.value)}
                                               style={{ width: 40, height: 36, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: "#fff" }} />
                                        <input value={createCorPrimaria} onChange={e => setCreateCorPrimaria(e.target.value)}
                                               style={{ ...sInput, flex: 1 }} placeholder="#7ec8a0" />
                                    </div>
                                </div>
                                <div>
                                    <label style={sLabel}>Cor Secundária</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <input type="color" value={createCorSecundaria} onChange={e => setCreateCorSecundaria(e.target.value)}
                                               style={{ width: 40, height: 36, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: "#fff" }} />
                                        <input value={createCorSecundaria} onChange={e => setCreateCorSecundaria(e.target.value)}
                                               style={{ ...sInput, flex: 1 }} placeholder="#3a8d5c" />
                                    </div>
                                </div>
                                <div>
                                    <label style={sLabel}>Preview</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${createCorPrimaria} 0%, ${createCorSecundaria} 100%)`, flexShrink: 0 }} />
                                        <span style={{ fontSize: 12, color: C.textMuted }}>Gradiente do logo</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={handleCreate} disabled={saving} style={sBtn(C.accent, "#fff")}>
                                    {saving ? "Salvando..." : "Criar"}
                                </button>
                                <button onClick={() => setShowCreate(false)} style={sBtn("#f0f0f8", C.textMuted)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Escola cards */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: 60, color: C.textMuted, fontSize: 14 }}>
                            Carregando escolas...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 60, color: C.textMuted, fontSize: 14 }}>
                            {search ? "Nenhuma escola encontrada." : "Nenhuma escola cadastrada."}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                            {filtered.map(escola => (
                                <div key={escola.id} style={{
                                    background: C.card, borderRadius: 10,
                                    border: `1px solid ${editId === escola.id ? C.accent : C.border}`,
                                    padding: 24, transition: "border-color .2s, box-shadow .2s",
                                    boxShadow: editId === escola.id ? "0 2px 12px rgba(79,70,229,.1)" : "0 1px 3px rgba(0,0,0,.04)",
                                }}>
                                    {editId === escola.id ? (
                                        /* ── Edit mode ── */
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginBottom: 16, textTransform: "uppercase", letterSpacing: ".06em" }}>Editando</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                                                <div>
                                                    <label style={sLabel}>Nome</label>
                                                    <input value={editNome} onChange={e => setEditNome(e.target.value)} style={sInput} />
                                                </div>
                                                <div>
                                                    <label style={sLabel}>CNPJ</label>
                                                    <input value={editCnpj} onChange={e => setEditCnpj(e.target.value)} style={sInput} />
                                                </div>
                                                <div>
                                                    <label style={sLabel}>Slug</label>
                                                    <input value={editSlug} onChange={e => setEditSlug(e.target.value)} style={sInput} />
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <label style={{ ...sLabel, margin: 0 }}>Ativo</label>
                                                    <button onClick={() => setEditAtivo(!editAtivo)} style={{
                                                        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                                                        background: editAtivo ? C.success : "#d4d4e0",
                                                        position: "relative", transition: "background .2s",
                                                    }}>
                                                        <div style={{
                                                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                                            position: "absolute", top: 3,
                                                            left: editAtivo ? 22 : 4,
                                                            transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
                                                        }} />
                                                    </button>
                                                    <span style={{ fontSize: 12, color: editAtivo ? C.success : C.textMuted }}>
                                                        {editAtivo ? "Sim" : "Nao"}
                                                    </span>
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, marginTop: 4 }}>
                                                    <div>
                                                        <label style={sLabel}>Cor Primária</label>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <input type="color" value={editCorPrimaria} onChange={e => setEditCorPrimaria(e.target.value)}
                                                                   style={{ width: 36, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: "#fff" }} />
                                                            <input value={editCorPrimaria} onChange={e => setEditCorPrimaria(e.target.value)}
                                                                   style={{ ...sInput, flex: 1, fontSize: 12 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={sLabel}>Cor Secundária</label>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <input type="color" value={editCorSecundaria} onChange={e => setEditCorSecundaria(e.target.value)}
                                                                   style={{ width: 36, height: 32, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", padding: 2, background: "#fff" }} />
                                                            <input value={editCorSecundaria} onChange={e => setEditCorSecundaria(e.target.value)}
                                                                   style={{ ...sInput, flex: 1, fontSize: 12 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={sLabel}>Preview</label>
                                                        <div style={{ width: 36, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${editCorPrimaria} 0%, ${editCorSecundaria} 100%)` }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 10 }}>
                                                <button onClick={handleUpdate} disabled={saving} style={sBtn(C.accent, "#fff")}>
                                                    {saving ? "Salvando..." : "Salvar"}
                                                </button>
                                                <button onClick={cancelEdit} style={sBtn("#f0f0f8", C.textMuted)}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── View mode ── */
                                        <div>
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 38, height: 38, borderRadius: 8,
                                                        background: escola.ativo !== false ? C.accentLight : C.dangerBg,
                                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                    }}>
                                                        <Building2 size={18} color={escola.ativo !== false ? C.accent : C.danger} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{escola.nome}</div>
                                                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>/{escola.slug}</div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
                                                    padding: "3px 8px", borderRadius: 4,
                                                    background: escola.ativo !== false ? C.successBg : C.dangerBg,
                                                    color: escola.ativo !== false ? C.success : C.danger,
                                                }}>
                                                    {escola.ativo !== false ? "Ativa" : "Inativa"}
                                                </span>
                                            </div>

                                            {escola.cnpj && (
                                                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>
                                                    CNPJ: {escola.cnpj}
                                                </div>
                                            )}
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                                <div style={{ width: 20, height: 20, borderRadius: 6, background: `linear-gradient(135deg, ${escola.corPrimaria || "#7ec8a0"} 0%, ${escola.corSecundaria || "#3a8d5c"} 100%)`, flexShrink: 0, border: `1px solid ${C.border}` }} />
                                                <span style={{ fontSize: 11, color: C.textMuted }}>
                                                    {escola.corPrimaria || "#7ec8a0"} / {escola.corSecundaria || "#3a8d5c"}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                                                <button onClick={() => handleAcessar(escola)}
                                                        style={{ ...sBtn(C.accent, "#fff"), display: "flex", alignItems: "center", gap: 6, padding: "8px 14px" }}>
                                                    <ExternalLink size={13} /> Acessar
                                                </button>
                                                <button onClick={() => startEdit(escola)}
                                                        style={sIconBtn(C.accentLight, C.accent)}
                                                        title="Editar">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(escola)}
                                                        style={sIconBtn(C.dangerBg, C.danger)}
                                                        title="Excluir">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
