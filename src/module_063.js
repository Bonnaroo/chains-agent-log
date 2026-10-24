/* Chains app — Picks & Scores view. Read-only viewer + editable draft board.
   window.PicksView */
(function () {
  const PLAYERS = (window.MPO_PLAYERS || []).slice().sort((a, b) => a.name.localeCompare(b.name));

  // name -> pdga number (string) for joining picks to the registration feed.
  // Custom-added pros (and the few null-pdga players) map to null = can't verify.
  const PDGA_BY_NAME = {};
  (window.MPO_PLAYERS || []).forEach((p) => { PDGA_BY_NAME[p.name] = p.pdga != null ? String(p.pdga) : null; });

  function parseScore(raw) {
    const s = String(raw).trim();
    if (s === "" || s === "—" || s === "-") return null;
    if (/^e$/i.test(s)) return 0;
    const n = Number(s.replace(/^\+/, ""));
    return Number.isFinite(n) ? n : null;
  }

  /* ---- Editable draft board for one event ---------------------------- */
  // v469: `closed` must never contradict the real DraftBoard lock (picksLocked,
  // fixed in v468) — this pill used to close purely on calendar midnight, so it
  // could show "PICKS CLOSED" while the draft board below it was open. Same
  // real-evidence check (live.json thru>0/in-progress/completed round),
  // independently fetched per the file's existing per-component pattern.
  function PicksCountdown({ startDate, t }) {
    const [, tick] = React.useState(0);
    const [liveStarted, setLiveStarted] = React.useState(false);
    React.useEffect(() => { const iv = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(iv); }, []);
    React.useEffect(() => {
      var resId = window.ChainsProStats ? String(window.ChainsProStats.resultsIdForSlot(t) || "") : "";
      if (!resId) return;
      fetch("https://chains-fantasy-default-rtdb.firebaseio.com/live.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (live) {
          if (!live || String(live.event_id) !== resId) return;
          var started = (Number(live.highest_completed_round) || 0) >= 1 ||
            (Array.isArray(live.players) && live.players.some(function (p) { return (Number(p.thru) || 0) > 0 || p.status === "I"; }));
          if (started) setLiveStarted(true);
        }).catch(function () {});
    }, [t]);
    const sd = startDate ? new Date(startDate + "T00:00:00Z") : null; // v476: draft deadline = the event start instant (no buffer)
    if (!sd || isNaN(sd)) return null;
    let ms = sd.getTime() - Date.now();
    const closed = liveStarted;
    const soon = !closed && ms <= 0;
    const d = Math.max(0, Math.floor(ms / 86400000)); ms -= d * 86400000;
    const h = Math.max(0, Math.floor(ms / 3600000)); ms -= h * 3600000;
    const m = Math.max(0, Math.floor(ms / 60000)); ms -= m * 60000;
    const s = Math.max(0, Math.floor(ms / 1000));
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 10, padding: "7px 13px", borderRadius: "var(--radius-pill)", background: closed ? "rgba(224,72,61,0.18)" : "var(--ace-500)" }}>
        <span style={{ width: 13, height: 13, color: "#fff" }}><Icons.Target size={13} /></span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5, color: "#fff" }}>
          {closed ? "Picks locked" : soon ? "Draft closed" : <>Draft deadline in <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>{d > 0 ? d + "d " : ""}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span></>}
        </span>
      </div>
    );
  }

  // #44: counts down to when picks OPEN (36h before start) — the inverse of
  // PicksCountdown, which counts down to close.
  function PicksOpensCountdown({ opensAtMs }) {
    const [, tick] = React.useState(0);
    React.useEffect(() => { const iv = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(iv); }, []);
    if (opensAtMs == null) return null;
    let ms = opensAtMs - Date.now();
    if (ms <= 0) return null;
    const d = Math.floor(ms / 86400000); ms -= d * 86400000;
    const h = Math.floor(ms / 3600000); ms -= h * 3600000;
    const m = Math.floor(ms / 60000); ms -= m * 60000;
    const sec = Math.floor(ms / 1000);
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 12, padding: "8px 15px", borderRadius: "var(--radius-pill)", background: "var(--bg-sunken)", border: "1px solid var(--border-default)" }}>
        <span style={{ width: 13, height: 13, color: "var(--text-muted)" }}><Icons.Target size={13} /></span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5, color: "var(--text-body)" }}>
          Picks open in <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800 }}>{d > 0 ? d + "d " : ""}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(sec).padStart(2, "0")}</span>
        </span>
      </div>
    );
  }

  function DraftBoard({ t, tour, scored, onSaved, league }) {
    const { mobile } = useViewport();
    const isL = !!league;
    const L = league || null;
    const [fieldData, setFieldData] = React.useState(null);
    const [ratingByPdga, setRatingByPdga] = React.useState({});
    const [liveStarted, setLiveStarted] = React.useState(false);

    // Has the FIRST PLAYER THROWN? Read /live: this event is underway once any
    // hole is scored (a round completed, or a player is mid-round / thru > 0).
    // Locks members' picks; the commissioner can still edit after the fact.
    React.useEffect(() => {
      var resId = window.ChainsProStats ? String(window.ChainsProStats.resultsIdForSlot(t) || "") : "";
      if (!resId) return;
      fetch("https://chains-fantasy-default-rtdb.firebaseio.com/live.json", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (live) {
          if (!live || String(live.event_id) !== resId) return;
          var started = (Number(live.highest_completed_round) || 0) >= 1 ||
            (Array.isArray(live.players) && live.players.some(function (p) { return (Number(p.thru) || 0) > 0 || p.status === "I"; }));
          if (started) setLiveStarted(true);
        }).catch(function () {});
    }, [t]);
    // v468: picks stay open until there's REAL evidence of play — a completed
    // round or any player's thru>0/in-progress status via the live feed
    // (`liveStarted` above). Dropped the `ChainsEngine.eventStarted(t)` branch:
    // it also fired on a bare SEED status flag or a plain calendar-date
    // comparison, locking picks at midnight on the start date with 0 players
    // teed off (T15 Discmania). `eventStarted()` itself is untouched in
    // engine.js — just no longer consulted here.
    const picksLocked = liveStarted && !ChainsID.isCommish();
    // Single-pick week (commish setting, synced): only Player 1 counts.
    const oneP = !isL && !!(ChainsEngine.onePick && ChainsEngine.onePick(t));
    // #44: pre-draft window (opens 36h before start) + on-the-clock turn order,
    // for the REAL season only (isL = a separate user-created league, untouched).
    // Snake sequence mirrors the classic-league pattern below: everyone's pick-1
    // in draft order, then pick-2 in REVERSE — so the last pick-1'er gets two
    // consecutive turns, same as a manual snake draft.
    const picksCountReal = oneP ? 1 : 2;
    let onClockMid = null, onClockSlot = -1, onClockIdx = -1, onClockSeq = null, opensAtMs = null;
    if (!isL) {
      const _di = ChainsEngine.draftOrder(t);
      const _ord = (_di && _di.order) || [];
      const _existingNow = ChainsEngine.picksFor(t) || [];
      const _byM = {}; _existingNow.forEach((p) => { if (p && p.m) _byM[p.m] = p; });
      const _seq = [];
      for (let _s = 0; _s < picksCountReal; _s++) { const _r = (_s % 2 === 0) ? _ord : _ord.slice().reverse(); _r.forEach((mm) => _seq.push([mm.id, _s])); }
      for (let _i = 0; _i < _seq.length; _i++) {
        const _row = _byM[_seq[_i][0]];
        const _has = _row && (_seq[_i][1] === 0 ? _row.p1 : _row.p2);
        if (!_has) { onClockMid = _seq[_i][0]; onClockSlot = _seq[_i][1]; onClockIdx = _i; break; }
      }
      onClockSeq = _seq;
      // #44: fixed-UTC instant, not viewer-local midnight — every member's draft
      // clock (opensAtMs / turnStartMs / the 4h autopick deadline below) must
      // read the same absolute epoch regardless of timezone. Scoped to this
      // draft-clock path only; PicksCountdown's own start_date parse (line 23,
      // picks-close countdown) is a separate, pre-existing app-wide pattern and
      // is intentionally left untouched.
      if (tour && tour.start_date) opensAtMs = new Date(tour.start_date + "T00:00:00Z").getTime() - 36 * 3600000; // v476: referee opens the draft 36 h before start_date 00:00Z
    }
    const picksNotOpenYet = !isL && opensAtMs != null && Date.now() < opensAtMs && !scored;
    function turnStartMs(idx) {
      if (idx == null || idx <= 0) return opensAtMs;
      const prev = onClockSeq[idx - 1];
      const prow = (ChainsEngine.picksFor(t) || []).find((p) => p && p.m === prev[0]);
      const ts = prow && (prev[1] === 0 ? prow.p1At : prow.p2At);
      return ts || opensAtMs;
    }

    // EDIT INTEGRITY: only the commissioner (league owner) may change picks or
    // scores, and only after explicitly unlocking — editing is a deliberate,
    // rare action, never the default. Regular members are always read-only.
    const canEdit = (mid) => {
      if (picksLocked || picksNotOpenYet) return false;
      if (ChainsID.isCommish() && unlockEdit) return true;
      // v470: the commissioner is ALSO a player. Without the unlock, fall
      // through to the same member rules for their OWN row (turn order and
      // all), instead of being hard-locked out of their own draft pick.
      // Members: while picks are open (DRAFTING), you may edit YOUR OWN two picks
      // directly — no unlock gate needed. Everyone else's players and all score
      // fields stay read-only (engine also enforces own-row-only on write).
      // Real season: also gated to whoever is actually ON THE CLOCK right now.
      // v471: NO turn lockout. Members may always edit their OWN row while
      // picks are open — draft order is shown as guidance, and the
      // commissioner moves picks if someone jumps the queue. Hard-locking
      // rows made members think the app was broken and text picks instead.
      return !scored && ChainsID.isMe(mid);
    };
    const memberCanDraft = !picksLocked && !picksNotOpenYet && !scored;

    // Load field.json (the registered field) + derive player ratings from event data.
    React.useEffect(() => {
      if (window.ChainsField) {
        window.ChainsField.load().then(setFieldData).catch(() => {});
      }
      // Derived rating = average event_rating across loaded 2026 + 2025 seasons
      // (players.js carries no rating; this matches the Players page).
      const ED = window.ExploreData;
      if (ED) {
        Promise.all([ED.loadSeason("2026").catch(() => null), ED.loadSeason("2025").catch(() => null)]).then((seasons) => {
          const buckets = {};
          seasons.forEach((L) => {
            if (!L || !L.byPdga) return;
            Object.values(L.byPdga).forEach((rec) => {
              (rec.apps || []).forEach((a) => { if (a.row && a.row.event_rating != null) (buckets[rec.pdga] = buckets[rec.pdga] || []).push(a.row.event_rating); });
            });
          });
          const map = {};
          Object.keys(buckets).forEach((pd) => { const b = buckets[pd]; map[pd] = Math.round(b.reduce((s, x) => s + x, 0) / b.length); });
          setRatingByPdga(map);
        }).catch(() => {});
      }
    }, []);
    const ratingOf = (pdga) => (pdga != null && ratingByPdga[String(pdga)] != null) ? ratingByPdga[String(pdga)] : null;

    // Restrict the dropdown to the registered field for the event that field.json
    // actually describes — matched by PDGA event id, NOT by season "next"/scored
    // (those are fragile). field.json always carries the current upcoming event.
    const _meta = ChainsEngine.seasonMeta();
    const _upT = (_meta.next || _meta.live) ? (_meta.next || _meta.live).t : null;
    const _slotEventId = window.ChainsProStats ? String(window.ChainsProStats.eventIdForSlot(t) || "") : "";
    const _fieldMatches = !!(fieldData && fieldData.players && _slotEventId && String(fieldData.event_id) === _slotEventId);
    // This slot is the field's event (loaded match) OR the upcoming one whose field
    // hasn't landed yet. Either way the pool is field-only / blocked-until-loaded.
    const isFieldEvent = _fieldMatches || (t === _upT); // v476: the upcoming event is ALWAYS field-only (never the full static pool)
    const fieldLoading = isFieldEvent && !(fieldData && fieldData.players);

    const allPros = React.useMemo(
      () => {
        const byRating = (a, b) => ((b.rating || 0) - (a.rating || 0)) || a.name.localeCompare(b.name);
        const base = ChainsEngine.allPlayers().slice();
        // Not the field's event: full static pool, sorted best-rated first.
        if (!isFieldEvent) return base.map((p) => ({ name: p.name, pdga: p.pdga, rating: ratingOf(p.pdga) })).sort(byRating);
        // The field's event: ONLY the registered field. Until it loads, empty pool.
        if (!fieldData || !fieldData.players) return [];

        const baseByPdga = {};
        base.forEach((p) => { if (p.pdga != null) baseByPdga[String(p.pdga)] = p; });
        const pool = [];
        const seenNames = new Set();
        fieldData.players.forEach((fp) => {
          const pdgaStr = String(fp.pdgaNumber);
          const mpo = baseByPdga[pdgaStr];
          const name = mpo ? mpo.name : [fp.firstName, fp.lastName].join(" ");
          if (seenNames.has(name)) return;
          seenNames.add(name);
          pool.push({ name: name, pdga: fp.pdgaNumber, rating: (fp.rating != null ? fp.rating : ratingOf(fp.pdgaNumber)) });
        });
        // Keep any ALREADY-PICKED player intact even if not in the current field
        // (don't strip a stored pick from the dropdown / its row).
        (ChainsEngine.picksFor(t) || []).forEach((row) => {
          [row.p1, row.p2].forEach((nm) => {
            if (nm && !seenNames.has(nm)) { seenNames.add(nm); const pd = PDGA_BY_NAME[nm] != null ? Number(PDGA_BY_NAME[nm]) : null; pool.push({ name: nm, pdga: pd, rating: ratingOf(pd), stale: true }); }
          });
        });
        // Best-rated player at the top (unrated field players fall to the bottom).
        return pool.slice().sort(byRating);
      },
      [fieldData, isFieldEvent, t, ratingByPdga]
    );
    // draft order = whoever finished last in the most recent completed event picks first
    let draftInfo, order, existing;
    if (isL) {
      const _lst = (L.events && L.events.length) ? L.events[L.events.length - 1].t : null;
      const _base = (_lst != null && window.ChainsActive) ? ChainsActive.rankedForEvent(L, _lst).slice().sort((a, b) => (b.place == null ? 99 : b.place) - (a.place == null ? 99 : a.place)).map((x) => x.m) : [...(L.standings || [])].sort((a, b) => b.rank - a.rank);
      order = _base.map((s) => ({ id: s.id, name: s.name, disc: s.disc }));
      draftInfo = { order: order, fromName: (_lst != null && L.events) ? ((L.events.find((e) => e.t === _lst) || {}).name || null) : null };
      existing = order.map((m, i) => { const mp = ChainsActive.memberPicks(L, t, m.id) || []; return { m: m.id, slot: i + 1, p1: mp[0] ? mp[0].name : null, s1: mp[0] ? mp[0].score : null, p2: mp[1] ? mp[1].name : null, s2: mp[1] ? mp[1].score : null }; });
    } else {
      draftInfo = ChainsEngine.draftOrder(t);
      order = draftInfo.order;
      existing = ChainsEngine.picksFor(t) || [];
    }
    const byMember = {};
    existing.forEach((p) => (byMember[p.m] = p));

    const init = {};
    order.forEach((m) => {
      const p = byMember[m.id] || {};
      init[m.id] = { p1: p.p1 || "", s1: p.scr ? null : (p.s1 ?? null), p2: p.p2 || "", s2: p.scr ? null : (p.s2 ?? null), scr: p.scr ? 1 : 0 };
    });
    const [draft, setDraft] = React.useState(init);
    const [savedTick, setSavedTick] = React.useState(false);
    const [unlockEdit, setUnlockEdit] = React.useState(false);

    // ---- v476: draft referee (poller-owned) ---------------------------------
    // /draft/{t}: order, seq (who picks when), cur, per-turn deadline_at, status.
    // /draft_prefs/{me}: { autopick }. The referee runs the clock, skips and
    // auto-picks server-side; this board only shows it and lets the member on
    // the clock make their pick.
    const FBASE = "https://chains-fantasy-default-rtdb.firebaseio.com";
    const [draftRec, setDraftRec] = React.useState(null);
    const [myPref, setMyPref] = React.useState(null);
    const [, clockTick] = React.useState(0);
    const meId = (window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null;
    React.useEffect(() => {
      if (isL) return;
      let alive = true;
      function pull() {
        fetch(FBASE + "/draft/" + t + ".json", { cache: "no-store" }).then((r) => r.ok ? r.json() : null)
          .then((j) => { if (alive) { setDraftRec(j && j.seq ? j : null); if (j && j.seq) { window.__chainsDraftRecs = window.__chainsDraftRecs || {}; window.__chainsDraftRecs[t] = j; } } }).catch(() => {});
        if (meId) fetch(FBASE + "/draft_prefs/" + encodeURIComponent(meId) + ".json", { cache: "no-store" }).then((r) => r.ok ? r.json() : null)
          .then((j) => { if (alive) setMyPref(j || {}); }).catch(() => {});
      }
      pull();
      const iv = setInterval(() => { if (!document.hidden) pull(); }, 15000);
      const tk = setInterval(() => clockTick((x) => x + 1), 1000);
      const onVis = () => { if (!document.hidden) pull(); };
      document.addEventListener("visibilitychange", onVis);
      return () => { alive = false; clearInterval(iv); clearInterval(tk); document.removeEventListener("visibilitychange", onVis); };
    }, [t, isL, meId]);
    const refOpen = !!(draftRec && draftRec.status === "open");
    const refStep = refOpen ? (draftRec.seq[draftRec.cur] || null) : null;
    const onClockMe = !!(refStep && meId && refStep.m === meId && refStep.status === "on_clock");
    function setAutopick(on) {
      if (!meId) return;
      const next = { ...(myPref || {}), autopick: !!on, updated_at: new Date().toISOString() };
      setMyPref(next);
      // test builds are read-only against the league database (ChainsBuild.legacyWrite)
      ((window.ChainsBuild && ChainsBuild.legacyWrite) ? ChainsBuild.legacyWrite : fetch)(FBASE + "/draft_prefs/" + encodeURIComponent(meId) + ".json", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) }).catch(() => {});
    }
    const storedRow = (mid) => (ChainsEngine.picksFor(t) || []).find((r) => r && r.m === mid) || {};
    const wdFlag = (mid, n) => !!storedRow(mid)["w" + n];
    const isScr = (mid) => !!(draft[mid] && draft[mid].scr);
    // only the member ON THE CLOCK may fill that slot while the referee runs
    // (re-picking a withdrawn slot and commissioner unlock excepted).
    const canEditSlot = (mid, n) => {
      if (!canEdit(mid)) return false;
      if (isL || !refOpen || (ChainsID.isCommish() && unlockEdit)) return true;
      if (wdFlag(mid, n)) return true;
      return !!(refStep && refStep.m === mid && refStep.pick === n && refStep.status === "on_clock");
    };
    const fmtLeft = (ms) => {
      if (ms == null) return "";
      ms = Math.max(0, ms);
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      return (h > 0 ? h + "h " : "") + String(m).padStart(2, "0") + "m " + String(s).padStart(2, "0") + "s";
    };
    const fmtWhen = (iso) => { try { return new Date(iso).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } };
    const ScrBadge = () => <span title="Scratched by the commissioner - last place, 1 point" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "var(--bg-sunken)", border: "1px solid var(--border-default)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, letterSpacing: ".06em", color: "var(--text-muted)" }}>SCR</span>;
    const WdTag = () => <span style={{ marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "#c23a33" }}>Withdrew - pick someone else</span>;
    const ScrToggle = ({ mid }) => (
      <label title="Scratch this member for the event: last place, 1 point, no penalty score" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: isScr(mid) ? "#c23a33" : "var(--text-faint)", cursor: "pointer", userSelect: "none" }}>
        <input type="checkbox" checked={isScr(mid)} onChange={(e) => update(mid, "scr", e.target.checked ? 1 : 0)} style={{ width: 12, height: 12, margin: 0, accentColor: "#c23a33" }} />Scratch
      </label>
    );
    function DraftClockBar() {
      if (!draftRec) return null;
      const memName = (id) => ((order.find((m) => m.id === id) || {}).name) || id;
      const closed = draftRec.status !== "open";
      const step = refStep;
      const left = step && step.deadline_at ? new Date(step.deadline_at).getTime() - Date.now() : null;
      const total = step && step.started_at && step.deadline_at ? new Date(step.deadline_at).getTime() - new Date(step.started_at).getTime() : null;
      const pct = (left != null && total) ? Math.max(0, Math.min(100, 100 * left / total)) : 0;
      const urgent = left != null && left < 15 * 60000;
      const taken = new Set(); order.forEach((m) => { const d = draft[m.id] || {}; if (d.p1) taken.add(d.p1); if (d.p2) taken.add(d.p2); });
      const best = (allPros || []).find((o) => !taken.has(o.name)) || null;
      const myIdx = (!closed && meId) ? draftRec.seq.findIndex((s, i) => i >= draftRec.cur && s.m === meId && s.status !== "done" && !/auto|timeout|deadline/.test(s.status)) : -1;
      const ahead = myIdx > draftRec.cur ? myIdx - draftRec.cur : 0;
      const skips = draftRec.skips || {};
      const chip = (s, i) => {
        const done = /done|auto|timeout|deadline/.test(s.status);
        const live = i === draftRec.cur && !closed;
        return (
          <span key={i} title={memName(s.m) + " - pick " + s.pick + (s.player ? ": " + s.player : "") + (s.status !== "pending" ? " (" + s.status.replace("_", " ") + ")" : "")}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase",
              background: live ? "var(--ace-500)" : done ? "var(--bg-sunken)" : "transparent", color: live ? "#fff" : done ? "var(--text-faint)" : "var(--text-body)", border: "1px solid " + (live ? "var(--ace-500)" : "var(--border-default)"), textDecoration: done ? "none" : "none", opacity: done ? .8 : 1 }}>
            {memName(s.m)}<span style={{ opacity: .7 }}>{s.pick}</span>{done && <span style={{ width: 10, height: 10 }}><Icons.Check size={10} /></span>}{/auto|timeout|deadline/.test(s.status) && <span style={{ opacity: .7 }}>A</span>}
          </span>
        );
      };
      return (
        <div style={{ padding: mobile ? "12px 16px" : "12px 22px", background: onClockMe ? "var(--ace-50, #FFF3EC)" : "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              {closed ? (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12.5, color: "var(--fairway-600)" }}>Draft complete - all picks are in</span>
              ) : step ? (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12.5, color: onClockMe ? "var(--ace-700)" : "var(--text-strong)" }}>
                  {onClockMe ? "You're on the clock" : "On the clock: " + memName(step.m)} <span style={{ opacity: .6 }}>- pick {step.pick}</span>
                </span>
              ) : (
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12.5, color: "var(--text-strong)" }}>Draft open</span>
              )}
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>
                {!closed && left != null && <><span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: urgent ? "#c23a33" : "var(--text-strong)" }}>{fmtLeft(left)}</span> left on this pick - miss it and you drop a spot. </>}
                Draft deadline {fmtWhen(draftRec.deadline_at)}{!closed && ahead > 0 && <> - you're up in {ahead} pick{ahead === 1 ? "" : "s"}</>}
              </span>
              {!closed && left != null && <div style={{ height: 4, borderRadius: 2, background: "var(--bg-sunken)", overflow: "hidden", marginTop: 4, maxWidth: 360 }}><div style={{ height: "100%", width: pct + "%", background: urgent ? "#c23a33" : "var(--ace-500)", transition: "width 1s linear" }} /></div>}
            </div>
            {!closed && meId && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {onClockMe && best && <Button variant="accent" size="sm" onClick={() => update(meId, "p" + step.pick, best.name)}>Pick {best.name}{best.rating ? " (" + best.rating + ")" : ""}</Button>}
                {!onClockMe && best && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Best available: <b style={{ color: "var(--text-strong)" }}>{best.name}</b>{best.rating ? " (" + best.rating + ")" : ""}</span>}
                <label title="When it's your turn the referee picks the highest-rated player still available" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: myPref && myPref.autopick ? "var(--ace-600)" : "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={!!(myPref && myPref.autopick)} onChange={(e) => setAutopick(e.target.checked)} style={{ accentColor: "var(--ace-500)", width: 14, height: 14, margin: 0 }} />Auto-pick for me
                </label>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>{draftRec.seq.map(chip)}</div>
          {Object.keys(skips).length > 0 && <div style={{ marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>Missed turns: {Object.keys(skips).map((k) => memName(k) + " " + skips[k]).join(", ")}</div>}
        </div>
      );
    }

    // Registration feed (read-only): which pdga numbers are in this event's
    // field. Only for mapped slots; resolves async and fails quiet.
    const eventId = window.ChainsProStats ? window.ChainsProStats.eventIdForSlot(t) : null;
    const [regSet, setRegSet] = React.useState(null);
    React.useEffect(() => {
      let alive = true;
      setRegSet(null);
      if (eventId && window.ChainsProStats) {
        window.ChainsProStats.registeredPdgaSet(eventId, "2026")
          .then((s) => { if (alive) setRegSet(s); })
          .catch(() => {});
      }
      return () => { alive = false; };
    }, [eventId]);

    // PICK-LOSS FIX: only the CHANGED member's row is written from board state;
    // every other row is re-read from the stored picks at save time (pull-
    // before-push), so a stale board can't clobber rows it didn't touch.
    // Deliberate clears carry x1/x2 markers — without one the engine refuses
    // to blank a populated pick.
    function persist(next, changedMid) {
      if (isL) {
        const ids = changedMid ? [changedMid] : order.map((m) => m.id);
        ids.forEach((mid) => {
          ChainsActive.setPick(L.id, t, mid, 0, (next[mid] || {}).p1 || "", L.picksCount);
          ChainsActive.setPick(L.id, t, mid, 1, (next[mid] || {}).p2 || "", L.picksCount);
        });
        setSavedTick(true);
        window.clearTimeout(persist._tk);
        persist._tk = window.setTimeout(() => setSavedTick(false), 1400);
        onSaved && onSaved();
        return;
      }
      const curBy = {};
      (ChainsEngine.picksFor(t) || []).forEach((r) => { if (r && r.m) curBy[r.m] = r; });
      const arr = order.map((m, i) => {
        const cur = curBy[m.id];
        if (changedMid && m.id !== changedMid && cur) {
          return { slot: i + 1, m: m.id, p1: cur.p1 != null ? cur.p1 : null, s1: cur.s1 != null ? cur.s1 : null, p2: cur.p2 != null ? cur.p2 : null, s2: cur.s2 != null ? cur.s2 : null, p1At: cur.p1At || null, p2At: cur.p2At || null };
        }
        const d = next[m.id] || {};
        const row = {
          slot: i + 1, m: m.id,
          p1: d.p1 || null, s1: d.s1 != null ? d.s1 : null,
          p2: d.p2 || null, s2: d.s2 != null ? d.s2 : null,
        };
        // Single-pick week: the 2nd-pick column is hidden — never touch stored 2nd picks.
        if (oneP && cur) { row.p2 = cur.p2 != null ? cur.p2 : null; row.s2 = cur.s2 != null ? cur.s2 : null; }
        if (!row.p1 && cur && cur.p1) row.x1 = 1;
        if (!row.p2 && cur && cur.p2 && !oneP) row.x2 = 1;
        // #44: stamp the moment each pick was SET (kept stable if unchanged) —
        // this is what a turn's ~4h clock counts from.
        row.p1At = row.p1 ? ((cur && cur.p1 === row.p1) ? (cur.p1At || null) : Date.now()) : null;
        row.p2At = row.p2 ? ((cur && cur.p2 === row.p2) ? (cur.p2At || null) : Date.now()) : null;
        // v476: scratch flag travels with the row; a changed pick clears its withdrawn flag
        row.scr = d.scr ? 1 : 0;
        if (cur && cur.w1 && row.p1 && row.p1 !== cur.p1) row.w1 = 0;
        if (cur && cur.w2 && row.p2 && row.p2 !== cur.p2) row.w2 = 0;
        return row;
      });
      ChainsEngine.setPicks(t, arr);
      setSavedTick(true);
      window.clearTimeout(persist._tk);
      persist._tk = window.setTimeout(() => setSavedTick(false), 1400);
      onSaved && onSaved();
    }
    function update(mid, field, val) {
      setDraft((d) => { const next = { ...d, [mid]: { ...d[mid], [field]: val } }; persist(next, mid); return next; });
    }
    // #44: autopick — opportunistic (whichever client has this screen open when
    // a turn's ~4h clock expires fills it), not a guaranteed server-side cron.
    // Re-checks fresh picks before writing so two clients can't double-fire.
    React.useEffect(() => {
      // v471: autopick DISABLED. It computed turn deadlines from stale
      // cached timestamps and repeatedly wrote picks nobody made (e.g. Adam
      // Hammes onto cory's row), which members read as data corruption. If a
      // slot is empty at lock, the commissioner fills it via Fix a pick.
      if (true) return;
      const iv = setInterval(() => {
        const deadline = turnStartMs(onClockIdx) + 4 * 3600000;
        if (Date.now() < deadline) return;
        const freshRow = (ChainsEngine.picksFor(t) || []).find((p) => p && p.m === onClockMid) || {};
        if (onClockSlot === 0 ? freshRow.p1 : freshRow.p2) return;
        const takenNow = new Set();
        (ChainsEngine.picksFor(t) || []).forEach((r) => { if (r) { if (r.p1) takenNow.add(r.p1); if (r.p2 && !oneP) takenNow.add(r.p2); } });
        const best = (allPros || []).find((o) => !takenNow.has(o.name));
        if (!best) return;
        update(onClockMid, onClockSlot === 0 ? "p1" : "p2", best.name);
        try { const nm = (ChainsEngine.member(onClockMid) || {}).name || onClockMid; window.ChainsToast && ChainsToast.show(nm + "\u2019s pick clock ran out \u2014 autopicked " + best.name + ".", "info"); } catch (e) {}
      }, 30000);
      return () => clearInterval(iv);
    }, [isL, picksNotOpenYet, scored, onClockMid, onClockSlot, onClockIdx]);

    function resetToSeed() {
      if (isL) return;
      ChainsEngine.resetTournament(t);
      const seed = ChainsEngine.picksFor(t) || [];
      const bm = {}; seed.forEach((p) => (bm[p.m] = p));
      const fresh = {};
      order.forEach((m) => { const p = bm[m.id] || {}; fresh[m.id] = { p1: p.p1 || "", s1: p.s1 ?? null, p2: p.p2 || "", s2: p.s2 ?? null }; });
      setDraft(fresh);
      onSaved && onSaved();
    }

    const ScoreInput = ({ mid, field }) => {
      if (isL || !ChainsID.isCommish() || !unlockEdit) {
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 40 }}>
            <ScoreValue value={(draft[mid] || {})[field]} size={14} />
          </div>
        );
      }
      return (
        <input
          defaultValue={(draft[mid] || {})[field] == null ? "" : draft[mid][field]}
          onBlur={(e) => update(mid, field, parseScore(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          placeholder="—" inputMode="numeric"
          style={{ width: "100%", height: 40, padding: "0 10px", textAlign: "center", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }}
        />
      );
    };

    const rowTotal = (mid) => ChainsEngine.rowTotal({ s1: (draft[mid] || {}).s1, s2: oneP ? null : (draft[mid] || {}).s2 }, undefined, oneP);

    // No two members may draft the same player in one event, and a member can't
    // pick the same player in both slots. Options for a given slot drop anyone
    // already taken elsewhere, but always keep this slot's current pick visible.
    const optionsFor = (mid, slot) => {
      const taken = new Set();
      order.forEach((m) => {
        const d = draft[m.id]; if (!d) return;
        if (m.id === mid) {
          const other = slot === "p1" ? d.p2 : d.p1;
          if (other) taken.add(other);
        } else {
          if (d.p1) taken.add(d.p1);
          if (d.p2) taken.add(d.p2);
        }
      });
      const cur = (draft[mid] || {})[slot];
      return allPros.filter((o) => o.name === cur || !taken.has(o.name));
    };

    // Soft no-repeat warning + registration heads-up under each pick.
    const RepeatTag = ({ mid, name }) => {
      if (!name) return null;
      if (isL) return null;
      const ts = ChainsEngine.usedPlayers(mid, t)[name];
      // "Not registered": player has a known pdga that isn't in the loaded
      // field. Unmapped event, unloaded field, or null-pdga player => no warning.
      let notReg = false;
      if (eventId && regSet) {
        const pdga = PDGA_BY_NAME[name];
        if (pdga != null && !regSet.has(pdga)) notReg = true;
      }
      if (!ts && !notReg) return null;
      return (
        <span style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}>
          {ts && (
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "var(--ace-500)" }}>
              Repeat pick · also T{ts.join(", T")}
            </span>
          )}
          {notReg && (
            <span title="This player isn't in the field for this event yet — just a heads-up, your pick still saves."
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "var(--gold-100)", color: "#8A6A12", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 9.5 }}>
              Not registered
            </span>
          )}
        </span>
      );
    };

    const _myId = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    const _myRow = (typeof draft === "object" && draft && _myId && draft[_myId]) || {};
    const myIncomplete = memberCanDraft && (!_myRow.p1 || (!oneP && !_myRow.p2));
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: mobile ? "12px 16px" : "12px 22px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
            <span style={{ width: 16, height: 16, color: "var(--ace-500)", flexShrink: 0 }}><Icons.Target size={16} /></span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>
              Draft order
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: savedTick ? "var(--fairway-600)" : "var(--text-faint)", transition: "color var(--dur-fast)" }}>
              <span style={{ width: 13, height: 13 }}><Icons.Check size={13} /></span>{savedTick ? "Saved" : "Auto-saves"}
            </span>
            {ChainsID.isCommish() && !isL && unlockEdit && ChainsEngine.setOnePick && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: oneP ? "var(--ace-600)" : "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" checked={!!oneP} onChange={(e) => { ChainsEngine.setOnePick(t, e.target.checked); onSaved && onSaved(); }} style={{ accentColor: "var(--ace-500)", width: 14, height: 14, margin: 0 }} />
                Single-pick week
              </label>
            )}
            {ChainsID.isCommish() && !isL && unlockEdit && <Button variant="ghost" size="sm" onClick={resetToSeed}>Reset</Button>}
            {ChainsID.isCommish() && <Button variant={unlockEdit ? "solid" : "ghost"} size="sm" onClick={() => setUnlockEdit((v) => !v)}>{unlockEdit ? "Done" : "Commissioner: Fix a pick"}</Button>}
          </div>
        </div>

        {/* Column heads (desktop) */}
        {!isL && !unlockEdit && <DraftClockBar />}
        {picksLocked && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: mobile ? "11px 16px" : "11px 22px", background: "var(--bg-sunken)", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>
            <span style={{ width: 14, height: 14, flexShrink: 0 }}><Icons.Lock size={14} /></span>
            Picks are locked — the event is underway. See the commissioner to change a pick.
          </div>
        )}
        {memberCanDraft && !unlockEdit && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: mobile ? "11px 16px" : "11px 22px", background: "var(--ace-50, #FFF3EC)", borderBottom: "1px solid var(--ace-200, #f5ddd1)" }}>
            <span style={{ flex: 1, minWidth: 180, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ace-700)" }}>{draftRec ? "Snake draft - pick when you're on the clock. Turn on auto-pick if you can't be around." : "Picks are open — draft your " + (oneP ? "player" : "two players") + " now."}</span>
          </div>
        )}
        {false && memberCanDraft && myIncomplete && !unlockEdit && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: mobile ? "11px 16px" : "11px 22px", background: "var(--ace-50, #FFF3EC)", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ width: 14, height: 14, flexShrink: 0, color: "var(--ace-600)" }}><Icons.Target size={14} /></span>
            <span style={{ flex: 1, minWidth: 180, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ace-700)" }}>Your picks aren't in yet — draft your {oneP ? "player" : "two players"} before the event starts.</span>
            <Button variant="solid" size="sm" onClick={() => setUnlockEdit(true)}>Draft Now</Button>
          </div>
        )}
        {oneP && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: mobile ? "11px 16px" : "11px 22px", background: "var(--ace-50, #FFF3EC)", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ace-700)" }}>
            <span style={{ width: 14, height: 14, flexShrink: 0 }}><Icons.Target size={14} /></span>
            Single-pick week — everyone plays one player and only Player 1 counts. Stored second picks are kept but not scored.
          </div>
        )}
        {fieldLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: mobile ? "11px 16px" : "11px 22px", background: "var(--gold-50, #fbf6e9)", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "#8A6A12" }}>
            <span style={{ width: 14, height: 14, flexShrink: 0 }}><Icons.Target size={14} /></span>
            Loading the registered field for this event — player picks unlock as soon as it's in.
          </div>
        )}
        {!mobile && (
          <div style={{ display: "grid", gridTemplateColumns: oneP ? "44px 150px 1fr 78px 64px" : "44px 150px 1fr 78px 1fr 78px 64px", gap: 12, padding: "10px 22px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
            {(oneP ? ["Pick", "Member", "Player", "Score", "Total"] : ["Pick", "Member", "Player 1", "Score", "Player 2", "Score", "Total"]).map((h, i) => (
              <span key={h + i} style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)", textAlign: i === 0 || i >= 3 ? "center" : "left" }}>{h}</span>
            ))}
          </div>
        )}

        {order.map((m, i) => {
          if (mobile) {
            return (
              <div key={m.id} style={{ padding: "14px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "var(--pine-800)", color: "var(--bone-50)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
                    <Avatar name={m.name} color={m.disc} size={28} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{m.name}</span>
                    {!ChainsID.isCommish() && !(memberCanDraft && ChainsID.isMe(m.id)) && <span title={memberCanDraft ? "You can only edit your own picks — scores are commissioner-only" : "Only the commissioner can edit picks and scores"} style={{ display: "inline-flex", marginLeft: 5, width: 13, height: 13, color: "var(--text-faint)", flexShrink: 0 }}><Icons.Lock size={13} /></span>}
                  </div>
                  {isScr(m.id) ? <ScrBadge /> : <ScoreValue value={rowTotal(m.id)} size={18} />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <PlayerSelect options={optionsFor(m.id, "p1")} clearable value={(draft[m.id] || {}).p1 || ""} onChange={(v) => update(m.id, "p1", v)} placeholder="Player 1" disabled={!canEditSlot(m.id, 1)} />
                      <RepeatTag mid={m.id} name={(draft[m.id] || {}).p1} />{wdFlag(m.id, 1) && <WdTag />}{ChainsID.isCommish() && unlockEdit && !isL && <ScrToggle mid={m.id} />}
                    </div>
                    <ScoreInput mid={m.id} field="s1" />
                  </div>
                  {!oneP && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 8 }}>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <PlayerSelect options={optionsFor(m.id, "p2")} clearable value={(draft[m.id] || {}).p2 || ""} onChange={(v) => update(m.id, "p2", v)} placeholder="Player 2" disabled={!canEditSlot(m.id, 2)} />
                      <RepeatTag mid={m.id} name={(draft[m.id] || {}).p2} />{wdFlag(m.id, 2) && <WdTag />}
                    </div>
                    <ScoreInput mid={m.id} field="s2" />
                  </div>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: oneP ? "44px 150px 1fr 78px 64px" : "44px 150px 1fr 78px 1fr 78px 64px", gap: 12, padding: "11px 22px", alignItems: "center", borderTop: "1px solid var(--border-subtle)" }}>
              <span style={{ justifySelf: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "var(--radius-pill)", background: "var(--pine-800)", color: "var(--bone-50)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <Avatar name={m.name} color={m.disc} size={26} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                {!ChainsID.isCommish() && !(memberCanDraft && ChainsID.isMe(m.id)) && <span title={memberCanDraft ? "You can only edit your own picks — scores are commissioner-only" : "Only the commissioner can edit picks and scores"} style={{ display: "inline-flex", width: 13, height: 13, color: "var(--text-faint)", flexShrink: 0 }}><Icons.Lock size={13} /></span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <PlayerSelect options={optionsFor(m.id, "p1")} clearable value={(draft[m.id] || {}).p1 || ""} onChange={(v) => update(m.id, "p1", v)} placeholder="Player 1" disabled={!canEditSlot(m.id, 1)} />
                <RepeatTag mid={m.id} name={(draft[m.id] || {}).p1} />{wdFlag(m.id, 1) && <WdTag />}{ChainsID.isCommish() && unlockEdit && !isL && <ScrToggle mid={m.id} />}
              </div>
              <ScoreInput mid={m.id} field="s1" />
              {!oneP && <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <PlayerSelect options={optionsFor(m.id, "p2")} clearable value={(draft[m.id] || {}).p2 || ""} onChange={(v) => update(m.id, "p2", v)} placeholder="Player 2" disabled={!canEditSlot(m.id, 2)} />
                <RepeatTag mid={m.id} name={(draft[m.id] || {}).p2} />{wdFlag(m.id, 2) && <WdTag />}
              </div>}
              {!oneP && <ScoreInput mid={m.id} field="s2" />}
              <span style={{ textAlign: "center" }}>{isScr(m.id) ? <ScrBadge /> : <ScoreValue value={rowTotal(m.id)} size={18} />}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function PicksView({ initialT }) {
    const { mobile } = useViewport();
    const L = window.ChainsActive ? ChainsActive.league() : null;
    const TS = ChainsEngine.SEED.TOURNAMENTS;
    const navTours = (L && L.windowTs && L.windowTs.length) ? TS.filter((x) => L.windowTs.indexOf(x.t) >= 0) : TS;   // a windowed league shows only its tournaments
    // v475: open on the NEXT draftable event (the one members pick for), not the
    // live/locked one - a locked board on arrival read as "the app is broken".
    const [t, setT] = React.useState(initialT || (ChainsEngine.seasonMeta().next || ChainsEngine.seasonMeta().live || TS[0]).t);
    const [bump, setBump] = React.useState(0);
    const [editing, setEditing] = React.useState(false);
    const [expandMid, setExpandMid] = React.useState(null);
    React.useEffect(() => { setEditing(false); setExpandMid(null); }, [t]);

    const tour = TS.find((x) => x.t === t);
    const picks = ChainsEngine.picksFor(t) || [];
    const results = ChainsEngine.eventResults(t);
    const finalScored = !!(results && results.scored);
    const showEditor = L ? false : (!finalScored || editing);
    // Per-league-type open/locked state for the selected event (bracket leagues):
    // exactly the NEXT event is open; future events are locked; season-long is a
    // locked roster (no open board).
    const _meta = ChainsEngine.seasonMeta();
    const _openT = (_meta.next || _meta.live || {}).t;
    const Lseasonlong = !!(L && L.timing === "season-long");
    const Lopen = !!(L && !finalScored && tour && tour.t === _openT);
    const Lfuture = !!(L && !finalScored && !Lopen);
    const LlastScoredT = (L && L.events && L.events.length) ? L.events[L.events.length - 1].t : null;
    // Snake draft (classic/round-robin only): last-place-first, snaking each round.
    // Only the on-the-clock member's current slot is active; others are disabled.
    let _onClockMid = null, _onClockSlot = -1;
    if (L && Lopen && L.type === "classic") {
      const _dl = LlastScoredT;
      const _order = (_dl != null) ? ChainsActive.rankedForEvent(L, _dl).slice().sort((a, b) => (b.place == null ? 99 : b.place) - (a.place == null ? 99 : a.place)).map((x) => x.m.id) : [...L.standings].sort((a, b) => b.rank - a.rank).map((s) => s.id);
      const _seq = [];
      for (let _s = 0; _s < L.picksCount; _s++) { const _r = (_s % 2 === 0) ? _order : _order.slice().reverse(); _r.forEach((mid) => _seq.push([mid, _s])); }
      for (let _i = 0; _i < _seq.length; _i++) { const _mp = ChainsActive.memberPicks(L, t, _seq[_i][0]); if (!(_mp[_seq[_i][1]] && _mp[_seq[_i][1]].name)) { _onClockMid = _seq[_i][0]; _onClockSlot = _seq[_i][1]; break; } }
    }

    const resRows = results ? results.rows : [];
    const byMember = {};
    resRows.forEach((r) => (byMember[r.m] = r));
    const idx = navTours.findIndex((x) => x.t === t);

    const ordered = [...picks].sort((a, b) => {
      const ra = byMember[a.m], rb = byMember[b.m];
      if (results && results.scored && ra && rb) return ra.place - rb.place;
      return a.slot - b.slot;
    });

    function PlayerCell({ name, score }) {
      const blank = !name || name === "N/A";
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: blank ? "var(--text-faint)" : "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{blank ? "—" : name}</span>
          <ScoreValue value={score} size={14} />
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader kicker="Picks & Scores" title="The Picks" size="lg"
          subtitle={L ? `Everyone's ${L.picksCount} MPO players each event, with their scores and where they finished.` : "Everyone's two MPO players each event, with their scores and where they finished."} />

        {/* Tournament selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton title="Previous" variant="secondary" disabled={idx === 0} onClick={() => setT(navTours[Math.max(0, idx - 1)].t)}><Icons.ChevLeft size={18} /></IconButton>
          <div style={{ flex: 1, overflowX: "auto", display: "flex", gap: 7, padding: "2px 0" }}>
            {navTours.map((x) => {
              const r = ChainsEngine.eventResults(x.t);
              const done = r && r.scored;
              const active = x.t === t;
              return (
                <button key={x.t} onClick={() => setT(x.t)}
                  style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: "7px 12px", borderRadius: "var(--radius-md)", border: `1px solid ${active ? "var(--fairway-500)" : "var(--border-subtle)"}`, background: active ? "var(--fairway-600)" : done ? "var(--bg-elevated)" : "var(--bg-sunken)", cursor: "pointer", minWidth: 78 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: active ? "#fff" : "var(--text-strong)" }}>T{x.t}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 9, color: active ? "rgba(255,255,255,.8)" : done ? "var(--fairway-600)" : "var(--text-faint)" }}>{x.status === "live" ? "● Live" : done ? "Final" : "Upcoming"}</span>
                </button>
              );
            })}
          </div>
          <IconButton title="Next" variant="secondary" disabled={idx === navTours.length - 1} onClick={() => setT(navTours[Math.min(navTours.length - 1, idx + 1)].t)}><Icons.ChevRight size={18} /></IconButton>
        </div>

        {/* Event card */}
        <Card pad={0}>
          <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 12 : 0, justifyContent: "space-between", alignItems: mobile ? "flex-start" : "center", padding: mobile ? "16px" : "16px 22px", background: "var(--bg-ink)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: mobile ? 18 : 22, color: "var(--bone-50)", lineHeight: 1 }}>T{tour.t} · {tour.name}</span>
                <TierTag tier={tour.tier} />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400)", flexWrap: "wrap" }}>
                <span>{tour.loc}</span><span>·</span><span>{tour.dates}</span>
                {tour.proWinner && <><span>·</span><span style={{ color: "var(--gold-500)" }}>Pro winner: {tour.proWinner}</span></>}
              </div>
              {(((showEditor && !finalScored && tour.status !== "live")) || (L && Lopen && !Lseasonlong)) && tour.start_date && <PicksCountdown startDate={tour.start_date} t={tour.t} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {finalScored && (
                <Button variant={editing ? "accent" : "secondary"} size="sm" icon={<Icons.Check size={14} />} onClick={() => setEditing((e) => !e)}>{editing ? "Done editing" : "Edit results"}</Button>
              )}
              {finalScored && !editing ? <Badge tone="fairway" emphasis="solid"><span style={{ width: 12, height: 12, marginRight: 2 }}><Icons.Check size={12} /></span>Final</Badge>
                : showEditor ? <Badge tone="ace" emphasis="solid">Drafting</Badge>
                : L && Lopen ? <Badge tone={Lseasonlong ? "fairway" : "ace"} emphasis="solid">{Lseasonlong ? "Locked roster" : "Open · draft"}</Badge>
                : L && Lfuture ? <Badge tone="neutral" emphasis="solid">Upcoming</Badge>
                : tour.status === "live" ? <Badge tone="live" emphasis="solid">Live</Badge>
                : <Badge tone="ace" emphasis="solid">Picks locked</Badge>}
            </div>
          </div>

          {showEditor ? (
            <DraftBoard key={t + "-" + bump} t={t} tour={tour} scored={finalScored} onSaved={() => setBump((b) => b + 1)} />
          ) : (L && L.type === "classic") ? (
            <DraftBoard key={L.id + "-" + t + "-" + bump} t={t} tour={tour} scored={finalScored} league={L} onSaved={() => setBump((b) => b + 1)} />
          ) : L ? (
            <div>
              {(Lopen || Lfuture) && (
                <div style={{ padding: "11px 16px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>
                  {Lseasonlong ? "Locked roster — picks were set at the season start; scores fill in as the event plays."
                    : Lfuture ? "Not open yet — opens after the current event finishes."
                    : L.type === "classic" ? (_onClockMid ? ("On the clock: " + ((L.standings.find(function (s) { return s.id === _onClockMid; }) || {}).name || "") + " — last place picks first, snaking each round.") : "Draft complete — all picks are in.")
                    : "Your picks are open — set your bracket: one pro per bracket (5) plus a backup. Saved automatically."}
                </div>
              )}
              {ChainsActive.rankedForEvent(L, t).map((row) => {
                const meId = window.ChainsID && ChainsID.whoami();
                const commishL = window.ChainsID && ChainsID.isCommish();
                const isOpen = (Lopen && !Lseasonlong);
                const openEditable = isOpen && (ChainsID.isMe(row.m.id) || row.m.id === expandMid);
                var picks;
                if (finalScored) picks = ChainsActive.memberPicks(L, t, row.m.id);
                else if (Lseasonlong && LlastScoredT != null) picks = ChainsActive.memberPicks(L, LlastScoredT, row.m.id).map(function (p) { return { name: p.name, score: null }; });
                else picks = Array.from({ length: L.picksCount }, function () { return { name: null, score: null }; });
                if (isOpen && L.type !== "classic" && !openEditable) {
                  const sv = ChainsActive.memberPicks(L, t, row.m.id);
                  const done = sv.some(function (p) { return p.name; });
                  return (
                    <div key={row.m.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                      <Avatar name={row.m.name} color={row.m.disc} size={24} />
                      <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{row.m.name}{ChainsID.isMe(row.m.id) ? " · you" : ""}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: done ? "var(--fairway-600)" : "var(--text-faint)" }}>{done ? "✓ Picked" : "Waiting"}</span>
                      {commishL && <button onClick={() => setExpandMid(row.m.id)} title={"Edit " + row.m.name + "'s picks (commissioner)"} style={{ flexShrink: 0, padding: "4px 9px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 10 }}>Edit</button>}
                    </div>
                  );
                }
                return (
                  <div key={row.m.id} style={{ padding: "13px 16px", borderTop: "1px solid var(--border-subtle)", background: (openEditable && ChainsID.isMe(row.m.id)) ? "var(--bg-sunken)" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar name={row.m.name} color={row.m.disc} size={28} />
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{row.m.name}{ChainsID.isMe(row.m.id) ? " · you" : ""}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <ScoreValue value={row.total} size={18} />
                        {row.place ? <PlaceBadge place={row.place} size={28} /> : null}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: "6px 18px", paddingLeft: 2 }}>
                      {(openEditable || (isOpen && L.type === "classic")) ? (function () {
                        const bopts = ChainsActive.brackets();
                        const classic = L.type === "classic";
                        const saved = ChainsActive.memberPicks(L, t, row.m.id);
                        const slots = [];
                        for (let si = 0; si < L.picksCount; si++) {
                          const isBackup = !classic && si >= 5;
                          const opts = classic ? bopts.backups : (isBackup ? (bopts.bracketBackups || bopts.backups) : (bopts.brackets[si] || []));
                          const cur = (saved[si] && saved[si].name) || "";
                          const clk = !classic || (row.m.id === _onClockMid && si === _onClockSlot);
                          const label = classic ? ("Player " + (si + 1)) : (isBackup ? "+ Backup pick" : ("Bracket " + (si + 1) + " · " + ((bopts.ranges && bopts.ranges[si]) || "")));
                          slots.push(
                            <select key={si} value={cur} disabled={!clk} onChange={(e) => ChainsActive.setPick(L.id, t, row.m.id, si, e.target.value, L.picksCount)}
                              style={{ height: 36, padding: "0 9px", borderRadius: "var(--radius-sm)", border: "1px solid " + (clk ? "var(--fairway-500)" : "var(--border-default)"), background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: cur ? "var(--text-strong)" : "var(--text-faint)", opacity: clk ? 1 : 0.45, cursor: clk ? "pointer" : "default" }}>
                              <option value="">{label}</option>
                              {opts.map((nm) => <option key={nm} value={nm}>{nm}</option>)}
                            </select>
                          );
                        }
                        return slots;
                      })() : picks.map((pk, pi) => <PlayerCell key={pi} name={pk.name} score={pk.score} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {(function () {
                const isCL = !!(L && L.type === "classic");
                const memOf = isCL ? (function (id) { return (L.members || []).find(function (x) { return x.id === id; }) || { name: id, disc: "#9CA3AF" }; }) : (function (id) { return ChainsEngine.member(id); });
                let rows = ordered, bm = byMember;
                if (isCL) {
                  const ranked = (isCL && Lopen) ? (function () { const lt = LlastScoredT; const base = (lt != null) ? ChainsActive.rankedForEvent(L, lt).slice().sort(function (a, b) { return (b.place == null ? 99 : b.place) - (a.place == null ? 99 : a.place); }).map(function (x) { return x.m; }) : [...L.standings].sort(function (a, b) { return b.rank - a.rank; }); return base.map(function (s) { return { m: s, ev: null, total: null, place: null }; }); })() : ChainsActive.rankedForEvent(L, t);
                  bm = {};
                  rows = ranked.map(function (rw, i) {
                    const mp = ChainsActive.memberPicks(L, t, rw.m.id);
                    if (rw.ev) bm[rw.m.id] = { total: rw.total, place: rw.place, points: rw.points };
                    return { m: rw.m.id, slot: i + 1, p1: mp[0] ? mp[0].name : null, s1: mp[0] ? mp[0].score : null, p2: mp[1] ? mp[1].name : null, s2: mp[1] ? mp[1].score : null };
                  });
                }
                const clOpen = isCL && Lopen;
                const fieldOpts = clOpen ? ChainsActive.brackets().backups : null;
                const cellPick = function (p, slot) {
                  const nm = slot === 0 ? p.p1 : p.p2, sc = p.scr ? null : (slot === 0 ? p.s1 : p.s2); // v477: scratched row shows no score
                  if (clOpen) {
                    const clk = (p.m === _onClockMid && slot === _onClockSlot);
                    return (
                      <select value={nm || ""} disabled={!clk} onChange={(e) => ChainsActive.setPick(L.id, t, p.m, slot, e.target.value, L.picksCount)}
                        style={{ height: 34, padding: "0 8px", borderRadius: "var(--radius-sm)", border: "1px solid " + (clk ? "var(--fairway-500)" : "var(--border-default)"), background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: nm ? "var(--text-strong)" : "var(--text-faint)", opacity: clk ? 1 : 0.45, cursor: clk ? "pointer" : "default", width: "100%" }}>
                        <option value="">{"Player " + (slot + 1)}</option>
                        {fieldOpts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    );
                  }
                  return <PlayerCell name={nm} score={sc} />;
                };
                return (
                  <React.Fragment>
                    {clOpen && (<div style={{ padding: "11px 22px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>{_onClockMid ? ("Shared draft board · on the clock: " + memOf(_onClockMid).name + " — last place picks first.") : "Draft complete — all picks are in."}</div>)}
                    {!mobile && (
                      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr 70px 92px", gap: 12, padding: "10px 22px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
                        {["Member", "Pick 1", "Pick 2", "Total", "Finish"].map((h, i) => (
                          <span key={h + i} style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)", textAlign: i >= 3 ? "center" : "left" }}>{h}</span>
                        ))}
                      </div>
                    )}
                    {rows.map((p, i) => {
                      const m = memOf(p.m);
                      const r = bm[p.m];
                      if (mobile) {
                        return (
                          <div key={p.m} style={{ padding: "13px 16px", borderTop: "1px solid var(--border-subtle)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <Avatar name={m.name} color={m.disc} size={28} />
                                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{m.name}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <ScoreValue value={r ? r.total : (isCL ? null : ChainsEngine.projTotal(p, rows))} size={18} />
                                {r && r.place ? <PlaceBadge place={r.place} size={28} points={r.points} /> : null}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 2 }}>
                              {cellPick(p, 0)}
                              {cellPick(p, 1)}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={p.m} style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr 70px 92px", gap: 12, padding: "12px 22px", alignItems: "center", borderBottom: i < rows.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <Avatar name={m.name} color={m.disc} size={26} />
                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
                          </div>
                          {cellPick(p, 0)}
                          {cellPick(p, 1)}
                          <span style={{ textAlign: "center" }}><ScoreValue value={r ? r.total : (isCL ? null : ChainsEngine.projTotal(p, rows))} size={18} /></span>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                            {r && r.place ? <><PlaceBadge place={r.place} size={28} points={r.points} /><span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-muted)" }}>+{r.points}</span></> : <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>—</span>}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })()}
            </>
          )}
        </Card>
      </div>
    );
  }

  window.PicksView = PicksView;
})();
