/* Chains app — Weeklies UI. window.WeeklyView
   Run a recurring in-person league for your crew: create → start an event →
   check in → score live → finalize → standings. Reuses ChainsWeekly (data),
   the Go Throw scorecard pattern, the friends roster, and the league points model. */
(function () {
  const E = React.createElement;
  const wkPar = (v) => v == null ? "E" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
  const wkParColor = (v) => v == null || v === 0 ? "var(--text-strong)" : v < 0 ? "var(--score-under, #1f8a5b)" : "var(--score-over, #c23a33)";
  const wkStepBtn = { width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: "var(--text-strong)" };

  function WkHead({ title, sub, onBack }) {
    return E("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
      E("button", { onClick: onBack, "aria-label": "Back", style: { width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, E(Icons.ChevRight, { size: 18, style: { transform: "rotate(180deg)" } })),
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1 } }, title),
        sub ? E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 } }, sub) : null));
  }

  // ---- course search (reads the Go Throw catalog cache) --------------------
  function useCatalog() {
    const [cat, setCat] = React.useState(() => { try { return JSON.parse(localStorage.getItem("chains_courses_cache") || "null"); } catch (e) { return null; } });
    React.useEffect(() => {
      if (cat) return;
      fetch("https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/courses.json", { cache: "force-cache" })
        .then((r) => r.ok ? r.json() : Promise.reject()).then((j) => { const arr = Array.isArray(j) ? j : (j && (j.courses || Object.values(j))) || []; setCat(arr); try { localStorage.setItem("chains_courses_cache", JSON.stringify(arr)); } catch (e) {} }).catch(() => setCat([]));
    }, []);
    return cat;
  }

  /* ============================ HOME ================================= */
  function WeeklyHome({ onOpen, onCreate, onBack, mobile }) {
    const [weeklies, setWeeklies] = React.useState(null);
    React.useEffect(() => {
      if (!window.ChainsWeekly) { setWeeklies([]); return; }
      const load = () => window.ChainsWeekly.loadMine().then((arr) => setWeeklies(arr || []));
      load(); const fn = () => load(); window.addEventListener("chains:weeklies", fn);
      return () => window.removeEventListener("chains:weeklies", fn);
    }, []);
    return E("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
      E(WkHead, { title: "Run a League", sub: "Your crew's recurring league rounds", onBack: onBack }),
      E("button", { onClick: onCreate, className: "cw-press", style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px", borderRadius: "var(--radius-lg)", border: "none", background: "linear-gradient(180deg, var(--ace-400), var(--ace-500))", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 16 } },
        E("span", { style: { width: 20, height: 20, display: "inline-flex" } }, E(Icons.Trophy, { size: 20 })), "Start a league"),
      weeklies == null
        ? E(Card, { pad: 20 }, E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" } }, "Loading…"))
        : weeklies.length === 0
          ? E(Card, { pad: 24 }, E("div", { style: { textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-faint)", lineHeight: 1.6 } }, "No leagues yet. Start one for your group — pick a course, a night, and invite the crew. Every week you play counts toward season standings."))
          : E("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, weeklies.map((wk) => {
            const memberCount = wk.members ? Object.keys(wk.members).length : 0;
            const events = wk.events ? Object.values(wk.events) : [];
            const liveEv = events.find((e) => e && e.status === "live");
            return E("button", { key: wk.id, onClick: () => onOpen(wk.id), style: { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: "var(--radius-lg)", border: "1px solid " + (liveEv ? "var(--live-300, #f0b9b3)" : "var(--border-default)"), background: liveEv ? "var(--live-50, #fdeeec)" : "var(--bg-elevated)", cursor: "pointer" } },
              E("span", { style: { width: 42, height: 42, borderRadius: "var(--radius-md)", background: "var(--pine-700)", color: "var(--bone-50)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, E(Icons.Trophy, { size: 20 })),
              E("div", { style: { flex: 1, minWidth: 0 } },
                E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, wk.name),
                E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 } }, (wk.course && wk.course.name ? wk.course.name : "Course TBD") + " · " + memberCount + " players" + (wk.cadence ? " · " + wk.cadence : ""))),
              liveEv ? E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "var(--live-600, #c23a33)", whiteSpace: "nowrap" } }, "● Live") : E("span", { style: { width: 16, height: 16, color: "var(--text-faint)", flexShrink: 0 } }, E(Icons.ChevRight, { size: 16 })));
          })));
  }

  /* ============================ CREATE ================================= */
  function WeeklyCreate({ onBack, onCreated, mobile }) {
    const cat = useCatalog();
    const [name, setName] = React.useState("");
    const [course, setCourse] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [format, setFormat] = React.useState("singles");
    const [cadence, setCadence] = React.useState("Weekly");
    const [picking, setPicking] = React.useState(false);
    const me = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    const friends = (window.ChainsFriends && ChainsFriends.available && ChainsFriends.available()) ? ChainsFriends.list() : [];
    const [invited, setInvited] = React.useState({});
    const list = React.useMemo(() => {
      if (!cat) return []; const s = q.trim().toLowerCase(); if (!s) return cat.slice(0, 8);
      return cat.filter((c) => (c.name || "").toLowerCase().includes(s) || (c.city || "").toLowerCase().includes(s)).slice(0, 12);
    }, [cat, q]);
    const ready = name.trim() && course;
    function go() {
      const members = friends.filter((f) => invited[f.uid]).map((f) => ({ id: f.uid }));
      const r = window.ChainsWeekly.create({ name: name.trim(), course: course, format: format, cadence: cadence, members: members });
      if (!r.ok) { window.ChainsToast && ChainsToast.show(r.err, "error"); return; }
      if (window.ChainsToast) ChainsToast.show("Weekly created");
      onCreated(r.weekly.id);
    }
    return E("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
      E(WkHead, { title: "New league", sub: "Set it up once — run it every week", onBack: onBack }),
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 } }, "Name"),
        E("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Tuesday Night Doubles", style: { width: "100%", height: 46, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" } })),
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 } }, "Home course"),
        course && !picking
          ? E("button", { onClick: () => setPicking(true), style: { display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--fairway-500)", background: "var(--fairway-50)", cursor: "pointer" } },
            E("span", { style: { width: 18, height: 18, color: "var(--fairway-700)" } }, E(Icons.Check, { size: 18 })),
            E("span", { style: { flex: 1, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" } }, course.name),
            E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--fairway-700)" } }, "Change"))
          : E("div", null,
            E("input", { value: q, autoFocus: true, onChange: (e) => setQ(e.target.value), placeholder: cat ? "Search " + cat.length.toLocaleString() + " courses…" : "Loading courses…", style: { width: "100%", height: 46, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" } }),
            E("div", { style: { display: "flex", flexDirection: "column", gap: 6, marginTop: 8 } }, list.map((c) => E("button", { key: c.id, onClick: () => { setCourse(c); setPicking(false); setQ(""); }, style: { display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 13px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer" } },
              E("div", { style: { flex: 1, minWidth: 0 } },
                E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, c.name),
                E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" } }, (c.city || "") + (c.holes ? " · " + c.holes + " holes" : ""))))))) ),
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 } }, "Format"),
        E("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, (window.ChainsFormats ? window.ChainsFormats.list() : [{ id: "singles", name: "Singles", desc: "" }]).map((f) => E("button", { key: f.id, onClick: () => setFormat(f.id), style: { display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid " + (format === f.id ? "var(--fairway-500)" : "var(--border-default)"), background: format === f.id ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer" } },
          E("span", { style: { width: 16, height: 16, marginTop: 1, flexShrink: 0, color: format === f.id ? "var(--fairway-700)" : "var(--text-faint)" } }, format === f.id ? E(Icons.Check, { size: 16 }) : E("span", { style: { display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border-default)" } })),
          E("div", { style: { minWidth: 0 } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" } }, f.name),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 } }, f.desc)))))),
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 } }, "Cadence"),
        E("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, ["Weekly", "Biweekly", "Monthly"].map((c) => E("button", { key: c, onClick: () => setCadence(c), style: { padding: "10px 16px", borderRadius: "var(--radius-pill)", border: "1px solid " + (cadence === c ? "var(--fairway-500)" : "var(--border-default)"), background: cadence === c ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12.5, color: "var(--text-strong)" } }, c)))),
      friends.length > 0 ? E("div", null,
        E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 5 } }, "Invite your crew"),
        E("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, friends.map((f) => E("button", { key: f.uid, onClick: () => setInvited((m) => Object.assign({}, m, { [f.uid]: !m[f.uid] })), style: { display: "flex", alignItems: "center", gap: 7, padding: "7px 12px 7px 7px", borderRadius: "var(--radius-pill)", border: "1px solid " + (invited[f.uid] ? f.disc : "var(--border-default)"), background: invited[f.uid] ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer" } },
          E(Avatar, { name: f.name, color: f.disc, size: 22 }),
          E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)" } }, f.name))))) : null,
      E("button", { onClick: go, disabled: !ready, style: { padding: "15px", borderRadius: "var(--radius-md)", border: "none", background: ready ? "var(--fairway-600)" : "var(--bg-sunken)", color: ready ? "#fff" : "var(--text-faint)", cursor: ready ? "pointer" : "not-allowed", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 15 } }, ready ? "Create weekly" : "Name it & pick a course"));
  }

  window.WeeklyView = function WeeklyView({ onExit }) {
    const { mobile } = useViewport();
    const [stage, setStage] = React.useState("home");
    const [openId, setOpenId] = React.useState(null);
    const [eventId, setEventId] = React.useState(null);
    if (!window.ChainsWeekly) return E(Card, { pad: 18 }, E("div", { style: { fontFamily: "var(--font-sans)", color: "var(--text-faint)" } }, "Leagues unavailable."));
    if (stage === "create") return E(WeeklyCreate, { mobile: mobile, onBack: () => setStage("home"), onCreated: (id) => { setOpenId(id); setStage("detail"); } });
    if (stage === "detail" && openId) return E(window.WeeklyDetail, { id: openId, mobile: mobile, onBack: () => { setStage("home"); setOpenId(null); }, onOpenEvent: (eid) => { setEventId(eid); setStage("event"); } });
    if (stage === "event" && openId && eventId) return E(window.WeeklyEvent, { weeklyId: openId, eventId: eventId, mobile: mobile, onBack: () => { setEventId(null); setStage("detail"); } });
    return E(WeeklyHome, { mobile: mobile, onBack: onExit, onCreate: () => setStage("create"), onOpen: (id) => { setOpenId(id); setStage("detail"); } });
  };
})();
