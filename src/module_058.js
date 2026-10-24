/* ============================================================
   CHAINS — login + auth gate. window.AuthGate / window.LoginView
   Phase 1 of the backend: a real account stands between the app
   and the data. Signed out → LoginView. Signed in → the app
   (rendered through ChainsApp, unchanged). If Firebase can't
   load at all, we fail OPEN to the app so it's never bricked.
   ============================================================ */
(function () {
  // entry-screen feedback: pick/press states + input focus (inputs use outline:none)
  (function injectLoginStyles() {
    if (typeof document === "undefined" || document.getElementById("chains-login-styles")) return;
    var s = document.createElement("style"); s.id = "chains-login-styles";
    s.textContent = ".lg-pick{transition:background .12s ease,transform .08s ease}.lg-pick:hover{background:rgba(255,255,255,.09)!important}.lg-pick:active{transform:scale(.985)}.lg-input:focus{border-color:var(--ace-500,#FF5A1F)!important;background:rgba(255,255,255,.09)!important}.lg-btn{transition:filter .12s ease,transform .08s ease}.lg-btn:hover{filter:brightness(1.08)}.lg-btn:active{transform:scale(.985)}";
    document.head.appendChild(s);
  })();
  function ChainsMark({ size }) {
    var s = size || 40;
    return (
      <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden="true">
        <rect x="20" y="14" width="24" height="3.4" rx="1.7" fill="var(--ace-500, #FF5A1F)" />
        <rect x="30.6" y="17" width="2.8" height="33" rx="1.4" fill="#C7CEC9" />
        <g stroke="#93C9A8" strokeWidth="1.7" strokeLinecap="round">
          <path d="M22 18.5 L30 30" /><path d="M27 18.5 L31 30" /><path d="M37 18.5 L33 30" /><path d="M42 18.5 L34 30" /><path d="M32 18.5 L32 30" />
        </g>
        <path d="M19 31.5 H45 L41.5 41 H22.5 Z" fill="#2E6B45" />
        <path d="M19 31.5 H45" stroke="#5BA978" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  var SHELL = { minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(120% 100% at 50% 0%, var(--pine-800, #16261E) 0%, var(--pine-900, #0C160F) 70%)", padding: 24, boxSizing: "border-box" };

  function AuthSplash() {
    return (
      <div style={SHELL}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: 0.9 }}>
          <ChainsMark size={52} />
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.2)", borderTopColor: "var(--ace-500, #FF5A1F)", animation: "chains-spin .8s linear infinite" }} />
        </div>
      </div>
    );
  }

  function LoginView(props) {
    var [view, setView] = React.useState("account"); // v506: always a real sign-in // sign-in is the front door; name-pick only when Firebase is unreachable
    var [mode, setMode] = React.useState("signin");   // signin | signup
    var [username, setUsername] = React.useState("");
    var [password, setPassword] = React.useState("");
    var [busy, setBusy] = React.useState(false);
    var [err, setErr] = React.useState("");
    var [forgot, setForgot] = React.useState(false);
    var [fEmail, setFEmail] = React.useState("");
    var [fMsg, setFMsg] = React.useState("");
    var isSignup = mode === "signup";
    // v502: self-service reset. Writes a request the reset worker picks up (Admin SDK sets a
    // temporary password and emails it to the recovery address on the account).
    function requestReset() {
      var u = username.trim().toLowerCase(); var em = fEmail.trim();
      if (!u) { setFMsg("Enter your username first."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setFMsg("Enter the recovery email on your account."); return; }
      setBusy(true); setFMsg("");
      try {
        var f = window.ChainsFB; var ref = f.db.ref("passwordResetRequests").push();
        ref.set({ username: u, email: em, requestedAt: Date.now(), status: "pending", ua: (navigator.userAgent || "").slice(0, 120) })
          .then(function () { setBusy(false); setFMsg("Got it. If that email matches the account, a temporary password is on its way (check spam). Sign in with it, then change it in Settings."); })
          .catch(function () { setBusy(false); setFMsg("Couldn\u2019t send that right now \u2014 try again in a minute."); });
      } catch (e) { setBusy(false); setFMsg("Couldn\u2019t send that right now."); }
    }

    function submit(e) {
      if (e && e.preventDefault) e.preventDefault();
      setErr("");
      var u = username.trim().toLowerCase();
      if (!u) { setErr("Pick a username."); return; }
      if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
      setBusy(true);
      var p = isSignup ? ChainsAuth.signUp(u, password) : ChainsAuth.signIn(u, password);
      p.then(function () { /* AuthGate's onChange swaps to the app */ })
        .catch(function (e2) { setErr(ChainsAuth.friendlyError(e2)); setBusy(false); });
    }

    function pickPlayer(id) {
      if (window.ChainsID && ChainsID.setWhoami) ChainsID.setWhoami(id);
      var enter = function () { if (props && props.onEnter) props.onEnter(); };
      // AWAIT the anonymous sign-in before entering, so the user's very first DB
      // actions (a pick, a friend request, a saved round) don't race the session
      // and get silently PERMISSION_DENIED. On failure we still enter (local-only).
      try {
        if (window.ChainsAuth && ChainsAuth.signInAnonymouslyAs && ChainsAuth.available && ChainsAuth.available()) {
          setBusy(true);
          ChainsAuth.signInAnonymouslyAs(id).then(enter, enter);
          return;
        }
      } catch (e) {}
      enter();
    }
    // Testing mode (no password): tap your name → you're in as your real player,
    // carrying the season you've already played. Accounts/passwords stay available
    // behind "Use a password account instead" for whenever you switch them back on.
    if (view === "pick") {
      var roster = (window.ChainsEngine && ChainsEngine.members) ? ChainsEngine.members() : [];
      return (
        <div style={SHELL}>
          <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <ChainsMark size={46} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 30, color: "var(--bone-50, #f5f3ec)", lineHeight: 1 }}>Chains</div>
                <div style={{ width: 54, height: 3, background: "var(--ace-500, #FF5A1F)", borderRadius: 2, margin: "8px auto 0" }} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".22em", fontSize: 10, color: "var(--chain-400, #9fb3a6)", marginTop: 10 }}>Disc golf, with your crew</div>
              </div>
            </div>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--bone-50, #f5f3ec)" }}>Who's playing?</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400, #9fb3a6)", marginTop: 5 }}>Tap your name to jump into your season.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {roster.map(function (m) {
                var initials = (m.name || "?").trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
                return (
                  <button key={m.id} onClick={function () { pickPlayer(m.id); }} className="lg-pick" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, flexShrink: 0, borderRadius: "50%", background: m.disc || "#2A6FDB", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, boxShadow: "inset 0 0 0 2px rgba(255,255,255,.25)" }}>{initials}</span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 16, color: "var(--bone-50, #f5f3ec)" }}>{m.name}</span>
                    <span style={{ color: "var(--chain-400, #9fb3a6)", fontSize: 20, lineHeight: 1 }}>›</span>
                  </button>
                );
              })}
            </div>
            <button onClick={function () { setView("account"); }} style={{ marginTop: 20, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--chain-300, #b9cabe)", textAlign: "center" }}>Use a password account instead</button>
            <div style={{ marginTop: 16, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "rgba(255,255,255,.34)", lineHeight: 1.5 }}>Offline fallback — accounts couldn't be reached.<br />Your scores stay on this device and sync when you're back.</div>
          </div>
        </div>
      );
    }
    var label = { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--chain-400, #9fb3a6)", marginBottom: 6, display: "block" };
    var input = { width: "100%", height: 46, padding: "0 14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "var(--bone-50, #f5f3ec)", fontFamily: "var(--font-sans)", fontSize: 15, outline: "none", boxSizing: "border-box" };

    return (
      <div style={SHELL}>
        <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 26 }}>
            <ChainsMark size={46} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 30, color: "var(--bone-50, #f5f3ec)", lineHeight: 1 }}>Chains</div>
              <div style={{ width: 54, height: 3, background: "var(--ace-500, #FF5A1F)", borderRadius: 2, margin: "8px auto 0" }} />
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".22em", fontSize: 10, color: "var(--chain-400, #9fb3a6)", marginTop: 10 }}>Disc golf, with your crew</div>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={label}>Username</label>
              <input value={username} onChange={function (e) { setUsername(e.target.value); }} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="e.g. will" className="lg-input" style={input} />
            </div>
            <div>
              <label style={label}>Password</label>
              <input type="password" value={password} onChange={function (e) { setPassword(e.target.value); }} placeholder={isSignup ? "at least 6 characters" : "your password"} className="lg-input" style={input} />
              {isSignup ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--chain-400, #9fb3a6)", marginTop: 6 }}>At least 6 characters. No email needed — keep it somewhere safe.</div> : null}
            </div>
            {err ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#ff9d86" }}>{err}</div> : null}
            <button type="submit" disabled={busy} className="lg-btn" style={{ height: 48, borderRadius: "var(--radius-md, 10px)", border: "none", background: busy ? "var(--fairway-700, #1f5133)" : "var(--fairway-600, #2E6B45)", color: "#fff", cursor: busy ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 15, marginTop: 4 }}>
              {busy ? "One sec…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          {!isSignup ? (forgot ? (
            <div style={{ marginTop: 14, padding: 12, borderRadius: "var(--radius-md, 10px)", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.85)", marginBottom: 8 }}>Forgot your password? Enter the recovery email on your account and we’ll send a temporary one.</div>
              <input type="email" value={fEmail} onChange={function (e) { setFEmail(e.target.value); }} placeholder="recovery email" className="lg-input" style={input} />
              {fMsg ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "#ffd9a6", marginTop: 8, lineHeight: 1.4 }}>{fMsg}</div> : null}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" onClick={requestReset} disabled={busy} className="lg-btn" style={{ flex: 1, height: 42, borderRadius: "var(--radius-md, 10px)", border: "none", background: "var(--fairway-600, #2E7D4F)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>Send reset</button>
                <button type="button" onClick={function () { setForgot(false); setFMsg(""); }} style={{ height: 42, padding: "0 12px", background: "none", border: "1px solid rgba(255,255,255,.2)", borderRadius: "var(--radius-md, 10px)", color: "rgba(255,255,255,.7)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : <button type="button" onClick={function () { setForgot(true); }} style={{ marginTop: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.6)", textDecoration: "underline" }}>Forgot password?</button>) : null}
          <button onClick={function () { setMode(isSignup ? "signin" : "signup"); setErr(""); }} style={{ marginTop: 18, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--chain-300, #b9cabe)", textAlign: "center" }}>
            {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>

          {null}

          <div style={{ marginTop: 22, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "rgba(255,255,255,.34)", lineHeight: 1.5 }}>
            Your username is your login. Add a recovery email in Settings so you can reset your password.<br />Rounds, bag, friends and leagues sync to your account.
          </div>
        </div>
      </div>
    );
  }

  var DISCS = ["#E0467C", "#FF5A1F", "#F2A900", "#2FB67A", "#2A9D8F", "#2A6FDB", "#7C5CFF", "#C2410C", "#0EA5A5", "#D4456B", "#5BA978", "#8B5CF6"];

  function OnboardingView({ user, onDone }) {
    var [busy, setBusy] = React.useState(false);
    var mobile = (typeof window !== "undefined") && window.innerWidth < 760;
    var who = (window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || (user && user.username);
    var hasProfileEditor = !!(window.ProfileEditor && window.ChainsEngine && ChainsEngine.member && who && ChainsEngine.member(who));
    function finish() {
      setBusy(true);
      var p = (window.ChainsAuth && ChainsAuth.markOnboarded) ? ChainsAuth.markOnboarded() : Promise.resolve();
      p.then(function () { onDone && onDone(); }).catch(function () { onDone && onDone(); });
    }
    return (
      <div style={{ minHeight: "100vh", width: "100%", background: "var(--bg-page)", display: "flex", justifyContent: "center", padding: mobile ? "24px 14px 40px" : "44px 24px", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ChainsMark size={38} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".16em", fontSize: 10.5, color: "var(--ace-500, #FF5A1F)" }}>Welcome to Chains</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, color: "var(--text-strong)", lineHeight: 1.05 }}>Set up your player</div>
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5, marginTop: -6 }}>Pick your name, color, and avatar. You can change this look anytime in <b style={{ color: "var(--text-body)" }}>Settings</b>.</div>
          {hasProfileEditor ? React.createElement(window.ProfileEditor, { mobile: mobile }) : <SimpleProfile user={user} />}
          <button onClick={finish} disabled={busy} style={{ height: 50, borderRadius: "var(--radius-md, 10px)", border: "none", background: "var(--fairway-600, #2E6B45)", color: "#fff", cursor: busy ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 15 }}>{busy ? "Setting up…" : "Enter the app"}</button>
        </div>
      </div>
    );
  }

  // Fallback used only if the rich ProfileEditor can't load or this account isn't a league member yet.
  function SimpleProfile({ user }) {
    var seed = (user && user.username) || "";
    var [name, setName] = React.useState(seed ? seed.charAt(0).toUpperCase() + seed.slice(1) : "");
    var [disc, setDisc] = React.useState(DISCS[1]);
    var initials = (name || seed || "?").trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
    React.useEffect(function () { if (window.ChainsAuth && ChainsAuth.saveOnboarding) ChainsAuth.saveOnboarding({ displayName: (name.trim() || seed), disc: disc }); }, [name, disc]);
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: disc, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, boxShadow: "inset 0 0 0 3px rgba(255,255,255,.28)" }}>{initials}</span>
        </div>
        <input value={name} onChange={function (e) { setName(e.target.value); }} maxLength={16} placeholder="Your name or nickname" style={{ width: "100%", height: 44, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-surface)", fontFamily: "var(--font-sans)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {DISCS.map(function (c) { var on = c === disc; return <button key={c} onClick={function () { setDisc(c); }} style={{ height: 38, borderRadius: "50%", background: c, border: on ? "3px solid var(--text-strong)" : "3px solid transparent", cursor: "pointer" }}></button>; })}
        </div>
      </div>
    );
  }

  function AuthGate() {
    var [st, setSt] = React.useState({ phase: "loading", user: null });
    React.useEffect(function () {
      if (!window.ChainsAuth) { setSt({ phase: "unavailable" }); return; }
      var off = ChainsAuth.onChange(function (user, unavailable) {
        if (unavailable) { setSt({ phase: "unavailable" }); return; }
        if (!user) {
          // #36: a shared watch link must work for someone with NO account — give
          // them a silent viewer session (reuses the persisted anon session on
          // later visits, so this doesn't mint one per load).
          if (/watch=/.test(location.hash || "") && ChainsAuth.available && ChainsAuth.available() && ChainsAuth.signInAnonymouslyAs) {
            setSt({ phase: "loading", user: null });
            ChainsAuth.signInAnonymouslyAs("viewer").catch(function () { setSt({ phase: "login" }); });
            return;
          }
          // ANONYMOUS SESSIONS NO LONGER GRANT ACCESS. A leftover local identity
          // (from the old name-pick era) must NOT silently mint an anonymous
          // session and walk into the app — that's the bypass. If Firebase is
          // reachable, clear it and send them to a real login. Only fall back to
          // local-only when Firebase is genuinely unreachable.
          // v506: no fail-open. A leftover local identity never walks into the app.
          try { if (window.ChainsID && ChainsID.reset) ChainsID.reset(); } catch (e) {}
          setSt({ phase: "login" }); return;
        }
        // ANONYMOUS SESSIONS NO LONGER GRANT ACCESS: the only legitimate anonymous
        // session is a #watch= link viewer. Any other anonymous session (the ~119
        // stale sessions from the old name-pick era) is signed out back to login —
        // it must not walk past the gate or survive a sign-out.
        if (user.anon) {
          if (/watch=/.test(location.hash || "")) { setSt({ phase: "app", user: user }); return; }
          try { if (window.ChainsID) ChainsID.reset(); } catch (e) {}
          try { ChainsAuth.signOut(); } catch (e) {}
          setSt({ phase: "login" });
          return;
        }
        // Real account: load users/{uid}/profile FIRST — it decides whoami (memberId),
        // league access, and whether the forced password change gate applies.
        setSt({ phase: "loading", user: user });
        var pf = (ChainsAuth.fetchAccountProfile ? ChainsAuth.fetchAccountProfile() : Promise.resolve(null));
        pf.then(function () {
          if (ChainsAuth.mustChangePassword && ChainsAuth.mustChangePassword()) { setSt({ phase: "force", user: user }); return; }
          if (ChainsAuth.isOnboarded(user.uid)) { setSt({ phase: "app", user: user }); return; }
          ChainsAuth.fetchOnboarded(user.uid).then(function (done) { setSt({ phase: done ? "app" : "onboard", user: user }); });
        });
      });
      return off;
    }, []);
    if (st.phase === "loading") return <AuthSplash />;
    if (st.phase === "unavailable") return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center", background: "var(--bg-ink-deep, #0c1410)", color: "var(--bone-50, #f5f3ec)", fontFamily: "var(--font-sans)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22 }}>Can't reach Chains</div>
        <div style={{ fontSize: 14, opacity: .8, maxWidth: 300, lineHeight: 1.5 }}>Your phone couldn't connect to the Chains servers. Check your signal and try again.</div>
        <button onClick={function () { location.reload(); }} style={{ height: 46, padding: "0 22px", borderRadius: 10, border: "none", background: "var(--ace-500, #F26A1B)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14 }}>Try again</button>
      </div>
    );
    if (st.phase === "login") return <LoginView onEnter={function () { setSt({ phase: "app", user: null }); }} />;
    if (st.phase === "force" && window.ForcedPasswordChange) return React.createElement(window.ForcedPasswordChange, { user: st.user, onDone: function () { var u = st.user; setSt({ phase: (u && ChainsAuth.isOnboarded(u.uid)) ? "app" : "onboard", user: u }); } });
    if (st.phase === "onboard") return <OnboardingView user={st.user} onDone={function () { setSt({ phase: "app", user: st.user }); }} />;
    return React.createElement(window.ChainsApp);
  }

  window.OnboardingView = OnboardingView;

  window.LoginView = LoginView;
  window.AuthGate = AuthGate;
})();
