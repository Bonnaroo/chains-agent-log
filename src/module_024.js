/* Chains app — UI primitives (mirror of the design-system components,
   bundled locally so the kit runs standalone). Attaches to window. */

function Button({ children, variant = "primary", size = "md", icon = null, full = false, disabled = false, onClick, style = {}, ...rest }) {
  const [h, setH] = React.useState(false);
  const [pr, setPr] = React.useState(false);
  const sizes = { sm: { height: 32, pad: "0 12px", fs: 12, gap: 6, r: "var(--radius-sm)" }, md: { height: 40, pad: "0 18px", fs: 13, gap: 8, r: "var(--radius-md)" }, lg: { height: 48, pad: "0 24px", fs: 15, gap: 9, r: "var(--radius-md)" } };
  const s = sizes[size] || sizes.md;
  const pal = {
    primary: ["var(--primary)", "var(--primary-hover)", "var(--primary-press)", "#fff", "transparent"],
    accent: ["var(--accent)", "var(--accent-hover)", "var(--accent-press)", "#fff", "transparent"],
    secondary: ["var(--bg-elevated)", "var(--bone-100)", "var(--bone-200)", "var(--text-strong)", "var(--border-default)"],
    ghost: ["transparent", "var(--bone-200)", "var(--bone-300)", "var(--text-body)", "transparent"],
    danger: ["var(--bogey-600)", "var(--bogey-500)", "#A8322B", "#fff", "transparent"],
  };
  const [bg, bgH, bgP, fg, bd] = pal[variant] || pal.primary;
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setPr(false); }}
      onMouseDown={() => setPr(true)} onMouseUp={() => setPr(false)}
      style={{ display: full ? "flex" : "inline-flex", width: full ? "100%" : "auto", alignItems: "center", justifyContent: "center", gap: s.gap, height: s.height, padding: s.pad, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: s.fs, lineHeight: 1, color: disabled ? "var(--text-faint)" : fg, background: disabled ? "var(--bone-200)" : pr ? bgP : h ? bgH : bg, border: `1px solid ${disabled ? "var(--border-subtle)" : bd}`, borderRadius: s.r, cursor: disabled ? "not-allowed" : "pointer", transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast)", transform: pr && !disabled ? "translateY(1px)" : "none", boxShadow: variant === "secondary" ? "var(--shadow-xs)" : "none", ...style }} {...rest}>
      {icon && <span style={{ display: "inline-flex", width: s.fs + 3, height: s.fs + 3 }}>{icon}</span>}
      {children}
    </button>
  );
}

function IconButton({ children, variant = "secondary", size = "md", disabled = false, onClick, title, style = {}, ...rest }) {
  const [h, setH] = React.useState(false);
  const dim = { sm: 30, md: 38, lg: 46 }[size] || 38;
  const pal = { primary: ["var(--primary)", "var(--primary-hover)", "#fff", "transparent"], accent: ["var(--accent)", "var(--accent-hover)", "#fff", "transparent"], secondary: ["var(--bg-elevated)", "var(--bone-100)", "var(--text-body)", "var(--border-default)"], ghost: ["transparent", "var(--bone-200)", "var(--text-muted)", "transparent"] };
  const [bg, bgH, fg, bd] = pal[variant] || pal.secondary;
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: dim, height: dim, color: fg, background: h && !disabled ? bgH : bg, border: `1px solid ${bd}`, borderRadius: "var(--radius-md)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "background var(--dur-fast)", ...style }} {...rest}>
      <span style={{ display: "inline-flex", width: Math.round(dim * 0.46), height: Math.round(dim * 0.46) }}>{children}</span>
    </button>
  );
}

function Badge({ children, tone = "neutral", emphasis = "soft", style = {} }) {
  const tones = {
    neutral: { soft: ["var(--bone-200)", "var(--text-muted)"], solid: ["var(--chain-700)", "#fff"] },
    fairway: { soft: ["var(--fairway-100)", "var(--fairway-700)"], solid: ["var(--fairway-600)", "#fff"] },
    ace: { soft: ["var(--ace-100)", "var(--ace-700)"], solid: ["var(--ace-500)", "#fff"] },
    live: { soft: ["var(--ace-100)", "var(--ace-700)"], solid: ["var(--ace-500)", "#fff"] },
    under: { soft: ["var(--birdie-100)", "var(--birdie-600)"], solid: ["var(--birdie-600)", "#fff"] },
    over: { soft: ["var(--bogey-100)", "var(--bogey-600)"], solid: ["var(--bogey-600)", "#fff"] },
    gold: { soft: ["var(--gold-100)", "#9A7400"], solid: ["var(--gold-500)", "var(--pine-900)"] },
    sky: { soft: ["var(--sky-100)", "var(--sky-600)"], solid: ["var(--sky-500)", "#fff"] },
  };
  const [bg, fg] = (tones[tone] || tones.neutral)[emphasis];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 9px", background: bg, color: fg, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 11, borderRadius: "var(--radius-pill)", whiteSpace: "nowrap", ...style }}>
      {tone === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: emphasis === "solid" ? "#fff" : "var(--ace-500)", animation: "chains-pulse 1.4s var(--ease-out) infinite" }} />}
      {children}
    </span>
  );
}

function PlaceBadge({ place, size = 34, points = null, style = {} }) {
  const medals = { 1: { bg: "linear-gradient(150deg,#FFD75E,#E8A200)", fg: "#5A3D00", ring: "#C98A00" }, 2: { bg: "linear-gradient(150deg,#E4E8EA,#B4BFC4)", fg: "#3A434A", ring: "#9BA7AD" }, 3: { bg: "linear-gradient(150deg,#E6A877,#C57A45)", fg: "#4A2A12", ring: "#A8632F" } };
  const m = medals[place] || { bg: "var(--bone-200)", fg: "var(--chain-700)", ring: "var(--border-default)" };
  const ord = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th" };
  return <span title={points != null ? `${ord[place] || place} · ${points} pts` : ord[place]} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, background: m.bg, color: m.fg, border: `1.5px solid ${m.ring}`, borderRadius: "var(--radius-pill)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: Math.round(size * 0.42), lineHeight: 1, boxShadow: place <= 3 ? "var(--shadow-sm)" : "none", flexShrink: 0, ...style }}>{place}</span>;
}

function TierTag({ tier = "Elite", style = {} }) {
  const map = { Elite: ["var(--fairway-100)", "var(--fairway-700)", "var(--fairway-200)"], "Elite+": ["var(--fairway-600)", "#fff", "transparent"], Major: ["var(--pine-800)", "var(--gold-500)", "transparent"], Playoffs: ["var(--ace-100)", "var(--ace-700)", "var(--ace-200)"], Finals: ["var(--ace-500)", "#fff", "transparent"] };
  const [bg, fg, bd] = map[tier] || map.Elite;
  return <span style={{ display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px", background: bg, color: fg, border: `1px solid ${bd}`, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 10, borderRadius: "var(--radius-xs)", ...style }}>{tier}</span>;
}

function Avatar({ name = "", color = "var(--chain-600)", size = 36, ring = false, img = null, style = {} }) {
  // Member icon lookup: if no explicit img, see if a league member with this name
  // has a chosen avatar icon — so picked icons show everywhere Avatar is used.
  let src = img, iconKey = null;
  // v513: a real photo (set in Account) wins over the picked icon
  if (!src && name && window.ChainsFriends && ChainsFriends.photoByName) { try { src = ChainsFriends.photoByName(name) || null; } catch (e) {} }
  if (!src && name && window.ChainsEngine && ChainsEngine.members) {
    try {
      const m = ChainsEngine.members().find((x) => x.name === name && x.avatarIcon);
      if (m) { iconKey = m.avatarIcon; src = window.ChainsAssets ? ChainsAssets.avatar(m.avatarIcon) : ((window.CHAINS_AVATARS && window.CHAINS_AVATARS[m.avatarIcon]) || ("avatars/" + m.avatarIcon)); }
    } catch (e) {}
  }
  if (src) {
    return <span title={name} style={{ display: "inline-flex", flexShrink: 0, width: size, height: size, borderRadius: "var(--radius-pill)", overflow: "hidden", background: color, boxShadow: ring ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${color}` : "var(--shadow-xs)", ...style }}><img src={src} alt={name} onError={iconKey && window.ChainsAssets ? ChainsAssets.onErr("avatars", iconKey) : undefined} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></span>;
  }
  const initials = String(name == null ? "?" : name).split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  return <span title={name} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flexShrink: 0, background: color, color: "#fff", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: Math.round(size * 0.4), lineHeight: 1, boxShadow: ring ? `0 0 0 2px var(--bg-elevated), 0 0 0 4px ${color}` : "var(--shadow-xs)", textShadow: "0 1px 1px rgba(0,0,0,0.18)", ...style }}>{initials}</span>;
}

function MemberChip({ name, color, size = 30, active = false, trailing = null, onClick, style = {} }) {
  const [h, setH] = React.useState(false);
  const clickable = !!onClick;
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "5px 12px 5px 6px", background: active ? "var(--pine-800)" : h && clickable ? "var(--bone-100)" : "var(--bg-elevated)", border: `1px solid ${active ? "transparent" : "var(--border-subtle)"}`, borderRadius: "var(--radius-pill)", cursor: clickable ? "pointer" : "default", transition: "background var(--dur-fast)", ...style }}>
      <Avatar name={name} color={color} size={size} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 14, color: active ? "var(--bone-50)" : "var(--text-strong)" }}>{name}</span>
      {trailing != null && <span style={{ marginLeft: 2 }}>{trailing}</span>}
    </div>
  );
}

function ScoreValue({ value, size = 15, weight = 700, showSign = true, style = {} }) {
  let t, c;
  if (value == null || value === "") { t = "—"; c = "var(--text-faint)"; }
  else if (value === 0) { t = "E"; c = "var(--score-even)"; }
  else if (value < 0) { t = showSign ? String(value) : String(Math.abs(value)); c = "var(--score-under)"; }
  else { t = showSign ? `+${value}` : String(value); c = "var(--score-over)"; }
  return <span style={{ fontFamily: "var(--font-mono)", fontWeight: weight, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", fontSize: size, color: c, ...style }}>{t}</span>;
}

function StatTile({ label, value, sub = null, tone = "ink", accent = null, icon = null, style = {} }) {
  const ink = tone === "ink";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "14px 16px", background: ink ? "var(--bg-ink)" : "var(--bg-elevated)", border: ink ? "1px solid var(--border-ink)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: ink ? "var(--shadow-ink)" : "var(--shadow-sm)", minWidth: 0, ...style }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11, color: ink ? "var(--chain-400)" : "var(--text-muted)" }}>{icon}{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", fontSize: 34, lineHeight: 1, color: accent || (ink ? "var(--bone-50)" : "var(--text-strong)") }}>{value}</span>
      {sub != null && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: ink ? "var(--chain-400)" : "var(--text-muted)" }}>{sub}</span>}
    </div>
  );
}

function Card({ children, tone = "paper", pad = 20, accentBar = null, hover = false, onClick, style = {} }) {
  const [h, setH] = React.useState(false);
  const ink = tone === "ink";
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: "relative", background: ink ? "var(--bg-ink)" : "var(--bg-elevated)", border: ink ? "1px solid var(--border-ink)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", boxShadow: hover && h ? "var(--shadow-lg)" : ink ? "var(--shadow-ink)" : "var(--shadow-sm)", padding: pad, overflow: "hidden", cursor: onClick ? "pointer" : "default", transform: hover && h ? "translateY(-2px)" : "none", transition: "box-shadow var(--dur) var(--ease-out), transform var(--dur)", ...style }}>
      {accentBar && <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: accentBar }} />}
      {children}
    </div>
  );
}

function SectionHeader({ kicker = null, title, subtitle = null, action = null, size = "md", style = {} }) {
  const ts = size === "lg" ? 34 : size === "sm" ? 20 : 26;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 16, ...style }}>
      <div style={{ minWidth: 0 }}>
        {kicker && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ width: 16, height: 3, background: "var(--accent)", borderRadius: 2 }} /><span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 12, color: "var(--text-muted)" }}>{kicker}</span></div>}
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1, fontSize: ts, color: "var(--text-strong)" }}>{title}</h2>
        {subtitle && <p style={{ margin: "6px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)" }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

function PlayerSelect({ options = [], value = "", onChange, placeholder = "Select player", disabled = false, size = "md", clearable = false, style = {} }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [pos, setPos] = React.useState(null);
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);
  const popRef = React.useRef(null);
  const h = size === "sm" ? 34 : 40;
  // Anchor the dropdown to the field, then render it in a body PORTAL with
  // position:fixed so an ancestor's overflow:hidden (the picks-table Card) can't
  // clip it. Recompute on open + on scroll/resize so it tracks the field.
  function place() {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 240 && above > below;
    const maxH = Math.max(132, Math.min(260, (up ? above : below) - 56));
    const width = Math.min(Math.max(r.width, 220), window.innerWidth - 16);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ up: up, maxH: maxH, left: left, width: width, top: up ? null : Math.round(r.bottom + 6), bottom: up ? Math.round(window.innerHeight - r.top + 6) : null });
  }
  React.useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (ref.current && ref.current.contains(e.target)) return; if (popRef.current && popRef.current.contains(e.target)) return; setOpen(false); }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    function reflow() { place(); }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, true);
    return () => { document.removeEventListener("mousedown", onDoc); window.removeEventListener("keydown", onKey); window.removeEventListener("resize", reflow); window.removeEventListener("scroll", reflow, true); };
  }, [open]);
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase())) : options;
  function toggle() {
    if (disabled) return;
    if (!open) place();
    setOpen((o) => !o);
  }
  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button ref={btnRef} type="button" disabled={disabled} onClick={toggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", height: h, padding: "0 12px", background: disabled ? "var(--bg-sunken)" : "var(--bg-elevated)", border: `1px solid ${open ? "var(--fairway-500)" : "var(--border-default)"}`, boxShadow: open ? "var(--ring)" : "var(--shadow-xs)", borderRadius: "var(--radius-md)", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: value ? 600 : 400, color: value ? "var(--text-strong)" : "var(--text-faint)", transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)", boxSizing: "border-box" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur-fast)" }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && pos && ReactDOM.createPortal(
        <div ref={popRef} style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top != null ? pos.top : "auto", bottom: pos.bottom != null ? pos.bottom : "auto", zIndex: 1000, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", overflow: "hidden", animation: "chains-fade .14s var(--ease-out, ease) both" }}>
          <div style={{ padding: 8, borderBottom: "1px solid var(--border-subtle)" }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players…"
              style={{ width: "100%", height: 32, padding: "0 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-sans)", fontSize: 13, outline: "none", background: "var(--bg-surface)", boxSizing: "border-box" }} />
          </div>
          <div style={{ maxHeight: pos.maxH, overflowY: "auto" }}>
            {clearable && value && (
              <button type="button" onClick={() => { onChange && onChange(""); setOpen(false); setQ(""); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 14px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 600, color: "var(--clay-600, #b4452f)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bone-100)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Clear pick
              </button>
            )}
            {filtered.length === 0 && <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-faint)" }}>No players found</div>}
            {filtered.map((o) => (
              <button key={o.name} type="button" onClick={() => { onChange && onChange(o.name); setOpen(false); setQ(""); }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", padding: "8px 14px", border: "none", background: o.name === value ? "var(--fairway-100)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" }}
                onMouseEnter={(e) => { if (o.name !== value) e.currentTarget.style.background = "var(--bone-100)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = o.name === value ? "var(--fairway-100)" : "transparent"; }}>
                <span style={{ fontWeight: 500 }}>{o.name}</span>
                {o.rating != null && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--text-faint)" }}>{o.rating}</span>}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function SegmentedTabs({ items = [], value, onChange, style = {} }) {
  return (
    <div style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", ...style }}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button key={it.id} type="button" onClick={() => onChange && onChange(it.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 34, padding: "0 16px", border: "none", borderRadius: "var(--radius-pill)", background: active ? "var(--bg-elevated)" : "transparent", boxShadow: active ? "var(--shadow-sm)" : "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 13, color: active ? "var(--text-strong)" : "var(--text-muted)", transition: "background var(--dur-fast), color var(--dur-fast)" }}>
            {it.icon && <span style={{ display: "inline-flex", width: 15, height: 15 }}>{it.icon}</span>}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

function useViewport() {
  const get = () => (typeof window !== "undefined" ? window.innerWidth : 1200);
  const [w, setW] = React.useState(get());
  React.useEffect(() => {
    const on = () => setW(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return { w, mobile: w < 760, tablet: w >= 760 && w < 1080, narrow: w < 1080, desktop: w >= 1080 };
}

Object.assign(window, { Button, IconButton, Badge, PlaceBadge, TierTag, Avatar, MemberChip, ScoreValue, StatTile, Card, SectionHeader, PlayerSelect, SegmentedTabs, useViewport });
