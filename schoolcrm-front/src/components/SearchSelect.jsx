import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

const BG_LIGHT = "#f5f8f5";
const BG_DARK  = "rgba(255,255,255,.06)";

/**
 * SearchSelect — dropdown com busca integrada.
 * Props:
 *   options     : [{ value, label }]
 *   value       : valor selecionado atual
 *   onChange    : (value) => void
 *   placeholder : string  (default "Selecionar...")
 *   disabled    : bool
 *   variant     : "light" (default) | "dark"  — dark para uso dentro de sidebar escura
 *   minDropWidth: number (default 220) — largura mínima do popup em px
 */
export default function SearchSelect({
    options = [],
    value,
    onChange,
    placeholder = "Selecionar...",
    disabled = false,
    variant = "light",
    minDropWidth = 220,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const divRef = useRef(null);

    const isDark = variant === "dark";

    // Considera "sem seleção" apenas quando value é null/undefined/""
    // Para que opções com value="" (ex: "Todos") não sejam marcadas como placeholder
    const hasValue = value !== null && value !== undefined && String(value) !== "";
    const selected = hasValue ? options.find(o => String(o.value) === String(value)) : null;
    const filtered  = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (divRef.current && !divRef.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const handleOpen = (e) => {
        if (disabled) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const dropW = Math.max(rect.width, minDropWidth);
        // Se o dropdown vai sair da tela pela direita, alinhar pela direita do botão
        const leftPos = Math.min(rect.left + window.scrollX, window.innerWidth - dropW - 8);
        setCoords({
            top: rect.bottom + window.scrollY + 4,
            left: leftPos,
            width: dropW,
        });
        setOpen(prev => !prev);
    };

    /* ── estilos por variante ── */
    const btnBorder  = isDark
        ? `1px solid ${open ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.12)"}`
        : `1px solid ${open ? "#0d1f18" : "#eaeef2"}`;
    const btnBg      = isDark ? (disabled ? "rgba(0,0,0,.15)" : "rgba(255,255,255,.06)") : (disabled ? "#f5f8f5" : "white");
    const btnColor   = isDark
        ? (selected ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.35)")
        : (selected ? "#0d1f18" : "#9aaa9f");
    const chevColor  = isDark ? "rgba(255,255,255,.35)" : "#9aaa9f";

    return (
        <div ref={divRef} style={{ flex: 1, position: "relative", width: "100%" }}>
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 text-left transition"
                style={{
                    border: btnBorder,
                    borderRadius: "8px",
                    padding: "8px 12px",
                    background: btnBg,
                    color: btnColor,
                    cursor: disabled ? "not-allowed" : "pointer",
                    width: "100%",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                    minWidth: 0,
                }}>
                {/* Texto do botão: não trunca se couber, senão trunca */}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={14} color={chevColor}
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
            </button>

            {open && (
                <div style={{
                    position: "fixed",
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                    zIndex: 9999,
                    background: "white",
                    border: "1px solid #eaeef2",
                    borderRadius: "8px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                }}>
                    {/* busca */}
                    <div style={{ padding: "8px", borderBottom: "1px solid #eaeef2" }}>
                        <div className="flex items-center gap-2" style={{ background: BG_LIGHT, padding: "6px 10px", borderRadius: "6px" }}>
                            <Search size={13} color="#9aaa9f" />
                            <input
                                autoFocus
                                placeholder="Buscar..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    flex: 1, fontSize: "12px", outline: "none",
                                    background: "transparent", color: "#0d1f18",
                                    fontFamily: "'DM Sans', sans-serif", border: "none",
                                }}
                                onClick={e => e.stopPropagation()} />
                        </div>
                    </div>

                    {/* lista */}
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        {filtered.length === 0 && (
                            <p style={{ padding: "12px 16px", fontSize: "12px", color: "#9aaa9f", textAlign: "center" }}>
                                Nenhum resultado
                            </p>
                        )}
                        {filtered.map(o => {
                            // Ativo apenas quando o value do usuário não é vazio E coincide com a opção
                            const active = hasValue && String(o.value) === String(value);
                            return (
                                <button key={String(o.value)} type="button"
                                    onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "8px",
                                        width: "100%", textAlign: "left",
                                        padding: "9px 16px",
                                        fontSize: "13px",
                                        fontFamily: "'DM Sans', sans-serif",
                                        border: "none", cursor: "pointer",
                                        color: active ? "#1a4d3a" : "#0d1f18",
                                        background: active ? "#f0f5f2" : "transparent",
                                        fontWeight: active ? 600 : 400,
                                        transition: "background .12s",
                                    }}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#fafcfa"; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                                    <span style={{
                                        width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                                        background: active ? "#1a4d3a" : "transparent",
                                    }} />
                                    {/* Não trunca: palavra completa, quebra linha se necessário */}
                                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {o.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* rodapé */}
                    <div style={{ borderTop: "1px solid #f2f5f2", padding: "4px 12px 5px", textAlign: "right" }}>
                        <span style={{ fontSize: "10px", color: "#b8c4be", letterSpacing: ".04em" }}>
                            {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
