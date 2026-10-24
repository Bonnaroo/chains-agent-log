/* Chains app — Dashboard view. Attaches window.DashboardView */
(function () {
  const E = React.createElement;

  // ---- League chat (synced via engine; identity-aware) -------------------
  function LeagueChat({ mobile, league }) {
    const [, force] = React.useState(0);
    const [text, setText] = React.useState("");
    const scrollRef = React.useRef(null);
    const me = (window.ChainsID && ChainsID.whoami()) || null;
    React.useEffect(() => {
      const fn = () => force((x) => x + 1);
      window.addEventListener("chains:remote-update", fn);
      window.addEventListener("chains:identity", fn);
      return () => { window.removeEventListener("chains:remote-update", fn); window.removeEventListener("chains:identity", fn); };
    }, []);
    const msgs = league ? (league.chat || []) : ChainsEngine.chatMessages();
    React.useEffect(() => {
      const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight;
    }, [msgs.length]);
    const memberOf = (id) => ChainsEngine.members().find((m) => m.id === id) || null;
    function send() {
      const t = text.trim(); if (!t || !me) return;
      if (league) { (league.chat = league.chat || []).push({ id: "c" + Date.now(), by: me, text: t, ts: Date.now() }); setText(""); force((x) => x + 1); return; }
      ChainsEngine.postChat(t); setText("");
    }
    const fmtTime = (ts) => { const d = new Date(ts); const now = new Date(); const sameDay = d.toDateString() === now.toDateString(); return sameDay ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
    return (
      <Card pad={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: mobile ? "13px 16px" : "15px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ width: 17, height: 17, color: "var(--ace-500)" }}><Icons.Chat size={17} /></span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 16, color: "var(--text-strong)" }}>League Chat</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>{msgs.length ? msgs.length + " message" + (msgs.length === 1 ? "" : "s") : ""}</span>
        </div>
        <div ref={scrollRef} style={{ maxHeight: 320, overflowY: "auto", padding: msgs.length ? "12px 16px" : "0" }}>
          {!msgs.length ? (
            <div style={{ padding: "26px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No messages yet — say something to the league.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {msgs.map((m) => {
                const mem = memberOf(m.by);
                const mine = m.by === me;
                const nm = mem ? mem.name : (m.by || "Someone");
                const col = mem ? mem.disc : "var(--chain-400)";
                return (
                  <div key={m.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", flexDirection: mine ? "row-reverse" : "row" }}>
                    <Avatar name={nm} color={col} size={28} />
                    <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "baseline", marginBottom: 2, flexDirection: mine ? "row-reverse" : "row" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 11, color: "var(--text-strong)" }}>{nm}</span>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)" }}>{fmtTime(m.ts)}</span>
                      </div>
                      <div style={{ padding: "7px 11px", borderRadius: 12, background: mine ? "var(--ace-500)" : "var(--bg-sunken)", color: mine ? "#fff" : "var(--text-body)", fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.4, wordBreak: "break-word", borderTopRightRadius: mine ? 3 : 12, borderTopLeftRadius: mine ? 12 : 3 }}>{m.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 12px" }}>
          {me ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message the league…" maxLength={500}
                style={{ flex: 1, height: 40, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", outline: "none", boxSizing: "border-box" }} />
              <button onClick={send} disabled={!text.trim()} aria-label="Send message"
                style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", border: "none", cursor: text.trim() ? "pointer" : "default", background: text.trim() ? "var(--ace-500)" : "var(--bone-200)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icons.Send size={17} />
              </button>
            </div>
          ) : (
            <div style={{ padding: "8px 6px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Pick who you are in Settings to join the chat.</div>
          )}
        </div>
      </Card>
    );
  }

  // ---- live-feed helpers (read-only) -------------------------------------
  const PS = () => window.ChainsProStats;
  const dRowName = (r) => (PS() && PS()._nameOf(r)) || [r.firstName, r.lastName].filter(Boolean).join(" ");
  const dRowToPar = (r) => (r.toPar != null ? r.toPar : (r.to_par != null ? r.to_par : null));
  const dRowRounds = (r) => r.liveRoundResults || r.rounds || [];
  const dMaxRound = (rows) => { let m = 0; rows.forEach((r) => { const n = dRowRounds(r).length; if (n > m) m = n; }); return m; };
  const dPreEvent = (rows) => !rows.some((r) => dRowToPar(r) != null || dRowRounds(r).length > 0);
  const dFmtPar = (v) => v == null ? "—" : v === 0 ? "E" : (v > 0 ? "+" + v : String(v));
  const dParColor = (v) => v == null ? "var(--text-faint)" : v < 0 ? "var(--fairway-600)" : v > 0 ? "var(--clay-600, #b4452f)" : "var(--text-muted)";
  const dOrdinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  function dEventStarted(ev) {
    if (!ev || !ev.dates) return false;
    const M = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const mm = [...ev.dates.matchAll(/([A-Z][a-z]{2})\s+(\d+)/g)];
    if (!mm.length) return false;
    return new Date() >= new Date(2026, M[mm[0][1]], +mm[0][2], 0, 0, 0);
  }

  function PreStartLineup({ L, mobile, onMember }) {
    const meta = (window.ChainsEngine && ChainsEngine.seasonMeta) ? ChainsEngine.seasonMeta() : {};
    const nextName = ((meta.next || meta.live || {}).name) || "the first event";
    const members = L.members || [];
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 15, height: 15, color: "var(--ace-400)", flexShrink: 0 }}><Icons.Target size={15} /></span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-300, #b9cabe)" }}>No scores yet — standings post when <b style={{ color: "var(--bone-50)" }}>{nextName}</b> plays.</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {members.map((m) => (
            <button key={m.id} onClick={() => onMember && onMember(m.id)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 11px 6px 6px", borderRadius: "var(--radius-pill)", background: "var(--pine-700)", border: "1px solid var(--border-ink)", cursor: "pointer" }}>
              <Avatar name={m.name} color={m.disc} size={22} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 12.5, color: "var(--bone-50)" }}>{m.name}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--chain-400, #9fb3a6)" }}>{members.length === 1 ? "You're the commissioner — add players from the league's settings, then everyone drafts." : members.length + " managers in. Picks lock when the event starts; the leaderboard fills in live."}</div>
      </div>
    );
  }

  function Podium({ standings, mobile, onMember, unit }) {
    const top3 = standings.slice(0, 3);
    const order = [top3[1], top3[0], top3[2]].filter(Boolean); // 2,1,3
    const heights = { 1: 132, 2: 104, 3: 88 };
    const cw = mobile ? 98 : 130;
    return (
      <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: mobile ? 8 : 16, padding: "8px 0 0" }}>
        {order.map((m) => (
          <div key={m.id} onClick={() => onMember && onMember(m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: cw, maxWidth: "33%", cursor: "pointer" }}>
            <Avatar name={m.name} color={m.disc} size={m.rank === 1 ? 58 : 46} ring={m.rank === 1} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--bone-50)", letterSpacing: ".02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: cw }}>{m.name}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--chain-400)" }}>{unit === "down" ? ((m.lineup ? m.lineup.length : 5) + " pros") : (m.wins + " wins · " + m.top3 + " top-3")}</div>
            </div>
            <div style={{ width: "100%", height: heights[m.rank], background: m.rank === 1 ? "linear-gradient(180deg,var(--fairway-500),var(--fairway-700))" : "linear-gradient(180deg,var(--pine-600),var(--pine-800))", borderRadius: "var(--radius-md) var(--radius-md) 0 0", border: "1px solid var(--border-ink)", borderBottom: "none", borderTop: "3px solid " + (m.rank === 1 ? "var(--gold-500)" : m.rank === 2 ? "#c3cad0" : "#c0814e"), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 12, gap: 4 }}>
              <PlaceBadge place={m.rank} size={m.rank === 1 ? 40 : 32} />
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: m.rank === 1 ? 34 : 26, color: "var(--bone-50)", lineHeight: 1, marginTop: 4 }}>{unit === "down" ? (m.under != null ? m.under : 0) : m.points}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10, color: "var(--chain-400)" }}>{unit === "down" ? "down" : "pts"}</div>
            </div>
          </div>
        ))}
        </div>
        {standings.length > 3 && (
          <div style={{ display: "flex", justifyContent: "center", gap: mobile ? 14 : 26, marginTop: 14, flexWrap: "wrap" }}>
            {standings.slice(3).map((m) => (
              <div key={m.id} onClick={() => onMember && onMember(m.id)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--chain-500)" }}>{m.rank}</span>
                <Avatar name={m.name} color={m.disc} size={26} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--bone-50)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: mobile ? 92 : 150 }}>{m.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--chain-400)" }}>{unit === "down" ? (m.under != null ? m.under : 0) : m.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // v486: once every event is scored, the "next event" slot becomes the season wrap —
  // champion, how the tiebreak was decided, the podium, and the off-season state.
  function SeasonWrapCard({ onGoStandings }) {
    const meta = ChainsEngine.seasonMeta();
    const st = ChainsEngine.standings();
    if (!st || !st.length) return null;
    const champ = st[0], second = st[1] || null;
    const year = (ChainsEngine.SEED && ChainsEngine.SEED.SEASON_YEAR) || new Date().getFullYear();
    const tie = second && second.points === champ.points;
    const tieLine = tie
      ? ("Tied on " + champ.points + " points \u2014 " + champ.name + " wins on total strokes (" + champ.down + " vs " + second.down + ").")
      : (second ? (champ.points + " points, " + (champ.points - second.points) + " clear of " + second.name + ".") : null);
    const podium = st.slice(0, 3);
    return (
      <Card tone="ink" pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Badge tone="gold" emphasis="solid"><span style={{ width: 12, height: 12, marginRight: 4 }}><Icons.Trophy size={12} /></span>Season complete</Badge>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--chain-400)" }}>{meta.completed}/{meta.total} events</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--chain-400)" }}>{year} champion</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <Avatar name={champ.name} color={champ.disc} size={44} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 30, color: "var(--bone-50)", lineHeight: 1 }}>{champ.name}</div>
          </div>
          {tieLine && <div style={{ marginTop: 10, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-300)", lineHeight: 1.45 }}>{tieLine}</div>}
        </div>
        <div style={{ padding: "12px 20px 10px" }}>
          {podium.map((m, i) => (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 10, padding: "7px 0", borderTop: i ? "1px solid var(--border-ink)" : "none" }}>
              <PlaceBadge place={i + 1} size={26} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={m.name} color={m.disc} size={22} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--bone-50)" }}>{m.name}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--chain-400)" }}>{m.wins} win{m.wins === 1 ? "" : "s"} · {m.top3} top-3</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "var(--bone-50)" }}>{m.points}<span style={{ fontSize: 10, color: "var(--chain-400)", marginLeft: 3 }}>PTS</span></span>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 20px 18px", borderTop: "1px solid var(--border-ink)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--chain-400)", marginBottom: 6 }}>Off-season</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-300)", lineHeight: 1.5 }}>
            Waiting for the {year + 1} DGPT schedule. Picks reopen 36 hours before the first event. Until then: Go Throw, bags, and the full {year} history under Standings.
          </div>
          <div style={{ marginTop: 12 }}><Button variant="primary" size="md" onClick={onGoStandings} style={{ width: "100%" }}>Final standings &amp; every round</Button></div>
        </div>
      </Card>
    );
  }

  function NextEventCard({ onGoPicks, league, onGoStandings }) {
    const meta = ChainsEngine.seasonMeta();
    const ev = meta.next || meta.live;
    if (!ev) {
      if (meta.total && meta.completed >= meta.total) return <SeasonWrapCard onGoStandings={onGoStandings} />;
      return null;
    }
    const draftInfo = ChainsEngine.draftOrder(ev.t);
    const draft = league ? (function () { var lst = (league.events && league.events.length) ? league.events[league.events.length - 1].t : null; return (lst != null && window.ChainsActive) ? ChainsActive.rankedForEvent(league, lst).slice().sort(function (a, b) { return (b.place == null ? 99 : b.place) - (a.place == null ? 99 : a.place); }).map(function (x) { return x.m; }) : [...(league.standings || [])].sort(function (a, b) { return b.rank - a.rank; }); })() : draftInfo.order;
    // Has the event started by its calendar dates? ("Jun 18–21" / "Jul 30 – Aug 2")
    const M = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    let started = false;
    const mm = ev.dates ? [...ev.dates.matchAll(/([A-Z][a-z]{2})\s+(\d+)/g)] : [];
    if (mm.length) {
      const start = new Date(2026, M[mm[0][1]], +mm[0][2], 0, 0, 0);
      started = new Date() >= start;
    }
    const underway = !!(meta.live && ev.t === meta.live.t) || started;
    const priorT = ev.t - 1;
    const draftPending = league ? false : (priorT >= 1 && draftInfo.fromT !== priorT);
    const priorName = (ChainsEngine.SEED.TOURNAMENTS.find((x) => x.t === priorT) || {}).name;
    // Picks can only truly be made once the draft order is set (prior event done).
    const picksReady = !draftPending;
    const badgeText = underway ? "Underway" : picksReady ? "Picks open" : "Picks soon";
    const ctaText = underway ? "See the picks" : picksReady ? "View the picks" : ("Opens after " + (priorName || "the current event"));
    return (
      <Card tone="ink" pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border-ink)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Badge tone={underway ? "live" : picksReady ? "ace" : "neutral"} emphasis="solid">{badgeText}</Badge>
            <TierTag tier={ev.tier} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 24, color: "var(--bone-50)", lineHeight: 1.05 }}>{ev.name}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 7, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 14, color: "var(--chain-400)" }}><Icons.Pin size={14} /></span>{ev.loc}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 14 }}><Icons.Calendar size={14} /></span>{ev.dates}</span>
          </div>
        </div>
        <div style={{ padding: "14px 20px 18px" }}>
          {(league && league.type !== "classic") ? null : draftPending ? (
            <React.Fragment>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--chain-400)", marginBottom: 10 }}>Draft order</div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", background: "var(--pine-800)", border: "1px solid var(--border-ink)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
                <span style={{ width: 16, height: 16, color: "var(--chain-400)", flexShrink: 0 }}><Icons.Lock size={15} /></span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-300)", lineHeight: 1.45 }}>No draft order yet — it locks when <b style={{ color: "var(--bone-50)" }}>{priorName || "the current event"}</b> finishes.</span>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--chain-400)", marginBottom: 10 }}>Draft order · {draftInfo.fromName ? `${draftInfo.fromName} last place picks first` : "last place picks first"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {draft.map((m, i) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px", background: i === 0 ? "var(--ace-500)" : "var(--pine-700)", borderRadius: "var(--radius-pill)" }}>
                    <Avatar name={m.name} color={i === 0 ? "var(--pine-900)" : m.disc} size={22} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 12, color: i === 0 ? "#fff" : "var(--bone-50)" }}>{m.name}</span>
                  </div>
                ))}
              </div>
            </React.Fragment>
          )}
          <Button variant="accent" full size="lg" icon={<Icons.Disc size={17} />} onClick={onGoPicks}>{ctaText}</Button>
        </div>
      </Card>
    );
  }

  /* ---- Live event card — our league's combined scores, round by round --- */
  // par-per-round from a fully-scored player; fallback 63
  function dParPerRound(rows) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]; const rds = dRowRounds(r);
      const ts = r.total_strokes != null ? r.total_strokes : (r.total != null ? r.total : null);
      const tp = dRowToPar(r);
      if (ts != null && tp != null && rds.length > 0) { const v = Math.round((ts - tp) / rds.length); if (v > 40 && v < 90) return v; }
    }
    return 63;
  }
  // cumulative to-par for one player through round vr (null if didn't play it)
  function dCumToPar(r, vr, par) {
    const rds = dRowRounds(r);
    if (rds.length < vr) return null;
    let strokes = 0;
    for (let i = 0; i < vr; i++) { const s = rds[i] && rds[i].score; if (s == null) return null; strokes += Number(s); }
    return strokes - par * vr;
  }
  // how many rounds are COMPLETE (full-ish field), so the dashboard shows a
  // finished round, not a half-played one.
  function dCompletedRounds(rows, maxR) {
    const scored = rows.filter((r) => dRowRounds(r).length > 0).length || 1;
    let done = 0;
    for (let r = 1; r <= maxR; r++) {
      const have = rows.filter((rr) => { const rd = dRowRounds(rr)[r - 1]; return rd && rd.score != null; }).length;
      if (have >= scored * 0.9) done = r; else break;
    }
    return done;
  }

  function LiveResultCard({ slot, rows, round, onEvent }) {
    const members = ChainsEngine.members();
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const pickByMember = {}; picks.forEach((r) => { pickByMember[r.m] = [r.p1, r.p2]; });
    // Match picks to feed rows by exact name AND by normalized first+last (the
    // feed sometimes carries a middle name, e.g. "Calvin Thor Heimburg" vs the
    // pick "Calvin Heimburg", and accents differ) so no pick silently drops out.
    const dNorm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, " ");
    const dFirstLast = (s) => { const w = dNorm(s).split(" ").filter(Boolean); return w.length >= 2 ? w[0] + " " + w[w.length - 1] : dNorm(s); };
    const byName = {}; const byFL = {};
    rows.forEach((r) => { const n = dRowName(r); if (n) { byName[n] = r; byFL[dFirstLast(n)] = r; } });
    const findRow = (nm) => nm ? (byName[nm] || byFL[dFirstLast(nm)] || null) : null;
    const par = dParPerRound(rows);
    const maxR = dMaxRound(rows);
    const doneRounds = dCompletedRounds(rows, maxR);
    // default to the latest COMPLETED round (so it's never a half-played round)
    const [vr, setVr] = React.useState(0);
    const showRound = vr || doneRounds || maxR || 1;

    const cards = members.map((m) => {
      const ps = pickByMember[m.id] || [null, null];
      const parts = ps.map((nm) => { const row = findRow(nm); return row ? dCumToPar(row, showRound, par) : null; });
      const vals = parts.filter((v) => v != null);
      const combined = vals.length ? vals.reduce((a, b) => a + b, 0) : null;
      return { m, ps, parts, combined, hasScore: vals.length > 0 };
    }).sort((a, b) => {
      if (a.combined == null && b.combined == null) return a.m.name.localeCompare(b.m.name);
      if (a.combined == null) return 1; if (b.combined == null) return -1;
      return a.combined - b.combined || a.m.name.localeCompare(b.m.name);
    });

    return (
      <Card pad={0}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div onClick={() => onEvent && onEvent(slot.t)} style={{ cursor: "pointer" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Our league · through R{showRound}</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginTop: 2 }}>{slot.name}</div>
          </div>
          {maxR >= 1 && (
            <div style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: Math.max(maxR, 1) }, (_, i) => i + 1).map((rd) => {
                const has = rd <= maxR; const on = rd === showRound;
                return <button key={rd} disabled={!has} onClick={() => setVr(rd)} style={{ height: 30, padding: "0 11px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : has ? "var(--text-muted)" : "var(--text-faint)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, cursor: has ? "pointer" : "default", opacity: has ? 1 : 0.4 }}>R{rd}</button>;
              })}
            </div>
          )}
        </div>
        <div style={{ padding: "6px 14px 12px" }}>
          {cards.map((c, i) => (
            <div key={c.m.id} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 12, padding: "8px 6px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 && c.hasScore ? "var(--fairway-600)" : "var(--text-faint)", textAlign: "center" }}>{c.hasScore ? dOrdinal(i + 1) : "·"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <Avatar name={c.m.name} color={c.m.disc} size={26} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", lineHeight: 1 }}>{c.m.name}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span>{c.ps[0] || "—"}</span>{c.parts[0] != null && <span style={{ color: dParColor(c.parts[0]), fontWeight: 700, marginLeft: 4 }}>{dFmtPar(c.parts[0])}</span>}</div>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span>{c.ps[1] || "—"}</span>{c.parts[1] != null && <span style={{ color: dParColor(c.parts[1]), fontWeight: 700, marginLeft: 4 }}>{dFmtPar(c.parts[1])}</span>}</div>
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: dParColor(c.combined) }}>{c.combined == null ? "—" : dFmtPar(c.combined)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* ---- Live event from the FRESH feed (same source as the Live Chains tab) -
     The results repo lags (often field-only, no round scores yet), so for the
     in-progress event we read chains-fantasy /live and show our league's combined
     event score. This is what makes the dashboard switch to the new tournament
     the moment R1 posts, instead of sitting on the prior event's final. */
  function LiveFeedResultCard({ slot, feed, onEvent }) {
    const members = ChainsEngine.members();
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const pickByMember = {}; picks.forEach((r) => { pickByMember[r.m] = [r.p1, r.p2]; });
    const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, " ");
    const fl = (s) => { const w = norm(s).split(" ").filter(Boolean); return w.length >= 2 ? w[0] + " " + w[w.length - 1] : norm(s); };
    const byName = {}, byFL = {};
    (feed.players || []).forEach((p) => { const n = p.name; if (n) { byName[norm(n)] = p; byFL[fl(n)] = p; } });
    const etp = (nm) => { if (!nm) return null; const p = byName[norm(nm)] || byFL[fl(nm)]; return (p && p.event_to_par != null) ? Number(p.event_to_par) : null; };
    const through = feed.highest_completed_round || feed.current_round || 1;
    const isFinal = !!feed.event_final;

    const cards = members.map((m) => {
      const ps = pickByMember[m.id] || [null, null];
      const parts = ps.map(etp);
      const vals = parts.filter((v) => v != null);
      const combined = vals.length ? vals.reduce((a, b) => a + b, 0) : null;
      return { m, ps, parts, combined, hasScore: vals.length > 0 };
    }).sort((a, b) => {
      if (a.combined == null && b.combined == null) return a.m.name.localeCompare(b.m.name);
      if (a.combined == null) return 1; if (b.combined == null) return -1;
      return a.combined - b.combined || a.m.name.localeCompare(b.m.name);
    });
    // No matched league scores yet → fall back to the last final rather than a card of dashes.
    if (!cards.some((c) => c.hasScore)) return <RecentResult onEvent={onEvent} />;

    return (
      <Card pad={0}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div onClick={() => onEvent && onEvent(slot.t)} style={{ cursor: "pointer" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Our league · {isFinal ? "final" : "through R" + through}</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginTop: 2 }}>{slot.name}</div>
          </div>
          <Badge tone={isFinal ? "gold" : "live"} emphasis="solid">{isFinal ? "Final" : "Live"}</Badge>
        </div>
        <div style={{ padding: "6px 14px 12px" }}>
          {cards.map((c, i) => (
            <div key={c.m.id} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto", alignItems: "center", gap: 12, padding: "8px 6px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 && c.hasScore ? "var(--fairway-600)" : "var(--text-faint)", textAlign: "center" }}>{c.hasScore ? dOrdinal(i + 1) : "·"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <Avatar name={c.m.name} color={c.m.disc} size={26} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", lineHeight: 1 }}>{c.m.name}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span>{c.ps[0] || "—"}</span>{c.parts[0] != null && <span style={{ color: dParColor(c.parts[0]), fontWeight: 700, marginLeft: 4 }}>{dFmtPar(c.parts[0])}</span>}</div>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span>{c.ps[1] || "—"}</span>{c.parts[1] != null && <span style={{ color: dParColor(c.parts[1]), fontWeight: 700, marginLeft: 4 }}>{dFmtPar(c.parts[1])}</span>}</div>
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: dParColor(c.combined) }}>{c.combined == null ? "—" : dFmtPar(c.combined)}</span>
            </div>
          ))}
        </div>
        <div onClick={() => onEvent && onEvent(slot.t)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--ace-600)" }}>
          Live scores, full field &amp; hole-by-hole <span style={{ width: 14, height: 14 }}><Icons.ChevRight size={14} /></span>
        </div>
      </Card>
    );
  }

  /* ---- Result area: live event when one's running, else last final ------ */
  function ResultArea({ onEvent }) {
    const meta = ChainsEngine.seasonMeta();
    const slot = meta.live || meta.next;
    const eventId = slot && PS() ? PS().resultsIdForSlot(slot.t) : null;
    const started = slot ? (!!meta.live || dEventStarted(slot)) : false;
    const [rows, setRows] = React.useState(null);
    const [feed, setFeed] = React.useState(null);

    React.useEffect(() => {
      if (!eventId || !started) return;
      let alive = true;
      function pull() {
        fetch("https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/events/" + eventId + "-MPO.json", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((ev) => { if (alive) setRows(PS()._rowsOf(ev) || []); })
          .catch(() => {});
      }
      pull();
      const iv = setInterval(() => { if (!document.hidden) pull(); }, 120000); // 2 min — was 5
      const onVis = () => { if (!document.hidden) pull(); };
      document.addEventListener("visibilitychange", onVis);
      return () => { alive = false; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    }, [eventId, started]);

    // Fresh live feed (same source as the Live Chains tab). Preferred over the
    // lagging results repo so the dashboard moves to the new event as soon as it
    // posts scores.
    React.useEffect(() => {
      if (!eventId || !started) return;
      let alive = true;
      function pull() {
        fetch("https://chains-fantasy-default-rtdb.firebaseio.com/live.json", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => { if (alive) setFeed(j); })
          .catch(() => {});
      }
      pull();
      const iv = setInterval(() => { if (!document.hidden) pull(); }, 60000);
      const onVis = () => { if (!document.hidden) pull(); };
      document.addEventListener("visibilitychange", onVis);
      return () => { alive = false; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    }, [eventId, started]);

    const feedMatches = feed && String(feed.event_id) === String(eventId);
    const feedHasScores = feedMatches && (((feed.highest_completed_round || 0) >= 1) || (feed.players || []).some((p) => (Number(p.thru) || 0) > 0));
    if (started && feedHasScores) {
      return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><LiveFeedResultCard slot={slot} feed={feed} onEvent={onEvent} />{window.FantasyImpactFeed ? React.createElement(window.FantasyImpactFeed) : null}</div>;
    }
    if (started && rows && rows.length && !dPreEvent(rows)) {
      return <LiveResultCard slot={slot} rows={rows} round={dMaxRound(rows)} onEvent={onEvent} />;
    }
    return <RecentResult onEvent={onEvent} />;
  }
  function RecentResult({ onEvent }) {
    const meta = ChainsEngine.seasonMeta();
    // last completed event
    let last = null;
    for (let i = ChainsEngine.SEED.TOURNAMENTS.length - 1; i >= 0; i--) {
      const t = ChainsEngine.SEED.TOURNAMENTS[i];
      const r = ChainsEngine.eventResults(t.t);
      if (r && r.scored) { last = { t, r }; break; }
    }
    if (!last) return null;
    const rows = [...last.r.rows].sort((a, b) => a.place - b.place);
    return (
      <Card pad={0} hover onClick={() => onEvent && onEvent(last.t.t)} style={{ cursor: "pointer" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Latest result · T{last.t.t}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginTop: 2 }}>{last.t.name}</div>
          </div>
          <Badge tone="gold"><span style={{ width: 12, height: 12, marginRight: 2 }}><Icons.Trophy size={12} /></span>Pro: {last.t.proWinner}</Badge>
        </div>
        <div style={{ padding: "6px 14px 12px" }}>
          {rows.map((r, i) => {
            const m = ChainsEngine.member(r.m);
            return (
              <div key={r.m} style={{ display: "grid", gridTemplateColumns: "38px 1fr auto auto", alignItems: "center", gap: 12, padding: "8px 6px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <PlaceBadge place={r.place} size={30} points={r.points} />
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Avatar name={m.name} color={m.disc} size={26} />
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", lineHeight: 1 }}>{m.name}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{r.p1} <ScoreValue value={r.s1} size={11} /> · {(r.p2 && r.p2 !== "N/A") ? r.p2 : "—"} {(r.p2 && r.p2 !== "N/A") ? <ScoreValue value={r.s2} size={11} /> : null}</div>
                  </div>
                </div>
                <ScoreValue value={r.total} size={18} />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-muted)", width: 30, textAlign: "right" }}>+{r.points}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-sunken)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--ace-600)" }}>
          View full field, payouts &amp; every round <span style={{ width: 14, height: 14 }}><Icons.ChevRight size={14} /></span>
        </div>
      </Card>
    );
  }

  function LeagueResultCard({ L, onEvent, mobile }) {
    const evs = L.events || [];
    const lastEv = evs.length ? evs[evs.length - 1] : null;
    if (!lastEv) return null;
    const ranked = window.ChainsActive.rankedForEvent(L, lastEv.t);
    return (
      <Card pad={0} hover onClick={() => onEvent && onEvent(lastEv.t)} style={{ cursor: "pointer" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Latest result · T{lastEv.t}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", marginTop: 2 }}>{lastEv.name}</div>
        </div>
        <div style={{ padding: "6px 14px 12px" }}>
          {ranked.map((row, i) => (
            <div key={row.m.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 6px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <PlaceBadge place={row.place || (i + 1)} size={30} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, flex: 1, minWidth: 0 }}>
                <Avatar name={row.m.name} color={row.m.disc} size={26} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", lineHeight: 1 }}>{row.m.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 3 }}>
                    {window.ChainsActive.memberPicks(L, lastEv.t, row.m.id).map((pk, pi) => (
                      <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>
                        {pi > 0 && <span style={{ color: "var(--border-default)" }}>·</span>}
                        {pk.name}<ScoreValue value={pk.score} size={11} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <ScoreValue value={row.total} size={18} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-sunken)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--ace-600)" }}>
          View full field &amp; every round <span style={{ width: 14, height: 14 }}><Icons.ChevRight size={14} /></span>
        </div>
      </Card>
    );
  }

  function noteAgo(ts) {
    if (!ts) return "";
    const d = Math.max(0, Date.now() - ts), day = 86400000;
    if (d < 3600000) { const m = Math.round(d / 60000); return m <= 1 ? "just now" : m + "m ago"; }
    if (d < day) return Math.round(d / 3600000) + "h ago";
    if (d < 7 * day) return Math.round(d / day) + "d ago";
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function LeagueNotes({ mobile }) {
    const [, force] = React.useState(0);
    const [text, setText] = React.useState("");
    React.useEffect(() => {
      const fn = () => force((x) => x + 1);
      window.addEventListener("chains:remote-update", fn);
      window.addEventListener("chains:local-change", fn);
      return () => { window.removeEventListener("chains:remote-update", fn); window.removeEventListener("chains:local-change", fn); };
    }, []);
    const commish = window.ChainsID && ChainsID.isCommish();
    const notes = ChainsEngine.newsNotes();
    if (!commish && !notes.length) return null;
    function post() { if (text.trim()) { ChainsEngine.addNewsNote(text); setText(""); force((x) => x + 1); } }
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "14px 16px" : "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>From the commish</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)" }}>League Notes</div>
        </div>
        {commish && (
          <div style={{ padding: mobile ? "12px 16px" : "14px 20px", borderBottom: notes.length ? "1px solid var(--border-subtle)" : "none", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Post a note — e.g. “Barela out this week, wrist.”"
              onKeyDown={(e) => { if (e.key === "Enter") post(); }}
              style={{ flex: 1, minWidth: 200, height: 40, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
            <Button variant="accent" size="md" onClick={post}>Post</Button>
          </div>
        )}
        {notes.length === 0 ? (
          <div style={{ padding: "18px 20px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No notes yet — the commish posts injuries, schedule quirks, and rulings here.</div>
        ) : (
          <div style={{ padding: "4px 12px 8px" }}>
            {notes.map((n, i) => (
              <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 8px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <span style={{ flexShrink: 0, marginTop: 1, width: 7, height: 7, borderRadius: "50%", background: "var(--ace-500)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)", lineHeight: 1.4 }}>{n.text}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{(n.by ? (((ChainsEngine.member(n.by) || {}).name || "Someone") + " · ") : "") + noteAgo(n.ts)}</div>
                </div>
                {commish && <IconButton title="Delete note" variant="ghost" size="sm" onClick={() => { ChainsEngine.removeNewsNote(n.id); force((x) => x + 1); }}><Icons.X size={14} /></IconButton>}
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  function BetSweatCard({ mobile }) {
    const [, force] = React.useState(0);
    React.useEffect(function () {
      const fn = function () { force(function (x) { return x + 1; }); };
      window.addEventListener("chains:bets", fn); window.addEventListener("chains:remote-update", fn);
      const iv = setInterval(fn, 15000);
      return function () { window.removeEventListener("chains:bets", fn); window.removeEventListener("chains:remote-update", fn); clearInterval(iv); };
    }, []);
    const B = window.ChainsBets;
    if (!B || !B.available || !B.available()) return null;
    const active = (B.active ? B.active() : []) || [];
    if (!active.length) return null;
    const me = B.meId();
    const go = function () { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "games" })); } catch (e) {} };
    return E(Card, { pad: 0 },
      E("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: mobile ? "13px 16px" : "15px 20px", borderBottom: "1px solid var(--border-subtle)" } },
        E("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "var(--clay-600, #b4452f)", flexShrink: 0 } }),
        E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: "var(--text-muted)" } }, "Your bets \u00b7 sweating live"),
        E("button", { onClick: go, style: { marginLeft: "auto", border: "none", background: "transparent", color: "var(--fairway-700)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 } }, "Open \u2192")
      ),
      active.slice(0, 3).map(function (b, i) {
        const iAmFrom = b.from === me;
        const foeName = iAmFrom ? b.toName : b.fromName;
        const myTeam = iAmFrom ? b.fromTeam : b.toTeam, foeTeam = iAmFrom ? b.toTeam : b.fromTeam;
        const ms = B.scoreTeam(myTeam, b.eventT), fs = B.scoreTeam(foeTeam, b.eventT);
        const have = ms != null && fs != null;
        const ahead = have && ms < fs, even = have && ms === fs;
        const txt = !have ? "Not started" : even ? "Even" : ahead ? ("Up " + Math.abs(ms - fs)) : ("Down " + Math.abs(ms - fs));
        const col = !have ? "var(--text-faint)" : even ? "var(--text-muted)" : ahead ? "var(--fairway-700)" : "var(--clay-600, #b4452f)";
        return E("div", { key: b.id, onClick: go, style: { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: i ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" } },
          E("div", { style: { minWidth: 0 } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" } }, "You vs " + foeName),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" } }, b.eventName + " \u00b7 " + b.stake + " coins")
          ),
          E("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: col, whiteSpace: "nowrap" } }, txt)
        );
      })
    );
  }

  function DashboardView({ onGoPicks, onGoStandings, onMember, onEvent }) {
    const { mobile } = useViewport();
    let standings = ChainsEngine.standings();
    const meta = ChainsEngine.seasonMeta();
    const pct = Math.round((meta.completed / meta.total) * 100);
    // Active league (Classic by default) drives the whole dashboard. Switching
    // happens in the persistent League bar (shell); Classic → L null → unchanged.
    const L = window.ChainsActive ? ChainsActive.league() : null;
    const _lenLabel = (L && L.length === "single") ? "single tournament" : (L && L.length === "n") ? ((L.count || 3) + " tournaments") : null;
    const heroKicker = L ? ("2026 Season · " + L.name + (_lenLabel ? " · " + _lenLabel : "")) : "2026 Season";
    const heroCompleted = L ? ((L.events || []).length) : meta.completed;
    const heroTotal = (L && L.length && L.length !== "season") ? ((L.windowTs || []).length || meta.total) : meta.total;
    const heroPct = heroTotal ? Math.round((heroCompleted / heroTotal) * 100) : 0;
    // animate the season-progress bar up from 0 on mount (gentle, purposeful)
    const [barW, setBarW] = React.useState(0);
    React.useEffect(() => { const id = requestAnimationFrame(() => setBarW(heroPct)); return () => cancelAnimationFrame(id); }, [heroPct]);
    const podStandings = L ? L.standings.map((r) => ({ ...r, under: r.down })) : standings;
    const podUnit = L ? (L.scoring === "cumulative-down" ? "down" : "pts") : undefined;
    // Pre-start: a new league with no scored events has no leader yet — show the
    // lineup, not a blank/fake podium. Flips to the real podium once scores post.
    const preStart = !!(L && (L.standings || []).every((s) => (s.played || 0) === 0));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 16 : 22 }}>
        {/* Scoreboard hero */}
        <Card tone="ink" pad={0}>
          <div style={{ padding: mobile ? "18px 16px" : "22px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", fontSize: 12, color: "var(--ace-400)" }}>{heroKicker}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 30, color: "var(--bone-50)", lineHeight: 1, marginTop: 2 }}>Chains</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: "var(--bone-50)" }}>{heroCompleted}<span style={{ color: "var(--chain-500)" }}>/{heroTotal}</span></div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--chain-400)" }}>events</div>
              </div>
            </div>
            <div style={{ height: 5, background: "var(--pine-700)", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ width: barW + "%", height: "100%", background: "var(--ace-500)", transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
            </div>
            {preStart ? <PreStartLineup L={L} mobile={mobile} onMember={onMember} /> : <Podium standings={podStandings} unit={podUnit} mobile={mobile} onMember={onMember} />}
          </div>
        </Card>

        {false && <BetSweatCard mobile={mobile} />}

        {!L && (<React.Fragment>
        {/* Two-up: next event + latest result */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1.2fr", gap: mobile ? 14 : 18, alignItems: "start" }}>
          <NextEventCard onGoPicks={onGoPicks} onGoStandings={onGoStandings} />
          <ResultArea onEvent={onEvent} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 7, alignSelf: "center", padding: "2px 0", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
          <span style={{ width: 13, height: 13, color: "var(--text-faint)" }}><Icons.Target size={13} /></span>
          Tap any member, event or player to see their full story.
        </div>

        <LeagueChat mobile={mobile} />
        </React.Fragment>)}
        {L && (<React.Fragment>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1.2fr", gap: mobile ? 14 : 18, alignItems: "start" }}>
          <NextEventCard onGoPicks={onGoPicks} onGoStandings={onGoStandings} league={L} />
          <LeagueResultCard L={L} onEvent={onEvent} mobile={mobile} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, alignSelf: "center", padding: "2px 0", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>
          <span style={{ width: 13, height: 13, color: "var(--text-faint)" }}><Icons.Target size={13} /></span>
          Tap any member or event to see their full story.
        </div>
        <LeagueChat mobile={mobile} league={L} />
        </React.Fragment>)}
      </div>
    );
  }

  window.DashboardView = DashboardView;
})();
