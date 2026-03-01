import { useState, useEffect } from "react";
import axios from "axios";
import { Home, BookOpen, BarChart2, CalendarDays, LogOut, Menu, X } from "lucide-react";

const api = axios.create({ baseURL: "" });

api.interceptors.request.use(cfg => {
    cfg.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
    return cfg;
});

api.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = "/";
        }
        return Promise.reject(err);
    }
);

// ── Cores / constantes ─────────────────────────────────────────────
const C = {
    sidebar: "#0d1f18",
    sidebarActive: "#1a3828",
    sidebarText: "rgba(255,255,255,0.75)",
    sidebarTextActive: "#ffffff",
    accent: "#52B69A",
    bg: "#f5f8f6",
    card: "#ffffff",
    border: "#e4ebe7",
    text: "#1a2332",
    textMuted: "#6b7a8d",
    ok: "#22c55e",
    warn: "#f59e0b",
    danger: "#ef4444",
};

const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX"];
const DIA_LABEL = { SEG: "Segunda", TER: "Terça", QUA: "Quarta", QUI: "Quinta", SEX: "Sexta" };

// ── Helpers ────────────────────────────────────────────────────────
function corFreq(pct) {
    if (pct >= 75) return C.ok;
    if (pct >= 60) return C.warn;
    return C.danger;
}

function mediaMateria(notas) {
    if (!notas.length) return null;
    const normais = notas.filter(n => !n.avaliacao?.bonificacao);
    if (!normais.length) return null;
    const pesoTotal = normais.reduce((s, n) => s + (n.avaliacao?.peso ?? 1), 0);
    if (!pesoTotal) return null;
    const soma = normais.reduce((s, n) => s + (parseFloat(n.valor) * (n.avaliacao?.peso ?? 1)), 0);
    return soma / pesoTotal;
}

function corMedia(m) {
    if (m === null) return C.textMuted;
    if (m >= 7) return C.ok;
    if (m >= 5) return C.warn;
    return C.danger;
}

function fmt(n) {
    if (n === null || n === undefined) return "—";
    return parseFloat(n).toFixed(1);
}

// ── Sidebar ────────────────────────────────────────────────────────
const MENU = [
    { id: "inicio",     label: "Início",     icon: Home },
    { id: "boletim",    label: "Boletim",    icon: BookOpen },
    { id: "frequencia", label: "Frequência", icon: BarChart2 },
    { id: "horarios",   label: "Horários",   icon: CalendarDays },
];

function Sidebar({ aba, setAba, nome, sidebarAberta, setSidebarAberta }) {
    return (
        <>
            {sidebarAberta && (
                <div
                    onClick={() => setSidebarAberta(false)}
                    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 20 }}
                />
            )}
            <aside style={{
                position: "fixed", top: 0, left: 0, bottom: 0,
                width: 220, background: C.sidebar,
                display: "flex", flexDirection: "column",
                zIndex: 30,
                transform: sidebarAberta ? "translateX(0)" : "translateX(-100%)",
                transition: "transform .25s ease",
            }}>
                {/* logo */}
                <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: C.accent, textTransform: "uppercase", marginBottom: 4 }}>
                        DomGestão
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Portal do Aluno</div>
                    <div style={{ fontSize: 12, color: C.sidebarText, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {nome}
                    </div>
                </div>

                {/* menu */}
                <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
                    {MENU.map(item => {
                        const Icon = item.icon;
                        const active = aba === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setAba(item.id); setSidebarAberta(false); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    width: "100%", padding: "10px 20px",
                                    background: active ? C.sidebarActive : "transparent",
                                    border: "none", cursor: "pointer",
                                    color: active ? C.sidebarTextActive : C.sidebarText,
                                    fontSize: 14, fontWeight: active ? 600 : 400,
                                    borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                                    textAlign: "left",
                                }}
                            >
                                <Icon size={16} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* logout */}
                <div style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.08)" }}>
                    <button
                        onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                        style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "10px 20px",
                            background: "transparent", border: "none", cursor: "pointer",
                            color: "rgba(255,100,100,.6)", fontSize: 14,
                        }}
                    >
                        <LogOut size={16} />
                        Sair
                    </button>
                </div>
            </aside>
        </>
    );
}

// ── Seção: Início ─────────────────────────────────────────────────
function SecaoInicio({ turmas, notas, frequencias }) {
    const turmaAtual = turmas[0];
    const mediaGeral = (() => {
        const porMateria = agruparNotasPorMateria(notas);
        const medias = Object.values(porMateria).map(mediaMateria).filter(m => m !== null);
        if (!medias.length) return null;
        return medias.reduce((a, b) => a + b, 0) / medias.length;
    })();

    const freqMedia = (() => {
        const vals = Object.values(frequencias).map(f => f.percentualPresenca).filter(v => v != null);
        if (!vals.length) return null;
        return vals.reduce((a, b) => a + b, 0) / vals.length;
    })();

    const cards = [
        {
            label: "Turma",
            valor: turmaAtual?.turma?.nome ?? "—",
            sub: turmaAtual?.turma?.serie?.nome ?? "",
            cor: C.accent,
        },
        {
            label: "Ano Letivo",
            valor: turmaAtual?.turma?.anoLetivo ?? "—",
            sub: "Ano em curso",
            cor: "#1A759F",
        },
        {
            label: "Média Geral",
            valor: mediaGeral !== null ? fmt(mediaGeral) : "—",
            sub: mediaGeral !== null ? (mediaGeral >= 7 ? "Aprovado" : mediaGeral >= 5 ? "Recuperação" : "Reprovado") : "Sem notas",
            cor: corMedia(mediaGeral),
        },
        {
            label: "Frequência Média",
            valor: freqMedia !== null ? `${fmt(freqMedia)}%` : "—",
            sub: freqMedia !== null ? (freqMedia >= 75 ? "Regular" : "Atenção") : "Sem registros",
            cor: corFreq(freqMedia ?? 0),
        },
    ];

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Visão Geral</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                {cards.map(c => (
                    <div key={c.label} style={{
                        background: C.card, borderRadius: 12, padding: "20px 24px",
                        boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderTop: `3px solid ${c.cor}`,
                    }}>
                        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.textMuted, marginBottom: 8 }}>{c.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: c.cor }}>{c.valor}</div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{c.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Helper: agrupar notas por matéria ────────────────────────────
function agruparNotasPorMateria(notas) {
    const mapa = {};
    notas.forEach(n => {
        const mat = n.avaliacao?.materia;
        if (!mat) return;
        if (!mapa[mat.id]) mapa[mat.id] = { materia: mat, notas: [] };
        mapa[mat.id].notas.push(n);
    });
    return mapa;
}

// ── Seção: Boletim ────────────────────────────────────────────────
function SecaoBoletim({ notas }) {
    const porMateria = agruparNotasPorMateria(notas);

    if (!Object.keys(porMateria).length) {
        return (
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Boletim</h2>
                <p style={{ color: C.textMuted }}>Nenhuma nota lançada ainda.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Boletim</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.values(porMateria).map(({ materia, notas: notasMateria }) => {
                    const media = mediaMateria(notasMateria);
                    const bimestres = [1, 2, 3, 4];
                    return (
                        <div key={materia.id} style={{
                            background: C.card, borderRadius: 12,
                            boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden",
                        }}>
                            {/* header matéria */}
                            <div style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
                                background: "#f9fbfa",
                            }}>
                                <span style={{ fontWeight: 600, color: C.text, fontSize: 15 }}>{materia.nome}</span>
                                <span style={{
                                    fontWeight: 700, fontSize: 16,
                                    color: corMedia(media),
                                    background: media !== null ? `${corMedia(media)}18` : C.border,
                                    padding: "2px 12px", borderRadius: 20,
                                }}>
                                    Média: {fmt(media)}
                                </span>
                            </div>

                            {/* bimestres */}
                            <div style={{ padding: "12px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {bimestres.map(bim => {
                                    const notasBim = notasMateria.filter(n => n.avaliacao?.bimestre === bim && !n.avaliacao?.bonificacao);
                                    const bonus = notasMateria.filter(n => n.avaliacao?.bimestre === bim && n.avaliacao?.bonificacao);
                                    const mediaBim = mediaMateria(notasBim);
                                    return (
                                        <div key={bim} style={{
                                            flex: "1 1 180px", background: C.bg, borderRadius: 10,
                                            padding: "12px 16px", border: `1px solid ${C.border}`,
                                        }}>
                                            <div style={{ fontSize: 11, textTransform: "uppercase", color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>
                                                {bim}º Bimestre
                                            </div>
                                            {notasBim.length === 0 && bonus.length === 0 ? (
                                                <span style={{ fontSize: 12, color: C.textMuted }}>Sem notas</span>
                                            ) : (
                                                <>
                                                    {notasBim.map(n => (
                                                        <div key={n.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                                            <span style={{ color: C.textMuted }}>{n.avaliacao?.descricao || n.avaliacao?.tipo || "Avaliação"}</span>
                                                            <span style={{ fontWeight: 600, color: corMedia(parseFloat(n.valor)) }}>{fmt(n.valor)}</span>
                                                        </div>
                                                    ))}
                                                    {bonus.map(n => (
                                                        <div key={n.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                                            <span style={{ color: C.accent }}>+{n.avaliacao?.descricao || "Bônus"}</span>
                                                            <span style={{ color: C.accent, fontWeight: 600 }}>+{fmt(n.valor)}</span>
                                                        </div>
                                                    ))}
                                                    {notasBim.length > 0 && (
                                                        <div style={{
                                                            borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6,
                                                            display: "flex", justifyContent: "space-between", fontSize: 13,
                                                        }}>
                                                            <span style={{ color: C.textMuted }}>Média bim.</span>
                                                            <span style={{ fontWeight: 700, color: corMedia(mediaBim) }}>{fmt(mediaBim)}</span>
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
        </div>
    );
}

// ── Seção: Frequência ─────────────────────────────────────────────
function SecaoFrequencia({ frequencias, carregandoFreq }) {
    const entries = Object.entries(frequencias);

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Frequência</h2>
            {carregandoFreq && <p style={{ color: C.textMuted }}>Carregando...</p>}
            {!carregandoFreq && entries.length === 0 && (
                <p style={{ color: C.textMuted }}>Nenhum registro de frequência encontrado.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {entries.map(([key, f]) => {
                    const pct = f.percentualPresenca ?? 0;
                    const cor = corFreq(pct);
                    return (
                        <div key={key} style={{
                            background: C.card, borderRadius: 12, padding: "16px 20px",
                            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <span style={{ fontWeight: 600, color: C.text, fontSize: 15 }}>{f.materiaNome}</span>
                                <span style={{ fontWeight: 700, fontSize: 16, color: cor }}>{fmt(pct)}%</span>
                            </div>
                            {/* barra */}
                            <div style={{ height: 8, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: cor, borderRadius: 4, transition: "width .5s" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.textMuted }}>
                                <span>Presenças: {f.presentes}/{f.totalAulas}</span>
                                <span>Faltas: {f.faltas}</span>
                                <span style={{ color: pct < 75 ? C.danger : C.textMuted }}>
                                    {pct < 75 ? `⚠ Abaixo de 75%` : "Regular"}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Seção: Horários ───────────────────────────────────────────────
function SecaoHorarios({ horarios }) {
    if (!horarios.length) {
        return (
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Grade Horária</h2>
                <p style={{ color: C.textMuted }}>Nenhum horário cadastrado.</p>
            </div>
        );
    }

    // agrupar por dia
    const porDia = {};
    DIAS.forEach(d => porDia[d] = []);
    horarios.forEach(h => {
        if (porDia[h.diaSemana]) porDia[h.diaSemana].push(h);
    });
    DIAS.forEach(d => porDia[d].sort((a, b) => (a.ordemAula ?? 0) - (b.ordemAula ?? 0)));

    // paleta de cores por matéria
    const cores = ["#1A759F", "#52B69A", "#99D98C", "#c77dff", "#f4a261", "#e63946", "#457b9d", "#2a9d8f"];
    const corMateria = {};
    let idx = 0;
    horarios.forEach(h => {
        if (!corMateria[h.materiaId]) corMateria[h.materiaId] = cores[idx++ % cores.length];
    });

    return (
        <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>Grade Horária</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {DIAS.map(dia => (
                    <div key={dia} style={{
                        background: C.card, borderRadius: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden",
                    }}>
                        <div style={{
                            background: C.sidebar, color: "#fff",
                            padding: "10px 14px", fontSize: 13, fontWeight: 700,
                            textAlign: "center",
                        }}>
                            {DIA_LABEL[dia]}
                        </div>
                        <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                            {porDia[dia].length === 0 ? (
                                <span style={{ fontSize: 12, color: C.textMuted, padding: "8px 6px", textAlign: "center" }}>—</span>
                            ) : porDia[dia].map(h => (
                                <div key={h.id} style={{
                                    borderRadius: 8, padding: "8px 10px",
                                    background: `${corMateria[h.materiaId]}18`,
                                    borderLeft: `3px solid ${corMateria[h.materiaId]}`,
                                }}>
                                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>
                                        {h.horarioInicio ?? `${h.ordemAula}ª aula`}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{h.materiaNome}</div>
                                    <div style={{ fontSize: 11, color: C.textMuted }}>{h.professorNome}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Dashboard principal ───────────────────────────────────────────
export default function AlunoDashboard() {
    const nome = localStorage.getItem("nome") || "Aluno";
    const [aba, setAba] = useState("inicio");
    const [sidebarAberta, setSidebarAberta] = useState(true);

    const [turmas, setTurmas] = useState([]);
    const [notas, setNotas] = useState([]);
    const [frequencias, setFrequencias] = useState({});
    const [horarios, setHorarios] = useState([]);
    const [carregandoFreq, setCarregandoFreq] = useState(false);

    // 1. Busca turmas do aluno
    useEffect(() => {
        api.get("/vinculos/aluno-turma/minhas").then(r => {
            const data = Array.isArray(r.data) ? r.data : [];
            setTurmas(data);
        }).catch(() => {});
    }, []);

    // 2. Busca notas
    useEffect(() => {
        api.get("/notas/minhas").then(r => {
            setNotas(Array.isArray(r.data) ? r.data : []);
        }).catch(() => {});
    }, []);

    // 3. Busca frequência por matéria quando turmas e notas estiverem disponíveis
    useEffect(() => {
        if (!turmas.length || !notas.length) return;
        const turmaAtual = turmas[0];
        if (!turmaAtual?.turma?.id) return;

        const turmaId = turmaAtual.turma.id;

        // coleta matérias únicas das notas
        const materiasMap = {};
        notas.forEach(n => {
            const mat = n.avaliacao?.materia;
            if (mat) materiasMap[mat.id] = mat;
        });
        const materias = Object.values(materiasMap);
        if (!materias.length) return;

        setCarregandoFreq(true);
        Promise.all(
            materias.map(mat =>
                api.get(`/presencas/minhas/${turmaId}/${mat.id}`)
                    .then(r => ({ key: `${turmaId}_${mat.id}`, materiaNome: mat.nome, ...r.data }))
                    .catch(() => null)
            )
        ).then(results => {
            const freq = {};
            results.filter(Boolean).forEach(f => { freq[f.key] = f; });
            setFrequencias(freq);
            setCarregandoFreq(false);
        });
    }, [turmas, notas]);

    // 4. Busca horários
    useEffect(() => {
        api.get("/horarios/minhas").then(r => {
            setHorarios(Array.isArray(r.data) ? r.data : []);
        }).catch(() => {});
    }, []);

    const SIDEBAR_W = 220;

    return (
        <div style={{ minHeight: "100vh", background: C.bg, display: "flex" }}>
            <Sidebar
                aba={aba} setAba={setAba}
                nome={nome}
                sidebarAberta={sidebarAberta}
                setSidebarAberta={setSidebarAberta}
            />

            {/* conteúdo */}
            <main style={{
                marginLeft: sidebarAberta ? SIDEBAR_W : 0,
                flex: 1, padding: "28px 32px",
                transition: "margin-left .25s ease",
                minWidth: 0,
            }}>
                {/* topbar */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                    <button
                        onClick={() => setSidebarAberta(v => !v)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.text }}
                    >
                        {sidebarAberta ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div>
                        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: C.textMuted }}>
                            DomGestão — Portal do Aluno
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                            {MENU.find(m => m.id === aba)?.label}
                        </div>
                    </div>
                </div>

                {aba === "inicio"     && <SecaoInicio turmas={turmas} notas={notas} frequencias={frequencias} />}
                {aba === "boletim"    && <SecaoBoletim notas={notas} />}
                {aba === "frequencia" && <SecaoFrequencia frequencias={frequencias} carregandoFreq={carregandoFreq} />}
                {aba === "horarios"   && <SecaoHorarios horarios={horarios} />}
            </main>
        </div>
    );
}
