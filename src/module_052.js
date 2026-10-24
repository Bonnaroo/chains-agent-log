/* Chains app — Tour History browser. window.HistoryView
   Pick any season 2016→now, any event, see full results + stat leaders.
   Stat panels render only when that event file actually has stats (clean for
   older seasons). Read-only; data via window.ChainsHistory. */
(function () {
  const H = () => window.ChainsHistory;
  function fmtPar(v) { return v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v); }
  function parColor(v) { return v == null || v === 0 ? "var(--text-strong)" : v < 0 ? "var(--score-under, #1f8a5b)" : "var(--score-over, #c23a33)"; }
  function nm(p) { return [p.first_name, p.last_name].filter(Boolean).join(" "); }
  function usd(n) { return n ? "$" + Number(n).toLocaleString() : "—"; }
  function stat(p, k, dec) { const s = p.stats && p.stats[k]; if (!s || s.value == null) return null; return dec ? Math.round(s.value * 10) / 10 : s.value; }

  // loading shimmer + row press/hover feedback (injected once)
  (function injectHistStyles() {
    if (typeof document === "undefined" || document.getElementById("chains-hist-styles")) return;
    const s = document.createElement("style"); s.id = "chains-hist-styles";
    s.textContent = "@keyframes chShim{0%,100%{opacity:.5}50%{opacity:.85}}.ch-shim{animation:chShim 1.3s ease-in-out infinite}.ch-row{transition:background .12s ease}.ch-row:hover{background:var(--bone-100)}.ch-row:active{background:var(--bone-200)!important}";
    document.head.appendChild(s);
  })();
  function SkelRows({ n }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: n || 6 }, (_, i) => (
          <Card key={i} pad={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
              <span className="ch-shim" style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span className="ch-shim" style={{ display: "block", width: "60%", height: 12, borderRadius: 4, background: "var(--bg-sunken)" }} />
                <span className="ch-shim" style={{ display: "block", width: "35%", height: 9, borderRadius: 4, background: "var(--bg-sunken)", marginTop: 7 }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  function HistoryView() {
    const { mobile } = useViewport();
    const [manifest, setManifest] = React.useState(null);
    const [year, setYear] = React.useState(null);
    const [events, setEvents] = React.useState(null);
    const [openEvent, setOpenEvent] = React.useState(null);

    React.useEffect(() => {
      if (!H()) return;
      H().loadManifest().then((m) => { setManifest(m); if (m && m.seasons) { const cur = m.seasons.find((s) => s.status === "current") || m.seasons[m.seasons.length - 1]; setYear(cur.year); } });
    }, []);
    React.useEffect(() => {
      if (year == null || !manifest) return;
      const s = manifest.seasons.find((x) => x.year === year);
      if (!s) return;
      setEvents(null);
      H().seasonEvents(s).then((arr) => setEvents(arr || []));
    }, [year, manifest]);

    if (openEvent) return <EventResults ev={openEvent} onBack={() => setOpenEvent(null)} mobile={mobile} />;

    const seasons = manifest ? manifest.seasons.slice().sort((a, b) => b.year - a.year) : [];
    const cur = seasons.find((s) => s.year === year);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionHeader kicker="The vault" title="Tour History" size="lg"
          subtitle={manifest ? "Every DGPT season " + manifest.earliest_year + "–" + manifest.current_year + ". Pick a year, pick an event, see the full field." : "Loading the archive…"} />

        {/* year picker */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4 }}>
          {seasons.map((s) => {
            const on = s.year === year;
            return (
              <button key={s.year} onClick={() => setYear(s.year)} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 14px", borderRadius: "var(--radius-md)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", cursor: "pointer" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: on ? "#fff" : "var(--text-strong)" }}>{s.year}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 8, color: on ? "rgba(255,255,255,.8)" : "var(--text-faint)" }}>{s.status === "current" ? "Live" : s.events + " ev"}</span>
              </button>
            );
          })}
        </div>

        {cur && cur.stats !== "full" && (
          <div style={{ padding: "9px 13px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>
            {cur.stats === "results" ? "Results, scores & ratings for this season — advanced shot stats weren't tracked yet." : "Early Pro Tour season — full results; advanced stats on a few events only."}
          </div>
        )}

        {/* event list */}
        {events == null ? (
          <SkelRows n={6} />
        ) : events.length === 0 ? (
          <Card pad={20}><div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No events found for {year}.</div></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e, i) => (
              <Card key={e.event_id || i} pad={0}>
                <button onClick={() => setOpenEvent(e)} className="ch-row" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 14px", border: "none", background: "transparent", cursor: "pointer" }}>
                  <span style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--fairway-50)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--fairway-600)", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{e.t != null ? "T" + e.t : (i + 1)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name || e.event_name}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{fmtDate(e.start_date)}{e.tier ? " · " + e.tier : ""}</div>
                  </div>
                  <span style={{ width: 16, height: 16, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={16} /></span>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }
  function fmtDate(d) { if (!d) return ""; const dt = new Date(d + "T00:00:00"); return isNaN(dt) ? d : dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }); }

  /* ---- one event's full results ---------------------------------------- */
  function EventResults({ ev, onBack, mobile }) {
    const [data, setData] = React.useState(null);
    const [status, setStatus] = React.useState("loading");
    React.useEffect(() => {
      H().eventResults(ev.event_id).then((j) => { if (j && j.players) { setData(j); setStatus("ready"); } else setStatus("none"); });
    }, [ev.event_id]);

    if (status === "loading") return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><FlowHead title={ev.name || ev.event_name} onBack={onBack} /><div className="ch-shim" style={{ height: 78, borderRadius: "var(--radius-lg)", background: "var(--bg-sunken)" }} /><SkelRows n={5} /></div>;
    if (status === "none") return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><FlowHead title={ev.name || ev.event_name} onBack={onBack} /><div style={{ padding: "16px 4px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>Results for this event aren't in the archive yet.</div></div>;

    const players = (data.players || []).slice().sort((a, b) => (a.place || 999) - (b.place || 999));
    const hasStats = H().eventHasStats(data);
    const champ = players[0];
    const draftable = new Set((window.MPO_PLAYERS || []).filter((p) => p.pdga != null).map((p) => String(p.pdga)));

    // stat leaders (only if this event has stats)
    function leader(key, dir, label, fmt) {
      let best = null, bv = null;
      players.forEach((p) => { const v = stat(p, key); if (v == null) return; if (bv == null || (dir === "hi" ? v > bv : v < bv)) { bv = v; best = p; } });
      return best ? { p: best, v: bv, label, fmt } : null;
    }
    const leaders = !hasStats ? [] : [
      leader("birdie_count", "hi", "Most birdies", (v) => v + " birdies"),
      leader("c1x_putting_pct", "hi", "Best C1X putting", (v) => Math.round(v * 10) / 10 + "%"),
      leader("fairway_hits_pct", "hi", "Most fairways", (v) => Math.round(v * 10) / 10 + "%"),
      leader("scramble_pct", "hi", "Best scramble", (v) => Math.round(v * 10) / 10 + "%"),
    ].filter(Boolean);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title={data.event_name || ev.name} sub={fmtDate(ev.start_date) + (ev.tier ? " · " + ev.tier : "") + " · " + (data.rounds_count || (champ && champ.rounds ? champ.rounds.length : "")) + " rounds"} onBack={onBack} />

        {/* champion */}
        {champ && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: "var(--radius-lg)", background: "var(--bg-ink)", color: "var(--bone-50)" }}>
            <span style={{ fontSize: 30 }}>🏆</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10, color: "var(--chain-300)" }}>Champion</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 19, color: "var(--bone-50)" }}>{nm(champ)}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--chain-300)", marginTop: 2 }}>{champ.event_rating ? champ.event_rating + " rated" : ""}{champ.prize_usd ? " · " + usd(champ.prize_usd) : ""}</div>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 26, color: "var(--ace-400)" }}>{fmtPar(champ.to_par)}</span>
          </div>
        )}

        {/* stat leaders — only when present */}
        {leaders.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Event stat leaders</div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
              {leaders.map((l, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 9.5, color: "var(--text-muted)" }}>{l.label}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)", margin: "5px 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm(l.p)}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--ace-500)" }}>{l.fmt(l.v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* full field */}
        <Card pad={0}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>Final standings · {players.length} players</div>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {players.map((p, i) => {
              const draft = p.pdga_number != null && draftable.has(String(p.pdga_number));
              return (
                <div key={p.pdga_number || i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: draft ? "var(--fairway-50)" : "transparent" }}>
                  <span style={{ width: 26, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 ? "var(--gold-600, #b8860b)" : "var(--text-faint)" }}>{p.tied ? "T" : ""}{p.place}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: draft ? 700 : 500, fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm(p)}{draft ? " ·" : ""}{draft ? <span style={{ color: "var(--fairway-700)", fontSize: 10, fontWeight: 700 }}> DRAFTABLE</span> : ""}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{(p.rounds || []).map((r) => r.score).filter((x) => x != null).join(" · ")}{p.event_rating ? "  ·  " + p.event_rating + "r" : ""}</div>
                  </div>
                  {p.prize_usd ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", minWidth: 52, textAlign: "right" }}>{usd(p.prize_usd)}</span> : null}
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: parColor(p.to_par), minWidth: 34, textAlign: "right" }}>{fmtPar(p.to_par)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  function FlowHead({ title, sub, onBack }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.ChevRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    );
  }

  window.HistoryView = HistoryView;
})();
