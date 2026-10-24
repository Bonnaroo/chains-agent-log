/* ============================================================
   CHAINS — in-app Owner Admin. window.AdminConsole
   ONE admin codebase (this file). Reads the chains-app backend
   via window.ChainsFB. Owner-gated on admins/{uid}===true (with
   the owner-uid fallback). Lazy-mounted: only rendered when the
   owner opens Settings → Owner Tools, so normal players never
   load it. Plain control-panel styling, responsive for phone.
   ============================================================ */
(function () {
  var OWNER_UID = "wp1ywNFroiZzCOUqvezfuJYYAYd2";
  function db() { return (window.ChainsFB && window.ChainsFB.ok) ? window.ChainsFB.db : null; }

  var C = {
    bg: "#0f1714", panel: "#16221d", panel2: "#1d2c25", line: "#2a3a32", line2: "#34473d",
    ink: "#eef3f0", muted: "#9fb3a6", faint: "#6f8275", accent: "#FF5A1F", green: "#3fae73", red: "#e0594f", gold: "#d7a93a",
    mono: "var(--font-mono, ui-monospace, Menlo, monospace)", disp: "var(--font-display, system-ui)", sans: "var(--font-sans, system-ui)"
  };
  var fmtTime = function (ms) { if (!ms) return "—"; try { return new Date(ms).toLocaleString(); } catch (e) { return "—"; } };
  var fmtAgo = function (ms) { if (!ms) return "—"; var s = (Date.now() - ms) / 1000; if (s < 60) return Math.round(s) + "s"; if (s < 3600) return Math.round(s / 60) + "m"; if (s < 86400) return Math.round(s / 3600) + "h"; return Math.round(s / 86400) + "d"; };

  function useDbValue(path, dep) {
    var ref = React.useState(undefined), val = ref[0], setVal = ref[1];
    React.useEffect(function () {
      var d = db(); if (!d) { setVal(null); return; }
      var r = d.ref(path);
      var cb = r.on("value", function (s) { setVal(s.val() || {}); }, function () { setVal(null); });
      return function () { r.off("value", cb); };
    }, [path, dep]);
    return val;
  }

  function Badge(p) {
    var map = { test: ["#3a2f12", C.gold], real: ["#13301f", C.green], red: ["#3a1714", C.red], muted: ["#202d27", C.muted] };
    var c = map[p.tone] || map.muted;
    return React.createElement("span", { style: { display: "inline-block", padding: "2px 8px", borderRadius: 99, fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, fontWeight: 700, background: c[0], color: c[1] } }, p.children);
  }
  var btnGhost = { height: 28, padding: "0 10px", marginLeft: 6, border: "1px solid " + C.line2, borderRadius: 6, background: "transparent", color: C.ink, cursor: "pointer", fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", fontSize: 10.5 };
  function Tab(p) { return React.createElement("button", { onClick: p.onClick, style: { height: 32, padding: "0 13px", border: "1px solid " + (p.on ? C.accent : C.line2), borderRadius: 7, background: p.on ? C.accent : "transparent", color: p.on ? "#fff" : C.muted, cursor: "pointer", fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", fontSize: 11.5, whiteSpace: "nowrap" } }, p.children); }
  function H(p) { return React.createElement("div", { style: { marginBottom: 16 } }, React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 22, color: C.ink } }, p.title), React.createElement("div", { style: { color: C.muted, fontSize: 13 } }, p.sub)); }
  function Loading() { return React.createElement("div", { style: { color: C.muted, padding: 30, fontSize: 14 } }, "Loading…"); }
  function Empty(p) { return React.createElement("div", { style: { border: "1px dashed " + C.line2, borderRadius: 10, padding: 24, color: C.faint, fontSize: 13.5, textAlign: "center", lineHeight: 1.5 } }, p.msg); }
  function Field(p) { return React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid " + C.line, fontSize: 13 } }, React.createElement("span", { style: { color: C.muted } }, p.k), React.createElement("span", { style: { fontFamily: p.mono ? C.mono : C.sans, color: C.ink, textAlign: "right", wordBreak: "break-all" } }, p.v || "—")); }

  function copyText(txt) { try { (window.ChainsCopy ? ChainsCopy(txt) : Promise.resolve()).catch(function () {}); } catch (e) {} try { window.dispatchEvent(new CustomEvent("chains:admintoast", { detail: "Copied to clipboard" })); } catch (e) {} }
  function toast(msg) { try { window.dispatchEvent(new CustomEvent("chains:admintoast", { detail: msg })); } catch (e) {} }
  var btnSolid = { height: 30, padding: "0 12px", border: "none", borderRadius: 6, background: C.green, color: "#fff", cursor: "pointer", fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", fontSize: 11 };
  var inputStyle = { height: 36, padding: "0 11px", borderRadius: 7, border: "1px solid " + C.line2, background: C.panel, color: C.ink, fontFamily: C.sans, fontSize: 13, outline: "none" };
  function TextInput(p) { return React.createElement("input", { value: p.value, onChange: function (e) { p.onChange(e.target.value); }, placeholder: p.placeholder, style: Object.assign({}, inputStyle, p.style || {}) }); }
  function Select(p) { return React.createElement("select", { value: p.value, onChange: function (e) { p.onChange(e.target.value); }, style: Object.assign({}, inputStyle, { cursor: "pointer" }, p.style || {}) }, (p.options || []).map(function (o) { return React.createElement("option", { key: o, value: o }, o); })); }
  function ToastHost() {
    var s = React.useState(null), msg = s[0], setMsg = s[1];
    React.useEffect(function () { var h = function (e) { setMsg(e.detail); window.clearTimeout(h._t); h._t = window.setTimeout(function () { setMsg(null); }, 1900); }; window.addEventListener("chains:admintoast", h); return function () { window.removeEventListener("chains:admintoast", h); }; }, []);
    if (!msg) return null;
    return React.createElement("div", { style: { position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: C.ink, color: C.bg, padding: "10px 18px", borderRadius: 8, fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12.5, zIndex: 5000, boxShadow: "0 6px 20px rgba(0,0,0,.4)" } }, msg);
  }
  function JsonBlock(p) { return React.createElement("pre", { style: { margin: "8px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: C.mono, fontSize: 11, color: C.muted, background: C.bg, border: "1px solid " + C.line, borderRadius: 8, padding: 12, maxHeight: 300, overflow: "auto" } }, p.text); }
  function Scroll(p) { return React.createElement("div", { style: { border: "1px solid " + C.line, borderRadius: 10, overflowX: "auto" } }, p.children); }
  var th = { textAlign: "left", fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: C.muted, fontWeight: 600, padding: "9px 12px", borderBottom: "1px solid " + C.line2, whiteSpace: "nowrap" };
  var td = { padding: "9px 12px", borderBottom: "1px solid " + C.line, color: C.ink, verticalAlign: "top" };

  function Dashboard(p) {
    var users = useDbValue("users"), leagues = useDbValue("leagues"), errs = useDbValue("diagnostics/errors"), reqs = useDbValue("requests");
    var ping = React.useState("checking"); var pv = ping[0], setPing = ping[1];
    React.useEffect(function () { var d = db(); if (!d) { setPing("down"); return; } var r = d.ref(".info/connected"); var cb = r.on("value", function (s) { setPing(s.val() ? "up" : "down"); }); return function () { r.off("value", cb); }; }, []);
    var uCount = users ? Object.keys(users).length : 0;
    var all = leagues ? Object.keys(leagues).map(function (k) { return leagues[k]; }) : [];
    var real = all.filter(function (l) { return (l.env || "real") === "real"; }).length;
    var test = all.filter(function (l) { return l.env === "test"; }).length;
    var errToday = errs ? Object.keys(errs).map(function (k) { return errs[k]; }).filter(function (e) { return (e.ts || 0) > Date.now() - 86400000; }).length : 0;
    var openReq = reqs ? Object.keys(reqs).map(function (k) { return reqs[k]; }).filter(function (r) { return r && r.status === "open"; }).length : 0;
    function Tile(o) { return React.createElement("div", { onClick: o.onClick, style: { flex: "1 1 130px", border: "1px solid " + C.line, borderRadius: 10, padding: "14px 16px", background: C.panel, cursor: o.onClick ? "pointer" : "default" } }, React.createElement("div", { style: { fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: C.muted } }, o.label), React.createElement("div", { style: { fontFamily: C.mono, fontWeight: 700, fontSize: 23, color: o.tone || C.ink, marginTop: 4 } }, o.value)); }
    return React.createElement("div", null,
      React.createElement(H, { title: "Dashboard", sub: "System at a glance" }),
      React.createElement("div", { style: { display: "flex", gap: 11, flexWrap: "wrap" } },
        React.createElement(Tile, { label: "Firebase", value: pv === "up" ? "● online" : pv === "down" ? "● offline" : "…", tone: pv === "up" ? C.green : C.red }),
        React.createElement(Tile, { label: "Accounts", value: uCount, onClick: function () { p.go("accounts"); } }),
        React.createElement(Tile, { label: "Real leagues", value: real, onClick: function () { p.go("leagues"); } }),
        React.createElement(Tile, { label: "Test leagues", value: test, tone: C.gold, onClick: function () { p.go("leagues"); } }),
        React.createElement(Tile, { label: "Errors 24h", value: errToday, tone: errToday ? C.red : C.ink, onClick: function () { p.go("diagnostics"); } }),
        React.createElement(Tile, { label: "Open requests", value: openReq, tone: openReq ? C.accent : C.ink, onClick: function () { p.go("requests"); } })
      ),
      React.createElement("div", { style: { marginTop: 16, color: C.faint, fontSize: 12.5, lineHeight: 1.6 } }, "Reads the live chains-app backend. Leagues populate once league storage moves to Firebase (Phase 2).")
    );
  }

  function Accounts() {
    var users = useDbValue("users"), leagues = useDbValue("leagues");
    var s = React.useState(null), sel = s[0], setSel = s[1];
    var q = React.useState(""), query = q[0], setQuery = q[1];
    var so = React.useState("created"), sort = so[0], setSort = so[1];
    if (users === undefined) return React.createElement(Loading);
    var rows = Object.keys(users || {}).map(function (uid) { return Object.assign({ uid: uid }, users[uid]); });
    var ql = query.trim().toLowerCase();
    if (ql) rows = rows.filter(function (r) { return (String(r.username || "") + " " + String(r.displayName || "") + " " + r.uid).toLowerCase().indexOf(ql) >= 0; });
    var lc = function (uid) { return Object.keys(leagues || {}).map(function (k) { return leagues[k]; }).filter(function (l) { return l && l.members && l.members[uid]; }).length; };
    rows.sort(function (a, b) { return sort === "username" ? String(a.username || "").localeCompare(String(b.username || "")) : sort === "leagues" ? lc(b.uid) - lc(a.uid) : (b.createdAt || 0) - (a.createdAt || 0); });
    return React.createElement("div", null,
      React.createElement(H, { title: "Accounts", sub: rows.length + " account" + (rows.length === 1 ? "" : "s") }),
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" } },
        React.createElement(TextInput, { value: query, onChange: setQuery, placeholder: "Search username / name / uid", style: { flex: "1 1 220px" } }),
        React.createElement(Select, { value: sort, onChange: setSort, options: ["created", "username", "leagues"] })
      ),
      rows.length === 0 ? React.createElement(Empty, { msg: ql ? "No accounts match." : "No accounts yet. They appear here as people sign up." }) :
        React.createElement(Scroll, null, React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 } },
          React.createElement("thead", null, React.createElement("tr", null, ["Username", "Display name", "Leagues", "Created", "uid", ""].map(function (h, i) { return React.createElement("th", { key: i, style: th }, h); }))),
          React.createElement("tbody", null, rows.map(function (r) {
            return React.createElement("tr", { key: r.uid, style: { cursor: "pointer" } },
              React.createElement("td", { style: Object.assign({}, td, { fontWeight: 700 }), onClick: function () { setSel(r); } }, r.username || "—", (r.uid === OWNER_UID ? React.createElement("span", { style: { marginLeft: 6 } }, React.createElement(Badge, { tone: "real" }, "Owner")) : null)),
              React.createElement("td", { style: td, onClick: function () { setSel(r); } }, r.displayName || "—"),
              React.createElement("td", { style: Object.assign({}, td, { fontFamily: C.mono }), onClick: function () { setSel(r); } }, lc(r.uid)),
              React.createElement("td", { style: Object.assign({}, td, { color: C.muted, whiteSpace: "nowrap" }), onClick: function () { setSel(r); } }, fmtTime(r.createdAt)),
              React.createElement("td", { style: Object.assign({}, td, { fontFamily: C.mono, color: C.faint, fontSize: 11 }), onClick: function () { setSel(r); } }, String(r.uid).slice(0, 10) + "…"),
              React.createElement("td", { style: Object.assign({}, td, { textAlign: "right", whiteSpace: "nowrap" }) }, React.createElement("button", { onClick: function () { copyText(JSON.stringify(r, null, 2)); }, style: btnGhost }, "Copy JSON")));
          }))
        )),
      sel ? React.createElement(UserDrawer, { user: sel, leagues: leagues, onClose: function () { setSel(null); } }) : null
    );
  }

  function UserDrawer(p) {
    var mine = Object.keys(p.leagues || {}).map(function (id) { return Object.assign({ id: id }, p.leagues[id]); }).filter(function (l) { return l.members && l.members[p.user.uid]; });
    var nm = React.useState(p.user.displayName || ""), name = nm[0], setName = nm[1];
    var dc = React.useState(p.user.disc || "#5BA978"), disc = dc[0], setDisc = dc[1];
    var DISCS = ["#E0467C", "#FF5A1F", "#F2A900", "#2FB67A", "#2A9D8F", "#2A6FDB", "#7C5CFF", "#C2410C"];
    function save() { var d = db(); if (!d) return; d.ref("users/" + p.user.uid).update({ displayName: name.trim() || p.user.username, disc: disc, updatedAt: Date.now() }).then(function () { toast("Profile saved"); }).catch(function () { toast("Save failed"); }); }
    function del() { ChainsConfirm.show({ title: "Delete account record?", message: "Deletes users/" + p.user.uid + ". This does NOT remove their auth login — do that in the Firebase console.", confirmLabel: "Delete record", danger: true }).then(function (ok) { if (!ok) return; db().ref("users/" + p.user.uid).remove().then(function () { toast("Record deleted"); p.onClose(); }); }); }
    return React.createElement(Drawer, { onClose: p.onClose, title: p.user.displayName || p.user.username },
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12 } }, React.createElement("button", { onClick: function () { copyText(JSON.stringify(Object.assign({ uid: p.user.uid }, p.user), null, 2)); }, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, "Copy account JSON")),
      React.createElement(Field, { k: "Username", v: p.user.username }),
      React.createElement(Field, { k: "uid", v: p.user.uid, mono: true }),
      React.createElement(Field, { k: "Created", v: fmtTime(p.user.createdAt) }),
      React.createElement(Field, { k: "Onboarded", v: p.user.onboarded ? "yes" : "no" }),
      React.createElement("div", { style: { marginTop: 14, fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: C.muted, marginBottom: 8 } }, "Edit profile"),
      React.createElement(TextInput, { value: name, onChange: setName, placeholder: "Display name", style: { width: "100%", marginBottom: 10 } }),
      React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 } }, DISCS.map(function (c) { return React.createElement("button", { key: c, onClick: function () { setDisc(c); }, style: { width: 30, height: 30, borderRadius: "50%", background: c, border: c === disc ? "3px solid " + C.ink : "3px solid transparent", cursor: "pointer" } }); })),
      React.createElement("div", { style: { display: "flex", gap: 8 } }, React.createElement("button", { onClick: save, style: btnSolid }, "Save"), React.createElement("button", { onClick: del, style: Object.assign({}, btnGhost, { marginLeft: 0, color: C.red, borderColor: C.red }) }, "Delete record")),
      React.createElement("div", { style: { marginTop: 16, fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: C.muted, marginBottom: 6 } }, "Leagues (" + mine.length + ")"),
      mine.length === 0 ? React.createElement("div", { style: { color: C.faint, fontSize: 13 } }, "No leagues.") :
        mine.map(function (l) { return React.createElement("div", { key: l.id, style: { padding: "7px 0", borderTop: "1px solid " + C.line, fontSize: 13 } }, (l.name || l.id), React.createElement("span", { style: { color: C.faint } }, " · " + (l.type || "?") + " · " + ((l.members[p.user.uid] && l.members[p.user.uid].role) || "member"))); }),
      React.createElement("div", { style: { marginTop: 16, fontSize: 12, color: C.faint } }, "Password reset / auth-login deletion is done in the Firebase console — never exposed here.")
    );
  }

  function Leagues() {
    var leagues = useDbValue("leagues");
    var f = React.useState("all"), filter = f[0], setFilter = f[1];
    var ty = React.useState("all type"), tFilter = ty[0], setTFilter = ty[1];
    var stt = React.useState("all status"), sFilter = stt[0], setSFilter = stt[1];
    var q = React.useState(""), query = q[0], setQuery = q[1];
    var ins = React.useState(null), inspect = ins[0], setInspect = ins[1];
    if (leagues === undefined) return React.createElement(Loading);
    var rows = Object.keys(leagues || {}).map(function (id) { return Object.assign({ id: id }, leagues[id]); });
    var testCount = rows.filter(function (l) { return l.env === "test"; }).length;
    var shown = rows.filter(function (l) { return filter === "all" || (l.env || "real") === filter; });
    if (tFilter !== "all type") shown = shown.filter(function (l) { return (l.type || "") === tFilter; });
    if (sFilter !== "all status") shown = shown.filter(function (l) { return (l.status || "active") === sFilter; });
    var ql = query.trim().toLowerCase();
    if (ql) shown = shown.filter(function (l) { return (String(l.name || "") + " " + l.id).toLowerCase().indexOf(ql) >= 0; });
    shown.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    function del(id) { ChainsConfirm.show({ title: "Delete league " + id + "?", message: "This removes it for everyone.", confirmLabel: "Delete", danger: true }).then(function (ok) { if (ok) { db().ref("leagues/" + id).remove(); toast("League deleted"); } }); }
    function flip(l) { db().ref("leagues/" + l.id + "/env").set((l.env || "real") === "test" ? "real" : "test"); toast("Env flipped"); }
    function purge() { var t = Object.keys(leagues || {}).filter(function (id) { return leagues[id] && leagues[id].env === "test"; }); if (!t.length) return; ChainsConfirm.show({ title: "Purge ALL " + t.length + " test leagues?", message: "Real leagues are kept.", confirmLabel: "Purge", danger: true }).then(function (ok) { if (ok) { t.forEach(function (id) { db().ref("leagues/" + id).remove(); }); toast("Test leagues purged"); } }); }
    return React.createElement("div", null,
      React.createElement(H, { title: "Leagues", sub: Object.keys(leagues || {}).length + " total · " + testCount + " test" }),
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" } },
        React.createElement(TextInput, { value: query, onChange: setQuery, placeholder: "Search name / id", style: { flex: "1 1 180px" } }),
        React.createElement(Select, { value: filter, onChange: setFilter, options: ["all", "real", "test"] }),
        React.createElement(Select, { value: tFilter, onChange: setTFilter, options: ["all type", "classic", "bracket", "season", "challenge"] }),
        React.createElement(Select, { value: sFilter, onChange: setSFilter, options: ["all status", "active", "finished"] }),
        testCount > 0 ? React.createElement("button", { onClick: purge, style: { marginLeft: "auto", height: 36, padding: "0 12px", border: "1px solid " + C.red, borderRadius: 7, background: "transparent", color: C.red, cursor: "pointer", fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", fontSize: 11 } }, "Purge all test (" + testCount + ")") : null
      ),
      Object.keys(leagues || {}).length === 0 ? React.createElement(Empty, { msg: "No cloud leagues yet — these populate once league storage moves to Firebase (Phase 2). Local test leagues won't show here." }) :
        shown.length === 0 ? React.createElement(Empty, { msg: "None match." }) :
          React.createElement(Scroll, null, React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 } },
            React.createElement("thead", null, React.createElement("tr", null, ["Name", "Type", "Members", "Status", "Env", "Created", ""].map(function (h, i) { return React.createElement("th", { key: i, style: th }, h); }))),
            React.createElement("tbody", null, shown.map(function (l) {
              return React.createElement("tr", { key: l.id },
                React.createElement("td", { style: Object.assign({}, td, { fontWeight: 700, cursor: "pointer" }), onClick: function () { setInspect(l.id); } }, (l.name || "—"), React.createElement("div", { style: { fontFamily: C.mono, color: C.faint, fontSize: 11 } }, l.id)),
                React.createElement("td", { style: td }, (l.type || "—"), l.timing ? React.createElement("span", { style: { color: C.faint } }, " · " + l.timing) : null),
                React.createElement("td", { style: Object.assign({}, td, { fontFamily: C.mono }) }, l.members ? Object.keys(l.members).length : 0),
                React.createElement("td", { style: td }, React.createElement(Badge, { tone: (l.status || "active") === "finished" ? "muted" : "real" }, l.status || "active")),
                React.createElement("td", { style: td }, React.createElement(Badge, { tone: (l.env || "real") === "test" ? "test" : "real" }, l.env || "real")),
                React.createElement("td", { style: Object.assign({}, td, { color: C.muted, whiteSpace: "nowrap" }) }, fmtTime(l.createdAt)),
                React.createElement("td", { style: Object.assign({}, td, { whiteSpace: "nowrap", textAlign: "right" }) },
                  React.createElement("button", { onClick: function () { setInspect(l.id); }, style: btnGhost }, "Inspect"),
                  React.createElement("button", { onClick: function () { flip(l); }, style: btnGhost }, (l.env || "real") === "test" ? "→ real" : "→ test"),
                  React.createElement("button", { onClick: function () { del(l.id); }, style: Object.assign({}, btnGhost, { color: C.red, borderColor: C.red }) }, "Delete")));
            }))
          )),
      inspect ? React.createElement(LeagueInspector, { league: Object.assign({ id: inspect }, leagues[inspect]), onClose: function () { setInspect(null); } }) : null
    );
  }

  function LeagueInspector(p) {
    var l = p.league;
    var showJson = React.useState(false), sj = showJson[0], setSj = showJson[1];
    var members = l.members ? Object.keys(l.members) : [];
    var picks = l.picks || {};
    var tourneys = Object.keys(picks).sort(function (a, b) { return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); });
    var nameOf = function (uid) { return (l.members && l.members[uid] && l.members[uid].displayName) || uid; };
    return React.createElement(Drawer, { onClose: p.onClose, title: l.name || l.id, wide: true },
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" } },
        React.createElement("button", { onClick: function () { copyText(l.id); }, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, "Copy league ID"),
        React.createElement("button", { onClick: function () { copyText(JSON.stringify(l, null, 2)); }, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, "Copy full league JSON"),
        React.createElement("button", { onClick: function () { setSj(!sj); }, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, sj ? "Hide raw JSON" : "Show raw JSON")
      ),
      React.createElement(Field, { k: "id", v: l.id, mono: true }),
      React.createElement(Field, { k: "Type", v: (l.type || "—") + (l.timing ? " · " + l.timing : "") }),
      React.createElement(Field, { k: "Env", v: l.env || "real" }),
      React.createElement(Field, { k: "Status", v: l.status || "active" }),
      React.createElement(Field, { k: "Owner", v: l.ownerUid, mono: true }),
      React.createElement(Field, { k: "Created", v: fmtTime(l.createdAt) }),
      sj ? React.createElement(JsonBlock, { text: JSON.stringify(l, null, 2) }) : null,
      React.createElement("div", { style: { marginTop: 16, fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: C.muted, marginBottom: 6 } }, "Members (" + members.length + ")"),
      members.length === 0 ? React.createElement("div", { style: { color: C.faint, fontSize: 13 } }, "No members.") :
        members.map(function (uid) { var m = l.members[uid]; return React.createElement("div", { key: uid, style: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid " + C.line, fontSize: 13 } }, React.createElement("span", null, (m && m.displayName) || "—", React.createElement("span", { style: { color: C.faint } }, " · " + ((m && m.role) || "member"))), React.createElement("span", { style: { fontFamily: C.mono, color: C.faint, fontSize: 11 } }, String(uid).slice(0, 8) + "…")); }),
      React.createElement("div", { style: { marginTop: 16, fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: C.muted, marginBottom: 6 } }, "Picks by tournament"),
      tourneys.length === 0 ? React.createElement("div", { style: { color: C.faint, fontSize: 13 } }, "No picks recorded.") :
        React.createElement("div", { style: { overflowX: "auto" } }, tourneys.map(function (t) {
          return React.createElement("div", { key: t, style: { marginBottom: 10 } },
            React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 700, fontSize: 12, color: C.ink, marginBottom: 4 } }, "T" + t),
            Object.keys(picks[t] || {}).map(function (uid) { return React.createElement("div", { key: uid, style: { fontSize: 12.5, color: C.muted, padding: "2px 0" } }, nameOf(uid) + ": " + (Array.isArray(picks[t][uid]) ? picks[t][uid].join(", ") : JSON.stringify(picks[t][uid]))); }));
        })),
      React.createElement("div", { style: { marginTop: 16 } }, React.createElement("button", { onClick: function () { ChainsConfirm.show({ title: "Delete league " + l.id + "?", confirmLabel: "Delete", danger: true }).then(function (ok) { if (ok) { db().ref("leagues/" + l.id).remove(); toast("Deleted"); p.onClose(); } }); }, style: Object.assign({}, btnGhost, { marginLeft: 0, color: C.red, borderColor: C.red }) }, "Delete league"))
    );
  }

  function Diagnostics() {
    var errs = useDbValue("diagnostics/errors");
    var leagues = useDbValue("leagues");
    var users = useDbValue("users");
    var au = React.useState(null), audit = au[0], setAudit = au[1];
    if (errs === undefined) return React.createElement(Loading);
    var rows = Object.keys(errs || {}).map(function (id) { return Object.assign({ id: id }, errs[id]); }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 200);
    function copy(r) { copyText("Chains error\nWhen: " + fmtTime(r.ts) + "\nUser: " + (r.username || "?") + " (" + (r.uid || "—") + ")\nScreen: " + (r.screen || "?") + "\nVersion: " + (r.appVersion || "?") + "\nMessage: " + (r.message || "") + "\nStack:\n" + (r.stack || "")); }
    function copyAll() { copyText(rows.map(function (r) { return fmtTime(r.ts) + " [" + (r.screen || "?") + "] " + (r.message || ""); }).join("\n")); }
    function clearAll() { ChainsConfirm.show({ title: "Clear the error log?", confirmLabel: "Clear", danger: true }).then(function (ok) { if (ok) { db().ref("diagnostics/errors").remove(); toast("Log cleared"); } }); }
    function runAudit() {
      var problems = [];
      var L = leagues || {}, U = users || {};
      Object.keys(L).forEach(function (id) {
        var l = L[id];
        if (!l.name) problems.push("League " + id + ": missing name");
        if (!l.type) problems.push("League " + id + ": missing type");
        var members = l.members ? Object.keys(l.members) : [];
        members.forEach(function (uid) { if (!U[uid]) problems.push("League " + id + ": member " + uid.slice(0, 8) + "… has no user record"); });
        var picks = l.picks || {};
        Object.keys(picks).forEach(function (t) { Object.keys(picks[t] || {}).forEach(function (uid) { if (members.indexOf(uid) < 0) problems.push("League " + id + ": pick at T" + t + " by non-member " + uid.slice(0, 8) + "…"); }); });
        if (l.standings) { Object.keys(l.standings).forEach(function (uid) { if (members.indexOf(uid) < 0) problems.push("League " + id + ": standing for non-member " + uid.slice(0, 8) + "…"); }); }
      });
      setAudit({ ran: true, problems: problems, leagues: Object.keys(L).length });
    }
    return React.createElement("div", null,
      React.createElement(H, { title: "Diagnostics", sub: rows.length + " error" + (rows.length === 1 ? "" : "s") + " (newest 200)" }),
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" } },
        React.createElement("button", { onClick: runAudit, style: Object.assign({}, btnSolid, { background: C.accent }) }, "Run integrity audit"),
        rows.length ? React.createElement("button", { onClick: copyAll, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, "Copy all recent") : null,
        rows.length ? React.createElement("button", { onClick: clearAll, style: Object.assign({}, btnGhost, { marginLeft: 0, color: C.red, borderColor: C.red }) }, "Clear log") : null
      ),
      audit ? React.createElement("div", { style: { marginBottom: 16, border: "1px solid " + (audit.problems.length ? C.red : C.green), borderRadius: 9, padding: 12, background: C.panel } },
        React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", fontSize: 12.5, color: audit.problems.length ? C.red : C.green, marginBottom: 6 } }, audit.problems.length ? audit.problems.length + " issue(s) across " + audit.leagues + " leagues" : "Clean — " + audit.leagues + " leagues, no issues"),
        audit.problems.map(function (pr, i) { return React.createElement("div", { key: i, style: { fontSize: 12.5, color: C.muted, padding: "2px 0", fontFamily: C.mono } }, "• " + pr); })
      ) : null,
      rows.length === 0 ? React.createElement(Empty, { msg: "No errors logged. Runtime errors in the player app land here with full context." }) :
        rows.map(function (r) {
          return React.createElement("div", { key: r.id, style: { border: "1px solid " + C.line, borderRadius: 9, padding: 12, marginBottom: 10, background: C.panel } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" } },
              React.createElement("div", { style: { fontWeight: 700, color: C.red, fontSize: 13.5 } }, r.message),
              React.createElement("button", { onClick: function () { copy(r); }, style: btnGhost }, "Copy")),
            React.createElement("div", { style: { color: C.faint, fontSize: 11.5, margin: "4px 0", fontFamily: C.mono } }, fmtTime(r.ts) + " · " + (r.username || "?") + " · " + (r.screen || "?") + " · " + (r.appVersion || "?")),
            r.stack ? React.createElement("pre", { style: { margin: 0, whiteSpace: "pre-wrap", fontFamily: C.mono, fontSize: 11, color: C.muted, maxHeight: 140, overflow: "auto" } }, r.stack) : null);
        })
    );
  }

  function DataView() {
    var n = React.useState("users"), node = n[0], setNode = n[1];
    var val = useDbValue(node, node);
    var text = val === undefined ? "loading…" : JSON.stringify(val || {}, null, 2);
    return React.createElement("div", null,
      React.createElement(H, { title: "Data", sub: "Read-only DB browser · copy any node" }),
      React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" } },
        React.createElement(Select, { value: node, onChange: setNode, options: ["users", "leagues", "ledger", "diagnostics", "requests", "admins"] }),
        React.createElement("button", { onClick: function () { copyText(text); }, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, "Copy node JSON")
      ),
      React.createElement(JsonBlock, { text: text }),
      React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: C.faint } }, "Read-only — writes go through the typed controls in Accounts / Leagues, never freehand here.")
    );
  }

  function Requests() {
    var reqs = useDbValue("requests");
    if (reqs === undefined) return React.createElement(Loading);
    var rows = Object.keys(reqs || {}).map(function (id) { return Object.assign({ id: id }, reqs[id]); }).filter(function (r) { return r.ts; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    var setStatus = function (id, st) { db().ref("requests/" + id + "/status").set(st); };
    return React.createElement("div", null,
      React.createElement(H, { title: "Requests", sub: rows.filter(function (r) { return r.status === "open"; }).length + " open" }),
      rows.length === 0 ? React.createElement(Empty, { msg: "No requests. Members can flag you here (e.g. password resets) — they write to requests/." }) :
        React.createElement(Scroll, null, React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 } },
          React.createElement("thead", null, React.createElement("tr", null, ["When", "User", "Type", "Detail", "Status", ""].map(function (h, i) { return React.createElement("th", { key: i, style: th }, h); }))),
          React.createElement("tbody", null, rows.map(function (r) {
            return React.createElement("tr", { key: r.id },
              React.createElement("td", { style: Object.assign({}, td, { color: C.muted, whiteSpace: "nowrap" }) }, fmtAgo(r.ts) + " ago"),
              React.createElement("td", { style: Object.assign({}, td, { fontWeight: 700 }) }, r.username || "—"),
              React.createElement("td", { style: td }, r.type || "—"),
              React.createElement("td", { style: Object.assign({}, td, { color: C.muted }) }, r.detail || "—"),
              React.createElement("td", { style: td }, React.createElement(Badge, { tone: r.status === "open" ? "test" : "real" }, r.status || "open")),
              React.createElement("td", { style: Object.assign({}, td, { textAlign: "right", whiteSpace: "nowrap" }) }, r.status === "open" ? React.createElement("button", { onClick: function () { setStatus(r.id, "done"); }, style: btnGhost }, "Mark done") : React.createElement("button", { onClick: function () { setStatus(r.id, "open"); }, style: btnGhost }, "Reopen")));
          }))
        ))
    );
  }

  function SettingsTab(p) {
    return React.createElement("div", null,
      React.createElement(H, { title: "Console", sub: "Owner info" }),
      React.createElement("div", { style: { border: "1px solid " + C.line, borderRadius: 10, padding: 16, background: C.panel, maxWidth: 520 } },
        React.createElement(Field, { k: "Signed in as", v: p.user.displayName || p.user.username }),
        React.createElement(Field, { k: "Owner uid", v: p.user.uid, mono: true }),
        React.createElement(Field, { k: "Backend", v: "chains-app (Firebase)" }),
        React.createElement("div", { style: { marginTop: 14, fontSize: 12.5, color: C.faint, lineHeight: 1.6 } }, "Password resets & auth-account deletion are done in the Firebase console. No passwords, tokens, or secrets are stored or shown here.")
      )
    );
  }

  // ---- Mission Control: owner ops cockpit. All client-side, no secrets. ----
  var NODES = ["users", "leagues", "ledger", "trophies", "requests", "diagnostics", "config"];
  function logAction(act, detail) { var d = db(); if (!d) return; try { d.ref("diagnostics/actions").push({ ts: Date.now(), uid: (window.ChainsAuth && ChainsAuth.current() || {}).uid || null, act: act, detail: detail || null }); } catch (e) {} }

  function MissionControl() {
    var users = useDbValue("users"), leagues = useDbValue("leagues"), ledger = useDbValue("ledger"), trophies = useDbValue("trophies"), errs = useDbValue("diagnostics/errors"), flags = useDbValue("config/flags");
    var ping = React.useState("checking"); var pv = ping[0], setPing = ping[1];
    var restoreText = React.useState(""), rt = restoreText[0], setRt = restoreText[1];
    React.useEffect(function () { var d = db(); if (!d) { setPing("down"); return; } var r = d.ref(".info/connected"); var cb = r.on("value", function (s) { setPing(s.val() ? "up" : "down"); }); return function () { r.off("value", cb); }; }, []);
    var count = function (o) { return o ? Object.keys(o).length : 0; };
    var leagueArr = leagues ? Object.keys(leagues).map(function (k) { return leagues[k]; }) : [];

    function snapshotObj() {
      return { app: "Chains", takenAt: new Date().toISOString(), counts: { users: count(users), leagues: count(leagues), ledgerRows: count(ledger), trophies: count(trophies), errors: count(errs) }, firebase: pv, flags: flags || {} };
    }
    function copySnapshot() {
      var errRows = errs ? Object.keys(errs).map(function (k) { return errs[k]; }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 15) : [];
      var ledRows = ledger ? Object.keys(ledger).map(function (k) { return ledger[k]; }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 15) : [];
      var txt = "CHAINS — diagnostic snapshot\n" + new Date().toString() + "\n\n"
        + "SYSTEM\n  Firebase: " + pv + "\n  Users: " + count(users) + "  Leagues: " + count(leagues) + " (test " + leagueArr.filter(function (l) { return l.env === "test"; }).length + ")  Ledger rows: " + count(ledger) + "  Trophies: " + count(trophies) + "\n  Flags: " + JSON.stringify(flags || {}) + "\n\n"
        + "RECENT ERRORS (" + errRows.length + ")\n" + (errRows.map(function (e) { return "  " + new Date(e.ts).toISOString() + " [" + (e.screen || "?") + " v" + (e.appVersion || "?") + "] " + (e.message || ""); }).join("\n") || "  none") + "\n\n"
        + "RECENT LEDGER (" + ledRows.length + ")\n" + (ledRows.map(function (l) { return "  " + new Date(l.ts).toISOString() + " " + (l.username || "?") + " " + l.type + " " + (l.amount > 0 ? "+" : "") + l.amount + " → " + l.balanceAfter + (l.note ? " (" + l.note + ")" : ""); }).join("\n") || "  none");
      copyText(txt); logAction("copy_snapshot");
    }
    function backup() {
      var d = db(); if (!d) return;
      Promise.all(NODES.map(function (n) { return d.ref(n).get().then(function (s) { return [n, s.val()]; }).catch(function () { return [n, null]; }); })).then(function (pairs) {
        var dump = { app: "Chains", backupAt: new Date().toISOString() }; pairs.forEach(function (p) { dump[p[0]] = p[1]; });
        var blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "chains-backup-" + new Date().toISOString().slice(0, 10) + ".json"; a.click();
        logAction("backup_download"); toast("Backup downloaded");
      });
    }
    function restore() {
      var d = db(); if (!d) return;
      var data; try { data = JSON.parse(rt); } catch (e) { toast("Invalid JSON"); return; }
      var keys = NODES.filter(function (n) { return data[n] != null; });
      if (!keys.length) { toast("No known nodes in JSON"); return; }
      ChainsConfirm.show({ title: "Overwrite live data?", message: "RESTORE will OVERWRITE these nodes from the JSON: " + keys.join(", ") + ". This replaces live data for everyone.", confirmLabel: "Continue", danger: true }).then(function (ok) {
        if (!ok) return;
        ChainsConfirm.show({ title: "Final check", message: "This cannot be undone — download a fresh backup first if unsure. Overwrite now?", confirmLabel: "Overwrite now", danger: true }).then(function (ok2) {
          if (!ok2) return;
          Promise.all(keys.map(function (n) { return d.ref(n).set(data[n]); })).then(function () { logAction("restore", keys.join(",")); toast("Restored " + keys.length + " nodes"); setRt(""); });
        });
      });
    }
    function setFlag(k, v) { var d = db(); if (!d) return; d.ref("config/flags/" + k).set(v); logAction("flag", k + "=" + v); }

    var FLAGS = [
      { k: "poolsOpen", label: "Live Betting pools open", def: true },
      { k: "leagueCreate", label: "Allow league creation", def: true },
      { k: "maintenance", label: "Maintenance mode (read-only banner)", def: false }
    ];
    var card = { border: "1px solid " + C.line, borderRadius: 10, padding: 16, background: C.panel, marginBottom: 16 };
    var hdr2 = { fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13, color: C.ink, marginBottom: 10 };

    return React.createElement("div", null,
      React.createElement(H, { title: "Mission Control", sub: "Owner ops — status, backups, diagnostics, flags. Secretless & client-side." }),
      // status
      React.createElement("div", { style: card },
        React.createElement("div", { style: hdr2 }, "System status"),
        React.createElement("div", { style: { display: "flex", gap: 18, flexWrap: "wrap", fontFamily: C.mono, fontSize: 13 } },
          React.createElement("span", { style: { color: pv === "up" ? C.green : C.red } }, (pv === "up" ? "● online" : "● offline")),
          React.createElement("span", null, count(users) + " users"),
          React.createElement("span", null, count(leagues) + " leagues"),
          React.createElement("span", null, count(ledger) + " ledger rows"),
          React.createElement("span", null, count(trophies) + " trophies"),
          React.createElement("span", { style: { color: count(errs) ? C.red : C.muted } }, count(errs) + " errors")
        )
      ),
      // diagnostics snapshot
      React.createElement("div", { style: card },
        React.createElement("div", { style: hdr2 }, "Copy diagnostic snapshot"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 } }, "One paste-ready bundle — system counts, recent errors, and recent ledger — to hand to an AI helper for diagnosis."),
        React.createElement("button", { onClick: copySnapshot, style: Object.assign({}, btnSolid, { background: C.accent }) }, "Copy snapshot for AI")
      ),
      // backup / restore
      React.createElement("div", { style: card },
        React.createElement("div", { style: hdr2 }, "Backup & restore"),
        React.createElement("div", { style: { fontSize: 12.5, color: C.muted, marginBottom: 10, lineHeight: 1.5 } }, "Download a full JSON backup of every node (" + NODES.join(", ") + "). Restore overwrites from a backup file's contents — double-confirmed."),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 } }, React.createElement("button", { onClick: backup, style: btnSolid }, "Download backup JSON")),
        React.createElement("textarea", { value: rt, onChange: function (e) { setRt(e.target.value); }, placeholder: "Paste a backup JSON here to restore…", style: { width: "100%", minHeight: 70, padding: 10, borderRadius: 8, border: "1px solid " + C.line2, background: C.bg, color: C.ink, fontFamily: C.mono, fontSize: 11, boxSizing: "border-box", resize: "vertical" } }),
        React.createElement("button", { onClick: restore, disabled: !rt.trim(), style: Object.assign({}, btnGhost, { marginLeft: 0, marginTop: 8, color: rt.trim() ? C.red : C.faint, borderColor: rt.trim() ? C.red : C.line2 }) }, "Restore from JSON (overwrites)")
      ),
      // feature flags
      React.createElement("div", { style: card },
        React.createElement("div", { style: hdr2 }, "Feature flags"),
        FLAGS.map(function (f) {
          var val = flags && flags[f.k] != null ? flags[f.k] : f.def;
          return React.createElement("div", { key: f.k, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid " + C.line } },
            React.createElement("span", { style: { fontSize: 13, color: C.ink } }, f.label),
            React.createElement("button", { onClick: function () { setFlag(f.k, !val); }, style: { width: 52, height: 28, borderRadius: 99, border: "none", cursor: "pointer", background: val ? C.green : C.line2, position: "relative" } },
              React.createElement("span", { style: { position: "absolute", top: 3, left: val ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .15s" } })));
        })
      ),
      // system map
      React.createElement("div", { style: card },
        React.createElement("div", { style: hdr2 }, "System map"),
        React.createElement("button", { onClick: function () { copyText(SYSTEM_MAP); logAction("copy_map"); }, style: Object.assign({}, btnGhost, { marginLeft: 0, marginBottom: 10 }) }, "Copy system map for AI"),
        React.createElement(JsonBlock, { text: SYSTEM_MAP })
      ),
      // action log
      React.createElement(ActionLog)
    );
  }

  function ActionLog() {
    var acts = useDbValue("diagnostics/actions");
    var rows = acts ? Object.keys(acts).map(function (k) { return acts[k]; }).sort(function (a, b) { return b.ts - a.ts; }).slice(0, 25) : [];
    return React.createElement("div", { style: { border: "1px solid " + C.line, borderRadius: 10, padding: 16, background: C.panel } },
      React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13, color: C.ink, marginBottom: 10 } }, "Action log"),
      rows.length === 0 ? React.createElement("div", { style: { fontSize: 12.5, color: C.faint } }, "No owner actions logged yet.") :
        rows.map(function (r, i) { return React.createElement("div", { key: i, style: { fontFamily: C.mono, fontSize: 11.5, color: C.muted, padding: "3px 0" } }, fmtAgo(r.ts) + " ago · " + r.act + (r.detail ? " · " + r.detail : "")); })
    );
  }

  var SYSTEM_MAP = [
    "CHAINS — system map (data model & where things live)",
    "",
    "BACKENDS",
    "  chains-app (Firebase) — accounts, leagues, pools, coins, trophies (this admin reads it).",
    "  chains-fantasy (Firebase) + GitHub data repo — live Classic results / field scores (separate, read-only).",
    "",
    "FIREBASE NODES (chains-app)",
    "  users/{uid}: { username, displayName, disc, coins, onboarded, leagues:{lid:true}, poolEntries/{id}, trophies/{id} }",
    "  leagues/{lid}: { name, type, timing, length, env:test|real, ownerUid, members/{uid}, upicks/{t}/{uid}, memo, createdAt }",
    "  ledger/{id}: { ts, uid, username, type:entry|refund|payout|grant, amount, balanceAfter, poolId, note }",
    "  trophies/{id}: { uid, username, kind:pool_win|pool_cash|pool_loss|league_win, ts, title, amount }",
    "  requests/{id}: { ts, fromUid, username, type, detail, status }",
    "  diagnostics/errors/{id}, diagnostics/actions/{id}",
    "  config/flags/{flag}: bool   admins/{uid}: true",
    "",
    "CLIENT MODULES",
    "  firebase-init.js → ChainsFB · auth.js → ChainsAuth (+coins ledger) · trophies.js → ChainsTrophies",
    "  testdata.js → ChainsTestData (league store, cloud for real leagues) + ChainsActive (scoring)",
    "  pool-engine.js → ChainsPool (pari-mutuel math) · view_admin.jsx → AdminConsole",
    "",
    "RULES (lock-down): owner god-view via admins/{uid}; members read their leagues, write only their own picks.",
    "SECRETS: none in client — GitHub writes / other-user auth resets stay in consoles or a future owner-only Cloud Function."
  ].join("\n");

  function TestLab() {
    var tick = React.useState(0), refresh = function () { tick[1](tick[0] + 1); };
    React.useEffect(function () { var h = function () { refresh(); }; window.addEventListener("chains:remote-update", h); return function () { window.removeEventListener("chains:remote-update", h); }; });
    var TD = window.ChainsTestData;
    var kind = React.useState("bracket"), timing = React.useState("per-event"), length = React.useState("season"), members = React.useState(6), season = React.useState("2024"), name = React.useState("Test League");
    if (!TD) return React.createElement(Empty, { msg: "Test data engine unavailable." });
    var leagues = TD.loadTest().filter(function (l) { return l.test || l.created; });
    function make() {
      var cfg = { name: name[0].trim() || "Test League", type: kind[0], timing: kind[0] === "classic" ? "per-event" : timing[0], test: true, season: season[0], members: members[0], length: length[0] };
      if (length[0] === "n") cfg.count = 3;
      if (length[0] !== "season") { var nx = (window.ChainsEngine && ChainsEngine.seasonMeta) ? ChainsEngine.seasonMeta() : {}; cfg.startEventId = ((nx.next || nx.live || {}).t) || 10; }
      TD.create(cfg); toast("Test league created"); refresh();
    }
    function watch(id) { try { localStorage.setItem("chains_active_league", id); } catch (e) {} try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {} try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "dashboard" })); } catch (e) {} toast("Switched — viewing as a player"); }
    function del(id) { ChainsConfirm.show({ title: "Delete this test league?", confirmLabel: "Delete", danger: true }).then(function (ok) { if (ok) { TD.remove && TD.remove(id); refresh(); toast("Deleted"); } }); }
    var fieldLbl = { fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: C.muted, marginBottom: 5, display: "block" };
    return React.createElement("div", null,
      React.createElement(H, { title: "Test Lab", sub: "Spin up throwaway leagues and watch them react inside the app" }),
      React.createElement("div", { style: { border: "1px solid " + C.line, borderRadius: 10, padding: 16, background: C.panel, marginBottom: 18 } },
        React.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" } },
          React.createElement("div", { style: { flex: "1 1 150px" } }, React.createElement("label", { style: fieldLbl }, "Type"), React.createElement(Select, { value: kind[0], onChange: kind[1], options: ["bracket", "classic"], style: { width: "100%" } })),
          kind[0] === "bracket" ? React.createElement("div", { style: { flex: "1 1 150px" } }, React.createElement("label", { style: fieldLbl }, "Timing"), React.createElement(Select, { value: timing[0], onChange: timing[1], options: ["per-event", "season-long"], style: { width: "100%" } })) : null,
          React.createElement("div", { style: { flex: "1 1 150px" } }, React.createElement("label", { style: fieldLbl }, "Length"), React.createElement(Select, { value: length[0], onChange: length[1], options: ["season", "n", "single"], style: { width: "100%" } })),
          React.createElement("div", { style: { flex: "1 1 150px" } }, React.createElement("label", { style: fieldLbl }, "Season"), React.createElement(Select, { value: season[0], onChange: season[1], options: ["2024", "2023", "2022"], style: { width: "100%" } })),
          React.createElement("div", { style: { flex: "1 1 120px" } }, React.createElement("label", { style: fieldLbl }, "Members: " + members[0]), React.createElement("input", { type: "range", min: 2, max: 20, value: members[0], onChange: function (e) { members[1](+e.target.value); }, style: { width: "100%", accentColor: C.green } }))
        ),
        React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 12, alignItems: "center" } },
          React.createElement(TextInput, { value: name[0], onChange: name[1], placeholder: "League name", style: { flex: "1 1 200px" } }),
          React.createElement("button", { onClick: make, style: btnSolid }, "Create test league")
        ),
        React.createElement("div", { style: { marginTop: 10, fontSize: 12, color: C.faint, lineHeight: 1.5 } }, "Test leagues are local to this device and backfilled with the real " + season[0] + " results, so you can watch scoring/standings/picks play out end-to-end. They never touch live Classic or other players.")
      ),
      React.createElement("div", { style: { fontFamily: C.disp, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 11, color: C.muted, marginBottom: 8 } }, "Your test leagues (" + leagues.length + ")"),
      leagues.length === 0 ? React.createElement(Empty, { msg: "None yet. Create one above, then Watch it to drop into the app as a player." }) :
        leagues.map(function (l) {
          return React.createElement("div", { key: l.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 13px", border: "1px solid " + C.line, borderRadius: 9, background: C.panel, marginBottom: 8, flexWrap: "wrap" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 700, fontSize: 14, color: C.ink } }, l.name, React.createElement("span", { style: { marginLeft: 8 } }, React.createElement(Badge, { tone: "test" }, "test"))),
              React.createElement("div", { style: { fontSize: 12, color: C.faint } }, (l.type || "?") + (l.timing ? " · " + l.timing : "") + " · " + ((l.members || []).length || 0) + " members")),
            React.createElement("div", { style: { display: "flex", gap: 6 } },
              React.createElement("button", { onClick: function () { watch(l.id); }, style: Object.assign({}, btnSolid, { background: C.accent }) }, "Watch in app"),
              React.createElement("button", { onClick: function () { del(l.id); }, style: Object.assign({}, btnGhost, { marginLeft: 0, color: C.red, borderColor: C.red }) }, "Delete")));
        })
    );
  }

  function Drawer(p) {
    return React.createElement("div", { onClick: p.onClose, style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", justifyContent: "flex-end", zIndex: 4000 } },
      React.createElement("div", { onClick: function (e) { e.stopPropagation(); }, style: { width: p.wide ? 560 : 420, maxWidth: "94vw", height: "100%", background: C.panel2, borderLeft: "1px solid " + C.line2, padding: 22, overflowY: "auto" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
          React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: C.ink } }, p.title),
          React.createElement("button", { onClick: p.onClose, style: btnGhost }, "Close")),
        p.children)
    );
  }

  // The console body (assumes caller already owner-gated). onExit returns to the app.
  function AdminConsole(props) {
    var t = React.useState("dashboard"), tab = t[0], setTab = t[1];
    var who = (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()) || { uid: OWNER_UID, username: "owner", displayName: "Owner" };
    var TABS = [["dashboard", "Dashboard"], ["accounts", "Accounts"], ["leagues", "Leagues"], ["lab", "Test Lab"], ["ops", "Mission Control"], ["diagnostics", "Diagnostics"], ["requests", "Requests"], ["data", "Data"], ["settings", "Console"]];
    return React.createElement("div", { style: { minHeight: "100%", background: C.bg, color: C.ink, fontFamily: C.sans, borderRadius: 12, overflow: "hidden", border: "1px solid " + C.line2 } },
      React.createElement("div", { style: { borderBottom: "1px solid " + C.line2, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
        React.createElement("div", { style: { fontFamily: C.disp, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 18 } }, "Chains ", React.createElement("span", { style: { color: C.accent } }, "Admin")),
        props.onExit ? React.createElement("button", { onClick: props.onExit, style: Object.assign({}, btnGhost, { marginLeft: 0 }) }, "← Back to app") : null,
        React.createElement("div", { style: { width: "100%", display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 } }, TABS.map(function (x) { return React.createElement(Tab, { key: x[0], on: tab === x[0], onClick: function () { setTab(x[0]); } }, x[1]); }))
      ),
      React.createElement("div", { style: { padding: "20px 16px" } },
        tab === "dashboard" && React.createElement(Dashboard, { go: setTab }),
        tab === "accounts" && React.createElement("div", null, window.AdminAccountTools ? React.createElement(window.AdminAccountTools) : null, React.createElement(Accounts)),
        tab === "leagues" && React.createElement(Leagues),
        tab === "lab" && React.createElement(TestLab),
        tab === "ops" && React.createElement(MissionControl),
        tab === "diagnostics" && React.createElement(Diagnostics),
        tab === "requests" && React.createElement(Requests),
        tab === "data" && React.createElement(DataView),
        tab === "settings" && React.createElement(SettingsTab, { user: who })
      ),
      React.createElement(ToastHost)
    );
  }

  // Owner check: admins/{uid}===true, with the owner-uid fallback. Returns a Promise<bool>.
  function isOwner() {
    try {
      var c = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current();
      if (!c) return Promise.resolve(false);
      if (c.uid === OWNER_UID) return Promise.resolve(true);
      var d = db(); if (!d) return Promise.resolve(false);
      return d.ref("admins/" + c.uid).get().then(function (s) { return s.val() === true; }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }

  window.AdminConsole = AdminConsole;
  window.ChainsAdmin = { isOwner: isOwner, OWNER_UID: OWNER_UID };
})();
