/* ============================================================
   CHAINS — auth layer. window.ChainsAuth
   Username + password, mapped to a synthetic email
   (username@chains.app) so users never enter personal info.
   On sign-in it bridges the real uid/username into ChainsID,
   so every existing screen (whoami / isCommish / canEditMember)
   keeps working unchanged — one identity source, swappable.
   ============================================================ */
(function () {
  var DOMAIN = "@chains.app";

  function normUser(u) {
    return String(u || "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  }
  function emailFor(u) { return normUser(u) + DOMAIN; }
  function userFromEmail(e) { return String(e || "").split("@")[0]; }
  function fb() { return (window.ChainsFB && window.ChainsFB.ok) ? window.ChainsFB : null; }
  function available() { return !!fb(); }

  function current() {
    var f = fb(); if (!f) return null;
    var u = f.auth.currentUser; if (!u) return null;
    return { uid: u.uid, username: u.displayName || userFromEmail(u.email), email: u.email, anon: !!u.isAnonymous };
  }

  // Canonical app identity for the CURRENT session — what ChainsID.whoami mirrors so
  // identity can't drift from the signed-in account. Email accounts resolve to the
  // username baked into their email; anonymous name-pick users to their picked name.
  function sessionId() {
    var u = current(); if (!u) return null;
    if (u.email) return userFromEmail(u.email);
    return normUser(u.username || "") || null;
  }

  // Bridge the signed-in identity into the existing ChainsID seam — LOWERCASE so it
  // matches existing member ids (e.g. "will", "kyle") the whole app keys on. Anonymous
  // (name-pick) users have NO email — we keep the locally-picked name as the identity
  // instead of clobbering it with the anon uid.
  function bridge(who) {
    try {
      if (who && who.email && window.ChainsID) {
        var mid = (_profile && _profile.memberId) || userFromEmail(who.email);
        ChainsID.setWhoami(mid);
      }
    } catch (e) {}
  }

  // ---- Profile + onboarding (one system: reflects into the existing member) ----
  function pkey(uid) { return "chains_profile_" + uid; }
  function localProfile(uid) { try { return JSON.parse(localStorage.getItem(pkey(uid)) || "null"); } catch (e) { return null; } }
  function isOnboarded(uid) { var p = localProfile(uid); return !!(p && p.onboarded); }
  function fetchOnboarded(uid) {
    var f = fb(); if (!f) return Promise.resolve(isOnboarded(uid));
    return f.db.ref("users/" + uid).get().then(function (s) {
      var v = s.val();
      if (v) { try { localStorage.setItem(pkey(uid), JSON.stringify(v)); } catch (e) {} return !!v.onboarded; }
      return isOnboarded(uid);
    }).catch(function () { return isOnboarded(uid); });
  }
  function markOnboarded() {
    var f = fb(); var u = f && f.auth.currentUser; if (!u) return Promise.resolve();
    var who = userFromEmail(u.email);
    var m = (window.ChainsEngine && ChainsEngine.member) ? ChainsEngine.member(who) : null;
    var data = { username: who, displayName: (m && m.name) || (u.displayName || who), disc: (m && m.disc) || "#5BA978", onboarded: true, updatedAt: Date.now() };
    try { localStorage.setItem(pkey(u.uid), JSON.stringify(data)); } catch (e) {}
    try { window.dispatchEvent(new Event("chains:identity")); } catch (e) {}
    return f.db.ref("users/" + u.uid).update(data).catch(function () {});
  }
  function saveProfile(fields) {
    var f = fb(); var u = f && f.auth.currentUser; if (!u || !fields) return Promise.resolve();
    var data = Object.assign({}, fields, { updatedAt: Date.now() });
    try { var prev = JSON.parse(localStorage.getItem(pkey(u.uid)) || "{}"); localStorage.setItem(pkey(u.uid), JSON.stringify(Object.assign(prev, data))); } catch (e) {}
    try { window.dispatchEvent(new Event("chains:identity")); } catch (e) {}
    return f.db.ref("users/" + u.uid).update(data).catch(function () {});
  }
  function saveOnboarding(p) {
    var f = fb(); var u = f && f.auth.currentUser; if (!u) return Promise.resolve();
    var who = userFromEmail(u.email);
    var data = { username: who, displayName: p.displayName, disc: p.disc, onboarded: true, updatedAt: Date.now() };
    try { localStorage.setItem(pkey(u.uid), JSON.stringify(data)); } catch (e) {}
    try { u.updateProfile({ displayName: p.displayName }); } catch (e) {}
    // Reflect into the EXISTING app profile when this user maps to a league member.
    try {
      if (window.ChainsEngine && ChainsEngine.member && ChainsEngine.setMembers && ChainsEngine.member(who)) {
        var list = ChainsEngine.members().map(function (x) { return x.id === who ? Object.assign({}, x, { name: p.displayName, disc: p.disc }) : x; });
        ChainsEngine.setMembers(list);
      }
    } catch (e) {}
    try { window.dispatchEvent(new Event("chains:identity")); } catch (e) {}
    return f.db.ref("users/" + u.uid).update(data).catch(function () {});
  }

  function friendlyError(err) {
    var c = (err && err.code) || "";
    if (c === "auth/email-already-in-use") return "That username is taken — try signing in instead.";
    if (c === "auth/invalid-credential" || c === "auth/wrong-password" || c === "auth/user-not-found") return "Wrong username or password.";
    if (c === "auth/weak-password") return "Password must be at least 6 characters.";
    if (c === "auth/too-many-requests") return "Too many tries — wait a moment and retry.";
    if (c === "auth/network-request-failed") return "No connection — check your network.";
    return (err && err.message) || "Something went wrong.";
  }

  function signUp(username, password) {
    var f = fb(); if (!f) return Promise.reject(new Error("Accounts are unavailable right now."));
    var uname = String(username || "").trim();
    return f.auth.createUserWithEmailAndPassword(emailFor(uname), password).then(function (cred) {
      return cred.user.updateProfile({ displayName: uname }).then(function () {
        try { f.db.ref("users/" + cred.user.uid).update({ username: uname, createdAt: Date.now() }); } catch (e) {}
        bridge(current());
        return current();
      });
    });
  }
  function signIn(username, password) {
    var f = fb(); if (!f) return Promise.reject(new Error("Accounts are unavailable right now."));
    var persist = Promise.resolve();
    try { if (window.firebase && firebase.auth && firebase.auth.Auth) persist = f.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}
    return persist.catch(function () {}).then(function () { return f.auth.signInWithEmailAndPassword(emailFor(username), password); }).then(function () {
      var u = f.auth.currentUser;
      try { if (u) f.db.ref("users/" + u.uid + "/profile/lastLogin").set(Date.now()).catch(function () {}); } catch (e) {}
      return fetchAccountProfile().then(function () { bridge(current()); return current(); });
    });
  }

  // Passwordless name-pick: sign in ANONYMOUSLY so the user has a real DB session
  // (join codes resolve, joins/add-member writes succeed) while keeping their picked
  // Classic player as the identity. The anon account can later be upgraded to a real
  // password account (linkPassword) WITHOUT losing the uid / leagues / claims.
  // Requires the Anonymous provider enabled in the Firebase console.
  function signInAnonymouslyAs(name) {
    var f = fb(); if (!f) return Promise.reject(new Error("Accounts are unavailable right now."));
    var who = normUser(name);
    // Ensure LOCAL persistence is in place BEFORE sign-in so the session survives
    // reloads/app-closes (and we stop minting a fresh anon user on every load).
    var persist = Promise.resolve();
    try { if (window.firebase && firebase.auth && firebase.auth.Auth) persist = f.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}
    return persist.catch(function () {}).then(function () { return f.auth.signInAnonymously(); }).then(function (cred) {
      var u = cred.user;
      try { u.updateProfile({ displayName: who }); } catch (e) {}
      var m = (window.ChainsEngine && ChainsEngine.member) ? ChainsEngine.member(who) : null;
      var data = { username: who, displayName: (m && m.name) || who, disc: (m && m.disc) || "#5BA978", claimedPlayer: who, anon: true, onboarded: true, updatedAt: Date.now() };
      try { localStorage.setItem(pkey(u.uid), JSON.stringify(data)); } catch (e) {}
      try { f.db.ref("users/" + u.uid).update(data); } catch (e) {}
      try { if (window.ChainsID) ChainsID.setWhoami(who); } catch (e) {}   // keep the picked player as identity
      return current();
    });
  }

  // "Add a password later" — LINK an email credential to the existing anon account so
  // the uid (and everything tied to it) is preserved. Falls back to a fresh signUp if
  // there's no anon session to link.
  function linkPassword(username, password) {
    var f = fb(); if (!f) return Promise.reject(new Error("Accounts are unavailable right now."));
    var u = f.auth.currentUser;
    var uname = String(username || "").trim();
    if (!u || !u.isAnonymous) return signUp(uname, password);
    var EAP = (window.firebase && firebase.auth && firebase.auth.EmailAuthProvider) || null;
    if (!EAP) return Promise.reject(new Error("Can't link a password right now."));
    var cred = EAP.credential(emailFor(uname), password);
    return u.linkWithCredential(cred).then(function (res) {
      try { res.user.updateProfile({ displayName: uname }); } catch (e) {}
      try { f.db.ref("users/" + res.user.uid).update({ username: uname, anon: false, updatedAt: Date.now() }); } catch (e) {}
      bridge(current());
      return current();
    });
  }
  function signOut() {
    // ANONYMOUS SESSIONS NO LONGER GRANT ACCESS: reset whoami BEFORE auth.signOut()
    // fires onChange(null) — otherwise the gate sees a stale local identity while
    // still "signed out" and silently signs the user right back in.
    try { if (window.ChainsID) ChainsID.reset(); } catch (e) {}
    var f = fb(); if (!f) return Promise.resolve();
    return f.auth.signOut().then(function () {
      // Clear per-user local state so the NEXT user who signs in on this device
      // doesn't inherit the previous user's coins / profile.
      try { localStorage.removeItem(COIN_KEY); } catch (e) {}
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("chains_profile_") === 0) localStorage.removeItem(k); }); } catch (e) {}
      try { window.dispatchEvent(new Event("chains:coins")); } catch (e) {}
    });
  }
  function onChange(cb) {
    var f = fb();
    if (!f) { cb(null, true); return function () {}; }   // unavailable → app falls back to local identity
    return f.auth.onAuthStateChanged(function () {
      var who = current();
      bridge(who);
      cb(who, false);
    });
  }

  // ---- Earnable coins (play currency). Balance at users/{uid}/coins, cached
  // locally for synchronous reads. New accounts start with COIN_START. ----
  var COIN_KEY = "chains_coins", COIN_START = 15;
  function coins() { try { var v = localStorage.getItem(COIN_KEY); return v == null ? COIN_START : (+v || 0); } catch (e) { return COIN_START; } }
  function setCoinsLocal(n) { try { localStorage.setItem(COIN_KEY, String(n)); } catch (e) {} try { window.dispatchEvent(new Event("chains:coins")); } catch (e) {} }
  function adjustCoins(delta, reason, meta) {
    var f = fb(), u = f && f.auth.currentUser, before = coins(), nv = Math.max(0, before + delta);
    setCoinsLocal(nv);
    if (u) {
      try { var cp = f.db.ref("users/" + u.uid + "/coins").set(nv); if (cp && cp.catch) cp.catch(function (e) { try { if (window.ChainsToast) ChainsToast.show("Couldn't sync your balance \u2014 it'll retry.", "error"); } catch (x) {} }); } catch (e) {}
      // Audit trail: every coin movement is recorded so money/pools can be reviewed later.
      try { var lp = f.db.ref("ledger").push({ ts: Date.now(), uid: u.uid, username: userFromEmail(u.email), type: reason || "adjust", amount: delta, balanceAfter: nv, poolId: (meta && meta.poolId) || null, note: (meta && meta.note) || null }); if (lp && lp.catch) lp.catch(function () {}); } catch (e) {}
    }
    return nv;
  }
  function initCoins() {
    var f = fb(); if (!f) { return; }
    f.auth.onAuthStateChanged(function (u) {
      if (!u) return;
      var ref = f.db.ref("users/" + u.uid + "/coins");
      ref.get().then(function (s) { var v = s.val(); if (v == null) { ref.set(COIN_START); v = COIN_START; } setCoinsLocal(v); }).catch(function () {});
      ref.on("value", function (s) { var v = s.val(); if (v != null) setCoinsLocal(v); });
      try { if (window.ChainsTrophies) ChainsTrophies.sync(); } catch (e) {}
    });
  }
  initCoins();

  // ---- Account profile (users/{uid}/profile — the backend-provisioned shape) ----
  var _profile = null;
  function accountProfile() { return _profile; }
  function fetchAccountProfile() {
    var f = fb(); var u = f && f.auth.currentUser;
    if (!f || !u || u.isAnonymous) { return Promise.resolve(_profile); }
    return f.db.ref("users/" + u.uid + "/profile").get().then(function (s) { return s.val(); })
      .then(function (v) {
        if (!v) { // legacy accounts kept fields at the users/{uid} root
          return f.db.ref("users/" + u.uid).get().then(function (s2) { var r = s2.val() || {}; return { username: r.username, memberId: r.memberId || null, name: r.displayName || r.username, disc: r.disc, leagues: r.leagues || null, mustChangePassword: !!r.mustChangePassword }; }).catch(function () { return null; });
        }
        return v;
      })
      .then(function (v) {
        if (v) _profile = v;
        try { if (_profile && _profile.memberId && window.ChainsID && ChainsID.whoami() !== _profile.memberId) ChainsID.setWhoami(_profile.memberId); } catch (e) {}
        try { window.dispatchEvent(new Event("chains:profile")); } catch (e) {}
        return _profile;
      }).catch(function () { return _profile; });
  }
  function mustChangePassword() { return !!(_profile && _profile.mustChangePassword); }
  function myLeagues() { return (_profile && _profile.leagues) || null; }
  // Which league experience does this session get? "member" (Chains), "none"
  // (empty state), "unknown" (profile still loading — treat as member briefly).
  // Interim rule: the six known members always see Chains; anon name-pick = legacy.
  function leagueAccess() {
    var c = current(); if (!c) return "unknown";
    if (c.anon) return "member";
    var sid = (_profile && _profile.memberId) || sessionId();
    try { var ms = (window.ChainsEngine && ChainsEngine.members) ? ChainsEngine.members() : []; if (ms.some(function (m) { return m.id === sid; })) return "member"; } catch (e) {}
    if (_profile) { var L = _profile.leagues || {}; return L["chains-dgpt-2026"] ? "member" : "none"; }
    return "unknown";
  }
  function changePassword(currentPw, newPw) {
    var f = fb(); var u = f && f.auth.currentUser;
    if (!u || !u.email) return Promise.reject(new Error("Sign in first."));
    if (!newPw || newPw.length < 6) return Promise.reject(new Error("Password must be at least 6 characters."));
    if (newPw === "chains1234") return Promise.reject(new Error("Pick something other than the starter password."));
    var pre = Promise.resolve();
    if (currentPw) { try { pre = u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, currentPw)); } catch (e) { return Promise.reject(e); } }
    return pre.then(function () { return u.updatePassword(newPw); }).then(function () {
      _profile = Object.assign({}, _profile || {}, { mustChangePassword: false });
      try { window.dispatchEvent(new Event("chains:profile")); } catch (e) {}
      return f.db.ref("users/" + u.uid + "/profile").update({ mustChangePassword: false, passwordChangedAt: Date.now() }).catch(function () {});
    });
  }
  // Change username as ONE transaction with rollback. memberId is NEVER touched —
  // it's the permanent tie to league history. Auth email moves to new@chains.app.
  function changeUsername(newUsername, password) {
    var f = fb(); var u = f && f.auth.currentUser;
    if (!u || !u.email) return Promise.reject(new Error("Sign in first."));
    var oldU = userFromEmail(u.email), newU = normUser(newUsername);
    if (!newU || newU.length < 2) return Promise.reject(new Error("Usernames are 2+ letters/numbers."));
    if (newU === oldU) return Promise.resolve(current());
    if (!password) return Promise.reject(new Error("Confirm with your password."));
    var prof = _profile || {};
    var entry = { name: prof.name || u.displayName || newU, disc: prof.disc || "#5BA978", uid: u.uid, memberId: prof.memberId || null };
    var newRef = f.db.ref("usernames/" + newU), oldRef = f.db.ref("usernames/" + oldU);
    var wroteNew = false, emailChanged = false;
    return u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, password))
      .then(function () { return newRef.get().catch(function () { return { exists: function () { return false; } }; }); })
      .then(function (s) { if (s.exists && s.exists()) throw new Error("That username is taken."); return newRef.set(entry); })
      .then(function () { wroteNew = true; return u.updateEmail(emailFor(newU)); })
      .then(function () { emailChanged = true; return f.db.ref("users/" + u.uid + "/profile").update({ username: newU }); })
      .then(function () { return oldRef.remove().catch(function () {}); })
      .then(function () {
        try { u.updateProfile({ displayName: entry.name }); } catch (e) {}
        _profile = Object.assign({}, _profile || {}, { username: newU });
        try { window.dispatchEvent(new Event("chains:profile")); } catch (e) {}
        bridge(current());
        return current();
      })
      .catch(function (e) {
        var undo = Promise.resolve();
        if (emailChanged) undo = undo.then(function () { return u.updateEmail(emailFor(oldU)).catch(function () {}); });
        if (wroteNew) undo = undo.then(function () { return newRef.remove().catch(function () {}); });
        return undo.then(function () { throw e; });
      });
  }
  function setRecoveryEmail(email) {
    var f = fb(); var u = f && f.auth.currentUser;
    if (!u) return Promise.reject(new Error("Sign in first."));
    var v = String(email || "").trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return Promise.reject(new Error("That doesn't look like an email."));
    _profile = Object.assign({}, _profile || {}, { recoveryEmail: v || null });
    return f.db.ref("users/" + u.uid + "/profile").update({ recoveryEmail: v || null });
  }
  // ---- Owner console helpers ----
  // Reset = queue for the backend (Admin SDK applies it; clients can't set another
  // user's password — by design). Record carries setMustChange so they re-change it.
  function adminRequestReset(target, tempPw) {
    var f = fb(); var u = f && f.auth.currentUser;
    if (!f || !u) return Promise.reject(new Error("Offline."));
    if (!tempPw || tempPw.length < 6) return Promise.reject(new Error("Temp password must be 6+ characters."));
    var ref = f.db.ref("admin/passwordResets").push();
    return ref.set({ username: target.username || null, uid: target.uid || null, memberId: target.memberId || null, tempPassword: tempPw, setMustChange: true, requestedBy: u.uid, requestedAt: Date.now(), status: "pending" }).then(function () { return ref.key; });
  }
  // Create a member account WITHOUT dropping the owner's session: a throwaway
  // secondary Firebase app signs the new user in, writes their self-owned nodes,
  // then is torn down. Same shape the backend used for the six.
  function adminCreateMember(opts) {
    var f = fb(); if (!f || !window.firebase) return Promise.reject(new Error("Offline."));
    var uname = normUser(opts && opts.username); var pw = (opts && opts.password) || "";
    if (!uname || uname.length < 2) return Promise.reject(new Error("Username required (2+ letters/numbers)."));
    if (pw.length < 6) return Promise.reject(new Error("Starter password must be 6+ characters."));
    return f.db.ref("usernames/" + uname).get().then(function (s) {
      if (s.exists()) throw new Error("That username is taken.");
      var app2 = firebase.initializeApp(firebase.app().options, "chains-admin-" + Date.now().toString(36));
      var done = function () { try { app2.auth().signOut(); } catch (e) {} try { app2.delete(); } catch (e) {} };
      return app2.auth().createUserWithEmailAndPassword(emailFor(uname), pw).then(function (cred) {
        var uid2 = cred.user.uid;
        var prof = { username: uname, memberId: (opts.memberId || null), name: (opts.name || uname), disc: (opts.disc || "#5BA978"), leagues: (opts.leagues || null), mustChangePassword: true, createdAt: Date.now() };
        var db2 = app2.database();
        return db2.ref("users/" + uid2 + "/profile").set(prof)
          .then(function () { return db2.ref("usernames/" + uname).set({ name: prof.name, disc: prof.disc, uid: uid2, memberId: prof.memberId }); })
          .then(function () { done(); return { uid: uid2, username: uname }; });
      }).catch(function (e) { done(); throw e; });
    });
  }

  // v535 — delete my account (App Store requirement; also just right). Removes the private record,
  // the public card, friend links and codes; rounds stay (scores other people were on) with the name
  // "Former player"; then deletes the auth user. Needs the password (recent sign-in rule).
  function deleteAccount(password) {
    var f = fb(); var u = f && f.auth.currentUser;
    if (!u || !u.email) return Promise.reject(new Error("Sign in first."));
    if (!password) return Promise.reject(new Error("Enter your password to confirm."));
    var key = (u.displayName || userFromEmail(u.email) || "").toLowerCase();
    return u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, password)).then(function () {
      var upd = {};
      upd["users/" + u.uid] = null;
      if (key) { upd["usernames/" + key] = null; upd["friends/" + key] = null; upd["friendRequests/" + key] = null; upd["roundsByPlayer/" + key] = null; upd["crewByUser/" + key] = null; }
      return f.db.ref().update(upd).catch(function () {});
    }).then(function () {
      // friend lists of other people and course stats keep a placeholder name, never the account
      if (!key) return;
      return f.db.ref("friends").get().then(function (s) {
        var all = s.val() || {}, upd = {};
        Object.keys(all).forEach(function (k) { if (all[k] && all[k][key]) upd["friends/" + k + "/" + key] = null; });
        return Object.keys(upd).length ? f.db.ref().update(upd).catch(function () {}) : null;
      }).catch(function () {});
    }).then(function () {
      try { if (window.ChainsID) ChainsID.reset(); } catch (e) {}
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("chains_") === 0) localStorage.removeItem(k); }); } catch (e) {}
      return u.delete();
    });
  }

  window.ChainsAuth = {
    deleteAccount: deleteAccount,
    signUp: signUp, signIn: signIn, signOut: signOut, signInAnonymouslyAs: signInAnonymouslyAs, linkPassword: linkPassword,
    onChange: onChange, current: current, sessionId: sessionId,
    emailFor: emailFor, available: available, friendlyError: friendlyError,
    saveOnboarding: saveOnboarding, saveProfile: saveProfile, markOnboarded: markOnboarded, isOnboarded: isOnboarded, fetchOnboarded: fetchOnboarded, localProfile: localProfile,
    coins: coins, adjustCoins: adjustCoins,
    fetchAccountProfile: fetchAccountProfile, accountProfile: accountProfile, mustChangePassword: mustChangePassword, myLeagues: myLeagues, leagueAccess: leagueAccess,
    changePassword: changePassword, changeUsername: changeUsername, setRecoveryEmail: setRecoveryEmail,
    adminRequestReset: adminRequestReset, adminCreateMember: adminCreateMember
  };
})();
