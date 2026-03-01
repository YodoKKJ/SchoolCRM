import { useState } from "react";
import axios from "axios";

export default function Login() {
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const [focusLogin, setFocusLogin] = useState(false);
    const [focusSenha, setFocusSenha] = useState(false);
    const [lembrar, setLembrar] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);
        try {
            const response = await axios.post("/auth/login", { login, senha, lembrar: lembrar ? "true" : "false" });
            const { token, role, nome } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("nome", nome);
            if (role === "DIRECAO") window.location.href = "/direcao";
            else if (role === "PROFESSOR") window.location.href = "/professor";
            else if (role === "ALUNO") window.location.href = "/aluno";
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

                .login-root {
                    min-height: 100vh;
                    display: flex;
                    background: #f5f2ed;
                    font-family: 'DM Sans', sans-serif;
                }

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
                    border: 1.5px solid rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .left-logo-mark svg {
                    width: 16px;
                    height: 16px;
                }

                .left-logo-name {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.6);
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
                    color: #7ec8a0;
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
                    color: #7ec8a0;
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
                    background: #0d1f18;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-logo-name {
                    font-size: 12px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #0d1f18;
                    opacity: 0.5;
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
                    transition: background 0.2s;
                }

                .btn-submit:hover:not(:disabled) {
                    background: #1a4d3a;
                }

                .btn-submit:disabled {
                    opacity: 0.5;
                    cursor: default;
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
            `}</style>

            <div className="login-root">

                {/* ── Painel esquerdo (desktop) ── */}
                <div className="left-panel">
                    <div className="left-bg" />
                    <div className="left-grid" />
                    <div className="left-content">
                        <div className="left-logo">
                            <div className="left-logo-mark">
                                <svg viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
                                    <circle cx="8" cy="8" r="2" fill="#7ec8a0" />
                                </svg>
                            </div>
                            <span className="left-logo-name">DomGestão</span>
                        </div>

                        <div>
                            <h1 className="left-headline">
                                Gestão escolar<br />
                                <em>inteligente.</em>
                            </h1>
                            <p className="left-tagline">Sistema integrado de administração</p>
                        </div>

                        <p className="left-footer">© {new Date().getFullYear()} DomGestão</p>
                    </div>
                </div>

                {/* ── Painel direito ── */}
                <div className="right-panel">
                    <div className="form-box">

                        {/* logo mobile */}
                        <div className="mobile-logo">
                            <div className="mobile-logo-mark">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" />
                                    <circle cx="8" cy="8" r="2" fill="#7ec8a0" />
                                </svg>
                            </div>
                            <span className="mobile-logo-name">DomGestão</span>
                        </div>

                        <p className="form-eyebrow">Acesso ao sistema</p>
                        <h2 className="form-title">Bem-vindo</h2>
                        <p className="form-subtitle">Insira suas credenciais para continuar.</p>

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

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? "Verificando..." : <>Entrar <span className="btn-arrow">→</span></>}
                            </button>
                        </form>

                        <p className="form-footer">Acesso restrito a usuários autorizados.</p>
                    </div>
                </div>

            </div>
        </>
    );
}