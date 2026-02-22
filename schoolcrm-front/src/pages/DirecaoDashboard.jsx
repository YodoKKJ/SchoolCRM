import { useState, useEffect } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8080" });
api.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return config;
});

const menuItems = [
    { id: "inicio", label: "Início", icon: "🏠" },
    { id: "usuarios", label: "Usuários", icon: "👥" },
    { id: "turmas", label: "Turmas", icon: "🏫" },
    { id: "materias", label: "Matérias", icon: "📚" },
    { id: "vinculos", label: "Vínculos", icon: "🔗" },
];

export default function DirecaoDashboard() {
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const nome = localStorage.getItem("nome") || "Direção";
    const logout = () => { localStorage.clear(); window.location.href = "/"; };

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "'Open Sans', sans-serif", background: "#f0f0f0" }}>

            {sidebarAberta && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-20 md:hidden"
                     onClick={() => setSidebarAberta(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed z-30 top-0 left-0 h-full w-44 flex flex-col transition-transform duration-300
        ${sidebarAberta ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:flex`}
                   style={{ background: "#ffffff", borderRight: "1px solid #ddd" }}>

                {/* Logo */}
                <div className="px-4 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #ddd" }}>
                    <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                         style={{ background: "#F97316" }}>S</div>
                    <div>
                        <p className="font-bold text-xs text-gray-800 leading-none">SchoolCRM</p>
                        <p className="text-xs" style={{ color: "#F97316" }}>Direção</p>
                    </div>
                </div>

                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #ddd" }}>
                    <p className="text-xs text-gray-400 truncate">{nome}</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-2">
                    {menuItems.map(item => (
                        <button key={item.id}
                                onClick={() => { setAba(item.id); setSidebarAberta(false); }}
                                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium w-full text-left transition-all"
                                style={{
                                    color: aba === item.id ? "#F97316" : "#555",
                                    background: aba === item.id ? "#fff5ee" : "transparent",
                                    borderLeft: aba === item.id ? "3px solid #F97316" : "3px solid transparent",
                                }}>
                            <span>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="px-4 py-3" style={{ borderTop: "1px solid #ddd" }}>
                    <button onClick={logout}
                            className="text-xs text-gray-400 hover:text-red-500 transition w-full text-left">
                        ↩ Sair
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Topbar escura como na ref */}
                <header className="px-6 py-3 flex items-center justify-between"
                        style={{ background: "#222", borderBottom: "1px solid #333" }}>
                    <button className="md:hidden text-white text-lg mr-3" onClick={() => setSidebarAberta(true)}>☰</button>
                    <span className="text-white font-semibold text-sm tracking-wide uppercase">
            {menuItems.find(m => m.id === aba)?.label}
          </span>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                             style={{ background: "#F97316" }}>
                            {nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-300 text-xs hidden md:block">{nome}</span>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-5 overflow-auto">
                    {aba === "inicio" && <Inicio />}
                    {aba === "usuarios" && <Usuarios />}
                    {aba === "turmas" && <Turmas />}
                    {aba === "materias" && <Materias />}
                    {aba === "vinculos" && <Vinculos />}
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
        { label: "Alunos", value: stats.alunos, color: "#3B82F6" },
        { label: "Professores", value: stats.professores, color: "#10B981" },
        { label: "Turmas", value: stats.turmas, color: "#F97316" },
        { label: "Matérias", value: stats.materias, color: "#8B5CF6" },
    ];

    return (
        <div className="flex flex-col gap-4">
            {/* Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map(card => (
                    <div key={card.label} className="bg-white rounded shadow-sm p-4 flex items-center gap-3"
                         style={{ borderTop: `3px solid ${card.color}` }}>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela usuários recentes */}
            <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #eee" }}>
                    <span className="text-sm font-semibold text-gray-700">Usuários Recentes</span>
                    <span className="text-xs text-gray-400">{usuarios.length} registros</span>
                </div>
                <table className="w-full text-xs">
                    <thead>
                    <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Nome</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Login</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Perfil</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.slice(0, 8).map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td className="px-4 py-2 text-gray-700 font-medium">{u.nome}</td>
                            <td className="px-4 py-2 text-gray-400">{u.login}</td>
                            <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                            background: u.role === "ALUNO" ? "#EFF6FF" : u.role === "PROFESSOR" ? "#ECFDF5" : "#FFF7ED",
                            color: u.role === "ALUNO" ? "#3B82F6" : u.role === "PROFESSOR" ? "#10B981" : "#F97316"
                        }}>
                    {u.role}
                  </span>
                            </td>
                        </tr>
                    ))}
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

    const carregar = () => api.get("/usuarios").then(r => setUsuarios(r.data));
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

    const inputClass = "border text-xs px-3 py-2 rounded outline-none w-full transition"
        + " focus:border-orange-400 text-gray-700";

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Novo Usuário</p>
                <form onSubmit={cadastrar} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input placeholder="Nome completo" value={form.nome}
                           onChange={e => setForm({ ...form, nome: e.target.value })}
                           className={inputClass} style={{ border: "1px solid #ccc" }} />
                    <input placeholder="Login" value={form.login}
                           onChange={e => setForm({ ...form, login: e.target.value })}
                           className={inputClass} style={{ border: "1px solid #ccc" }} />
                    <input placeholder="Senha" type="password" value={form.senha}
                           onChange={e => setForm({ ...form, senha: e.target.value })}
                           className={inputClass} style={{ border: "1px solid #ccc" }} />
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                            className={inputClass} style={{ border: "1px solid #ccc" }}>
                        <option value="ALUNO">Aluno</option>
                        <option value="PROFESSOR">Professor</option>
                        <option value="DIRECAO">Direção</option>
                    </select>
                    <button type="submit"
                            className="md:col-span-4 py-2 rounded text-xs font-semibold text-white transition"
                            style={{ background: "#F97316" }}>
                        Cadastrar
                    </button>
                </form>
                {msg.texto && (
                    <p className={`mt-2 text-xs px-3 py-1.5 rounded ${msg.tipo === "ok" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {msg.texto}
                    </p>
                )}
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #eee" }}>
                    <span className="text-sm font-semibold text-gray-700">Usuários Cadastrados</span>
                    <span className="text-xs text-gray-400">{usuarios.length} registros</span>
                </div>
                <table className="w-full text-xs">
                    <thead>
                    <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Nome</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Login</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Perfil</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td className="px-4 py-2 text-gray-700 font-medium">{u.nome}</td>
                            <td className="px-4 py-2 text-gray-400">{u.login}</td>
                            <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                            background: u.role === "ALUNO" ? "#EFF6FF" : u.role === "PROFESSOR" ? "#ECFDF5" : "#FFF7ED",
                            color: u.role === "ALUNO" ? "#3B82F6" : u.role === "PROFESSOR" ? "#10B981" : "#F97316"
                        }}>
                    {u.role}
                  </span>
                            </td>
                        </tr>
                    ))}
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
    const [msg, setMsg] = useState("");

    const carregar = () => {
        api.get("/turmas").then(r => setTurmas(r.data));
        api.get("/turmas/series").then(r => setSeries(r.data));
    };
    useEffect(() => { carregar(); }, []);

    const inputClass = "border text-xs px-3 py-2 rounded outline-none w-full focus:border-orange-400 text-gray-700";

    return (
        <div className="flex flex-col gap-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded shadow-sm p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Nova Série</p>
                    <form onSubmit={async e => { e.preventDefault(); await api.post("/turmas/series", formSerie); setFormSerie({ nome: "" }); carregar(); }}
                          className="flex gap-2">
                        <input placeholder="Ex: 1º Ano" value={formSerie.nome}
                               onChange={e => setFormSerie({ nome: e.target.value })}
                               className={inputClass} style={{ border: "1px solid #ccc" }} />
                        <button type="submit" className="px-4 py-2 rounded text-xs font-semibold text-white whitespace-nowrap"
                                style={{ background: "#F97316" }}>Adicionar</button>
                    </form>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {series.map(s => (
                            <span key={s.id} className="text-xs px-2.5 py-1 rounded"
                                  style={{ background: "#FFF7ED", color: "#F97316", border: "1px solid #fed7aa" }}>
                {s.nome}
              </span>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded shadow-sm p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Nova Turma</p>
                    <form onSubmit={async e => { e.preventDefault(); try { await api.post("/turmas", formTurma); setMsg("Turma cadastrada!"); carregar(); } catch { setMsg("Erro."); } }}
                          className="flex flex-col gap-2">
                        <input placeholder="Nome da turma" value={formTurma.nome}
                               onChange={e => setFormTurma({ ...formTurma, nome: e.target.value })}
                               className={inputClass} style={{ border: "1px solid #ccc" }} />
                        <select value={formTurma.serieId} onChange={e => setFormTurma({ ...formTurma, serieId: e.target.value })}
                                className={inputClass} style={{ border: "1px solid #ccc" }}>
                            <option value="">Selecione a série</option>
                            {series.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                        <button type="submit" className="py-2 rounded text-xs font-semibold text-white"
                                style={{ background: "#F97316" }}>Cadastrar</button>
                    </form>
                    {msg && <p className="mt-2 text-xs text-green-600">{msg}</p>}
                </div>
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #eee" }}>
                    <span className="text-sm font-semibold text-gray-700">Turmas Cadastradas</span>
                </div>
                <table className="w-full text-xs">
                    <thead>
                    <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Turma</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Série</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Ano Letivo</th>
                    </tr>
                    </thead>
                    <tbody>
                    {turmas.map((t, i) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td className="px-4 py-2 text-gray-700 font-medium">{t.nome}</td>
                            <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#FFF7ED", color: "#F97316" }}>
                    {t.serie?.nome}
                  </span>
                            </td>
                            <td className="px-4 py-2 text-gray-400">{t.anoLetivo}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---- MATÉRIAS ----
function Materias() {
    const [materias, setMaterias] = useState([]);
    const [form, setForm] = useState({ nome: "" });

    const carregar = () => api.get("/materias").then(r => setMaterias(r.data));
    useEffect(() => { carregar(); }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Nova Matéria</p>
                <form onSubmit={async e => { e.preventDefault(); await api.post("/materias", form); setForm({ nome: "" }); carregar(); }}
                      className="flex gap-2">
                    <input placeholder="Ex: Matemática" value={form.nome}
                           onChange={e => setForm({ nome: e.target.value })}
                           className="border text-xs px-3 py-2 rounded outline-none flex-1 focus:border-orange-400 text-gray-700"
                           style={{ border: "1px solid #ccc" }} />
                    <button type="submit" className="px-4 py-2 rounded text-xs font-semibold text-white"
                            style={{ background: "#F97316" }}>Adicionar</button>
                </form>
            </div>

            <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #eee" }}>
                    <span className="text-sm font-semibold text-gray-700">Matérias Cadastradas</span>
                </div>
                <table className="w-full text-xs">
                    <thead>
                    <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #eee" }}>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">#</th>
                        <th className="px-4 py-2 text-left text-gray-500 font-semibold">Nome</th>
                    </tr>
                    </thead>
                    <tbody>
                    {materias.map((m, i) => (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td className="px-4 py-2 text-gray-400">{m.id}</td>
                            <td className="px-4 py-2 text-gray-700 font-medium">{m.nome}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ---- VÍNCULOS ----
function Vinculos() {
    const [usuarios, setUsuarios] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [formAluno, setFormAluno] = useState({ alunoId: "", turmaId: "" });
    const [formProf, setFormProf] = useState({ professorId: "", turmaId: "", materiaId: "" });
    const [msg, setMsg] = useState({ texto: "", tipo: "" });

    useEffect(() => {
        api.get("/usuarios").then(r => setUsuarios(r.data));
        api.get("/turmas").then(r => setTurmas(r.data));
        api.get("/materias").then(r => setMaterias(r.data));
    }, []);

    const selectClass = "border text-xs px-3 py-2 rounded outline-none w-full focus:border-orange-400 text-gray-700";

    const vincularAluno = async e => {
        e.preventDefault();
        try { await api.post("/vinculos/aluno-turma", formAluno); setMsg({ texto: "Aluno vinculado!", tipo: "ok" }); }
        catch { setMsg({ texto: "Erro ao vincular.", tipo: "erro" }); }
    };

    const vincularProfessor = async e => {
        e.preventDefault();
        try { await api.post("/vinculos/professor-turma-materia", formProf); setMsg({ texto: "Professor vinculado!", tipo: "ok" }); }
        catch { setMsg({ texto: "Erro ao vincular.", tipo: "erro" }); }
    };

    const alunos = usuarios.filter(u => u.role === "ALUNO");
    const professores = usuarios.filter(u => u.role === "PROFESSOR");

    return (
        <div className="flex flex-col gap-4">
            {msg.texto && (
                <div className={`text-xs px-3 py-2 rounded ${msg.tipo === "ok" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {msg.texto}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded shadow-sm p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Vincular Aluno à Turma</p>
                    <form onSubmit={vincularAluno} className="flex flex-col gap-2">
                        <select value={formAluno.alunoId} onChange={e => setFormAluno({ ...formAluno, alunoId: e.target.value })}
                                className={selectClass} style={{ border: "1px solid #ccc" }}>
                            <option value="">Selecione o aluno</option>
                            {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                        </select>
                        <select value={formAluno.turmaId} onChange={e => setFormAluno({ ...formAluno, turmaId: e.target.value })}
                                className={selectClass} style={{ border: "1px solid #ccc" }}>
                            <option value="">Selecione a turma</option>
                            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                        <button type="submit" className="py-2 rounded text-xs font-semibold text-white"
                                style={{ background: "#F97316" }}>Vincular Aluno</button>
                    </form>
                </div>

                <div className="bg-white rounded shadow-sm p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Vincular Professor à Turma/Matéria</p>
                    <form onSubmit={vincularProfessor} className="flex flex-col gap-2">
                        <select value={formProf.professorId} onChange={e => setFormProf({ ...formProf, professorId: e.target.value })}
                                className={selectClass} style={{ border: "1px solid #ccc" }}>
                            <option value="">Selecione o professor</option>
                            {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                        <select value={formProf.turmaId} onChange={e => setFormProf({ ...formProf, turmaId: e.target.value })}
                                className={selectClass} style={{ border: "1px solid #ccc" }}>
                            <option value="">Selecione a turma</option>
                            {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                        </select>
                        <select value={formProf.materiaId} onChange={e => setFormProf({ ...formProf, materiaId: e.target.value })}
                                className={selectClass} style={{ border: "1px solid #ccc" }}>
                            <option value="">Selecione a matéria</option>
                            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                        </select>
                        <button type="submit" className="py-2 rounded text-xs font-semibold text-white"
                                style={{ background: "#F97316" }}>Vincular Professor</button>
                    </form>
                </div>
            </div>
        </div>
    );
}