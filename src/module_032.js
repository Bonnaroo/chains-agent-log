/* ============================================================
   CHAINS — Badges & streaks (v488 trophy case). window.ChainsBadges
   Derived (computed, not stored) from data we already keep: Go Throw
   rounds, the aces log, head-to-head records, the fantasy season.
   No new writes — pure read/aggregate so it's always in sync.

   v488: tiered, Audible-style. Every badge has a value and a ladder of
   tiers (bronze → silver → gold → platinum); `level` is how many rungs
   you've cleared, `progress` is how far to the next. Single-tier badges
   are just a ladder of one. Secret badges stay hidden until earned.
   Backward-compatible fields kept for old callers: id, name, icon,
   earned, detail. New: cat, tiers, tierNames, value, level, next,
   progress, tier (label), secret, how (one-line "how to get it").
   ============================================================ */
(function () {
  var w = window;
  function whoami() { try { return (w.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; } catch (e) { return null; } }
  function toArr(hs) { if (Array.isArray(hs)) return hs; if (!hs || typeof hs !== "object") return []; var out = []; Object.keys(hs).forEach(function (k) { var i = Math.floor(Number(k)); if (isFinite(i) && i >= 0) out[i] = hs[k]; }); for (var j = 0; j < out.length; j++) if (out[j] === undefined) out[j] = null; return out; }
  function myHoles(r, me) {
    var hs = null;
    if (r.players && r.players[me]) hs = r.players[me].holeScores;
    else if (r.hole_scores && r.hole_scores[me]) hs = r.hole_scores[me];
    return hs != null ? toArr(hs) : null;
  }
  function parsOf(r) { return (r.course && r.course.pars) || r.pars || null; }
  function fmtToPar(v) { return v == null ? "—" : v === 0 ? "E" : v < 0 ? String(v) : "+" + v; }
  function allToPars(r) {
    var pr = parsOf(r); if (!pr || !pr.length) return {};
    var players = r.players || null;
    if (!players && r.hole_scores) { players = {}; Object.keys(r.hole_scores).forEach(function (k) { players[k] = { holeScores: r.hole_scores[k] }; }); }
    if (!players) return {};
    var out = {};
    Object.keys(players).forEach(function (k) {
      var hs = toArr(players[k].holeScores); var strokes = 0, parSum = 0, played = 0;
      for (var i = 0; i < pr.length; i++) { var s = hs[i]; if (s == null) continue; strokes += s; parSum += (pr[i] != null ? pr[i] : 3); played++; }
      if (played === pr.length) out[k] = strokes - parSum;
    });
    return out;
  }
  function firstLast(s) {
    var n = String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, " ");
    var parts = n.split(" ").filter(Boolean);
    return parts.length >= 2 ? parts[0] + " " + parts[parts.length - 1] : n;
  }
  function localHour(iso) { try { var d = new Date(iso); return isNaN(d) ? null : d.getHours(); } catch (e) { return null; } }
  function dayOf(r) { return r.date || String(r.startedAt || r.updatedAt || "").slice(0, 10) || ""; }
  function dow(dstr) { try { var d = new Date(dstr + "T12:00:00"); return isNaN(d) ? null : d.getDay(); } catch (e) { return null; } }

  var TIER_NAMES = ["Bronze", "Silver", "Gold", "Platinum"];
  var TIER_COLORS = { Bronze: "#b8763e", Silver: "#9aa5b1", Gold: "#d4a017", Platinum: "#6fc3df", Diamond: "#8f7cff", Earned: "#2f8f5b", "First turkey": "#2f8f5b", "First solo": "#2f8f5b" };
  // v529 — the first tier is no longer a gimme (Will: ~30 trophies off three rounds was too easy).
  // Real firsts keep 1 (first round, first birdie, first ace, first clean card...). Everything that is
  // just "it happened once" needs 3 (5 for cheers). The later tiers are untouched.
  var FIRST_TIER = { lone_wolf: 5, weekend: 3, double_dip: 3, early_bird: 3, night_owl: 3, mudder: 3, windy: 3, frostbite: 3, heatwave: 3,
    cardmates: 3, host: 3, captain: 3, full_card: 3, good_sport: 3, hype: 5, beat_buddy: 3, holder: 3, land_grab: 3, raider: 3,
    bounce_back: 3, no_doubles: 3, opening: 3, walk_off: 3, hot_start: 3, back_nine: 3, even_steven: 3, birdie_fest: 3, grind: 3, repeat: 3,
    dialed: 3, snowman: 3, big_number: 3, blow_up: 3, bogey_train: 3, double_trouble: 3, ice_cold: 3, back_fade: 3, early_exit: 3 };
  function ladder(def) {
    var tiers = (def.tiers || [1]).slice();
    if (FIRST_TIER[def.id] && tiers.length > 1) tiers[0] = Math.min(FIRST_TIER[def.id], tiers[1] - 1);
    var level = 0; for (var i = 0; i < tiers.length; i++) if (def.value >= tiers[i]) level = i + 1;
    var next = level < tiers.length ? tiers[level] : null;
    var prev = level > 0 ? tiers[level - 1] : 0;
    var progress = next == null ? 1 : Math.max(0, Math.min(1, (def.value - prev) / (next - prev)));
    var names = def.tierNames || TIER_NAMES;
    var tier = tiers.length === 1 ? (level ? "Earned" : null) : (level ? names[Math.min(level, names.length) - 1] : null);
    return {
      id: def.id, name: def.name, icon: def.icon, cat: def.cat, secret: !!def.secret, shame: !!def.shame, how: def.how || "",
      points: level ? (tiers.length === 1 ? 1 : [1, 2, 3, 5, 8][Math.min(level, 5) - 1]) : 0,
      tiers: tiers, tierNames: names.slice(0, tiers.length), value: def.value, level: level, next: next, progress: progress, tier: tier,
      color: level ? (TIER_COLORS[tier] || TIER_COLORS[TIER_NAMES[Math.min(level, 4) - 1]] || TIER_COLORS.Earned) : null,
      earned: level >= 1, maxed: next == null,
      detail: def.detail != null ? def.detail : (next != null ? def.value + "/" + next : String(def.value))
    };
  }

  // rounds : array (group rounds, any shape) · me : whoami · seasonLoaded : optional ExploreData season
  // returns { badges:[...], streaks:{...}, totals:{...}, cats:[...] }
  function compute(rounds, me, seasonLoaded) {
    me = me || whoami();
    rounds = (rounds || []).filter(function (r) { return r && r.status !== "open" && !r.practice; });
    var mine = rounds.filter(function (r) { return myHoles(r, me); }).sort(function (a, b) { return String(a.date || a.updatedAt || "").localeCompare(String(b.date || b.updatedAt || "")); });

    var totalRounds = mine.length, fullRounds = 0;
    var aces = 0, birdies = 0, pars = 0, bogeys = 0, dbls = 0, bestToPar = null, eagles = 0, holesPlayed = 0;
    var bogeyFreeCount = 0, underParRounds = 0, deepRounds = 0, byCourse = {}, cities = {}, grindRounds = 0, allParRounds = 0;
    var bounceBacks = 0, threePeats = 0, backNineSurges = 0, hotStarts = 0, bogeyTrainMax = 0;
    var earlyBirds = 0, nightOwls = 0, rainRounds = 0, windRounds = 0, coldRounds = 0, hotRounds = 0, weekendDays = {}, roundsPerDay = {}, bigCards = 0, hosted = 0, captain = 0, ties = 0;
    var snowmen = 0, bigNumbers = 0, bogeyTrains = 0, iceCold = 0, earlyExits = 0, blowUps = 0, doubleTrouble = 0, backFades = 0;
    var soloRounds = 0, bigBirds = 0, birdieFests = 0, noDoubles = 0, evenRounds = 0, underParRun = 0, bestUnderRun = 0, signed = 0, cheersGiven = 0, holesPerDay = {}, repeatCourses = 0, courseBests = {}, crewBest = {};
    mine.forEach(function (r, idx) {
      var hs = myHoles(r, me), pr = parsOf(r); if (!hs || !pr) return;
      var strokes = 0, parSum = 0, played = 0, bogeyOrWorse = false, run = 0, prevD = null, front = 0, back = 0, frontPar = 0, backPar = 0, allPar = true, first3 = 0;
      for (var i = 0; i < pr.length; i++) {
        var s = hs[i]; if (s == null) { allPar = false; continue; } var p = pr[i] != null ? pr[i] : 3; var d = s - p;
        strokes += s; parSum += p; played++; holesPlayed++;
        if (s === 1 && p >= 3) aces++;
        else if (d <= -2) eagles++;
        if (d < 0 && p >= 4) bigBirds++;
        if (s === 8) snowmen++; if (s >= 10) bigNumbers++; if (d >= 4) blowUps++;
        else if (d === -1) birdies++;
        else if (d === 0) pars++;
        else if (d === 1) bogeys++;
        else dbls++;
        if (d !== 0) allPar = false;
        if (d >= 1) bogeyOrWorse = true;
        if (d < 0) { run++; if (run === 3) threePeats++; } else run = 0;
        if (prevD != null && prevD >= 2 && d < 0) bounceBacks++;
        if (i < 3 && d < 0) first3++;
        if (i < 9) { front += s; frontPar += p; } else { back += s; backPar += p; }
        prevD = d;
      }
      var full = played === pr.length && pr.length > 0;
      var rb = 0, rd = 0, trainRun = 0, trainMax = 0; for (var q = 0; q < pr.length; q++) { var sq = hs[q]; if (sq == null) { trainRun = 0; continue; } var dq = sq - (pr[q] != null ? pr[q] : 3); if (dq < 0) rb++; if (dq >= 2) rd++; if (dq >= 1) { trainRun++; if (trainRun > trainMax) trainMax = trainRun; } else trainRun = 0; }
      if (rb >= 5) birdieFests++;
      if (trainMax >= 4) bogeyTrains++;
      if (rd >= 3) doubleTrouble++;
      if (!full && played >= 3) earlyExits++;
      if (full) {
        fullRounds++;
        var tp = strokes - parSum;
        if (rd === 0) noDoubles++;
        if (tp === 0) evenRounds++;
        if (rb === 0) iceCold++;
        if (pr.length >= 18 && (back - backPar) >= (front - frontPar) + 3) backFades++;
        if (tp < 0) { underParRun++; if (underParRun > bestUnderRun) bestUnderRun = underParRun; } else underParRun = 0;
        if (bestToPar == null || tp < bestToPar) bestToPar = tp;
        if (!bogeyOrWorse) bogeyFreeCount++;
        if (tp < 0) underParRounds++;
        if (tp <= -5) deepRounds++;
        if (tp >= 10) grindRounds++;
        if (allPar && pr.length >= 9) allParRounds++;
        if (pr.length >= 18 && (back - backPar) <= (front - frontPar) - 3) backNineSurges++;
        if (first3 === 3) hotStarts++;
        var cname = r.course && (r.course.name || r.course.id);
        if (cname) { var key = String(cname); (byCourse[key] || (byCourse[key] = [])).push({ toPar: tp, name: (r.course && r.course.name) || key, idx: idx }); }
        var city = r.course && (r.course.city || r.city); if (city) cities[String(city).toLowerCase()] = true;
      }
      var hr = localHour(r.startedAt || r.created_at); if (hr != null && hr < 8) earlyBirds++;
      var hrEnd = localHour(r.updatedAt || r.finishedAt); if (hrEnd != null && hrEnd >= 20) nightOwls++;
      var wx = r.weather || null;
      if (wx) { if (wx.precipMm > 0 || /rain|drizzle|shower|storm/i.test(wx.desc || "")) rainRounds++; if (wx.windMph >= 15) windRounds++; if (wx.tempF != null && wx.tempF <= 35) coldRounds++; if (wx.tempF != null && wx.tempF >= 90) hotRounds++; }
      var day = dayOf(r); if (day) { roundsPerDay[day] = (roundsPerDay[day] || 0) + 1; holesPerDay[day] = (holesPerDay[day] || 0) + played; var dw = dow(day); if (dw === 0 || dw === 6) weekendDays[day] = true; }
      var pl = r.players ? Object.keys(r.players) : (r.group ? r.group.map(function (g) { return g.id; }) : []);
      if (pl.length >= 4) bigCards++;
      if (pl.length <= 1) soloRounds++;
      if (r.verified && r.verified[me]) signed++;
      try { if (r.cheers) Object.keys(r.cheers).forEach(function (ck) { var c = r.cheers[ck]; if (c === me || (c && (c.from === me || c.by === me || c[me]))) cheersGiven++; }); } catch (e) {}
      if (full) { var all0 = allToPars(r); var cn0 = r.course && (r.course.name || r.course.id); if (cn0) { Object.keys(all0).forEach(function (k) { if (crewBest[cn0] == null || all0[k] < crewBest[cn0]) crewBest[cn0] = all0[k]; }); if (all0[me] != null && (courseBests[cn0] == null || all0[me] < courseBests[cn0])) courseBests[cn0] = all0[me]; } }
      var owner = r.ownerKey || r.logged_by || r.owner; if (owner === me && pl.length >= 2) hosted++;
      if (full && pl.length >= 2) {
        var all = allToPars(r), myTp = all[me];
        if (myTp != null) {
          var others = Object.keys(all).filter(function (k) { return k !== me; }).map(function (k) { return all[k]; });
          if (others.length) { var best = Math.min.apply(null, others); if (pl.length >= 4 && myTp < best) captain++; if (myTp === best) ties++; }
        }
      }
    });
    try { if (w.ChainsAces && w.ChainsAces.countFor) aces = Math.max(aces, w.ChainsAces.countFor(me)); } catch (e) {}
    var chWeeks = 0, chDone = 0, pfWeeks = 0, pfStreak = 0; try { if (w.ChainsChallenges) { chWeeks = w.ChainsChallenges.weeksCompleted(); chDone = w.ChainsChallenges.totalDone(); pfWeeks = w.ChainsChallenges.perfectWeeks ? w.ChainsChallenges.perfectWeeks() : 0; pfStreak = w.ChainsChallenges.perfectStreak ? w.ChainsChallenges.perfectStreak() : 0; } } catch (e) {}
    var monthsDone = 0; try { if (w.ChainsChallenges && w.ChainsChallenges.monthsCompleted) monthsDone = w.ChainsChallenges.monthsCompleted(); } catch (e) {}
    var lostDiscs = 0; try { if (w.ChainsBag && w.ChainsBag.get) lostDiscs = (w.ChainsBag.get().discs || []).filter(function (d) { return d.lost; }).length; } catch (e) {}

    // head-to-head
    var buddyWins = 0, rivals = 0, nemesisWins = 0, nemesisName = null;
    try {
      if (w.ChainsRounds && w.ChainsRounds.headToHead) {
        var h2h = w.ChainsRounds.headToHead(rounds, me);
        Object.keys(h2h).forEach(function (k) { rivals++; buddyWins += h2h[k].wins || 0; if ((h2h[k].wins || 0) > nemesisWins) { nemesisWins = h2h[k].wins; nemesisName = h2h[k].name || k; } });
      }
    } catch (e) {}

    // day streak (longest run of consecutive days with a round)
    var dayList = Object.keys(roundsPerDay).sort();
    var streak = 0;
    if (dayList.length) {
      streak = 1; var run2 = 1;
      for (var j = 1; j < dayList.length; j++) {
        var prev = new Date(dayList[j - 1] + "T00:00:00"), cur = new Date(dayList[j] + "T00:00:00");
        var diff = Math.round((cur - prev) / 86400000);
        if (diff === 1) { run2++; } else { run2 = 1; }
        if (run2 > streak) streak = run2;
      }
    }
    var doubleDays = Object.keys(roundsPerDay).filter(function (d) { return roundsPerDay[d] >= 2; }).length;
    var marathonDays = Object.keys(holesPerDay).filter(function (d) { return holesPerDay[d] >= 36; }).length;
    var localLegend = Object.keys(courseBests).filter(function (c) { return crewBest[c] != null && courseBests[c] <= crewBest[c]; }).length;
    // weekend warrior: both Sat and Sun of the same weekend
    var weekends = 0; var wk = {};
    Object.keys(weekendDays).forEach(function (d) { var dt = new Date(d + "T12:00:00"); var sat = new Date(dt); sat.setDate(dt.getDate() - (dt.getDay() === 0 ? 1 : 0)); var key = sat.toISOString().slice(0, 10); wk[key] = (wk[key] || 0) | (dt.getDay() === 6 ? 1 : 2); });
    Object.keys(wk).forEach(function (k) { if (wk[k] === 3) weekends++; });

    // courses
    var distinctCourses = Object.keys(byCourse).length;
    repeatCourses = Object.keys(byCourse).filter(function (k) { return byCourse[k].length >= 3; }).length;
    var pbCount = 0, coursePB = null, coursePBIdx = -1, homeMax = 0, homeName = null;
    Object.keys(byCourse).forEach(function (k) {
      var arr = byCourse[k]; if (arr.length > homeMax) { homeMax = arr.length; homeName = arr[0].name; }
      if (arr.length < 2) return;
      var best = arr[0].toPar;
      for (var i = 1; i < arr.length; i++) { if (arr[i].toPar < best) { pbCount++; best = arr[i].toPar; if (arr[i].idx > coursePBIdx) { coursePB = { name: arr[i].name, toPar: arr[i].toPar }; coursePBIdx = arr[i].idx; } } }
    });

    // win streak
    var bestWinStreak = 0, runW = 0;
    mine.forEach(function (r) {
      var all = allToPars(r), myTp = all[me]; if (myTp == null) return;
      var others = Object.keys(all).filter(function (k) { return k !== me; }).map(function (k) { return all[k]; });
      if (!others.length) return;
      var best = Math.min.apply(null, [myTp].concat(others));
      if (myTp <= best) { runW++; if (runW > bestWinStreak) bestWinStreak = runW; } else { runW = 0; }
    });

    // fantasy pair
    var draftedWinner = false, draftedWinnerDetail = "draft the event champ", wonFromBehind = false, wonFromBehindDetail = "trail, then take over #1";
    var podiums = 0, eventWins = 0, perfectWeeks = 0, seasonChamp = false;
    try {
      var EN = w.ChainsEngine;
      if (EN && me && seasonLoaded && seasonLoaded.events && w.ExploreData) {
        var TS = EN.SEED.TOURNAMENTS; var winnerByT = {};
        seasonLoaded.events.forEach(function (e) { var win = (e.rows || []).find(function (rr) { return rr.place === 1; }); if (win) winnerByT[e.meta.t] = w.ExploreData.nameOf(win); });
        TS.forEach(function (tt) {
          if (draftedWinner) return;
          var picks = EN.picksFor(tt.t); if (!picks) return;
          var mineRow = picks.find(function (p) { return p && p.m === me; }); if (!mineRow) return;
          var win = winnerByT[tt.t]; if (!win) return; var wkey = firstLast(win);
          [mineRow.p1, mineRow.p2].forEach(function (nm) { if (nm && firstLast(nm) === wkey) { draftedWinner = true; draftedWinnerDetail = nm + " won " + tt.name; } });
        });
        var chrono = TS.slice().sort(function (a, b) { return a.t - b.t; });
        var cum = {}; EN.members().forEach(function (m) { cum[m.id] = 0; });
        chrono.forEach(function (tt) {
          var res0 = EN.eventResults(tt.t); if (!res0 || !res0.scored) return;
          var mine0 = res0.rows.find(function (r) { return r.m === me; }); if (!mine0) return;
          if (mine0.place === 1) eventWins++; if (mine0.place != null && mine0.place <= 3) podiums++;
          if (mine0.s1 != null && mine0.s2 != null && mine0.s1 <= 0 && mine0.s2 <= 0) perfectWeeks++;
        });
        try { var st = EN.standings && EN.standings(); var sm = EN.seasonMeta && EN.seasonMeta(); if (st && st.length && sm && sm.total && sm.completed >= sm.total && st[0] && (st[0].id || st[0].m) === me) seasonChamp = true; } catch (e) {}
        var checkpoints = 0, everNotFirst = false, finalIsFirst = false;
        chrono.forEach(function (tt) {
          var res = EN.eventResults(tt.t); if (!res || !res.scored) return;
          res.rows.forEach(function (r) { if (cum[r.m] == null) cum[r.m] = 0; cum[r.m] += (r.points || 0); });
          checkpoints++;
          var vals = Object.keys(cum).map(function (k) { return cum[k]; }); var top = Math.max.apply(null, vals);
          var myIsFirst = cum[me] != null && cum[me] === top; if (!myIsFirst) everNotFirst = true; finalIsFirst = myIsFirst;
        });
        wonFromBehind = checkpoints >= 2 && everNotFirst && finalIsFirst;
        if (wonFromBehind) wonFromBehindDetail = "now #1 after trailing";
      }
    } catch (e) {}

    var pct = function (n, d) { return d ? Math.round(100 * n / d) : 0; };
    // ---- v514 extra ladders: explorer by state/country/county, streaks, cardmates, course "full cards",
    //      rating, hole-1/hole-18 birdies, month volume, year volume, takeover, lost & found ----
    var catById = {}; try { ((w.ChainsCatalog && w.ChainsCatalog.get && w.ChainsCatalog.get()) || []).forEach(function (c) { if (c && c.id != null) catById[String(c.id)] = c; }); } catch (e) {}
    var states = {}, countries = {}, counties = {}, cardmates = {}, buddyRounds = {}, months = {}, weeks = {}, days = {}, yearRounds = 0, monthCount = {}, courseHoleBirdies = {}, firstHoleBirdies = 0, lastHoleBirdies = 0, bestRating = 0, underParCourses = {}, weekCourses = {};
    var thisYear = new Date().getFullYear();
    function weekKey(dstr) { var d = new Date(dstr + "T12:00:00"); var day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    mine.forEach(function (r) {
      var hs = myHoles(r, me), pr = parsOf(r); if (!hs || !pr) return;
      var cid = r.course && r.course.id != null ? String(r.course.id) : null; var cat = cid ? catById[cid] : null;
      if (cat) { if (cat.state) states[String(cat.state).toUpperCase()] = true; countries[String(cat.country || (cat.state ? "US" : "")).toUpperCase() || "?"] = true; if (cat.county) counties[String(cat.county).toLowerCase() + "|" + String(cat.state || "")] = true; }
      var day = dayOf(r); if (day) { days[day] = true; months[day.slice(0, 7)] = true; monthCount[day.slice(0, 7)] = (monthCount[day.slice(0, 7)] || 0) + 1; var wk = weekKey(day); weeks[wk] = true; if (cid) (weekCourses[wk] = weekCourses[wk] || {})[cid] = true; if (day.slice(0, 4) == thisYear) yearRounds++; }
      var pl = r.players ? Object.keys(r.players) : (r.group ? r.group.map(function (g) { return g.id; }) : []);
      pl.forEach(function (k) { if (k === me || /^guest/.test(k)) return; cardmates[k] = true; buddyRounds[k] = (buddyRounds[k] || 0) + 1; });
      var full = hs.filter(function (x) { return x != null; }).length === pr.length;
      if (hs[0] != null && pr[0] != null && hs[0] < pr[0]) firstHoleBirdies++;
      var li = pr.length - 1; if (hs[li] != null && pr[li] != null && hs[li] < pr[li]) lastHoleBirdies++;
      if (cid) { var chb = courseHoleBirdies[cid] || (courseHoleBirdies[cid] = { n: pr.length, holes: {} }); for (var q = 0; q < pr.length; q++) if (hs[q] != null && pr[q] != null && hs[q] < pr[q]) chb.holes[q] = true; }
      if (full) { var tpv = 0; for (var q2 = 0; q2 < pr.length; q2++) tpv += hs[q2] - (pr[q2] != null ? pr[q2] : 3); if (tpv < 0 && cid) underParCourses[cid] = true;
        try { if (w.ChainsRating && cat) { var rr = w.ChainsRating.roundRating({ hole_scores: { me: hs }, pars: pr, course: { pars: pr, holes: pr.length, hole_lengths: cat.hole_lengths || null, rating: cat.rating || null, ssa: cat.ssa || null } }, "me"); if (rr && rr.rating > bestRating) bestRating = rr.rating; } } catch (e) {} }
    });
    var weekStreak = 0; (function () { var ws = Object.keys(weeks).sort(); var run = 0, prevT = null; ws.forEach(function (k) { var t = new Date(k + "T12:00:00").getTime(); run = (prevT != null && Math.round((t - prevT) / 86400000) === 7) ? run + 1 : 1; prevT = t; if (run > weekStreak) weekStreak = run; }); })();
    var dayStreak = 0; (function () { var ds = Object.keys(days).sort(); var run = 0, prevT = null; ds.forEach(function (k) { var t = new Date(k + "T12:00:00").getTime(); run = (prevT != null && Math.round((t - prevT) / 86400000) === 1) ? run + 1 : 1; prevT = t; if (run > dayStreak) dayStreak = run; }); })();
    var buddyMax = 0, buddyName = null; Object.keys(buddyRounds).forEach(function (k) { if (buddyRounds[k] > buddyMax) { buddyMax = buddyRounds[k]; buddyName = k; } });
    var fullCards = Object.keys(courseHoleBirdies).filter(function (k) { var c = courseHoleBirdies[k]; return c.n && Object.keys(c.holes).length >= c.n; }).length;
    var monthMax = 0; Object.keys(monthCount).forEach(function (k) { if (monthCount[k] > monthMax) monthMax = monthCount[k]; });
    var monthsThisYear = Object.keys(months).filter(function (k) { return k.slice(0, 4) == thisYear; }).length;
    var weekVariety = 0; Object.keys(weekCourses).forEach(function (k) { var n = Object.keys(weekCourses[k]).length; if (n > weekVariety) weekVariety = n; });
    var tk = {}; try { tk = (w.ChainsTakeover && w.ChainsTakeover.counts) ? w.ChainsTakeover.counts(me) : {}; } catch (e) {}
    var turf = { holes: 0, courses: 0 }; try { turf = JSON.parse(localStorage.getItem("chains_turf_v1:" + me) || "null") || turf; } catch (e) {}
    var lfReturned = 0; try { if (w.ChainsLostFound) lfReturned = w.ChainsLostFound.returnedCount(); } catch (e) {}
    var totalThrows = 0; mine.forEach(function (r) { var hs = myHoles(r, me); if (hs) hs.forEach(function (x) { if (x != null) totalThrows += x; }); });
    // v532 — eleven more ladders (89 → 100): collections, problem solved, beat your ghost, birdie run,
    // ten-birdie rounds, nine-hole rounds, return visits, long courses, league debut/wins, cardmate variety.
    var frontNines = 0, backNines = 0; Object.keys(courseHoleBirdies).forEach(function (k) { var c = courseHoleBirdies[k]; if (!c.n || c.n < 18) return; var f = true, b = true; for (var i = 0; i < 9; i++) { if (!c.holes[i]) f = false; if (!c.holes[i + 9]) b = false; } if (f) frontNines++; if (b) backNines++; });
    var ghostBeats = 0, birdieRuns = 0, dimes = 0, nineHole = 0, longCourse = 0, returnVisits = 0, solved = 0;
    (function () {
      var hist = {}, lastPlayed = {}, holeHist = {};
      mine.forEach(function (r) {
        var hs = myHoles(r, me), pr = parsOf(r); if (!hs || !pr) return;
        var cid = r.course && r.course.id != null ? String(r.course.id) : null; var day = dayOf(r);
        var played = hs.filter(function (x) { return x != null; }).length, full = played === pr.length;
        if (pr.length === 9 && full) nineHole++;
        if (pr.length >= 24 && full) longCourse++;
        var run = 0, rb = 0; for (var i = 0; i < pr.length; i++) { if (hs[i] == null) { run = 0; continue; } if (hs[i] < (pr[i] != null ? pr[i] : 3)) { run++; rb++; if (run === 5) birdieRuns++; } else run = 0; }
        if (rb >= 10) dimes++;
        if (cid && day) { if (lastPlayed[cid] && (new Date(day + "T12:00:00") - new Date(lastPlayed[cid] + "T12:00:00")) >= 30 * 86400000) returnVisits++; lastPlayed[cid] = day; }
        if (full && cid) { var tp = 0; for (var q = 0; q < pr.length; q++) tp += hs[q] - (pr[q] != null ? pr[q] : 3); var h = hist[cid] || (hist[cid] = []); if (h.length >= 3) { var last5 = h.slice(-5); var avg = last5.reduce(function (a, b) { return a + b; }, 0) / last5.length; if (tp <= avg - 2) ghostBeats++; } h.push(tp); }
        if (cid) for (var q3 = 0; q3 < pr.length; q3++) { if (hs[q3] == null || pr[q3] == null) continue; (holeHist[cid + "#" + q3] = holeHist[cid + "#" + q3] || []).push(hs[q3] - pr[q3]); }
      });
      Object.keys(holeHist).forEach(function (k) { var a = holeHist[k]; if (a.length < 6) return; var first3 = (a[0] + a[1] + a[2]) / 3; var last = a.slice(-5); var good = last.filter(function (d) { return d <= 0; }).length; if (first3 >= 1 && good >= 3) solved++; });
    })();
    var leaguesJoined = 0, leagueWins = 0; try { if (w.ChainsCourseLeagues && w.ChainsCourseLeagues.mine) { var mls = w.ChainsCourseLeagues.mine(); leaguesJoined = mls.length; mls.forEach(function (l) { try { if (w.ChainsCourseLeagues.status(l) === "ended" && l.winner === me) leagueWins++; } catch (e) {} }); } } catch (e) {}
    var defs = [
      // ---- Rounds & habit ----
      { id: "first_round", cat: "Rounds", name: "Welcome to the Chains", icon: "🥏", value: totalRounds, tiers: [1], how: "Score your first round", detail: totalRounds ? "You're in." : "score a round" },
      { id: "ten_rounds", cat: "Rounds", name: "Regular", icon: "📅", value: totalRounds, tiers: [10, 25, 50, 100], tierNames: ["Regular", "Fixture", "Lifer", "Legend"], how: "Keep logging rounds" },
      { id: "holes", cat: "Rounds", name: "Hole hunter", icon: "⛳", value: holesPlayed, tiers: [100, 500, 1000, 5000], how: "Holes played, all time" },
      { id: "streak3", cat: "Rounds", name: "On a heater", icon: "⚡", value: streak, tiers: [3, 5, 7, 14], how: "Play on consecutive days", detail: streak + "-day streak" },
      { id: "weekend", cat: "Rounds", name: "Weekend warrior", icon: "🎉", value: weekends, tiers: [1, 5, 15, 40], how: "Play Saturday AND Sunday" },
      { id: "double_dip", cat: "Rounds", name: "Double dip", icon: "🌮", value: doubleDays, tiers: [1, 5, 15], how: "Two rounds in one day" },
      { id: "marathon", cat: "Rounds", name: "Marathon day", icon: "🏅", value: marathonDays, tiers: [1, 5, 15], how: "36+ holes in a single day" },
      { id: "lone_wolf", cat: "Rounds", name: "Lone wolf", icon: "🐺", value: soloRounds, tiers: [1, 10, 50, 100, 250], tierNames: ["First solo", "Bronze", "Silver", "Gold", "Diamond"], how: "Solo rounds — just you and the course", detail: soloRounds + " solo round" + (soloRounds === 1 ? "" : "s") },
      { id: "early_bird", cat: "Rounds", name: "Early bird", icon: "🌅", value: earlyBirds, tiers: [1, 5, 15, 50], how: "Tee off before 8 am" },
      { id: "night_owl", cat: "Rounds", name: "Night owl", icon: "🦉", value: nightOwls, tiers: [1, 5, 15, 50], how: "Finish a round after 8 pm" },
      // ---- Weather ----
      { id: "mudder", cat: "Weather", name: "Mudder", icon: "🌧️", value: rainRounds, tiers: [1, 5, 15], how: "Play in the rain" },
      { id: "windy", cat: "Weather", name: "Wind reader", icon: "🌬️", value: windRounds, tiers: [1, 5, 15], how: "Play in 15+ mph wind" },
      { id: "frostbite", cat: "Weather", name: "Frostbite", icon: "🥶", value: coldRounds, tiers: [1, 5, 15], how: "Play at 35°F or colder" },
      { id: "heatwave", cat: "Weather", name: "Heat wave", icon: "🥵", value: hotRounds, tiers: [1, 5, 15], how: "Play at 90°F or hotter" },
      // ---- Scoring ----
      { id: "first_birdie", cat: "Scoring", name: "First birdie", icon: "🐦", value: birdies, tiers: [1], how: "Card a birdie", detail: birdies ? birdies + " total" : "card one" },
      { id: "birdie_machine", cat: "Scoring", name: "Birdie machine", icon: "🤖", value: birdies, tiers: [10, 50, 200, 1000], how: "Birdies, all time" },
      { id: "eagle", cat: "Scoring", name: "Eagle eye", icon: "🦅", value: eagles, tiers: [1, 5, 20], how: "Card an eagle" },
      { id: "season_finisher", cat: "Rounds", name: "Month complete", icon: "📆", value: monthsDone, tiers: [1, 3, 6, 12], tierNames: ["First month", "Bronze", "Silver", "Gold"], how: "Finish the month's four challenges", detail: monthsDone ? monthsDone + " month" + (monthsDone === 1 ? "" : "s") + " completed" : "all four, inside the month" },
      { id: "perfect_week", cat: "Rounds", name: "Perfect week", icon: "🏅", value: pfWeeks, tiers: [1, 4, 12, 30], tierNames: ["First", "Bronze", "Silver", "Gold"], how: "Finish all three weekly challenges", detail: pfWeeks ? pfWeeks + " perfect " + (pfWeeks === 1 ? "week" : "weeks") : "all three in one week" },
      { id: "challenge_streak", cat: "Rounds", name: "Streak", icon: "🔗", value: pfStreak, tiers: [2, 4, 8, 16], how: "Perfect weeks in a row", detail: pfStreak ? pfStreak + " in a row" : "two perfect weeks back to back" },
      { id: "challenger", cat: "Rounds", name: "Challenger", icon: "🎯", value: chWeeks, tiers: [1, 4, 12, 30], tierNames: ["First week", "Bronze", "Silver", "Gold"], how: "Finish at least one weekly challenge", detail: chWeeks ? chWeeks + " week" + (chWeeks > 1 ? "s" : "") + " with a challenge done · " + chDone + " total" : "check this week's challenges on Home" },
      { id: "first_ace", cat: "Scoring", name: "Ace", icon: "🎯", value: aces, tiers: [1, 3, 10], tierNames: ["Ace", "Ace collector", "Chains magnet"], how: "Hit chains from the tee", detail: aces ? aces + " ace" + (aces > 1 ? "s" : "") : "the holy grail" },
      { id: "under_par", cat: "Scoring", name: "Under par", icon: "🔥", value: underParRounds, tiers: [1, 5, 25, 100], how: "Finish a round under par", detail: bestToPar != null ? "best " + fmtToPar(bestToPar) + " · " + underParRounds + " under-par round" + (underParRounds === 1 ? "" : "s") : "—" },
      { id: "deep", cat: "Scoring", name: "Deep run", icon: "🧨", value: deepRounds, tiers: [1, 5, 20], how: "Shoot −5 or better" },
      { id: "bogey_free", cat: "Scoring", name: "Clean card", icon: "🧼", value: bogeyFreeCount, tiers: [1, 5, 20], how: "A full round with no bogeys" },
      { id: "turkey", cat: "Scoring", name: "Turkey", icon: "🦃", value: threePeats, tiers: [1, 3, 5, 10, 25], tierNames: ["First turkey", "Bronze", "Silver", "Gold", "Platinum"], how: "Three birdies in a row", detail: threePeats + (threePeats === 1 ? " turkey" : " turkeys") },
      { id: "big_bird", cat: "Scoring", name: "Big bird", icon: "🦚", value: bigBirds, tiers: [1, 5, 20, 50], how: "Birdie a par 4 or par 5" },
      { id: "birdie_fest", cat: "Scoring", name: "Birdie fest", icon: "🎉", value: birdieFests, tiers: [1, 5, 20], how: "5+ birdies in one round" },
      { id: "no_doubles", cat: "Scoring", name: "Damage control", icon: "🧰", value: noDoubles, tiers: [1, 10, 50], how: "A full round with no doubles" },
      { id: "even_steven", cat: "Scoring", name: "Even Steven", icon: "⚖️", value: evenRounds, tiers: [1, 5, 20], how: "Finish exactly at even par" },
      { id: "dialed", cat: "Scoring", name: "Dialed in", icon: "🎯", value: bestUnderRun, tiers: [2, 3, 5, 10], how: "Rounds under par in a row", detail: bestUnderRun + " in a row" },
      { id: "hot_start", cat: "Scoring", name: "Hot start", icon: "🚀", value: hotStarts, tiers: [1, 5, 20], how: "Birdie holes 1, 2 and 3" },
      { id: "bounce_back", cat: "Scoring", name: "Bounce back", icon: "🦸", value: bounceBacks, tiers: [1, 10, 50], how: "Birdie right after a double" },
      { id: "back_nine", cat: "Scoring", name: "Back-nine surge", icon: "📈", value: backNineSurges, tiers: [1, 5, 20], how: "Back nine 3+ better than the front" },
      { id: "grind", cat: "Scoring", name: "Finished anyway", icon: "🫡", value: grindRounds, tiers: [1, 5], how: "Shoot +10 or worse and still finish. Respect." },
      { id: "par_machine", cat: "Scoring", name: "Par machine", icon: "🧾", value: allParRounds, tiers: [1], secret: true, how: "Par every single hole" },
      // ---- Social ----
      { id: "beat_buddy", cat: "Social", name: "Buddy beater", icon: "🤜", value: buddyWins, tiers: [1, 10, 50, 200], how: "Beat a friend head-to-head" },
      { id: "win_streak", cat: "Social", name: "On a run", icon: "🏃", value: bestWinStreak, tiers: [3, 5, 10], how: "Win 3 group rounds running", detail: bestWinStreak ? bestWinStreak + "-round win streak" : "beat the group 3x running" },
      { id: "full_card", cat: "Social", name: "Full card", icon: "🃏", value: bigCards, tiers: [1, 10, 50], how: "Play with 4+ on the card" },
      { id: "host", cat: "Social", name: "Host", icon: "🏡", value: hosted, tiers: [1, 10, 50], how: "Start a round for friends" },
      { id: "captain", cat: "Social", name: "Card captain", icon: "👑", value: captain, tiers: [1, 5, 25], how: "Beat everyone on a 4+ card" },
      { id: "nemesis", cat: "Social", name: "Nemesis", icon: "😈", value: nemesisWins, tiers: [5, 15, 40], how: "Beat the same friend 5 times", detail: nemesisName ? nemesisWins + " over " + nemesisName : "beat the same friend 5 times" },
      { id: "photo_finish", cat: "Social", name: "Photo finish", icon: "📸", value: ties, tiers: [1, 5], secret: true, how: "Tie a friend for the win" },
      { id: "good_sport", cat: "Social", name: "Good sport", icon: "✍️", value: signed, tiers: [1, 10, 50], how: "Verify & sign your card" },
      { id: "hype", cat: "Social", name: "Hype man", icon: "📣", value: cheersGiven, tiers: [1, 10, 50], how: "Cheer a friend's live round" },
      // ---- Courses ----
      { id: "explorer", cat: "Courses", name: "Course explorer", icon: "🗺️", value: distinctCourses, tiers: [4, 8, 15, 30], how: "Play different courses", detail: distinctCourses + (distinctCourses === 1 ? " course" : " courses") },
      { id: "course_pb", cat: "Courses", name: "Course record", icon: "📍", value: pbCount, tiers: [1, 5, 20], how: "Beat your best at a course", detail: coursePB ? coursePB.name + " · " + fmtToPar(coursePB.toPar) : "play a course twice, then beat yourself" },
      { id: "home_course", cat: "Courses", name: "Home course", icon: "🏠", value: homeMax, tiers: [10, 25, 50, 100], how: "Rounds at your most-played course", detail: homeName ? homeMax + " at " + homeName : "—" },
      { id: "road_trip", cat: "Courses", name: "Road trip", icon: "🚗", value: Object.keys(cities).length, tiers: [3, 6, 12], how: "Play in different towns" },
      { id: "repeat", cat: "Courses", name: "Repeat customer", icon: "🔁", value: repeatCourses, tiers: [1, 5, 15], how: "Courses you've played 3+ times" },
      { id: "local_legend", cat: "Courses", name: "Local legend", icon: "🏆", value: localLegend, tiers: [1, 3, 10], how: "Hold the crew's best round at a course" },
      { id: "states", cat: "Courses", name: "State lines", icon: "🗾", value: Object.keys(states).length, tiers: [1, 3, 5, 10, 25], tierNames: ["Home state", "Bronze", "Silver", "Gold", "Diamond"], how: "Play in different states", detail: Object.keys(states).length ? Object.keys(states).join(", ") : "your home state counts once you play" },
      { id: "countries", cat: "Courses", name: "Passport", icon: "🌍", value: Object.keys(countries).filter(function (k) { return k !== "?"; }).length, tiers: [1, 2, 5, 10, 20], tierNames: ["Home turf", "Bronze", "Silver", "Gold", "Diamond"], how: "Play in different countries" },
      { id: "counties", cat: "Courses", name: "County lines", icon: "🧭", value: Object.keys(counties).length, tiers: [2, 5, 10, 25], how: "Play in different counties" },
      { id: "full_card_course", cat: "Courses", name: "Every hole", icon: "🃏", value: fullCards, tiers: [1, 3, 10], how: "Birdie every hole at a course at least once (lifetime)" },
      { id: "front_nine_set", cat: "Courses", name: "Front nine collected", icon: "🃏", value: frontNines, tiers: [1, 3, 10], how: "Birdie holes 1–9 at a course at least once each" },
      { id: "back_nine_set", cat: "Courses", name: "Back nine collected", icon: "🃏", value: backNines, tiers: [1, 3, 10], how: "Birdie holes 10–18 at a course at least once each" },
      { id: "problem_solved", cat: "Scoring", name: "Problem solved", icon: "🧩", value: solved, tiers: [1, 5, 20], how: "A hole that used to cost you a stroke, now par or better on 3 of your last 5" },
      { id: "ghost", cat: "Scoring", name: "Beat your ghost", icon: "👻", value: ghostBeats, tiers: [1, 5, 20, 50], how: "Beat your recent average at a course by 2 or more" },
      { id: "birdie_run", cat: "Scoring", name: "Birdie run", icon: "🔥", value: birdieRuns, tiers: [1, 3, 10], how: "Five birdies in a row" },
      { id: "dime", cat: "Scoring", name: "Dime", icon: "🔟", value: dimes, tiers: [1, 3, 10], how: "Ten birdies in one round" },
      { id: "nine_counts", cat: "Rounds", name: "Nine counts", icon: "9️⃣", value: nineHole, tiers: [3, 10, 30], how: "Full nine-hole rounds — short loops count" },
      { id: "long_haul", cat: "Rounds", name: "Long haul", icon: "🥾", value: longCourse, tiers: [1, 5, 15], how: "Full rounds on a 24-hole-plus course" },
      { id: "return_visit", cat: "Courses", name: "Return visit", icon: "🔁", value: returnVisits, tiers: [1, 5, 15], how: "Come back to a course after a month or more away" },
      { id: "league_debut", cat: "Social", name: "League player", icon: "📋", value: leaguesJoined, tiers: [1, 3, 10], how: "Course leagues you've been part of" },
      { id: "league_win", cat: "Social", name: "League winner", icon: "🏆", value: leagueWins, tiers: [1, 3, 10], how: "Finish first in a course league" },
      { id: "under_par_courses", cat: "Courses", name: "Under par everywhere", icon: "📉", value: Object.keys(underParCourses).length, tiers: [1, 3, 10, 25], how: "Shoot under par at different courses" },
      { id: "week_variety", cat: "Courses", name: "Course hopper", icon: "🐇", value: weekVariety, tiers: [2, 3, 5], how: "Different courses in one week" },
      { id: "throws", cat: "Rounds", name: "Throw count", icon: "🔢", value: totalThrows, tiers: [500, 2000, 10000, 50000], how: "Throws, lifetime" },
      { id: "week_streak", cat: "Rounds", name: "Weekly habit", icon: "📅", value: weekStreak, tiers: [2, 4, 10, 26, 52], tierNames: ["Two in a row", "Bronze", "Silver", "Gold", "Diamond"], how: "Weeks in a row with a round" },
      { id: "day_streak", cat: "Rounds", name: "Daily", icon: "☀️", value: dayStreak, tiers: [2, 5, 10, 30], how: "Days in a row with a round" },
      { id: "busy_month", cat: "Rounds", name: "Busy month", icon: "🗓️", value: monthMax, tiers: [4, 8, 15, 25], how: "Rounds in a single month" },
      { id: "all_season", cat: "Rounds", name: "All-season", icon: "🍂", value: monthsThisYear, tiers: [3, 6, 9, 12], how: "Months with a round this year" },
      { id: "year_rounds", cat: "Rounds", name: "This year", icon: "🎯", value: yearRounds, tiers: [10, 30, 60, 100], how: "Rounds this calendar year" },
      { id: "opening", cat: "Scoring", name: "Opening statement", icon: "1️⃣", value: firstHoleBirdies, tiers: [1, 10, 50], how: "Birdie hole 1" },
      { id: "walk_off", cat: "Scoring", name: "Walk-off", icon: "🏁", value: lastHoleBirdies, tiers: [1, 10, 50], how: "Birdie the last hole" },
      { id: "rated", cat: "Scoring", name: "Rated round", icon: "📊", value: bestRating, tiers: [800, 850, 900, 950, 1000], tierNames: ["800", "850", "900", "950", "1000"], how: "Best Chains rating for one round", detail: bestRating ? "best " + bestRating : "finish a full round" },
      { id: "cardmates", cat: "Social", name: "Cardmates", icon: "🧑‍🤝‍🧑", value: Object.keys(cardmates).length, tiers: [1, 5, 15, 40], how: "Different people you've played with" },
      { id: "ride_or_die", cat: "Social", name: "Ride or die", icon: "🚙", value: buddyMax, tiers: [5, 25, 100], how: "Rounds with the same buddy", detail: buddyName ? buddyMax + " with " + (buddyName.charAt(0).toUpperCase() + buddyName.slice(1)) : "play with a friend" },
      { id: "good_samaritan", cat: "Social", name: "Good Samaritan", icon: "🤝", value: lfReturned, tiers: [1, 3, 10], how: "Lost & found posts you marked returned" },
      { id: "land_grab", cat: "Takeover", name: "Land grab", icon: "🚩", value: tk.taken || 0, tiers: [1, 5, 25, 100, 500], tierNames: ["First take", "Bronze", "Silver", "Gold", "Diamond"], how: "Holes taken, lifetime" },
      { id: "holder", cat: "Takeover", name: "Holding", icon: "🧱", value: turf.holes || 0, tiers: [1, 10, 50, 200], how: "Holes you own right now" },
      { id: "raider", cat: "Takeover", name: "Raider", icon: "⚔️", value: Object.keys(tk.from || {}).length, tiers: [1, 5, 25, 100], how: "Different people you've taken a hole from" },
      { id: "sweep", cat: "Takeover", name: "Clean sweep", icon: "🧹", value: Object.keys(tk.sweeps || {}).length, tiers: [1, 5, 20], how: "Courses where you've owned every hole" },
      { id: "landlord", cat: "Takeover", name: "Landlord", icon: "🏘️", value: turf.courses || 0, tiers: [1, 3, 10], how: "Courses where you own at least one hole" },
      // ---- Hall of Shame (own it) ----
      { id: "snowman", cat: "Hall of Shame", name: "Snowman", icon: "☃️", value: snowmen, tiers: [1, 5, 20], how: "Card an 8 on a hole", shame: true },
      { id: "big_number", cat: "Hall of Shame", name: "Big number", icon: "🔟", value: bigNumbers, tiers: [1, 3, 10], how: "A 10+ on one hole. Respect the chaos.", shame: true },
      { id: "blow_up", cat: "Hall of Shame", name: "Blow-up hole", icon: "💥", value: blowUps, tiers: [1, 5, 20], how: "+4 or worse on a hole", shame: true },
      { id: "bogey_train", cat: "Hall of Shame", name: "Bogey train", icon: "🚂", value: bogeyTrains, tiers: [1, 5, 20], how: "4+ bogeys (or worse) in a row", shame: true },
      { id: "double_trouble", cat: "Hall of Shame", name: "Double trouble", icon: "😬", value: doubleTrouble, tiers: [1, 5, 20], how: "3+ doubles in one round", shame: true },
      { id: "ice_cold", cat: "Hall of Shame", name: "Ice cold", icon: "🧊", value: iceCold, tiers: [1, 5, 20], how: "A full round with zero birdies", shame: true },
      { id: "back_fade", cat: "Hall of Shame", name: "Ran out of gas", icon: "⛽", value: backFades, tiers: [1, 5, 20], how: "Back nine 3+ worse than the front", shame: true },
      { id: "early_exit", cat: "Hall of Shame", name: "Early exit", icon: "🚪", value: earlyExits, tiers: [1, 5, 20], how: "Finish a round early (3+ holes in)", shame: true },
      { id: "lost_disc", cat: "Hall of Shame", name: "Donated to the course", icon: "🌊", value: lostDiscs, tiers: [1, 5, 20], how: "Mark a disc lost in your bag", shame: true },
      // ---- Fantasy ----
      { id: "drafted_winner", cat: "Fantasy", name: "Drafted the winner", icon: "🏆", value: draftedWinner ? 1 : 0, tiers: [1], how: "Draft a pro who wins the event", detail: draftedWinnerDetail },
      { id: "comeback", cat: "Fantasy", name: "Comeback kid", icon: "🦸", value: wonFromBehind ? 1 : 0, tiers: [1], how: "Trail, then take over #1", detail: wonFromBehindDetail },
      { id: "podium", cat: "Fantasy", name: "Podium", icon: "🥉", value: podiums, tiers: [1, 5, 15], how: "Finish top 3 in a fantasy event" },
      { id: "event_win", cat: "Fantasy", name: "Week winner", icon: "🥇", value: eventWins, tiers: [1, 3, 10], how: "Win a fantasy event week" },
      { id: "both_under", cat: "Fantasy", name: "Both under", icon: "🧢", value: perfectWeeks, tiers: [1, 5, 15], how: "Both of your picks finish under par" },
      { id: "season_champ", cat: "Fantasy", name: "Season champion", icon: "🏆", value: seasonChamp ? 1 : 0, tiers: [1], secret: true, how: "Win the whole season" }
    ];
    var badges = defs.map(ladder);
    var cats = []; badges.forEach(function (b) { if (cats.indexOf(b.cat) < 0) cats.push(b.cat); });
    var earnedN = 0, points = 0; badges.forEach(function (b) { if (b.earned) { earnedN++; points += b.points; } });
    return {
      badges: badges, cats: cats, earnedCount: earnedN, points: points, maxPoints: badges.reduce(function (a, b) { return a + (b.tiers.length === 1 ? 1 : [1, 2, 3, 5, 8][Math.min(b.tiers.length, 5) - 1]); }, 0),
      streaks: { rounds: streak, winStreak: bestWinStreak },
      totals: { rounds: totalRounds, fullRounds: fullRounds, holes: holesPlayed, aces: aces, eagles: eagles, birdies: birdies, pars: pars, bogeys: bogeys, dbls: dbls, bestToPar: bestToPar, rivals: rivals, distinctCourses: distinctCourses, birdiePct: pct(birdies + eagles + aces, holesPlayed) }
    };
  }

  // "Just unlocked" tracking: snapshot of id->level in localStorage. diff() returns
  // badges whose level rose since the last snapshot (first call seeds silently).
  var SNAP_KEY = "chains_badges_seen_v2";
  function _authUid() { try { var u = w.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); return u && u.uid; } catch (e) { return null; } }
  function _db() { try { return w.ChainsFB && ChainsFB.ok ? ChainsFB.db : null; } catch (e) { return null; } }
  var _cloudSnap = null, _cloudSnapFor = null;
  // keep a cloud copy so a new phone doesn't re-announce every badge you already have
  function pullSnap(me) { var d = _db(), au = _authUid(); if (!d || !au || _cloudSnapFor === au) return; _cloudSnapFor = au; try { d.ref("users/" + au + "/badgeSnap").once("value").then(function (s) { var v = s.val(); if (v && typeof v === "object") { _cloudSnap = v; try { if (!localStorage.getItem(SNAP_KEY + ":" + me)) localStorage.setItem(SNAP_KEY + ":" + me, JSON.stringify(v)); } catch (e) {} } }).catch(function () {}); } catch (e) {} }
  // v509: merge local + cloud (max per badge) so a stale copy on one device never re-announces badges you already have
  function readSnap(me) { pullSnap(me); var loc = null; try { loc = JSON.parse(localStorage.getItem(SNAP_KEY + ":" + me) || "null"); } catch (e) {} if (!loc && !_cloudSnap) return null; var o = {}; [loc, _cloudSnap].forEach(function (src) { if (src && typeof src === "object") Object.keys(src).forEach(function (k) { o[k] = Math.max(o[k] || 0, +src[k] || 0); }); }); return o; }
  function writeSnap(me, badges) { var o = {}; badges.forEach(function (b) { o[b.id] = b.level; }); try { localStorage.setItem(SNAP_KEY + ":" + me, JSON.stringify(o)); } catch (e) {} var d = _db(), au = _authUid(); if (d && au) { try { d.ref("users/" + au + "/badgeSnap").set(o).catch(function () {}); } catch (e) {} } }
  function diff(result, me, commit) {
    me = me || whoami(); if (!result || !me) return [];
    var snap = readSnap(me);
    var out = [];
    if (snap) result.badges.forEach(function (b) { var was = snap[b.id] || 0; if (b.level > was) out.push(Object.assign({}, b, { from: was })); });
    if (commit !== false) writeSnap(me, result.badges);
    return out;
  }
  // v526 — SVG glyph per trophy (DESIGN.md: no emoji icons). Name of an Icons.* component.
  const GLYPH_BY_ID = { streak3: "Flame", day_streak: "Flame", week_streak: "Flame", marathon: "Flame", weekend: "Calendar", busy_month: "Calendar", all_season: "Calendar", year_rounds: "Calendar", season_finisher: "Calendar",
    holes: "Target", throws: "Disc", early_bird: "Sun", night_owl: "Star", perfect_week: "Medal", challenger: "Medal", challenge_streak: "Medal", double_dip: "Layers", lone_wolf: "User",
    first_ace: "Star", eagle: "Star", rated: "TrendUp", bounce_back: "TrendUp", back_nine: "TrendUp", hot_start: "TrendUp", opening: "TrendUp", walk_off: "TrendUp",
    hype: "Chat", good_samaritan: "Backpack", nemesis: "Target",
    states: "Compass", countries: "Compass", counties: "Compass", road_trip: "Compass", home_course: "Home", local_legend: "Home", repeat: "Home", course_pb: "Trophy", full_card_course: "Grid", week_variety: "Map",
    podium: "Medal", drafted_winner: "Star", season_champ: "Trophy",
    front_nine_set: "Grid", back_nine_set: "Grid", problem_solved: "Target", ghost: "TrendUp", birdie_run: "Flame", long_haul: "Compass", return_visit: "Reset", league_debut: "List", league_win: "Trophy" };
  const GLYPH_BY_CAT = { Rounds: "Disc", Weather: "Sun", Scoring: "Flag", Social: "Users", Courses: "Map", Takeover: "Pin", "Hall of Shame": "X", Fantasy: "Trophy" };
  function glyphName(b) { return (b && (GLYPH_BY_ID[b.id] || GLYPH_BY_CAT[b.cat])) || "Trophy"; }
  function tierColor(b) { return b && b.level ? (b.color || TIER_COLORS.Earned) : null; }

  w.ChainsBadges = { compute: compute, diff: diff, tierColor: tierColor, glyphName: glyphName, TIER_COLORS: TIER_COLORS, TIER_NAMES: TIER_NAMES };
})();
