/* ============================================================
   CHAINS — account UI. window.ForcedPasswordChange, AccountPanel,
   NoLeagueView, AdminAccountTools, ChainsVersionCard
   The UI half of the accounts brief: forced first-login password
   change, Settings profile management, owner recovery console,
   and the no-league empty state. All auth work goes through
   window.ChainsAuth — nothing here touches passwords directly.
   ============================================================ */
(function () {
  /* v503 — notification preferences. users/{uid}/profile/notify = { email, sms, phone, at }.
     Email alerts use the recovery email; phone is optional and only stored if they opt in. */
  // v513: profile photo — take one or pick one, shrunk to a 128px JPEG so it's a few KB everywhere it shows.
  function PhotoRow(props) {
    var _s = React.useState(0), tick = _s[0], setTick = _s[1];
    var _b = React.useState(false), busy = _b[0], setBusy = _b[1];
    React.useEffect(function () { if (!window.ChainsFriends || !ChainsFriends.onChange) return; return ChainsFriends.onChange(function () { setTick(function (x) { return x + 1; }); }); }, []);
    var photo = window.ChainsFriends && ChainsFriends.photo ? ChainsFriends.photo() : null;
    var name = (window.ChainsFriends && ChainsFriends.myName) ? ChainsFriends.myName() : "You";
    function pick(e) {
      var f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return; setBusy(true);
      var img = new Image(); var url = URL.createObjectURL(f);
      img.onload = function () {
        try {
          var S = 128, c = document.createElement("canvas"); c.width = S; c.height = S; var x = c.getContext("2d");
          var w0 = img.naturalWidth, h0 = img.naturalHeight, side = Math.min(w0, h0); x.drawImage(img, (w0 - side) / 2, (h0 - side) / 2, side, side, 0, 0, S, S);
          var data = c.toDataURL("image/jpeg", 0.82);
          ChainsFriends.setPhoto(data).then(function (ok) { setBusy(false); if (window.ChainsToast) ChainsToast.show(ok ? "Photo saved — that's you everywhere now." : "Couldn't save the photo — try again.", ok ? "success" : "error"); });
        } catch (err) { setBusy(false); if (window.ChainsToast) ChainsToast.show("Couldn't read that image.", "error"); }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () { setBusy(false); URL.revokeObjectURL(url); if (window.ChainsToast) ChainsToast.show("Couldn't read that image.", "error"); };
      img.src = url;
    }
    var btn = { height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-strong)", display: "inline-flex", alignItems: "center", gap: 6 };
    return (
      <div style={props.row}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {photo ? <img src={photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 0 2px var(--bg-elevated), 0 0 0 4px var(--ace-500)" }} /> : <Avatar name={name} size={64} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={props.ht}>Profile photo</div>
            <div style={props.hs}>{photo ? "Shows next to your name, on cards and on the Takeover tiles." : "Take one or pick one — it shows next to your name everywhere."}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <label style={btn}>{busy ? "Saving…" : "📷 Take a photo"}<input type="file" accept="image/*" capture="user" onChange={pick} style={{ display: "none" }} /></label>
              <label style={btn}>Choose<input type="file" accept="image/*" onChange={pick} style={{ display: "none" }} /></label>
              {photo ? <button onClick={function () { ChainsFriends.setPhoto(null); }} style={Object.assign({}, btn, { color: "var(--text-muted)" })}>Remove</button> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
  function NotifyPrefs() {
    var [p, setP] = React.useState(null);
    var [phone, setPhone] = React.useState("");
    var [saved, setSaved] = React.useState("");
    React.useEffect(function () { try { ChainsAuth.fetchAccountProfile().then(function (prof) { var n = (prof && prof.notify) || {}; setP({ email: n.email !== false, sms: !!n.sms }); setPhone(n.phone || ""); }); } catch (e) { setP({ email: true, sms: false }); } }, []);
    function save(next, ph) {
      var f = window.ChainsFB; var u = ChainsAuth.current(); if (!f || !f.db || !u) return;
      var v = { email: !!next.email, sms: !!next.sms, phone: next.sms && ph ? String(ph).replace(/[^0-9+]/g, "").slice(0, 16) : null, at: Date.now() };
      f.db.ref("users/" + u.uid + "/profile/notify").set(v).then(function () { setSaved("Saved"); setTimeout(function () { setSaved(""); }, 1500); }).catch(function () { setSaved("Couldn\u2019t save"); });
    }
    if (!p) return null;
    var row = { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)" };
    var tog = function (on) { return { marginLeft: "auto", width: 44, height: 26, borderRadius: 13, border: "none", background: on ? "var(--fairway-500)" : "var(--bone-300, #d9d4c7)", position: "relative", cursor: "pointer", flexShrink: 0 }; };
    var knob = function (on) { return { position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }; };
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", marginBottom: 2 }}>Notifications <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-faint)" }}>{saved}</span></div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginBottom: 6 }}>Friend requests, cards you're put on, league news, password resets. In-app alerts always show in the bell.</div>
        <div style={row}><span>Email me</span><span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>uses your recovery email</span><button aria-label="Toggle email alerts" style={tog(p.email)} onClick={function () { var n = Object.assign({}, p, { email: !p.email }); setP(n); save(n, phone); }}><span style={knob(p.email)} /></button></div>
        <div style={row}><span>Text me</span><span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>optional</span><button aria-label="Toggle text alerts" style={tog(p.sms)} onClick={function () { var n = Object.assign({}, p, { sms: !p.sms }); setP(n); save(n, phone); }}><span style={knob(p.sms)} /></button></div>
        {p.sms ? <div style={{ display: "flex", gap: 8, paddingBottom: 8 }}><input type="tel" inputMode="tel" value={phone} onChange={function (e) { setPhone(e.target.value); }} placeholder="Mobile number" style={{ flex: 1, height: 40, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", color: "var(--text-strong)" }} /><button onClick={function () { save(p, phone); }} style={{ height: 40, padding: "0 14px", border: "none", borderRadius: "var(--radius-md)", background: "var(--ace-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13 }}>Save</button></div> : null}
      </div>
    );
  }

  var L = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-muted)", marginBottom: 6 };
  var I = { width: "100%", height: 44, padding: "0 13px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-strong)", fontFamily: "var(--font-sans)", fontSize: 14.5, outline: "none", boxSizing: "border-box" };
  var BTN = { height: 44, padding: "0 18px", borderRadius: "var(--radius-md, 10px)", border: "none", background: "var(--fairway-600, #2E6B45)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13.5 };
  var GHOST = { height: 38, padding: "0 14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12 };
  var ERR = { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--live-600, #c2410c)" };
  var OK = { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--fairway-700, #1f5133)" };
  function genTemp() {
    var words = ["chains", "hyzer", "anny", "flex", "spike", "birdie", "ace", "roller"];
    return words[Math.floor(Math.random() * words.length)] + Math.floor(1000 + Math.random() * 9000);
  }

  /* --- Forced password change: stands between sign-in and the app. --- */
  function ForcedPasswordChange(props) {
    var [pw1, setPw1] = React.useState("");
    var [pw2, setPw2] = React.useState("");
    var [cur, setCur] = React.useState("");
    var [needCur, setNeedCur] = React.useState(false);
    var [newU, setNewU] = React.useState("");
    var [email, setEmail] = React.useState("");
    var [err, setErr] = React.useState("");
    var [busy, setBusy] = React.useState(false);
    var uname = (props.user && props.user.username) || (window.ChainsAuth && ChainsAuth.current() && ChainsAuth.current().username) || "";
    function submit(e) {
      if (e && e.preventDefault) e.preventDefault();
      setErr("");
      if (pw1.length < 6) { setErr("Password must be at least 6 characters."); return; }
      if (pw1 === "chains1234") { setErr("Pick something other than the starter password."); return; }
      if (pw1 !== pw2) { setErr("Those don't match."); return; }
      setBusy(true);
      ChainsAuth.changePassword(needCur ? cur : null, pw1)
        .then(function () {
          var chain = Promise.resolve();
          var u = newU.trim().toLowerCase();
          if (u && u !== uname) chain = chain.then(function () { return ChainsAuth.changeUsername(u, pw1); }).catch(function (e2) { setErr("Password changed, but the username change failed: " + (e2 && e2.message || "try it later in Settings.")); });
          if (email.trim()) chain = chain.then(function () { return ChainsAuth.setRecoveryEmail(email.trim()); }).catch(function () {});
          return chain;
        })
        .then(function () { props.onDone && props.onDone(); })
        .catch(function (e2) {
          var c = (e2 && e2.code) || "";
          if (c === "auth/requires-recent-login") { setNeedCur(true); setErr("Confirm your current password to continue."); }
          else setErr(ChainsAuth.friendlyError(e2));
          setBusy(false);
        });
    }
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-ink-deep, #0c160f)", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px", boxSizing: "border-box" }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 15 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, color: "var(--bone-50, #f5f3ec)", lineHeight: 1.05 }}>Set your own password</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--chain-300, #b9cabe)", marginTop: 8, lineHeight: 1.5 }}>Hey {uname} — everyone changes the starter password on first login. At least 6 characters. This is the only required step.</div>
          </div>
          {needCur ? (
            <div><label style={Object.assign({}, L, { color: "var(--chain-400, #9fb3a6)" })}>Current password</label>
              <input type="password" value={cur} onChange={function (e) { setCur(e.target.value); }} style={I} autoComplete="current-password" /></div>
          ) : null}
          <div><label style={Object.assign({}, L, { color: "var(--chain-400, #9fb3a6)" })}>New password</label>
            <input type="password" value={pw1} onChange={function (e) { setPw1(e.target.value); }} placeholder="at least 6 characters" style={I} autoComplete="new-password" /></div>
          <div><label style={Object.assign({}, L, { color: "var(--chain-400, #9fb3a6)" })}>Confirm it</label>
            <input type="password" value={pw2} onChange={function (e) { setPw2(e.target.value); }} style={I} autoComplete="new-password" /></div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--chain-400, #9fb3a6)" }}>Optional — both fine to skip:</div>
            <div><label style={Object.assign({}, L, { color: "var(--chain-400, #9fb3a6)" })}>Pick a different username</label>
              <input value={newU} onChange={function (e) { setNewU(e.target.value); }} placeholder={"staying \u201C" + uname + "\u201D"} autoCapitalize="none" style={I} /></div>
            <div><label style={Object.assign({}, L, { color: "var(--chain-400, #9fb3a6)" })}>Email for password resets</label>
              <input type="email" value={email} onChange={function (e) { setEmail(e.target.value); }} placeholder="never required, never shared" style={I} /></div>
          </div>
          {err ? <div style={ERR}>{err}</div> : null}
          <button type="submit" disabled={busy} style={Object.assign({}, BTN, { height: 48, opacity: busy ? 0.7 : 1 })}>{busy ? "Saving\u2026" : "Save & enter the app"}</button>
        </form>
      </div>
    );
  }

  /* --- Settings: account management card. --- */
  function AccountPanel(props) {
    var C = window.ChainsAuth;
    var cu = C && C.available() && C.current();
    var [open, setOpen] = React.useState(null); // 'pw' | 'user' | 'email'
    var [f1, setF1] = React.useState(""); var [f2, setF2] = React.useState(""); var [f3, setF3] = React.useState("");
    var [msg, setMsg] = React.useState(null); // {ok, text}
    var [busy, setBusy] = React.useState(false);
    if (!cu || cu.anon) return null;
    var prof = (C.accountProfile && C.accountProfile()) || {};
    function switchTo(k) { setOpen(open === k ? null : k); setF1(""); setF2(""); setF3(""); setMsg(null); }
    function run(p, okText) {
      setBusy(true); setMsg(null);
      p.then(function () { setMsg({ ok: true, text: okText }); setBusy(false); setF1(""); setF2(""); setF3(""); })
        .catch(function (e) { setMsg({ ok: false, text: (window.ChainsAuth ? ChainsAuth.friendlyError(e) : (e && e.message)) || "Something went wrong." }); setBusy(false); });
    }
    var row = { display: "flex", flexDirection: "column", gap: 10, padding: "13px 0", borderTop: "1px solid var(--border-subtle)" };
    var head = { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: "none", border: "none", padding: 0, width: "100%", textAlign: "left" };
    var ht = { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 14, color: "var(--text-strong)" };
    var hs = { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 2 };
    return (
      <div style={{ background: "var(--bg-surface, #fff)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg, 14px)", padding: props.mobile ? 16 : 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 17, color: "var(--text-strong)" }}>Account</div>
            <div style={hs}>Signed in as <b style={{ color: "var(--text-body)" }}>{cu.username}</b>{prof.memberId ? " \u00b7 member: " + prof.memberId : ""}</div>
          </div>
          <button onClick={function () { ChainsConfirm.show({ title: "Sign out of Chains?", confirmLabel: "Sign out" }).then(function (ok) { if (ok) ChainsAuth.signOut(); }); }} style={GHOST}>Sign out</button>
        </div>
        <PhotoRow row={row} ht={ht} hs={hs} />
        <div style={row}>
          <button style={head} onClick={function () { switchTo("pw"); }}><span><span style={ht}>Change password</span><div style={hs}>Current password required.</div></span><span style={{ color: "var(--text-faint)" }}>{open === "pw" ? "\u2212" : "+"}</span></button>
          {open === "pw" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <input type="password" placeholder="Current password" value={f1} onChange={function (e) { setF1(e.target.value); }} style={I} autoComplete="current-password" />
              <input type="password" placeholder="New password (6+ characters)" value={f2} onChange={function (e) { setF2(e.target.value); }} style={I} autoComplete="new-password" />
              <input type="password" placeholder="Confirm new password" value={f3} onChange={function (e) { setF3(e.target.value); }} style={I} autoComplete="new-password" />
              <button disabled={busy} onClick={function () { if (f2 !== f3) { setMsg({ ok: false, text: "Those don't match." }); return; } run(ChainsAuth.changePassword(f1, f2), "Password changed."); }} style={BTN}>{busy ? "Saving\u2026" : "Update password"}</button>
            </div>
          ) : null}
        </div>
        <div style={row}>
          <button style={head} onClick={function () { switchTo("user"); }}><span><span style={ht}>Change username</span><div style={hs}>Your league history stays — only the login name changes.</div></span><span style={{ color: "var(--text-faint)" }}>{open === "user" ? "\u2212" : "+"}</span></button>
          {open === "user" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <input placeholder={"New username (now: " + cu.username + ")"} value={f1} onChange={function (e) { setF1(e.target.value); }} autoCapitalize="none" style={I} />
              <input type="password" placeholder="Confirm with your password" value={f2} onChange={function (e) { setF2(e.target.value); }} style={I} autoComplete="current-password" />
              <button disabled={busy} onClick={function () { run(ChainsAuth.changeUsername(f1, f2), "Username changed \u2014 use it next time you sign in."); }} style={BTN}>{busy ? "Saving\u2026" : "Change username"}</button>
            </div>
          ) : null}
        </div>
        <div style={row}>
          <button style={head} onClick={function () { switchTo("email"); }}><span><span style={ht}>Recovery email <span style={{ fontWeight: 600, fontSize: 10, color: "var(--text-faint)", letterSpacing: ".06em" }}>optional</span></span><div style={hs}>{prof.recoveryEmail ? prof.recoveryEmail : "Only for password resets. Never required, never shared."}</div></span><span style={{ color: "var(--text-faint)" }}>{open === "email" ? "\u2212" : "+"}</span></button>
          {open === "email" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <input type="email" placeholder="you@example.com (leave blank to remove)" value={f1} onChange={function (e) { setF1(e.target.value); }} style={I} />
              <button disabled={busy} onClick={function () { run(ChainsAuth.setRecoveryEmail(f1), f1.trim() ? "Recovery email saved." : "Recovery email removed."); }} style={BTN}>Save</button>
            </div>
          ) : null}
        </div>
        <NotifyPrefs />
        <div style={row}>
          <button style={head} onClick={function () { switchTo("delete"); }}><span><span style={Object.assign({}, ht, { color: "var(--score-over, #c23a33)" })}>Delete my account</span><div style={hs}>Removes your profile, trophies, friends and sign-in for good. Rounds you shared with others keep the scores under "Former player".</div></span><span style={{ color: "var(--text-faint)" }}>{open === "delete" ? "−" : "+"}</span></button>
          {open === "delete" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <input type="password" placeholder="Your password" value={f1} onChange={function (e) { setF1(e.target.value); }} style={I} autoComplete="current-password" />
              <input placeholder={"Type DELETE to confirm"} value={f2} onChange={function (e) { setF2(e.target.value); }} autoCapitalize="characters" style={I} />
              <button disabled={busy || f2 !== "DELETE"} onClick={function () { setBusy(true); ChainsAuth.deleteAccount(f1).then(function () { try { if (window.ChainsToast) ChainsToast.show("Your account is gone. Thanks for playing.", "success"); } catch (e) {} setTimeout(function () { try { location.reload(); } catch (e) {} }, 1200); }).catch(function (e) { setBusy(false); setMsg({ ok: false, text: ChainsAuth.friendlyError ? ChainsAuth.friendlyError(e) : String(e && e.message || e) }); }); }} style={Object.assign({}, BTN, { background: f2 === "DELETE" ? "var(--score-over, #c23a33)" : undefined })}>{busy ? "Deleting…" : "Delete my account"}</button>
            </div>
          ) : null}
        </div>
        {msg ? <div style={Object.assign({ marginTop: 10 }, msg.ok ? OK : ERR)}>{msg.text}</div> : null}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono, monospace)", fontSize: 10.5, color: "var(--text-faint)" }}>
          <span>Chains {window.CHAINS_VERSION || ""}</span>
          <span>Forgot it later? Use “Forgot password?” on the sign-in screen — it emails a temporary one to your recovery address.</span>
        </div>
      </div>
    );
  }

  /* --- Empty state for signed-in users with no league. --- */
  function NoLeagueView(props) {
    function go(v) { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: v })); } catch (e) {} }
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", padding: props.mobile ? "44px 8px" : "72px 0", textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{"\uD83E\uDD4F"}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, color: "var(--text-strong)", lineHeight: 1.05 }}>You're not in a league yet</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55, maxWidth: 340 }}>Leagues are private — you only see the ones you belong to. Start your own crew or join one with an invite code.</div>
        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={function () { go("createleague"); }} style={BTN}>Create a league</button>
          <button onClick={function () { go("myleagues"); }} style={Object.assign({}, GHOST, { height: 44 })}>Join with a code</button>
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>Go Throw, In the Bag, and Watch all work without a league.</div>
      </div>
    );
  }

  /* --- Owner console: member accounts, password resets, add member. --- */
  function AdminAccountTools() {
    var [rows, setRows] = React.useState(null);
    var [resetFor, setResetFor] = React.useState(null); // username row
    var [temp, setTemp] = React.useState("");
    var [issued, setIssued] = React.useState(null);     // {username, temp, key, status}
    var [adding, setAdding] = React.useState(false);
    var [nu, setNu] = React.useState(""); var [np, setNp] = React.useState(genTemp()); var [nm, setNm] = React.useState(""); var [nn, setNn] = React.useState("");
    var [inChains, setInChains] = React.useState(false);
    var [msg, setMsg] = React.useState(null);
    var [busy, setBusy] = React.useState(false);
    var fbOK = window.ChainsFB && ChainsFB.ok;
    React.useEffect(function () {
      if (!fbOK) { setRows([]); return; }
      ChainsFB.db.ref("usernames").get().then(function (s) {
        var v = s.val() || {};
        var list = Object.keys(v).sort().map(function (k) { return Object.assign({ username: k }, v[k] || {}) });
        // Per-account detail lives at users/{uid}/profile — self-readable only.
        // The owner tries; a rules denial degrades that column to "—".
        return Promise.all(list.map(function (r) {
          if (!r.uid) return r;
          return ChainsFB.db.ref("users/" + r.uid + "/profile").get()
            .then(function (ps) { var p = ps.val() || {}; return Object.assign({}, r, { changed: p.mustChangePassword === false, mustChange: p.mustChangePassword === true, lastLogin: p.lastLogin || null }); })
            .catch(function () { return r; });
        }));
      }).then(function (list) { setRows(list); }).catch(function () { setRows([]); });
    }, [fbOK]);
    React.useEffect(function () {
      if (!issued || !issued.key || !fbOK) return;
      var ref = ChainsFB.db.ref("admin/passwordResets/" + issued.key + "/status");
      var fn = function (s) { var v = s.val(); if (v) setIssued(function (p) { return p ? Object.assign({}, p, { status: v }) : p; }); };
      ref.on("value", fn);
      return function () { ref.off("value", fn); };
    }, [issued && issued.key]);
    var mono = { fontFamily: "var(--font-mono, monospace)" };
    function fmtLast(t) { if (!t) return "\u2014"; var d = Date.now() - t; if (d < 3600e3) return Math.max(1, Math.round(d / 60e3)) + "m ago"; if (d < 86400e3) return Math.round(d / 3600e3) + "h ago"; return Math.round(d / 86400e3) + "d ago"; }
    function doReset() {
      setBusy(true); setMsg(null);
      ChainsAuth.adminRequestReset(resetFor, temp).then(function (key) {
        setIssued({ username: resetFor.username, temp: temp, key: key, status: "pending" });
        setResetFor(null); setBusy(false);
      }).catch(function (e) { setMsg({ ok: false, text: (e && e.message) || "Couldn't queue the reset." }); setBusy(false); });
    }
    function doAdd() {
      setBusy(true); setMsg(null);
      ChainsAuth.adminCreateMember({ username: nu, password: np, memberId: nm.trim() || null, name: nn.trim() || null, leagues: inChains ? { "chains-dgpt-2026": true } : null })
        .then(function (r) { setMsg({ ok: true, text: "Account created: " + r.username + " / starter password " + np + " \u2014 they'll be made to change it on first login." }); setAdding(false); setNu(""); setNp(genTemp()); setNm(""); setNn(""); setBusy(false); })
        .catch(function (e) { setMsg({ ok: false, text: (e && e.message) || "Couldn't create the account." }); setBusy(false); });
    }
    var cell = { padding: "9px 10px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", borderTop: "1px solid var(--border-subtle)", textAlign: "left" };
    return (
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong, #1a2b20)" }}>Member accounts</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", maxWidth: 560, lineHeight: 1.5 }}>Passwords can't be looked up — only reset. That's deliberate: it means nobody, including you, can read someone's password.</div>
          </div>
          <button onClick={function () { setAdding(!adding); setMsg(null); }} style={GHOST}>{adding ? "Cancel" : "+ Add a member"}</button>
        </div>
        {adding ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: 14, border: "1px solid var(--border-subtle)", borderRadius: 10, background: "var(--bg-elevated)", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="username (login)" value={nu} onChange={function (e) { setNu(e.target.value); }} autoCapitalize="none" style={Object.assign({}, I, { flex: "1 1 140px" })} />
              <input placeholder="starter password" value={np} onChange={function (e) { setNp(e.target.value); }} style={Object.assign({}, I, { flex: "1 1 140px" })} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input placeholder="display name (optional)" value={nn} onChange={function (e) { setNn(e.target.value); }} style={Object.assign({}, I, { flex: "1 1 140px" })} />
              <input placeholder="member id link (optional)" value={nm} onChange={function (e) { setNm(e.target.value); }} autoCapitalize="none" style={Object.assign({}, I, { flex: "1 1 140px" })} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", cursor: "pointer" }}>
              <input type="checkbox" checked={inChains} onChange={function (e) { setInChains(e.target.checked); }} /> Add to the Chains league (leave off for outside testers)
            </label>
            <button disabled={busy} onClick={doAdd} style={BTN}>{busy ? "Creating\u2026" : "Create account"}</button>
          </div>
        ) : null}
        {issued ? (
          <div style={{ padding: "12px 14px", border: "1px solid var(--gold-400, #e0c66a)", background: "var(--gold-50, #fbf6e9)", borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", lineHeight: 1.55 }}>
              Temporary password for <b>{issued.username}</b>: <b style={mono}>{issued.temp}</b> — shown once, pass it along yourself. Status: <b>{issued.status}</b>{issued.status === "pending" ? " (the backend applies it, usually within a few minutes)" : ""}. They'll be forced to change it at next login.
            </div>
            <button onClick={function () { setIssued(null); }} style={Object.assign({}, GHOST, { marginTop: 8, height: 32, fontSize: 11 })}>Dismiss</button>
          </div>
        ) : null}
        {msg ? <div style={Object.assign({ marginBottom: 10 }, msg.ok ? OK : ERR)}>{msg.text}</div> : null}
        {rows == null ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>Loading accounts…</div> : (
          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 10, overflow: "auto", background: "var(--bg-surface, #fff)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead><tr>{["Username", "Name", "Member", "Starter pw changed", "Last sign-in", ""].map(function (h, i) { return <th key={i} style={{ padding: "8px 10px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--text-muted)", textAlign: "left" }}>{h}</th>; })}</tr></thead>
              <tbody>
                {rows.map(function (r) {
                  return (
                    <tr key={r.username}>
                      <td style={Object.assign({}, cell, mono)}>{r.username}</td>
                      <td style={cell}>{r.name || "\u2014"}</td>
                      <td style={Object.assign({}, cell, mono)}>{r.memberId || "\u2014"}</td>
                      <td style={cell}>{r.changed === true ? "\u2713 yes" : r.mustChange === true ? "not yet" : "\u2014"}</td>
                      <td style={cell}>{fmtLast(r.lastLogin)}</td>
                      <td style={Object.assign({}, cell, { textAlign: "right" })}><button onClick={function () { setResetFor(r); setTemp(genTemp()); setMsg(null); }} style={Object.assign({}, GHOST, { height: 30, fontSize: 10.5 })}>Reset password</button></td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? <tr><td style={cell} colSpan={6}>No accounts found (or this device can't read the directory).</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
        {resetFor ? (
          <div style={{ marginTop: 12, padding: 14, border: "1px solid var(--border-default)", borderRadius: 10, background: "var(--bg-elevated)", display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>Reset {resetFor.username}'s password</div>
            <input value={temp} onChange={function (e) { setTemp(e.target.value); }} style={Object.assign({}, I, mono)} />
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>This queues the reset (applied by the backend), marks the account must-change-on-next-login, and shows the temp password once. It is never stored in the clear anywhere else.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={doReset} style={BTN}>{busy ? "Queuing\u2026" : "Reset & show once"}</button>
              <button onClick={function () { setResetFor(null); }} style={Object.assign({}, GHOST, { height: 44 })}>Cancel</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  window.ForcedPasswordChange = ForcedPasswordChange;
  window.AccountPanel = AccountPanel;
  window.NoLeagueView = NoLeagueView;
  window.AdminAccountTools = AdminAccountTools;
})();
