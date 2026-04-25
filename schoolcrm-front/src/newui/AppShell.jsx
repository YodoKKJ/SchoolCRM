import { useMemo, useRef, useState, useEffect } from "react";
import Icon from "./Icon";
import useTheme from "./useTheme";
import { APP_VERSION } from "../version";

const ROLE_ALLOWED = {
  ALUNO: new Set(["inicio"]),
  PROFESSOR: new Set(["inicio", "academico", "comunicacao"]),
  COORDENACAO: new Set(["inicio", "academico", "pessoas", "comunicacao", "relatorios"]),
  DIRECAO: new Set(["inicio", "academico", "pessoas", "financeiro", "comunicacao", "relatorios", "configuracoes"]),
  MASTER: new Set(["inicio", "academico", "pessoas", "financeiro", "comunicacao", "relatorios", "configuracoes"]),
};

const NAV = [
  { id: "inicio",        label: "Início",        icon: "home" },
  { id: "academico",     label: "Acadêmico",      icon: "school",   hasSub: true },
  { id: "pessoas",       label: "Pessoas",        icon: "users",    hasSub: true },
  { id: "financeiro",    label: "Financeiro",     icon: "dollar",   hasSub: true },
  { id: "comunicacao",   label: "Comunicação",    icon: "mail" },
  { id: "relatorios",    label: "Relatórios",     icon: "chart" },
  { id: "configuracoes", label: "Configurações",  icon: "settings" },
];

const SUBNAV = {
  academico: [
    { id: "turmas", label: "Turmas", icon: "users" },
    { id: "materias", label: "Matérias", icon: "book" },
    { id: "horarios", label: "Horários", icon: "calendar" },
    { id: "atrasos", label: "Atrasos", icon: "clock" },
    { id: "lancamentos", label: "Lançamentos", icon: "edit" },
    { id: "boletins", label: "Boletins", icon: "clipboard" },
  ],
  pessoas: [
    { id: "usuarios", label: "Usuários", icon: "users" },
    { id: "responsaveis", label: "Responsáveis", icon: "users" },
  ],
  financeiro: [
    { id: "dashboard",     label: "Dashboard",    icon: "chart" },
    { id: "contratos",     label: "Contratos",    icon: "clipboard" },
    { id: "receber",       label: "A Receber",    icon: "dollar" },
    { id: "pagar",         label: "A Pagar",      icon: "dollar" },
    { id: "movimentacoes", label: "Movimentações", icon: "edit" },
    { id: "funcionarios",  label: "Funcionários", icon: "users" },
  ],
};

function getInitials(name) {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function roleLabel(role) {
  switch (role) {
    case "DIRECAO": return "Direção";
    case "COORDENACAO": return "Coordenação";
    case "PROFESSOR": return "Professor";
    case "ALUNO": return "Aluno";
    case "MASTER": return "Master";
    default: return role || "—";
  }
}

function AboutPopover({ onClose }) {
  const escolaNome = typeof window !== "undefined" ? localStorage.getItem("escolaNome") || "" : "";
  const escolaSlug = typeof window !== "undefined" ? localStorage.getItem("escolaSlug") || "" : "";

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        zIndex: 200,
        width: 260,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,.18)",
        overflow: "hidden",
      }}
    >
      {/* Header dark */}
      <div
        style={{
          background: "var(--ink)",
          padding: "14px 16px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <img src="/skolyo-logo.svg" alt="Skolyo" style={{ width: 22, height: 22, filter: "brightness(0) invert(1)" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: ".02em" }}>Skolyo ERP</div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,.45)",
              fontFamily: "var(--font-mono)",
              letterSpacing: ".08em",
              marginTop: 1,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "var(--ok)",
                display: "inline-block", flexShrink: 0,
              }}
            />
            v{APP_VERSION}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ padding: "12px 16px", display: "grid", gap: 8 }}>
        {[
          { label: "Versão",    value: `v${APP_VERSION}` },
          { label: "Ambiente",  value: window.location.hostname.includes("homolog") ? "Homologação" : "Produção" },
          ...(escolaNome ? [{ label: "Escola",   value: escolaNome }] : []),
          ...(escolaSlug ? [{ label: "Slug",     value: escolaSlug }] : []),
          { label: "Build",     value: "2026" },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.label}</span>
            <span
              style={{
                fontSize: 11, fontFamily: "var(--font-mono)",
                color: "var(--ink-2)", fontWeight: 600,
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 10,
          color: "var(--ink-3)",
          fontFamily: "var(--font-mono)",
          letterSpacing: ".06em",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>© {new Date().getFullYear()} Skolyo</span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: 10, padding: 0 }}
        >
          fechar
        </button>
      </div>
    </div>
  );
}

export default function AppShell({
  section = "inicio",
  page,
  onNav,
  onSubNav,
  contextLabels = [],
  children,
}) {
  const { theme, toggle } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const userName = typeof window !== "undefined" ? localStorage.getItem("nome") || "Usuário" : "Usuário";
  const allowed = ROLE_ALLOWED[role] || ROLE_ALLOWED.DIRECAO;

  const visibleNav = useMemo(
    () => NAV.filter((n) => allowed.has(n.id)),
    [allowed]
  );

  const subs = SUBNAV[section] || [];

  // Fechar popover ao clicar fora
  useEffect(() => {
    if (!aboutOpen) return;
    const handler = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [aboutOpen]);

  return (
    <div className="skolyo-ui" data-theme={theme}>
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <img src="/skolyo-logo.svg" alt="Skolyo" />
            <div>
              <div className="brand-name">Skolyo</div>
              <div
                className="brand-sub"
                style={{ display: "flex", alignItems: "center", gap: 5 }}
              >
                <span
                  style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: "var(--ok)",
                    display: "inline-block", flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "var(--font-mono)", letterSpacing: ".04em" }}>
                  v{APP_VERSION}
                </span>
              </div>
            </div>
          </div>
          <nav className="topnav">
            {visibleNav.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`tnav ${section === n.id ? "active" : ""}`}
                onClick={() => onNav?.(n.id)}
              >
                <Icon name={n.icon} />
                {n.label}
                {n.hasSub && <Icon name="chevDown" size={10} />}
              </button>
            ))}
          </nav>
          <div className="top-right">
            <div className="search" role="search">
              <Icon name="search" size={13} />
              <span>Buscar alunos, turmas…</span>
              <span className="kbd">⌘K</span>
            </div>
            <button
              className="icon-btn"
              title={theme === "light" ? "Tema escuro" : "Tema claro"}
              onClick={toggle}
              type="button"
            >
              <Icon name={theme === "light" ? "moon" : "sun"} />
            </button>
            <button className="icon-btn" title="Notificações" type="button">
              <Icon name="bell" />
              <span className="badge" />
            </button>
            {/* Botão Sobre — mostra popover com versão */}
            <div ref={aboutRef} style={{ position: "relative" }}>
              <button
                className={`icon-btn ${aboutOpen ? "active" : ""}`}
                title="Sobre o sistema"
                type="button"
                onClick={() => setAboutOpen((v) => !v)}
              >
                <Icon name="settings" />
              </button>
              {aboutOpen && <AboutPopover onClose={() => setAboutOpen(false)} />}
            </div>
            <div className="user-chip">
              <div className="avatar">{getInitials(userName)}</div>
              <div>
                <div className="name">{userName}</div>
                <div className="role">{roleLabel(role)}</div>
              </div>
              <Icon name="chevDown" size={10} />
            </div>
          </div>
        </div>
        {subs.length > 0 && (
          <div className="subnav">
            {subs.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`snav ${page === s.id ? "active" : ""}`}
                onClick={() => onSubNav?.(s.id)}
              >
                <Icon name={s.icon} size={13} />
                {s.label}
                {s.count != null && <span className="count">{s.count}</span>}
              </button>
            ))}
            {contextLabels.length > 0 && (
              <div className="ctx">
                {contextLabels.map((c, i) => (
                  <span key={i} className={c.pill ? "pill" : ""}>{c.text}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
