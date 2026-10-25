/* Chains app — "Play a Round". window.PlayView
   Personal/casual side: log your own rounds. Minimal friction to enter (nearest
   course + last group + par-default scoring = near-zero taps); richness lives in
   history/results. Data: courses.json (catalog) + Firebase /play_rounds +
   /custom_courses. Read+write /play_rounds & /custom_courses; never /live. */
(function () {
  const __fn = (n) => String(n == null ? "Player" : n).split(" ")[0] || "Player";
  // v524 home course: the player's anchor course. Stored locally + users/{uid}/profile/homeCourse; default = most played.
  const ChainsHome = {
    key: () => "chains_home_course_v1:" + ((window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || "_"),
    get: () => { try { return localStorage.getItem(ChainsHome.key()) || null; } catch (e) { return null; } },
    set: (cid) => { try { if (cid) localStorage.setItem(ChainsHome.key(), String(cid)); else localStorage.removeItem(ChainsHome.key()); } catch (e) {} try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = window.ChainsFB && ChainsFB.ok ? ChainsFB.db : null; if (u && d) d.ref("users/" + u.uid + "/profile/homeCourse").set(cid || null).catch(() => {}); } catch (e) {} try { window.dispatchEvent(new Event("chains:home-course")); } catch (e) {} },
    pull: () => { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = window.ChainsFB && ChainsFB.ok ? ChainsFB.db : null; if (u && d && !ChainsHome.get()) d.ref("users/" + u.uid + "/profile/homeCourse").get().then((s) => { const v = s.val(); if (v) { try { localStorage.setItem(ChainsHome.key(), String(v)); } catch (e) {} } }).catch(() => {}); } catch (e) {} },
    // per-hole mastery: history on each hole + the next real target (baseline = your average over your last 5 plays)
    mastery: (rounds, me, courseId, pars) => {
      const mine = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && !r.practice && String(r.course_id) === String(courseId) && r.hole_scores && me && r.hole_scores[me]).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      const N = pars.length; const out = [];
      for (let h = 0; h < N; h++) {
        const all = mine.map((r) => toArr(r.hole_scores[me])[h]).filter((v) => v != null); const last5 = all.slice(0, 5);
        const par = pars[h] || 3; const n = all.length; const avg = last5.length ? last5.reduce((a, b) => a + b, 0) / last5.length : null; const best = n ? Math.min.apply(null, all) : null;
        const birdies = all.filter((v) => v < par).length; const pars_ = all.filter((v) => v === par).length;
        let target = null, kind = null, prog = null;
        if (!n) { target = "Play it"; kind = "new"; }
        else if (birdies === 0 && avg != null && avg <= par + 0.4) { target = "First birdie here"; kind = "birdie"; }
        else if (avg != null && avg > par + 0.6) { const hits = last5.filter((v) => v <= par).length; target = "Par it on 2 of your next 5"; kind = "fix"; prog = hits + "/2 so far"; }
        else if (birdies > 0 && birdies < 3) { target = "Birdie it " + (3 - birdies) + " more time" + (3 - birdies === 1 ? "" : "s"); kind = "repeat"; prog = birdies + "/3"; }
        else if (birdies >= 3 && best > 1 && par >= 3) { target = "Owned. Try for a 2 on the record" + (best === 2 ? "" : ""); kind = "own"; }
        else { target = "Keep it going"; kind = "own"; }
        out.push({ hole: h + 1, par, n, avg, best, birdies, pars: pars_, target, kind, prog, hard: avg != null && n >= 2 ? avg - par : null });
      }
      return out;
    },
  };
  window.ChainsHome = ChainsHome;
  // v539 — favourite courses (local + users/{uid}/profile/favorites). Browsing = home & favourites · nearby · anywhere.
  const ChainsFavs = {
    key: () => "chains_favs_v1:" + ((window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || "_"),
    get: () => { try { return JSON.parse(localStorage.getItem(ChainsFavs.key()) || "[]") || []; } catch (e) { return []; } },
    has: (cid) => ChainsFavs.get().some((x) => String(x) === String(cid)),
    toggle: (cid) => { const cur = ChainsFavs.get().filter((x) => String(x) !== String(cid)); const on = cur.length === ChainsFavs.get().length; const next = on ? cur.concat([String(cid)]) : cur; try { localStorage.setItem(ChainsFavs.key(), JSON.stringify(next)); } catch (e) {} try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); if (u && d) d.ref("users/" + u.uid + "/profile/favorites").set(next).catch(() => {}); } catch (e) {} try { window.dispatchEvent(new Event("chains:favs")); } catch (e) {} return on; },
    pull: () => { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); if (u && d && !ChainsFavs.get().length) d.ref("users/" + u.uid + "/profile/favorites").get().then((sn) => { const v = sn.val(); if (Array.isArray(v) && v.length) { localStorage.setItem(ChainsFavs.key(), JSON.stringify(v)); window.dispatchEvent(new Event("chains:favs")); } }).catch(() => {}); } catch (e) {} },
  };
  window.ChainsFavs = ChainsFavs;
  const milesBetween = (a, b) => { const R = 3958.8, toR = (x) => x * Math.PI / 180; const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  // v538 — Chase: the three things you're following (CHALLENGES.md §2b). Lane 2 of four:
  // trophies (permanent) · goals (private, yours) · weekly challenges (short prompts) · titles (public).
  const ChainsGoals = {
    key: () => "chains_goal_v1:" + ((window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || "_"),
    get: () => { try { return JSON.parse(localStorage.getItem(ChainsGoals.key()) || "null"); } catch (e) { return null; } },
    set: (g) => { try { if (g) localStorage.setItem(ChainsGoals.key(), JSON.stringify(g)); else localStorage.removeItem(ChainsGoals.key()); } catch (e) {} try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); if (u && d) d.ref("users/" + u.uid + "/goal").set(g || null).catch(() => {}); } catch (e) {} },
    pull: () => { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); if (u && d && !ChainsGoals.get()) d.ref("users/" + u.uid + "/goal").get().then((sn) => { const v = sn.val(); if (v) localStorage.setItem(ChainsGoals.key(), JSON.stringify(v)); }).catch(() => {}); } catch (e) {} },
    // Suggestions from your own history at the home course (nothing generic: every one names the hole or the number).
    suggest: (rounds, me, home) => {
      const out = [];
      if (!home || !me) return out;
      const pars = home.hole_pars || home.pars || Array(home.holes || 18).fill(3);
      const mine = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && !r.practice && String(r.course_id) === String(home.id) && r.scores && r.scores[me] != null);
      const full = mine.filter((r) => r.hole_scores && r.hole_scores[me] && toArr(r.hole_scores[me]).filter((x) => x != null).length >= pars.length);
      const best = full.length ? Math.min(...full.map((r) => r.scores[me])) : null;
      const short = String(home.name || "").replace(/ disc golf.*$/i, "");
      const m = ChainsHome.mastery(rounds, me, home.id, pars);
      if (best != null) out.push({ id: "beat_best", title: "Beat your best at " + short + " (" + fmtPar(best) + ")", test: "best", target: best - 1, course: home.id, how: "One full round lower than " + fmtPar(best) + "." });
      if (best != null && best >= 0) out.push({ id: "under_par", title: "Shoot under par at " + short, test: "best", target: -1, course: home.id, how: "Your first full round in the red here." });
      const hard = m.filter((h) => h.n >= 2 && h.avg != null && h.avg - h.par >= 0.8).sort((a, b) => (b.avg - b.par) - (a.avg - a.par)).slice(0, 2);
      hard.forEach((h) => out.push({ id: "par_h" + h.hole, title: "Par hole " + h.hole + " at " + short, test: "hole_le", hole: h.hole, target: h.par, course: home.id, how: "You average " + (Math.round(h.avg * 10) / 10) + " there. Par or better once." }));
      const noBird = m.filter((h) => h.n >= 2 && !h.birdies).sort((a, b) => a.hole - b.hole).slice(0, 2);
      noBird.forEach((h) => out.push({ id: "bird_h" + h.hole, title: "First birdie on hole " + h.hole + " at " + short, test: "hole_le", hole: h.hole, target: h.par - 1, course: home.id, how: "You've played it " + h.n + " times without one." }));
      if (full.length >= 3) { const last5 = full.slice(0, 5).map((r) => r.scores[me]); const avg = last5.reduce((a, b) => a + b, 0) / last5.length; out.push({ id: "raise_floor", title: "Three rounds in a row at or under " + fmtPar(Math.round(avg)) + " at " + short, test: "streak_le", target: Math.round(avg), count: 3, course: home.id, how: "Your recent average. Make it your floor." }); }
      return out.slice(0, 6);
    },
    // Has the chosen goal been met since it was chosen?
    evaluate: (goal, rounds, me) => {
      if (!goal || !me) return { done: false, progress: 0 };
      const since = goal.since || 0;
      const mine = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && !r.practice && String(r.course_id) === String(goal.course) && r.scores && r.scores[me] != null && (Date.parse(r.created_at || r.date || 0) || 0) >= since).sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
      if (goal.test === "best") { const hit = mine.find((r) => r.scores[me] <= goal.target && r.hole_scores && r.hole_scores[me]); const bestSince = mine.length ? Math.min(...mine.map((r) => r.scores[me])) : null; return { done: !!hit, progress: bestSince == null ? 0 : Math.max(0, Math.min(1, 1 - (bestSince - goal.target) / 5)), note: bestSince == null ? "No rounds there yet." : "Best since you picked it: " + fmtPar(bestSince) + "." }; }
      if (goal.test === "hole_le") { let plays = 0, hit = false; mine.forEach((r) => { const hs = r.hole_scores && r.hole_scores[me] ? toArr(r.hole_scores[me]) : null; const v = hs ? hs[goal.hole - 1] : null; if (v != null) { plays++; if (v <= goal.target) hit = true; } }); return { done: hit, progress: hit ? 1 : Math.min(0.6, plays * 0.15), note: plays ? plays + (plays === 1 ? " try" : " tries") + " since you picked it." : "Play it and see." }; }
      if (goal.test === "streak_le") { let run = 0, best = 0; mine.forEach((r) => { if (r.scores[me] <= goal.target) { run++; best = Math.max(best, run); } else run = 0; }); return { done: best >= goal.count, progress: Math.min(1, best / goal.count), note: best + " of " + goal.count + " in a row so far." }; }
      return { done: false, progress: 0 };
    },
  };
  window.ChainsGoals = ChainsGoals;
  // v511: rating for one player's hole scores; pulls hole lengths / ssa from the course catalog when the record lacks them
  // v527 — player rating from round records, using the per-course pin from the catalog (ratingFor), not the raw length model.
  function playerRatingFor(rounds, me) {
    try {
      if (!window.ChainsRating) return null;
      const rated = [];
      (rounds || []).forEach((r) => {
        if (!r || r.status === "open" || r.practice || !r.hole_scores || r.hole_scores[me] == null || !r.pars) return;
        const hs = toArr(r.hole_scores[me]), pars = toArr(r.pars);
        if (hs.length < pars.length || hs.some((v) => v == null)) return;
        const rr = ratingFor(hs, pars, { id: r.course_id, course_id: r.course_id });
        if (rr && rr.rating) rated.push({ rating: rr.rating, at: r.date || (r.created_at || "").slice(0, 10) });
      });
      if (!rated.length) return null;
      rated.sort((a, b) => String(b.at).localeCompare(String(a.at)));
      const last20 = rated.slice(0, 20);
      const keep = last20.length >= 20 ? 8 : Math.max(1, Math.ceil(last20.length * 0.4));
      const best = last20.slice().sort((a, b) => b.rating - a.rating).slice(0, keep);
      return { rating: Math.round(best.reduce((t, x) => t + x.rating, 0) / best.length), n: rated.length, counted: best.length };
    } catch (e) { return null; }
  }
  window.playerRatingFor = playerRatingFor;
  function ratingFor(hs, pars, courseLike) {
    try {
      if (!window.ChainsRating || !hs || !pars) return null;
      const cid = courseLike && (courseLike.id != null ? courseLike.id : courseLike.course_id);
      const cat = (window.ChainsCatalog && ChainsCatalog.get && ChainsCatalog.get()) || CATALOG || [];
      const live = cid != null ? (cat || []).find((c) => c && String(c.id) === String(cid)) : null;
      const lens = (courseLike && courseLike.hole_lengths) || (live && live.hole_lengths) || null;
      const ssa = (courseLike && courseLike.ssa) || (live && live.ssa) || null;
      const rating = (courseLike && courseLike.rating) || (live && live.rating) || null;
      const rr = ChainsRating.roundRating({ hole_scores: { me: hs }, pars, course: { pars, holes: pars.length, hole_lengths: lens, ssa, rating } }, "me", null);
      return rr || null;
    } catch (e) { return null; }
  }
  const E = React.createElement;
  const FB = "https://chains-fantasy-default-rtdb.firebaseio.com";
  const COURSES_URL = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/courses.json";
  const LAST_GROUP_KEY = "chains_play_lastgroup";
  const LAST_COURSE_KEY = "chains_play_lastcourse";
  // 4.1 disc-count check: {skips, off}. Two skips → stop offering (Settings re-enables).
  const DISC_CHECK_KEY = "chains_disccheck_v1";
  function discPref() { try { return JSON.parse(localStorage.getItem(DISC_CHECK_KEY) || "{}"); } catch (e) { return {}; } }
  function setDiscPref(p) { try { localStorage.setItem(DISC_CHECK_KEY, JSON.stringify(p)); } catch (e) {} try { window.dispatchEvent(new Event("chains:disccheck")); } catch (e) {} }
  window.ChainsDiscCheck = { pref: discPref, set: setDiscPref };

  // Inject once: skeleton shimmer + button press feedback (available in every stage).
  (function injectPlayStyles() {
    if (typeof document === "undefined" || document.getElementById("chains-play-styles")) return;
    const s = document.createElement("style"); s.id = "chains-play-styles";
    s.textContent = "@keyframes cwShim{0%,100%{opacity:.5}50%{opacity:.9}}.cw-shimmer{animation:cwShim 1.3s ease-in-out infinite}.cw-press{transition:transform .1s ease}.cw-press:active{transform:scale(.96)}.gt-root button,.gt-sheet button{touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}.gt-strip::-webkit-scrollbar{display:none}@keyframes gtPop{0%{transform:scale(.5) rotate(-6deg);opacity:0}55%{transform:scale(1.08) rotate(2deg);opacity:1}100%{transform:scale(1) rotate(0)}}.gt-pop{animation:gtPop .45s cubic-bezier(.2,1.4,.4,1) both}@keyframes gtFall{0%{transform:translateY(-10vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.2}}.gt-confetti{position:absolute;top:0;width:10px;height:16px;border-radius:2px;animation:gtFall 2.6s ease-in both}@keyframes gtUp{0%{transform:translateY(40px);opacity:0}100%{transform:translateY(0);opacity:1}}.gt-sheet{animation:gtUp .22s ease-out both}@keyframes gtShine{0%{transform:translateX(-160%) rotate(20deg)}100%{transform:translateX(220%) rotate(20deg)}}.gt-ring{position:relative;overflow:hidden}.gt-ring.lv3::after{content:'';position:absolute;top:-30%;left:0;width:45%;height:160%;background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.75) 50%,rgba(255,255,255,0) 100%);animation:gtShine 2.6s ease-in-out infinite;pointer-events:none}@keyframes gtTwinkle{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.15)}}.gt-spark{position:absolute;font-size:11px;line-height:1;color:#fff;text-shadow:0 0 6px rgba(255,255,255,.9);animation:gtTwinkle 1.8s ease-in-out infinite;pointer-events:none}.gt-shame{filter:saturate(.75)}";
    document.head.appendChild(s);
  })();

  function getJSON(u) { return fetch(u, { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).catch(() => null); }
  // v480: rounds are owned by the Firebase ACCOUNT (owner = auth uid, what the rules
  // check) and labelled with the member id (ownerKey, what the UI compares). Old
  // records only carry owner = member id. One test for all three shapes.
  function ownsRound(r, me) {
    if (!r) return false;
    if (r.ownerKey) return r.ownerKey === me;
    if (!r.owner) return true;
    if (r.owner === me) return true;
    try { const u = window.ChainsID && ChainsID.uid && ChainsID.uid(); return !!u && r.owner === u; } catch (e) { return false; }
  }
  const onCard = (r, me) => !!(r && me && ((r.players && r.players[me]) || (r.participants && r.participants[me]) || (r.keys && [].concat(r.keys).indexOf(me) >= 0)));
  function fmtPar(v) { return v == null ? "E" : v === 0 ? "E" : v > 0 ? "+" + v : String(v); }
  function parColor(v) { return v == null || v === 0 ? "var(--text-strong)" : v < 0 ? "var(--score-under, #1a7a50)" : "var(--score-over, #c23a33)"; }
  // Firebase returns sparse arrays as objects ({"2":3}) — restore a real array,
  // each score kept at its hole index so pars stay aligned. Gaps become null.
  function toArr(hs) { if (Array.isArray(hs)) return hs; if (!hs || typeof hs !== "object") return []; const out = []; Object.keys(hs).forEach((k) => { const i = Math.floor(Number(k)); if (isFinite(i) && i >= 0) out[i] = hs[k]; }); for (let j = 0; j < out.length; j++) if (out[j] === undefined) out[j] = null; return out; }

  // Normalize a ChainsRounds record (new shape: players{}, course{}, owner, status)
  // into the legacy fields every existing screen reads (scores{}, group[], hole_scores{},
  // course_name, created_at, logged_by). Legacy records pass through untouched.
  function normalizeRound(r) {
    if (!r || !r.players || r.scores) return r;
    const keys = Object.keys(r.players);
    const group = keys.map((k) => ({ id: k, name: r.players[k].name, color: r.players[k].disc }));
    const scores = {}, hole_scores = {};
    keys.forEach((k) => { scores[k] = r.players[k].total; hole_scores[k] = r.players[k].holeScores != null ? toArr(r.players[k].holeScores) : null; });
    const c = r.course || {};
    return Object.assign({}, r, {
      course_name: c.name || r.course_name || "Round", course_id: c.id != null ? c.id : r.course_id,
      city: c.city || r.city || null, par_total: c.parTotal != null ? c.parTotal : r.par_total,
      pars: (c.pars || r.pars) != null ? toArr(c.pars || r.pars) : null, group: group, scores: scores, hole_scores: hole_scores,
      logged_by: r.ownerKey || r.owner || r.logged_by || null, created_at: r.created_at || r.startedAt || r.updatedAt || null,
    });
  }

  // Lifetime stats for `me` across normalized rounds: rounds played, best to-par,
  // scoring average, and per-hole birdie/par/bogey counts.
  function lifetimeStats(myRounds, me) {
    let rounds = 0, best = null, sumTp = 0, nTp = 0, ace = 0, eagle = 0, birdie = 0, par = 0, bogey = 0, dbl = 0;
    (myRounds || []).forEach((r) => {
      const tp = (r.scores && me != null) ? r.scores[me] : null;
      if (tp != null) { rounds++; sumTp += tp; nTp++; if (best == null || tp < best) best = tp; }
      const hs = (r.hole_scores && me != null && r.hole_scores[me] != null) ? toArr(r.hole_scores[me]) : null;
      const pars = r.pars != null ? toArr(r.pars) : null;
      if (hs && pars) hs.forEach((s, i) => { if (s != null && pars[i] != null) { const d = s - pars[i]; if (s === 1) ace++; else if (d <= -2) eagle++; else if (d === -1) birdie++; else if (d === 0) par++; else if (d === 1) bogey++; else dbl++; } });
    });
    return { rounds, best, avg: nTp ? sumTp / nTp : null, ace, eagle, birdie, par, bogey, dbl };
  }

  // My Stats (#next, Q2 scope): career summary, sub-par streaks, per-course
  // breakdown, and per-hole hot/cold — pure aggregation over the SAME normalized
  // fields lifetimeStats() reads above (r.scores{}, r.hole_scores{}, r.pars,
  // r.course_name/course_id, r.date). No schema change, no new Firebase reads.
  function myStatsFull(myRounds, me) {
    const withTp = (myRounds || [])
      .filter((r) => r.scores && me != null && r.scores[me] != null)
      .map((r) => ({ r, tp: r.scores[me], date: r.date || (r.created_at || "").slice(0, 10) }))
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.r.created_at || "").localeCompare(String(b.r.created_at || "")));
    let sum = 0, best = null, bestRound = null, bestStreak = 0, run = 0;
    withTp.forEach((x) => {
      sum += x.tp;
      if (best == null || x.tp < best) { best = x.tp; bestRound = x; }
      if (x.tp < 0) { run++; if (run > bestStreak) bestStreak = run; } else run = 0;
    });
    let curStreak = 0;
    for (let i = withTp.length - 1; i >= 0; i--) { if (withTp[i].tp < 0) curStreak++; else break; }
    const byCourse = {};
    withTp.forEach((x) => {
      const key = x.r.course_id != null ? String(x.r.course_id) : (x.r.course_name || "Unknown");
      if (!byCourse[key]) byCourse[key] = { name: x.r.course_name || "Round", rounds: 0, sum: 0, best: null, lastDate: null };
      const c = byCourse[key];
      c.rounds++; c.sum += x.tp; if (c.best == null || x.tp < c.best) c.best = x.tp;
      if (!c.lastDate || String(x.date) > String(c.lastDate)) c.lastDate = x.date;
    });
    const courses = Object.keys(byCourse).map((k) => { const c = byCourse[k]; return { name: c.name, rounds: c.rounds, avg: c.sum / c.rounds, best: c.best, lastDate: c.lastDate }; }).sort((a, b) => b.rounds - a.rounds);
    const byHole = {};
    (myRounds || []).forEach((r) => {
      if (me == null || !r.hole_scores || r.hole_scores[me] == null || !r.pars) return;
      const hs = toArr(r.hole_scores[me]), pars = toArr(r.pars);
      hs.forEach((s, i) => {
        if (s == null || pars[i] == null) return;
        const key = (r.course_id != null ? r.course_id : (r.course_name || "?")) + "#" + i;
        if (!byHole[key]) byHole[key] = { course: r.course_name || "Round", hole: i + 1, n: 0, sum: 0 };
        byHole[key].n++; byHole[key].sum += (s - pars[i]);
      });
    });
    const holeList = Object.keys(byHole).map((k) => byHole[k]).filter((h) => h.n >= 2).map((h) => Object.assign({}, h, { avg: h.sum / h.n }));
    const worstHoles = holeList.slice().sort((a, b) => b.avg - a.avg).slice(0, 3);
    const bestHoles = holeList.slice().sort((a, b) => a.avg - b.avg).slice(0, 3);
    return {
      rounds: withTp.length, avg: withTp.length ? sum / withTp.length : null, best,
      bestRound: bestRound ? { toPar: bestRound.tp, course: bestRound.r.course_name, date: bestRound.date } : null,
      curStreak, bestStreak, courses, worstHoles, bestHoles,
    };
  }

  // ---- course catalog (cache once) ---------------------------------------
  let CATALOG = null;
  const CAT_VER = "v516-" + (function () { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); })(); // rolls every Monday so pipeline updates reach phones without a release
  try { if (localStorage.getItem("chains_courses_cache_ver") === CAT_VER) CATALOG = JSON.parse(localStorage.getItem("chains_courses_cache") || "null"); } catch (e) {}
  // v531 — courses players add themselves (playerCourses/{id}); merged into the catalog on load.
  const ChainsPlayerCourses = {
    _list: null,
    load: function () {
      const d = cloudDb(); if (!d) return Promise.resolve(ChainsPlayerCourses._list || []);
      return d.ref("playerCourses").get().then((s) => { const v = s.val() || {}; const arr = Object.keys(v).map((id) => Object.assign({ id }, v[id])).filter((c) => c && c.name); ChainsPlayerCourses._list = arr; return arr; }).catch(() => ChainsPlayerCourses._list || []);
    },
    merge: function (cat) {
      const have = {}; (cat || []).forEach((c) => { if (c && c.id != null) have[c.id] = true; });
      (ChainsPlayerCourses._list || []).forEach((c) => { if (!have[c.id]) { cat.push(c); have[c.id] = true; } });
      return cat;
    },
    add: function (rec) {
      const d = cloudDb(); const me = (window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current();
      if (!d || !me) return Promise.reject(new Error("Sign in first"));
      const id = "pc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const pars = (rec.hole_pars || []).map((p) => Math.max(2, Math.min(6, Number(p) || 3)));
      const full = { id, name: String(rec.name || "").trim().slice(0, 60), city: String(rec.city || "").trim().slice(0, 40) || null, state: String(rec.state || "").trim().toUpperCase().slice(0, 2) || null,
        holes: pars.length, hole_pars: pars, par_total: pars.reduce((a, b) => a + b, 0), lat: rec.lat != null ? Number(rec.lat) : null, lng: rec.lng != null ? Number(rec.lng) : null,
        community: true, needs_review: true, addedBy: me, addedUid: u && u.uid ? u.uid : null, addedName: (window.ChainsFriends && ChainsFriends.myName ? ChainsFriends.myName() : me), createdAt: Date.now(), source: "player" };
      return d.ref("playerCourses/" + id).set(full).then(() => { ChainsPlayerCourses._list = (ChainsPlayerCourses._list || []).concat([full]); if (CATALOG) ChainsPlayerCourses.merge(CATALOG); return full; });
    },
  };
  window.ChainsPlayerCourses = ChainsPlayerCourses;
  function loadCatalog() {
    if (CATALOG) return Promise.resolve(CATALOG);
    return Promise.all([getJSON(COURSES_URL + "?v=" + CAT_VER), ChainsPlayerCourses.load()]).then(([j]) => {
      const arr = Array.isArray(j) ? j : (j && (j.courses || Object.values(j))) || [];
      ChainsPlayerCourses.merge(arr);
      CATALOG = arr;
      try { localStorage.setItem("chains_courses_cache", JSON.stringify(arr)); localStorage.setItem("chains_courses_cache_ver", CAT_VER); } catch (e) {}
      return arr;
    });
  }

  // ---- rounds feed -------------------------------------------------------
  // Stored in the NEW chains-app project (uid-aware, saves in every build) when
  // signed in; legacy chains-fantasy is only a read-fallback for the old app.
  function cloudDb() { try { return (window.ChainsFB && window.ChainsFB.ok) ? window.ChainsFB.db : null; } catch (e) { return null; } }
  function loadRounds() {
    // Prefer the identity-keyed store (chains-app, per-user index). Falls back to
    // the legacy global node only when signed out.
    if (window.ChainsRounds && window.ChainsRounds.available()) {
      return window.ChainsRounds.loadMine().then(function (arr) { var o = {}; (arr || []).forEach(function (r) { var n = normalizeRound(r); o[n.id] = n; }); return o; });
    }
    const d = cloudDb();
    if (d) return d.ref("playRounds").get().then((s) => s.val() || {}).catch(() => ({}));
    return getJSON(FB + "/play_rounds.json").then((j) => j || {});
  }
  function deleteRound(id) {
    // #43: AWAIT the real delete — never claim success while the remove is in
    // flight. ChainsRounds.remove covers local + cloud + index + legacy stores.
    if (window.ChainsRounds) { try { return Promise.resolve(window.ChainsRounds.remove(id)).then((ok) => ok !== false); } catch (e) {} }
    const d = cloudDb();
    if (d) { try { return d.ref("playRounds/" + id).remove().then(() => true).catch(() => false); } catch (e) { return Promise.resolve(false); } }
    return ChainsBuild.legacyWrite(FB + "/play_rounds/" + id + ".json", { method: "DELETE" }).then(() => true).catch(() => false);
  }
  // #36: shareable live-watch link — anyone with it can follow along, no account.
  function shareWatch(id) {
    const url = location.origin + location.pathname + "#watch=" + id;
    const done = () => { try { window.ChainsToast && ChainsToast.show("Watch link copied \u2014 anyone can follow along live.", "info"); } catch (e) {} };
    const manual = () => ChainsConfirm.copy({ title: "Watch link", message: "Anyone with this link can follow along live \u2014 no account needed.", text: url });
    if (navigator.share) { navigator.share({ title: "Watch our round live \u2014 Chains", url: url }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(url).then(done, manual); } catch (e) { manual(); }
  }
  function saveRound(round) {
    // Route through the identity-keyed store (chains-app, per-user index) so total-
    // mode rounds persist the same way hole-by-hole rounds do. Falls back to legacy
    // only when signed out.
    if (window.ChainsRounds && window.ChainsRounds.available()) {
      const id = "pr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const course = { id: round.course_id, name: round.course_name, city: round.city, hole_pars: round.pars, par_total: round.par_total, holes: round.pars ? round.pars.length : 18 };
      const ctx = { id: id, course: course, group: round.group, scores: round.hole_scores || {}, totals: round.scores || {}, pars: round.pars || null };
      window.ChainsRounds.start(ctx);
      window.ChainsRounds.finalize(Object.assign({ status: "final" }, ctx));
      return Promise.resolve(id);
    }
    const id = "pr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const full = Object.assign({ created_at: new Date().toISOString() }, round);
    const d = cloudDb();
    if (d) { try { return d.ref("playRounds/" + id).set(full).then(() => id).catch(() => null); } catch (e) { return Promise.resolve(null); } }
    return ChainsBuild.legacyWrite(FB + "/play_rounds/" + id + ".json", { method: "PUT", body: JSON.stringify(full) }).then(() => id).catch(() => null);
  }

  // Round INVITES live in chains-app (uid-aware, saves in every build) when signed
  // in; legacy chains-fantasy is only a read-fallback for the old app. Mirrors playRounds,
  // so the "invite the crew → RSVP" loop works in test/preview AND never touches the
  // live project. Shared on window so the Plan-a-round flow (view_plan.jsx) saves the same way.
  function loadInvitesData() {
    const d = cloudDb();
    if (d) return d.ref("playInvites").get().then((s) => s.val() || {}).catch(() => ({}));
    return getJSON(FB + "/play_invites.json").then((j) => j || {});
  }
  function saveInviteData(id, inv) {
    const d = cloudDb();
    if (d) { try { return d.ref("playInvites/" + id).set(inv).then(() => true).catch(() => false); } catch (e) { return Promise.resolve(false); } }
    return ChainsBuild.legacyWrite(FB + "/play_invites/" + id + ".json", { method: "PUT", body: JSON.stringify(inv) }).then(() => true).catch(() => false);
  }
  function setInviteRsvpData(id, who, val) {
    const d = cloudDb();
    if (d) { try { return d.ref("playInvites/" + id + "/rsvp/" + who).set(val).then(() => true).catch(() => false); } catch (e) { return Promise.resolve(false); } }
    return ChainsBuild.legacyWrite(FB + "/play_invites/" + id + "/rsvp/" + who + ".json", { method: "PUT", body: JSON.stringify(val) }).then(() => true).catch(() => false);
  }
  function deleteInviteData(id) {
    const d = cloudDb();
    if (d) { try { return d.ref("playInvites/" + id).remove().then(() => true).catch(() => false); } catch (e) { return Promise.resolve(false); } }
    return ChainsBuild.legacyWrite(FB + "/play_invites/" + id + ".json", { method: "DELETE" }).then(() => true).catch(() => false);
  }
  // #5: cancel a SENT invite safely. Re-reads fresh data right before confirming so a
  // response landing between "you see it" and "you tap cancel" is never silently run
  // over. loadInvitesData() swallows network errors to {} — an empty fresh read next
  // to a KNOWN prior invite is treated as a failed read, never as a real delete.
  function inviteHasResponses(inv, me) {
    const rsvp = (inv && inv.rsvp) || {};
    return Object.keys(rsvp).some((k) => k !== me);
  }
  function requestCancelInvite(id, me, knownInv, opts) {
    opts = opts || {};
    const toast = (msg, kind) => { try { window.ChainsToast && ChainsToast.show(msg, kind); } catch (e) {} };
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast("You\u2019re offline \u2014 reconnect to cancel this invite.", "error");
      if (opts.onError) opts.onError();
      return Promise.resolve(false);
    }
    return loadInvitesData().then((fresh) => {
      const sawAny = fresh && Object.keys(fresh).length > 0;
      const inv = fresh ? fresh[id] : null;
      if (!inv) {
        if (!sawAny && knownInv) { toast("Couldn\u2019t reach the network \u2014 try again.", "error"); if (opts.onError) opts.onError(); return false; }
        toast("That invite is already gone.", "info");
        if (opts.onGone) opts.onGone();
        return false;
      }
      if (inviteHasResponses(inv, me)) {
        toast("Someone already responded \u2014 open the invite to see who before canceling.", "info");
        if (opts.onChanged) opts.onChanged(inv);
        return false;
      }
      return ChainsConfirm.show({ title: "Cancel invite to " + (inv.course_name || "this round") + "?", message: "Nobody will be notified \u2014 it just disappears. This can\u2019t be undone.", confirmLabel: "Cancel invite", danger: true }).then((ok) => {
        if (!ok) return false;
        return deleteInviteData(id).then((okDel) => {
          if (okDel === false) { toast("Couldn\u2019t cancel \u2014 try again.", "error"); return false; }
          toast("Invite canceled.", "info");
          if (opts.onDeleted) opts.onDeleted();
          return true;
        });
      });
    });
  }
  window.ChainsPlayInvites = { load: loadInvitesData, save: saveInviteData, setRsvp: setInviteRsvpData, remove: deleteInviteData, requestCancel: requestCancelInvite };

  /* ============================ LANDING ================================= */
  // Friends' live rounds — real-time list (Phase 3). Subscribes to liveRounds and
  // shows "Will & Kyle — Mott Park · thru 7 · −3", tap to watch scores update live.
  /* v484: cheers + comments on a round. `rec` is the merged record (cheers{}, comments{}).
     compact = the scorer's own screen (one-line strip, tap to expand). */
  function LiveChatter({ id, rec, me, compact, mobile }) {
    const [open, setOpen] = React.useState(!compact);
    const [text, setText] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const cheers = rec && rec.cheers ? Object.keys(rec.cheers).map((k) => Object.assign({ key: k }, rec.cheers[k])).sort((a, b) => (b.ts || 0) - (a.ts || 0)) : [];
    const comments = rec && rec.comments ? Object.keys(rec.comments).map((k) => Object.assign({ key: k }, rec.comments[k])).sort((a, b) => (a.ts || 0) - (b.ts || 0)) : [];
    const mine = me ? cheers.find((c) => c.key === me) : null;
    const onCard = !!(rec && rec.players && me && rec.players[me]);
    const canPost = !!(me && window.ChainsRounds && ChainsRounds.comment);
    const EMOJI = ["🔥", "👏", "🎯", "😬"];
    function send() { const t = text.trim(); if (!t || busy) return; setBusy(true); Promise.resolve(ChainsRounds.comment(id, t, rec && rec.participants)).then(() => { setBusy(false); setText(""); }, () => setBusy(false)); }
    const rel = (ts) => { const m = Math.round((Date.now() - (ts || 0)) / 60000); return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d"; };
    const first = (n) => String(n || "").split(" ")[0];
    if (compact && !open) {
      if (!cheers.length && !comments.length) return null;
      return (
        <button onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer" }}>
          <span style={{ fontSize: 14 }}>{cheers.slice(0, 4).map((c) => c.emoji || "🔥").join("")}</span>
          <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-body)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cheers.length ? cheers.slice(0, 3).map((c) => first(c.name)).join(", ") + (cheers.length > 3 ? " +" + (cheers.length - 3) : "") + (cheers.length === 1 ? " is" : " are") + " watching" : ""}
            {cheers.length && comments.length ? " · " : ""}
            {comments.length ? comments.length + (comments.length === 1 ? " comment" : " comments") + (comments.length ? ": “" + comments[comments.length - 1].text + "”" : "") : ""}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 10, color: "var(--ace-700)" }}>Open</span>
        </button>
      );
    }
    return (
      <Card pad={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: "var(--text-muted)", flex: 1 }}>{onCard ? "Your gallery" : "Check in"}</span>
          {!onCard && me && EMOJI.map((e) => (
            <button key={e} onClick={() => { if (mine && mine.emoji === e) ChainsRounds.uncheer(id); else ChainsRounds.cheer(id, e); }} title="Check in" className="cw-press"
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid " + (mine && mine.emoji === e ? "var(--fairway-500)" : "var(--border-default)"), background: mine && mine.emoji === e ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>{e}</button>
          ))}
          {compact && <button onClick={() => setOpen(false)} aria-label="Collapse" style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--text-faint)" }}>×</button>}
        </div>
        {cheers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "9px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
            {cheers.map((c) => (
              <span key={c.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px 4px 5px", borderRadius: "var(--radius-pill)", background: "var(--bg-sunken)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-body)" }}>
                <span style={{ fontSize: 13 }}>{c.emoji || "🔥"}</span>{first(c.name)}{c.key === me ? " (you)" : ""}
              </span>
            ))}
          </div>
        )}
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          {comments.length === 0 ? (
            <div style={{ padding: "12px 14px", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>{onCard ? "No comments yet — friends who watch can cheer you on here." : "Say something — they see it on the course."}</div>
          ) : comments.map((c) => (
            <div key={c.key} style={{ display: "flex", gap: 9, padding: "9px 14px", borderTop: "1px solid var(--border-subtle)" }}>
              <Avatar name={c.name || c.by} color={c.by === me ? "var(--ace-500)" : "#9CA3AF"} size={24} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--text-strong)" }}>{first(c.name || c.by)} <span style={{ fontFamily: "var(--font-sans)", fontWeight: 400, textTransform: "none", color: "var(--text-faint)" }}>· {rel(c.ts)}</span></div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", lineHeight: 1.4, wordBreak: "break-word" }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        {canPost && (
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--border-subtle)" }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={onCard ? "Reply…" : "Comment…"} maxLength={280}
              style={{ flex: 1, minWidth: 0, height: 38, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13, background: "var(--bg-page)", outline: "none" }} />
            <button onClick={send} disabled={busy || !text.trim()} style={{ height: 38, padding: "0 14px", border: "none", borderRadius: "var(--radius-md)", background: text.trim() ? "var(--fairway-600)" : "var(--bg-sunken)", color: text.trim() ? "#fff" : "var(--text-faint)", cursor: text.trim() ? "pointer" : "default", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5 }}>Send</button>
          </div>
        )}
      </Card>
    );
  }

  function LiveNow({ me, onWatch, mobile }) {
    const [live, setLive] = React.useState(null);
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.watchLive) return;
      // #7: this list is friends-SPECTATING only now — my own open round gets a
      // direct Resume/Discard entry on the home screen instead (see cloudActive /
      // the active-round card below), so it never needs to hide inside this feed.
      const unsub = window.ChainsRounds.watchLive((list) => setLive((list || []).filter((r) => r && !ownsRound(r, me))));
      return unsub;
    }, [me]);
    if (!live || !live.length) return null;
    return (
      <div>
        <style>{"@keyframes cwLivePulse{0%,100%{opacity:1}50%{opacity:.35}}"}</style>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--live-500, #e0483d)", animation: "cwLivePulse 1.4s ease-in-out infinite" }} />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--live-600, #c23a33)" }}>Live now</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {live.map((r) => {
            const names = (r.players || []).join(" & ") || "A round";
            return (
              <button key={r.id} onClick={() => onWatch(r.id)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--live-300, #f0b9b3)", background: "var(--live-50, #fdeeec)", cursor: "pointer" }}>
                <span style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--live-500, #e0483d)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Disc size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{names}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{r.course}{r.city ? " · " + r.city : ""} · thru {r.thru || 0}{me && r.keys && [].concat(r.keys).indexOf(me) >= 0 ? <span style={{ color: "var(--fairway-700)", fontWeight: 700 }}> · you're on this card</span> : null}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: (r.toPar || 0) < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{fmtPar(r.toPar || 0)}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 9, color: "var(--live-600, #c23a33)" }}>{me && r.keys && [].concat(r.keys).indexOf(me) >= 0 ? "Score →" : "Watch →"}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Watch a friend's round update in real time (subscribes to the full record).
  function WatchRound({ id, me, onBack, onResume, onFinish, mobile }) {
    const [rec, setRec] = React.useState(undefined);
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.watchRound) { setRec(null); return; }
      const unsub = window.ChainsRounds.watchRound(id, (r) => setRec(r));
      return unsub;
    }, [id]);
    if (rec === undefined) return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><FlowHead title="Live round" onBack={onBack} /><SkeletonRows n={3} /></div>;
    if (!rec) return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}><FlowHead title="Live round" onBack={onBack} /><Card pad={22}><div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>This round isn't available — it may have finished or been removed.</div></Card></div>;
    const course = rec.course || {};
    const pars = course.pars || null;
    const N = course.holes || (pars ? pars.length : 18);
    const keys = Object.keys(rec.players || {});
    const ranked = keys.map((k) => Object.assign({ key: k }, rec.players[k])).sort((a, b) => (a.total || 0) - (b.total || 0));
    const maxThru = ranked.reduce((m, p) => Math.max(m, p.thru || 0), 0);
    const isFinal = rec.status === "final";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <style>{"@keyframes cwLivePulse{0%,100%{opacity:1}50%{opacity:.35}}"}</style>
        <FlowHead title={course.name || "Live round"} sub={(course.city ? course.city + " · " : "") + (isFinal ? "Final" : "Live · thru " + maxThru)} onBack={onBack} />
        {!isFinal && id ? <RoundQRToggle id={id} /> : null}
        {!isFinal && id ? <button onClick={() => shareWatch(id)} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11, color: "var(--text-body)" }}><span style={{ fontSize: 13, lineHeight: 1, display: "inline-flex" }}>⤴</span> Share watch link</button> : null}
        {!isFinal && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, alignSelf: "flex-start", padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--live-50, #fdeeec)", border: "1px solid var(--live-300, #f0b9b3)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live-500, #e0483d)", animation: "cwLivePulse 1.4s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: "var(--live-600, #c23a33)" }}>Updating live</span>
          </div>
        )}
        {/* my own open round — resume scoring / finish, never stuck in spectator mode */}
        {!isFinal && me && (ownsRound(rec, me) || onCard(rec, me)) && (onResume || onFinish) && (
          <div style={{ display: "flex", gap: 8 }}>
            {onResume && <Button variant="accent" full size="lg" onClick={() => onResume(rec)}>{ownsRound(rec, me) ? "Resume scoring →" : "Score this round →"}</Button>}
            {onFinish && <Button variant="secondary" size="lg" onClick={() => { ChainsConfirm.show({ title: "Finish round now?", message: "Holes without a score stay blank.", confirmLabel: "Finish round" }).then((ok) => { if (ok) onFinish(rec); }); }}>Finish round</Button>}
          </div>
        )}
        {!isFinal && me && ownsRound(rec, me) && <OwnerJoinRequests id={id} rec={rec} />}
        {!isFinal && me && !ownsRound(rec, me) && rec.players && !rec.players[me] && <AskToJoinRow id={id} me={me} rec={rec} />}
        {/* v484: cheers + comments */}
        {id ? <LiveChatter id={id} rec={rec} me={me} mobile={mobile} /> : null}
        {/* live leaderboard */}
        <Card pad={0}>
          {ranked.map((p, i) => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 15px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ width: 18, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 ? "var(--gold-600, #b8902a)" : "var(--text-faint)" }}>{i + 1}</span>
              <Avatar name={p.name} color={p.disc} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}{p.key === me ? " (you)" : ""}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>thru {p.thru || 0}</span>
              <span style={{ minWidth: 40, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 19, color: parColor(p.total) }}>{fmtPar(p.total)}</span>
            </div>
          ))}
        </Card>
        {/* live hole-by-hole grid */}
        {pars && maxThru > 0 && (
          <Card pad={0}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 320 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", padding: "8px 10px", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, color: "var(--text-faint)" }}>Hole</th>
                    {Array.from({ length: Math.min(N, maxThru) }, (_, i) => <th key={i} style={{ padding: "8px 7px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", minWidth: 26 }}>{i + 1}</th>)}
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", padding: "5px 10px", fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)" }}>Par</td>
                    {Array.from({ length: Math.min(N, maxThru) }, (_, i) => <td key={i} style={{ textAlign: "center", padding: "5px 7px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{pars[i]}</td>)}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((p) => (
                    <tr key={p.key} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", padding: "7px 10px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--text-strong)", whiteSpace: "nowrap" }}>{__fn(p.name)}</td>
                      {Array.from({ length: Math.min(N, maxThru) }, (_, i) => {
                        const s = (p.holeScores || [])[i], d = (s != null && pars[i] != null) ? s - pars[i] : null;
                        const bg = d == null ? "transparent" : d < 0 ? "var(--score-under, #1a7a50)" : d > 0 ? "var(--score-over, #c23a33)" : "transparent";
                        const fg = d != null && d !== 0 ? "#fff" : "var(--text-strong)";
                        return <td key={i} style={{ textAlign: "center", padding: "6px 7px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, background: bg, color: s == null ? "var(--text-faint)" : fg }}>{s == null ? "·" : s}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  /* Shared scoring: score YOUR row in someone else's live round. Writes are
     path-separated (players/{me} only) so scorers can't clobber each other. */
  function MyRowScorer({ rec, id, me, pars }) {
    const N = pars ? pars.length : 18;
    const mine = (rec.players && rec.players[me]) || {};
    const hs = Array.isArray(mine.holeScores) ? mine.holeScores.slice() : Object.assign([], mine.holeScores || {});
    const firstOpen = (() => { for (let i = 0; i < N; i++) if (hs[i] == null) return i; return N - 1; })();
    const [hole, setHole] = React.useState(firstOpen);
    const par = (pars && pars[hole] != null) ? pars[hole] : 3;
    const scored = hs[hole] != null;
    const cur = scored ? hs[hole] : par;
    function write(v) {
      const next = hs.slice(); next[hole] = v;
      ChainsRounds.scorePatch(id, me, next, pars);
    }
    const rb = { width: 46, height: 46, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: "var(--text-strong)" };
    return (
      <Card pad={14}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12.5, color: "var(--text-strong)" }}>Score my card</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>Writes only your row — everyone sees it live</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <button onClick={() => setHole((h) => Math.max(0, h - 1))} style={Object.assign({}, rb, { width: 38, height: 38, fontSize: 16 })}>‹</button>
          <div style={{ textAlign: "center", minWidth: 86 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>Hole {hole + 1}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)" }}>Par {par}{scored ? "" : " · unscored"}</div>
          </div>
          <button onClick={() => setHole((h) => Math.min(N - 1, h + 1))} style={Object.assign({}, rb, { width: 38, height: 38, fontSize: 16 })}>›</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 10 }}>
          <button onClick={() => write(Math.max(1, cur - 1))} style={rb}>−</button>
          <button onClick={() => { write(cur); if (!scored && hole < N - 1) setHole(hole + 1); }} title={scored ? "Saved" : "Tap to save " + cur} style={{ minWidth: 64, height: 56, borderRadius: 12, border: scored ? "2px solid var(--fairway-500, #3d8f5f)" : "2px dashed var(--border-default)", background: scored ? "var(--fairway-50, #eef6f0)" : "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 26, color: scored ? "var(--fairway-700, #1f5133)" : "var(--text-muted)" }}>{cur}</button>
          <button onClick={() => write(cur + 1)} style={rb}>+</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>{scored ? "Saved — use −/+ to correct, ‹ › to move holes." : "Tap the number to save par, or −/+ first."}</div>
      </Card>
    );
  }

  /* #36: round QR — encodes the same watch link, so a native camera works with
     no in-app scanner. Toggle to keep the header compact by default. */
  function RoundQRToggle({ id }) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (open && ref.current && window.ChainsQR) {
        const url = location.origin + location.pathname + "#watch=" + id;
        ref.current.innerHTML = "";
        try { ref.current.appendChild(ChainsQR.toCanvas(url, 168)); } catch (e) {}
      }
    }, [open, id]);
    return (
      <div style={{ alignSelf: "flex-start" }}>
        <button onClick={() => setOpen((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11, color: "var(--text-body)" }}>{open ? "Hide QR" : "Show QR"}</button>
        {open && <div style={{ marginTop: 10, padding: 14, background: "#fff", borderRadius: 14, border: "1px solid var(--border-subtle)", width: "fit-content" }}><div ref={ref} style={{ width: 168, height: 168 }} /></div>}
      </div>
    );
  }
  /* #3: owner sees a tap-to-approve card per pending join request — auto-approves
     instantly if the requester is already a friend (uid carried in the request). */
  function OwnerJoinRequests({ id, rec }) {
    const reqs = rec.joinRequests || {};
    const keys = Object.keys(reqs);
    const autoDone = React.useRef({});
    React.useEffect(() => {
      keys.forEach((k) => {
        const r = reqs[k];
        if (!autoDone.current[k] && r && r.uid && window.ChainsFriends && ChainsFriends.isFriend && ChainsFriends.isFriend(r.uid)) {
          autoDone.current[k] = true;
          ChainsRounds.approveJoin(id, k);
          if (window.ChainsToast) ChainsToast.show((r.name || "Your friend") + " joined the round", "info");
        }
      });
    }, [keys.join(",")]);
    const pending = keys.filter((k) => !autoDone.current[k]);
    if (!pending.length) return null;
    return (
      <Card pad={0} style={{ alignSelf: "stretch" }}>
        {pending.map((k, idx) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", borderTop: idx ? "1px solid var(--border-subtle)" : "none" }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{(reqs[k] && reqs[k].name) || k} wants to join</span>
            <button onClick={() => ChainsRounds.approveJoin(id, k)} style={{ height: 32, padding: "0 14px", border: "none", borderRadius: "var(--radius-pill)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5 }}>Approve</button>
            <button onClick={() => ChainsRounds.declineJoin(id, k)} title="Decline" style={{ height: 32, width: 32, border: "1px solid var(--border-default)", borderRadius: "50%", background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontWeight: 700, fontSize: 15 }}>×</button>
          </div>
        ))}
      </Card>
    );
  }
  /* Someone watching who ISN'T on the card yet — ask the owner to add them. */
  function AskToJoinRow({ id, me, rec }) {
    const mine = rec.joinRequests && rec.joinRequests[me];
    if (mine) return <div style={{ alignSelf: "flex-start", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", fontStyle: "italic" }}>Waiting for the owner to approve…</div>;
    function ask() {
      const uid = (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current() || {}).uid || null;
      ChainsRounds.requestJoin(id, me, { name: me, uid: uid });
      if (window.ChainsToast) ChainsToast.show("Asked to join — they'll get a tap-to-approve prompt.", "info");
    }
    return (
      <button onClick={ask} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 15px", borderRadius: "var(--radius-pill)", border: "1px solid var(--fairway-500)", background: "var(--fairway-50)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5, color: "var(--fairway-700)" }}>+ Ask to join this card</button>
    );
  }

  // Disc counter (owner request): log your bag count heading out, count again when
  // you're back; it tells you if any discs went to the woods/water. Persists locally.
  function DiscCounter({ mobile }) {
    const KEY = "chains_disc_counter_v1";
    const [bagCount, setBagCount] = React.useState(() => (window.ChainsBag && window.ChainsBag.effectiveCount) ? window.ChainsBag.effectiveCount() : 0);
    const [state, setState] = React.useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } });
    const [draft, setDraft] = React.useState(state ? state.start : (bagCount || 12));
    // v492: the bag list is the count — follow it live (adding a disc bumps "heading out with N").
    React.useEffect(() => { const fn = () => { const n = window.ChainsBag && window.ChainsBag.effectiveCount ? window.ChainsBag.effectiveCount() : 0; setBagCount(n); if (!state && n > 0) setDraft(n); }; window.addEventListener("chains:bag", fn); return () => window.removeEventListener("chains:bag", fn); }, [state]);
    const [endVal, setEndVal] = React.useState(state ? state.start : (bagCount || 12));
    const save = (s) => { setState(s); try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch (e) {} };
    const numBox = { width: 64, height: 52, textAlign: "center", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, color: "var(--text-strong)", outline: "none" };
    const stepBtnSm = { width: 44, height: 44, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: "var(--text-strong)" };
    const step = (val, set, d) => () => set(Math.max(0, val + d));
    let body;
    if (!state) {
      body = E("div", { style: { display: "flex", flexDirection: "column", gap: 11 } },
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" } }, bagCount > 0 ? "Your bag lists " + bagCount + " disc" + (bagCount === 1 ? "" : "s") + ". Heading out with all of them?" : "How many discs are in your bag? Log it before you head out."),
        E("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12 } },
          E("button", { onClick: step(draft, setDraft, -1), className: "cw-press", style: stepBtnSm }, "−"),
          E("input", { type: "number", value: draft, onChange: (e) => setDraft(Math.max(0, parseInt(e.target.value, 10) || 0)), style: numBox }),
          E("button", { onClick: step(draft, setDraft, 1), className: "cw-press", style: stepBtnSm }, "+")),
        E("button", { onClick: () => { save({ start: draft, out: true, at: Date.now() }); setEndVal(draft); }, style: { padding: "13px", borderRadius: "var(--radius-md)", border: "none", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14 } }, "Heading out with " + draft + " discs"));
    } else if (!state.done) {
      body = E("div", { style: { display: "flex", flexDirection: "column", gap: 11 } },
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" } }, "You headed out with ", E("b", { style: { color: "var(--text-strong)" } }, state.start, " discs"), ". Back at the car? Count again."),
        E("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12 } },
          E("button", { onClick: step(endVal, setEndVal, -1), className: "cw-press", style: stepBtnSm }, "−"),
          E("input", { type: "number", value: endVal, onChange: (e) => setEndVal(Math.max(0, parseInt(e.target.value, 10) || 0)), style: numBox }),
          E("button", { onClick: step(endVal, setEndVal, 1), className: "cw-press", style: stepBtnSm }, "+")),
        E("div", { style: { display: "flex", gap: 8 } },
          E("button", { onClick: () => save(Object.assign({}, state, { done: true, end: endVal })), style: { flex: 1, padding: "13px", borderRadius: "var(--radius-md)", border: "none", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14 } }, "Count my bag"),
          E("button", { onClick: () => save(null), style: { padding: "13px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13 } }, "Cancel")));
    } else {
      const lost = state.start - state.end;
      body = E("div", { style: { display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center" } },
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, color: lost > 0 ? "var(--score-over, #c23a33)" : lost < 0 ? "var(--ace-600)" : "var(--score-under, #1a7a50)" } }, lost > 0 ? "Missing " + lost + " disc" + (lost > 1 ? "s" : "") + "" : lost < 0 ? "Up " + (-lost) + " disc" + (-lost > 1 ? "s" : "") + "" : "All " + state.start + " accounted for"),
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" } }, "Out with " + state.start + " · back with " + state.end + (lost > 0 ? " · check the water hazard" : "")),
        E("button", { onClick: () => save(null), style: { padding: "11px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 } }, "Done"));
    }
    return E("div", { style: { padding: "13px 15px", borderRadius: "var(--radius-lg)", border: "1px solid " + (state && !state.done ? "var(--fairway-400, #6fae84)" : "var(--border-subtle)"), background: "var(--bg-elevated)" } },
      E("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } },
        E("span", { style: { width: 18, height: 18, color: "var(--ace-700)" } }, E(Icons.Disc, { size: 18 })),
        E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12, color: "var(--text-muted)" } }, "Disc counter"),
        state && !state.done ? E("span", { style: { marginLeft: "auto", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "var(--fairway-700)" } }, "● Out on a round") : null),
      body);
  }

  // Rivalries (head-to-head): your W-L-T vs each friend across rounds you both played.
  function Rivalries({ me, mobile }) {
    const [recs, setRecs] = React.useState(null);
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.loadGroup) { setRecs({}); return; }
      let alive = true;
      window.ChainsRounds.loadGroup().then((rounds) => { if (alive) setRecs(window.ChainsRounds.headToHead(rounds, me)); }).catch(() => { if (alive) setRecs({}); });
      return () => { alive = false; };
    }, []);
    if (!recs) return null;
    const rows = Object.keys(recs).map((k) => Object.assign({ key: k }, recs[k])).filter((r) => r.rounds > 0).sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses));
    if (!rows.length) return null;
    return E("div", null,
      E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 } }, "Rivalries"),
      E(Card, { pad: 0 }, rows.map((r, i) => {
        const edge = r.wins - r.losses;
        return E("div", { key: r.key, style: { display: "flex", alignItems: "center", gap: 11, padding: "11px 15px", borderTop: i ? "1px solid var(--border-subtle)" : "none" } },
          E(Avatar, { name: r.name, color: r.disc, size: 28 }),
          E("div", { style: { flex: 1, minWidth: 0 } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "vs ", r.name),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" } }, edge > 0 ? "you lead" : edge < 0 ? "you trail" : "all square", r.ties ? " · " + r.ties + " tied" : "")),
          E("span", { style: { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: edge > 0 ? "var(--score-under, #1a7a50)" : edge < 0 ? "var(--score-over, #c23a33)" : "var(--text-strong)" } }, r.wins, "\u2013", r.losses));
      })));
  }

  // Aces — the holy grail. A live group feed; auto-logged from the scorecard or
  // tapped manually here. Logging pings the whole crew (ChainsNotify).
  function AcesWall({ me, mobile }) {
    const [, force] = React.useState(0);
    React.useEffect(() => {
      if (window.ChainsAces) window.ChainsAces.pull();
      const fn = () => force((x) => x + 1); window.addEventListener("chains:aces", fn);
      return () => window.removeEventListener("chains:aces", fn);
    }, []);
    if (!window.ChainsAces) return null;
    const feed = window.ChainsAces.feed();

    return E("div", null,
      E("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 } },
        E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" } }, "Ace wall")),
      feed.length === 0
        ? E(Card, { pad: 18 }, E("div", { style: { textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, "No aces yet. Hit chains from the tee and it lands here — your friends get told."))
        : E(Card, { pad: 0 }, feed.slice(0, 5).map((a, i) => E("div", { key: a.id, style: { display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" } },
          E(Avatar, { name: a.name, color: a.disc, size: 28 }),
          E("div", { style: { flex: 1, minWidth: 0 } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" } }, a.name, a.who === me ? " (you)" : "", " aced hole ", a.hole),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, a.course + " · " + (a.date || ""))),
          E("span", { style: { display: "inline-flex", color: "var(--ace-700)" } }, E(Icons.Star, { size: 20 }))))));
  }

  // Badges — derived from your rounds/aces/rivalries. Earned ones pop; locked ones dim.
  /* ===================== v488 shared round UI ===================== */
  // Per-player hole breakdown for the bars: birdie-or-better / par / bogey-or-worse.
  function holeMix(hs, pars) {
    let u = 0, p = 0, o = 0, n = 0;
    (hs || []).forEach((s, i) => { if (s == null || !pars || pars[i] == null) return; n++; const d = s - pars[i]; if (d < 0) u++; else if (d === 0) p++; else o++; });
    return { under: u, par: p, over: o, n, pct: n ? Math.round(100 * u / n) : 0 };
  }
  function strokesOf(hs) { let t = 0; (hs || []).forEach((s) => { if (s != null) t += s; }); return t; }
  // Big "+1 (55)" hero with rating + facts. `players`: [{id,name,color,hs,tp}], me.
  function ScoreHero({ title, sub, tp, strokes, rating, ratingLabel, facts, tone }) {
    return (
      <div style={{ padding: "18px 18px 16px", borderRadius: "var(--radius-lg)", background: tone === "dark" ? "linear-gradient(160deg, var(--bg-ink), var(--bg-ink-deep, #0b1a12))" : "var(--bg-elevated)", border: tone === "dark" ? "none" : "1px solid var(--border-subtle)", color: tone === "dark" ? "var(--bone-50)" : "var(--text-strong)" }}>
        {title ? <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, lineHeight: 1.05 }}>{title}</div> : null}
        {sub ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, opacity: .8, marginTop: 3 }}>{sub}</div> : null}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: title ? 14 : 0 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 48, lineHeight: 1, color: tone === "dark" ? (tp < 0 ? "var(--birdie-400, #6ee7a8)" : tp > 0 ? "#ff9b8a" : "var(--bone-50)") : parColor(tp) }}>{fmtPar(tp)}{strokes != null ? <span style={{ fontSize: 22, fontWeight: 700, opacity: .75 }}> ({strokes})</span> : null}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, opacity: .7, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>Round score</div>
          </div>
          {rating != null && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 30, lineHeight: 1, color: tone === "dark" ? "var(--ace-400)" : "var(--ace-600)" }}>{rating}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, opacity: .7, marginTop: 4, textTransform: "uppercase", letterSpacing: ".08em" }}>{ratingLabel || "Chains rating"}</div>
            </div>
          )}
        </div>
        {facts && facts.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 14, fontFamily: "var(--font-sans)", fontSize: 13, opacity: .85 }}>
            {facts.map((f, i) => <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{f}</span>)}
          </div>
        ) : null}
      </div>
    );
  }
  // Ranked player rows with strokes and a birdie / par / bogey bar.
  function PlayerOverview({ players, pars, me, title }) {
    const sorted = players.slice().sort((a, b) => (a.tp == null ? 999 : a.tp) - (b.tp == null ? 999 : b.tp));
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {title ? <div style={{ padding: "12px 14px 4px", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>{title}</div> : null}
        {sorted.map((p, i) => {
          const mix = holeMix(p.hs, pars); const strokes = strokesOf(p.hs);
          return (
            <div key={p.id} style={{ padding: "12px 14px", borderTop: i || title ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 18, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: i === 0 && p.tp != null ? "var(--gold-600, #b8860b)" : "var(--text-faint)", textAlign: "center" }}>{p.tp != null ? i + 1 : "–"}</span>
                {p.color ? <Avatar name={p.name} color={p.color} size={34} /> : <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--chain-300)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12 }}>{String(p.name || "?").slice(0, 2).toUpperCase()}</span>}
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.display || p.name}{p.id === me ? <span style={{ fontWeight: 400, color: "var(--text-faint)" }}> · you</span> : null}{i === 0 && p.tp != null && sorted.length > 1 ? " · leader" : ""}{p.id && !/^guest/.test(p.id) ? <BadgeChip uid={p.id} size={18} /> : null}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: parColor(p.tp) }}>{p.tp == null ? "—" : fmtPar(p.tp)}{mix.n ? <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)" }}> ({strokes})</span> : null}</span>
              </div>
              {mix.n > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, paddingLeft: 30 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", width: 72, flexShrink: 0 }}><b style={{ color: "var(--score-under, #1a7a50)" }}>{mix.pct}%</b> birdies</span>
                  <div style={{ flex: 1, display: "flex", height: 18, borderRadius: 9, overflow: "hidden", background: "var(--bg-sunken)" }}>
                    {mix.under > 0 && <span style={{ width: (100 * mix.under / mix.n) + "%", background: "var(--score-under, #1a7a50)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{mix.under}</span>}
                    {mix.par > 0 && <span style={{ width: (100 * mix.par / mix.n) + "%", background: "var(--bone-200, #e6e1d6)", color: "var(--text-strong)", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{mix.par}</span>}
                    {mix.over > 0 && <span style={{ width: (100 * mix.over / mix.n) + "%", background: "var(--score-over, #c23a33)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{mix.over}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  // Read-only scorecard: Hole / Dist / Par rows, then each player, split into nines.
  function ScorecardTable({ players, pars, lens, me, onCell, sel }) {
    const N = pars ? pars.length : Math.max.apply(null, players.map((p) => (p.hs || []).length).concat([0]));
    if (!N) return null;
    const half = N >= 12 ? Math.ceil(N / 2) : N;
    const halves = N > half ? [[0, half], [half, N]] : [[0, N]];
    const th = { fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 10.5, color: "var(--text-faint)", textAlign: "center", padding: "3px 0" };
    const lab = { position: "sticky", left: 0, background: "var(--bg-elevated)", zIndex: 2, textAlign: "left", paddingLeft: 10, paddingRight: 6, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" };
    const sum = (arr, a, b) => { let s = 0, any = false; for (let i = a; i < b; i++) if (arr && arr[i] != null) { s += arr[i]; any = true; } return any ? s : null; };
    const tpOf = (arr, a, b) => { let s = 0, any = false; for (let i = a; i < b; i++) if (arr && arr[i] != null && pars && pars[i] != null) { s += arr[i] - pars[i]; any = true; } return any ? s : null; };
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px 6px", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Scorecard</div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "0 6px 10px" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
            {halves.map(([a, b], hi) => (
              <tbody key={hi} style={{ borderTop: hi ? "1px solid var(--border-subtle)" : "none" }}>
                <tr><th style={Object.assign({}, lab, th, { textAlign: "left" })}>Hole</th>{Array.from({ length: b - a }, (_, k) => <th key={k} style={Object.assign({}, th, { minWidth: 28, color: "var(--text-strong)", fontWeight: 700 })}>{a + k + 1}</th>)}<th style={th}>{a === 0 ? "Out" : "In"}</th>{b === N && <th style={th}>Tot</th>}{b === N && <th style={th}>+/−</th>}</tr>
                {lens && lens.some((x) => x) && <tr><td style={lab}>Dist</td>{Array.from({ length: b - a }, (_, k) => <td key={k} style={Object.assign({}, th, { fontFamily: "var(--font-mono)", fontSize: 9.5 })}>{lens[a + k] || ""}</td>)}<td /><td />{b === N && <td />}</tr>}
                {pars && <tr><td style={lab}>Par</td>{Array.from({ length: b - a }, (_, k) => <td key={k} style={Object.assign({}, th, { fontFamily: "var(--font-mono)" })}>{pars[a + k]}</td>)}<td style={Object.assign({}, th, { fontFamily: "var(--font-mono)" })}>{sum(pars, a, b)}</td>{b === N && <td style={Object.assign({}, th, { fontFamily: "var(--font-mono)" })}>{sum(pars, 0, N)}</td>}{b === N && <td />}</tr>}
                {players.map((p) => (
                  <tr key={p.id}>
                    <td style={Object.assign({}, lab, { fontWeight: 700, fontSize: 12, color: p.id === me ? "var(--ace-600)" : "var(--text-strong)", maxWidth: 84, overflow: "hidden", textOverflow: "ellipsis" })}>{String(p.name || "").split(" ")[0]}</td>
                    {Array.from({ length: b - a }, (_, k) => {
                      const h = a + k; const v = p.hs ? p.hs[h] : null; const d = v != null && pars && pars[h] != null ? v - pars[h] : null;
                      const isSel = sel && sel.gid === p.id && sel.i === h;
                      const bg = d == null ? "transparent" : d <= -2 ? "var(--gold-500, #d4a017)" : d < 0 ? "var(--score-under, #1a7a50)" : d > 0 ? (d >= 2 ? "var(--score-over, #c23a33)" : "var(--bogey-100, #f7d9d6)") : "transparent";
                      const fg = d == null ? "var(--text-faint)" : d < 0 || d >= 2 ? "#fff" : "var(--text-strong)";
                      return <td key={h} style={{ padding: 1 }}><span onClick={onCell ? () => onCell(p.id, h) : undefined} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "100%", minWidth: 26, height: 28, borderRadius: 8, background: bg, color: fg, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, border: isSel ? "2px solid var(--ace-500)" : "1px solid transparent", cursor: onCell ? "pointer" : "default" }}>{v == null ? "·" : v}</span></td>;
                    })}
                    <td style={Object.assign({}, th, { fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-strong)" })}>{sum(p.hs, a, b) == null ? "—" : sum(p.hs, a, b)}</td>
                    {b === N && <td style={Object.assign({}, th, { fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-strong)" })}>{sum(p.hs, 0, N) == null ? "—" : sum(p.hs, 0, N)}</td>}
                    {b === N && <td style={Object.assign({}, th, { fontFamily: "var(--font-mono)", fontWeight: 800, color: parColor(tpOf(p.hs, 0, N)) })}>{tpOf(p.hs, 0, N) == null ? "—" : fmtPar(tpOf(p.hs, 0, N))}</td>}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    );
  }
  // Badge unlock reveal — pops each new badge in, one after another.
  // v526 — every trophy renders an SVG glyph (never the emoji in the ladder data).
  function BadgeIcon({ b, size, color }) {
    const nm = window.ChainsBadges && ChainsBadges.glyphName ? ChainsBadges.glyphName(b) : "Trophy";
    const I = (window.Icons && Icons[nm]) || (window.Icons && Icons.Trophy);
    if (!I) return null;
    return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size || 20, height: size || 20, color: color || "currentColor", flexShrink: 0 }}><I size={size || 20} /></span>;
  }
  window.BadgeIcon = BadgeIcon;
  function NewBadgesReveal({ items: itemsIn }) {
    if (!itemsIn || !itemsIn.length) return null;
    const rank = (b) => (b.level || 0) * 10 + (b.tiers && b.tiers.length > 1 ? 1 : 0);
    const items = itemsIn.slice().sort((a, b) => rank(b) - rank(a)).slice(0, 5);
    const more = itemsIn.length - items.length;
    const tc = (b) => (window.ChainsBadges && ChainsBadges.tierColor ? ChainsBadges.tierColor(b) : null) || "var(--fairway-600)";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 13, color: "var(--ace-700)", textAlign: "center" }}>{items.length === 1 ? "New badge unlocked" : items.length + " new badges unlocked"}</div>
        {items.map((b, i) => (
          <div key={b.id} className="gt-pop" style={{ animationDelay: (i * 0.25) + "s", display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius-lg)", background: "var(--bg-elevated)", border: "2px solid " + tc(b), boxShadow: "0 10px 30px -16px " + tc(b) }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, " + tc(b) + ", var(--bg-sunken))", boxShadow: "inset 0 0 0 3px var(--bg-elevated)", color: "#fff" }}><BadgeIcon b={b} size={26} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 16, color: "var(--text-strong)" }}>{b.name}{b.tier && b.tiers.length > 1 ? <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#fff", background: tc(b) }}>{b.tier}</span> : null}</span>
              <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{b.how}{b.detail ? " · " + b.detail : ""}</span>
            </span>
          </div>
        ))}
        {more > 0 && <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", padding: "4px 0" }}>+{more} more in your trophy case</div>}
      </div>
    );
  }
  // Trophy case: earned badges with tier rings; tap for the full ladder.
  // v527 — one way to compute the trophy set (rounds + fantasy season) so every screen shows the same points.
  function loadBadges(me) {
    return Promise.all([
      window.ChainsRounds.loadGroup().catch(() => []),
      (window.ExploreData ? window.ExploreData.loadSeason("2026").catch(() => null) : Promise.resolve(null))
    ]).then(([rounds, season]) => window.ChainsBadges.compute(rounds, me, season));
  }
  function BadgeShelf({ me, mobile }) {
    const [data, setData] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    const [, setFeat] = React.useState(0);
    React.useEffect(() => {
      if (!window.ChainsBadges || !window.ChainsRounds) { setData(null); return; }
      let alive = true;
      Promise.all([
        window.ChainsRounds.loadGroup().catch(() => []),
        (window.ExploreData ? window.ExploreData.loadSeason("2026").catch(() => null) : Promise.resolve(null))
      ]).then(([rounds, season]) => { if (alive) setData(window.ChainsBadges.compute(rounds, me, season)); });
      return () => { alive = false; };
    }, []);
    if (!data) return null;
    const tc = (b) => (window.ChainsBadges.tierColor && ChainsBadges.tierColor(b)) || "var(--fairway-600)";
    const earned = data.badges.filter((b) => b.earned).sort((a, b) => (b.level - a.level) || (b.points - a.points));
    const visible = data.badges.filter((b) => b.earned || !b.secret);
    const closest = visible.filter((b) => !b.maxed).sort((a, b) => b.progress - a.progress).slice(0, 3);
    // Rings get richer as the tier rises: bronze = flat ring, silver = brushed metal,
    // gold = metallic + moving shine, platinum/diamond = shine + twinkling sparks.
    const ring = (b, size) => {
      const lv = b.earned ? Math.min(b.level, 5) : 0;
      const col = tc(b);
      const deg = Math.round(b.progress * 360);
      const metal = lv >= 2 ? "linear-gradient(135deg, #fff 0%, " + col + " 35%, " + col + " 65%, #fff 100%)" : col;
      const bg = !b.earned ? "conic-gradient(var(--border-default) " + deg + "deg, var(--bg-sunken) 0)" : b.maxed ? metal : "conic-gradient(" + col + " " + deg + "deg, var(--bg-sunken) 0)";
      const halo = lv >= 3 ? "0 0 0 2px var(--bg-elevated), 0 0 " + (lv >= 4 ? 18 : 10) + "px " + col : "none";
      return (
        <span className={"gt-ring" + (lv >= 3 ? " lv3" : "") + (b.shame ? " gt-shame" : "")} style={{ position: "relative", width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * .5, background: bg, filter: b.earned ? "none" : "grayscale(1)", opacity: b.earned ? 1 : .55, boxShadow: halo, border: lv >= 2 ? "1px solid rgba(255,255,255,.6)" : "none" }}>
          <span style={{ width: size - (lv >= 3 ? 10 : 8), height: size - (lv >= 3 ? 10 : 8), borderRadius: "50%", background: lv >= 4 ? "radial-gradient(circle at 35% 30%, #fff, var(--bg-elevated) 70%)" : "var(--bg-elevated)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: b.earned ? (col || "var(--fairway-700)") : "var(--text-faint)" }}><BadgeIcon b={b} size={Math.round(size * .42)} /></span>
          {lv >= 4 ? ["✦", "✧", "✦"].map((ch, i) => <span key={i} className="gt-spark" style={{ top: ["8%", "70%", "40%"][i], left: ["68%", "10%", "84%"][i], animationDelay: (i * 0.6) + "s", color: lv >= 5 ? "#c8b6ff" : "#fff" }}>{ch}</span>) : null}
        </span>
      );
    };
    return (
      <div>
        {open && (
          <Portal><div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 600, maxHeight: "88vh", overflowY: "auto", background: "var(--bg-page, #f6f4ee)", borderRadius: "22px 22px 0 0", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 6px", position: "sticky", top: 0, background: "var(--bg-page, #f6f4ee)", zIndex: 1 }}>
                <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Trophy case · {earned.length}/{data.badges.length}</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>{data.points || 0} trophy points · Bronze 1 · Silver 2 · Gold 3 · Platinum 5 · Diamond 8 · tap ☆ Feature to wear one</span></span>
                <button onClick={() => setOpen(false)} style={{ height: 40, padding: "0 10px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ace-700)" }}>Done</button>
              </div>
              {data.cats.map((cat) => (
                <div key={cat} style={{ padding: "6px 16px 10px" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".08em", margin: "8px 0 6px" }}>{cat}</div>
                  <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                    {data.badges.filter((b) => b.cat === cat && (b.earned || !b.secret)).map((b, i) => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                        {ring(b, 46)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: b.earned ? "var(--text-strong)" : "var(--text-muted)", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>{b.name}{b.earned ? <button onClick={(e) => { e.stopPropagation(); const cur = featuredOf(me); const on = cur && cur.id === b.id; try { ChainsFriends.setFeaturedBadge(on ? null : { id: b.id, icon: b.icon, name: b.name, tier: b.tiers.length > 1 ? b.tier : null, color: tc(b) }); } catch (err) {} setFeat((n) => n + 1); }} style={{ marginLeft: "auto", height: 26, padding: "0 10px", borderRadius: 13, border: "1px solid " + ((featuredOf(me) || {}).id === b.id ? tc(b) : "var(--border-default)"), background: (featuredOf(me) || {}).id === b.id ? tc(b) : "transparent", color: (featuredOf(me) || {}).id === b.id ? "#fff" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11 }}>{(featuredOf(me) || {}).id === b.id ? "Your title" : "Make it my title"}</button> : null}{b.tier && b.tiers.length > 1 ? <span style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, color: "#fff", background: tc(b) }}>{b.tier}</span> : null}</div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{b.how}</div>
                          {!b.maxed ? <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}><div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg-sunken)", overflow: "hidden" }}><div style={{ width: Math.round(b.progress * 100) + "%", height: "100%", background: b.earned ? tc(b) : "var(--fairway-500)" }} /></div><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{b.value}/{b.next}</span></div> : <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: tc(b), fontWeight: 700, marginTop: 3 }}>Maxed out · {b.detail}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.badges.some((b) => b.secret && !b.earned) && <div style={{ padding: "4px 16px 18px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", textAlign: "center" }}>+ {data.badges.filter((b) => b.secret && !b.earned).length} secret badge{data.badges.filter((b) => b.secret && !b.earned).length === 1 ? "" : "s"} still hidden</div>}
            </div>
          </div></Portal>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Trophy case <span style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-muted)" }}>· {data.points || 0} pts</span></span>
          <button onClick={() => setOpen(true)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ace-700)" }}>{earned.length}/{data.badges.length} · See all →</button>
        </div>
        <div onClick={() => setOpen(true)} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 14, cursor: "pointer" }}>
          {earned.length ? (
            <div className="gt-strip" style={{ display: "flex", gap: 14, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              {earned.map((b) => (
                <div key={b.id} style={{ width: 66, flexShrink: 0, textAlign: "center" }}>
                  {ring(b, 54)}
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 10.5, color: "var(--text-strong)", marginTop: 5, lineHeight: 1.15 }}>{b.name}</div>
                  {b.tier && b.tiers.length > 1 ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 9.5, color: tc(b), fontWeight: 700 }}>{b.tier}</div> : null}
                </div>
              ))}
            </div>
          ) : <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Nothing on the shelf yet — your first round puts the first one here.</div>}
          {closest.length > 0 && (
            <div style={{ marginTop: earned.length ? 12 : 10, paddingTop: earned.length ? 12 : 0, borderTop: earned.length ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Closest to unlocking</div>
              {closest.map((b) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                  <BadgeIcon b={b} size={20} color="var(--fairway-600)" />
                  <span style={{ width: 118, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--bg-sunken)", overflow: "hidden" }}><div style={{ width: Math.round(b.progress * 100) + "%", height: "100%", background: b.earned ? tc(b) : "var(--fairway-500)" }} /></div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", width: 48, textAlign: "right" }}>{b.value}/{b.next}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ===================== v500 UDisc CSV import / export =====================
     UDisc exports your scorecards as CSV (Settings → Export). Columns, in their order:
     PlayerName, CourseName, LayoutName, StartDate, EndDate, Total, +/-, RoundRating, Hole1..HoleN.
     Rows are grouped per scorecard; the "Par" row carries the pars. We turn each scorecard
     into a finished Chains round (you as owner, cardmates as guests) and can write the same
     shape back out. There is no way to push rounds INTO UDisc (no public API). */
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
  }
  function parseUDiscCSV(text) {
    const rows = parseCSV(text); if (!rows.length) return [];
    const head = rows[0].map((h) => String(h).trim());
    const ix = (name) => head.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    const iPlayer = ix("PlayerName"), iCourse = ix("CourseName"), iLayout = ix("LayoutName"), iStart = ix("StartDate"), iEnd = ix("EndDate"), iTotal = ix("Total"), iPM = ix("+/-");
    const holeIdx = head.map((h, i) => (/^Hole\s*\d+$/i.test(h) ? i : -1)).filter((i) => i >= 0);
    if (iPlayer < 0 || iCourse < 0 || !holeIdx.length) return null;
    const groups = {};
    rows.slice(1).forEach((r) => {
      const key = [r[iCourse], r[iLayout], r[iStart]].join("|");
      const g = groups[key] || (groups[key] = { course: String(r[iCourse] || "").trim(), layout: String(r[iLayout] || "").trim(), start: String(r[iStart] || "").trim(), end: iEnd >= 0 ? String(r[iEnd] || "").trim() : "", pars: null, players: [] });
      const scores = holeIdx.map((i) => { const v = String(r[i] || "").trim(); return v === "" ? null : parseInt(v, 10); });
      while (scores.length && scores[scores.length - 1] == null) scores.pop();
      const name = String(r[iPlayer] || "").trim();
      if (/^par$/i.test(name)) g.pars = scores.map((v) => v == null ? 3 : v);
      else g.players.push({ name, scores, total: iTotal >= 0 ? parseInt(r[iTotal], 10) : null, toPar: iPM >= 0 ? parseInt(r[iPM], 10) : null });
    });
    const toISO = (s) => { const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):?(\d{2}))?/); if (!m) return null; return m[1] + "-" + m[2] + "-" + m[3] + "T" + String(m[4] || "12").padStart(2, "0") + ":" + (m[5] || "00") + ":00"; };
    return Object.values(groups).map((g) => ({ ...g, startISO: toISO(g.start), endISO: toISO(g.end), date: (toISO(g.start) || "").slice(0, 10) })).filter((g) => g.players.length && g.date);
  }
  function UDiscImport({ rounds, me, onDone, onClose }) {
    const [parsed, setParsed] = React.useState(null);
    const [err, setErr] = React.useState("");
    const [meName, setMeName] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [done, setDone] = React.useState(null);
    const names = React.useMemo(() => { const c = {}; (parsed || []).forEach((g) => g.players.forEach((p) => { c[p.name] = (c[p.name] || 0) + 1; })); return Object.keys(c).sort((a, b) => c[b] - c[a]); }, [parsed]);
    React.useEffect(() => { if (!names.length || meName) return; const mine = (myDisplayName(me) || "").toLowerCase(); const hit = names.find((n) => n.toLowerCase() === mine || n.toLowerCase() === String(me).toLowerCase()); setMeName(hit || names[0]); }, [names]);
    const existing = React.useMemo(() => { const set = {}; Object.values(rounds || {}).forEach((r) => { if (r && r.date && r.course_name) set[(r.date + "|" + String(r.course_name).toLowerCase().replace(/[^a-z0-9]/g, "")).slice(0, 80)] = true; }); return set; }, [rounds]);
    const isDup = (g) => !!existing[(g.date + "|" + g.course.toLowerCase().replace(/[^a-z0-9]/g, "")).slice(0, 80)];
    const onFile = (f) => { setErr(""); const rd = new FileReader(); rd.onload = () => { const p = parseUDiscCSV(String(rd.result || "")); if (!p) { setErr("That doesn't look like a UDisc scorecard export (need PlayerName, CourseName, Hole1…)."); setParsed(null); return; } setParsed(p); }; rd.readAsText(f); };
    const matchCourse = (name) => { const nl = name.toLowerCase().replace(/[^a-z0-9]/g, ""); const c = (CATALOG || []).find((x) => String(x.name || "").toLowerCase().replace(/[^a-z0-9]/g, "") === nl) || (CATALOG || []).find((x) => nl && String(x.name || "").toLowerCase().replace(/[^a-z0-9]/g, "").indexOf(nl) >= 0); return c || null; };
    const run = async () => {
      if (!parsed || !meName || !window.ChainsRounds || !ChainsRounds.importRound) return;
      setBusy(true); let n = 0, skipped = 0;
      for (const g of parsed) {
        if (isDup(g)) { skipped++; continue; }
        const mine = g.players.find((p) => p.name === meName); if (!mine) { skipped++; continue; }
        const cat = matchCourse(g.course);
        const N = Math.max(g.pars ? g.pars.length : 0, ...g.players.map((p) => p.scores.length)) || 18;
        const pars = (g.pars && g.pars.length >= N ? g.pars.slice(0, N) : (cat && cat.hole_pars && cat.hole_pars.length >= N ? cat.hole_pars.slice(0, N) : Array(N).fill(3)));
        const course = cat ? Object.assign({}, cat, { hole_pars: pars }) : { id: "udisc-" + g.course.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40), name: g.course, city: null, holes: N, hole_pars: pars, par_total: pars.reduce((a, b) => a + b, 0) };
        const group = [{ id: me, name: myDisplayName(me) || meName }].concat(g.players.filter((p) => p !== mine).map((p, i) => ({ id: "guest-u" + i + "-" + Date.now().toString(36), name: p.name, guest: true })));
        const scores = {}; scores[me] = mine.scores.slice(0, N); g.players.filter((p) => p !== mine).forEach((p, i) => { scores[group[i + 1].id] = p.scores.slice(0, N); });
        try { await ChainsRounds.importRound({ course, group, scores, pars, date: g.date, startedAt: g.startISO ? new Date(g.startISO).toISOString() : null, endedAt: g.endISO ? new Date(g.endISO).toISOString() : null, source: "udisc" }); n++; } catch (e) { skipped++; }
      }
      setBusy(false); setDone({ n, skipped }); if (onDone) onDone();
    };
    const T = { btn: { height: 46, padding: "0 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14 } };
    return (
      <Portal><div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: "22px 22px 0 0", padding: "18px 16px calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ display: "flex", alignItems: "center" }}><span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Import from UDisc</span><button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ace-700)" }}>Done</button></div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>In UDisc: <b>You → Settings → Export scorecards</b> gives you a CSV. Drop it here and every round becomes a Chains round — your stats, course records and trophies count all of it. Cardmates come in as guests.</div>
          {!parsed && !done && (
            <label style={{ display: "block", marginTop: 14, padding: "22px 14px", border: "2px dashed var(--border-default)", borderRadius: "var(--radius-lg)", textAlign: "center", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--ace-700)" }}>
              Choose the CSV file
              <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onFile(f); }} style={{ display: "none" }} />
            </label>
          )}
          {err ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--score-over, #c23a33)", marginTop: 10 }}>{err}</div> : null}
          {parsed && !done && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{parsed.length} scorecard{parsed.length === 1 ? "" : "s"} found · {parsed.filter(isDup).length} already in Chains</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", margin: "10px 0 6px" }}>Which player is you?</div>
              <select value={meName} onChange={(e) => setMeName(e.target.value)} style={{ width: "100%", height: 44, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--bg-sunken)", color: "var(--text-strong)" }}>{names.map((n) => <option key={n} value={n}>{n}</option>)}</select>
              <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 10, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                {parsed.map((g, i) => { const mine = g.players.find((p) => p.name === meName); return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderTop: i ? "1px solid var(--border-subtle)" : "none", opacity: isDup(g) || !mine ? .5 : 1 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.course}<span style={{ color: "var(--text-faint)" }}> · {g.date}{g.players.length > 1 ? " · " + g.players.length + " players" : ""}</span></span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: mine && mine.toPar != null ? parColor(mine.toPar) : "var(--text-faint)" }}>{mine ? (mine.toPar != null ? fmtPar(mine.toPar) : "") + (mine.total != null ? " (" + mine.total + ")" : "") : "not you"}</span>
                    {isDup(g) ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>have it</span> : null}
                  </div>); })}
              </div>
              <button onClick={run} disabled={busy} style={Object.assign({ width: "100%", marginTop: 14, opacity: busy ? .6 : 1 }, T.btn)}>{busy ? "Importing…" : "Import " + parsed.filter((g) => !isDup(g) && g.players.some((p) => p.name === meName)).length + " rounds"}</button>
            </div>
          )}
          {done && <div style={{ marginTop: 14, padding: 14, borderRadius: "var(--radius-md)", background: "var(--fairway-50)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--fairway-800, #1d5c3d)" }}>Imported {done.n} round{done.n === 1 ? "" : "s"}{done.skipped ? " · skipped " + done.skipped + " (already here or not yours)" : ""}. Your stats and trophies will update in a moment.</div>}
        </div>
      </div></Portal>
    );
  }
  function exportRoundsCSV(rounds, me) {
    const list = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && r.scores && r.hole_scores).sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
    const N = Math.max(18, ...list.map((r) => (r.pars ? toArr(r.pars).length : 18)));
    const head = ["PlayerName", "CourseName", "LayoutName", "StartDate", "EndDate", "Total", "+/-", "RoundRating"].concat(Array.from({ length: N }, (_, i) => "Hole" + (i + 1)));
    const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const lines = [head.join(",")];
    list.forEach((r) => {
      const pars = r.pars ? toArr(r.pars) : Array(N).fill(3);
      const start = r.created_at ? new Date(r.created_at) : new Date(r.date + "T12:00:00");
      const fmt = (d) => isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
      lines.push(["Par", r.course_name || "", "Main", fmt(start), "", pars.reduce((a, b) => a + b, 0), "", ""].concat(pars.map((p) => p)).map(esc).join(","));
      (r.group || []).forEach((g) => {
        const hs = r.hole_scores[g.id] ? toArr(r.hole_scores[g.id]) : []; const total = strokesOf(hs); const tp = r.scores[g.id];
        lines.push([g.name, r.course_name || "", "Main", fmt(start), "", total || "", tp == null ? "" : tp, ""].concat(Array.from({ length: N }, (_, i) => hs[i] == null ? "" : hs[i])).map(esc).join(","));
      });
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "chains-rounds-" + new Date().toISOString().slice(0, 10) + ".csv"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }
  /* ===================== v501 course pages (community) =====================
     courseCommunity/{courseId}/ratings/{key} = { stars, at }
     courseCommunity/{courseId}/notes/{id}    = { by, name, text, hole|null, at }
     Everything else on the page is derived: catalog facts, courseGeo (maps), rounds. */
  const ChainsCourseCommunity = (() => {
    function db() { try { return window.ChainsFB && ChainsFB.ok ? ChainsFB.db : null; } catch (e) { return null; } }
    function me() { return window.ChainsID && ChainsID.whoami && ChainsID.whoami(); }
    function watch(courseId, cb) { const d = db(); if (!d || !courseId) { cb({ ratings: {}, notes: {} }); return () => {}; } const ref = d.ref("courseCommunity/" + courseId); const h = ref.on("value", (s) => cb(s.val() || { ratings: {}, notes: {} })); return () => ref.off("value", h); }
    function rate(courseId, stars) { const d = db(), k = me(); if (!d || !k) return Promise.resolve(false); return d.ref("courseCommunity/" + courseId + "/ratings/" + k).set({ stars: Math.max(1, Math.min(5, stars)), at: Date.now() }).then(() => true).catch(() => false); }
    function note(courseId, text, hole) { const d = db(), k = me(); text = String(text || "").trim().slice(0, 500); if (!d || !k || !text) return Promise.resolve(false); const ref = d.ref("courseCommunity/" + courseId + "/notes").push(); return ref.set({ by: k, name: myDisplayName(k) || k, text, hole: hole == null ? null : hole, at: Date.now() }).then(() => true).catch(() => false); }
    function removeNote(courseId, id) { const d = db(); if (!d) return Promise.resolve(false); return d.ref("courseCommunity/" + courseId + "/notes/" + id).remove().then(() => true).catch(() => false); }
    return { watch, rate, note, removeNote };
  })();
  window.ChainsCourseCommunity = ChainsCourseCommunity;

  // Overview map: every mapped hole of the course on one satellite view, north up.
  function CourseOverviewMap({ course, holes }) {
    const box = React.useRef(null); const mapRef = React.useRef(null);
    React.useEffect(() => {
      let alive = true;
      const mapped = Object.keys(holes || {}).map((k) => ({ n: Number(k), ...holes[k] })).filter((h) => h.tee && h.basket);
      if (!mapped.length) return;
      loadMapLibre().then((ml) => {
        if (!alive || !box.current) return;
        const pts = []; mapped.forEach((h) => { pts.push([h.tee.lng, h.tee.lat]); pts.push([h.basket.lng, h.basket.lat]); });
        const minLng = Math.min(...pts.map((p) => p[0])), maxLng = Math.max(...pts.map((p) => p[0])), minLat = Math.min(...pts.map((p) => p[1])), maxLat = Math.max(...pts.map((p) => p[1]));
        const map = new ml.Map({ container: box.current, attributionControl: false, style: { version: 8, sources: { sat: { type: "raster", tiles: [USGS_TILES], tileSize: 256, maxzoom: 19, attribution: IMAGERY_ATTR } }, layers: [{ id: "sat", type: "raster", source: "sat" }] }, center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2], zoom: 15 });
        mapRef.current = map;
        map.on("load", () => {
          const feats = [];
          mapped.forEach((h) => {
            const line = [[h.tee.lng, h.tee.lat]].concat((h.doglegs || []).map((d) => [d.lng, d.lat])).concat([[h.basket.lng, h.basket.lat]]);
            feats.push({ type: "Feature", properties: { kind: "path", n: h.n + 1 }, geometry: { type: "LineString", coordinates: line } });
            feats.push({ type: "Feature", properties: { kind: "tee", n: h.n + 1 }, geometry: { type: "Point", coordinates: [h.tee.lng, h.tee.lat] } });
            feats.push({ type: "Feature", properties: { kind: "basket", n: h.n + 1 }, geometry: { type: "Point", coordinates: [h.basket.lng, h.basket.lat] } });
            feats.push({ type: "Feature", properties: { kind: "label", n: String(h.n + 1) }, geometry: { type: "Point", coordinates: [(h.tee.lng + h.basket.lng) / 2, (h.tee.lat + h.basket.lat) / 2] } });
          });
          map.addSource("course", { type: "geojson", data: { type: "FeatureCollection", features: feats } });
          map.addLayer({ id: "path", type: "line", source: "course", filter: ["==", ["get", "kind"], "path"], paint: { "line-color": "#ffffff", "line-width": 3, "line-opacity": 0.85 }, layout: { "line-cap": "round" } });
          map.addLayer({ id: "tee", type: "circle", source: "course", filter: ["==", ["get", "kind"], "tee"], paint: { "circle-radius": 5, "circle-color": "#1f4d33", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
          map.addLayer({ id: "basket", type: "circle", source: "course", filter: ["==", ["get", "kind"], "basket"], paint: { "circle-radius": 6, "circle-color": "#fff", "circle-stroke-color": "#F26A1B", "circle-stroke-width": 3 } });
          mapped.forEach((h) => { const el = document.createElement("div"); el.textContent = String(h.n + 1); el.style.cssText = "width:22px;height:22px;border-radius:11px;background:#1f4d33;color:#f3eedc;font:800 12px/22px var(--font-sans);text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"; new ml.Marker({ element: el }).setLngLat([(h.tee.lng + h.basket.lng) / 2, (h.tee.lat + h.basket.lat) / 2]).addTo(map); });
          try { map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 36, duration: 0, maxZoom: 18 }); } catch (e) {}
        });
      }).catch(() => {});
      return () => { alive = false; try { mapRef.current && mapRef.current.remove(); } catch (e) {} mapRef.current = null; };
    }, [course && course.id, Object.keys(holes || {}).length]);
    return <React.Fragment><div ref={box} style={{ position: "absolute", inset: 0 }} /><span style={{ position: "absolute", left: 6, bottom: 4, fontFamily: "var(--font-sans)", fontSize: 8.5, color: "rgba(255,255,255,.75)", textShadow: "0 0 3px rgba(0,0,0,.9)", pointerEvents: "none" }}>© Esri</span></React.Fragment>;
  }

  // v513 — Takeover: every hole has an owner. Tiles on the course page.
  const TK_COLORS = ["#2A6FDB", "#E8590C", "#1f8a5b", "#8e44ad", "#c23a33", "#0e7c86", "#b8860b", "#d6336c", "#5c6b73", "#2b8a3e"];
  function tkColor(key, me) { if (key === me) return "var(--ace-500)"; try { const p = window.ChainsFriends && ChainsFriends.profile && ChainsFriends.profile(key); if (p && p.disc) return p.disc; } catch (e) {} let h = 0; for (let i = 0; i < String(key).length; i++) h = (h * 31 + String(key).charCodeAt(i)) >>> 0; return TK_COLORS[h % TK_COLORS.length]; }
  function TakeoverCard({ course, me, board: boardIn }) {
    const [board, setBoard] = React.useState(boardIn || null);
    const [firsts, setFirsts] = React.useState(null);
    const [sel, setSel] = React.useState(null);     // hole number tapped
    const [showAll, setShowAll] = React.useState(false);
    const [heldLog, setHeldLog] = React.useState(null);   // v528: titles I held here before and lost
    React.useEffect(() => { let alive = true; try { const d = cloudDb(); if (!d || !me || !course || course.id == null) return; d.ref("territory/" + String(course.id).replace(/[.#$\[\]\/]/g, "_") + "/heldLog/" + me).get().then((s) => { if (alive) setHeldLog(Object.values(s.val() || {}).sort((a, b) => b.to - a.to)); }).catch(() => {}); } catch (e) {} return () => { alive = false; }; }, [course && course.id, me]);
    React.useEffect(() => { let alive = true; if (!course || course.id == null) return; const go = (b) => { if (!alive) return; setBoard(b || []); if (window.ChainsNames) ChainsNames.firstsSync(course.id, b || [], me, course.name).then((r) => { if (alive) setFirsts(r); }); }; if (boardIn) go(boardIn); else if (window.ChainsRounds && ChainsRounds.courseBoard) ChainsRounds.courseBoard(course.id).then(go).catch(() => go([])); return () => { alive = false; }; }, [course && course.id, boardIn]);
    if (!board || !window.ChainsTakeover) return null;
    const t = ChainsTakeover.compute(board);
    const marks = window.ChainsNames ? ChainsNames.holeMarks(board) : [];
    const lead = window.ChainsRounds && ChainsRounds.courseTerritory ? ChainsRounds.courseTerritory(board, me, course.hole_pars || course.pars || null) : null;
    const N = t.N || (course.holes || 18);
    // --- tally names per person (firsts + holds) → "the ones to beat"
    const tally = {}; const add = (k, name, what) => { if (!k) return; const e = tally[k] || (tally[k] = { key: k, name: name || k, n: 0, firsts: 0, holds: 0, what: [] }); e.n++; if (what === "first") e.firsts++; else e.holds++; };
    Object.keys((firsts && firsts.all) || {}).forEach((id) => { const f = firsts.all[id]; add(f.key, f.name, "first"); });
    t.holes.forEach((h) => { if (h.owner) add(h.owner.key, h.owner.name, "hold"); });
    marks.forEach((m) => { if (m.bestEver) add(m.bestEver.key, m.bestEver.name, "hold"); if (m.birdieLeader) add(m.birdieLeader.key, m.birdieLeader.name, "hold"); });
    if (lead) { [lead.record, lead.king, lead.birdieKing, lead.steady, lead.champion, lead.regular, lead.birdieLeader, lead.improved].forEach((x) => { if (x) add(x.key, x.name, "hold"); }); }
    const beat = Object.values(tally).sort((a, b) => b.n - a.n || b.firsts - a.firsts).slice(0, 3);
    const totalSlots = N * 4 + 8 + ((firsts && firsts.defs) ? firsts.defs.length : 0);
    const short = String(course.name || "").replace(/ disc golf.*$/i, "");
    const nm = (k, n) => k === me ? "You" : __fn(n);
    const card = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" };
    const lbl = { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", margin: "4px 0 8px" };
    const chip = (text, tone) => <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 10, background: tone === "me" ? "var(--ace-700)" : tone === "open" ? "transparent" : "var(--bg-sunken, #eef2ef)", border: tone === "open" ? "1px dashed var(--border-default)" : "none", color: tone === "me" ? "#fff" : tone === "open" ? "var(--text-faint)" : "var(--text-strong)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5 }}>{text}</span>;
    const firstRows = (firsts && firsts.defs ? firsts.defs : []).map((d) => ({ d, f: firsts.all[d.id] || null }));
    const tierOrder = { easy: 0, mid: 1, hard: 2, epic: 3 };
    const firstsShown = showAll ? firstRows : firstRows.filter((x) => x.f || x.d.tier !== "easy" || x.d.hole == null).slice(0, 14);
    const selM = sel ? marks[sel - 1] : null, selH = sel ? t.holes[sel - 1] : null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* the ones to beat */}
        <div>
          <div style={lbl}>The ones to beat at {short}</div>
          <div style={card}>
            {beat.length === 0 ? <div style={{ padding: 14, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>Nobody's name is on this course yet. First round here takes the first one.</div>
              : beat.map((p, i) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: p.key === me ? "var(--fairway-50, #eef5f0)" : "transparent" }}>
                  <span style={{ width: 22, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: i === 0 ? "var(--gold-600, #b8860b)" : "var(--text-muted)" }}>{i + 1}</span>
                  <Avatar name={p.name} color={tkColor(p.key, me)} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{p.key === me ? "You" : p.name}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{p.firsts} first{p.firsts === 1 ? "" : "s"} · {p.holds} hold{p.holds === 1 ? "" : "s"}</div></div>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-strong)" }}>{p.n}<span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}> names</span></span>
                </div>))}
            <div style={{ padding: "7px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>{totalSlots} names on this course · {Object.keys(tally).length} people hold at least one</div>
          </div>
        </div>
        {/* course records */}
        {lead && (
          <div>
            <div style={lbl}>Course records</div>
            <div style={card}>
              {[["Course record", lead.record, lead.record ? fmtPar(lead.record.best) + (lead.record.bestDate ? " · " + lead.record.bestDate : "") : "Post the best full round"], ["Course champion " + lead.year, lead.champion, lead.champion ? fmtPar(lead.champion.best) + " · best full round this year" + (lead.champion.bestDate ? " · " + lead.champion.bestDate : "") : "Best full round this year; resets every January"], ["Local regular", lead.regular, lead.regular ? lead.regular.days + " different days in the last 90" : "Most different days played here, last 90 days (3+)"], ["Birdie leader " + lead.year, lead.birdieLeader, lead.birdieLeader ? lead.birdieLeader.holes + " different holes birdied this year" : "Birdie the most different holes this year"], ["Most improved", lead.improved, lead.improved ? lead.improved.drop + " strokes better than when they started (" + lead.improved.rounds + " rounds)" : "Biggest drop from your first five rounds to your last five; needs 10+"], ["Most rounds", lead.king, lead.king ? lead.king.rounds + " rounds" : "Play the most rounds here"], ["Most birdies", lead.birdieKing, lead.birdieKing ? lead.birdieKing.birdies + " birdies" : "Rack up birdies"], ["Best average", lead.steady, lead.steady ? (lead.steady.avg > 0 ? "+" : "") + Math.round(lead.steady.avg * 10) / 10 + " over " + lead.steady.rounds + " rounds" : "Needs 3+ rounds"]].map(([title, who, sub], i) => (
                <div key={title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>{title}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>{sub}</div></div>
                  {who ? chip(nm(who.key, who.name), who.key === me ? "me" : "") : chip("open", "open")}
                </div>))}
              {heldLog && heldLog.length > 0 && <div style={{ padding: "8px 14px 10px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>
                <div style={{ fontWeight: 700, color: "var(--text-strong)", marginBottom: 2 }}>You held</div>
                {heldLog.slice(0, 4).map((h, i) => { const f = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }); return <div key={i}>{h.title} · {f(h.from)} to {f(h.to)}{h.lostTo ? " · taken by " + __fn(h.lostTo) : ""}</div>; })}
              </div>}
            </div>
          </div>
        )}
        {/* holes: tap for the three names */}
        <div>
          <div style={lbl}>Hole by hole <span style={{ fontWeight: 500, fontSize: 12, color: "var(--text-muted)" }}>· tap a hole</span></div>
          <div style={Object.assign({}, card, { padding: 10 })}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
              {t.holes.map((h) => { const o = h.owner; const c = o ? tkColor(o.key, me) : null; const on = sel === h.hole; return (
                <button key={h.hole} onClick={() => setSel(on ? null : h.hole)} style={{ height: 46, borderRadius: 10, background: c || "var(--bg-sunken, #eef2ef)", border: on ? "2px solid var(--text-strong)" : o && o.key === me ? "2px solid var(--ace-600)" : "1px solid var(--border-subtle)", color: o ? "#fff" : "var(--text-faint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1, cursor: "pointer", padding: 0 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14 }}>{h.hole}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 9.5, marginTop: 3, opacity: .95, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o ? nm(o.key, o.name) : "open"}</span>
                </button>); })}
            </div>
            {sel && (
              <div style={{ marginTop: 10, borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>Hole {sel} <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, textTransform: "none", fontSize: 12, color: "var(--text-muted)" }}>par {selM ? selM.par : 3}</span></div>
                {[["Owns it", selH && selH.owner, selH && selH.owner ? Math.round(selH.owner.avg * 10) / 10 + " avg · last " + selH.owner.plays + " plays · best average here takes it" : "Best average over your last 5 plays takes it"], ["Best ever", selM && selM.bestEver, selM && selM.bestEver ? selM.bestEver.score + " on " + selM.bestEver.date : "Lowest single score ever"], ["Most birdies", selM && selM.birdieLeader, selM && selM.birdieLeader ? selM.birdieLeader.n + (selM.birdieLeader.n === 1 ? " birdie" : " birdies") : "Birdie it more than anyone"], ["First birdie", firsts && firsts.all["first_birdie_h" + sel], firsts && firsts.all["first_birdie_h" + sel] ? "on " + firsts.all["first_birdie_h" + sel].date + " · permanent" : "Nobody yet — it's yours for the taking"]].map(([title, who, sub]) => (
                  <div key={title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                    <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>{title}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>{sub}</div></div>
                    {who ? chip(nm(who.key, who.name), who.key === me ? "me" : "") : chip("open", "open")}
                  </div>))}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{Object.values(t.byPlayer).sort((a, b) => b.holes.length - a.holes.length).map((o) => <span key={o.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px 3px 4px", borderRadius: 20, background: "var(--bg-sunken, #eef2ef)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", fontWeight: 600 }}><span style={{ width: 14, height: 14, borderRadius: "50%", background: tkColor(o.key, me) }} />{nm(o.key, o.name)} owns {o.holes.length}</span>)}{t.open > 0 && <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 20, border: "1px dashed var(--border-default)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{t.open} open</span>}</div>
          </div>
        </div>
        {/* firsts */}
        <div>
          <div style={lbl}>Firsts <span style={{ fontWeight: 500, fontSize: 12, color: "var(--text-muted)" }}>· permanent, nobody can take these</span></div>
          <div style={card}>
            {firstsShown.map(({ d, f }, i) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.tier === "easy" ? "var(--score-under, #1a7a50)" : d.tier === "mid" ? "var(--gold-500, #d4a017)" : d.tier === "hard" ? "var(--ace-500)" : "#8e44ad", flexShrink: 0 }} title={d.tier} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>{d.label}</div>{f ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>{f.date}</div> : null}</div>
                {f ? chip(nm(f.key, f.name), f.key === me ? "me" : "") : chip("nobody yet", "open")}
              </div>))}
            <button onClick={() => setShowAll((v) => !v)} style={{ width: "100%", padding: "9px 14px", borderTop: "1px solid var(--border-subtle)", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fairway-700)", fontWeight: 600, textAlign: "center" }}>{showAll ? "Show fewer" : "Show all " + firstRows.length + " firsts (every hole's first birdie)"}</button>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}><span>● easy</span><span style={{ color: "var(--gold-500, #d4a017)" }}>● mid</span><span style={{ color: "var(--ace-500)" }}>● hard</span><span style={{ color: "#8e44ad" }}>● epic</span></div>
        </div>
      </div>
    );
  }
  // Home: one line of turf + the courses it's at.
  function TurfLine({ me, onOpenCourse }) {
    const [m, setM] = React.useState(null);
    const [names, setNames] = React.useState(null);
    React.useEffect(() => { let alive = true; if (!window.ChainsNames || !me) return; ChainsNames.mine(me).then((v) => { if (alive) setNames(v); }); return () => { alive = false; }; }, [me]);
    React.useEffect(() => { let alive = true; if (!window.ChainsTakeover || !me) return; ChainsTakeover.backfill(me).catch(() => 0).then(() => ChainsTakeover.mine(me)).then((v) => { if (alive) setM(v); try { localStorage.setItem("chains_turf_v1:" + me, JSON.stringify({ holes: v.holes, courses: v.total })); } catch (e) {} }); return () => { alive = false; }; }, [me]);
    if (!m) return null;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Titles you hold</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16, color: (m.holes || (names && names.firsts)) ? "var(--ace-600)" : "var(--text-faint)" }}>{(names ? names.firsts : 0) + m.holes}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{(m.holes || (names && names.firsts)) ? (names ? names.firsts + " firsts · " : "") + m.holes + " holes owned" + (m.total ? " · " + m.total + (m.total === 1 ? " course" : " courses") : "") : "— finish a round to get on a course"}</span>
          <button onClick={() => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "takeover" })); } catch (e) {} }} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fairway-700)", fontWeight: 600 }}>Challenges →</button>
        </div>
        {m.courses.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{m.courses.map((c) => <button key={c.cid} onClick={() => onOpenCourse && onOpenCourse(c.cid)} style={{ padding: "4px 10px", borderRadius: 20, border: "1px solid var(--border-subtle)", background: "var(--bg-sunken, #eef2ef)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", fontWeight: 600 }}>{String(c.name).replace(/ disc golf.*$/i, "")} · {c.count}/{c.of}</button>)}</div>}
      </div>
    );
  }
  // v524 "What moved": the specific recap — vs your recent average here, firsts on holes, the birdie collection.
  function RoundProgress({ result, rounds, me }) {
    const lines = React.useMemo(() => {
      try {
        const c = result.course || {}; const hs = result.holeScores && result.holeScores[me] ? toArr(result.holeScores[me]) : null; const pars = result.pars ? toArr(result.pars) : null;
        if (!hs || !pars || !me) return [];
        const played = hs.filter((v) => v != null).length; const full = played >= pars.length;
        const tp = hs.reduce((a, v, i) => a + (v != null ? v - pars[i] : 0), 0);
        const prev = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && !r.practice && String(r.course_id) === String(c.id) && r.hole_scores && r.hole_scores[me] && r.id !== result.cloudId).sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
        const out = [];
        if (full) { const fulls = prev.filter((r) => toArr(r.hole_scores[me]).filter((v) => v != null).length >= pars.length && r.scores && r.scores[me] != null).slice(0, 5); if (fulls.length) { const avg = fulls.reduce((a, r) => a + r.scores[me], 0) / fulls.length; const d = Math.round((avg - tp) * 10) / 10; out.push(d > 0 ? d + " better than your recent average here" : d < 0 ? Math.abs(d) + " off your recent average here" : "Right on your recent average here"); const best = Math.min.apply(null, fulls.map((r) => r.scores[me])); if (tp < best) out.push("New personal best at " + String(c.name).replace(/ disc golf.*$/i, "")); } else out.push("First full round here on record"); }
        const firstsB = [], firstsP = [];
        hs.forEach((v, i) => { if (v == null) return; const hist = prev.map((r) => toArr(r.hole_scores[me])[i]).filter((x) => x != null); if (!hist.length) return; if (v < pars[i] && !hist.some((x) => x < pars[i])) firstsB.push(i + 1); else if (v <= pars[i] && !hist.some((x) => x <= pars[i])) firstsP.push(i + 1); });
        if (firstsB.length) out.push("First birdie on hole" + (firstsB.length > 1 ? "s " : " ") + firstsB.join(", "));
        if (firstsP.length) out.push("First par on hole" + (firstsP.length > 1 ? "s " : " ") + firstsP.join(", "));
        if (prev.length) { const birdied = new Set(); prev.concat([{ hole_scores: { [me]: hs } }]).forEach((r) => toArr(r.hole_scores[me]).forEach((v, i) => { if (v != null && v < pars[i]) birdied.add(i); })); if (birdied.size) out.push("Birdie collection here: " + birdied.size + " of " + pars.length + " holes"); }
        return out.slice(0, 4);
      } catch (e) { return []; }
    }, [result, rounds, me]);
    if (!lines.length) return null;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "10px 14px" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>What moved</div>
        {lines.map((l, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)", marginTop: 6 }}><span style={{ width: 16, height: 16, color: "var(--score-under, #1a7a50)", display: "inline-flex" }}><Icons.Check size={16} /></span>{l}</div>)}
      </div>
    );
  }
  // Finish card: run the takeover for this course and say what changed hands.
  function TakeoverResult({ result, me }) {
    const [r, setR] = React.useState(null);
    const [firsts, setFirsts] = React.useState(null);
    React.useEffect(() => { let alive = true; const c = result && result.course; if (!window.ChainsTakeover || !window.ChainsRounds || !c || c.id == null || !me || result.practice) return; ChainsRounds.courseBoard(c.id).then((b) => Promise.all([ChainsTakeover.sync(c.id, b, me, c.name), window.ChainsNames ? ChainsNames.firstsSync(c.id, b, me, c.name) : Promise.resolve(null)])).then(([x, f]) => { if (alive) { setR(x); setFirsts(f); } }).catch(() => {}); return () => { alive = false; }; }, []);
    if (!r) return null;
    const myFirsts = (firsts && firsts.mine) || [];
    const mine = r.t.byPlayer[me] ? r.t.byPlayer[me].holes.length : 0;
    const list = (a, verb, who) => a.length ? verb + " hole" + (a.length > 1 ? "s " : " ") + a.map((x) => x.hole).join(", ") + (who(a) ? " " + who(a) : "") : "";
    const tookTxt = list(r.took, "Took", (a) => { const n = Array.from(new Set(a.map((x) => x.from).filter(Boolean))); return n.length ? "from " + n.map(__fn).join(", ") : ""; });
    const lostTxt = list(r.lost, "Lost", (a) => { const n = Array.from(new Set(a.map((x) => x.to).filter(Boolean))); return n.length ? "to " + n.map(__fn).join(", ") : ""; });
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid " + (r.took.length ? "var(--ace-200, #f5ddd1)" : "var(--border-subtle)"), borderRadius: "var(--radius-lg)", padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Holes here</span><span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>you own {mine} of {r.t.N}</span></div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)", marginTop: 4 }}>{tookTxt || lostTxt ? [tookTxt, lostTxt].filter(Boolean).join(" · ") : (mine ? "Held everything you had." : "No holes yet — beat someone's average on a hole to take it.")}</div>
        {(r.crownsTaken && r.crownsTaken.length) || (r.crownsLost && r.crownsLost.length) ? (
          <div style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)" }}>
            {(r.crownsTaken || []).map((c) => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: "var(--ace-700)", display: "inline-flex" }}><Icons.Flag size={16} /></span><span><b>{c.title}</b> is yours{c.from ? " — taken from " + __fn(c.from) : ""}.</span></div>)}
            {(r.crownsLost || []).map((c) => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}><span style={{ display: "inline-flex" }}><Icons.Flag size={16} /></span><span>{c.title} went to {__fn(c.to)}.</span></div>)}
          </div>
        ) : null}
        {myFirsts.length > 0 && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "linear-gradient(135deg, var(--pine-700), var(--bg-ink-deep))", color: "var(--bone-50)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 15 }}>Your name's on the course</div>
            {myFirsts.slice(0, 6).map((f) => <div key={f.id} style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, marginTop: 4 }}>{f.label.replace(/^First /, "First ")} — <span style={{ opacity: .8 }}>permanent</span></div>)}
            {myFirsts.length > 6 && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, opacity: .8, marginTop: 4 }}>+{myFirsts.length - 6} more</div>}
          </div>
        )}
      </div>
    );
  }
  /* ---- v514 Takeover hub: your turf · this month's race · every course's owners · your crew ---- */
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function TakeoverHub() {
    // v522: the Challenges screen — this week's personal challenges, the reward, and a community scoreboard.
    const me = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    const [rounds, setRounds] = React.useState(window.__chainsRounds || null);
    const [board, setBoard] = React.useState(null);
    const [ctab, setCtab] = React.useState("week");
    const [badges, setBadges] = React.useState(null);
    const wid = ChainsChallenges.weekId();
    const mev = React.useMemo(() => { try { return me ? ChainsChallenges.monthEval(rounds, me) : null; } catch (e) { return null; } }, [rounds, me]);
    React.useEffect(() => { if (mev) ChainsChallenges.persistMonth(mev); }, [mev]);
    React.useEffect(() => { let alive = true; if (ctab === "trophies" && !badges && window.ChainsBadges && window.ChainsRounds) loadBadges(me).then((b) => { if (alive) { setBadges(b); publishPoints(me, b); } }).catch(() => {}); return () => { alive = false; }; }, [ctab]);
    React.useEffect(() => { let alive = true; if (!rounds && window.ChainsRounds) loadRounds().then((r) => { if (alive) setRounds(r); }); ChainsChallenges.board(wid).then((b) => { if (alive) setBoard(b); }); return () => { alive = false; }; }, []);
    const { endsIn, from, to } = ChainsChallenges.weekRange(wid);
    const perfect = ChainsChallenges.perfectWeeks(), streak = ChainsChallenges.perfectStreak();
    const card = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" };
    const lbl = { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", margin: "4px 0 8px" };
    const nm = (k, n) => k === me ? "You" : __fn(n);
    const row = (left, right, i, hl) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: hl ? "var(--fairway-50, #eef5f0)" : "transparent" }}>{left}<span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: "var(--text-strong)" }}>{right}</span></div>;
    const who = (k, n, sub) => <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}><Avatar name={n} color={k === me ? "var(--ace-500)" : "#9CA3AF"} size={26} /><span style={{ minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm(k, n)}</span>{sub ? <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>{sub}</span> : null}</span></span>;
    const nice = (iso) => { try { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch (e) { return iso; } };
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ padding: "4px 2px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, lineHeight: 1, color: "var(--text-strong)" }}>Challenges</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 5 }}>Week of {nice(from)} – {nice(to)} · new ones every Monday · {endsIn <= 1 ? "ends today" : endsIn + " days left"}</div>
        </div>
        <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg-sunken, #eef2ef)", borderRadius: 12 }}>
          {[["week", "This week"], ["month", mev ? mev.name : "This month"], ["trophies", "Trophies"]].map(([id, l]) => <button key={id} onClick={() => setCtab(id)} style={{ flex: 1, height: 36, border: "none", borderRadius: 10, background: ctab === id ? "var(--fairway-700)" : "transparent", color: ctab === id ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13 }}>{l}</button>)}
        </div>
        {ctab === "week" && <React.Fragment>
        <WeeklyChallenges rounds={rounds} me={me} />
        <div style={card}>
          <div style={{ display: "flex", gap: 0 }}>
            {[[perfect, "perfect weeks"], [streak, "week streak"], [ChainsChallenges.totalDone(), "challenges done"]].map(([v, l], i) => <div key={l} style={{ flex: 1, padding: "12px 10px", textAlign: "center", borderLeft: i ? "1px solid var(--border-subtle)" : "none" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)", lineHeight: 1 }}>{v}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{l}</div></div>)}
          </div>
          <div style={{ padding: "9px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Perfect weeks build the Challenger trophy; 4 in a row earns the Streak trophy.</div>
        </div>
        <div>
          <div style={lbl}>This week on Chains</div>
          {!board ? <div style={Object.assign({}, card, { padding: 14, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" })}>Loading…</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={card}>
                <div style={{ padding: "9px 14px 4px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)" }}>Challenges completed</div>
                {board.completed.length ? board.completed.slice(0, 8).map((c, i) => row(who(c.key, c.name, c.rounds + (c.rounds === 1 ? " round" : " rounds") + (c.best != null ? " · best " + fmtPar(c.best) : "")), c.done + "/" + (c.total || 3), i, c.key === me)) : <div style={{ padding: "8px 14px 12px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>Nobody has finished one yet this week.</div>}
              </div>
              <div style={card}>
                <div style={{ padding: "9px 14px 4px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)" }}>Best rounds this week</div>
                {board.bestRounds.length ? board.bestRounds.map((r, i) => row(who(r.key, r.name, String(r.course || "").replace(/ disc golf.*$/i, "") + " · " + nice(String(r.date).slice(0, 10))), <span style={{ color: parColor(r.tp) }}>{fmtPar(r.tp)}{r.strokes ? <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}> ({r.strokes})</span> : null}</span>, i, r.key === me)) : <div style={{ padding: "8px 14px 12px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>No full rounds yet this week — yours could be first.</div>}
              </div>
              {board.mostRounds.length > 1 && <div style={card}>
                <div style={{ padding: "9px 14px 4px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)" }}>Most rounds this week</div>
                {board.mostRounds.map((p, i) => row(who(p.key, p.name), p.rounds, i, p.key === me))}
              </div>}
            </div>
          )}
        </div>
        </React.Fragment>}
        {ctab === "month" && mev && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "var(--bg-elevated)", border: "1px solid " + (mev.complete ? "var(--score-under, #1a7a50)" : "var(--border-subtle)"), borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "10px 14px 6px" }}><span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{mev.name}</span><span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 12, color: mev.complete ? "var(--score-under, #1a7a50)" : "var(--text-muted)" }}>{mev.complete ? "Complete" : mev.done + " of " + mev.list.length + " · " + mev.daysLeft + " days left"}</span></div>
              {mev.list.map((c) => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", opacity: c.done ? .7 : 1 }}><span style={{ width: 24, height: 24, color: c.done ? "var(--score-under, #1a7a50)" : "var(--fairway-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{c.icon === "rounds" ? <Icons.Disc size={20} /> : c.icon === "birdie" ? <Icons.Flag size={20} /> : c.icon === "map" ? <Icons.Map size={20} /> : <Icons.Target size={20} />}</span><span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", textDecoration: c.done ? "line-through" : "none" }}>{c.title}</span>{c.done ? <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--score-under, #1a7a50)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Check size={14} /></span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 54, height: 6, borderRadius: 3, background: "var(--bg-sunken, #eef2ef)", overflow: "hidden" }}><span style={{ display: "block", width: Math.round(100 * c.n / c.goal) + "%", height: "100%", background: "var(--fairway-500)" }} /></span><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", minWidth: 36, textAlign: "right" }}>{c.n}/{c.goal}</span></span>}</div>)}
              <div style={{ padding: "9px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 18, height: 18, color: "#8F6A08", display: "inline-flex" }}><Icons.Medal size={18} /></span><span>{mev.complete ? "Month complete — the " + mev.name + " trophy is yours." : "Finish all four by the end of " + mev.name + " for the " + mev.name + " trophy. It can only be earned this month."}{ChainsChallenges.monthsCompleted() ? " " + ChainsChallenges.monthsCompleted() + " month" + (ChainsChallenges.monthsCompleted() === 1 ? "" : "s") + " completed so far." : ""}</span></div>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Targets are built from your last three months, a little above your pace.{mev.best != null ? " Best full round this month: " + fmtPar(mev.best) + "." : ""}</div>
          </div>
        )}
        {ctab === "trophies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {badges && (() => { const next = badges.badges.filter((b) => !b.shame && !b.maxed && b.next != null && b.value > 0).map((b) => Object.assign({}, b, { pct: Math.round(100 * b.progress) })).sort((a, b) => b.pct - a.pct).slice(0, 3); return next.length ? (
              <div style={card}>
                <div style={{ padding: "10px 14px 4px", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Next up</div>
                {next.map((b, i) => <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: "1px solid var(--border-subtle)" }}><BadgeIcon b={b} size={22} color={b.color || "var(--fairway-600)"} /><span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{b.name}{b.tierNames && b.tierNames[b.level] ? <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> → {b.tierNames[b.level]}</span> : null}</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{b.how}</span><span style={{ display: "block", marginTop: 5, width: "100%", height: 6, borderRadius: 3, background: "var(--bg-sunken, #eef2ef)", overflow: "hidden" }}><span style={{ display: "block", width: b.pct + "%", height: "100%", background: b.color || "var(--fairway-500)" }} /></span></span><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", minWidth: 50, textAlign: "right" }}>{b.value}/{b.next}</span></div>)}
              </div>) : null; })()}
            {badges && <div style={card}><div style={{ display: "flex" }}>{[[badges.earnedCount, "earned"], [badges.badges.length, "trophies"], [badges.points, "points"]].map(([v, l], i) => <div key={l} style={{ flex: 1, padding: "12px 10px", textAlign: "center", borderLeft: i ? "1px solid var(--border-subtle)" : "none" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)", lineHeight: 1 }}>{v}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{l}</div></div>)}</div></div>}
            <PointsBoard me={me} />
            <BadgeShelf me={me} mobile={true} />
          </div>
        )}
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", textAlign: "center", padding: "2px 0 8px" }}>Course records and who holds each hole live on every course page under Territory.</div>
      </div>
    );
  }
  // v527 — trophy points are public (usernames/{me}/points) so the leaderboard can read them.
  function publishPoints(me, b) {
    try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); const un = u && u.username ? String(u.username).toLowerCase() : me; if (d && un && b && b.points != null) d.ref("usernames/" + un + "/points").set(b.points).catch(() => {}); } catch (e) {}
  }
  window.TakeoverHub = TakeoverHub;
  // v527 — trophy points across everyone on Chains (public usernames index: name, photo, points).
  function PointsBoard({ me }) {
    const [rows, setRows] = React.useState(null);
    React.useEffect(() => {
      let alive = true;
      const d = window.ChainsFB && ChainsFB.ok ? ChainsFB.db : null;
      if (!d) { setRows([]); return; }
      d.ref("usernames").get().then((s) => {
        if (!alive) return;
        const all = s.val() || {};
        const list = Object.keys(all).map((k) => ({ key: k, name: (all[k] && all[k].name) || k, photo: all[k] && all[k].photo, badge: all[k] && all[k].badge, points: Number(all[k] && all[k].points) || 0 })).filter((r) => r.points > 0).sort((a, b) => b.points - a.points);
        setRows(list);
      }).catch(() => { if (alive) setRows([]); });
      return () => { alive = false; };
    }, [me]);
    if (!rows || !rows.length) return null;
    const myIx = rows.findIndex((r) => r.key === me);
    const top = rows.slice(0, 8);
    if (myIx >= 8) top.push(rows[myIx]);
    const card = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" };
    return (
      <div style={card}>
        <div style={{ padding: "10px 14px 4px", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Trophy points</div>
        {top.map((r, i) => { const rank = rows.indexOf(r) + 1; const mine = r.key === me; return (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderTop: "1px solid var(--border-subtle)", background: mine ? "var(--bg-sunken, #eef2ef)" : "transparent" }}>
            <span style={{ width: 22, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>{rank}</span>
            {window.Avatar ? <Avatar name={r.name} img={r.photo} size={28} /> : null}
            <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: mine ? 700 : 500, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}{mine ? " (you)" : ""}</span>{r.badge && r.badge.name ? <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 11, color: r.badge.color || "var(--text-muted)" }}>{r.badge.name}{r.badge.tier ? " · " + r.badge.tier : ""}</span> : null}</span>
            <span style={{ textAlign: "right" }}><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{r.points}</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)" }}>Level {window.ChainsBadges && ChainsBadges.level ? ChainsBadges.level(r.points).n : ""}</span></span>
          </div>); })}
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Every trophy tier is worth points. Everyone on Chains, all time.</div>
      </div>
    );
  }
  // v504 — Territory: course leaders + everybody's numbers here.
  function TerritoryCard({ course, me, part }) {
    const [t, setT] = React.useState(null);
    const [allPlayers, setAllPlayers] = React.useState(false);
    React.useEffect(() => { let alive = true; if (!window.ChainsRounds || !ChainsRounds.courseBoard || !course || course.id == null) return; ChainsRounds.courseBoard(course.id).then((b) => { if (alive) setT(ChainsRounds.courseTerritory(b, me)); }).catch(() => {}); return () => { alive = false; }; }, [course && course.id]);
    if (!t) return null;
    const card = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" };
    const big = (icon, title, who, sub, mine) => (
      <div style={{ flex: 1, minWidth: 0, padding: "12px 12px", background: mine ? "linear-gradient(160deg, var(--gold-50, #fbf6e9), var(--bg-elevated))" : "transparent" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em" }}>{icon} {title}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{who || "Up for grabs"}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>
      </div>
    );
    const sortedPlayers = t.players.slice().sort((a, b) => b.rounds - a.rounds || (a.avg == null ? 99 : a.avg) - (b.avg == null ? 99 : b.avg));
    const top = allPlayers ? sortedPlayers : sortedPlayers.slice(0, 6);
    return (
      <div>
        <TakeoverCard course={course} me={me} />
        <React.Fragment>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", margin: "14px 0 8px" }}>Everyone who's played here</div>
        <div style={card}>
          {top.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", padding: "6px 12px 2px", fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em" }}><span style={{ flex: 1 }}>Everyone here</span><span style={{ width: 46, textAlign: "right" }}>Rnds</span><span style={{ width: 44, textAlign: "right" }}>Best</span><span style={{ width: 44, textAlign: "right" }}>Avg</span><span style={{ width: 40, textAlign: "right" }}>Bird</span></div>
              {top.map((p, i) => (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: p.key === me ? "var(--fairway-50)" : "transparent" }}>
                  <Avatar name={p.name} color={(window.ChainsFriends && ChainsFriends.profile(p.key) || {}).disc || (p.key === me ? "var(--ace-500)" : "#9CA3AF")} size={24} />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.key === me ? "You" : p.name}{t.king && t.king.key === p.key ? " · most rounds" : ""}{t.record && t.record.key === p.key ? " · record" : ""}{t.birdieKing && t.birdieKing.key === p.key ? " · most birdies" : ""}{t.steady && t.steady.key === p.key ? " · best average" : ""}</span>
                  <span style={{ width: 46, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)" }}>{p.rounds}</span>
                  <span style={{ width: 44, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 13, color: p.best == null ? "var(--text-faint)" : parColor(p.best) }}>{p.best == null ? "—" : fmtPar(p.best)}</span>
                  <span style={{ width: 44, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)" }}>{p.avg == null ? "—" : (p.avg > 0 ? "+" : "") + (Math.round(p.avg * 10) / 10)}</span>
                  <span style={{ width: 40, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--score-under, #1a7a50)" }}>{p.birdies || 0}</span>
                </div>
              ))}
              {sortedPlayers.length > 6 && <button onClick={() => setAllPlayers((v) => !v)} style={{ width: "100%", padding: "9px 12px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--fairway-700)" }}>{allPlayers ? "Show fewer" : "Show all " + sortedPlayers.length + " players"}</button>}
            </div>
          )}
        </div>
        </React.Fragment>
      </div>
    );
  }
  // v504 — What's happening: aces, rounds just finished, who's hot / not, records. Crew-wide.
  function ActivityFeed({ me, onOpenRound }) {
    const [items, setItems] = React.useState(null);
    React.useEffect(() => {
      let alive = true;
      const load = async () => {
        try {
          const out = [];
          const rs = ((await (window.ChainsRounds && ChainsRounds.loadGroup ? ChainsRounds.loadGroup() : Promise.resolve([]))) || []).map(normalizeRound).filter((r) => r && r.status !== "open" && !r.practice);
          const nameOf = (k, r) => { const g = r && (r.group || []).find((x) => x && x.id === k); return k === me ? "You" : ((g && g.name) || (window.ChainsFriends && (ChainsFriends.profile(k) || {}).name) || String(k).charAt(0).toUpperCase() + String(k).slice(1)); };
          const first = (n) => String(n || "").split(" ")[0];
          // rounds finished (last 14 days)
          const cut = Date.now() - 14 * 86400000;
          rs.forEach((r) => { const at = Date.parse(r.created_at || r.date || 0) || 0; if (at < cut) return; (r.group || []).forEach((g) => { if (!g || !r.scores || r.scores[g.id] == null || /^guest/.test(g.id)) return; out.push({ at, kind: "round", icon: "⛳", text: nameOf(g.id, r) + " finished " + (r.course_name || "a round") + " · " + fmtPar(r.scores[g.id]), r }); }); });
          // aces
          try { (window.ChainsAces && ChainsAces.feed ? ChainsAces.feed() : []).forEach((a) => { if ((a.ts || 0) < Date.now() - 90 * 86400000) return; out.push({ at: a.ts || 0, kind: "ace", icon: "🎯", text: (a.who === me ? "You" : first(a.name)) + " hit an ACE" + (a.hole ? " on hole " + a.hole : "") + " at " + (a.course || "the course") }); }); } catch (e) {}
          // hot / not over the last 14 days (full rounds only, 2+ rounds)
          const by = {}; rs.forEach((r) => { const at = Date.parse(r.created_at || r.date || 0) || 0; if (at < cut) return; (r.group || []).forEach((g) => { if (!g || /^guest/.test(g.id) || !r.scores || r.scores[g.id] == null) return; (by[g.id] = by[g.id] || { n: 0, sum: 0, best: null, worst: null, name: nameOf(g.id, r), at: 0 }); const e = by[g.id]; e.n++; e.sum += r.scores[g.id]; e.best = e.best == null ? r.scores[g.id] : Math.min(e.best, r.scores[g.id]); e.worst = e.worst == null ? r.scores[g.id] : Math.max(e.worst, r.scores[g.id]); e.at = Math.max(e.at, at); }); });
          const ppl = Object.keys(by).map((k) => Object.assign({ key: k, avg: by[k].sum / by[k].n }, by[k])).filter((p) => p.n >= 2);
          if (ppl.length) { const hot = ppl.slice().sort((a, b) => a.avg - b.avg)[0]; out.push({ at: hot.at, kind: "hot", icon: "🔥", text: (hot.key === me ? "You're" : first(hot.name) + " is") + " hot: averaging " + (hot.avg > 0 ? "+" : "") + (Math.round(hot.avg * 10) / 10) + " over " + hot.n + " rounds" }); if (ppl.length > 1) { const cold = ppl.slice().sort((a, b) => b.avg - a.avg)[0]; if (cold.key !== hot.key) out.push({ at: cold.at - 1, kind: "cold", icon: "🥶", text: (cold.key === me ? "You're" : first(cold.name) + " is") + " not: " + (cold.avg > 0 ? "+" : "") + (Math.round(cold.avg * 10) / 10) + " average lately" }); } }
          // course records held
          try { const all = await ChainsRounds.allCourseStats(); Object.keys(all).forEach((cid) => { const t = ChainsRounds.courseTerritory(all[cid], me); const nm = (all[cid][0] && all[cid][0].name) || cid; if (t.record) out.push({ at: Date.parse(t.record.bestDate || 0) || 0, kind: "record", icon: null, text: (t.record.key === me ? "You hold" : first(t.record.name) + " holds") + " the " + nm + " record · " + fmtPar(t.record.best) }); if (t.king && t.rounds >= 3) out.push({ at: Date.parse(t.king.last || 0) || 0, kind: "king", icon: "👑", text: (t.king.key === me ? "You're" : first(t.king.name) + " is") + " king of " + nm + " · " + t.king.rounds + " rounds" }); }); } catch (e) {}
          out.sort((a, b) => b.at - a.at);
          if (alive) setItems(out.slice(0, 12));
        } catch (e) { if (alive) setItems([]); }
      };
      load();
      const fn = () => load(); window.addEventListener("chains:rounds", fn); window.addEventListener("chains:friends", fn);
      return () => { alive = false; window.removeEventListener("chains:rounds", fn); window.removeEventListener("chains:friends", fn); };
    }, [me]);
    if (!items || !items.length) return null;
    return (
      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", marginBottom: 8 }}>What's happening</div>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {items.map((it, i) => (
            <div key={i} onClick={it.r && onOpenRound ? () => onOpenRound(it.r) : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", cursor: it.r ? "pointer" : "default", background: it.kind === "ace" ? "var(--gold-50, #fbf6e9)" : "transparent" }}>
              <span style={{ width: 26, display: "inline-flex", justifyContent: "center", color: it.kind === "ace" ? "var(--ace-600)" : "var(--fairway-600)" }}>{it.kind === "ace" ? <Icons.Star size={20} /> : <Icons.Disc size={20} />}</span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)", lineHeight: 1.35 }}>{it.text}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", flexShrink: 0 }}>{it.at ? relDays(new Date(it.at).toISOString()) : ""}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // v507 — home shortcuts + what's new (data/news.json)
  function HomeShortcuts({ onStats }) {
    const go = (v) => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: v })); } catch (e) {} };
    const items = [["🎯", "Takeover", () => go("takeover")], ["🏆", "Trophies", onStats], ["🎒", "Bag", () => go("bag")], ["👥", "Friends", () => go("friends")], ["💬", "Messages", () => go("friends")], ["🏅", "Leagues", () => go("myleagues")], ["📊", "Stats", onStats], ["▶️", "Watch", () => go("highlights")], ["⚙️", "Settings", () => go("settings")]];
    return (
      <div className="gt-strip" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>
        {items.map(([ic, l, fn]) => <button key={l} onClick={fn} style={{ flexShrink: 0, width: 72, padding: "10px 4px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 20 }}>{ic}</div><div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11, color: "var(--text-strong)", marginTop: 4 }}>{l}</div></button>)}
      </div>
    );
  }
  // ---- v512: weekly challenges — three auto challenges a week, built from YOUR rounds, scored from
  // YOUR rounds. Completions persist to users/{uid}/challenges/{week} so the Challenger badge can count.
  const ChainsChallenges = (() => {
    const DAY = 86400000;
    function weekId(t) { const d = new Date(t || Date.now()); const day = (d.getDay() + 6) % 7; const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); return mon.getFullYear() + "-W" + String(Math.ceil(((mon - new Date(mon.getFullYear(), 0, 1)) / DAY + 1) / 7)).padStart(2, "0") + "|" + mon.getFullYear() + "-" + String(mon.getMonth() + 1).padStart(2, "0") + "-" + String(mon.getDate()).padStart(2, "0"); }
    function weekRange(wid) { const mon = wid.split("|")[1]; const [y, m, d] = mon.split("-").map(Number); const a = new Date(y, m - 1, d); const b = new Date(y, m - 1, d + 6); const iso = (x) => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); return { from: iso(a), to: iso(b), endsIn: Math.max(0, Math.ceil((new Date(y, m - 1, d + 7).getTime() - Date.now()) / DAY)) }; }
    function seed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
    const short = (n) => String(n || "").replace(/ disc golf.*$/i, "").replace(/ park$/i, "");
    const sameCourse = (r, c) => (c.id != null && r.course_id != null) ? String(r.course_id) === String(c.id) : r.course_name === c.name;
    const finished = (rounds, me) => Object.values(rounds || {}).filter((r) => r && r.status !== "open" && !r.practice && r.hole_scores && r.hole_scores[me] && r.pars);
    const birdiesOf = (r, me) => r.hole_scores[me].reduce((a, v, i) => a + (v != null && v < r.pars[i] ? 1 : 0), 0);
    // v522: targets scale with YOUR last four weeks — a little more than you've been doing, never silly.
    function build(rounds, me, wid) {
      const all = finished(rounds, me);
      const { from } = weekRange(wid); const [fy, fm, fd] = from.split("-").map(Number);
      const start4 = new Date(fy, fm - 1, fd - 28); const iso = (x) => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
      const recent = all.filter((r) => String(r.date || "").slice(0, 10) >= iso(start4) && String(r.date || "").slice(0, 10) < from);
      const perWeek = recent.length / 4;
      const bpr = all.length ? all.reduce((a, r) => a + birdiesOf(r, me), 0) / all.length : 0;
      const roundsT = Math.max(1, Math.min(4, Math.round(perWeek + 0.6)));
      const birdiesT = Math.max(2, Math.min(24, Math.round(Math.max(1.5, bpr) * roundsT + 1)));
      const byCourse = {}; all.forEach((r) => { const k = r.course_id != null ? String(r.course_id) : r.course_name; byCourse[k] = byCourse[k] || { id: r.course_id, name: r.course_name, n: 0, sum: 0, holes: {} }; byCourse[k].n++; byCourse[k].sum += (r.scores && r.scores[me]) || 0; r.hole_scores[me].forEach((v, i) => { if (v == null) return; const h = byCourse[k].holes[i] = byCourse[k].holes[i] || { n: 0, under: 0, sum: 0 }; h.n++; h.sum += v - r.pars[i]; if (v < r.pars[i]) h.under++; }); });
      const hc = ChainsHome.get();
      const home = (hc && Object.values(byCourse).find((c) => String(c.id) === String(hc))) || Object.values(byCourse).sort((a, b) => b.n - a.n)[0] || null;
      const rnd = seed(wid + "|" + (me || ""));
      const out = [
        { id: "rounds", icon: "rounds", title: roundsT === 1 ? "Play a round this week" : "Play " + roundsT + " rounds this week", test: (wk) => ({ n: wk.length, goal: roundsT }) },
        { id: "birdies", icon: "birdie", title: "Card " + birdiesT + " birdies this week", test: (wk) => ({ n: wk.reduce((a, r) => a + birdiesOf(r, me), 0), goal: birdiesT }) },
      ];
      // third one rotates: your HARDEST hole at home (worst average over par, 2+ plays) · beat your average · a clean nine
      const pick = home ? (() => { const holes = Object.keys(home.holes).map(Number); const scored = holes.map((i) => ({ i, avg: home.holes[i].n ? (home.holes[i].sum || 0) / home.holes[i].n : 0, n: home.holes[i].n })).filter((x) => x.n >= 2); scored.sort((a, b) => b.avg - a.avg || a.i - b.i); const top = scored.slice(0, 3); if (top.length) return top[Math.floor(rnd() * top.length)].i; const cand = holes.filter((i) => home.holes[i].under === 0); const pool = cand.length ? cand : holes; return pool.length ? pool[Math.floor(rnd() * pool.length)] : null; })() : null;
      const avg = home && home.n ? home.sum / home.n : null;
      const third = rnd();
      if (home && pick != null && third < 0.45) out.push({ id: "birdie_h" + (pick + 1), icon: "birdie", title: "Birdie hole " + (pick + 1) + " at " + short(home.name), test: (wk) => ({ n: wk.some((r) => sameCourse(r, home) && r.hole_scores[me][pick] != null && r.hole_scores[me][pick] < r.pars[pick]) ? 1 : 0, goal: 1 }) });
      else if (home && avg != null && third < 0.8) out.push({ id: "beat_avg", icon: "avg", title: "Beat your average at " + short(home.name) + " (" + fmtPar(Math.round(avg)) + ")", test: (wk) => ({ n: wk.filter((r) => sameCourse(r, home) && r.scores[me] != null && r.scores[me] < avg).length ? 1 : 0, goal: 1 }) });
      else out.push({ id: "clean9", icon: "target", title: "Nine straight holes without a bogey", test: (wk) => ({ n: wk.some((r) => { let run = 0; return r.hole_scores[me].some((v, i) => { run = (v != null && v <= r.pars[i]) ? run + 1 : 0; return run >= 9; }); }) ? 1 : 0, goal: 1 }) });
      // ---- bonus: two to go after (harder, not required for a perfect week) — seeded so everyone's differ
      const played = new Set(all.map((r) => String(r.course_id != null ? r.course_id : r.course_name)));
      const full = (r) => r.hole_scores[me].filter((v) => v != null).length >= r.pars.length;
      const hour = (r) => { try { return new Date(r.created_at || r.startedAt).getHours(); } catch (e) { return 12; } };
      const bonusPool = [
        { id: "b_courses3", icon: "map", title: "Play three different courses this week", test: (wk) => ({ n: new Set(wk.map((r) => String(r.course_id != null ? r.course_id : r.course_name))).size, goal: 3 }) },
        { id: "b_newcourse", icon: "map", title: "Play a course you've never played", test: (wk) => ({ n: wk.some((r) => { const k = String(r.course_id != null ? r.course_id : r.course_name); const earlier = all.filter((x) => String(x.course_id != null ? x.course_id : x.course_name) === k && String(x.date) < String(r.date)); return earlier.length === 0; }) ? 1 : 0, goal: 1 }) },
        { id: "b_underpar", icon: "trend", title: "Shoot a full round under par", test: (wk) => ({ n: wk.some((r) => full(r) && r.scores[me] < 0) ? 1 : 0, goal: 1 }) },
        { id: "b_turkey", icon: "birdie", title: "Birdie three holes in a row", test: (wk) => ({ n: wk.some((r) => { let run = 0; return r.hole_scores[me].some((v, i) => { run = (v != null && v < r.pars[i]) ? run + 1 : 0; return run >= 3; }); }) ? 1 : 0, goal: 1 }) },
        { id: "b_clean", icon: "target", title: "A full round with no bogeys", test: (wk) => ({ n: wk.some((r) => full(r) && r.hole_scores[me].every((v, i) => v != null && v <= r.pars[i])) ? 1 : 0, goal: 1 }) },
        { id: "b_friend", icon: "users", title: "Play a round with a friend on your card", test: (wk) => ({ n: wk.some((r) => (r.group || []).filter((g) => g && g.id !== me && !/^guest/.test(g.id)).length >= 1) ? 1 : 0, goal: 1 }) },
        { id: "b_early", icon: "sun", title: "Tee off before 8 am", test: (wk) => ({ n: wk.some((r) => hour(r) < 8) ? 1 : 0, goal: 1 }) },
        { id: "b_36", icon: "rounds", title: "36 holes in one day", test: (wk) => { const byDay = {}; wk.forEach((r) => { const d = String(r.date || "").slice(0, 10); byDay[d] = (byDay[d] || 0) + r.hole_scores[me].filter((v) => v != null).length; }); return { n: Math.max(0, ...Object.values(byDay)) >= 36 ? 1 : 0, goal: 1 }; } },
        { id: "b_birdies8", icon: "birdie", title: "Eight birdies in one round", test: (wk) => ({ n: wk.some((r) => birdiesOf(r, me) >= 8) ? 1 : 0, goal: 1 }) },
        { id: "b_record", icon: "trophy", title: home ? "Set a new personal best at " + short(home.name) : "Set a new personal best somewhere", test: (wk) => ({ n: wk.some((r) => { if (!full(r)) return false; const k = String(r.course_id != null ? r.course_id : r.course_name); const prev = all.filter((x) => String(x.course_id != null ? x.course_id : x.course_name) === k && String(x.date) < String(r.date) && full(x)).map((x) => x.scores[me]); return prev.length && r.scores[me] < Math.min.apply(null, prev); }) ? 1 : 0, goal: 1 }) },
        { id: "b_ace", icon: "target", title: "Hit an ace", test: (wk) => ({ n: wk.some((r) => r.hole_scores[me].some((v, i) => v === 1 && r.pars[i] >= 3)) ? 1 : 0, goal: 1 }) },
      ];
      const order = bonusPool.map((c, i) => ({ c, k: rnd() })).sort((a, b) => a.k - b.k).map((x) => x.c);
      order.slice(0, 2).forEach((c) => out.push(Object.assign({ bonus: true }, c)));
      if (played.size === 0) { /* brand new player: keep it to the three */ out.splice(3); }
      return out;
    }
    function evaluate(rounds, me, wid) {
      const { from, to } = weekRange(wid);
      const wk = finished(rounds, me).filter((r) => String(r.date || "").slice(0, 10) >= from && String(r.date || "").slice(0, 10) <= to);
      const list = build(rounds, me, wid).map((c) => { const p = c.test(wk); return Object.assign({}, c, { n: Math.min(p.n, p.goal), goal: p.goal, done: p.n >= p.goal }); });
      list.required = list.filter((c) => !c.bonus); list.bonus = list.filter((c) => c.bonus);
      const best = wk.reduce((b, r) => (r.scores && r.scores[me] != null && (b == null || r.scores[me] < b.tp)) ? { tp: r.scores[me], course: r.course_name } : b, null);
      return { list, week: wk, best };
    }
    const KEY = "chains_challenges_v1";
    function readDone() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
    // persist: my completions (private) + a small public weekly card so the scoreboard works
    function persist(wid, ev, me) {
      const done = ev.list.filter((c) => c.done).map((c) => c.id);
      const req = ev.list.filter((c) => !c.bonus);
      const o = readDone(); const prev = o[wid] || []; const merged = Array.from(new Set(prev.concat(done)));
      const changed = merged.length !== prev.length; o[wid] = merged; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
      try {
        const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb();
        if (u && d && changed) d.ref("users/" + u.uid + "/challenges/" + wid.split("|")[0]).set({ done: merged, total: req.length, at: Date.now() }).catch(() => {});
        if (d && me) { const card = { name: myDisplayName(me) || me, done: req.filter((c) => c.done).length, total: req.length, bonus: ev.list.filter((c) => c.bonus && c.done).length, rounds: ev.week.length, best: ev.best ? ev.best.tp : null, bestCourse: ev.best ? ev.best.course : null, at: Date.now() };
          const k = "chains_weekly_card_v1:" + wid.split("|")[0]; const last = localStorage.getItem(k); const sig = JSON.stringify([card.done, card.rounds, card.best]);
          if (last !== sig) { d.ref("weekly/" + wid.split("|")[0] + "/" + me).set(card).then(() => { try { localStorage.setItem(k, sig); } catch (e) {} }).catch(() => {}); } }
      } catch (e) {}
    }
    function pullDone() { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); if (!u || !d) return; d.ref("users/" + u.uid + "/challenges").get().then((snap) => { const v = snap.val() || {}; const o = readDone(); Object.keys(v).forEach((w) => { const k = Object.keys(o).find((x) => x.split("|")[0] === w) || w; o[k] = Array.from(new Set((o[k] || []).concat((v[w] && v[w].done) || []))); }); localStorage.setItem(KEY, JSON.stringify(o)); }).catch(() => {}); } catch (e) {} }
    function weeksCompleted() { const o = readDone(); return Object.keys(o).filter((w) => (o[w] || []).length > 0).length; }
    function totalDone() { const o = readDone(); return Object.keys(o).reduce((a, w) => a + (o[w] || []).length, 0); }
    const reqDone = (arr) => (arr || []).filter((id) => !/^b_/.test(id)).length;
    function perfectWeeks() { const o = readDone(); return Object.keys(o).filter((w) => reqDone(o[w]) >= 3).length; }
    // streak with one free miss every four weeks (Duolingo-style freeze), counted back from the latest perfect week
    function perfectStreak() {
      const o = readDone(); const set = new Set(Object.keys(o).filter((w) => reqDone(o[w]) >= 3).map((w) => w.split("|")[0]));
      if (!set.size) return 0;
      const ws = Array.from(set).sort(); let cur = ws[ws.length - 1]; let run = 1, sinceFreeze = 99, usedFreezes = 0;
      for (let i = 0; i < 400; i++) { const prev = prevWeek(cur); if (!prev) break; if (set.has(prev)) { run++; sinceFreeze++; cur = prev; continue; } if (sinceFreeze >= 4 && usedFreezes < 12) { usedFreezes++; sinceFreeze = 0; cur = prev; continue; } break; }
      return run;
    }
    function prevWeek(w) { const m = /^(\d{4})-W(\d{2})$/.exec(w); if (!m) return null; let y = +m[1], n = +m[2] - 1; if (n < 1) { n = 52; y--; } return y + "-W" + String(n).padStart(2, "0"); }
    // ---- the month ("season") set: four targets from your last three months, one reward in the window
    function monthId(t) { const d = new Date(t || Date.now()); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
    function monthEval(rounds, me, mid) {
      mid = mid || monthId(); const all = finished(rounds, me);
      const inMonth = (r, m) => String(r.date || "").slice(0, 7) === m;
      const [y, mo] = mid.split("-").map(Number); const prev3 = [1, 2, 3].map((k) => { const d = new Date(y, mo - 1 - k, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); });
      const hist = all.filter((r) => prev3.includes(String(r.date || "").slice(0, 7)));
      const perMonth = hist.length / 3; const bpr = all.length ? all.reduce((a, r) => a + birdiesOf(r, me), 0) / all.length : 0;
      const roundsT = Math.max(3, Math.min(16, Math.round(perMonth + 1.5)));
      const birdiesT = Math.max(6, Math.min(80, Math.round(Math.max(1.5, bpr) * roundsT + 2)));
      const coursesT = Math.max(1, Math.min(4, Math.round((new Set(hist.map((r) => String(r.course_id != null ? r.course_id : r.course_name))).size / 3) + 0.6)));
      const wk = all.filter((r) => inMonth(r, mid));
      const full = (r) => r.hole_scores[me].filter((v) => v != null).length >= r.pars.length;
      const list = [
        { id: "m_rounds", icon: "rounds", title: "Play " + roundsT + " rounds", n: wk.length, goal: roundsT },
        { id: "m_birdies", icon: "birdie", title: "Card " + birdiesT + " birdies", n: wk.reduce((a, r) => a + birdiesOf(r, me), 0), goal: birdiesT },
        { id: "m_courses", icon: "map", title: coursesT === 1 ? "Play a course" : "Play " + coursesT + " different courses", n: new Set(wk.map((r) => String(r.course_id != null ? r.course_id : r.course_name))).size, goal: coursesT },
        { id: "m_weeks", icon: "target", title: "Three perfect weeks", n: Object.keys(readDone()).filter((w) => w.indexOf("|" + mid) > 0 || (w.split("|")[1] || "").slice(0, 7) === mid).filter((w) => reqDone(readDone()[w]) >= 3).length, goal: 3 },
      ].map((c) => Object.assign(c, { n: Math.min(c.n, c.goal), done: c.n >= c.goal }));
      const done = list.filter((c) => c.done).length;
      const name = new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: "long" });
      const daysLeft = Math.max(0, new Date(y, mo, 0).getDate() - (monthId() === mid ? new Date().getDate() : 0));
      return { mid, name, list, done, complete: done === list.length, daysLeft, best: wk.filter(full).reduce((b, r) => (b == null || r.scores[me] < b) ? r.scores[me] : b, null) };
    }
    const MKEY = "chains_seasons_v1";
    function readMonths() { try { return JSON.parse(localStorage.getItem(MKEY) || "{}") || {}; } catch (e) { return {}; } }
    function persistMonth(ev) { if (!ev || !ev.complete) return; const o = readMonths(); if (o[ev.mid]) return; o[ev.mid] = { at: Date.now() }; try { localStorage.setItem(MKEY, JSON.stringify(o)); } catch (e) {} try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); if (u && d) d.ref("users/" + u.uid + "/seasons/" + ev.mid).set({ at: Date.now() }).catch(() => {}); } catch (e) {} }
    function monthsCompleted() { return Object.keys(readMonths()).length; }
    function nextWeek(w) { const m = /^(\d{4})-W(\d{2})$/.exec(w); if (!m) return null; let y = +m[1], n = +m[2] + 1; if (n > 52) { n = 1; y++; } return y + "-W" + String(n).padStart(2, "0"); }
    // scoreboard: everyone's public weekly card + best rounds this week from the shared course stats
    function board(wid) {
      const d = cloudDb(); const w = wid.split("|")[0]; const { from, to } = weekRange(wid);
      const cards = d ? d.ref("weekly/" + w).get().then((s) => s.val() || {}).catch(() => ({})) : Promise.resolve({});
      const stats = (window.ChainsRounds && ChainsRounds.allCourseStats) ? ChainsRounds.allCourseStats().catch(() => ({})) : Promise.resolve({});
      return Promise.all([cards, stats]).then(([cv, all]) => {
        const rounds = []; Object.keys(all || {}).forEach((cid) => (all[cid] || []).forEach((r) => { const dte = String(r.date || "").slice(0, 10); if (dte < from || dte > to) return; Object.keys(r.players || {}).forEach((k) => { const p = r.players[k]; if (p && p.total != null) rounds.push({ key: k, name: p.name || k, course: r.name, tp: p.total, strokes: p.strokes, date: r.date, full: p.full !== false }); }); }));
        const byPlayer = {}; rounds.forEach((r) => { const e = byPlayer[r.key] || (byPlayer[r.key] = { key: r.key, name: r.name, rounds: 0, best: null }); e.rounds++; if (e.best == null || r.tp < e.best.tp) e.best = r; });
        const completed = Object.keys(cv).map((k) => Object.assign({ key: k }, cv[k])).filter((c) => c.done > 0).sort((a, b) => b.done - a.done || (a.best == null ? 99 : a.best) - (b.best == null ? 99 : b.best));
        const bestRounds = rounds.filter((r) => r.full).sort((a, b) => a.tp - b.tp || String(a.date).localeCompare(String(b.date))).slice(0, 5);
        const mostRounds = Object.values(byPlayer).sort((a, b) => b.rounds - a.rounds).slice(0, 5);
        return { completed, bestRounds, mostRounds, players: Object.keys(byPlayer).length };
      });
    }
    return { weekId, weekRange, evaluate, persist, pullDone, weeksCompleted, totalDone, perfectWeeks, perfectStreak, board, monthId, monthEval, persistMonth, monthsCompleted };
  })();
  window.ChainsChallenges = ChainsChallenges;
  function WeeklyChallenges({ rounds, me, full }) {
    const wid = ChainsChallenges.weekId();
    const ev = React.useMemo(() => { try { return me ? ChainsChallenges.evaluate(rounds, me, wid) : { list: [], week: [], best: null }; } catch (e) { return { list: [], week: [], best: null }; } }, [rounds, me, wid]);
    React.useEffect(() => { ChainsChallenges.pullDone(); }, []);
    React.useEffect(() => { if (ev.list.length) ChainsChallenges.persist(wid, ev, me); }, [ev]);
    if (!me || !ev.list.length) return null;
    const { endsIn } = ChainsChallenges.weekRange(wid);
    const req = ev.list.filter((c) => !c.bonus), bonus = ev.list.filter((c) => c.bonus);
    const doneN = req.filter((c) => c.done).length, allDone = doneN === req.length;
    const streak = ChainsChallenges.perfectStreak(), perfect = ChainsChallenges.perfectWeeks();
    const icon = (c) => c.icon === "rounds" ? <Icons.Disc size={20} /> : c.icon === "birdie" ? <Icons.Flag size={20} /> : (c.icon === "avg" || c.icon === "trend") ? <Icons.TrendUp size={20} /> : c.icon === "map" ? <Icons.Map size={20} /> : c.icon === "users" ? <Icons.Users size={20} /> : c.icon === "sun" ? <Icons.Sun size={20} /> : c.icon === "trophy" ? <Icons.Trophy size={20} /> : <Icons.Target size={20} />;
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid " + (allDone ? "var(--score-under, #1a7a50)" : "var(--border-subtle)"), borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px 6px" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>This week</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 12, color: allDone ? "var(--score-under, #1a7a50)" : "var(--text-muted)" }}>{allDone ? "Perfect week" : doneN + " of " + req.length + " · " + (endsIn <= 1 ? "ends today" : endsIn + " days left")}</span>
        </div>
        {req.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", opacity: c.done ? .7 : 1 }}>
            <span style={{ width: 24, height: 24, color: c.done ? "var(--score-under, #1a7a50)" : "var(--fairway-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon(c)}</span>
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", textDecoration: c.done ? "line-through" : "none" }}>{c.title}</span>
            {c.done ? <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--score-under, #1a7a50)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Check size={14} /></span>
              : c.goal > 1 ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 54, height: 6, borderRadius: 3, background: "var(--bg-sunken, #eef2ef)", overflow: "hidden" }}><span style={{ display: "block", width: Math.round(100 * c.n / c.goal) + "%", height: "100%", background: "var(--fairway-500)" }} /></span><span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", minWidth: 32, textAlign: "right" }}>{c.n}/{c.goal}</span></span> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}>–</span>}
          </div>
        ))}
        {bonus.length > 0 && <div style={{ padding: "9px 14px 4px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)" }}>Go after it <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>· bonus, not needed for a perfect week</span></div>}
        {bonus.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", opacity: c.done ? .7 : 1 }}>
            <span style={{ width: 24, height: 24, color: c.done ? "var(--score-under, #1a7a50)" : "var(--gold-600, #b8860b)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon(c)}</span>
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", textDecoration: c.done ? "line-through" : "none" }}>{c.title}</span>
            {c.done ? <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--score-under, #1a7a50)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Check size={14} /></span> : c.goal > 1 ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{c.n}/{c.goal}</span> : null}
          </div>
        ))}
        <div style={{ padding: "9px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ width: 18, height: 18, color: "#8F6A08", display: "inline-flex" }}><Icons.Medal size={18} /></span>
          <span>{allDone ? "All three done — that's a perfect week" + (streak > 1 ? ", " + streak + " in a row" : "") + "." : "Finish all three for a perfect week" + (streak ? " and keep your " + streak + "-week streak" : "") + "."}{perfect ? " " + perfect + " perfect " + (perfect === 1 ? "week" : "weeks") + " so far." : ""}</span>
        </div>
      </div>
    );
  }

  function WhatsNew() {
    const [items, setItems] = React.useState(null);
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { let alive = true; getJSON("https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/news.json?v=" + CAT_VER).then((j) => { if (alive) setItems((j && j.items) || []); }); return () => { alive = false; }; }, []);
    if (!items || !items.length) return null;
    const seenKey = "chains_news_seen_v1"; let seen = ""; try { seen = localStorage.getItem(seenKey) || ""; } catch (e) {}
    const latest = items[0]; const fresh = seen !== latest.date + latest.title;
    const list = open ? items : items.slice(0, 1);
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid " + (fresh ? "var(--ace-200, #f5ddd1)" : "var(--border-subtle)"), borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <button onClick={() => { setOpen((v) => !v); try { localStorage.setItem(seenKey, latest.date + latest.title); } catch (e) {} }} style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>What's new{fresh ? <span style={{ marginLeft: 8, padding: "1px 8px", borderRadius: 10, background: "var(--ace-700)", color: "#fff", fontSize: 10.5, fontWeight: 800 }}>NEW</span> : null}</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>{open ? "Less" : "All updates"}</span>
        </button>
        {list.map((n, i) => <div key={i} style={{ padding: "8px 14px 12px", borderTop: "1px solid var(--border-subtle)" }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--text-strong)" }}>{n.title} <span style={{ fontWeight: 400, fontSize: 11.5, color: "var(--text-faint)" }}>· {n.date}</span></div><div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.45 }}>{n.body}</div></div>)}
      </div>
    );
  }
  function MyTerritory({ me, onOpenCourse }) {
    const [list, setList] = React.useState(null);
    React.useEffect(() => { let alive = true; if (!window.ChainsRounds || !ChainsRounds.allCourseStats || !me) return; ChainsRounds.allCourseStats().then((all) => { if (!alive) return; const out = []; Object.keys(all).forEach((cid) => { const t = ChainsRounds.courseTerritory(all[cid], me); if (!t.me) return; const name = (all[cid][0] && all[cid][0].name) || cid; out.push({ cid, name, t }); }); out.sort((a, b) => (b.t.isKing + b.t.hasRecord) - (a.t.isKing + a.t.hasRecord) || b.t.me.rounds - a.t.me.rounds); setList(out); }).catch(() => { if (alive) setList([]); }); return () => { alive = false; }; }, [me]);
    if (!list || !list.length) return null;
    const held = list.filter((x) => x.t.isKing || x.t.hasRecord);
    return (
      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", marginBottom: 8 }}>Titles you hold <span style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-muted)" }}>· {held.length} of {list.length} courses</span></div>
        <div className="gt-strip" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {list.map((x) => (
            <button key={x.cid} onClick={() => onOpenCourse && onOpenCourse(x.cid)} style={{ flexShrink: 0, width: 150, textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-lg)", border: "1px solid " + (x.t.isKing || x.t.hasRecord ? "var(--gold-500, #d4a017)" : "var(--border-subtle)"), background: x.t.isKing || x.t.hasRecord ? "linear-gradient(160deg, var(--gold-50, #fbf6e9), var(--bg-elevated))" : "var(--bg-elevated)", cursor: "pointer" }}>
              <div style={{ fontSize: 18 }}>{x.t.isKing ? "Most rounds" : ""}{x.t.hasRecord ? (x.t.isKing ? " · record" : "Record") : ""}{!x.t.isKing && !x.t.hasRecord ? "Played" : ""}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.name}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{x.t.isKing ? "Most rounds here" : x.t.hasRecord ? "You hold the record" : (x.t.toKing === 1 ? "1 round from the crown" : x.t.toKing + " rounds from the crown")}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  /* ---- v514 Lost & found: per-course board. lostFound/{course}/{id} {type lost|found, by, name, hole, desc,
     contact, photo (≤320px jpeg), at, status open|returned, returnedAt}. 60-day auto-hide. ---- */
  const ChainsLostFound = (() => {
    const db = () => cloudDb(); const me = () => (window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null;
    const myName = () => { try { return (window.ChainsFriends && ChainsFriends.myName && ChainsFriends.myName()) || me() || "Someone"; } catch (e) { return me() || "Someone"; } };
    const safe = (x) => String(x == null ? "" : x).replace(/[.#$\[\]\/]/g, "_");
    function watch(cid, cb) { const d = db(); if (!d || cid == null) { cb([]); return () => {}; } const ref = d.ref("lostFound/" + safe(cid)); const h = ref.on("value", (s) => { const v = s.val() || {}; const cut = Date.now() - 60 * 86400000; cb(Object.keys(v).map((k) => Object.assign({ id: k }, v[k])).filter((x) => x && (x.at || 0) > cut).sort((a, b) => (b.at || 0) - (a.at || 0))); }, () => cb([])); return () => { try { ref.off("value", h); } catch (e) {} }; }
    function post(cid, o) { const d = db(), k = me(); if (!d || !k) return Promise.resolve(false); const id = "lf-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); const rec = { type: o.type === "found" ? "found" : "lost", by: k, name: myName(), hole: o.hole != null && o.hole !== "" ? Number(o.hole) : null, desc: String(o.desc || "").trim().slice(0, 240), contact: String(o.contact || "").trim().slice(0, 80), photo: o.photo || null, at: Date.now(), status: "open" };
      return d.ref("lostFound/" + safe(cid) + "/" + id).set(rec).then(() => { try { const fr = (window.ChainsFriends && ChainsFriends.list ? ChainsFriends.list() : []).map((f) => f.uid); if (fr.length && window.ChainsNotify) ChainsNotify.post({ id: "n-" + id, type: "lostfound", title: (rec.type === "found" ? "Found a disc" : "Lost a disc") + " at " + String(o.courseName || "a course").replace(/ disc golf.*$/i, ""), body: myName() + ": " + rec.desc + (rec.hole ? " (hole " + rec.hole + ")" : ""), audience: fr, link: "play" }); } catch (e) {} return true; }).catch(() => false); }
    function setStatus(cid, id, status) { const d = db(); if (!d) return Promise.resolve(false); return d.ref("lostFound/" + safe(cid) + "/" + id).update({ status: status, returnedAt: status === "returned" ? Date.now() : null }).then(() => { if (status === "returned") { try { const k = me(); const key = "chains_lf_returned_v1:" + k; const n = (+localStorage.getItem(key) || 0) + 1; localStorage.setItem(key, String(n)); } catch (e) {} } return true; }).catch(() => false); }
    function remove(cid, id) { const d = db(); if (!d) return Promise.resolve(false); return d.ref("lostFound/" + safe(cid) + "/" + id).remove().then(() => true).catch(() => false); }
    function returnedCount() { try { return +localStorage.getItem("chains_lf_returned_v1:" + me()) || 0; } catch (e) { return 0; } }
    return { watch, post, setStatus, remove, returnedCount };
  })();
  window.ChainsLostFound = ChainsLostFound;
  function shrinkImage(file, size, q) { return new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file); img.onload = () => { try { const c = document.createElement("canvas"); const r = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight)); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", q || 0.72)); } catch (e) { rej(e); } URL.revokeObjectURL(url); }; img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("bad image")); }; img.src = url; }); }
  function LostFoundSection({ courseId, course, me, T }) {
    const [items, setItems] = React.useState([]);
    const [open, setOpen] = React.useState(null); // null | "lost" | "found"
    const [hole, setHole] = React.useState(""); const [desc, setDesc] = React.useState(""); const [contact, setContact] = React.useState(""); const [photo, setPhoto] = React.useState(null); const [busy, setBusy] = React.useState(false);
    React.useEffect(() => ChainsLostFound.watch(courseId, setItems), [courseId]);
    const N = course.holes || 18;
    const openItems = items.filter((x) => x.status !== "returned"), done = items.filter((x) => x.status === "returned");
    function submit() { if (!desc.trim() || busy) return; setBusy(true); ChainsLostFound.post(courseId, { type: open, hole, desc, contact, photo, courseName: course.name }).then((ok) => { setBusy(false); if (ok) { setOpen(null); setHole(""); setDesc(""); setContact(""); setPhoto(null); window.ChainsToast && ChainsToast.show("Posted — your friends got a heads-up.", "success"); } else window.ChainsToast && ChainsToast.show("Couldn’t post — try again.", "error"); }); }
    const inp = { width: "100%", height: 42, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", boxSizing: "border-box" };
    const pill = (t, on, fn) => <button onClick={fn} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid " + (on ? "var(--fairway-600)" : "var(--border-default)"), background: on ? "var(--fairway-700)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5 }}>{t}</button>;
    const item = (x, i) => (
      <div key={x.id} style={{ display: "flex", gap: 10, padding: "11px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", opacity: x.status === "returned" ? .6 : 1 }}>
        {x.photo ? <img src={x.photo} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : <span style={{ width: 64, height: 64, borderRadius: 10, background: "var(--bg-sunken, #eef2ef)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{x.type === "found" ? <Icons.Search size={22} /> : <Icons.Disc size={22} />}</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ padding: "1px 8px", borderRadius: 10, background: x.type === "found" ? "var(--fairway-50)" : "var(--ace-100, #fdece4)", color: x.type === "found" ? "var(--fairway-700)" : "var(--ace-700, #b3410f)", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 10.5, textTransform: "uppercase" }}>{x.status === "returned" ? "Returned" : x.type}</span><span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--text-strong)" }}>{x.by === me ? "You" : x.name}</span>{x.hole ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>hole {x.hole}</span> : null}<span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>{relDays(new Date(x.at).toISOString())}</span></div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-body)", marginTop: 4, lineHeight: 1.4, textDecoration: x.status === "returned" ? "line-through" : "none" }}>{x.desc}</div>
          {x.contact ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>Contact: {x.contact}</div> : null}
          {x.by === me && x.status !== "returned" ? <div style={{ display: "flex", gap: 12, marginTop: 6 }}><button onClick={() => ChainsLostFound.setStatus(courseId, x.id, "returned").then(() => window.ChainsToast && ChainsToast.show("Nice — marked returned.", "success"))} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fairway-700)", fontWeight: 600, padding: 0 }}>Mark returned</button><button onClick={() => ChainsLostFound.remove(courseId, x.id)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", padding: 0 }}>Delete</button></div> : null}
        </div>
      </div>
    );
    return (
      <div>
        <div style={T.label}>Lost & found {openItems.length ? <span style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-muted)" }}>· {openItems.length} open</span> : null}</div>
        <div style={Object.assign({}, T.card, { padding: 12 })}>
          {!open ? (
            <div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Lost a disc here, or found one? Post it — your friends get a heads-up and anyone who plays here sees it.</div>
              <div style={{ display: "flex", gap: 8 }}>{pill("I lost a disc", false, () => setOpen("lost"))}{pill("I found a disc", false, () => setOpen("found"))}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>{pill("Lost", open === "lost", () => setOpen("lost"))}{pill("Found", open === "found", () => setOpen("found"))}</div>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={open === "found" ? "What is it? e.g. blue Buzzz, no name, near the creek" : "What is it? e.g. orange Destroyer, name on the back"} maxLength={240} style={inp} />
              <div style={{ display: "flex", gap: 8 }}>
                <select value={hole} onChange={(e) => setHole(e.target.value)} style={Object.assign({}, inp, { width: 110, flexShrink: 0 })}><option value="">Hole?</option>{Array.from({ length: N }, (_, i) => <option key={i} value={i + 1}>Hole {i + 1}</option>)}</select>
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="How to reach you (optional)" maxLength={80} style={inp} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-strong)", display: "inline-flex", alignItems: "center", gap: 6 }}>{photo ? "Change photo" : "Add a photo"}<input type="file" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; shrinkImage(f, 320, 0.72).then(setPhoto).catch(() => window.ChainsToast && ChainsToast.show("Couldn’t read that image.", "error")); }} style={{ display: "none" }} /></label>
                {photo ? <img src={photo} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover" }} /> : null}
                <button onClick={submit} disabled={busy || !desc.trim()} style={{ marginLeft: "auto", height: 40, padding: "0 18px", borderRadius: 20, border: "none", background: desc.trim() ? "var(--fairway-700)" : "var(--chain-300)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 13 }}>{busy ? "…" : "Post"}</button>
                <button onClick={() => setOpen(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        {openItems.length > 0 && <div style={Object.assign({}, T.card, { marginTop: 8 })}>{openItems.map(item)}</div>}
        {done.length > 0 && <div style={Object.assign({}, T.card, { marginTop: 8 })}>{done.slice(0, 5).map(item)}</div>}
      </div>
    );
  }
  function CourseView({ course, rounds, me, onBack, onPlay, onHole, mobile }) {
    const courseId = course && course.id;
    const [geo, setGeo] = React.useState(() => ChainsGeo.cache[courseId] || {});
    const [comm, setComm] = React.useState({ ratings: {}, notes: {} });
    const [noteText, setNoteText] = React.useState("");
    const [noteHole, setNoteHole] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    React.useEffect(() => { if (!courseId) return; ChainsGeo.load(courseId).then(setGeo); const u1 = ChainsGeo.watch(courseId, setGeo); const u2 = ChainsCourseCommunity.watch(courseId, setComm); return () => { u1(); u2(); }; }, [courseId]);
    const pars = course.hole_pars || Array(course.holes || 18).fill(3), lens = course.hole_lengths || [];
    const N = pars.length;
    const mapped = Object.keys(geo || {}).filter((k) => geo[k] && geo[k].tee && geo[k].basket).length;
    const ratings = Object.values(comm.ratings || {}); const avg = ratings.length ? ratings.reduce((a, r) => a + (r.stars || 0), 0) / ratings.length : null;
    const myStars = me && comm.ratings && comm.ratings[me] ? comm.ratings[me].stars : 0;
    const notes = Object.keys(comm.notes || {}).map((k) => Object.assign({ id: k }, comm.notes[k])).sort((a, b) => (b.at || 0) - (a.at || 0));
    const myRounds = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && r.course_id === courseId && r.scores && me && r.scores[me] != null);
    const myBest = myRounds.length ? Math.min(...myRounds.map((r) => r.scores[me])) : null;
    const [homeTick, setHomeTick] = React.useState(0);
    const [, setFavTick] = React.useState(0);
    // v544 — who holds each hole (owner + most birdies) for the Holes tab, from the course board
    const [holders, setHolders] = React.useState(null);
    React.useEffect(() => { let alive = true; if (!window.ChainsRounds || !ChainsRounds.courseBoard || courseId == null || !window.ChainsTakeover) return; ChainsRounds.courseBoard(courseId).then((b) => { if (!alive) return; const t = ChainsTakeover.compute(b || []); const marks = window.ChainsNames && ChainsNames.holeMarks ? ChainsNames.holeMarks(b || []) : []; setHolders({ own: t.holes, marks }); }).catch(() => {}); return () => { alive = false; }; }, [courseId]);
    const mastery = React.useMemo(() => { try { return ChainsHome.mastery(rounds, me, courseId, Array.from({ length: N }, (_, i) => (course.hole_pars || [])[i] || 3)); } catch (e) { return []; } }, [rounds, me, courseId, N]);
    const holeStats = (() => { const out = []; for (let h = 0; h < N; h++) { let s = 0, n = 0; myRounds.forEach((r) => { const hs = r.hole_scores && r.hole_scores[me] ? toArr(r.hole_scores[me]) : null; if (hs && hs[h] != null) { s += hs[h]; n++; } }); out.push(n ? s / n : null); } return out; })();
    const T = {
      h1: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, lineHeight: 1.05, color: "var(--text-strong)" },
      label: { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", marginBottom: 8 },
      card: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
      fact: { display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" },
    };
    const Stars = ({ value, onPick, size }) => <span style={{ display: "inline-flex", gap: 2 }}>{[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={onPick ? () => onPick(i) : undefined} aria-label={i + " stars"} style={{ border: "none", background: "transparent", cursor: onPick ? "pointer" : "default", padding: 0, fontSize: size || 18, color: i <= Math.round(value || 0) ? "#d4a017" : "var(--border-default)", lineHeight: 1 }}>★</button>)}</span>;
    const am = course.amenities || {};
    const facts = [
      course.address ? [<Icons.Pin size={16} />, course.address] : null,
      course.status ? [<Icons.Flag size={16} />, course.status] : null,
      course.fees ? [<Icons.Dot size={16} />, course.fees] : course.playFee === "free" ? [<Icons.Dot size={16} />, "Free to play"] : null,
      course.tees || course.targets ? [<Icons.Target size={16} />, [course.tees ? course.tees + " tees" : null, course.targets ? course.targets + " baskets" : null].filter(Boolean).join(" · ")] : null,
      course.elevation || course.difficulty ? [<Icons.Layers size={16} />, [course.difficulty, course.elevation].filter(Boolean).join(" · ")] : null,
      Object.keys(am).length ? [<Icons.List size={16} />, [am.dogs ? "Dogs OK" : "No dogs", am.cart_friendly ? "cart friendly" : null, am.water === false ? "no water" : am.water ? "water" : null, am.restrooms === false ? "no restrooms" : am.restrooms ? "restrooms" : null].filter(Boolean).join(" · ")] : null,
      course.established ? [<Icons.Calendar size={16} />, "Established " + course.established] : null,
    ].filter(Boolean);
    const submitNote = () => { if (!noteText.trim()) return; setBusy(true); ChainsCourseCommunity.note(courseId, noteText, noteHole === "" ? null : Number(noteHole)).then((ok) => { setBusy(false); if (ok) { setNoteText(""); setNoteHole(""); } else { try { window.ChainsToast && ChainsToast.show("Couldn't post that note — try again.", "error"); } catch (e) {} } }); };
    const [ctab, setCtab] = React.useState(() => { try { const t = sessionStorage.getItem("chains_course_tab"); return t || "course"; } catch (e) { return "course"; } });
    React.useEffect(() => { try { sessionStorage.setItem("chains_course_tab", ctab); } catch (e) {} }, [ctab]);
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)", flexShrink: 0 }}><Icons.ChevLeft size={20} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={Object.assign({}, T.h1, { flex: 1, minWidth: 0 })}>{course.name}</div>
              <button onClick={() => { const on = ChainsFavs.toggle(course.id); setFavTick((x) => x + 1); if (window.ChainsToast) ChainsToast.show(on ? "Added to your favourites." : "Removed from favourites.", "success"); }} aria-label="Favourite" style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border-default)", background: ChainsFavs.has(course.id) ? "var(--gold-100, #fcefc7)" : "var(--bg-elevated)", color: ChainsFavs.has(course.id) ? "var(--gold-600, #b8860b)" : "var(--text-muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Star size={20} /></button>
            </div>
            {course.community ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fairway-700)", marginTop: 4 }}>Community course · added by {course.addedName || course.addedBy || "a player"}. Pars from the player; map it on the Holes tab.</div> : null}
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>{[course.city ? course.city + (course.state ? ", " + course.state : "") : null, N + " holes", "Par " + (course.par_total || pars.reduce((a, b) => a + b, 0)), course.course_length_ft ? course.course_length_ft.toLocaleString() + " ft" : null, course.est_minutes ? "~" + Math.floor(course.est_minutes / 60) + " hr " + (course.est_minutes % 60) + " min" : null].filter(Boolean).join(" · ")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}><Stars value={avg} /><span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>{avg ? avg.toFixed(1) + " · " + ratings.length + (ratings.length === 1 ? " rating" : " ratings") : "No ratings yet"}</span></div>
          </div>
        </div>
        {/* v515: one screen's worth at a time */}
        <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg-sunken, #eef2ef)", borderRadius: 12, position: "sticky", top: 0, zIndex: 3 }}>
          {[["course", "Course"], ["holes", "Holes"], ["names", "Territory"], ["board", "Board"]].map(([id, lbl]) => <button key={id} onClick={() => setCtab(id)} style={{ flex: 1, height: 36, border: "none", borderRadius: 10, background: ctab === id ? "var(--fairway-700)" : "transparent", color: ctab === id ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, padding: 0 }}>{lbl}</button>)}
        </div>
        {ctab === "course" && <React.Fragment>
        {/* map */}
        <div style={Object.assign({}, T.card, { height: 260, position: "relative", background: "#1b2a20" })}>
          {mapped ? <CourseOverviewMap course={course} holes={geo} /> : <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#f3eedc", fontFamily: "var(--font-sans)", fontSize: 13.5, textAlign: "center", padding: 16, background: "linear-gradient(160deg, #2f6b44, #1b2a20)" }}><span style={{ display: "inline-flex" }}><Icons.Map size={28} /></span>No holes mapped yet. Mark tees and baskets while you play and the map builds itself.</div>}
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, padding: "4px 10px", borderRadius: 12, background: "rgba(31,77,51,.9)", color: "#f3eedc", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11.5 }}>{mapped}/{N} holes mapped</div>
        </div>
        <button className="cw-press" onClick={() => onPlay(course)} style={{ height: 54, borderRadius: "var(--radius-lg)", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 16, boxShadow: "0 8px 20px -8px var(--ace-500)" }}>Play here</button>
        {course.needs_review && (
          <div style={Object.assign({}, T.card, { padding: "12px 14px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", lineHeight: 1.45 })}>
            <b>Community course.</b> Added from OpenStreetMap{course.attribution ? "" : ""} — no hole data yet. Play it, mark the tees and baskets from the hole card, and you're its Pioneer: first name on the course, for good.
          </div>
        )}
        {/* you here */}
        {myRounds.length > 0 && (
          <div style={Object.assign({}, T.card, { padding: "12px 14px", display: "flex", gap: 16 })}>
            <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)" }}>{myRounds.length}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>your rounds</div></div>
            <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: parColor(myBest) }}>{fmtPar(myBest)}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>your best</div></div>
            <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)" }}>{(myRounds.reduce((a, r) => a + r.scores[me], 0) / myRounds.length).toFixed(1)}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>avg to par</div></div>
          </div>
        )}
        {/* facts */}
        {(facts.length || course.signed_order_note) ? (
          <div>
            <div style={T.label}>About the course</div>
            <div style={T.card}>
              {facts.map((f, i) => <div key={i} style={Object.assign({}, T.fact, i === 0 ? { borderTop: "none" } : {})}><span style={{ width: 22, display: "inline-flex", justifyContent: "center", color: "var(--fairway-600)" }}>{f[0]}</span><span>{f[1]}</span></div>)}
              {course.signed_order_note ? <div style={T.fact}><span style={{ width: 22, display: "inline-flex", justifyContent: "center", color: "var(--fairway-600)" }}><Icons.Flag size={16} /></span><span>{course.signed_order_note}</span></div> : null}
              {course.hole_notes ? Object.keys(course.hole_notes).sort((a, b) => Number(a) - Number(b)).map((k) => <div key={k} style={T.fact}><span style={{ width: 22, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800 }}>{k}</span><span>{course.hole_notes[k]}</span></div>) : null}
            </div>
          </div>
        ) : null}
        </React.Fragment>}
        {ctab === "holes" && <React.Fragment>
        {/* holes */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <span style={T.label}>Holes</span>
            <button onClick={() => { const on = ChainsHome.get() === String(courseId); ChainsHome.set(on ? null : courseId); setHomeTick((x) => x + 1); window.ChainsToast && ChainsToast.show(on ? "No home course set." : String(course.name).replace(/ disc golf.*$/i, "") + " is your home course.", "info"); }} style={{ marginLeft: "auto", marginBottom: 8, padding: "6px 10px", borderRadius: 16, border: "1px solid " + (ChainsHome.get() === String(courseId) ? "var(--ace-500)" : "var(--border-default)"), background: ChainsHome.get() === String(courseId) ? "var(--ace-100, #fdece4)" : "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: ChainsHome.get() === String(courseId) ? "var(--ace-700, #b3410f)" : "var(--text-strong)", display: "inline-flex", alignItems: "center", gap: 6 }}><Icons.Home size={14} />{ChainsHome.get() === String(courseId) ? "Home course" : "Make this my home course"}</button>
          </div>
          {mastery.some((m) => m.n) && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 8 }}>Your mastery map: {mastery.filter((m) => m.birdies > 0).length} of {N} holes birdied · {mastery.filter((m) => m.kind === "fix").length ? mastery.filter((m) => m.kind === "fix").length + " to fix" : "nothing beating you right now"} · targets are from your last five plays on each hole.</div>}
          <div style={T.card}>
            {Array.from({ length: N }, (_, h) => { const g = geo && geo[h]; const ok = g && g.tee && g.basket; const avgH = holeStats[h]; const m = mastery[h]; return (
              <button key={h} onClick={() => onHole && onHole(h)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderTop: h ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer" }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "#1f4d33", color: "#f3eedc", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>{h + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)" }}>Par {pars[h]}{lens[h] ? " · " + lens[h] + " ft" : ""}{course.hole_notes && course.hole_notes[String(h + 1)] ? " · note" : ""}</span>
                  {m && m.n ? <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: m.kind === "fix" ? "var(--score-over, #c23a33)" : m.kind === "birdie" || m.kind === "repeat" ? "var(--fairway-700)" : "var(--text-muted)", marginTop: 2 }}>{m.target}{m.prog ? " · " + m.prog : ""}{m.best != null ? " · best " + m.best : ""}</span> : null}
                  <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>{ok ? "Mapped" : "Not mapped yet"}{avgH != null ? " · you average " + avgH.toFixed(1) : ""}</span>
                  {holders ? (() => { const o = holders.own[h] && holders.own[h].owner; const bl = holders.marks[h] && holders.marks[h].birdieLeader; if (!o && !bl) return null; return <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fairway-700)", marginTop: 2 }}>{o ? (o.key === me ? "You own it" : __fn(o.name) + " owns it") + " (avg " + (Math.round(o.avg * 10) / 10) + ")" : "Open hole"}{bl ? " · most birdies: " + (bl.key === me ? "you" : __fn(bl.name)) + " (" + bl.n + ")" : ""}</span>; })() : null}
                </span>
                <span style={{ color: "var(--text-faint)", display: "inline-flex" }}><Icons.ChevRight size={18} /></span>
              </button>); })}
          </div>
        </div>
        </React.Fragment>}
        {ctab === "names" && <TerritoryCard course={course} me={me} part="names" />}
        {ctab === "board" && <React.Fragment>
        {/* community */}
        <div>
          <div style={T.label}>Rate it</div>
          <div style={Object.assign({}, T.card, { padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
            <Stars value={myStars} size={30} onPick={(n) => ChainsCourseCommunity.rate(courseId, n).then((ok) => { try { window.ChainsToast && ChainsToast.show(ok ? "Thanks — rated " + n + " stars." : "Couldn't save your rating.", ok ? "success" : "error"); } catch (e) {} })} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>{myStars ? "Your rating: " + myStars + "/5 · tap to change" : "Tap a star"}</span>
          </div>
        </div>
        <div>
          <div style={T.label}>Player notes {notes.length ? <span style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-muted)" }}>· {notes.length}</span> : null}</div>
          <div style={Object.assign({}, T.card, { padding: 12 })}>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Tips for other players — lines, OB, where the next tee is, what disc works…" style={{ width: "100%", minHeight: 64, padding: 10, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-sunken)", color: "var(--text-strong)", resize: "vertical", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
              <select value={noteHole} onChange={(e) => setNoteHole(e.target.value)} style={{ height: 40, padding: "0 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13.5, background: "var(--bg-elevated)", color: "var(--text-strong)" }}><option value="">Whole course</option>{Array.from({ length: N }, (_, h) => <option key={h} value={h}>Hole {h + 1}</option>)}</select>
              <button onClick={submitNote} disabled={busy || !noteText.trim()} style={{ marginLeft: "auto", height: 40, padding: "0 18px", borderRadius: 20, border: "none", background: noteText.trim() ? "var(--ace-500)" : "var(--bg-sunken)", color: noteText.trim() ? "#fff" : "var(--text-faint)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14 }}>Post</button>
            </div>
          </div>
          {notes.length > 0 && (
            <div style={Object.assign({}, T.card, { marginTop: 8 })}>
              {notes.map((n, i) => (
                <div key={n.id} style={{ padding: "11px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={n.name || n.by} color={(window.ChainsFriends && ChainsFriends.profile(n.by) || {}).disc || "#9CA3AF"} size={24} />
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--text-strong)" }}>{n.name || n.by}</span>
                    {n.hole != null ? <span style={{ padding: "1px 8px", borderRadius: 10, background: "var(--fairway-50)", color: "var(--fairway-700)", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11 }}>Hole {n.hole + 1}</span> : null}
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>{n.at ? relDays(new Date(n.at).toISOString()) : ""}</span>
                    {n.by === me ? <button onClick={() => ChainsCourseCommunity.removeNote(courseId, n.id)} aria-label="Delete note" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-faint)", fontSize: 14 }}>×</button> : null}
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-body)", marginTop: 5, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>{n.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <LostFoundSection courseId={courseId} course={course} me={me} T={T} />
        </React.Fragment>}
      </div>
    );
  }
  /* ---- v516 Home tiles + Me ---- */
  function HomeTiles({ onPlay, onStats, onThrow, onMe, onCourses }) {
    const go = (v) => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: v })); } catch (e) {} };
    const T = [
      [<Icons.Disc size={22} />, "Go Throw", "Rounds · stats · trophies", onThrow],
      [<Icons.Trophy size={22} />, "Leagues", "Course leagues · season 2026", () => go("myleagues")],
    ];
    const tile = { display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer", textAlign: "left", minHeight: 68 };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onPlay} className="cw-press" style={{ height: 56, borderRadius: "var(--radius-lg)", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 17, boxShadow: "0 8px 20px -8px var(--ace-500)" }}>Start a round</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {T.map(([ic, t, d, fn]) => (
            <button key={t} onClick={fn} style={tile}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--fairway-100)", color: "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic}</span>
              <span style={{ minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", lineHeight: 1.1 }}>{t}</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.3 }}>{d}</span></span>
            </button>))}
        </div>
      </div>
    );
  }
  // v523 Home blocks: everything reachable in one row, your last round, your newest trophies
  function HomeEverything({ onThrow, onStats, onBag, onCourses, onMe }) {
    const go = (v) => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: v })); } catch (e) {} };
    const live = (() => { try { const m = ChainsEngine.seasonMeta(); return !!(m && m.live); } catch (e) { return false; } })();
    const items = [
      [<Icons.Disc size={20} />, "Go Throw", onThrow], [<Icons.Trophy size={20} />, "Leagues", () => go("myleagues")], [<Icons.Tv size={20} />, live ? "Live now" : "Live", () => go("course")], [<Icons.Medal size={20} />, "Trophies", onStats],
      [<Icons.Users size={20} />, "Friends", () => go("friends")], [<Icons.Backpack size={20} />, "Bag", onBag], [<Icons.Map size={20} />, "Courses", onCourses], [<Icons.User size={20} />, "Profile", onMe || (() => go("settings"))],
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {items.map(([ic, l, fn]) => <button key={l} onClick={fn} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px 8px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer" }}><span style={{ width: 34, height: 34, borderRadius: 10, background: l === "Live now" ? "var(--ace-100, #fdece4)" : "var(--fairway-100)", color: l === "Live now" ? "var(--ace-600)" : "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{ic}</span><span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11.5, color: "var(--text-strong)" }}>{l}</span></button>)}
      </div>
    );
  }
  // v538 — Chase card on Home: a title you're close to · your next breakthrough · this week.
  function ChaseCard({ rounds, me, onChallenges, onCourse }) {
    const [home, setHome] = React.useState(null);
    const [lead, setLead] = React.useState(null);
    const [board, setBoard] = React.useState(null);
    const [goal, setGoalState] = React.useState(() => ChainsGoals.get());
    const [picking, setPicking] = React.useState(false);
    React.useEffect(() => { ChainsGoals.pull(); const t = setTimeout(() => setGoalState(ChainsGoals.get()), 1500); return () => clearTimeout(t); }, [me]);
    React.useEffect(() => {
      let alive = true;
      const hid = ChainsHome.get() || (() => { const c = {}; Object.values(rounds || {}).forEach((r) => { if (r && r.course_id != null && r.status !== "open") c[r.course_id] = (c[r.course_id] || 0) + 1; }); return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || null; })();
      if (!hid) { setHome(null); return; }
      loadCatalog().then((cat) => { const c = (cat || []).find((x) => x && String(x.id) === String(hid)); if (!alive || !c) return; setHome(c); if (window.ChainsRounds && ChainsRounds.courseBoard) ChainsRounds.courseBoard(c.id).then((b) => { if (alive) { setBoard(b || []); setLead(ChainsRounds.courseTerritory(b || [], me, c.hole_pars || null)); } }).catch(() => {}); });
      return () => { alive = false; };
    }, [rounds, me]);
    const suggestions = React.useMemo(() => (home ? ChainsGoals.suggest(rounds, me, home) : []), [home, rounds, me]);
    const ev = React.useMemo(() => ChainsGoals.evaluate(goal, rounds, me), [goal, rounds, me]);
    const setGoal = (g) => { const v = g ? Object.assign({}, g, { since: Date.now() }) : null; ChainsGoals.set(v); setGoalState(v); setPicking(false); };
    // closest title at the home course
    const chase = React.useMemo(() => {
      if (!lead || !home) return null;
      const short = String(home.name || "").replace(/ disc golf.*$/i, "");
      const mine = lead.me; const items = [];
      const add = (title, holder, gapText, gapN, open) => items.push({ title, holder, gapText, gapN, open });
      if (!lead.record) add("Course record", null, "Nobody holds it yet. Your next full round sets it.", 0, true);
      else if (lead.record.key !== me && mine && mine.best != null) add("Course record", lead.record, "Shoot " + fmtPar(lead.record.best - 1) + " or better. Your best is " + fmtPar(mine.best) + ".", Math.max(1, mine.best - lead.record.best + 1));
      if (!lead.champion) add("Course champion " + lead.year, null, "Nobody holds it this year. Your next full round takes it.", 0, true);
      else if (lead.champion.key !== me && mine) add("Course champion " + lead.year, lead.champion, "Beat " + fmtPar(lead.champion.best) + " this year.", Math.max(1, (mine.best != null ? mine.best : lead.champion.best + 3) - lead.champion.best + 1));
      if (lead.king && lead.king.key !== me && mine) add("Most rounds", lead.king, lead.king.rounds + " to your " + mine.rounds + ". " + (lead.king.rounds - mine.rounds + 1) + " more rounds here takes it.", lead.king.rounds - mine.rounds + 1);
      if (!lead.birdieLeader) add("Birdie leader " + lead.year, null, "Nobody holds it yet. One birdie here starts it.", 0, true);
      else if (lead.birdieLeader.key !== me) { const myHoles = (lead.birdieLeaderMine != null) ? lead.birdieLeaderMine : null; add("Birdie leader " + lead.year, lead.birdieLeader, lead.birdieLeader.holes + " different holes birdied this year. Birdie holes you haven't yet.", lead.birdieLeader.holes); }
      if (!lead.regular) add("Local regular", null, "Play here on 3 different days in 90 days and it's yours.", 0, true);
      else if (lead.regular.key !== me) add("Local regular", lead.regular, lead.regular.days + " different days in the last 90. Keep showing up.", lead.regular.days);
      // hole-level birdie titles ("2 more birdies on hole 8 takes Kyle's title there")
      try {
        if (board && window.ChainsNames && ChainsNames.holeMarks) {
          const marks = ChainsNames.holeMarks(board); const myB = {}; const pars = home.hole_pars || [];
          board.forEach((r) => { const p = r.players && r.players[me]; if (!p || !p.hs) return; const hs = toArr(p.hs); const pr = r.pars ? toArr(r.pars) : pars; hs.forEach((v, i) => { if (v != null && pr[i] != null && v < pr[i]) myB[i] = (myB[i] || 0) + 1; }); });
          marks.forEach((m) => { if (!m.birdieLeader || m.birdieLeader.key === me) return; const gap = m.birdieLeader.n - (myB[m.hole - 1] || 0) + 1; add("Most birdies on hole " + m.hole, m.birdieLeader, gap + (gap === 1 ? " more birdie" : " more birdies") + " on hole " + m.hole + " takes it (" + m.birdieLeader.n + " to your " + (myB[m.hole - 1] || 0) + ").", gap); });
        }
      } catch (e) {}
      const held = [lead.record, lead.champion, lead.king, lead.birdieLeader, lead.regular, lead.improved].filter((x) => x && x.key === me).length;
      items.sort((a, b) => (b.open - a.open) || a.gapN - b.gapN);
      return { item: items[0] || null, held, short };
    }, [lead, board, home, me]);
    if (!home) return null;
    const card = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" };
    const lbl = { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)", padding: "9px 14px 2px" };
    const rowS = { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: "1px solid var(--border-subtle)", cursor: "pointer", background: "transparent", border: "none", borderTop: "1px solid var(--border-subtle)", width: "100%", textAlign: "left" };
    const ic = (I, col) => <span style={{ width: 24, height: 24, color: col || "var(--fairway-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I size={22} /></span>;
    return (
      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", marginBottom: 8 }}>What you're chasing <span style={{ fontWeight: 500, fontSize: 12.5, color: "var(--text-muted)" }}>· {chase ? chase.short : home.name}</span></div>
        <div style={card}>
          <div style={lbl}>A title within reach</div>
          {chase && chase.item ? (
            <button onClick={onCourse ? () => onCourse(home) : undefined} style={rowS}>
              {ic(Icons.Flag, chase.item.open ? "var(--ace-500)" : "var(--fairway-600)")}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)" }}>{chase.item.title}{chase.item.holder ? <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> · {__fn(chase.item.holder.name)} holds it</span> : <span style={{ fontWeight: 500, color: "var(--ace-700)" }}> · open</span>}</span>
                <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{chase.item.gapText}</span>
              </span>
              <span style={{ color: "var(--text-faint)", display: "inline-flex" }}><Icons.ChevRight size={18} /></span>
            </button>
          ) : <div style={{ padding: "6px 14px 12px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>{chase && chase.held ? "You hold " + chase.held + (chase.held === 1 ? " title" : " titles") + " here. Nothing to chase — defend them." : "Play a full round here and the titles open up."}</div>}
          <div style={lbl}>Your next breakthrough</div>
          {goal && !picking ? (
            <button onClick={() => setPicking(true)} style={rowS}>
              {ic(ev.done ? Icons.Check : Icons.Target, ev.done ? "var(--score-under, #1a7a50)" : "var(--fairway-600)")}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)", textDecoration: ev.done ? "line-through" : "none" }}>{goal.title}</span>
                <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: ev.done ? "var(--score-under, #1a7a50)" : "var(--text-muted)", marginTop: 2 }}>{ev.done ? "Done. Pick the next one." : ev.note || goal.how}</span>
                {!ev.done && <span style={{ display: "block", marginTop: 6, width: "100%", height: 5, borderRadius: 3, background: "var(--bg-sunken, #eef2ef)", overflow: "hidden" }}><span style={{ display: "block", width: Math.round(ev.progress * 100) + "%", height: "100%", background: "var(--fairway-500)" }} /></span>}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", flexShrink: 0 }}>Change</span>
            </button>
          ) : (
            <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ padding: "8px 14px 4px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Pick one thing from your own history. Only you see it.</div>
              {suggestions.length ? suggestions.map((g) => <button key={g.id} onClick={() => setGoal(g)} style={Object.assign({}, rowS, { padding: "9px 14px" })}>{ic(Icons.Target)}<span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }}>{g.title}</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{g.how}</span></span></button>)
                : <div style={{ padding: "4px 14px 12px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>Two full rounds at {chase ? chase.short : "your home course"} and the suggestions appear.</div>}
              {goal && picking ? <button onClick={() => setPicking(false)} style={Object.assign({}, rowS, { padding: "9px 14px", color: "var(--text-muted)", fontFamily: "var(--font-sans)", fontSize: 13 })}>Keep "{goal.title}"</button> : null}
            </div>
          )}
          <button onClick={onChallenges} style={rowS}>
            {ic(Icons.Calendar)}
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)" }}>This week's challenges</span>
            <span style={{ color: "var(--text-faint)", display: "inline-flex" }}><Icons.ChevRight size={18} /></span>
          </button>
        </div>
      </div>
    );
  }
  function LastRound({ r, me, onOpen }) {
    if (!r) return null;
    const tp = r.scores && me ? r.scores[me] : null; const hs = r.hole_scores && me && r.hole_scores[me] ? toArr(r.hole_scores[me]) : null; const played = hs ? hs.filter((v) => v != null).length : null; const strokes = hs ? hs.reduce((a, v) => a + (v || 0), 0) : null;
    const others = (r.group || []).filter((g) => g && g.id !== me).map((g) => __fn(g.name));
    return (
      <button onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)" }}>Last round</div>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(r.course_name || "Round").replace(/ disc golf.*$/i, "")}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{r.date ? relDays(r.date + "T12:00:00") : ""}{played && r.pars && played < toArr(r.pars).length ? " · " + played + " of " + toArr(r.pars).length + " holes" : ""}{others.length ? " · with " + others.join(", ") : " · solo"}</div>
        </div>
        <div style={{ textAlign: "right" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 26, lineHeight: 1, color: parColor(tp) }}>{tp == null ? "—" : fmtPar(tp)}</div>{strokes ? <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 3 }}>{strokes} strokes</div> : null}</div>
        <span style={{ width: 17, height: 17, color: "var(--text-faint)" }}><Icons.ChevRight size={17} /></span>
      </button>
    );
  }
  function RecentTrophies({ me, onStats }) {
    let list = []; try { list = JSON.parse(localStorage.getItem("chains_recent_badges_v1:" + me) || "[]"); } catch (e) {}
    if (!list.length) return null;
    const tc = (b) => (window.ChainsBadges && ChainsBadges.tierColor ? ChainsBadges.tierColor(b) : null) || "var(--fairway-600)";
    return (
      <button onClick={onStats} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-faint)" }}>Newest trophies</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6, overflow: "hidden" }}>{list.slice(0, 4).map((b, i) => <span key={b.id + i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px 4px 5px", borderRadius: 18, background: "var(--bg-sunken, #eef2ef)", border: "1px solid " + tc(b), fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--text-strong)", whiteSpace: "nowrap" }}><BadgeIcon b={b} size={14} color={tc(b)} />{b.name}{b.tier ? <span style={{ color: tc(b), fontSize: 10.5 }}>{b.tier}</span> : null}</span>)}</div>
        </div>
        <span style={{ width: 17, height: 17, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={17} /></span>
      </button>
    );
  }
  function MeView({ me, rounds, mobile, onBack, onStats, onBag, onTitles }) {
    const go = (v) => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: v })); } catch (e) {} };
    const [names, setNames] = React.useState(null);
    const [badges, setBadges] = React.useState(null);
    const [, tick] = React.useState(0);
    React.useEffect(() => { let alive = true; if (window.ChainsNames && me) ChainsNames.mine(me).then((v) => { if (alive) setNames(v); }); if (window.ChainsBadges && window.ChainsRounds) loadBadges(me).then((b) => { if (!alive) return; setBadges(b); try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const d = cloudDb(); const un = u && u.username ? String(u.username).toLowerCase() : me; if (d && un) d.ref("usernames/" + un + "/points").set(b.points).catch(() => {}); } catch (e) {} }).catch(() => {}); const un = window.ChainsFriends && ChainsFriends.onChange ? ChainsFriends.onChange(() => tick((x) => x + 1)) : null; return () => { alive = false; if (un) un(); }; }, [me]);
    const name = myDisplayName(me) || "You";
    const u = (() => { try { return window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); } catch (e) { return null; } })();
    const photo = window.ChainsFriends && ChainsFriends.photo ? ChainsFriends.photo(me) : null;
    const feat = featuredOf(me);
    const mine = Object.values(rounds || {}).filter((r) => r && r.status !== "open" && r.scores && r.scores[me] != null);
    const best = mine.length ? Math.min.apply(null, mine.map((r) => r.scores[me])) : null;
    const earned = badges ? badges.badges.filter((b) => b.level > 0).length : null;
    const row = (ic, t, d, fn) => <button key={t} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", textAlign: "left" }}><span style={{ width: 26, height: 26, color: "var(--fairway-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{ic}</span><span style={{ flex: 1 }}><span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--text-strong)" }}>{t}</span>{d ? <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{d}</span> : null}</span><span style={{ width: 17, height: 17, color: "var(--text-faint)" }}><Icons.ChevRight size={17} /></span></button>;
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FlowHead title="Me" sub="Your profile" onBack={onBack} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", borderRadius: "var(--radius-lg)", background: "radial-gradient(120% 140% at 0% 0%, var(--pine-700) 0%, var(--bg-ink-deep) 70%)", color: "var(--bone-50)" }}>
          {photo ? <img src={photo} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 0 3px var(--ace-500)" }} /> : <Avatar name={name} size={72} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, lineHeight: 1 }}>{name}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 4 }}>{u && u.username ? "@" + u.username : ""}</div>
            {feat ? <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: feat.color || "var(--ace-500)", marginTop: 5 }}>{feat.name}{feat.tier ? " · " + feat.tier : ""}</div> : null}
            {badges && window.ChainsBadges && ChainsBadges.level ? (() => { const L = ChainsBadges.level(badges.points); return <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 5 }}>Level {L.n}{L.next != null ? " · " + L.toNext + " points to level " + (L.n + 1) : " · top level"}</div>; })() : null}
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {[[mine.length, "rounds"], [best == null ? "—" : fmtPar(best), "best"], [earned == null ? "…" : earned, "trophies"], [badges ? badges.points : "…", "points"]].map(([v, l]) => <div key={l}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{v}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9.5, color: "var(--chain-400)", marginTop: 3 }}>{l}</div></div>)}
            </div>
          </div>
        </div>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {row(<Icons.User size={22} />, "Profile photo & account", "Photo, password, recovery email, notifications", () => go("settings"))}
          {row(<Icons.Trophy size={22} />, "Trophies", earned != null && badges ? earned + " of " + badges.badges.length + " earned" : "", onStats)}
          {row(<Icons.Flag size={22} />, "Titles you hold", names ? names.firsts + " firsts · " + names.holds + " holes owned" : "", onTitles || (() => go("takeover")))}
          {row(<Icons.Backpack size={22} />, "Bag", "", onBag)}
          {row(<Icons.Users size={22} />, "Friends & messages", "", () => go("friends"))}
          {row(<Icons.Settings size={22} />, "Settings", "Theme, maps, app", () => go("settings"))}
        </div>
        <div style={{ textAlign: "center" }}><button onClick={() => { window.ChainsConfirm.show({ title: "Sign out of Chains?", confirmLabel: "Sign out" }).then((ok) => { if (ok && window.ChainsAuth) ChainsAuth.signOut(); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Sign out</button></div>
      </div>
    );
  }
  function PlayViewInner() {
    const { mobile } = useViewport();
    const [stage, setStage] = React.useState("home"); // home | course | group | score | finish
    const [rounds, setRounds] = React.useState(null);
    React.useEffect(() => { try { window.__chainsRounds = rounds; } catch (e) {} }, [rounds]);
    const [cleaning, setCleaning] = React.useState(false); // #43: busy-state for bulk cleanup
    const [draft, setDraft] = React.useState(null); // {course, group, mode, holeScores, totals}
    const [finishResult, setFinishResult] = React.useState(null);
    const [detail, setDetail] = React.useState(null);
    const [watchId, setWatchId] = React.useState(null);
    React.useEffect(() => { const m = (location.hash || "").match(/watch=([A-Za-z0-9_-]+)/); if (m) { setWatchId(m[1]); try { history.replaceState(null, "", location.pathname + location.search + "#play"); } catch (e) {} } }, []);
    // v534 — #course=<id> from a sticker: open that course page once (works signed out too)
    React.useEffect(() => { let cid = null; try { cid = localStorage.getItem("chains_pending_course"); if (cid) localStorage.removeItem("chains_pending_course"); } catch (e) {} if (!cid) return; const fire = () => { try { window.dispatchEvent(new CustomEvent("chains:play-nav", { detail: "course:" + cid })); } catch (e) {} }; const ts = [900, 2600, 5000].map((ms) => setTimeout(fire, ms)); return () => ts.forEach(clearTimeout); }, []);
    const [showWeeklies, setShowWeeklies] = React.useState(false);
    const [showStats, setShowStats] = React.useState(false);
    const [showBag, setShowBag] = React.useState(false);
    const [active, setActive] = React.useState(() => { try { return JSON.parse(localStorage.getItem("chains_play_active") || "null"); } catch (e) { return null; } });
    // CRASH-PROOF RESUME: if the local pointer is missing (app killed, storage
    // cleared, different device), find my newest OPEN cloud round so scoring can
    // ALWAYS continue. Re-checks when identity/auth lands (reopen races sign-in).
    const [cloudActive, setCloudActive] = React.useState(null);
    React.useEffect(() => {
      let liveFlag = true, inFlight = false;
      function check() {
        if (!window.ChainsRounds || !ChainsRounds.available() || inFlight) return;
        inFlight = true;
        ChainsRounds.loadMine().then((list) => {
          inFlight = false;
          if (!liveFlag) return;
          const opens = (list || []).filter((r) => r && r.status === "open").sort((x, y) => String(y.updatedAt || y.date || "").localeCompare(String(x.updatedAt || x.date || "")));
          setCloudActive(opens.length ? opens : null);
        }).catch(() => { inFlight = false; });
      }
      check();
      const t = setTimeout(check, 3500);
      const fn = () => check();
      window.addEventListener("chains:identity", fn);
      window.addEventListener("chains:rounds", fn);
      return () => { liveFlag = false; clearTimeout(t); window.removeEventListener("chains:identity", fn); window.removeEventListener("chains:rounds", fn); };
    }, []);
    const [invites, setInvites] = React.useState(null);
    const [invDetail, setInvDetail] = React.useState(null);
    // v490 crew feed: friends' finished rounds you weren't on (public shared index).
    const [crew, setCrew] = React.useState(null);
    const [udisc, setUdisc] = React.useState(false);
    const [viewCourse, setViewCourse] = React.useState(null);   // v501 course page
    const [throwSec, setThrowSec] = React.useState(null);       // v521 Go Throw hub section
    // v505: bottom tab bar drives Go Throw (Home / Courses / Play)
    React.useEffect(() => {
      const fn = (e) => { const to = e && e.detail; if (to === "browse") { setDetail(null); setShowStats(false); setStage("browse"); } else if (to === "start") { setDetail(null); setShowStats(false); if (stage === "score") return; beginRound(); } else if (to === "home") { setDetail(null); setShowStats(false); setViewCourse(null); if (stage !== "score") setStage("home"); } else if (typeof to === "string" && to.indexOf("course:") === 0) { const cid = to.slice(7); const open = (cat) => { const c = (cat || []).find((x) => x && String(x.id) === String(cid)); if (c) { setDetail(null); setShowStats(false); setViewCourse(c); if (stage !== "score") setStage("courseview"); } }; if (CATALOG) open(CATALOG); else loadCatalog().then(open); } };
      window.addEventListener("chains:play-nav", fn); return () => window.removeEventListener("chains:play-nav", fn);
    });
    const [holeCard, setHoleCard] = React.useState(null);       // {course, hole}
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.loadGroup) return;
      let alive = true;
      const load = () => window.ChainsRounds.loadGroup().then((rs) => { if (!alive) return; const meId = window.ChainsID && ChainsID.whoami(); const list = (rs || []).map(normalizeRound).filter((r) => r && r.status !== "open" && !(meId && Array.isArray(r.group) && r.group.some((g) => g && g.id === meId))).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))).slice(0, 6); setCrew(list); }).catch(() => { if (alive) setCrew([]); });
      load();
      const fn = () => load();
      window.addEventListener("chains:friends", fn); window.addEventListener("chains:rounds", fn);
      return () => { alive = false; window.removeEventListener("chains:friends", fn); window.removeEventListener("chains:rounds", fn); };
    }, []);
    const me = window.ChainsID && ChainsID.whoami();
    React.useEffect(() => { try { ChainsHome.pull(); } catch (e) {} }, [me]);
    // My own OPEN cloud rounds (owner = me) — so "resume" works even after the app
    // was closed mid-round or the local active state was lost.
    const [liveMine, setLiveMine] = React.useState([]);
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.watchLive || !me) return;
      return window.ChainsRounds.watchLive((list) => setLiveMine((list || []).filter((r) => r && ownsRound(r, me))));
    }, [me]);
    // Rebuild the scoring draft from a full cloud record (status open) and reopen the
    // scoring screen at the first unscored hole — same cloudId, so saves continue on
    // the SAME record.
    function resumeFromCloud(rec, id) {
      if (!rec || !rec.players) return;
      const toArr = (window.ChainsRounds && window.ChainsRounds.toArr) || ((x) => Array.isArray(x) ? x : []);
      const group = Object.keys(rec.players).map((k) => ({ id: k, name: rec.players[k].name, color: rec.players[k].disc }));
      const hs = {}; Object.keys(rec.players).forEach((k) => { hs[k] = rec.players[k].holeScores != null ? toArr(rec.players[k].holeScores).slice() : []; });
      const course = Object.assign({}, rec.course || {});
      const pars = course.pars != null ? toArr(course.pars) : (course.hole_pars != null ? toArr(course.hole_pars) : null);
      if (pars && pars.length) course.hole_pars = pars;
      const meKey = (me && rec.players[me]) ? me : Object.keys(rec.players)[0];
      const myArr = hs[meKey] || [];
      const N = (pars && pars.length) || course.holes || 18;
      let next = 0; while (next < N && myArr[next] != null) next++;
      if (next >= N) next = N - 1;
      setDraft({ course: course, group: group, mode: "holes", holeScores: hs, resumeHole: next, cloudId: id, owner: rec.ownerKey || rec.owner || null, weather: rec.weather || null, format: rec.format || "singles", handicaps: rec.handicaps || {} });
      setWatchId(null); setInvDetail(null);
      setStage("score");
    }
    // Resume by id (Live Now row): fetch the record, then resume if it's my open
    // round; anything else falls back to the watch view.
    function onResumeId(id) {
      if (!window.ChainsRounds || !window.ChainsRounds.loadGroup) { setWatchId(id); return; }
      window.ChainsRounds.loadGroup([id]).then((list) => {
        const rec = (list || []).filter(Boolean)[0];
        if (rec && rec.players && rec.status === "open" && (ownsRound(rec, me) || onCard(rec, me))) resumeFromCloud(rec, id);
        else setWatchId(id);
      }).catch(() => setWatchId(id));
    }
    // #7: one safe discard for an OPEN round, wherever its Resume button lives (the
    // local active card, or a cross-device cloudActive row) — same hideForMe/delete
    // split RoundDetail's delete already uses, so discarding a round someone else
    // is also on never yanks it out from under them.
    function discardOpenRound(id, others) {
      return ChainsConfirm.show({ title: "Discard this in-progress round?", message: "Nothing will be saved.", confirmLabel: "Discard", danger: true }).then((go) => {
        if (!go) return;
        if (active && active.cloudId === id) { try { localStorage.removeItem("chains_play_active"); } catch (e) {} setActive(null); }
        if (!id || !window.ChainsRounds) return;
        if (others && others.length) {
          try { window.ChainsToast && ChainsToast.show("Removing from your history…", "info"); } catch (e) {}
          return ChainsRounds.hideForMe(id).then(() => loadRounds().then(setRounds));
        }
        try { window.ChainsToast && ChainsToast.show("Deleting round…", "info"); } catch (e) {}
        return deleteRound(id).then((ok) => { if (!ok) { try { window.ChainsToast && ChainsToast.show("Couldn't delete that round — try again.", "error"); } catch (e) {} } return loadRounds().then(setRounds); });
      });
    }
    // Close an open cloud round as-is: finalize the SAME record (drops it from
    // liveRounds) and land on the normal finish card. Unscored holes stay null.
    function finishFromCloud(rec, id) {
      if (!rec || !rec.players) return;
      const toArr = (window.ChainsRounds && window.ChainsRounds.toArr) || ((x) => Array.isArray(x) ? x : []);
      const group = Object.keys(rec.players).map((k) => ({ id: k, name: rec.players[k].name, color: rec.players[k].disc }));
      const course = Object.assign({}, rec.course || {});
      const pars = course.pars != null ? toArr(course.pars) : (course.hole_pars != null ? toArr(course.hole_pars) : null);
      const scoresMap = {}; group.forEach((g) => { scoresMap[g.id] = rec.players[g.id].holeScores != null ? toArr(rec.players[g.id].holeScores) : []; });
      const totals = {}, holeScores = {};
      group.forEach((g) => {
        const arr = scoresMap[g.id]; const N = (pars && pars.length) || arr.length || 18;
        let tp = 0; const out = [];
        for (let i = 0; i < N; i++) { const s = arr[i] != null ? arr[i] : null; if (s != null && pars) tp += s - pars[i]; out.push(s); }
        totals[g.id] = tp; holeScores[g.id] = out;
      });
      if (window.ChainsRounds && window.ChainsRounds.finalize) {
        try { window.ChainsRounds.finalize({ id: id, course: Object.assign({}, course, { hole_pars: pars }), group: group, scores: scoresMap, pars: pars, weather: rec.weather || null, status: "final" }); } catch (e) {}
      }
      try { localStorage.removeItem("chains_play_active"); } catch (e) {}
      setActive(null); setWatchId(null);
      onFinished({ course: course, group: group, scores: totals, holeScores: holeScores, pars: pars, lens: null, weather: rec.weather || null, format: rec.format || "singles", handicaps: rec.handicaps || {}, cloudId: id });
    }

    function addToInvite(id, m) {
      const inv = invites[id]; if (!inv) return;
      if ((inv.group || []).some((g) => g.id === m.id)) return;
      const isGuest = m.guest || /^p-|^guest/.test(String(m.id));
      inv.group = (inv.group || []).concat([{ id: m.id, name: m.name, color: m.disc, guest: isGuest || undefined }]);
      // Guests (no app) are physically here → auto-count as "in", never "waiting".
      if (isGuest) { inv.rsvp = inv.rsvp || {}; inv.rsvp[m.id] = "in"; }
      setInvites(Object.assign({}, invites, { [id]: inv }));
      saveInviteData(id, inv);
      // only notify real app members (not guests)
      if (window.ChainsNotify && !isGuest && m.id !== me) window.ChainsNotify.post({ type: "round_invite", title: "Round invite", body: "You've been added to a round at " + inv.course_name + ".", audience: [m.id], link: "play" });
    }
    function removeFromInvite(id, gid) {
      const inv = invites[id]; if (!inv) return;
      inv.group = (inv.group || []).filter((g) => g.id !== gid);
      if (inv.rsvp) delete inv.rsvp[gid];
      setInvites(Object.assign({}, invites, { [id]: inv }));
      saveInviteData(id, inv);
    }

    function loadInvites() { return loadInvitesData().then((j) => setInvites(j || {})); }
    React.useEffect(() => { loadRounds().then(setRounds); loadCatalog(); loadInvites(); }, []);

    const myInvites = React.useMemo(() => {
      if (!invites) return [];
      const todayISO = new Date().toISOString().slice(0, 10);
      return Object.keys(invites).map((k) => Object.assign({ id: k }, invites[k]))
        .filter((v) => v && v.date >= todayISO && (!me || v.organizer === me || (Array.isArray(v.group) && v.group.some((g) => g.id === me))))
        .sort((a, b) => String(a.date + a.time).localeCompare(String(b.date + b.time)));
    }, [invites, me]);

    function rsvp(id, val) {
      const inv = invites[id]; if (!inv) return;
      inv.rsvp = inv.rsvp || {}; inv.rsvp[me] = val;
      setInvites(Object.assign({}, invites, { [id]: inv }));
      setInviteRsvpData(id, me, val);
    }
    function removeInviteLocal(id) {
      setInvites((prev) => { const n = Object.assign({}, prev); delete n[id]; return n; });
    }

    const myRounds = React.useMemo(() => {
      if (!rounds) return [];
      return Object.keys(rounds).map((k) => Object.assign({ id: k }, rounds[k]))
        .filter((r) => r && r.status !== "open") // v487: in-progress rounds live in the Resume card, never in history/stats
        .filter((r) => !me || (Array.isArray(r.group) && r.group.some((g) => g.id === me)) || r.logged_by === me)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
        .slice(0, 25);
    }, [rounds, me]);

    function beginRound() {
      // Already mid-round? Offer to resume instead of stacking a second open round.
      const openMine = liveMine.length ? liveMine[0] : null;
      const resumeOpts = { title: "Resume your round?", options: [{ id: "resume", label: "Resume round", variant: "accent" }, { id: "new", label: "Start a new round", variant: "secondary" }] };
      if (active && active.course) {
        ChainsConfirm.choose(Object.assign({ message: "You have a round in progress at " + (active.course.name || "your course") + "." }, resumeOpts)).then((c) => { if (c === "resume") resumeRound(); else if (c === "new") startFresh(); });
        return;
      }
      if (openMine) {
        ChainsConfirm.choose(Object.assign({ message: "You have a live round open" + (openMine.course ? " at " + openMine.course : "") + "." }, resumeOpts)).then((c) => { if (c === "resume") onResumeId(openMine.id); else if (c === "new") startFresh(); });
        return;
      }
      startFresh();
    }
    function startFresh() {
      let lastGroup = null;
      try { lastGroup = JSON.parse(localStorage.getItem(LAST_GROUP_KEY) || "null"); } catch (e) {}
      const meMember = me ? ChainsEngine.member(me) : null;
      // #42: default to JUST YOU — solo takes zero taps; the last group is never
      // silently restored, it resurfaces as a "Played with recently" suggestion.
      const defGroup = meMember ? [{ id: meMember.id, name: meMember.name, color: meMember.disc }] : (me ? [{ id: me, name: "You", color: "#E8590C" }] : []);
      setDraft({ course: null, group: defGroup, mode: "holes", holeScores: {}, totals: {} });
      // CRASH-PROOF RESUME: do NOT clear the active pointer here. Declining the
      // resume prompt used to delete it — one accidental Cancel and the live round
      // became unreachable mid-game. The pointer is replaced when a new round saves.
      setStage("course"); // always ask the course first
    }
    function resumeRound() {
      if (!active) return;
      // v487: carry cloudId (+ format/handicaps/weather/owner) so resuming continues the
      // SAME cloud record. Without it ScoreBoard called ChainsRounds.start() again and
      // every Save & exit -> reopen left an orphaned "open" round behind.
      setDraft({ course: active.course, group: active.group, mode: "holes", holeScores: active.holeScores || {}, resumeHole: active.resumeHole || 0, invId: active.invId || null, cloudId: active.cloudId || null, format: active.format || "singles", handicaps: active.handicaps || {}, weather: active.weather || null, owner: active.owner || null });
      setStage("score");
    }

    function onPickedCourse(c) { setDraft((d) => Object.assign({}, d, { course: c })); try { localStorage.setItem(LAST_COURSE_KEY, JSON.stringify(c)); } catch (e) {} setStage("group"); }
    function onPickedGroup(group, mode, format, handicaps, startHole, endHole) { setDraft((d) => Object.assign({}, d, { group: group, mode: mode, format: format || "singles", handicaps: handicaps || {}, endHole: endHole != null ? endHole : null, startHole: startHole || 0 })); try { localStorage.setItem(LAST_GROUP_KEY, JSON.stringify(group)); } catch (e) {} const dp = discPref(); if (mode !== "total" && !dp.off && window.ChainsBag) { setStage("discs"); return; } setStage(mode === "total" ? "total" : "score"); }
    function onFinished(result) {
      const c = result.course || {};
      const round = {
        course_id: c.id || null, course_name: c.name || "Round", city: c.city || null,
        date: new Date().toISOString().slice(0, 10), logged_by: me || null,
        group: result.group, scores: result.scores, hole_scores: result.holeScores || null, pars: result.pars || null, lens: result.lens || null,
        par_total: c.par_total != null ? c.par_total : (result.pars ? result.pars.reduce((a, b) => a + b, 0) : null),
      };
      // Hole-by-hole rounds were already persisted incrementally + finalized under
      // result.cloudId — just refresh. Total-mode rounds save here.
      // Ace backstop: scan the finished round for any 1 on a par-3+ hole and log it
      // (covers rounds where the live tap-detect didn't fire). De-dupes in ChainsAces.
      try {
        if (window.ChainsAces && me && result.holeScores && result.holeScores[me] && result.pars) {
          result.holeScores[me].forEach((s, i) => { if (s === 1 && result.pars[i] >= 3) window.ChainsAces.log({ course: (result.course || {}).name, hole: i + 1 }); });
        }
      } catch (e) {}
      if (result.cloudId) { loadRounds().then(setRounds); }
      else if (window.PlaySaveRound) { window.PlaySaveRound(round).then(() => loadRounds().then(setRounds)); }
      try { localStorage.removeItem("chains_play_active"); } catch (e) {}
      setActive(null);
      setFinishResult(Object.assign({}, result, { discOut: (draft && draft.discOut != null) ? draft.discOut : null }));
      setStage("finish");
    }
    function bulkCleanup() {
      const all = Object.values(rounds || {});
      const mine = all.filter((r) => r && r.id && (ownsRound(r, me) || onCard(r, me)));
      const solo = mine.filter((r) => !((r.group || []).some((x) => x && x.id !== me && !x.guest)));
      if (!solo.length) { window.ChainsToast && ChainsToast.show("No solo/test rounds of yours to clean up. Rounds with other players are kept.", "info"); return; }
      ChainsConfirm.show({ title: "Delete " + solo.length + " solo round" + (solo.length === 1 ? "" : "s") + "?", message: "Rounds with other real players are kept. This can\u2019t be undone.", confirmLabel: "Delete rounds", danger: true }).then((ok) => { if (ok) runCleanup(solo); });
    }
    function runCleanup(solo) {
      setCleaning(true);
      const ids = solo.map((r) => r.id);
      try { window.ChainsToast && ChainsToast.show("Cleaning up " + ids.length + " round" + (ids.length === 1 ? "" : "s") + "\u2026", "info"); } catch (e) {}
      setRounds((prev) => { if (!prev) return prev; const n = Object.assign({}, prev); ids.forEach((id) => delete n[id]); return n; });
      setCloudActive((prev) => prev ? prev.filter((r) => ids.indexOf(r.id) < 0) : prev);
      Promise.all(ids.map((id) => deleteRound(id))).then((rs) => { const bad = rs.filter((x) => x === false).length; setCleaning(false); if (bad && window.ChainsToast) ChainsToast.show(bad + " round" + (bad === 1 ? " didn\u2019t" : "s didn\u2019t") + " delete \u2014 try again.", "error"); return loadRounds().then(setRounds); });
    }
    function closeFinish() { try { localStorage.removeItem("chains_play_active"); } catch (e) {} setActive(null); setFinishResult(null); setDraft(null); setStage("home"); loadRounds().then(setRounds); }

    if (stage === "course") return <CoursePick draft={draft} rounds={rounds} onPick={onPickedCourse} onBack={() => setStage("home")} mobile={mobile} />;
    if (stage === "browse") return <CoursePick draft={{}} rounds={rounds} onPick={(c) => { setViewCourse(c); setStage("courseview"); }} onBack={() => setStage("home")} mobile={mobile} />;
    if (stage === "courseview" && viewCourse) return (
      <React.Fragment>
        {holeCard ? <HoleCard course={holeCard.course} hole={holeCard.hole} par={(holeCard.course.hole_pars || [])[holeCard.hole] || 3} len={(holeCard.course.hole_lengths || [])[holeCard.hole] || null} onClose={() => setHoleCard(null)} /> : null}
        <CourseView course={viewCourse} rounds={rounds} me={me} mobile={mobile} onBack={() => setStage("browse")} onPlay={(c) => { setDraft({ course: null, group: me ? [{ id: me, name: myDisplayName(me) || "You", color: "#E8590C" }] : [], mode: "holes", holeScores: {}, totals: {} }); onPickedCourse(c); }} onHole={(h) => setHoleCard({ course: viewCourse, hole: h })} />
      </React.Fragment>
    );
    if (stage === "plan" && window.PlanRound) return React.createElement(window.PlanRound, { onBack: () => setStage("home"), mobile: mobile, invites: invites, me: me, onViewInvite: (id) => { setInvDetail(id); setStage("home"); }, onInvitesChanged: loadInvites });
    if (stage === "group") return <GroupPick draft={draft} rounds={rounds} onStart={onPickedGroup} onBack={() => { if (draft && draft.invId) { setInvDetail(draft.invId); setStage("home"); } else setStage("course"); }} mobile={mobile} />;
    if (stage === "discs") return <DiscCountStep draft={draft} mobile={mobile} onBack={() => setStage("group")} onGo={(n) => { setDraft((d) => Object.assign({}, d, { discOut: n })); setStage("score"); }} onSkip={() => { const p = discPref(); const k = (p.skips || 0) + 1; setDiscPref(Object.assign({}, p, { skips: k, off: k >= 2 ? true : !!p.off })); setStage("score"); }} />;
    const goHomeRefresh = () => { try { setActive(JSON.parse(localStorage.getItem("chains_play_active") || "null")); } catch (e) {} setStage("home"); };
    if (stage === "score") return <ScoreBoard draft={draft} rounds={rounds} onDone={onFinished} onBail={goHomeRefresh} mobile={mobile} />;
    if (stage === "total") return <TotalEntry draft={draft} rounds={rounds} onDone={onFinished} onBail={goHomeRefresh} mobile={mobile} />;
    if (stage === "finish" && finishResult) return <FinishCard result={finishResult} rounds={rounds} onClose={closeFinish} mobile={mobile} />;
    if (invDetail && invites && invites[invDetail]) return <InviteDetail inv={Object.assign({ id: invDetail }, invites[invDetail])} me={me} onBack={() => setInvDetail(null)} onRsvp={rsvp} onAdd={addToInvite} onRemove={removeFromInvite} onDelete={(id) => { removeInviteLocal(id); setInvDetail(null); }} onRefresh={loadInvites} onStart={(inv) => { const c = { id: inv.course_id, name: inv.course_name, city: inv.city }; const goingIn = (inv.group || []).filter((g) => inv.rsvp && inv.rsvp[g.id] === "in"); const notOut = (inv.group || []).filter((g) => !inv.rsvp || inv.rsvp[g.id] !== "out"); const grp = goingIn.length ? goingIn : (notOut.length ? notOut : (inv.group || [])); setDraft({ course: c, group: grp, mode: "holes", holeScores: {}, invId: inv.id }); setInvDetail(null); setStage("group"); }} mobile={mobile} />;
    if (showBag && window.BagView) return React.createElement(window.BagView, { onBack: () => setShowBag(false), mobile: mobile });
    if (showWeeklies && window.WeeklyView) return React.createElement(window.WeeklyView, { onExit: () => setShowWeeklies(false) });
    if (showStats) return <MyStats me={me} mobile={mobile} onBack={() => setShowStats(false)} />;
    if (watchId) return <WatchRound id={watchId} me={me} onBack={() => setWatchId(null)} onResume={(rec) => resumeFromCloud(rec, watchId)} onFinish={(rec) => finishFromCloud(rec, watchId)} mobile={mobile} />;
    if (detail) return <RoundDetail r={detail} rounds={rounds} me={me} onBack={() => setDetail(null)} onDelete={(id) => { const r0 = rounds && rounds[id]; const others = ((r0 && r0.group) || []).filter((x) => x && x.id !== me && !x.guest); const fail = () => { try { window.ChainsToast && ChainsToast.show("Couldn\u2019t delete that round \u2014 try again.", "error"); } catch (e) {} }; setDetail(null); const hideMe = () => { try { window.ChainsToast && ChainsToast.show("Removing from your history\u2026", "info"); } catch (e) {} ChainsRounds.hideForMe(id).then(() => { try { window.ChainsToast && ChainsToast.show("Removed from your history \u2014 the other players still see it.", "info"); } catch (e) {} loadRounds().then(setRounds); }); }; const delAll = () => { try { window.ChainsToast && ChainsToast.show("Deleting round\u2026", "info"); } catch (e) {} setRounds((prev) => { if (!prev) return prev; const n = Object.assign({}, prev); delete n[id]; return n; }); deleteRound(id).then((ok) => { if (!ok) fail(); return loadRounds().then(setRounds); }); }; if (others.length && window.ChainsRounds && ChainsRounds.hideForMe) { if (r0.owner && r0.owner !== me) { hideMe(); return; } ChainsConfirm.choose({ title: "Delete shared round?", message: "This round has other players (" + others.map((o) => o.name).join(", ") + ").", options: [{ id: "all", label: "Delete for everyone", variant: "danger" }, { id: "me", label: "Remove from just my history", variant: "secondary" }] }).then((c) => { if (c === "all") delAll(); else if (c === "me") hideMe(); }); return; } delAll(); }} mobile={mobile} />;

    if (stage === "throw") {
      const sec = throwSec;
      const back = () => setThrowSec(null);
      const row = (ic, t, d, fn) => <button key={t} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", textAlign: "left" }}><span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--fairway-100)", color: "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic}</span><span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{t}</span>{d ? <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{d}</span> : null}</span><span style={{ width: 17, height: 17, color: "var(--text-faint)" }}><Icons.ChevRight size={17} /></span></button>;
      const wrap = (title, sub, body) => <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 16 }}><FlowHead title={title} sub={sub} onBack={back} />{body}</div>;
      if (sec === "rounds") return wrap("My rounds", myRounds.length + (myRounds.length === 1 ? " round" : " rounds"), <React.Fragment>
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Recent rounds</span>
            <button onClick={() => setUdisc(true)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: "var(--ace-700)" }}>Import from UDisc</button>
            {myRounds.length > 0 ? <button onClick={() => exportRoundsCSV(rounds, me)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: "var(--text-muted)", marginLeft: 12 }}>Export CSV</button> : null}
          </div>
          {udisc ? <UDiscImport rounds={rounds} me={me} onClose={() => setUdisc(false)} onDone={() => loadRounds().then(setRounds)} /> : null}
          {false && rounds && Object.keys(rounds).length > 1 ? <button onClick={bulkCleanup} disabled={cleaning} style={{ marginBottom: 10, padding: "6px 12px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: cleaning ? "default" : "pointer", opacity: cleaning ? 0.6 : 1, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 10.5, color: "var(--text-muted)" }}>{cleaning ? "Cleaning up\u2026" : "Clean up · delete my solo test rounds"}</button> : null}
          {rounds == null ? (
            <SkeletonRows n={3} />
          ) : myRounds.length === 0 ? (
            <Card pad={22}><div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)" }}>No rounds yet — tap <b>Start scoring now</b> and your first one lands here.</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myRounds.map((r) => <RoundRow key={r.id} r={r} me={me} onOpen={() => setDetail(r)} />)}
            </div>
          )}
        </div>
      </React.Fragment>);
      if (sec === "trophies") return wrap("Trophy case", "Every ladder, with progress to the next tier", <BadgeShelf me={me} mobile={mobile} />);
      if (sec === "rivals") return wrap("Rivalries & aces", "Head to head with your friends", <React.Fragment><Rivalries me={me} mobile={mobile} /><AcesWall me={me} mobile={mobile} /></React.Fragment>);
      if (sec === "crew") return wrap("Friends' rounds", "Rounds your friends played", <React.Fragment>
        {crew && crew.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", marginBottom: 10 }}>Your friends' rounds</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {crew.map((r) => <RoundRow key={r.id} r={r} me={me} onOpen={() => setDetail(r)} />)}
            </div>
          </div>
        )}
      </React.Fragment>);
      if (sec === "territory") return wrap("Titles you hold", "Courses where your name is on something", <React.Fragment>
        <MyTerritory me={me} onOpenCourse={(cid) => { const c = (CATALOG || []).find((x) => x && String(x.id) === String(cid)); if (c) { setViewCourse(c); setStage("courseview"); } }} />
      </React.Fragment>);
      const lifetime = myRounds.filter((r) => !r.practice);
      return (
        <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FlowHead title="Go Throw" sub="Score rounds, keep every stat, earn trophies" onBack={() => setStage("home")} />
          <button onClick={beginRound} className="cw-press" style={{ height: 56, borderRadius: "var(--radius-lg)", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 17, boxShadow: "0 8px 20px -8px var(--ace-500)" }}>Start a round</button>
          <button onClick={() => setStage("plan")} style={{ height: 46, borderRadius: "var(--radius-lg)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 18, height: 18, display: "inline-flex", color: "var(--fairway-700)" }}><Icons.Calendar size={18} /></span>Plan a round and invite friends</button>
        <LiveNow me={me} onWatch={(id) => onResumeId(id)} mobile={mobile} />
        {cloudActive && cloudActive.filter((r) => !(active && active.course && active.cloudId === r.id)).map((r) => {
          const others = Object.keys(r.players || {}).filter((k) => k !== me);
          return (
            <div key={r.id} style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <button onClick={() => resumeFromCloud(r, r.id)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--fairway-500)", background: "var(--fairway-50)", cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 18, height: 18, color: "var(--fairway-700)", flexShrink: 0 }}><Icons.Refresh size={18} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--fairway-800)" }}>Round in progress</span>
                  <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--fairway-700)" }}>{(r.course && r.course.name) || r.course_name || "Your round"} · keep scoring</span>
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 12, color: "var(--fairway-700)" }}>Resume →</span>
              </button>
              <button onClick={() => discardOpenRound(r.id, others)} title="Discard" aria-label="Discard in-progress round" style={{ width: 46, flexShrink: 0, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--clay-600, #b4452f)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.X size={18} /></button>
            </div>
          );
        })}
        {active && active.course && (
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            {active.cloudId ? <button onClick={() => shareWatch(active.cloudId)} title="Share a live watch link" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0, fontSize: 17, lineHeight: 1 }}>⤴</button> : null}
            <button onClick={resumeRound} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--fairway-500)", background: "var(--fairway-50)", cursor: "pointer", textAlign: "left" }}>
              <span style={{ width: 18, height: 18, color: "var(--fairway-700)", flexShrink: 0 }}><Icons.Refresh size={18} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--fairway-800)" }}>Resume round in progress</span>
                <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fairway-700)" }}>{active.course.name} · pick up where you left off</span>
              </span>
            </button>
            <button onClick={() => { const grp = active.group || []; const others = grp.filter((x) => x && x.id !== me && !x.guest); discardOpenRound(active.cloudId, others); }} title="Discard" aria-label="Discard in-progress round"
              style={{ width: 46, flexShrink: 0, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--clay-600, #b4452f)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.X size={18} /></button>
          </div>
        )}
        {myInvites.length > 0 && (
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Upcoming rounds</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>Rounds you've planned or been invited to — tap one to RSVP, manage players, or start it.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myInvites.map((v) => {
                const mine = me && v.rsvp && v.rsvp[me];
                const inCount = v.rsvp ? Object.values(v.rsvp).filter((x) => x === "in").length : 0;
                const isOrg = v.organizer === me;
                const t12 = (function (t) { if (!t) return ""; const p = t.split(":").map(Number); const ap = p[0] >= 12 ? "PM" : "AM"; return (p[0] % 12 || 12) + ":" + String(p[1]).padStart(2, "0") + " " + ap; })(v.time);
                const dt = new Date(v.date + "T00:00:00");
                const dstr = isNaN(dt) ? v.date : dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                const inProgress = active && active.invId === v.id;
                return (
                  <Card key={v.id} pad={0}>
                    <button onClick={() => inProgress ? resumeRound() : setInvDetail(v.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: "none", background: inProgress ? "var(--fairway-50)" : "transparent", cursor: "pointer", padding: "13px 14px" }}>
                      <span style={{ width: 38, height: 38, borderRadius: "var(--radius-md)", background: inProgress ? "var(--fairway-100, #dff0e6)" : "var(--ace-50, #fff3ec)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: inProgress ? "var(--fairway-700)" : "var(--ace-600)", flexShrink: 0 }}>{inProgress ? <Icons.Disc size={18} /> : <Icons.Calendar size={18} />}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.course_name}</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{dstr} · {t12}{v.city ? " · " + v.city : ""}</div>
                        {inProgress
                          ? <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4 }}><span className="cw-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--live-500, #e0483d)" }} /><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--fairway-700)" }}>Round in progress · tap to resume</span></div>
                          : <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--fairway-700)", marginTop: 3 }}>{inCount} in{isOrg ? " · you organized" : (mine === "in" ? " · you're in" : mine === "out" ? " · you're out" : " · tap to RSVP")}</div>}
                      </div>
                      <span style={{ width: 16, height: 16, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={16} /></span>
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        {lifetime.length > 0 && (() => {
          const st = lifetimeStats(myRounds.filter((r) => !r.practice), me); // v487: practice rounds stay in history, out of stats
          const cell = (label, val, color) => (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 21, color: color || "var(--text-strong)" }}>{val}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)", marginTop: 2 }}>{label}</div>
            </div>
          );
          const chip = (label, n, color) => (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", borderRadius: "var(--radius-sm)", background: "var(--bg-sunken)" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: "var(--text-strong)" }}>{n}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)" }}>{label}</span>
            </div>
          );
          return (
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Your game</div>
              <Card pad={0}>
                {(() => {
                  const pr = playerRatingFor(myRounds, me);
                  if (!pr) return null;
                  const tier = window.ChainsRating.tier(pr.rating);
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", background: "linear-gradient(100deg, var(--pine-700) 0%, var(--bg-ink-deep, #16221d) 100%)" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 30, color: "var(--bone-50)", lineHeight: 1 }}>{pr.rating}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--ace-400)", marginTop: 3 }}>Chains rating</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "inline-block", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, color: "var(--bone-50)", background: "rgba(255,255,255,.12)", borderRadius: "var(--radius-pill)", padding: "3px 11px" }}>{tier}</span>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--chain-300)", marginTop: 5 }}>Chains estimate · best {pr.counted} of last {Math.min(pr.n, 20)} {pr.n === 1 ? "round" : "rounds"} · not an official PDGA number</div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", padding: "13px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
                  {cell("Rounds", st.rounds)}
                  {cell("Best", st.best == null ? "—" : fmtPar(st.best), st.best != null && st.best < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)")}
                  {cell("Avg", st.avg == null ? "—" : (st.avg > 0 ? "+" : "") + (Math.round(st.avg * 10) / 10), st.avg != null && st.avg < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)")}
                </div>
                <div style={{ display: "flex", gap: 6, padding: "11px 12px" }}>
                  {st.eagle > 0 && chip("Eagle+", st.eagle, "var(--ace-500, #2a6fdb)")}
                  {chip("Birdie", st.birdie, "var(--score-under, #1a7a50)")}
                  {chip("Par", st.par, "var(--text-faint)")}
                  {chip("Bogey", st.bogey, "var(--score-over, #c23a33)")}
                  {st.dbl > 0 && chip("Dbl+", st.dbl, "var(--clay-700, #8f2f1f)")}
                </div>
              </Card>
            </div>
          );
        })()}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {row(<Icons.List size={20} />, "My rounds", myRounds.length ? myRounds.length + (myRounds.length === 1 ? " round" : " rounds") + " · import from UDisc · export" : "No rounds yet", () => setThrowSec("rounds"))}
            {row(<Icons.TrendUp size={20} />, "My stats", "Averages, best rounds, trends", () => setShowStats(true))}
            {row(<Icons.Trophy size={20} />, "Trophy case", "Every ladder and what's next", () => setThrowSec("trophies"))}
            {row(<Icons.Flag size={20} />, "Titles you hold", "Holes and records with your name on them", () => setThrowSec("territory"))}
            {row(<Icons.Users size={20} />, "Rivalries & aces", "Head to head · the ace wall", () => setThrowSec("rivals"))}
            {crew && crew.length > 0 ? row(<Icons.Disc size={20} />, "Friends' rounds", crew.length + " recent", () => setThrowSec("crew")) : null}
          </div>
        </div>
      );
    }
    if (stage === "me") return <MeView me={me} rounds={rounds} mobile={mobile} onBack={() => setStage("home")} onStats={() => setShowStats(true)} onBag={() => setShowBag(true)} onTitles={() => { setThrowSec("territory"); setStage("throw"); }} />;

    // HOME
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthRounds = myRounds.filter((r) => String(r.date || r.created_at || "").slice(0, 7) === monthKey);
    const monthStats = (() => { let holes = 0, birdies = 0, throwsN = 0; monthRounds.forEach((r) => { const hs = r.hole_scores && me && r.hole_scores[me] != null ? toArr(r.hole_scores[me]) : null; const ps = r.pars != null ? toArr(r.pars) : null; if (!hs) return; hs.forEach((v, i) => { if (v == null) return; holes++; throwsN += v; if (ps && ps[i] != null && v < ps[i]) birdies++; }); }); return { rounds: monthRounds.length, holes, birdies, throwsN }; })();
    const monthName = new Date().toLocaleDateString(undefined, { month: "long" });
    const firstName = (myDisplayName(me) || "").split(" ")[0];
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* v488 greeting + this month */}
        <div style={{ padding: "4px 2px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: mobile ? 26 : 30, lineHeight: 1, color: "var(--text-strong)" }}>{firstName ? "Happy discing, " + firstName + "!" : "Happy discing!"}{me ? <BadgeChip uid={me} size={30} /> : null}</div>
          {(() => { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const mm = me && window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(me) : null; if (!u) return null; return <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}><Avatar name={myDisplayName(me) || "You"} color={(mm && mm.disc) || "#E8590C"} size={22} />Signed in as <b style={{ color: "var(--text-strong)" }}>{myDisplayName(me)}</b>{u.username ? " · @" + u.username : ""}<button onClick={() => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "settings" })); } catch (e) {} }} style={{ marginLeft: "auto", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: "var(--ace-700)" }}>Account</button></div>; } catch (e) { return null; } })()}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Your progress in {monthName}</span>
            {myRounds.length > 0 && <button onClick={() => setShowStats(true)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ace-700)" }}>Show all</button>}
          </div>
          <div style={{ display: "flex", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "14px 6px" }}>
            {[["Rounds", monthStats.rounds, <Icons.Disc size={14} />], ["Holes", monthStats.holes, <Icons.Target size={14} />], ["Birdies", monthStats.birdies, <Icons.Flag size={14} />], ["Throws", monthStats.throwsN, <Icons.TrendUp size={14} />]].map(([l, v, ic]) => (
              <div key={l} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)", lineHeight: 1, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ color: "var(--fairway-600)", display: "inline-flex" }}>{ic}</span>{v}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <HomeEverything onThrow={() => setStage("throw")} onStats={() => setShowStats(true)} onBag={() => setShowBag(true)} onCourses={() => setStage("browse")} onMe={() => setStage("me")} />
        <ChaseCard rounds={rounds} me={me} onChallenges={() => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "takeover" })); } catch (e) {} }} onCourse={(c) => { setViewCourse(c); setStage("courseview"); }} />
        <LastRound r={myRounds[0] || null} me={me} onOpen={() => myRounds[0] && setDetail(myRounds[0])} />
        <RecentTrophies me={me} onStats={() => setShowStats(true)} />
        <WeeklyChallenges rounds={rounds} me={me} />
        <WhatsNew />
        <ActivityFeed me={me} onOpenRound={(r) => setDetail(r)} />
        <div style={{ textAlign: "center", padding: "4px 0 8px" }}><button onClick={() => setStage("throw")} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--fairway-700)" }}>All rounds, stats & trophies →</button></div>
      </div>
    );
  }

  // Skeleton placeholders while rounds load (no blank flash).
  function SkeletonRows({ n }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: n || 3 }, (_, i) => (
          <Card key={i} pad={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
              <span className="cw-shimmer" style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span className="cw-shimmer" style={{ display: "block", width: "55%", height: 12, borderRadius: 4, background: "var(--bg-sunken)" }} />
                <span className="cw-shimmer" style={{ display: "block", width: "32%", height: 9, borderRadius: 4, background: "var(--bg-sunken)", marginTop: 7 }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  function myDisplayName(me) {
    try { const mm = me && window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(me) : null; if (mm && mm.name) return mm.name; } catch (e) {}
    try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const lp = u && ChainsAuth.localProfile && ChainsAuth.localProfile(u.uid); if (lp && (lp.displayName || lp.name)) return lp.displayName || lp.name; if (u && u.username) return u.username; } catch (e) {}
    return me ? me.charAt(0).toUpperCase() + me.slice(1) : "";
  }
  // v489: the badge a player chose to show off (own = localStorage, friends = public usernames index)
  function featuredOf(uid) { try { return window.ChainsFriends && ChainsFriends.featuredBadge ? ChainsFriends.featuredBadge(uid) : null; } catch (e) { return null; } }
  function BadgeChip({ uid, size }) {
    const [, bump] = React.useState(0);
    React.useEffect(() => { const on = () => bump((n) => n + 1); window.addEventListener("chains:friends", on); return () => window.removeEventListener("chains:friends", on); }, []);
    const b = featuredOf(uid); if (!b) return null;
    const sz = size || 20;
    return <span title={b.name + (b.tier ? " · " + b.tier : "")} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: sz, height: sz, borderRadius: "50%", fontSize: sz * .55, background: "var(--bg-elevated)", boxShadow: "0 0 0 2px " + (b.color || "var(--fairway-600)"), marginLeft: 6, verticalAlign: "middle", flexShrink: 0, color: "#fff" }}><BadgeIcon b={b} size={Math.round(sz * .6)} /></span>;
  }
  window.BadgeChip = BadgeChip;
  // "with Kyle, Gabriel, and 1 other"
  function withLine(group, me) {
    const others = (group || []).filter((g) => g && g.id !== me).map((g) => String(g.name || "").split(" ")[0]).filter(Boolean);
    if (!others.length) return "";
    if (others.length <= 2) return "with " + others.join(" and ");
    return "with " + others.slice(0, 2).join(", ") + ", and " + (others.length - 2) + " other" + (others.length - 2 === 1 ? "" : "s");
  }
  function RoundRow({ r, me, onOpen }) {
    /* v488 feed card: who you played with, score as "+1 (55)", when, verified chip.
       v490: for a friend's round (crew feed) the card is told from the owner's side. */
    const onIt = !!(me && Array.isArray(r.group) && r.group.some((g) => g && g.id === me));
    const who = onIt ? me : (r.logged_by || (r.group && r.group[0] && r.group[0].id) || me);
    const whoName = who === me ? (myDisplayName(me) || "You") : (((r.group || []).find((g) => g && g.id === who) || {}).name || String(who).charAt(0).toUpperCase() + String(who).slice(1));
    const mine = r.scores && who && r.scores[who] != null ? r.scores[who] : null;
    const hs = r.hole_scores && who && r.hole_scores[who] != null ? toArr(r.hole_scores[who]) : null;
    const strokes = hs ? strokesOf(hs) : null;
    const when = r.date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : "");
    const ago = r.created_at ? relDays(r.created_at) : when;
    const grp = r.group || [];
    const verified = r.verified && Object.keys(r.verified).length > 0;
    const winner = (() => { if (grp.length < 2 || !r.scores) return null; let best = null; grp.forEach((g) => { const v = r.scores[g.id]; if (v != null && (best == null || v < best.v)) best = { g, v }; }); return best; })();
    return (
      <button onClick={onOpen} className="cw-press" style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 16px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", background: "var(--bg-elevated)", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", flexShrink: 0 }}>
            {grp.slice(0, 3).map((g, i) => <span key={g.id} style={{ marginLeft: i ? -10 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--bg-elevated)" }}><Avatar name={g.name} color={g.color || "#9CA3AF"} size={32} /></span>)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{whoName}{who !== me ? <BadgeChip uid={who} size={16} /> : null}{grp.length > 1 ? <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> {withLine(grp, who)}</span> : null}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 1 }}>{ago}{r.practice ? " · practice" : ""}{verified ? " · ✓ verified" : ""}</div>
          </div>
          <span style={{ color: "var(--text-faint)", display: "inline-flex" }}><Icons.ChevRight size={18} /></span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 17, lineHeight: 1.1, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.course_name || "Round"}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{[r.city, r.pars ? (function () { const n = toArr(r.pars).length; const hs = me && r.hole_scores && r.hole_scores[me] ? toArr(r.hole_scores[me]).filter((x) => x != null).length : n; return hs && hs < n ? hs + " of " + n + " holes" : n + " holes"; })() : null, r.par_total ? "par " + r.par_total : null].filter(Boolean).join(" · ")}{winner && winner.g.id !== who ? " · " + String(winner.g.name).split(" ")[0] + " won" : winner && grp.length > 1 ? (who === me ? " · you won" : " · won") : ""}</div>
          </div>
          {mine != null && <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, lineHeight: 1, color: parColor(mine), flexShrink: 0 }}>{fmtPar(mine)}{strokes ? <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}> ({strokes})</span> : null}</div>}
        </div>
      </button>
    );
  }

  /* =============================== MY STATS ============================= */
  // Self-contained data fetch (own rounds only, ChainsRounds.loadMine()) — same
  // sibling pattern as Rivalries/AcesWall/BadgeShelf. Excludes open + practice
  // rounds so streaks/averages only ever count real, finished rounds.
  // v527 — the rest of the stats page: rating trend, scoring mix, months, home-course numbers.
  function statsExtra(myRounds, me) {
    const full = (myRounds || []).filter((r) => r && r.scores && me != null && r.scores[me] != null)
      .map((r) => ({ r, tp: r.scores[me], date: r.date || (r.created_at || "").slice(0, 10) }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.r.created_at || "").localeCompare(String(b.r.created_at || "")));
    // rating per rated round (full rounds only)
    const rated = [];
    full.forEach((x) => {
      const r = x.r; if (!r.hole_scores || r.hole_scores[me] == null || !r.pars) return;
      const hs = toArr(r.hole_scores[me]), pars = toArr(r.pars);
      if (hs.length < pars.length || hs.some((v) => v == null)) return;
      const rr = ratingFor(hs, pars, { id: r.course_id, course_id: r.course_id });
      if (rr && rr.rating) rated.push({ rating: rr.rating, date: x.date, tp: x.tp, course: r.course_name });
    });
    const last10 = rated.slice(-10);
    const prev = rated.length > 5 ? rated.slice(-10, -5) : [];
    const cur5 = rated.slice(-5);
    const mean = (a) => a.length ? a.reduce((t, v) => t + v.rating, 0) / a.length : null;
    const trend = prev.length && cur5.length ? Math.round(mean(cur5) - mean(prev)) : null;
    // scoring mix over every scored hole
    let holes = 0, under = 0, par = 0, bogey = 0, worse = 0;
    (myRounds || []).forEach((r) => {
      if (!r || !r.hole_scores || r.hole_scores[me] == null || !r.pars) return;
      const hs = toArr(r.hole_scores[me]), pars = toArr(r.pars);
      hs.forEach((v, i) => { if (v == null || pars[i] == null) return; holes++; const d = v - pars[i]; if (d < 0) under++; else if (d === 0) par++; else if (d === 1) bogey++; else worse++; });
    });
    const mix = holes ? { holes, under: under / holes, par: par / holes, bogey: bogey / holes, worse: worse / holes, birdiesPerRound: full.length ? under / full.length : 0 } : null;
    // last six months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      const rs = full.filter((x) => String(x.date).slice(0, 7) === key);
      months.push({ key, label: d.toLocaleString("en-US", { month: "short" }), n: rs.length, avg: rs.length ? rs.reduce((t, x) => t + x.tp, 0) / rs.length : null });
    }
    const maxM = Math.max(1, ...months.map((m) => m.n));
    // home course
    const homeId = window.ChainsHome && ChainsHome.get ? ChainsHome.get() : null;
    const homeRs = homeId != null ? full.filter((x) => String(x.r.course_id) === String(homeId)) : [];
    const home = homeRs.length ? { name: homeRs[homeRs.length - 1].r.course_name, rounds: homeRs.length, best: Math.min(...homeRs.map((x) => x.tp)), avg: homeRs.reduce((t, x) => t + x.tp, 0) / homeRs.length, last5: homeRs.slice(-5).reduce((t, x) => t + x.tp, 0) / Math.min(5, homeRs.length) } : null;
    const courseCount = new Set(full.map((x) => x.r.course_id != null ? String(x.r.course_id) : x.r.course_name)).size;
    return { rated, last10, trend, mix, months, maxM, home, courseCount, thisYear: full.filter((x) => String(x.date).slice(0, 4) === String(now.getFullYear())).length };
  }
  function MyStats({ me, mobile, onBack }) {
    const [rounds, setRounds] = React.useState(undefined);
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.loadMine) { setRounds([]); return; }
      let alive = true;
      window.ChainsRounds.loadMine().then((arr) => {
        if (!alive) return;
        setRounds((arr || []).map(normalizeRound).filter((r) => r && r.status !== "open" && !r.practice));
      }).catch(() => { if (alive) setRounds([]); });
      return () => { alive = false; };
    }, []);
    const st = React.useMemo(() => (rounds ? myStatsFull(rounds, me) : null), [rounds, me]);
    const ex = React.useMemo(() => (rounds ? statsExtra(rounds, me) : null), [rounds, me]);
    const pr = React.useMemo(() => (rounds ? playerRatingFor(rounds, me) : null), [rounds, me]);
    const label = { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 };
    const mono = (sz, col) => ({ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: sz, color: col || "var(--text-strong)", lineHeight: 1 });
    const cap = { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 4 };
    const green = "var(--score-under, #1a7a50)", red = "var(--score-over, #c23a33)";
    const row = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderTop: "1px solid var(--border-subtle)" };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "transparent", cursor: "pointer", padding: "4px 0", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12.5, color: "var(--text-muted)", alignSelf: "flex-start" }}>← Back</button>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: mobile ? 26 : 32, color: "var(--text-strong)" }}>My Stats</div>
        {rounds === undefined ? <SkeletonRows n={3} /> : !st || st.rounds === 0 ? (
          <Card pad={22}><div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No scored rounds yet — log a round to start building your stats.</div></Card>
        ) : (
          <React.Fragment>
            {ex && ex.rated.length > 0 && (
              <div>
                <div style={label}>Rating</div>
                <Card pad={0}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "linear-gradient(100deg, var(--pine-700) 0%, var(--bg-ink-deep, #16221d) 100%)" }}>
                    <div>
                      <div style={mono(34, "var(--bone-50)")}>{pr ? pr.rating : ex.rated[ex.rated.length - 1].rating}</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--bone-200, #d9d4c7)", marginTop: 5 }}>{pr ? window.ChainsRating.tier(pr.rating) : ""}{pr ? " · best " + pr.counted + " of your last " + Math.min(20, pr.n) : ""}</div>
                      {ex.trend != null && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: ex.trend >= 0 ? "#8fd3a9" : "#f0a39b", marginTop: 3 }}>{(ex.trend >= 0 ? "+" : "") + ex.trend + " vs your previous five rounds"}</div>}
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end", gap: 3, height: 44 }}>
                      {(() => { const vals = ex.last10.map((x) => x.rating); const lo = Math.min(...vals) - 20, hi = Math.max(...vals) + 20; return ex.last10.map((x, i) => <span key={i} title={x.rating + " · " + x.date} style={{ width: 9, height: Math.max(4, Math.round(44 * (x.rating - lo) / (hi - lo))) + "px", borderRadius: 2, background: i === ex.last10.length - 1 ? "var(--ace-500)" : "rgba(255,255,255,.35)" }} />); })()}
                    </div>
                  </div>
                  <div style={{ padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Last {ex.last10.length} rated rounds, oldest to newest. Only full rounds count.</div>
                </Card>
              </div>
            )}
            {ex && ex.mix && (
              <div>
                <div style={label}>How you score a hole</div>
                <Card pad={0}>
                  <div style={{ padding: "14px 14px 10px" }}>
                    <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "var(--bg-sunken)" }}>
                      {[[ex.mix.under, green], [ex.mix.par, "var(--fairway-500)"], [ex.mix.bogey, "#e0b25a"], [ex.mix.worse, red]].map(([v, c], i) => <span key={i} style={{ width: (v * 100) + "%", background: c }} />)}
                    </div>
                    <div style={{ display: "flex", marginTop: 10 }}>
                      {[["Birdie or better", ex.mix.under, green], ["Par", ex.mix.par, "var(--fairway-700)"], ["Bogey", ex.mix.bogey, "#b8862e"], ["Double or worse", ex.mix.worse, red]].map(([l, v, c]) => <div key={l} style={{ flex: 1, textAlign: "center" }}><div style={mono(18, c)}>{Math.round(v * 100)}%</div><div style={Object.assign({}, cap, { fontSize: 10.5 })}>{l}</div></div>)}
                    </div>
                  </div>
                  <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{ex.mix.holes} holes scored · {Math.round(ex.mix.birdiesPerRound * 10) / 10} birdies a round</div>
                </Card>
              </div>
            )}
            {ex && (
              <div>
                <div style={label}>Last six months</div>
                <Card pad={0}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "14px 14px 6px", height: 110 }}>
                    {ex.months.map((m, i) => <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: m.n ? "var(--text-strong)" : "var(--text-faint)", marginBottom: 3 }}>{m.n || ""}</div>
                      <div style={{ width: "70%", height: Math.max(3, Math.round(56 * m.n / ex.maxM)) + "px", borderRadius: 4, background: i === ex.months.length - 1 ? "var(--ace-500)" : m.n ? "var(--fairway-500)" : "var(--bg-sunken)" }} />
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>{m.label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: m.avg == null ? "transparent" : m.avg < 0 ? green : "var(--text-faint)" }}>{m.avg == null ? "-" : fmtPar(Math.round(m.avg))}</div>
                    </div>)}
                  </div>
                  <div style={{ padding: "6px 14px 9px", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Rounds a month, with your average to par under each. {ex.thisYear} rounds this year on {ex.courseCount} course{ex.courseCount === 1 ? "" : "s"}.</div>
                </Card>
              </div>
            )}
            {ex && ex.home && (
              <div>
                <div style={label}>Home course</div>
                <Card pad={0}>
                  <div style={{ padding: "12px 14px 4px", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)" }}>{ex.home.name}</div>
                  <div style={{ display: "flex", padding: "8px 10px 14px" }}>
                    {[[ex.home.rounds, "rounds"], [fmtPar(ex.home.best), "best", ex.home.best < 0 ? green : null], [fmtPar(Math.round(ex.home.avg * 10) / 10), "average", ex.home.avg < 0 ? green : null], [fmtPar(Math.round(ex.home.last5 * 10) / 10), "last five", ex.home.last5 < ex.home.avg ? green : null]].map(([v, l, c]) => <div key={l} style={{ flex: 1, textAlign: "center" }}><div style={mono(20, c)}>{v}</div><div style={cap}>{l}</div></div>)}
                  </div>
                </Card>
              </div>
            )}
            <div>
              <div style={label}>Career</div>
              <Card pad={0}>
                <div style={{ display: "flex", padding: "14px 10px" }}>
                  <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)" }}>{st.rounds}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)", marginTop: 2 }}>Rounds</div></div>
                  <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: st.avg != null && st.avg < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{st.avg == null ? "—" : fmtPar(Math.round(st.avg * 10) / 10)}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)", marginTop: 2 }}>Avg to par</div></div>
                  <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: st.best != null && st.best < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{st.best == null ? "—" : fmtPar(st.best)}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)", marginTop: 2 }}>Best round</div></div>
                </div>
                {st.bestRound && <div style={{ padding: "0 14px 13px", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>{st.bestRound.course}{st.bestRound.date ? " · " + st.bestRound.date : ""}</div>}
              </Card>
            </div>
            <div>
              <div style={label}>Streaks · sub-par rounds</div>
              <Card pad={0}>
                <div style={{ display: "flex", padding: "14px 10px" }}>
                  <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: st.curStreak > 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{st.curStreak}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)", marginTop: 2 }}>Current</div></div>
                  <div style={{ flex: 1, textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: "var(--text-strong)" }}>{st.bestStreak}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)", marginTop: 2 }}>Best ever</div></div>
                </div>
              </Card>
            </div>
            {st.courses.length > 0 && (
              <div>
                <div style={label}>By course</div>
                <Card pad={0}>
                  {st.courses.map((c, i) => (
                    <div key={i} style={i === 0 ? { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" } : Object.assign({}, row, { padding: "12px 14px" })}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>{c.rounds} round{c.rounds === 1 ? "" : "s"}{c.lastDate ? " · last " + c.lastDate : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                        <div style={{ textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: c.avg < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{fmtPar(Math.round(c.avg * 10) / 10)}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--text-faint)" }}>avg</div></div>
                        <div style={{ textAlign: "center" }}><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: c.best < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{fmtPar(c.best)}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: "var(--text-faint)" }}>best</div></div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {(st.worstHoles.length > 0 || st.bestHoles.length > 0) && (
              <div>
                <div style={label}>Hot &amp; cold holes</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginBottom: 10 }}>Min. 2 rounds played on a hole to qualify.</div>
                <div style={{ display: "flex", gap: 10, flexDirection: mobile ? "column" : "row" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--score-over, #c23a33)", marginBottom: 6 }}>Toughest</div>
                    <Card pad={0}>
                      {st.worstHoles.map((h, i) => (
                        <div key={i} style={i === 0 ? { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px" } : row}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.course} · Hole {h.hole}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--score-over, #c23a33)", flexShrink: 0, marginLeft: 8 }}>{fmtPar(Math.round(h.avg * 10) / 10)}</span>
                        </div>
                      ))}
                    </Card>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--score-under, #1a7a50)", marginBottom: 6 }}>Best</div>
                    <Card pad={0}>
                      {st.bestHoles.map((h, i) => (
                        <div key={i} style={i === 0 ? { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px" } : row}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.course} · Hole {h.hole}</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--score-under, #1a7a50)", flexShrink: 0, marginLeft: 8 }}>{fmtPar(Math.round(h.avg * 10) / 10)}</span>
                        </div>
                      ))}
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    );
  }

  /* ============================ ROUND DETAIL =========================== */
  function RoundDetail({ r, rounds, me, onBack, onDelete, mobile }) {
    const group = r.group || [];
    const ranked = group.map((g) => ({ g, tp: r.scores ? r.scores[g.id] : null })).filter((x) => x.tp != null).sort((a, b) => a.tp - b.tp);
    const hs = r.hole_scores ? Object.keys(r.hole_scores).reduce((m, k) => { m[k] = r.hole_scores[k] != null ? toArr(r.hole_scores[k]) : null; return m; }, {}) : null;
    const pars = r.pars != null ? toArr(r.pars) : null;
    const lens = r.lens != null ? toArr(r.lens) : null;
    const N = hs ? Math.max.apply(null, group.map((g) => (hs[g.id] || []).length).concat([0])) : 0;
    const [editing, setEditing] = React.useState(false);
    const [overrides, setOverrides] = React.useState({});
    const [sel, setSel] = React.useState(null);
    const [practice, setPracticeLocal] = React.useState(!!r.practice);
    const [showHist, setShowHist] = React.useState(false);
    const isOwner = ownsRound(r, me);
    function canEditRow(gid) { return !!me && (isOwner || gid === me); }
    function cellVal(gid, i) { const k = gid + "-" + i; if (overrides[k] !== undefined) return overrides[k]; return (hs && hs[gid]) ? hs[gid][i] : null; }
    function bump(delta) {
      if (!sel) return;
      const cur = cellVal(sel.gid, sel.i); const nv = Math.max(1, (cur != null ? cur : (pars ? pars[sel.i] : 3)) + delta);
      setOverrides((o) => Object.assign({}, o, { [sel.gid + "-" + sel.i]: nv }));
      if (window.ChainsRounds && ChainsRounds.editFinalScore) ChainsRounds.editFinalScore(r.id, sel.gid, sel.i, nv, pars);
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)", flexShrink: 0 }}><Icons.ChevLeft size={20} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, lineHeight: 1.05, color: "var(--text-strong)" }}>{r.course_name || "Round"}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>{[r.date, r.city, (r.group && r.group.length > 1) ? withLine(r.group, me) : null].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        {r.scores && me && r.scores[me] != null && <ScoreHero tone="dark" tp={r.scores[me]} strokes={hs && hs[me] ? strokesOf(hs[me]) : null} rating={(() => { const rr = hs && hs[me] ? ratingFor(hs[me], pars, { id: r.course_id != null ? r.course_id : (r.course && r.course.id) }) : null; return rr ? rr.rating : null; })()} facts={[hs && hs[me] ? <span key="m">{holeMix(hs[me], pars).under} birdies · {holeMix(hs[me], pars).pct}%</span> : null, r.weather && r.weather.tempF != null ? <span key="w">{Math.round(r.weather.tempF)}°{r.weather.desc ? " · " + r.weather.desc : ""}</span> : null, r.verified && Object.keys(r.verified).length ? <span key="v">✓ Signed by {Object.keys(r.verified).map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(", ")}</span> : null].filter(Boolean)} />}
        <PlayerOverview players={group.map((g) => ({ id: g.id, name: g.name, color: g.color, hs: hs ? hs[g.id] : null, tp: r.scores ? r.scores[g.id] : null }))} pars={pars} me={me} title={group.length > 1 ? "Player overview" : null} />
        {hs && N > 0 && (
          <Card pad={0}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>Scorecard</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 540 }}>
                <thead>
                  <tr style={{ background: "var(--bg-ink)" }}>
                    <th style={{ position: "sticky", left: 0, background: "var(--bg-ink)", textAlign: "left", padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 9, color: "var(--chain-400)" }}>Hole</th>
                    {Array.from({ length: N }, (_, i) => <th key={i} style={{ padding: "7px 3px", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--bone-50)", minWidth: 20 }}>{i + 1}</th>)}
                    <th style={{ padding: "7px 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 9, color: "var(--ace-400)" }}>Tot</th>
                    <th style={{ padding: "7px 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 9, color: "var(--ace-400)" }}>+/−</th>
                  </tr>
                  {pars && (
                    <tr style={{ background: "var(--bg-sunken)" }}>
                      <td style={{ position: "sticky", left: 0, background: "var(--bg-sunken)", padding: "5px 10px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 9, color: "var(--text-muted)", borderRight: "1px solid var(--border-subtle)" }}>Par</td>
                      {Array.from({ length: N }, (_, i) => <td key={i} style={{ textAlign: "center", padding: "5px 2px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{pars[i] != null ? pars[i] : "—"}</td>)}
                      <td style={{ textAlign: "center", padding: "5px 8px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: "var(--text-muted)" }}>{pars.slice(0, N).reduce((a, b) => a + (b || 0), 0)}</td>
                      <td />
                    </tr>
                  )}
                  {lens && lens.some((x) => x) && (
                    <tr style={{ background: "var(--bg-sunken)" }}>
                      <td style={{ position: "sticky", left: 0, background: "var(--bg-sunken)", padding: "5px 10px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 9, color: "var(--text-faint)", borderRight: "1px solid var(--border-subtle)" }}>Feet</td>
                      {Array.from({ length: N }, (_, i) => <td key={i} style={{ textAlign: "center", padding: "5px 2px", fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-faint)" }}>{lens[i] || "—"}</td>)}
                      <td colSpan={2} />
                    </tr>
                  )}
                </thead>
                <tbody>
                  {group.map((g) => {
                    let totStrokes = 0, tpSum = 0, tpAny = false;
                    for (let i = 0; i < N; i++) { const s = cellVal(g.id, i); if (s != null) { totStrokes += s; if (pars) { tpSum += s - (pars[i] != null ? pars[i] : 3); tpAny = true; } } }
                    const tp = tpAny ? tpSum : (r.scores ? r.scores[g.id] : null);
                    const editableRow = editing && canEditRow(g.id);
                    return (
                      <tr key={g.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", padding: "6px 10px", borderRight: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--text-strong)", whiteSpace: "nowrap" }}>{g.name}</td>
                        {Array.from({ length: N }, (_, i) => { const s = cellVal(g.id, i), p = pars ? pars[i] : null; const d = (s != null && p != null) ? s - p : null; const bg = d == null ? "transparent" : d <= -2 ? "var(--ace-500)" : d === -1 ? "var(--fairway-500)" : d === 0 ? "transparent" : d === 1 ? "var(--clay-500, #c96a4f)" : "var(--clay-700, #8f3320)"; const fg = (d == null || d === 0) ? "var(--text-strong)" : "#fff"; const isSel = editableRow && sel && sel.gid === g.id && sel.i === i; return <td key={i} onClick={editableRow ? () => setSel({ gid: g.id, i: i }) : undefined} style={{ textAlign: "center", padding: "5px 2px", cursor: editableRow ? "pointer" : "default", outline: isSel ? "2px solid var(--ace-500)" : "none" }}>{s == null ? <span style={{ color: "var(--border-default)" }}>·</span> : <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: d === 0 || d == null ? 0 : "50%", background: bg, color: fg, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11 }}>{s}</span>}</td>; })}
                        <td style={{ textAlign: "center", padding: "6px 8px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)" }}>{totStrokes || "—"}</td>
                        <td style={{ textAlign: "center", padding: "6px 8px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: parColor(tp) }}>{fmtPar(tp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "8px 14px", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>Tot = total strokes · +/− = score to par</div>
          </Card>
        )}
        {editing && sel && (
          <Card pad={14}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)" }}>{(group.find((g) => g.id === sel.gid) || {}).name} — Hole {sel.i + 1}</span>
              <button onClick={() => setSel(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-faint)", fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <button onClick={() => bump(-1)} className="cw-press" style={stepBtn}>−</button>
              <span style={{ minWidth: 50, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, color: "var(--text-strong)" }}>{cellVal(sel.gid, sel.i)}</span>
              <button onClick={() => bump(1)} className="cw-press" style={stepBtn}>+</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>Saved with your name + time in the edit history below.</div>
          </Card>
        )}
        {r.editHistory && Object.keys(r.editHistory).length > 0 && (
          <Card pad={0}>
            <button onClick={() => setShowHist((v) => !v)} style={{ width: "100%", textAlign: "left", padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>{showHist ? "Hide" : "Show"} edit history ({Object.keys(r.editHistory).length})</button>
            {showHist && Object.values(r.editHistory).sort((a, b) => b.at - a.at).map((e, i) => (
              <div key={i} style={{ padding: "8px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>
                <b style={{ color: "var(--text-strong)" }}>{(window.ChainsEngine && ChainsEngine.member(e.by) || {}).name || e.by}</b> changed hole {e.hole} from {e.from == null ? "—" : e.from} to <b style={{ color: "var(--text-strong)" }}>{e.to}</b> · {relDays(new Date(e.at).toISOString())}
              </div>
            ))}
          </Card>
        )}
        {(r.notes && (r.notes.round || (r.notes.holes && Object.keys(r.notes.holes).length))) ? (
          <Card pad={14}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>Notes</div>
            {r.notes.round && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", marginBottom: 6 }}>{r.notes.round}</div>}
            {r.notes.holes && Object.keys(r.notes.holes).sort((a, b) => (+a) - (+b)).map((k) => (
              <div key={k} style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Hole {(+k) + 1}: {r.notes.holes[k]}</div>
            ))}
          </Card>
        ) : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { const nv = !practice; setPracticeLocal(nv); if (window.ChainsRounds && ChainsRounds.setPractice) ChainsRounds.setPractice(r.id, nv); }} style={{ flex: 1, padding: "11px", border: "1px solid " + (practice ? "var(--gold-500)" : "var(--border-default)"), borderRadius: "var(--radius-md)", background: practice ? "var(--gold-50, #fbf6e9)" : "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: practice ? "var(--gold-700, #9a7209)" : "var(--text-muted)" }}>{practice ? "✓ Practice round" : "Mark as practice"}</button>
          {hs && N > 0 && <button onClick={() => { setEditing((v) => !v); setSel(null); }} style={{ flex: 1, padding: "11px", border: "1px solid " + (editing ? "var(--ace-500)" : "var(--border-default)"), borderRadius: "var(--radius-md)", background: editing ? "var(--ace-50, #FFF3EC)" : "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: editing ? "var(--ace-700)" : "var(--text-muted)" }}>{editing ? "Done editing" : "Edit round"}</button>}
        </div>
        {editing && <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>Tap a score in the scorecard above to change it{!isOwner ? " (your own row only)" : ""}.</div>}
        {onDelete && <button onClick={() => { ChainsConfirm.show({ title: "Delete this round?", message: "This can't be undone.", confirmLabel: "Delete round", danger: true }).then((ok) => { if (ok) onDelete(r.id); }); }} style={{ marginTop: 6, padding: "11px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--clay-600, #b4452f)" }}>Delete round</button>}
      </div>
    );
  }
  function relDays(iso) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return "today"; if (d === 1) return "yesterday"; if (d < 7) return d + " days ago";
    return new Date(iso).toLocaleDateString();
  }

  /* ============================ COURSE PICK ============================= */
  const RECENT_COURSES_KEY = "chains_play_recent_courses";
  function rememberCourse(c) {
    try {
      const cur = JSON.parse(localStorage.getItem(RECENT_COURSES_KEY) || "[]").filter((x) => x && x.id !== c.id);
      cur.unshift(c); localStorage.setItem(RECENT_COURSES_KEY, JSON.stringify(cur.slice(0, 6)));
    } catch (e) {}
  }
  function CoursePick({ draft, rounds, onPick, onBack, mobile }) {
    /* v488 "Where are you playing?" — Recent / All with search, roomy rows with the
       facts you pick by (holes, par, length, est. time, your rounds here). */
    const [q, setQ] = React.useState("");
    const [cat, setCat] = React.useState(CATALOG);
    const [tab, setTab] = React.useState("recent");
    const [adding, setAdding] = React.useState(false);
    const [pos, setPos] = React.useState(null);           // v539: nearby
    const [posErr, setPosErr] = React.useState("");
    const [, favTick] = React.useState(0);
    React.useEffect(() => { if (!cat) loadCatalog().then(setCat); ChainsFavs.pull(); const on = () => favTick((x) => x + 1); window.addEventListener("chains:favs", on); return () => window.removeEventListener("chains:favs", on); }, []);
    React.useEffect(() => { if (tab !== "nearby" || pos || posErr) return; if (!navigator.geolocation) { setPosErr("No location on this device."); return; } navigator.geolocation.getCurrentPosition((g) => setPos({ lat: g.coords.latitude, lng: g.coords.longitude }), () => setPosErr("Couldn't get your location. Check the phone's location setting for the browser."), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }); }, [tab]);
    const favs = ChainsFavs.get();
    const recents = React.useMemo(() => {
      let list = []; try { list = JSON.parse(localStorage.getItem(RECENT_COURSES_KEY) || "[]"); } catch (e) {}
      if (!list.length) { try { const c = JSON.parse(localStorage.getItem(LAST_COURSE_KEY) || "null"); if (c) list = [c]; } catch (e) {} }
      return list.filter((c) => c && c.name);
    }, []);
    const me = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    const playedHere = React.useMemo(() => { const m = {}; Object.values(rounds || {}).forEach((r) => { if (r && r.course_id != null && r.status !== "open") m[r.course_id] = (m[r.course_id] || 0) + 1; }); return m; }, [rounds]);
    const ql = q.trim().toLowerCase();
    let list = cat || [];
    if (ql) list = list.filter((c) => (c.name + " " + (c.city || "") + " " + (c.state || "")).toLowerCase().includes(ql));
    const hasData = (c) => Array.isArray(c.hole_lengths) && c.hole_lengths.some((x) => x);
    list = list.slice().sort((a, b) => ((playedHere[b.id] || 0) - (playedHere[a.id] || 0)) || (hasData(b) - hasData(a)) || ((b.popularity_ratings || 0) - (a.popularity_ratings || 0)) || String(a.name).localeCompare(String(b.name))).slice(0, 60);
    const showRecent = !ql && tab === "recent" && recents.length > 0;
    const nearby = React.useMemo(() => (pos && cat ? cat.filter((c) => c && c.lat != null && c.lng != null).map((c) => Object.assign({}, c, { _mi: milesBetween(pos, c) })).sort((a, b) => a._mi - b._mi).slice(0, 40) : []), [pos, cat]);
    const favRows = React.useMemo(() => (cat || []).filter((c) => c && favs.some((f) => String(f) === String(c.id))), [cat, favs.join(",")]);
    const rows = ql ? list : tab === "nearby" ? nearby : tab === "favs" ? favRows : showRecent ? recents : list;
    const T = {
      h1: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, lineHeight: 1.05, color: "var(--text-strong)" },
      seg: (on) => ({ flex: 1, height: 40, border: "none", borderRadius: 10, background: on ? "var(--fairway-700)" : "transparent", color: on ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5 }),
    };
    const est = (c) => { const h = c.holes || 18; const m = Math.round(h * (c.course_length_ft ? (c.course_length_ft / h > 320 ? 5.6 : 4.8) : 5)); return (m >= 60 ? Math.floor(m / 60) + " hr " : "") + (m % 60) + " min"; };
    // Recent rows are stored copies — always merge the live catalog entry (play order, notes, GPS).
    const pick = (c) => { const live = (cat || []).find((x) => x && x.id === c.id); const full = live ? Object.assign({}, c, live) : c; rememberCourse(full); onPick(full); };
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)", flexShrink: 0 }}><Icons.ChevLeft size={20} /></button>
          <div style={T.h1}>Where are you playing?</div>
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: 14, color: "var(--text-faint)", display: "inline-flex" }}><Icons.Search size={18} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={cat && cat.length ? "Search " + cat.length.toLocaleString() + " courses" : "Search courses"} autoFocus={!recents.length}
            style={{ width: "100%", height: 48, padding: "0 16px 0 42px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15.5, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
        </div>
        {!ql && (
          <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg-sunken)", borderRadius: 12 }}>
            {recents.length > 0 && <button style={T.seg(tab === "recent")} onClick={() => setTab("recent")}>Recent</button>}
            {favs.length > 0 && <button style={T.seg(tab === "favs")} onClick={() => setTab("favs")}>Favourites</button>}
            <button style={T.seg(tab === "nearby")} onClick={() => setTab("nearby")}>Nearby</button>
            <button style={T.seg(tab === "all")} onClick={() => setTab("all")}>All</button>
          </div>
        )}
        {!ql && tab === "nearby" && !pos && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", padding: "2px 4px" }}>{posErr || "Finding courses near you…"}</div>}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {(cat == null && !showRecent) ? <div style={{ padding: 20, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-faint)" }}>Loading courses…</div>
            : rows.length === 0 ? <div style={{ padding: 20, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-faint)" }}>No match. You can still score on a blank 18 — tap below.</div>
            : rows.map((c, i) => (
              <button key={c.id || i} onClick={() => pick(c)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 14px", border: "none", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer" }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg, var(--fairway-600), var(--pine-700, #1f3b2a))", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icons.Pin size={20} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}{c.needs_review ? <span style={{ marginLeft: 8, padding: "1px 7px", borderRadius: 10, background: "var(--bg-sunken, #eef2ef)", color: "var(--text-muted)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", verticalAlign: "middle" }}>community</span> : null}</span>
                  <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{[c.city ? c.city + (c.state ? ", " + c.state : "") : null, (c.holes || 18) + " holes", c.par_total ? "Par " + c.par_total : null, c.course_length_ft ? c.course_length_ft.toLocaleString() + " ft" : null].filter(Boolean).join(" · ")}</span>
                  <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{c._mi != null ? (c._mi < 10 ? Math.round(c._mi * 10) / 10 : Math.round(c._mi)) + " mi · " : ""}Est. {est(c)}{playedHere[c.id] ? " · you've played here " + playedHere[c.id] + (playedHere[c.id] === 1 ? " time" : " times") : ""}{c.popularity_ratings ? " · ★ " + (c.grade || "") : ""}</span>
                </span>
                <span style={{ color: "var(--text-faint)", display: "inline-flex" }}><Icons.ChevRight size={18} /></span>
              </button>
            ))}
        </div>
        {adding ? <AddCourse initialName={q} onBack={() => setAdding(false)} onDone={(c) => { setAdding(false); setCat(CATALOG); pick(c); }} /> : (
          <button onClick={() => setAdding(true)} style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--fairway-600)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--fairway-700)" }}>
            Course not listed? Add it in two minutes
          </button>
        )}
        <button onClick={() => pick({ id: "blank-18", name: q || "Custom round", holes: 18, hole_pars: Array(18).fill(3), par_total: 54 })}
          style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-default)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)" }}>
          Or just score on a blank 18
        </button>
      </div>
    );
  }
  // v531 — player adds a course: name, town, holes, pars, optional location. Goes live for everyone at once.
  function AddCourse({ initialName, onBack, onDone }) {
    const [name, setName] = React.useState(initialName || "");
    const [city, setCity] = React.useState("");
    const [state, setState] = React.useState("MI");
    const [pars, setPars] = React.useState(() => Array(18).fill(3));
    const [pos, setPos] = React.useState(null);
    const [locBusy, setLocBusy] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");
    const setHoles = (n) => setPars((p) => { const out = p.slice(0, n); while (out.length < n) out.push(3); return out; });
    const cycle = (i) => setPars((p) => { const out = p.slice(); out[i] = out[i] >= 5 ? 3 : out[i] + 1; return out; });
    const locate = () => { if (!navigator.geolocation) { setErr("No location on this device."); return; } setLocBusy(true); navigator.geolocation.getCurrentPosition((g) => { setPos({ lat: Math.round(g.coords.latitude * 1e5) / 1e5, lng: Math.round(g.coords.longitude * 1e5) / 1e5 }); setLocBusy(false); }, () => { setLocBusy(false); setErr("Couldn't get your location — you can add the course without it."); }, { enableHighAccuracy: true, timeout: 12000 }); };
    const canGo = name.trim().length >= 3 && !busy;
    const save = () => { if (!canGo) return; setBusy(true); setErr(""); ChainsPlayerCourses.add({ name, city, state, hole_pars: pars, lat: pos && pos.lat, lng: pos && pos.lng }).then((c) => { setBusy(false); if (window.ChainsToast) ChainsToast.show(c.name + " is on Chains. You're its first name.", "success"); onDone(c); }).catch((e) => { setBusy(false); setErr("Couldn't save — " + (e && e.message || "try again")); }); };
    const inp = { width: "100%", height: 46, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)", background: "var(--bg-elevated)" };
    const lbl = { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)", margin: "12px 0 6px" };
    const seg = (on) => ({ flex: 1, minHeight: 44, border: "1px solid " + (on ? "var(--fairway-600)" : "var(--border-default)"), borderRadius: "var(--radius-md)", background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14 });
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)" }}><Icons.ChevLeft size={18} /></button>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>Add a course</div>
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>Name, town and pars are enough. Everyone on Chains can play it right away; you can map tees and baskets on the course page later.</div>
        <div style={lbl}>Course name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Riverside Park DGC" maxLength={60} style={inp} />
        <div style={lbl}>Town and state</div>
        <div style={{ display: "flex", gap: 8 }}><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Flint" maxLength={40} style={Object.assign({}, inp, { flex: 1 })} /><input value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="MI" maxLength={2} style={Object.assign({}, inp, { width: 64, textAlign: "center" })} /></div>
        <div style={lbl}>Holes</div>
        <div style={{ display: "flex", gap: 6 }}>{[9, 18, 24, 27].map((n) => <button key={n} onClick={() => setHoles(n)} style={seg(pars.length === n)}>{n}</button>)}</div>
        <div style={lbl}>Pars <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>— tap a hole to change (3 → 4 → 5)</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          {pars.map((p, i) => <button key={i} onClick={() => cycle(i)} style={{ height: 46, borderRadius: 10, border: "1px solid var(--border-subtle)", background: p === 3 ? "var(--bg-sunken, #eef2ef)" : "var(--fairway-50, #eef5f0)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--text-faint)" }}>{i + 1}</span><span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: "var(--text-strong)" }}>{p}</span></button>)}
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Par {pars.reduce((a, b) => a + b, 0)} · {pars.length} holes</div>
        <div style={lbl}>Location <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>— optional, best done standing at the course</span></div>
        <button onClick={locate} disabled={locBusy} style={Object.assign({}, seg(!!pos), { width: "100%" })}>{locBusy ? "Finding you…" : pos ? "Location saved (" + pos.lat + ", " + pos.lng + ")" : "Use my location"}</button>
        {err ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--score-over, #c23a33)", marginTop: 8 }}>{err}</div> : null}
        <button onClick={save} disabled={!canGo} style={{ width: "100%", height: 54, marginTop: 14, border: "none", borderRadius: "var(--radius-md)", background: canGo ? "var(--ace-700)" : "var(--bg-sunken, #eef2ef)", color: canGo ? "#fff" : "var(--text-faint)", cursor: canGo ? "pointer" : "default", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 15 }}>{busy ? "Saving…" : "Add the course"}</button>
      </div>
    );
  }
  function CourseRow({ c, onPick, divider }) {
    return (
      <button onClick={() => onPick(c)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "12px 14px", border: "none", borderTop: divider ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{[c.city, c.state].filter(Boolean).join(", ")}{c.holes ? " · " + c.holes + " holes · par " + c.par_total : ""}</div>
        </div>
        <span style={{ width: 16, height: 16, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={16} /></span>
      </button>
    );
  }

  /* ============================ GROUP PICK ============================= */
  // Phase 5 — surfaces this course's existing records (from you + friends' rounds)
  // so you can chase them. Shows hottest round, course record, and notable holes.
  function BeatTheMetric({ course, me, mobile }) {
    const [agg, setAgg] = React.useState(undefined);
    const [board, setBoard] = React.useState(null);   // v484: everyone on Chains at this course
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.loadGroup || !course || course.id == null) { setAgg(null); return; }
      let alive = true;
      window.ChainsRounds.loadGroup().then((rounds) => {
        if (!alive) return;
        setAgg(window.ChainsRounds.courseAggregate(rounds, course.id, me));
      }).catch(() => { if (alive) setAgg(null); });
      if (window.ChainsRounds.courseBoard) window.ChainsRounds.courseBoard(course.id).then((b) => { if (alive) setBoard(window.ChainsRounds.courseRanking(b, me)); }).catch(() => {});
      return () => { alive = false; };
    }, [course && course.id]);
    if (agg === undefined) return null;
    const fpB = (v) => v == null ? "E" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    const boardCard = board && board.entries.length ? (
      <Card pad={0} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px 6px" }}>
          <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: "var(--text-muted)" }}>Everyone on Chains · best round here</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)" }}>{board.players} {board.players === 1 ? "player" : "players"} · {board.rounds} {board.rounds === 1 ? "round" : "rounds"}</span>
        </div>
        {board.entries.slice(0, 3).map((e, i) => (
          <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", borderTop: "1px solid var(--border-subtle)" }}>
            <span style={{ width: 16, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: i === 0 ? "var(--gold-600, #b8902a)" : "var(--text-faint)" }}>{i + 1}</span>
            <Avatar name={e.name} color={e.key === me ? "var(--ace-500)" : "#9CA3AF"} size={22} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}{e.key === me ? " (you)" : ""}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)" }}>{e.rounds}×</span>
            <span style={{ minWidth: 34, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: e.best < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{fpB(e.best)}</span>
          </div>
        ))}
        {board.me && board.me.rank > 3 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", borderTop: "1px dashed var(--border-default)" }}>
            <span style={{ width: 16, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, color: "var(--ace-700)" }}>{board.me.rank}</span>
            <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)" }}>You</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)" }}>of {board.me.of}</span>
            <span style={{ minWidth: 34, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 15, color: board.me.best < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)" }}>{fpB(board.me.best)}</span>
          </div>
        )}
        {me && !board.me && <div style={{ padding: "6px 14px 10px", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>Finish a full round here to get ranked.</div>}
      </Card>
    ) : null;
    if (!agg || !agg.hottest) {
      return (
        <div>
          {boardCard}
          <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", textAlign: "center" }}>
            {boardCard ? "No crew records here yet \u2014 your first full round sets your bar." : "No records here yet \u2014 the first full round on Chains sets the bar. \uD83C\uDFAF"}
          </div>
        </div>
      );
    }
    // pick the 3 hardest-to-beat hole records (lowest strokes, biggest under par feel)
    const pars = course.hole_pars || null;
    const holeBests = (agg.holeRecords || []).map((h, i) => h ? { hole: i + 1, strokes: h.strokes, name: h.name, under: pars ? (pars[i] - h.strokes) : 0 } : null).filter(Boolean).sort((a, b) => b.under - a.under).slice(0, 3);
    const fp = (v) => v == null ? "E" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
    const wx = agg.lastWeather;
    const wxLine = wx ? ((wx.tempF != null ? Math.round(wx.tempF) + "°" : "") + (wx.desc ? " " + wx.desc.toLowerCase() : "") + (wx.windMph >= 10 ? " · " + wx.windMph + "mph wind" : "")).trim() : null;
    const playedLine = agg.plays ? (agg.plays === 1 ? "your crew's played here once" : "your crew's played here " + agg.plays + " times") : null;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <span style={{ width: 16, height: 16, color: "var(--gold-600, #b8902a)" }}><Icons.Trophy size={16} /></span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>The bar here</span>
        </div>
        {(playedLine || wxLine) && (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginBottom: 8 }}>
            {playedLine}{playedLine && wxLine ? " · " : ""}{wxLine ? "last time it was " + wxLine : ""}
          </div>
        )}
        {boardCard}
        <Card pad={0}>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ flex: 1, padding: "12px 14px", borderRight: "1px solid var(--border-subtle)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 9.5, color: "var(--text-faint)" }}>Course record</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: agg.hottest.toPar < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)", marginTop: 2 }}>{fp(agg.hottest.toPar)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agg.hottest.name}</div>
            </div>
            <div style={{ flex: 1, padding: "12px 14px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 9.5, color: "var(--text-faint)" }}>Your best here</div>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: agg.myBest == null ? "var(--text-faint)" : agg.myBest < 0 ? "var(--score-under, #1a7a50)" : "var(--text-strong)", marginTop: 2 }}>{agg.myBest == null ? "—" : fp(agg.myBest)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{agg.myBest == null ? "no round yet" : agg.myBest <= agg.hottest.toPar ? "you hold it" : (agg.myBest - agg.hottest.toPar) + " off the record"}</div>
            </div>
          </div>
          {holeBests.length > 0 && (
            <div style={{ display: "flex", gap: 8, padding: "10px 14px" }}>
              {holeBests.map((h) => (
                <div key={h.hole} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".05em" }}>Hole {h.hole}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 17, color: "var(--text-strong)" }}>{h.strokes}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(h.name || "").split(" ")[0]}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }
  function GroupPick({ draft, rounds, onStart, onBack, mobile }) {
    /* v488 "Cardmates": one list of everyone you've played with (friends + guests),
       searchable, sorted Frequent / Recent / Name with rounds-played counts; tap to
       toggle onto the card. Add new cardmate = friend, Chains username, or guest. */
    const me = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    const meMember = me && window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(me) : null;
    const meName = (meMember && meMember.name) || (function () { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); const lp = u && ChainsAuth.localProfile && ChainsAuth.localProfile(u.uid); return (lp && (lp.displayName || lp.name)) || (u && u.username) || "You"; } catch (e) { return "You"; } })();
    const meDisc = (meMember && meMember.disc) || "#E8590C";
    const [, bump] = React.useState(0);
    React.useEffect(() => { const on = () => bump((n) => n + 1); window.addEventListener("chains:friends", on); return () => window.removeEventListener("chains:friends", on); }, []);
    const friendsOk = !!(window.ChainsFriends && ChainsFriends.available && ChainsFriends.available());
    const friends = friendsOk ? ChainsFriends.list().filter((f) => f && f.uid && f.uid !== me).map((f) => {
      let nm = f.name, disc = f.disc; const mm = window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(f.uid) : null;
      if (mm) { nm = mm.name || nm; disc = mm.disc || disc; }
      if (!nm || nm === "Player") nm = f.uid.charAt(0).toUpperCase() + f.uid.slice(1);
      return { id: f.uid, name: nm, color: disc || "#9CA3AF" };
    }) : [];
    // Everyone I've ever had on a card (friends, members, guests by name) with counts.
    const people = React.useMemo(() => {
      const map = {};
      friends.forEach((f) => { map[f.id] = Object.assign({ n: 0, last: "" }, f); });
      Object.values(rounds || {}).forEach((r) => {
        if (!r || !Array.isArray(r.group) || r.status === "open") return;
        if (me && !r.group.some((g) => g && g.id === me) && r.logged_by !== me) return;
        r.group.forEach((g) => {
          if (!g || !g.id || g.id === me) return;
          const key = g.guest || /^guest/.test(g.id) ? "guest:" + String(g.name || "").toLowerCase() : g.id;
          if (!map[key]) map[key] = { id: g.guest || /^guest/.test(g.id) ? null : g.id, name: g.name, color: g.color || g.disc || "#9CA3AF", guest: !!(g.guest || /^guest/.test(g.id)), n: 0, last: "" };
          map[key].n++; const d = String(r.created_at || r.date || ""); if (d > map[key].last) map[key].last = d;
        });
      });
      let last = null; try { last = JSON.parse(localStorage.getItem(LAST_GROUP_KEY) || "null"); } catch (e) {}
      (last || []).forEach((g) => { if (!g || !g.id || g.id === me || g.name === "Player") return; const key = g.guest ? "guest:" + String(g.name).toLowerCase() : g.id; if (!map[key]) map[key] = { id: g.guest ? null : g.id, name: g.name, color: g.color || g.disc || "#9CA3AF", guest: !!g.guest, n: 0, last: "~" }; });
      return Object.values(map);
    }, [rounds, friends.length]);
    const [group, setGroup] = React.useState(draft.group && draft.group.length ? draft.group : (me ? [{ id: me, name: meName, color: meDisc }] : []));
    const [q, setQ] = React.useState("");
    const [sort, setSort] = React.useState("freq");
    const [addOpen, setAddOpen] = React.useState(false);
    const [format, setFormat] = React.useState(draft.format || "singles");
    const [handicaps, setHandicaps] = React.useState(draft.handicaps || {});
    const [showRules, setShowRules] = React.useState(false);
    const [startHole, setStartHole] = React.useState(1);
    const [holesPlan, setHolesPlan] = React.useState("all"); // all | front | back
    const [more, setMore] = React.useState(false);
    const totalHoles = (draft.course && draft.course.holes) || (draft.course && draft.course.hole_pars && draft.course.hole_pars.length) || 18;
    const parTotal = draft.course && (draft.course.par_total || (draft.course.hole_pars ? draft.course.hole_pars.reduce((a, b) => a + b, 0) : null));
    const formats = window.ChainsFormats ? window.ChainsFormats.list() : [{ id: "singles", name: "Singles", desc: "Your own score.", rules: "" }];
    const fmtMeta = formats.filter((f) => f.id === format)[0] || formats[0];
    const inGroup = (p) => group.some((g) => (p.id && g.id === p.id) || (!p.id && g.guest && g.name.toLowerCase() === String(p.name).toLowerCase()));
    function toggle(p) {
      if (inGroup(p)) { setGroup((g) => g.filter((x) => !((p.id && x.id === p.id) || (!p.id && x.guest && x.name.toLowerCase() === String(p.name).toLowerCase())))); return; }
      setGroup((g) => g.concat([p.id ? { id: p.id, name: p.name, color: p.color } : { id: "guest-" + Date.now().toString(36), name: p.name, color: p.color || "#9CA3AF", guest: true }]));
    }
    function addNew(p) { if (p.id && inGroup(p)) return; toggle(Object.assign({}, p, { color: p.color || p.disc })); }
    const ql = q.trim().toLowerCase();
    const onCardOnly = group.filter((g) => g.id !== me && !people.some((p) => (p.id && p.id === g.id) || (!p.id && g.guest && String(p.name).toLowerCase() === String(g.name).toLowerCase()))).map((g) => ({ id: g.guest ? null : g.id, name: g.name, color: g.color, guest: !!g.guest, n: 0, last: "~" }));
    const matchQ = (p) => !ql || p.name.toLowerCase().indexOf(ql) >= 0 || (p.id && String(p.id).indexOf(ql) >= 0);
    const list = onCardOnly.filter(matchQ).concat(people.filter(matchQ).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "recent" ? String(b.last).localeCompare(String(a.last)) || b.n - a.n : (b.n - a.n) || String(b.last).localeCompare(String(a.last)) || a.name.localeCompare(b.name)));
    const T = {
      h1: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, lineHeight: 1.05, color: "var(--text-strong)" },
      sub: { fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 },
      label: { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "var(--text-strong)" },
      row: (on) => ({ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "11px 12px", border: "none", borderTop: "1px solid var(--border-subtle)", background: on ? "var(--fairway-50)" : "transparent", cursor: "pointer" }),
      name: { flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
      meta: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", flexShrink: 0 },
      check: (on) => ({ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "var(--fairway-600)" : "transparent", border: on ? "none" : "2px solid var(--border-default)", color: "#fff" }),
      seg: (on) => ({ flex: 1, height: 40, border: "none", borderRadius: 10, background: on ? "var(--fairway-700)" : "transparent", color: on ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5 }),
      stepBtn: { width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--ace-500)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--ace-700)", lineHeight: 1 },
    };
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {addOpen && <GuestAddSheet friends={friends.filter((f) => !inGroup(f))} onAdd={addNew} onClose={() => setAddOpen(false)} />}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <button onClick={onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)", flexShrink: 0 }}><Icons.ChevLeft size={20} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={T.h1}>{(draft.course && draft.course.name) || "Round setup"}</div>
            <div style={T.sub}>{[draft.course && draft.course.city, totalHoles + " holes", parTotal ? "Par " + parTotal : null, draft.course && draft.course.course_length_ft ? draft.course.course_length_ft.toLocaleString() + " ft" : null].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        <BeatTheMetric course={draft.course} me={me} mobile={mobile} />

        {/* Who's playing */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={T.label}>Who's playing?</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>{group.length === 1 ? "Just you" : group.length + " on the card"}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: 12, color: "var(--text-faint)", display: "inline-flex" }}><Icons.Search size={18} /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your cardmates" style={{ width: "100%", height: 44, padding: "0 12px 0 38px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={() => setAddOpen(true)} aria-label="Add new cardmate" title="Add new cardmate" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px -4px var(--ace-500)" }}><Icons.Users size={20} /></button>
          </div>
          <div style={{ display: "flex", gap: 2, padding: 3, background: "var(--bg-sunken)", borderRadius: 12, marginBottom: 8 }}>
            <button style={T.seg(sort === "freq")} onClick={() => setSort("freq")}>Frequent</button>
            <button style={T.seg(sort === "recent")} onClick={() => setSort("recent")}>Recent</button>
            <button style={T.seg(sort === "name")} onClick={() => setSort("name")}>Name</button>
          </div>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {me && (
              <div style={Object.assign({}, T.row(true), { borderTop: "none", cursor: "default" })}>
                <Avatar name={meName} color={meDisc} size={36} />
                <span style={T.name}>{meName}<span style={{ fontWeight: 400, color: "var(--text-faint)" }}> · you</span><BadgeChip uid={me} /></span>
                <span style={T.meta}>{Object.values(rounds || {}).filter((r) => r && r.status !== "open" && (r.logged_by === me || (Array.isArray(r.group) && r.group.some((g) => g && g.id === me)))).length} {Object.values(rounds || {}).filter((r) => r && r.status !== "open" && (r.logged_by === me || (Array.isArray(r.group) && r.group.some((g) => g && g.id === me)))).length === 1 ? "round" : "rounds"}</span>
                <span style={T.check(true)}><Icons.Check size={15} /></span>
              </div>
            )}
            {list.map((p) => { const on = inGroup(p); return (
              <button key={(p.id || "guest") + ":" + p.name} style={T.row(on)} onClick={() => toggle(p)}>
                <Avatar name={p.name} color={p.color || "#9CA3AF"} size={36} />
                <span style={T.name}>{p.name}{p.guest ? <span style={{ fontWeight: 400, color: "var(--text-faint)" }}> · guest</span> : null}{p.id ? <BadgeChip uid={p.id} /> : null}</span>
                <span style={T.meta}>{p.n ? p.n + (p.n === 1 ? " round" : " rounds") : (p.guest ? "" : "friend")}</span>
                <span style={T.check(on)}>{on ? <Icons.Check size={15} /> : null}</span>
              </button>
            ); })}
            {list.length === 0 && (
              <div style={{ padding: "18px 14px", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5, borderTop: "1px solid var(--border-subtle)" }}>
                {ql ? <span>No cardmate named “{q}”. <button onClick={() => setAddOpen(true)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--ace-700)", padding: 0 }}>Add them →</button></span> : "Nobody on your list yet — tap the orange button to add a friend by username, or anyone as a guest."}
              </div>
            )}
            <button onClick={() => setAddOpen(true)} style={Object.assign({}, T.row(false), { color: "var(--ace-700)" })}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ace-50, #FFF3EC)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ace-700)", fontSize: 22, fontWeight: 700, flexShrink: 0 }}>+</span>
              <span style={Object.assign({}, T.name, { color: "var(--ace-700)" })}>Add new cardmate<div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 12, color: "var(--text-faint)" }}>Find by username · or add a guest without the app</div></span>
            </button>
          </div>
        </div>

        {/* Round type */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={T.label}>Round type</span>
            <button onClick={() => setShowRules((s) => !s)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ace-700)" }}>{showRules ? "Hide rules" : "How does this work?"}</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }} className="gt-strip">
            {formats.map((f) => (
              <button key={f.id} onClick={() => setFormat(f.id)} style={{ flexShrink: 0, height: 40, padding: "0 16px", borderRadius: "var(--radius-pill)", border: "1px solid " + (format === f.id ? "var(--fairway-600)" : "var(--border-default)"), background: format === f.id ? "var(--fairway-700)" : "var(--bg-elevated)", color: format === f.id ? "#fff" : "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14 }}>{f.name}</button>
            ))}
          </div>
          <div style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>{showRules ? fmtMeta.rules : fmtMeta.desc}</div>
          {fmtMeta.handicap && group.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {group.map((g) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={g.name} color={g.color} size={26} />
                  <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }}>{g.name}</span>
                  <button onClick={() => setHandicaps((h) => Object.assign({}, h, { [g.id]: Math.max(0, (h[g.id] || 0) - 1) }))} style={T.stepBtn}>−</button>
                  <span style={{ minWidth: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18 }}>{handicaps[g.id] || 0}</span>
                  <button onClick={() => setHandicaps((h) => Object.assign({}, h, { [g.id]: (h[g.id] || 0) + 1 }))} style={Object.assign({}, T.stepBtn, { background: "var(--ace-700)", color: "#fff", border: "none" })}>+</button>
                </div>
              ))}
            </div>
          )}
          {fmtMeta.team && <div style={{ marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>Teams pair in the order you added players. Everyone still enters their own throws.</div>}
        </div>

        {/* Customize */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)" }}>
          <button onClick={() => setMore((v) => !v)} style={{ display: "flex", alignItems: "center", width: "100%", padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer" }}>
            <span style={T.label}>Customize your round</span>
            <span style={{ marginLeft: "auto", color: "var(--text-muted)", display: "inline-flex", transform: more ? "rotate(180deg)" : "none", transition: "transform .15s" }}><Icons.ChevDown size={20} /></span>
          </button>
          {more && totalHoles >= 12 && (
            <div style={{ padding: "14px 16px 0", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--text-body)", marginBottom: 8 }}>Holes to play</div>
              <div style={{ display: "flex", gap: 6 }}>{[["all", "All " + totalHoles], ["front", "Front " + Math.ceil(totalHoles / 2)], ["back", "Back " + Math.floor(totalHoles / 2)]].map(([id, t]) => <button key={id} onClick={() => { setHolesPlan(id); setStartHole(id === "back" ? Math.ceil(totalHoles / 2) + 1 : 1); }} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid " + (holesPlan === id ? "var(--fairway-600)" : "var(--border-default)"), background: holesPlan === id ? "var(--fairway-700)" : "var(--bg-elevated)", color: holesPlan === id ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13 }}>{t}</button>)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>You can also stop any time with "Finish now" while scoring.</div>
            </div>
          )}
          {more && (
            <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 12, borderTop: totalHoles >= 12 ? "none" : "1px solid var(--border-subtle)", paddingTop: 14 }}>
              <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--text-body)" }}>Starting hole</span>
              <button onClick={() => setStartHole((h) => Math.max(1, h - 1))} style={T.stepBtn}>−</button>
              <span style={{ minWidth: 34, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20 }}>{startHole}</span>
              <button onClick={() => setStartHole((h) => Math.min(totalHoles, h + 1))} style={Object.assign({}, T.stepBtn, { background: "var(--ace-700)", color: "#fff", border: "none" })}>+</button>
            </div>
          )}
        </div>

        <button className="cw-press" disabled={!group.length} onClick={() => onStart(group, "holes", format, handicaps, startHole - 1, holesPlan === "front" ? Math.ceil(totalHoles / 2) - 1 : holesPlan === "back" ? totalHoles - 1 : null)} style={{ height: 56, borderRadius: "var(--radius-lg)", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 17, boxShadow: "0 8px 20px -8px var(--ace-500)" }}>
          Start my round{group.length > 1 ? " · " + group.length + " players" : ""}
        </button>
      </div>
    );
  }

  /* 4.1 — disc-count check: start-of-round count + end-of-round confirm. */
  function DiscCountStep({ draft, onGo, onSkip, onBack, mobile }) {
    const fromBag = (window.ChainsBag && ChainsBag.effectiveCount) ? (ChainsBag.effectiveCount() || 0) : 0;
    const [n, setN] = React.useState(fromBag > 0 ? fromBag : 15);
    const p = (window.ChainsDiscCheck ? ChainsDiscCheck.pref() : {});
    const willTurnOff = ((p.skips || 0) + 1) >= 2;
    const bigBtn = { width: 52, height: 52, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, color: "var(--text-strong)" };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 430, margin: "0 auto" }}>
        <FlowHead title="Heading out?" sub={draft && draft.course ? draft.course.name : ""} onBack={onBack} />
        <Card pad={22}>
          <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-body)", lineHeight: 1.55 }}>Count your discs before you tee off. Come back with the same number and you know nothing got left in the rough.</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, margin: "18px 0 8px" }}>
            <button onClick={() => setN((x) => Math.max(1, x - 1))} style={bigBtn}>−</button>
            <div style={{ textAlign: "center", minWidth: 90 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 46, color: "var(--text-strong)", lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>discs in the bag</div>
            </div>
            <button onClick={() => setN((x) => x + 1)} style={bigBtn}>+</button>
          </div>
          {fromBag > 0 ? <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>Prefilled from In the Bag.</div> : null}
        </Card>
        <Button variant="accent" full size="lg" onClick={() => onGo(n)}>Heading out with {n} discs</Button>
        <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", padding: 6 }}>Skip{willTurnOff ? " — and stop asking (Settings turns it back on)" : " this time"}</button>
      </div>
    );
  }
  function DiscEndCheck({ n }) {
    const [state, setState] = React.useState(null);
    const [pick, setPick] = React.useState("");
    const okS = { fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--fairway-700, #1f5133)", textAlign: "center" };
    let inBag = [];
    try { inBag = ((window.ChainsBag && ChainsBag.get && ChainsBag.get()) || []).filter((d) => d && !d.lost); } catch (e) {}
    if (state === "ok") return <Card pad={14}><div style={okS}>All {n} discs accounted for.</div></Card>;
    if (state === "marked") return <Card pad={14}><div style={okS}>Marked lost — it stays flagged in In the Bag in case it turns up.</div></Card>;
    return (
      <Card pad={16}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", marginBottom: 6 }}>Disc check</div>
        {state !== "missing" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 170px", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Still have all {n} discs?</div>
            <Button variant="accent" size="md" onClick={() => setState("ok")}>Yes ✓</Button>
            <Button variant="secondary" size="md" onClick={() => setState("missing")}>I'm missing one</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)" }}>Which one? It gets flagged lost in your bag.</div>
            <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ height: 42, padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 14 }}>
              <option value="">Pick the disc…</option>
              {inBag.map((d) => <option key={d.id} value={d.id}>{((d.brand ? d.brand + " " : "") + (d.mold || d.name || "Disc"))}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="accent" size="md" disabled={!pick} onClick={() => { try { ChainsBag.setLost(pick, true); } catch (e) {} setState("marked"); }}>Mark it lost</Button>
              <Button variant="secondary" size="md" onClick={() => setState("ok")}>Never mind</Button>
            </div>
          </div>
        )}
      </Card>
    );
  }
  /* #38-lite: the round's story — best/worst hole, streaks. Zero taps, auto. */
  function RoundStory({ result, me }) {
    const hs = result && result.holeScores && me ? result.holeScores[me] : null;
    const pars = result && result.pars;
    if (!hs || !pars || !hs.some((x) => x != null)) return null;
    let best = null, worst = null, streak = 0, run = 0, parOrBetter = 0, played = 0;
    hs.forEach((x, i) => {
      if (x == null || pars[i] == null) return;
      played++;
      const d = x - pars[i];
      if (best == null || d < best.d) best = { d: d, h: i + 1 };
      if (worst == null || d > worst.d) worst = { d: d, h: i + 1 };
      if (d <= 0) parOrBetter++;
      if (d < 0) { run++; if (run > streak) streak = run; } else run = 0;
    });
    if (!played) return null;
    const chips = [];
    if (best && best.d < 0) chips.push({ t: "Best: hole " + best.h + " (" + (best.d === -1 ? "birdie" : best.d === -2 ? "eagle" : best.d + "") + ")", c: "var(--fairway-700, #1f5133)", bg: "var(--fairway-50, #eef6f0)" });
    if (worst && worst.d > 0) chips.push({ t: "Toughest: hole " + worst.h + " (+" + worst.d + ")", c: "var(--live-600, #c2410c)", bg: "var(--live-50, #fdeeec)" });
    if (streak >= 2) chips.push({ t: streak + " birdies in a row", c: "var(--gold-700, #9a7209)", bg: "var(--gold-50, #fbf6e9)" });
    chips.push({ t: parOrBetter + "/" + played + " holes at par or better", c: "var(--text-muted)", bg: "var(--bg-sunken)" });
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
        {chips.map((c, i) => <span key={i} style={{ padding: "6px 12px", borderRadius: "var(--radius-pill)", background: c.bg, color: c.c, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 }}>{c.t}</span>)}
      </div>
    );
  }
  /* #35-lite: verify & sign — stamps the cloud record; card shows as verified. */
  function VerifySign({ result, me }) {
    const [state, setState] = React.useState(null);
    if (!result || !result.cloudId || !me) return null;
    const d = cloudDb();
    if (!d) return null;
    if (state === "ok") return <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fairway-700, #1f5133)" }}>✓ Signed — your card is locked into history as verified.</div>;
    return (
      <button onClick={() => { try { d.ref("playRounds/" + result.cloudId + "/verified/" + me).set(Date.now()).then(() => setState("ok"), () => setState("err")); } catch (e) { setState("err"); } }}
        style={{ alignSelf: "center", padding: "9px 18px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--text-body)" }}>
        {state === "err" ? "Couldn't sign — tap to retry" : "Verify & sign my card"}
      </button>
    );
  }
  function DiscCheckSettingRow() {
    const [, f] = React.useState(0);
    React.useEffect(() => { const fn = () => f((x) => x + 1); window.addEventListener("chains:disccheck", fn); return () => window.removeEventListener("chains:disccheck", fn); }, []);
    if (!window.ChainsDiscCheck) return null;
    const p = ChainsDiscCheck.pref();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 16px", background: "var(--bg-surface, #fff)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg, 14px)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" }}>Disc count check</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Count at round start, confirm nothing's missing at the end.</div>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)" }}>
          <input type="checkbox" checked={!p.off} onChange={(e) => ChainsDiscCheck.set({ off: !e.target.checked, skips: 0 })} /> {p.off ? "Off" : "On"}
        </label>
      </div>
    );
  }
  window.DiscCheckSettingRow = DiscCheckSettingRow;

  /* ============================ SCOREBOARD (hole-by-hole) ============== */
  /* ===================== v494 course geometry + hole card =====================
     courseGeo/{courseId}/holes/{n} = { tee:{lat,lng,acc,by,at}, basket:{...} } — crowd-sourced
     by whoever is standing there with the app open. The hole card is OURS: an illustrated
     tee-sign style card drawn from hole length/par (and real bearing once tee+basket exist),
     plus a live "distance to basket" rangefinder from the phone's GPS. */
  const ChainsGeo = (() => {
    const cache = {};
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    function dist(a, b) { if (!a || !b) return null; const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng); const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); }
    function bearing(a, b) { if (!a || !b) return null; const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat)); const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
    const ft = (m) => m == null ? null : Math.round(m * 3.28084);
    function db() { try { return window.ChainsFB && ChainsFB.ok ? ChainsFB.db : null; } catch (e) { return null; } }
    function load(courseId) {
      if (!courseId) return Promise.resolve({});
      if (cache[courseId]) return Promise.resolve(cache[courseId]);
      const d = db(); if (!d) return Promise.resolve({});
      return d.ref("courseGeo/" + courseId + "/holes").once("value").then((s) => { cache[courseId] = s.val() || {}; return cache[courseId]; }).catch(() => ({}));
    }
    function watch(courseId, cb) { const d = db(); if (!d || !courseId) return () => {}; const ref = d.ref("courseGeo/" + courseId + "/holes"); const h = ref.on("value", (s) => { cache[courseId] = s.val() || {}; cb(cache[courseId]); }); return () => ref.off("value", h); }
    function here(opts) { return new Promise((res, rej) => { if (!navigator.geolocation) return rej(new Error("No GPS on this device.")); navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }), (e) => rej(new Error(e.code === 1 ? "Location is off for this site — allow it in your browser settings." : "Couldn't get a GPS fix — try again in the open.")), Object.assign({ enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }, opts || {})); }); }
    function mark(courseId, hole, what) {
      return here().then((pos) => {
        const d = db(); const me = window.ChainsID && ChainsID.whoami();
        const v = { lat: pos.lat, lng: pos.lng, acc: Math.round(pos.acc || 0), by: me || null, at: Date.now() };
        if (d) d.ref("courseGeo/" + courseId + "/holes/" + hole + "/" + what).set(v).catch(() => {});
        cache[courseId] = cache[courseId] || {}; cache[courseId][hole] = Object.assign({}, cache[courseId][hole] || {}, { [what]: v });
        return v;
      });
    }
    return { dist, bearing, ft, load, watch, here, mark, cache };
  })();
  window.ChainsGeo = ChainsGeo;
  window.ChainsCatalog = { load: loadCatalog, get: function () { return CATALOG; } };

  // v495: satellite caddie view (MapLibre + USGS public-domain imagery, no token) for holes
  // that have a marked tee + basket. Tee at the bottom, basket at the top (map bearing =
  // tee→basket heading), white path, orange highlight, blue dot = you.
  // v503: Esri World Imagery (zoom 19 here; USGS stopped at 16 and upscaled = grainy). Attribution required.
  const USGS_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const IMAGERY_ATTR = "Imagery © Esri, Maxar, Earthstar Geographics";
  // Modals must escape the app's scroll/transform containers to sit on top of the phone screen.
  function Portal({ children }) { return (window.ReactDOM && ReactDOM.createPortal) ? ReactDOM.createPortal(children, document.body) : children; }
  function loadMapLibre() {
    if (window.maplibregl) return Promise.resolve(window.maplibregl);
    if (window.__mlPromise) return window.__mlPromise;
    window.__mlPromise = new Promise((res, rej) => {
      const fail = (e) => { window.__mlPromise = null; rej(e); };
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"; document.head.appendChild(l);
      const sc = document.createElement("script"); sc.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"; sc.onload = () => res(window.maplibregl); sc.onerror = () => fail(new Error("Map didn't load — tap to retry.")); document.head.appendChild(sc);
    });
    return window.__mlPromise;
  }
  function HoleMap({ tee, basket, doglegs, pos, hole }) {
    const box = React.useRef(null); const mapRef = React.useRef(null); const [err, setErr] = React.useState(""); const [retry, setRetry] = React.useState(0);
    const geo = () => {
      const line = [[tee.lng, tee.lat]].concat((doglegs || []).map((d) => [d.lng, d.lat])).concat([[basket.lng, basket.lat]]);
      const f = [{ type: "Feature", properties: { kind: "path" }, geometry: { type: "LineString", coordinates: line } },
        { type: "Feature", properties: { kind: "tee" }, geometry: { type: "Point", coordinates: [tee.lng, tee.lat] } },
        { type: "Feature", properties: { kind: "basket" }, geometry: { type: "Point", coordinates: [basket.lng, basket.lat] } }];
      if (pos) f.push({ type: "Feature", properties: { kind: "me" }, geometry: { type: "Point", coordinates: [pos.lng, pos.lat] } });
      return { type: "FeatureCollection", features: f };
    };
    React.useEffect(() => {
      let alive = true;
      loadMapLibre().then((ml) => {
        if (!alive || !box.current) return;
        const bearing = ChainsGeo.bearing(tee, basket) || 0;
        const map = new ml.Map({ container: box.current, attributionControl: false, style: { version: 8, sources: { sat: { type: "raster", tiles: [USGS_TILES], tileSize: 256, maxzoom: 19, attribution: IMAGERY_ATTR } }, layers: [{ id: "sat", type: "raster", source: "sat" }] }, center: [(tee.lng + basket.lng) / 2, (tee.lat + basket.lat) / 2], zoom: 17, bearing: bearing, pitch: 0 });
        mapRef.current = map;
        map.on("load", () => {
          map.addSource("course", { type: "geojson", data: geo() });
          map.addLayer({ id: "path-glow", type: "line", source: "course", filter: ["==", ["get", "kind"], "path"], paint: { "line-color": "#ffffff", "line-width": 14, "line-opacity": 0.35 }, layout: { "line-cap": "round", "line-join": "round" } });
          map.addLayer({ id: "path", type: "line", source: "course", filter: ["==", ["get", "kind"], "path"], paint: { "line-color": "#F26A1B", "line-width": 6 }, layout: { "line-cap": "round", "line-join": "round" } });
          map.addLayer({ id: "tee", type: "circle", source: "course", filter: ["==", ["get", "kind"], "tee"], paint: { "circle-radius": 9, "circle-color": "#1f4d33", "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });
          map.addLayer({ id: "basket", type: "circle", source: "course", filter: ["==", ["get", "kind"], "basket"], paint: { "circle-radius": 10, "circle-color": "#fff", "circle-stroke-color": "#F26A1B", "circle-stroke-width": 4 } });
          map.addLayer({ id: "me", type: "circle", source: "course", filter: ["==", ["get", "kind"], "me"], paint: { "circle-radius": 7, "circle-color": "#2f6fdb", "circle-stroke-color": "#fff", "circle-stroke-width": 3 } });
          // v507: arrows along the fairway showing throw direction
          try {
            const pts = [[tee.lng, tee.lat]].concat((doglegs || []).map((d) => [d.lng, d.lat])).concat([[basket.lng, basket.lat]]);
            for (let i = 0; i < pts.length - 1; i++) {
              const a = { lng: pts[i][0], lat: pts[i][1] }, b = { lng: pts[i + 1][0], lat: pts[i + 1][1] };
              const segB = ChainsGeo.bearing(a, b) || 0;
              [0.38, 0.7].forEach((t) => { const el = document.createElement("div"); el.textContent = "➤"; el.style.cssText = "font-size:18px;line-height:1;color:#fff;text-shadow:0 0 4px rgba(0,0,0,.8);transform-origin:center"; new ml.Marker({ element: el, rotation: segB - 90, rotationAlignment: "map", pitchAlignment: "map" }).setLngLat([a.lng + (b.lng - a.lng) * t, a.lat + (b.lat - a.lat) * t]).addTo(map); });
            }
          } catch (e) {}
          try { map.fitBounds([[Math.min(tee.lng, basket.lng), Math.min(tee.lat, basket.lat)], [Math.max(tee.lng, basket.lng), Math.max(tee.lat, basket.lat)]], { padding: 56, bearing: bearing, duration: 0, maxZoom: 19 }); } catch (e) {}
        });
        map.on("error", (e) => { if (e && e.error && /tile/i.test(String(e.error.message || ""))) return; });
      }).catch((e) => setErr(e.message));
      return () => { alive = false; try { mapRef.current && mapRef.current.remove(); } catch (e) {} mapRef.current = null; };
    }, [hole, tee && tee.lat, tee && tee.lng, basket && basket.lat, basket && basket.lng, retry]);
    React.useEffect(() => { const m = mapRef.current; if (!m) return; try { const src = m.getSource("course"); if (src) src.setData(geo()); } catch (e) {} }, [pos && pos.lat, pos && pos.lng]);
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 300, background: "#1b2a20" }}>
        <div ref={box} style={{ position: "absolute", inset: 0 }} />
        <span style={{ position: "absolute", left: 6, bottom: 4, fontFamily: "var(--font-sans)", fontSize: 8.5, color: "rgba(255,255,255,.75)", textShadow: "0 0 3px rgba(0,0,0,.9)", pointerEvents: "none" }}>© Esri</span>
        {err ? <button onClick={() => { setErr(""); setRetry((n) => n + 1); }} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, textAlign: "center", color: "#f3eedc", fontFamily: "var(--font-sans)", fontSize: 13, background: "rgba(27,42,32,.9)", border: "none", cursor: "pointer" }}>{err}</button> : null}
      </div>
    );
  }
  // v498: inline map on the scoring screen — where you are on the hole, tee→you and you→basket.
  function LiveHolePanel({ course, hole, onOpenCard }) {
    const courseId = course && course.id;
    const [geo, setGeo] = React.useState(() => (ChainsGeo.cache[courseId] ? ((ChainsGeo.cache[courseId])[hole] || undefined) : null));
    const [pos, setPos] = React.useState(null);
    const [gpsErr, setGpsErr] = React.useState("");
    React.useEffect(() => { if (!courseId) return; ChainsGeo.load(courseId).then((all) => setGeo((all || {})[hole] || undefined)); return ChainsGeo.watch(courseId, (all) => setGeo((all || {})[hole] || undefined)); }, [courseId, hole]);
    React.useEffect(() => {
      if (!navigator.geolocation) { setGpsErr("No GPS on this device."); return; }
      const id = navigator.geolocation.watchPosition((p) => { setGpsErr(""); setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); }, (e) => setGpsErr(e.code === 1 ? "Location is off — allow it for this site to see yourself on the map." : "Waiting for a GPS fix…"), { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });
      return () => { try { navigator.geolocation.clearWatch(id); } catch (e) {} };
    }, []);
    const tee = geo && geo.tee, basket = geo && geo.basket;
    const teeToMe = pos && tee ? ChainsGeo.ft(ChainsGeo.dist(tee, pos)) : null;
    const meToBasket = pos && basket ? ChainsGeo.ft(ChainsGeo.dist(pos, basket)) : null;
    const stat = (icon, val, label) => <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16, color: "var(--text-strong)" }}><span style={{ fontSize: 15 }}>{icon}</span>{val != null ? val.toLocaleString() + " ft" : "—"}<span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 11, color: "var(--text-faint)" }}>{label}</span></span>;
    return (
      <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
        <div style={{ height: 170, position: "relative" }}>
          {tee && basket ? <HoleMap tee={tee} basket={basket} doglegs={geo && geo.doglegs} pos={pos} hole={hole} />
            : <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, textAlign: "center", background: "linear-gradient(160deg, #a9d47f, #6fae84)" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "#1f4d33" }}>{geo === null ? "Loading map…" : "No satellite map for hole " + (hole + 1) + " yet"}</div>
                <button onClick={onOpenCard} style={{ height: 38, padding: "0 16px", borderRadius: 19, border: "none", background: "#1f4d33", color: "#f3eedc", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13 }}>Hole card</button>
              </div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>{pos && basket && meToBasket != null && meToBasket <= 2000 ? "You're on the hole · " + meToBasket + " ft out" : pos ? "Blue dot = you" : gpsErr || "Finding you…"}</span>
          <button onClick={onOpenCard} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, color: "var(--ace-700)", padding: 0 }}>Hole card</button>
        </div>

      </div>
    );
  }
  function HoleCard({ course, hole, par, len, onClose }) {
    const courseId = course && course.id;
    const [geo, setGeo] = React.useState(() => (ChainsGeo.cache[courseId] ? ((ChainsGeo.cache[courseId])[hole] || undefined) : null)); // null = loading, undefined = none
    const [pos, setPos] = React.useState(null);
    const [busy, setBusy] = React.useState("");
    const [err, setErr] = React.useState("");
    const [mode, setMode] = React.useState("card"); // card (default) | sat
    const [fix, setFix] = React.useState(false);
    React.useEffect(() => { if (!courseId) return; ChainsGeo.load(courseId).then((all) => setGeo((all || {})[hole] || undefined)); return ChainsGeo.watch(courseId, (all) => setGeo((all || {})[hole] || undefined)); }, [courseId, hole]);
    // live rangefinder: refresh position every few seconds while the card is open
    React.useEffect(() => {
      let alive = true, id = null;
      const tick = () => ChainsGeo.here({ maximumAge: 2000 }).then((p) => { if (alive) setPos(p); }).catch(() => {});
      tick(); id = setInterval(tick, 4000);
      return () => { alive = false; clearInterval(id); };
    }, []);
    const tee = geo && geo.tee, basket = geo && geo.basket;
    const measured = tee && basket ? ChainsGeo.ft(ChainsGeo.dist(tee, basket)) : null;
    const toBasketRaw = pos && basket ? ChainsGeo.ft(ChainsGeo.dist(pos, basket)) : null;
    const toBasket = toBasketRaw != null && toBasketRaw <= 2000 ? toBasketRaw : null; // only when you're actually on the hole
    const brg = tee && basket ? ChainsGeo.bearing(tee, basket) : null;
    const shown = len || measured;
    const doMark = (what) => { setBusy(what); setErr(""); ChainsGeo.mark(courseId, hole, what).then(() => { setBusy(""); try { window.ChainsToast && ChainsToast.show((what === "tee" ? "Tee" : "Basket") + " marked for hole " + (hole + 1) + " · ±" + Math.round((ChainsGeo.cache[courseId][hole][what].acc) || 0) + " m", "success"); } catch (e) {} }).catch((e) => { setBusy(""); setErr(e.message); }); };
    // --- illustrated hole: fairway band from tee (bottom) to basket (top); bend from the real
    // bearing when we have it, otherwise a gentle default. Trees scattered deterministically.
    const W = 300, H = 420;
    const seed = (hole + 1) * 9301 + (String(courseId || "").length * 49297);
    const rnd = (i) => { const x = Math.sin(seed + i * 7919) * 10000; return x - Math.floor(x); };
    const bend = brg == null ? ((hole % 3) - 1) * 22 : Math.max(-60, Math.min(60, (((brg + 180) % 360) - 180) * 0.35));
    const teeP = [W * 0.5, H * 0.86], bskP = [W * 0.5 + bend, H * 0.16];
    const ctrl = [W * 0.5 + bend * 0.2, H * 0.5];
    const path = "M" + teeP[0] + " " + teeP[1] + " Q" + ctrl[0] + " " + ctrl[1] + " " + bskP[0] + " " + bskP[1];
    const trees = Array.from({ length: 14 }, (_, i) => { const side = i % 2 ? 1 : -1; const t = 0.12 + rnd(i) * 0.75; const y = H * 0.9 - t * H * 0.74; const cx = W * 0.5 + bend * t * 0.6; const x = cx + side * (62 + rnd(i + 40) * 70); const r = 10 + rnd(i + 80) * 12; return { x, y, r, g: 0.55 + rnd(i + 120) * 0.35 }; });
    const chip = { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" };
    return (
      <Portal><div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 65, background: "rgba(10,16,13,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-pop" style={{ width: "100%", maxWidth: 380, maxHeight: "94vh", overflowY: "auto", borderRadius: 22, background: "#f3eedc", border: "6px solid #1f4d33", boxShadow: "0 30px 70px -20px rgba(0,0,0,.6)" }}>
          <div style={{ display: "flex" }}>
            <div style={{ width: 118, flexShrink: 0, padding: "16px 10px", borderRight: "4px solid #1f4d33", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={Object.assign({}, chip, { fontSize: 13, color: "#1f4d33", lineHeight: 1.05 })}>{course && course.name ? course.name : "Hole"}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 84, lineHeight: .95, color: "#b3261e", marginTop: 10 }}>{hole + 1}</div>
              <div style={{ width: "80%", height: 3, background: "#1f4d33", margin: "12px 0" }} />
              <div style={Object.assign({}, chip, { fontSize: 22, color: "#1f4d33" })}>{shown ? shown + " ft" : "— ft"}</div>
              <div style={{ width: "80%", height: 3, background: "#1f4d33", margin: "10px 0" }} />
              <div style={Object.assign({}, chip, { fontSize: 20, color: "#1f4d33" })}>Par {par}</div>
              {measured ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "#5a6d61", marginTop: 8 }}>GPS {measured} ft</div> : null}
            </div>
            <div style={{ flex: 1, minWidth: 0, position: "relative", display: "flex" }}>

              {tee && basket && mode !== "card" ? <HoleMap tee={tee} basket={basket} doglegs={geo && geo.doglegs} pos={pos} hole={hole} /> :
              <svg viewBox={"0 0 " + W + " " + H} width="100%" style={{ display: "block", background: "#8cc26b" }}>
                <defs><radialGradient id="gfair" cx="50%" cy="50%" r="70%"><stop offset="0%" stopColor="#a9d47f" /><stop offset="100%" stopColor="#8cc26b" /></radialGradient></defs>
                <rect width={W} height={H} fill="url(#gfair)" />
                <path d={path} stroke="#c9e3a7" strokeWidth={118} fill="none" strokeLinecap="round" opacity=".9" />
                <path d={path} stroke="#b7d98f" strokeWidth={90} fill="none" strokeLinecap="round" />
                <path d={"M" + (teeP[0] - 60) + " " + teeP[1] + " L" + (teeP[0] - 110) + " " + (teeP[1] + 10)} stroke="#e6d9b4" strokeWidth={14} fill="none" strokeLinecap="round" />
                {trees.map((t, i) => <g key={i}><circle cx={t.x} cy={t.y + 3} r={t.r} fill="#000" opacity=".12" /><circle cx={t.x} cy={t.y} r={t.r} fill={"rgba(32,97,52," + t.g + ")"} /><circle cx={t.x - t.r * .35} cy={t.y - t.r * .3} r={t.r * .45} fill="rgba(90,160,90,.55)" /></g>)}
                <path d={path} stroke="#fff" strokeWidth={2} strokeDasharray="5 9" fill="none" opacity=".7" />
                <rect x={teeP[0] - 14} y={teeP[1] - 10} width={28} height={40} rx={4} fill="#1f4d33" />
                <rect x={teeP[0] - 10} y={teeP[1] - 6} width={20} height={32} rx={3} fill="#3b7a52" />
                <g transform={"translate(" + bskP[0] + " " + bskP[1] + ")"}>
                  <line x1={0} y1={0} x2={0} y2={36} stroke="#444" strokeWidth={3} />
                  <path d="M-16 -2 L16 -2 L12 16 L-12 16 Z" fill="#f4f1ea" stroke="#333" strokeWidth={2} />
                  <line x1={-16} y1={-2} x2={16} y2={-2} stroke="#333" strokeWidth={3} />
                  {[-10, -5, 0, 5, 10].map((x) => <line key={x} x1={x * 1.4} y1={-2} x2={x} y2={16} stroke="#999" strokeWidth={1} />)}
                </g>
                {toBasket != null && pos && basket ? <text x={W / 2} y={H - 14} textAnchor="middle" fontFamily="monospace" fontSize={13} fontWeight="800" fill="#1f4d33">{toBasket} ft to basket</text> : null}
              </svg>}
            </div>
          </div>
          <div style={{ padding: "10px 14px 12px", background: "#f3eedc", borderTop: "4px solid #1f4d33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {tee && basket ? (
                <div style={{ display: "flex", padding: 3, background: "rgba(31,77,51,.12)", borderRadius: 12, flexShrink: 0 }}>
                  {[["card", "Card"], ["sat", "Satellite"]].map(([m, l]) => <button key={m} onClick={() => setMode(m)} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "none", background: (mode === m) ? "#1f4d33" : "transparent", color: (mode === m) ? "#f3eedc" : "#1f4d33", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13 }}>{l}</button>)}
                </div>
              ) : <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "#5a6d61" }}>{geo === null ? "Loading map…" : "No satellite map for this hole yet"}</div>}
              <div style={{ flex: 1, minWidth: 0, textAlign: "right", fontFamily: "var(--font-sans)", fontSize: 12, color: "#5a6d61" }}>{pos && basket && toBasket != null ? toBasket + " ft out" : ""}</div>
              <button onClick={onClose} aria-label="Close" style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "transparent", color: "#1f4d33", cursor: "pointer", fontSize: 22, flexShrink: 0 }}>×</button>
            </div>
            {course && course.hole_notes && course.hole_notes[String(hole + 1)] ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "#1f4d33", marginTop: 8, lineHeight: 1.4 }}>{course.hole_notes[String(hole + 1)]}</div> : null}
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setFix((v) => !v)} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "#5a6d61", padding: 0, textDecoration: "underline" }}>{fix ? "Hide map tools" : (tee && basket ? "Pins look wrong? Fix the map" : "Add this hole to the map")}</button>
              {fix ? (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => doMark("tee")} disabled={!!busy} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #1f4d33", background: "transparent", color: "#1f4d33", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5 }}>{busy === "tee" ? "Marking…" : "I'm on the tee — mark it"}</button>
                  <button onClick={() => doMark("basket")} disabled={!!busy} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid #1f4d33", background: "transparent", color: "#1f4d33", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5 }}>{busy === "basket" ? "Marking…" : "I'm at the basket — mark it"}</button>
                </div>
              ) : null}
              {err ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "#b3261e", marginTop: 6 }}>{err}</div> : null}
            </div>
          </div>
        </div>
      </div></Portal>
    );
  }
  // v553 — save-state truth: what the cloud and this phone actually have (audit 3.2).
  function SyncState() {
    const [s, setS] = React.useState(() => (window.ChainsRounds && ChainsRounds.sync ? Object.assign({}, ChainsRounds.sync()) : null));
    React.useEffect(() => { const on = (e) => setS(Object.assign({}, e.detail)); window.addEventListener("chains:sync", on); return () => window.removeEventListener("chains:sync", on); }, []);
    if (!s) return null;
    const online = typeof navigator === "undefined" || navigator.onLine !== false;
    let txt, col = "var(--text-muted)";
    if (s.localFail) { txt = "Not saved on this phone — storage is full"; col = "var(--score-over, #c23a33)"; }
    else if (!online) { txt = "Offline — saved on this phone, syncs when you're back"; col = "var(--score-over, #c23a33)"; }
    else if (s.failed > 0) { txt = "Not synced — " + s.failed + (s.failed === 1 ? " change" : " changes") + " refused; retries on your next tap"; col = "var(--score-over, #c23a33)"; }
    else if (s.pending > 0) txt = "Saving…";
    else if (s.lastOk) { txt = "Saved · synced"; col = "var(--score-under, #1a7a50)"; }
    else txt = "Saved on this phone";
    return <span style={{ color: col }}>{" · " + txt}</span>;
  }
  function ScoreBoard({ draft, rounds, onDone, onBail, mobile }) {
    const course = draft.course || {};
    const [pars, setPars] = React.useState(() => (course.hole_pars && course.hole_pars.length) ? course.hole_pars.slice() : Array(course.holes || 18).fill(3));
    const [notes, setNotesState] = React.useState(draft.notes || {});
    function adjustPar(delta) { setPars((p) => { const n = p.slice(); n[hole] = Math.max(2, (n[hole] || 3) + delta); parPendingRef.current = Date.now(); if (window.ChainsRounds && window.ChainsRounds.setPars && cloudIdRef.current) { try { window.ChainsRounds.setPars(cloudIdRef.current, n); } catch (e) {} } return n; }); }
    const lens = course.hole_lengths || [];
    const N = pars.length;
    // v494: courses can be signed in a different order than their numbering (Otterburn:
    // 2..9, 1, 10..18). `order` is the walking sequence; hole numbers never change.
    const order = React.useMemo(() => { const po = course.use_play_order === true && Array.isArray(course.play_order) && course.play_order.length === pars.length ? course.play_order.map((n) => n - 1) : null; /* opt-in per course (Will: hole 1 first) */ return po && po.every((i) => i >= 0 && i < pars.length) ? po : Array.from({ length: pars.length }, (_, i) => i); }, [course.id, pars.length]);
    const seqIdx = (h) => Math.max(0, order.indexOf(h));
    const nextOf = (h) => order[Math.min(order.length - 1, seqIdx(h) + 1)];
    const prevOf = (h) => order[Math.max(0, seqIdx(h) - 1)];
    const endHole = draft.endHole != null ? draft.endHole : null; // v517: "front 9" / "back 9" — the round ends here
    const isLast = (h) => seqIdx(h) === order.length - 1 || (endHole != null && h === endHole);
    const isFirst = (h) => seqIdx(h) === 0;
    const [hole, setHole] = React.useState(draft.resumeHole != null ? draft.resumeHole : (draft.startHole != null && draft.startHole > 0 ? draft.startHole : (course.use_play_order === true && Array.isArray(course.play_order) ? course.play_order[0] - 1 : 0)));
    const [scores, setScores] = React.useState(draft.holeScores || {}); // key -> [strokes per hole]
    // v479: the card can grow mid-round (a friend joins from their phone) — cloud players
    // are appended to the draft order. Every phone on the card renders the same round.
    const [liveGroup, setLiveGroup] = React.useState(null);
    const group = liveGroup || draft.group;
    const pendingRef = React.useRef({});      // "key:hole" -> ts of MY last write (echo guard)
    const parPendingRef = React.useRef(0);
    const parsRef = React.useRef(null);
    const ownerRef = React.useRef(draft.owner || null);
    const mine = () => { const o = ownerRef.current; if (!o) return true; if (o === me) return true; try { const u = window.ChainsID && ChainsID.uid && ChainsID.uid(); return !!u && o === u; } catch (e) { return false; } };
    const remoteFinalRef = React.useRef(false);
    const finishRef = React.useRef(null);
    const [social, setSocial] = React.useState(null);   // v484: {cheers, comments, participants, players} from the shared record
    // Stable cloud id for THIS round, reused across incremental saves + finalize so a
    // round is ONE record (not a new one per save). Survives resume via active state.
    const cloudIdRef = React.useRef(draft.cloudId || null);
    // Weather capture (Phase 4 rating input): fetch the course-city conditions ONCE
    // on mount; stored on the round so the Chains rating can credit a tough day.
    const weatherRef = React.useRef(draft.weather || null);
    React.useEffect(() => {
      if (weatherRef.current) return;
      const city = (draft.course && (draft.course.city || draft.course.name)) || null;
      if (!city) return;
      let alive = true;
      fetch("https://wttr.in/" + encodeURIComponent(city) + "?format=j1", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
          if (!alive) return; const cur = (j.current_condition || [])[0]; if (!cur) return;
          weatherRef.current = {
            windMph: Math.round(Number(cur.windspeedMiles) || (Number(cur.windspeedKmph) || 0) * 0.621),
            precipMm: Number(cur.precipMM) || 0,
            tempF: cur.temp_F != null ? Number(cur.temp_F) : (cur.temp_C != null ? Math.round(Number(cur.temp_C) * 9 / 5 + 32) : null),
            desc: ((cur.weatherDesc || [{}])[0] || {}).value || null,
          };
        }).catch(() => {});
      return () => { alive = false; };
    }, []);
    // Auto-save the in-progress round so closing the phone mid-round never loses it.
    React.useEffect(() => {
      try { localStorage.setItem("chains_play_active", JSON.stringify({ course: Object.assign({}, draft.course, { hole_pars: pars }), group: group, holeScores: scores, resumeHole: hole, invId: draft.invId || null, cloudId: cloudIdRef.current, notes: notes, format: draft.format || "singles", handicaps: draft.handicaps || {}, weather: weatherRef.current || null, owner: draft.owner || null, ts: Date.now() })); } catch (e) {}
    }, [scores, hole, pars, notes]);
    // v479 SHARED ROUND: one cloud record, created the moment scoring starts, and EVERY
    // phone on the card subscribes to it. Scores travel per cell (setStroke -> setCell),
    // so the old "owner saves the whole record every 700ms" — which silently erased a
    // friend's entries — is gone. Cloud is the source of truth; a cell I tapped in the
    // last 4s keeps my value until my own write echoes back.
    parsRef.current = pars;
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.available || !window.ChainsRounds.available()) return;
      const courseCtx = Object.assign({}, draft.course, { hole_pars: pars });
      if (!cloudIdRef.current) {
        cloudIdRef.current = window.ChainsRounds.start({ course: courseCtx, group: group, scores: scores, pars: pars, weather: weatherRef.current });
        try { const a = JSON.parse(localStorage.getItem("chains_play_active") || "{}"); a.cloudId = cloudIdRef.current; localStorage.setItem("chains_play_active", JSON.stringify(a)); } catch (e) {}
      }
      const id = cloudIdRef.current;
      if (!window.ChainsRounds.watchRound) return;
      const toArr = window.ChainsRounds.toArr || ((x) => Array.isArray(x) ? x : []);
      const unsub = window.ChainsRounds.watchRound(id, (rec) => {
        if (!rec || !rec.players) return;
        if (rec.ownerKey || rec.owner) ownerRef.current = rec.ownerKey || rec.owner;
        setSocial((cur) => { const nc = JSON.stringify(rec.cheers || null), nm = JSON.stringify(rec.comments || null); if (cur && cur._c === nc && cur._m === nm) return cur; return { cheers: rec.cheers || null, comments: rec.comments || null, participants: rec.participants || null, players: rec.players || null, _c: nc, _m: nm }; });
        const keys = Object.keys(rec.players);
        setLiveGroup((cur) => {
          const base = cur || draft.group || [];
          const have = {}; base.forEach((g) => { have[g.id] = 1; });
          const add = keys.filter((k) => !have[k]).map((k) => ({ id: k, name: rec.players[k].name || k, color: rec.players[k].disc, guest: /^guest/.test(k) }));
          return add.length ? base.concat(add) : (cur || base);
        });
        const now = Date.now();
        setScores((s) => {
          let changed = false; const n = Object.assign({}, s);
          keys.forEach((k) => {
            const remote = toArr(rec.players[k].holeScores); const local = (n[k] || []).slice(); let ch = false;
            const L = Math.max(remote.length, local.length);
            for (let h = 0; h < L; h++) {
              const rv = remote[h] == null ? null : remote[h], lv = local[h] == null ? null : local[h];
              if (rv === lv) continue;
              const pd = pendingRef.current[k + ":" + h]; if (pd && now - pd < 4000) continue;
              local[h] = rv; ch = true;
            }
            if (ch) { n[k] = local; changed = true; }
          });
          return changed ? n : s;
        });
        if (rec.course && rec.course.pars && now - parPendingRef.current > 4000) {
          const rp = toArr(rec.course.pars); const cp = parsRef.current || [];
          if (rp.length && rp.some((v, i) => v != null && v !== cp[i])) setPars(cp.map((v, i) => rp[i] != null ? rp[i] : v));
        }
        if (rec.status === "final" && !remoteFinalRef.current) { remoteFinalRef.current = true; if (finishRef.current) setTimeout(() => finishRef.current(true), 0); }
      });
      return unsub;
    }, []);
    const keyOf = (g) => g.id;
    const rawStroke = (g, h) => { const arr = scores[keyOf(g)]; return arr && arr[h] != null ? arr[h] : null; };
    const [warn, setWarn] = React.useState(false);
    const [parEdit, setParEdit] = React.useState(false);
    const [noteOpen, setNoteOpen] = React.useState(false);
    const [fixCell, setFixCell] = React.useState(null); // v478: cell tapped in the group card (player x hole) being corrected
    React.useEffect(() => {
      if (!window.ChainsRounds || !window.ChainsRounds.setNotes || !cloudIdRef.current) return;
      const t = setTimeout(() => { try { window.ChainsRounds.setNotes(cloudIdRef.current, notes); } catch (e) {} }, 700);
      return () => clearTimeout(t);
    }, [notes]);
    const jump = (i) => { setWarn(false); setHole(Math.max(0, Math.min(N - 1, i))); setFixCell(null); };
    function setStroke(g, h, v) {
      const nv = Math.max(1, v);
      setScores((s) => { const n = Object.assign({}, s); const arr = (n[keyOf(g)] || []).slice(); arr[h] = nv; n[keyOf(g)] = arr; return n; });
      if (window.ChainsRounds && window.ChainsRounds.setCell && cloudIdRef.current) {
        pendingRef.current[keyOf(g) + ":" + h] = Date.now();
        const arr = (scores[keyOf(g)] || []).slice(); arr[h] = nv;
        try { window.ChainsRounds.setCell(cloudIdRef.current, keyOf(g), h, nv, pars, arr, liveSummary(arr, keyOf(g))); } catch (e) {}
      }
      // Ace auto-detect: a 1 on a par-3+ hole, logged by ME for MY own card → shared feed + crew ping.
      // v511: wait 8 s before telling the crew (a mis-tap fixed right away never goes out), and if a
      // logged 1 is later changed, pull the ace back out of the feed.
      if (me && keyOf(g) === me && window.ChainsAces) {
        const prev = (scores[keyOf(g)] || [])[h];
        const tkey = keyOf(g) + ":" + h;
        if (aceTimerRef.current[tkey]) { clearTimeout(aceTimerRef.current[tkey]); delete aceTimerRef.current[tkey]; }
        if (nv === 1 && pars[h] >= 3) {
          aceTimerRef.current[tkey] = setTimeout(() => { delete aceTimerRef.current[tkey]; try { if ((scoresRef.current[keyOf(g)] || [])[h] === 1) window.ChainsAces.log({ course: course.name, hole: h + 1 }); } catch (e) {} }, 8000);
        } else if (prev === 1 && window.ChainsAces.retract) {
          try { window.ChainsAces.retract({ course: course.name, hole: h + 1 }); } catch (e) {}
        }
      }
    }
    const toParThru = (g) => { const arr = scores[keyOf(g)] || []; let tp = 0; for (let i = 0; i < N; i++) { if (arr[i] != null) tp += arr[i] - pars[i]; } return tp; };
    // Live-now digest for the friends feed: max thru + leader to-par across the card.
    const liveSummary = (arr, k) => { let thru = 0, lead = null; const names = [], keys = []; group.forEach((gg) => { const a = keyOf(gg) === k ? arr : (scores[keyOf(gg)] || []); let tp = 0, t = 0; for (let i = 0; i < N; i++) { if (a[i] != null) { tp += a[i] - pars[i]; t = i + 1; } } if (t > thru) thru = t; if (t > 0 && (lead == null || tp < lead)) lead = tp; names.push(gg.name); keys.push(keyOf(gg)); }); return { thru: thru, toPar: lead == null ? 0 : lead, players: names, keys: keys }; };
    const me = window.ChainsID && ChainsID.whoami();
    const meKey = me || (group[0] && group[0].id);
    const holeComplete = group.every((g) => (scores[keyOf(g)] || [])[hole] != null);
    const par = pars[hole];
    // v510 score pad: who the pad is scoring (defaults to me / first player), and the 8+ expansion
    const [activeKey, setActiveKey] = React.useState(() => { const g0 = group.find((x) => x.id === me) || group[0]; return g0 ? g0.id : null; });
    // v515: who owns each hole here right now + what I need to shoot to take it (my last 4 plays on the hole + this one)
    const [owners, setOwners] = React.useState(null);
    const myPast = React.useMemo(() => { const out = []; try { Object.values(rounds || {}).filter((r) => r && r.status !== "open" && r.hole_scores && r.hole_scores[me] && String(r.course_id) === String(course.id)).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 4).forEach((r) => { r.hole_scores[me].forEach((v, i) => { if (v != null) (out[i] = out[i] || []).push(v); }); }); } catch (e) {} return out; }, [rounds, me, course && course.id]);
    React.useEffect(() => { let alive = true; try { const d = cloudDb(); if (!d || course.id == null) return; d.ref("territory/" + String(course.id).replace(/[.#$\[\]\/]/g, "_") + "/holes").get().then((snap) => { if (alive) setOwners(snap.val() || {}); }).catch(() => { if (alive) setOwners({}); }); } catch (e) { setOwners({}); } return () => { alive = false; }; }, [course && course.id]);
    const takeInfo = (h) => {
      if (!owners || !me) return null;
      const o = owners[h + 1] || null; const past = (myPast[h] || []).slice(0, 4); const n = past.length + 1; const sum = past.reduce((a, b) => a + b, 0);
      if (o && o.key === me) return { mine: true, owner: o, need: null };
      if (!o) return { mine: false, owner: null, need: null, open: true };
      // need x with (sum + x) / n < o.avg  →  x < o.avg * n - sum ; ties go to more plays, so strictly less
      const need = Math.floor(o.avg * n - sum - 1e-9); const maxNeed = need >= 1 ? need : null;
      return { mine: false, owner: o, need: maxNeed };
    };
    const [padMore, setPadMore] = React.useState(false);
    const aceTimerRef = React.useRef({});
    const scoresRef = React.useRef(scores); scoresRef.current = scores;
    // v511: height of the app's bottom tab bar (portaled nav at body level) so the hole bar sits right above it
    const [navBottom, setNavBottom] = React.useState(0);
    React.useEffect(() => {
      const measure = () => { try { const n = [...document.body.children].find((el) => el.tagName === "NAV" && getComputedStyle(el).position === "fixed"); setNavBottom(n ? Math.round(n.getBoundingClientRect().height) : 0); } catch (e) {} };
      measure(); const t = setTimeout(measure, 400); window.addEventListener("resize", measure);
      return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
    }, []);
    React.useEffect(() => { // new hole: start the pad on the first player without a score (me first)
      const firstOpen = group.find((x) => x.id === me && (scores[x.id] || [])[hole] == null) || group.find((x) => (scores[x.id] || [])[hole] == null) || group.find((x) => x.id === me) || group[0];
      if (firstOpen) setActiveKey(firstOpen.id); setPadMore(false);
    }, [hole]);
    function padTap(g, v) {
      tap(g, hole, v);
      try { if (g.id === me) { const ti = takeInfo(hole); if (ti && !ti.mine && ((ti.open && v <= pars[hole]) || (ti.need != null && v <= ti.need))) { const k = "take:" + hole; if (cheerKeyRef.current[k] !== v) { cheerKeyRef.current[k] = v; setTimeout(() => setCheer({ label: "Hole " + (hole + 1) + " is yours", sub: ti.owner ? "Took it from " + __fn(ti.owner.name) + " — keep it" : "First to claim it", kind: "take", key: Date.now() }), v - pars[hole] <= -1 ? 1600 : 0); } } } } catch (e) {}
      if (group.length > 1) { // move the pad to the next player still unscored on this hole
        const i = group.findIndex((x) => x.id === g.id);
        const rest = group.slice(i + 1).concat(group.slice(0, i)).find((x) => (scores[x.id] || [])[hole] == null);
        if (rest) setActiveKey(rest.id);
      }
      setWarn(false);
    }
    const finish = (fromRemote) => {
      // Record only scores the player ACTUALLY entered — never invent a par.
      // Blank holes (skipped, or round ended early) stay null.
      const totals = {}, holeScores = {};
      group.forEach((g) => {
        const arr = scores[keyOf(g)] || [];
        let tp = 0; const hs = [];
        for (let i = 0; i < N; i++) { const s = arr[i] != null ? arr[i] : null; if (s != null) tp += s - pars[i]; hs.push(s); }
        totals[keyOf(g)] = tp; holeScores[keyOf(g)] = hs;
      });
      try { localStorage.removeItem("chains_play_active"); } catch (e) {}
      // Finalize the SAME cloud record (status final, drop from liveRounds). When another
      // phone on the card already finished it, don't re-write - just close out here.
      if ((!fromRemote || mine()) && window.ChainsRounds && cloudIdRef.current) {
        try { window.ChainsRounds.finalize({ id: cloudIdRef.current, course: Object.assign({}, course, { hole_pars: pars }), group: group, scores: scores, pars: pars, weather: weatherRef.current, status: "final" }); } catch (e) {}
      }
      onDone({ course, group, scores: totals, holeScores, pars, lens, weather: weatherRef.current, format: draft.format || "singles", handicaps: draft.handicaps || {}, cloudId: cloudIdRef.current });
    };
    finishRef.current = finish;
    /* ===================== v488 scoring screen =====================
       One job per screen. Nothing on this screen changes size when you tap, so a
       thumb never lands somewhere new: fixed-size steppers, a reserved slot for
       the "no score" note, the scorecard lives in its own view, and the hole strip
       scrolls itself (horizontally only - never the page). */
    const [view, setView] = React.useState("score");      // "score" | "card"
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [addOpen, setAddOpen] = React.useState(false);
    const [teeOrder, setTeeOrder] = React.useState(true);
    const [cheer, setCheer] = React.useState(null);        // {label, sub, kind, key}
    const [mapOpen, setMapOpen] = React.useState(false);
    const [showMap, setShowMap] = React.useState(() => { try { return localStorage.getItem("chains_play_showmap") === "1"; } catch (e) { return false; } });
    const [showCard, setShowCard] = React.useState(() => { try { return localStorage.getItem("chains_play_showcard") !== "0"; } catch (e) { return true; } });
    const toggleCard = () => setShowCard((v) => { try { localStorage.setItem("chains_play_showcard", v ? "0" : "1"); } catch (e) {} return !v; });
    const toggleMap = () => setShowMap((v) => { try { localStorage.setItem("chains_play_showmap", v ? "0" : "1"); } catch (e) {} return !v; });
    const cheerKeyRef = React.useRef({});
    const stripRef = React.useRef(null);
    const totalHoleStrokes = (g) => { const arr = scores[keyOf(g)] || []; let t = 0; for (let i = 0; i < N; i++) if (arr[i] != null) t += arr[i]; return t; };
    const thruOf = (g) => (scores[keyOf(g)] || []).filter((v) => v != null).length;
    // Keep the current hole centred in the strip - horizontal scroll on the strip
    // element only (scrollIntoView could drag the page vertically = a "jump").
    React.useEffect(() => {
      const el = stripRef.current; if (!el) return;
      const chip = el.querySelector('[data-h="' + hole + '"]'); if (!chip) return;
      const target = chip.offsetLeft - el.clientWidth / 2 + chip.offsetWidth / 2;
      try { el.scrollTo({ left: Math.max(0, target), behavior: "smooth" }); } catch (e) { el.scrollLeft = Math.max(0, target); }
    }, [hole, view]);
    React.useEffect(() => { if (!cheer) return; const t = setTimeout(() => setCheer(null), cheer.kind === "ace" ? 3200 : cheer.kind === "eagle" || cheer.kind === "take" ? 2000 : 1500); return () => clearTimeout(t); }, [cheer]);
    // Celebrate a birdie-or-better the moment it's tapped on the CURRENT hole (edits in
    // the scorecard don't re-fire). Streak = consecutive holes under par ending here.
    function tap(g, h, v) {
      const nv = Math.max(1, v);
      setStroke(g, h, nv);
      if (h !== hole) return;
      const d = nv - pars[h]; if (d > -1) return;
      const k = keyOf(g) + ":" + h; if (cheerKeyRef.current[k] === nv) return; cheerKeyRef.current[k] = nv;
      const arr = (scores[keyOf(g)] || []).slice(); arr[h] = nv;
      let streak = 0; for (let i = h; i >= 0; i--) { if (arr[i] != null && arr[i] - pars[i] <= -1) streak++; else break; }
      const kind = nv === 1 ? "ace" : d <= -3 ? "albatross" : d === -2 ? "eagle" : "birdie";
      const label = kind === "ace" ? "ACE!" : kind === "albatross" ? "ALBATROSS!" : kind === "eagle" ? "EAGLE!" : "BIRDIE!";
      const first = (g.name || "").split(" ")[0];
      const sub = streak >= 2 ? first + " · " + streak + " in a row" : (group.length > 1 ? first : (kind === "birdie" ? ["Chains!", "Clean.", "Dialed in.", "Money."][Math.floor(Math.random() * 4)] : "Hole " + (h + 1)));
      setCheer({ label, sub, kind, key: Date.now() });
      try { if (navigator.vibrate) navigator.vibrate(kind === "birdie" ? 30 : [40, 50, 80]); } catch (e) {}
    }
    function addToCard(p) {
      const key = p.id || ("guest-" + Date.now().toString(36));
      const row = { id: key, name: p.name, color: p.color || p.disc || "#9CA3AF", guest: !!p.guest };
      setLiveGroup((cur) => { const base = cur || draft.group || []; if (base.some((x) => x.id === key)) return base; return base.concat([row]); });
      if (window.ChainsRounds && window.ChainsRounds.addPlayer && cloudIdRef.current) { try { window.ChainsRounds.addPlayer(cloudIdRef.current, row, pars); } catch (e) {} }
      try { window.ChainsToast && ChainsToast.show(p.name + " added to the card.", "info"); } catch (e) {}
    }
    const discardRound = () => { ChainsConfirm.show({ title: mine() ? "Discard this round?" : "Leave this round?", message: mine() ? "Nothing will be saved" + (group.length > 1 ? " — for anyone on the card." : ".") : "The round keeps going for everyone else; it just leaves your history.", confirmLabel: mine() ? "Discard" : "Leave", danger: true }).then((ok) => { if (!ok) return;
          // #43-race: a tap-score-then-instantly-discard can beat the incremental-save
          // effect to the punch, leaving cloudIdRef.current null even though a score
          // already exists locally. Don't trust the ref alone -- if any score was
          // entered, mint/adopt the SAME id ourselves (identical to the effect's own
          // idempotent start() call) so remove() always has a real id to delete.
          if (!cloudIdRef.current && window.ChainsRounds && window.ChainsRounds.start) {
            const anyScore = Object.keys(scores).some((k) => (scores[k] || []).some((v) => v != null));
            if (anyScore) cloudIdRef.current = window.ChainsRounds.start({ course: Object.assign({}, draft.course, { hole_pars: pars }), group: group, scores: scores, pars: pars, weather: weatherRef.current });
          }
          if (cloudIdRef.current && window.ChainsRounds) { if (mine() && window.ChainsRounds.remove) window.ChainsRounds.remove(cloudIdRef.current); else if (window.ChainsRounds.hideForMe) window.ChainsRounds.hideForMe(cloudIdRef.current); }
          try { localStorage.removeItem("chains_play_active"); } catch (e) {} onBail(); }); };
    const orderedGroup = teeOrder && group.length > 1 ? group.slice().sort((a, b) => toParThru(a) - toParThru(b)) : group;
    const S = {
      bar: { display: "flex", alignItems: "center", gap: 8, padding: "6px 4px" },
      barBtn: { height: 40, minWidth: 40, padding: "0 10px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ace-700)", display: "inline-flex", alignItems: "center", gap: 4, borderRadius: "var(--radius-md)" },
      round: (solid) => ({ width: 50, height: 50, flexShrink: 0, borderRadius: "50%", border: solid ? "none" : "2px solid var(--ace-500)", background: solid ? "var(--ace-500)" : "var(--bg-elevated)", color: solid ? "#fff" : "var(--ace-600)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: solid ? "0 4px 12px -4px var(--ace-500)" : "none" }),
      num: (set, d) => ({ width: 56, flexShrink: 0, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 34, lineHeight: 1, color: !set ? "var(--text-faint)" : d < 0 ? "var(--score-under, #1a7a50)" : d > 0 ? "var(--score-over, #c23a33)" : "var(--text-strong)", background: "transparent", border: "none", cursor: set ? "default" : "pointer", padding: 0, textDecoration: set ? "none" : "underline dotted", textUnderlineOffset: 6 }),
      chip: (cur, d, set) => ({ flexShrink: 0, width: 42, height: 56, boxSizing: "border-box", borderRadius: 12, border: cur ? "2px solid var(--ace-500)" : "1px solid var(--border-subtle)", background: cur ? "var(--ace-50, #FFF3EC)" : "var(--bg-elevated)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 0, color: cur ? "var(--ace-700)" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }),
      dot: (d, set) => ({ width: 18, height: 18, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 10.5, color: !set ? "transparent" : d !== 0 ? "#fff" : "var(--text-strong)", background: !set ? "transparent" : d <= -2 ? "var(--gold-500, #d4a017)" : d < 0 ? "var(--score-under, #1a7a50)" : d > 0 ? "var(--score-over, #c23a33)" : "var(--bg-sunken)", border: !set ? "1px dashed var(--border-default)" : "none" }),
      menuRow: (danger) => ({ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 16px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 15, color: danger ? "var(--clay-600, #b4452f)" : "var(--text-strong)" }),
    };
    const meTp = me ? toParThru({ id: me }) : null;
    const headline = "Thru " + thruOf({ id: meKey }) + (meTp != null ? " · You " + fmtPar(meTp) : "");
    const cheerEl = cheer ? (
      <div key={cheer.key} className="gt-cheer" style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {cheer.kind !== "birdie" && Array.from({ length: cheer.kind === "ace" ? 42 : 22 }, (_, i) => <span key={i} className="gt-confetti" style={{ left: (3 + (i * 37) % 94) + "%", animationDelay: (i % 7) * 0.09 + "s", background: ["var(--ace-500)", "var(--fairway-500)", "var(--gold-500, #d4a017)", "#fff", "var(--score-under, #1a7a50)"][i % 5], transform: "rotate(" + (i * 53) % 360 + "deg)" }} />)}
        <div className="gt-pop" style={{ textAlign: "center", padding: "22px 34px", borderRadius: 24, background: cheer.kind === "birdie" ? "var(--score-under, #1a7a50)" : cheer.kind === "ace" ? "var(--gold-500, #d4a017)" : "var(--fairway-700)", color: "#fff", boxShadow: "0 24px 60px -20px rgba(0,0,0,.55)" }}>
          <div style={{ lineHeight: 1, display: "inline-flex", color: cheer.kind === "ace" ? "var(--ace-500)" : "var(--fairway-500)" }}>{cheer.kind === "ace" ? <Icons.Star size={44} /> : cheer.kind === "take" ? <Icons.Pin size={44} /> : <Icons.Flag size={44} />}</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 38, lineHeight: 1.05, marginTop: 6 }}>{cheer.label}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, opacity: .92, marginTop: 4 }}>{cheer.sub}</div>
        </div>
      </div>
    ) : null;
    // ---- scorecard view (tap any cell to fix it) ----
    const cardView = (() => {
      const half = N >= 12 ? Math.ceil(N / 2) : N;
      const cellW = mobile ? 30 : 34;
      const sum = (arr, a, b) => { let s = 0, any = false; for (let i = a; i < b; i++) if (arr[i] != null) { s += arr[i]; any = true; } return any ? s : null; };
      const tpOf = (arr, a, b) => { let s = 0, any = false; for (let i = a; i < b; i++) if (arr[i] != null) { s += arr[i] - pars[i]; any = true; } return any ? s : null; };
      const th = { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 10, color: "var(--text-faint)", textAlign: "center", padding: "2px 0", textTransform: "uppercase", letterSpacing: ".04em" };
      const tdTot = { fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 12.5, color: "var(--text-strong)", textAlign: "center", padding: "0 4px", background: "var(--bg-sunken)", borderRadius: 6 };
      const headRow = (a, b, label) => (
        <tr key={"h" + a}>
          <th style={Object.assign({}, th, { position: "sticky", left: 0, background: "var(--bg-elevated)", zIndex: 2, textAlign: "left", paddingLeft: 4 })}>{label}</th>
          {Array.from({ length: b - a }, (_, k) => <th key={k} style={Object.assign({}, th, { minWidth: cellW, color: a + k === hole ? "var(--ace-600)" : th.color })}>{a + k + 1}</th>)}
          <th style={th}>{a === 0 ? "Out" : "In"}</th>
          {b === N && <th style={th}>Tot</th>}
          {b === N && a > 0 && <th style={th}>+/-</th>}
        </tr>
      );
      const distRow = (a, b) => lens && lens.some((x) => x) ? (
        <tr key={"d" + a}>
          <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", zIndex: 2, fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)", paddingLeft: 4 }}>Dist</td>
          {Array.from({ length: b - a }, (_, k) => <td key={k} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-faint)", textAlign: "center" }}>{lens[a + k] || ""}</td>)}
          <td /><td />{b === N && a > 0 && <td />}
        </tr>
      ) : null;
      const parRow = (a, b) => (
        <tr key={"p" + a}>
          <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", zIndex: 2, fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)", paddingLeft: 4 }}>Par</td>
          {Array.from({ length: b - a }, (_, k) => <td key={k} style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", textAlign: "center" }}>{pars[a + k]}</td>)}
          <td style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", textAlign: "center" }}>{sum(pars, a, b)}</td>
          {b === N && <td style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", textAlign: "center" }}>{a > 0 ? sum(pars, 0, N) : ""}</td>}
          {b === N && a > 0 && <td />}
        </tr>
      );
      const playerRow = (g, a, b) => {
        const arr = scores[keyOf(g)] || [];
        const isMe = keyOf(g) === meKey;
        return (
          <tr key={keyOf(g) + "-" + a}>
            <td style={{ position: "sticky", left: 0, background: "var(--bg-elevated)", zIndex: 2, paddingLeft: 4, paddingRight: 6, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12, color: isMe ? "var(--ace-600)" : "var(--text-strong)", whiteSpace: "nowrap", maxWidth: 82, overflow: "hidden", textOverflow: "ellipsis" }}>{__fn(g.name)}</td>
            {Array.from({ length: b - a }, (_, k) => {
              const h = a + k; const v = arr[h]; const d = v != null ? v - pars[h] : null;
              const cur = h === hole; const fix = fixCell && fixCell.h === h && fixCell.k === keyOf(g);
              const bg = d == null ? "transparent" : d <= -2 ? "var(--gold-500, #d4a017)" : d < 0 ? "var(--score-under, #1a7a50)" : d > 0 ? "var(--score-over, #c23a33)" : "var(--bg-sunken)";
              const fg = d == null ? "var(--text-faint)" : d !== 0 ? "#fff" : "var(--text-strong)";
              return (
                <td key={h} style={{ padding: 1 }}>
                  <button onClick={() => setFixCell(fix ? null : { h: h, k: keyOf(g), name: g.name, g: g })} aria-label={g.name + " hole " + (h + 1)}
                    style={{ width: "100%", minWidth: cellW - 2, height: 32, borderRadius: 8, border: fix ? "2px solid var(--ace-500)" : cur ? "1px solid var(--ace-500)" : "1px solid var(--border-subtle)", background: bg, color: fg, cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 13, padding: 0, lineHeight: 1 }}>
                    {v == null ? "·" : v}
                  </button>
                </td>
              );
            })}
            <td style={tdTot}>{sum(arr, a, b) == null ? "—" : sum(arr, a, b)}</td>
            {b === N && <td style={{ ...tdTot, color: a > 0 ? "var(--text-strong)" : parColor(tpOf(arr, 0, N)) }}>{a > 0 ? (sum(arr, 0, N) == null ? "—" : sum(arr, 0, N)) : fmtPar(tpOf(arr, 0, N) == null ? 0 : tpOf(arr, 0, N))}</td>}
            {b === N && a > 0 && <td style={{ ...tdTot, color: parColor(tpOf(arr, 0, N)) }}>{tpOf(arr, 0, N) == null ? "E" : fmtPar(tpOf(arr, 0, N))}</td>}
          </tr>
        );
      };
      const halves = N > half ? [[0, half], [half, N]] : [[0, N]];
      return (
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "10px 8px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, padding: "0 4px" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-muted)" }}>Tap any score to fix it</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 13, color: parColor(toParThru({ id: meKey })) }}>{"You " + fmtPar(toParThru({ id: meKey }))}</span>
          </div>
          {/* The editor sits ABOVE the table in a fixed-height slot, so opening it never pushes the table (or your thumb) around. */}
          <div style={{ minHeight: 64, marginBottom: 6 }}>
            {fixCell ? (() => {
              const g = fixCell.g; const h = fixCell.h; const raw = rawStroke(g, h); const isSet = raw != null; const p = pars[h];
              const val = isSet ? raw : p; const d = val - p;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--ace-50, #FFF3EC)", border: "1px solid var(--ace-200, #f5ddd1)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(g.name || "Player").split(" ")[0]} · hole {h + 1} <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>par {p}</span></div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{isSet ? (d === 0 ? "Par" : d === -1 ? "Birdie" : d === -2 ? "Eagle" : d < -2 ? "Ace!" : d === 1 ? "Bogey" : d === 2 ? "Double" : "+" + d) : "No score yet"}</div>
                  </div>
                  <button onClick={() => setStroke(g, h, isSet ? raw - 1 : p - 1)} style={Object.assign({}, S.round(false), { width: 44, height: 44, fontSize: 24 })}>−</button>
                  <span style={{ width: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, color: !isSet ? "var(--text-faint)" : parColor(d) }}>{isSet ? raw : p}</span>
                  <button onClick={() => setStroke(g, h, isSet ? raw + 1 : p + 1)} style={Object.assign({}, S.round(true), { width: 44, height: 44, fontSize: 24 })}>+</button>
                  <button onClick={() => setFixCell(null)} aria-label="Close" style={{ width: 36, height: 44, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 20, color: "var(--text-faint)" }}>×</button>
                </div>
              );
            })() : <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>Tap a cell below to change it</div>}
          </div>
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
              {halves.map(([a, b], hi) => (
                <tbody key={hi} style={{ borderTop: hi ? "1px solid var(--border-subtle)" : "none" }}>
                  {headRow(a, b, "Hole")}
                  {distRow(a, b)}
                  {parRow(a, b)}
                  {group.map((g) => playerRow(g, a, b))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      );
    })();
    // ---- add-player sheet (friends + guest), usable mid-round ----
    const addSheet = addOpen ? (() => {
      const friendsOk = !!(window.ChainsFriends && ChainsFriends.available && ChainsFriends.available());
      const friends = friendsOk ? ChainsFriends.list().filter((f) => f && f.uid && f.uid !== me && !group.some((g) => g.id === f.uid)).map((f) => { const mm = window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(f.uid) : null; return { id: f.uid, name: (mm && mm.name) || (f.name && f.name !== "Player" ? f.name : f.uid), color: (mm && mm.disc) || f.disc }; }) : [];
      return <GuestAddSheet friends={friends} onAdd={(p) => { addToCard(p); }} onClose={() => setAddOpen(false)} />;
    })() : null;
    // ---- round menu sheet ----
    const menu = menuOpen ? (
      <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 560, maxHeight: "82vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: "22px 22px 0 0", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 10px" }}>
            <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)" }}>Round menu</span>
            <button onClick={() => setMenuOpen(false)} style={S.barBtn}>Done</button>
          </div>
          <button style={S.menuRow()} onClick={() => { setMenuOpen(false); if (!showCard) toggleCard(); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Grid size={20} /></span>Scorecard · fix any score</button>
          <button style={S.menuRow()} onClick={() => { setMenuOpen(false); setMapOpen(true); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Pin size={20} /></span>Hole map · rangefinder · mark tee & basket</button>
          <button style={S.menuRow()} onClick={() => { setMenuOpen(false); setAddOpen(true); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Users size={20} /></span>Add a player to the card</button>
          <button style={S.menuRow()} onClick={() => { setMenuOpen(false); setView("score"); setParEdit(true); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Target size={20} /></span>Adjust par for hole {hole + 1}<span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>Par {par}</span></button>
          <button style={S.menuRow()} onClick={() => { setMenuOpen(false); setView("score"); setNoteOpen(true); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Pin size={20} /></span>{notes[hole] ? "Edit note for hole " + (hole + 1) : "Add a note for hole " + (hole + 1)}</button>
          {group.length > 1 && <button style={S.menuRow()} onClick={() => setTeeOrder((v) => !v)}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Refresh size={20} /></span>Order players by tee position<span style={{ marginLeft: "auto", width: 44, height: 26, borderRadius: 13, background: teeOrder ? "var(--fairway-500)" : "var(--bone-300, #d9d4c7)", position: "relative", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: teeOrder ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></span></button>}
          <button style={S.menuRow()} onClick={() => { setMenuOpen(false); onBail(); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.ChevLeft size={20} /></span>Save & exit · finish later</button>
          {!isLast(hole) && <button style={S.menuRow()} onClick={() => { setMenuOpen(false); ChainsConfirm.show({ title: "Finish partial round?", message: "Holes without a score stay blank. The round is saved as played.", confirmLabel: "Finish round" }).then((ok) => { if (ok) finish(); }); }}><span style={{ width: 22, display: "inline-flex", color: "var(--ace-700)" }}><Icons.Check size={20} /></span>Finish partial round</button>}
          <button style={S.menuRow(true)} onClick={() => { setMenuOpen(false); discardRound(); }}><span style={{ width: 22, display: "inline-flex" }}><Icons.X size={20} /></span>{mine() ? "Discard round" : "Leave round"}</button>
        </div>
      </div>
    ) : null;
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
        <Portal>{cheerEl}{menu}{addSheet}</Portal>
        {mapOpen ? <HoleCard course={course} hole={hole} par={par} len={lens[hole] || null} onClose={() => setMapOpen(false)} /> : null}
        {/* top bar */}
        <div style={S.bar}>
          <button onClick={onBail} style={S.barBtn} aria-label="Save and exit"><Icons.ChevLeft size={18} /> Exit</button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{course.name}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{headline}{group.length > 1 ? (() => { let lead = null; group.forEach((g) => { const tp = toParThru(g); if (lead == null || tp < lead.tp) lead = { name: g.name, tp }; }); return lead ? " · Lead " + __fn(lead.name) + " " + fmtPar(lead.tp) : ""; })() : ""}<SyncState /></div>
          </div>
          <button onClick={() => setMenuOpen(true)} style={S.barBtn} aria-label="Round menu"><span style={{ fontSize: 22, lineHeight: 1 }}>☰</span></button>
        </div>
        {/* hole strip */}
        <div ref={stripRef} className="gt-strip" style={{ display: "flex", gap: 6, overflowX: "auto", overflowY: "hidden", height: 58, boxSizing: "border-box", padding: "2px 2px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {order.map((h) => {
            const mine0 = (scores[meKey] || [])[h]; const set = mine0 != null; const d = set ? mine0 - pars[h] : 0;
            const everyone = group.length > 1 && group.every((g) => (scores[keyOf(g)] || [])[h] != null);
            return (
              <button key={h} data-h={h} onClick={() => jump(h)} aria-label={"Go to hole " + (h + 1)} style={S.chip(h === hole, d, set)}>
                <span>{h + 1}</span>
                <span style={S.dot(d, set)}>{set ? mine0 : ""}</span>
              </button>
            );
          })}
        </div>
        {/* hole header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 4px 0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 30, lineHeight: 1, color: "var(--text-strong)" }}>Hole {hole + 1}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>{order[seqIdx(hole)] === hole && order.some((v, i) => v !== i) ? (seqIdx(hole) + 1) + " of " + N + " in play order" : "of " + N}</span>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-muted)", marginTop: 4 }}>
              {lens[hole] ? <span><b style={{ color: "var(--text-strong)" }}>{lens[hole]}</b> ft · </span> : null}Par <b style={{ color: "var(--text-strong)" }}>{par}</b>{notes[hole] ? <span> · note</span> : null}
            </div>
            {course.hole_notes && course.hole_notes[String(hole + 1)] ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fairway-700)", marginTop: 4, lineHeight: 1.35 }}>{course.hole_notes[String(hole + 1)]}</div> : null}
            {(() => { const ti = takeInfo(hole); if (!ti) return null; return <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "3px 9px", borderRadius: 12, background: ti.mine ? "var(--ace-100, #fdece4)" : "var(--bg-sunken, #eef2ef)", fontFamily: "var(--font-sans)", fontSize: 12, color: ti.mine ? "var(--ace-700, #b3410f)" : "var(--text-body)", fontWeight: 600 }}>{ti.mine ? "You own this hole · " + (Math.round(ti.owner.avg * 10) / 10) + " avg" : ti.open ? "Open hole · par or better claims it" : "Owner: " + __fn(ti.owner.name) + " · " + (Math.round(ti.owner.avg * 10) / 10) + " avg" + (ti.need != null ? " · shoot " + ti.need + " to take it" : " · out of reach this round")}</div>; })()}
          </div>
          <button onClick={toggleMap} aria-label="Toggle map" title="Show the map on this screen" style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid " + (showMap ? "var(--fairway-600)" : "var(--border-default)"), background: showMap ? "var(--fairway-700)" : "var(--bg-elevated)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: showMap ? "#fff" : "var(--fairway-700)", marginRight: 8, flexShrink: 0 }}><Icons.Pin size={18} /></button>

        </div>
        {parEdit && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg-sunken)", borderRadius: "var(--radius-md)" }}>
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Par for hole {hole + 1}</span>
            <button onClick={() => adjustPar(-1)} style={Object.assign({}, S.round(false), { width: 40, height: 40, fontSize: 22 })}>−</button>
            <span style={{ width: 54, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20 }}>{par}</span>
            <button onClick={() => adjustPar(1)} style={Object.assign({}, S.round(true), { width: 40, height: 40, fontSize: 22 })}>+</button>
            <button onClick={() => setParEdit(false)} style={S.barBtn}>Done</button>
          </div>
        )}
        {noteOpen && (
          <div style={{ display: "flex", gap: 8 }}>
            <textarea value={notes[hole] || ""} onChange={(e) => setNotesState((n) => Object.assign({}, n, { [hole]: e.target.value }))} placeholder={"Note for hole " + (hole + 1) + "… (disc, line, wind)"} style={{ flex: 1, minHeight: 56, padding: 10, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", color: "var(--text-strong)", resize: "vertical" }} />
            <button onClick={() => setNoteOpen(false)} style={S.barBtn}>Done</button>
          </div>
        )}
        {showMap && view !== "card" ? <LiveHolePanel course={course} hole={hole} onOpenCard={() => setMapOpen(true)} /> : null}
        {view === "card" ? cardView : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* v517: one self-contained row per player. Nothing moves on its own: tap the number for par,
                − / + to adjust, the floating bar's Next when the hole is done. */}
            {orderedGroup.map((g, idx) => {
              const raw = rawStroke(g, hole), isSet = raw != null, d = isSet ? raw - par : 0;
              const tp = toParThru(g), thru = thruOf(g), isMe = keyOf(g) === meKey;
              const lbl = !isSet ? "tap for par " + par : d === 0 ? "par" : d === -1 ? "birdie" : d === -2 ? "eagle" : d < -2 ? (raw === 1 ? "ace" : "albatross") : d === 1 ? "bogey" : d === 2 ? "double" : d === 3 ? "triple" : d + " over";
              return (
                <div key={keyOf(g)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid " + (isMe ? "var(--ace-200, #f5ddd1)" : "var(--border-subtle)"), borderRadius: "var(--radius-lg)" }}>
                  {group.length > 1 && teeOrder && <span style={{ width: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", textAlign: "center", flexShrink: 0 }}>{idx + 1}</span>}
                  {g.color ? <Avatar name={g.name} color={g.color} size={36} /> : <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--chain-300)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{String(g.name || "?").slice(0, 2).toUpperCase()}</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}{isMe && group.length > 1 ? <span style={{ fontWeight: 500, color: "var(--text-faint)" }}> · you</span> : g.guest ? <span style={{ fontWeight: 500, color: "var(--text-faint)" }}> · guest</span> : null}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: thru ? parColor(tp) : "var(--text-faint)", marginTop: 2, whiteSpace: "nowrap", height: 16, lineHeight: "16px" }}>{thru ? fmtPar(tp) + " (" + totalHoleStrokes(g) + ") thru " + thru : "no holes yet"}</div>
                  </div>
                  <button onClick={() => { if (isSet && raw > 1) tap(g, hole, raw - 1); else if (!isSet) tap(g, hole, par - 1); }} aria-label={"Minus for " + g.name} style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontSize: 22, color: "var(--text-strong)", flexShrink: 0, touchAction: "manipulation" }}>−</button>
                  <button onClick={() => { if (!isSet) tap(g, hole, par); }} aria-label={isSet ? g.name + " score " + raw : "Tap for par " + par + " for " + g.name} style={{ width: 62, height: 52, borderRadius: 12, border: isSet ? "none" : "2px dashed var(--border-default)", background: isSet ? (d < 0 ? "var(--score-under, #1a7a50)" : d === 0 ? "var(--fairway-700)" : "var(--score-over, #c23a33)") : "transparent", color: isSet ? "#fff" : "var(--text-muted)", cursor: isSet ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1, flexShrink: 0, touchAction: "manipulation" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: isSet ? 24 : 18 }}>{isSet ? raw : par}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 8.5, marginTop: 3, opacity: .9 }}>{lbl}</span>
                  </button>
                  <button onClick={() => tap(g, hole, isSet ? raw + 1 : par + 1)} aria-label={"Plus for " + g.name} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: "var(--ace-700)", color: "#fff", cursor: "pointer", fontSize: 22, flexShrink: 0, touchAction: "manipulation" }}>+</button>
                </div>
              );
            })}
            <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", minHeight: 16 }}>{group.every((g) => rawStroke(g, hole) == null) ? "Tap the number for par, or − / + for the score. Nothing moves until you tap Next." : holeComplete ? "Hole " + (hole + 1) + " done — tap Next below." : ""}</div>
          </div>
        )}
        {/* live watchers / cheers strip (unchanged) */}
        {social && cloudIdRef.current ? <LiveChatter id={cloudIdRef.current} rec={social} me={me} compact mobile={mobile} /> : null}
        {/* v511: hole navigation is a floating bar (portaled, sits above the app's bottom tabs) so
            "back a hole / next hole" is always one tap away no matter how far you've scrolled. */}
        <Portal>
          <div style={{ position: "fixed", left: 0, right: 0, bottom: navBottom, zIndex: 84, padding: "8px 12px 10px", background: "var(--bg-page)", borderTop: "1px solid var(--border-subtle)", boxShadow: "0 -8px 24px rgba(0,0,0,.10)" }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div style={{ minHeight: 16, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: "16px", color: warn && !holeComplete ? "var(--score-over, #c23a33)" : "var(--text-muted)" }}>{warn && !holeComplete ? "No score for hole " + (hole + 1) + (group.length > 1 ? " · " + group.filter((g) => rawStroke(g, hole) == null).map((g) => __fn(g.name)).join(", ") : "") : (!isLast(hole) && thruOf(group[0]) >= 1 ? <span>Playing fewer holes? <button onClick={() => { const n = Math.max.apply(null, group.map((g) => thruOf(g))); window.ChainsConfirm.show({ title: "Finish after " + n + " of " + N + " holes?", message: "The round saves as a " + n + "-hole round. Unplayed holes stay blank. You can't add holes afterwards.", confirmLabel: "Finish round" }).then((ok) => { if (ok) finish(); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5, color: "var(--fairway-700)", padding: 0 }}>Finish now</button></span> : "")}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => jump(prevOf(hole))} disabled={isFirst(hole)} aria-label="Previous hole" style={{ flex: 1, height: 52, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: isFirst(hole) ? "default" : "pointer", opacity: isFirst(hole) ? .4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--text-strong)", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 14 }}><Icons.ChevLeft size={20} />{isFirst(hole) ? "Hole " + (hole + 1) : "Hole " + (prevOf(hole) + 1)}</button>
                {warn && !holeComplete
                  ? <button onClick={() => { setWarn(false); !isLast(hole) ? jump(nextOf(hole)) : finish(); }} style={{ flex: 1.4, height: 52, borderRadius: "var(--radius-md)", border: "2px solid var(--score-over, #c23a33)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 14, color: "var(--score-over, #c23a33)" }}>{!isLast(hole) ? "Skip to hole " + (nextOf(hole) + 1) : "Finish anyway"}</button>
                  : !isLast(hole)
                    ? <button onClick={() => { if (!holeComplete) { setWarn(true); return; } jump(nextOf(hole)); }} className="cw-press" style={{ flex: 1.4, height: 52, borderRadius: "var(--radius-md)", border: "none", background: holeComplete ? "var(--ace-700)" : "var(--chain-300)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 15, color: "#fff", boxShadow: holeComplete ? "0 6px 16px -6px var(--ace-500)" : "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{holeComplete ? "Next · Hole " + (nextOf(hole) + 1) : "Score hole " + (hole + 1)}<Icons.ChevRight size={20} /></button>
                    : <button onClick={() => { if (!holeComplete) { setWarn(true); return; } finish(); }} className="cw-press" style={{ flex: 1.4, height: 52, borderRadius: "var(--radius-md)", border: "none", background: "linear-gradient(180deg, var(--fairway-500), var(--fairway-700))", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 15, color: "#fff" }}>Finish round</button>}
              </div>
            </div>
          </div>
        </Portal>
        {/* v507: the scorecard lives under the buttons — always available, tap any score to fix it */}
        {view !== "card" && (
          <div>
            <button onClick={toggleCard} style={{ display: "flex", alignItems: "center", width: "100%", padding: "8px 4px", border: "none", background: "transparent", cursor: "pointer" }}>
              <span style={{ flex: 1, textAlign: "left", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>Scorecard</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>{showCard ? "Hide" : "Show"}</span>
            </button>
            {showCard ? cardView : null}
          </div>
        )}
        <div style={{ height: 110 }} />{/* keeps the scorecard strip clear of the floating hole bar + bottom tabs */}
      </div>
    );
  }
  /* v488: add a player mid-round or at setup — friends first, then a guest by name. */
  function GuestAddSheet({ friends, onAdd, onClose }) {
    const [q, setQ] = React.useState("");
    const [found, setFound] = React.useState(null); // username search results
    const ql = q.trim().toLowerCase();
    const matches = (friends || []).filter((f) => !ql || f.name.toLowerCase().indexOf(ql) >= 0 || String(f.id).indexOf(ql) >= 0);
    React.useEffect(() => {
      if (!ql || ql.length < 2 || !window.ChainsFriends || !ChainsFriends.searchByUsername) { setFound(null); return; }
      let alive = true; const t = setTimeout(() => { ChainsFriends.searchByUsername(ql).then((r) => { if (alive) setFound(r || []); }); }, 250);
      return () => { alive = false; clearTimeout(t); };
    }, [ql]);
    const row = { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 16px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer" };
    const nm = { flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
    const plus = { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--ace-700)" };
    const extra = (found || []).filter((p) => !(friends || []).some((f) => f.id === p.uid));
    return (
      <Portal><div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 560, maxHeight: "84vh", display: "flex", flexDirection: "column", background: "var(--bg-elevated)", borderRadius: "22px 22px 0 0", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "14px 16px 10px" }}>
            <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)" }}>Add to the card</span>
            <button onClick={onClose} style={{ height: 40, padding: "0 10px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ace-700)" }}>Done</button>
          </div>
          <div style={{ padding: "0 16px 10px" }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Friend, username, or a guest's name…" style={{ width: "100%", height: 46, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--bg-sunken)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ overflowY: "auto" }}>
            {matches.length > 0 && <div style={{ padding: "4px 16px 6px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em" }}>Friends</div>}
            {matches.map((f) => (
              <button key={f.id} style={row} onClick={() => { onAdd(f); setQ(""); }}><Avatar name={f.name} color={f.color || f.disc || "#9CA3AF"} size={34} /><span style={nm}>{f.name}</span><span style={plus}>Add</span></button>
            ))}
            {extra.length > 0 && <div style={{ padding: "10px 16px 6px", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em" }}>On Chains</div>}
            {extra.map((p) => (
              <button key={p.uid} style={row} onClick={() => { onAdd({ id: p.uid, name: p.name, color: p.disc }); try { window.ChainsFriends && ChainsFriends.befriend && ChainsFriends.befriend(p.uid); } catch (e) {} setQ(""); }}><Avatar name={p.name} color={p.disc || "#9CA3AF"} size={34} /><span style={nm}>{p.name}<span style={{ fontWeight: 400, color: "var(--text-faint)" }}> @{p.username}</span></span><span style={plus}>Add + friend</span></button>
            ))}
            {ql.length > 0 && (
              <button style={row} onClick={() => { onAdd({ name: q.trim(), guest: true }); setQ(""); }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-sunken)", border: "1px dashed var(--border-default)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 18 }}>+</span>
                <span style={nm}>Add “{q.trim()}” as a guest<div style={{ fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 12, color: "var(--text-faint)" }}>No app needed — you keep their score</div></span>
              </button>
            )}
            {!ql && matches.length === 0 && <div style={{ padding: "18px 16px 24px", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>Type a friend's name, a Chains username, or anyone's name to add them as a guest.</div>}
          </div>
        </div>
      </div></Portal>
    );
  }
  const stepBtn = { width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--text-strong)", lineHeight: 1 };

  /* ============================ TOTAL ENTRY ============================ */
  function TotalEntry({ draft, rounds, onDone, onBail, mobile }) {
    const course = draft.course || {};
    const [tp, setTp] = React.useState({});
    const group = draft.group;
    const v = (g) => tp[g.id] != null ? tp[g.id] : 0;
    const set = (g, val) => setTp((s) => Object.assign({}, s, { [g.id]: val }));
    const finish = () => { const scores = {}; group.forEach((g) => { scores[g.id] = v(g); }); onDone({ course, group, scores, holeScores: null, pars: course.hole_pars || null }); };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FlowHead title="Final scores" sub={course.name} onBack={onBail} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {group.map((g) => {
            const d = v(g);
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                {g.color ? <Avatar name={g.name} color={g.color} size={30} /> : <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--chain-300)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>{g.name.slice(0, 2).toUpperCase()}</span>}
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{g.name}</span>
                <button onClick={() => set(g, d - 1)} className="cw-press" style={stepBtn}>−</button>
                <span style={{ minWidth: 44, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 22, color: parColor(d) }}>{fmtPar(d)}</span>
                <button onClick={() => set(g, d + 1)} className="cw-press" style={stepBtn}>+</button>
              </div>
            );
          })}
        </div>
        <Button variant="accent" full size="lg" onClick={finish}>Save round</Button>
      </div>
    );
  }

  /* ============================ FINISH / SAVE ========================== */
  /* Finish card shown after a round is built. */
  function FinishCard({ result, rounds, onClose, mobile }) {
    const me = window.ChainsID && ChainsID.whoami();
    const [shared, setShared] = React.useState(false);
    // FORMAT-AWARE result: doubles/scramble combine teams, handicap nets, singles is
    // gross. Builds the ranked list (and team names) via the same engine the leagues use.
    const fmtId = result.format || "singles";
    const fmtMeta = window.ChainsFormats ? window.ChainsFormats.meta(fmtId) : { team: false, handicap: false, name: "Singles" };
    let ranked, teamMode = false;
    if (window.ChainsFormats && result.holeScores) {
      const cards = {};
      result.group.forEach((g) => { cards[g.id] = { name: g.name, disc: g.color, holeScores: result.holeScores[g.id] || [], handicap: (result.handicaps || {})[g.id] || 0 }; });
      const res = window.ChainsFormats.scoreEvent(fmtId, cards, { pars: result.pars });
      teamMode = res.mode === "team";
      ranked = res.ranked.map((r) => ({ g: { id: r.key, name: r.name, color: r.disc }, tp: (res.sortKey === "net" ? r.net : r.toPar), display: r.display || null, gross: r.gross, net: r.net, members: r.members }));
    } else {
      ranked = result.group.map((g) => ({ g, tp: result.scores[g.id] })).filter((x) => x.tp != null).sort((a, b) => a.tp - b.tp);
    }
    // vs last time here
    const lastHere = React.useMemo(() => {
      if (!rounds || !me) return null;
      const mine = Object.values(rounds).filter((r) => r.course_id === result.course.id && r.scores && r.scores[me] != null && r.status !== "open" && !(result.cloudId && r.id === result.cloudId)).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))); // v487: never compare a round to itself
      return mine.length ? mine[0].scores[me] : null;
    }, [rounds]);
    const myTp = result.scores[me];
    const myRating = (result.holeScores && result.holeScores[me]) ? ratingFor(result.holeScores[me], result.pars, Object.assign({}, result.course || {}, result.lens ? { hole_lengths: result.lens } : {})) : null;
    // v488: badge unlocks for THIS round (diff vs the last snapshot) + a one-time confetti burst.
    const [unlocked, setUnlocked] = React.useState(null);
    const [burst, setBurst] = React.useState(true);
    React.useEffect(() => {
      const t = setTimeout(() => setBurst(false), 3000);
      if (!window.ChainsBadges || !window.ChainsRounds || !me) { setUnlocked([]); return () => clearTimeout(t); }
      let alive = true;
      Promise.all([window.ChainsRounds.loadGroup().catch(() => []), (window.ExploreData ? window.ExploreData.loadSeason("2026").catch(() => null) : Promise.resolve(null))])
        .then(([rs, season]) => { if (!alive) return; const d = window.ChainsBadges.compute(rs, me, season); const u = window.ChainsBadges.diff ? window.ChainsBadges.diff(d, me, true) : []; setUnlocked(u); try { if (u && u.length) { const k = "chains_recent_badges_v1:" + me; const prev = JSON.parse(localStorage.getItem(k) || "[]"); const add = u.map((b) => ({ id: b.id, name: b.name, icon: b.icon, tier: b.tier || null, color: b.color || null, at: Date.now() })); localStorage.setItem(k, JSON.stringify(add.concat(prev).slice(0, 8))); } } catch (e) {} })
        .catch(() => { if (alive) setUnlocked([]); });
      return () => { alive = false; clearTimeout(t); };
    }, []);
    const hsMe = (result.holeScores && me && result.holeScores[me]) || null;
    const ps = result.pars || null;
    const entered = hsMe ? hsMe.map((v, i) => ({ v, i })).filter((x) => x.v != null) : [];
    const strokes = entered.reduce((a, x) => a + x.v, 0);
    let best = null, worst = null;
    if (ps) entered.forEach((x) => { const d = x.v - ps[x.i]; if (!best || d < best.d) best = { i: x.i, d }; if (!worst || d > worst.d) worst = { i: x.i, d }; });
    const N2 = ps ? ps.length : (hsMe ? hsMe.length : 18);
    const dstr = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const wx = result.weather || null;
    const mix = holeMix(hsMe, ps);
    const facts = [
      entered.length ? <span key="s">{strokes} strokes{entered.length < N2 ? " · thru " + entered.length : ""}</span> : null,
      mix.n ? <span key="b">{mix.under} birdie{mix.under === 1 ? "" : "s"} · {mix.pct}%</span> : null,
      wx && wx.tempF != null ? <span key="w">{/rain|storm|shower/i.test(wx.desc || "") ? "Rain" : /cloud|overcast/i.test(wx.desc || "") ? "Cloudy" : "Clear"} {Math.round(wx.tempF)}°{wx.windMph >= 8 ? " · " + wx.windMph + " mph" : ""}</span> : null,
      best && worst && entered.length > 1 ? <span key="bw">Best hole {best.i + 1} ({fmtPar(best.d)}) · toughest {worst.i + 1} ({fmtPar(worst.d)})</span> : null
    ].filter(Boolean);
    const shareText = ["⛓ Chains · " + (result.course.name || "Round") + " · " + dstr,
      (entered.length ? strokes + " strokes · " : "") + (myTp != null ? fmtPar(myTp) : "") + (entered.length && entered.length < N2 ? " thru " + entered.length : ""),
      best && worst && entered.length > 1 ? "Best hole " + (best.i + 1) + " (" + fmtPar(best.d) + ") · Toughest hole " + (worst.i + 1) + " (" + fmtPar(worst.d) + ")" : null,
      hsMe ? hsMe.slice(0, N2).map((v) => (v == null ? "–" : v)).join(" ") : null].filter(Boolean).join("\n");
    const doShare = () => {
      const fallbackCopy = () => { try { ChainsConfirm.copy({ title: "Copy your round", text: shareText }); } catch (e) {} };
      if (navigator.share) { navigator.share({ title: "Chains round", text: shareText }).catch(function () {}); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shareText).then(function () { setShared(true); setTimeout(function () { setShared(false); }, 2000); }, fallbackCopy); else fallbackCopy();
    };
    const players = result.group.map((g) => ({ id: g.id, name: g.name, color: g.color, hs: (result.holeScores && result.holeScores[g.id]) || null, tp: result.scores[g.id] != null ? result.scores[g.id] : null }));
    const rankedPlayers = teamMode ? ranked.map((x) => ({ id: x.g.id, name: x.g.name, color: x.g.color, display: x.display, hs: null, tp: x.tp })) : players;
    const headline = myTp == null ? "Round complete" : myTp < 0 ? ["Under par!", "Dialed in.", "That's the one."][Math.min(2, Math.abs(myTp) > 4 ? 2 : Math.abs(myTp) > 2 ? 1 : 0)] : myTp === 0 ? "Even. Clean." : lastHere != null && myTp < lastHere ? "New best here!" : "Round complete";
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
        {burst && <div style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none", overflow: "hidden" }}>{Array.from({ length: 36 }, (_, i) => <span key={i} className="gt-confetti" style={{ left: (2 + (i * 29) % 96) + "%", animationDelay: (i % 9) * 0.12 + "s", animationDuration: (2.2 + (i % 4) * 0.3) + "s", background: ["var(--ace-500)", "var(--fairway-500)", "var(--gold-500, #d4a017)", "#fff", "var(--score-under, #1a7a50)"][i % 5], transform: "rotate(" + (i * 47) % 360 + "deg)" }} />)}</div>}
        <div style={{ textAlign: "center", padding: "6px 0 0" }}>
          <div className="gt-pop" style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 30, lineHeight: 1, color: "var(--text-strong)" }}>{headline}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 6 }}>{result.course.name}{fmtId !== "singles" ? " · " + fmtMeta.name : ""} · {dstr}</div>
        </div>
        {myTp != null && <ScoreHero tone="dark" tp={myTp} strokes={entered.length ? strokes : null} rating={myRating ? myRating.rating : null} ratingLabel={myRating && window.ChainsRating && window.ChainsRating.tier ? window.ChainsRating.tier(myRating.rating) : "Chains rating"} facts={facts} />}
        {unlocked && unlocked.length > 0 && <NewBadgesReveal items={unlocked} />}
        {result.holeScores ? <RoundProgress result={result} rounds={rounds} me={me} /> : null}
        {result.holeScores ? <TakeoverResult result={result} me={me} /> : null}
        {result.discOut != null ? <DiscEndCheck n={result.discOut} /> : null}
        {myTp != null && lastHere != null && (
          <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: myTp < lastHere ? "var(--fairway-50)" : "var(--bg-sunken)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)", textAlign: "center" }}>
            Last time here you shot <b style={{ color: parColor(lastHere) }}>{fmtPar(lastHere)}</b>{myTp < lastHere ? " — new best here" : myTp === lastHere ? " — matched it." : " — it happens. Next time."}
          </div>
        )}
        <PlayerOverview players={rankedPlayers} pars={ps} me={me} title={result.group.length > 1 ? "Player overview" : null} />
        {!teamMode && hsMe && ps && <ScorecardTable players={players} pars={ps} lens={result.lens && result.lens.length ? result.lens : (result.course && result.course.hole_lengths) || null} me={me} />}
        <RoundStory result={result} me={me} />
        <VerifySign result={result} me={me} />
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="lg" full onClick={doShare}>{shared ? "Copied ✓" : (typeof navigator !== "undefined" && navigator.share) ? "Share round" : "Copy summary"}</Button>
          <Button variant="accent" size="lg" full onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  function FlowHead({ title, sub, onBack }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.ChevRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1 }}>{title}</div>
          {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    );
  }

  function InviteDetail({ inv, me, onBack, onRsvp, onAdd, onRemove, onDelete, onRefresh, onStart, mobile }) {
    const [, force] = React.useState(0);
    const [guestName, setGuestName] = React.useState("");
    // Forward-compatible person ID: today it's a local guest; when accounts exist
    // (email/cross-league), this same {id,name} slot maps to their real account id.
    const makeGuest = (name) => ({ id: "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: name.trim(), guest: true });
    const isOrg = inv.organizer === me;
    const members = ChainsEngine.members();
    const group = inv.group || [];
    const rsvp = inv.rsvp || {};
    const ins = group.filter((g) => rsvp[g.id] === "in");
    const outs = group.filter((g) => rsvp[g.id] === "out");
    const pending = group.filter((g) => !rsvp[g.id]);
    // Once the tee time has passed, no-replies are treated as "no-show" (not "waiting"),
    // so the round never sits blocked on someone who never opened the invite.
    const dtTime = new Date(inv.date + "T" + (inv.time || "00:00") + ":00");
    const passed = !isNaN(dtTime) && Date.now() > dtTime.getTime();
    const t12 = (function (t) { if (!t) return ""; const p = t.split(":").map(Number); const ap = p[0] >= 12 ? "PM" : "AM"; return (p[0] % 12 || 12) + ":" + String(p[1]).padStart(2, "0") + " " + ap; })(inv.time);
    const dt = new Date(inv.date + "T00:00:00");
    const dstr = isNaN(dt) ? inv.date : dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent([inv.course_name, inv.city].filter(Boolean).join(", "));
    const notInGroup = members.filter((m) => !group.some((g) => g.id === m.id));
    const row = (g, tag, color) => (
      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 4px" }}>
        <Avatar name={g.name} color={g.color || "var(--chain-400)"} size={26} />
        <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>{g.name}{g.id === inv.organizer ? " · host" : ""}</span>
        {tag && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 10, color: color }}>{tag}</span>}
        {isOrg && g.id !== inv.organizer && <button onClick={() => { onRemove(inv.id, g.id); force((x) => x + 1); }} aria-label="Remove" style={{ width: 26, height: 26, borderRadius: "var(--radius-sm)", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-faint)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.X size={13} /></button>}
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title={inv.course_name} sub={dstr + " · " + t12} onBack={onBack} />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: "var(--radius-pill)", background: "var(--fairway-600)", color: "#fff", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 }}><span style={{ width: 13, height: 13 }}><Icons.Pin size={13} /></span> Directions</a>
          {inv.city && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>{inv.city}</span>}
        </div>

        {/* my RSVP — only if I'm invited and not the host */}
        {!isOrg && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onRsvp(inv.id, "in"); force((x) => x + 1); }} style={{ flex: 1, padding: "11px", borderRadius: "var(--radius-md)", border: "1px solid " + (rsvp[me] === "in" ? "var(--fairway-600)" : "var(--border-default)"), background: rsvp[me] === "in" ? "var(--fairway-600)" : "var(--bg-elevated)", color: rsvp[me] === "in" ? "#fff" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13 }}>I'm in</button>
            <button onClick={() => { onRsvp(inv.id, "out"); force((x) => x + 1); }} style={{ flex: 1, padding: "11px", borderRadius: "var(--radius-md)", border: "1px solid " + (rsvp[me] === "out" ? "var(--clay-600, #b4452f)" : "var(--border-default)"), background: rsvp[me] === "out" ? "var(--clay-600, #b4452f)" : "var(--bg-elevated)", color: rsvp[me] === "out" ? "#fff" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13 }}>Can't make it</button>
          </div>
        )}

        {/* roster */}
        <Card pad={0}>
          <div style={{ padding: "11px 14px" }}>
            {ins.length > 0 && <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, color: "var(--fairway-700)", marginBottom: 2 }}>In ({ins.length})</div>}
            {ins.map((g) => row(g, "In", "var(--fairway-700)"))}
            {pending.length > 0 && <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, color: "var(--text-faint)", margin: "8px 0 2px" }}>{passed ? "Never replied" : "Waiting on"}</div>}
            {pending.map((g) => row(g, passed ? "No-show" : "Waiting…", "var(--text-faint)"))}
            {outs.length > 0 && <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, color: "var(--clay-600, #b4452f)", margin: "8px 0 2px" }}>Can't make it</div>}
            {outs.map((g) => row(g, "Out", "var(--clay-600, #b4452f)"))}
          </div>
        </Card>

        {/* add people (host) */}
        {isOrg && (
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10.5, color: "var(--text-muted)", marginBottom: 7 }}>Add players</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {notInGroup.map((m) => (
                <button key={m.id} onClick={() => { onAdd(inv.id, m); force((x) => x + 1); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px 7px 7px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer" }}>
                  <Avatar name={m.name} color={m.disc} size={20} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12, color: "var(--text-strong)" }}>{m.name}</span>
                  <span style={{ width: 13, height: 13, color: "var(--fairway-600)" }}><Icons.Check size={13} /></span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && guestName.trim()) { onAdd(inv.id, makeGuest(guestName)); setGuestName(""); force((x) => x + 1); } }} placeholder="Add a guest (not in the league)…" style={{ flex: 1, height: 40, padding: "0 13px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13.5, background: "var(--bg-elevated)", outline: "none", boxSizing: "border-box" }} />
              <Button variant="secondary" size="md" disabled={!guestName.trim()} onClick={() => { onAdd(inv.id, makeGuest(guestName)); setGuestName(""); force((x) => x + 1); }}>Add</Button>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 5 }}>Guests get a private ID so their scores track here, even without the app.</div>
          </div>
        )}

        <Button variant="accent" full size="lg" icon={<Icons.Disc size={16} />} onClick={() => onStart(inv)}>Start this round now</Button>
        {isOrg && <button onClick={() => { window.ChainsPlayInvites.requestCancel(inv.id, me, inv, { onDeleted: () => onDelete(inv.id), onGone: () => onDelete(inv.id), onChanged: () => onRefresh && onRefresh() }); }} style={{ padding: "11px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--clay-600, #b4452f)" }}>Cancel this invite</button>}
      </div>
    );
  }

  // Error boundary: one malformed saved round must never blank the whole tab.
  class PlayBoundary extends React.Component {
    constructor(p) { super(p); this.state = { err: null }; }
    static getDerivedStateFromError(err) { return { err: err }; }
    componentDidCatch(err) { try { console.error("[PlayView]", err); } catch (e) {} }
    render() {
      if (!this.state.err) return this.props.children;
      return (
        <div style={{ padding: "36px 20px", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)" }}>Something went sideways</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", maxWidth: 340, lineHeight: 1.5 }}>One of your saved rounds couldn't be read. Your scores are safe in the cloud — tap to reload this tab.</div>
          <button onClick={() => this.setState({ err: null })} style={{ padding: "11px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>Try again</button>
        </div>
      );
    }
  }
  function PlayView() { return <PlayBoundary><PlayViewInner /></PlayBoundary>; }

  window.PlayView = PlayView;
  window.PlayDiscCounter = DiscCounter;
  window.PlayFinishCard = FinishCard;
  window.PlaySaveRound = saveRound;
})();
