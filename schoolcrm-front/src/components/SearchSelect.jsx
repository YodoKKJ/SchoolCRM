import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

const BG = "#f5f8f5";

/**
 * SearchSelect — dropdown with search, replaces all native <select> elements.
 * Props:
 *   options   : [{ value, label }]
 *   value     : current selected value (string/number)
 *   onChange  : (value) => void
 *   placeholder: string (default "Selecionar...")
 *   disabled  : bool
 */
export default function SearchSelect({ options = [], value, onChange, placeholder = "Selecionar...", disabled = false }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const divRef = useRef(null);

    const selected = options.find(o => String(o.value) === String(value));
    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

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
        setCoords({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
        setOpen(prev => !prev);
    };

    return (
        <div ref={divRef} style={{ flex: 1, position: "relative", width: "100%" }}>
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 text-left text-sm transition"
                style={{
                    border: `1px solid ${open ? '#0d1f18' : '#eaeef2'}`,
                    borderRadius: "8px",
                    padding: "8px 12px",
                    background: disabled ? "#f5f8f5" : "white",
                    color: selected ? '#0d1f18' : '#9aaa9f',
                    cursor: disabled ? "not-allowed" : "pointer",
                    width: "100%",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "13px",
                }}>
                <span className="truncate">{selected ? selected.label : placeholder}</span>
                <ChevronDown size={14} color='#9aaa9f'
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
                    border: '1px solid #eaeef2',
                    borderRadius: '8px',
                    boxShadow: "0 8px 32px rgba(26,117,159,0.15)",
                    overflow: "hidden",
                }}>
                    <div className="p-2" style={{ borderBottom: '1px solid #eaeef2' }}>
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: BG }}>
                            <Search size={13} color='#9aaa9f' />
                            <input
                                autoFocus
                                placeholder="Buscar..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="flex-1 text-xs outline-none bg-transparent"
                                style={{ color: '#0d1f18', fontFamily: "'DM Sans', sans-serif" }}
                                onClick={e => e.stopPropagation()} />
                        </div>
                    </div>
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        {filtered.length === 0 && (
                            <p className="px-4 py-3 text-xs text-center" style={{ color: '#9aaa9f' }}>Nenhum resultado</p>
                        )}
                        {filtered.map(o => {
                            const active = String(o.value) === String(value);
                            return (
                                <button key={o.value} type="button"
                                    onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
                                    className="w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-2"
                                    style={{
                                        color: active ? '#1a4d3a' : '#0d1f18',
                                        background: active ? '#f0f5f2' : 'transparent',
                                        fontWeight: active ? 600 : 400,
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}>
                                    {active && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#1a4d3a' }} />}
                                    <span className="truncate">{o.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ borderTop: '1px solid #eaeef2', padding: '4px 12px 6px', textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: '#9aaa9f', letterSpacing: '.04em' }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
