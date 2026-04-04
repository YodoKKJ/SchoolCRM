import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// ── Paleta ─────────────────────────────────────────────────────────────────
// Verde escuro (#0d1f18), branco (#fff / #f5f8f5), dourado (#c9a84c) como acento

const C = {
  dark:    "#0d1f18",
  forest:  "#1a3d2b",
  mid:     "#2d6a4f",
  leaf:    "#7ec8a0",
  white:   "#ffffff",
  offwhite:"#f5f8f5",
  cream:   "#f0ece3",
  gold:    "#c9a84c",
  goldLight:"#e8c96e",
  text:    "#1a2e23",
  muted:   "#5a7060",
};

// ── ESTILOS ─────────────────────────────────────────────────────────────────
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: #fff; color: ${C.text}; overflow-x: hidden; }

.lp-serif { font-family: 'Playfair Display', serif; }

/* ── Reveal ── */
.reveal { opacity: 0; transform: translateY(48px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
.reveal.visible { opacity: 1; transform: translateY(0); }
.reveal-left { opacity: 0; transform: translateX(-64px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
.reveal-left.visible { opacity: 1; transform: translateX(0); }
.reveal-right { opacity: 0; transform: translateX(64px); transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1); }
.reveal-right.visible { opacity: 1; transform: translateX(0); }
.stagger > * { opacity: 0; transform: translateY(36px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
.stagger.visible > *:nth-child(1) { opacity:1; transform:none; transition-delay:.05s; }
.stagger.visible > *:nth-child(2) { opacity:1; transform:none; transition-delay:.15s; }
.stagger.visible > *:nth-child(3) { opacity:1; transform:none; transition-delay:.25s; }
.stagger.visible > *:nth-child(4) { opacity:1; transform:none; transition-delay:.35s; }
.stagger.visible > *:nth-child(5) { opacity:1; transform:none; transition-delay:.45s; }
.stagger.visible > *:nth-child(6) { opacity:1; transform:none; transition-delay:.55s; }

/* ── Navbar ── */
.lp-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:0 5vw; height:72px; display:flex; align-items:center; justify-content:space-between; transition:background .4s, box-shadow .4s; }
.lp-nav.scrolled { background:rgba(13,31,24,.97); backdrop-filter:blur(16px); box-shadow:0 1px 0 rgba(255,255,255,.06); }
.lp-nav-logo { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:#fff; letter-spacing:-.02em; }
.lp-nav-logo span { color:${C.gold}; }
.lp-nav-links { display:flex; gap:32px; }
.lp-nav-link { font-size:13px; font-weight:500; color:rgba(255,255,255,.7); text-decoration:none; letter-spacing:.04em; transition:color .2s; }
.lp-nav-link:hover { color:#fff; }
.lp-nav-cta { padding:10px 24px; background:${C.gold}; color:${C.dark}; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; text-decoration:none; border:none; cursor:pointer; transition:background .2s, transform .15s; }
.lp-nav-cta:hover { background:${C.goldLight}; transform:translateY(-1px); }
@media(max-width:768px) { .lp-nav-links { display:none; } }

/* ── Hero ── */
.lp-hero { min-height:100vh; background:${C.dark}; display:flex; align-items:center; position:relative; overflow:hidden; padding:120px 5vw 80px; }
.lp-hero-bg { position:absolute; inset:0; background: radial-gradient(ellipse 80% 80% at 70% 50%, ${C.forest} 0%, ${C.dark} 60%); }
.lp-hero-grid { position:absolute; inset:0; background-image: linear-gradient(rgba(126,200,160,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(126,200,160,.04) 1px, transparent 1px); background-size:60px 60px; }
.lp-hero-content { position:relative; z-index:2; max-width:680px; }
.lp-hero-eyebrow { font-size:11px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:${C.gold}; margin-bottom:24px; display:flex; align-items:center; gap:12px; }
.lp-hero-eyebrow::before { content:''; display:block; width:32px; height:1px; background:${C.gold}; }
.lp-hero-h1 { font-family:'Playfair Display',serif; font-size:clamp(42px,6vw,80px); font-weight:900; line-height:1.05; color:#fff; letter-spacing:-.03em; margin-bottom:24px; }
.lp-hero-h1 em { font-style:italic; color:${C.leaf}; }
.lp-hero-sub { font-size:clamp(15px,1.8vw,18px); font-weight:300; line-height:1.7; color:rgba(255,255,255,.65); max-width:520px; margin-bottom:48px; }
.lp-hero-actions { display:flex; gap:16px; flex-wrap:wrap; }
.lp-btn-primary { padding:16px 36px; background:${C.gold}; color:${C.dark}; font-size:13px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; text-decoration:none; border:none; cursor:pointer; transition:all .2s; display:inline-block; }
.lp-btn-primary:hover { background:${C.goldLight}; transform:translateY(-2px); box-shadow:0 8px 32px rgba(201,168,76,.35); }
.lp-btn-ghost { padding:16px 36px; background:transparent; color:#fff; font-size:13px; font-weight:500; letter-spacing:.08em; text-transform:uppercase; text-decoration:none; border:1px solid rgba(255,255,255,.3); cursor:pointer; transition:all .2s; display:inline-block; }
.lp-btn-ghost:hover { border-color:#fff; background:rgba(255,255,255,.06); }
.lp-hero-lion { position:absolute; right:5vw; top:50%; transform:translateY(-50%); width:clamp(280px,35vw,520px); opacity:.18; pointer-events:none; }
.lp-hero-scroll { position:absolute; bottom:40px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; color:rgba(255,255,255,.3); font-size:10px; letter-spacing:.15em; text-transform:uppercase; }
.lp-hero-scroll-line { width:1px; height:48px; background:linear-gradient(${C.gold},transparent); animation:scrollPulse 2s ease-in-out infinite; }
@keyframes scrollPulse { 0%,100%{opacity:.3;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.1)} }

/* Hero entrance animations */
.lp-hero-eyebrow { animation: fadeUp .8s .2s both; }
.lp-hero-h1 { animation: fadeUp 1s .35s both; }
.lp-hero-sub { animation: fadeUp .9s .55s both; }
.lp-hero-actions { animation: fadeUp .8s .75s both; }
@keyframes fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }

/* ── Manifesto ── */
.lp-manifesto { background:${C.offwhite}; padding:100px 5vw; border-top:4px solid ${C.gold}; }
.lp-manifesto-inner { max-width:900px; margin:0 auto; text-align:center; }
.lp-manifesto-quote { font-family:'Playfair Display',serif; font-size:clamp(24px,3.5vw,46px); font-weight:700; line-height:1.25; color:${C.dark}; letter-spacing:-.02em; }
.lp-manifesto-quote em { font-style:italic; color:${C.mid}; }
.lp-manifesto-sub { margin-top:24px; font-size:15px; font-weight:400; color:${C.muted}; line-height:1.7; max-width:600px; margin-left:auto; margin-right:auto; }
.lp-divider-lion { width:48px; height:1px; background:${C.gold}; margin:32px auto; position:relative; }
.lp-divider-lion::before, .lp-divider-lion::after { content:''; position:absolute; top:-3px; width:6px; height:6px; border:1px solid ${C.gold}; transform:rotate(45deg); }
.lp-divider-lion::before { left:-10px; }
.lp-divider-lion::after { right:-10px; }

/* ── Números ── */
.lp-numbers { background:${C.dark}; padding:80px 5vw; }
.lp-numbers-grid { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(255,255,255,.08); }
.lp-number-card { background:${C.dark}; padding:48px 32px; text-align:center; }
.lp-number-value { font-family:'Playfair Display',serif; font-size:clamp(40px,5vw,64px); font-weight:900; color:${C.gold}; line-height:1; }
.lp-number-suffix { font-size:clamp(20px,2.5vw,32px); color:${C.goldLight}; }
.lp-number-label { margin-top:12px; font-size:12px; font-weight:500; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.5); }
@media(max-width:768px) { .lp-numbers-grid { grid-template-columns:repeat(2,1fr); } }

/* ── Jornada ── */
.lp-journey { padding:120px 5vw; background:#fff; }
.lp-journey-inner { max-width:1100px; margin:0 auto; }
.lp-section-eyebrow { font-size:11px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:${C.gold}; margin-bottom:16px; display:flex; align-items:center; gap:12px; }
.lp-section-eyebrow::before { content:''; display:block; width:24px; height:1px; background:${C.gold}; }
.lp-section-title { font-family:'Playfair Display',serif; font-size:clamp(28px,4vw,52px); font-weight:900; color:${C.dark}; letter-spacing:-.03em; line-height:1.1; margin-bottom:64px; }
.lp-section-title em { font-style:italic; color:${C.mid}; }
.lp-journey-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:0; position:relative; }
.lp-journey-steps::before { content:''; position:absolute; top:32px; left:10%; right:10%; height:1px; background:linear-gradient(90deg, transparent, ${C.gold}, ${C.gold}, transparent); }
.lp-journey-step { padding:24px 24px 32px; text-align:center; position:relative; }
.lp-journey-dot { width:64px; height:64px; border-radius:50%; background:${C.dark}; border:2px solid ${C.gold}; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; position:relative; z-index:1; transition:all .3s; }
.lp-journey-step:hover .lp-journey-dot { background:${C.gold}; transform:scale(1.1); }
.lp-journey-dot-num { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:${C.gold}; transition:color .3s; }
.lp-journey-step:hover .lp-journey-dot-num { color:${C.dark}; }
.lp-journey-step-title { font-size:14px; font-weight:700; color:${C.dark}; letter-spacing:.04em; text-transform:uppercase; margin-bottom:8px; }
.lp-journey-step-sub { font-size:13px; color:${C.muted}; line-height:1.6; }
.lp-journey-step-years { font-size:11px; color:${C.gold}; font-weight:600; letter-spacing:.08em; margin-bottom:6px; }
@media(max-width:768px) { .lp-journey-steps { grid-template-columns:1fr 1fr; } .lp-journey-steps::before { display:none; } }

/* ── Filosofia (split) ── */
.lp-split { display:grid; grid-template-columns:1fr 1fr; min-height:600px; }
.lp-split-dark { background:${C.dark}; padding:80px 5vw 80px; display:flex; align-items:center; }
.lp-split-light { background:${C.offwhite}; padding:80px 5vw 80px; display:flex; align-items:center; position:relative; overflow:hidden; }
.lp-split-dark-inner { max-width:480px; }
.lp-split-light-inner { max-width:480px; }
.lp-split-title { font-family:'Playfair Display',serif; font-size:clamp(28px,3vw,42px); font-weight:900; color:#fff; letter-spacing:-.02em; line-height:1.15; margin-bottom:24px; }
.lp-split-title em { font-style:italic; color:${C.leaf}; }
.lp-split-body { font-size:15px; font-weight:300; color:rgba(255,255,255,.65); line-height:1.8; }
.lp-split-body p + p { margin-top:16px; }
.lp-pillar { display:flex; gap:20px; margin-bottom:32px; align-items:flex-start; }
.lp-pillar-num { font-family:'Playfair Display',serif; font-size:36px; font-weight:900; color:${C.gold}; line-height:1; flex-shrink:0; width:48px; }
.lp-pillar-title { font-size:13px; font-weight:700; color:${C.dark}; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; }
.lp-pillar-text { font-size:13px; color:${C.muted}; line-height:1.6; }
.lp-split-bg-lion { position:absolute; right:-40px; bottom:-40px; width:320px; opacity:.04; }
@media(max-width:900px) { .lp-split { grid-template-columns:1fr; } }

/* ── Aprovações ── */
.lp-aprovacoes { padding:120px 5vw; background:${C.dark}; }
.lp-aprovacoes-inner { max-width:1100px; margin:0 auto; }
.lp-aprovacoes .lp-section-title { color:#fff; }
.lp-univ-grid { display:flex; flex-wrap:wrap; gap:12px; }
.lp-univ-tag { padding:10px 22px; border:1px solid rgba(201,168,76,.25); color:rgba(255,255,255,.75); font-size:12px; font-weight:500; letter-spacing:.06em; transition:all .3s; cursor:default; }
.lp-univ-tag:hover { border-color:${C.gold}; color:#fff; background:rgba(201,168,76,.08); }
.lp-univ-featured { border-color:${C.gold}; color:${C.goldLight}; font-weight:700; }
.lp-result-strip { margin-top:56px; display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.lp-result-item { border-left:2px solid ${C.gold}; padding:20px 24px; }
.lp-result-num { font-family:'Playfair Display',serif; font-size:36px; font-weight:900; color:${C.gold}; line-height:1; }
.lp-result-desc { font-size:13px; color:rgba(255,255,255,.6); margin-top:6px; line-height:1.5; }
@media(max-width:768px) { .lp-result-strip { grid-template-columns:1fr; } }

/* ── Depoimentos ── */
.lp-depos { padding:120px 5vw; background:${C.offwhite}; }
.lp-depos-inner { max-width:1100px; margin:0 auto; }
.lp-depos-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.lp-depo-card { background:#fff; padding:36px 32px; border-bottom:3px solid ${C.gold}; }
.lp-depo-quote { font-family:'Playfair Display',serif; font-size:15px; font-style:italic; line-height:1.75; color:${C.text}; margin-bottom:24px; }
.lp-depo-quote::before { content:'"'; font-size:48px; color:${C.gold}; line-height:0; vertical-align:-.4em; margin-right:4px; font-family:'Playfair Display',serif; }
.lp-depo-author { font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:${C.dark}; }
.lp-depo-role { font-size:11px; color:${C.muted}; margin-top:4px; }
@media(max-width:900px) { .lp-depos-grid { grid-template-columns:1fr; } }

/* ── Metodologia ── */
.lp-metodo { padding:120px 5vw; background:#fff; }
.lp-metodo-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
.lp-metodo-cards { display:grid; gap:20px; }
.lp-metodo-card { display:flex; gap:20px; padding:28px; border:1px solid #e8eee9; transition:all .3s; }
.lp-metodo-card:hover { border-color:${C.gold}; box-shadow:0 4px 24px rgba(13,31,24,.06); transform:translateY(-2px); }
.lp-metodo-icon { width:48px; height:48px; background:${C.dark}; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
.lp-metodo-icon svg { width:22px; height:22px; stroke:#fff; fill:none; stroke-width:1.5; }
.lp-metodo-card-title { font-size:13px; font-weight:700; color:${C.dark}; letter-spacing:.04em; text-transform:uppercase; margin-bottom:8px; }
.lp-metodo-card-text { font-size:13px; color:${C.muted}; line-height:1.65; }
@media(max-width:900px) { .lp-metodo-inner { grid-template-columns:1fr; gap:48px; } }

/* ── CTA Final ── */
.lp-cta { background:${C.dark}; padding:140px 5vw; text-align:center; position:relative; overflow:hidden; }
.lp-cta-bg { position:absolute; inset:0; background:radial-gradient(ellipse 70% 70% at 50% 50%, ${C.forest} 0%, ${C.dark} 70%); }
.lp-cta-lion-bg { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:600px; opacity:.04; pointer-events:none; }
.lp-cta-inner { position:relative; z-index:1; max-width:700px; margin:0 auto; }
.lp-cta-eyebrow { font-size:11px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:${C.gold}; margin-bottom:20px; }
.lp-cta-title { font-family:'Playfair Display',serif; font-size:clamp(36px,5vw,64px); font-weight:900; color:#fff; letter-spacing:-.03em; line-height:1.1; margin-bottom:20px; }
.lp-cta-title em { font-style:italic; color:${C.leaf}; }
.lp-cta-sub { font-size:16px; color:rgba(255,255,255,.6); line-height:1.7; margin-bottom:48px; }
.lp-cta-buttons { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
.lp-cta-info { margin-top:32px; font-size:12px; color:rgba(255,255,255,.3); letter-spacing:.06em; }

/* ── Footer ── */
.lp-footer { background:#060e0a; padding:48px 5vw; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
.lp-footer-logo { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:rgba(255,255,255,.5); }
.lp-footer-logo span { color:${C.gold}; }
.lp-footer-text { font-size:11px; color:rgba(255,255,255,.2); letter-spacing:.06em; }
.lp-footer-powered { font-size:11px; color:rgba(255,255,255,.2); }
.lp-footer-powered a { color:rgba(201,168,76,.5); text-decoration:none; }
.lp-footer-powered a:hover { color:${C.gold}; }
`;

// ── Lion SVG ─────────────────────────────────────────────────────────────────
function LionSVG({ style = {} }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      {/* Outer ring */}
      <circle cx="200" cy="200" r="185" stroke={C.gold} strokeWidth="1" opacity="0.4"/>
      <circle cx="200" cy="200" r="175" stroke={C.gold} strokeWidth="0.5" opacity="0.2"/>

      {/* Mane — triangles radiating outward */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle  = (i * 22.5) * (Math.PI / 180);
        const angle1 = ((i * 22.5) - 9) * (Math.PI / 180);
        const angle2 = ((i * 22.5) + 9) * (Math.PI / 180);
        const r1 = 100, r2 = 158;
        const cx = 200, cy = 200;
        const x0 = cx + r1 * Math.cos(angle);
        const y0 = cy + r1 * Math.sin(angle);
        const x1 = cx + r2 * Math.cos(angle1);
        const y1 = cy + r2 * Math.sin(angle1);
        const x2 = cx + r2 * Math.cos(angle2);
        const y2 = cy + r2 * Math.sin(angle2);
        return (
          <polygon
            key={i}
            points={`${x0},${y0} ${x1},${y1} ${x2},${y2}`}
            fill={i % 2 === 0 ? C.gold : C.forest}
            opacity={i % 2 === 0 ? 0.6 : 0.4}
          />
        );
      })}

      {/* Head */}
      <ellipse cx="200" cy="205" rx="88" ry="92" fill={C.dark}/>
      <ellipse cx="200" cy="205" rx="88" ry="92" stroke={C.gold} strokeWidth="1" opacity="0.5"/>

      {/* Forehead brow */}
      <path d="M152 178 Q175 165 200 168 Q225 165 248 178" stroke={C.gold} strokeWidth="1.5" opacity="0.7" fill="none"/>

      {/* Eyes */}
      <ellipse cx="174" cy="192" rx="13" ry="10" fill={C.forest}/>
      <ellipse cx="226" cy="192" rx="13" ry="10" fill={C.forest}/>
      <ellipse cx="174" cy="192" rx="13" ry="10" stroke={C.gold} strokeWidth="1" opacity="0.8"/>
      <ellipse cx="226" cy="192" rx="13" ry="10" stroke={C.gold} strokeWidth="1" opacity="0.8"/>
      {/* Pupils */}
      <ellipse cx="174" cy="192" rx="5" ry="7" fill={C.gold} opacity="0.9"/>
      <ellipse cx="226" cy="192" rx="5" ry="7" fill={C.gold} opacity="0.9"/>
      {/* Eye shine */}
      <circle cx="171" cy="189" r="2" fill="rgba(255,255,255,0.6)"/>
      <circle cx="223" cy="189" r="2" fill="rgba(255,255,255,0.6)"/>

      {/* Nose bridge */}
      <path d="M192 200 L200 216 L208 200" stroke={C.gold} strokeWidth="1" opacity="0.5" fill="none"/>
      {/* Nose */}
      <path d="M186 216 Q200 224 214 216 Q207 228 200 230 Q193 228 186 216Z" fill={C.gold} opacity="0.5"/>

      {/* Whisker dots */}
      {[163,171,179].map((x,i) => <circle key={`wl${i}`} cx={x} cy={222} r="1.5" fill={C.gold} opacity="0.4"/>)}
      {[221,229,237].map((x,i) => <circle key={`wr${i}`} cx={x} cy={222} r="1.5" fill={C.gold} opacity="0.4"/>)}

      {/* Ears */}
      <path d="M140 168 L132 138 L165 155 Z" fill={C.forest} stroke={C.gold} strokeWidth="1" opacity="0.7"/>
      <path d="M260 168 L268 138 L235 155 Z" fill={C.forest} stroke={C.gold} strokeWidth="1" opacity="0.7"/>

      {/* Crown above head */}
      <path d="M170 148 L180 130 L193 144 L200 126 L207 144 L220 130 L230 148"
        stroke={C.gold} strokeWidth="2" fill="none" opacity="0.7" strokeLinejoin="round"/>

      {/* Crown base line */}
      <line x1="168" y1="150" x2="232" y2="150" stroke={C.gold} strokeWidth="1" opacity="0.4"/>
    </svg>
  );
}

// ── Hooks ────────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

function useCounter(target, duration = 2200, active = false) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return n;
}

// ── Componentes de seção ─────────────────────────────────────────────────────
function StatCard({ value, suffix = "", label, active }) {
  const n = useCounter(value, 2200, active);
  return (
    <div className="lp-number-card">
      <div className="lp-number-value">
        {n.toLocaleString("pt-BR")}<span className="lp-number-suffix">{suffix}</span>
      </div>
      <div className="lp-number-label">{label}</div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LandingEscola() {
  const { slug } = useParams();

  // Dados da escola (carregados via API quando tem slug)
  const [escola, setEscola] = useState(null);
  useEffect(() => {
    if (slug) {
      axios.get(`/auth/escola/${slug}`)
        .then(res => {
          setEscola(res.data);
          if (res.data.nome) document.title = res.data.nome;
        })
        .catch(() => {});
    }
  }, [slug]);

  const escolaNome = escola?.nome || "DomEscola";
  const logoUrl = escola?.logoUrl ? `/escolas/logo/${slug}` : null;

  // Navbar scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveals
  const [manifestoRef, manifestoVis] = useReveal();
  const [numbersRef, numbersVis] = useReveal(0.2);
  const [journeyRef, journeyVis] = useReveal(0.1);
  const [splitRef, splitVis] = useReveal(0.15);
  const [aprovRef, aprovVis] = useReveal(0.1);
  const [deposRef, deposVis] = useReveal(0.1);
  const [metodoRef, metodoVis] = useReveal(0.1);
  const [ctaRef, ctaVis] = useReveal(0.15);

  return (
    <>
      <style>{STYLE}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        {logoUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logoUrl} alt={escolaNome} style={{ height: 40, maxWidth: 160, objectFit: "contain" }} />
          </div>
        ) : (
          <div className="lp-nav-logo">Dom<span>Escola</span></div>
        )}
        <div className="lp-nav-links">
          <a href="#jornada" className="lp-nav-link">Ensino</a>
          <a href="#aprovacoes" className="lp-nav-link">Resultados</a>
          <a href="#metodo" className="lp-nav-link">Metodologia</a>
          <a href="#depoimentos" className="lp-nav-link">Depoimentos</a>
        </div>
        <a href="#matricula" className="lp-nav-cta">Matricule-se</a>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-bg"/>
        <div className="lp-hero-grid"/>

        <LionSVG style={{ position:"absolute", right:"5vw", top:"50%", transform:"translateY(-50%)", width:"clamp(260px,33vw,500px)", opacity:.15, pointerEvents:"none" }}/>

        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">Excelência desde o berço</div>
          <h1 className="lp-hero-h1">
            Formamos<br/>
            líderes <em>desde</em><br/>
            o fundamental.
          </h1>
          <p className="lp-hero-sub">
            Do 1º ano ao vestibular, construímos a base sólida que transforma
            alunos em protagonistas. Metodologia rigorosa, resultados que falam por si.
          </p>
          <div className="lp-hero-actions">
            <a href="#matricula" className="lp-btn-primary">Garanta sua vaga</a>
            <a href="#jornada" className="lp-btn-ghost">Conheça o método</a>
          </div>
        </div>

        <div className="lp-hero-scroll">
          <div className="lp-hero-scroll-line"/>
          <span>scroll</span>
        </div>
      </section>

      {/* ── MANIFESTO ──────────────────────────────────────────────────── */}
      <section className="lp-manifesto">
        <div
          className={`lp-manifesto-inner reveal${manifestoVis ? " visible" : ""}`}
          ref={manifestoRef}
        >
          <div className="lp-divider-lion"/>
          <p className="lp-manifesto-quote">
            Enquanto outros preparam para a prova,<br/>
            nós preparamos para a <em>vida</em>.
          </p>
          <p className="lp-manifesto-sub">
            Acreditamos que a excelência não começa no Ensino Médio.
            Ela é cultivada desde os primeiros anos, tijolo por tijolo,
            com disciplina, curiosidade e propósito.
          </p>
          <div className="lp-divider-lion" style={{ marginTop:32 }}/>
        </div>
      </section>

      {/* ── NÚMEROS ────────────────────────────────────────────────────── */}
      <section className="lp-numbers">
        <div
          className={`lp-numbers-grid stagger${numbersVis ? " visible" : ""}`}
          ref={numbersRef}
        >
          <StatCard value={847}  suffix="+"  label="Aprovados em 2024" active={numbersVis}/>
          <StatCard value={28}   suffix=""   label="Anos de história"  active={numbersVis}/>
          <StatCard value={98}   suffix="%"  label="Taxa de aprovação" active={numbersVis}/>
          <StatCard value={3200} suffix="+"  label="Alunos formados"   active={numbersVis}/>
        </div>
      </section>

      {/* ── JORNADA ────────────────────────────────────────────────────── */}
      <section className="lp-journey" id="jornada">
        <div className="lp-journey-inner">
          <div ref={journeyRef} className={`reveal${journeyVis ? " visible" : ""}`}>
            <div className="lp-section-eyebrow">A jornada completa</div>
            <h2 className="lp-section-title">Uma trajetória <em>construída</em><br/>desde o início.</h2>
          </div>
          <div className={`lp-journey-steps stagger${journeyVis ? " visible" : ""}`}>
            {[
              { n:"I",   title:"Fundamental I",  years:"1º ao 5º ano",  desc:"Base de leitura, escrita e raciocínio lógico. O alicerce de tudo." },
              { n:"II",  title:"Fundamental II", years:"6º ao 9º ano",  desc:"Aprofundamento das disciplinas e desenvolvimento do pensamento crítico." },
              { n:"III", title:"Ensino Médio",   years:"1º ao 3º ano",  desc:"Preparação intensiva para o ENEM e os principais vestibulares do país." },
              { n:"IV",  title:"Aprovação",      years:"Resultado",     desc:"USP, UNICAMP, UNESP, ITA, IME. Nossos alunos chegam lá." },
            ].map(s => (
              <div key={s.n} className="lp-journey-step">
                <div className="lp-journey-dot">
                  <span className="lp-journey-dot-num lp-serif">{s.n}</span>
                </div>
                <div className="lp-journey-step-years">{s.years}</div>
                <div className="lp-journey-step-title">{s.title}</div>
                <div className="lp-journey-step-sub">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT FILOSOFIA ────────────────────────────────────────────── */}
      <section className="lp-split">
        <div className="lp-split-dark">
          <div
            className={`lp-split-dark-inner reveal-left${splitVis ? " visible" : ""}`}
            ref={splitRef}
          >
            <div className="lp-section-eyebrow" style={{ color:C.gold }}>Nossa filosofia</div>
            <h2 className="lp-split-title">
              Base sólida.<br/><em>Resultado</em><br/>excepcional.
            </h2>
            <div className="lp-split-body">
              <p>
                Não acreditamos em atalhos. O aluno que domina o fundamental
                chega ao vestibular com uma vantagem que nenhum cursinho
                de última hora consegue replicar.
              </p>
              <p>
                Nossa metodologia é rigorosa, humana e orientada por dados.
                Cada aluno é acompanhado individualmente — sabemos onde ele
                está e para onde precisa ir.
              </p>
            </div>
          </div>
        </div>
        <div className="lp-split-light">
          <LionSVG style={{ position:"absolute", right:-40, bottom:-40, width:320, opacity:.04, pointerEvents:"none" }}/>
          <div className={`lp-split-light-inner reveal-right${splitVis ? " visible" : ""}`}>
            {[
              { n:"01", title:"Disciplina",     text:"Método estruturado, cronograma claro e acompanhamento constante do desempenho." },
              { n:"02", title:"Excelência",     text:"Professores com formação sólida e compromisso genuíno com o desenvolvimento do aluno." },
              { n:"03", title:"Protagonismo",   text:"Ensinamos o aluno a pensar, questionar e construir — não a decorar e repetir." },
            ].map(p => (
              <div key={p.n} className="lp-pillar">
                <div className="lp-pillar-num lp-serif">{p.n}</div>
                <div>
                  <div className="lp-pillar-title">{p.title}</div>
                  <div className="lp-pillar-text">{p.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APROVAÇÕES ─────────────────────────────────────────────────── */}
      <section className="lp-aprovacoes" id="aprovacoes">
        <div className="lp-aprovacoes-inner">
          <div className={`reveal${aprovVis ? " visible" : ""}`} ref={aprovRef}>
            <div className="lp-section-eyebrow">Onde nossos alunos chegaram</div>
            <h2 className="lp-section-title">Aprovações que <em>provam</em><br/>o método.</h2>
          </div>
          <div className={`lp-univ-grid stagger${aprovVis ? " visible" : ""}`}>
            {["USP","UNICAMP","UNESP","ITA","IME","FUVEST","ENEM top 1%","FGV","Insper","FAAP","Mackenzie","ESPM","PUC","UNIFESP","UFSCAR"].map((u, i) => (
              <div key={u} className={`lp-univ-tag${i < 5 ? " lp-univ-featured" : ""}`}>{u}</div>
            ))}
          </div>
          <div className={`lp-result-strip stagger${aprovVis ? " visible" : ""}`}>
            {[
              { n:"1º lugar", desc:"Em Matemática no ENEM regional — 3 anos consecutivos" },
              { n:"94%",      desc:"Dos alunos do 3º ano aprovados na primeira tentativa" },
              { n:"12 ITAs",  desc:"Aprovados nos últimos 5 anos — entre os maiores vestibulares do país" },
            ].map(r => (
              <div key={r.n} className="lp-result-item">
                <div className="lp-result-num lp-serif">{r.n}</div>
                <div className="lp-result-desc">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METODOLOGIA ────────────────────────────────────────────────── */}
      <section className="lp-metodo" id="metodo">
        <div className="lp-metodo-inner">
          <div className={`reveal-left${metodoVis ? " visible" : ""}`} ref={metodoRef}>
            <div className="lp-section-eyebrow">Como ensinamos</div>
            <h2 className="lp-section-title">Um método feito<br/>para <em>durar</em>.</h2>
            <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginTop:16, maxWidth:400 }}>
              Cada aula é planejada para construir sobre o que veio antes.
              Nada é solto. Tudo é conectado. Assim criamos alunos que
              entendem — não apenas memorizam.
            </p>
            <div style={{ marginTop:40 }}>
              <LionSVG style={{ width:160, opacity:.3 }}/>
            </div>
          </div>
          <div className={`lp-metodo-cards reveal-right${metodoVis ? " visible" : ""}`}>
            {[
              {
                icon: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
                title: "Currículo integrado",
                text:  "As disciplinas se conversam. O que o aluno aprende em Português reforça o que aprende em Redação, e vice-versa."
              },
              {
                icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
                title: "Acompanhamento contínuo",
                text:  "Relatórios periódicos, reuniões com responsáveis e diagnósticos individuais garantem que nenhum aluno fique para trás."
              },
              {
                icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
                title: "Turmas reduzidas",
                text:  "Máximo de 28 alunos por turma. O professor conhece cada aluno pelo nome — e pelo desempenho."
              },
              {
                icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
                title: "Plataforma digital integrada",
                text:  "Notas, frequência, comunicados e boletim online. Pais e alunos acompanham tudo em tempo real."
              },
            ].map(c => (
              <div key={c.title} className="lp-metodo-card">
                <div className="lp-metodo-icon">
                  <svg viewBox="0 0 24 24">{c.icon}</svg>
                </div>
                <div>
                  <div className="lp-metodo-card-title">{c.title}</div>
                  <div className="lp-metodo-card-text">{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ────────────────────────────────────────────────── */}
      <section className="lp-depos" id="depoimentos">
        <div className="lp-depos-inner">
          <div className={`reveal${deposVis ? " visible" : ""}`} ref={deposRef}>
            <div className="lp-section-eyebrow">O que dizem sobre nós</div>
            <h2 className="lp-section-title">Histórias que nos<br/><em>movem</em>.</h2>
          </div>
          <div className={`lp-depos-grid stagger${deposVis ? " visible" : ""}`}>
            {[
              {
                quote: "Minha filha entrou no 6º ano sem gostar de Matemática. Saiu aprovada na UNICAMP. O que a escola fez foi transformar a relação dela com o conhecimento.",
                author: "Marta R.",
                role:   "Mãe de aluna — turma 2023"
              },
              {
                quote: "A base que construí aqui no Fundamental foi o que me diferenciou no cursinho. Quando os outros estavam aprendendo, eu estava revisando.",
                author: "Gabriel S.",
                role:   "Aprovado em Engenharia — USP 2024"
              },
              {
                quote: "Os professores não ensinam só a matéria. Eles ensinam a pensar. Isso ficou comigo muito além do vestibular.",
                author: "Isabela M.",
                role:   "Aprovada em Medicina — UNIFESP 2023"
              },
            ].map(d => (
              <div key={d.author} className="lp-depo-card">
                <p className="lp-depo-quote">{d.quote}</p>
                <div className="lp-depo-author">{d.author}</div>
                <div className="lp-depo-role">{d.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
      <section className="lp-cta" id="matricula">
        <div className="lp-cta-bg"/>
        <LionSVG style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:560, opacity:.05, pointerEvents:"none" }}/>
        <div
          className={`lp-cta-inner reveal${ctaVis ? " visible" : ""}`}
          ref={ctaRef}
        >
          <div className="lp-cta-eyebrow">Próxima turma — 2026</div>
          <h2 className="lp-cta-title">
            Sua história<br/>começa <em>aqui</em>.
          </h2>
          <p className="lp-cta-sub">
            Vagas limitadas. Venha conhecer a escola, conversar com os
            professores e ver de perto o ambiente onde seu filho vai crescer.
          </p>
          <div className="lp-cta-buttons">
            <a href="tel:+5500000000000" className="lp-btn-primary">Agendar visita</a>
            <a href="https://wa.me/5500000000000" className="lp-btn-ghost" target="_blank" rel="noreferrer">
              Falar no WhatsApp
            </a>
          </div>
          <p className="lp-cta-info">Atendimento seg–sex das 8h às 18h · Sem compromisso</p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        {logoUrl ? (
          <img src={logoUrl} alt={escolaNome} style={{ height: 32, maxWidth: 140, objectFit: "contain", opacity: 0.7 }} />
        ) : (
          <div className="lp-footer-logo">Dom<span>Escola</span></div>
        )}
        <div className="lp-footer-text">© {new Date().getFullYear()} {escolaNome} · Todos os direitos reservados</div>
        <div className="lp-footer-powered">
          Gerenciado por <a href="/" target="_blank" rel="noreferrer">Skolyo</a>
        </div>
      </footer>
    </>
  );
}
