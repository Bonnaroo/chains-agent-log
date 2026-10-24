/* Chains — Pixel golfers overlay for the Course hole cards. window.ChainsPixelGolfers
   Chunky 16-bit disc golfers on the hole illustration. Visual garnish ONLY:
   reads the same rows HoleCard computed, never touches scoring.
   Flags: window.CHAINS_FLAGS.pixelGolfers===false or localStorage chains_pg_off="1" off;
   chains_pg_demo="1" demo golfers; chains_pg_edit="1" map editor.
   window.CHAINS_PG_TICK overrides ambient throw cadence (ms). */
(function () {
  const FLAGS = (window.CHAINS_FLAGS = window.CHAINS_FLAGS || {});
  function enabled() { try { return FLAGS.pixelGolfers !== false && localStorage.getItem("chains_pg_off") !== "1"; } catch (e) { return FLAGS.pixelGolfers !== false; } }
  function demo() { try { return localStorage.getItem("chains_pg_demo") === "1"; } catch (e) { return false; } }
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hole mapping (percent coords of the hole image) -------------------- */
  const DEFAULT_MAP = { tee: [50, 80], fair1: [46, 62], fair2: [54, 44], putt: [46, 26], basket: [50, 15], exit: [88, 10] };
  // baked per-hole overrides — water holes keep the group on the grass side;
  // jmax = max lateral jitter (% of card width) for tight corridors
  window.CHAINS_PG_MAP = Object.assign({
    "3": { fair1: [42, 64], fair2: [44, 44], putt: [42, 26], jmax: 2.5 },
    "5": { fair1: [44, 66], fair2: [46, 46], putt: [44, 27], jmax: 3 },
  }, window.CHAINS_PG_MAP);
  function mapFor(hole) {
    let o = null;
    try { o = JSON.parse(localStorage.getItem("chains_pg_map") || "null"); } catch (e) {}
    const g = window.CHAINS_PG_MAP || {};
    return Object.assign({}, DEFAULT_MAP, g["default"], o && o["default"], g[String(hole)], o && o[String(hole)]);
  }
  const PATH = ["tee", "fair1", "fair2", "putt", "basket"];
  // continuous position along the hole: t in [0,4] segment-units across the
  // tee→fair1→fair2→putt→basket polyline (3 = green edge, 4 = chains)
  function pointAt(M, t) {
    const pts = PATH.map((k) => M[k]);
    const c = Math.max(0, Math.min(t, 4));
    const i = Math.min(3, Math.floor(c)); const f = c - i;
    const a = pts[i], b = pts[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  }

  /* ---- sprites: chunky original golfers, ~13x18 px, dark outline ----------
     legend: o outline · h hat · f face · s shirt · a arm(skin) · p pants ·
     k shoes · b bag · d disc-in-hand */
  const POSES = {
    stand: [
      "....oooo.....", "...ohhhhho...", "..ohhhhhhho..", "..ohhhhhhho..", "...offfffo...", "...offfffo.o.",
      "..oosssssoobo", ".oasssssssabbo", ".oasssssssabbo", ".oasssssssabbo", "..osssssso.o.", "..oppppppo...",
      "..oppppppo...", "..opp.oppo...", "..opp.oppo...", "..okko.okko..", "..okko.okko..", ".............",
    ],
    windup: [
      "....oooo.....", "...ohhhhho...", "..ohhhhhhho..", "..ohhhhhhho..", "...offfffo...", "...offfffo...",
      "..oosssssoo..", "..osssssssao.", "..ossssssaado", "..ossssssaddo", "..osssssso...", "..oppppppo...",
      "..oppppppo...", "..opp.opppo..", "..opp..oppo..", "..okko..okko.", "..okko..okko.", ".............",
    ],
    release: [
      "....oooo.....", "...ohhhhho...", "..ohhhhhhho..", "..ohhhhhhho..", "...offfffo...", "...offfffo...",
      ".ooosssssoo..", "oaassssssso..", "aaossssssso..", ".oosssssso...", "..osssssso...", "..oppppppo...",
      ".opppppppo...", ".oppo.oppo...", ".oppo.oppo...", ".okko..okko..", ".okko..okko..", ".............",
    ],
    watch: [
      "....oooo..aa.", "...ohhhhhoaa.", "..ohhhhhhhao.", "..ohhhhhhho..", "...offfffo...", "...offfffo.o.",
      "..oosssssoobo", "..ossssssabbo", "..ossssssabbo", "..osssssso.o.", "..osssssso...", "..oppppppo...",
      "..oppppppo...", "..opp.oppo...", "..opp.oppo...", "..okko.okko..", "..okko.okko..", ".............",
    ],
    putt: [
      ".............", "....oooo.....", "...ohhhhho...", "..ohhhhhhho..", "...offfffo...", "...offfffo...",
      "..oosssssoo..", "..ossssssoaa.", "..ossssssoad.", "..ossssssodd.", "..osssssso...", "..oppppppo...",
      "..oppppppo...", "..opp.oppo...", "..opp.oppo...", "..okko.okko..", "..okko.okko..", ".............",
    ],
    cheer: [
      ".aa.......aa.", ".aa.oooo..aa.", ".aaohhhhhoaa.", "..ohhhhhhho..", "...offfffo...", "...offfffo...",
      "..oosssssoo..", "..osssssso...", "..osssssso...", "..osssssso...", "..osssssso...", "..oppppppo...",
      "..oppppppo...", "..opp.oppo...", "..opp.oppo...", "..okko.okko..", "..okko.okko..", ".............",
    ],
  };
  // palettes rotate per player — hat/shirt combos tell golfers apart; disc = hat color
  const PALETTES = [
    { h: "#e0483d", s: "#2e6fa8", p: "#3a3a44", b: "#8a5a2b", d: "#ffd23f" },
    { h: "#f2b632", s: "#34a06a", p: "#4a3b57", b: "#6b6b78", d: "#ff8a3d" },
    { h: "#8a5cf5", s: "#e8843d", p: "#2f4a3c", b: "#8a5a2b", d: "#6ee7a8" },
    { h: "#2e8b57", s: "#c23a33", p: "#33415c", b: "#6b6b78", d: "#7ad7ff" },
    { h: "#1f2a44", s: "#f2b632", p: "#5a4632", b: "#8a5a2b", d: "#ff6b9d" },
    { h: "#e8843d", s: "#7a8c9e", p: "#2b3a2f", b: "#6b6b78", d: "#c3f542" },
    { h: "#ffffff", s: "#5a3ea8", p: "#3a3a44", b: "#8a5a2b", d: "#ffd23f" },
    { h: "#c23a33", s: "#1f6f5c", p: "#4a3b57", b: "#6b6b78", d: "#7ad7ff" },
    // the fun ones — loud shirts, clashing hats, tour-van energy
    { h: "#ff2fb3", s: "#16e0c0", p: "#1f2a44", b: "#8a5a2b", d: "#ff2fb3" },
    { h: "#c3f542", s: "#8a5cf5", p: "#e8843d", b: "#6b6b78", d: "#c3f542" },
    { h: "#00c2ff", s: "#ffd23f", p: "#c23a33", b: "#8a5a2b", d: "#00c2ff" },
    { h: "#ff8a3d", s: "#ff2fb3", p: "#2f4a3c", b: "#6b6b78", d: "#ffd23f" },
    { h: "#6ee7a8", s: "#33415c", p: "#f2b632", b: "#8a5a2b", d: "#6ee7a8" },
    { h: "#ffffff", s: "#e0483d", p: "#00c2ff", b: "#6b6b78", d: "#ff6b9d" },
    { h: "#5a3ea8", s: "#c3f542", p: "#8d5a3a", b: "#8a5a2b", d: "#8a5cf5" },
    { h: "#141419", s: "#ff6b9d", p: "#34a06a", b: "#6b6b78", d: "#ff8a3d" },
  ];
  // deterministic per-player+hole randomness — same golfer looks/acts the same on
  // reload, but DIFFERENT golfers (and different holes) get different looks/routines
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let x = seed || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000) / 1000; }; }
  const FIXED = { k: "#26262c", o: "#141419" };
  const SKINS = ["#eab68f", "#d99b6c", "#8d5a3a", "#f0c9a6", "#b97a50"];
  // disc colors — assigned per CARD SLOT so no two players on a card ever throw the same color
  const DISCS = ["#ffd23f", "#ff2fb3", "#00c2ff", "#c3f542", "#ff8a3d", "#8a5cf5", "#f2f4f7", "#e0483d"];
  function spriteSVG(pose, pal, skin, disc) {
    const rows = POSES[pose] || POSES.stand;
    let r = "";
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
      const c = rows[y][x]; if (c === ".") continue;
      const col = c === "d" ? (disc || pal.d) : (c === "f" || c === "a") ? skin : (FIXED[c] || pal[c] || pal.s);
      r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + col + '"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13 18" shape-rendering="crispEdges">' + r + "</svg>";
  }
  const _cache = {};
  function spriteURL(pose, pi, si, disc) {
    const k = pose + pi + "_" + (si || 0) + "_" + (disc || "");
    if (!_cache[k]) _cache[k] = "data:image/svg+xml," + encodeURIComponent(spriteSVG(pose, PALETTES[pi % PALETTES.length], SKINS[(si || 0) % SKINS.length], disc));
    return _cache[k];
  }

  if (!document.getElementById("cw-pg-css")) {
    const st = document.createElement("style"); st.id = "cw-pg-css";
    st.textContent = "@keyframes cwPgBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes cwPgHop{0%,100%{transform:translateY(0)}40%{transform:translateY(-9px)}}@keyframes cwPgShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}@keyframes cwPgSpin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.45)}}@keyframes cwPgArc{0%{transform:translateY(0) scale(.8)}45%{transform:translateY(-34px) scale(1.3)}100%{transform:translateY(0) scale(.9)}}@keyframes cwPgArcPutt{0%{transform:translateY(0) scale(.9)}50%{transform:translateY(-10px) scale(1.05)}100%{transform:translateY(0) scale(.9)}}@keyframes cwPgCurL{0%,100%{transform:translateX(0)}50%{transform:translateX(-13px)}}@keyframes cwPgCurR{0%,100%{transform:translateX(0)}50%{transform:translateX(13px)}}@keyframes cwPgPuff{0%{transform:scale(.3);opacity:.85}100%{transform:scale(1.6);opacity:0}}@keyframes cwPgChain{0%,100%{transform:translateX(0)}20%{transform:translateX(-2px)}40%{transform:translateX(2px)}60%{transform:translateX(-1.5px)}80%{transform:translateX(1.5px)}}@keyframes cwPgChainSwing{0%,100%{transform:rotate(0)}30%{transform:rotate(10deg)}70%{transform:rotate(-8deg)}}";
    document.head.appendChild(st);
  }

  const seen = new Map(); // "hole:name" -> { tc, kind } — refresh-proof animation memory
  const ANIMS = {}; // per-hole golfer state — survives scroll-away/remount so rounds never restart

  // rAF disc flight: true bezier path (lateral S-curve), sine height with scale,
  // ground shadow tracking the flight line — reads like a real drive, not a slide
  function DiscFlight({ from, to, putt, color, curve }) {
    const wrapRef = React.useRef(null), discRef = React.useRef(null), shRef = React.useRef(null);
    const trailRefs = React.useRef([]);
    React.useEffect(() => {
      const wrap = wrapRef.current; if (!wrap) return;
      const dur = putt ? 900 : 1700, t0 = performance.now();
      const W = wrap.offsetWidth || 260, H = wrap.offsetHeight || 430;
      const x0 = from[0] / 100 * W, y0 = from[1] / 100 * H - 34; // leaves the hand
      const x1 = to[0] / 100 * W, y1 = to[1] / 100 * H - 4;
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const cw = (curve === "L" ? -1 : 1) * Math.min(30, len * 0.22) * (putt ? 0.25 : 1);
      const cx = (x0 + x1) / 2 + (-dy / len) * cw, cy = (y0 + y1) / 2 + (dx / len) * cw;
      const hMax = putt ? 9 : Math.min(46, 18 + len * 0.28);
      const hist = []; // recent positions — the trail
      let raf;
      const step = (now) => {
        const u = Math.min(1, (now - t0) / dur);
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        const bx = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * x1;
        const by = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y1;
        const h = Math.sin(Math.PI * e) * hMax;
        const sc = 0.9 + (h / 46) * 0.85;
        if (discRef.current) discRef.current.style.transform = "translate(" + bx + "px," + (by - h) + "px) scale(" + sc + ")";
        if (shRef.current) { shRef.current.style.transform = "translate(" + bx + "px," + by + "px) scale(" + (1 - h / 46 * 0.45) + ")"; shRef.current.style.opacity = String(0.38 - h / 46 * 0.22); }
        // trail: ghost images of where the disc just was, fading out behind it
        hist.unshift([bx, by - h, sc]); if (hist.length > 18) hist.pop();
        trailRefs.current.forEach((tr, k) => {
          const p = hist[(k + 1) * 5];
          if (tr) { if (p && u > 0.05 && u < 0.98) { tr.style.transform = "translate(" + p[0] + "px," + p[1] + "px) scale(" + p[2] * (0.8 - k * 0.18) + ")"; tr.style.opacity = String(0.3 - k * 0.09); } else tr.style.opacity = "0"; }
        });
        if (u < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, []);
    return (
      <div ref={wrapRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 90 }}>
        <div ref={shRef} style={{ position: "absolute", left: -5, top: -2, width: 10, height: 4, borderRadius: "50%", background: "rgba(0,0,0,.4)", filter: "blur(1px)", willChange: "transform" }} />
        {[0, 1, 2].map((k) => <div key={k} ref={(el) => { trailRefs.current[k] = el; }} style={{ position: "absolute", left: -9, top: -4.5, width: 18, height: 9, borderRadius: "50%", background: color, opacity: 0, willChange: "transform,opacity" }} />)}
        <div ref={discRef} style={{ position: "absolute", left: -9, top: -4.5, width: 18, height: 9, borderRadius: "50%", background: color, boxShadow: "0 0 0 2px #141419, 0 0 9px 2px " + color, willChange: "transform" }}>
          <div style={{ position: "absolute", inset: 1.5, borderRadius: "50%", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.55)" }} />
          <div style={{ position: "absolute", left: "38%", top: "30%", width: "24%", height: "40%", borderRadius: "50%", background: "rgba(20,20,25,.4)" }} />
          <div style={{ position: "absolute", left: "18%", top: "14%", width: "30%", height: "32%", borderRadius: "50%", background: "rgba(255,255,255,.55)" }} />
        </div>
      </div>
    );
  }
  const DEMO_ROWS = [{ name: "Demo A", lastKind: "birdie", ts: { throwCount: 1 } }, { name: "Demo B", lastKind: "par", ts: { throwCount: 2 } }, { name: "Demo C", lastKind: "bogey", ts: { toTarget: 30, throwCount: 3 } }, { name: "Demo D", lastKind: "par", ts: { throwCount: 2 } }];

  function spotOf(row) {
    const ts = row.ts || null;
    if (ts && ts.toTarget != null && ts.toTarget <= 66) return 3;
    const tc = ts && ts.throwCount != null ? ts.throwCount : 0;
    return Math.max(0, Math.min(2, tc - 1 >= 0 ? Math.min(tc, 2) : 0));
  }
  // spread golfers AROUND the spot (staging area), active thrower front-center;
  // px offsets, no overlap at 30px sprite width
  // tight spread — hug the fairway line so nobody stands in water/trees
  const SPREAD = [{ x: 0, y: 0 }, { x: -17, y: -15 }, { x: 17, y: -13 }, { x: 0, y: -29 }];

  // golfer footprint: rendered 30x42 px, anchored bottom-center on its point
  const GW = 30, GH = 42;

  function Layer({ hole, par, players, live }) {
    if (!enabled()) return null;
    if (!players || !players.length) { if (demo()) { players = DEMO_ROWS; live = true; } }
    const demoMode = players === DEMO_ROWS;
    const editMode = (function () { try { return localStorage.getItem("chains_pg_edit") === "1"; } catch (e) { return false; } })();
    const [, force] = React.useReducer((x) => x + 1, 0);
    const ref = React.useRef(null);
    const visRef = React.useRef(true);
    const animRef = React.useRef(null);
    if (!animRef.current) animRef.current = (ANIMS[hole] = ANIMS[hole] || {});
    const rosterRef = React.useRef({ sig: "", at: 0 });
    const restRef = React.useRef(false);
    const M = mapFor(hole);

    React.useEffect(() => {
      if (!ref.current || !window.IntersectionObserver) return;
      const io = new IntersectionObserver((es) => { visRef.current = es[0] ? es[0].isIntersecting : true; }, { threshold: 0.05 });
      io.observe(ref.current);
      return () => io.disconnect();
    }, []);

    // data-driven throws + reactions (signature-keyed: refreshes never restart)
    React.useEffect(() => {
      (players || []).forEach((r, i) => {
        const key = hole + ":" + r.name;
        const tc = (r.ts && r.ts.throwCount) || 0;
        const prev = seen.get(key) || { tc: -1, kind: null };
        const A = (animRef.current[r.name] = animRef.current[r.name] || {});
        if (A.spot == null) A.spot = 0; // everyone STARTS at the tee when the card appears
        if (!A.init) {
          // ARRIVING: file in from the bottom edge to the tee one after another;
          // the busy window keeps anyone from throwing until the card is in
          A.init = true; A.fromBottom = true; A.busyUntil = Date.now() + 3400 + i * 500;
          setTimeout(() => { A.fromBottom = false; force(); }, 120 + i * 450);
        }
        if (REDUCED) { seen.set(key, { tc: tc, kind: r.lastKind || prev.kind }); return; }
        if (tc > prev.tc && prev.tc >= 0 && visRef.current && !document.hidden) throwSeq(r, i, A);
        if (r.lastKind && r.lastKind !== prev.kind) {
          if (r.lastKind === "birdie" || r.lastKind === "eagle") { A.hop = true; setTimeout(() => { A.hop = false; force(); }, 1600); }
          else if (r.lastKind === "bogey" || r.lastKind === "dbogey") { A.shake = true; setTimeout(() => { A.shake = false; force(); }, 1200); }
          force();
        }
        seen.set(key, { tc: tc, kind: r.lastKind || prev.kind });
      });
    }, [players, hole]);

    // ambient cycle: golfers take turns throwing and WALK DOWN THE HOLE — the
    // card starts everyone at the tee and the group slowly progresses toward
    // the green the longer the card stays on screen
    React.useEffect(() => {
      if (REDUCED || !live || editMode) return;
      let t = null, stop = false;
      const tick = () => {
        if (stop) return;
        let fast = false;
        if (visRef.current && !document.hidden && players && players.length) {
          let cands = [];
          players.forEach((r, i) => {
            const A = (animRef.current[r.name] = animRef.current[r.name] || {});
            if (A.spot == null) A.spot = 0;
            // 3-throw show: drive to ~midway, second to the green, putt in —
            // sometimes a bomb reaches the green (2 throws), rare wild card takes 4
            if (A.total == null) { const roll = Math.random(); A.total = roll < 0.14 ? 2 : roll < 0.9 ? 3 : 4; }
            if (A.thrown == null) A.thrown = 0;
            const carded = r.lastKind != null || r.lastScore != null;
            const target = (demoMode || carded) ? 3 : Math.min(3, spotOf(r));
            if (!A.pose) cands.push({ r: r, i: i, A: A, target: target });
          });
          const active = cands.filter((c) => !c.A.done && (c.A.spot >= 2.8 || c.A.spot < c.target));
          // ONE SHOT AT A TIME: nobody throws while anyone on the card is still
          // mid-swing, watching a disc, walking to their lie, or filing in
          const busy = players.some((r) => { const A = animRef.current[r.name]; return A && (A.pose || (A.busyUntil && Date.now() < A.busyUntil)); });
          // order of play: away player (furthest from the basket) throws next;
          // on the tee that resolves by the honor system (best prior score first)
          const HONOR = { ace: 0, eagle: 1, birdie: 2, par: 3, bogey: 4, dbogey: 5 };
          if (rosterRef.current.sig !== players.map((r) => r.name).join("|")) { rosterRef.current = { sig: players.map((r) => r.name).join("|"), at: Date.now() }; }
          const settled = Date.now() - rosterRef.current.at > 4500;
          if (busy) fast = true; // check back soon, act the moment the card clears
          else if (active.length && settled) {
            const toThrow = active.filter((c) => !c.A.thrownRound);
            if (toThrow.length) {
              // everyone throws first — away player next, discs stay on the ground
              toThrow.sort((a, b) => (a.A.spot - b.A.spot) || ((HONOR[a.r.lastKind] != null ? HONOR[a.r.lastKind] : 3.5) - (HONOR[b.r.lastKind] != null ? HONOR[b.r.lastKind] : 3.5)));
              const pick = toThrow[0];
              throwSeq(pick.r, pick.i, pick.A); window.__pgThrows = (window.__pgThrows || 0) + 1;
            } else {
              // whole card has thrown — now they ALL walk to their discs together
              active.forEach((c) => {
                const A = c.A;
                if (A.pend) { A.spot = A.pend.land; A.jx = A.pend.jx; A.jy = A.pend.jy; A.busyUntil = Date.now() + 3100; A.pend = null; setTimeout(() => { A.landed = null; force(); }, 2800); }
                A.thrownRound = false;
              });
              force();
            }
          } else if (cands.length && cands.every((c) => c.A.gone)) {
            if (demoMode && !restRef.current) {
              // card finished and walked off — the hole RESTS empty a while, then
              // the next demo card rolls up to the tee
              restRef.current = true;
              setTimeout(() => {
                restRef.current = false;
                cands.forEach((c) => { c.A.spot = 0; c.A.putts = 0; c.A.thrown = 0; c.A.total = null; c.A.done = false; c.A.leaving = false; c.A.gone = false; c.A.pend = null; c.A.thrownRound = false; c.A.init = false; c.A.jx = 0; c.A.jy = 0; c.A.landed = null; c.A.salt = (c.A.salt || 0) + 1; c.A.ch = null; c.A.tele = true; });
                force();
                setTimeout(() => { cands.forEach((c) => { c.A.tele = false; }); force(); }, 120);
              }, 9000 + Math.random() * 7000);
            } // real players: course stays clear until the live data brings a new card
          } else if (cands.length && Math.random() < 0.4) {
            const p = cands[Math.floor(Math.random() * cands.length)];
            p.A.wander = { x: Math.round((Math.random() - 0.5) * 14), y: Math.round((Math.random() - 0.5) * 8) }; force();
          }
        }
        // PACE BUDGET: stretch the show — a card hangs around ~2.5 min like a
        // (condensed) real hole so people can actually watch it
        const P = Math.max(3, Math.min(5, par || 3));
        const beat = Math.max(7000, Math.min(15000, (140000 + (P - 3) * 20000) / Math.max(1, players.length * 3)));
        t = setTimeout(tick, window.CHAINS_PG_TICK || (fast ? 850 : beat * (0.85 + Math.random() * 0.35)));
      };
      t = setTimeout(tick, window.CHAINS_PG_TICK || (2500 + (hole % 6) * 700));
      return () => { stop = true; clearTimeout(t); };
    }, [players && players.length, live, hole]);

    // step up -> windup -> release + disc flies -> watch it -> WALK to where it
    // landed (spot advances; putts don't advance past the green)
    // per-golfer character sheet: palette, size, handedness, gait, lie jitter —
    // seeded by player name + hole so no two golfers (or holes) share a routine
    function charOf(name, i) {
      const A = (animRef.current[name] = animRef.current[name] || {});
      if (!A.ch) {
        const rnd = rng(hashStr(name + "#" + hole + "#" + (A.salt || 0))); // salt reshuffles every loop
        A.ch = {
          pal: (Math.floor(rnd() * PALETTES.length) + i * 5) % PALETTES.length, // spread the wardrobe — card-mates never match
          skin: Math.floor(rnd() * SKINS.length),
          disc: DISCS[(i % 4) + 4 * Math.floor(rnd() * 2)], // slot-keyed — unique color per player on the card
          flip: rnd() < 0.4, // lefties exist
          scale: 0.92 + rnd() * 0.24,
          bobDur: (1.8 + rnd() * 1.4).toFixed(2),
          bobDelay: (rnd() * 1.5).toFixed(2),
          windup: 320 + Math.floor(rnd() * 260),
          jit: PATH.map(() => [ (rnd() - 0.5) * 5, (rnd() - 0.5) * 4 ]), // small % lie jitter, hugs the line
          sp: null, // filled below: slot position + tiny jitter (no overlaps)
        };
        // waiting spots: fixed non-overlapping slots by index, small seeded jitter
        const SLOTS = [{ x: 0, y: 0 }, { x: -24, y: -16 }, { x: 24, y: -14 }, { x: -4, y: -31 }];
        const sl = SLOTS[i % SLOTS.length];
        A.ch.sp = i === 0 ? { x: 0, y: 0 } : { x: sl.x + Math.round((rnd() - 0.5) * 8), y: sl.y - Math.round(rnd() * 5) };
      }
      return A.ch;
    }

    function throwSeq(row, i, A) {
      const ch = charOf(row.name, i);
      const si = A.spot != null ? A.spot : 0;
      const putt = si >= 2.8;
      const total = A.total || 3, left = Math.max(1, total - (A.thrown || 0));
      // plan the landing so the hole takes exactly `total` throws: drives still
      // fly, mid throws split the remaining distance, the last field throw must
      // reach the green, and the final putt holes out
      let land;
      if (putt) land = 4;
      else if (left <= 2) land = 3; // has to get there now
      else {
        const stepLen = (3 - si) / (left - 1);
        if (left > 2 && Math.random() < 0.1) land = si + 0.2 + Math.random() * 0.35; // duffed one! barely moves
        else {
          land = Math.min(3, si + stepLen * (0.75 + Math.random() * 0.5));
          if (si <= 0.05) land = Math.max(land, 1.35 + Math.random() * 0.9); // drives fly — and scatter
        }
      }
      const jm = M.jmax != null ? M.jmax : 4; // safe corridor half-width (%)
      const jx = putt ? 0 : (Math.random() - 0.5) * 2 * jm, jy = putt ? 0 : (Math.random() - 0.5) * 7;
      const f0 = pointAt(M, si), t0 = pointAt(M, land);
      const from = [f0[0] + (A.jx || 0), f0[1] + (A.jy || 0)];
      const to = [t0[0] + jx, t0[1] + jy];
      const w = ch.windup;
      const fl = putt ? 950 : 1700; // savor the flight — it's the fun part
      A.wander = null;
      A.busyUntil = Date.now() + w + fl + (putt ? 1800 : 1000); // swing + flight + a beat — the walk happens together later
      A.pose = putt ? "putt" : "windup"; force();
      setTimeout(() => { A.pose = "release"; A.disc = { from: from, to: to, putt: putt, curve: Math.random() < 0.5 ? "L" : "R" }; force(); }, w);
      setTimeout(() => { A.pose = "watch"; force(); }, w + 600);
      setTimeout(() => {
        A.disc = null;
        A.puff = { at: to, putt: putt }; // landing puff (chain-rattle on putts)
        setTimeout(() => { A.puff = null; force(); }, putt ? 1300 : 650);
        A.thrown = (A.thrown || 0) + 1;
        if (!putt) { A.pend = { land: land, jx: jx, jy: jy }; A.thrownRound = true; A.landed = { at: to }; } // disc STAYS on the ground at the lie until the group walk
        else {
          A.thrownRound = true;
          A.putts = (A.putts || 0) + 1;
          if (A.thrown >= A.total) {
            A.done = true; // holed out — react to the score they actually carded
            const k = row.lastKind;
            if (k === "birdie" || k === "eagle" || k === "ace") A.hop = true;
            else if (k === "bogey" || k === "dbogey") A.shake = true;
            else if (Math.random() < 0.4) A.hop = true;
          }
        }
        force();
      }, w + fl); // walk to the lie
      setTimeout(() => { A.pose = null; A.hop = false; A.shake = false; force(); }, w + fl + 1600);
      // holed out — walk off toward the exit and fade; the course clears for the
      // next card (their scores stay on the card rows below)
      setTimeout(() => { if (A.done) { A.leaving = true; force(); } }, w + fl + 2300);
      setTimeout(() => { if (A.done) { A.gone = true; force(); } }, w + fl + 5100);
    }

    const editIdx = React.useRef(0);
    function onEditClick(e) {
      const b = ref.current.getBoundingClientRect();
      const x = Math.round(((e.clientX - b.left) / b.width) * 100), y = Math.round(((e.clientY - b.top) / b.height) * 100);
      const order = ["tee", "fair1", "fair2", "putt", "basket", "exit"];
      const k = order[editIdx.current % order.length]; editIdx.current++;
      let o = {}; try { o = JSON.parse(localStorage.getItem("chains_pg_map") || "{}") || {}; } catch (err) {}
      o[String(hole)] = Object.assign({}, o[String(hole)]); o[String(hole)][k] = [x, y];
      try { localStorage.setItem("chains_pg_map", JSON.stringify(o)); } catch (err) {}
      console.log("[pg-map] hole " + hole + " " + k + " = [" + x + "," + y + "]  full:", JSON.stringify(o));
      force();
    }

    const rows = (players || []).slice(0, 4);
    return (
      <div ref={ref} onClick={editMode ? onEditClick : undefined} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: editMode ? "auto" : "none", cursor: editMode ? "crosshair" : "default", zIndex: 1 }}>
        {rows.map((r, i) => {
          const A = animRef.current[r.name] || {};
          if (A.gone) return null; // walked off to the next hole
          const ch = charOf(r.name, i);
          const si = A.spot != null ? A.spot : 0; // walked progress, NOT raw data — starts at tee
          const p0 = A.leaving ? (M.exit || [88, 10]) : pointAt(M, Math.min(si, 3));
          const pt = A.fromBottom ? [p0[0] + (A.jx || 0), 112] : A.leaving ? p0 : [p0[0] + (A.jx || 0), p0[1] + (A.jy || 0)];
          const throwing = !!A.pose;
          // tight corridor holes (water) squeeze the waiting spread + wander too
          const jm = M.jmax != null ? M.jmax : 4;
          const sq = Math.min(1, jm / 4);
          const wx = ((A.wander && A.wander.x) || 0) * sq, wy = (A.wander && A.wander.y) || 0;
          const ox = (throwing ? 0 : ch.sp.x * sq + wx), oy = (throwing ? 6 : ch.sp.y + wy);
          const pose = A.pose || (A.hop ? "cheer" : "stand");
          const gw = Math.round(GW * ch.scale), gh = Math.round(GH * ch.scale);
          // body lean sells the throw: rock back on windup, whip forward on release
          const dir = ch.flip ? -1 : 1;
          const lean = (pose === "windup" ? "rotate(" + (-10 * dir) + "deg)" : pose === "putt" ? "rotate(" + (-5 * dir) + "deg)" : pose === "release" ? "rotate(" + (12 * dir) + "deg)" : "") + (ch.flip ? " scaleX(-1)" : "");
          const anim = REDUCED ? "none" : A.hop ? "cwPgHop .8s ease-in-out 2" : A.shake ? "cwPgShake .3s linear 4" : throwing ? "none" : "cwPgBob " + ch.bobDur + "s ease-in-out " + ch.bobDelay + "s infinite";
          return (
            <div key={r.name} title={r.name} style={{ position: "absolute", left: "calc(" + pt[0] + "% + " + (ox - gw / 2) + "px)", top: "calc(" + pt[1] + "% + " + (oy - gh) + "px)", width: gw, height: gh + 4, opacity: A.leaving ? 0 : 1, transition: (REDUCED || A.tele) ? "none" : "left 2.6s ease-in-out, top 2.6s ease-in-out, opacity 2.4s ease .4s", zIndex: 10 + Math.round(oy) + (throwing ? 40 : 0) }}>
              <div style={{ position: "absolute", left: "50%", top: -11 - (i % 2) * 10, transform: "translateX(-50%)", padding: "1px 5px", borderRadius: 4, background: "rgba(12,22,15,0.72)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 7.5, letterSpacing: ".02em", color: "#fff", whiteSpace: "nowrap", maxWidth: 74, overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
              <div style={{ position: "absolute", left: "12%", bottom: 0, width: "76%", height: 7, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 70%)" }} />
              <div style={{ position: "absolute", inset: "0 0 4px 0", animation: anim, transform: lean || "none", transformOrigin: "50% 88%", transition: "transform .18s ease" }}>
                <img src={spriteURL(pose, ch.pal, ch.skin, ch.disc)} alt="" width={gw} height={gh} style={{ display: "block", imageRendering: "pixelated" }} />
              </div>
            </div>
          );
        })}
        {rows.map((r, i) => {
          const A = animRef.current[r.name] || {};
          if (!A.landed || REDUCED) return null;
          const ch = charOf(r.name, i);
          const pal = PALETTES[ch.pal % PALETTES.length];
          return <div key={"l" + r.name} style={{ position: "absolute", left: "calc(" + A.landed.at[0] + "% - 7px)", top: "calc(" + A.landed.at[1] + "% - 4px)", width: 14, height: 7, borderRadius: "50%", background: ch.disc || pal.d, boxShadow: "0 0 0 1.5px #141419, inset 0 -2px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.45)", zIndex: 8 }} />;
        })}
        {rows.map((r, i) => {
          const A = animRef.current[r.name] || {};
          if (!A.disc || REDUCED) return null;
          const ch = charOf(r.name, i);
          const pal = PALETTES[ch.pal % PALETTES.length];
          return <DiscFlight key={"d" + r.name + (A.disc.from[0] + "_" + A.disc.to[0])} from={A.disc.from} to={A.disc.to} putt={A.disc.putt} color={ch.disc || pal.d} curve={A.disc.curve} />;
        })}
        {rows.map((r, i) => {
          const A = animRef.current[r.name] || {};
          if (!A.puff || REDUCED) return null;
          const ch = charOf(r.name, i);
          const pal = PALETTES[ch.pal % PALETTES.length];
          const p = A.puff.at;
          return (
            <div key={"p" + r.name} style={{ position: "absolute", left: "calc(" + p[0] + "% - 9px)", top: "calc(" + p[1] + "% - " + (A.puff.putt ? 34 : 8) + "px)", width: 18, height: A.puff.putt ? 26 : 10, zIndex: 88, pointerEvents: "none" }}>
              {A.puff.putt
                ? <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    {[0, 1, 2].map((s) => <div key={s} style={{ position: "absolute", left: 4 + s * 5, top: 2, width: 2, height: 17, background: "linear-gradient(#e8ebef,#8a919c)", transformOrigin: "50% 0", animation: "cwPgChainSwing .55s ease-in-out " + (s * 0.07) + "s 2" }} />)}
                    <div style={{ position: "absolute", left: 1, top: -3, width: 16, height: 5, borderRadius: "50%", boxShadow: "0 0 9px 3px " + (ch.disc || pal.d), opacity: 0.85 }} />
                  </div>
                : <div style={{ width: 18, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,.7)", animation: "cwPgPuff .6s ease-out forwards" }} />}
            </div>
          );
        })}
        {editMode && (
          <div style={{ position: "absolute", top: 4, right: 4, padding: "3px 7px", borderRadius: 6, background: "rgba(12,22,15,0.85)", fontFamily: "monospace", fontSize: 9, color: "#ffd23f", pointerEvents: "none" }}>MAP EDIT — click: tee→fair1→fair2→putt→basket→exit</div>
        )}
        {editMode && ["tee", "fair1", "fair2", "putt", "basket", "exit"].map((k) => {
          const p = M[k]; if (!p) return null;
          return <div key={"m" + k} style={{ position: "absolute", left: "calc(" + p[0] + "% - 4px)", top: "calc(" + p[1] + "% - 4px)", width: 8, height: 8, borderRadius: "50%", border: "1.5px solid #ffd23f", background: "rgba(255,210,63,0.3)", pointerEvents: "none" }}><span style={{ position: "absolute", left: 10, top: -3, fontFamily: "monospace", fontSize: 8, color: "#ffd23f" }}>{k}</span></div>;
        })}
      </div>
    );
  }

  window.ChainsPixelGolfers = { Layer: Layer, enabled: enabled, demo: demo };
})();
