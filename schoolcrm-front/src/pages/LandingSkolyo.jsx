import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, BookOpen, CalendarCheck, Clock, FileText, DollarSign,
  CreditCard, Megaphone, MessageCircle, LayoutDashboard, Building2, Shield,
  ChevronDown, Phone, ArrowRight, CheckCircle2,
  Menu, X, ArrowUpRight
} from "lucide-react";

// ── Paleta editorial ───────────────────────────────────────────────────────
const P = {
  white: "#ffffff",
  bg: "#fafafa",
  bgWarm: "#f7f5f2",
  ink: "#1a1a1a",
  inkSoft: "#3d3d3d",
  inkMuted: "#6b6b6b",
  inkLight: "#999999",
  border: "#e5e5e5",
  borderSoft: "#efefef",
  blue: "#0066ff",
  blueSoft: "#eef4ff",
  blueDark: "#0047b3",
  green: "#00a63e",
  greenSoft: "#edfcf2",
  accent: "#ff6b35",
};

const WA_LINK = "https://wa.me/5549998415930";

// ── CSS ─────────────────────────────────────────────────────────────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: 'Inter', -apple-system, sans-serif; background: ${P.white}; color: ${P.ink}; overflow-x: hidden; }

.serif { font-family: 'DM Serif Display', Georgia, serif; }

/* ── Reveal ── */
.sk-reveal { opacity: 0; transform: translateY(24px); transition: opacity .6s ease, transform .6s ease; }
.sk-reveal.visible { opacity: 1; transform: none; }
.sk-stagger > * { opacity: 0; transform: translateY(16px); transition: opacity .4s ease, transform .4s ease; }
.sk-stagger.visible > *:nth-child(1) { opacity:1; transform:none; transition-delay:.0s; }
.sk-stagger.visible > *:nth-child(2) { opacity:1; transform:none; transition-delay:.06s; }
.sk-stagger.visible > *:nth-child(3) { opacity:1; transform:none; transition-delay:.12s; }
.sk-stagger.visible > *:nth-child(4) { opacity:1; transform:none; transition-delay:.18s; }
.sk-stagger.visible > *:nth-child(5) { opacity:1; transform:none; transition-delay:.24s; }
.sk-stagger.visible > *:nth-child(6) { opacity:1; transform:none; transition-delay:.30s; }
.sk-stagger.visible > *:nth-child(7) { opacity:1; transform:none; transition-delay:.36s; }
.sk-stagger.visible > *:nth-child(8) { opacity:1; transform:none; transition-delay:.42s; }
.sk-stagger.visible > *:nth-child(9) { opacity:1; transform:none; transition-delay:.48s; }
.sk-stagger.visible > *:nth-child(10) { opacity:1; transform:none; transition-delay:.54s; }
.sk-stagger.visible > *:nth-child(11) { opacity:1; transform:none; transition-delay:.60s; }
.sk-stagger.visible > *:nth-child(12) { opacity:1; transform:none; transition-delay:.66s; }

/* ── Hero entrance ── */
.sk-hero-enter { animation: skUp .7s .1s both; }
.sk-hero-enter-2 { animation: skUp .7s .25s both; }
.sk-hero-enter-3 { animation: skUp .7s .4s both; }
.sk-hero-enter-4 { animation: skUp .7s .55s both; }
.sk-hero-mockup-enter { animation: skUp .8s .5s both; }
@keyframes skUp { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:none } }

/* ── FAQ ── */
.sk-faq-item { border-bottom: 1px solid ${P.border}; }
.sk-faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:20px 0; background:none; border:none; cursor:pointer; font:inherit; text-align:left; color:${P.ink}; }
.sk-faq-btn:hover { color:${P.blue}; }
.sk-faq-answer { overflow:hidden; transition: max-height .35s ease, opacity .3s; }

/* ── Mobile nav ── */
.sk-mobile-nav { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.4); backdrop-filter:blur(4px); opacity:0; pointer-events:none; transition: opacity .3s; }
.sk-mobile-nav.open { opacity:1; pointer-events:auto; }
.sk-mobile-panel { position:fixed; top:0; right:0; bottom:0; width:280px; background:${P.white}; transform:translateX(100%); transition:transform .3s ease; padding:24px; display:flex; flex-direction:column; gap:8px; z-index:201; }
.sk-mobile-nav.open .sk-mobile-panel { transform:none; }

/* ── Feature card hover ── */
.sk-feat:hover { border-color: ${P.blue} !important; }
.sk-feat:hover .sk-feat-arrow { opacity: 1 !important; transform: none !important; }

/* ── Responsive ── */
@media(max-width:900px) {
  .sk-hero-grid { grid-template-columns: 1fr !important; text-align: center; }
  .sk-hero-mockup-wrap { display: none !important; }
  .sk-hero-actions { justify-content: center !important; }
  .sk-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .sk-feat-grid { grid-template-columns: 1fr 1fr !important; }
  .sk-dif-card { grid-template-columns: 1fr !important; }
  .sk-steps-grid { grid-template-columns: 1fr !important; }
}
@media(max-width:600px) {
  .sk-feat-grid { grid-template-columns: 1fr !important; }
  .sk-stats-grid { grid-template-columns: 1fr !important; }
}
@media(min-width:769px) {
  :root { --nav-link-display: inline; --nav-cta-display: inline-flex; --hamburger-display: none; }
}
@media(max-width:768px) {
  :root { --nav-link-display: none; --nav-cta-display: none; --hamburger-display: flex; }
}

@media(prefers-reduced-motion: reduce) {
  .sk-reveal, .sk-stagger > *, .sk-hero-enter, .sk-hero-enter-2,
  .sk-hero-enter-3, .sk-hero-enter-4, .sk-hero-mockup-enter {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`;

// ── Intersection Observer hook ──────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ className = "sk-reveal", style, children }) {
  const ref = useReveal();
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

// ── Shared layout ───────────────────────────────────────────────────────────
const wrap = { maxWidth: 1140, margin: "0 auto", padding: "0 max(24px, 4vw)" };

// ── Navbar ──────────────────────────────────────────────────────────────────

function Navbar({ scrolled, onMobileOpen }) {
  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Diferenciais", href: "#diferenciais" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 max(24px, 4vw)",
      background: scrolled ? "rgba(255,255,255,.92)" : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom: scrolled ? `1px solid ${P.border}` : "1px solid transparent",
      transition: "all .3s",
    }}>
      <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <img src="/logo-skolyo.png" alt="Skolyo" style={{ height: 26, objectFit: "contain" }}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "inline"; }}
        />
        <span style={{ fontSize: 22, fontWeight: 700, color: P.ink, letterSpacing: "-.02em", display: "none" }}>Skolyo</span>
      </a>

      <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: 14, fontWeight: 500, color: P.inkMuted, textDecoration: "none",
            transition: "color .2s", display: "var(--nav-link-display, none)",
          }}
            onMouseEnter={e => e.currentTarget.style.color = P.ink}
            onMouseLeave={e => e.currentTarget.style.color = P.inkMuted}
          >{l.label}</a>
        ))}
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
          padding: "9px 20px", background: P.ink, color: "#fff",
          fontSize: 13, fontWeight: 600, borderRadius: 8, textDecoration: "none",
          transition: "all .2s", display: "var(--nav-cta-display, inline-flex)", alignItems: "center", gap: 6,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = P.inkSoft; }}
          onMouseLeave={e => { e.currentTarget.style.background = P.ink; }}
        >Fale conosco</a>
        <button onClick={onMobileOpen} aria-label="Menu" style={{
          display: "var(--hamburger-display, flex)", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer", color: P.ink, padding: 4,
        }}><Menu size={24} /></button>
      </nav>
    </header>
  );
}

function MobileNav({ open, onClose }) {
  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Diferenciais", href: "#diferenciais" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <div className={`sk-mobile-nav ${open ? "open" : ""}`} onClick={onClose}>
      <div className="sk-mobile-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: P.ink }}>Skolyo</span>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", color: P.inkMuted }}><X size={22} /></button>
        </div>
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={onClose} style={{
            fontSize: 16, fontWeight: 500, color: P.ink, textDecoration: "none", padding: "12px 0",
            borderBottom: `1px solid ${P.borderSoft}`,
          }}>{l.label}</a>
        ))}
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={onClose} style={{
          marginTop: 16, padding: "14px 0", background: P.green, color: "#fff",
          fontSize: 15, fontWeight: 600, borderRadius: 10, textDecoration: "none", textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <MessageCircle size={18} /> Falar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "100px 0 60px", background: P.white,
    }}>
      <div style={wrap}>
        <div className="sk-hero-grid" style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center",
        }}>
          <div>
            <p className="sk-hero-enter" style={{
              fontSize: 14, fontWeight: 600, color: P.blue, letterSpacing: ".06em",
              textTransform: "uppercase", marginBottom: 20,
            }}>
              Gestão escolar completa
            </p>

            <h1 className="serif sk-hero-enter-2" style={{
              fontSize: "clamp(38px, 4.5vw, 62px)", fontWeight: 400, lineHeight: 1.08,
              letterSpacing: "-.02em", color: P.ink, marginBottom: 24,
            }}>
              Sua escola merece<br />
              um sistema que{" "}
              <em style={{ fontStyle: "italic", color: P.blue }}>funciona</em>
            </h1>

            <p className="sk-hero-enter-3" style={{
              fontSize: 17, fontWeight: 400, lineHeight: 1.7,
              color: P.inkMuted, maxWidth: 440, marginBottom: 40,
            }}>
              Notas, frequência, boletos e WhatsApp integrados em uma plataforma
              feita para escolas particulares de verdade.
            </p>

            <div className="sk-hero-enter-4 sk-hero-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
                padding: "14px 28px", background: P.green, color: "#fff",
                fontSize: 15, fontWeight: 600, borderRadius: 10, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
                transition: "all .2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = ".9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
              >
                <MessageCircle size={18} /> Quero conhecer
              </a>
              <a href="#funcionalidades" style={{
                padding: "14px 28px", background: "transparent", color: P.ink,
                fontSize: 15, fontWeight: 600, borderRadius: 10, textDecoration: "none",
                border: `1.5px solid ${P.border}`, display: "inline-flex", alignItems: "center", gap: 8,
                transition: "all .2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = P.ink; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; }}
              >
                Ver funcionalidades <ArrowRight size={16} />
              </a>
            </div>
          </div>

          <div className="sk-hero-mockup-wrap sk-hero-mockup-enter">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div style={{
      background: P.white, borderRadius: 16, border: `1px solid ${P.border}`,
      boxShadow: "0 20px 60px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.04)",
      overflow: "hidden",
    }}>
      {/* Title bar */}
      <div style={{
        padding: "12px 16px", background: P.bg, borderBottom: `1px solid ${P.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{
          flex: 1, marginLeft: 8, height: 26, borderRadius: 6, background: P.white,
          border: `1px solid ${P.borderSoft}`, display: "flex", alignItems: "center", paddingLeft: 10,
          fontSize: 11, color: P.inkLight,
        }}>skolyo.com/direcao</div>
      </div>

      {/* Content */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Alunos", value: "324", color: P.blue },
            { label: "Inadimplência", value: "4.2%", color: P.accent },
            { label: "Frequência", value: "94.7%", color: P.green },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "14px 12px", borderRadius: 10, background: P.bg,
              border: `1px solid ${P.borderSoft}`,
            }}>
              <div style={{ fontSize: 10, color: P.inkMuted, marginBottom: 3, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: "-.02em" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{
          height: 100, borderRadius: 10, background: P.bg, border: `1px solid ${P.borderSoft}`,
          display: "flex", alignItems: "flex-end", padding: "0 14px 14px", gap: 6,
        }}>
          {[40, 65, 50, 80, 70, 90, 75, 85, 60, 95, 80, 70].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: 3,
              background: P.blue, opacity: .15 + (h / 160),
            }} />
          ))}
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { name: "Maria Silva", turma: "9° Ano A", status: "Em dia" },
            { name: "João Santos", turma: "7° Ano B", status: "Pendente" },
          ].map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px", borderRadius: 8, background: P.bg, fontSize: 11,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", background: P.blueSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600, color: P.blue,
                }}>{r.name[0]}</div>
                <span style={{ fontWeight: 500 }}>{r.name}</span>
              </div>
              <span style={{ color: P.inkMuted }}>{r.turma}</span>
              <span style={{
                padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: r.status === "Em dia" ? P.greenSoft : "#fef9c3",
                color: r.status === "Em dia" ? "#166534" : "#854d0e",
              }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Social proof bar ────────────────────────────────────────────────────────

function SocialProof() {
  const stats = [
    { value: "1.200+", label: "alunos gerenciados" },
    { value: "98%", label: "de satisfação" },
    { value: "50mil+", label: "boletos emitidos" },
    { value: "4", label: "escolas ativas" },
  ];

  return (
    <section style={{ padding: "0 0 80px", background: P.white }}>
      <div style={wrap}>
        <Reveal>
          <div style={{
            borderTop: `1px solid ${P.border}`, paddingTop: 40,
          }}>
            <div className="sk-stats-grid" style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32,
            }}>
              {stats.map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div className="serif" style={{
                    fontSize: 32, fontWeight: 400, color: P.ink, letterSpacing: "-.02em",
                    marginBottom: 4,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: P.inkMuted, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Features ────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: GraduationCap, title: "Gestão Acadêmica", desc: "Turmas, matrículas, séries e vínculos aluno-turma em um só lugar." },
  { icon: BookOpen, title: "Lançamento de Notas", desc: "Notas por avaliação com pesos, simulados, recuperação e médias automáticas." },
  { icon: CalendarCheck, title: "Controle de Frequência", desc: "Presença por aula com relatórios automáticos por aluno e turma." },
  { icon: Clock, title: "Grade de Horários", desc: "Grade horária com professores, matérias e períodos configuráveis." },
  { icon: FileText, title: "Boletins em PDF", desc: "Boletins automáticos com notas, faltas e situação. Download ou WhatsApp." },
  { icon: DollarSign, title: "Financeiro Completo", desc: "Contas a pagar e receber, contratos, fluxo de caixa e relatórios." },
  { icon: CreditCard, title: "Boletos + PIX", desc: "Boletos híbridos com código de barras e PIX QR code via Sicoob." },
  { icon: Megaphone, title: "Comunicados", desc: "Avisos segmentados para escola, turmas, professores ou alunos." },
  { icon: MessageCircle, title: "WhatsApp Integrado", desc: "Lembretes, cobranças e boletins no WhatsApp dos pais. API oficial." },
  { icon: LayoutDashboard, title: "Painel por Perfil", desc: "Dashboards para Direção, Professor e Aluno — cada um vê o que precisa." },
  { icon: Building2, title: "Multi-escola", desc: "Gerencie várias escolas na mesma plataforma, com dados isolados." },
  { icon: Shield, title: "Auditoria", desc: "Histórico completo de ações para controle e conformidade." },
];

function Features() {
  return (
    <section id="funcionalidades" style={{ padding: "100px 0", background: P.bg }}>
      <div style={wrap}>
        <Reveal>
          <div style={{ marginBottom: 56 }}>
            <p style={{
              fontSize: 14, fontWeight: 600, color: P.blue, letterSpacing: ".06em",
              textTransform: "uppercase", marginBottom: 12,
            }}>Funcionalidades</p>
            <h2 className="serif" style={{
              fontSize: "clamp(30px, 3.5vw, 46px)", fontWeight: 400,
              letterSpacing: "-.01em", color: P.ink, lineHeight: 1.15, maxWidth: 500,
            }}>
              Tudo que sua escola precisa, nada que ela não precisa
            </h2>
          </div>
        </Reveal>

        <Reveal className="sk-stagger">
          <div className="sk-feat-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
          }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="sk-feat" style={{
      padding: "24px 22px", borderRadius: 12,
      background: P.white, border: `1px solid ${P.borderSoft}`,
      transition: "border-color .2s", cursor: "default",
      position: "relative",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 10,
      }}>
        <Icon size={20} color={P.blue} strokeWidth={1.8} />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: P.ink }}>{title}</h3>
      </div>
      <p style={{ fontSize: 13, color: P.inkMuted, lineHeight: 1.6 }}>{desc}</p>
      <ArrowUpRight className="sk-feat-arrow" size={14} color={P.blue} style={{
        position: "absolute", top: 20, right: 20, opacity: 0,
        transform: "translate(-4px, 4px)", transition: "all .2s",
      }} />
    </div>
  );
}

// ── Diferenciais ────────────────────────────────────────────────────────────

function Diferenciais() {
  const items = [
    {
      num: "01",
      icon: MessageCircle,
      title: "Cobranças e boletins no WhatsApp dos pais",
      desc: "Lembretes automáticos de vencimento, envio de boletins em PDF e notificação de inadimplência. Tudo configurável, tudo automático, via API oficial do WhatsApp.",
      color: P.green,
      bg: P.greenSoft,
    },
    {
      num: "02",
      icon: CreditCard,
      title: "Boletos e PIX sem sair do sistema",
      desc: "Integração bancária real com Sicoob. Boletos híbridos com código de barras + PIX QR code. Baixa automática de pagamentos. Sem planilha, sem outro sistema.",
      color: P.blue,
      bg: P.blueSoft,
    },
    {
      num: "03",
      icon: LayoutDashboard,
      title: "Acadêmico e financeiro em um só lugar",
      desc: "Notas, frequência, horários, boletins, financeiro e comunicação — tudo integrado. Um sistema, zero dor de cabeça.",
      color: P.accent,
      bg: "#fff7ed",
    },
  ];

  return (
    <section id="diferenciais" style={{ padding: "100px 0", background: P.white }}>
      <div style={wrap}>
        <Reveal>
          <div style={{ marginBottom: 56 }}>
            <p style={{
              fontSize: 14, fontWeight: 600, color: P.blue, letterSpacing: ".06em",
              textTransform: "uppercase", marginBottom: 12,
            }}>Diferenciais</p>
            <h2 className="serif" style={{
              fontSize: "clamp(30px, 3.5vw, 46px)", fontWeight: 400,
              letterSpacing: "-.01em", color: P.ink, lineHeight: 1.15, maxWidth: 520,
            }}>
              O que faz o Skolyo diferente de verdade
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {items.map((item, i) => (
            <Reveal key={i}>
              <DiferencialCard {...item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiferencialCard({ num, icon: Icon, title, desc, color, bg }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="sk-dif-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "1fr 360px", gap: 0,
        borderRadius: 16, overflow: "hidden",
        border: `1px solid ${hovered ? color : P.border}`,
        background: P.white,
        transition: "all .25s",
        boxShadow: hovered ? `0 12px 40px rgba(0,0,0,.06)` : "none",
      }}
    >
      <div style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: P.inkLight, letterSpacing: ".08em",
          marginBottom: 14,
        }}>{num}</span>
        <h3 style={{
          fontSize: "clamp(20px, 2vw, 24px)", fontWeight: 700, color: P.ink,
          lineHeight: 1.3, marginBottom: 12, letterSpacing: "-.01em",
        }}>{title}</h3>
        <p style={{ fontSize: 15, color: P.inkMuted, lineHeight: 1.7, maxWidth: 480 }}>{desc}</p>
      </div>
      <div style={{
        background: bg, display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: 220, position: "relative",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20, background: P.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
          transition: "transform .3s",
          transform: hovered ? "scale(1.05)" : "none",
        }}>
          <Icon size={32} color={color} strokeWidth={1.6} />
        </div>
      </div>
    </div>
  );
}

// ── Como funciona ───────────────────────────────────────────────────────────

function ComoFunciona() {
  const steps = [
    { num: "1", title: "Fale com a gente", desc: "Entendemos a realidade da sua escola e montamos a melhor proposta." },
    { num: "2", title: "Configuramos tudo", desc: "Turmas, alunos, matérias e financeiro — sem dor de cabeça pra você." },
    { num: "3", title: "Escola rodando", desc: "Pronto pra usar com suporte contínuo. Sem surpresas." },
  ];

  return (
    <section id="como-funciona" style={{ padding: "100px 0", background: P.bg }}>
      <div style={wrap}>
        <Reveal>
          <div style={{ marginBottom: 56 }}>
            <p style={{
              fontSize: 14, fontWeight: 600, color: P.blue, letterSpacing: ".06em",
              textTransform: "uppercase", marginBottom: 12,
            }}>Como funciona</p>
            <h2 className="serif" style={{
              fontSize: "clamp(30px, 3.5vw, 46px)", fontWeight: 400,
              letterSpacing: "-.01em", color: P.ink, lineHeight: 1.15,
            }}>
              Três passos, zero complicação
            </h2>
          </div>
        </Reveal>

        <Reveal className="sk-stagger">
          <div className="sk-steps-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24,
          }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                padding: "32px 28px", borderRadius: 14, background: P.white,
                border: `1px solid ${P.borderSoft}`,
                position: "relative",
              }}>
                <div className="serif" style={{
                  fontSize: 48, color: P.borderSoft, lineHeight: 1, marginBottom: 16,
                  fontStyle: "italic",
                }}>{s.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: P.ink, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: P.inkMuted, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_DATA = [
  { q: "Preciso instalar algo?", a: "Não, o Skolyo é 100% web. Funciona no navegador do computador, tablet ou celular." },
  { q: "Funciona pra qualquer tamanho de escola?", a: "Sim, desde escolas com 50 alunos até redes com várias unidades." },
  { q: "Como funciona a emissão de boletos?", a: "O sistema gera boletos híbridos (boleto + PIX) integrados com o banco Sicoob. A baixa de pagamentos é automática." },
  { q: "O WhatsApp é oficial?", a: "Sim, usamos a API oficial do WhatsApp Business — nada de gambiarras com WhatsApp Web." },
  { q: "Quanto custa?", a: "Entre em contato pelo WhatsApp que montamos uma proposta personalizada pro tamanho da sua escola." },
  { q: "Meus dados ficam seguros?", a: "Sim, usamos criptografia, autenticação JWT e controle de acesso por perfil. Cada escola tem seus dados completamente isolados." },
];

function Faq() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" style={{ padding: "100px 0", background: P.white }}>
      <div style={{ ...wrap, maxWidth: 680 }}>
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <p style={{
              fontSize: 14, fontWeight: 600, color: P.blue, letterSpacing: ".06em",
              textTransform: "uppercase", marginBottom: 12,
            }}>FAQ</p>
            <h2 className="serif" style={{
              fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 400,
              letterSpacing: "-.01em", color: P.ink,
            }}>Perguntas frequentes</h2>
          </div>
        </Reveal>

        <Reveal>
          <div>
            {FAQ_DATA.map((f, i) => (
              <div key={i} className="sk-faq-item">
                <button className="sk-faq-btn" onClick={() => setOpen(open === i ? null : i)}>
                  <span style={{ fontSize: 15, fontWeight: 600, paddingRight: 16 }}>{f.q}</span>
                  <ChevronDown size={18} style={{
                    color: P.inkMuted, transition: "transform .3s",
                    transform: open === i ? "rotate(180deg)" : "none",
                    flexShrink: 0,
                  }} />
                </button>
                <div className="sk-faq-answer" style={{
                  maxHeight: open === i ? 200 : 0,
                  opacity: open === i ? 1 : 0,
                }}>
                  <p style={{
                    fontSize: 14, color: P.inkMuted, lineHeight: 1.7,
                    paddingBottom: 20,
                  }}>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── CTA Final ───────────────────────────────────────────────────────────────

function CtaFinal() {
  return (
    <section style={{ padding: "100px 0", background: P.bg }}>
      <Reveal>
        <div style={{
          ...wrap, maxWidth: 800, textAlign: "center",
        }}>
          <h2 className="serif" style={{
            fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 400,
            letterSpacing: "-.02em", color: P.ink, lineHeight: 1.15,
            marginBottom: 20,
          }}>
            Pronto pra simplificar<br />a gestão da sua escola?
          </h2>
          <p style={{
            fontSize: 17, color: P.inkMuted, maxWidth: 460,
            margin: "0 auto 40px", lineHeight: 1.6,
          }}>
            Converse com a gente pelo WhatsApp e veja como o Skolyo funciona na prática.
          </p>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 36px", background: P.green, color: "#fff",
            fontSize: 16, fontWeight: 600, borderRadius: 12, textDecoration: "none",
            transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = ".9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
          >
            <MessageCircle size={20} /> Falar com a gente agora
          </a>
        </div>
      </Reveal>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Diferenciais", href: "#diferenciais" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <footer style={{
      padding: "40px 0 28px", background: P.ink, color: "rgba(255,255,255,.5)",
    }}>
      <div style={{
        ...wrap,
        display: "flex", flexWrap: "wrap", justifyContent: "space-between",
        alignItems: "center", gap: 20,
      }}>
        <img src="/logo-skolyo.png" alt="Skolyo" style={{
          height: 28, objectFit: "contain", filter: "brightness(0) invert(1)",
        }} />
        <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 13, color: "rgba(255,255,255,.45)", textDecoration: "none",
              transition: "color .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.45)"}
            >{l.label}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <Phone size={13} />
          <span>(49) 9 9841-5930</span>
        </div>
      </div>
      <div style={{
        ...wrap, marginTop: 20, paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,.08)",
        fontSize: 12, color: "rgba(255,255,255,.3)", textAlign: "center",
      }}>
        &copy; 2026 Skolyo. Todos os direitos reservados.
      </div>
    </footer>
  );
}

// ── WhatsApp Float ──────────────────────────────────────────────────────────

function WhatsAppFloat() {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 90,
        width: 52, height: 52, borderRadius: "50%",
        background: P.green, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,163,62,.35)",
        transition: "all .2s", textDecoration: "none",
        transform: hovered ? "scale(1.08)" : "none",
      }}
      aria-label="WhatsApp"
    >
      <MessageCircle size={24} />
    </a>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function LandingSkolyo() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <style>{STYLE}</style>
      <MetaTags />

      <Navbar scrolled={scrolled} onMobileOpen={() => setMobileOpen(true)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Diferenciais />
        <ComoFunciona />
        <Faq />
        <CtaFinal />
      </main>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}

function MetaTags() {
  useEffect(() => {
    document.title = "Skolyo — Gestão Escolar Simplificada";
    const setMeta = (name, content, prop) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Sistema de gestão escolar completo: acadêmico, financeiro, boletos, WhatsApp e muito mais. Para escolas particulares de pequeno e médio porte.");
    setMeta("og:title", "Skolyo — Gestão Escolar Simplificada", true);
    setMeta("og:description", "Do acadêmico ao financeiro, tudo integrado em um só sistema para sua escola.", true);
    setMeta("og:type", "website", true);
    setMeta("og:url", "https://skolyo.com", true);
  }, []);
  return null;
}
