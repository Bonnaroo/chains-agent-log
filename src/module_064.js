/* Chains app — Hole-by-Hole "Course" view. window.CourseView
   Phone-first illustrated course. Reads PDGA live-api (public, no key) for the
   current event's per-hole pars/distances + live scores; foregrounds our 6
   members' drafted players. Read-only — never writes league state/Firebase.
   Never blank: falls back to the illustrated course preview if no live data. */
(function () {
  const PS = () => window.ChainsProStats;

  function Countdown({ target, mobile }) {
    const [, tick] = React.useState(0);
    React.useEffect(() => { const iv = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(iv); }, []);
    if (!target || isNaN(target)) return null;
    let ms = target.getTime() - Date.now();
    if (ms <= 0) return <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, color: "var(--ace-400)", marginTop: 12 }}>Starting now…</div>;
    const d = Math.floor(ms / 86400000); ms -= d * 86400000;
    const h = Math.floor(ms / 3600000); ms -= h * 3600000;
    const m = Math.floor(ms / 60000); ms -= m * 60000;
    const s = Math.floor(ms / 1000);
    const cell = (n, l) => (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: mobile ? 26 : 30, color: "var(--bone-50)", lineHeight: 1 }}>{String(n).padStart(2, "0")}</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 9, color: "var(--chain-400)", marginTop: 4 }}>{l}</span>
      </div>
    );
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: mobile ? 10 : 16, marginTop: 16 }}>
        {cell(d, "Days")}{cell(h, "Hrs")}{cell(m, "Min")}{cell(s, "Sec")}
      </div>
    );
  }
  window.ChainsCountdown = Countdown;
  function Empty({ title, sub }) {
    return (
      <div style={{ padding: "22px 16px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 14, color: "var(--text-muted)" }}>{title}</div>
        {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", marginTop: 5 }}>{sub}</div>}
      </div>
    );
  }
  const HOLE_IMG = (h) => (window.ChainsAssets ? ChainsAssets.hole(h) : ((window.CHAINS_HOLES && window.CHAINS_HOLES[h]) || ("holes/hole-" + h + ".png")));
  const LIVE = "https://www.pdga.com/apps/tournament/live-api/";
  // LIVE scoring source: Firebase /live, written every ~25s by the always-on
  // poller (poller -> PDGA -> Firebase /live -> app). Same schema as before.
  // The app NEVER writes here — the poller owns it.
  const LIVE_JSON = "https://chains-fantasy-default-rtdb.firebaseio.com/live.json";
  // Per-round archive the poller/pipeline may write at round close, same shape.
  const ROUNDS_BASE = "https://chains-fantasy-default-rtdb.firebaseio.com/rounds";
  // relative "updated Xs/m ago" label
  function relTime(d) {
    if (!d) return "";
    const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (s < 10) return "just now";
    if (s < 60) return s + "s ago";
    const m = Math.round(s / 60);
    if (m < 60) return m + "m ago";
    return d.toLocaleTimeString();
  }
  // Baked-in hole pars/distances per RESULTS event id, as a guaranteed fallback
  // when PDGA's layout endpoint is unreachable (CORS) — live layout overrides it.
  // Shape: { "<eventId>": { unit:"m"|"ft", holes:[{hole,par,length}, ...18] } }
  const BAKED_LAYOUTS = (window.CHAINS_LAYOUTS) || {
    // European Open — "The Rockstar", Tallinn (R1/R2 layout, par 63, 3085 m)
    "97339": { unit: "m", holes: [
      { hole: 1, par: 4, length: 259 }, { hole: 2, par: 3, length: 97 }, { hole: 3, par: 3, length: 105 },
      { hole: 4, par: 3, length: 133 }, { hole: 5, par: 4, length: 232 }, { hole: 6, par: 4, length: 204 },
      { hole: 7, par: 3, length: 109 }, { hole: 8, par: 3, length: 125 }, { hole: 9, par: 4, length: 203 },
      { hole: 10, par: 3, length: 132 }, { hole: 11, par: 4, length: 225 }, { hole: 12, par: 4, length: 252 },
      { hole: 13, par: 4, length: 244 }, { hole: 14, par: 5, length: 320 }, { hole: 15, par: 3, length: 95 },
      { hole: 16, par: 3, length: 103 }, { hole: 17, par: 3, length: 93 }, { hole: 18, par: 3, length: 154 },
    ] },
    // Swedish Open — Järva DiscGolfPark, Borås area (par 61, 2417 m). From /live.
    "96411": { unit: "m", holes: [
      { hole: 1, par: 3, length: 124 }, { hole: 2, par: 3, length: 109 }, { hole: 3, par: 3, length: 90 },
      { hole: 4, par: 4, length: 185 }, { hole: 5, par: 4, length: 219 }, { hole: 6, par: 3, length: 108 },
      { hole: 7, par: 3, length: 112 }, { hole: 8, par: 3, length: 102 }, { hole: 9, par: 4, length: 222 },
      { hole: 10, par: 4, length: 145 }, { hole: 11, par: 3, length: 112 }, { hole: 12, par: 4, length: 179 },
      { hole: 13, par: 3, length: 116 }, { hole: 14, par: 3, length: 98 }, { hole: 15, par: 4, length: 179 },
      { hole: 16, par: 3, length: 110 }, { hole: 17, par: 3, length: 82 }, { hole: 18, par: 4, length: 235 },
    ] },
  };
  function bakedLayout(eventId) {
    const e = eventId && BAKED_LAYOUTS[String(eventId)];
    if (!e || !e.holes) return null;
    return e.holes.map((h) => ({ hole: h.hole, par: h.par != null ? h.par : null, length: h.length != null ? h.length : null, unit: h.unit || e.unit || null }));
  }
  const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  // ---- golf scoring iconography ------------------------------------------
  function scoreKind(strokes, par) {
    if (strokes == null || par == null) return null;
    const d = strokes - par;
    if (d <= -2) return "eagle"; if (d === -1) return "birdie"; if (d === 0) return "par"; if (d === 1) return "bogey"; return "dbogey";
  }
  // "17:50:00" -> "5:50 pm"
  function fmtTee(t) {
    if (!t) return null;
    const p = String(t).split(":"); const h = Number(p[0]); if (isNaN(h)) return null;
    return (h % 12 || 12) + ":" + String(p[1] || "00").padStart(2, "0") + " " + (h >= 12 ? "pm" : "am");
  }
  // Scorecard secondary line: when a player tees off / how far through they are.
  function courseWhen(p) {
    if (!p) return null;
    if (p.completed) return null;
    if ((p.played || 0) > 0) return "Thru " + p.played;
    if (p.teeTime) { const t = fmtTee(p.teeTime); return t ? ("Tees " + t) : null; }
    return null;
  }
  // Compact live-throw blurb for the Course illustration cards. CIRCLE = DISTANCE
  // (PDGA defines C1 ≤ 33ft, C2 33–66ft) — never the ZoneID code, which is unreliable
  // for putts. Approach labels only when the collector supplies a confirmed
  // cur_zone_label (we never guess fairway/OB from the numeric code).
  function compactStatus(ts, par) {
    if (!ts) return null;
    const d = ts.toTarget, zl = ts.zoneLabel, tc = ts.throwCount;
    if (d != null && d > 0) {
      if (d <= 66) {
        // a putt (circle by DISTANCE). Add score context when we know the lie + par:
        // lying tc, so making this putt = tc+1 strokes.
        let sw = null;
        if (par != null && tc != null) { const s = (tc + 1) - par; sw = s <= -2 ? "eagle" : s === -1 ? "birdie" : s === 0 ? "par" : s === 1 ? "bogey" : null; }
        return sw ? (Math.round(d) + "' for " + sw) : (Math.round(d) + "' putt");
      }
      return Math.round(d) + "ft out";
    }
    if (zl) { const z = String(zl).toLowerCase(); if (z === "parked") return "Parked"; if (z.indexOf("out of bounds") >= 0 || z === "ob") return "OB"; if (z.indexOf("off") >= 0) return "Off fwy"; if (z.indexOf("fairway") >= 0) return "Fairway"; return zl; }
    if (tc != null) return "throw " + tc;
    return null;
  }
  // chip: owning member color + player initials + stroke, shape encodes score
  function ChipShape({ kind, color, children }) {
    const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "#fff", background: color, position: "relative", flexShrink: 0 };
    if (kind === "par") return <span style={{ ...base, borderRadius: 6 }}>{children}</span>;
    if (kind === "birdie") return <span style={{ ...base, borderRadius: "50%" }}>{children}</span>;
    if (kind === "eagle") return <span style={{ ...base, borderRadius: "50%", boxShadow: "0 0 0 2px var(--bg-elevated), 0 0 0 3.5px " + color }}>{children}</span>;
    if (kind === "bogey") return <span style={{ ...base, borderRadius: 3 }}>{children}</span>;
    if (kind === "dbogey") return <span style={{ ...base, borderRadius: 3, boxShadow: "0 0 0 2px var(--bg-elevated), 0 0 0 3.5px " + color }}>{children}</span>;
    return <span style={{ ...base, borderRadius: 6, opacity: .4 }}>{children}</span>;
  }
  function initialsOf(n) { return (n || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }

  // ---- our tracked players (6 members x 2 picks) -------------------------
  function trackedPlayers(slot) {
    const members = ChainsEngine.members();
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const nameToPdga = {}; (window.MPO_PLAYERS || []).forEach((p) => { if (p.pdga != null) nameToPdga[p.name] = String(p.pdga); });
    const out = [];
    picks.forEach((row) => {
      const m = members.find((x) => x.id === row.m);
      [row.p1, row.p2].forEach((nm) => {
        if (!nm) return;
        out.push({ member: m, name: nm, pdga: nameToPdga[nm] || null, norm: norm(nm) });
      });
    });
    return out;
  }

  // ---- PDGA live fetch ----------------------------------------------------
  // Try direct first (works on the GitHub Pages host). If the browser blocks it
  // cross-origin, retry through CORS proxies. Promise.race guarantees each
  // attempt settles within its timeout, so the UI can never hang on "loading".
  function fetchOne(url, ms) {
    return Promise.race([
      fetch(url, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject("http " + r.status); }),
      new Promise(function (_, rej) { setTimeout(function () { rej("timeout"); }, ms || 8000); }),
    ]);
  }
  function fetchJSON(url) {
    return fetchOne(url, 8000)
      .catch(function () { return fetchOne("https://corsproxy.io/?url=" + encodeURIComponent(url), 10000); })
      .catch(function () { return fetchOne("https://api.allorigins.win/raw?url=" + encodeURIComponent(url), 11000); });
  }

  function CourseView() {
    const { mobile } = useViewport();
    const meta = ChainsEngine.seasonMeta();
    const slot = meta.live || meta.next;
    const [liveEvent, setLiveEvent] = React.useState(null);
    // If /live is still serving an event our engine has already SCORED (finalized),
    // it's really over — roll the view to the next event's "awaiting" state.
    const liveEvScored = liveEvent && liveEvent.t && ChainsEngine.eventResults(liveEvent.t) && ChainsEngine.eventResults(liveEvent.t).scored;
    const rolloverNext = (!meta.live || liveEvScored) ? meta.next : null;
    const eventId = (liveEvent && liveEvent.eventId) || (slot && PS() ? PS().resultsIdForSlot(slot.t) : null);
    window.__chainsBakedLayout = bakedLayout(eventId);

    const [tab, setTab] = React.useState("course");
    const [round, setRound] = React.useState(null);     // active round number
    const [maxRound, setMaxRound] = React.useState(1);
    const [players, setPlayers] = React.useState(null);  // live player rows
    const [layout, setLayout] = React.useState(null);    // [{hole,par,length}]
    const [pools, setPools] = React.useState(null);      // v473: multi-course rounds
    const [status, setStatus] = React.useState("loading"); // loading|preview|live|done
    const [updated, setUpdated] = React.useState(null);
    const [pending, setPending] = React.useState(null); // {round, teeTime} when next round not teed
    const [viewRound, setViewRound] = React.useState(null); // round selected in score tabs (null = latest/live)
    const [roundCache, setRoundCache] = React.useState({}); // roundNum -> parsed players (past rounds)
    const [roundsMeta, setRoundsMeta] = React.useState(null); // {list, currentRound, currentLabel, index, count}
    const [diag, setDiag] = React.useState({});
    const [, setTick] = React.useState(0);
    React.useEffect(() => { const iv = setInterval(() => { if (!document.hidden) setTick((x) => x + 1); }, 20000); return () => clearInterval(iv); }, []);
    const setD = (o) => setDiag((d) => ({ ...d, ...o, at: new Date().toLocaleTimeString() }));
    const viewingLatestRef = React.useRef(true); // false when user reviews an older round

    // initial load + poll: read live.json from GitHub (same-origin-ish raw file,
    // no CORS, no proxies). It carries the CURRENT round's full hole-by-hole data.
    React.useEffect(() => {
      if (!eventId) { setStatus("preview"); return; }
      let alive = true;
      const watchdog = setTimeout(() => { if (alive) setStatus((st) => st === "loading" ? "preview" : st); }, 15000);
      loadLive();
      return () => { alive = false; clearTimeout(watchdog); };
    }, [eventId]);

    function loadLive() {
      setD({ eventId: eventId, step: "fetching live.json…" });
      // Robust fetch: read as TEXT so we can salvage a feed with Git merge-conflict
      // markers (<<<<<<< ======= >>>>>>>) by keeping the first conflict side.
      return fetch(LIVE_JSON, { cache: "no-store" })
        .then((r) => r.ok ? r.text() : Promise.reject("http " + r.status))
        .then((text) => {
          let j = null, salvaged = false;
          try { j = JSON.parse(text); }
          catch (e) {
            if (/^<{7}|^={7}|^>{7}/m.test(text)) {
              // strip conflict markers + the second side, keep the "ours"/first block
              const cleaned = text
                .replace(/^<{7}.*$/gm, "")
                .replace(/^={7}[\s\S]*?^>{7}.*$/gm, "")
                .replace(/^>{7}.*$/gm, "");
              try { j = JSON.parse(cleaned); salvaged = true; } catch (e2) { j = null; }
            }
          }
          if (!j) throw new Error("invalid JSON" + (/<{7}|={7}|>{7}/.test(text) ? " (merge conflict in live.json)" : ""));
          // Follow /live's event: the poller switches it to the current event by
          // date, so the Live Course rolls over the instant the poller does (even
          // before the app auto-finalizes the prior event). Adopt its id + name.
          if (j.event_id != null) {
            const liveT = window.ChainsAutoFinalize ? window.ChainsAutoFinalize.slotForEventId(String(j.event_id)) : null;
            setLiveEvent({ eventId: String(j.event_id), name: j.event_name || (slot && slot.name) || "", t: liveT });
          }
          const parsed = parseLive(j);
          if (!parsed || !parsed.players.length) { setD({ liveJsonOk: true, players: 0 }); useCachedOrPreview(); return; }
          if (parsed.holes && parsed.holes.some((h) => h.par != null)) setLayout(parsed.holes);
          setPools(parsed.pools || null);
          if (parsed.roundsList) setRoundsMeta({ list: parsed.roundsList, currentRound: parsed.currentRound, currentLabel: parsed.currentRoundLabel, index: parsed.roundIndex, count: parsed.roundCount });
          setMaxRound(Math.max(parsed.rounds || 0, parsed.latestRound || 0, 1));
          setRound(parsed.effectiveRound || 1);
          setPlayers(parsed.players);
          const allDone = parsed.players.every((p) => p.completed);
          const anyScores = parsed.latestStarted;
          // latest round hasn't started -> show the completed round as "done",
          // with a pending note that the next round is upcoming.
          if (!anyScores && parsed.latestRound > parsed.effectiveRound) {
            setPending({ round: parsed.latestRound, teeTime: null });
            setStatus(parsed.highestCompletedRound > 0 ? "done" : "preview");
          } else {
            setPending(null);
            setStatus(anyScores ? (allDone ? "done" : "live") : "preview");
          }
          setUpdated(parsed.updatedAt ? new Date(parsed.updatedAt) : new Date());
          // cache last-good so a later broken feed can't blank the page.
          // Stamp it with the event id so a cache from a PRIOR event (e.g. the
          // European Open after rollover to the Swedish Open) is never painted
          // against the current slot — that produced ghost scores like a finished
          // player reading "-7" on a hole the live field is only now reaching.
          try { localStorage.setItem("chains_live_lastgood", JSON.stringify({ at: Date.now(), eventId: (j.event_id != null ? String(j.event_id) : null), data: j })); } catch (e) {}
          setD({ liveJsonOk: true, salvaged: salvaged, players: parsed.players.length, latestRound: parsed.latestRound, withScores: parsed.players.filter((p) => p.played > 0).length, updatedAt: parsed.updatedAt });
        })
        .catch((e) => { setD({ liveJsonOk: false, err: String(e) }); useCachedOrPreview(String(e)); });
    }

    // Fall back to the last-good cached feed when the live one is broken/empty,
    // so "we lost the data" never happens for a transient bad file.
    function useCachedOrPreview(errMsg) {
      try {
        const c = JSON.parse(localStorage.getItem("chains_live_lastgood") || "null");
        if (c && c.data) {
          // Never paint a cache from a DIFFERENT event than the one we're showing.
          // On rollover the prior event's finished feed would otherwise flash here
          // (e.g. a player at -7 placed on hole 2) until the live fetch lands.
          const cachedEvent = (c.eventId != null) ? String(c.eventId)
            : (c.data && c.data.event_id != null) ? String(c.data.event_id) : null;
          if (eventId && cachedEvent && cachedEvent !== String(eventId)) {
            setStatus((st) => st === "loading" ? "preview" : st);
            return;
          }
          const parsed = parseLive(c.data);
          if (parsed && parsed.players.length) {
            if (parsed.holes && parsed.holes.some((h) => h.par != null)) setLayout(parsed.holes);
            setPools(parsed.pools || null);
            setMaxRound(Math.max(parsed.rounds || 0, parsed.latestRound || 0, 1));
            setRound(parsed.latestRound || 1);
            setPlayers(parsed.players);
            const allDone = parsed.players.every((p) => p.completed);
            const anyScores = parsed.players.some((p) => p.played > 0);
            setStatus(anyScores ? (allDone ? "done" : "live") : "preview");
            setUpdated(new Date(c.at));
            setD({ usingCache: true, cachedAt: new Date(c.at).toLocaleTimeString(), err: errMsg || null });
            return;
          }
        }
      } catch (e) {}
      setStatus((st) => st === "loading" ? "preview" : st);
    }

    // Load a PAST round's hole-by-hole from the archive the poller writes to
    // Firebase /rounds/{key}.json (key from rounds_list, e.g. "97339-r3").
    function loadPastRound(rd) {
      if (rd == null || roundCache[rd]) return;
      const item = roundsMeta && roundsMeta.list && roundsMeta.list.find((r) => r.n === rd);
      const key = item ? item.key : (eventId + "-r" + rd);
      const url = ROUNDS_BASE + "/" + key + ".json";
      fetch(url, { cache: "no-store" })
        .then((r) => r.ok ? r.text() : Promise.reject("http " + r.status))
        .then((text) => { let j; try { j = JSON.parse(text); } catch (e) { j = null; } if (!j) return; const parsed = parseLive(j); if (parsed && parsed.players.length) setRoundCache((c) => ({ ...c, [rd]: parsed.players })); })
        .catch(() => { setRoundCache((c) => ({ ...c, [rd]: "none" })); });
    }
    // rows to show in the score tabs for the selected round
    const shownRound = viewRound == null ? round : viewRound;
    // The LIVE round is whichever rounds_list entry equals current_round (handles
    // Finals = 12). A round is read from /live only when it IS that live round;
    // every finished round reads its /rounds/{key} archive.
    const liveRoundN = (roundsMeta && roundsMeta.currentRound != null) ? roundsMeta.currentRound : round;
    const isLatest = (shownRound === liveRoundN) && (status === "live" || status === "done") && players != null && players.some((p) => p.played > 0);
    const roundRows = isLatest ? players : (roundCache[shownRound] && roundCache[shownRound] !== "none" ? roundCache[shownRound] : null);
    const roundMissing = !isLatest && roundCache[shownRound] === "none";
    // Load a finished round's archive whenever it's the one being shown.
    React.useEffect(() => {
      if (shownRound != null && !isLatest) loadPastRound(shownRound);
    }, [shownRound, isLatest, roundsMeta]);

    // Event TOTAL through the selected round (cumulative). The archives' own
    // event_to_par is unreliable, so we sum each round's round_to_par per PDGA
    // across rounds_list up to (and including) the shown round. Load any missing
    // prior rounds. Keyed by pdga; reliable.
    const orderedRounds = (roundsMeta && roundsMeta.list) ? roundsMeta.list.map((r) => r.n) : [shownRound];
    const upToRounds = orderedRounds.filter((n) => orderedRounds.indexOf(n) <= orderedRounds.indexOf(shownRound));
    React.useEffect(() => {
      upToRounds.forEach((n) => { if (n !== liveRoundN && !roundCache[n]) loadPastRound(n); });
    }, [shownRound, roundsMeta, liveRoundN]);
    const cumByPdga = React.useMemo(() => {
      const cum = {};
      upToRounds.forEach((n) => {
        const rows = (n === liveRoundN) ? players : (Array.isArray(roundCache[n]) ? roundCache[n] : null);
        if (!rows) return;
        rows.forEach((p) => { if (p.pdga != null && p.toPar != null) cum[String(p.pdga)] = (cum[String(p.pdga)] || 0) + Number(p.toPar); });
      });
      return cum;
    }, [shownRound, players, roundCache, liveRoundN, roundsMeta]);

    // Round tabs + indicator come from the poller's rounds_list (handles Finals
    // numbered e.g. 12). Fall back to numeric R1..maxRound if rounds_list absent.
    const roundTabs = (roundsMeta && roundsMeta.list && roundsMeta.list.length)
      ? roundsMeta.list.map((r) => ({ n: r.n, label: r.label, abbr: mobile ? r.abbr : r.label }))
      : (maxRound > 1 ? Array.from({ length: maxRound }, (_, i) => ({ n: i + 1, label: "Round " + (i + 1), abbr: "R" + (i + 1) })) : []);
    const shownTab = roundTabs.find((t) => t.n === shownRound);
    const roundIndicator = (roundsMeta && roundsMeta.currentLabel)
      ? (roundsMeta.currentLabel + (roundsMeta.count ? " · " + roundsMeta.index + " of " + roundsMeta.count : "") + (status === "live" ? " · Live" : status === "done" ? " · Final" : ""))
      : ((shownTab ? shownTab.label : "Round " + round) + (status === "live" ? " · Live" : status === "done" ? " · Final" : ""));

    function applyRows(rows, rd, isLive) {
      setPlayers(rows);
      if (!layout) { const L = layoutFromPlayers(rows); if (L) setLayout(L); }
      const allDone = rows.every((p) => p.completed);
      const anyScores = rows.some((p) => p.played > 0);
      setStatus(anyScores ? (isLive && !allDone ? "live" : "done") : "preview");
      setUpdated(new Date());
    }

    // live poll — re-read live.json every 60s; pause when the tab isn't visible.
    React.useEffect(() => {
      const pollable = (status === "live") || (status === "done");
      if (!pollable || !eventId) return;
      const iv = setInterval(() => {
        if (document.hidden) return;
        loadLive();
      }, 25000);
      // refresh the moment the user returns to the tab (phone wake / app switch)
      const onVis = () => { if (!document.hidden) loadLive(); };
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("focus", onVis);
      return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis); };
    }, [status, eventId]);

    if (!slot) {
      const _m = ChainsEngine.seasonMeta(); const _over = !!(_m.total && _m.completed >= _m.total);
      const _yr = (ChainsEngine.SEED && ChainsEngine.SEED.SEASON_YEAR) || new Date().getFullYear();
      return <div style={{ padding: 20 }}><SectionHeader kicker="Hole by hole" title="Live Chains" size="lg" subtitle={_over ? ("Season complete \u2014 see you in " + (_yr + 1)) : undefined} /><Card pad={26}><Empty title={_over ? (_yr + " season complete") : "No event this week"} sub={_over ? ("Live coverage returns with the " + (_yr + 1) + " DGPT schedule. Every " + _yr + " round is under Standings \u2192 Schedule.") : undefined} /></Card></div>;
    }

    const tracked = trackedPlayers(slot);
    // join live rows to tracked players
    const liveByKey = {};
    (players || []).forEach((p) => { if (p.pdga) liveByKey["p" + p.pdga] = p; liveByKey["n" + p.norm] = p; });
    // Picks not in our MPO roster carry no pdga (they're matched by name). Adopt
    // the matched live row's pdga so pdga-keyed lookups (the EVENT total, via
    // cumByPdga) resolve for them too — otherwise their event column shows "—".
    tracked.forEach((t) => { if (t.pdga == null) { const lp = liveByKey["n" + t.norm]; if (lp && lp.pdga != null) t.pdga = String(lp.pdga); } });
    const trackedLive = tracked.map((t) => {
      const lp = (t.pdga && liveByKey["p" + t.pdga]) || liveByKey["n" + t.norm] || null;
      return { ...t, live: lp };
    });
    // lookup so hole cards + grids can flag a field player as ONE OF OURS (member color)
    const ourByKey = {};
    const flKey = (s) => { const w = String(s || "").split(" ").filter(Boolean); return w.length >= 2 ? w[0] + " " + w[w.length - 1] : (s || ""); };
    tracked.forEach((t) => { if (t.member) { if (t.pdga) ourByKey["p" + t.pdga] = t.member; ourByKey["n" + t.norm] = t.member; ourByKey["f" + flKey(t.norm)] = t.member; } });
    const ownerOf = (p) => (p && p.pdga && ourByKey["p" + p.pdga]) || (p && ourByKey["n" + p.norm]) || (p && ourByKey["f" + flKey(p.norm)]) || null;

    // build the league-tracked shape for an arbitrary round's rows (past rounds)
    function roundTracked(rows) {
      const byKey = {};
      const fl = (s) => { const w = String(s || "").split(" ").filter(Boolean); return w.length >= 2 ? w[0] + " " + w[w.length - 1] : (s || ""); };
      (rows || []).forEach((p) => { if (p.pdga) byKey["p" + p.pdga] = p; byKey["n" + p.norm] = p; byKey["f" + fl(p.norm)] = p; });
      return tracked.map((t) => ({ ...t, live: (t.pdga && byKey["p" + t.pdga]) || byKey["n" + t.norm] || byKey["f" + fl(t.norm)] || null }));
    }

    // ---- ROLLED OVER: the live event is finalized → await the next event ----
    if (rolloverNext && (liveEvScored || (status !== "live" && status !== "done"))) {
      const ne = rolloverNext;
      const sd = ne.start_date ? new Date(ne.start_date + "T00:00:00") : null;
      const dateStr = sd && !isNaN(sd) ? sd.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : null;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 14 : 18 }}>
          <SectionHeader kicker="Live · hole by hole" title="Live Chains" size="lg" subtitle="Between tournaments — next event coming up" />
          <SubTabsLocal value={tab} onChange={setTab} items={[{ id: "course", label: "Countdown" }, { id: "field", label: "Registered" }]} />
          {tab === "field" ? <PlayersHub /> : (
            <React.Fragment>
              <div style={{ padding: mobile ? "22px 18px" : "30px 26px", borderRadius: "var(--radius-lg)", background: "var(--bg-ink)", color: "var(--bone-50)", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", fontSize: 11, color: "var(--chain-300)" }}>Awaiting next tournament</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, color: "var(--bone-50)", marginTop: 6, lineHeight: 1.05 }}>{ne.name}</div>
                {dateStr && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--chain-200, #cfe0d6)", marginTop: 8 }}>Tees off <b style={{ color: "var(--bone-50)" }}>{dateStr}</b></div>}
                <Countdown target={sd} mobile={mobile} />
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 16, maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>Live hole-by-hole coverage begins when the first player throws. The last event's full results &amp; every round are on <b style={{ color: "var(--ace-400)" }}>Standings → Schedule</b>.</div>
              </div>
              {window.ChainsWeather ? React.createElement(window.ChainsWeather, { slot: ne, mobile: mobile }) : null}
            </React.Fragment>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 14 : 18 }}>
        <SectionHeader kicker="Live · hole by hole" title={"T" + ((liveEvent && liveEvent.t) || slot.t) + " · " + ((liveEvent && liveEvent.name) || slot.name || "")} size="lg"
          subtitle={status === "live" ? "Live · Round " + round + " · weather, race & scorecard update as scores post" : status === "done" ? "Round " + round + " · final" : status === "loading" ? "Loading…" : (!meta.live ? "Next up — live coverage begins when play starts" : "Course preview · live when play starts")} />

        {/* tabs + round switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <SubTabsLocal value={tab} onChange={setTab} items={[{ id: "course", label: "Course" }, { id: "grid", label: "Our League" }, { id: "full", label: "Full Field" }, { id: "field", label: "Registered" }]} />
          {round && tab !== "field" && (
            <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: "var(--radius-pill)", background: status === "live" ? "var(--live-50, #fdecea)" : "var(--bg-sunken)", border: "1px solid " + (status === "live" ? "var(--live-200, #f3c4bf)" : "var(--border-default)") }}>
                {status === "live" && <span className="cw-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live-500, #e0483d)" }} />}
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: status === "live" ? "var(--live-700, #b23227)" : "var(--text-muted)" }}>{roundIndicator}</span>
              </span>
            </div>
          )}
        </div>

        {tab === "field" ? (
          <PlayersHub />
        ) : status === "loading" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[0, 1, 2].map((i) => <div key={i} className="cw-skel" style={{ height: 150, borderRadius: "var(--radius-lg)" }} />)}</div>
        ) : (
          <React.Fragment>
            {window.ChainsWeather ? React.createElement(window.ChainsWeather, { slot: slot, mobile: mobile }) : null}
            {window.ThisWeekView ? React.createElement(window.ThisWeekView, { embedded: true }) : null}
            {pending && status !== "live" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--fairway-50)", border: "1px solid var(--fairway-200)" }}>
                <span style={{ width: 16, height: 16, color: "var(--fairway-700)" }}><Icons.Target size={16} /></span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--fairway-800)" }}>Round {pending.round}{pending.teeTime ? <span> tees off at <b>{String(pending.teeTime).slice(0, 5)}</b> (Tallinn)</span> : ""} — live hole tracking begins then. Showing Round {round} below.</span>
              </div>
            )}
            {(status === "preview") && (() => {
              const awaiting = !meta.live; // no event live right now → this slot is upcoming
              const sd = slot && slot.start_date ? new Date(slot.start_date + "T00:00:00") : null;
              const dateStr = sd && !isNaN(sd) ? sd.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : null;
              const evName = (liveEvent && liveEvent.name) || (slot && slot.name) || "the next event";
              if (awaiting) {
                return (
                  <div style={{ padding: mobile ? "20px 18px" : "26px 24px", borderRadius: "var(--radius-lg)", background: "var(--bg-ink)", color: "var(--bone-50)", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".14em", fontSize: 11, color: "var(--chain-300)" }}>Awaiting next tournament</div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, color: "var(--bone-50)", marginTop: 6, lineHeight: 1.05 }}>{evName}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--chain-200, #cfe0d6)", marginTop: 10, maxWidth: 360, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                      {dateStr ? <span>Tees off <b style={{ color: "var(--bone-50)" }}>{dateStr}</b>. Live hole-by-hole coverage begins when the first player throws.</span> : "Live hole-by-hole coverage begins when the event starts."}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 14 }}>Last event wrapped? Full results &amp; every round are on the <b style={{ color: "var(--ace-400)" }}>Standings → Schedule</b> tab.</div>
                  </div>
                );
              }
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--ace-100)", border: "1px solid var(--ace-200)" }}>
                  <span style={{ width: 16, height: 16, color: "var(--ace-600)" }}><Icons.Target size={16} /></span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ace-800)" }}>Hole-by-hole <b>live when play starts</b> — scores drop onto the course as players finish each hole.</span>
                </div>
              );
            })()}
            {tab === "course"
              ? <CourseHoles layout={layout} pools={pools} field={players} extraRounds={roundCache} ownerOf={ownerOf} status={status} mobile={mobile} />
              : (
                <React.Fragment>
                  {roundTabs.length > 1 && (
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {roundTabs.map((rt) => {
                        const on = (shownRound === rt.n);
                        const isLive = rt.n === liveRoundN && status === "live";
                        return <button key={rt.n} onClick={() => setViewRound(rt.n === round ? null : rt.n)}
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 13px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          {isLive && <span className="cw-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#fff" : "var(--live-500, #e0483d)" }} />}{rt.abbr}</button>;
                      })}
                    </div>
                  )}
                  {roundMissing ? (
                    <Card pad={26}><Empty title={"Round " + shownRound + " not archived yet"} sub="Hole-by-hole for past rounds appears once the pipeline saves each round. The live round always shows in full." /></Card>
                  ) : tab === "grid"
                    ? <ScorecardGrid trackedLive={isLatest ? trackedLive : roundTracked(roundRows)} layout={layout} cumByPdga={cumByPdga} mobile={mobile} />
                    : <FullScorecard field={roundRows} layout={layout} ownerOf={ownerOf} cumByPdga={cumByPdga} mobile={mobile} />}
                </React.Fragment>
              )}
            {updated && <button onClick={() => loadLive()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "2px auto 8px", padding: "5px 12px", background: "transparent", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>
              <span style={{ width: 12, height: 12, display: "inline-flex" }}><Icons.Refresh size={12} /></span>
              Updated {relTime(updated)}{status === "live" ? " · tap to refresh" : ""}
            </button>}
          </React.Fragment>
        )}
      </div>
    );
  }

  function SubTabsLocal({ items, value, onChange }) {
    return (
      <div style={{ display: "inline-flex", gap: 3, padding: 3, background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)" }}>
        {items.map((it) => {
          const on = it.id === value;
          return <button key={it.id} onClick={() => onChange(it.id)} style={{ height: 32, padding: "0 16px", border: "none", borderRadius: "var(--radius-pill)", background: on ? "var(--bg-elevated)" : "transparent", boxShadow: on ? "var(--shadow-sm)" : "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, color: on ? "var(--text-strong)" : "var(--text-muted)" }}>{it.label}</button>;
        })}
      </div>
    );
  }

  // ---- league race (combined to-par per member, live) --------------------
  function LeagueRace({ tracked, mobile }) {
    const members = ChainsEngine.members();
    const byMember = {};
    tracked.forEach((t) => {
      if (!t.member) return;
      const id = t.member.id;
      byMember[id] = byMember[id] || { m: t.member, vals: [], any: false };
      // race = combined EVENT standing of a member's two picks (always populated
      // for anyone in the field); fall back to round-to-par if event is missing.
      if (t.live) {
        const v = (t.live.eventToPar != null) ? t.live.eventToPar : (t.live.toPar != null ? t.live.toPar : null);
        if (v != null) { byMember[id].vals.push(v); byMember[id].any = true; }
      }
    });
    const rows = members.map((m) => {
      const e = byMember[m.id];
      const vals = e ? e.vals : [];
      return { m, combined: vals.length ? vals.reduce((a, b) => a + b, 0) : null, has: vals.length > 0 };
    }).sort((a, b) => (a.combined == null) - (b.combined == null) || (a.combined - b.combined) || a.m.name.localeCompare(b.m.name));
    const fmt = (v) => v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    const col = (v) => v == null ? "var(--text-faint)" : v < 0 ? "var(--fairway-600)" : v > 0 ? "var(--clay-600, #b4452f)" : "var(--text-muted)";
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "12px 14px 8px" : "14px 20px 10px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)" }}>League Race · live</div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 1, background: "var(--border-subtle)" }}>
          {rows.map((r, i) => (
            <div key={r.m.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px", background: "var(--bg-elevated)", borderLeft: "3px solid " + r.m.disc }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 && r.has ? "var(--fairway-600)" : "var(--text-faint)", minWidth: 16 }}>{r.has ? i + 1 : "·"}</span>
              <Avatar name={r.m.name} color={r.m.disc} size={24} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.m.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: col(r.combined) }}>{fmt(r.combined)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ---- live-now strip -----------------------------------------------------
  function LiveNow({ tracked, mobile }) {
    const onCourse = tracked.filter((t) => t.live && t.live.played > 0 && !t.live.completed);
    if (!onCourse.length) return null;
    const fmt = (v) => v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "12px 14px 8px" : "14px 20px 10px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)" }}>On the course now</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {onCourse.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <Avatar name={t.member ? t.member.name : t.name} color={t.member ? t.member.disc : "var(--chain-400)"} size={22} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>thru {t.live.played} <span style={{ color: "var(--text-faint)" }}>(on {t.live.played + 1})</span></span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: t.live.toPar < 0 ? "var(--fairway-600)" : t.live.toPar > 0 ? "var(--clay-600, #b4452f)" : "var(--text-muted)", minWidth: 30, textAlign: "right" }}>{fmt(t.live.toPar)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ---- the illustrated course (PRO field, hole by hole) ------------------
  function CourseHoles({ layout, pools, field, extraRounds, ownerOf, status, mobile }) {
    const [half, setHalf] = React.useState("front");
    const [dense, setDense] = React.useState(false); // phone: false = single, true = double
    // v473: Worlds splits the field over TWO courses and the pools SWAP each
    // round, so a single unlabelled hole list was right for only half the field
    // and silently changed course between rounds. Pick a pool; its layout and
    // its players drive the cards.
    const multi = Array.isArray(pools) && pools.length > 1;
    const [poolIdx, setPoolIdx] = React.useState(0);
    const activePool = multi ? (pools[poolIdx] || pools[0]) : null;
    if (activePool && Array.isArray(activePool.holes) && activePool.holes.length) {
      layout = activePool.holes.map((h, i) => ({
        hole: Number(String(h.hole != null ? h.hole : (i + 1)).replace(/\D/g, "")) || (i + 1),
        par: h.par != null ? Number(h.par) : null,
        length: h.length != null ? Number(h.length) : null,
        unit: h.unit || activePool.unit || null,
      }));
    }
    // Only that course's players count toward hole difficulty / who's on a hole.
    if (activePool && activePool.pool != null) {
      const want = String(activePool.pool);
      const sub = (field || []).filter((p) => p.pool == null || String(p.pool) === want);
      if (sub.length) field = sub;
    }
    // Hole difficulty: field scoring average vs par per hole. diff>0 = playing hard.
    const diffByHole = React.useMemo(() => {
      const acc = {};
      // Combine the live round with completed rounds (roundCache) so EVERY hole has a
      // difficulty value — including the back nine before the live field reaches it.
      const src = (field || []).slice();
      if (extraRounds) Object.keys(extraRounds).forEach((n) => { const a = extraRounds[n]; if (Array.isArray(a)) for (let k = 0; k < a.length; k++) src.push(a[k]); });
      src.forEach((p) => {
        const sc = p.scores || [];
        for (let i = 0; i < 18; i++) {
          const v = sc[i]; const par = (p.pars && p.pars[i] != null) ? p.pars[i] : null;
          if (v != null && par != null) { acc[i] = acc[i] || { tot: 0, par: 0, n: 0 }; acc[i].tot += v; acc[i].par += par; acc[i].n += 1; }
        }
      });
      const out = {};
      Object.keys(acc).forEach((i) => { const a = acc[i]; if (a.n > 0) out[Number(i) + 1] = { diff: a.tot / a.n - a.par / a.n, n: a.n }; });
      return out;
    }, [field, extraRounds]);
    // rank for hardest/easiest tags
    const ranked = Object.keys(diffByHole).map((h) => ({ hole: Number(h), diff: diffByHole[h].diff })).sort((a, b) => b.diff - a.diff);
    const hardest = ranked.length ? ranked[0].hole : null;
    const easiest = ranked.length ? ranked[ranked.length - 1].hole : null;
    const lo = half === "front" ? 1 : 10, hi = half === "front" ? 9 : 18;
    const holes = [];
    const baked = window.__chainsBakedLayout || null;
    for (let h = lo; h <= hi; h++) {
      const info = layout ? layout.find((x) => x.hole === h) : null;
      const bk = baked ? baked.find((x) => x.hole === h) : null;
      holes.push({
        hole: h,
        par: (info && info.par != null) ? info.par : (bk ? bk.par : null),
        length: (info && info.length != null) ? info.length : (bk ? bk.length : null),
        unit: (info && info.unit) ? info.unit : (bk ? bk.unit : null),
      });
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {multi && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <SubTabsLocal
              value={String(poolIdx)}
              onChange={(v) => setPoolIdx(Number(v))}
              items={pools.map((p, i) => ({
                id: String(i),
                label: (p.course || ("Pool " + (p.pool || (i + 1)))) + (mobile ? "" : "  ·  Pool " + (p.pool || (i + 1))),
              }))}
            />
            {activePool && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                Par {activePool.par_total != null ? activePool.par_total : "—"}
                {activePool.length_total != null
                  ? "  ·  " + Number(activePool.length_total).toLocaleString() + " " + (activePool.unit || "ft")
                  : ""}
              </span>
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <SubTabsLocal value={half} onChange={setHalf} items={[{ id: "front", label: "Front 9" }, { id: "back", label: "Back 9" }]} />
          {mobile && (
            <div style={{ marginLeft: "auto" }}>
              <SubTabsLocal value={dense ? "two" : "one"} onChange={(v) => setDense(v === "two")} items={[{ id: "one", label: "1 up" }, { id: "two", label: "2 up" }]} />
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? (dense ? "1fr 1fr" : "1fr") : "repeat(3, 1fr)", gap: mobile ? 12 : 14 }}>
          {holes.map((h) => <HoleCard key={h.hole} h={h} field={field} ownerOf={ownerOf} status={status} diff={diffByHole[h.hole]} tag={h.hole === hardest ? "hardest" : h.hole === easiest ? "easiest" : null} />)}
        </div>
      </div>
    );
  }

  function fmtDist(h) {
    if (h.length == null) return null;
    if (h.unit === "m" || h.unit === "meters") return Math.round(h.length) + " m / " + Math.round(h.length * 3.28084) + " ft";
    return Math.round(h.length) + " ft";
  }

  function HoleCard({ h, field, ownerOf, status, diff, tag }) {
    // LIVE round: the GROUP currently ON this hole = players whose next hole is
    // this one (finished hole-1, not done yet). The number = their cumulative
    // round score through FINISHED holes; the chip = the hole they just carded.
    // DONE round (between rounds / final): nobody is "on" a hole, so instead show
    // the leaders' score ON this hole (chip) + their round to-par, so every hole
    // still shows names + scores.
    const li = h.hole - 1;
    let here = [];
    const isLive = status === "live";
    if (isLive) {
      (field || []).forEach((p) => {
        if (p.completed) return;
        const played = p.played || 0;
        if (played <= 0) return;
        // place by the live throw tracker's hole when present, else holesThru+1
        const ts0 = p.throwStatus;
        const curHole = (ts0 && ts0.hole != null) ? ts0.hole : (played + 1);
        if (curHole !== h.hole) return;
        const last = p.shortName || (p.name || "").split(" ").slice(-1)[0] || p.name;
        const pli = played - 1;
        const lastScore = (p.scores && p.scores[pli] != null) ? p.scores[pli] : null;
        const lastPar = (p.pars && p.pars[pli] != null) ? p.pars[pli] : null;
        const owner = ownerOf ? ownerOf(p) : null;
        const ts = p.throwStatus;
        const liveDetail = compactStatus(ts, h.par);
        here.push({ name: last, toPar: p.toPar, eventToPar: p.eventToPar, lastScore: lastScore, lastKind: scoreKind(lastScore, lastPar), owner: owner, liveDetail: liveDetail, ts: ts });
      });
      here.sort((a, b) => (a.toPar == null) - (b.toPar == null) || ((a.toPar || 0) - (b.toPar || 0)));
      // NOTE: deliberately NO "who already carded here" fallback. A player only ever
      // appears on the ONE hole they're actively on. Listing past-carders smeared the
      // same handful of leaders across every hole — it looked like one player (e.g.
      // Fredrickson) was standing on 5 holes at once. Passed holes show "Field through".
    }
    // Completed / between-rounds: nobody is on the course, so the hole cards show
    // their par / distance / difficulty only — no player list (which would just
    // repeat the leaders on all 18 holes).
    const top = here.slice(0, 4); // a card is never more than 4 players
    // Empty-tile status (live): has the field already passed, or not arrived yet?
    let emptyLabel = null;
    if (top.length === 0) {
      const reachedHere = (field || []).some((p) => p.scores && p.scores[li] != null);
      const stillComing = (field || []).some((p) => !p.completed && (((p.throwStatus && p.throwStatus.hole != null) ? p.throwStatus.hole : ((p.played || 0) + 1)) < h.hole || (p.played || 0) === 0 && p.roundStarted !== true));
      if (!isLive) emptyLabel = reachedHere ? null : "No scores";
      else if (reachedHere && !stillComing) emptyLabel = "Field through";
      else if (stillComing) emptyLabel = "Awaiting players";
      else emptyLabel = "Not yet reached";
    }
    const fmtTP = (v) => v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    const sCol = (v) => v == null ? "var(--bone-50)" : v < 0 ? "var(--birdie-400, #6ee7a8)" : v > 0 ? "#ff9b7a" : "var(--bone-50)";
    // last-hole chip: shape encodes the result (circle=birdie, ringed=eagle, square=bogey)
    function LastChip({ kind, strokes }) {
      if (strokes == null) return null;
      const good = kind === "eagle" || kind === "birdie";
      const bad = kind === "bogey" || kind === "dbogey";
      const c = good ? "var(--birdie-400, #6ee7a8)" : bad ? "#ff9b7a" : "rgba(255,255,255,0.5)";
      const round = kind === "birdie" || kind === "eagle";
      const ring = kind === "eagle" || kind === "dbogey";
      return (
        <span title={"Last hole: " + (kind || "")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, flexShrink: 0, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10, color: "#0c160f", background: c, borderRadius: round ? "50%" : 3, boxShadow: ring ? "0 0 0 1.5px #0c160f, 0 0 0 2.5px " + c : "none" }}>{strokes}</span>
      );
    }
    return (
      <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", background: "#0c160f", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-ink)" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "250 / 423", background: "#0c160f" }}>
          <img src={HOLE_IMG(h.hole)} alt={"Hole " + h.hole} loading="lazy" onError={window.ChainsAssets ? ChainsAssets.onErr("holes", String(h.hole)) : undefined} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          {/* pixel golfers — playful overlay, behind the info chips (DOM order) */}
          {window.ChainsPixelGolfers && (top.length > 0 || ChainsPixelGolfers.demo()) && <ChainsPixelGolfers.Layer hole={h.hole} par={h.par} players={top} live={isLive} />}
          {/* hole + par near the basket (top), distance just under it */}
          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start", zIndex: 120 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "rgba(12,22,15,0.82)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--bone-50)" }}>Hole {h.hole}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: "var(--ace-400)" }}>{h.par ? "Par " + h.par : ""}</span>
            </div>
            {fmtDist(h) && <div style={{ padding: "2px 9px", borderRadius: "var(--radius-pill)", background: "rgba(12,22,15,0.82)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10.5, color: "var(--chain-200, #cfe0d6)" }}>{fmtDist(h)}</div>}
            {diff && diff.diff != null && (() => {
              const d = diff.diff;
              const c = d >= 0.25 ? "#e0483d" : d >= 0.05 ? "#e8843d" : d <= -0.25 ? "#34a06a" : d <= -0.05 ? "#6bbf8a" : "rgba(255,255,255,0.5)";
              return <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: "var(--radius-pill)", background: "rgba(12,22,15,0.82)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 10.5, color: c }}>{d > 0 ? "+" : ""}{d.toFixed(2)}</span>
                {tag && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 8, color: tag === "hardest" ? "#e0483d" : "#34a06a" }}>{tag}</span>}
              </div>;
            })()}
          </div>
          {/* the group on this hole now — last-hole result + overall to-par, max 4 */}
          {top.length > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", gap: 2, padding: "22px 8px 8px", background: "linear-gradient(0deg, rgba(12,22,15,0.94) 72%, transparent)", zIndex: 120 }}>
              {!isLive && <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 8.5, color: "var(--ace-400)", marginBottom: 1 }}>Leaders here</div>}
              {top.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <LastChip kind={r.lastKind} strokes={r.lastScore} />
                  {r.owner && <span title={r.owner.name + "'s pick"} style={{ width: 7, height: 7, borderRadius: "50%", background: r.owner.disc, flexShrink: 0, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.25)" }} />}
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: r.owner ? 700 : 600, fontSize: 11.5, color: r.owner ? "#fff" : "var(--bone-50)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}{r.liveDetail && <span style={{ fontWeight: 500, fontSize: 9.5, color: "var(--ace-400)", marginLeft: 4 }}>{r.liveDetail}</span>}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: sCol(r.toPar), whiteSpace: "nowrap" }}>{fmtTP(r.toPar)}{r.eventToPar != null && <span style={{ fontWeight: 500, fontSize: 10.5, color: "rgba(255,255,255,0.6)" }}> ({fmtTP(r.eventToPar)})</span>}</span>
                </div>
              ))}
            </div>
          )}
          {top.length === 0 && emptyLabel && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", justifyContent: "center", padding: "16px 8px 8px", background: "linear-gradient(0deg, rgba(12,22,15,0.88) 60%, transparent)", zIndex: 120 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", fontSize: 9.5, color: "rgba(255,255,255,0.5)" }}>{emptyLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  // ---- scorecard grid (helper region) -------------------------------------
  function rng(a, b) { const o = []; for (let i = a; i < b; i++) o.push(i); return o; }
  // to-par over a specific set of (0-based) hole indices, counting only holes
  // with a posted score — so the Front 9 / Back 9 / All 18 toggle shows the score
  // for the holes actually on screen, not always the whole-round total.
  function toParOver(scores, pars, parFn, idxs) {
    if (!scores) return null;
    let sum = 0, any = false;
    for (let n = 0; n < idxs.length; n++) {
      const i = idxs[n], s = scores[i];
      const p = (pars && pars[i] != null) ? pars[i] : (parFn ? parFn(i + 1) : null);
      if (s != null && p != null) { sum += (Number(s) - Number(p)); any = true; }
    }
    return any ? sum : null;
  }
  // ---- official-style scorecard pieces (shared by both grids) -------------
  // A stroke rendered in the universal disc-golf convention: birdie = circle,
  // eagle+ = double circle, bogey = square, double+ = double square, par = plain.
  function ScoreMark({ strokes, par }) {
    if (strokes == null || strokes === "") return <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-faint)" }}>·</span>;
    const k = scoreKind(Number(strokes), par);
    const green = "var(--fairway-700)", red = "var(--clay-600, #b4452f)";
    const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, boxSizing: "border-box", lineHeight: 1 };
    if (k === "birdie") return <span style={{ ...base, color: green, border: "1.5px solid " + green, borderRadius: "50%" }}>{strokes}</span>;
    if (k === "eagle") return <span style={{ ...base, color: green, border: "1.5px solid " + green, borderRadius: "50%", boxShadow: "0 0 0 1.5px var(--bg-elevated), 0 0 0 2.5px " + green, fontWeight: 700 }}>{strokes}</span>;
    if (k === "bogey") return <span style={{ ...base, color: red, border: "1.5px solid " + red, borderRadius: 4 }}>{strokes}</span>;
    if (k === "dbogey") return <span style={{ ...base, color: red, border: "1.5px solid " + red, borderRadius: 4, boxShadow: "0 0 0 1.5px var(--bg-elevated), 0 0 0 2.5px " + red, fontWeight: 700 }}>{strokes}</span>;
    return <span style={{ ...base, color: "var(--text-strong)" }}>{strokes}</span>;
  }
  // Two-row header: hole number + distance (ft), then the par row. The par-row
  // sticky label doubles as the course summary ("Par 61 · 7,930 ft"), mirroring
  // a real DGPT/UDisc scorecard.
  function ScorecardHead({ holeIdx, layout, half, leftLabel }) {
    const find = (h) => layout && layout.find((x) => x.hole === h);
    const parOf = (h) => { const i = find(h); return i && i.par != null ? i.par : null; };
    const feetOf = (h) => { const i = find(h); if (!i || i.length == null) return null; return Math.round((i.unit === "m" || i.unit === "meters") ? i.length * 3.28084 : i.length); };
    const parTot = holeIdx.reduce((a, i) => a + (parOf(i + 1) || 0), 0);
    const distTot = holeIdx.reduce((a, i) => a + (feetOf(i + 1) || 0), 0);
    const rndLbl = half === "f9" ? "F9" : half === "b9" ? "B9" : "RND";
    const sticky = { position: "sticky", left: 0, background: "var(--bg-ink)", zIndex: 1 };
    return (
      <thead>
        <tr style={{ background: "var(--bg-ink)" }}>
          <th style={{ ...sticky, textAlign: "left", padding: "8px 10px 2px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, color: "var(--chain-400)" }}>{leftLabel || "Player"}</th>
          {holeIdx.map((i) => (
            <th key={i} style={{ padding: "7px 3px 1px", textAlign: "center", minWidth: 23, verticalAlign: "bottom" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{i + 1}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 8, color: "var(--chain-400)", lineHeight: 1.5 }}>{feetOf(i + 1) != null ? feetOf(i + 1) : ""}</div>
            </th>
          ))}
          <th rowSpan={2} title={half === "f9" ? "Front 9 to-par" : half === "b9" ? "Back 9 to-par" : "This round"} style={{ padding: "8px 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, color: "var(--ace-400)" }}>{rndLbl}</th>
          <th rowSpan={2} title="Event total" style={{ padding: "8px 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, color: "var(--ace-400)" }}>EVENT</th>
        </tr>
        <tr style={{ background: "var(--bg-ink)" }}>
          <th style={{ ...sticky, textAlign: "left", padding: "0 10px 7px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 9.5, color: "var(--ace-400)", whiteSpace: "nowrap" }}>Par{parTot ? " " + parTot : ""}{distTot ? " · " + distTot.toLocaleString() + " ft" : ""}</th>
          {holeIdx.map((i) => (
            <th key={i} style={{ padding: "0 3px 7px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--ace-400)" }}>{parOf(i + 1) != null ? parOf(i + 1) : ""}</th>
          ))}
        </tr>
      </thead>
    );
  }
  // Compact legend so the circle/square marks read at a glance.
  function ScoreLegend() {
    const green = "var(--fairway-700)", red = "var(--clay-600, #b4452f)";
    const ring = (color, square, dbl) => <span style={{ display: "inline-block", width: 13, height: 13, border: "1.5px solid " + color, borderRadius: square ? 3 : "50%", boxShadow: dbl ? ("0 0 0 1px var(--bg-elevated),0 0 0 2px " + color) : "none", boxSizing: "border-box" }} />;
    const item = (node, label) => <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{node}<span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)" }}>{label}</span></span>;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", alignItems: "center" }}>
        {item(ring(green, false, true), "Eagle+")}
        {item(ring(green, false, false), "Birdie")}
        {item(<span style={{ width: 13, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-strong)" }}>3</span>, "Par")}
        {item(ring(red, true, false), "Bogey")}
        {item(ring(red, true, true), "Dbl+")}
      </div>
    );
  }
  function HalfToggle({ half, setHalf }) {
    const opts = [["f9", "Front 9"], ["b9", "Back 9"], ["all", "All 18"]];
    return (
      <div style={{ display: "flex", gap: 5, padding: "10px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
        {opts.map(([k, l]) => {
          const on = half === k;
          return <button key={k} onClick={() => setHalf(k)} style={{ flex: 1, padding: "7px 8px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 11, cursor: "pointer" }}>{l}</button>;
        })}
      </div>
    );
  }
  function ScorecardGrid({ trackedLive, layout, cumByPdga, mobile }) {
    const cumOf = (t) => (cumByPdga && t && t.pdga != null) ? cumByPdga[String(t.pdga)] : null;
    const rows = trackedLive.filter((t) => t.live && t.live.scores);
    if (!rows.length) return <Card pad={26}><Empty title="No scores yet" sub="The grid fills in as players post holes." /></Card>;
    const par = (h) => { const i = layout && layout.find((x) => x.hole === h); return i ? i.par : null; };
    const fmt = (v) => v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    const [half, setHalf] = React.useState("f9");
    const holeIdx = half === "f9" ? rng(0, 9) : half === "b9" ? rng(9, 18) : rng(0, 18);
    return (
      <Card pad={0} style={{ overflow: "hidden" }}>
        <HalfToggle half={half} setHalf={setHalf} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <ScorecardHead holeIdx={holeIdx} layout={layout} half={half} leftLabel="Player" />
            <tbody>
              {rows.map((t, ri) => {
                const rndVal = half === "all" ? t.live.toPar : toParOver(t.live.scores, t.live.pars, par, holeIdx);
                return (
                <tr key={ri} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", padding: "7px 10px", borderRight: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avatar name={t.member ? t.member.name : t.name} color={t.member ? t.member.disc : "var(--chain-400)"} size={20} />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--text-strong)", whiteSpace: "nowrap" }}>{t.name}</span>
                        {courseWhen(t.live) && <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)", whiteSpace: "nowrap", lineHeight: 1.3 }}>{courseWhen(t.live)}</span>}
                      </div>
                    </div>
                  </td>
                  {holeIdx.map((i) => <td key={i} style={{ textAlign: "center", padding: "6px 3px" }}><ScoreMark strokes={t.live.scores[i]} par={(t.live.pars && t.live.pars[i]) || par(i + 1)} /></td>)}
                  <td style={{ textAlign: "center", padding: "7px 8px", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12.5, color: rndVal == null ? "var(--text-faint)" : rndVal < 0 ? "var(--fairway-700)" : rndVal > 0 ? "var(--clay-600, #b4452f)" : "var(--text-strong)" }}>{fmt(rndVal)}</td>
                  <td style={{ textAlign: "center", padding: "7px 8px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: cumOf(t) == null ? "var(--text-faint)" : cumOf(t) < 0 ? "var(--fairway-700)" : cumOf(t) > 0 ? "var(--clay-600, #b4452f)" : "var(--text-strong)" }}>{cumOf(t) == null ? "—" : fmt(cumOf(t))}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ScoreLegend />
      </Card>
    );
  }

  // ---- full field leaderboard (all players, live, sorted by placement) ---
  function FullScorecard({ field, layout, ownerOf, cumByPdga, mobile }) {
    const all = (field || []);
    const cumOf = (p) => (cumByPdga && p && p.pdga != null) ? cumByPdga[String(p.pdga)] : null;
    if (!all.length) return <Card pad={26}><Empty title="No scores yet" sub="The full field fills in as players post holes." /></Card>;
    const decorated = all.map((p) => ({ p, owner: ownerOf ? ownerOf(p) : null }));
    // sort by RunningPlace when present, else by event to-par
    decorated.sort((a, b) => {
      const pa = a.p.place == null ? 9999 : Number(a.p.place);
      const pb = b.p.place == null ? 9999 : Number(b.p.place);
      if (pa !== pb) return pa - pb;
      return ((a.p.eventToPar == null) - (b.p.eventToPar == null)) || ((a.p.eventToPar || 0) - (b.p.eventToPar || 0));
    });
    const fmt = (v) => v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    const col = (v) => v == null ? "var(--text-faint)" : v < 0 ? "var(--fairway-700)" : v > 0 ? "var(--clay-600, #b4452f)" : "var(--text-strong)";
    const parOf = (h) => { const i = layout && layout.find((x) => x.hole === h); return i ? i.par : null; };
    const [half, setHalf] = React.useState("f9");
    const holeIdx = half === "f9" ? rng(0, 9) : half === "b9" ? rng(9, 18) : rng(0, 18);
    return (
      <Card pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: mobile ? "11px 14px" : "13px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>Full Field</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", display: "inline-flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>{decorated.length} players · hole by hole{decorated.some((d) => d.p && d.p.roundStatus === "I") ? <React.Fragment><span>·</span><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--live-500, #e0483d)", display: "inline-block" }} /><span>on the course</span></React.Fragment> : null}</span>
        </div>
        <HalfToggle half={half} setHalf={setHalf} />
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <ScorecardHead holeIdx={holeIdx} layout={layout} half={half} leftLabel="Player" />
            <tbody>
              {decorated.map((d, ri) => {
                const t = d.p, owner = d.owner;
                const scores = t.scores || [];
                const rndVal = half === "all" ? t.toPar : toParOver(scores, t.pars, parOf, holeIdx);
                return (
                  <tr key={ri} style={{ borderTop: "1px solid var(--border-subtle)", background: owner ? "var(--fairway-50)" : "transparent" }}>
                    <td style={{ position: "sticky", left: 0, background: owner ? "var(--fairway-50)" : "var(--bg-elevated)", padding: "7px 10px", borderRight: "1px solid var(--border-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {owner
                          ? <span title={owner.name + "'s pick"} style={{ width: 8, height: 8, borderRadius: "50%", background: owner.disc, flexShrink: 0, boxShadow: "0 0 0 1.5px var(--bg-elevated)" }} />
                          : <span style={{ width: 8, flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: owner ? 700 : 500, fontSize: 12, color: "var(--text-strong)", whiteSpace: "nowrap" }}>{t.shortName || t.name}</span>
                          {courseWhen(t) && <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)", whiteSpace: "nowrap", lineHeight: 1.3 }}>{courseWhen(t)}</span>}
                        </div>
                        {t.roundStatus === "I" && <span title="On the course" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--live-500, #e0483d)", flexShrink: 0 }} />}
                      </div>
                    </td>
                    {holeIdx.map((i) => <td key={i} style={{ textAlign: "center", padding: "6px 3px" }}><ScoreMark strokes={scores[i]} par={(t.pars && t.pars[i]) || parOf(i + 1)} /></td>)}
                    <td style={{ textAlign: "center", padding: "7px 8px", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12.5, color: col(rndVal) }}>{fmt(rndVal)}</td>
                    <td style={{ textAlign: "center", padding: "7px 8px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: col(cumOf(t)) }}>{cumOf(t) == null ? "—" : fmt(cumOf(t))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ScoreLegend />
      </Card>
    );
  }

  // ---- parsers (defensive against shape variance) ------------------------
  // Deep-search the event JSON for a "LatestRound" field anywhere (root, or on
  // the MPO Division object, or wherever PDGA nests it) — returns the max found.
  function deepFindLatestRound(obj) {
    let best = 0, n = 0;
    function walk(o, depth) {
      if (!o || typeof o !== "object" || depth > 6 || n > 4000) return;
      if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) { n++; walk(o[i], depth + 1); } return; }
      for (const k in o) {
        n++;
        const v = o[k];
        if (/^latest_?round$/i.test(k)) { const num = Number(v); if (!isNaN(num) && num > best) best = num; }
        else if (v && typeof v === "object") walk(v, depth + 1);
      }
    }
    walk(obj, 0);
    return best;
  }
  function parseEvent(j) {
    const root = (j && (j.data || j.Data)) || j || {};
    const rounds = root.Rounds || root.rounds || [];
    let maxR = 0, live = false;
    (Array.isArray(rounds) ? rounds : []).forEach((r) => {
      const n = Number(r.Round || r.RoundNum || r.number) || 0;
      if (n > maxR) maxR = n;
      const started = r.RoundStarted == 1 || r.RoundStarted === true || r.Started == 1;
      const done = r.Completed == 1 || r.AllCompleted == 1;
      if (started && !done) live = true;
    });
    // PDGA exposes the current round as LatestRound (root and/or on the MPO
    // Division object). This is the authoritative "what round is happening now".
    let divisions = root.Divisions || root.divisions || [];
    let mpo = Array.isArray(divisions) ? divisions.find((d) => (d.Division || d.division) === "MPO") : null;
    const latest = Number(
      root.LatestRound != null ? root.LatestRound
      : (mpo && mpo.LatestRound != null) ? mpo.LatestRound
      : 0
    ) || 0;
    const activeRound = latest || maxR || 1;
    // if the latest round is still being played, treat as live
    if (latest) live = true;
    return { rounds: Math.max(maxR, latest, 1), activeRound: activeRound, latest: latest, live: live };
  }
  function rowsOf(j) {
    if (!j) return [];
    const d = j.data || j.Data || j;
    return d.scores || d.Scores || d.players || d.Players || (Array.isArray(d) ? d : []);
  }
  function parseRound(j) {
    const raw = rowsOf(j);
    if (!Array.isArray(raw) || !raw.length) return null;
    // hole pars from the round payload's holes[] (live endpoint includes them)
    const d = (j && (j.data || j.Data)) || j || {};
    const holesArr = d.holes || d.Holes || [];
    const holePars = Array.isArray(holesArr) ? holesArr.map((h) => {
      const v = h && (h.Par != null ? h.Par : (h.par != null ? h.par : null));
      return v != null ? Number(v) : null;
    }) : [];
    return raw.map((p) => {
      // LIVE endpoint: HoleScores is an array of 18 strings ("" = unplayed).
      // HISTORICAL/GitHub: Scores is a comma string. Support both.
      let scores;
      if (Array.isArray(p.HoleScores)) {
        scores = p.HoleScores.map((x) => (x == null || String(x).trim() === "") ? null : Number(x));
      } else if (Array.isArray(p.Scores)) {
        scores = p.Scores.map((x) => (x == null || String(x).trim() === "") ? null : Number(x));
      } else {
        scores = String(p.Scores || p.scores || "").split(",").map((x) => x.trim() === "" ? null : Number(x));
      }
      let pars;
      if (Array.isArray(p.HolePars)) {
        pars = p.HolePars.map((x) => (x == null || String(x).trim() === "") ? null : Number(x));
      } else if (String(p.Pars || p.pars || "").indexOf(",") >= 0) {
        pars = String(p.Pars || p.pars || "").split(",").map((x) => x.trim() === "" ? null : Number(x));
      } else {
        pars = holePars.slice();
      }
      const holesThru = scores.filter((s) => s != null).length;
      const name = [p.FirstName || p.firstName, p.LastName || p.lastName].filter(Boolean).join(" ").trim() || p.Name || p.name || "";
      // round to-par (this round only)
      const toPar = p.RoundtoPar != null ? Number(p.RoundtoPar) : (p.RoundScore != null ? Number(p.RoundScore) : null);
      // overall EVENT to-par across all rounds (ToPar; ParThruRound is a backup)
      const evRaw = (p.ToPar != null ? p.ToPar : (p.ParThruRound != null ? p.ParThruRound : (p.RunningParThruEvent != null ? p.RunningParThruEvent : null)));
      const eventToPar = evRaw != null ? Number(evRaw) : null;
      const completed = p.Completed == 1 || p.Completed === true || holesThru >= 18;
      const roundStarted = p.RoundStarted == 1 || p.RoundStarted === true || holesThru > 0;
      // RoundStatus "I" = in progress (actively on the course right now)
      const roundStatus = p.RoundStatus || p.roundStatus || null;
      const active = roundStatus === "I" || (!completed && roundStarted && holesThru < 18);
      // optional live throw tracker (PDGA broadcast data) when mid-hole
      const ts = p.PlayerThrowStatus || p.playerThrowStatus || null;
      const throwStatus = ts ? {
        hole: ts.HoleOrdinal != null ? Number(ts.HoleOrdinal) : null,
        throwCount: ts.ThrowCount != null ? Number(ts.ThrowCount) : null,
        toTarget: ts.DistanceToTarget != null ? Number(ts.DistanceToTarget) : null,
        zone: ts.ZoneID != null ? Number(ts.ZoneID) : null,
        zoneLabel: ts.ZoneLabel || ts.zone_label || null,
      } : null;
      return {
        pdga: (p.PDGANum || p.PdgaNum || p.pdga_number) != null ? String(p.PDGANum || p.PdgaNum || p.pdga_number) : null,
        name, norm: norm(name),
        shortName: p.ShortName || p.shortName || ((p.FirstName ? p.FirstName[0] + ". " : "") + (p.LastName || "")).trim() || name,
        played: Number(p.Played != null ? p.Played : holesThru),
        completed, roundStarted, active, roundStatus, throwStatus,
        teeTime: p.TeeTime || p.teeTime || null,
        place: p.RunningPlace != null ? p.RunningPlace : (p.Place != null ? p.Place : null),
        tied: p.Tied === true || p.Tied === 1,
        scores, pars,
        toPar: toPar != null ? toPar : (p.RoundtoPar != null ? Number(p.RoundtoPar) : null),
        eventToPar,
      };
    });
  }
  function parseLayout(j) {
    const arr = (j && (j.data || j)) || {};
    const holes = arr.Holes || arr.holes || arr.LiveLayoutDetails || (arr.data && arr.data.Holes) || [];
    if (!Array.isArray(holes) || !holes.length) return null;
    return holes.map((h, i) => ({
      hole: Number(String(h.Hole || h.hole || (i + 1)).replace(/\D/g, "")) || (i + 1),
      par: h.par != null ? Number(h.par) : (h.Par != null ? Number(h.Par) : null),
      length: h.length != null ? Number(h.length) : (h.Length != null ? Number(h.Length) : null),
      unit: h.Units || h.units || h.Unit || arr.Units || arr.units || null,
    })).slice(0, 18);
  }
  function layoutFromPlayers(rows) {
    const withPars = rows.find((p) => p.pars && p.pars.some((x) => x != null));
    if (!withPars) return null;
    return withPars.pars.slice(0, 18).map((par, i) => ({ hole: i + 1, par: par, length: null }));
  }

  // ---- live.json (GitHub pipeline) -> row shape the views already expect ----
  function parseLive(j) {
    if (!j || !Array.isArray(j.players)) return null;
    const holes = (j.holes || []).map((h, i) => ({
      hole: Number(String(h.hole != null ? h.hole : (i + 1)).replace(/\D/g, "")) || (i + 1),
      par: h.par != null ? Number(h.par) : null,
      length: h.length != null ? Number(h.length) : null,
      unit: h.unit || "m",
    })).slice(0, 18);
    const pars = holes.map((h) => h.par);
    const players = j.players.map((p) => {
      const scores = Array.isArray(p.hole_scores) ? p.hole_scores.map((x) => (x == null || String(x).trim() === "") ? null : Number(x)) : [];
      const holesThru = p.thru != null ? Number(p.thru) : scores.filter((s) => s != null).length;
      const name = p.name || "";
      const status = p.status || null;
      return {
        pdga: p.pdga != null ? String(p.pdga) : null,
        name, norm: norm(name),
        shortName: p.short || name,
        played: holesThru,
        completed: p.completed == 1 || p.completed === true,
        roundStarted: holesThru > 0 || status === "I",
        active: status === "I",
        roundStatus: status,
        throwStatus: (p.cur_hole != null) ? {
          hole: Number(p.cur_hole),
          throwCount: p.cur_throw != null ? Number(p.cur_throw) : null,
          toTarget: p.cur_dist != null ? Number(p.cur_dist) : null,
          zone: p.cur_zone != null ? Number(p.cur_zone) : null,
          zoneLabel: p.cur_zone_label || null,
        } : null,
        teeTime: p.tee_time || null,
        // v474: carry the PDGA pool through so CourseHoles can filter the field per course
        pool: p.pool != null ? String(p.pool) : null,
        place: p.place != null ? p.place : null,
        tied: p.tied === true || p.tied === 1,
        scores, pars: pars.slice(),
        toPar: p.round_to_par != null ? Number(p.round_to_par) : null,
        eventToPar: p.event_to_par != null ? Number(p.event_to_par) : null,
      };
    });
    var hcr = Number(j.highest_completed_round) || 0;
    var lr = Number(j.latest_round) || 0;
    var anyScores = players.some(function (p) { return p.played > 0; });
    var effective = anyScores ? lr : (hcr || lr || 1);
    // Poller-provided round metadata (batch 5): real rounds incl. Finals/Playoff
    // numbered however PDGA numbers them (Finals can be "12"). Build tabs from
    // rounds_list ONLY — never from latest_round/rounds counts.
    var rlist = Array.isArray(j.rounds_list) ? j.rounds_list.map(function (r, i) {
      return {
        n: Number(r.n != null ? r.n : (i + 1)),
        label: r.label || ("Round " + (r.n != null ? r.n : (i + 1))),
        abbr: r.abbr || ("R" + (r.n != null ? r.n : (i + 1))),
        key: r.key || ((j.event_id != null ? j.event_id : "") + "-r" + (r.n != null ? r.n : (i + 1))),
      };
    }) : null;
    return {
      players, holes,
      latestRound: lr,
      highestCompletedRound: hcr,
      effectiveRound: effective,
      latestStarted: anyScores,
      rounds: Number(j.rounds) || 0,
      roundsList: rlist,
      currentRound: j.current_round != null ? Number(j.current_round) : lr,
      currentRoundLabel: j.current_round_label || null,
      roundIndex: j.round_index != null ? Number(j.round_index) : null,
      roundCount: j.round_count != null ? Number(j.round_count) : (rlist ? rlist.length : 0),
      updatedAt: j.updated_at || null,
      eventName: j.event_name || null,
      eventId: j.event_id != null ? String(j.event_id) : null,
      // v473: multi-course events (Worlds: pool A + pool B on two courses that
      // SWAP each round). Each entry: {pool, course, unit, par_total,
      // length_total, holes:[...]}. null for ordinary single-course events.
      pools: Array.isArray(j.pools) && j.pools.length > 1 ? j.pools : null,
    };
  }


  window.CourseView = CourseView;
})();
