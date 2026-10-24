/* Chains app — League HQ view: Golden Ball, side bets, shared-league sync.
   window.LeagueView */
(function () {
  function InkHeader({ kicker, title, sub, right, mobile }) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", padding: mobile ? "16px" : "18px 22px", background: "var(--bg-ink)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-400)" }}>{kicker}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 22, color: "var(--bone-50)", lineHeight: 1.05 }}>{title}</div>
          {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 5, maxWidth: 520 }}>{sub}</div>}
        </div>
        {right}
      </div>
    );
  }

  function NumInput({ value, onCommit, placeholder }) {
    const [v, setV] = React.useState(value == null ? "" : String(value));
    React.useEffect(() => { setV(value == null ? "" : String(value)); }, [value]);
    if (!ChainsID.isCommish()) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 36, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: value == null ? "var(--text-faint)" : "var(--text-strong)" }}>
          {value == null ? "—" : value}
        </div>
      );
    }
    return (
      <input value={v} inputMode="numeric" placeholder={placeholder || "—"}
        onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => onCommit(v === "" ? null : parseInt(v, 10))}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        style={{ width: "100%", height: 36, padding: "0 10px", textAlign: "center", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
    );
  }

  /* ---- Golden Ball ------------------------------------------------------ */
  function GoldenBallSection({ mobile }) {
    const [, force] = React.useState(0);
    const TS = ChainsEngine.SEED.TOURNAMENTS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });
    const st = ChainsEngine.standings();
    return (
      <Card pad={0}>
        <InkHeader mobile={mobile} kicker="Borrowed from the big leagues" title="The Golden Ball"
          sub="Once a season, each member picks ONE tournament where their points count double. That's the whole year — one shot, so pick your spot. Standings update instantly, and once it's burned, it's burned." />
        <div style={{ padding: "4px 14px 10px" }}>
          {ChainsEngine.members().map((m, i) => {
            const gb = ChainsEngine.goldenBall(m.id);
            const row = st.find((x) => x.id === m.id);
            const ev = gb != null ? row.events[gb] : null;
            const bonus = ev ? ev.points / 2 : 0;
            return (
              <div key={m.id} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "150px 1fr auto", gap: mobile ? 8 : 12, alignItems: "center", padding: "11px 8px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Avatar name={m.name} color={m.disc} size={26} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
                </div>
                <div style={{ position: "relative", maxWidth: 320 }}>
                  <select value={gb == null ? "" : gb} disabled={!ChainsID.canEditMember(m.id)}
                    onChange={(e) => { ChainsEngine.setGoldenBall(m.id, e.target.value === "" ? null : Number(e.target.value)); force((x) => x + 1); }}
                    style={{ appearance: "none", WebkitAppearance: "none", width: "100%", height: 38, padding: "0 32px 0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: gb == null ? "var(--text-faint)" : "var(--text-strong)", cursor: ChainsID.canEditMember(m.id) ? "pointer" : "default", opacity: ChainsID.canEditMember(m.id) ? 1 : 0.55 }}>
                    <option value="">Unused — still in pocket</option>
                    {TS.map((t) => <option key={t.t} value={t.t}>T{t.t} · {t.name}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", width: 15, height: 15, color: "var(--text-muted)" }}><Icons.ChevDown size={15} /></span>
                </div>
                <div>
                  {gb != null
                    ? <Badge tone="gold" emphasis="solid">×2 on T{gb} · +{bonus} pts</Badge>
                    : <Badge tone="neutral">In pocket</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ---- Side bets / shame awards ----------------------------------------- */
  const SIDE_AWARDS = [
    { key: "tb", title: "The Lumberjack", icon: "Disc", desc: "Most triple bogeys or worse by your picks", unit: "TB+", manual: true, accent: "var(--ace-500)" },
    { key: "c1x", title: "Chain Repellent", icon: "Target", desc: "Most missed Circle 1X putts by your picks", unit: "missed", manual: true, accent: "var(--chain-600)" },
    { key: "streak", title: "The Heater", icon: "Flame", desc: "Longest birdie streak by a single pick", unit: "in a row", manual: true, accent: "var(--birdie-600)" },
    { key: "last", title: "The Caboose", icon: "Medal", desc: "Most last-place weeks — counted automatically", unit: "weeks", manual: false, accent: "var(--gold-500)" },
  ];

  function SideStatsEditor({ mobile, onChange }) {
    const TS = ChainsEngine.SEED.TOURNAMENTS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });
    const [t, setT] = React.useState(TS.length ? TS[TS.length - 1].t : 1);
    const [, force] = React.useState(0);
    function refresh() { force((x) => x + 1); onChange && onChange(); }
    return (
      <div style={{ padding: mobile ? "14px 16px" : "16px 22px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
          Pull these from <b>StatMando</b> / DGPT post-event stats (PDGA Live → event → stats). Count both of a member's picks; streak is the best single-pick run.
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
          {TS.map((x) => (
            <button key={x.t} onClick={() => setT(x.t)} style={{ flexShrink: 0, padding: "6px 11px", borderRadius: "var(--radius-sm)", border: `1px solid ${x.t === t ? "var(--fairway-500)" : "var(--border-subtle)"}`, background: x.t === t ? "var(--fairway-600)" : "var(--bg-elevated)", color: x.t === t ? "#fff" : "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12 }}>T{x.t}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "120px 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
          {!mobile && <span />}
          {!mobile && ["Triple bogeys+", "Missed C1X", "Birdie streak"].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>{h}</span>
          ))}
          {ChainsEngine.members().map((m) => {
            const v = ChainsEngine.getSideStats(t, m.id);
            return (
              <React.Fragment key={m.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: mobile ? 8 : 0 }}>
                  <Avatar name={m.name} color={m.disc} size={22} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{m.name}</span>
                </div>
                {["tb", "c1x", "streak"].map((f) => (
                  <NumInput key={f} value={v[f]} placeholder={mobile ? { tb: "TB+", c1x: "C1X", streak: "streak" }[f] : "—"}
                    onCommit={(val) => { ChainsEngine.setSideStat(t, m.id, f, val); refresh(); }} />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  function SideBetsSection({ mobile }) {
    const [loaded2026, setLoaded2026] = React.useState(null);
    const ED = () => window.ExploreData;

    React.useEffect(() => {
      let alive = true;
      if (ED()) {
        ED().loadSeason("2026").then((l) => { if (alive) setLoaded2026(l); }).catch(() => {});
      }
      return () => { alive = false; };
    }, []);

    // Member-based awards: rank the 6 league members by their TWO drafted pros'
    // combined stats in the most recent completed event. Counts (birdies/bogeys/
    // OB) sum the two picks; percentages (C1X/scramble) average them.
    const members = ChainsEngine.members();
    const awards = [];
    let eventLabel = "";
    if (loaded2026) {
      const sorted = loaded2026.events.slice().sort((a, b) => (b.meta.t || 0) - (a.meta.t || 0));
      const nameToPdga = {};
      (window.MPO_PLAYERS || []).forEach((p) => { if (p.pdga != null) nameToPdga[p.name] = String(p.pdga); });

      // most recent event that has both results AND member picks
      let recent = null, picks = null;
      for (let i = 0; i < sorted.length; i++) {
        const e = sorted[i];
        if (!e.rows || !e.rows.length) continue;
        const pk = ChainsEngine.picksFor(e.meta.t) || [];
        if (pk.length) { recent = e; picks = pk; break; }
      }

      if (recent) {
        eventLabel = `T${recent.meta.t} · ${recent.ev.event_name || recent.meta.name || ""}`;
        const byPdga = {};
        recent.rows.forEach((r) => { if (r.pdga_number != null) byPdga[String(r.pdga_number)] = r; });
        const sCount = (r, k) => (r && r.stats && r.stats[k] && r.stats[k].count != null) ? r.stats[k].count : null;
        const sVal = (r, k) => (r && r.stats && r.stats[k] && r.stats[k].value != null) ? r.stats[k].value : null;

        const pickByMember = {};
        picks.forEach((row) => { pickByMember[row.m] = [row.p1, row.p2]; });
        const memberRows = (mid) => (pickByMember[mid] || []).map((nm) => { const pd = nameToPdga[nm]; return pd ? byPdga[pd] : null; }).filter(Boolean);
        const memSum = (mid, k) => { const rs = memberRows(mid); let any = false, s = 0; rs.forEach((r) => { const v = sCount(r, k); if (v != null) { any = true; s += v; } }); return any ? s : null; };
        const memAvg = (mid, k) => { const vs = []; memberRows(mid).forEach((r) => { const v = sVal(r, k); if (v != null) vs.push(v); }); return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null; };

        function winnerOf(getter, dir) {
          let best = null, bestV = null;
          members.forEach((m) => { const v = getter(m.id); if (v == null) return; if (bestV == null || (dir === "high" ? v > bestV : v < bestV)) { bestV = v; best = m; } });
          return best ? { m: best, v: bestV } : null;
        }
        function add(key, emoji, title, res, fmt) { if (!res) return; awards.push({ key, emoji, title, member: res.m, value: fmt(res.v), picks: (pickByMember[res.m.id] || []).filter(Boolean) }); }

        add("birdies", "🔥", "Birdie King", winnerOf((mid) => memSum(mid, "birdie_count"), "high"), (v) => `${v} birdies`);
        add("bogeys", "💀", "Bogey Machine", winnerOf((mid) => memSum(mid, "bogey_count"), "high"), (v) => `${v} bogeys`);
        add("c1x_high", "🎯", "Circle 1 Assassin", winnerOf((mid) => memAvg(mid, "c1x_putting_pct"), "high"), (v) => `${Math.round(v * 10) / 10}% C1X`);
        add("c1x_low", "😬", "The Yips", winnerOf((mid) => memAvg(mid, "c1x_putting_pct"), "low"), (v) => `${Math.round(v * 10) / 10}% C1X`);
        add("ob", "🚧", "OB King", winnerOf((mid) => memSum(mid, "ob_count"), "high"), (v) => `${v} OB strokes`);
        add("scramble", "🔓", "Escape Artist", winnerOf((mid) => memAvg(mid, "scramble_pct"), "high"), (v) => `${Math.round(v * 10) / 10}% scrambles`);
      }
    }

    return (
      <Card pad={0}>
        <InkHeader mobile={mobile} kicker="Season-long" title="Shame & Glory"
          sub="Bragging rights among the six of us — each member's TWO drafted pros, combined, in the latest event." />
        
        {!loaded2026 ? (
          <div style={{ padding: "22px 16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Loading event data…</div>
        ) : awards.length === 0 ? (
          <div style={{ padding: "22px 16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No scored picks yet — awards appear here once an event with your picks completes.</div>
        ) : (
          <div style={{ padding: mobile ? "12px 16px" : "14px 22px" }}>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: mobile ? 10 : 12 }}>
              {awards.map((a) => (
                <div key={a.key} style={{ padding: "16px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{a.emoji}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: "var(--text-muted)", marginBottom: 9 }}>{a.title}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 6 }}>
                    <Avatar name={a.member.name} color={a.member.disc} size={24} />
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{a.member.name}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--ace-500)" }}>{a.value}</div>
                  {a.picks && a.picks.length > 0 && <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.35 }}>{a.picks.join(" + ")}</div>}
                </div>
              ))}
            </div>
            {eventLabel && <div style={{ marginTop: 12, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>From {eventLabel}</div>}
          </div>
        )}
      </Card>
    );
  }

  /* ---- The Bet Board · team-based head-to-head wagers --------------------- */
  const BET_CATS = [
    { key: "birdies", label: "Most birdies", auto: true, better: "high",
      val: (rows) => rows.reduce((s, r) => s + (r && r.stats && r.stats.birdie_count ? (r.stats.birdie_count.count || 0) : 0), 0) },
    { key: "putting", label: "Best C1X putting", auto: true, better: "high",
      val: (rows) => rows.reduce((s, r) => s + (r && r.stats && r.stats.c1x_putting_pct ? (r.stats.c1x_putting_pct.count || 0) : 0), 0) },
    { key: "finish", label: "Best finish", auto: true, better: "low",
      val: (rows) => { const p = rows.filter((r) => r && r.place > 0).map((r) => r.place); return p.length ? Math.min.apply(null, p) : null; } },
    { key: "throwin", label: "Longest throw-in", auto: true, better: "high",
      val: (rows) => rows.reduce((m, r) => Math.max(m, (r && r.stats && r.stats.longest_throw_in ? (r.stats.longest_throw_in.value || 0) : 0)), 0) },
    { key: "money", label: "Most money", auto: true, better: "high",
      val: (rows) => rows.reduce((s, r) => s + ((r && r.prize_usd) || 0), 0) },
    { key: "ace", label: "Gets an ace", auto: false, better: "high", val: () => null },
  ];
  function betOrdinal(n) { if (n == null) return "—"; const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function fmtCatVal(key, v) {
    if (v == null) return "—";
    if (key === "money") return "$" + Math.round(v).toLocaleString();
    if (key === "throwin") return Math.round(v) + " ft";
    if (key === "finish") return betOrdinal(v);
    if (key === "putting") return v + " makes";
    return v + " birdies";
  }

  function BetsSection({ mobile }) {
    const [, force] = React.useState(0);
    const [loaded, setLoaded] = React.useState({});
    const [cat, setCat] = React.useState("birdies");
    const [stake, setStake] = React.useState("5");
    const ms = ChainsEngine.members();
    const me = ChainsID.whoami();
    const commish = ChainsID.isCommish();
    const board = ChainsEngine.betBoard();
    const meta = ChainsEngine.seasonMeta();
    const upcoming = meta.live || meta.next;
    const upT = upcoming ? upcoming.t : null;
    const upId = upT && window.ChainsProStats ? window.ChainsProStats.eventIdForSlot(upT) : null;

    const PDGA_BY_NAME = {};
    (window.MPO_PLAYERS || []).forEach((p) => { PDGA_BY_NAME[p.name] = p.pdga != null ? String(p.pdga) : null; });

    React.useEffect(() => {
      let alive = true;
      const ids = new Set();
      board.forEach((b) => { if (b.eventId) ids.add(b.eventId + "|" + (b.season || "2026")); });
      if (upId) ids.add(upId + "|2026");
      ids.forEach((k) => {
        const parts = k.split("|");
        if (window.ChainsProStats) window.ChainsProStats.loadEvent(parts[0], parts[1])
          .then((ev) => { if (alive) setLoaded((m) => { const n = { ...m }; n[parts[0]] = ev; return n; }); }).catch(() => {});
      });
      return () => { alive = false; };
    }, [board.length, upId]);

    function teamPicks(memberId, t) {
      const picks = ChainsEngine.picksFor(t) || [];
      const mine = picks.find((p) => p.m === memberId);
      if (!mine) return [];
      return [mine.p1, mine.p2].filter((n) => n && n !== "N/A");
    }
    function teamRows(memberId, t, eventId) {
      return teamPicks(memberId, t).map((n) => {
        const pdga = PDGA_BY_NAME[n];
        return pdga && window.ChainsProStats ? window.ChainsProStats.playerByPdga(eventId, pdga, "2026") : null;
      });
    }
    function eventComplete(eventId) {
      const ev = loaded[eventId];
      if (!ev || !window.ChainsProStats) return false;
      return (window.ChainsProStats._rowsOf(ev) || []).some((r) => r.place > 0);
    }
    const catDef = (key) => BET_CATS.find((c) => c.key === key);

    function resolve(b) {
      const c = catDef(b.category);
      if (b.status !== "accepted") return { state: "open" };
      if (!c.auto) {
        if (b.manual === "by") return { state: "win", winner: b.by };
        if (b.manual === "vs") return { state: "win", winner: b.vs };
        if (b.manual === "push") return { state: "push" };
        return { state: "manual" };
      }
      if (!b.eventId || !eventComplete(b.eventId)) return { state: "pending" };
      const byV = c.val(teamRows(b.by, b.t, b.eventId));
      const vsV = c.val(teamRows(b.vs, b.t, b.eventId));
      let winner = null;
      if (c.better === "low") {
        if (byV == null && vsV == null) return { state: "push", byV, vsV };
        if (byV == null) winner = b.vs; else if (vsV == null) winner = b.by;
        else if (byV < vsV) winner = b.by; else if (vsV < byV) winner = b.vs;
      } else {
        if ((byV || 0) > (vsV || 0)) winner = b.by; else if ((vsV || 0) > (byV || 0)) winner = b.vs;
      }
      return { state: winner ? "win" : "push", winner: winner, byV: byV, vsV: vsV };
    }

    const net = {}; ms.forEach((m) => (net[m.id] = 0));
    board.forEach((b) => {
      const r = resolve(b);
      if (r.state === "win" && net[r.winner] != null) {
        const loser = r.winner === b.by ? b.vs : b.by;
        net[r.winner] += b.stake; if (net[loser] != null) net[loser] -= b.stake;
      }
    });
    const anyMoney = Object.values(net).some((v) => v !== 0);

    function propose() {
      if (!me || !upT) return;
      ChainsEngine.proposeBet({ t: upT, eventId: upId, season: "2026", category: cat, stake: parseInt(stake, 10) || 0, by: me });
      force((x) => x + 1);
    }

    const open = board.filter((b) => b.status === "open");
    const live = board.filter((b) => b.status === "accepted");
    const myTeamUp = me && upT ? teamPicks(me, upT) : [];

    const TeamLine = ({ memberId, t, color }) => {
      const names = teamPicks(memberId, t);
      return <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{names.length ? names.join(" · ") : "team not set yet"}</span>;
    };

    return (
      <Card pad={0}>
        <InkHeader mobile={mobile} kicker="Put it in writing" title="The Bet Board"
          sub="Bet your two picks against another member's, on a preset category. Propose a stake, someone takes it, and it settles itself from the numbers. Bragging-rights money only — never league points." />

        {/* Ledger */}
        {anyMoney && (
          <div style={{ padding: mobile ? "12px 16px" : "14px 22px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-ink)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10.5, color: "var(--ace-400)", marginBottom: 8 }}>Season ledger · settled bets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[...ms].sort((a, b) => net[b.id] - net[a.id]).map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px 5px 6px", background: "var(--pine-700)", borderRadius: "var(--radius-pill)" }}>
                  <Avatar name={m.name} color={m.disc} size={20} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 12, color: "var(--bone-50)" }}>{m.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: net[m.id] > 0 ? "var(--fairway-300)" : net[m.id] < 0 ? "#FF9B9B" : "var(--chain-400)" }}>{net[m.id] > 0 ? "+$" + net[m.id] : net[m.id] < 0 ? "−$" + Math.abs(net[m.id]) : "even"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Propose */}
        {me && upT ? (
          <div style={{ padding: mobile ? 16 : "16px 22px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10 }}>
              Your team for <b style={{ color: "var(--text-strong)" }}>T{upT} · {upcoming.name}</b>: {myTeamUp.length ? <b style={{ color: "var(--text-strong)" }}>{myTeamUp.join(" · ")}</b> : <span style={{ color: "var(--text-faint)" }}>set your picks first</span>}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>My team beats yours on</span>
              <div style={{ position: "relative" }}>
                <select value={cat} onChange={(e) => setCat(e.target.value)}
                  style={{ appearance: "none", WebkitAppearance: "none", height: 40, padding: "0 30px 0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", cursor: "pointer" }}>
                  {BET_CATS.map((c) => <option key={c.key} value={c.key}>{c.label}{c.auto ? "" : " (honor)"}</option>)}
                </select>
                <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", width: 14, height: 14, color: "var(--text-muted)" }}><Icons.ChevDown size={14} /></span>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-faint)" }}>$</span>
                <input value={stake} inputMode="numeric" onChange={(e) => setStake(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ width: 88, height: 40, padding: "0 10px 0 20px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
              </div>
              <Button variant="accent" size="md" onClick={propose} disabled={!stake}>Propose bet</Button>
            </div>
            {!catDef(cat).auto && <div style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>“Gets an ace” is settled by agreement — you and the taker mark the result.</div>}
          </div>
        ) : (
          <div style={{ padding: "18px 22px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No upcoming event to bet on right now.</div>
        )}

        {/* Open bets */}
        {open.length > 0 && (
          <div style={{ padding: "6px 14px 8px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-muted)", padding: "10px 8px 4px" }}>Open — take one</div>
            {open.map((b) => {
              const mBy = ChainsEngine.member(b.by); const c = catDef(b.category);
              return (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 8px", borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                  <Avatar name={mBy.name} color={mBy.disc} size={28} />
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)" }}><b style={{ color: mBy.disc }}>{mBy.name}</b>’s team wins <b>{c.label.toLowerCase()}</b> · <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>${b.stake}</span></div>
                    <TeamLine memberId={b.by} t={b.t} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {me && me !== b.by && <Button variant="accent" size="sm" onClick={() => { ChainsEngine.acceptBet(b.id, me); force((x) => x + 1); }}>Take it</Button>}
                    {(me === b.by || commish) && <IconButton title="Cancel bet" variant="ghost" onClick={() => { ChainsEngine.removeBoardBet(b.id); force((x) => x + 1); }}><Icons.Close size={14} /></IconButton>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live / settled bets */}
        <div style={{ padding: "6px 14px 12px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-muted)", padding: "10px 8px 4px" }}>Live & settled</div>
          {live.length === 0 ? (
            <div style={{ padding: "14px 8px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No accepted bets yet. Propose one above and wait for a taker.</div>
          ) : live.map((b) => {
            const mBy = ChainsEngine.member(b.by), mVs = ChainsEngine.member(b.vs);
            const c = catDef(b.category); const r = resolve(b);
            const isParty = me === b.by || me === b.vs;
            return (
              <div key={b.id} style={{ padding: "12px 8px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)" }}>
                    <b style={{ color: mBy.disc }}>{mBy.name}</b> vs <b style={{ color: mVs.disc }}>{mVs.name}</b> · {c.label.toLowerCase()} · <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>${b.stake}</span>
                  </div>
                  {r.state === "win" ? <Badge tone="gold" emphasis="solid">{((ChainsEngine.member(r.winner) || {}).name || "Someone") + " wins $" + b.stake}</Badge>
                    : r.state === "push" ? <Badge tone="neutral">Push — no money</Badge>
                    : r.state === "manual" ? <Badge tone="ace">Mark result</Badge>
                    : <Badge tone="neutral">Pending result</Badge>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <div style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: r.winner === b.by ? "var(--fairway-100)" : "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 11, color: "var(--text-strong)" }}>{mBy.name}{c.auto && r.byV != null ? " · " + fmtCatVal(c.key, r.byV) : ""}</div>
                    <TeamLine memberId={b.by} t={b.t} />
                  </div>
                  <div style={{ padding: "7px 10px", borderRadius: "var(--radius-sm)", background: r.winner === b.vs ? "var(--fairway-100)" : "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 11, color: "var(--text-strong)" }}>{mVs.name}{c.auto && r.vsV != null ? " · " + fmtCatVal(c.key, r.vsV) : ""}</div>
                    <TeamLine memberId={b.vs} t={b.t} />
                  </div>
                </div>
                {!c.auto && (isParty || commish) && (
                  <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Settle:</span>
                    <Button variant="ghost" size="sm" onClick={() => { ChainsEngine.settleBet(b.id, "by"); force((x) => x + 1); }}>{mBy.name} won</Button>
                    <Button variant="ghost" size="sm" onClick={() => { ChainsEngine.settleBet(b.id, "vs"); force((x) => x + 1); }}>{mVs.name} won</Button>
                    <Button variant="ghost" size="sm" onClick={() => { ChainsEngine.settleBet(b.id, "push"); force((x) => x + 1); }}>Push</Button>
                    {b.manual && <Button variant="ghost" size="sm" onClick={() => { ChainsEngine.unsettleBet(b.id); force((x) => x + 1); }}>Reset</Button>}
                  </div>
                )}
                {(me === b.by || commish) && <div style={{ marginTop: 8 }}><IconButton title="Remove bet" variant="ghost" size="sm" onClick={() => { ChainsEngine.removeBoardBet(b.id); force((x) => x + 1); }}><Icons.Close size={13} /></IconButton></div>}
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ---- League settings: members + custom pros ----------------------------- */
  function SettingsSection({ mobile }) {
    const [, force] = React.useState(0);
    const ms = ChainsEngine.members();
    const [name, setName] = React.useState("");
    const [pro, setPro] = React.useState("");
    const PALETTE = ["#E8590C", "#1971C2", "#2F9E44", "#9C36B5", "#E03131", "#F08C00", "#0B7285", "#6741D9", "#0CA678", "#C2255C", "#5C940D", "#364FC7", "#D9480F", "#087F5B", "#862E9C"];

    function addMember() {
      const n = name.trim();
      if (!n) return;
      if (ms.length >= 15) { window.ChainsToast && ChainsToast.show("The league is capped at 15 members.", "error"); return; }
      let id = n.toLowerCase().replace(/[^a-z0-9]/g, "") || "member";
      while (ms.find((m) => m.id === id)) id += "x";
      const used = new Set(ms.map((m) => m.disc));
      const disc = PALETTE.find((c) => !used.has(c)) || PALETTE[ms.length % PALETTE.length];
      ChainsEngine.setMembers([...ms, { id, name: n, disc }]);
      setName("");
      force((x) => x + 1);
    }
    function removeMember(id) {
      if (ms.length <= 2) return;
      ChainsConfirm.show({ title: "Remove this member?", message: "Their past results stay in the books, but they leave the standings and future drafts.", confirmLabel: "Remove", danger: true }).then((ok) => {
        if (!ok) return;
        ChainsEngine.setMembers(ms.filter((m) => m.id !== id));
        force((x) => x + 1);
      });
    }
    function addPro() {
      if (!pro.trim()) return;
      ChainsEngine.addCustomPro(pro);
      setPro("");
      force((x) => x + 1);
    }
    const custom = ChainsEngine.customPros();

    return (
      <Card pad={0}>
        <InkHeader mobile={mobile} kicker="Set up your league" title="League Settings"
          sub="Add members as the league grows (up to 15 — points scale automatically) and add new pros the moment they show up on tour." />
        <div style={{ padding: mobile ? 16 : "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Members · {ms.length}/15</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {ms.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 4px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <Avatar name={m.name} color={m.disc} size={26} />
                  <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
                  <IconButton title={ms.length <= 2 ? "A league needs at least 2 members" : "Remove member"} variant="ghost" disabled={ms.length <= 2} onClick={() => removeMember(m.id)}><Icons.Close size={14} /></IconButton>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New member's name"
                onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
                style={{ flex: 1, minWidth: 140, height: 40, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
              <Button variant="secondary" size="md" onClick={addMember} disabled={ms.length >= 15}>Add member</Button>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>New members start at 0 points and join the next draft at the back of the order.</div>
          </div>

          <div style={{ height: 1, background: "var(--border-subtle)" }} />

          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Pro player pool · {ChainsEngine.allPlayers().length} pros</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={pro} onChange={(e) => setPro(e.target.value)} placeholder="Add a pro who's not in the dropdown (exact PDGA name)"
                onKeyDown={(e) => { if (e.key === "Enter") addPro(); }}
                style={{ flex: 1, minWidth: 160, height: 40, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
              <Button variant="secondary" size="md" onClick={addPro}>Add pro</Button>
            </div>
            {custom.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {custom.map((p) => (
                  <span key={p.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 6px 4px 11px", borderRadius: "var(--radius-pill)", background: "var(--bg-sunken)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-body)" }}>
                    {p.name}
                    <button onClick={() => { ChainsEngine.removeCustomPro(p.name); force((x) => x + 1); }} title="Remove"
                      style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: "var(--border-subtle)" }} />
          <SyncBlock />
        </div>
      </Card>
    );
  }

  /* ---- Commissioner data block (lives inside League Settings) ----------- */
  function SyncBlock() {
    const [s, setS] = React.useState(ChainsSync.state());
    const [url, setUrl] = React.useState(ChainsSync.state().url);
    const fileRef = React.useRef(null);
    React.useEffect(() => {
      const fn = () => setS(ChainsSync.state());
      window.addEventListener("chains:sync-status", fn);
      return () => window.removeEventListener("chains:sync-status", fn);
    }, []);

    function exportFile() {
      const blob = new Blob([JSON.stringify(ChainsEngine.exportState(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "league-data.json";
      a.click();
      URL.revokeObjectURL(a.href);
    }
    function importFile(e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      f.text().then((txt) => {
        try {
          const ok = ChainsEngine.importState(JSON.parse(txt));
          if (!ok) window.ChainsToast && ChainsToast.show("That file doesn't look like a Chains league file.", "error");
        } catch (err) { window.ChainsToast && ChainsToast.show("Couldn't read that file.", "error"); }
      });
      e.target.value = "";
    }

    const dot = s.error ? "var(--ace-500)" : s.connected ? "var(--fairway-500)" : "var(--ace-500)";
    const statusText = s.error ? "Offline · will retry" : s.busy ? "Syncing…" : s.connected ? "Live sync on · all devices" : "Connecting…";
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>League data</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />{statusText}
          </span>
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 10 }}>
          Sync is automatic — every device stays in step with the shared league, no setup needed.{s.lastSync ? " Last synced " + new Date(s.lastSync).toLocaleTimeString() + "." : ""}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" onClick={() => {
            const link = location.origin + location.pathname + "?sync=" + encodeURIComponent(ChainsSync.state().url);
            const done = () => window.ChainsToast && ChainsToast.show("Invite link copied. Text it to the league — opening it connects their phone automatically.", "success");
            const manual = () => ChainsConfirm.copy({ title: "Copy invite link", message: "Text it to the league — opening it connects their phone automatically.", text: link });
            if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, manual);
            else manual();
          }}>Copy invite link</Button>
          <Button variant="ghost" size="sm" onClick={() => ChainsSync.pull()}>Sync now</Button>
          <Button variant="ghost" size="sm" onClick={exportFile}>Export league file</Button>
          <Button variant="ghost" size="sm" onClick={() => fileRef.current && fileRef.current.click()}>Import</Button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={importFile} style={{ display: "none" }} />
        </div>
      </div>
    );
  }

  /* These sections are reused by other views:
       Shame & Glory  -> Stats page
       Golden Ball     -> Clubhouse
       The Bet Board   -> Clubhouse
     so they're published on a shared namespace. */
  window.LeagueSections = {
    ShameGlory: SideBetsSection,
    GoldenBall: GoldenBallSection,
    BetBoard: BetsSection,
    Settings: SettingsSection,
  };

  /* Settings page — league admin only (members, pro pool, shared data). */
  /* Regenerate my friend code (decision 4): old code stops working immediately. */
  function RegenerateCodeRow() {
    const [busy, setBusy] = React.useState(false);
    if (!(window.ChainsFriends && ChainsFriends.available && ChainsFriends.available())) return null;
    function go() {
      ChainsConfirm.show({ title: "Regenerate your friend code?", message: "Your old QR code and link will stop working.", confirmLabel: "Regenerate", danger: true }).then(function (go) {
        if (!go) return;
        setBusy(true);
        Promise.resolve(ChainsFriends.regenerate()).then(function (next) {
          setBusy(false);
          if (next && window.ChainsToast) ChainsToast.show("New code: " + next);
        });
      });
    }
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)" }}>Friend code</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>Yours: <b style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{ChainsFriends.myCode()}</b> · regenerating retires the old one</div>
        </div>
        <button onClick={go} disabled={busy} style={{ height: 34, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", cursor: busy ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11, color: "var(--text-body)", flexShrink: 0 }}>{busy ? "…" : "Regenerate"}</button>
      </div>
    );
  }
  /* Commissioner-only: league join code + QR for the real Chains league. New
     leagueCodes/{CODE} node (rules verified); join writes BOTH membership paths
     the isolation gate + accounts system already read. */
  function LeagueCodePanel({ mobile }) {
    const LID = "chains-dgpt-2026";
    const [code, setCode] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const qrRef = React.useRef(null);
    const commish = window.ChainsID && ChainsID.isCommish && ChainsID.isCommish();
    function db() { return (window.ChainsFB && ChainsFB.ok) ? ChainsFB.db : null; }
    function myUid() { var u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); return u ? u.uid : null; }
    function refresh() {
      var d = db(); if (!d) return;
      d.ref("leagueCodes").once("value").then(function (s) {
        var all = s.val() || {}, found = null;
        Object.keys(all).forEach(function (k) { if (all[k] && all[k].leagueId === LID && all[k].active) found = k; });
        setCode(found);
      }).catch(function () {});
    }
    React.useEffect(function () { if (commish) refresh(); }, [commish]);
    React.useEffect(function () {
      if (code && qrRef.current && window.ChainsQR) {
        qrRef.current.innerHTML = "";
        try { qrRef.current.appendChild(ChainsQR.toCanvas("https://bonnaroo.github.io/chains-app/#league=" + code, mobile ? 148 : 164)); } catch (e) {}
      }
    }, [code, mobile]);
    if (!commish) return null;
    function randCode() { var AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = ""; for (var i = 0; i < 6; i++) out += AL[Math.floor(Math.random() * AL.length)]; return out; }
    function create() {
      var d = db(), uid = myUid(); if (!d || !uid) return;
      setBusy(true);
      var next = randCode();
      d.ref("leagueCodes/" + next).set({ leagueId: LID, createdBy: uid, ts: Date.now(), active: true }).then(function () {
        var old = code;
        setBusy(false); setCode(next);
        if (old) { try { d.ref("leagueCodes/" + old).remove(); } catch (e) {} }
        if (window.ChainsToast) ChainsToast.show("League code ready");
      }).catch(function () { setBusy(false); if (window.ChainsToast) ChainsToast.show("Couldn't create a code — try again.", "error"); });
    }
    function revoke() {
      var d = db(); if (!d || !code) return;
      ChainsConfirm.show({ title: "Revoke this league code?", message: "Anyone who hasn't joined yet won't be able to.", confirmLabel: "Revoke", danger: true }).then(function (go) {
        if (!go) return;
        setBusy(true);
        d.ref("leagueCodes/" + code).remove().then(function () { setBusy(false); setCode(null); if (window.ChainsToast) ChainsToast.show("Code revoked", "info"); }).catch(function () { setBusy(false); });
      });
    }
    function copy(text) { try { (window.ChainsCopy ? ChainsCopy(text) : Promise.resolve()).catch(function () {}); } catch (e) {} if (window.ChainsToast) ChainsToast.show("Copied"); }
    const link = code ? "https://bonnaroo.github.io/chains-app/#league=" + code : "";
    return (
      <Card pad={0}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>League join code</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>Commissioner-only · instant join, revocable, no expiry</div>
        </div>
        <div style={{ padding: mobile ? 14 : 18, display: "flex", flexDirection: mobile ? "column" : "row", gap: 16, alignItems: mobile ? "center" : "flex-start" }}>
          {code ? (
            <React.Fragment>
              <div ref={qrRef} style={{ width: mobile ? 148 : 164, height: mobile ? 148 : 164, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "#fff", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, letterSpacing: ".14em", color: "var(--fairway-700)" }}>{code}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={function () { copy(code); }} style={{ height: 34, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--text-body)" }}>Copy code</button>
                  <button onClick={function () { copy(link); }} style={{ height: 34, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--text-body)" }}>Copy link</button>
                  <button onClick={revoke} disabled={busy} style={{ height: 34, padding: "0 14px", border: "1px solid var(--live-500, #c2410c)", borderRadius: "var(--radius-pill)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--live-600, #c2410c)" }}>Revoke</button>
                </div>
              </div>
            </React.Fragment>
          ) : (
            <button onClick={create} disabled={busy} style={{ height: 44, padding: "0 22px", border: "none", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>{busy ? "…" : "Create a join code"}</button>
          )}
        </div>
      </Card>
    );
  }
  /* Per-member profile — anyone can edit their OWN color + nickname. Rides on
     the synced members list, so it shows up on everyone's phone. */
  function ProfileEditor({ mobile }) {
    const [, force] = React.useState(0);
    const me = ChainsID.whoami();
    // v467 hook-order fix: `m`/`nick`/effect are declared unconditionally now —
    // the early return below used to sit before them, so signed-out renders
    // called 1 hook (force) vs 3 (force, nick, effect) signed-in, tripping
    // React's "Rendered fewer hooks than expected". Rendering-only reorder.
    const m = me ? (ChainsEngine.member(me) || { id: me, name: ((window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()) || {}).username || me, disc: "#2A6FDB" }) : null;
    const [nick, setNick] = React.useState(m ? m.name : "");
    React.useEffect(() => { if (!me) return; const mm = ChainsEngine.member(me); if (mm) setNick(mm.name); }, [me]);
    if (!me) return null;
    const PALETTE = ["#E0467C", "#FF5A1F", "#F2A900", "#2FB67A", "#2A9D8F", "#2A6FDB", "#7C5CFF", "#C2410C", "#0EA5A5", "#D4456B", "#5BA978", "#8B5CF6"];
    const TEXTURES = [
      { id: "solid", label: "Solid" },
      { id: "stripes", label: "Stripes" },
      { id: "plaid", label: "Plaid" },
      { id: "dots", label: "Dots" },
      { id: "fade", label: "Fade" },
      { id: "chevron", label: "Chevron" },
    ];
    function texBg(color, tex) {
      switch (tex) {
        case "stripes": return "repeating-linear-gradient(45deg, rgba(255,255,255,.26) 0 5px, transparent 5px 11px), " + color;
        case "plaid": return "repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0 6px, transparent 6px 13px), repeating-linear-gradient(90deg, rgba(255,255,255,.20) 0 6px, transparent 6px 13px), " + color;
        case "dots": return "radial-gradient(rgba(255,255,255,.42) 1.7px, transparent 2px) 0 0/8px 8px, " + color;
        case "fade": return "linear-gradient(135deg, rgba(255,255,255,.34), rgba(0,0,0,.16)), " + color;
        case "chevron": return "repeating-linear-gradient(135deg, rgba(255,255,255,.24) 0 5px, transparent 5px 10px), repeating-linear-gradient(45deg, rgba(0,0,0,.10) 0 5px, transparent 5px 10px), " + color;
        default: return color;
      }
    }
    const initials = (m.name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const ICONS = [];
    ["a", "b", "c"].forEach((s) => { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) ICONS.push("av-" + s + r + c + ".png"); });
    const TexAvatar = ({ size, tex }) => (
      m.avatarIcon
        ? <span style={{ display: "inline-flex", width: size, height: size, borderRadius: "50%", overflow: "hidden", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.25)" }}><img src={window.ChainsAssets ? ChainsAssets.avatar(m.avatarIcon) : ((window.CHAINS_AVATARS && window.CHAINS_AVATARS[m.avatarIcon]) || ("avatars/" + m.avatarIcon))} alt="" onError={window.ChainsAssets ? ChainsAssets.onErr("avatars", m.avatarIcon) : undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
        : <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: texBg(m.disc, tex != null ? tex : (m.texture || "solid")), color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.4, boxShadow: "inset 0 0 0 2px rgba(255,255,255,.25)" }}>{initials}</span>
    );
    function patch(p) {
      ChainsEngine.upsertMember(me, p);
      try { if (window.ChainsAuth && ChainsAuth.saveProfile) ChainsAuth.saveProfile(p); } catch (e) {}
      force((x) => x + 1);
    }
    function saveNick() { const v = nick.trim(); if (v && v !== m.name) patch({ name: v }); }
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "16px" : "18px 22px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 13 }}>
          <TexAvatar size={48} />
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Your profile</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)" }}>{m.name}</div>
          </div>
        </div>
        <div style={{ padding: mobile ? "16px" : "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>Display name</label>
            <input value={nick} onChange={(e) => setNick(e.target.value)} onBlur={saveNick} maxLength={16}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              placeholder="Your name or nickname"
              style={{ display: "block", width: "100%", maxWidth: 320, marginTop: 7, height: 42, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--bg-elevated)", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>App theme</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
              {(window.ChainsTheme ? window.ChainsTheme.THEMES : []).map((th) => {
                const on = (window.ChainsTheme && window.ChainsTheme.current()) === th.id;
                return (
                  <button key={th.id} onClick={() => { window.ChainsTheme.set(th.id); force((x) => x + 1); }} title={th.label}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    <span style={{ display: "flex", width: 50, height: 50, borderRadius: "50%", overflow: "hidden", border: on ? "3px solid var(--text-strong)" : "2px solid var(--border-subtle)", boxShadow: on ? "0 0 0 2px var(--bg-elevated)" : "none" }}>
                      {th.swatch.map((c, i) => <span key={i} style={{ flex: 1, background: c }} />)}
                    </span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 9.5, color: on ? "var(--text-strong)" : "var(--text-faint)" }}>{th.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 9 }}>Your theme follows you across your devices.</div>
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>Your color</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 9 }}>
              {PALETTE.map((c) => {
                const on = (m.disc || "").toLowerCase() === c.toLowerCase();
                return (
                  <button key={c} onClick={() => patch({ disc: c })} title={c}
                    style={{ width: 34, height: 34, borderRadius: "50%", background: c, border: on ? "3px solid var(--text-strong)" : "2px solid var(--border-subtle)", cursor: "pointer", boxShadow: on ? "0 0 0 2px var(--bg-elevated)" : "none", padding: 0 }} />
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>Your texture</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
              {TEXTURES.map((t) => {
                const on = (m.texture || "solid") === t.id;
                return (
                  <button key={t.id} onClick={() => patch({ texture: t.id })} title={t.label}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    <span style={{ width: 42, height: 42, borderRadius: "50%", background: texBg(m.disc, t.id), border: on ? "3px solid var(--text-strong)" : "2px solid var(--border-subtle)", boxShadow: on ? "0 0 0 2px var(--bg-elevated)" : "none" }} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 9.5, color: on ? "var(--text-strong)" : "var(--text-faint)" }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>Your icon</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(52px, 1fr))", gap: 8, marginTop: 10, padding: "2px" }}>
              <button onClick={() => patch({ avatarIcon: null })} title="No icon"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", aspectRatio: "1", borderRadius: "50%", background: "var(--bg-sunken)", border: !m.avatarIcon ? "3px solid var(--text-strong)" : "1px solid var(--border-subtle)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, color: "var(--text-faint)" }}>OFF</button>
              {ICONS.map((ic) => {
                const on = m.avatarIcon === ic;
                return (
                  <button key={ic} onClick={() => patch({ avatarIcon: ic })}
                    style={{ padding: 0, aspectRatio: "1", borderRadius: "50%", overflow: "hidden", background: "var(--bg-elevated)", border: on ? "3px solid var(--ace-500)" : "1px solid var(--border-subtle)", cursor: "pointer", boxShadow: on ? "0 0 0 2px var(--bg-elevated)" : "none" }}>
                    <img src={window.ChainsAssets ? ChainsAssets.avatar(ic) : ((window.CHAINS_AVATARS && window.CHAINS_AVATARS[ic]) || ("avatars/" + ic))} alt="" loading="lazy" onError={window.ChainsAssets ? ChainsAssets.onErr("avatars", ic) : undefined} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                );
              })}
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 9 }}>Pick an icon for your avatar — it shows everywhere your name does. Choose OFF to use your color + texture instead.</div>
          </div>
        </div>
      </Card>
    );
  }

  function SettingsView() {
    const { mobile } = useViewport();
    if (!ChainsID.isCommish()) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SectionHeader kicker="You" title="Settings" size="lg"
            subtitle="Personalize your profile. League admin is commissioner-only." />
          <LeagueLauncher mobile={mobile} />
          <ProfileEditor mobile={mobile} />
          <RegenerateCodeRow />
          <LeagueCodePanel mobile={mobile} />
          {window.AccountPanel ? React.createElement(window.AccountPanel, { mobile: mobile }) : null}
          {window.DiscCheckSettingRow ? React.createElement(window.DiscCheckSettingRow) : null}
          <TrophyCase mobile={mobile} />
          <OwnerToolsCard mobile={mobile} />
          <Card pad={mobile ? 18 : 22}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <span style={{ width: 24, height: 24, color: "var(--text-faint)", flexShrink: 0 }}><Icons.Lock size={22} /></span>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", maxWidth: 460 }}>League setup — who's playing, the pro pool, and shared data — is commissioner-only. Switch to the commissioner from the badge at the bottom of the menu.</div>
            </div>
          </Card>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionHeader kicker="You" title="Settings" size="lg"
          subtitle="Your profile and your leagues. Open a league from My Leagues to manage it." />
        <LeagueLauncher mobile={mobile} />
        <ProfileEditor mobile={mobile} />
          <RegenerateCodeRow />
          <LeagueCodePanel mobile={mobile} />
        {window.AccountPanel ? React.createElement(window.AccountPanel, { mobile: mobile }) : null}
        {window.DiscCheckSettingRow ? React.createElement(window.DiscCheckSettingRow) : null}
        <TrophyCase mobile={mobile} />
        <OwnerToolsCard mobile={mobile} />
      </div>
    );
  }

  function TrophyCase({ mobile }) {
    const [, force] = React.useState(0);
    React.useEffect(() => {
      const fn = () => force((x) => x + 1);
      ["chains:trophies", "chains:identity", "chains:remote-update", "chains:score"].forEach((e) => window.addEventListener(e, fn));
      return () => ["chains:trophies", "chains:identity", "chains:remote-update", "chains:score"].forEach((e) => window.removeEventListener(e, fn));
    }, []);
    if (!window.ChainsTrophies) return null;
    const T = ChainsTrophies;
    const tinfo = T.tier();
    const trophies = T.list();
    const strk = T.streak();
    const reward = T.streakReward();
    const seasonW = T.seasonWins ? T.seasonWins() : 0;
    const poolW = T.poolWins ? T.poolWins() : 0;
    const earned = trophies.filter((x) => x.kind === "pool_win" || x.kind === "league_win" || x.kind === "pool_cash");
    const pct = tinfo.next ? Math.min(100, Math.round((tinfo.wins - tinfo.tier.min) / Math.max(1, tinfo.next.min - tinfo.tier.min) * 100)) : 100;
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? 16 : "18px 22px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 35% 30%, " + tinfo.tier.color + ", " + tinfo.tier.color + "99)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.3)" }}>
            <span style={{ width: 26, height: 26, color: "#fff" }}><Icons.Trophy size={24} /></span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Trophy case</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1.1 }}>{tinfo.tier.label} <span style={{ color: "var(--text-faint)", fontWeight: 600, fontSize: 14 }}>· {tinfo.wins} win{tinfo.wins === 1 ? "" : "s"}</span></div>
          </div>
        </div>
        <div style={{ padding: mobile ? 16 : "16px 22px" }}>
          {tinfo.next ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 }}>
                <span>{tinfo.toNext} more win{tinfo.toNext === 1 ? "" : "s"} to <b style={{ color: "var(--text-body)" }}>{tinfo.next.label}</b></span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{tinfo.wins}/{tinfo.next.min}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "var(--bg-sunken)", overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: tinfo.next.color, borderRadius: 4 }}></div></div>
            </div>
          ) : <div style={{ marginBottom: 14, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--gold-700, #9a7209)" }}>Top tier reached — you're a <b>Champion</b>.</div>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: earned.length ? 14 : 0 }}>
            <div style={{ flex: "1 1 110px", padding: "10px 13px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: "var(--text-strong)" }}>{seasonW}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Event win{seasonW === 1 ? "" : "s"}</div>
            </div>
            <div style={{ flex: "1 1 110px", padding: "10px 13px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: strk > 1 ? "var(--ace-500)" : "var(--text-strong)" }}>{strk}🔥</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Win streak{reward ? " · " + reward.label : ""}</div>
            </div>
            <div style={{ flex: "1 1 110px", padding: "10px 13px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: "var(--text-strong)" }}>{poolW}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Pool win{poolW === 1 ? "" : "s"}</div>
            </div>
          </div>
          {earned.length === 0 ? (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.5 }}>{seasonW > 0 ? <span>{seasonW} event win{seasonW === 1 ? "" : "s"} this season{tinfo.next ? <span> — {tinfo.toNext} more to <b style={{ color: "var(--text-body)" }}>{tinfo.next.label}</b></span> : ""}. Win a coin pool to start collecting trophies too.</span> : "No wins yet — take an event or win a coin pool to start your case. Win streaks unlock special reward avatars (coming soon)."}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {earned.slice(0, 6).map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", borderRadius: "var(--radius-md)", background: t.kind === "pool_win" || t.kind === "league_win" ? "var(--gold-50, #fbf6e9)" : "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ width: 16, height: 16, color: t.kind === "pool_cash" ? "var(--fairway-600)" : "var(--gold-600, #b8860b)", flexShrink: 0 }}><Icons.Trophy size={15} /></span>
                  <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)" }}>{t.title}</span>
                  {t.amount ? <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: "var(--fairway-700, #1f5133)" }}>+{t.amount}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  function OwnerToolsCard({ mobile }) {
    const [owner, setOwner] = React.useState(false);
    React.useEffect(() => {
      let live = true;
      if (window.ChainsAdmin && ChainsAdmin.isOwner) ChainsAdmin.isOwner().then((v) => { if (live) setOwner(!!v); });
      return () => { live = false; };
    }, []);
    if (!owner) return null;
    return (
      <Card pad={mobile ? 16 : 20}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ width: 26, height: 26, color: "var(--ace-500, #FF5A1F)", flexShrink: 0 }}><Icons.Lock size={22} /></span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 15, color: "var(--text-strong)" }}>Owner Tools</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Accounts, leagues, diagnostics & requests. Owner-only.</div>
            </div>
          </div>
          <button onClick={() => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "admin" })); } catch (e) {} }}
            style={{ height: 40, padding: "0 18px", border: "none", borderRadius: "var(--radius-md)", background: "var(--ink-900, #16221d)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>Open console</button>
        </div>
      </Card>
    );
  }

  function LeagueLauncher({ mobile }) {
    return (
      <Card pad={mobile ? 18 : 22}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 15, color: "var(--text-strong)" }}>My Leagues</span>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 5, maxWidth: 460 }}>Every league you're in, in one place. Run your own or join friends' — all live for the 2026 season.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            <button onClick={() => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "myleagues" })); } catch (e) {} }}
              style={{ padding: "11px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>My Leagues</button>
            <button onClick={() => { try { sessionStorage.setItem("chains_open_create", "1"); } catch (e) {} try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "myleagues" })); } catch (e) {} }}
              style={{ padding: "11px 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>+ Start a league</button>
          </div>
        </div>
      </Card>
    );
  }

  window.LeagueSettingsSection = SettingsSection;
  window.SettingsView = SettingsView;
  window.ProfileEditor = ProfileEditor;
})();
