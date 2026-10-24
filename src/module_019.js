/* Chains app — "In the Bag" disc log UI. window.BagView
   Quick count OR detailed discs (name + type). Mark lost/retired; bag breakdown
   by type. Reads/writes ChainsBag (chains-app, keyed by whoami). */
(function () {
  const __Portal = ({ children }) => (window.ReactDOM && ReactDOM.createPortal) ? ReactDOM.createPortal(children, document.body) : children;

  const E = React.createElement;

  function BagHead({ onBack }) {
    return E("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
      E("button", { onClick: onBack, "aria-label": "Back", style: { width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, E(Icons.ChevRight, { size: 18, style: { transform: "rotate(180deg)" } })),
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1 } }, "In the Bag"),
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 } }, "What you carry")));
  }

  // Disc picker — UDisc-style combobox over the live catalog. Type-ahead by mold
  // (and brand), prefix-ranked, debounced; Brand + Type filters stack. Reusable for
  // the in-round lookup (lookupOnly hides "add to bag"). onPick(disc) optional.
  /* v491 — "Add to bag" / edit sheet: plastic (per brand), color, weight, note. */
  function AddDiscSheet({ disc, BAG, existing, onClose, onDone }) {
    const d = disc || existing || {};
    const brand = d.brand || "";
    const [plastics, setPlastics] = React.useState(() => BAG.plasticsFor ? BAG.plasticsFor(brand) : []);
    const [plastic, setPlastic] = React.useState(existing ? (existing.plastic || "") : "");
    const [other, setOther] = React.useState("");
    const [color, setColor] = React.useState(existing ? (existing.color || "") : "");
    const [weight, setWeight] = React.useState(existing && existing.weight ? String(existing.weight) : "");
    const [notes, setNotes] = React.useState(existing ? (existing.notes || "") : "");
    React.useEffect(() => { if (BAG.loadPlastics) BAG.loadPlastics().then(() => setPlastics(BAG.plasticsFor(brand))); }, [brand]);
    const known = plastics.indexOf(plastic) >= 0;
    const finalPlastic = known ? plastic : (other.trim() || plastic || "");
    const flight = [d.speed, d.glide, d.turn, d.fade].map((n) => n == null ? "–" : n).join(" / ");
    const chip = (on) => ({ height: 36, padding: "0 13px", borderRadius: 18, border: "1px solid " + (on ? "var(--fairway-600)" : "var(--border-default)"), background: on ? "var(--fairway-700)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, flexShrink: 0 });
    const label = { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)", margin: "14px 0 8px" };
    function save() {
      const extra = { plastic: finalPlastic || null, color: color || null, weight: weight || null, notes: notes || null };
      if (existing && BAG.updateDisc) BAG.updateDisc(existing.id, extra); else if (BAG.addDiscObj) BAG.addDiscObj(disc, extra);
      try { if (window.ChainsToast) ChainsToast.show((existing ? "Updated " : "Added ") + (finalPlastic ? finalPlastic + " " : "") + (d.mold || d.name) + (existing ? "" : " to your bag"), "success"); } catch (e) {}
      if (onDone) onDone(); onClose();
    }
    return (<__Portal>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(10,16,13,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", background: "var(--bg-page, #f6f4ee)", borderRadius: "22px 22px 0 0", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 12px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
            {d.pic ? <img src={d.pic} alt="" onError={(e) => { e.target.style.display = "none"; }} style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 10, background: "var(--bg-sunken)", flexShrink: 0 }} /> : <span style={{ width: 52, height: 52, borderRadius: 10, background: "var(--bg-sunken)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)", flexShrink: 0 }}><Icons.Disc size={24} /></span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, lineHeight: 1.05, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.mold || d.name}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{brand}{d.type || d.moldType ? " · " + (d.type || d.moldType) : ""} · <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{flight}</span></div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: 18 }}>×</button>
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            <div style={label}>Plastic</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {plastics.map((pl) => <button key={pl} style={chip(plastic === pl)} onClick={() => { setPlastic(plastic === pl ? "" : pl); setOther(""); }}>{pl}</button>)}
              <button style={chip(!known && (plastic === "__other" || other))} onClick={() => setPlastic("__other")}>Other…</button>
            </div>
            {plastic === "__other" && <input autoFocus value={other} onChange={(e) => setOther(e.target.value)} placeholder="Type the plastic (e.g. Halo Star, Z FLX)" style={{ width: "100%", height: 44, marginTop: 8, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14.5, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />}
            <div style={label}>Color</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {(BAG.COLORS || []).map(([name, hex]) => (
                <button key={name} onClick={() => setColor(color === name ? "" : name)} title={name} aria-label={name} style={{ width: 38, height: 38, borderRadius: "50%", border: color === name ? "3px solid var(--ace-500)" : "2px solid var(--border-default)", background: hex, cursor: "pointer", boxShadow: color === name ? "0 0 0 2px var(--bg-page, #f6f4ee) inset" : "none", padding: 0 }} />
              ))}
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 6, minHeight: 16 }}>{color || "Tap a color (optional)"}</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={label}>Weight</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} placeholder="175" style={{ width: 90, height: 44, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)" }}>g</span>
                  {[165, 170, 173, 175].map((w) => <button key={w} style={Object.assign({}, chip(String(w) === weight), { height: 32, padding: "0 10px", fontSize: 12.5 })} onClick={() => setWeight(String(w))}>{w}</button>)}
                </div>
              </div>
            </div>
            <div style={label}>Note</div>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Beat-in, tournament stamp, flippy…" style={{ width: "100%", height: 44, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14.5, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
            <button onClick={save} className="cw-press" style={{ width: "100%", height: 54, marginTop: 16, borderRadius: "var(--radius-lg)", border: "none", background: "linear-gradient(180deg, var(--ace-400), var(--ace-500))", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 16, boxShadow: "0 8px 20px -8px var(--ace-500)" }}>{existing ? "Save changes" : "Add to my bag"}</button>
          </div>
        </div>
      </div></__Portal>
    );
  }
  window.AddDiscSheet = AddDiscSheet;
  // one-line "Star · 175g · Innova" + color dot for a bag entry
  function discSub(d) { return [d.plastic, d.weight ? d.weight + "g" : null, d.brand].filter(Boolean).join(" · "); }
  function ColorDot({ d, BAG, size }) {
    const sz = size || 12;
    const bg = d.color && BAG.colorHex ? BAG.colorHex(d.color) : BAG.typeColor(d.type);
    return <span title={d.color || d.type} style={{ width: sz, height: sz, borderRadius: "50%", background: bg, border: d.color === "White" || d.color === "Clear" ? "1px solid var(--border-default)" : "1px solid rgba(0,0,0,.08)", flexShrink: 0, display: "inline-block" }} />;
  }
  function DiscPicker({ BAG, mobile, lookupOnly, onPick }) {
    const [catalog, setCatalog] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [dq, setDq] = React.useState("");           // debounced query
    const [brand, setBrand] = React.useState("");
    const [typeF, setTypeF] = React.useState("");
    React.useEffect(() => { if (BAG && BAG.loadCatalog) BAG.loadCatalog().then((c) => setCatalog(c || [])); }, []);
    React.useEffect(() => { const t = setTimeout(() => setDq(q.trim().toLowerCase()), 150); return () => clearTimeout(t); }, [q]);
    const brands = React.useMemo(() => catalog ? Array.from(new Set(catalog.map((d) => d.brand).filter(Boolean))).sort() : [], [catalog]);
    const TYPE_BUCKETS = ["Putter", "Midrange", "Fairway", "Driver"];
    const results = React.useMemo(() => {
      if (!catalog) return [];
      let list = catalog;
      if (brand) list = list.filter((d) => d.brand === brand);
      if (typeF) list = list.filter((d) => BAG.bagType(d.type) === typeF);
      if (dq) {
        const scored = [];
        list.forEach((d) => {
          const mold = (d.mold || "").toLowerCase(), br = (d.brand || "").toLowerCase();
          let rank = -1;
          if (mold.startsWith(dq)) rank = 0; else if (mold.indexOf(dq) >= 0) rank = 1; else if (br.startsWith(dq)) rank = 2; else if (br.indexOf(dq) >= 0) rank = 3;
          if (rank >= 0) scored.push({ d, rank });
        });
        scored.sort((a, b) => a.rank - b.rank || (a.d.mold || "").localeCompare(b.d.mold || ""));
        list = scored.map((s) => s.d);
      } else if (brand || typeF) {
        list = list.slice().sort((a, b) => (a.mold || "").localeCompare(b.mold || ""));
      } else {
        return [];   // nothing typed, no filter → show prompt
      }
      return list.slice(0, 50);
    }, [catalog, dq, brand, typeF]);
    const selStyle = { height: 40, padding: "0 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-strong)", outline: "none" };
    const flight = (d) => [d.speed, d.glide, d.turn, d.fade].map((n) => n == null ? "–" : n).join(" / ");
    const [pending, setPending] = React.useState(null);
    function choose(d) { if (onPick) onPick(d); if (!lookupOnly) { setPending(d); } }
    return E("div", null,
      pending ? E(AddDiscSheet, { disc: pending, BAG: BAG, onClose: () => setPending(null), onDone: () => { setQ(""); setDq(""); } }) : null,
      E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 } }, lookupOnly ? "Look up a disc" : "Add a disc"),
      E("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: catalog == null ? "Loading discs…" : "Search discs — e.g. Destroyer, Buzzz, Zone…", style: { width: "100%", height: 46, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" } }),
      E("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
        E("select", { value: brand, onChange: (e) => setBrand(e.target.value), style: Object.assign({ flex: 1, minWidth: 0 }, selStyle) }, [E("option", { key: "_", value: "" }, "All brands")].concat(brands.map((b) => E("option", { key: b, value: b }, b)))),
        E("select", { value: typeF, onChange: (e) => setTypeF(e.target.value), style: Object.assign({ width: 130 }, selStyle) }, [E("option", { key: "_", value: "" }, "All types")].concat(TYPE_BUCKETS.map((t) => E("option", { key: t, value: t }, t))))),
      (results.length > 0) ? E("div", { style: { marginTop: 8, maxHeight: 320, overflowY: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" } }, results.map((d, i) => E("button", { key: (d.brand || "") + d.mold + i, onClick: () => choose(d), style: { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer" } },
        d.pic ? E("img", { src: d.pic, alt: "", loading: "lazy", onError: (e) => { e.target.style.display = "none"; }, style: { width: 34, height: 34, objectFit: "contain", flexShrink: 0, borderRadius: 6, background: "var(--bg-sunken)" } }) : E("span", { style: { width: 34, height: 34, flexShrink: 0, borderRadius: 6, background: "var(--bg-sunken)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-faint)" } }, E(Icons.Disc, { size: 16 })),
        E("div", { style: { flex: 1, minWidth: 0 } },
          E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.mold),
          E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.brand + " · " + (d.type || ""))),
        E("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--text-muted)", flexShrink: 0 } }, flight(d)),
        d.stability ? E("span", { title: d.stability, style: { width: 9, height: 9, borderRadius: "50%", background: BAG.stabilityColor(d.stability), flexShrink: 0 } }) : null,
        lookupOnly ? null : E("span", { style: { width: 20, height: 20, color: "var(--fairway-600)", flexShrink: 0 } }, E(Icons.Plus ? Icons.Plus : Icons.Check, { size: 18 }))))) : (dq || brand || typeF) && catalog ? E("div", { style: { marginTop: 8, padding: "14px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, "No discs match.") : E("div", { style: { marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" } }, catalog ? "Type a disc name, or pick a brand to browse " + (catalog.length || "1,000+") + " discs." : "Loading the disc catalog…"));
  }

  window.DiscPicker = DiscPicker;

  // Disc detail — a fun flight-numbers card (tap a disc in the bag, or in-round).
  window.DiscDetail = function DiscDetail({ disc, BAG, onClose, onEdit, onShelf, onLost }) {
    const d = disc || {};
    const extras = [d.plastic, d.color, d.weight ? d.weight + "g" : null].filter(Boolean);
    const cells = [["Speed", d.speed], ["Glide", d.glide], ["Turn", d.turn], ["Fade", d.fade]];
    // Flight path (RHBH top-down): turn bends it right early, fade hooks it left
    // late. Sampled into a smooth line over a tall "fairway" so you can read the shape.
    const fpath = (() => {
      if (d.turn == null && d.fade == null) return null;
      const W = 150, H = 250, sx = W * 0.52, n = 28;
      const turn = d.turn == null ? 0 : d.turn, fade = d.fade == null ? 0 : d.fade;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const y = H * 0.92 * (1 - t) + H * 0.05;
        const turnComp = (-turn) * Math.sin(Math.PI * Math.min(t / 0.72, 1)) * (W * 0.075);
        const fadeComp = -fade * Math.max(0, (t - 0.45) / 0.55) * (W * 0.085);
        pts.push([sx + turnComp + fadeComp, y]);
      }
      return { d: pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" "), start: pts[0], end: pts[pts.length - 1] };
    })();
    return E("div", { onClick: onClose, style: { position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,16,13,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 } },
      E("div", { onClick: (e) => e.stopPropagation(), style: { width: "100%", maxWidth: 360, background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-lg, 0 20px 50px -12px rgba(0,0,0,.5))" } },
        E("div", { style: { display: "flex", alignItems: "center", gap: 13, padding: "16px 18px", background: "radial-gradient(120% 140% at 0% 0%, var(--pine-700) 0%, var(--bg-ink-deep, #16221d) 75%)" } },
          d.pic ? E("img", { src: d.pic, alt: "", onError: (e) => { e.target.style.display = "none"; }, style: { width: 56, height: 56, objectFit: "contain", flexShrink: 0, borderRadius: 8, background: "rgba(255,255,255,.06)" } }) : E("span", { style: { width: 56, height: 56, flexShrink: 0, borderRadius: 8, background: "rgba(255,255,255,.06)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--chain-300)" } }, E(Icons.Disc, { size: 26 })),
          E("div", { style: { flex: 1, minWidth: 0 } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--bone-50)", lineHeight: 1.05, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name || d.mold),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--chain-300)", marginTop: 2 } }, (d.brand || "") + (d.moldType ? " · " + d.moldType : (d.type ? " · " + d.type : ""))),
            extras.length ? E("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" } }, E(ColorDot, { d: d, BAG: BAG, size: 12 }), E("span", { style: { fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: "var(--bone-50)" } }, extras.join(" · ")), onEdit ? E("button", { onClick: onEdit, style: { marginLeft: 4, height: 24, padding: "0 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,.3)", background: "transparent", color: "var(--bone-50)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11 } }, "Edit") : null) : (onEdit ? E("button", { onClick: onEdit, style: { marginTop: 6, height: 24, padding: "0 10px", borderRadius: 12, border: "1px solid rgba(255,255,255,.3)", background: "transparent", color: "var(--bone-50)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11 } }, "Add plastic / color") : null),
            d.notes ? E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--chain-300)", marginTop: 4, fontStyle: "italic" } }, d.notes) : null,
            d.stability ? E("span", { style: { display: "inline-block", marginTop: 6, padding: "2px 9px", borderRadius: "var(--radius-pill)", background: BAG.stabilityColor(d.stability), color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 9.5 } }, d.stability) : null)),
        d.speed != null || d.glide != null ? E("div", { style: { display: "flex", padding: "14px 10px" } }, cells.map((c, i) => E("div", { key: c[0], style: { flex: 1, textAlign: "center", borderRight: i < 3 ? "1px solid var(--border-subtle)" : "none" } },
          E("div", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 26, color: "var(--text-strong)" } }, c[1] == null ? "–" : (c[1] > 0 && i >= 2 ? "+" + c[1] : c[1])),
          E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)", marginTop: 3 } }, c[0])))) : E("div", { style: { padding: "16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, "No flight numbers on file for this one."),
        fpath ? E("div", { style: { padding: "4px 16px 14px" } },
          E("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 } },
            E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9.5, color: "var(--text-faint)" } }, "Flight path"),
            E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)" } }, "RHBH \u00b7 top-down")),
          E("svg", { viewBox: "0 0 150 250", width: "100%", style: { display: "block", maxHeight: 280 } },
            E("rect", { x: 0.5, y: 0.5, width: 149, height: 249, rx: 14, fill: "var(--bg-sunken)", stroke: "var(--border-subtle)" }),
            E("line", { x1: fpath.start[0], y1: 14, x2: fpath.start[0], y2: 240, stroke: "var(--border-default)", strokeDasharray: "3 6", strokeWidth: 1 }),
            E("path", { d: fpath.d, fill: "none", stroke: "var(--ace-500)", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }),
            E("ellipse", { cx: fpath.start[0], cy: fpath.start[1], rx: 11, ry: 4, fill: "none", stroke: "var(--text-faint)", strokeWidth: 1.5 }),
            E("circle", { cx: fpath.end[0], cy: fpath.end[1], r: 5.5, fill: "var(--ace-500)" }),
            E("circle", { cx: fpath.end[0], cy: fpath.end[1], r: 9, fill: "none", stroke: "var(--ace-500)", strokeWidth: 1.5, opacity: 0.5 }))) : null,
        (onShelf || onLost) ? E("div", { style: { display: "flex", gap: 8, padding: "0 14px 12px" } },
          onShelf ? E("button", { onClick: onShelf, style: { flex: 1, height: 40, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13 } }, d.shelf ? "Put in bag" : "Move to shelf") : null,
          onLost ? E("button", { onClick: onLost, style: { flex: 1, height: 40, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--clay-600, #b4452f)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13 } }, "Mark lost") : null) : null,
        E("button", { onClick: onClose, style: { width: "100%", padding: "13px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 } }, "Close")));
  };

  // Read-only view of a FRIEND'S bag. Bags are shared between friends; this fetches
  // users/{uid}/bag via ChainsBag.bagFor and renders the same disc list read-only
  // (tap a disc for its flight numbers). No add/lost/remove — it isn't yours.
  window.FriendBagModal = function FriendBagModal({ friend, onClose, mobile }) {
    const BAG = window.ChainsBag;
    const [bag, setBag] = React.useState(undefined);   // undefined = loading, null = none
    const [discDetail, setDiscDetail] = React.useState(null);
    const [fq, setFq] = React.useState("");
    const fql = fq.trim().toLowerCase();
    React.useEffect(() => {
      let alive = true;
      if (BAG && BAG.bagFor && friend && friend.uid) BAG.bagFor(friend.uid).then((b) => { if (alive) setBag(b || null); });
      else setBag(null);
      return () => { alive = false; };
    }, [friend && friend.uid]);
    if (!BAG) return null;
    const discsAll = (bag && bag.discs) ? bag.discs.filter((d) => !d.lost && !d.shelf) : [];
    const shelfAll = (bag && bag.discs) ? bag.discs.filter((d) => !d.lost && d.shelf) : [];
    const discs = discsAll.filter((d) => !fql || [d.name, d.brand, d.plastic, d.color, d.notes, d.type].filter(Boolean).join(" ").toLowerCase().indexOf(fql) >= 0);
    const bd = bag ? BAG.breakdown(bag) : {};
    const total = bag ? BAG.effectiveCount(bag) : 0;
    const TYPES = BAG.TYPES;
    return E("div", { onClick: onClose, style: { position: "fixed", inset: 0, zIndex: 62, background: "rgba(10,16,13,0.6)", display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", padding: mobile ? 0 : 20 } },
      discDetail ? E(window.DiscDetail, { disc: discDetail, BAG: BAG, onClose: () => setDiscDetail(null) }) : null,
      E("div", { onClick: (e) => e.stopPropagation(), style: { width: "100%", maxWidth: 460, maxHeight: mobile ? "88vh" : "86vh", overflowY: "auto", background: "var(--bg-page)", borderRadius: mobile ? "var(--radius-lg) var(--radius-lg) 0 0" : "var(--radius-lg)", boxShadow: "var(--shadow-lg, 0 20px 50px -12px rgba(0,0,0,.5))" } },
        E("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", background: "radial-gradient(120% 140% at 0% 0%, var(--pine-700) 0%, var(--bg-ink-deep, #16221d) 75%)", position: "sticky", top: 0, zIndex: 1 } },
          E(Avatar, { name: friend.name, color: friend.disc, size: 40 }),
          E("div", { style: { flex: 1, minWidth: 0 } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 19, color: "var(--bone-50)", lineHeight: 1.05 } }, friend.name + "\u2019s bag"),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--chain-300)", marginTop: 2 } }, "Shared with friends")),
          E("button", { onClick: onClose, "aria-label": "Close", style: { width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(255,255,255,.1)", color: "var(--bone-50)", cursor: "pointer", fontWeight: 800, fontSize: 17, flexShrink: 0 } }, "\u00d7")),
        E("div", { style: { padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-sunken)", borderBottom: "1px solid var(--border-subtle)" } },
          E("span", { style: { width: 14, height: 14, display: "inline-flex", color: "var(--text-faint)", flexShrink: 0 } }, E(Icons.Users, { size: 14 })),
          E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.4 } }, "Bags are shared between friends. Picks, coins, and profile details stay private.")),
        bag === undefined ? E("div", { style: { padding: "40px 16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" } }, "Loading " + friend.name + "\u2019s bag\u2026")
        : (total === 0 && discsAll.length === 0) ? E("div", { style: { padding: "40px 20px", textAlign: "center" } },
            E("span", { style: { width: 52, height: 52, borderRadius: "50%", background: "var(--bg-sunken)", color: "var(--text-faint)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 } }, E(Icons.Disc, { size: 24 })),
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", marginBottom: 5 } }, "No discs logged"),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", maxWidth: 280, margin: "0 auto", lineHeight: 1.5 } }, friend.name + " hasn\u2019t added any discs to their bag yet."))
        : E("div", { style: { padding: 16, display: "flex", flexDirection: "column", gap: 14 } },
            E("div", { style: { display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: "var(--radius-lg)", background: "radial-gradient(120% 140% at 0% 0%, var(--pine-700) 0%, var(--bg-ink-deep, #16221d) 70%)", border: "1px solid var(--border-ink)" } },
              E("div", null,
                E("div", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 32, color: "var(--bone-50)", lineHeight: 1 } }, total),
                E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9.5, color: "var(--chain-400)", marginTop: 3 } }, "discs in bag")),
              E("div", { style: { flex: 1, display: "flex", gap: 6, flexWrap: "wrap" } }, TYPES.map((t) => E("div", { key: t, style: { flex: 1, minWidth: 52, textAlign: "center", padding: "7px 4px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,.06)" } },
                E("div", { style: { width: 9, height: 9, borderRadius: "50%", background: BAG.typeColor(t), margin: "0 auto 4px" } }),
                E("div", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: "var(--bone-50)" } }, bd[t] || 0),
                E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--chain-300)" } }, t))))),
            discsAll.length > 4 ? E("input", { value: fq, onChange: (e) => setFq(e.target.value), placeholder: "Search " + friend.name + "\u2019s bag \u2014 mold, plastic, color\u2026", style: { width: "100%", height: 42, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" } }) : null,
            discs.length > 0 ? E(Card, { pad: 0 }, discs.map((d, i) => E("button", { key: d.id || i, onClick: () => setDiscDetail(d), style: { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "11px 14px", border: "none", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer" } },
              E(ColorDot, { d: d, BAG: BAG, size: 14 }),
              E("span", { style: { flex: 1, minWidth: 0 } },
                E("span", { style: { display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name),
                discSub(d) ? E("span", { style: { display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, discSub(d)) : null),
              d.speed != null ? E("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10.5, color: "var(--text-faint)", flexShrink: 0 } }, [d.speed, d.glide, d.turn, d.fade].map((n) => n == null ? "\u2013" : n).join("/")) : null,
              E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", flexShrink: 0 } }, d.type))))
            : E("div", { style: { padding: "16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, fql ? "Nothing in " + friend.name + "\u2019s bag matches \u201c" + fq + "\u201d." : friend.name + " set a disc count but didn\u2019t list them."),
            shelfAll.length > 0 && !fql ? E("div", null,
              E("div", { style: { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-muted)", margin: "4px 0 8px" } }, "On the shelf (" + shelfAll.length + ")"),
              E(Card, { pad: 0 }, shelfAll.map((d, i) => E("button", { key: d.id || i, onClick: () => setDiscDetail(d), style: { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer", opacity: .8 } },
                E(ColorDot, { d: d, BAG: BAG, size: 12 }),
                E("span", { style: { flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name, discSub(d) ? E("span", { style: { fontWeight: 400, color: "var(--text-faint)" } }, " · " + discSub(d)) : null))))) : null)));
  };

  window.BagView = function BagView({ onBack, mobile }) {
    const [, force] = React.useState(0);
    const tick = () => force((x) => x + 1);
    React.useEffect(() => {
      if (window.ChainsBag) window.ChainsBag.hydrate().then(tick);
      const fn = () => tick(); window.addEventListener("chains:bag", fn);
      return () => window.removeEventListener("chains:bag", fn);
    }, []);
    const BAG = window.ChainsBag;
    if (!BAG) return E(Card, { pad: 18 }, E("div", { style: { color: "var(--text-faint)", fontFamily: "var(--font-sans)" } }, "Bag unavailable."));
    const bag = BAG.get();
    const TYPES = BAG.TYPES;
    const [name, setName] = React.useState("");
    const [type, setType] = React.useState("Driver");
    const active = (bag.discs || []).filter((d) => !d.lost && !d.shelf);
    const shelf = (bag.discs || []).filter((d) => !d.lost && d.shelf);
    const lost = (bag.discs || []).filter((d) => d.lost);
    const anyListed = (bag.discs || []).some((d) => !d.lost);
    const bd = BAG.breakdown(bag);
    const total = BAG.effectiveCount(bag);
    const [filter, setFilter] = React.useState("All");
    const [discDetail, setDiscDetail] = React.useState(null);
    const [editing, setEditing] = React.useState(null);
    const [bq, setBq] = React.useState("");
    const bql = bq.trim().toLowerCase();
    const shown = (filter === "All" ? active : active.filter((d) => d.type === filter)).filter((d) => !bql || [d.name, d.brand, d.plastic, d.color, d.notes].filter(Boolean).join(" ").toLowerCase().indexOf(bql) >= 0);

    function add() { const n = name.trim(); if (!n) return; BAG.addDisc(n, type); setName(""); }

    return E("div", { className: "gt-root", style: { display: "flex", flexDirection: "column", gap: 16 } },
      discDetail ? E(window.DiscDetail, { disc: discDetail, BAG: BAG, onClose: () => setDiscDetail(null), onEdit: () => { setEditing(discDetail); setDiscDetail(null); }, onShelf: () => { BAG.setShelf(discDetail.id, !discDetail.shelf); setDiscDetail(null); }, onLost: () => { BAG.setLost(discDetail.id, true); setDiscDetail(null); } }) : null,
      editing ? E(AddDiscSheet, { existing: editing, BAG: BAG, onClose: () => setEditing(null) }) : null,
      E(BagHead, { onBack: onBack }),
      window.PlayDiscCounter ? E(window.PlayDiscCounter, { mobile: mobile }) : null,
      // hero count + breakdown
      E("div", { style: { display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderRadius: "var(--radius-lg)", background: ((window.ChainsAssets && ChainsAssets.art("bag")) || (window.CHAINS_ART && window.CHAINS_ART.bag) ? "linear-gradient(105deg, rgba(12,22,15,0.92) 38%, rgba(12,22,15,0.35) 100%), url(" + ((window.ChainsAssets && ChainsAssets.art("bag")) || (window.CHAINS_ART && window.CHAINS_ART.bag)) + ") right center/cover" : "radial-gradient(120% 140% at 0% 0%, var(--pine-700) 0%, var(--bg-ink-deep, #16221d) 70%)"), border: "1px solid var(--border-ink)" } },
        E("div", null,
          E("div", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 34, color: "var(--bone-50)", lineHeight: 1 } }, total),
          E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9.5, color: "var(--chain-400)", marginTop: 3 } }, "discs in bag")),
        E("div", { style: { flex: 1, display: "flex", gap: 6, flexWrap: "wrap" } }, TYPES.map((t) => E("div", { key: t, style: { flex: 1, minWidth: 56, textAlign: "center", padding: "7px 4px", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,.06)" } },
          E("div", { style: { width: 9, height: 9, borderRadius: "50%", background: BAG.typeColor(t), margin: "0 auto 4px" } }),
          E("div", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16, color: "var(--bone-50)" } }, bd[t] || 0),
          E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--chain-300)" } }, t))))),
      // quick count — only until you list your discs (then the list IS the count)
      anyListed ? null : E("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" } },
        E("span", { style: { flex: 1, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" } }, "Don't want to list them all? Just set a count:"),
        E("button", { onClick: () => BAG.setCount(Math.max(0, (bag.count || 0) - 1)), className: "cw-press", style: { width: 38, height: 38, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-strong)" } }, "−"),
        E("span", { style: { minWidth: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-strong)" } }, bag.count || 0),
        E("button", { onClick: () => BAG.setCount((bag.count || 0) + 1), className: "cw-press", style: { width: 38, height: 38, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-strong)" } }, "+")),
      // add a disc — real catalog combobox
      E(DiscPicker, { BAG: BAG, mobile: mobile }),
      // disc list
      active.length > 0 ? E("div", null,
        active.length > 6 ? E("input", { value: bq, onChange: (e) => setBq(e.target.value), placeholder: "Search your bag — mold, plastic, color…", style: { width: "100%", height: 42, marginBottom: 8, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" } }) : null,
        E("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" } }, ["All"].concat(TYPES).map((t) => E("button", { key: t, onClick: () => setFilter(t), style: { padding: "6px 12px", borderRadius: "var(--radius-pill)", border: "1px solid " + (filter === t ? (t === "All" ? "var(--text-strong)" : BAG.typeColor(t)) : "var(--border-default)"), background: filter === t ? "var(--bg-sunken)" : "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 11, color: "var(--text-strong)" } }, t + (t === "All" ? " (" + active.length + ")" : " (" + (bd[t] || 0) + ")")))),
        E(Card, { pad: 0 }, shown.length === 0 ? E("div", { style: { padding: "16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, "No " + filter.toLowerCase() + "s in the bag.") : shown.map((d, i) => E("div", { key: d.id, style: { display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" } },
          E("button", { onClick: () => setDiscDetail(d), title: "See flight numbers", style: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: 0 } },
            E(ColorDot, { d: d, BAG: BAG, size: 14 }),
            E("span", { style: { minWidth: 0, flex: 1 } },
              E("span", { style: { display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name),
              E("span", { style: { display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, discSub(d) || (d.brand || "") || "tap to add plastic & color")),
            d.speed != null ? E("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: "var(--text-faint)", flexShrink: 0 } }, [d.speed, d.glide, d.turn, d.fade].map((n) => n == null ? "–" : n).join("/")) : null),
          E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", flexShrink: 0 } }, d.type),
          E("button", { onClick: () => { BAG.setShelf(d.id, true); try { window.ChainsToast && ChainsToast.show(d.name + " moved to the shelf — not counted in your bag.", "info"); } catch (e) {} }, title: "Move to shelf", style: { padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 10 } }, "Shelf"),
          E("button", { onClick: () => { ChainsConfirm.show({ title: "Remove " + d.name + " from your bag?", confirmLabel: "Remove", danger: true }).then((ok) => { if (ok) BAG.removeDisc(d.id); }); }, title: "Delete", style: { width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15 } }, "\u00d7"))))) : null,
      // on the shelf — owned, not carried, not counted
      shelf.length > 0 ? E("div", null,
        E("div", { style: { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", marginBottom: 8 } }, "On the shelf (" + shelf.length + ")", E("span", { style: { fontWeight: 400, fontSize: 12, color: "var(--text-faint)" } }, " · not counted in your bag")),
        E(Card, { pad: 0 }, shelf.map((d, i) => E("div", { key: d.id, style: { display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" } },
          E(ColorDot, { d: d, BAG: BAG, size: 14 }),
          E("button", { onClick: () => setDiscDetail(d), style: { flex: 1, minWidth: 0, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: 0 } },
            E("span", { style: { display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name),
            E("span", { style: { display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, discSub(d) || d.brand || "")),
          E("button", { onClick: () => { BAG.setShelf(d.id, false); try { window.ChainsToast && ChainsToast.show(d.name + " is back in your bag.", "success"); } catch (e) {} }, style: { padding: "6px 12px", borderRadius: "var(--radius-pill)", border: "none", background: "var(--fairway-700)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12 } }, "Put in bag"),
          E("button", { onClick: () => BAG.setLost(d.id, true), title: "Mark lost", style: { width: 28, height: 28, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--text-faint)", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)", fontWeight: 700 } }, "lost"))))) : null,
      // lost / retired
      lost.length > 0 ? E("div", null,
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-faint)", marginBottom: 8 } }, "Lost & retired (" + lost.length + ")"),
        E(Card, { pad: 0 }, lost.map((d, i) => E("div", { key: d.id, style: { display: "flex", alignItems: "center", gap: 11, padding: "10px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", opacity: 0.7 } },
          E("span", { style: { flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, d.name + " · " + d.type),
          E("button", { onClick: () => BAG.setLost(d.id, false), style: { padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--fairway-700)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 10 } }, "Found"),
          E("button", { onClick: () => BAG.removeDisc(d.id), style: { padding: "5px 9px", borderRadius: "var(--radius-sm)", border: "none", background: "transparent", color: "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 10 } }, "Remove"))))) : null,
      active.length === 0 && lost.length === 0 ? E(Card, { pad: 22 }, E("div", { style: { textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", lineHeight: 1.6 } }, "Add the discs you carry. Your bag count comes from this list — discs you own but aren't carrying go on the shelf.")) : null);
  };
})();
