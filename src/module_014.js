/* Chains app — Season Standings view. window.StandingsView */
(function () {
  function StandingsView({ onMember }) {
    const { mobile } = useViewport();
    const L = window.ChainsActive ? ChainsActive.league() : null;
    const ptsLabel = (L && L.scoring === "cumulative-down") ? "down" : "pts";
    const standings = L ? L.standings : ChainsEngine.standings();
    const TS = ChainsEngine.SEED.TOURNAMENTS;
    const _rawScoped = L ? L.events : TS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });
    const scored = _rawScoped.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });

    function ptColor(place) {
      if (place === 1) return ["var(--gold-500)", "var(--pine-900)"];
      if (place <= 3) return ["var(--fairway-100)", "var(--fairway-700)"];
      if (place <= 5) return ["var(--bone-200)", "var(--text-muted)"];
      return ["var(--bg-surface)", "var(--text-faint)"];
    }

    const totalEvents = L ? ((L.windowTs && L.windowTs.length) ? L.windowTs.length : (L.events ? L.events.length : scored.length)) : TS.length;
    const leader = standings[0];
    const runnerUp = standings[1];
    const tiebreakNote = runnerUp && leader.points === runnerUp.points
      ? `${leader.name} & ${runnerUp.name} are tied on ${leader.points} pts — ${leader.name} leads on total down (${leader.down} vs ${runnerUp.down})`
      : null;

    const _trulyScored = scored;
    const lastScored = _trulyScored.length ? _trulyScored[_trulyScored.length - 1] : null;
    const lastRes = lastScored ? ChainsEngine.eventResults(lastScored.t) : null;
    const [recapOpen, setRecapOpen] = React.useState(false);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <style>{".chains-stand-row{transition:background 120ms ease;}.chains-stand-row:hover{background:var(--bg-surface);}"}</style>
        <SectionHeader kicker={L ? (L.season || "2026") + " Season" : "2026 Season"} title="Standings" size="lg"
          subtitle={`${scored.length} of ${totalEvents} events scored · ${leader.name} leads with ${leader.points} ${ptsLabel === "down" ? "down" : "points"}`} />

        {/* Per-event matrix — the full standings, up top */}
        <Card pad={0}>
          {mobile && <div style={{ padding: "9px 16px 0", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 5 }}>Swipe across for every event &amp; the total<span style={{ width: 12, height: 12, display: "inline-flex" }}><Icons.ChevRight size={12} /></span></div>}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 720 }}>
              <div style={{ display: "grid", gridTemplateColumns: `40px 150px repeat(${scored.length}, 38px) 64px`, alignItems: "center", padding: "12px 18px", borderBottom: "1.5px solid var(--border-default)", background: "var(--bg-surface)", position: "sticky", top: 0 }}>
                <span style={hdr()}>#</span>
                <span style={hdr()}>Member</span>
                {scored.map((t) => <span key={t.t} title={t.name} style={{ ...hdr(), textAlign: "center" }}>T{t.t}</span>)}
                <span style={{ ...hdr(), textAlign: "right" }}>{ptsLabel === "down" ? "Down" : "Pts"}</span>
              </div>
              {standings.map((m, ri) => (
                <div key={m.id} className="chains-stand-row" onClick={() => onMember && onMember(m.id)} style={{ display: "grid", gridTemplateColumns: `40px 150px repeat(${scored.length}, 38px) 64px`, alignItems: "center", padding: "10px 18px", borderBottom: ri < standings.length - 1 ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: m.rank <= 3 ? "var(--text-strong)" : "var(--text-faint)" }}>{m.rankTie ? "T" : ""}{m.rank}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    <Avatar name={m.name} color={m.disc} size={26} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                  </div>
                  {scored.map((t) => {
                    const ev = m.events[t.t];
                    const [bg, fg] = ev ? ptColor(ev.place) : ["transparent", "var(--text-faint)"];
                    return (
                      <span key={t.t} title={ev ? `T${t.t}: ${ev.place === 1 ? "1st" : ev.place + "th"} · ${ev.points} pts` : ""} style={{ justifySelf: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "var(--radius-sm)", background: bg, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: fg }}>{ev ? ev.points : "·"}</span>
                    );
                  })}
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)", textAlign: "right" }}>{m.points}</span>
                </div>
              ))}
            </div>
          </div>
          {!L && (<div style={{ display: "flex", gap: 16, padding: "12px 18px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
            <Legend c="var(--gold-500)" t="1st · 6 pts" />
            <Legend c="var(--fairway-100)" t="Top 3" border />
            <Legend c="var(--bone-200)" t="4th–5th" border />
            <Legend c="var(--bg-surface)" t="6th · 1 pt" border />
          </div>)}
        </Card>

        {/* Latest event recap — what just happened, round by round, right here */}
        {!L && lastScored && lastRes && lastRes.rows && (
          <Card pad={0}>
            <button onClick={() => setRecapOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: "14px 16px" }}>
              <span style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: "var(--gold-50, #fdf6e3)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--gold-600, #b8860b)", flexShrink: 0 }}><Icons.Trophy size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10, color: "var(--text-muted)" }}>Latest result · T{lastScored.t}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastScored.name}</div>
                {lastScored.proWinner && <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--gold-700, #9a7209)", marginTop: 1 }}>Pro winner: {lastScored.proWinner}</div>}
              </div>
              <span style={{ width: 16, height: 16, color: "var(--text-faint)", flexShrink: 0, transform: recapOpen ? "rotate(90deg)" : "none", transition: "transform 150ms" }}><Icons.ChevRight size={16} /></span>
            </button>
            {recapOpen && (
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ padding: "10px 0 4px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)" }}>Our league finished</div>
                {[...lastRes.rows].sort((a, b) => a.place - b.place).map((r, i) => {
                  const mem = ChainsEngine.member(r.m);
                  return (
                    <div key={r.m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                      <PlaceBadge place={r.place} size={26} points={r.points} />
                      <Avatar name={mem.name} color={mem.disc} size={24} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{mem.name}</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.p1} <ScoreValue value={r.s1} size={11} /> · {(r.p2 && r.p2 !== "N/A") ? r.p2 : "—"} {(r.p2 && r.p2 !== "N/A") ? <ScoreValue value={r.s2} size={11} /> : null}</div>
                      </div>
                      <ScoreValue value={r.total} size={16} />
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)", width: 28, textAlign: "right" }}>+{r.points}</span>
                    </div>
                  );
                })}
                <div style={{ padding: "12px 0 4px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)" }}>Full field · round by round</div>
                {window.ArchiveBoard ? React.createElement(window.ArchiveBoard, { t: lastScored.t, mobile: true }) : null}
              </div>
            )}
          </Card>
        )}

        {L && (() => {
          const evs = (L.events || []).filter((e) => { const r = ChainsEngine.eventResults(e.t); return r && r.scored; });
          const lastEv = evs.length ? evs[evs.length - 1] : null;
          if (!lastEv) return null;
          const ranked = ChainsActive.rankedForEvent(L, lastEv.t);
          return (
            <Card pad={0}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                <span style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: "var(--gold-50, #fdf6e3)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--gold-600, #b8860b)", flexShrink: 0 }}><Icons.Trophy size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10, color: "var(--text-muted)" }}>Latest result · T{lastEv.t}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lastEv.name}</div>
                </div>
              </div>
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ padding: "10px 0 4px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)" }}>Our league finished</div>
                {ranked.map((row, i) => (
                  <div key={row.m.id} className="chains-stand-row" onClick={() => onMember && onMember(row.m.id)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 4px", borderTop: i ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" }}>
                    <PlaceBadge place={row.place || (i + 1)} size={26} />
                    <Avatar name={row.m.name} color={row.m.disc} size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{row.m.name}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {ChainsActive.memberPicks(L, lastEv.t, row.m.id).map((pk, pi) => (
                          <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)" }}>
                            {pi > 0 && <span style={{ color: "var(--border-default)" }}>·</span>}
                            {pk.name}<ScoreValue value={pk.score} size={11} />
                          </span>
                        ))}
                      </div>
                    </div>
                    <ScoreValue value={row.total} size={16} />
                  </div>
                ))}
                <div style={{ padding: "12px 0 4px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)" }}>Full field · round by round</div>
                {window.ArchiveBoard ? React.createElement(window.ArchiveBoard, { t: lastEv.t, mobile: true, leaguePicks: ChainsActive.leaguePicks(L, lastEv.t) }) : null}
              </div>
            </Card>
          );
        })()}

        {!L && tiebreakNote && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "var(--ace-100)", border: "1px solid var(--ace-200)", borderRadius: "var(--radius-md)" }}>
            <span style={{ width: 18, height: 18, color: "var(--ace-600)", flexShrink: 0 }}><Icons.Flame size={18} /></span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ace-800)" }}><b>Tiebreaker:</b> {tiebreakNote}.</span>
          </div>
        )}

        {/* Member summary cards + the old bottom matrix removed — matrix now lives up top */}
      </div>
    );

    function hdr() { return { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)" }; }
  }

  function Legend({ c, t, border }) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: c, border: border ? "1px solid var(--border-subtle)" : "none" }} />{t}
      </span>
    );
  }

  window.StandingsView = StandingsView;
})();
