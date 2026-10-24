/* ============================================================
   CHAINS — friends.  window.ChainsFriends
   A per-user friends list so league invites can be "pick from a
   dropdown" instead of sharing a code every time.

   ONE id per person: the account uid is the single source of
   truth. The 6-char "friend code" is just a shareable handle
   DERIVED from that uid (same scheme as a league join code) — no
   second id system. Lives in the chains-app project (not the
   legacy chains-fantasy), so writes are fine in any build.

   Data model:
     friends/{uid}/{friendUid}: true            (mutual)
     friendRequests/{toUid}/{fromUid}: {fromName, ts}
     friendCodes/{CODE}: uid                     (reverse lookup)
   ============================================================ */
(function (w) {
  function db() { return (w.ChainsFB && w.ChainsFB.ok) ? w.ChainsFB.db : null; }
  function me() { try { return (w.ChainsAuth && ChainsAuth.current && ChainsAuth.current()) || null; } catch (e) { return null; } }
  // CANONICAL identity = the picked/claimed player id (whoami, e.g. "kyle"), matching how
  // leagues + friendCodes are keyed, so owner add-member and a friend's own device
  // reconcile to the SAME key. The anonymous Firebase uid AUTHORIZES the writes but is
  // NEVER a data key: falling back to it gives one human two ids (chosen by timing), so
  // friend requests scatter to paths the recipient never listens on. Return null until
  // identity resolves — every write below already gates on a non-null uid (no-ops/waits).
  function myUid() { return (w.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; }

  // Deterministic 6-char handle from a uid (ambiguous letters dropped).
  function codeFor(uid) {
    var s = String(uid || ""), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
    var AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "";
    for (var k = 0; k < 6; k++) { out += AL[h & 31]; h = (h >>> 5) ^ (h * 2654435761 >>> 0); h = h >>> 0; }
    return out;
  }

  var FK = "chains_friends_v1", RK = "chains_freq_v1";
  function readLS(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
  function writeLS(k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} }
  var _friends = readLS(FK), _reqs = readLS(RK), _names = {}, _myCode = null;
  function randCode() { var AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = ""; for (var i = 0; i < 6; i++) out += AL[Math.floor(Math.random() * AL.length)]; return out; }
  function loadMyCode(uid) { var d = db(); if (!d || !uid) return; d.ref("users/" + uid + "/profile/friendCode").once("value").then(function (s) { var v = s.val(); if (v) { _myCode = v; emit(); } }).catch(function () {}); }

  function emit() { try { w.dispatchEvent(new Event("chains:friends")); } catch (e) {} }
  // v482: in-app bell notification to another member (the league feed the bell already reads).
  function notify(toUid, title, body, link) {
    try { if (w.ChainsNotify && ChainsNotify.post && toUid) ChainsNotify.post({ id: "n-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type: "friend", title: title, body: body, audience: [toUid], link: link || "friends" }); } catch (e) {}
  }
  function displayName(uid) {
    try { var m = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(uid) : null; if (m && m.name) return m.name; } catch (e) {}
    var p = _names[uid]; if (p && p.name && p.name !== "Player") return p.name;
    return uid ? uid.charAt(0).toUpperCase() + uid.slice(1) : "Someone";
  }
  var _seenReqs = null;
  // v483: the rules let me write friends/{other}/{me} ONLY while friendRequests/{other}/{me}
  // (my request to them) exists. One primitive for accept + befriend: request -> both sides -> tidy.
  function link(other, failMsg, after) {
    var d = db(), uid = myUid(); if (!d || !uid || !other || other === uid) return false;
    d.ref("friendRequests/" + other + "/" + uid).set({ fromName: myName(), ts: Date.now(), auto: true }).catch(function () {})
      .then(function () {
        var u = {}; u["friends/" + uid + "/" + other] = true; u["friends/" + other + "/" + uid] = true;
        return d.ref().update(u);
      })
      .then(function () {
        try { d.ref("friendRequests/" + other + "/" + uid).remove().catch(function () {}); } catch (e) {}
        try { d.ref("friendRequests/" + uid + "/" + other).remove().catch(function () {}); } catch (e) {}
        hydrate(other);
        if (after) after();
      }, function (e) { _fail(failMsg, e); });
    return true;
  }
  function _fail(msg, e) { try { if (w.ChainsToast) ChainsToast.show(msg, "error"); } catch (x) {} try { console.warn("[ChainsFriends]", msg, e); } catch (x) {} }

  function myName() {
    var u = me(); if (!u) return "Player";
    try { var mm = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(myUid()) : null; if (mm && mm.name) return mm.name; } catch (e) {}
    try { var p = w.ChainsAuth && ChainsAuth.localProfile && ChainsAuth.localProfile(u.uid); if (p && (p.displayName || p.name)) return p.displayName || p.name; } catch (e) {}
    return (_names[u.uid] && _names[u.uid].name) || u.username || "Player";
  }
  function hydrate(uid) {
    var d = db(); if (!d || !uid || _names[uid]) return;
    // v479: the PUBLIC usernames index is what other people are allowed to read (users/{uid}
    // is private + keyed by the auth uid, so it never resolved -> everyone showed as "Player").
    // League roster name wins when the id is a league member.
    function nice(v) {
      var nm = (v && (v.name || v.displayName || v.username)) || null, disc = (v && v.disc) || "#9CA3AF";
      try { var m = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(uid) : null; if (m) { nm = m.name || nm; disc = m.disc || disc; } } catch (e) {}
      if (!nm) nm = uid.charAt(0).toUpperCase() + uid.slice(1);
      _names[uid] = { name: nm, disc: disc, badge: (v && v.badge) || null, photo: (v && v.photo) || null }; emit();
    }
    d.ref("usernames/" + String(uid).toLowerCase()).once("value").then(function (s) { var v = s.val(); if (v) nice(v); else return d.ref("users/" + uid).once("value").then(function (s2) { nice(s2.val()); }); }).catch(function () { nice(null); });
  }

  var _subbedFor = null;
  function subscribe() {
    var d = db(), uid = myUid();
    if (!d || !uid || _subbedFor === uid) return;
    _subbedFor = uid;
    try { d.ref("friendCodes/" + codeFor(uid)).set(uid); } catch (e) {}   // publish my reverse-lookup
    loadMyCode(uid);
    // Public username index (separate from the PRIVATE users/{uid} profile, which the
    // locked rules restrict to self/admin) so friend-search works post-lockdown.
    try {
      var meU = me(); var un = (meU && meU.username || "").toLowerCase();
      if (un) { var pn = myName(); try { var mm = w.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(uid) : null; if (mm && mm.name && (!pn || pn.toLowerCase() === un)) pn = mm.name; } catch (e) {} var fb = null; try { fb = JSON.parse(localStorage.getItem("chains_featured_badge_v1:" + uid) || "null"); } catch (e) {} d.ref("usernames/" + un).set({ uid: uid, name: pn || un, disc: (w.ChainsAuth && ChainsAuth.localProfile && (ChainsAuth.localProfile(uid) || {}).disc) || "#9CA3AF", badge: fb || null }); }
    } catch (e) {}
    hydrate(uid);
    d.ref("friends/" + uid).on("value", function (s) { _friends = s.val() || {}; writeLS(FK, _friends); Object.keys(_friends).forEach(hydrate); emit(); });
    d.ref("friendRequests/" + uid).on("value", function (s) {
      _reqs = s.val() || {}; writeLS(RK, _reqs); Object.keys(_reqs).forEach(hydrate);
      // v482: a request that arrives while the app is open gets a toast right away
      if (_seenReqs) { Object.keys(_reqs).forEach(function (k) { if (!_seenReqs[k] && !(_reqs[k] && _reqs[k].auto)) { var nm = (_reqs[k] && _reqs[k].fromName) || displayName(k); try { if (w.ChainsToast) ChainsToast.show(nm + " sent you a friend request \u2014 open Friends to accept.", "info"); } catch (e) {} } }); }
      _seenReqs = Object.assign({}, _reqs);
      emit();
    });
  }
  (function waitAuth(n) { if (db() && myUid()) { subscribe(); return; } if ((n || 0) < 30) setTimeout(function () { waitAuth((n || 0) + 1); }, 500); })();
  try { w.addEventListener("chains:identity", function () { subscribe(); }); } catch (e) {}

  w.ChainsFriends = {
    available: function () { return !!db() && !!myUid(); },
    myCode: function () { return _myCode || codeFor(myUid()); },
    // Stored, regenerable code (decision 4): old code is cleaned up so a link
    // once shared can be retired. Falls back gracefully if the write fails.
    regenerate: function () {
      var d = db(), uid = myUid(); if (!d || !uid) return Promise.resolve(false);
      var oldCode = _myCode || codeFor(uid), next = randCode();
      return d.ref("friendCodes/" + next).set(uid).then(function () { return d.ref("users/" + uid + "/profile/friendCode").set(next); }).then(function () {
        try { d.ref("friendCodes/" + oldCode).remove(); } catch (e) {}
        _myCode = next; emit(); return next;
      }).catch(function (e) { _fail("Couldn't regenerate your code \u2014 try again.", e); return false; });
    },
    myUid: myUid,
    myName: myName,
    onChange: function (fn) { var h = function () { try { fn(); } catch (e) {} }; w.addEventListener("chains:friends", h); return function () { w.removeEventListener("chains:friends", h); }; },
    profile: function (uid) { return _names[uid] || null; },
    // v513 profile photos: tiny JPEG data URL on the public usernames index (+ private profile copy)
    photo: function (uid) { uid = uid || myUid(); var p = uid && _names[uid]; return (p && p.photo) || null; },
    photoByName: function (name) { if (!name) return null; var ks = Object.keys(_names); for (var i = 0; i < ks.length; i++) { var p = _names[ks[i]]; if (p && p.photo && p.name === name) return p.photo; } return null; },
    setPhoto: function (dataUrl) {
      var uid = myUid(), d = db(), u = me(); if (!uid || !d) return Promise.resolve(false);
      var v = dataUrl || null; if (v && v.length > 60000) return Promise.resolve(false);
      var un = ((u && u.username) || uid).toLowerCase();
      if (!_names[uid]) _names[uid] = { name: myName(), disc: "#9CA3AF", badge: null, photo: null };
      _names[uid].photo = v; emit();
      var upd = {}; upd["usernames/" + un + "/photo"] = v; if (u && u.uid) upd["users/" + u.uid + "/profile/photo"] = v;
      return d.ref().update(upd).then(function () { return true; }).catch(function () { return false; });
    },
    // v489 "badge yourself up": the one badge you show off next to your name, public via usernames/{me}.
    featuredBadge: function (uid) { uid = uid || myUid(); if (!uid) return null; if (uid === myUid()) { var loc = null; try { loc = JSON.parse(localStorage.getItem("chains_featured_badge_v1:" + uid) || "null"); } catch (e) {} if (loc) return loc; var pm = _names[uid]; return (pm && pm.badge) || null; } var p = _names[uid]; return (p && p.badge) || null; },
    setFeaturedBadge: function (b) {
      var uid = myUid(), d = db(); if (!uid) return false;
      var v = b ? { id: b.id, icon: b.icon, name: b.name, tier: b.tier || null, color: b.color || null } : null;
      try { if (v) localStorage.setItem("chains_featured_badge_v1:" + uid, JSON.stringify(v)); else localStorage.removeItem("chains_featured_badge_v1:" + uid); } catch (e) {}
      try { var meU = me(); var un = (meU && meU.username || "").toLowerCase(); if (d && un) d.ref("usernames/" + un + "/badge").set(v).catch(function () {}); } catch (e) {}
      if (_names[uid]) _names[uid].badge = v;
      emit(); return true;
    },
    list: function () { return Object.keys(_friends).filter(function (k) { return _friends[k]; }).map(function (uid) { var p = _names[uid] || {}; return { uid: uid, name: p.name || "Player", disc: p.disc || "#9CA3AF" }; }); },
    isFriend: function (uid) { return !!_friends[uid]; },
    requests: function () { return Object.keys(_reqs).filter(function (k) { return !(_reqs[k] && _reqs[k].auto) && !_friends[k]; }).map(function (uid) { var r = _reqs[uid] || {}; return { uid: uid, name: r.fromName || (_names[uid] && _names[uid].name) || "Player", ts: r.ts }; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); },
    resolveCode: function (c) {
      c = String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      var d = db(); if (!d || c.length < 4) return Promise.resolve(null);
      return d.ref("friendCodes/" + c).once("value").then(function (s) { return s.exists() ? s.val() : null; }).catch(function () { return null; });
    },
    searchByUsername: function (q) {
      var d = db(); q = String(q || "").trim().toLowerCase();
      if (!d || !q) return Promise.resolve([]);
      // Reads the PUBLIC usernames index (not the private users/ node).
      return d.ref("usernames").once("value").then(function (s) {
        var all = s.val() || {}, out = [], mu = myUid();
        Object.keys(all).forEach(function (key) {
          var v = all[key] || {}; var nm = (v.name || "").toLowerCase();
          if (v.uid && v.uid !== mu && (key.indexOf(q) >= 0 || nm.indexOf(q) >= 0)) out.push({ uid: v.uid, name: v.name || key, username: key, disc: v.disc || "#9CA3AF" });
        });
        return out.slice(0, 12);
      }).catch(function () { return []; });
    },
    sendRequest: function (toUid) {
      var d = db(), uid = myUid();
      if (!d || !uid || !toUid || toUid === uid) return false;
      if (_friends[toUid]) return true; // already friends
      // Key BOTH sides by player identity (whoami) so the receiver reads it under
      // the same key it was written. (Was using the random Firebase uid → invisible.)
      var p; try { p = d.ref("friendRequests/" + toUid + "/" + uid).set({ fromName: myName(), ts: Date.now() }); } catch (e) { _fail("Couldn't send that friend request.", e); return true; }
      if (p && p.then) p.then(function () { notify(toUid, "Friend request", myName() + " wants to be friends on Chains. Open Friends to accept."); }, function (e) { _fail("Couldn't send that friend request.", e); });
      return true;
    },
    accept: function (fromUid) {
      var d = db(), uid = myUid(); if (!d || !uid || !fromUid) return false;
      // Atomic both-sides write — all-or-nothing, so a friendship is never half-built.
      return link(fromUid, "Couldn't accept that request \u2014 try again.", function () { notify(fromUid, "You're friends", myName() + " accepted your friend request."); });
    },
    // Auto-connect: become mutual friends immediately (no pending request) — used
    // when a shared action (e.g. playing a round together) should link the crew.
    befriend: function (fuid) {
      var d = db(), uid = myUid(); if (!d || !uid || !fuid || fuid === uid) return false;
      if (_friends[fuid]) return true;
      // Atomic both-sides write (also clears any pending request in either direction).
      return link(fuid, "Couldn't add that friend \u2014 try again.", function () { notify(fuid, "New friend", myName() + " added you on Chains \u2014 you can now score rounds together."); });
    },
    decline: function (fromUid) {
      var d = db(), uid = myUid(); if (!d || !uid) return false;
      var p; try { p = d.ref("friendRequests/" + uid + "/" + fromUid).remove(); } catch (e) { _fail("Couldn't decline \u2014 try again.", e); return true; }
      if (p && p.catch) p.catch(function (e) { _fail("Couldn't decline \u2014 try again.", e); });
      return true;
    },
    remove: function (fuid) {
      var d = db(), uid = myUid(); if (!d || !uid) return false;
      var u = {}; u["friends/" + uid + "/" + fuid] = null; u["friends/" + fuid + "/" + uid] = null;
      var p; try { p = d.ref().update(u); } catch (e) { _fail("Couldn't remove that friend \u2014 try again.", e); return true; }
      if (p && p.catch) p.catch(function (e) { _fail("Couldn't remove that friend \u2014 try again.", e); });
      return true;
    },
    hydrate: hydrate,
    // v482: does this member id exist? (public usernames index)
    lookup: function (uid) {
      var d = db(); uid = String(uid || "").trim().toLowerCase();
      if (!d || !uid) return Promise.resolve(null);
      return d.ref("usernames/" + uid).once("value").then(function (s) { var v = s.val(); return v ? { uid: v.uid || uid, name: v.name || uid, disc: v.disc || "#9CA3AF" } : null; }).catch(function () { return null; });
    },
    // v482: anything a QR / link / typed field can carry -> a member id. Friend CODE
    // first (6 chars, uppercase), then a member id / username. Resolves null if neither.
    resolveAny: function (v) {
      var self = this; v = String(v || "").trim();
      if (!v) return Promise.resolve(null);
      var asCode = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      var codeFirst = (asCode.length >= 4 && asCode.length <= 8 && v === v.toUpperCase()) ? self.resolveCode(asCode) : Promise.resolve(null);
      return codeFirst.then(function (uid) {
        if (uid) return uid;
        return self.lookup(v).then(function (p) { if (p) return p.uid; return self.resolveCode(asCode).then(function (u2) { return u2 || null; }); });
      });
    },
    // Resolve a code then send a request. Returns {ok, uid?|err?, name?}.
    addByCode: function (c) {
      var self = this;
      return this.resolveAny(c).then(function (uid) {
        if (!uid) return { ok: false, err: "No one found for that code." };
        if (uid === myUid()) return { ok: false, err: "That's your own code." };
        if (_friends[uid]) return { ok: false, err: displayName(uid) + " is already your friend." };
        self.sendRequest(uid); hydrate(uid);
        return { ok: true, uid: uid, name: displayName(uid) };
      });
    }
  };

  /* v499 — direct messages between friends. window.ChainsChat
     messages/{tid}/{msgId} = { from, to, text, at }   tid = [a,b].sort().join("~")
     threads/{key}/{other}  = { last, at, from, unread }  (per-side summary; recipient's unread++)
     Every message also lands in the recipient's bell via ChainsNotify. */
  var _threads = {}, _threadsSub = null, _chatListeners = [];
  function chatEmit() { _chatListeners.forEach(function (fn) { try { fn(_threads); } catch (e) {} }); try { w.dispatchEvent(new Event("chains:chat")); w.dispatchEvent(new Event("chains:friends")); } catch (e) {} }
  function tidOf(a, b) { return [String(a), String(b)].sort().join("~"); }
  function subscribeThreads() {
    var d = db(), me = myUid(); if (!d || !me || _threadsSub === me) return; _threadsSub = me;
    d.ref("threads/" + me).on("value", function (s) { _threads = s.val() || {}; Object.keys(_threads).forEach(hydrate); chatEmit(); });
  }
  (function waitChat(n) { if (db() && myUid()) { subscribeThreads(); return; } if ((n || 0) < 40) setTimeout(function () { waitChat((n || 0) + 1); }, 500); })();
  try { w.addEventListener("chains:identity", function () { subscribeThreads(); }); } catch (e) {}
  w.ChainsChat = {
    tid: tidOf,
    threads: function () { return _threads; },
    unread: function () { var n = 0; Object.keys(_threads).forEach(function (k) { n += (_threads[k] && _threads[k].unread) || 0; }); return n; },
    unreadWith: function (other) { return (_threads[other] && _threads[other].unread) || 0; },
    onThreads: function (fn) { _chatListeners.push(fn); return function () { _chatListeners = _chatListeners.filter(function (x) { return x !== fn; }); }; },
    send: function (other, text) {
      var d = db(), me = myUid(); text = String(text || "").trim().slice(0, 1000);
      if (!d || !me || !other || other === me || !text) return Promise.resolve(false);
      var tid = tidOf(me, other), at = Date.now();
      var msgRef = d.ref("messages/" + tid).push();
      var u = {};
      u["messages/" + tid + "/" + msgRef.key] = { from: me, to: other, text: text, at: at };
      u["threads/" + me + "/" + other] = { last: text.slice(0, 120), at: at, from: me, unread: 0 };
      return d.ref().update(u).then(function () {
        // recipient summary: bump unread without clobbering (transaction)
        return d.ref("threads/" + other + "/" + me).transaction(function (cur) { cur = cur || {}; return { last: text.slice(0, 120), at: at, from: me, unread: (cur.unread || 0) + 1 }; }).catch(function () {});
      }).then(function () { notify(other, myName() + " sent you a message", text.slice(0, 90), "friends"); return true; }).catch(function (e) { _fail("Couldn't send that message \u2014 try again.", e); return false; });
    },
    watch: function (other, cb) {
      var d = db(), me = myUid(); if (!d || !me || !other) { cb([]); return function () {}; }
      var ref = d.ref("messages/" + tidOf(me, other)).limitToLast(200);
      var h = ref.on("value", function (s) { var v = s.val() || {}; var list = Object.keys(v).map(function (k) { return Object.assign({ id: k }, v[k]); }).sort(function (a, b) { return (a.at || 0) - (b.at || 0); }); cb(list); });
      return function () { try { ref.off("value", h); } catch (e) {} };
    },
    markRead: function (other) { var d = db(), me = myUid(); if (!d || !me || !other) return; try { d.ref("threads/" + me + "/" + other + "/unread").set(0).catch(function () {}); } catch (e) {} }
  };
})(typeof window !== "undefined" ? window : this);
