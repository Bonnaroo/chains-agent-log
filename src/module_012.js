/* ============================================================
   CHAINS — Firebase init. window.ChainsFB
   Separate backend project for the NEW app (accounts + cloud
   leagues). This is NOT the live Classic data project, so the
   running season can't be touched while we build/test.
   ============================================================ */
(function () {
  var cfg = {
    apiKey: "AIzaSyAZ9T16EZSngQxNevsil-txb3xpEC4RKIE",
    authDomain: "chains-app-f38f8.firebaseapp.com",
    databaseURL: "https://chains-app-f38f8-default-rtdb.firebaseio.com",
    projectId: "chains-app-f38f8",
    storageBucket: "chains-app-f38f8.firebasestorage.app",
    messagingSenderId: "247641182105",
    appId: "1:247641182105:web:51f76d327a99fc7d0b4d08",
    measurementId: "G-BYYECHV5R2"
  };
  try {
    if (window.firebase && firebase.initializeApp) {
      var app = firebase.initializeApp(cfg);
      var auth = firebase.auth();
      // Stay logged in across sessions / app closes / refreshes.
      try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}
      window.ChainsFB = { app: app, auth: auth, db: firebase.database(), ok: true };
      // v553 — no cloud write fails silently (audit 3.1). Every set/update/remove/push rejection is logged
      // with its path, whatever the caller does with the promise; the first refusal in a session also
      // raises a toast so the player knows something didn't save. Callers' own .catch() still work.
      try {
        var P = firebase.database.Reference.prototype, root = String(firebase.database().ref().toString());
        var warned = false;
        var wrap = function (fn) {
          var orig = P[fn]; if (!orig || orig.__chainsWrapped) return;
          var w = function () {
            var p; try { p = orig.apply(this, arguments); } catch (e) { try { console.error("[Chains] bad write", fn, String(this.toString()).replace(root, ""), e && e.message); } catch (x) {} throw e; }
            var path = ""; try { path = String(this.toString()).replace(root, ""); } catch (x) {}
            if (p && typeof p.then === "function") p.then(null, function (e) {
              try { console.error("[Chains] cloud write refused", fn, path, e && (e.code || e.message)); } catch (x) {}
              try { window.dispatchEvent(new CustomEvent("chains:write-failed", { detail: { op: fn, path: path, code: e && e.code } })); } catch (x) {}
              if (!warned && window.ChainsToast) { warned = true; try { ChainsToast.show("Something didn't save to the cloud. It's still on this phone and will retry.", "error"); } catch (x) {} }
            });
            return p;
          };
          w.__chainsWrapped = true; P[fn] = w;
        };
        ["set", "update", "remove", "push"].forEach(wrap);
      } catch (e) { try { console.warn("[Chains] write logging not installed", e && e.message); } catch (x) {} }
    } else {
      // SDK didn't load (offline / blocked) — app falls back to local identity.
      window.ChainsFB = { ok: false, reason: "sdk-missing" };
    }
  } catch (e) {
    window.ChainsFB = { ok: false, reason: String(e && e.message || e) };
  }
})();
