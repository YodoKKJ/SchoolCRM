import { useState } from "react";
import axios from "axios";

export default function MasterLogin() {
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);
    const [focusLogin, setFocusLogin] = useState(false);
    const [focusSenha, setFocusSenha] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);
        try {
            const response = await axios.post("/auth/master-login", { login, senha });
            const { token, role, nome, id } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("nome", nome);
            localStorage.setItem("userId", String(id));
            window.location.href = "/master";
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

                .ml-root {
                    min-height: 100vh;
                    display: flex;
                    background: #f0f0f8;
                    font-family: 'DM Sans', sans-serif;
                }

                .ml-left {
                    display: none;
                    width: 52%;
                    position: relative;
                    overflow: hidden;
                    background: #111;
                }
                @media (min-width: 900px) { .ml-left { display: block; } }

                .ml-left-bg {
                    position: absolute;
                    inset: 0;
                    background:
                        radial-gradient(ellipse 80% 60% at 20% 80%, #2d1b6955 0%, transparent 60%),
                        radial-gradient(ellipse 60% 80% at 80% 20%, #4f46e566 0%, transparent 60%),
                        #0f0f23;
                }

                .ml-left-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 48px 48px;
                }

                .ml-left-content {
                    position: relative;
                    z-index: 2;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 52px 56px;
                }

                .ml-left-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .ml-left-logo-mark {
                    width: 36px;
                    height: 36px;
                    border: 1.5px solid rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ml-left-logo-mark svg {
                    width: 16px;
                    height: 16px;
                }

                .ml-left-logo-name {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.6);
                }

                .ml-left-headline {
                    font-family: 'Playfair Display', serif;
                    font-size: clamp(36px, 4vw, 52px);
                    font-weight: 700;
                    line-height: 1.12;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .ml-left-headline em {
                    font-style: italic;
                    color: #a5b4fc;
                }

                .ml-left-tagline {
                    font-size: 13px;
                    color: rgba(255,255,255,0.35);
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin-top: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .ml-left-tagline::before {
                    content: '';
                    width: 32px;
                    height: 1px;
                    background: rgba(255,255,255,0.2);
                    display: block;
                }

                .ml-left-footer {
                    font-size: 11px;
                    color: rgba(255,255,255,0.2);
                    letter-spacing: 0.04em;
                }

                .ml-right {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 24px;
                }

                .ml-form-box {
                    width: 100%;
                    max-width: 380px;
                }

                .ml-mobile-logo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 32px;
                }
                @media (min-width: 900px) { .ml-mobile-logo { display: none; } }

                .ml-mobile-logo-mark {
                    width: 30px;
                    height: 30px;
                    background: #1e1b4b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ml-mobile-logo-name {
                    font-size: 12px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #1e1b4b;
                    opacity: 0.5;
                }

                .ml-eyebrow {
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    color: #4f46e5;
                    margin-bottom: 12px;
                }

                .ml-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e1b4b;
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                    margin-bottom: 8px;
                }

                .ml-subtitle {
                    font-size: 14px;
                    color: #8a8a9a;
                    font-weight: 300;
                    margin-bottom: 40px;
                    line-height: 1.5;
                }

                .ml-field {
                    margin-bottom: 20px;
                }

                .ml-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #8a8a9a;
                    margin-bottom: 8px;
                }

                .ml-field-wrap {
                    position: relative;
                    border-bottom: 1.5px solid #d4d4e0;
                    transition: border-color 0.2s;
                }

                .ml-field-wrap.focused {
                    border-color: #1e1b4b;
                }

                .ml-input {
                    width: 100%;
                    border: none;
                    background: transparent;
                    padding: 10px 0;
                    font-size: 15px;
                    font-family: 'DM Sans', sans-serif;
                    font-weight: 400;
                    color: #1e1b4b;
                    outline: none;
                }

                .ml-input::placeholder {
                    color: #c0c0d0;
                }

                .ml-field-line {
                    position: absolute;
                    bottom: -1.5px;
                    left: 0;
                    height: 1.5px;
                    background: #4f46e5;
                    width: 0;
                    transition: width 0.3s ease;
                }

                .ml-field-wrap.focused .ml-field-line {
                    width: 100%;
                }

                .ml-erro {
                    font-size: 12px;
                    color: #b94040;
                    margin-bottom: 20px;
                    padding: 10px 14px;
                    background: #fdf0f0;
                    border-left: 3px solid #b94040;
                }

                .ml-btn {
                    width: 100%;
                    background: #1e1b4b;
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

                .ml-btn:hover:not(:disabled) {
                    background: #4f46e5;
                }

                .ml-btn:disabled {
                    opacity: 0.5;
                    cursor: default;
                }

                .ml-btn .ml-arrow {
                    display: inline-block;
                    margin-left: 8px;
                    transition: transform 0.2s;
                }

                .ml-btn:hover:not(:disabled) .ml-arrow {
                    transform: translateX(4px);
                }

                .ml-footer {
                    margin-top: 32px;
                    font-size: 11px;
                    color: #b0b0c0;
                    letter-spacing: 0.04em;
                }
            `}</style>

            <div className="ml-root">

                {/* Painel esquerdo (desktop) */}
                <div className="ml-left">
                    <div className="ml-left-bg" />
                    <div className="ml-left-grid" />
                    <div className="ml-left-content">
                        <div className="ml-left-logo">
                            <div className="ml-left-logo-mark">
                                <svg viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
                                    <circle cx="8" cy="8" r="2" fill="#a5b4fc" />
                                </svg>
                            </div>
                            <span className="ml-left-logo-name">DomGestão</span>
                        </div>

                        <div>
                            <h1 className="ml-left-headline">
                                Administração<br />
                                <em>centralizada.</em>
                            </h1>
                            <p className="ml-left-tagline">Painel master do sistema</p>
                        </div>

                        <p className="ml-left-footer">&copy; {new Date().getFullYear()} DomGestão</p>
                    </div>
                </div>

                {/* Painel direito */}
                <div className="ml-right">
                    <div className="ml-form-box">

                        {/* logo mobile */}
                        <div className="ml-mobile-logo">
                            <div className="ml-mobile-logo-mark">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" />
                                    <circle cx="8" cy="8" r="2" fill="#a5b4fc" />
                                </svg>
                            </div>
                            <span className="ml-mobile-logo-name">DomGestão</span>
                        </div>

                        <p className="ml-eyebrow">Acesso restrito</p>
                        <h2 className="ml-title">Painel Master</h2>
                        <p className="ml-subtitle">Acesso restrito a administradores do sistema</p>

                        <form onSubmit={handleLogin}>
                            <div className="ml-field">
                                <label className="ml-label">Login</label>
                                <div className={`ml-field-wrap ${focusLogin ? "focused" : ""}`}>
                                    <input
                                        className="ml-input"
                                        type="text"
                                        value={login}
                                        onChange={e => setLogin(e.target.value)}
                                        onFocus={() => setFocusLogin(true)}
                                        onBlur={() => setFocusLogin(false)}
                                        placeholder="yodo"
                                        autoComplete="username"
                                    />
                                    <div className="ml-field-line" />
                                </div>
                            </div>

                            <div className="ml-field">
                                <label className="ml-label">Senha</label>
                                <div className={`ml-field-wrap ${focusSenha ? "focused" : ""}`}>
                                    <input
                                        className="ml-input"
                                        type="password"
                                        value={senha}
                                        onChange={e => setSenha(e.target.value)}
                                        onFocus={() => setFocusSenha(true)}
                                        onBlur={() => setFocusSenha(false)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <div className="ml-field-line" />
                                </div>
                            </div>

                            {erro && <div className="ml-erro">{erro}</div>}

                            <button type="submit" className="ml-btn" disabled={loading}>
                                {loading ? "Verificando..." : <>Entrar <span className="ml-arrow">&rarr;</span></>}
                            </button>
                        </form>

                        <p className="ml-footer">Acesso exclusivo para administradores master.</p>
                    </div>
                </div>

            </div>
        </>
    );
}
