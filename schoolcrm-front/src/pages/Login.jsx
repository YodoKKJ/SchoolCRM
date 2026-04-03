import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Login() {
    const { slug } = useParams();
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const [focusLogin, setFocusLogin] = useState(false);
    const [focusSenha, setFocusSenha] = useState(false);
    const [lembrar, setLembrar] = useState(false);
    const dark = localStorage.getItem("theme") === "dark";
    const [escolaNome, setEscolaNome] = useState("");
    const [corPrimaria, setCorPrimaria] = useState("#7ec8a0");
    const [corSecundaria, setCorSecundaria] = useState("#3a8d5c");

    useEffect(() => {
        if (slug) {
            axios.get(`/auth/escola/${slug}`)
                .then(res => {
                    setEscolaNome(res.data.nome);
                    if (res.data.corPrimaria) setCorPrimaria(res.data.corPrimaria);
                    if (res.data.corSecundaria) setCorSecundaria(res.data.corSecundaria);
                    document.title = res.data.nome || "Skolyo";
                })
                .catch(() => setErro("Escola não encontrada. Verifique o link."));
        } else {
            document.title = "Skolyo";
        }
    }, [slug]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");

        if (!slug) {
            setErro("Link inválido. Acesse pelo link da sua escola.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("/auth/login", {
                login,
                senha,
                escolaSlug: slug,
                lembrar: lembrar ? "true" : "false",
            });
            const { token, role, nome, id, escolaSlug, escolaNome: nomeEscola, corPrimaria: cp, corSecundaria: cs } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("nome", nome);
            localStorage.setItem("userId", String(id));
            localStorage.setItem("escolaSlug", escolaSlug);
            localStorage.setItem("escolaNome", nomeEscola);
            localStorage.setItem("corPrimaria", cp || "#7ec8a0");
            localStorage.setItem("corSecundaria", cs || "#3a8d5c");

            const basePath = `/escola/${escolaSlug}`;
            if (role === "DIRECAO" || role === "COORDENACAO") window.location.href = `${basePath}/direcao`;
            else if (role === "PROFESSOR") window.location.href = `${basePath}/professor`;
            else if (role === "ALUNO") window.location.href = `${basePath}/aluno`;
        } catch (err) {
            setErro(err.response?.data || "Login ou senha incorretos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                @keyframes loginFadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes loginSpinner { to { transform:rotate(360deg); } }

                .login-root {
                    min-height: 100vh;
                    display: flex;
                    background: #f5f2ed;
                    font-family: 'DM Sans', sans-serif;
                }

                .form-box { animation: loginFadeIn .5s ease both; }

                /* ── lado esquerdo ── */
                .left-panel {
                    display: none;
                    width: 52%;
                    position: relative;
                    overflow: hidden;
                    background: #111;
                }
                @media (min-width: 900px) { .left-panel { display: block; } }

                .left-bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 80% 60% at 20% 80%, #1a4d3a55 0%, transparent 60%),
                        radial-gradient(ellipse 60% 80% at 80% 20%, #2c6e4966 0%, transparent 60%),
                        #0d1f18;
                }

                /* grade fina sobre o fundo */
                .left-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 48px 48px;
                }

                .left-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 52px 56px;
                }

                .left-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .left-logo-mark {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, var(--cor1) 0%, var(--cor2) 100%);
                    box-shadow: 0 2px 8px color-mix(in srgb, var(--cor1) 30%, transparent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .left-logo-mark svg {
                    width: 16px;
                    height: 16px;
                }

                .left-logo-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: rgba(255,255,255,0.85);
                }

                .left-headline {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(36px, 4vw, 52px);
                    font-weight: 700;
                    line-height: 1.12;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .left-headline em {
                    font-style: italic;
                    color: var(--cor1);
                }

                .left-tagline {
                    font-size: 13px;
                    color: rgba(255,255,255,0.35);
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin-top: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .left-tagline::before {
                    content: '';
                    width: 32px;
                    height: 1px;
                    background: rgba(255,255,255,0.2);
                    display: block;
                }

                .left-footer {
                    font-size: 11px;
                    color: rgba(255,255,255,0.2);
                    letter-spacing: 0.04em;
                }

                /* ── lado direito ── */
                .right-panel {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 24px;
                }

                .form-box {
                    width: 100%;
                    max-width: 380px;
                }

                .form-eyebrow {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: var(--cor1);
                    margin-bottom: 12px;
                }

                .form-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 32px;
                    font-weight: 700;
                    color: #0d1f18;
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                    margin-bottom: 8px;
                }

                .form-subtitle {
                    font-size: 14px;
                    color: #8a9490;
                    font-weight: 300;
                    margin-bottom: 40px;
                    line-height: 1.5;
                }

                .escola-badge {
                    display: inline-block;
                    background: color-mix(in srgb, var(--cor1) 12%, #fff);
                    color: var(--cor2);
                    font-size: 12px;
                    font-weight: 500;
                    letter-spacing: 0.04em;
                    padding: 6px 14px;
                    margin-bottom: 24px;
                    border-left: 3px solid var(--cor1);
                }

                /* mobile logo */
                .mobile-logo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 32px;
                }
                @media (min-width: 900px) { .mobile-logo { display: none; } }

                .mobile-logo-mark {
                    width: 30px;
                    height: 30px;
                    border-radius: 7px;
                    background: linear-gradient(135deg, var(--cor1) 0%, var(--cor2) 100%);
                    box-shadow: 0 2px 6px color-mix(in srgb, var(--cor1) 25%, transparent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-logo-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 15px;
                    font-weight: 700;
                    letter-spacing: -0.01em;
                    color: #0d1f18;
                }

                /* campos */
                .field {
                    margin-bottom: 20px;
                }

                .field-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #8a9490;
                    margin-bottom: 8px;
                }

                .field-wrap {
                    position: relative;
                    border-bottom: 1.5px solid #d4d9d6;
                    transition: border-color 0.2s;
                }

                .field-wrap.focused {
                    border-color: #0d1f18;
                }

                .field-input {
                    width: 100%;
                    border: none;
                    background: transparent;
                    padding: 10px 0;
                    font-size: 15px;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 400;
                    color: #0d1f18;
                    outline: none;
                }

                .field-input::placeholder {
                    color: #c0c8c4;
                }

                /* linha animada sob o campo */
                .field-line {
                    position: absolute;
                    bottom: -1.5px;
                    left: 0;
                    height: 1.5px;
                    background: #0d1f18;
                    width: 0;
                    transition: width 0.3s ease;
                }

                .field-wrap.focused .field-line {
                    width: 100%;
                }

                /* erro */
                .erro-msg {
                    font-size: 12px;
                    color: #b94040;
                    margin-bottom: 20px;
                    padding: 10px 14px;
                    background: #fdf0f0;
                    border-left: 3px solid #b94040;
                }

                /* botão */
                .btn-submit {
                    width: 100%;
                    background: #0d1f18;
                    color: #fff;
                    border: none;
                    padding: 16px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    cursor: pointer;
                    margin-top: 8px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.2s ease;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #1a4d3a;
                    box-shadow: 0 4px 12px rgba(13,31,24,.25);
                }

                .btn-submit:active:not(:disabled) {
                    transform: scale(0.98);
                }

                .btn-submit:disabled {
                    opacity: 0.6;
                    cursor: default;
                }

                .btn-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: loginSpinner .6s linear infinite;
                }

                .btn-submit .btn-arrow {
                    display: inline-block;
                    margin-left: 8px;
                    transition: transform 0.2s;
                }

                .btn-submit:hover:not(:disabled) .btn-arrow {
                    transform: translateX(4px);
                }

                /* lembrar */
                .lembrar-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 24px;
                    cursor: pointer;
                    user-select: none;
                }

                .lembrar-box {
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid #d4d9d6;
                    background: transparent;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: border-color 0.2s, background 0.2s;
                }

                .lembrar-box.checked {
                    border-color: #0d1f18;
                    background: #0d1f18;
                }

                .lembrar-label {
                    font-size: 12px;
                    color: #8a9490;
                    letter-spacing: 0.04em;
                }

                /* rodapé */
                .form-footer {
                    margin-top: 32px;
                    font-size: 11px;
                    color: #b0bab6;
                    letter-spacing: 0.04em;
                }

                /* ── Dark Mode ── */
                [data-theme="dark"].login-root { background: #0f1a14; }
                [data-theme="dark"] .right-panel { background: #0f1a14; }
                [data-theme="dark"] .form-title { color: #e0ebe3; }
                [data-theme="dark"] .form-subtitle { color: #5a7a65; }
                [data-theme="dark"] .form-eyebrow { color: var(--cor1); }
                [data-theme="dark"] .field-label { color: #5a7a65; }
                [data-theme="dark"] .field-wrap { border-bottom-color: #2a3d32; }
                [data-theme="dark"] .field-wrap.focused { border-color: var(--cor1); }
                [data-theme="dark"] .field-input { color: #e0ebe3; }
                [data-theme="dark"] .field-input::placeholder { color: #3a5a48; }
                [data-theme="dark"] .field-line { background: var(--cor1); }
                [data-theme="dark"] .lembrar-label { color: #5a7a65; }
                [data-theme="dark"] .lembrar-box { border-color: #2a3d32; }
                [data-theme="dark"] .lembrar-box.checked { border-color: var(--cor1); background: var(--cor1); }
                [data-theme="dark"] .btn-submit { background: var(--cor1); color: #0a1a12; }
                [data-theme="dark"] .btn-submit:hover:not(:disabled) { background: var(--cor2); }
                [data-theme="dark"] .erro-msg { background: rgba(185,64,64,.15); }
                [data-theme="dark"] .form-footer { color: #3a5a48; }
                [data-theme="dark"] .mobile-logo-mark { background: #1a2e23; }
                [data-theme="dark"] .mobile-logo-name { color: #7a9a85; }
            `}</style>

            <div className="login-root" data-theme={dark ? "dark" : "light"} style={{ "--cor1": corPrimaria, "--cor2": corSecundaria }}>

                {/* ── Painel esquerdo (desktop) ── */}
                <div className="left-panel">
                    <div className="left-bg" />
                    <div className="left-grid" />
                    <div className="left-content">
                        <div className="left-logo">
                            <div className="left-logo-mark">
                                <svg viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
                                    <circle cx="8" cy="8" r="2" fill="#fff" />
                                </svg>
                            </div>
                            <span className="left-logo-name">{escolaNome || "Sistema Escolar"}</span>
                        </div>

                        <div>
                            <h1 className="left-headline">
                                Gestão escolar<br />
                                <em>inteligente.</em>
                            </h1>
                            <p className="left-tagline">Sistema integrado de administração</p>
                        </div>

                        <p className="left-footer">© {new Date().getFullYear()} {escolaNome || "Sistema Escolar"}</p>
                    </div>
                </div>

                {/* ── Painel direito ── */}
                <div className="right-panel">
                    <div className="form-box">

                        {/* logo mobile */}
                        <div className="mobile-logo">
                            <div className="mobile-logo-mark">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
                                    <circle cx="8" cy="8" r="2" fill="#fff" />
                                </svg>
                            </div>
                            <span className="mobile-logo-name">{escolaNome || "Sistema Escolar"}</span>
                        </div>

                        <p className="form-eyebrow">Acesso ao sistema</p>
                        <h2 className="form-title">Bem-vindo</h2>
                        <p className="form-subtitle">Insira suas credenciais para continuar.</p>

                        {escolaNome && <div className="escola-badge">{escolaNome}</div>}

                        {!slug && (
                            <div className="erro-msg">
                                Acesse pelo link da sua escola para fazer login.
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="field">
                                <label className="field-label">Login</label>
                                <div className={`field-wrap ${focusLogin ? "focused" : ""}`}>
                                    <input
                                        className="field-input"
                                        type="text"
                                        value={login}
                                        onChange={e => setLogin(e.target.value)}
                                        onFocus={() => setFocusLogin(true)}
                                        onBlur={() => setFocusLogin(false)}
                                        placeholder="seu.login"
                                        autoComplete="username"
                                        disabled={!slug}
                                    />
                                    <div className="field-line" />
                                </div>
                            </div>

                            <div className="field">
                                <label className="field-label">Senha</label>
                                <div className={`field-wrap ${focusSenha ? "focused" : ""}`}>
                                    <input
                                        className="field-input"
                                        type="password"
                                        value={senha}
                                        onChange={e => setSenha(e.target.value)}
                                        onFocus={() => setFocusSenha(true)}
                                        onBlur={() => setFocusSenha(false)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        disabled={!slug}
                                    />
                                    <div className="field-line" />
                                </div>
                            </div>

                            <div className="lembrar-row" onClick={() => setLembrar(v => !v)}>
                                <div className={`lembrar-box ${lembrar ? "checked" : ""}`}>
                                    {lembrar && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                                <span className="lembrar-label">Lembrar de mim por 30 dias</span>
                            </div>

                            {erro && <div className="erro-msg">{erro}</div>}

                            <button type="submit" className="btn-submit" disabled={loading || !slug}>
                                {loading ? <><div className="btn-spinner" /> Verificando...</> : <>Entrar <span className="btn-arrow">→</span></>}
                            </button>
                        </form>

                        <p className="form-footer">Acesso restrito a usuários autorizados.</p>
                    </div>
                </div>

            </div>
        </>
    );
}
