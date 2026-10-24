/* Chains app — Tournaments schedule view. window.TournamentsView */
(function () {
  // row tap/hover feedback (smooth hover + a press state on mobile)
  (function injectTournStyles() {
    if (typeof document === "undefined" || document.getElementById("chains-tourn-styles")) return;
    const s = document.createElement("style"); s.id = "chains-tourn-styles";
    s.textContent = ".ct-row{transition:background .12s ease}.ct-row:active{background:var(--bone-100)!important}";
    document.head.appendChild(s);
  })();
  function fantasyWinner(t) {
    const r = ChainsEngine.eventResults(t);
    if (!r || !r.scored) return null;
    const w = r.rows.find((x) => x.place === 1);
    return w ? ChainsEngine.member(w.m) : null;
  }

  function TournamentsView({ onGoPicks, onEvent }) {
    const { mobile } = useViewport();
    const TS = ChainsEngine.SEED.TOURNAMENTS;
    const [filter, setFilter] = React.useState("all");
    const counts = {
      all: TS.length,
      complete: TS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; }).length,
      upcoming: TS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return !(r && r.scored) && t.status !== "live"; }).length,
    };
    const rows = TS.filter((t) => {
      const r = ChainsEngine.eventResults(t.t);
      const done = r && r.scored;
      if (filter === "complete") return done;
      if (filter === "upcoming") return !done && t.status !== "live";
      return true;
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader kicker="DGPT 2026" title="Schedule" size="lg"
          subtitle="22 events from Florida to Finland — Majors, Elite, and the playoff run."
          action={mobile ? null : <SegmentedTabs value={filter} onChange={setFilter} items={[
            { id: "all", label: `All ${counts.all}` }, { id: "complete", label: `Final ${counts.complete}` }, { id: "upcoming", label: `Upcoming ${counts.upcoming}` }]} />} />
        {mobile && (
          <div style={{ overflowX: "auto" }}>
            <SegmentedTabs value={filter} onChange={setFilter} items={[
              { id: "all", label: `All ${counts.all}` }, { id: "complete", label: `Final ${counts.complete}` }, { id: "upcoming", label: `Up ${counts.upcoming}` }]} />
          </div>
        )}

        <Card pad={0}>
          {rows.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "42px 20px", textAlign: "center" }}>
              <span style={{ width: 26, height: 26, color: "var(--text-faint)" }}><Icons.Calendar size={26} /></span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-muted)" }}>{filter === "complete" ? "No finished events yet" : "Nothing upcoming"}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", maxWidth: 300 }}>{filter === "complete" ? "Results show up here once the first event wraps." : "Every event has been played — check the Final tab."}</div>
            </div>
          ) : rows.map((t, i) => {
            const r = ChainsEngine.eventResults(t.t);
            const done = r && r.scored;
            const isLive = t.status === "live";
            const fw = fantasyWinner(t.t);
            if (mobile) {
              return (
                <div key={t.t} className="ct-row" onClick={() => onEvent && onEvent(t.t)} style={{ padding: "13px 16px", borderLeft: isLive ? "3px solid var(--ace-500)" : "3px solid transparent", borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none", background: isLive ? "var(--ace-100)" : "transparent", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text-faint)", width: 24 }}>{t.t}</span>
                    <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)", lineHeight: 1.05 }}>{t.name}</span>
                    {done ? <Badge tone="fairway">Final</Badge> : isLive ? <Badge tone="live">Live</Badge> : <Badge tone="neutral">Upcoming</Badge>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 32, flexWrap: "wrap" }}>
                    <TierTag tier={t.tier} />
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{t.loc} · {t.dates}</span>
                  </div>
                  <div style={{ display: "flex", gap: 18, paddingLeft: 32 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>Pro winner</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-strong)" }}>{t.proWinner || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>League winner</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                        {fw && <Avatar name={fw.name} color={fw.disc} size={20} />}
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{fw ? fw.name : "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={t.t} className="ct-row" onClick={() => onEvent && onEvent(t.t)} onMouseEnter={(e) => (e.currentTarget.style.background = isLive ? "var(--ace-100)" : "var(--bone-100)")} onMouseLeave={(e) => (e.currentTarget.style.background = isLive ? "var(--ace-100)" : "transparent")} style={{ display: "grid", gridTemplateColumns: "52px 1fr 150px 150px 90px", alignItems: "center", gap: 14, padding: "13px 22px", borderLeft: isLive ? "3px solid var(--ace-500)" : "3px solid transparent", borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none", background: isLive ? "var(--ace-100)" : "transparent", cursor: "pointer" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>{t.t}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>event</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                    <TierTag tier={t.tier} />
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{t.loc} · {t.dates}</div>
                </div>
                <div>
                  {t.proWinner ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 14, height: 14, color: "var(--gold-500)" }}><Icons.Trophy size={14} /></span>
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>Pro winner</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-strong)" }}>{t.proWinner}</div>
                      </div>
                    </div>
                  ) : <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontSize: 13 }}>—</span>}
                </div>
                <div>
                  {fw ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={fw.name} color={fw.disc} size={26} />
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>League winner</div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{fw.name}</div>
                      </div>
                    </div>
                  ) : <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontSize: 13 }}>—</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                  {done ? <Badge tone="fairway">Final</Badge> : isLive ? <Badge tone="live">Live</Badge> : <Badge tone="neutral">Upcoming</Badge>}
                  <span style={{ width: 16, height: 16, color: "var(--text-faint)" }}><Icons.ChevRight size={16} /></span>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  window.TournamentsView = TournamentsView;
})();
