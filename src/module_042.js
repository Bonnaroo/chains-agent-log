/* ============================================================
   CHAINS — Aces log. window.ChainsAces
   The holy grail: log an ace (hole-in-one). It lands in a SHARED
   group feed and pings the whole crew via ChainsNotify. chains-app
   RTDB, keyed by whoami. Reused by Go Throw + Run-a-League scorecards
   (auto-detect a 1 on a par 3+) and a manual "Log an ace" button.

   Shape: aces/{id} = { who, name, disc, course, hole, date, ts }
   ============================================================ */
(function () {
  var w = window;
  function fb() { return (w.ChainsFB && w.ChainsFB.ok) ? w.ChainsFB : null; }
  function db() { var f = fb(); return f ? f.db : null; }
  function whoami() { try { return (w.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; } catch (e) { return null; } }
  function emit() { try { w.dispatchEvent(new Event("chains:aces")); } catch (e) {} }
  function uid() { return "ace-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function myProfile() {
    try { var id = whoami(); if (w.ChainsEngine && ChainsEngine.member && id) { var m = ChainsEngine.member(id); if (m) return { name: m.name, disc: m.disc }; }
      var fr = (w.ChainsFriends && ChainsFriends.list ? ChainsFriends.list() : []); var c = w.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); if (c && c.username) return { name: c.username, disc: "#E8590C" }; } catch (e) {}
    return { name: "You", disc: "#E8590C" };
  }

  var LK = "chains_aces_v1";
  function readLocal() { try { return JSON.parse(localStorage.getItem(LK) || "{}") || {}; } catch (e) { return {}; } }
  function writeLocal(o) { try { localStorage.setItem(LK, JSON.stringify(o)); } catch (e) {} }

  // Friends scope: whose aces I see (me + friends).
  function scope() { var ids = {}; var me = whoami(); if (me) ids[me] = true; try { (w.ChainsFriends && ChainsFriends.list ? ChainsFriends.list() : []).forEach(function (f) { if (f && f.uid) ids[f.uid] = true; }); } catch (e) {} return ids; }

  // De-dupe key so the same ace (auto-detected on every save) only logs once.
  function aceKey(course, hole, date) { return (whoami() || "?") + "|" + (course || "") + "|h" + hole + "|" + (date || ""); }

  function log(opts) {
    var who = whoami(); if (!who) return { ok: false };
    opts = opts || {};
    var key = aceKey(opts.course, opts.hole, opts.date || new Date().toISOString().slice(0, 10));
    var existing = readLocal();
    if (Object.keys(existing).some(function (k) { return existing[k] && existing[k]._key === key; })) return { ok: false, dup: true };
    var prof = myProfile();
    var id = uid();
    var ace = { id: id, who: who, name: prof.name, disc: prof.disc, course: opts.course || "a course", hole: opts.hole || null, date: opts.date || new Date().toISOString().slice(0, 10), ts: Date.now(), _key: key };
    var o = existing; o[id] = ace; writeLocal(o);
    var d = db();
    if (d) { try { d.ref("aces/" + id).set(ace); } catch (e) {} }
    // ping the crew (not me)
    try {
      if (w.ChainsNotify) {
        var aud = Object.keys(scope()).filter(function (x) { return x !== who; });
        if (aud.length) w.ChainsNotify.post({ type: "ace", title: "ACE! \uD83C\uDFAF", body: prof.name + " just aced hole " + (opts.hole || "?") + " at " + (opts.course || "a course") + "!", audience: aud, link: "play" });
      }
    } catch (e) {}
    if (w.ChainsToast) try { w.ChainsToast.show("\uD83C\uDFAF Ace logged — the crew's been notified!"); } catch (e) {}
    emit();
    return { ok: true, ace: ace };
  }

  // v511: a 1 that got corrected — remove that ace (mine only) from local + cloud and tell the crew it was a mis-tap.
  function retract(opts) {
    var who = whoami(); if (!who) return { ok: false };
    opts = opts || {};
    var key = aceKey(opts.course, opts.hole, opts.date || new Date().toISOString().slice(0, 10));
    var o = readLocal(); var hit = Object.keys(o).filter(function (k) { return o[k] && o[k]._key === key && o[k].who === who; });
    if (!hit.length) return { ok: false };
    var d = db();
    hit.forEach(function (k) { delete o[k]; if (d) { try { d.ref("aces/" + k).remove(); } catch (e) {} } });
    writeLocal(o); emit();
    try { if (w.ChainsNotify) { var aud = Object.keys(scope()).filter(function (x) { return x !== who; }); if (aud.length) w.ChainsNotify.post({ type: "ace", title: "False alarm", body: myProfile().name + " fixed the score on hole " + (opts.hole || "?") + " \u2014 no ace after all.", audience: aud, link: "play" }); } } catch (e) {}
    return { ok: true };
  }

  function pull() {
    var d = db(); if (!d) return Promise.resolve(Object.values(readLocal()));
    return d.ref("aces").get().then(function (s) {
      var all = s.val() || {}; var sc = scope(); var o = readLocal();
      Object.keys(all).forEach(function (k) { if (sc[all[k].who] || Object.keys(sc).length === 0) o[k] = all[k]; });
      writeLocal(o); emit(); return Object.values(o);
    }).catch(function () { return Object.values(readLocal()); });
  }
  // aces visible to me (me + friends), newest first
  function feed() { var sc = scope(); return Object.values(readLocal()).filter(function (a) { return !Object.keys(sc).length || sc[a.who]; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); }
  function countFor(who) { return Object.values(readLocal()).filter(function (a) { return a.who === who; }).length; }

  (function boot(n) { if (whoami()) { try { pull(); } catch (e) {} return; } if ((n || 0) < 30) setTimeout(function () { boot((n || 0) + 1); }, 500); })();

  w.ChainsAces = { available: function () { return !!whoami(); }, log: log, retract: retract, pull: pull, feed: feed, countFor: countFor };
})();
