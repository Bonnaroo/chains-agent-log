/* Chains app — The Clubhouse: weekly post, who's hot, golden balls, bets.
   window.ClubhouseView */
(function () {

  function PostCard({ mobile }) {
    const C = window.CLUBHOUSE || {};
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "18px 16px" : "22px 24px", background: "var(--bg-ink)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-400)" }}>{C.kicker || "This week"}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--chain-400)" }}>· {C.week}</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: mobile ? 26 : 34, color: "var(--bone-50)", lineHeight: 1 }}>{C.headline}</div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--chain-300)", lineHeight: 1.6, margin: "12px 0 0", maxWidth: 640 }}>{C.lead}</p>
        </div>
        <div style={{ padding: mobile ? "6px 16px 14px" : "8px 24px 16px" }}>
          {(C.items || []).map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ flexShrink: 0, marginTop: 1, padding: "3px 9px", borderRadius: "var(--radius-pill)", background: "var(--pine-800)", color: "var(--bone-50)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10 }}>{it.tag}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.55 }}>{it.text}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function WhosHot({ mobile }) {
    // Best pro performances among our picks at the latest scored event.
    const TS = ChainsEngine.SEED.TOURNAMENTS;
    let last = null;
    TS.forEach((tt) => { const r = ChainsEngine.eventResults(tt.t); if (r && r.scored) last = tt; });
    if (!last) return null;
    const picks = ChainsEngine.picksFor(last.t) || [];
    const perf = [];
    picks.forEach((p) => {
      [["p1", "s1"], ["p2", "s2"]].forEach(([pk, sk]) => {
        if (p[pk] && p[pk] !== "N/A" && p[sk] != null) perf.push({ name: p[pk], score: p[sk], m: p.m });
      });
    });
    perf.sort((a, b) => a.score - b.score);
    const top = perf.slice(0, 3);
    return (
      <Card pad={mobile ? 16 : 18}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Who's hot</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginBottom: 4 }}>Heaters at {last.name}</div>
        {top.map((p, i) => {
          const m = ChainsEngine.member(p.m);
          return (
            <div key={p.name + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 ? "var(--gold-500)" : "var(--text-faint)", width: 16 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>{p.name}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>{m.name}'s pick</div>
              </div>
              <ScoreValue value={p.score} size={17} />
            </div>
          );
        })}
      </Card>
    );
  }

  function FormCard({ mobile }) {
    const st = ChainsEngine.standings();
    const TS = ChainsEngine.SEED.TOURNAMENTS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });
    const last3 = TS.slice(-3).map((t) => t.t);
    if (!last3.length) return null;
    const rows = st.map((m) => ({ ...m, form: last3.reduce((s, t) => s + ((m.events[t] && m.events[t].points) || 0), 0) })).sort((a, b) => b.form - a.form);
    return (
      <Card pad={mobile ? 16 : 18}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Power rankings</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)" }}>Form Check</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginBottom: 6 }}>Points over the last {last3.length} events — who's trending.</div>
        {rows.map((m, i) => {
          const trend = i + 1 < m.rank ? "up" : i + 1 > m.rank ? "down" : "flat";
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 ? "var(--gold-500)" : "var(--text-faint)", width: 14 }}>{i + 1}</span>
              <Avatar name={m.name} color={m.disc} size={24} />
              <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" }}>{m.name}</span>
              <span title={trend === "up" ? "Hotter than their season rank" : trend === "down" ? "Cooler than their season rank" : "Holding steady"}
                style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: trend === "up" ? "var(--fairway-600)" : trend === "down" ? "var(--ace-500)" : "var(--text-faint)" }}>
                {trend === "up" ? "▲" : trend === "down" ? "▼" : "–"}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", width: 30, textAlign: "right" }}>{m.form}</span>
            </div>
          );
        })}
      </Card>
    );
  }

  function NextUpCard({ mobile }) {
    const meta = ChainsEngine.seasonMeta();
    const ev = meta.live || meta.next;
    if (!ev) return null;
    const live = !!meta.live;
    const M = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    let days = null;
    const dm = (ev.dates || "").match(/^([A-Za-z]{3})\s+(\d+)/);
    if (!live && dm && M[dm[1]] != null) {
      const start = new Date(2026, M[dm[1]], +dm[2]);
      days = Math.max(0, Math.ceil((start - new Date()) / 86400000));
    }
    const first = ChainsEngine.draftOrder(ev.t).order[0];
    return (
      <Card pad={mobile ? 16 : 18}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>{live ? "Happening now" : "Countdown"}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginBottom: 8 }}>T{ev.t} · {ev.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 44, lineHeight: 1, color: live ? "var(--ace-500)" : "var(--fairway-600)" }}>{live ? "LIVE" : days != null ? days : "—"}</span>
          {!live && days != null && <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12, color: "var(--text-muted)" }}>{days === 1 ? "day out" : "days out"}</span>}
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
          {ev.loc} · {ev.dates} · {ev.tier}{first ? <> — <b style={{ color: "var(--text-strong)" }}>{first.name}</b> drafts first.</> : null}
        </div>
      </Card>
    );
  }

  function NumbersCard({ mobile }) {
    const nums = (window.CLUBHOUSE || {}).numbers || [];
    if (!nums.length) return null;
    return (
      <Card pad={mobile ? 16 : 18}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>This week</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginBottom: 4 }}>By the Numbers</div>
        {nums.map((x, i) => (
          <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "9px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 19, color: "var(--fairway-700)", flexShrink: 0, minWidth: 44 }}>{x.n}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-body)", lineHeight: 1.45 }}>{x.text}</span>
          </div>
        ))}
      </Card>
    );
  }

  function ClubhouseView() {
    const { mobile } = useViewport();
    const GoldenBall = (window.LeagueSections || {}).GoldenBall;
    const BetBoard = (window.LeagueSections || {}).BetBoard;
    const HeadToHead = (window.StatsParts || {}).HeadToHead;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader kicker="The fun room" title="The Clubhouse" size="lg"
          subtitle="Where you play — call your shots on the Bet Board and spend your Golden Ball." />
        {BetBoard && <BetBoard mobile={mobile} />}
        {GoldenBall && <GoldenBall mobile={mobile} />}
        {HeadToHead && <HeadToHead mobile={mobile} />}
      </div>
    );
  }

  window.ClubhouseView = ClubhouseView;
  // Parked for the upcoming Moneyball page — kept intact, not rendered here.
  window.ClubhouseParts = { PostCard, WhosHot, FormCard, NumbersCard, NextUpCard };
})();
