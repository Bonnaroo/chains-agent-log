/* ============================================================
   CHAINS — Go Throw round store. window.ChainsRounds
   The persistence backbone for "Play a Round". Fixes the save
   bug (rounds only hit the cloud on FINISH, keyed by nothing) by
   persisting INCREMENTALLY and keyed by player IDENTITY (whoami),
   the same session leagues/friends already use.

   Writes (chains-app RTDB, never chains-fantasy):
     playRounds/{id}          full record (open + final)
     users/{whoami}/rounds/{id}=true   per-user index (so "My Rounds" is yours)
     liveRounds/{id}          lightweight mirror while status==open (Phase 3 watch)

   Round shape (matches the spec):
     { id, owner, course:{id,name,city,parTotal,pars[]}, date,
       players:{ key -> {name,disc,holeScores[18],total,thru} },
       status:"open"|"final", startedAt, updatedAt }
   ============================================================ */
(function () {
  var w = window;
  function fb() { return (w.ChainsFB && w.ChainsFB.ok) ? w.ChainsFB : null; }
  function db() { var f = fb(); return f ? f.db : null; }
  function whoami() { try { return (w.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; } catch (e) { return null; } }
  // REAL Firebase auth uid — NOT the app-level member id. users/$uid rules require
  // $uid === auth.uid, so every per-user index path must be keyed by THIS.
  function authUid() { try { var f = fb(); return (f && f.auth && f.auth.currentUser) ? f.auth.currentUser.uid : null; } catch (e) { return null; } }
  // Per-user round index write, keyed by the real auth uid, and kept OUT of the
  // atomic multi-path update — one illegal path in an update() kills the WHOLE
  // write (the v438 bug that silently broke both save and delete).
  function _indexWrite(d, id, val) {
    var au = authUid(); if (!d || !au) return Promise.resolve(false);
    try { var r = d.ref("users/" + au + "/rounds/" + id); var p = (val === null ? r.remove() : r.set(val)); return p.then(function () { return true; }, function () { return false; }); } catch (e) { return Promise.resolve(false); }
  }
  function uid() { return "pr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  // #43-freeze: coalesce bursts of emits (delete/bulk-delete/save in quick succession)
  // into one dispatch — the one "chains:rounds" listener re-fetches every round on
  // every fire, and an un-debounced burst is what was freezing the tab on discard.
  var _emitT = null;
  function emit() { if (_emitT) return; _emitT = setTimeout(function () { _emitT = null; try { w.dispatchEvent(new Event("chains:rounds")); } catch (e) {} }, 150); }
  function nowISO() { return new Date().toISOString(); }

  // Firebase drops nulls and serializes sparse arrays as objects ({"2":3,"3":4}).
  // Restore a REAL array, keeping every score at its original hole index (never
  // compact — pars must stay aligned). Gaps come back as null.
  function toArr(hs) {
    if (Array.isArray(hs)) return hs;
    if (!hs || typeof hs !== "object") return [];
    var out = [];
    Object.keys(hs).forEach(function (k) { var i = Math.floor(Number(k)); if (isFinite(i) && i >= 0) out[i] = hs[k]; });
    for (var j = 0; j < out.length; j++) if (out[j] === undefined) out[j] = null;
    return out;
  }
  // Normalize every array-ish field on a round record read back from the cloud
  // (or from a local mirror that cached a cloud read). Mutates + returns r.
  function fixRound(r) {
    if (!r || typeof r !== "object") return r;
    try {
      if (r.players && typeof r.players === "object") Object.keys(r.players).forEach(function (k) { var p = r.players[k]; if (p && p.holeScores != null && !Array.isArray(p.holeScores)) p.holeScores = toArr(p.holeScores); });
      if (r.hole_scores && typeof r.hole_scores === "object") Object.keys(r.hole_scores).forEach(function (k) { var v = r.hole_scores[k]; if (v != null && !Array.isArray(v)) r.hole_scores[k] = toArr(v); });
      if (r.course && r.course.pars != null && !Array.isArray(r.course.pars)) r.course.pars = toArr(r.course.pars);
      if (r.pars != null && !Array.isArray(r.pars)) r.pars = toArr(r.pars);
      if (r.lens != null && !Array.isArray(r.lens)) r.lens = toArr(r.lens);
    } catch (e) {}
    return r;
  }

  // ---- write hardening: instead of fire-and-forget, surface a (debounced) toast
  // when a cloud write actually fails. The local mirror has already saved, so data
  // isn't lost — this just tells the user the SYNC didn't land. ----
  var _lastErrAt = 0;
  function _toast(msg, kind) { try { if (w.ChainsToast) ChainsToast.show(msg, kind || "error"); } catch (e) {} }
  function _failOnce(msg, e, where) {
    var t = Date.now(); if (t - _lastErrAt > 6000) { _lastErrAt = t; _toast(msg || "Couldn't sync to the cloud \u2014 saved on this device."); }
    try { console.warn("[ChainsRounds] write failed" + (where ? " @" + where : ""), e); } catch (x) {}
  }
  // v484: bell notifications (league feed the bell already reads). audience = member ids.
  function _notify(aud, title, body, link) {
    try {
      var me = whoami(); aud = (aud || []).filter(function (k) { return k && k !== me && !/^guest/.test(k); });
      aud = aud.filter(function (k, i) { return aud.indexOf(k) === i; });
      if (!aud.length || !w.ChainsNotify || !ChainsNotify.post) return;
      ChainsNotify.post({ id: "n-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type: "round", title: title, body: body, audience: aud, link: link || "play" });
    } catch (e) {}
  }
  function _myName() {
    var me = whoami();
    try { var m = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(me) : null; if (m && m.name) return m.name; } catch (e) {}
    try { var u = w.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); var lp = u && ChainsAuth.localProfile && ChainsAuth.localProfile(u.uid); if (lp && (lp.displayName || lp.name)) return lp.displayName || lp.name; if (u && u.username) return u.username; } catch (e) {}
    return me ? me.charAt(0).toUpperCase() + me.slice(1) : "Someone";
  }
  function _friendIds() { try { return (w.ChainsFriends && ChainsFriends.list ? ChainsFriends.list() : []).map(function (f) { return f.uid; }).filter(Boolean); } catch (e) { return []; } }
  function _quiet(d, u) { try { return d.ref().update(u).then(function () { return true; }, function () { return false; }); } catch (e) { return Promise.resolve(false); } }
  // Shared-round paths (open to every signed-in phone) vs the owner-only mirror.
  function SR(id) { return "sharedRounds/" + id; }
  function _sharedOf(rec) {
    return { id: rec.id, owner: rec.owner || null, ownerKey: rec.ownerKey || null, course: rec.course, date: rec.date, players: rec.players, participants: rec.participants || {}, weather: rec.weather || null, status: rec.status || "open", startedAt: rec.startedAt, updatedAt: rec.updatedAt };
  }
  function _indexParticipants(u, id, participants, val) {
    Object.keys(participants || {}).forEach(function (k) { u["roundsByPlayer/" + k + "/" + id] = val; });
  }
  function _commit(d, u, failMsg) {
    try {
      var p = d.ref().update(u);
      if (!p || !p.then) return Promise.resolve(true);
      return p.then(function () { return true; }).catch(function (e) { _failOnce(failMsg, e); return false; });
    } catch (e) { _failOnce(failMsg, e); return Promise.resolve(false); }
  }

  // Local mirror so My Rounds works offline and survives a refresh mid-round.
  var LK = "chains_rounds_v1";
  function readLocal() { try { var o = JSON.parse(localStorage.getItem(LK) || "{}") || {}; Object.keys(o).forEach(function (k) { fixRound(o[k]); }); return o; } catch (e) { return {}; } }
  function writeLocal(o) { try { localStorage.setItem(LK, JSON.stringify(o)); } catch (e) {} }
  function putLocal(r) { var o = readLocal(); o[r.id] = r; writeLocal(o); }

  // Build the players map from a scoring group + per-key hole arrays. `totals` is a
  // fallback for total-only rounds (no hole-by-hole): store the total directly.
  function playersFrom(group, scores, pars, totals) {
    var out = {};
    var N = pars ? pars.length : 18;
    (group || []).forEach(function (g) {
      var key = g.id || g.key; if (!key) return;
      var arr = toArr(scores && scores[key]);
      var hasHoles = arr.some(function (s) { return s != null; });
      var hs = [], total = 0, thru = 0;
      if (hasHoles) {
        for (var i = 0; i < N; i++) {
          var s = arr[i];
          if (s != null) { hs[i] = s; total += (s - (pars && pars[i] != null ? pars[i] : 3)); thru = i + 1; }
          else hs[i] = null;
        }
      } else {
        for (var j = 0; j < N; j++) hs[j] = null;
        total = (totals && totals[key] != null) ? totals[key] : 0;
        thru = (totals && totals[key] != null) ? N : 0;
      }
      out[key] = { name: g.name || "Player", disc: g.color || g.disc || "#9CA3AF", holeScores: hs, total: total, thru: thru };
    });
    return out;
  }

  function courseShape(c) {
    c = c || {};
    var pars = (c.hole_pars && c.hole_pars.length) ? c.hole_pars : null;
    return {
      id: c.id || null, name: c.name || "Round", city: c.city || null,
      pars: pars, parTotal: c.par_total != null ? c.par_total : (pars ? pars.reduce(function (a, b) { return a + b; }, 0) : null),
      holes: pars ? pars.length : (c.holes || 18)
    };
  }

  function ctxPars(ctx) { return (ctx && ctx.pars) || (ctx && ctx.course && ctx.course.hole_pars) || null; }
  // Create (or adopt) the open round record. Returns the id; caller persists it
  // in the active-round localStorage so subsequent saves reuse the SAME id.
  function start(ctx) {
    var id = (ctx && ctx.id) || uid();
    var owner = authUid(), ownerKey = whoami();
    var pars = ctxPars(ctx);
    var rec = {
      id: id, owner: owner, ownerKey: ownerKey, course: courseShape(ctx && ctx.course), date: nowISO().slice(0, 10),
      players: playersFrom(ctx && ctx.group, ctx && ctx.scores, pars, ctx && ctx.totals),
      weather: (ctx && ctx.weather) || null,
      status: "open", startedAt: nowISO(), updatedAt: nowISO()
    };
    rec.participants = participantsOf(rec.players);
    putLocal(rec);
    var d = db();
    if (d && owner) {
      try {
        var u = {};
        u["playRounds/" + id] = rec;
        u["liveRounds/" + id] = { id: id, owner: owner, ownerKey: ownerKey, course: rec.course.name, city: rec.course.city, players: Object.keys(rec.players).map(function (k) { return rec.players[k].name; }), keys: Object.keys(rec.players), thru: 0, toPar: 0, status: "open", updatedAt: rec.updatedAt };
        _commit(d, u);
        var us = {}; us[SR(id)] = _sharedOf(rec); _indexParticipants(us, id, rec.participants, true);
        _commit(d, us, "Couldn\u2019t open the shared round \u2014 friends won\u2019t see it until you\u2019re back online.");
        _indexWrite(d, id, true);
        // v484: ping the card (they can score from their phone) and the friends (they can watch)
        var cardKeys = Object.keys(rec.participants || {}).filter(function (k) { return k !== ownerKey; });
        var where = rec.course && rec.course.name ? rec.course.name : "a round";
        if (cardKeys.length) _notify(cardKeys, "You\u2019re on " + _myName() + "\u2019s card", where + " \u2014 open Go Throw to score from your phone.", "play");
        var fr = _friendIds().filter(function (k) { return cardKeys.indexOf(k) < 0; });
        if (fr.length) _notify(fr, _myName() + " is playing " + where, (cardKeys.length ? "With " + cardKeys.map(function (k) { return rec.players[k] && rec.players[k].name || k; }).join(", ") + ". " : "") + "Tap to watch live.", "play");
      } catch (e) {}
    }
    emit();
    return id;
  }

  // Incremental save while playing — patch players + the live mirror. Debounce in
  // the caller; this just writes current state. No-op safely when signed out
  // (the local mirror still updates so nothing is lost).
  function save(ctx) {
    if (!ctx || !ctx.id) return;
    var owner = whoami();
    var pars = ctxPars(ctx);
    var players = playersFrom(ctx.group, ctx.scores, pars, ctx.totals);
    var prev = readLocal()[ctx.id] || {};
    var au = authUid();
    var rec = Object.assign({}, prev, {
      id: ctx.id, owner: prev.owner || au || null, ownerKey: prev.ownerKey || owner || null, course: courseShape(ctx.course),
      date: prev.date || nowISO().slice(0, 10), players: players,
      weather: ctx.weather || prev.weather || null,
      status: ctx.status || prev.status || "open", startedAt: prev.startedAt || nowISO(), updatedAt: nowISO()
    });
    rec.participants = Object.assign({}, prev.participants || {}, participantsOf(players));
    putLocal(rec);
    var d = db();
    if (d) {
      // shared record: status + participants (players travel per cell; a full overwrite
      // here from a phone that's behind would clobber someone else's entries)
      var sh = {}; sh[SR(ctx.id) + "/status"] = rec.status; sh[SR(ctx.id) + "/updatedAt"] = rec.updatedAt; sh[SR(ctx.id) + "/course"] = rec.course;
      if (rec.status === "final") sh[SR(ctx.id) + "/finishedBy"] = owner || null;
      Object.keys(rec.participants || {}).forEach(function (k) { sh[SR(ctx.id) + "/participants/" + k] = true; });
      _indexParticipants(sh, ctx.id, rec.participants, true);
      _quiet(d, sh);
    }
    if (d && rec.owner && rec.owner === au && rec.status === "final" && rec.course && rec.course.id != null) {
      // v484: app-wide course board. FULL rounds only (every hole scored), per player.
      try {
        var N0 = rec.course.holes || (rec.course.pars ? rec.course.pars.length : 18), ent = {}, any = false;
        Object.keys(players).forEach(function (k) {
          var p = players[k]; var hs = toArr(p.holeScores); var played = 0, strokes = 0;
          for (var i = 0; i < N0; i++) if (hs[i] != null) { played++; strokes += hs[i]; }
          var birdies = 0, bogeys = 0, prs = rec.course.pars ? toArr(rec.course.pars) : null;
          if (prs) for (var q = 0; q < N0; q++) { if (hs[q] == null || prs[q] == null) continue; if (hs[q] < prs[q]) birdies++; else if (hs[q] > prs[q]) bogeys++; }
          if (played === N0 && played > 0) { ent[k] = { name: p.name, total: p.total, strokes: strokes, birdies: birdies, bogeys: bogeys, hs: hs.slice(0, N0) }; any = true; }
        });
        if (any && !rec.practice) {
          var cs = {}; cs["courseStats/" + String(rec.course.id).replace(/[.#$\[\]\/]/g, "_") + "/" + ctx.id] = { id: ctx.id, ownerKey: rec.ownerKey || null, name: rec.course.name, date: rec.date, holes: N0, parTotal: rec.course.parTotal, pars: prs || null, players: ent, updatedAt: rec.updatedAt };
          _quiet(d, cs);
        }
      } catch (e) {}
    }
    if (d && rec.owner && rec.owner === au) {
      try {
        // leader to-par + max thru across the group for the live mirror
        var keys = Object.keys(players), thru = 0, lead = null;
        keys.forEach(function (k) { var p = players[k]; if (p.thru > thru) thru = p.thru; if (lead == null || p.total < lead) lead = p.total; });
        var u = {};
        u["playRounds/" + ctx.id] = rec;
        if (rec.status === "open") {
          u["liveRounds/" + ctx.id] = { id: ctx.id, owner: rec.owner, ownerKey: rec.ownerKey || null, course: rec.course.name, city: rec.course.city, players: keys.map(function (k) { return players[k].name; }), keys: keys, thru: thru, toPar: lead == null ? 0 : lead, status: "open", updatedAt: rec.updatedAt };
        }
        _commit(d, u);
        _indexWrite(d, ctx.id, true);
      } catch (e) {}
    }
    emit();
    return rec;
  }

  // Finalize: status final, drop from liveRounds. Returns the saved record.
  function finalize(ctx) {
    if (!ctx || !ctx.id) { return save(Object.assign({ status: "final" }, ctx)); }
    var rec = save(Object.assign({}, ctx, { status: "final" }));
    var d = db();
    // Mark the live mirror final FIRST (so a failed remove can't leave a finished
    // round showing forever in friends' "Live now"), then remove it.
    if (d) {
      try {
        d.ref("liveRounds/" + ctx.id + "/status").set("final")
          .catch(function () {})
          .then(function () { return d.ref("liveRounds/" + ctx.id).remove(); })
          .catch(function (e) {
            // v488: a remove of a mirror that was never written is refused by the rules
            // (nothing to own) - that's not a failure. Only shout if it's really still there.
            try { d.ref("liveRounds/" + ctx.id).once("value").then(function (s) { if (s.exists() && rec && rec.owner === authUid()) _failOnce("Round finished, but the cloud didn't update \u2014 it'll retry.", e, "finalize-cleanup"); }).catch(function () {}); } catch (e2) {}
          });
      } catch (e) {}
    }
    return rec;
  }

  // v479: app users on the card (guest rows never index) -> participants/{key}=true so a
  // round shows up in EVERY participant's history, not only the owner's.
  function participantsOf(players) {
    var o = {}; Object.keys(players || {}).forEach(function (k) { if (!/^guest/.test(k)) o[k] = true; }); return o;
  }
  // v479 SHARED SCORING, per CELL: any phone on the card writes ONE hole for ONE
  // player (players/{key}/holeScores/{h}) plus that row's total/thru. Path-separated,
  // so four phones scoring the same round never overwrite each other. `arr` is the
  // caller's current view of that row WITH the new value; `summary` (optional) is the
  // live-mirror digest {thru,toPar,players[],keys[]} for the Live now feed.
  function setCell(id, key, h, v, pars, arr, summary) {
    var d = db(); if (!d || !id || !key || h == null) return Promise.resolve(false);
    var N = pars ? pars.length : Math.max(18, (arr || []).length);
    var total = 0, thru = 0;
    for (var i = 0; i < N; i++) { var s = arr && arr[i]; if (s != null) { total += (s - (pars && pars[i] != null ? pars[i] : 3)); thru = i + 1; } }
    var ts = nowISO();
    // 1) the shared record - every phone on the card can write this
    var sb = SR(id) + "/players/" + key + "/";
    var su = {};
    su[sb + "holeScores/" + h] = v == null ? null : v;
    su[sb + "total"] = total;
    su[sb + "thru"] = thru;
    su[SR(id) + "/updatedAt"] = ts;
    // 2) the owner-only mirror (history + Live now) - quiet, fails harmlessly on other phones
    var base = "playRounds/" + id + "/players/" + key + "/";
    var u = {};
    u[base + "holeScores/" + h] = v == null ? null : v;
    u[base + "total"] = total;
    u[base + "thru"] = thru;
    u["playRounds/" + id + "/updatedAt"] = ts;
    u["liveRounds/" + id + "/updatedAt"] = ts;
    if (summary) {
      if (summary.thru != null) u["liveRounds/" + id + "/thru"] = summary.thru;
      if (summary.toPar != null) u["liveRounds/" + id + "/toPar"] = summary.toPar;
      if (summary.players) u["liveRounds/" + id + "/players"] = summary.players;
      if (summary.keys) u["liveRounds/" + id + "/keys"] = summary.keys;
    }
    _quiet(d, u);
    u = su;
    // local mirror follows (so an offline resume still has the score)
    try { var o = readLocal(); var r = o[id]; if (r && r.players && r.players[key]) { var hs = toArr(r.players[key].holeScores); hs[h] = v; r.players[key].holeScores = hs; r.players[key].total = total; r.players[key].thru = thru; r.updatedAt = nowISO(); writeLocal(o); } } catch (e) {}
    return _commit(d, u, "Couldn\u2019t send that score \u2014 it\u2019ll retry on your next tap.");
  }
  // v479: par adjusted mid-round -> every phone on the card sees the same layout.
  function setPars(id, pars) {
    var d = db(); if (!d || !id || !pars) return Promise.resolve(false);
    var pt = pars.reduce(function (a, b) { return a + (b || 0); }, 0), ts = nowISO();
    var u = {}; u["playRounds/" + id + "/course/pars"] = pars; u["playRounds/" + id + "/course/parTotal"] = pt; u["playRounds/" + id + "/updatedAt"] = ts; _quiet(d, u);
    var su = {}; su[SR(id) + "/course/pars"] = pars; su[SR(id) + "/course/parTotal"] = pt; su[SR(id) + "/updatedAt"] = ts;
    return _commit(d, su, "Couldn\u2019t sync the par change.");
  }
  // v479: add a player to an OPEN round from any phone on the card.
  function addPlayer(id, g, pars) {
    var d = db(); var key = g && (g.id || g.key); if (!d || !id || !key) return Promise.resolve(false);
    var N = pars ? pars.length : 18; var hs = []; for (var i = 0; i < N; i++) hs[i] = null;
    var row = { name: g.name || "Player", disc: g.color || g.disc || "#9CA3AF", holeScores: hs, total: 0, thru: 0 }, ts = nowISO();
    var u = {};
    u["playRounds/" + id + "/players/" + key] = row;
    if (!/^guest/.test(key)) u["playRounds/" + id + "/participants/" + key] = true;
    u["playRounds/" + id + "/updatedAt"] = ts; _quiet(d, u);
    var su = {};
    su[SR(id) + "/players/" + key] = row;
    if (!/^guest/.test(key)) { su[SR(id) + "/participants/" + key] = true; su["roundsByPlayer/" + key + "/" + id] = true; }
    su[SR(id) + "/updatedAt"] = ts;
    if (!/^guest/.test(key)) _notify([key], "You\u2019re on " + _myName() + "\u2019s card", "Open Go Throw to score from your phone.", "play");
    return _commit(d, su, "Couldn\u2019t add them \u2014 try again.");
  }
  // v484 SOCIAL: cheer (check in) on a round and leave comments. Open path; anyone signed in.
  function cheer(id, emoji) {
    var d = db(), me = whoami(); if (!d || !id || !me) return Promise.resolve(false);
    var u = {}; u[SR(id) + "/cheers/" + me] = { name: _myName(), emoji: emoji || "\uD83D\uDD25", ts: Date.now() };
    return _commit(d, u, "Couldn\u2019t send that \u2014 try again.");
  }
  function uncheer(id) {
    var d = db(), me = whoami(); if (!d || !id || !me) return Promise.resolve(false);
    return d.ref(SR(id) + "/cheers/" + me).remove().then(function () { return true; }, function () { return false; });
  }
  function comment(id, text, participants) {
    var d = db(), me = whoami(); text = String(text || "").trim().slice(0, 280);
    if (!d || !id || !me || !text) return Promise.resolve(false);
    var key = "c-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    var u = {}; u[SR(id) + "/comments/" + key] = { by: me, name: _myName(), text: text, ts: Date.now() };
    var p = _commit(d, u, "Couldn\u2019t post that \u2014 try again.");
    try { _notify(Object.keys(participants || {}), _myName() + " commented on your round", "\u201C" + text + "\u201D", "play"); } catch (e) {}
    return p;
  }
  // App-wide course board: every FULL final round at a course, any Chains user.
  function courseBoard(courseId) {
    var d = db(); if (!d || courseId == null) return Promise.resolve([]);
    return d.ref("courseStats/" + String(courseId).replace(/[.#$\[\]\/]/g, "_")).get().then(function (s) { var v = s.val() || {}; return Object.keys(v).map(function (k) { return v[k]; }).filter(Boolean); }, function () { return []; });
  }
  // Rank every player's BEST full round at the course (lower to-par wins). Returns
  // { entries: [{key,name,best,rounds,date}], me: {rank, best} | null, rounds: n }.
  function courseRanking(board, me) {
    var by = {}, n = 0;
    (board || []).forEach(function (r) {
      n++;
      Object.keys(r.players || {}).forEach(function (k) {
        var p = r.players[k]; if (!p || p.total == null) return;
        if (!by[k]) by[k] = { key: k, name: p.name || k, best: p.total, rounds: 0, date: r.date, strokes: p.strokes };
        by[k].rounds++;
        if (p.total < by[k].best || (p.total === by[k].best && String(r.date || "") > String(by[k].date || ""))) { by[k].best = p.total; by[k].date = r.date; by[k].strokes = p.strokes; by[k].name = p.name || by[k].name; }
      });
    });
    var entries = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return a.best - b.best || String(a.date || "").localeCompare(String(b.date || "")); });
    var mine = null; entries.forEach(function (e, i) { if (e.key === me) mine = { rank: i + 1, best: e.best, of: entries.length }; });
    return { entries: entries, me: mine, rounds: n, players: entries.length };
  }
  // v504 TERRITORY: who owns a course. King = most full rounds (tie → better average);
  // Record = lowest full-round score (tie → earlier date). Everyone's data, one read.
  function courseTerritory(board, me, fallbackPars) {
    var by = {};
    (board || []).forEach(function (r) {
      Object.keys(r.players || {}).forEach(function (k) {
        var p = r.players[k]; if (!p || p.total == null) return;
        var e = by[k] || (by[k] = { key: k, name: p.name || k, rounds: 0, sum: 0, best: null, bestDate: null, last: null, birdies: 0, bogeys: 0 });
        e.rounds++; e.sum += p.total; e.name = p.name || e.name; e.birdies += (p.birdies || 0); e.bogeys += (p.bogeys || 0);
        if (e.best == null || p.total < e.best || (p.total === e.best && String(r.date || "") < String(e.bestDate || ""))) { e.best = p.total; e.bestDate = r.date; }
        if (!e.last || String(r.date || "") > String(e.last)) e.last = r.date;
      });
    });
    var list = Object.keys(by).map(function (k) { var e = by[k]; e.avg = e.rounds ? e.sum / e.rounds : null; return e; });
    var king = list.slice().sort(function (a, b) { return b.rounds - a.rounds || a.avg - b.avg || String(a.last || "").localeCompare(String(b.last || "")); })[0] || null;
    var record = list.slice().sort(function (a, b) { return a.best - b.best || String(a.bestDate || "").localeCompare(String(b.bestDate || "")); })[0] || null;
    var birdieKing = list.filter(function (e) { return e.birdies > 0; }).sort(function (a, b) { return b.birdies - a.birdies || a.avg - b.avg; })[0] || null;
    var steady = list.filter(function (e) { return e.rounds >= 3; }).sort(function (a, b) { return a.avg - b.avg || b.rounds - a.rounds; })[0] || null;
    // v528 — crowns v2 (CHALLENGES.md §5): season champion, local regular, birdie leader (distinct holes).
    var year = String(new Date().getFullYear()), cut90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    var season = {}, days = {}, holesBird = {};
    (board || []).forEach(function (r) {
      var dte = String(r.date || "").slice(0, 10); var prs = r.pars ? toArr(r.pars) : (fallbackPars ? toArr(fallbackPars) : null);
      Object.keys(r.players || {}).forEach(function (k) {
        var p = r.players[k]; if (!p || p.total == null) return;
        if (dte.slice(0, 4) === year) {
          var sE = season[k] || (season[k] = { key: k, name: p.name || k, best: null, bestDate: null, rounds: 0 });
          sE.rounds++; if (sE.best == null || p.total < sE.best || (p.total === sE.best && dte < String(sE.bestDate || ""))) { sE.best = p.total; sE.bestDate = dte; }
          if (prs && p.hs) { var hb = holesBird[k] || (holesBird[k] = { key: k, name: p.name || k, set: {} }); var hs = toArr(p.hs); for (var i = 0; i < hs.length; i++) if (hs[i] != null && prs[i] != null && hs[i] < prs[i]) hb.set[i] = 1; }
        }
        if (dte >= cut90) { var dE = days[k] || (days[k] = { key: k, name: p.name || k, set: {} }); dE.set[dte] = 1; }
      });
    });
    var champion = Object.keys(season).map(function (k) { return season[k]; }).sort(function (a, b) { return a.best - b.best || String(a.bestDate).localeCompare(String(b.bestDate)); })[0] || null;
    var regular = Object.keys(days).map(function (k) { var e = days[k]; e.days = Object.keys(e.set).length; return e; }).filter(function (e) { return e.days >= 3; }).sort(function (a, b) { return b.days - a.days || a.name.localeCompare(b.name); })[0] || null;
    var birdieLeader = Object.keys(holesBird).map(function (k) { var e = holesBird[k]; e.holes = Object.keys(e.set).length; return e; }).filter(function (e) { return e.holes > 0; }).sort(function (a, b) { return b.holes - a.holes; })[0] || null;
    // most improved: 10+ full rounds here; first five average minus last five average (strokes to par)
    var seq = {};
    (board || []).slice().sort(function (a, b) { return String(a.date || "").localeCompare(String(b.date || "")); }).forEach(function (r) {
      Object.keys(r.players || {}).forEach(function (k) { var p = r.players[k]; if (!p || p.total == null) return; (seq[k] = seq[k] || { key: k, name: p.name || k, tps: [] }).tps.push(p.total); });
    });
    var improved = Object.keys(seq).map(function (k) { var e = seq[k]; if (e.tps.length < 10) return null; var f = e.tps.slice(0, 5), l = e.tps.slice(-5); var avg = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }; e.drop = Math.round((avg(f) - avg(l)) * 10) / 10; e.rounds = e.tps.length; return e; }).filter(function (e) { return e && e.drop > 0; }).sort(function (a, b) { return b.drop - a.drop; })[0] || null;
    var mine = by[me] || null;
    return { players: list, king: king, record: record, birdieKing: birdieKing, steady: steady, me: mine, champion: champion, regular: regular, birdieLeader: birdieLeader, improved: improved, year: year, isKing: !!(king && me && king.key === me), hasRecord: !!(record && me && record.key === me), isBirdieKing: !!(birdieKing && me && birdieKing.key === me), isSteady: !!(steady && me && steady.key === me),
      toKing: king && mine && king.key !== me ? (king.rounds - mine.rounds + 1) : (king ? 0 : 1), rounds: (board || []).length };
  }
  /* ---- v513 Takeover: every hole at every course has one owner. You own a hole by having the best
     average on it over your last 5 plays there inside the last 90 days (ties: more plays, then the
     one who's held it). Stop playing and it fades back to open. Data: courseStats entries carry
     per-hole scores (`hs`); the owner map is persisted at territory/{course}/holes/{n} by whoever
     finishes a round (so the previous owner can be told), and territory/{course}/meta. ---- */
  var TK_DAYS = 90, TK_LAST = 5, TK_MIN = 3; // v522: a hole can't be owned off one visit — three plays minimum
  function takeoverCompute(board, nowISO_) {
    var cutoff = new Date(Date.now() - TK_DAYS * 86400000).toISOString().slice(0, 10);
    var entries = (board || []).filter(function (r) { return r && r.date && String(r.date).slice(0, 10) >= cutoff; }).sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); });
    var N = 0; entries.forEach(function (r) { N = Math.max(N, r.holes || 0); });
    if (!N) { (board || []).forEach(function (r) { N = Math.max(N, r.holes || 0); }); }
    var per = {}; // key -> { name, holes: [ [scores...] ] }
    entries.forEach(function (r) {
      Object.keys(r.players || {}).forEach(function (k) {
        var p = r.players[k]; if (!p || !p.hs) return; var hs = toArr(p.hs);
        var e = per[k] || (per[k] = { key: k, name: p.name || k, holes: [], plays: 0 });
        e.plays++;
        for (var i = 0; i < N; i++) { if (hs[i] == null) continue; (e.holes[i] = e.holes[i] || []); if (e.holes[i].length < TK_LAST) e.holes[i].push(hs[i]); }
      });
    });
    var holes = [];
    for (var i = 0; i < N; i++) {
      var cont = [];
      Object.keys(per).forEach(function (k) { var arr = per[k].holes[i]; if (!arr || arr.length < TK_MIN) return; cont.push({ key: k, name: per[k].name, avg: arr.reduce(function (a, b) { return a + b; }, 0) / arr.length, plays: arr.length }); });
      cont.sort(function (a, b) { return a.avg - b.avg || b.plays - a.plays || a.name.localeCompare(b.name); });
      holes.push({ hole: i + 1, owner: cont[0] || null, contenders: cont });
    }
    var byPlayer = {};
    holes.forEach(function (h) { if (!h.owner) return; var b = byPlayer[h.owner.key] || (byPlayer[h.owner.key] = { key: h.owner.key, name: h.owner.name, holes: [] }); b.holes.push(h.hole); });
    return { holes: holes, byPlayer: byPlayer, open: holes.filter(function (h) { return !h.owner; }).length, N: N, players: Object.keys(per).length };
  }
  // Persist the owner map for a course and tell people who lost holes. Returns { took:[], lost:[], map }.
  function takeoverSync(courseId, board, me, courseName) {
    var d = db(); var cid = String(courseId).replace(/[.#$\[\]\/]/g, "_");
    var t = takeoverCompute(board);
    if (!d) return Promise.resolve({ took: [], lost: [], t: t });
    return d.ref("territory/" + cid + "/holes").get().then(function (s) {
      var prev = s.val() || {}; var upd = {}; var took = [], lost = [], lostBy = {};
      t.holes.forEach(function (h) {
        var was = prev[h.hole] || null; var now = h.owner ? { key: h.owner.key, name: h.owner.name, avg: Math.round(h.owner.avg * 100) / 100, plays: h.owner.plays } : null;
        var changed = (!was && now) || (was && !now) || (was && now && was.key !== now.key);
        if (changed || (now && was && (was.avg !== now.avg || was.plays !== now.plays))) {
          upd["territory/" + cid + "/holes/" + h.hole] = now ? Object.assign({}, now, { since: changed ? Date.now() : (was.since || Date.now()) }) : null;
        }
        if (changed && now && now.key === me) took.push({ hole: h.hole, from: was ? was.name : null, fromKey: was ? was.key : null });
        if (changed && was && was.key === me) lost.push({ hole: h.hole, to: now ? now.name : null, toKey: now ? now.key : null });
        if (changed && was && now && was.key !== now.key && was.key !== me) { (lostBy[was.key] = lostBy[was.key] || []).push(h.hole); }
      });
      // sweep = one player owns every hole at the course
      var sweeper = null; Object.keys(t.byPlayer).forEach(function (k) { if (t.N && t.byPlayer[k].holes.length === t.N) sweeper = { key: k, name: t.byPlayer[k].name }; });
      upd["territory/" + cid + "/meta"] = { name: courseName || (board && board[0] && board[0].name) || cid, updatedAt: Date.now(), holes: t.N, open: t.open, sweptBy: sweeper ? sweeper.key : null, sweptName: sweeper ? sweeper.name : null };
      // monthly change log (who took what from whom) → the race board + "land grab" counters
      var month = new Date().toISOString().slice(0, 7);
      t.holes.forEach(function (h) {
        var was = prev[h.hole] || null; var now = h.owner || null;
        var changed = (!was && now) || (was && now && was.key !== now.key);
        if (!changed) return;
        var lid = "l-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        upd["territoryLog/" + month + "/" + lid] = { cid: cid, course: (courseName || "").replace(/ disc golf.*$/i, "") || cid, hole: h.hole, to: now.key, toName: now.name, from: was ? was.key : null, fromName: was ? was.name : null, at: Date.now() };
      });
      // my own counters (badge ladders): holes taken lifetime, distinct people taken from, course sweeps
      if (me) {
        var tookNow = t.holes.filter(function (h) { var was = prev[h.hole] || null; return h.owner && h.owner.key === me && (!was || was.key !== me); });
        var fromKeys = tookNow.map(function (h) { var was = prev[h.hole]; return was ? was.key : null; }).filter(Boolean);
        var au2 = _authUid();
        if (au2 && (tookNow.length || (sweeper && sweeper.key === me))) {
          var tk = {}; try { tk = JSON.parse(localStorage.getItem("chains_takeover_counts_v1:" + me) || "{}") || {}; } catch (e) {}
          tk.taken = (tk.taken || 0) + tookNow.length; tk.from = tk.from || {}; fromKeys.forEach(function (k) { tk.from[k] = true; });
          tk.sweeps = tk.sweeps || {}; if (sweeper && sweeper.key === me) tk.sweeps[cid] = true;
          try { localStorage.setItem("chains_takeover_counts_v1:" + me, JSON.stringify(tk)); } catch (e) {}
          upd["users/" + au2 + "/takeover"] = { taken: tk.taken, from: tk.from, sweeps: tk.sweeps, at: Date.now() };
        }
      }
      var mine = (t.byPlayer[me] && t.byPlayer[me].holes) || [];
      if (me) upd["territory/" + cid + "/held/" + me] = mine.length ? { name: (t.byPlayer[me] || {}).name || me, count: mine.length, holes: mine, at: Date.now() } : null;
      Object.keys(t.byPlayer).forEach(function (k) { if (k === me) return; var b = t.byPlayer[k]; upd["territory/" + cid + "/held/" + k] = { name: b.name, count: b.holes.length, holes: b.holes, at: Date.now() }; });
      // players who held something before but hold nothing now
      Object.keys(prev).forEach(function (n) { var w = prev[n]; if (w && w.key && !t.byPlayer[w.key] && w.key !== me) upd["territory/" + cid + "/held/" + w.key] = null; });
      var nm = courseName || (board && board[0] && board[0].name) || "the course";
      Object.keys(lostBy).forEach(function (k) {
        var hs = lostBy[k].sort(function (a, b) { return a - b; });
        _notify([k], _myName() + " took hole" + (hs.length > 1 ? "s " : " ") + hs.join(", ") + " at " + nm.replace(/ disc golf.*$/i, ""), "It was yours. Go get it back.", "play");
      });
      // v528 — crowns (course record · champion this year · local regular · birdie leader this year):
      // persisted at territory/{course}/crowns/{id}; a lost crown becomes a dated line in
      // territory/{course}/heldLog/{player}, and the previous holder is told.
      var catC = null; try { var cat = (w.ChainsCatalog && ChainsCatalog.get && ChainsCatalog.get()) || w.CATALOG || []; catC = cat.find(function (c) { return c && String(c.id) === String(courseId); }) || null; } catch (e) {}
      var lead = courseTerritory(board, me, catC ? (catC.hole_pars || catC.pars || null) : null); var short = nm.replace(/ disc golf.*$/i, "");
      var crowns = { record: [lead.record, "Course record"], champion: [lead.champion, "Course champion " + lead.year], regular: [lead.regular, "Local regular"], birdieLeader: [lead.birdieLeader, "Birdie leader " + lead.year], improved: [lead.improved, "Most improved"] };
      return d.ref("territory/" + cid + "/crowns").get().then(function (cs) { return cs.val() || {}; }, function () { return {}; }).then(function (prevC) {
        var now = Date.now();
        Object.keys(crowns).forEach(function (id) {
          var who = crowns[id][0], title = crowns[id][1], was = prevC[id];
          if (!who) { if (was) upd["territory/" + cid + "/crowns/" + id] = null; return; }
          var changed = !was || was.key !== who.key;
          upd["territory/" + cid + "/crowns/" + id] = { key: who.key, name: who.name, title: title, since: changed ? now : (was.since || now) };
          if (changed && was && was.key) {
            upd["territory/" + cid + "/heldLog/" + was.key + "/" + id + "-" + (was.since || now)] = { id: id, title: was.title || title, course: short, from: was.since || now, to: now, lostTo: who.name };
            if (who.key === me) _notify([was.key], _myName() + " took " + title.toLowerCase() + " at " + short, "You held it since " + new Date(was.since || now).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ". It's there to take back.", "play");
          }
        });
        return d.ref().update(upd).then(function () { return { took: took, lost: lost, t: t }; }, function () { return { took: took, lost: lost, t: t }; });
      });
    }, function () { return { took: [], lost: [], t: t }; });
  }
  // My turf everywhere (small read of territory/*/held/me via a shallow walk of territory)
  function takeoverMine(me) {
    var d = db(); if (!d || !me) return Promise.resolve({ holes: 0, courses: [], total: 0 });
    return d.ref("territory").get().then(function (s) {
      var v = s.val() || {}; var out = { holes: 0, courses: [], total: 0 };
      Object.keys(v).forEach(function (cid) { var c = v[cid] || {}; var h = c.held && c.held[me]; var meta = c.meta || {}; if (h && h.count) { out.holes += h.count; out.courses.push({ cid: cid, name: meta.name || cid, count: h.count, holes: h.holes || [], of: meta.holes || 18 }); } });
      out.total = out.courses.length; return out;
    }, function () { return { holes: 0, courses: [], total: 0 }; });
  }
  // Fill per-hole scores into courseStats for MY finished rounds that predate v513 (one pass, cheap).
  function takeoverBackfill(me) {
    var d = db(); if (!d || !me) return Promise.resolve(0);
    try { if (localStorage.getItem("chains_takeover_backfill_v1:" + me) === "done") return Promise.resolve(0); } catch (e) {}
    return loadMine().then(function (rounds) {
      var upd = {}, n = 0;
      (rounds || []).forEach(function (r) {
        if (!r || r.status !== "final" || !r.course || r.course.id == null || !r.players || !r.players[me] || !r.players[me].holeScores || r.practice) return;
        var hs = toArr(r.players[me].holeScores); var N0 = r.course.holes || hs.length; if (hs.filter(function (x) { return x != null; }).length < N0) return;
        upd["courseStats/" + String(r.course.id).replace(/[.#$\[\]\/]/g, "_") + "/" + r.id + "/players/" + me + "/hs"] = hs.slice(0, N0); n++;
      });
      if (!n) { try { localStorage.setItem("chains_takeover_backfill_v1:" + me, "done"); } catch (e) {} return 0; }
      return d.ref().update(upd).then(function () { try { localStorage.setItem("chains_takeover_backfill_v1:" + me, "done"); } catch (e) {} return n; }, function () { return 0; });
    });
  }
  function _authUid() { try { var u = w.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); return u ? u.uid : null; } catch (e) { return null; } }
  // Whole board: every course's owners + who holds what, from the small territory root.
  function takeoverBoard() {
    var d = db(); if (!d) return Promise.resolve({ courses: [], players: {}, crews: {} });
    return Promise.all([d.ref("territory").get(), d.ref("crews").get(), d.ref("crewByUser").get()]).then(function (rs) {
      var v = rs[0].val() || {}, crews = rs[1].val() || {}, cbu = rs[2].val() || {};
      var courses = [], players = {}, crewTally = {};
      Object.keys(v).forEach(function (cid) {
        var c = v[cid] || {}; var meta = c.meta || {}; var held = c.held || {};
        var owners = Object.keys(held).map(function (k) { return { key: k, name: held[k].name || k, count: held[k].count || 0, crew: cbu[k] || null }; }).filter(function (o) { return o.count > 0; }).sort(function (a, b) { return b.count - a.count; });
        courses.push({ cid: cid, name: meta.name || cid, holes: meta.holes || 18, open: meta.open || 0, owners: owners, sweptBy: meta.sweptBy || null, sweptName: meta.sweptName || null, updatedAt: meta.updatedAt || 0 });
        owners.forEach(function (o) { var p = players[o.key] || (players[o.key] = { key: o.key, name: o.name, holes: 0, courses: 0, sweeps: 0, crew: o.crew }); p.holes += o.count; p.courses++; if (meta.sweptBy === o.key) p.sweeps++; if (o.crew) { var ct = crewTally[o.crew] || (crewTally[o.crew] = { id: o.crew, holes: 0, courses: {} }); ct.holes += o.count; ct.courses[cid] = true; } });
      });
      var crewList = Object.keys(crews).map(function (id) { var c = crews[id]; var tl = crewTally[id] || { holes: 0, courses: {} }; return { id: id, name: c.name, color: c.color || "#2A6FDB", emblem: c.emblem || null, max: c.max || CREW_MAX, code: c.code, owner: c.owner, members: c.members || {}, holes: tl.holes, courses: Object.keys(tl.courses).length }; }).sort(function (a, b) { return b.holes - a.holes; });
      return { courses: courses.sort(function (a, b) { return b.updatedAt - a.updatedAt; }), players: players, crews: crewList, crewByUser: cbu };
    }).catch(function () { return { courses: [], players: {}, crews: [], crewByUser: {} }; });
  }
  // This month's race: holes taken per player (and per crew) from the change log.
  function takeoverRace(month) {
    var d = db(); month = month || new Date().toISOString().slice(0, 7); if (!d) return Promise.resolve({ month: month, players: [], events: [] });
    return Promise.all([d.ref("territoryLog/" + month).get(), d.ref("crewByUser").get()]).then(function (rs) {
      var v = rs[0].val() || {}, cbu = rs[1].val() || {};
      var ev = Object.keys(v).map(function (k) { return v[k]; }).sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
      var by = {}, crews = {};
      ev.forEach(function (e) { if (!e || !e.to) return; var p = by[e.to] || (by[e.to] = { key: e.to, name: e.toName || e.to, taken: 0, from: {} }); p.taken++; if (e.from) p.from[e.from] = true; var cr = cbu[e.to]; if (cr) crews[cr] = (crews[cr] || 0) + 1; });
      return { month: month, players: Object.keys(by).map(function (k) { var p = by[k]; p.victims = Object.keys(p.from).length; return p; }).sort(function (a, b) { return b.taken - a.taken; }), crews: crews, events: ev.slice(0, 40) };
    }).catch(function () { return { month: month, players: [], crews: {}, events: [] }; });
  }
  // Crews: one per player. crews/{id} {name,color,owner(key),code,members{key:{name,at}}}, crewByUser/{key}=id
  var CREW_MAX = 8;
  function crewCreate(name, color, emblem) {
    var d = db(), me = whoami(); if (!d || !me) return Promise.reject(new Error("Sign in first"));
    var id = "cr-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4); var code = "C" + Math.random().toString(36).slice(2, 7).toUpperCase();
    var rec = { name: String(name || "").trim().slice(0, 28) || (_myName() + "'s crew"), color: color || "#2A6FDB", emblem: emblem || "\uD83E\uDD4F", max: CREW_MAX, owner: me, code: code, createdAt: Date.now(), members: {} }; rec.members[me] = { name: _myName(), at: Date.now() };
    var upd = {}; upd["crews/" + id] = rec; upd["crewByUser/" + me] = id; upd["crewCodes/" + code] = id;
    return d.ref().update(upd).then(function () { return Object.assign({ id: id }, rec); });
  }
  function crewJoin(code) {
    var d = db(), me = whoami(); var c = String(code || "").trim().toUpperCase(); if (!d || !me || c.length < 4) return Promise.resolve({ ok: false, err: "Enter the crew code." });
    return d.ref("crewCodes/" + c).get().then(function (s) { var id = s.val(); if (!id) return { ok: false, err: "That code doesn't match a crew." };
      return d.ref("crews/" + id).get().then(function (cs) { var c = cs.val() || {}; var n = Object.keys(c.members || {}).length; if (n >= (c.max || CREW_MAX) && !(c.members && c.members[me])) return { ok: false, err: "That crew is full (" + (c.max || CREW_MAX) + " max)." }; var upd = {}; upd["crews/" + id + "/members/" + me] = { name: _myName(), at: Date.now() }; upd["crewByUser/" + me] = id; return d.ref().update(upd).then(function () { return { ok: true, id: id, name: c.name }; }); }); }).catch(function () { return { ok: false, err: "Couldn't join — try again." }; });
  }
  function crewLeave() {
    var d = db(), me = whoami(); if (!d || !me) return Promise.resolve(false);
    return d.ref("crewByUser/" + me).get().then(function (s) { var id = s.val(); if (!id) return false; var upd = {}; upd["crews/" + id + "/members/" + me] = null; upd["crewByUser/" + me] = null; return d.ref().update(upd).then(function () { return true; }); }).catch(function () { return false; });
  }
  function crewMine() {
    var d = db(), me = whoami(); if (!d || !me) return Promise.resolve(null);
    return d.ref("crewByUser/" + me).get().then(function (s) { var id = s.val(); if (!id) return null; return d.ref("crews/" + id).get().then(function (c) { var v = c.val(); return v ? Object.assign({ id: id }, v) : null; }); }).catch(function () { return null; });
  }
  function takeoverCounts(me) { try { return JSON.parse(localStorage.getItem("chains_takeover_counts_v1:" + (me || whoami())) || "{}") || {}; } catch (e) { return {}; } }
  function takeoverPullCounts() { var d = db(), au = _authUid(), me = whoami(); if (!d || !au || !me) return; d.ref("users/" + au + "/takeover").get().then(function (s) { var v = s.val(); if (v) { try { var loc = takeoverCounts(me); var merged = { taken: Math.max(loc.taken || 0, v.taken || 0), from: Object.assign({}, v.from || {}, loc.from || {}), sweeps: Object.assign({}, v.sweeps || {}, loc.sweeps || {}) }; localStorage.setItem("chains_takeover_counts_v1:" + me, JSON.stringify(merged)); } catch (e) {} } }).catch(function () {}); }
  /* ---- v515 Names on the course. FIRSTS are permanent (courseFirsts/{course}/{id} = {key,name,at,date,
     roundId}) and are derived deterministically from the shared board (earliest qualifying round), so any
     device that finishes a round fills in whatever is still empty. HOLDS are takeable and computed live:
     per hole — owner (best avg, 90 days), best ever (lowest single score, earliest wins ties), most birdies;
     per course — record, most rounds, birdie leader, best average (the existing leaders). ---- */
  function _entriesSorted(board) {
    return (board || []).filter(function (r) { return r && r.players; }).slice().sort(function (a, b) { return String(a.date || "").localeCompare(String(b.date || "")) || String(a.updatedAt || "").localeCompare(String(b.updatedAt || "")); });
  }
  function firstsDefs(N) {
    var defs = [
      { id: "first_round", label: "First round logged here", tier: "easy", test: function (p) { return true; } },
      { id: "first_under_par", label: "First under-par round", tier: "mid", test: function (p) { return p.total < 0; } },
      { id: "first_clean", label: "First clean card (no bogeys)", tier: "mid", test: function (p) { return p.bogeys === 0 && p.hs && p.hs.length; } },
      { id: "first_turkey", label: "First turkey (3 birdies in a row)", tier: "mid", test: function (p, pars) { if (!p.hs) return false; var run = 0; for (var i = 0; i < p.hs.length; i++) { run = (p.hs[i] != null && p.hs[i] < (pars[i] || 3)) ? run + 1 : 0; if (run >= 3) return true; } return false; } },
      { id: "first_ace", label: "First ace", tier: "hard", test: function (p) { return p.hs && p.hs.some(function (x) { return x === 1; }); } },
      { id: "first_deep", label: "First round at −5 or better", tier: "hard", test: function (p) { return p.total <= -5; } }
    ];
    for (var h = 1; h <= N; h++) (function (h) { defs.push({ id: "first_birdie_h" + h, label: "First birdie on hole " + h, hole: h, tier: "easy", test: function (p, pars) { return p.hs && p.hs[h - 1] != null && p.hs[h - 1] < (pars[h - 1] || 3); } }); })(h);
    // cumulative firsts (need history per player): handled separately in firstsCompute
    defs.push({ id: "first_10", label: "First to 10 rounds here", tier: "mid", cumulative: 10 });
    defs.push({ id: "first_25", label: "First to 25 rounds here", tier: "hard", cumulative: 25 });
    defs.push({ id: "first_50", label: "First to 50 rounds here", tier: "epic", cumulative: 50 });
    defs.push({ id: "first_full_card", label: "First to birdie every hole here", tier: "epic", fullcard: true });
    return defs;
  }
  function firstsCompute(board) {
    var es = _entriesSorted(board); var N = 0; es.forEach(function (r) { N = Math.max(N, r.holes || 0); });
    var pars = (function () { for (var i = 0; i < es.length; i++) { if (es[i].pars) return toArr(es[i].pars); } var a = []; for (var j = 0; j < N; j++) a.push(3); return a; })();
    var defs = firstsDefs(N); var out = {}; var counts = {}, birdied = {};
    es.forEach(function (r) {
      Object.keys(r.players).forEach(function (k) {
        var p = r.players[k]; if (!p || p.total == null) return; var hs = p.hs ? toArr(p.hs) : null; var pp = { total: p.total, bogeys: p.bogeys, hs: hs, name: p.name || k };
        defs.forEach(function (d) {
          if (out[d.id]) return;
          if (d.test) { if (d.test(pp, pars)) out[d.id] = { key: k, name: pp.name, date: r.date, roundId: r.id, at: Date.now() }; }
        });
        counts[k] = (counts[k] || 0) + 1;
        defs.forEach(function (d) { if (d.cumulative && !out[d.id] && counts[k] === d.cumulative) out[d.id] = { key: k, name: pp.name, date: r.date, roundId: r.id, at: Date.now() }; });
        if (hs) { var bset = birdied[k] || (birdied[k] = {}); for (var i = 0; i < N; i++) if (hs[i] != null && hs[i] < (pars[i] || 3)) bset[i] = true; if (!out.first_full_card && N && Object.keys(bset).length >= N) out.first_full_card = { key: k, name: pp.name, date: r.date, roundId: r.id, at: Date.now() }; }
      });
    });
    return { firsts: out, defs: defs, N: N };
  }
  function holeMarks(board) {
    var es = _entriesSorted(board); var N = 0; es.forEach(function (r) { N = Math.max(N, r.holes || 0); });
    var pars = (function () { for (var i = 0; i < es.length; i++) { if (es[i].pars) return toArr(es[i].pars); } var a = []; for (var j = 0; j < N; j++) a.push(3); return a; })();
    var best = [], bird = [];
    es.forEach(function (r) { Object.keys(r.players).forEach(function (k) { var p = r.players[k]; if (!p || !p.hs) return; var hs = toArr(p.hs); for (var i = 0; i < N; i++) { var v = hs[i]; if (v == null) continue; if (!best[i] || v < best[i].score) best[i] = { key: k, name: p.name || k, score: v, date: r.date }; if (v < (pars[i] || 3)) { var bb = bird[i] || (bird[i] = {}); bb[k] = bb[k] || { key: k, name: p.name || k, n: 0 }; bb[k].n++; } } }); });
    var marks = [];
    for (var i = 0; i < N; i++) { var top = null; Object.keys(bird[i] || {}).forEach(function (k) { if (!top || bird[i][k].n > top.n) top = bird[i][k]; }); marks.push({ hole: i + 1, par: pars[i] || 3, bestEver: best[i] || null, birdieLeader: top || null }); }
    return marks;
  }
  // Fill any empty firsts for a course from the board; returns the ones that are new to ME (for the finish card).
  function firstsSync(courseId, board, me, courseName) {
    var d = db(); var cid = String(courseId).replace(/[.#$\[\]\/]/g, "_"); var fc = firstsCompute(board);
    if (!d) return Promise.resolve({ mine: [], all: fc.firsts, defs: fc.defs });
    return d.ref("courseFirsts/" + cid).get().then(function (s) {
      var have = s.val() || {}; var upd = {}, mine = [];
      Object.keys(fc.firsts).forEach(function (id) { if (have[id]) return; upd["courseFirsts/" + cid + "/" + id] = fc.firsts[id]; if (me && fc.firsts[id].key === me) { var dd = fc.defs.find(function (x) { return x.id === id; }); mine.push({ id: id, label: dd ? dd.label : id, tier: dd ? dd.tier : "easy" }); } });
      var all = Object.assign({}, have, fc.firsts);
      if (!Object.keys(upd).length) return { mine: [], all: all, defs: fc.defs };
      return d.ref().update(upd).then(function () {
        // tell the owners of brand-new firsts (not me — my finish card shows mine)
        var byKey = {}; Object.keys(upd).forEach(function (path) { var id = path.split("/").pop(); var f = fc.firsts[id]; if (f && f.key !== me) { (byKey[f.key] = byKey[f.key] || []).push(id); } });
        Object.keys(byKey).forEach(function (k) { var labels = byKey[k].map(function (id) { var dd = fc.defs.find(function (x) { return x.id === id; }); return dd ? dd.label.replace(/^First /, "first ") : id; }); _notify([k], "Your name's on " + String(courseName || cid).replace(/ disc golf.*$/i, ""), "You're the " + labels.slice(0, 3).join(", ") + (labels.length > 3 ? " and " + (labels.length - 3) + " more" : "") + ". That's permanent."); });
        return { mine: mine, all: all, defs: fc.defs };
      }, function () { return { mine: mine, all: all, defs: fc.defs }; });
    }, function () { return { mine: [], all: fc.firsts, defs: fc.defs }; });
  }
  // Everything with my name on it, everywhere (firsts + holds), from small reads.
  function namesMine(me) {
    var d = db(); if (!d || !me) return Promise.resolve({ firsts: 0, holds: 0, courses: 0 });
    return Promise.all([d.ref("courseFirsts").get(), d.ref("territory").get()]).then(function (rs) {
      var f = rs[0].val() || {}, t = rs[1].val() || {}; var firsts = 0, holds = 0, courses = {};
      Object.keys(f).forEach(function (cid) { Object.keys(f[cid] || {}).forEach(function (id) { if (f[cid][id] && f[cid][id].key === me) { firsts++; courses[cid] = true; } }); });
      Object.keys(t).forEach(function (cid) { var h = t[cid] && t[cid].held && t[cid].held[me]; if (h && h.count) { holds += h.count; courses[cid] = true; } });
      return { firsts: firsts, holds: holds, courses: Object.keys(courses).length };
    }, function () { return { firsts: 0, holds: 0, courses: 0 }; });
  }
  w.ChainsNames = { firstsCompute: firstsCompute, firstsDefs: firstsDefs, holeMarks: holeMarks, firstsSync: firstsSync, mine: namesMine };
  function crewUpdate(id, patch) { var d = db(); if (!d || !id) return Promise.resolve(false); var p = {}; if (patch.name) p.name = String(patch.name).trim().slice(0, 28); if (patch.color) p.color = patch.color; if (patch.emblem) p.emblem = String(patch.emblem).slice(0, 4); return d.ref("crews/" + id).update(p).then(function () { return true; }).catch(function () { return false; }); }
  w.ChainsTakeover = { crewUpdate: crewUpdate, CREW_MAX: CREW_MAX, compute: takeoverCompute, sync: takeoverSync, mine: takeoverMine, backfill: takeoverBackfill, board: takeoverBoard, race: takeoverRace, counts: takeoverCounts, pullCounts: takeoverPullCounts, crewCreate: crewCreate, crewJoin: crewJoin, crewLeave: crewLeave, crewMine: crewMine, DAYS: TK_DAYS, LAST: TK_LAST, MIN: TK_MIN };

  // every course's stats at once (for "your territory" on the home screen)
  function allCourseStats() {
    var d = db(); if (!d) return Promise.resolve({});
    return d.ref("courseStats").get().then(function (s) { var v = s.val() || {}; var out = {}; Object.keys(v).forEach(function (cid) { out[cid] = Object.keys(v[cid] || {}).map(function (k) { return v[cid][k]; }).filter(Boolean); }); return out; }, function () { return {}; });
  }
  // SHARED SCORING: a participant writes ONLY their own players/{key} row —
  // path-separated updates, so concurrent scorers can never clobber each other.
  // (Owner devices keep using save(); this is for everyone else on the card.)
  function scorePatch(id, key, holeScores, pars) {
    var d = db(); if (!d || !id || !key) return Promise.resolve(false);
    var N = pars ? pars.length : 18;
    var hs = [], total = 0, thru = 0;
    for (var i = 0; i < N; i++) { var s = holeScores[i]; if (s != null) { hs[i] = s; total += (s - (pars && pars[i] != null ? pars[i] : 3)); thru = i + 1; } else hs[i] = null; }
    var u = {};
    u["playRounds/" + id + "/players/" + key + "/holeScores"] = hs;
    u["playRounds/" + id + "/players/" + key + "/total"] = total;
    u["playRounds/" + id + "/players/" + key + "/thru"] = thru;
    u["playRounds/" + id + "/updatedAt"] = nowISO();
    u["liveRounds/" + id + "/updatedAt"] = nowISO();
    return _commit(d, u, "Couldn't send your score \u2014 it'll retry on your next tap.");
  }

  // #lifecycle: post-finish score edit WITH an audit trail. Never silent —
  // every change after a round is final is logged (who / when / what changed).
  function editFinalScore(id, key, holeIdx, newVal, pars) {
    var d = db(); if (!d || !id || !key) return Promise.resolve(false);
    return d.ref("playRounds/" + id).once("value").then(function (snap) {
      var r = snap.val(); if (!r) return false;
      var players = r.players || {};
      var p = players[key] || { holeScores: [], total: 0, thru: 0 };
      var hs = Array.isArray(p.holeScores) ? p.holeScores.slice() : Object.assign([], p.holeScores || {});
      var oldVal = hs[holeIdx] != null ? hs[holeIdx] : null;
      hs[holeIdx] = newVal;
      var N = pars ? pars.length : hs.length;
      var total = 0, thru = 0;
      for (var i = 0; i < N; i++) { if (hs[i] != null) { total += hs[i] - (pars && pars[i] != null ? pars[i] : 3); thru = i + 1; } }
      var who = whoami() || "someone";
      var entry = { by: who, at: Date.now(), key: key, hole: holeIdx + 1, from: oldVal, to: newVal };
      var u = {};
      u["playRounds/" + id + "/players/" + key + "/holeScores"] = hs;
      u["playRounds/" + id + "/players/" + key + "/total"] = total;
      u["playRounds/" + id + "/players/" + key + "/thru"] = thru;
      u["playRounds/" + id + "/editHistory/" + Date.now() + "-" + Math.random().toString(36).slice(2, 6)] = entry;
      u["playRounds/" + id + "/updatedAt"] = new Date().toISOString();
      return _commit(d, u, "Couldn't save that edit \u2014 try again.");
    }).catch(function () { return false; });
  }
  // Mark/unmark a FINISHED round as practice (excluded from stats + records).
  function setPractice(id, val) {
    var d = db(); if (!d || !id) return Promise.resolve(false);
    var u = {}; u["playRounds/" + id + "/practice"] = !!val;
    return _commit(d, u, "Couldn't update that \u2014 try again.");
  }
  // Round-level or per-hole notes: notes = { round: "text", holes: { "3": "text" } }.
  function setNotes(id, notes) {
    var d = db(); if (!d || !id) return Promise.resolve(false);
    var u = {}; u["playRounds/" + id + "/notes"] = notes || null;
    return _commit(d, u, "Couldn't save that note \u2014 try again.");
  }

  // Hide a SHARED round from my history only — the record stays for everyone
  // else. Per-user flag under the real auth uid + a local mirror.
  var HIDE_KEY = "chains_rounds_hidden_v1";
  function readHidden() { try { return JSON.parse(localStorage.getItem(HIDE_KEY) || "{}"); } catch (e) { return {}; } }
  function hideForMe(id) {
    var h = readHidden(); h[id] = true; try { localStorage.setItem(HIDE_KEY, JSON.stringify(h)); } catch (e) {}
    var o = readLocal(); delete o[id]; writeLocal(o);
    emit();
    var d = db(), au = authUid();
    if (d && au) { try { return d.ref("users/" + au + "/hiddenRounds/" + id).set(true).then(function () { return true; }, function () { return true; }); } catch (e) {} }
    return Promise.resolve(true);
  }

  // Delete a round EVERYWHERE it can live. Returns a Promise<boolean> — true only
  // when every cloud path confirmed (local mirror always clears). Covers: local,
  // playRounds, liveRounds, the per-user index (real auth uid), and the LEGACY
  // chains-fantasy /play_rounds store old test rounds still sit in.
  function remove(id) {
    var o = readLocal(); var o0 = o[id]; delete o[id]; writeLocal(o);
    var d = db();
    var jobs = [];
    if (d) {
      // v481: separate deletes - nulling an already-removed liveRounds row fails the
      // owner rule and, inside one multi-path update, took the playRounds delete with it.
      jobs.push(d.ref("playRounds/" + id).remove().then(function () { return true; }, function () { return false; }));
      try { d.ref("liveRounds/" + id).remove().catch(function () {}); } catch (e) {}
      var su = {}; su[SR(id)] = null; try { _indexParticipants(su, id, (o0 && o0.participants) || {}, null); } catch (e) {}
      try { if (o0 && o0.course && o0.course.id != null) su["courseStats/" + String(o0.course.id).replace(/[.#$\[\]\/]/g, "_") + "/" + id] = null; } catch (e) {}
      jobs.push(_quiet(d, su));
      jobs.push(_indexWrite(d, id, null));
    }
    // Legacy store (separate Firebase project, REST): best-effort, but its result DOES
    // count toward ok below — a store that silently fails to delete is how "gone"
    // rounds keep reappearing.
    try { jobs.push(fetch("https://chains-fantasy-default-rtdb.firebaseio.com/play_rounds/" + encodeURIComponent(id) + ".json", { method: "DELETE" }).then(function (r) { return !!r.ok; }, function () { return false; })); } catch (e) {}
    emit();
    if (!jobs.length) return Promise.resolve(true);
    // #43: every store must confirm — checking only rs[0] masked index/legacy failures.
    var settle = Promise.all(jobs).then(function (rs) {
      var ok = rs.every(function (x) { return x !== false; });
      if (!ok) _failOnce("Couldn't delete that round everywhere — it's gone from this device and we'll keep retrying in the background.", null, "remove");
      return ok;
    });
    // #43-freeze: the local copy is already gone above, so an offline/stalled cloud
    // write must never hang the caller — resolve optimistically after a beat and let
    // `settle` keep running to still report a real failure later via toast.
    var timeout = new Promise(function (res) { setTimeout(function () { res(true); }, 8000); });
    return Promise.race([settle, timeout]);
  }

  // #36/#3: mid-round join request — someone NOT on the card asks in; the owner
  // gets a tap-to-approve toast (auto-approved client-side if already friends).
  // Keyed by the requester's app identity (whoami), matching players/{key}.
  function requestJoin(id, key, meta) {
    var d = db(); if (!d || !id || !key) return Promise.resolve(false);
    var u = {}; u[SR(id) + "/joinRequests/" + key] = { ts: Date.now(), name: (meta && meta.name) || key, uid: (meta && meta.uid) || null };
    return _commit(d, u, "Couldn't send your join request \u2014 try again.");
  }
  function approveJoin(id, key) {
    var d = db(); if (!d || !id || !key) return Promise.resolve(false);
    var u = {}, nm = key, disc = "#9CA3AF";
    try { var lr = readLocal()[id]; var rq = lr && lr.joinRequests && lr.joinRequests[key]; if (rq && rq.name) nm = rq.name; } catch (e) {}
    try { var pf = w.ChainsFriends && ChainsFriends.profile ? ChainsFriends.profile(key) : null; if (pf) { nm = pf.name || nm; disc = pf.disc || disc; } } catch (e) {}
    try { var mm = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(key) : null; if (mm) { nm = mm.name || nm; disc = mm.disc || disc; } } catch (e) {}
    var row = { name: nm, disc: disc, holeScores: [], total: 0, thru: 0 };
    var mu = {}; mu["playRounds/" + id + "/players/" + key] = row; if (!/^guest/.test(key)) mu["playRounds/" + id + "/participants/" + key] = true; _quiet(d, mu);
    u[SR(id) + "/players/" + key] = row; u[SR(id) + "/joinRequests/" + key] = null;
    if (!/^guest/.test(key)) { u[SR(id) + "/participants/" + key] = true; u["roundsByPlayer/" + key + "/" + id] = true; }
    return _commit(d, u, "Couldn't approve \u2014 try again.");
  }
  function declineJoin(id, key) {
    var d = db(); if (!d || !id || !key) return Promise.resolve(false);
    var u = {}; u[SR(id) + "/joinRequests/" + key] = null;
    return _commit(d, u, "Couldn't decline \u2014 try again.");
  }

  // My rounds: cloud (per-user index, keyed by auth uid) merged over the local mirror.
  function loadMine() {
    var owner = whoami(), au = authUid(), d = db();
    var local = Object.values(readLocal()).filter(function (r) { return !owner || !r.owner || r.owner === owner || r.ownerKey === owner || r.owner === au || (r.participants && r.participants[owner]); });
    if (!d || !au) return Promise.resolve(sortRounds(local));
    return Promise.all([d.ref("users/" + au + "/rounds").get(), d.ref("users/" + au + "/hiddenRounds").get().catch(function () { return null; }), participantRounds(owner)]).then(function (pair) {
      var s = pair[0];
      var hid = Object.assign({}, readHidden(), (pair[1] && pair[1].val && pair[1].val()) || {});
      local = local.filter(function (r) { return !hid[r.id]; });
      var localById = {}; local.forEach(function (r) { if (r && r.id) localById[r.id] = r; });
      var idx = Object.assign({}, s.val() || {}); (pair[2] || []).forEach(function (r) { if (r && r.id) idx[r.id] = true; });
      var ids = Object.keys(idx).filter(function (id) { return !hid[id]; });
      var idxSet = {}; ids.forEach(function (id) { idxSet[id] = true; });
      // #43: seed from local ONLY for rounds the per-user index doesn't track (brand
      // new / never synced). Every INDEXED id is resolved fresh below so a stale
      // local snapshot can never resurrect a round the index (and thus the cloud)
      // has already forgotten — a confirmed-absent fetch (ok, but null) is a real
      // delete; only a genuine fetch ERROR falls back to the local copy, so a flaky
      // connection can't erase a round that's actually still there.
      var byId = {};
      local.forEach(function (r) { if (r && r.id && !idxSet[r.id]) byId[r.id] = r; });
      if (!ids.length) { var onlyLocal = Object.values(byId); writeLocal(indexById(onlyLocal)); return sortRounds(onlyLocal); }
      return Promise.all(ids.map(function (id) { return fetchRound(id); }))
        .then(function (arr) {
          arr.forEach(function (res, i) { var id = ids[i]; if (res.ok) { if (res.val && res.val.id) byId[id] = res.val; } else if (localById[id]) byId[id] = localById[id]; });
          var merged = Object.values(byId); writeLocal(indexById(merged)); return sortRounds(merged);
        });
    }).catch(function () { return sortRounds(local); });
  }
  // v480: one round as the app should see it = owner mirror (playRounds) with the live
  // shared record (sharedRounds) laid over it - whichever is newer wins per field that
  // travels live (players / status / course / participants).
  function mergeShared(play, shared) {
    if (!shared) return play ? fixRound(play) : null;
    if (!play) { var only = fixRound(Object.assign({}, shared)); only.cheers = shared.cheers || null; only.comments = shared.comments || null; return only; }
    var newer = String(shared.updatedAt || "") >= String(play.updatedAt || "");
    var m = Object.assign({}, play);
    if (newer || !play.players) { m.players = shared.players || play.players; m.status = shared.status || play.status; m.course = shared.course || play.course; m.updatedAt = shared.updatedAt || play.updatedAt; }
    if (shared.participants) m.participants = Object.assign({}, play.participants || {}, shared.participants);
    if (shared.joinRequests) m.joinRequests = shared.joinRequests;
    m.cheers = shared.cheers || null; m.comments = shared.comments || null;
    if (!m.ownerKey && shared.ownerKey) m.ownerKey = shared.ownerKey;
    return fixRound(m);
  }
  function fetchRound(id) {
    var d = db(); if (!d || !id) return Promise.resolve({ ok: false, val: null });
    return Promise.all([
      d.ref("playRounds/" + id).get().then(function (s) { return { ok: true, val: s.val() }; }, function () { return { ok: false, val: null }; }),
      d.ref(SR(id)).get().then(function (s) { return s.val(); }, function () { return null; })
    ]).then(function (pair) {
      var play = pair[0].val, shared = pair[1];
      if (!pair[0].ok && !shared) return { ok: false, val: null };
      var m = mergeShared(play, shared); if (m && !m.id) m.id = id;
      return { ok: true, val: m };
    });
  }
  // v479/v480: every round a player is ON (owner or not), via the public per-player index.
  function participantRounds(key) {
    var d = db(); if (!d || !key) return Promise.resolve([]);
    return d.ref("roundsByPlayer/" + key).get().then(function (s) { return Object.keys(s.val() || {}); }, function () { return []; })
      .then(function (ids) { return Promise.all(ids.map(function (id) { return fetchRound(id).then(function (r) { return r.val; }); })); })
      .then(function (arr) { return arr.filter(Boolean); })
      .catch(function () { return []; });
  }
  // Live rounds among friends (Phase 3): every open liveRounds record.
  function loadLive() {
    var d = db(); if (!d) { return Promise.resolve(Object.values(readLocal()).filter(function (r) { return r.status === "open"; })); }
    return d.ref("liveRounds").get().then(function (s) { return Object.values(s.val() || {}); }).catch(function () { return []; });
  }
  // GROUP rounds (Phase 5): finalized rounds for me + every friend, for course
  // leaderboards / records. Reads each owner's per-user index then the records.
  function loadGroup() {
    var d = db(); var meId = whoami();
    var local = Object.values(readLocal());
    if (!d || !meId) return Promise.resolve(local);
    var owners = {}; owners[meId] = true;
    try { (w.ChainsFriends && ChainsFriends.list ? ChainsFriends.list() : []).forEach(function (f) { if (f && f.uid) owners[f.uid] = true; }); } catch (e) {}
    return Promise.all(Object.keys(owners).map(function (o) {
      return participantRounds(o).then(function (rs) { return rs.map(function (r) { return r.id; }); });
    })).then(function (idLists) {
      var ids = {}; idLists.forEach(function (l) { l.forEach(function (id) { ids[id] = true; }); });
      var idArr = Object.keys(ids);
      // #43: same fix as loadMine() — don't blanket-trust local for indexed ids, or
      // a deleted round can flicker back into course-record aggregates.
      var localById = {}; local.forEach(function (r) { if (r && r.id) localById[r.id] = r; });
      var byId = {}; local.forEach(function (r) { if (r && r.id && !ids[r.id]) byId[r.id] = r; });
      if (!idArr.length) return Object.values(byId);
      return Promise.all(idArr.map(function (id) { return fetchRound(id); }))
        .then(function (arr) {
          arr.forEach(function (res, i) { var id = idArr[i]; if (res.ok) { if (res.val && res.val.id) byId[id] = res.val; } else if (localById[id]) byId[id] = localById[id]; });
          return Object.values(byId);
        });
    }).catch(function () { return local; });
  }
  // Aggregate course records from a set of rounds (Phase 5). Considers FULL final
  // rounds at the course. Returns hottest round, per-hole records, and a per-player
  // best-here leaderboard. me-relative "my best" included for beat-the-metric.
  function courseAggregate(rounds, courseId, me) {
    var hottest = null;            // { name, toPar, date }
    var holeRecs = [];             // [{ strokes, name }] per hole index
    var bestByPlayer = {};         // key -> { name, best, rounds }
    var myBest = null;
    var plays = 0, lastDate = null, lastWeather = null, lastWeatherDate = null;  // crew history
    (rounds || []).forEach(function (r) {
      if (!r || r.status !== "final" || r.practice) return;
      var c = r.course || {};
      if (courseId != null && c.id != null && String(c.id) !== String(courseId)) return;
      var pars = c.pars || r.pars || null; if (!pars) return;
      var N = c.holes || pars.length;
      // crew history: count this round, track most recent date + its weather
      plays++;
      var rd = r.date || (r.updatedAt || "").slice(0, 10);
      if (rd && (!lastDate || rd > lastDate)) lastDate = rd;
      if (r.weather && (r.weather.tempF != null || r.weather.desc) && (!lastWeatherDate || rd >= lastWeatherDate)) { lastWeather = r.weather; lastWeatherDate = rd; }
      var players = r.players || null;
      // support normalized shape too
      if (!players && r.hole_scores) { players = {}; Object.keys(r.hole_scores).forEach(function (k) { players[k] = { name: (r.group && (r.group.find ? (r.group.find(function (g) { return g.id === k; }) || {}).name : null)) || k, holeScores: r.hole_scores[k] }; }); }
      if (!players) return;
      Object.keys(players).forEach(function (k) {
        var p = players[k]; var hs = p.holeScores || []; var strokes = 0, parSum = 0, played = 0;
        for (var i = 0; i < N; i++) { var s = hs[i]; if (s == null) continue; strokes += s; parSum += (pars[i] != null ? pars[i] : 3); played++; if (holeRecs[i] == null || s < holeRecs[i].strokes) holeRecs[i] = { strokes: s, name: p.name || k || "Player" }; }
        if (played < N) return;                       // only full rounds rank
        var toPar = strokes - parSum;
        if (hottest == null || toPar < hottest.toPar) hottest = { name: p.name, toPar: toPar, date: r.date };
        var b = bestByPlayer[k]; if (!b) bestByPlayer[k] = { name: p.name, best: toPar, rounds: 1 }; else { b.rounds++; if (toPar < b.best) b.best = toPar; }
        if (k === me && (myBest == null || toPar < myBest)) myBest = toPar;
      });
    });
    var leaderboard = Object.keys(bestByPlayer).map(function (k) { return bestByPlayer[k]; }).sort(function (a, b) { return a.best - b.best; });
    return { hottest: hottest, holeRecords: holeRecs, leaderboard: leaderboard, myBest: myBest, courseRecord: hottest ? hottest.toPar : null, plays: plays, lastDate: lastDate, lastWeather: lastWeather };
  }
  // The set of owners whose live rounds I should see = me + my friends.
  function friendScope() {
    var ids = {}; var meId = whoami(); if (meId) ids[meId] = true;
    try { (w.ChainsFriends && ChainsFriends.list ? ChainsFriends.list() : []).forEach(function (f) { if (f && f.uid) ids[f.uid] = true; }); } catch (e) {}
    return ids;
  }
  // Real-time subscription to friends' live rounds. cb(list) fires on every change;
  // returns an unsubscribe fn. Filtered to me + friends, newest first, open only.
  function watchLive(cb) {
    var d = db(); if (!d) { cb(Object.values(readLocal()).filter(function (r) { return r.status === "open"; })); return function () {}; }
    var ref = d.ref("liveRounds");
    var handler = ref.on("value", function (s) {
      var all = s.val() || {}; var scope = friendScope();
      var list = Object.keys(all).map(function (k) { return all[k]; })
        .filter(function (r) { if (!r || r.status !== "open") return false; var meId = whoami(); if (meId && r.keys && [].concat(r.keys).indexOf(meId) >= 0) return true; var ok = r.ownerKey || r.owner; return scope[ok] || Object.keys(scope).length === 0; })
        .sort(function (a, b) { return (b.updatedAt || "").localeCompare(a.updatedAt || ""); });
      cb(list);
    }, function () { cb([]); });
    return function () { try { ref.off("value", handler); } catch (e) {} };
  }
  // Real-time subscription to ONE round's full record (hole-by-hole). cb(record).
  function watchRound(id, cb) {
    var d = db(); if (!d || !id) { cb(readLocal()[id] || null); return function () {}; }
    var refP = d.ref("playRounds/" + id), refS = d.ref(SR(id));
    var play, shared, gotP = false, gotS = false;
    function fire() { if (!gotP || !gotS) return; var m = mergeShared(play, shared); if (m && !m.id) m.id = id; cb(m); }
    var hp = refP.on("value", function (s) { play = s.val() || null; gotP = true; fire(); }, function () { play = null; gotP = true; fire(); });
    var hs = refS.on("value", function (s) { shared = s.val() || null; gotS = true; fire(); }, function () { shared = null; gotS = true; fire(); });
    return function () { try { refP.off("value", hp); } catch (e) {} try { refS.off("value", hs); } catch (e) {} };
  }
  function sortRounds(a) { return a.slice().sort(function (x, y) { return (y.updatedAt || "").localeCompare(x.updatedAt || ""); }); }
  function indexById(a) { var o = {}; a.forEach(function (r) { if (r && r.id) o[r.id] = r; }); return o; }

  // Head-to-head W-L-T (Phase: rivalries). For every round where ME and another
  // player BOTH have a full+scored card, compare totals. Lower to-par wins; equal
  // is a tie. Returns { oppKey: { name, disc, wins, losses, ties, rounds } } newest data.
  function headToHead(rounds, me) {
    var rec = {};
    function fullTotal(r, key) {
      var players = r.players, hs = null, pars = (r.course && r.course.pars) || r.pars || null;
      if (players && players[key]) hs = players[key].holeScores;
      else if (r.hole_scores && r.hole_scores[key]) hs = r.hole_scores[key];
      if (!hs || !pars) return null;
      var strokes = 0, parSum = 0, played = 0, N = pars.length;
      for (var i = 0; i < N; i++) { var s = hs[i]; if (s == null) continue; strokes += s; parSum += (pars[i] != null ? pars[i] : 3); played++; }
      if (played < N) return null;          // only head-to-heads where both finished
      return strokes - parSum;
    }
    (rounds || []).forEach(function (r) {
      if (!r || r.status === "open") return;
      var keys = r.players ? Object.keys(r.players) : (r.hole_scores ? Object.keys(r.hole_scores) : []);
      if (keys.indexOf(me) < 0) return;
      var myT = fullTotal(r, me); if (myT == null) return;
      keys.forEach(function (k) {
        if (k === me) return;
        var oppT = fullTotal(r, k); if (oppT == null) return;
        var prof = (r.players && r.players[k]) ? { name: r.players[k].name, disc: r.players[k].disc } : profileOf(k, r);
        var e = rec[k] || (rec[k] = { name: prof.name, disc: prof.disc, wins: 0, losses: 0, ties: 0, rounds: 0 });
        e.rounds++;
        if (myT < oppT) e.wins++; else if (myT > oppT) e.losses++; else e.ties++;
      });
    });
    return rec;
  }
  function profileOf(k, r) {
    if (r && r.group && r.group.find) { var g = r.group.find(function (x) { return x.id === k; }); if (g) return { name: g.name, disc: g.color || g.disc }; }
    try { var m = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(k) : null; if (m) return { name: m.name, disc: m.disc }; } catch (e) {}
    return { name: k, disc: "#9CA3AF" };
  }

  // v500: import a finished round from elsewhere (UDisc CSV). No "is playing" pings, keeps
  // the original date; owner = me; other players ride along as guests unless they map to
  // a member key. Returns the id.
  function importRound(ctx) {
    var id = (ctx && ctx.id) || ("imp-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    var owner = authUid(), ownerKey = whoami(); if (!owner || !ownerKey) return Promise.resolve(null);
    var pars = ctxPars(ctx);
    var rec = { id: id, owner: owner, ownerKey: ownerKey, course: courseShape(ctx.course), date: ctx.date || nowISO().slice(0, 10),
      players: playersFrom(ctx.group, ctx.scores, pars, ctx.totals), weather: null, status: "final", source: ctx.source || "import",
      startedAt: ctx.startedAt || (ctx.date + "T12:00:00.000Z"), updatedAt: ctx.endedAt || ctx.startedAt || nowISO(), importedAt: nowISO() };
    rec.participants = participantsOf(rec.players);
    putLocal(rec);
    var d = db(); if (!d) return Promise.resolve(id);
    var u = {}; u["playRounds/" + id] = rec;
    var us = {}; us[SR(id)] = Object.assign(_sharedOf(rec), { finishedBy: ownerKey }); _indexParticipants(us, id, rec.participants, true);
    return _commit(d, u).then(function () { return _commit(d, us); }).then(function () { try { _indexWrite(d, id, true); } catch (e) {} try { save(Object.assign({}, ctx, { id: id, status: "final" })); } catch (e) {} return id; });
  }
  w.ChainsRounds = {
    importRound: importRound, courseTerritory: courseTerritory, allCourseStats: allCourseStats,
    available: function () { return !!whoami(); }, whoami: whoami, hideForMe: hideForMe, scorePatch: scorePatch, requestJoin: requestJoin, approveJoin: approveJoin, declineJoin: declineJoin, editFinalScore: editFinalScore, setPractice: setPractice, setNotes: setNotes,
    start: start, save: save, finalize: finalize, remove: remove, setCell: setCell, setPars: setPars, addPlayer: addPlayer, participantRounds: participantRounds, fetchRound: fetchRound, mergeShared: mergeShared, authUid: authUid, cheer: cheer, uncheer: uncheer, comment: comment, courseBoard: courseBoard, courseRanking: courseRanking,
    loadMine: loadMine, loadLive: loadLive, loadGroup: loadGroup, courseAggregate: courseAggregate, headToHead: headToHead, watchLive: watchLive, watchRound: watchRound, playersFrom: playersFrom, toArr: toArr, fixRound: fixRound
  };
})();
