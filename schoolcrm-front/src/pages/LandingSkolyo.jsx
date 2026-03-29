import { useState, useEffect, useRef } from "react";
import {
  GraduationCap, BookOpen, CalendarCheck, Clock, FileText, DollarSign,
  CreditCard, Megaphone, MessageCircle, LayoutDashboard, Building2, Shield,
  ChevronDown, ChevronRight, Phone, ArrowRight, CheckCircle2, Sparkles,
  Menu, X
} from "lucide-react";

// ── Paleta ──────────────────────────────────────────────────────────────────
const P = {
  white: "#ffffff",
  bg: "#f8fafc",
  bgAlt: "#f1f5f9",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  blue50: "#f0f9ff",
  blue100: "#e0f2fe",
  blue200: "#bae6fd",
  blue400: "#38bdf8",
  blue500: "#0ea5e9",
  blue600: "#0284c7",
  blue700: "#0369a1",
  blue900: "#0c4a6e",
  green500: "#22c55e",
  green600: "#16a34a",
};

const WA_LINK = "https://wa.me/5549998415930";

// ── CSS ─────────────────────────────────────────────────────────────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: ${P.white}; color: ${P.text}; overflow-x: hidden; }

/* ── Reveal Animations ── */
.sk-reveal { opacity: 0; transform: translateY(32px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
.sk-reveal.visible { opacity: 1; transform: none; }
.sk-reveal-left { opacity: 0; transform: translateX(-48px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
.sk-reveal-left.visible { opacity: 1; transform: none; }
.sk-reveal-right { opacity: 0; transform: translateX(48px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
.sk-reveal-right.visible { opacity: 1; transform: none; }
.sk-stagger > * { opacity: 0; transform: translateY(24px); transition: opacity .5s cubic-bezier(.16,1,.3,1), transform .5s cubic-bezier(.16,1,.3,1); }
.sk-stagger.visible > *:nth-child(1) { opacity:1; transform:none; transition-delay:.0s; }
.sk-stagger.visible > *:nth-child(2) { opacity:1; transform:none; transition-delay:.07s; }
.sk-stagger.visible > *:nth-child(3) { opacity:1; transform:none; transition-delay:.14s; }
.sk-stagger.visible > *:nth-child(4) { opacity:1; transform:none; transition-delay:.21s; }
.sk-stagger.visible > *:nth-child(5) { opacity:1; transform:none; transition-delay:.28s; }
.sk-stagger.visible > *:nth-child(6) { opacity:1; transform:none; transition-delay:.35s; }
.sk-stagger.visible > *:nth-child(7) { opacity:1; transform:none; transition-delay:.42s; }
.sk-stagger.visible > *:nth-child(8) { opacity:1; transform:none; transition-delay:.49s; }
.sk-stagger.visible > *:nth-child(9) { opacity:1; transform:none; transition-delay:.56s; }
.sk-stagger.visible > *:nth-child(10) { opacity:1; transform:none; transition-delay:.63s; }
.sk-stagger.visible > *:nth-child(11) { opacity:1; transform:none; transition-delay:.70s; }
.sk-stagger.visible > *:nth-child(12) { opacity:1; transform:none; transition-delay:.77s; }

/* ── Hero entrance ── */
.sk-hero-badge { animation: skFadeUp .7s .15s both; }
.sk-hero-h1 { animation: skFadeUp .8s .25s both; }
.sk-hero-sub { animation: skFadeUp .7s .4s both; }
.sk-hero-actions { animation: skFadeUp .7s .55s both; }
.sk-hero-mockup { animation: skFadeUp .9s .5s both; }
@keyframes skFadeUp { from { opacity:0; transform:translateY(36px) } to { opacity:1; transform:none } }

/* ── Floating glow ── */
@keyframes skFloat { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
@keyframes skPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.4) } 70% { box-shadow: 0 0 0 16px rgba(34,197,94,0) } }

/* ── FAQ ── */
.sk-faq-item { border-bottom: 1px solid ${P.border}; }
.sk-faq-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:20px 0; background:none; border:none; cursor:pointer; font:inherit; text-align:left; color:${P.text}; }
.sk-faq-btn:hover { color:${P.blue600}; }
.sk-faq-answer { overflow:hidden; transition: max-height .35s cubic-bezier(.16,1,.3,1), opacity .3s; }

/* ── Mobile nav ── */
.sk-mobile-nav { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.5); backdrop-filter:blur(4px); opacity:0; pointer-events:none; transition: opacity .3s; }
.sk-mobile-nav.open { opacity:1; pointer-events:auto; }
.sk-mobile-panel { position:fixed; top:0; right:0; bottom:0; width:280px; background:${P.white}; transform:translateX(100%); transition:transform .3s cubic-bezier(.16,1,.3,1); padding:24px; display:flex; flex-direction:column; gap:8px; z-index:201; }
.sk-mobile-nav.open .sk-mobile-panel { transform:none; }

/* ── Responsive ── */
@media(max-width:900px) {
  .sk-hero-grid { grid-template-columns: 1fr !important; }
  .sk-hero-mockup-wrap { display: none; }
  .sk-diferencial-card { grid-template-columns: 1fr !important; }
  .sk-diferencial-card > *:first-child { order: 1 !important; }
  .sk-diferencial-card > *:last-child { order: 2 !important; }
  .sk-diferencial-visual { min-height: 180px !important; }
}
@media(max-width:600px) {
  .sk-faq-container { padding: 0 20px !important; }
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
      { threshold: 0.12 }
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

// ── Componentes ─────────────────────────────────────────────────────────────

function Navbar({ scrolled, onMobileOpen }) {
  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Diferenciais", href: "#diferenciais" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 72,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 max(24px, 5vw)",
      background: scrolled ? "rgba(255,255,255,.85)" : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      borderBottom: scrolled ? `1px solid ${P.border}` : "1px solid transparent",
      transition: "all .35s",
    }}>
      <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: P.blue600, letterSpacing: "-.03em" }}>Skolyo</span>
      </a>

      <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {links.map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: 14, fontWeight: 500, color: P.textMuted, textDecoration: "none",
            transition: "color .2s", display: "var(--nav-link-display, none)",
          }}
            onMouseEnter={e => e.currentTarget.style.color = P.blue600}
            onMouseLeave={e => e.currentTarget.style.color = P.textMuted}
          >{l.label}</a>
        ))}
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
          padding: "10px 22px", background: P.blue500, color: "#fff",
          fontSize: 14, fontWeight: 600, borderRadius: 10, textDecoration: "none",
          transition: "all .2s", display: "var(--nav-cta-display, inline-flex)", alignItems: "center", gap: 6,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = P.blue600; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = P.blue500; e.currentTarget.style.transform = "none"; }}
        >Fale Conosco</a>
        <button onClick={onMobileOpen} style={{
          display: "var(--hamburger-display, flex)", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer", color: P.text, padding: 4,
        }}><Menu size={24} /></button>
      </nav>

      <style>{`
        @media(min-width:769px) {
          :root { --nav-link-display: inline; --nav-cta-display: inline-flex; --hamburger-display: none; }
        }
        @media(max-width:768px) {
          :root { --nav-link-display: none; --nav-cta-display: none; --hamburger-display: flex; }
        }
      `}</style>
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
          <span style={{ fontSize: 22, fontWeight: 800, color: P.blue600 }}>Skolyo</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: P.textMuted }}><X size={22} /></button>
        </div>
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={onClose} style={{
            fontSize: 16, fontWeight: 500, color: P.text, textDecoration: "none", padding: "12px 0",
            borderBottom: `1px solid ${P.borderLight}`,
          }}>{l.label}</a>
        ))}
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={onClose} style={{
          marginTop: 16, padding: "14px 0", background: P.green500, color: "#fff",
          fontSize: 15, fontWeight: 600, borderRadius: 12, textDecoration: "none", textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <MessageCircle size={18} /> Falar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center", position: "relative",
      padding: "120px max(24px, 5vw) 80px", background: P.white, overflow: "hidden",
    }}>
      {/* Subtle grid pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: .4,
        backgroundImage: `radial-gradient(${P.blue200} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }} />

      {/* Gradient orb */}
      <div style={{
        position: "absolute", top: "-20%", right: "-10%", width: "60vw", height: "60vw",
        background: `radial-gradient(circle, ${P.blue100} 0%, transparent 70%)`,
        borderRadius: "50%", pointerEvents: "none",
      }} />

      <div className="sk-hero-grid" style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", width: "100%",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center",
      }}>
        <div>
          <div className="sk-hero-badge" style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px",
            background: P.blue50, border: `1px solid ${P.blue200}`, borderRadius: 100,
            fontSize: 13, fontWeight: 600, color: P.blue700, marginBottom: 28,
          }}>
            <Sparkles size={14} /> ERP Escolar Completo
          </div>

          <h1 className="sk-hero-h1" style={{
            fontSize: "clamp(36px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.1,
            letterSpacing: "-.03em", color: P.text, marginBottom: 20,
          }}>
            Gestão escolar<br />
            <span style={{
              background: `linear-gradient(135deg, ${P.blue500}, ${P.blue700})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>simplificada</span> para quem não tem tempo a perder
          </h1>

          <p className="sk-hero-sub" style={{
            fontSize: "clamp(16px, 1.6vw, 19px)", fontWeight: 400, lineHeight: 1.7,
            color: P.textMuted, maxWidth: 480, marginBottom: 36,
          }}>
            Do acadêmico ao financeiro, tudo integrado em um só sistema.
            Notas, frequência, boletos, WhatsApp — sua escola funcionando de verdade.
          </p>

          <div className="sk-hero-actions" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              padding: "15px 30px", background: P.green500, color: "#fff",
              fontSize: 15, fontWeight: 600, borderRadius: 12, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "all .2s", boxShadow: "0 4px 16px rgba(34,197,94,.3)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = P.green600; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = P.green500; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,.3)"; }}
            >
              <MessageCircle size={18} /> Falar com a gente
            </a>
            <a href="#funcionalidades" style={{
              padding: "15px 30px", background: "transparent", color: P.text,
              fontSize: 15, fontWeight: 600, borderRadius: 12, textDecoration: "none",
              border: `1.5px solid ${P.border}`, display: "inline-flex", alignItems: "center", gap: 8,
              transition: "all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = P.blue400; e.currentTarget.style.color = P.blue600; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.text; }}
            >
              Conhecer funcionalidades <ArrowRight size={16} />
            </a>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="sk-hero-mockup sk-hero-mockup-wrap" style={{ position: "relative" }}>
          <DashboardMockup />
        </div>
      </div>

      <style>{`
        @media(max-width:900px) {
          .sk-hero-h1 { font-size: clamp(32px, 7vw, 44px) !important; }
        }
      `}</style>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div style={{
      background: P.white, borderRadius: 20, border: `1px solid ${P.border}`,
      boxShadow: "0 24px 80px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04)",
      overflow: "hidden", animation: "skFloat 6s ease-in-out infinite",
    }}>
      {/* Title bar */}
      <div style={{
        padding: "14px 20px", background: P.bg, borderBottom: `1px solid ${P.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div style={{
          flex: 1, marginLeft: 12, height: 28, borderRadius: 6, background: P.white,
          border: `1px solid ${P.border}`, display: "flex", alignItems: "center", paddingLeft: 12,
          fontSize: 12, color: P.textLight,
        }}>skolyo.com/escola/minha-escola/direcao</div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Alunos Ativos", value: "324", color: P.blue500 },
            { label: "Inadimplência", value: "4.2%", color: "#f59e0b" },
            { label: "Frequência Média", value: "94.7%", color: P.green500 },
          ].map((s, i) => (
            <div key={i} style={{
              padding: "16px 14px", borderRadius: 12, background: P.bg,
              border: `1px solid ${P.borderLight}`,
            }}>
              <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div style={{
          height: 120, borderRadius: 12, background: P.bg, border: `1px solid ${P.borderLight}`,
          display: "flex", alignItems: "flex-end", padding: "0 16px 16px", gap: 8,
        }}>
          {[40, 65, 50, 80, 70, 90, 75, 85, 60, 95, 80, 70].map((h, i) => (
            <div key={i} style={{
              flex: 1, height: `${h}%`, borderRadius: "4px 4px 0 0",
              background: `linear-gradient(to top, ${P.blue500}, ${P.blue400})`,
              opacity: .6 + (h / 250),
            }} />
          ))}
        </div>

        {/* Table-like rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { name: "Maria Silva", turma: "9° Ano A", status: "Em dia" },
            { name: "João Santos", turma: "7° Ano B", status: "Pendente" },
            { name: "Ana Oliveira", turma: "8° Ano A", status: "Em dia" },
          ].map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: 8, background: P.bg, fontSize: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: P.blue100,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, color: P.blue600,
                }}>{r.name[0]}</div>
                <span style={{ fontWeight: 500 }}>{r.name}</span>
              </div>
              <span style={{ color: P.textMuted }}>{r.turma}</span>
              <span style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: r.status === "Em dia" ? "#dcfce7" : "#fef9c3",
                color: r.status === "Em dia" ? "#166534" : "#854d0e",
              }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: GraduationCap, title: "Gestão Acadêmica", desc: "Turmas, matrículas, séries e vínculos aluno-turma. Tudo organizado em um só lugar." },
  { icon: BookOpen, title: "Lançamento de Notas", desc: "Notas por avaliação com pesos, simulados, recuperação e cálculo automático de médias." },
  { icon: CalendarCheck, title: "Controle de Frequência", desc: "Presença e atrasos por aula, com relatórios automáticos por aluno e turma." },
  { icon: Clock, title: "Grade de Horários", desc: "Monte a grade horária com atribuição de professores, matérias e períodos." },
  { icon: FileText, title: "Boletins em PDF", desc: "Geração automática de boletins com notas, faltas e situação. Download ou envio por WhatsApp." },
  { icon: DollarSign, title: "Financeiro Completo", desc: "Contas a pagar e receber, contratos, fluxo de caixa e relatórios financeiros." },
  { icon: CreditCard, title: "Emissão de Boletos", desc: "Boletos híbridos (boleto + PIX) emitidos direto pelo sistema, integrado com banco Sicoob." },
  { icon: Megaphone, title: "Comunicados", desc: "Avisos segmentados para toda escola, turmas específicas, professores ou alunos." },
  { icon: MessageCircle, title: "Integração WhatsApp", desc: "Lembretes de pagamento, cobranças e boletins direto no WhatsApp dos pais. API oficial." },
  { icon: LayoutDashboard, title: "Painel por Perfil", desc: "Dashboards para Direção, Professor e Aluno — cada um vê só o que precisa." },
  { icon: Building2, title: "Multi-escola", desc: "Gerencie mais de uma escola na mesma plataforma, com dados isolados por unidade." },
  { icon: Shield, title: "Auditoria", desc: "Histórico completo de ações no sistema para controle e conformidade." },
];

function Features() {
  return (
    <section id="funcionalidades" style={{ padding: "100px max(24px, 5vw)", background: P.white }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              display: "inline-block", padding: "6px 16px", background: P.blue50,
              border: `1px solid ${P.blue200}`, borderRadius: 100,
              fontSize: 13, fontWeight: 600, color: P.blue700, marginBottom: 16,
            }}>Funcionalidades</span>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-.02em",
              color: P.text, marginBottom: 16,
            }}>Tudo que sua escola precisa,<br />em um só sistema</h2>
            <p style={{ fontSize: 17, color: P.textMuted, maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
              Do acadêmico ao financeiro, cada módulo foi pensado para simplificar o dia a dia da gestão escolar.
            </p>
          </div>
        </Reveal>

        <Reveal className="sk-stagger">
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
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
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: 28, borderRadius: 16,
        background: hovered ? P.blue50 : P.bg,
        border: `1px solid ${hovered ? P.blue200 : P.borderLight}`,
        transition: "all .25s", cursor: "default",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 12px 32px rgba(14,165,233,.1)" : "none",
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: hovered ? P.blue500 : P.blue100,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, transition: "all .25s",
      }}>
        <Icon size={22} color={hovered ? "#fff" : P.blue600} style={{ transition: "color .25s" }} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: P.text, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function Diferenciais() {
  const items = [
    {
      icon: MessageCircle,
      title: "Cobranças e boletins chegam direto no WhatsApp dos pais",
      desc: "Lembretes automáticos de vencimento, envio de boletins em PDF, notificação de inadimplência — tudo configurável, tudo automático, via API oficial do WhatsApp.",
      gradient: `linear-gradient(135deg, #dcfce7, ${P.blue50})`,
      iconBg: P.green500,
    },
    {
      icon: CreditCard,
      title: "Emita boletos e gere código PIX sem sair do sistema",
      desc: "Integração bancária real com Sicoob API. Boletos híbridos com código de barras + PIX QR code, baixa automática de pagamentos. Sem planilha, sem outro sistema.",
      gradient: `linear-gradient(135deg, ${P.blue50}, #f3e8ff)`,
      iconBg: P.blue500,
    },
    {
      icon: Sparkles,
      title: "Do acadêmico ao financeiro, sem precisar de 5 ferramentas",
      desc: "Notas, frequência, horários, boletins, financeiro, comunicação — tudo integrado e acessível de qualquer dispositivo. Um sistema, zero dor de cabeça.",
      gradient: `linear-gradient(135deg, #fef9c3, #ffedd5)`,
      iconBg: "#f59e0b",
    },
  ];

  return (
    <section id="diferenciais" style={{ padding: "100px max(24px, 5vw)", background: P.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              display: "inline-block", padding: "6px 16px", background: P.blue50,
              border: `1px solid ${P.blue200}`, borderRadius: 100,
              fontSize: 13, fontWeight: 600, color: P.blue700, marginBottom: 16,
            }}>Diferenciais</span>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-.02em",
              color: P.text, marginBottom: 16,
            }}>Por que escolher o Skolyo?</h2>
            <p style={{ fontSize: 17, color: P.textMuted, maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
              Funcionalidades que realmente fazem diferença no dia a dia da sua escola.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {items.map((item, i) => (
            <Reveal key={i} className={i % 2 === 0 ? "sk-reveal-left" : "sk-reveal-right"}>
              <DiferencialCard {...item} reversed={i % 2 !== 0} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiferencialCard({ icon: Icon, title, desc, gradient, iconBg, reversed }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="sk-diferencial-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
        borderRadius: 24, overflow: "hidden", background: P.white,
        border: `1px solid ${P.border}`,
        transition: "all .3s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? "0 20px 60px rgba(0,0,0,.08)" : "0 4px 20px rgba(0,0,0,.03)",
      }}
    >
      <div style={{
        padding: "48px 40px",
        order: reversed ? 2 : 1,
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <Icon size={24} color="#fff" />
        </div>
        <h3 style={{
          fontSize: "clamp(20px, 2vw, 26px)", fontWeight: 700, color: P.text,
          lineHeight: 1.3, marginBottom: 14, letterSpacing: "-.01em",
        }}>{title}</h3>
        <p style={{ fontSize: 15, color: P.textMuted, lineHeight: 1.7 }}>{desc}</p>
      </div>
      <div className="sk-diferencial-visual" style={{
        background: gradient, padding: 48,
        display: "flex", alignItems: "center", justifyContent: "center",
        order: reversed ? 1 : 2, minHeight: 260,
      }}>
        <Icon size={80} color={iconBg} style={{ opacity: .2 }} />
      </div>
    </div>
  );
}

function ComoFunciona() {
  const steps = [
    { num: "01", title: "Fale com a gente pelo WhatsApp", desc: "Entendemos a realidade da sua escola e montamos a melhor proposta." },
    { num: "02", title: "Configuramos tudo pra você", desc: "Cadastro de turmas, alunos, matérias e configurações financeiras — sem dor de cabeça." },
    { num: "03", title: "Sua escola rodando no Skolyo", desc: "Pronto pra usar com suporte contínuo. Sem surpresas, sem complicação." },
  ];

  return (
    <section id="como-funciona" style={{ padding: "100px max(24px, 5vw)", background: P.white }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{
              display: "inline-block", padding: "6px 16px", background: P.blue50,
              border: `1px solid ${P.blue200}`, borderRadius: 100,
              fontSize: 13, fontWeight: 600, color: P.blue700, marginBottom: 16,
            }}>Como funciona</span>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-.02em",
              color: P.text, marginBottom: 16,
            }}>Comece em 3 passos simples</h2>
          </div>
        </Reveal>

        <Reveal className="sk-stagger">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                padding: 36, borderRadius: 20, background: P.bg,
                border: `1px solid ${P.borderLight}`, textAlign: "center",
                position: "relative",
              }}>
                <div style={{
                  fontSize: 48, fontWeight: 900, color: P.blue100,
                  lineHeight: 1, marginBottom: 16, letterSpacing: "-.03em",
                }}>{s.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: P.text, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.6 }}>{s.desc}</p>
                {i < 2 && (
                  <div style={{
                    position: "absolute", top: "50%", right: -20, transform: "translateY(-50%)",
                    color: P.blue200, display: "var(--step-arrow, none)",
                  }}>
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <style>{`@media(min-width:900px) { :root { --step-arrow: block; } }`}</style>
    </section>
  );
}

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
    <section id="faq" style={{ padding: "100px max(24px, 5vw)", background: P.bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{
              display: "inline-block", padding: "6px 16px", background: P.blue50,
              border: `1px solid ${P.blue200}`, borderRadius: 100,
              fontSize: 13, fontWeight: 600, color: P.blue700, marginBottom: 16,
            }}>FAQ</span>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-.02em",
              color: P.text,
            }}>Perguntas frequentes</h2>
          </div>
        </Reveal>

        <Reveal>
          <div className="sk-faq-container" style={{ background: P.white, borderRadius: 20, border: `1px solid ${P.border}`, padding: "0 32px", overflow: "hidden" }}>
            {FAQ_DATA.map((f, i) => (
              <div key={i} className="sk-faq-item">
                <button className="sk-faq-btn" onClick={() => setOpen(open === i ? null : i)}>
                  <span style={{ fontSize: 15, fontWeight: 600, paddingRight: 16 }}>{f.q}</span>
                  <ChevronDown size={18} style={{
                    color: P.textMuted, transition: "transform .3s",
                    transform: open === i ? "rotate(180deg)" : "none",
                    flexShrink: 0,
                  }} />
                </button>
                <div className="sk-faq-answer" style={{
                  maxHeight: open === i ? 200 : 0,
                  opacity: open === i ? 1 : 0,
                }}>
                  <p style={{
                    fontSize: 14, color: P.textMuted, lineHeight: 1.7,
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

function CtaFinal() {
  return (
    <section style={{ padding: "100px max(24px, 5vw)", background: P.white }}>
      <Reveal>
        <div style={{
          maxWidth: 900, margin: "0 auto", textAlign: "center",
          padding: "72px 40px", borderRadius: 28,
          background: `linear-gradient(135deg, ${P.blue600}, ${P.blue700})`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{
            position: "absolute", top: -60, right: -60, width: 200, height: 200,
            borderRadius: "50%", background: "rgba(255,255,255,.08)",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: -40, width: 160, height: 160,
            borderRadius: "50%", background: "rgba(255,255,255,.05)",
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <h2 style={{
              fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: "#fff",
              letterSpacing: "-.02em", marginBottom: 16, lineHeight: 1.2,
            }}>Pronto pra simplificar a gestão<br />da sua escola?</h2>
            <p style={{
              fontSize: 17, color: "rgba(255,255,255,.8)", maxWidth: 480,
              margin: "0 auto 36px", lineHeight: 1.6,
            }}>
              Converse com a gente pelo WhatsApp e descubra como o Skolyo pode transformar sua escola.
            </p>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "16px 36px", background: P.green500, color: "#fff",
              fontSize: 16, fontWeight: 700, borderRadius: 14, textDecoration: "none",
              transition: "all .2s", boxShadow: "0 6px 24px rgba(0,0,0,.2)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = P.green600; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = P.green500; e.currentTarget.style.transform = "none"; }}
            >
              <MessageCircle size={20} /> Falar com a gente agora
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const links = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Diferenciais", href: "#diferenciais" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <footer style={{
      padding: "48px max(24px, 5vw) 32px", background: P.text,
      color: "rgba(255,255,255,.6)",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        display: "flex", flexWrap: "wrap", justifyContent: "space-between",
        alignItems: "center", gap: 24,
      }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Skolyo</span>
        </div>
        <nav style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 13, color: "rgba(255,255,255,.5)", textDecoration: "none",
              transition: "color .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.5)"}
            >{l.label}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Phone size={14} />
          <span style={{ fontSize: 13 }}>(49) 9 9841-5930</span>
        </div>
      </div>
      <div style={{
        maxWidth: 1200, margin: "24px auto 0", paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,.1)",
        fontSize: 12, color: "rgba(255,255,255,.35)", textAlign: "center",
      }}>
        &copy; 2026 Skolyo. Todos os direitos reservados.
      </div>
    </footer>
  );
}

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
        width: 56, height: 56, borderRadius: "50%",
        background: P.green500, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(34,197,94,.4)",
        transition: "all .2s", textDecoration: "none",
        animation: "skPulse 2.5s infinite",
        transform: hovered ? "scale(1.1)" : "none",
      }}
      aria-label="WhatsApp"
    >
      <MessageCircle size={26} />
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

  // Lock body scroll when mobile nav open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <style>{STYLE}</style>

      {/* SEO meta tags */}
      <MetaTags />

      <Navbar scrolled={scrolled} onMobileOpen={() => setMobileOpen(true)} />
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main>
        <Hero />
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
