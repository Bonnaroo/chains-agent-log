/* Chains app — My Leagues hub. window.MyLeaguesView
   The one place every league you're in lives, so multiple drafts/seasons never
   tangle: the LIVE league (real, locked) + any TEST leagues you spin up.
   Test leagues are commissioner-only, stored locally (chains_test_leagues) — NOT
   synced, NOT scored into the real standings — so only YOU see them while you try
   out the other scoring types against a past season. Each carries a TEST badge. */
(function () {
  const __Portal = ({ children }) => (window.ReactDOM && ReactDOM.createPortal) ? ReactDOM.createPortal(children, document.body) : children;

  const TKEY = "chains_test_leagues_v7";
  const SEEDED_FLAG = "chains_test_seeded_v7";
  const TYPE_LABEL = { classic: "Classic Draft", lock: "Pick-Once-and-Lock", bracket: "Bracket Pick" };
  const TYPE_DESC = {
    classic: "Normal snake draft (like Chains now) — own your pros exclusively, manage your roster, points stack up all season.",
    lock: "Pick your bracket lineup ONCE — one pro per bracket — and lock it for the whole season. You and your buddies ride that team all year.",
    bracket: "Advanced — pick a NEW pro from each bracket EVERY tournament. Re-pick all season; matching lineups share the finish.",
    money: "App-wide buy-in pool — your team vs the whole field for a pot. Pari-mutuel: the house never overpays.",
  };
  function loadTest() {
    try {
      var raw = localStorage.getItem(TKEY);
      if (raw == null && localStorage.getItem(SEEDED_FLAG) !== "1") { seedDemo(); raw = localStorage.getItem(TKEY); }
      var list = JSON.parse(raw || "[]");
      // belt-and-suspenders: never surface a classic-type or money test league
      return list.filter(function (l) { return l && l.type !== "classic" && l.type !== "money"; });
    } catch (e) { return []; }
  }
  function saveTest(list) { try { localStorage.setItem(TKEY, JSON.stringify(list)); } catch (e) {} }
  const PROS = ["Gannon Buhr","Calvin Heimburg","Anthony Barela","Ezra Robinson","Isaac Robinson","Niklas Anttila","Richard Wysocki","Aaron Gossage","Eagle McMahon","Cole Redalen","Simon Lizotte","Mauri Villmann"];
  function ourMembers() { return (window.ChainsEngine ? ChainsEngine.members() : []).slice(0, 6); }
  // Build a mid-season test league seeded with our 6 names + picks + standings.
  function buildLeague(id, name, type, extra) {
    const mem = ourMembers();
    const spread = [42, 38, 35, 31, 28, 24];
    const unders = [-152, -138, -126, -111, -98, -84]; // bracket: combined season under-par (most down leads)
    const teams = mem.map((m, i) => {
      const lineup = type === "classic"
        ? [PROS[i], PROS[i + 6]]
        : [PROS[i], PROS[(i + 2) % 12], PROS[(i + 5) % 12], PROS[(i + 8) % 12], PROS[(i + 10) % 12], PROS[(i + 1) % 12]];
      return { id: m.id, name: m.name, color: m.disc, lineup: lineup, points: spread[i], under: unders[i], rank: i + 1 };
    });
    // Per-tournament picks HISTORY so the Picks tab shows T1..T(now) like Classic.
    // lock = same 5 every event; bracket(perEvent) = a fresh 5 each event.
    const completed = (window.ChainsEngine ? ChainsEngine.SEED.TOURNAMENTS : []).filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });
    const seasonLock = type === "lock";
    const events = completed.map((t, ev) => {
      const picks = {}, escore = {}, ppick = {};
      mem.forEach((m, i) => {
        let five;
        if (seasonLock) {
          five = teams[i].lineup.slice(0, 5);
        } else {
          // deterministic per (member, event) rotation so each event differs
          five = [0, 1, 2, 3, 4].map((k) => PROS[(i * 2 + ev * 3 + k * 5) % 12]);
          // de-dup within the lineup
          five = five.filter((p, idx) => five.indexOf(p) === idx);
          let g = 0; while (five.length < 5) { const cand = PROS[(i + ev + g) % 12]; if (five.indexOf(cand) < 0) five.push(cand); g++; }
        }
        // realistic bracket scoring: 5 counting pros, each ~-12..-28 to par per
        // 3–4 round event, so a 5-pro lineup is ~-90..-130/event and a full
        // 10-event season totals ~-900 to -1,100 (most-down leads).
        const five5 = five.slice(0, 5);
        let total = 0;
        const perPick = {};
        five5.forEach((p, k) => { const s = -(12 + ((i * 5 + ev * 7 + k * 11 + (seasonLock ? 1 : 4)) % 17)); perPick[p] = s; total += s; });
        escore[m.id] = total;
        picks[m.id] = five;
        ppick[m.id] = perPick;
      });
      return { t: t.t, name: t.name, picks: picks, scores: escore, perPick: ppick };
    });
    // Season cumulative under-par = sum of every event's score (the real total,
    // hundreds-down for a 5-pick bracket league). Re-rank teams by it.
    teams.forEach((tm) => { tm.under = events.reduce((s, e) => s + (e.scores[tm.id] || 0), 0); });
    teams.sort((a, b) => (a.under || 0) - (b.under || 0));
    teams.forEach((tm, i) => { tm.rank = i + 1; });
    return Object.assign({ id: id, name: name, type: type, season: "2026", members: mem.length, teams: teams, events: events, demo: true }, extra || {});
  }
  function seedDemo() {
    // Samples removed — never seed demo leagues. Only the live Chains Classic
    // plus leagues the user creates should ever exist.
    saveTest([]);
    try { localStorage.setItem(SEEDED_FLAG, "1"); } catch (e) {}
  }

  // Colored identity tile for a league — mirrors the Dashboard's colored icons.
  function LeagueMark({ type, live, size = 46 }) {
    const map = {
      classic: ["var(--fairway-100)", "var(--fairway-700)", <Icons.Disc size={Math.round(size * 0.5)} />],
      bracket: ["var(--sky-100)", "var(--sky-600)", <Icons.Grid size={Math.round(size * 0.46)} />],
      lock: ["var(--ace-100)", "var(--ace-700)", <Icons.Target size={Math.round(size * 0.5)} />],
      money: ["var(--gold-100)", "#9A7400", <Icons.Trophy size={Math.round(size * 0.5)} />],
    };
    const [bg, fg, icon] = map[type] || map.classic;
    return (
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flexShrink: 0, borderRadius: "var(--radius-md)", background: bg, color: fg, boxShadow: "var(--shadow-sm)" }}>
        {icon}
        {live && <span style={{ position: "absolute", top: -3, right: -3, width: 12, height: 12, borderRadius: "50%", background: "var(--fairway-500)", boxShadow: "0 0 0 2.5px var(--bg-elevated)" }} />}
      </span>
    );
  }
  // Overlapping avatar stack — the "density with purpose" the good screens have.
  function leagueMembers(l) {
    if (Array.isArray(l.teams) && l.teams.length) return l.teams;
    if (Array.isArray(l.members)) return l.members;
    return [];
  }
  function AvatarRow({ members, max = 6, size = 24 }) {
    const shown = members.slice(0, max);
    const extra = members.length - shown.length;
    return (
      <div style={{ display: "flex", alignItems: "center", marginTop: 9 }}>
        {shown.map((m, i) => (
          <span key={m.id || i} style={{ marginLeft: i ? -7 : 0, borderRadius: "var(--radius-pill)", boxShadow: "0 0 0 2px var(--bg-elevated)", position: "relative", zIndex: shown.length - i }}>
            <Avatar name={m.name} color={m.color || m.disc} size={size} />
          </span>
        ))}
        {extra > 0 && <span style={{ marginLeft: 7, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--text-faint)" }}>+{extra}</span>}
      </div>
    );
  }
  function TypeChip({ type }) {
    return <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 9.5, color: "var(--chain-600)", background: "var(--chain-50, #eef3f0)", border: "1px solid var(--border-subtle)", padding: "2px 8px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap" }}>{TYPE_LABEL[type] || (type === "money" ? "Money Pool" : type)}</span>;
  }

  function MyLeaguesView() {
    const { mobile } = useViewport();
    const [, force] = React.useState(0);
    const [stage, setStage] = React.useState(function () { try { if (sessionStorage.getItem("chains_open_create") === "1") { sessionStorage.setItem("chains_open_create", "0"); return "create"; } } catch (e) {} return "list"; }); // list | create | detail
    const [sel, setSel] = React.useState(null);
    const [typeSheet, setTypeSheet] = React.useState(false);
    const courseLeagueCount = (window.ChainsCourseLeagues ? ChainsCourseLeagues.mine().length : 0);
    React.useEffect(() => (window.ChainsCourseLeagues ? ChainsCourseLeagues.subscribe(() => force((x) => x + 1)) : undefined), []);
    const isCommish = window.ChainsID && ChainsID.isCommish();
    const [showSamples, setShowSamples] = React.useState(function () { try { return localStorage.getItem("chains_show_samples") === "1"; } catch (e) { return false; } });
    const _all = (window.ChainsTestData ? ChainsTestData.loadTest() : []).filter(function (l) { return !/probe/i.test(l.name || ""); });
    const created = _all.filter(function (l) { return l.created; });
    const samples = _all.filter(function (l) { return l.demo; });
    const test = _all;
    const liveCount = (window.ChainsEngine ? ChainsEngine.members().length : 6);
    // v506: season state drives the wording — no "Live" once the season is done
    const season = (function () { try { const m = ChainsEngine.seasonMeta(); const st = ChainsEngine.standings ? ChainsEngine.standings() : []; const champ = st && st[0] ? (ChainsEngine.member(st[0].id || st[0].m) || {}).name || (st[0].id || st[0].m) : null; const done = !!(m && m.total && m.completed >= m.total); return { live: !!(m && m.live), done: done, completed: m ? m.completed : 0, total: m ? m.total : 0, champ: champ }; } catch (e) { return { live: false, done: false, completed: 0, total: 0, champ: null }; } })();
    const go = (v) => { try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: v })); } catch (e) {} };
    const typeTiming = (l) => l.type === "classic" ? "Classic · per tournament" : l.timing === "season-long" ? "Bracket · season-long" : l.length === "single" ? "Bracket · single tournament" : l.length === "n" ? ("Bracket · " + (l.count || 3) + " tournaments") : "Bracket · per tournament";

    function removeTest(id) { if (window.ChainsTestData) ChainsTestData.remove(id); setStage("list"); setSel(null); force((x) => x + 1); }
    function renameTest(id, newName) {
      if (window.ChainsTestData && !ChainsTestData.rename(id, newName)) { window.ChainsToast && ChainsToast.show("That name is taken or empty — pick a unique name.", "error"); return; }
      force((x) => x + 1);
    }

    const leagueCard = (l) => {
      const mems = leagueMembers(l);
      const count = Array.isArray(l.members) ? l.members.length : (l.members || mems.length || 0);
      return (
        <Card key={l.id} pad={0} hover onClick={() => { setSel(l); setStage("detail"); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px" }}>
            <LeagueMark type={l.type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".01em", fontSize: 15.5, color: "var(--text-strong)" }}>{l.name}</span>
                {l.demo ? <Badge tone="neutral" emphasis="soft">Sample</Badge> : null}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>{typeTiming(l)} · {count} of 20</div>
              {mems.length > 0 && <AvatarRow members={mems} />}
            </div>
            <span style={{ width: 17, height: 17, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={17} /></span>
          </div>
        </Card>
      );
    };
    if (stage === "create") return <CreateTest onDone={() => { setStage("list"); force((x) => x + 1); }} onBack={() => setStage("list")} mobile={mobile} />;
    if (stage === "createCourse") return React.createElement(CourseLeagueCreate, { onDone: (id) => { setSel({ courseLeague: id }); setStage("courseDetail"); }, onBack: () => setStage("list"), mobile });
    if (stage === "courseDetail" && sel && sel.courseLeague) return React.createElement(CourseLeagueDetail, { id: sel.courseLeague, onBack: () => { setStage("list"); setSel(null); }, mobile });
    if (stage === "detail" && sel === "live") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FlowHead title="Chains" sub={season.done ? "2026 season · Final" + (season.champ ? " · Champion: " + season.champ : "") : season.live ? "Live league · 2026 season" : "2026 season"} onBack={() => { setStage("list"); setSel(null); }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["dashboard", "Dashboard", "Who won, at a glance"], ["standings", "Standings", "Season points & tiebreaks"], ["picks", "The Picks", "Every event's picks"], ["course", "Live Chains", "Event scoring, hole by hole"]].map(([id, t, d]) => (
              <button key={id} onClick={() => go(id)} style={{ textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{t}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{d}</div>
              </button>
            ))}
          </div>
          {isCommish && !season.done ? (
            <React.Fragment>
              <LiveInviteCard mobile={mobile} />
              {window.LeagueSettingsSection ? React.createElement(window.LeagueSettingsSection, { mobile: mobile }) : null}
            </React.Fragment>
          ) : season.done ? <Card pad={mobile ? 18 : 22}><div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>The 2026 season is in the books. Members, the pro pool and invites reopen when the 2027 draft is set up in the spring.</div></Card> : <Card pad={mobile ? 18 : 22}><div style={{ display: "flex", alignItems: "center", gap: 13 }}><span style={{ width: 22, height: 22, color: "var(--text-faint)", flexShrink: 0 }}><Icons.Lock size={20} /></span><div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>League setup — members, the pro pool, and shared data — is commissioner-only.</div></div></Card>}
        </div>
      );
    }
    if (stage === "detail" && sel) return <TestDetail league={sel} all={test} onSwitch={(l) => setSel(l)} onBack={() => { setStage("list"); setSel(null); }} onDelete={() => removeTest(sel.id)} onRename={(nm) => renameTest(sel.id, nm)} mobile={mobile} />;

    const friendsCount = (window.ChainsFriends && ChainsFriends.available && ChainsFriends.available()) ? ChainsFriends.list().length : 0;
    const heroStat = (n, label) => (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: 26, lineHeight: 1, color: "var(--bone-50)" }}>{n}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--chain-400)", marginTop: 5 }}>{label}</div>
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Hero — ink panel, matches the Dashboard */}
        <Card tone="ink" pad={0}>
          <div style={{ padding: mobile ? "20px 18px" : "24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 16, height: 3, background: "var(--accent)", borderRadius: 2 }} />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 12, color: "var(--chain-400)" }}>2026 Season</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-.01em", fontSize: mobile ? 30 : 34, lineHeight: 1, color: "var(--bone-50)" }}>My Leagues</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--chain-400)", marginTop: 9, maxWidth: 460, lineHeight: 1.5 }}>Every league you're in. Start a course league with your crew — pick a course, a deadline, a format — or join one with a code.</div>
            <div style={{ display: "flex", gap: mobile ? 26 : 34, marginTop: 18, marginBottom: 20 }}>
              {heroStat(created.length + courseLeagueCount + 1, (created.length + courseLeagueCount) === 0 ? "League" : "Leagues")}
              {heroStat(friendsCount, friendsCount === 1 ? "Friend" : "Friends")}
              {heroStat(liveCount, "In live league")}
            </div>
            <Button variant="accent" full size="lg" icon={<Icons.Plus size={17} />} onClick={() => setTypeSheet(true)}>Create a league</Button>
          </div>
        </Card>
        {typeSheet && React.createElement(LeagueTypeSheet, { onClose: () => setTypeSheet(false), onCourse: () => { setTypeSheet(false); setStage("createCourse"); }, onFantasy: () => { setTypeSheet(false); setStage("create"); } })}

        {/* LIVE league — marquee card with accent bar + identity */}
        <div>
          <div style={lbl}>{season.live ? "Live" : "Season league"}</div>
          <Card pad={0} hover accentBar={season.live ? "var(--fairway-500)" : "var(--gold-500, #d4a017)"} onClick={() => { setSel("live"); setStage("detail"); }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: mobile ? "15px 16px" : "16px 18px" }}>
              <LeagueMark type="classic" live size={50} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".01em", fontSize: 17, color: "var(--text-strong)" }}>Chains</span>
                  {season.live ? <Badge tone="live" emphasis="solid">Live</Badge> : season.done ? <Badge tone="neutral" emphasis="soft">2026 · Final</Badge> : null}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 }}>{season.done && season.champ ? "Champion: " + season.champ + " · " : ""}Fantasy DGPT · 2 MPO picks per event · {liveCount} members</div>
                {(() => { const lm = (window.ChainsEngine ? ChainsEngine.members() : []); return lm.length ? <AvatarRow members={lm} size={26} /> : null; })()}
              </div>
              <span style={{ width: 17, height: 17, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={17} /></span>
            </div>
          </Card>
        </div>

        {/* Course leagues (v508) */}
        {React.createElement(CourseLeaguesSection, { mobile, onOpen: (id) => { setSel({ courseLeague: id }); setStage("courseDetail"); }, onCreate: () => setStage("createCourse") })}

        {/* Fantasy leagues you made (hidden until you have one — the season builder opens in 2027) */}
        {created.length > 0 && <div>
          <div style={lbl}>Fantasy leagues</div>
          {created.length === 0 ? (
            <Card pad={0}>
              <div style={{ padding: mobile ? "30px 20px" : "36px 24px", textAlign: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "var(--radius-lg)", background: "var(--fairway-100)", color: "var(--fairway-700)", marginBottom: 14, boxShadow: "var(--shadow-sm)" }}><Icons.Disc size={26} /></span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 17, color: "var(--text-strong)", marginBottom: 6 }}>Your own fantasy league</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto 18px", lineHeight: 1.5 }}>Draft pros with your friends next season. Try a format against this season first — it never touches the real standings.</div>
                <Button variant="secondary" size="lg" icon={<Icons.Plus size={16} />} onClick={() => setStage("create")}>Set one up</Button>
              </div>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{created.map(leagueCard)}</div>
          )}
          {React.createElement(JoinByCode, { mobile: mobile })}
        </div>}
        {samples.length > 0 && isCommish && (
          <div>
            <button onClick={() => setShowSamples(function (v) { var nv = !v; try { localStorage.setItem("chains_show_samples", nv ? "1" : "0"); } catch (e) {} try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {} return nv; })} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>
              {showSamples ? "Hide" : "Load"} sample leagues ({samples.length})
              <span style={{ width: 14, height: 14, display: "inline-flex", transform: showSamples ? "rotate(180deg)" : "none" }}><Icons.ChevDown size={14} /></span>
            </button>
            {showSamples && <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>{samples.map(leagueCard)}</div>}
          </div>
        )}
      </div>
    );
  }

  /* Friends hub — your friend code + QR, pending requests, friends list, add-friend. */
  // Route a scanned/parsed value to the right action (friend add / league join / code).
  function handleScannedValue(text) {
    if (!text) return false;
    var m = text.match(/[#&](?:addfriend|add)=([^&\s]+)/);
    if (m) { if (window.ChainsAddFriend) ChainsAddFriend.prompt(decodeURIComponent(m[1])); return true; }
    var j = text.match(/[#&]join=([^&\s]+)/);
    if (j) { if (window.ChainsJoin) ChainsJoin.prompt(decodeURIComponent(j[1])); return true; }
    var c = String(text).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length >= 4 && window.ChainsFriends) { ChainsFriends.addByCode(c).then(function (r) { if (window.ChainsToast) ChainsToast.show(r.ok ? "Friend request sent" : r.err, r.ok ? "success" : "error"); }); return true; }
    return false;
  }

  /* Camera QR scanner — BarcodeDetector when available, clear fallback otherwise. */
  function QRScanner({ onClose }) {
    const videoRef = React.useRef(null);
    const [status, setStatus] = React.useState("starting");
    React.useEffect(function () {
      let stream, raf, stopped = false;
      const hasBD = ("BarcodeDetector" in window);
      (async function start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus("unsupported"); return; }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
          if (videoRef.current) { videoRef.current.srcObject = stream; try { await videoRef.current.play(); } catch (e) {} }
          if (!hasBD) { setStatus("nodetector"); return; }
          setStatus("scanning");
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          const tick = async function () {
            if (stopped) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes && codes.length) { const v = codes[0].rawValue || ""; if (handleScannedValue(v)) { onClose(); return; } }
            } catch (e) {}
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } catch (e) { setStatus("denied"); }
      })();
      return function () { stopped = true; if (raf) cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()); };
    }, []);
    React.useEffect(function () { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
    const fallback = status === "unsupported" || status === "nodetector" || status === "denied";
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 220, background: "#0a0f0d", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 15, color: "#fff" }}>Scan a friend's QR</span>
          <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 20, fontWeight: 700 }}>×</button>
        </div>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <video ref={videoRef} playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: fallback ? 0.15 : 1 }}></video>
          {!fallback && <div style={{ position: "relative", width: 220, height: 220, border: "3px solid rgba(255,255,255,.9)", borderRadius: 18, boxShadow: "0 0 0 9999px rgba(0,0,0,.45)" }}></div>}
          {fallback && (
            <div style={{ position: "relative", maxWidth: 340, textAlign: "center", padding: 22, color: "#fff" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, marginBottom: 10 }}>Use your phone's camera</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,.82)" }}>In-app scanning isn't available on this device. Open your phone's <b>Camera app</b> and point it at your friend's QR — it'll open the invite automatically. Or just type their code on the previous screen.</div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 16px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 12 }}>{status === "scanning" ? "Point the camera at their QR code" : status === "starting" ? "Starting camera…" : ""}</div>
          <button onClick={onClose} style={{ height: 46, padding: "0 28px", border: "1px solid rgba(255,255,255,.3)", borderRadius: "var(--radius-pill)", background: "transparent", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    );
  }

  /* The one "add people" journey: Share your code/QR · Enter theirs · Scan theirs. */
  function InviteFriendsModal({ onClose, mobile }) {
    const [tab, setTab] = React.useState("share");
    const [q, setQ] = React.useState("");
    const [results, setResults] = React.useState([]);
    const [scan, setScan] = React.useState(false);
    const qrRef = React.useRef(null);
    React.useEffect(function () { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
    const avail = window.ChainsFriends && ChainsFriends.available && ChainsFriends.available();
    const myUid = avail ? ChainsFriends.myUid() : null;
    const code = avail ? ChainsFriends.myCode() : "";
    const link = "https://bonnaroo.github.io/chains-app/#addfriend=" + (myUid || "");
    React.useEffect(function () {
      if (tab === "share" && qrRef.current && window.ChainsQR && myUid) { qrRef.current.innerHTML = ""; try { qrRef.current.appendChild(ChainsQR.toCanvas(link, mobile ? 158 : 184)); } catch (e) {} }
    }, [tab, link, mobile, myUid]);
    function copy(text, label) { try { (window.ChainsCopy ? ChainsCopy(text) : Promise.resolve()).catch(function () {}); } catch (e) {} if (window.ChainsToast) ChainsToast.show(label || "Copied"); }
    function share() { if (navigator.share) navigator.share({ title: "Add me on Chains", text: "Add me on Chains — my friend code is " + code, url: link }).catch(function () {}); else copy(link, "Link copied"); }
    function runSearch(v) { setQ(v); const s = v.trim(); if (s.length < 2) { setResults([]); return; } ChainsFriends.searchByUsername(s).then(setResults); }
    function addCode() {
      const c = q.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (c.length < 4) { if (window.ChainsToast) ChainsToast.show("Enter a 6-character code, or search a username", "info"); return; }
      ChainsFriends.addByCode(c).then(function (r) { if (window.ChainsToast) ChainsToast.show(r.ok ? "Friend request sent" : r.err, r.ok ? "success" : "error"); if (r.ok) { setQ(""); setResults([]); } });
    }
    const tabBtn = (id, label) => (
      <button onClick={() => setTab(id)} style={{ flex: 1, height: 40, border: "none", borderBottom: tab === id ? "2px solid var(--fairway-600)" : "2px solid transparent", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, color: tab === id ? "var(--text-strong)" : "var(--text-faint)" }}>{label}</button>
    );
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 205, background: "rgba(12,20,16,.55)", display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", padding: mobile ? 0 : 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: "var(--bg-elevated)", borderRadius: mobile ? "18px 18px 0 0" : "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "0 20px 50px rgba(0,0,0,.3)", overflow: "hidden", maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Invite friends</span>
            <button onClick={onClose} aria-label="Close" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: 19, fontWeight: 700 }}>×</button>
          </div>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", padding: "0 8px" }}>{tabBtn("share", "Share yours")}{tabBtn("enter", "Enter theirs")}{tabBtn("scan", "Scan")}</div>
          <div style={{ padding: 18, overflowY: "auto" }}>
            {tab === "share" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 13 }}>
                <div ref={qrRef} style={{ width: mobile ? 158 : 184, height: mobile ? 158 : 184, borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "#fff" }}></div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>Have a friend scan this, or share your code:</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 28, letterSpacing: ".16em", color: "var(--fairway-700)" }}>{code}</span>
                  <button onClick={() => copy(code, "Code copied")} style={{ height: 34, padding: "0 13px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5, color: "var(--text-strong)" }}>Copy</button>
                </div>
                <button onClick={share} style={{ width: "100%", height: 46, border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14 }}>Share my invite</button>
              </div>
            )}
            {tab === "enter" && (
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>Type your friend's username or their 6-character code.</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input autoFocus value={q} onChange={(e) => runSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCode(); }} placeholder="Username or code" style={{ flex: 1, minWidth: 0, height: 44, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
                  <button onClick={addCode} style={{ height: 44, padding: "0 18px", border: "none", borderRadius: "var(--radius-md)", background: "var(--chain-600, #2563a8)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, flexShrink: 0 }}>Add</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {results.map(function (u) {
                    const isF = ChainsFriends.isFriend(u.uid);
                    return (
                      <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)" }}>
                        <Avatar name={u.name} color={u.disc} size={26} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{u.name}</div>
                          {u.username ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>@{u.username}</div> : null}
                        </div>
                        <button disabled={isF} onClick={() => { ChainsFriends.sendRequest(u.uid); if (window.ChainsToast) ChainsToast.show("Friend request sent to " + u.name); setResults([]); setQ(""); }} style={{ height: 32, padding: "0 13px", border: "none", borderRadius: "var(--radius-pill)", background: isF ? "var(--bg-elevated)" : "var(--fairway-600)", color: isF ? "var(--text-faint)" : "#fff", cursor: isF ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5 }}>{isF ? "Friends" : "Add"}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {tab === "scan" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>Point your camera at a friend's QR to add them instantly.</div>
                <button onClick={() => setScan(true)} style={{ width: "100%", height: 48, border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><span style={{ width: 17, height: 17, display: "inline-flex" }}><Icons.Target size={17} /></span> Open camera</button>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 10 }}>On iPhone you can also just use the built-in Camera app — it opens the invite link.</div>
              </div>
            )}
          </div>
        </div>
        {scan && <QRScanner onClose={() => setScan(false)} />}
      </div>
    );
  }

  /* Friends — the social hub: requests, your friends, one Invite-friends journey. */
  /* Always-visible add-a-friend block: your code + QR, and a field to enter theirs.
     No modal — this is THE answer to "how do I add someone". */
  function AddFriendInline({ mobile }) {
    const avail = window.ChainsFriends && ChainsFriends.available && ChainsFriends.available();
    const code = avail ? ChainsFriends.myCode() : "";
    const qrRef = React.useRef(null);
    const [entry, setEntry] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState("");
    const [full, setFull] = React.useState(false);
    React.useEffect(function () {
      if (qrRef.current && window.ChainsQR && code) { qrRef.current.innerHTML = ""; try { qrRef.current.appendChild(ChainsQR.toCanvas("https://bonnaroo.github.io/chains-app/#add=" + code, mobile ? 120 : 132)); } catch (e) {} }
    }, [code, mobile]);
    function copyCode() { try { (window.ChainsCopy ? ChainsCopy(code) : Promise.resolve()).catch(function () {}); } catch (e) {} if (window.ChainsToast) ChainsToast.show("Your code copied"); }
    function submit() {
      const c = entry.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (c.length < 4) { setMsg("Enter their 6-character code."); return; }
      setBusy(true); setMsg("");
      Promise.resolve(ChainsFriends.addByCode(c)).then(function (res) {
        setBusy(false);
        if (res && res.ok) { setEntry(""); setMsg(""); if (window.ChainsToast) ChainsToast.show("Friend request sent to " + (res.name || "them") + " \u2014 they\u2019ll get a notification to accept"); }
        else { setMsg((res && res.err) || "No one found for that code."); }
      }).catch(function () { setBusy(false); setMsg("Couldn't look that up — try again."); });
    }
    if (!avail) return null;
    return (
      <React.Fragment>
      <Card pad={0} style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: 16, padding: mobile ? 15 : 18, alignItems: mobile ? "stretch" : "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, flexShrink: 0 }}>
            <div ref={qrRef} style={{ width: mobile ? 120 : 132, height: mobile ? 120 : 132, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-faint)" }}>Your friend code</div>
              <button onClick={copyCode} style={{ display: "block", marginTop: 4, padding: 0, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 26, letterSpacing: ".14em", color: "var(--text-strong)" }}>{code}</button>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 3 }}>Tap to copy</div>
              <button onClick={() => setFull(true)} style={{ marginTop: 6, padding: 0, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11, color: "var(--fairway-700)" }}>Full-screen QR →</button>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", borderTop: mobile ? "1px solid var(--border-subtle)" : "none", paddingTop: mobile ? 14 : 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, color: "var(--text-strong)", marginBottom: 7 }}>Add a friend</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={entry} onChange={(e) => { setEntry(e.target.value.toUpperCase()); setMsg(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Their code or username" maxLength={24}
                style={{ flex: 1, minWidth: 0, height: 44, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: ".12em", fontSize: 16, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
              <button onClick={submit} disabled={busy} style={{ height: 44, padding: "0 20px", border: "none", borderRadius: "var(--radius-md)", background: busy ? "var(--bg-sunken)" : "var(--accent)", color: busy ? "var(--text-faint)" : "#fff", cursor: busy ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13, flexShrink: 0 }}>{busy ? "…" : "Add"}</button>
            </div>
            {msg ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--clay-600, #b4452f)", marginTop: 7 }}>{msg}</div> : <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 7 }}>Ask a friend for their code, type it here, and they'll get a request to accept.</div>}
          </div>
        </div>
      </Card>
      {full && <MyQRFullscreen code={code} onClose={() => setFull(false)} />}
      </React.Fragment>
    );
  }

  /* Full-screen My QR — readable across a table. Scanning it (native camera,
     since it's a real URL) makes the two of you instant mutual friends (decision 1). */
  function MyQRFullscreen({ code, onClose }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current && window.ChainsQR && code) { ref.current.innerHTML = ""; try { ref.current.appendChild(ChainsQR.toCanvas("https://bonnaroo.github.io/chains-app/#add=" + code, 300)); } catch (e) {} }
    }, [code]);
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "var(--ink-900, #0c1410)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 24 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 13, color: "var(--chain-300, #b9c9bf)" }}>Scan to add me on Chains</div>
        <div style={{ padding: 20, background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,.4)" }}><div ref={ref} style={{ width: 300, height: 300 }} /></div>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 34, letterSpacing: ".16em", color: "#fff" }}>{code}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400, #9fb3a6)" }}>Or read the code aloud</div>
        <button onClick={onClose} style={{ marginTop: 8, height: 44, padding: "0 28px", border: "1px solid rgba(255,255,255,.25)", borderRadius: "var(--radius-pill)", background: "transparent", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>Close</button>
      </div>
    );
  }

  /* v490 Friends — one screen: find people (live search), your code / share link,
     requests, suggestions (league-mates you haven't added), and your friends with
     rounds-together counts + one-tap "Score a round". */
  /* v499 — direct-message sheet with a friend. */
  function ChatSheet({ friend, onClose }) {
    const [msgs, setMsgs] = React.useState(null);
    const [text, setText] = React.useState("");
    const me = ChainsFriends.myUid();
    const endRef = React.useRef(null);
    React.useEffect(() => { ChainsChat.markRead(friend.uid); return ChainsChat.watch(friend.uid, (list) => { setMsgs(list); ChainsChat.markRead(friend.uid); setTimeout(() => { try { endRef.current && endRef.current.scrollIntoView({ block: "end" }); } catch (e) {} }, 50); }); }, [friend.uid]);
    const send = () => { const t = text.trim(); if (!t) return; setText(""); ChainsChat.send(friend.uid, t); };
    const day = (at) => { const d = new Date(at); const today = new Date(); return d.toDateString() === today.toDateString() ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
    return (<__Portal>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 215, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 560, height: "82vh", display: "flex", flexDirection: "column", background: "var(--bg-page, #f6f4ee)", borderRadius: "22px 22px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-subtle)", borderRadius: "22px 22px 0 0" }}>
            <Avatar name={friend.name} color={friend.disc} size={34} />
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>{friend.name}</span>
            <button onClick={onClose} style={{ height: 36, padding: "0 10px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ace-700)" }}>Done</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {msgs == null ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", textAlign: "center", marginTop: 20 }}>Loading…</div>
              : msgs.length === 0 ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>Say hi to {String(friend.name || "them").split(" ")[0]} — "Otterburn Saturday?"</div>
              : msgs.map((m, i) => { const mine = m.from === me; const showTime = i === 0 || (m.at - (msgs[i - 1].at || 0)) > 20 * 60000; return (
                <div key={m.id}>
                  {showTime ? <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", margin: "8px 0 4px" }}>{day(m.at)}</div> : null}
                  <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "78%", padding: "9px 13px", borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: mine ? "var(--ace-500)" : "var(--bg-elevated)", color: mine ? "#fff" : "var(--text-strong)", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.35, border: mine ? "none" : "1px solid var(--border-subtle)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.text}</div>
                  </div>
                </div>); })}
            <div ref={endRef} />
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))", background: "var(--bg-elevated)", borderTop: "1px solid var(--border-subtle)" }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={"Message " + String(friend.name || "them").split(" ")[0]} style={{ flex: 1, height: 46, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: 23, fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--bg-sunken)", color: "var(--text-strong)", outline: "none" }} />
            <button onClick={send} disabled={!text.trim()} aria-label="Send" style={{ width: 46, height: 46, borderRadius: "50%", border: "none", background: text.trim() ? "var(--ace-500)" : "var(--bg-sunken)", color: text.trim() ? "#fff" : "var(--text-faint)", cursor: "pointer", fontSize: 18, fontWeight: 800 }}>↑</button>
          </div>
        </div>
      </div></__Portal>
    );
  }
  // v551 — Call-outs: challenge a friend for the week. Best full round this week (to par, any course) wins.
  // callouts/{id} = { from, to, fromName, toName, week, createdAt, status: "open"|"done", winner }
  const ChainsCallouts = (() => {
    const wk = () => { const d = new Date(); const day = (d.getDay() + 6) % 7; const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); return mon.getFullYear() + "-" + String(mon.getMonth() + 1).padStart(2, "0") + "-" + String(mon.getDate()).padStart(2, "0"); };
    const range = (monISO) => { const [y, m, d] = monISO.split("-").map(Number); const iso = (x) => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); return { from: iso(new Date(y, m - 1, d)), to: iso(new Date(y, m - 1, d + 6)) }; };
    let _all = {}, _subs = [], _on = false;
    const emit = () => _subs.forEach((f) => { try { f(); } catch (e) {} });
    function watch() { const d = db(); if (!d || _on) return; _on = true; try { d.ref("callouts").orderByChild("week").startAt(wk()).on("value", (s) => { _all = s.val() || {}; emit(); }, () => { _on = false; }); } catch (e) { _on = false; } }
    function mine() { const me = meKey(); const w = wk(); return Object.keys(_all).map((id) => Object.assign({ id }, _all[id])).filter((c) => c && c.week === w && (c.from === me || c.to === me)); }
    function between(me, other) { return mine().find((c) => (c.from === me && c.to === other) || (c.from === other && c.to === me)) || null; }
    function create(friend) {
      const d = db(), me = meKey(); if (!d || !me || !friend || !friend.uid) return Promise.reject(new Error("Sign in first"));
      if (between(me, friend.uid)) return Promise.resolve({ ok: false, err: "You two already have one on this week." });
      const id = "co-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const rec = { from: me, to: friend.uid, fromName: meName(), toName: friend.name || friend.uid, week: wk(), createdAt: Date.now(), status: "open" };
      return d.ref("callouts/" + id).set(rec).then(() => { notify([friend.uid], meName() + " challenged you this week", "Best full round by Sunday wins. Any course counts. Go throw."); return { ok: true, id }; });
    }
    // scores for a call-out from the shared course board (full rounds this week)
    function score(c, all) {
      const r = range(c.week); const best = {};
      Object.keys(all || {}).forEach((cid) => (all[cid] || []).forEach((rd) => { const dte = String(rd.date || "").slice(0, 10); if (dte < r.from || dte > r.to) return; [c.from, c.to].forEach((k) => { const p = rd.players && rd.players[k]; if (!p || p.total == null || p.full === false) return; if (best[k] == null || p.total < best[k].tp) best[k] = { tp: p.total, course: rd.name, date: dte }; }); }));
      const a = best[c.from] || null, b = best[c.to] || null;
      let lead = null; if (a && b) lead = a.tp < b.tp ? c.from : b.tp < a.tp ? c.to : "tie"; else if (a) lead = c.from; else if (b) lead = c.to;
      return { from: a, to: b, lead, over: new Date().toISOString().slice(0, 10) > r.to };
    }
    function settle(c, sc) { const d = db(); if (!d || !sc.over || c.status === "done") return; d.ref("callouts/" + c.id).update({ status: "done", winner: sc.lead || null, settledAt: Date.now() }).catch(() => {}); }
    return { watch, subscribe: (f) => { _subs.push(f); watch(); return () => { _subs = _subs.filter((x) => x !== f); }; }, mine, between, create, score, settle, week: wk, range };
  })();
  window.ChainsCallouts = ChainsCallouts;
  function CalloutsCard() {
    const [, bump] = React.useState(0);
    const [all, setAll] = React.useState(null);
    React.useEffect(() => ChainsCallouts.subscribe(() => bump((n) => n + 1)), []);
    React.useEffect(() => { let alive = true; if (window.ChainsRounds && ChainsRounds.allCourseStats) ChainsRounds.allCourseStats().then((a) => { if (alive) setAll(a || {}); }).catch(() => {}); return () => { alive = false; }; }, []);
    const me = meKey(); const list = ChainsCallouts.mine();
    if (!list.length) return null;
    const tp = (n) => n > 0 ? "+" + n : n === 0 ? "E" : String(n);
    return (
      <div>
        <div style={T.lbl}>This week's call-outs</div>
        <div style={T.card}>
          {list.map((c, i) => { const sc = all ? ChainsCallouts.score(c, all) : null; if (sc) ChainsCallouts.settle(c, sc); const other = c.from === me ? c.toName : c.fromName; const mineS = sc ? (c.from === me ? sc.from : sc.to) : null, theirs = sc ? (c.from === me ? sc.to : sc.from) : null; const leadTxt = !sc ? "" : sc.lead === "tie" ? "Tied" : sc.lead === me ? "You lead" : sc.lead ? __fn(other) + " leads" : "Nobody's played yet"; return (
            <div key={c.id} style={{ padding: "10px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>You vs {__fn(other)}{c.status === "done" ? <span style={{ fontWeight: 500, color: "var(--text-muted)" }}> · over{c.winner === me ? ", you won" : c.winner === "tie" ? ", tied" : c.winner ? ", " + __fn(other) + " won" : ""}</span> : null}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{sc ? (mineS ? "You " + tp(mineS.tp) + " at " + String(mineS.course).replace(/ disc golf.*$/i, "") : "You: no full round yet") + " · " + (theirs ? __fn(other) + " " + tp(theirs.tp) : __fn(other) + ": nothing yet") + " · " + leadTxt : "Loading…"}</div>
            </div>); })}
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>Best full round by Sunday wins. Any course counts.</div>
        </div>
      </div>
    );
  }
  const __fn = (n) => String(n || "").split(" ")[0];
  // v546 — Groups (bones). Your own group of friends: a name, a code, who's in, what you did together this
  // month, and the group birdie map at the course you all play most. Uses the crews backend
  // (crews/, crewByUser/, crewCodes/). Groups never pool anyone's titles — those stay personal.
  function GroupCard({ mobile }) {
    const TK = window.ChainsTakeover;
    const [g, setG] = React.useState(undefined);
    const [mode, setMode] = React.useState(null);        // "new" | "join"
    const [name, setName] = React.useState("");
    const [code, setCode] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");
    const [month, setMonth] = React.useState(null);
    const me = meKey();
    const load = () => { if (!TK || !TK.crewMine) { setG(null); return; } TK.crewMine().then((c) => setG(c || null)).catch(() => setG(null)); };
    React.useEffect(load, []);
    // this month together: rounds by members, best round, birdie map at the most-played course
    React.useEffect(() => {
      let alive = true; if (!g || !window.ChainsRounds || !ChainsRounds.allCourseStats) return;
      const keys = Object.keys(g.members || {}); const ym = new Date().toISOString().slice(0, 7);
      ChainsRounds.allCourseStats().then((all) => {
        if (!alive) return;
        const perCourse = {}; let rounds = 0, best = null; const byMember = {};
        Object.keys(all || {}).forEach((cid) => (all[cid] || []).forEach((r) => {
          if (String(r.date || "").slice(0, 7) !== ym) return;
          const prs = r.pars ? r.pars : null; let any = false;
          keys.forEach((k) => { const p = r.players && r.players[k]; if (!p) return; any = true; rounds++; byMember[k] = (byMember[k] || 0) + 1; if (p.full !== false && (best == null || p.total < best.tp)) best = { tp: p.total, name: p.name || k, course: r.name };
            if (prs && p.hs) { const pc = perCourse[cid] || (perCourse[cid] = { name: r.name, holes: {}, n: r.holes || prs.length, rounds: 0 }); pc.rounds++; const hs = Array.isArray(p.hs) ? p.hs : Object.values(p.hs); hs.forEach((v, i) => { if (v != null && prs[i] != null && v < prs[i]) pc.holes[i] = pc.holes[i] || (p.name || k); }); } });
        }));
        const top = Object.values(perCourse).sort((a, b) => b.rounds - a.rounds)[0] || null;
        setMonth({ rounds, best, byMember, map: top });
      }).catch(() => {});
      return () => { alive = false; };
    }, [g && g.id]);
    const card = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" };
    const inp = { width: "100%", height: 46, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--text-strong)", background: "var(--bg-elevated)" };
    const act = async (fn) => { setBusy(true); setErr(""); try { const r = await fn(); if (r && r.ok === false) setErr(r.err || "Didn't work."); else { setMode(null); setName(""); setCode(""); load(); } } catch (e) { setErr(String(e && e.message || e)); } setBusy(false); };
    if (g === undefined) return null;
    return (
      <div>
        <div style={T.lbl}>Your group</div>
        {!g ? (
          <div style={card}>
            <div style={{ padding: "12px 14px 4px", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)" }}>You and your friends, as a group: what you played together this month and the holes you've birdied between you. Your own titles stay yours.</div>
            {mode === "new" ? <div style={{ padding: "8px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" maxLength={28} style={inp} /><Button variant="accent" full size="lg" disabled={busy} onClick={() => act(() => TK.crewCreate(name, "#205539", ""))}>{busy ? "Starting…" : "Start the group"}</Button></div>
            : mode === "join" ? <div style={{ padding: "8px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Group code" maxLength={8} style={inp} /><Button variant="accent" full size="lg" disabled={busy} onClick={() => act(() => TK.crewJoin(code))}>{busy ? "Joining…" : "Join"}</Button></div>
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "8px 14px 14px" }}><Button variant="secondary" size="lg" onClick={() => setMode("new")}>Start a group</Button><Button variant="secondary" size="lg" onClick={() => setMode("join")}>Join with a code</Button></div>}
            {err ? <div style={{ padding: "0 14px 12px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--score-over, #c23a33)" }}>{err}</div> : null}
          </div>
        ) : (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>{g.name}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>{Object.keys(g.members || {}).length} in · code <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-strong)" }}>{g.code}</span></div></div>
              <Button variant="secondary" size="md" onClick={() => { const txt = "Join my group \u201c" + g.name + "\u201d on Chains \u2014 code " + g.code + "  " + location.origin + location.pathname; if (navigator.share) navigator.share({ title: g.name, text: txt }).catch(() => {}); else { try { navigator.clipboard.writeText(txt); window.ChainsToast && ChainsToast.show("Copied.", "success"); } catch (e) {} } }}>Share code</Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 12px" }}>{Object.keys(g.members || {}).map((k) => <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px", borderRadius: 999, background: "var(--bg-sunken, #eef2ef)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-strong)" }}><Av m={{ name: (g.members[k] && g.members[k].name) || k, disc: "#7C8882" }} size={22} />{(g.members[k] && g.members[k].name) || k}{k === me ? " (you)" : ""}{month && month.byMember[k] ? <span style={{ color: "var(--text-muted)" }}> · {month.byMember[k]}</span> : null}</span>)}</div>
            {month && (
              <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "10px 14px" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)" }}><b>{month.rounds}</b> group round{month.rounds === 1 ? "" : "s"} this month{month.best ? " · best " + (month.best.tp > 0 ? "+" + month.best.tp : month.best.tp === 0 ? "E" : month.best.tp) + " by " + String(month.best.name).split(" ")[0] : ""}</div>
                {month.map && (() => { const got = Object.keys(month.map.holes).length; const N = month.map.n || 18; return (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 6 }}>Group birdie map at {String(month.map.name).replace(/ disc golf.*$/i, "")} · {got} of {N} holes birdied between you this month{got >= N ? " \u2014 complete" : ""}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>{Array.from({ length: N }, (_, i) => <span key={i} title={month.map.holes[i] || ""} style={{ height: 26, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, background: month.map.holes[i] ? "var(--fairway-600)" : "var(--bg-sunken, #eef2ef)", color: month.map.holes[i] ? "#fff" : "var(--text-faint)" }}>{i + 1}</span>)}</div>
                  </div>); })()}
              </div>
            )}
            <button onClick={() => { if (window.ChainsConfirm) ChainsConfirm.show({ title: "Leave " + g.name + "?", confirmLabel: "Leave" }).then((ok) => { if (ok) TK.crewLeave().then(load); }); }} style={{ width: "100%", padding: "10px 14px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", textAlign: "left" }}>Leave the group</button>
          </div>
        )}
      </div>
    );
  }
  function FriendsSection({ mobile }) {
    const [, force] = React.useState(0);
    const [invite, setInvite] = React.useState(false);
    const [full, setFull] = React.useState(false);
    const [bagFriend, setBagFriend] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [results, setResults] = React.useState(null);
    const [sentTo, setSentTo] = React.useState({});
    const [together, setTogether] = React.useState({});
    const [chat, setChat] = React.useState(null);
    const [, bumpChat] = React.useState(0);
    React.useEffect(() => { if (!window.ChainsChat) return; return ChainsChat.onThreads(() => bumpChat((n) => n + 1)); }, []);
    const avail = window.ChainsFriends && ChainsFriends.available && ChainsFriends.available();
    React.useEffect(function () {
      const fn = () => force((x) => x + 1);
      window.addEventListener("chains:friends", fn);
      return () => window.removeEventListener("chains:friends", fn);
    }, []);
    // rounds played together (from the shared rounds index)
    React.useEffect(function () {
      if (!avail || !window.ChainsRounds || !ChainsRounds.loadGroup) return;
      let alive = true;
      ChainsRounds.loadGroup().then((rs) => { if (!alive) return; const me = ChainsFriends.myUid(); const m = {}; (rs || []).forEach((r) => { if (!r || r.status === "open") return; const keys = r.players ? Object.keys(r.players) : []; if (keys.indexOf(me) < 0) return; keys.forEach((k) => { if (k !== me) m[k] = (m[k] || 0) + 1; }); }); setTogether(m); }).catch(() => {});
      return () => { alive = false; };
    }, [avail]);
    const ql = q.trim();
    React.useEffect(function () {
      if (!avail) return;
      if (ql.length < 2) { setResults(null); return; }
      let alive = true;
      const t = setTimeout(() => {
        const asCode = ql.toUpperCase().replace(/[^A-Z0-9]/g, "");
        Promise.all([
          ChainsFriends.searchByUsername(ql).catch(() => []),
          (asCode.length >= 4 && asCode.length <= 8 && ql === ql.toUpperCase()) ? ChainsFriends.resolveCode(asCode).then((uid) => uid ? ChainsFriends.lookup(uid) : null).catch(() => null) : Promise.resolve(null)
        ]).then(([list, byCode]) => {
          if (!alive) return;
          const out = (list || []).slice();
          if (byCode && byCode.uid && !out.some((x) => x.uid === byCode.uid)) out.unshift(Object.assign({ username: byCode.uid, viaCode: true }, byCode));
          setResults(out.map((p) => { try { const mm = window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(p.uid) : null; return mm ? Object.assign({}, p, { name: mm.name || p.name, disc: mm.disc || p.disc }) : p; } catch (e) { return p; } }));
        });
      }, 220);
      return () => { alive = false; clearTimeout(t); };
    }, [ql, avail]);
    if (!avail) return null;
    const me = ChainsFriends.myUid();
    const code = ChainsFriends.myCode();
    const reqs = ChainsFriends.requests();
    const friends = ChainsFriends.list().map((f) => { const mm = window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(f.uid) : null; return Object.assign({}, f, { name: (mm && mm.name) || f.name, disc: (mm && mm.disc) || f.disc }); }).sort((a, b) => (together[b.uid] || 0) - (together[a.uid] || 0) || a.name.localeCompare(b.name));
    const isFriend = (uid) => ChainsFriends.isFriend(uid);
    const leagueMates = (window.ChainsEngine && ChainsEngine.members ? ChainsEngine.members() : []).filter((m) => m && m.id && m.id !== me && !isFriend(m.id) && !sentTo[m.id]);
    const link = "https://bonnaroo.github.io/chains-app/#add=" + code;
    function add(uid, name) {
      if (!uid) return;
      ChainsFriends.sendRequest(uid); try { ChainsFriends.hydrate(uid); } catch (e) {}
      setSentTo((s) => Object.assign({}, s, { [uid]: true }));
      if (window.ChainsToast) ChainsToast.show("Friend request sent to " + (name || "them") + " — they'll get a notification to accept.");
    }
    const [shareOpen, setShareOpen] = React.useState(false);
    const inviteText = "Join me on Chains — score rounds, trophies, fantasy leagues. Add me with this link: " + link + "  (my friend code is " + code + ")";
    function share() { setShareOpen(true); }
    function shareNative() { setShareOpen(false); if (navigator.share) { navigator.share({ title: "Add me on Chains", text: inviteText, url: link }).catch(function () {}); return; } copyLink(); }
    function copyLink() { setShareOpen(false); try { (window.ChainsCopy ? ChainsCopy(link) : navigator.clipboard.writeText(link)); } catch (e) {} if (window.ChainsToast) ChainsToast.show("Link copied — send it to a friend"); }
    function shareSms() { setShareOpen(false); window.location.href = "sms:?&body=" + encodeURIComponent(inviteText); }
    function shareEmail() { setShareOpen(false); window.location.href = "mailto:?subject=" + encodeURIComponent("Join me on Chains") + "&body=" + encodeURIComponent(inviteText + "\n\nWhen you open the link and make your account, we're friends automatically."); }
    function accept(r) { ChainsFriends.accept(r.uid); if (window.ChainsToast) ChainsToast.show(r.name + " is now your friend"); }
    function decline(r) { ChainsFriends.decline(r.uid); if (window.ChainsToast) ChainsToast.show("Request declined", "info"); }
    function remove(f) { ChainsConfirm.show({ title: "Remove " + f.name + " from friends?", confirmLabel: "Remove", danger: true }).then((ok) => { if (!ok) return; ChainsFriends.remove(f.uid); if (window.ChainsToast) ChainsToast.show(f.name + " removed", "info"); }); }
    function scoreWith(f) { try { localStorage.setItem("chains_play_lastgroup", JSON.stringify([{ id: me, name: "You" }, { id: f.uid, name: f.name, color: f.disc }])); } catch (e) {} try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "play" })); } catch (e) {} }
    const T = {
      h1: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, lineHeight: 1.05, color: "var(--text-strong)" },
      label: { fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)", marginBottom: 8 },
      card: { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" },
      row: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderTop: "1px solid var(--border-subtle)" },
      name: { flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
      sub: { display: "block", fontFamily: "var(--font-sans)", fontWeight: 400, fontSize: 12, color: "var(--text-faint)" },
      pill: (solid) => ({ height: 34, padding: "0 14px", borderRadius: 17, border: solid ? "none" : "1px solid var(--border-default)", background: solid ? "var(--ace-500)" : "var(--bg-elevated)", color: solid ? "#fff" : "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, flexShrink: 0 }),
      icon: { width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", color: "var(--text-faint)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    };
    const personRow = (p, right, key) => (
      <div key={key || p.uid} style={T.row}>
        <Avatar name={p.name} color={p.disc || "#9CA3AF"} size={36} />
        <span style={T.name}>{p.name}{p.username && p.username !== p.name ? <span style={{ fontWeight: 400, color: "var(--text-faint)" }}> @{p.username}</span> : null}{p.sub ? <span style={T.sub}>{p.sub}</span> : null}</span>
        {right}
      </div>
    );
    return (
      <div className="gt-root" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={T.h1}>Friends</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>{friends.length ? friends.length + (friends.length === 1 ? " friend" : " friends") + " · friends see your rounds, play on your card, and show up in leagues you create." : "Friends see your rounds, play on your card, and show up in leagues you create."}</div>
        </div>

        {/* find people */}
        <div>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: 14, color: "var(--text-faint)", display: "inline-flex" }}><Icons.Search size={18} /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find people by username or friend code" style={{ width: "100%", height: 48, padding: "0 16px 0 42px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15.5, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
          </div>
          {results && (
            <div style={Object.assign({}, T.card, { marginTop: 8 })}>
              {results.length === 0 ? <div style={{ padding: "14px", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)" }}>No one named “{ql}” yet. They need a Chains account — share your link below and they'll land as your friend.</div>
                : results.map((p) => personRow(Object.assign({}, p, { sub: p.viaCode ? "matched your friend code" : null }), isFriend(p.uid) ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fairway-700)", fontWeight: 700 }}>✓ Friends</span> : sentTo[p.uid] ? <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Request sent</span> : <button style={T.pill(true)} onClick={() => add(p.uid, p.name)}>Add</button>))}
            </div>
          )}
        </div>

        {/* share */}
        <div style={Object.assign({}, T.card, { padding: 14, display: "flex", alignItems: "center", gap: 14 })}>
          <button onClick={() => setFull(true)} aria-label="Show my QR code" style={{ width: 64, height: 64, borderRadius: 14, border: "1px solid var(--border-subtle)", background: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
            <span ref={(el) => { if (el && window.ChainsQR && code && !el.hasChildNodes()) { try { el.appendChild(ChainsQR.toCanvas(link, 56)); } catch (e) {} } }} style={{ width: 56, height: 56, display: "inline-flex" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Your friend code</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 24, letterSpacing: ".12em", color: "var(--text-strong)", lineHeight: 1.1 }}>{code}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>Scan the QR or send the link — they're added instantly.</div>
          </div>
          <button style={T.pill(true)} onClick={share}>Share</button>
        </div>

        {reqs.length > 0 && (
          <div>
            <div style={T.label}>Friend requests · {reqs.length}</div>
            <div style={T.card}>
              {reqs.map((r, i) => <div key={r.uid} style={Object.assign({}, T.row, i === 0 ? { borderTop: "none" } : {})}>
                <Avatar name={r.name} color="#9CA3AF" size={36} />
                <span style={T.name}>{r.name}<span style={T.sub}>wants to be friends</span></span>
                <button style={T.pill(true)} onClick={() => accept(r)}>Accept</button>
                <button style={T.icon} onClick={() => decline(r)} aria-label="Decline"><Icons.X size={16} /></button>
              </div>)}
            </div>
          </div>
        )}

        {leagueMates.length > 0 && (
          <div>
            <div style={T.label}>In your league · not friends yet</div>
            <div style={T.card}>
              {leagueMates.map((m, i) => <div key={m.id} style={Object.assign({}, T.row, i === 0 ? { borderTop: "none" } : {})}>
                <Avatar name={m.name} color={m.disc || "#9CA3AF"} size={36} />
                <span style={T.name}>{m.name}<span style={T.sub}>Chains league</span></span>
                <button style={T.pill(true)} onClick={() => add(m.id, m.name)}>Add</button>
              </div>)}
            </div>
          </div>
        )}

        {(() => {
          const th = window.ChainsChat ? ChainsChat.threads() : {};
          const rows = Object.keys(th).map((k) => { const f = friends.find((x) => x.uid === k) || { uid: k, name: (ChainsFriends.profile(k) || {}).name || k.charAt(0).toUpperCase() + k.slice(1), disc: (ChainsFriends.profile(k) || {}).disc || "#9CA3AF" }; return Object.assign({ f }, th[k]); }).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 8);
          if (!rows.length) return null;
          return (
            <div>
              <div style={T.label}>Messages</div>
              <div style={T.card}>
                {rows.map((r, i) => (
                  <button key={r.f.uid} onClick={() => setChat(r.f)} style={Object.assign({}, T.row, { border: "none", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer", width: "100%", textAlign: "left" })}>
                    <Avatar name={r.f.name} color={r.f.disc} size={36} />
                    <span style={T.name}>{r.f.name}<span style={Object.assign({}, T.sub, { fontWeight: r.unread ? 700 : 400, color: r.unread ? "var(--text-strong)" : "var(--text-faint)" })}>{(r.from === ChainsFriends.myUid() ? "You: " : "") + (r.last || "")}</span></span>
                    {r.unread ? <span style={{ minWidth: 22, height: 22, padding: "0 7px", borderRadius: 11, background: "var(--ace-700)", color: "#fff", fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{r.unread}</span> : <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>{r.at ? new Date(r.at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
        <div>
          <div style={T.label}>Your friends</div>
          <div style={T.card}>
            {friends.length === 0 ? (
              <div style={{ padding: "22px 16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.5 }}>No friends yet. Search a username above, or share your link.</div>
            ) : friends.map((f, i) => (
              <div key={f.uid} style={Object.assign({}, T.row, i === 0 ? { borderTop: "none" } : {})}>
                <Avatar name={f.name} color={f.disc} size={36} ring />
                <span style={T.name}>{f.name}{window.BadgeChip ? React.createElement(window.BadgeChip, { uid: f.uid }) : null}<span style={T.sub}>{(together[f.uid] || 0) + (together[f.uid] === 1 ? " round together" : " rounds together")}</span></span>
                <button style={Object.assign({}, T.icon, { position: "relative", color: "var(--ace-700)", borderColor: "var(--ace-200, #f5ddd1)" })} onClick={() => setChat(f)} title={"Message " + f.name} aria-label="Message"><Icons.Chat size={18} />{window.ChainsChat && ChainsChat.unreadWith(f.uid) ? <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "var(--ace-700)", color: "#fff", fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{ChainsChat.unreadWith(f.uid)}</span> : null}</button>
                <button style={T.pill(false)} onClick={() => scoreWith(f)} title="Start a round with them">Score</button>
                <button style={T.pill(false)} onClick={() => ChainsCallouts.create(f).then((r) => { if (window.ChainsToast) ChainsToast.show(r.ok ? "Challenge sent — best full round by Sunday wins." : (r.err || "Didn't work."), r.ok ? "success" : "error"); })} title="Challenge them this week">Challenge</button>
                <button style={T.icon} onClick={() => setBagFriend(f)} title={"See " + f.name + "'s bag"} aria-label="See bag"><Icons.Disc size={16} /></button>
                <button style={T.icon} onClick={() => remove(f)} title="Remove friend" aria-label="Remove friend"><Icons.X size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setInvite(true)} style={{ padding: "12px", border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)" }}>More ways to connect — scan a friend's QR, enter a code</button>
        {shareOpen && (
          <__Portal><div onClick={() => setShareOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 520, background: "var(--bg-elevated)", borderRadius: "22px 22px 0 0", paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
              <div style={{ padding: "16px 16px 8px", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 17, color: "var(--text-strong)" }}>Invite a friend</div>
              <div style={{ padding: "0 16px 10px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>They open the link, make an account, and you're friends — no code to type.</div>
              {[[<Icons.Chat size={20} />, "Text message", shareSms], [<Icons.Send size={20} />, "Email", shareEmail], [<Icons.Send size={20} />, "Share…", shareNative], [<Icons.Pin size={20} />, "Copy link", copyLink]].map(([ic, lb, fn]) => (
                <button key={lb} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 16px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--text-strong)" }}><span style={{ fontSize: 20, width: 28 }}>{ic}</span>{lb}</button>
              ))}
            </div>
          </div></__Portal>
        )}
        <CalloutsCard />
        <GroupCard mobile={mobile} />
        {invite && <InviteFriendsModal onClose={() => setInvite(false)} mobile={mobile} />}
        {full && <MyQRFullscreen code={code} onClose={() => setFull(false)} />}
        {chat && window.ChainsChat && <ChatSheet friend={chat} onClose={() => setChat(null)} />}
        {bagFriend && window.FriendBagModal && React.createElement(window.FriendBagModal, { friend: bagFriend, onClose: () => setBagFriend(null), mobile: mobile })}
      </div>
    );
  }

  /* Join a league by typed code — resolves to a leagueId, then the join confirm. */
  function JoinByCode({ mobile }) {
    const [code, setCode] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");
    function go() {
      const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (c.length < 4) { setErr("Enter the 6-character code."); return; }
      setBusy(true); setErr("");
      Promise.resolve(window.ChainsTestData ? ChainsTestData.resolveCode(c) : null).then(function (id) {
        setBusy(false);
        if (!id) { setErr("No league found for that code."); return; }
        setCode("");
        if (window.ChainsToast) ChainsToast.show("League found — confirm to join", "info");
        if (window.ChainsJoin) window.ChainsJoin.prompt(id);
      }).catch(function () { setBusy(false); setErr("Couldn't look that up — try again."); });
    }
    return (
      <div style={{ marginTop: 16 }}>
        <div style={lbl}>Join a league</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") go(); }} placeholder="Enter join code" maxLength={8}
            style={{ flex: 1, minWidth: 0, height: 42, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-mono)", fontWeight: 700, letterSpacing: ".12em", fontSize: 15, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
          <button onClick={go} disabled={busy} style={{ height: 42, padding: "0 18px", border: "none", borderRadius: "var(--radius-md)", background: busy ? "var(--bg-sunken)" : "var(--chain-600, #2563a8)", color: busy ? "var(--text-faint)" : "#fff", cursor: busy ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, flexShrink: 0 }}>{busy ? "…" : "Join"}</button>
        </div>
        {err ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--clay-600, #b4452f)", marginTop: 6 }}>{err}</div> : <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>Got a code or link from a friend? Enter it here to join their league.</div>}
      </div>
    );
  }

  /* create a test league — TWO types only: Classic (untouched) + Bracket (with timing) */
  function CreateTest({ onDone, onBack, mobile }) {
    const [kind, setKind] = React.useState("bracket"); // classic | bracket
    const [timing, setTiming] = React.useState("event"); // event | season (bracket only)
    const [season, setSeason] = React.useState("2024");
    const [isTest, setIsTest] = React.useState(false);
    const [name, setName] = React.useState("New League");
    const [members, setMembers] = React.useState(6);
    const seasons = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"];
    const [length, setLength] = React.useState("single");
    const [customN, setCustomN] = React.useState(3);
    var _meta = (window.ChainsEngine && ChainsEngine.seasonMeta) ? ChainsEngine.seasonMeta() : {};
    var _remaining = Math.max(1, (_meta.total || 22) - (_meta.completed || 0));
    function create() {
      const type = kind === "classic" ? "classic" : "bracket";
      const tm = "per-event";
      var cfg = { name: name.trim() || "New League", type: type, timing: tm, test: isTest, season: isTest ? season : "2026" };
      if (isTest) {
        cfg.members = members;
        cfg.length = "season";
      } else {
        cfg.real = true;
        var u = (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()) || null;
        var uid = u ? u.uid : ((window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || "you");
        var prof = (u && window.ChainsAuth.localProfile) ? ChainsAuth.localProfile(uid) : null;
        var meId = (window.ChainsID && ChainsID.whoami && ChainsID.whoami());
        var meM = (meId && window.ChainsEngine && ChainsEngine.member) ? ChainsEngine.member(meId) : null;
        var dn = (prof && (prof.displayName || prof.name)) || (meM && meM.name) || (u && u.username) || "You";
        var disc = (prof && prof.disc) || (meM && (meM.disc || meM.color)) || "#E8590C";
        cfg.ownerUid = u ? u.uid : null;
        cfg.members = [{ id: uid, name: dn, disc: disc }];
        var nx = (window.ChainsEngine && ChainsEngine.seasonMeta) ? ChainsEngine.seasonMeta() : {};
        cfg.startEventId = ((nx.next || nx.live || {}).t) || null;
        // Windowed season: start at the next event; run a chosen number of tournaments forward.
        if (length === "single") { cfg.length = "single"; }
        else if (length === "rest") { cfg.length = "n"; cfg.count = _remaining; }
        else { cfg.length = "n"; cfg.count = Math.max(1, Math.min(_remaining, customN)); }
      }
      if (window.ChainsTestData) ChainsTestData.create(cfg);
      onDone();
    }
    const KINDS = [
      { k: "classic", label: "Classic", desc: "Exactly how Chains plays now — snake draft, 2 pros each, per tournament. Nothing about it changes." },
      { k: "bracket", label: "Bracket", desc: "Each member independently picks one pro from each rating bracket (5–6 picks). No draft, no turns — overlapping picks are fine." },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title="New league" sub="Private to you — you're the commissioner. Never touches the real standings." onBack={onBack} />
        <div>
          <div style={lbl}>League type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {KINDS.map((t) => {
              const on = t.k === kind;
              return (
                <button key={t.k} onClick={() => setKind(t.k)} style={{ display: "flex", alignItems: "flex-start", gap: 13, textAlign: "left", padding: "14px 15px", borderRadius: "var(--radius-md)", border: "1.5px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer", boxShadow: on ? "var(--shadow-md)" : "var(--shadow-xs)", transition: "box-shadow var(--dur-fast), border-color var(--dur-fast)" }}>
                  <LeagueMark type={t.k} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{t.label}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.45 }}>{t.desc}</div>
                  </div>
                  <span style={{ width: 24, height: 24, flexShrink: 0, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: on ? "var(--fairway-600)" : "transparent", border: on ? "none" : "1.5px solid var(--border-default)", color: "#fff" }}>{on && <Icons.Check size={14} />}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div>
          <div style={lbl}>Length</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: -2, marginBottom: 8 }}><b style={{ color: "var(--text-body)" }}>{_remaining} tournaments left this season</b> — your league starts at the next event and scores forward. Past events are ignored.</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(function () {
              const nx = (window.ChainsEngine && ChainsEngine.seasonMeta) ? ChainsEngine.seasonMeta() : {};
              const nextName = ((nx.next || nx.live || {}).name) || "the next event";
              const opts = [
                { k: "single", title: "Single tournament", sub: "Just " + nextName },
                { k: "rest", title: "Rest of season", sub: _remaining + " events left" },
                { k: "custom", title: "Custom", sub: "Choose how many" },
              ];
              return opts.map((o) => {
                const on = length === o.k;
                return (
                  <button key={o.k} onClick={() => setLength(o.k)}
                    style={{ position: "relative", flex: 1, textAlign: "left", padding: "12px 13px", borderRadius: "var(--radius-md)", border: "1.5px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer", boxShadow: on ? "var(--shadow-md)" : "var(--shadow-xs)", transition: "box-shadow var(--dur-fast)" }}>
                    {on && <span style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: "var(--fairway-600)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Check size={11} /></span>}
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 12.5, color: "var(--text-strong)" }}>{o.title}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{o.sub}</div>
                  </button>
                );
              });
            })()}
          </div>
          {length === "custom" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Run <b style={{ color: "var(--text-body)" }}>{Math.max(1, Math.min(_remaining, customN))}</b> tournament{customN > 1 ? "s" : ""} — ends after that.</div>
              <input type="range" min={1} max={_remaining} value={Math.min(_remaining, customN)} onChange={(e) => setCustomN(+e.target.value)} style={{ width: "100%", accentColor: "var(--fairway-600)" }} />
            </div>
          )}
        </div>
        <div>
          <div style={lbl}>Season</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "10px 13px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--fairway-500)", flexShrink: 0 }}></span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>Plays the <b style={{ color: "var(--text-body)" }}>live 2026 season</b> — real results as events finish.</span>
          </div>
        </div>
        <div>
          <div style={lbl}>Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
        </div>
        <div>
          <div style={lbl}>Members</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "11px 13px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px dashed var(--border-default)" }}>
            <span style={{ width: 15, height: 15, color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }}><Icons.Lock size={15} /></span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>Starts with just <b style={{ color: "var(--text-muted)" }}>you</b> as commissioner. Add players by name from the league's settings after it's created — pick the number as you go. Account-based invites arrive with the next update.</span>
          </div>
        </div>
        <button onClick={create} style={{ padding: "14px", borderRadius: "var(--radius-md)", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 15, boxShadow: "0 3px 12px rgba(216,93,42,.28)" }}>Create league</button>
      </div>
    );
  }

  // Compact rated field for the bracket draft (enough to fill 6 brackets).
  const RFIELD = [["Anthony Barela",1077],["Ezra Robinson",1074],["Gannon Buhr",1074],["Simon Lizotte",1067],["Ezra Aderhold",1067],["Richard Wysocki",1065],["Calvin Heimburg",1064],["Niklas Anttila",1063],["Aaron Gossage",1061],["Cole Redalen",1055],["Isaac Robinson",1053],["Adam Hammes",1050],["Joseph Anderson",1049],["Gavin Babcock",1048],["Jake Monn",1048],["Jesse Nieminen",1046],["Silas Schultz",1045],["Bradley Williams",1041],["Eagle McMahon",1041],["Linus Carlsson",1041],["Matt Bell",1040],["Mauri Villmann",1040],["Noah Meintsma",1039],["Vaino Makela",1038],["James Conrad",1037],["Eli Swansen",1036],["Harper Thompson",1035],["Raven Newsom",1033],["Andrew Miranda",1032],["Nestori Tuhkanen",1031],["Nikko Locastro",1028],["Teemu Talikainen",1027],["Clay Edwards",1024],["Harry Chace",1023],["Elias Gripler",1022],["Ryan Monn",1018],["Ville Parpala",1016],["Eetu Salomaki",1011]].map((p) => ({ n: p[0], r: p[1] }));

  /* "Invite a friend" — tap a friend and the commissioner adds them to the league. */
  function InviteFriendRow({ league }) {
    const [, force] = React.useState(0);
    React.useEffect(function () { const fn = () => force((x) => x + 1); window.addEventListener("chains:friends", fn); window.addEventListener("chains:remote-update", fn); return () => { window.removeEventListener("chains:friends", fn); window.removeEventListener("chains:remote-update", fn); }; }, []);
    const avail = window.ChainsFriends && ChainsFriends.available && ChainsFriends.available();
    if (!avail) return null;
    const fresh = (window.ChainsTestData ? ChainsTestData.loadTest().find(function (x) { return x.id === league.id; }) : null) || league;
    const friends = ChainsFriends.list();
    const inLeague = {};
    (fresh.members || []).forEach(function (m) { inLeague[m.id] = true; });
    const addable = friends.filter(function (f) { return !inLeague[f.uid]; });
    function add(f) {
      if (!(window.ChainsTestData && ChainsTestData.addMemberByUid)) return;
      ChainsTestData.addMemberByUid(league.id, f.uid, f.name, f.disc);
      if (window.ChainsNotify) try { ChainsNotify.post({ type: "league_invite", title: "Added to a league", body: "You're in \"" + league.name + "\".", audience: f.uid }); } catch (er) {}
      if (window.ChainsToast) ChainsToast.show(f.name + " added to the league");
      try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {}
      force((x) => x + 1);
    }
    return (
      <div>
        <div style={lbl}>Invite a friend</div>
        {friends.length === 0 ? (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>No friends yet — add some in My Leagues → Friends, then invite them here in one tap.</div>
        ) : addable.length === 0 ? (
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>All your friends are already in this league.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {addable.map(function (f) {
              return (
                <div key={f.uid} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)" }}>
                  <Avatar name={f.name} color={f.disc} size={28} ring />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                  <button onClick={function () { add(f); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", border: "none", borderRadius: "var(--radius-pill)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11, flexShrink: 0 }}><span style={{ width: 12, height: 12, display: "inline-flex" }}><Icons.Plus size={12} /></span> Add</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* Commissioner invite panel — join code + link + offline QR + share. */
  function InvitePanel({ league, mobile }) {
    const code = window.ChainsTestData ? ChainsTestData.codeFor(league.id) : "";
    const link = "https://bonnaroo.github.io/chains-app/#join=" + league.id;
    const qrRef = React.useRef(null);
    const [copied, setCopied] = React.useState("");
    React.useEffect(function () {
      if (qrRef.current && window.ChainsQR) {
        qrRef.current.innerHTML = "";
        try { qrRef.current.appendChild(ChainsQR.toCanvas(link, mobile ? 148 : 164)); } catch (e) {}
      }
    }, [link, mobile]);
    function copy(text, what) { try { (window.ChainsCopy ? ChainsCopy(text) : Promise.resolve()).catch(function () {}); } catch (e) {} setCopied(what); setTimeout(function () { setCopied(""); }, 1500); if (window.ChainsToast) ChainsToast.show(what === "code" ? "Join code copied" : "Invite link copied"); }
    function share() {
      if (navigator.share) { navigator.share({ title: "Join " + league.name + " on Chains", text: 'Join my league "' + league.name + '" — code ' + code, url: link }).catch(function () {}); }
      else copy(link, "link");
    }
    var chipBtn = { height: 32, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11, color: "var(--text-strong)", flexShrink: 0 };
    return (
      <Card pad={0}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: "var(--radius-sm)", background: "var(--fairway-100, #dff0e6)", color: "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Users size={15} /></span><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>Invite players</span></div>
        <div style={{ padding: mobile ? 14 : 18, display: "flex", flexDirection: mobile ? "column" : "row", gap: 18, alignItems: mobile ? "center" : "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <div ref={qrRef} style={{ width: mobile ? 148 : 164, height: mobile ? 148 : 164, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>Scan to join</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 0, width: "100%" }}>
            <div>
              <div style={lbl}>Join code</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 26, letterSpacing: ".16em", color: "var(--fairway-700)" }}>{code}</span>
                <button onClick={function () { copy(code, "code"); }} style={chipBtn}>{copied === "code" ? "Copied" : "Copy"}</button>
              </div>
            </div>
            <div>
              <div style={lbl}>Join link</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input readOnly value={link} onFocus={function (e) { e.target.select(); }} style={{ flex: 1, minWidth: 0, height: 38, padding: "0 10px", border: "1px solid var(--border-default)", borderRadius: 8, background: "var(--bg-sunken)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }} />
                <button onClick={function () { copy(link, "link"); }} style={chipBtn}>{copied === "link" ? "Copied" : "Copy"}</button>
              </div>
            </div>
            <button onClick={share} style={{ height: 42, border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 15, height: 15, display: "inline-flex" }}><Icons.Plus size={15} /></span> Share invite</button>
            {React.createElement(InviteFriendRow, { league: league })}
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>Friends open the link, or type the code in <b style={{ color: "var(--text-muted)" }}>My Leagues → Join a league</b>. They land here once they tap Join.</div>
          </div>
        </div>
      </Card>
    );
  }

  /* Add-member sheet — opens from a league's "+ Add member": tap a friend to add
     them instantly, add a non-account player by name, or point to the share invite. */
  function AddMemberSheet({ league, mobile, onClose }) {
    const [, force] = React.useState(0);
    const [name, setName] = React.useState("");
    React.useEffect(function () { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
    const avail = window.ChainsFriends && ChainsFriends.available && ChainsFriends.available();
    const fresh = (window.ChainsTestData ? ChainsTestData.loadTest().find(function (x) { return x.id === league.id; }) : null) || league;
    const inLeague = {}; (fresh.members || []).forEach(function (m) { inLeague[m.id] = true; });
    const friends = avail ? ChainsFriends.list() : [];
    const addable = friends.filter(function (f) { return !inLeague[f.uid]; });
    function addFriend(f) {
      if (!(window.ChainsTestData && ChainsTestData.addMemberByUid)) return;
      ChainsTestData.addMemberByUid(league.id, f.uid, f.name, f.disc);
      if (window.ChainsNotify) try { ChainsNotify.post({ type: "league_invite", title: "Added to a league", body: "You're in \"" + league.name + "\".", audience: f.uid }); } catch (e) {}
      if (window.ChainsToast) ChainsToast.show(f.name + " added to " + league.name);
      try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {}
      force((x) => x + 1);
    }
    function addByName() {
      const nm = name.trim(); if (!nm) return;
      if (window.ChainsTestData) ChainsTestData.addMember(league.id, nm);
      if (window.ChainsToast) ChainsToast.show(nm + " added");
      setName(""); try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {}
      force((x) => x + 1);
    }
    return ReactDOM.createPortal(
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "rgba(12,22,15,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", animation: "chains-fade .2s var(--ease-out) both" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: mobile ? "none" : 440, background: "var(--bg-page)", borderRadius: mobile ? "20px 20px 0 0" : "var(--radius-lg)", padding: mobile ? "10px 16px calc(20px + env(safe-area-inset-bottom, 0px))" : "20px", boxShadow: "0 -10px 40px rgba(0,0,0,.3)", animation: "chains-rise .26s var(--ease-out) both", maxHeight: "84vh", overflowY: "auto" }}>
          {mobile && <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border-default)", margin: "4px auto 14px" }} />}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)", lineHeight: 1 }}>Add member</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>to {league.name}</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.X size={16} /></button>
          </div>

          <div style={{ ...lbl, marginBottom: 8 }}>Your friends</div>
          {!avail ? (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", lineHeight: 1.5, marginBottom: 18 }}>Sign in to add friends, then invite them here in one tap.</div>
          ) : friends.length === 0 ? (
            <div style={{ padding: "16px", textAlign: "center", borderRadius: "var(--radius-md)", background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)", marginBottom: 18 }}>
              <span style={{ display: "inline-flex", width: 40, height: 40, borderRadius: "50%", background: "var(--fairway-100)", color: "var(--fairway-700)", alignItems: "center", justifyContent: "center", marginBottom: 9 }}><Icons.Users size={20} /></span>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>No friends yet. Add friends from <b style={{ color: "var(--text-body)" }}>My Leagues → Friends</b>, then they show up here to add in a tap.</div>
            </div>
          ) : addable.length === 0 ? (
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", marginBottom: 18 }}>All {friends.length} of your friends are already in this league. 🎉</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
              {addable.map(function (f) {
                return (
                  <div key={f.uid} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
                    <Avatar name={f.name} color={f.disc} size={30} ring />
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                    <button onClick={function () { addFriend(f); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, padding: "0 15px", border: "none", borderRadius: "var(--radius-pill)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5, flexShrink: 0 }}><span style={{ width: 13, height: 13, display: "inline-flex" }}><Icons.Plus size={13} /></span> Add</button>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px" }}>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10, color: "var(--text-faint)" }}>or by name</span>
            <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addByName(); }} placeholder="Add a player by name" maxLength={24}
              style={{ flex: 1, minWidth: 0, height: 42, padding: "0 13px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
            <button onClick={addByName} disabled={!name.trim()} style={{ height: 42, padding: "0 18px", border: "none", borderRadius: "var(--radius-md)", background: name.trim() ? "var(--fairway-600)" : "var(--bg-sunken)", color: name.trim() ? "#fff" : "var(--text-faint)", cursor: name.trim() ? "pointer" : "default", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, flexShrink: 0 }}>Add</button>
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 10, lineHeight: 1.5 }}>Not on Chains yet? Close this and tap <b style={{ color: "var(--text-muted)" }}>Share invite</b> on the league to send a join code or QR.</div>
        </div>
      </div>,
      document.body
    );
  }

  /* test league detail — interactive draft you can play with */
  function TestDetail({ league, all, onSwitch, onBack, onDelete, onRename, mobile }) {
    const others = (all || []).filter((l) => l.id !== league.id);
    const [, force] = React.useState(0);
    const [addOpen, setAddOpen] = React.useState(false);
    React.useEffect(function () { const fn = () => force((x) => x + 1); window.addEventListener("chains:remote-update", fn); window.addEventListener("chains:friends", fn); return () => { window.removeEventListener("chains:remote-update", fn); window.removeEventListener("chains:friends", fn); }; }, []);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title={league.name} sub={TYPE_LABEL[league.type] ? TYPE_LABEL[league.type] + " · " + league.season + " season" : (league.type === "money" ? "Money Pool" : "") + " · " + league.season + " season"} onBack={onBack} />
        {(all && all.length > 1) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: "var(--text-muted)" }}>Viewing</span>
            <select value={league.id} onChange={(e) => { const l = (all || []).find((x) => x.id === e.target.value); if (l) onSwitch(l); }}
              style={{ height: 36, padding: "0 12px", border: "1px solid var(--fairway-500)", borderRadius: "var(--radius-pill)", background: "var(--fairway-50)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12, color: "var(--fairway-700)", outline: "none", cursor: "pointer" }}>
              {(all || []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)" }}>switch league — the screen re-points</span>
          </div>
        )}
        <div style={{ padding: "11px 16px", borderRadius: "var(--radius-md)", background: "var(--gold-50, #fbf6e9)", border: "1px solid var(--gold-300, #e6cf86)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--gold-800, #8a6d12)", fontWeight: 600 }}>Test league — private to you. Nothing here affects the real Chains standings. Play with it freely.</div>
        {(function () {
          const fr = (window.ChainsTestData ? ChainsTestData.loadTest().find(function (x) { return x.id === league.id; }) : null) || league;
          const st = (fr.standings || []).slice(0, 4);
          const unit = fr.scoring === "cumulative-down" ? "down" : "pts";
          const tl = fr.type === "classic" ? "Classic · per tournament" : fr.timing === "season-long" ? "Bracket · season-long" : fr.length === "single" ? "Bracket · single tournament" : fr.length === "n" ? ("Bracket · " + (fr.count || 3) + " tournaments") : "Bracket · per tournament";
          return (
            <Card pad={0}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>Standings</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--text-muted)" }}>{tl}</span>
              </div>
              {st.length === 0 ? <div style={{ padding: "12px 16px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>No results yet.</div> : st.map(function (m, i) {
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                    <span style={{ width: 18, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 ? "var(--gold-600, #b8860b)" : "var(--text-faint)" }}>{i + 1}</span>
                    <Avatar name={m.name} color={m.disc} size={22} />
                    <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{m.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{(unit === "down" ? m.down : m.points)} {unit}</span>
                  </div>
                );
              })}
            </Card>
          );
        })()}
        {(function () {
          const commish = window.ChainsID && ChainsID.isCommishOf(league);
          return commish ? React.createElement(InvitePanel, { league: league, mobile: mobile }) : null;
        })()}
        {(function () {
          const commish = window.ChainsID && ChainsID.isCommishOf(league);
          const fresh = (window.ChainsTestData ? (ChainsTestData.loadTest().find(function (x) { return x.id === league.id; })) : null) || league;
          const mem = fresh.members || [];
          return (
            <Card pad={0}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>Members · {mem.length}</div>
              {mem.map(function (m) {
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 15px", borderTop: "1px solid var(--border-subtle)" }}>
                    <Avatar name={m.name} color={m.disc} size={26} />
                    <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" }}>{m.name}</span>
                    {commish && mem.length > 2 ? <button onClick={function () { if (window.ChainsTestData) ChainsTestData.removeMember(league.id, m.id); }} title="Remove" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", color: "var(--clay-600, #b4452f)", fontWeight: 700, fontSize: 15 }}>×</button> : null}
                  </div>
                );
              })}
              {commish ? <button onClick={function () { setAddOpen(true); }} style={{ width: "100%", padding: "11px", border: "none", borderTop: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--fairway-600)" }}>+ Add member</button> : <div style={{ padding: "10px 15px", borderTop: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Only the commissioner can change the roster.</div>}
            </Card>
          );
        })()}
        <button onClick={() => { try { localStorage.setItem("chains_active_league", league.id); } catch (e) {} try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {} try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "dashboard" })); } catch (e) {} }} style={{ padding: "13px", borderRadius: "var(--radius-md)", border: "none", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14 }}>View this league →</button>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button onClick={() => { ChainsConfirm.prompt({ title: "Rename this league", value: league.name, confirmLabel: "Rename" }).then((nm) => { if (nm != null && onRename) onRename(nm); }); }} style={{ padding: "11px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>Rename league</button>
          <button onClick={() => { ChainsConfirm.show({ title: "Delete this league?", message: "This permanently removes the league and everyone's picks — it can't be undone.", confirmLabel: "Delete league", danger: true }).then((ok) => { if (!ok) return; ChainsConfirm.show({ title: "Delete for good?", message: "Final check — everyone loses this league and its picks.", confirmLabel: "Delete for good", danger: true }).then((ok2) => { if (ok2) onDelete(); }); }); }} style={{ padding: "11px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--clay-600, #b4452f)" }}>Delete league</button>
        </div>
        {addOpen && React.createElement(AddMemberSheet, { league: league, mobile: mobile, onClose: () => setAddOpen(false) })}
      </div>
    );
  }

  function LiveInviteCard({ mobile }) {
    var link = (location.origin + location.pathname).replace(/[^/]*\.html$/, "");
    var qrRef = React.useRef(null);
    var [copied, setCopied] = React.useState(false);
    React.useEffect(function () {
      if (qrRef.current && window.ChainsQR) { qrRef.current.innerHTML = ""; try { qrRef.current.appendChild(ChainsQR.toCanvas(link, mobile ? 152 : 168)); } catch (e) {} }
    }, [link, mobile]);
    function copy() { try { (window.ChainsCopy ? ChainsCopy(link) : Promise.resolve()).catch(function () {}); } catch (e) {} setCopied(true); setTimeout(function () { setCopied(false); }, 1500); if (window.ChainsToast) ChainsToast.show("Link copied"); }
    function share() { if (navigator.share) { navigator.share({ title: "Play Chains with me", text: "Open Chains and tap your name to play.", url: link }).catch(function () {}); } else copy(); }
    var chipBtn = { height: 36, padding: "0 14px", border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, flexShrink: 0 };
    return (
      <Card pad={0}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 26, height: 26, borderRadius: "var(--radius-sm)", background: "var(--fairway-100, #dff0e6)", color: "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Users size={15} /></span><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>Invite your crew</span></div>
        <div style={{ padding: mobile ? 14 : 18, display: "flex", flexDirection: mobile ? "column" : "row", gap: 16, alignItems: mobile ? "center" : "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <div ref={qrRef} style={{ width: mobile ? 152 : 168, height: mobile ? 152 : 168, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" }}>Scan to open Chains</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0, width: "100%" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>Send your crew this link (or the QR). They open it, <b style={{ color: "var(--text-body)" }}>tap their name</b>, and they're in with their season — no password.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input readOnly value={link} onFocus={function (e) { e.target.select(); }} style={{ flex: 1, minWidth: 0, height: 40, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: 8, background: "var(--bg-sunken)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }} />
              <button onClick={copy} style={{ height: 40, padding: "0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5, color: "var(--text-strong)", flexShrink: 0 }}>{copied ? "Copied" : "Copy"}</button>
            </div>
            <button onClick={share} style={Object.assign({}, chipBtn, { height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13 })}><span style={{ width: 15, height: 15, display: "inline-flex" }}><Icons.Plus size={15} /></span> Share invite</button>
          </div>
        </div>
      </Card>
    );
  }

  function FlowHead({ title, sub, onBack }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ display: "inline-flex", transform: "rotate(180deg)" }}><Icons.ChevRight size={18} /></span></button>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1 }}>{title}</div>
          {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    );
  }

  const lbl = { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 };
  const inp = { width: "100%", height: 42, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" };
  const chip = { display: "inline-block", background: "var(--chain-500)", color: "#fff", borderRadius: "var(--radius-pill)", padding: "3px 10px", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600 };

  /* ---- v508 course leagues ---- */

  const DAY = 86400000;
  const FORMATS = [
    ["best", "Best round", "Lowest single round wins"],
    ["avg", "Best average", "Average of every round you play"],
    ["rounds", "Most rounds", "Play the most rounds in the window"],
    ["best3", "Best 3 rounds", "Your three best rounds added up"],
    ["handicap", "Handicap", "Net score: your round minus a handicap from your history here — beginners can win"],
    ["weekly", "Weekly", "One league night a week; your best round each week counts, best weeks added up"],
  ];
  // v530 — weekly leagues: schedule = { day: 0-6 (Sun-Sat), time: "6:00 pm", weeks: N, firstAt: ISO, countBest: N, dayOnly: bool }
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const addDays = (iso, n) => { const [y, m, d] = String(iso).split("-").map(Number); return dayISO(new Date(y, m - 1, d + n).getTime()); };
  function nextDayOf(day) { const t = new Date(); let n = (day - t.getDay() + 7) % 7; if (n === 0) n = 7; return dayISO(t.getTime() + n * DAY); }
  function weeksOf(l) {
    const sc = l && l.schedule; if (!sc || !sc.firstAt || !sc.weeks) return [];
    const out = []; for (let i = 0; i < sc.weeks; i++) { const from = addDays(sc.firstAt, i * 7); out.push({ n: i + 1, from, to: sc.dayOnly ? from : addDays(from, 6), night: from }); }
    return out;
  }
  function currentWeek(l) { const t = todayISO(); return weeksOf(l).find((w) => t >= w.from && t <= w.to) || null; }
  const DIVISIONS = [["open", "Open", 900], ["intermediate", "Intermediate", 850], ["rec", "Recreational", 0]];
  function divisionFor(rating) { if (rating == null) return "rec"; return rating >= 900 ? "open" : rating >= 850 ? "intermediate" : "rec"; }
  const divLabel = (id) => (DIVISIONS.find((d) => d[0] === id) || DIVISIONS[2])[1];
  function myRatingP() { try { if (!window.ChainsRounds || !window.playerRatingFor) return Promise.resolve(null); return ChainsRounds.loadMine().then((rs) => (playerRatingFor(rs, meKey()) || {}).rating).catch(() => null); } catch (e) { return Promise.resolve(null); } }
  function weeklyStandings(l, board) {
    const weeks = weeksOf(l); const by = {};
    const want = Math.max(1, Math.min(l.schedule.countBest || weeks.length, weeks.length));
    Object.keys(l.members || {}).forEach((k) => { by[k] = { key: k, name: l.members[k].name || k, disc: l.members[k].disc, division: l.members[k].division || null, weeks: {}, rounds: 0, birdies: 0, sum: 0 }; });
    (board || []).forEach((r) => {
      const dte = String(r.date || "").slice(0, 10); const w = weeks.find((x) => dte >= x.from && dte <= x.to); if (!w) return;
      if (l.verifiedOnly && !isVerified(r)) return;
      Object.keys(r.players || {}).forEach((k) => { const e = by[k]; const p = r.players[k]; if (!e || !p || p.total == null) return; if (p.full === false && !(l.holes && p.played >= l.holes)) return; e.rounds++; e.sum += p.total; e.birdies += p.birdies || 0; const cur = e.weeks[w.n]; if (cur == null || p.total < cur) e.weeks[w.n] = p.total; });
    });
    const points = l.schedule.scoring === "points";
    if (points) {
      // v536 — points per week: 1st 10 · 2nd 8 · 3rd 6 · 4th 5 · 5th 4 · everyone else who played 3 (ties share the higher place)
      const PTS = [10, 8, 6, 5, 4];
      weeks.forEach((w) => {
        const played = Object.values(by).filter((e) => e.weeks[w.n] != null).sort((a, b) => a.weeks[w.n] - b.weeks[w.n]);
        let place = 0; played.forEach((e, i) => { if (i === 0 || e.weeks[w.n] !== played[i - 1].weeks[w.n]) place = i; (e.pts = e.pts || {})[w.n] = PTS[place] != null ? PTS[place] : 3; });
      });
    }
    const rows = Object.values(by).map((e) => { const played = Object.values(e.weeks).sort((a, b) => a - b); e.weeksPlayed = played.length; e.avg = e.rounds ? e.sum / e.rounds : null; e.best = played.length ? played[0] : null;
      if (points) { const ps = Object.values(e.pts || {}).sort((a, b) => b - a); e.counted = ps.slice(0, want); e.season = e.counted.length ? e.counted.reduce((a, b) => a + b, 0) : null; e.complete = e.counted.length >= want; }
      else { e.counted = played.slice(0, want); e.season = e.counted.length ? e.counted.reduce((a, b) => a + b, 0) : null; e.complete = e.counted.length >= want; }
      return e; });
    if (points) rows.sort((a, b) => (b.season == null ? -1 : b.season) - (a.season == null ? -1 : a.season) || (a.best == null ? 1e9 : a.best) - (b.best == null ? 1e9 : b.best) || a.name.localeCompare(b.name));
    else rows.sort((a, b) => (b.complete - a.complete) || (b.weeksPlayed > 0) - (a.weeksPlayed > 0) || (a.season == null ? 1e9 : a.season) - (b.season == null ? 1e9 : b.season) || b.weeksPlayed - a.weeksPlayed || a.name.localeCompare(b.name));
    return rows;
  }
  // Reminder the day before (and the morning of) league night — a bell note to yourself, once per week.
  function remindMe(list) {
    try {
      const me = meKey(); if (!me || !window.ChainsNotify || !ChainsNotify.post) return;
      const t = todayISO(), tm = addDays(t, 1);
      (list || []).forEach((l) => {
        if (!l.schedule || !(l.members && l.members[me])) return;
        const w = weeksOf(l).find((x) => x.night === t || x.night === tm); if (!w) return;
        const key = "chains_league_remind:" + l.id + ":" + w.n; if (localStorage.getItem(key)) return; localStorage.setItem(key, "1");
        const when = w.night === t ? "tonight" : "tomorrow"; const short = String(l.courseName || "").replace(/ disc golf.*$/i, "");
        ChainsNotify.post({ id: "n-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type: "league", title: l.name + " is " + when, body: "Week " + w.n + " of " + l.schedule.weeks + " at " + short + (l.schedule.time ? " · " + l.schedule.time : "") + ". Score it in Chains and it counts.", audience: [me], link: "myleagues" });
      });
    } catch (e) {}
  }
  // Handicap = 80% of your average over par from your last 5 full rounds at the course (0 = scratch / no history)
  function hcpFor(board, key) { const rs = (board || []).filter((r) => r.players && r.players[key] && r.players[key].total != null).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5); if (!rs.length) return 0; const avg = rs.reduce((a, r) => a + r.players[key].total, 0) / rs.length; return Math.max(0, Math.round(avg * 0.8 * 10) / 10); }
  const isVerified = (r) => Object.keys(r.players || {}).filter((k) => !/^guest/.test(k)).length >= 2;
  const fmtLabel = (f) => (FORMATS.find((x) => x[0] === f) || FORMATS[0])[1];
  const safe = (s) => String(s == null ? "" : s).replace(/[.#$\[\]\/]/g, "_");
  function db() { try { return (window.ChainsFB && ChainsFB.ok) ? ChainsFB.db : null; } catch (e) { return null; } }
  function meKey() { try { return (window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; } catch (e) { return null; } }
  function meUid() { try { const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); return u ? u.uid : null; } catch (e) { return null; } }
  function meName() { try { const k = meKey(); const m = window.ChainsEngine && ChainsEngine.member && ChainsEngine.member(k); if (m && m.name) return m.name; const p = window.ChainsFriends && ChainsFriends.myProfile && ChainsFriends.myProfile(); if (p && p.name) return p.name; return k ? k.charAt(0).toUpperCase() + k.slice(1) : "Someone"; } catch (e) { return "Someone"; } }
  function meDisc() { try { const k = meKey(); const m = window.ChainsEngine && ChainsEngine.member && ChainsEngine.member(k); return (m && m.disc) || "#9CA3AF"; } catch (e) { return "#9CA3AF"; } }
  function notify(keys, title, body) {
    try { const me = meKey(); const aud = (keys || []).filter((k) => k && k !== me); if (aud.length && window.ChainsNotify && ChainsNotify.post) ChainsNotify.post({ id: "n-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type: "league", title: title, body: body, audience: aud, link: "myleagues" }); } catch (e) {}
  }
  const dayISO = (t) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const niceDate = (iso) => { try { const [y, m, d] = String(iso).split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); } catch (e) { return iso; } };
  const todayISO = () => dayISO(Date.now());
  function status(l) {
    const t = todayISO(); if (!l) return "open";
    const n = Object.keys(l.members || {}).length;
    if (l.minPlayers > 0 && n < l.minPlayers) { if (l.signupBy && t > l.signupBy) return "cancelled"; return "signup"; }
    if (l.endAt && t > l.endAt) return "ended"; if (l.startAt && t < l.startAt) return "upcoming"; return "open";
  }
  function daysLeft(l) { try { const [y, m, d] = String(l.endAt).split("-").map(Number); const end = new Date(y, m - 1, d, 23, 59, 59).getTime(); return Math.max(0, Math.ceil((end - Date.now()) / DAY)); } catch (e) { return 0; } }

  let _all = {}, _subs = [], _watching = false;
  function emit() { _subs.forEach((f) => { try { f(); } catch (e) {} }); }
  function watch() {
    const d = db(); if (!d || _watching) return; _watching = true;
    try { d.ref("courseLeagues").on("value", (s) => { _all = s.val() || {}; emit(); try { remindMe(mine()); } catch (e) {} }, () => { _watching = false; }); } catch (e) { _watching = false; }
  }
  function all() { return Object.keys(_all).map((id) => Object.assign({ id }, _all[id])).filter((l) => l && l.name); }
  function mine() { const k = meKey(), u = meUid(); return all().filter((l) => (k && l.members && l.members[k]) || (u && l.owner === u)).sort((a, b) => String(b.createdAt || 0) - String(a.createdAt || 0)); }
  function open() { const k = meKey(); return all().filter((l) => l.public && status(l) !== "ended" && !(k && l.members && l.members[k])); }
  function isOwner(l) { const u = meUid(); return !!(l && u && l.owner === u); }
  function genCode() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)]; return c; }

  function create(o) {
    const d = db(), k = meKey(), u = meUid();
    if (!d || !k || !u) return Promise.reject(new Error("Sign in first"));
    const id = "cl-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const code = genCode();
    const members = {}; members[k] = { name: meName(), disc: meDisc(), uid: u, joinedAt: Date.now(), role: "owner" };
    (o.invitees || []).forEach((f) => { if (f && f.uid && f.uid !== k) members[f.uid] = { name: f.name || f.uid, disc: f.disc || "#9CA3AF", joinedAt: Date.now(), invitedBy: k }; });
    const rec = { name: String(o.name || "").trim().slice(0, 40) || (o.course.name + " league"), courseId: o.course.id, courseName: o.course.name, parTotal: o.course.par_total || o.course.parTotal || null, holes: o.course.holes || 18,
      format: o.format || "best", startAt: o.startAt || todayISO(), endAt: o.endAt, public: !!o.public, owner: u, ownerKey: k, ownerName: meName(), code: code, createdAt: Date.now(), members: members,
      minPlayers: o.minPlayers > 0 ? Number(o.minPlayers) : 0, signupBy: o.signupBy || null, finalAt: o.finalAt || null, judge: String(o.judge || "").trim().slice(0, 40) || null, acePot: !!o.acePot, verifiedOnly: !!o.verifiedOnly,
      schedule: o.schedule || null, divisions: !!o.divisions };
    if (rec.schedule) { rec.format = "weekly"; rec.startAt = rec.schedule.firstAt; rec.endAt = addDays(rec.schedule.firstAt, (rec.schedule.weeks - 1) * 7 + (rec.schedule.dayOnly ? 0 : 6)); }
    if (rec.format === "handicap" && o.board) Object.keys(members).forEach((mk) => { members[mk].hcp = hcpFor(o.board, mk); });
    const divP = rec.divisions ? myRatingP() : Promise.resolve(null);
    return divP.then((rt) => { if (rec.divisions) members[k].division = divisionFor(rt); const upd = {}; upd["courseLeagues/" + id] = rec; upd["courseLeagueCodes/" + code] = id; return d.ref().update(upd); }).then(() => {
      const inv = Object.keys(members).filter((x) => x !== k);
      notify(inv, meName() + " added you to " + rec.name, rec.courseName + " · " + (rec.schedule ? "every " + DAYS_SHORT[rec.schedule.day] + (rec.schedule.time ? " " + rec.schedule.time : "") + " for " + rec.schedule.weeks + " weeks from " + niceDate(rec.schedule.firstAt) : fmtLabel(rec.format) + " · play by " + niceDate(rec.endAt)) + ". Any round you score there counts.");
      return Object.assign({ id }, rec);
    });
  }
  function join(id) {
    const d = db(), k = meKey(), u = meUid(); if (!d || !k) return Promise.reject(new Error("Sign in first"));
    const l = _all[id]; if (!l) return Promise.reject(new Error("League not found"));
    const memberRec = { name: meName(), disc: meDisc(), uid: u, joinedAt: Date.now() };
    const withHcp = l.format === "handicap" && window.ChainsRounds && ChainsRounds.courseBoard ? ChainsRounds.courseBoard(l.courseId).then((b) => { memberRec.hcp = hcpFor(b, k); }).catch(() => {}) : Promise.resolve();
    const withDiv = l.divisions ? myRatingP().then((rt) => { memberRec.division = divisionFor(rt); }) : Promise.resolve();
    return withHcp.then(() => withDiv).then(() => d.ref("courseLeagues/" + id + "/members/" + k).set(memberRec)).then(() => {
      notify([l.ownerKey], meName() + " joined " + l.name, "They’re on the board at " + l.courseName + " now.");
      const n = Object.keys(l.members || {}).length + 1;
      if (l.minPlayers > 0 && n === l.minPlayers) notify(Object.keys(l.members || {}).concat([k]), l.name + " is on!", n + " signed up — it runs " + niceDate(l.startAt) + " to " + niceDate(l.endAt) + " at " + l.courseName.replace(/ disc golf.*$/i, "") + ". Go play.");
      return true;
    });
  }
  function joinByCode(code) {
    const d = db(); const c = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); if (!d || c.length < 4) return Promise.resolve({ ok: false, err: "Enter the 6-character league code." });
    return d.ref("courseLeagueCodes/" + c).get().then((s) => { const id = s.val(); if (!id || !_all[id]) return { ok: false, err: "That code doesn’t match a course league." }; return join(id).then(() => ({ ok: true, id })); }).catch(() => ({ ok: false, err: "Couldn’t join — try again." }));
  }
  function leave(id) { const d = db(), k = meKey(); if (!d || !k) return Promise.resolve(false); return d.ref("courseLeagues/" + id + "/members/" + k).remove().then(() => true).catch(() => false); }
  function addMembers(id, list) {
    const d = db(), k = meKey(); const l = _all[id]; if (!d || !l) return Promise.resolve(false);
    const upd = {}; const keys = [];
    (list || []).forEach((f) => { if (f && f.uid && !(l.members && l.members[f.uid])) { upd["courseLeagues/" + id + "/members/" + f.uid] = { name: f.name || f.uid, disc: f.disc || "#9CA3AF", joinedAt: Date.now(), invitedBy: k }; keys.push(f.uid); } });
    if (!keys.length) return Promise.resolve(true);
    return d.ref().update(upd).then(() => { notify(keys, meName() + " added you to " + l.name, l.courseName + " · play by " + niceDate(l.endAt) + "."); return true; });
  }
  function remove(id) { const d = db(); const l = _all[id]; if (!d || !l) return Promise.resolve(false); const upd = {}; upd["courseLeagues/" + id] = null; if (l.code) upd["courseLeagueCodes/" + l.code] = null; return d.ref().update(upd).then(() => true).catch(() => false); }
  function update(id, patch) { const d = db(); if (!d) return Promise.resolve(false); return d.ref("courseLeagues/" + id).update(patch).then(() => true).catch(() => false); }

  // Standings: every courseStats round at the course inside the window, members only.
  function standings(l, board) {
    if (l && l.format === "weekly" && l.schedule) return weeklyStandings(l, board);
    const by = {};
    const par = l.parTotal;
    (board || []).forEach((r) => {
      const dte = String(r.date || "");
      if (l.startAt && dte < l.startAt) return; if (l.endAt && dte > l.endAt) return;
      const ver = isVerified(r);
      if (l.verifiedOnly && !ver) return;
      Object.keys(r.players || {}).forEach((k) => {
        if (!(l.members && l.members[k])) return;
        const p = r.players[k]; if (!p || p.total == null) return;
        if (p.full === false && !(l.holes && p.played >= l.holes)) return;   // v542: partial rounds don't count unless the league is that short
        const e = by[k] || (by[k] = { key: k, name: (l.members[k] && l.members[k].name) || p.name || k, disc: l.members[k] && l.members[k].disc, rounds: 0, sum: 0, best: null, bestStrokes: null, bestDate: null, birdies: 0 });
        e.rounds++; e.sum += p.total; e.birdies += p.birdies || 0; (e.all = e.all || []).push(p.total); if (ver) e.verified = (e.verified || 0) + 1; // total = to par, strokes = raw
        const hc = (l.members[k] && l.members[k].hcp) || 0; const net = Math.round((p.total - hc) * 10) / 10; if (e.bestNet == null || net < e.bestNet) { e.bestNet = net; e.hcp = hc; }
        if (e.best == null || p.total < e.best || (p.total === e.best && dte < String(e.bestDate || ""))) { e.best = p.total; e.bestStrokes = p.strokes != null ? p.strokes : null; e.bestDate = r.date; }
      });
    });
    Object.keys(l.members || {}).forEach((k) => { if (!by[k]) by[k] = { key: k, name: l.members[k].name || k, disc: l.members[k].disc, rounds: 0, sum: 0, best: null, bestStrokes: null, bestDate: null, birdies: 0 }; });
    const rows = Object.keys(by).map((k) => { const e = by[k]; e.avg = e.rounds ? e.sum / e.rounds : null; e.toPar = e.best; const top = (e.all || []).slice().sort((a, b) => a - b).slice(0, 3); e.best3 = top.length ? top.reduce((a, b) => a + b, 0) : null; e.best3n = top.length; return e; });
    const played = (e) => e.rounds > 0 ? 0 : 1;
    if (l.format === "handicap") rows.sort((a, b) => played(a) - played(b) || (a.bestNet == null ? 1e9 : a.bestNet) - (b.bestNet == null ? 1e9 : b.bestNet) || a.name.localeCompare(b.name));
    else if (l.format === "best3") rows.sort((a, b) => (b.best3n >= 3) - (a.best3n >= 3) || played(a) - played(b) || (a.best3 == null ? 1e9 : a.best3) - (b.best3 == null ? 1e9 : b.best3) || b.rounds - a.rounds || a.name.localeCompare(b.name));
    else if (l.format === "rounds") rows.sort((a, b) => b.rounds - a.rounds || (a.avg == null ? 1e9 : a.avg) - (b.avg == null ? 1e9 : b.avg) || a.name.localeCompare(b.name));
    else if (l.format === "avg") rows.sort((a, b) => played(a) - played(b) || (a.avg == null ? 1e9 : a.avg) - (b.avg == null ? 1e9 : b.avg) || b.rounds - a.rounds || a.name.localeCompare(b.name));
    else rows.sort((a, b) => played(a) - played(b) || (a.best == null ? 1e9 : a.best) - (b.best == null ? 1e9 : b.best) || String(a.bestDate || "").localeCompare(String(b.bestDate || "")) || a.name.localeCompare(b.name));
    return rows;
  }
  function shareText(l) { if (l.schedule) return "Join my Chains league “" + l.name + "” at " + l.courseName + " — every " + DAYS_SHORT[l.schedule.day] + (l.schedule.time ? " " + l.schedule.time : "") + ", " + l.schedule.weeks + " weeks from " + niceDate(l.schedule.firstAt) + ". Code: " + l.code + "  " + location.origin + location.pathname + "#courseleague=" + l.code; return "Join my Chains course league “" + l.name + "” at " + l.courseName + " — " + fmtLabel(l.format) + ", play by " + niceDate(l.endAt) + ". Code: " + l.code + "  " + location.origin + location.pathname + "#courseleague=" + l.code; }

  window.ChainsCourseLeagues = { weeksOf, currentWeek, DAYS_SHORT, DIVISIONS, divLabel, divisionFor, nextDayOf, remindMe, watch, subscribe: (f) => { _subs.push(f); watch(); return () => { _subs = _subs.filter((x) => x !== f); }; }, all, mine, open, create, join, joinByCode, leave, addMembers, remove, update, standings, status, daysLeft, isOwner, fmtLabel, FORMATS, shareText, niceDate, get: (id) => _all[id] ? Object.assign({ id }, _all[id]) : null };

  // inbound #courseleague=CODE (share link) → join prompt once signed in
  (function () { try { const m = (location.hash || "").match(/[#&]courseleague=([^&]+)/); if (m) { localStorage.setItem("chains_pending_courseleague", decodeURIComponent(m[1])); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; } } } catch (e) {} })();

  /* ---------------- UI ---------------- */
  const T = {
    lbl: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 },
    h: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".01em", fontSize: 15.5, color: "var(--text-strong)" },
    sub: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--text-muted)", marginTop: 4 },
    input: { width: "100%", height: 46, padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-strong)", fontFamily: "var(--font-sans)", fontSize: 15, boxSizing: "border-box" },
    field: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--text-muted)", marginBottom: 6 },
  };
  function useLeagues() { const [, f] = React.useState(0); React.useEffect(() => window.ChainsCourseLeagues.subscribe(() => f((x) => x + 1)), []); return window.ChainsCourseLeagues; }
  function Av({ m, size = 26, i = 0 }) { return <span style={{ marginLeft: i ? -7 : 0, width: size, height: size, borderRadius: "50%", background: m.disc || "#9CA3AF", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: Math.round(size * 0.42), boxShadow: "0 0 0 2px var(--bg-elevated)", position: "relative" }}>{String(m.name || "?").charAt(0).toUpperCase()}</span>; }
  function StatusPill({ l }) { const s = status(l); const d = daysLeft(l); const n = Object.keys(l.members || {}).length; return s === "signup" ? <Badge tone="neutral" emphasis="soft">Signing up · {n} of {l.minPlayers}{l.signupBy ? " by " + niceDate(l.signupBy) : ""}</Badge> : s === "cancelled" ? <Badge tone="neutral" emphasis="soft">Didn’t fill ({n} of {l.minPlayers})</Badge> : s === "ended" ? <Badge tone="neutral" emphasis="soft">Ended</Badge> : s === "upcoming" ? <Badge tone="neutral" emphasis="soft">Starts {niceDate(l.startAt)}</Badge> : <Badge tone="live" emphasis="solid">{d <= 0 ? "Last day" : d === 1 ? "1 day left" : d + " days left"}</Badge>; }

  function CourseLeagueCard({ l, onOpen }) {
    const mems = Object.keys(l.members || {}).map((k) => l.members[k]);
    return (
      <Card pad={0} hover onClick={onOpen} accentBar={status(l) === "open" ? "var(--fairway-500)" : undefined}>
        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px" }}>
          <span style={{ width: 46, height: 46, borderRadius: "var(--radius-md)", background: "var(--fairway-100)", color: "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Pin size={22} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={T.h}>{l.name}</span><StatusPill l={l} /></div>
            <div style={T.sub}>{l.courseName} · {fmtLabel(l.format)} · {mems.length} {mems.length === 1 ? "player" : "players"}</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>{mems.slice(0, 6).map((m, i) => <Av key={i} m={m} i={i} />)}{mems.length > 6 ? <span style={{ marginLeft: 6, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)" }}>+{mems.length - 6}</span> : null}</div>
          </div>
          <span style={{ width: 17, height: 17, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={17} /></span>
        </div>
      </Card>
    );
  }

  /* List block for the Leagues hub */
  function CourseLeaguesSection({ onOpen, onCreate, mobile }) {
    const CL = useLeagues();
    const my = CL.mine(), pub = CL.open();
    const [code, setCode] = React.useState(""); const [busy, setBusy] = React.useState(false);
    React.useEffect(() => { let c = null; try { c = localStorage.getItem("chains_pending_courseleague"); } catch (e) {} if (c && Object.keys(_all).length) { try { localStorage.removeItem("chains_pending_courseleague"); } catch (e) {} CL.joinByCode(c).then((r) => { if (window.ChainsToast) ChainsToast.show(r.ok ? "You’re in the league!" : r.err, r.ok ? "success" : "error"); if (r.ok) onOpen(r.id); }); } }, [Object.keys(_all).length]);
    function doJoin() { if (!code.trim()) return; setBusy(true); CL.joinByCode(code).then((r) => { setBusy(false); if (window.ChainsToast) ChainsToast.show(r.ok ? "You’re in the league!" : r.err, r.ok ? "success" : "error"); if (r.ok) { setCode(""); onOpen(r.id); } }); }
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={Object.assign({}, T.lbl, { marginBottom: 0 })}>Course leagues</div>
          <button onClick={onCreate} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--fairway-700)", padding: "4px 0" }}>+ New course league</button>
        </div>
        {my.length === 0 ? (
          <Card pad={0}>
            <div style={{ padding: mobile ? "24px 18px" : "30px 24px", textAlign: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: "var(--radius-lg)", background: "var(--fairway-100)", color: "var(--fairway-700)", marginBottom: 12 }}><Icons.Pin size={24} /></span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", marginBottom: 6 }}>Play a course with friends</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto 16px", lineHeight: 1.5 }}>“Everyone plays Otterburn by Saturday.” Pick a course, a deadline and a format — every round your crew scores there counts automatically.</div>
              <Button variant="accent" size="lg" icon={<Icons.Plus size={16} />} onClick={onCreate}>Start a course league</Button>
            </div>
          </Card>
        ) : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{my.map((l) => <CourseLeagueCard key={l.id} l={l} onOpen={() => onOpen(l.id)} />)}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Have a league code?" maxLength={8} style={Object.assign({}, T.input, { flex: 1, height: 42, textTransform: "uppercase", letterSpacing: ".08em" })} onKeyDown={(e) => { if (e.key === "Enter") doJoin(); }} />
          <Button variant="secondary" onClick={doJoin} disabled={busy || !code.trim()}>{busy ? "…" : "Join"}</Button>
        </div>
        {pub.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={T.lbl}>Open to anyone</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{pub.map((l) => <CourseLeagueCard key={l.id} l={l} onOpen={() => onOpen(l.id)} />)}</div>
          </div>
        )}
      </div>
    );
  }

  /* Create flow — one screen, big taps. */
  function CourseLeagueCreate({ onDone, onBack, mobile }) {
    const [cat, setCat] = React.useState(() => (window.ChainsCatalog && ChainsCatalog.get()) || null);
    React.useEffect(() => { if (!cat && window.ChainsCatalog) ChainsCatalog.load().then(setCat); }, []);
    const [q, setQ] = React.useState("");
    const [course, setCourse] = React.useState(() => { try { const c = JSON.parse(localStorage.getItem("chains_play_lastcourse") || "null"); return c && c.id ? c : null; } catch (e) { return null; } });
    const [name, setName] = React.useState("");
    const [format, setFormat] = React.useState("best");
    const [kind, setKind] = React.useState("window");          // v530: "window" (play by a date) | "weekly" (league night)
    const [day, setDay] = React.useState(() => { const d = new Date().getDay(); return d === 0 ? 2 : d; });
    const [time, setTime] = React.useState("6:00 pm");
    const [weeks, setWeeks] = React.useState(8);
    const [firstAt, setFirstAt] = React.useState(() => nextDayOf(new Date().getDay() === 0 ? 2 : new Date().getDay()));
    const [dayOnly, setDayOnly] = React.useState(false);
    const [divisions, setDivisions] = React.useState(false);
    const [scoring, setScoring] = React.useState("strokes");   // v536: strokes (best weeks added up) | points (place each week)
    const countBest = Math.max(1, weeks - Math.floor(weeks / 4));
    const [days, setDays] = React.useState(7);
    const [endAt, setEndAt] = React.useState(() => dayISO(Date.now() + 7 * DAY));
    const [pub, setPub] = React.useState(false);
    const [minPlayers, setMinPlayers] = React.useState(0); const [signupBy, setSignupBy] = React.useState(""); const [finalAt, setFinalAt] = React.useState(""); const [judge, setJudge] = React.useState(""); const [acePot, setAcePot] = React.useState(false); const [verifiedOnly, setVerifiedOnly] = React.useState(false); const [more, setMore] = React.useState(false);
    const [picked, setPicked] = React.useState({});
    const [busy, setBusy] = React.useState(false);
    const friends = (window.ChainsFriends && ChainsFriends.available && ChainsFriends.available()) ? ChainsFriends.list() : [];
    React.useEffect(() => { if (cat && !course) { const o = cat.find((c) => /otterburn/i.test(c.name)) || cat[0]; if (o) setCourse(o); } }, [cat]);
    const ql = q.trim().toLowerCase();
    const list = ql ? (cat || []).filter((c) => (c.name + " " + (c.city || "")).toLowerCase().includes(ql)).slice(0, 8) : [];
    const setDaysQuick = (n) => { setDays(n); setEndAt(dayISO(Date.now() + n * DAY)); };
    const seg = (on) => ({ flex: 1, minHeight: 44, border: "1px solid " + (on ? "var(--fairway-600)" : "var(--border-default)"), borderRadius: "var(--radius-md)", background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-body)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, padding: "8px 6px", textAlign: "center" });
    const canGo = !!course && (kind === "weekly" ? !!firstAt && weeks > 0 : !!endAt) && !busy;
    function go() {
      if (!canGo) return; setBusy(true);
      const invitees = friends.filter((f) => picked[f.uid]);
      const boardP = (format === "handicap" && window.ChainsRounds && ChainsRounds.courseBoard) ? ChainsRounds.courseBoard(course.id).catch(() => []) : Promise.resolve(null);
      boardP.then((board) => window.ChainsCourseLeagues.create({ name: name.trim() || (course.name.replace(/ disc golf.*$/i, "") + " · " + (kind === "weekly" ? DAYS_SHORT[day] + " league" : fmtLabel(format))), course: course, format: kind === "weekly" ? "weekly" : format, startAt: todayISO(), endAt, public: pub, invitees, minPlayers, signupBy: minPlayers > 0 ? (signupBy || todayISO()) : null, finalAt, judge, acePot, verifiedOnly, board,
        schedule: kind === "weekly" ? { day, time: time.trim().slice(0, 12) || null, weeks, firstAt, countBest, dayOnly, scoring } : null, divisions })).then((l) => { setBusy(false); if (window.ChainsToast) ChainsToast.show(invitees.length ? "League started — " + invitees.length + " friend" + (invitees.length === 1 ? "" : "s") + " added." : "League started.", "success"); onDone(l.id); }).catch((e) => { setBusy(false); if (window.ChainsToast) ChainsToast.show("Couldn’t start the league — " + (e && e.message || "try again."), "error"); });
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title="New course league" sub="Pick a course, a deadline and a format. Rounds count automatically." onBack={onBack} />
        <Card pad={mobile ? 16 : 20}>
          <div style={T.field}>Course</div>
          {course ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--fairway-50, #eef5f0)", border: "1px solid var(--fairway-200, #cfe3d6)" }}>
              <span style={{ color: "var(--fairway-700)", width: 18, height: 18 }}><Icons.Pin size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14.5, color: "var(--text-strong)" }}>{course.name}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>{[course.city, course.state].filter(Boolean).join(", ")} · {course.holes || 18} holes{course.par_total ? " · par " + course.par_total : ""}</div></div>
              <button onClick={() => setCourse(null)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--fairway-700)", fontWeight: 600 }}>Change</button>
            </div>
          ) : (
            <div>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" style={T.input} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>{(ql ? list : (cat || []).filter((c) => /otterburn/i.test(c.name))).map((c) => <button key={c.id} onClick={() => { setCourse(c); setQ(""); }} style={{ textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-strong)" }}>{c.name}<span style={{ color: "var(--text-muted)", fontSize: 11.5 }}> · {[c.city, c.state].filter(Boolean).join(", ")}</span></button>)}</div>
            </div>
          )}
          <div style={Object.assign({}, T.field, { marginTop: 16 })}>League name <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={course ? course.name.replace(/ disc golf.*$/i, "") + " · " + fmtLabel(format) : "Saturday showdown"} maxLength={40} style={T.input} />
          <div style={Object.assign({}, T.field, { marginTop: 16 })}>Kind of league</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{[["window", "One window"], ["weekly", "Weekly league"]].map(([id, t]) => <button key={id} onClick={() => setKind(id)} style={seg(kind === id)}>{t}</button>)}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{kind === "weekly" ? "A league night every week for a set number of weeks. Your best round each week counts; your best " + countBest + " of " + weeks + " weeks are added up." : "Everyone plays as often as they like until the deadline."}</div>
          {kind === "weekly" ? (
            <div>
              <div style={Object.assign({}, T.field, { marginTop: 16 })}>League night</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>{DAYS_SHORT.map((t, i) => <button key={t} onClick={() => { setDay(i); setFirstAt(nextDayOf(i)); }} style={Object.assign({}, seg(day === i), { minHeight: 40, padding: 0, fontSize: 12 })}>{t}</button>)}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="6:00 pm" style={Object.assign({}, T.input, { flex: 1 })} />
                <input type="date" value={firstAt} min={todayISO()} onChange={(e) => setFirstAt(e.target.value)} style={Object.assign({}, T.input, { flex: 1.4 })} />
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Tee time (shown to players) and the first league night.</div>
              <div style={Object.assign({}, T.field, { marginTop: 16 })}>How many weeks</div>
              <div style={{ display: "flex", gap: 6 }}>{[4, 6, 8, 10, 12].map((n) => <button key={n} onClick={() => setWeeks(n)} style={seg(weeks === n)}>{n}</button>)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Runs {niceDate(firstAt)} to {niceDate(addDays(firstAt, (weeks - 1) * 7))}. Best {countBest} weeks count, so missing {weeks - countBest} is fine.</div>
              <div style={Object.assign({}, T.field, { marginTop: 16 })}>Scoring</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{[["strokes", "Strokes"], ["points", "Points"]].map(([id, t]) => <button key={id} onClick={() => setScoring(id)} style={seg(scoring === id)}>{t}</button>)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{scoring === "points" ? "Each week: 1st 10 · 2nd 8 · 3rd 6 · 4th 5 · 5th 4 · everyone else who plays 3. Best " + countBest + " weeks added up — showing up matters." : "Your best round each week, best " + countBest + " weeks added up. Lowest total wins."}</div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer" }}><input type="checkbox" checked={dayOnly} onChange={(e) => setDayOnly(e.target.checked)} style={{ width: 20, height: 20 }} /><span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Only rounds on league night count <span style={{ color: "var(--text-muted)" }}>— off means any round that week</span></span></label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, cursor: "pointer" }}><input type="checkbox" checked={divisions} onChange={(e) => setDivisions(e.target.checked)} style={{ width: 20, height: 20 }} /><span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Divisions by rating <span style={{ color: "var(--text-muted)" }}>— Open 900+, Intermediate 850–899, Recreational under 850; set when you join</span></span></label>
            </div>
          ) : (
            <div>
          <div style={Object.assign({}, T.field, { marginTop: 16 })}>Format</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>{FORMATS.filter((f) => f[0] !== "weekly").map(([id, t]) => <button key={id} onClick={() => setFormat(id)} style={seg(format === id)}>{t}</button>)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{(FORMATS.find((f) => f[0] === format) || FORMATS[0])[2]}.</div>
              <div style={Object.assign({}, T.field, { marginTop: 16 })}>Play by</div>
              <div style={{ display: "flex", gap: 6 }}>{[[3, "3 days"], [7, "1 week"], [14, "2 weeks"], [30, "Month"]].map(([n, t]) => <button key={n} onClick={() => setDaysQuick(n)} style={seg(days === n && endAt === dayISO(Date.now() + n * DAY))}>{t}</button>)}</div>
              <input type="date" value={endAt} min={todayISO()} onChange={(e) => { setEndAt(e.target.value); setDays(0); }} style={Object.assign({}, T.input, { marginTop: 8 })} />
            </div>
          )}
          <button onClick={() => setMore((v) => !v)} style={{ marginTop: 14, background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--fairway-700)", fontWeight: 600, padding: 0 }}>{more ? "Fewer options" : "More options · needs N players · final · ace pot · verified rounds"}</button>
          {more && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10, padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-sunken, #eef2ef)" }}>
              <div>
                <div style={T.field}>Needs this many players to start <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(0 = starts right away)</span></div>
                <div style={{ display: "flex", gap: 8 }}><input type="number" min={0} max={200} value={minPlayers} onChange={(e) => setMinPlayers(Math.max(0, +e.target.value || 0))} style={Object.assign({}, T.input, { width: 90 })} /><input type="date" value={signupBy} min={todayISO()} onChange={(e) => setSignupBy(e.target.value)} disabled={!minPlayers} placeholder="Sign up by" style={Object.assign({}, T.input, { flex: 1, opacity: minPlayers ? 1 : .5 })} /></div>
                {minPlayers > 0 && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>If {minPlayers} haven’t signed up by the date, it quietly doesn’t happen.</div>}
              </div>
              <div>
                <div style={T.field}>Final round <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(optional · top players play together, a judge watches)</span></div>
                <div style={{ display: "flex", gap: 8 }}><input type="date" value={finalAt} min={todayISO()} onChange={(e) => setFinalAt(e.target.value)} style={Object.assign({}, T.input, { flex: 1 })} /><input value={judge} onChange={(e) => setJudge(e.target.value)} placeholder="Judge / witness" maxLength={40} style={Object.assign({}, T.input, { flex: 1 })} /></div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}><input type="checkbox" checked={acePot} onChange={(e) => setAcePot(e.target.checked)} style={{ width: 20, height: 20 }} /><span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Ace pot <span style={{ color: "var(--text-muted)" }}>— everyone chips in, first ace in the window takes it (money stays outside the app)</span></span></label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} style={{ width: 20, height: 20 }} /><span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Verified rounds only <span style={{ color: "var(--text-muted)" }}>— a round counts only if another Chains player was on the card</span></span></label>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} style={{ width: 20, height: 20 }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-body)" }}>Open to anyone on Chains <span style={{ color: "var(--text-muted)" }}>— shows under “Open to anyone”; otherwise it’s friends + code only</span></span>
          </label>
        </Card>
        <Card pad={mobile ? 16 : 20}>
          <div style={T.field}>Add friends <span style={{ color: "var(--text-faint)", textTransform: "none", letterSpacing: 0 }}>(they’re in right away and get a note)</span></div>
          {friends.length === 0 ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>No friends yet — add some on the Friends tab, or share the league code after you start it.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{friends.map((f) => { const on = !!picked[f.uid]; return (
              <button key={f.uid} onClick={() => setPicked((p) => Object.assign({}, p, { [f.uid]: !on }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: "var(--radius-md)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-subtle)"), background: on ? "var(--fairway-50, #eef5f0)" : "var(--bg-elevated)", cursor: "pointer", textAlign: "left" }}>
                <Av m={f} size={30} /><span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }}>{f.name}</span>
                <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid " + (on ? "var(--fairway-600)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "transparent", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{on ? <Icons.Check size={14} /> : null}</span>
              </button>); })}</div>
          )}
        </Card>
        <Button variant="accent" full size="lg" onClick={go} disabled={!canGo}>{busy ? "Starting…" : "Start the league"}</Button>
      </div>
    );
  }

  /* League page — standings + invite + manage. */
  function CourseLeagueDetail({ id, onBack, mobile }) {
    const CL = useLeagues();
    const l = CL.get(id);
    const [board, setBoard] = React.useState(null);
    const [addOpen, setAddOpen] = React.useState(false);
    const me = meKey();
    React.useEffect(() => { let ok = true; if (l && window.ChainsRounds && ChainsRounds.courseBoard) ChainsRounds.courseBoard(l.courseId).then((b) => { if (ok) setBoard(b || []); }); else setBoard([]); return () => { ok = false; }; }, [id, l && l.courseId]);
    if (!l) return <div style={{ display: "flex", flexDirection: "column", gap: 16 }}><FlowHead title="League" sub="This league is gone." onBack={onBack} /></div>;
    const rows = CL.standings(l, board || []);
    const st = status(l), owner = CL.isOwner(l), member = !!(l.members && me && l.members[me]);
    const leader = rows[0] && rows[0].rounds > 0 ? rows[0] : null;
    // v532 — record the winner once the league has ended (first member to open the page writes it; trophies read it)
    React.useEffect(() => { try { if (st === "ended" && leader && !l.winner && member && board) CL.update(l.id, { winner: leader.key, winnerName: leader.name, wonAt: Date.now() }); } catch (e) {} }, [st, leader && leader.key, l.winner, board]);
    const friends = (window.ChainsFriends && ChainsFriends.available && ChainsFriends.available()) ? ChainsFriends.list().filter((f) => !(l.members && l.members[f.uid])) : [];
    function share() { const txt = CL.shareText(l); if (navigator.share) { navigator.share({ title: l.name, text: txt }).catch(() => {}); return; } try { navigator.clipboard.writeText(txt).then(() => window.ChainsToast && ChainsToast.show("Invite copied — paste it in a text.", "info"), () => window.ChainsConfirm && ChainsConfirm.copy({ title: "Invite", message: "Copy and send this to your crew.", text: txt })); } catch (e) { if (window.ChainsConfirm) ChainsConfirm.copy({ title: "Invite", message: "Copy and send this to your crew.", text: txt }); } }
    // v530 — calendar file for a weekly league (opens in the phone's calendar; repeats on league night)
    function calendar() {
      try {
        const sc = l.schedule; const [y, m, d] = String(sc.firstAt).split("-").map(Number);
        const tm = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(sc.time || ""); let hh = tm ? Number(tm[1]) : 18, mm = tm && tm[2] ? Number(tm[2]) : 0; if (tm && tm[3] && /pm/i.test(tm[3]) && hh < 12) hh += 12; if (tm && tm[3] && /am/i.test(tm[3]) && hh === 12) hh = 0;
        const pad = (n) => String(n).padStart(2, "0"); const st = y + pad(m) + pad(d) + "T" + pad(hh) + pad(mm) + "00"; const en = y + pad(m) + pad(d) + "T" + pad(Math.min(23, hh + 2)) + pad(mm) + "00";
        const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Chains//League//EN", "BEGIN:VEVENT", "UID:" + l.id + "@chains", "DTSTART:" + st, "DTEND:" + en, "RRULE:FREQ=WEEKLY;COUNT=" + sc.weeks, "SUMMARY:" + l.name.replace(/[,;]/g, " "), "LOCATION:" + l.courseName.replace(/[,;]/g, " "), "DESCRIPTION:Chains league night. Score it in Chains and it counts. Code " + l.code, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
        const a = document.createElement("a"); a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics); a.download = l.name.replace(/[^A-Za-z0-9]+/g, "-") + ".ics"; document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { if (window.ChainsToast) ChainsToast.show("Couldn’t build the calendar file.", "error"); }
    }
    function playHere() { try { localStorage.setItem("chains_play_lastcourse", JSON.stringify({ id: l.courseId, name: l.courseName, holes: l.holes, par_total: l.parTotal })); } catch (e) {} try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "playstart" })); } catch (e) {} }
    const tp = (n) => n > 0 ? "+" + n : n === 0 ? "E" : String(n);
    const stat = (e) => l.format === "weekly" ? (e.season == null ? "—" : (l.schedule.scoring === "points" ? e.season + " pts" : tp(e.season)) + (e.complete || l.schedule.scoring === "points" ? "" : " (" + e.weeksPlayed + "/" + Math.min(l.schedule.countBest || 1, (l.schedule.weeks || 1)) + " wks)")) : l.format === "handicap" ? (e.bestNet == null ? "—" : tp(e.bestNet) + " net" + (e.hcp ? " (hcp " + e.hcp + ")" : "")) : l.format === "best3" ? (e.best3 == null ? "—" : tp(e.best3) + (e.best3n < 3 ? " (" + e.best3n + " of 3)" : "")) : l.format === "rounds" ? (e.rounds + (e.rounds === 1 ? " round" : " rounds")) : l.format === "avg" ? (e.avg == null ? "—" : tp(Math.round(e.avg * 10) / 10) + " avg") : (e.best == null ? "—" : tp(e.best) + (e.bestStrokes != null ? " (" + e.bestStrokes + ")" : ""));
    const row = (e, i) => (
      <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: e.key === me ? "var(--fairway-50, #eef5f0)" : "transparent" }}>
        <span style={{ width: 22, fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: i === 0 && e.rounds ? "var(--gold-600, #b8860b)" : "var(--text-muted)", textAlign: "center" }}>{e.rounds ? i + 1 : "–"}</span>
        <Av m={e} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)" }}>{e.name}{e.key === me ? <span style={{ color: "var(--text-muted)", fontWeight: 500 }}> (you)</span> : null}</div><div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>{e.rounds ? e.rounds + (e.rounds === 1 ? " round" : " rounds") + (e.verified ? " · " + e.verified + " ✓" : "") + (e.birdies ? " · " + e.birdies + " birdies" : "") : "Hasn’t played yet"}</div></div>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: 15, color: e.rounds ? "var(--text-strong)" : "var(--text-faint)" }}>{stat(e)}</span>
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title={l.name} sub={l.courseName + " · " + (l.schedule ? "every " + DAYS_SHORT[l.schedule.day] + (l.schedule.time ? " " + l.schedule.time : "") + " · " + l.schedule.weeks + " weeks" : fmtLabel(l.format))} onBack={onBack} />
        <Card tone="ink" pad={0}>
          <div style={{ padding: mobile ? "18px 18px" : "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><StatusPill l={l} /><span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--chain-400)" }}>{niceDate(l.startAt)} → {niceDate(l.endAt)}</span></div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: mobile ? 24 : 28, lineHeight: 1.05, color: "var(--bone-50)", marginTop: 10 }}>{st === "ended" ? (leader ? leader.name + " wins" : "Nobody played") : leader ? leader.name + " leads" : "Nobody’s on the board yet"}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400)", marginTop: 6 }}>{leader ? stat(leader) + " · " : ""}{(() => { const n = Object.keys(l.members || {}).length; return n + (n === 1 ? " player" : " players"); })()} · every finished round at {l.courseName.replace(/ disc golf.*$/i, "")} in the window counts.</div>
            {(l.minPlayers > 0 || l.finalAt || l.acePot || l.verifiedOnly) && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 8, lineHeight: 1.5 }}>
              {st === "signup" ? <div>Needs {l.minPlayers} to start · {Object.keys(l.members || {}).length} in{l.signupBy ? " · sign up by " + niceDate(l.signupBy) : ""}. Share the code.</div> : st === "cancelled" ? <div>Didn’t reach {l.minPlayers} players by {niceDate(l.signupBy)} — no league this time.</div> : null}
              {l.finalAt ? <div>Final: {niceDate(l.finalAt)}{l.judge ? " · judge: " + l.judge : ""} — top players on one card, scored live.</div> : null}
              {l.acePot ? <div>Ace pot is on — first ace at {l.courseName.replace(/ disc golf.*$/i, "")} in the window takes it.</div> : null}
              {l.verifiedOnly ? <div>Verified rounds only — another Chains player must be on your card.</div> : null}
            </div>}
            {st !== "ended" && st !== "cancelled" && member && <div style={{ marginTop: 16 }}><Button variant="accent" full size="lg" icon={<Icons.Play size={16} />} onClick={playHere}>Play {l.courseName.replace(/ disc golf.*$/i, "")} now</Button></div>}
            {!member && st !== "ended" && <div style={{ marginTop: 16 }}><Button variant="accent" full size="lg" onClick={() => CL.join(l.id).then(() => window.ChainsToast && ChainsToast.show("You’re in!", "success"))}>Join this league</Button></div>}
          </div>
        </Card>
        {l.schedule && (() => { const weeks = CL.weeksOf(l); const cur = CL.currentWeek(l); const t = todayISO(); return (
          <div>
            <div style={T.lbl}>Weeks</div>
            <Card pad={0}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(" + Math.min(6, weeks.length) + ", 1fr)", gap: 6, padding: 12 }}>
                {weeks.map((w) => { const done = t > w.to, on = cur && cur.n === w.n; const mine = rows.find((r) => r.key === me); const sc = mine && mine.weeks ? mine.weeks[w.n] : null; return (
                  <div key={w.n} style={{ textAlign: "center", padding: "8px 2px", borderRadius: 10, background: on ? "var(--fairway-700)" : done ? "var(--bg-sunken, #eef2ef)" : "transparent", border: on ? "none" : "1px solid var(--border-subtle)", color: on ? "#fff" : "var(--text-strong)" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: on ? "rgba(255,255,255,.8)" : "var(--text-muted)" }}>Wk {w.n}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, marginTop: 2 }}>{sc != null ? (l.schedule.scoring === "points" && mine.pts && mine.pts[w.n] != null ? mine.pts[w.n] + "p" : tp(sc)) : done ? "—" : niceDate(w.night).replace(/^\w+, /, "")}</div>
                  </div>); })}
              </div>
              <div style={{ padding: "0 14px 10px", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{cur ? "Week " + cur.n + " is on — " + (l.schedule.dayOnly ? "league night is " + niceDate(cur.night) : "play any day through " + niceDate(cur.to)) + "." : t < weeks[0].from ? "First league night " + niceDate(weeks[0].night) + "." : "Season over."} Best {l.schedule.countBest} of {l.schedule.weeks} weeks count{l.schedule.scoring === "points" ? " · points for your place each week (10, 8, 6, 5, 4, then 3 for playing)" : ""}.</div>
            </Card>
          </div>); })()}
        <div>
          <div style={T.lbl}>Standings</div>
          {l.divisions ? CL.DIVISIONS.map(([did, dl]) => { const rs = rows.filter((r) => (r.division || "rec") === did); if (!rs.length) return null; return (
            <div key={did} style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)", margin: "4px 0 6px" }}>{dl} <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· {rs.length}</span></div>
              <Card pad={0}>{rs.map(row)}</Card>
            </div>); })
          : <Card pad={0}>{rows.length ? rows.map(row) : <div style={{ padding: 18, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>No players yet.</div>}</Card>}
        </div>
        {member && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button variant="secondary" size="lg" icon={<Icons.Users size={16} />} onClick={() => setAddOpen(true)}>Add friends</Button>
            <Button variant="secondary" size="lg" onClick={share}>Share code {l.code}</Button>
            {l.schedule ? <Button variant="secondary" size="lg" icon={<Icons.Calendar size={16} />} onClick={calendar}>Add to calendar</Button> : null}
          </div>
        )}
        {member && (
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {owner ? <button onClick={() => { window.ChainsConfirm.show({ title: "Delete this league?", message: "Standings disappear for everyone. Rounds stay in Go Throw.", confirmLabel: "Delete league", danger: true }).then((ok) => { if (ok) CL.remove(l.id).then(() => onBack()); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>Delete league</button>
              : <button onClick={() => { window.ChainsConfirm.show({ title: "Leave " + l.name + "?", message: "You can rejoin with the code any time.", confirmLabel: "Leave" }).then((ok) => { if (ok) CL.leave(l.id).then(() => onBack()); }); }} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>Leave league</button>}
            {owner && <button onClick={() => CL.update(l.id, { public: !l.public }).then(() => window.ChainsToast && ChainsToast.show(l.public ? "Now friends + code only." : "Now open to anyone on Chains.", "info"))} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>{l.public ? "Make private" : "Open to anyone"}</button>}
          </div>
        )}
        {addOpen && (
          <__Portal>
            <div onClick={() => setAddOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 230, background: "rgba(12,20,16,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "80vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: "18px 18px 0 0", padding: "18px 18px 28px", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><span style={T.h}>Add friends</span><button onClick={() => setAddOpen(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontSize: 18 }}>×</button></div>
                {friends.length === 0 ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>Everyone on your friends list is already in. Share the code to bring in more.</div> : friends.map((f) => (
                  <button key={f.uid} onClick={() => CL.addMembers(l.id, [f]).then(() => window.ChainsToast && ChainsToast.show(f.name + " added.", "success"))} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer", textAlign: "left", marginBottom: 4 }}>
                    <Av m={f} size={30} /><span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }}>{f.name}</span><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 11, color: "var(--fairway-700)" }}>Add</span>
                  </button>))}
              </div>
            </div>
          </__Portal>
        )}
      </div>
    );
  }

  /* "Create a league" chooser — the two league types. */
  function LeagueTypeSheet({ onClose, onCourse, onFantasy }) {
    const opt = (title, desc, icon, on) => (
      <button onClick={on} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", cursor: "pointer", textAlign: "left", marginBottom: 8 }}>
        <span style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--fairway-100)", color: "var(--fairway-700)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1 }}><span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{title}</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2, lineHeight: 1.4 }}>{desc}</span></span>
        <span style={{ width: 17, height: 17, color: "var(--text-faint)" }}><Icons.ChevRight size={17} /></span>
      </button>
    );
    return (
      <__Portal>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 230, background: "rgba(12,20,16,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--bg-elevated)", borderRadius: "18px 18px 0 0", padding: "18px 18px 28px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><span style={T.h}>What kind of league?</span><button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontSize: 18 }}>×</button></div>
            {opt("Course league", "Friends play a real course by a deadline. Best round, best average or most rounds.", <Icons.Pin size={22} />, onCourse)}
            {(window.ChainsID && ChainsID.isCommish && ChainsID.isCommish())
              ? opt("Fantasy league", "Draft pros and ride the DGPT season. Opens for everyone in spring 2027 — commissioner can set up formats now.", <Icons.Trophy size={22} />, onFantasy)
              : <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-subtle)", opacity: .7 }}><span style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--bg-sunken, #eef2ef)", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.Trophy size={22} /></span><span><span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>Fantasy league</span><span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Draft pros for the 2027 DGPT season — opens in the spring.</span></span></div>}
          </div>
        </div>
      </__Portal>
    );
  }

  window.CourseLeagues = { Section: CourseLeaguesSection, Create: CourseLeagueCreate, Detail: CourseLeagueDetail, TypeSheet: LeagueTypeSheet };

  window.MyLeaguesView = MyLeaguesView;
  window.FriendsSection = FriendsSection;
})();
