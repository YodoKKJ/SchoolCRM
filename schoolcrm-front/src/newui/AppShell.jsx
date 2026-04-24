import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "./Icon";
import useTheme from "./useTheme";
import { setNewUI } from "./featureFlag";

const ROLE_ALLOWED = {
  ALUNO: new Set(["inicio"]),
  PROFESSOR: new Set(["inicio", "academico", "comunicacao"]),
  COORDENACAO: new Set(["inicio", "academico", "pessoas", "comunicacao", "relatorios"]),
  DIRECAO: new Set(["inicio", "academico", "pessoas", "financeiro", "comunicacao", "relatorios"]),
  MASTER: new Set(["inicio", "academico", "pessoas", "financeiro", "comunicacao", "relatorios"]),
};

const NAV = [
  { id: "inicio", label: "Início", icon: "home" },
  { id: "academico", label: "Acadêmico", icon: "school", hasSub: true },
  { id: "pessoas", label: "Pessoas", icon: "users", hasSub: true },
  { id: "financeiro", label: "Financeiro", icon: "dollar", hasSub: true },
  { id: "comunicacao", label: "Comunicação", icon: "mail" },
  { id: "relatorios", label: "Relatórios", icon: "chart" },
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
    { id: "dashboard", label: "Dashboard", icon: "chart" },
    { id: "contratos", label: "Contratos", icon: "clipboard" },
    { id: "receber", label: "Contas a Receber", icon: "dollar" },
    { id: "pagar", label: "Contas a Pagar", icon: "dollar" },
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

export default function AppShell({
  section = "inicio",
  page,
  onNav,
  onSubNav,
  contextLabels = [],
  children,
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { slug } = useParams();

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const userName = typeof window !== "undefined" ? localStorage.getItem("nome") || "Usuário" : "Usuário";
  const allowed = ROLE_ALLOWED[role] || ROLE_ALLOWED.DIRECAO;

  const visibleNav = useMemo(
    () => NAV.filter((n) => allowed.has(n.id)),
    [allowed]
  );

  const subs = SUBNAV[section] || [];

  const disableNewUI = () => {
    setNewUI(false);
    const target = slug
      ? `/escola/${slug}/${role === "PROFESSOR" ? "professor" : role === "ALUNO" ? "aluno" : "direcao"}`
      : "/";
    navigate(target);
  };

  return (
    <div className="skolyo-ui" data-theme={theme}>
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <img src="/skolyo-logo.svg" alt="Skolyo" />
            <div>
              <div className="brand-name">Skolyo</div>
              <div className="brand-sub">ERP · 2026</div>
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
            <button
              className="icon-btn"
              title="Voltar para UI clássica"
              onClick={disableNewUI}
              type="button"
            >
              <Icon name="settings" />
            </button>
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
