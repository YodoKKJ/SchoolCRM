import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { isNewUIEnabled, setNewUI } from "../featureFlag";
import "./Login.css";

function Eye({ closed }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {closed ? (
        <>
          <path d="M3 10s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
          <path d="M3 3l14 14" strokeWidth="1.2" />
        </>
      ) : (
        <>
          <path d="M3 10s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
          <circle cx="10" cy="10" r="2.2" />
        </>
      )}
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="arrow" aria-hidden="true">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10l4 4 8-8" />
    </svg>
  );
}

function postLoginPath(slug, role) {
  const useNew = isNewUIEnabled();
  const base = `/escola/${slug}`;
  const module = role === "PROFESSOR" ? "professor" : role === "ALUNO" ? "aluno" : "direcao";
  return useNew ? `/new${base}` : `${base}/${module}`;
}

export default function Login() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [focusL, setFocusL] = useState(false);
  const [focusS, setFocusS] = useState(false);

  const [escolaNome, setEscolaNome] = useState("");
  const [escolaInicial, setEscolaInicial] = useState("");
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (!slug) {
      document.title = "Skolyo";
      return;
    }
    axios
      .get(`/auth/escola/${slug}`)
      .then((res) => {
        setEscolaNome(res.data.nome || "");
        setEscolaInicial((res.data.nome || "·").trim()[0]?.toLowerCase() || "·");
        if (res.data.logoUrl) setLogoUrl(`/escolas/logo/${slug}`);
        document.title = res.data.nome ? `${res.data.nome} · Skolyo` : "Skolyo";
      })
      .catch(() => {
        setErro("Escola não encontrada. Verifique o link.");
      });
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!slug) {
      setErro("Link inválido. Acesse pelo link da sua escola.");
      return;
    }
    if (!login.trim() || !senha) {
      setErro("Informe login e senha.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/auth/login", {
        login,
        senha,
        escolaSlug: slug,
        lembrar: lembrar ? "true" : "false",
      });
      const {
        token,
        role,
        nome,
        id,
        escolaSlug,
        escolaNome: nomeEscola,
        corPrimaria,
        corSecundaria,
        logoUrl: lu,
      } = data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("nome", nome);
      localStorage.setItem("userId", String(id));
      localStorage.setItem("escolaSlug", escolaSlug);
      localStorage.setItem("escolaNome", nomeEscola || "");
      if (corPrimaria) localStorage.setItem("corPrimaria", corPrimaria);
      if (corSecundaria) localStorage.setItem("corSecundaria", corSecundaria);
      if (lu) localStorage.setItem("escolaLogoUrl", lu);
      else localStorage.removeItem("escolaLogoUrl");

      // Como chegamos no /new/escola/:slug/login, marca a flag para persistir
      setNewUI(true);

      window.location.href = postLoginPath(escolaSlug, role);
    } catch (err) {
      const msg = err.response?.data;
      setErro(typeof msg === "string" ? msg : "Login ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const switchToClassic = () => {
    setNewUI(false);
    navigate(`/escola/${slug}/login`);
  };

  return (
    <div className="skolyo-login">
      <div className="shell">
        {/* HERO (esquerda, dark, minimal) */}
        <aside className="hero" data-variant="minimal">
          <div className="bg-minimal" />
          <header className="hero-brand">
            <img src="/skolyo-logo.svg" alt="Skolyo" />
            <span className="name">Skolyo</span>
          </header>
          <div className="hero-body">
            <div className="hero-eyebrow">ERP · 2026</div>
            <h1 className="hero-title">
              Gestão escolar
              <br />
              <span className="it">inteligente.</span>
            </h1>
            <p className="hero-sub">
              Sistema integrado de administração, finanças e acadêmico. Uma
              interface só para toda a escola.
            </p>
          </div>
          <footer className="hero-foot">
            <span><span className="dot" />v2.4.0</span>
            <span>© {new Date().getFullYear()} Skolyo</span>
          </footer>
        </aside>

        {/* FORM (direita) */}
        <section className="form-side">
          <div className="form-top">
            <div className="form-top-brand">
              <img src="/skolyo-logo.svg" alt="Skolyo" />
              <span className="n">Skolyo</span>
            </div>
            <button
              type="button"
              className="link"
              onClick={switchToClassic}
              title="Usar UI clássica"
            >
              ui clássica
            </button>
          </div>

          <div className="form-wrap">
            <div className="form-eyebrow">Acesso ao sistema</div>
            <h2 className="form-title">Bem-vindo.</h2>
            <p className="form-sub">
              Entre com as suas credenciais para continuar.
            </p>

            {escolaNome && (
              <div className="escola-badge">
                {logoUrl ? (
                  <img className="logo-img" src={logoUrl} alt="" />
                ) : (
                  <span className="logo">{(escolaInicial || "·").toUpperCase()}</span>
                )}
                <span className="name">{escolaNome}</span>
                <span className="sep">·</span>
                <span className="slug">{slug}</span>
              </div>
            )}

            {!slug && !erro && (
              <div className="erro">
                Acesse pelo link da sua escola para fazer login.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="field-label" htmlFor="login-user">Login</label>
                <div className={`field-wrap ${focusL ? "focused" : ""}`}>
                  <input
                    id="login-user"
                    className="field-input"
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    onFocus={() => setFocusL(true)}
                    onBlur={() => setFocusL(false)}
                    placeholder="seu.usuario"
                    autoComplete="username"
                    disabled={!slug}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="login-pw">Senha</label>
                <div className={`field-wrap ${focusS ? "focused" : ""}`}>
                  <input
                    id="login-pw"
                    className="field-input"
                    type={showPw ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    onFocus={() => setFocusS(true)}
                    onBlur={() => setFocusS(false)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={!slug}
                    style={{ paddingRight: 54 }}
                  />
                  <button
                    type="button"
                    className="field-right-btn"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                  >
                    <Eye closed={!showPw} />
                  </button>
                </div>
              </div>

              <div className="row-between">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                  />
                  <span className="box">
                    <CheckIcon />
                  </span>
                  Lembrar por 30 dias
                </label>
                <button type="button" className="link">
                  Esqueci minha senha
                </button>
              </div>

              {erro && <div className="erro">{erro}</div>}

              <button
                type="submit"
                className="submit"
                disabled={loading || !slug}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> verificando…
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight />
                  </>
                )}
              </button>
            </form>

            <p className="form-foot">Acesso restrito a usuários autorizados.</p>
          </div>

          <div className="copyright">Skolyo ERP · {new Date().getFullYear()}</div>
        </section>
      </div>
    </div>
  );
}
