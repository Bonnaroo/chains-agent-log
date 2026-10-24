/* Chains app — "This Week" tournament view. window.ThisWeekView
   Read-only: weather (wttr.in) + our league fantasy scores + pro leaderboard
   + tomorrow's lead card for the CURRENT event. Never writes Firebase/state.
   Auto-refreshes event data every 5 min (paused when tab hidden); weather 30 min. */
(function () {
  const ED = () => window.ExploreData;
  const PS = () => window.ChainsProStats;

  function Empty({ title, sub }) {
    return (
      <div style={{ padding: "26px 16px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-muted)" }}>{title}</div>
        {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)", marginTop: 5, lineHeight: 1.5 }}>{sub}</div>}
      </div>
    );
  }

  // ---- city map (PDGA API has no location) — keyed by REGISTRATION event id.
  // Covers the upcoming events so weather doesn't go blank on rollover.
  // NOTE: PDGA reassigned 96411 from the European Open (T10) to the Swedish
  // Open (T11); T10 is now 97339. Keep keys in lockstep with prostats.js.
  const CITY = {
    "96410": { q: "Portland", label: "Portland, OR" },   // T9  Northwest Championship
    "97339": { q: "Tallinn", label: "Tallinn, Estonia" }, // T10 European Open
    "96411": { q: "Boras", label: "Borås, Sweden" },     // T11 Swedish Open
    "96412": { q: "Nol", label: "Nol, Sweden" },         // T12 Ale Open
    "96413": { q: "Heinola", label: "Heinola, Finland" }, // T13 Heinola Open
  };
  const TZ = {
    "96410": "America/Los_Angeles",
    "97339": "Europe/Tallinn",   // T10 European Open
    "96411": "Europe/Stockholm", // T11 Swedish Open (Borås)
    "96412": "Europe/Stockholm", // T12 Ale Open (Nol)
    "96413": "Europe/Helsinki",  // T13 Heinola Open (Finland)
  };
  function tzFor(eventId) { return TZ[eventId] || "Europe/Stockholm"; }

  // ---- which slot is the current event? ----------------------------------
  // Prefer the live event, else the next upcoming one.
  function currentSlot() {
    const meta = ChainsEngine.seasonMeta();
    const e = meta.live || meta.next;
    return e || null;
  }

  // ---- defensive row readers (live shape: pdgaNum/toPar/total/place) ------
  const rowName = (r) => (PS() && PS()._nameOf(r)) || [r.firstName, r.lastName].filter(Boolean).join(" ");
  const rowPdga = (r) => { const v = r.pdgaNumber != null ? r.pdgaNumber : (r.pdgaNum != null ? r.pdgaNum : r.pdga_number); return v == null ? null : String(v); };
  const rowToPar = (r) => (r.toPar != null ? r.toPar : (r.to_par != null ? r.to_par : null));
  const rowPlace = (r) => (r.place != null ? r.place : (r.placement != null ? r.placement : 0));
  const rowTotal = (r) => (r.total != null ? r.total : null);
  const rowRounds = (r) => r.liveRoundResults || r.rounds || [];

  function maxRound(rows) {
    let m = 0;
    rows.forEach((r) => { const n = rowRounds(r).length; if (n > m) m = n; });
    return m;
  }
  // par-per-round, derived from a fully-scored player (total_strokes - to_par)
  // / rounds played; falls back to 63 (The Rockstar / most DGPT layouts).
  function parPerRound(rows) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]; const rds = rowRounds(r);
      const ts = r.total_strokes != null ? r.total_strokes : (r.total != null ? r.total : null);
      const tp = rowToPar(r);
      if (ts != null && tp != null && rds.length > 0) { const v = Math.round((ts - tp) / rds.length); if (v > 40 && v < 90) return v; }
    }
    return 63;
  }
  // Standings AFTER a given round, computed from each player's rounds[] —
  // cumulative to-par through round vr, plus that round's own to-par.
  function roundStandings(rows, vr, par) {
    const out = [];
    const okStroke = (s) => s != null && isFinite(s) && Number(s) >= 30 && Number(s) <= 100; // sane 18-hole stroke count
    rows.forEach((r) => {
      const rds = rowRounds(r);
      if (rds.length < vr) return; // didn't play that round
      let cumStrokes = 0, ok = true;
      for (let i = 0; i < vr; i++) {
        const s = rds[i] && rds[i].score;
        if (!okStroke(s)) { ok = false; break; }   // missing OR garbage -> exclude
        cumStrokes += Number(s);
      }
      if (!ok) return;
      const roundScore = Number(rds[vr - 1].score);
      const roundToPar = roundScore - par;
      const cumToPar = cumStrokes - par * vr;
      // final sanity: real golf scores stay within a believable band
      if (roundToPar < -25 || roundToPar > 35 || cumToPar < -60 || cumToPar > 80) return;
      out.push({
        row: r, name: rowName(r), pdga: rowPdga(r),
        place: rds[vr - 1].place_after != null ? rds[vr - 1].place_after : null,
        cumToPar: cumToPar,
        roundToPar: roundToPar,
      });
    });
    out.sort((a, b) => {
      const pa = a.place || 999, pb = b.place || 999;
      if (pa !== pb) return pa - pb;
      return a.cumToPar - b.cumToPar;
    });
    return out;
  }
  function isPreEvent(rows) {
    // No one has a score yet.
    return !rows.some((r) => rowToPar(r) != null || rowRounds(r).length > 0);
  }

  function fmtPar(v) {
    if (v == null) return "—";
    if (v === 0) return "E";
    return v > 0 ? "+" + v : String(v);
  }
  function parColor(v) { return v == null ? "var(--text-faint)" : v < 0 ? "var(--fairway-600)" : v > 0 ? "var(--clay-600, #b4452f)" : "var(--text-muted)"; }
  const ordinal = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  /* ===================== WEATHER ========================================= */
  // Map a wttr.in condition (weatherCode / description) to one of our icon kinds.
  function weatherKind(code, desc) {
    desc = (desc || "").toLowerCase();
    code = Number(code) || 0;
    if (/thunder/.test(desc) || [200, 386, 389, 392, 395].includes(code)) return "storm";
    if (/(fog|mist)/.test(desc) || [143, 248, 260].includes(code)) return "fog";
    if (/(rain|drizzle|shower)/.test(desc) || (code >= 263 && code <= 359)) return "rain";
    if (/(snow|sleet|ice)/.test(desc) || (code >= 323 && code <= 377)) return "rain";
    if (/overcast/.test(desc) || code === 122) return "cloud";
    if (/(cloud|partly)/.test(desc) || [116, 119].includes(code)) return "partly";
    return "sun";
  }

  function WeatherIcon({ kind, size = 56 }) {
    const s = { width: size, height: size, display: "block" };
    if (kind === "sun") {
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <g className="cw-spin" style={{ transformOrigin: "32px 32px" }} stroke="#F2A900" strokeWidth="3" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return <line key={a} x1={32 + Math.cos(r) * 19} y1={32 + Math.sin(r) * 19} x2={32 + Math.cos(r) * 26} y2={32 + Math.sin(r) * 26} />; })}
          </g>
          <circle className="cw-pulse" cx="32" cy="32" r="12" fill="#FDB827" style={{ transformOrigin: "32px 32px" }} />
        </svg>
      );
    }
    if (kind === "partly") {
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <g className="cw-spin" style={{ transformOrigin: "24px 24px" }} stroke="#F2A900" strokeWidth="2.4" strokeLinecap="round">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return <line key={a} x1={24 + Math.cos(r) * 12} y1={24 + Math.sin(r) * 12} x2={24 + Math.cos(r) * 17} y2={24 + Math.sin(r) * 17} />; })}
          </g>
          <circle cx="24" cy="24" r="8" fill="#FDB827" />
          <g className="cw-drift"><path d="M20 44a9 9 0 0 1 1.5-17.8A12 12 0 0 1 44 30.5a8 8 0 0 1-1 16H20z" fill="#C7CEC9" stroke="#9aa6a0" strokeWidth="1.2" /></g>
        </svg>
      );
    }
    if (kind === "cloud") {
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <g className="cw-drift2"><path d="M16 40a10 10 0 0 1 2-19.8A13 13 0 0 1 43 25a9 9 0 0 1-1 17H16z" fill="#aeb8b2" stroke="#8a948e" strokeWidth="1.2" /></g>
          <g className="cw-drift"><path d="M22 46a9 9 0 0 1 1.5-17.8A12 12 0 0 1 46 32.5a8 8 0 0 1-1 16H22z" fill="#C7CEC9" stroke="#9aa6a0" strokeWidth="1.2" /></g>
        </svg>
      );
    }
    if (kind === "rain") {
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <g className="cw-drift"><path d="M18 36a9 9 0 0 1 1.5-17.8A12 12 0 0 1 42 22.5a8 8 0 0 1-1 16H18z" fill="#C7CEC9" stroke="#9aa6a0" strokeWidth="1.2" /></g>
          {[24, 32, 40].map((x, i) => <line key={x} className="cw-rain" style={{ animationDelay: i * 0.25 + "s" }} x1={x} y1="42" x2={x - 2} y2="50" stroke="#5B8DEF" strokeWidth="2.6" strokeLinecap="round" />)}
        </svg>
      );
    }
    if (kind === "storm") {
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M18 34a9 9 0 0 1 1.5-17.8A12 12 0 0 1 42 20.5a8 8 0 0 1-1 16H18z" fill="#aeb8b2" stroke="#8a948e" strokeWidth="1.2" />
          <polygon className="cw-flash" points="32,38 26,50 31,50 28,60 40,46 34,46 38,38" fill="#FDB827" />
        </svg>
      );
    }
    if (kind === "fog") {
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M18 30a9 9 0 0 1 1.5-17.8A12 12 0 0 1 42 16.5a8 8 0 0 1-1 16H18z" fill="#C7CEC9" stroke="#9aa6a0" strokeWidth="1.2" />
          {[40, 47, 54].map((y, i) => <line key={y} className="cw-fog" style={{ animationDelay: i * 0.4 + "s" }} x1="14" y1={y} x2="50" y2={y} stroke="#aeb8b2" strokeWidth="3" strokeLinecap="round" />)}
        </svg>
      );
    }
    return null;
  }

  // Animated wind indicator — streaks blow faster/stronger as mph climbs.
  function WindBadge({ mph, dir, windy }) {
    const speed = Math.max(0.5, 2.2 - Math.min(mph, 30) / 18); // higher mph -> shorter duration
    const col = windy ? "var(--clay-600, #b4452f)" : "var(--text-muted)";
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="22" height="16" viewBox="0 0 22 16" style={{ display: "block", overflow: "visible" }}>
          {[{ y: 4, w: 13, d: 0 }, { y: 8, w: 17, d: 0.2 }, { y: 12, w: 10, d: 0.4 }].map((s, i) => (
            <line key={i} className="cw-windline" x1="0" y1={s.y} x2={s.w} y2={s.y} stroke={col} strokeWidth="2" strokeLinecap="round"
              style={{ animationDuration: speed + "s", animationDelay: s.d + "s" }} />
          ))}
        </svg>
        <span>{mph} mph {dir}{windy ? " — windy" : ""}</span>
      </span>
    );
  }

  function LiveClock({ cityLabel, tz }) {
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
      const iv = setInterval(() => setNow(new Date()), 30000);
      return () => clearInterval(iv);
    }, []);
    const t = (zone) => { try { return new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(now); } catch (e) { return "—"; } };
    const dateStr = (() => { try { return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(now); } catch (e) { return ""; } })();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "7px 14px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, color: "var(--text-faint)" }}>{dateStr}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 4, alignItems: "baseline" }}><b style={{ color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{t(tz)}</b> {cityLabel.split(",")[0]}</span>
        <span style={{ opacity: .5 }}>·</span>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "baseline" }}><b style={{ color: "var(--text-strong)", fontVariantNumeric: "tabular-nums" }}>{t("America/New_York")}</b> ET</span>
      </div>
    );
  }

  function Weather({ slot, mobile }) {
    const eventId = PS() ? PS().eventIdForSlot(slot.t) : null;
    const city = eventId ? CITY[eventId] : null;
    const [w, setW] = React.useState(null);
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
      if (!city) { setFailed(true); return; }
      let alive = true;
      function pull() {
        fetch("https://wttr.in/" + encodeURIComponent(city.q) + "?format=j1", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((j) => { if (alive) { setW(j); setFailed(false); } })
          .catch(() => { if (alive) setFailed(true); });
      }
      pull();
      const iv = setInterval(() => { if (!document.hidden) pull(); }, 1800000); // 30 min
      return () => { alive = false; clearInterval(iv); };
    }, [eventId]);

    if (!city || failed || !w) return null;
    const cur = (w.current_condition || [])[0];
    if (!cur) return null;
    const kind = weatherKind(cur.weatherCode, (cur.weatherDesc || [{}])[0].value);
    const wind = Math.round(Number(cur.windspeedMiles) || (Number(cur.windspeedKmph) || 0) * 0.621);
    const windy = wind > 12;
    const days = (w.weather || []).slice(0, 3);
    const roundLabels = ["R1", "R2", "R3"];
    // Label each forecast day by the ACTUAL round on that calendar day. Today may be
    // R2/R3 mid-tournament, so a fixed "R1, R2, R3" mislabels today's weather (and
    // makes tomorrow's rain read as "R2"). Map date -> round via the event start date.
    const _wem = (window.ChainsSeason && ChainsSeason.byT && slot && ChainsSeason.byT[slot.t]) || {};
    const _startISO = _wem.start_date || null;
    const _roundCount = _wem.rounds || days.length || 3;
    const colLabel = (dateStr, idx) => {
      if (_startISO && dateStr) {
        const s = new Date(_startISO + "T00:00:00"), d = new Date(dateStr + "T00:00:00");
        if (!isNaN(s) && !isNaN(d)) {
          const rn = Math.round((d - s) / 86400000) + 1;
          if (rn >= 1 && rn <= _roundCount) return "R" + rn;
          return d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
        }
      }
      return roundLabels[idx] || ("R" + (idx + 1));
    };

    return (
      <Card pad={0}>
        <LiveClock cityLabel={city.label} tz={tzFor(eventId)} />
        <div style={{ display: "flex", alignItems: "center", gap: mobile ? 12 : 18, padding: mobile ? "14px 16px" : "18px 22px", flexWrap: "wrap" }}>
          {/* icon + current */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: mobile ? "1 1 100%" : "0 0 auto" }}>
            <WeatherIcon kind={kind} size={mobile ? 50 : 58} />
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 30, color: "var(--text-strong)", lineHeight: 1 }}>{cur.temp_F}°</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)" }}>{(cur.weatherDesc || [{}])[0].value}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: windy ? 700 : 500, color: windy ? "var(--clay-600, #b4452f)" : "var(--text-muted)" }}>
                <span>{city.label}</span><span style={{ opacity: .5 }}>·</span>
                <WindBadge mph={wind} dir={cur.winddir16Point} windy={windy} />
              </div>
            </div>
          </div>
          {/* forecast */}
          <div style={{ display: "flex", gap: mobile ? 10 : 14, marginLeft: mobile ? 0 : "auto", flex: mobile ? "1 1 100%" : "0 0 auto", justifyContent: mobile ? "space-between" : "flex-end" }}>
            {days.map((d, i) => {
              const noon = (d.hourly || []).find((h) => h.time === "1200") || (d.hourly || [])[0] || {};
              const k = weatherKind(noon.weatherCode, (noon.weatherDesc || [{}])[0].value);
              return (
                <div key={i} style={{ textAlign: "center", minWidth: 52 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>{colLabel(d.date, i)}</div>
                  <WeatherIcon kind={k} size={30} />
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-strong)", marginTop: 3 }}>{d.maxtempF}°<span style={{ color: "var(--text-faint)" }}>/{d.mintempF}°</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  /* ===================== OUR LEAGUE ====================================== */
  function OurLeague({ slot, rows, pre, round, mobile }) {
    const _em = (window.ChainsSeason && ChainsSeason.byT && slot && ChainsSeason.byT[slot.t]) || {};
    const _rc = _em.rounds || maxRound(rows) || 3;
    const _startDay = (() => { if (!_em.start_date) return "Thursday"; const d = new Date(_em.start_date + "T00:00:00"); return isNaN(d) ? "Thursday" : d.toLocaleDateString(undefined, { weekday: "long" }); })();
    const members = ChainsEngine.members();
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const pickByMember = {}; picks.forEach((row) => { pickByMember[row.m] = [row.p1, row.p2]; });
    // name -> live row, matched by exact name AND normalized first+last (the feed
    // may carry a middle name / accents, e.g. "Calvin Thor Heimburg" vs "Calvin
    // Heimburg", "Väinö Mäkelä" vs "Vaino Makela") so no pick silently drops out.
    const twNorm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, " ");
    const twFL = (s) => { const w = twNorm(s).split(" ").filter(Boolean); return w.length >= 2 ? w[0] + " " + w[w.length - 1] : twNorm(s); };
    const byName = {}; const byFL = {};
    rows.forEach((r) => { const n = rowName(r); if (n) { byName[n] = r; byFL[twFL(n)] = r; } });
    const findRow = (nm) => nm ? (byName[nm] || byFL[twFL(nm)] || null) : null;

    const cards = members.map((m) => {
      const ps = pickByMember[m.id] || [null, null];
      const slots = ps.map((nm) => {
        if (!nm) return { name: null, toPar: null, dnf: false };
        const r = findRow(nm);
        if (!r) return { name: nm, toPar: null, dnf: false, missing: true };
        return { name: nm, toPar: rowToPar(r), dnf: rowPlace(r) === 0 && !pre && rowToPar(r) == null };
      });
      const vals = slots.map((s) => s.toPar).filter((v) => v != null);
      const combined = vals.length ? vals.reduce((a, b) => a + b, 0) : null;
      return { m, slots, combined, hasScore: vals.length > 0 };
    });

    // rank by combined (most negative first); members without a score sort last; tie alpha
    const ranked = cards.slice().sort((a, b) => {
      if (a.combined == null && b.combined == null) return a.m.name.localeCompare(b.m.name);
      if (a.combined == null) return 1;
      if (b.combined == null) return -1;
      if (a.combined !== b.combined) return a.combined - b.combined;
      return a.m.name.localeCompare(b.m.name);
    });

    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "14px 16px 10px" : "16px 22px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Our League</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{pre ? "Starting " + _startDay + " — picks locked in" : "Round " + round + " of " + _rc + " · combined to-par of each member's two pros"}</div>
        </div>
        <div style={{ padding: mobile ? "10px 12px" : "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {ranked.map((c, i) => {
            const leader = i === 0 && c.hasScore && !pre;
            return (
              <div key={c.m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: mobile ? "10px 12px" : "12px 14px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", borderLeft: "3px solid " + c.m.disc, boxShadow: leader ? "0 0 0 1px var(--fairway-300, #b6d8c2), var(--shadow-md)" : "var(--shadow-xs)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 22, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: pre ? "var(--text-faint)" : leader ? "var(--fairway-600)" : "var(--text-muted)" }}>{pre || !c.hasScore ? "·" : ordinal(i + 1)}</div>
                <Avatar name={c.m.name} color={c.m.disc} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--text-strong)", marginBottom: 3 }}>{c.m.name}</div>
                  <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 1 : 14 }}>
                    {c.slots.map((s, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: s.name ? "var(--text-muted)" : "var(--text-faint)", fontStyle: s.name ? "normal" : "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: mobile ? 160 : 130 }}>{s.name || "— pick pending —"}</span>
                        {s.name && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: pre ? "var(--text-faint)" : parColor(s.toPar) }}>{pre ? "" : s.dnf || s.missing ? "—" : fmtPar(s.toPar)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {pre ? (
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: "var(--text-faint)" }}>R1 Thu</span>
                  ) : (
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: parColor(c.combined) }}>{c.combined == null ? "—" : fmtPar(c.combined)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ===================== LEADERBOARD ===================================== */
  function Leaderboard({ slot, rows, pre, round, viewRound, mobile }) {
    const members = ChainsEngine.members();
    const picks = ChainsEngine.picksFor(slot.t) || [];
    // name -> [member ids who picked them]
    const pickedBy = {};
    picks.forEach((row) => { [row.p1, row.p2].forEach((nm) => { if (nm) (pickedBy[nm] = pickedBy[nm] || []).push(row.m); }); });
    const memById = {}; members.forEach((m) => { memById[m.id] = m; });

    if (pre) {
      return (
        <Card pad={0}>
          <LbHeader mobile={mobile} round={round} pre />
          <Empty title="Leaderboard updates when Round 1 completes" sub="Check back Thursday evening." />
        </Card>
      );
    }

    const vr = viewRound || round;
    const par = parPerRound(rows);
    const standings = roundStandings(rows, vr, par).slice(0, 10);

    return (
      <Card pad={0}>
        <LbHeader mobile={mobile} round={vr} />
        <div style={{ padding: mobile ? "6px 12px 12px" : "6px 16px 14px" }}>
          {standings.length === 0 ? (
            <Empty title={"Round " + vr + " hasn't posted yet"} sub="Standings appear once scores land." />
          ) : standings.map((s, i) => {
            const nm = s.name;
            const drafters = (pickedBy[nm] || []).map((id) => memById[id]).filter(Boolean);
            const mine = drafters.length > 0;
            return (
              <div key={s.pdga || nm || i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 8px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: mine ? "var(--fairway-50)" : "transparent", borderRadius: mine ? "var(--radius-sm)" : 0 }}>
                <span style={{ minWidth: 22, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 ? "var(--ace-500)" : "var(--text-faint)" }}>{s.place || i + 1}</span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: mine ? 700 : 500, fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm}</span>
                {drafters.map((m) => <Avatar key={m.id} name={m.name} color={m.disc} size={18} />)}
                <span title={"Round " + vr} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)", minWidth: 34, textAlign: "right" }}>{fmtPar(s.roundToPar)}</span>
                <span title="Event total" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14.5, color: parColor(s.cumToPar), minWidth: 38, textAlign: "right" }}>{fmtPar(s.cumToPar)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }
  function LbHeader({ mobile, round, pre }) {
    return (
      <div style={{ padding: mobile ? "14px 16px 10px" : "16px 22px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Leaderboard</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{pre ? "Top 10 · pro field" : "Top 10 · through R" + round + " · round / event total"}</div>
      </div>
    );
  }

  /* ===================== LEAD CARD TOMORROW ============================== */
  function LeadCard({ rows, pre, round, mobile }) {
    if (pre || round < 1 || round >= 3) return null; // hide pre-event and on/after final round
    const top4 = rows.slice()
      .filter((r) => rowPlace(r) > 0 || rowToPar(r) != null)
      .sort((a, b) => (rowPlace(a) || 999) - (rowPlace(b) || 999))
      .slice(0, 4);
    if (top4.length < 4) return null;
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "14px 16px 10px" : "16px 22px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Tomorrow's Lead Card</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Top 4 after R{round} — they tee off together</div>
        </div>
        <div style={{ padding: mobile ? "10px 12px" : "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {top4.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--bg-elevated)" }}>
              <span style={{ minWidth: 18, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text-faint)" }}>{i + 1}</span>
              <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)" }}>{rowName(r)}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: parColor(rowToPar(r)) }}>{fmtPar(rowToPar(r))}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* ===================== ROUNDS OF THE DAY =============================== */
  function roundRating(rd) { return rd.ratingOfficial != null ? rd.ratingOfficial : (rd.rating != null ? rd.rating : null); }
  function roundNumOf(rd, i) { return rd.round != null ? rd.round : (rd.roundNumber != null ? rd.roundNumber : i + 1); }

  function RoundsOfTheDay({ slot, rows, pre, round, mobile }) {
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const pickedNames = new Set(); picks.forEach((r) => { [r.p1, r.p2].forEach((n) => { if (n) pickedNames.add(n); }); });
    const Head = () => (
      <div style={{ padding: mobile ? "14px 16px 10px" : "16px 22px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Rounds of the Day</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{pre ? "Best & worst single rounds" : "Hottest and toughest single rounds so far · by round " + (anyRating ? "rating" : "score")}</div>
      </div>
    );
    if (pre) return <Card pad={0}><Head /><Empty title="Posts after Round 1" sub="Once Thursday's scores land, the day's hot and cold rounds show up here." /></Card>;

    const entries = [];
    rows.forEach((r) => {
      const rds = rowRounds(r);
      if (!rds.length) return;
      const rd = rds[rds.length - 1]; // that player's most recent round
      const rt = roundRating(rd);
      const sc = rd.score != null ? rd.score : null;
      if (rt == null && sc == null) return;
      entries.push({ name: rowName(r), rating: rt, score: sc, picked: pickedNames.has(rowName(r)) });
    });
    if (!entries.length) return null;
    // Rank by round rating when PDGA has posted it; until then, by raw round score
    // (fewest strokes = hottest round).
    const anyRating = entries.some((e) => e.rating != null);
    const hot = entries.slice().sort((a, b) => anyRating ? (b.rating || 0) - (a.rating || 0) : (a.score || 999) - (b.score || 999)).slice(0, 5);
    const cold = entries.slice().sort((a, b) => anyRating ? (a.rating || 9999) - (b.rating || 9999) : (b.score || -999) - (a.score || -999)).slice(0, 5);

    const List = ({ title, list, tone }) => (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: tone === "hot" ? "var(--fairway-700)" : "var(--clay-600, #b4452f)", marginBottom: 6 }}>{title}</div>
        {list.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: e.picked ? "var(--fairway-50)" : "transparent", borderRadius: e.picked ? "var(--radius-sm)" : 0 }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: e.picked ? 700 : 500, fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: tone === "hot" ? "var(--fairway-700)" : "var(--text-muted)", minWidth: 40, textAlign: "right" }}>{e.rating != null ? e.rating : e.score}</span>
          </div>
        ))}
      </div>
    );

    return (
      <Card pad={0}>
        <Head />
        <div style={{ display: "flex", flexDirection: mobile ? "column" : "row", gap: mobile ? 14 : 26, padding: mobile ? "12px 16px 16px" : "14px 22px 18px" }}>
          <List title="Hot Rounds" list={hot} tone="hot" />
          <List title="Toughest Rounds" list={cold} tone="cold" />
        </div>
      </Card>
    );
  }

  /* ===================== OUR PICKS · per-player stats ==================== */
  function OurPicks({ slot, rows, pre, viewRound, mobile }) {
    if (pre) return null;
    const members = ChainsEngine.members();
    const par = parPerRound(rows);
    const rcount = maxRound(rows) || (slot && ChainsSeason && ChainsSeason.byT && ChainsSeason.byT[slot.t] && ChainsSeason.byT[slot.t].rounds) || 3;
    const [vr, setVr] = React.useState(0); // 0 = whole event; 1/2/3 = that round
    const perRoundToPar = (r) => { const rds = rowRounds(r); if (!rds || rds.length < vr) return null; const s = rds[vr - 1] && rds[vr - 1].score; return (s == null || !isFinite(s)) ? null : (Number(s) - par); };
    const isEvent = vr === 0;
    // Per-round metrics (birdies/bogeys/eagles) come from Source 2: each round's
    // archive hole_scores vs pars. C1X%, OB, throw-in are event-only (Source 1).
    const eventId = window.ChainsProStats ? String(window.ChainsProStats.resultsIdForSlot(slot.t) || "") : "";
    const [roundArch, setRoundArch] = React.useState({});
    React.useEffect(() => {
      if (isEvent || !eventId || roundArch[vr]) return;
      fetch("https://chains-fantasy-default-rtdb.firebaseio.com/rounds/" + eventId + "-r" + vr + ".json", { cache: "no-store" })
        .then((r) => r.ok ? r.json() : null)
        .then((rd) => {
          if (!rd || !rd.players) { setRoundArch((c) => Object.assign({}, c, { [vr]: "none" })); return; }
          const pars = (rd.holes || []).map((h) => h.par != null ? Number(h.par) : null);
          const map = {};
          rd.players.forEach((p) => {
            const hs = Array.isArray(p.hole_scores) ? p.hole_scores : [];
            let bird = 0, bog = 0, eag = 0;
            hs.forEach((s, i) => { if (s == null || s === "" || pars[i] == null) return; const d = Number(s) - pars[i]; if (d <= -2) eag++; else if (d === -1) bird++; else if (d === 1) bog++; else if (d >= 2) bog++; });
            const rec = { toPar: p.round_to_par != null ? Number(p.round_to_par) : null, bird, bog, eag };
            if (p.pdga != null) map["p" + p.pdga] = rec;
            const w = norm(p.name).split(" ").filter(Boolean);
            map["f" + (w.length >= 2 ? w[0] + " " + w[w.length - 1] : norm(p.name))] = rec;
          });
          setRoundArch((c) => Object.assign({}, c, { [vr]: map }));
        }).catch(() => setRoundArch((c) => Object.assign({}, c, { [vr]: "none" })));
    }, [vr, isEvent, eventId]);
    const archMap = (!isEvent && roundArch[vr] && roundArch[vr] !== "none") ? roundArch[vr] : null;
    const archOf = (nm) => { if (!archMap) return null; const w = norm(nm).split(" ").filter(Boolean); const fk = "f" + (w.length >= 2 ? w[0] + " " + w[w.length - 1] : norm(nm)); const pd = nameToPdga[nm] || nameToPdgaNorm[norm(nm)]; return (pd && archMap["p" + pd]) || archMap[fk] || null; };
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const pickByMember = {}; picks.forEach((r) => { pickByMember[r.m] = [r.p1, r.p2]; });
    const nameToPdga = {}; (window.MPO_PLAYERS || []).forEach((p) => { if (p.pdga != null) nameToPdga[p.name] = String(p.pdga); });
    const norm = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const byPdga = {}; const byName = {}; const byFLk = {};
    rows.forEach((r) => { const pd = rowPdga(r); if (pd) byPdga[pd] = r; const n = rowName(r); if (n) { byName[norm(n)] = r; const w = norm(n).split(" ").filter(Boolean); byFLk[w.length >= 2 ? w[0] + " " + w[w.length - 1] : norm(n)] = r; } });
    const nameToPdgaNorm = {}; Object.keys(nameToPdga).forEach((k) => { nameToPdgaNorm[norm(k)] = nameToPdga[k]; });
    const find = (nm) => { const k = norm(nm); const fl = k.split(" ").filter(Boolean); const flk = fl.length >= 2 ? fl[0] + " " + fl[fl.length - 1] : k; const pd = nameToPdga[nm] || nameToPdgaNorm[k]; return (pd && byPdga[pd]) || byName[k] || byFLk[flk] || null; };
    const sc = (r, k) => (r && r.stats && r.stats[k] && r.stats[k].count != null) ? r.stats[k].count : null;
    const sv = (r, k) => (r && r.stats && r.stats[k] && r.stats[k].value != null) ? r.stats[k].value : null;

    const cards = members.map((m) => {
      const ps = (pickByMember[m.id] || [null, null]).map((nm) => {
        const r = nm ? find(nm) : null;
        const a = nm ? archOf(nm) : null;
        if (!isEvent) {
          // Round tab: that round's score + per-round birdies/bogeys/eagles (Source 2).
          return { name: nm, row: r, toPar: a ? a.toPar : (r ? perRoundToPar(r) : null), place: r ? rowPlace(r) : 0,
            bird: a ? a.bird : null, bog: a ? a.bog : null, eag: a ? a.eag : null, c1x: null, ob: null, long: null, perRound: true };
        }
        // Event tab: event total + event stats (consistent).
        return { name: nm, row: r, toPar: r ? rowToPar(r) : null, place: r ? rowPlace(r) : 0,
          bird: sc(r, "birdie_count"), bog: sc(r, "bogey_count"), eag: sc(r, "eagle_or_better_count"),
          c1x: sv(r, "c1x_putting_pct"), ob: sc(r, "ob_count"), long: sv(r, "longest_throw_in") };
      });
      const vals = ps.map((p) => p.toPar).filter((v) => v != null);
      const combined = vals.length ? vals.reduce((a, b) => a + b, 0) : null;
      return { m, ps, combined };
    }).sort((a, b) => {
      if (a.combined == null && b.combined == null) return a.m.name.localeCompare(b.m.name);
      if (a.combined == null) return 1; if (b.combined == null) return -1;
      return a.combined - b.combined || a.m.name.localeCompare(b.m.name);
    });

    const ProLine = ({ p }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
        <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5, color: p.name ? "var(--text-strong)" : "var(--text-faint)", fontStyle: p.name ? "normal" : "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name || "— no pick —"}</span>
        {p.row ? (
          <React.Fragment>
            <span style={{ display: "flex", gap: 7, flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)" }}>
              {p.bird != null && <span title={isEvent ? "Birdies (event)" : "Birdies (round)"} style={{ color: "var(--fairway-700)" }}>{p.bird}<span style={{ opacity: .7 }}>bird</span></span>}
              {p.bog != null && <span title={isEvent ? "Bogeys+ (event)" : "Bogeys+ (round)"} style={{ color: "var(--clay-600, #b4452f)" }}>{p.bog}<span style={{ opacity: .7 }}>bog</span></span>}
              {p.eag != null && p.eag > 0 && <span title="Eagles or better" style={{ color: "var(--ace-600)" }}>{p.eag}<span style={{ opacity: .7 }}>eag</span></span>}
              {p.ob != null && p.ob > 0 && <span title="OB strokes (event)" style={{ color: "var(--clay-600, #b4452f)" }}>{p.ob}<span style={{ opacity: .7 }}>OB</span></span>}
              {p.c1x != null && <span title="Circle 1X putting %" style={{ color: "var(--text-muted)" }}>{Math.round(p.c1x)}<span style={{ opacity: .7 }}>%C1x</span></span>}
              {p.long != null && p.long > 0 && <span title="Longest throw-in (ft)" style={{ color: "var(--ace-600)" }}>{Math.round(p.long)}<span style={{ opacity: .7 }}>ft</span></span>}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: parColor(p.toPar), minWidth: 34, textAlign: "right" }}>{fmtPar(p.toPar)}</span>
          </React.Fragment>
        ) : p.name ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>not in field</span> : null}
      </div>
    );

    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "14px 16px 10px" : "16px 22px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Our Picks</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>{isEvent ? "Each pro's event total — birdies, bogeys, OB, C1X putting, longest throw-in" : "Round " + vr + " — each pro's score that round"}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
            {[{ n: 0, l: "Event" }].concat(Array.from({ length: rcount }, (_, i) => ({ n: i + 1, l: "R" + (i + 1) }))).map((tb) => {
              const on = vr === tb.n;
              return <button key={tb.n} onClick={() => setVr(tb.n)} style={{ height: 28, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>{tb.l}</button>;
            })}
          </div>
        </div>
        <div style={{ padding: mobile ? "8px 12px 12px" : "10px 16px 14px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {cards.map((c, i) => (
            <div key={c.m.id} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", borderLeft: "3px solid " + c.m.disc }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Avatar name={c.m.name} color={c.m.disc} size={22} />
                <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)" }}>{c.m.name}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: parColor(c.combined) }}>{c.combined == null ? "—" : fmtPar(c.combined)}</span>
              </div>
              <ProLine p={c.ps[0]} />
              <div style={{ borderTop: "1px solid var(--border-subtle)" }} />
              <ProLine p={c.ps[1]} />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* ===================== EVENT STAT LEADERS ============================== */
  function EventLeaders({ slot, rows, pre, mobile }) {
    if (pre) return null;
    const picks = ChainsEngine.picksFor(slot.t) || [];
    const pickedNames = new Set(); picks.forEach((r) => { [r.p1, r.p2].forEach((n) => { if (n) pickedNames.add(n); }); });
    const sCount = (r, k) => (r.stats && r.stats[k] && r.stats[k].count != null) ? r.stats[k].count : null;
    const sVal = (r, k) => (r.stats && r.stats[k] && r.stats[k].value != null) ? r.stats[k].value : null;
    const sOpp = (r, k) => (r.stats && r.stats[k] && r.stats[k].opportunities != null) ? r.stats[k].opportunities : 0;
    function lead(getter, dir, filter) {
      let best = null, bestV = null;
      rows.forEach((r) => { if (filter && !filter(r)) return; const v = getter(r); if (v == null) return; if (bestV == null || (dir === "high" ? v > bestV : v < bestV)) { bestV = v; best = r; } });
      return best == null ? null : { row: best, v: bestV };
    }
    const cats = [
      { label: "Most Birdies", res: lead((r) => sCount(r, "birdie_count"), "high"), fmt: (v) => v + " birdies" },
      { label: "Best C1X Putting", res: lead((r) => sVal(r, "c1x_putting_pct"), "high", (r) => sOpp(r, "c1x_putting_pct") >= 10), fmt: (v) => Math.round(v) + "%" },
      { label: "Longest Throw-In", res: lead((r) => sVal(r, "longest_throw_in"), "high"), fmt: (v) => Math.round(v) + " ft" },
      { label: "Best Scramble", res: lead((r) => sVal(r, "scramble_pct"), "high", (r) => sOpp(r, "scramble_pct") >= 4), fmt: (v) => Math.round(v) + "%" },
    ].filter((c) => c.res);
    if (!cats.length) return null;
    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "14px 16px 10px" : "16px 22px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>Event Leaders</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Who's topping the key stats so far this week</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 1, background: "var(--border-subtle)" }}>
          {cats.map((c, i) => {
            const nm = rowName(c.res.row);
            const mine = pickedNames.has(nm);
            return (
              <div key={i} style={{ padding: mobile ? "12px 12px" : "14px 16px", background: mine ? "var(--fairway-50)" : "var(--bg-elevated)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 10, color: "var(--text-muted)" }}>{c.label}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13.5, color: "var(--text-strong)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: "var(--fairway-700)", marginTop: 2 }}>{c.fmt(c.res.v)}</div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ===================== ROOT VIEW ======================================= */
  function ThisWeekView(props) {
    const embedded = props && props.embedded;
    const { mobile } = useViewport();
    const slot = currentSlot();
    const [rows, setRows] = React.useState(null);
    const [updated, setUpdated] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [viewRound, setViewRound] = React.useState(1); // start on R1; user clicks ahead

    const eventId = slot && PS() ? PS().resultsIdForSlot(slot.t) : null;

    React.useEffect(() => {
      if (!eventId) { setLoading(false); return; }
      let alive = true;
      function pull() {
        // bypass the module cache for fresh data each refresh
        fetch("https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/events/" + eventId + "-MPO.json", { cache: "no-store" })
          .then((r) => r.ok ? r.json() : Promise.reject())
          .then((ev) => { if (!alive) return; setRows(PS()._rowsOf(ev) || []); setUpdated(new Date()); setLoading(false); })
          .catch(() => { if (alive) { setLoading(false); } });
      }
      pull();
      const iv = setInterval(() => { if (!document.hidden) pull(); }, 300000); // 5 min
      function onVis() { if (!document.hidden) pull(); }
      document.addEventListener("visibilitychange", onVis);
      return () => { alive = false; clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    }, [eventId]);

    if (!slot) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHeader kicker="This week" title="Tournament" size="lg" />
          <Card pad={28}><Empty title="No tournament this week" sub="The next event will show up here when it's on the schedule." /></Card>
        </div>
      );
    }

    const safeRows = rows || [];
    const pre = !rows || isPreEvent(safeRows);
    const round = maxRound(safeRows);
    const vr = viewRound || 1; // default to Round 1
    const evName = slot.name || "";

    const RoundTabs = () => {
      if (pre || round < 1) return null;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-faint)", marginRight: 2 }}>Round</span>
          {[1, 2, 3].map((rd) => {
            const has = rd <= round;
            const isLive = rd === round;
            const on = rd === vr;
            return (
              <button key={rd} disabled={!has} onClick={() => setViewRound(rd)}
                style={{ height: 32, padding: "0 13px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : has ? "var(--text-muted)" : "var(--text-faint)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, cursor: has ? "pointer" : "default", opacity: has ? 1 : 0.45, display: "inline-flex", alignItems: "center", gap: 5 }}>
                R{rd}{isLive ? <span className="cw-livedot" style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#fff" : "var(--live-500, #e0483d)" }} /> : null}
              </button>
            );
          })}
        </div>
      );
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 14 : 18 }}>
        {!embedded && <SectionHeader kicker="This week" title={"T" + slot.t + " · " + evName} size="lg"
          subtitle={pre ? "Starting " + (((window.ChainsSeason && ChainsSeason.byT && ChainsSeason.byT[slot.t] && ChainsSeason.byT[slot.t].start_date) ? (function(){var d=new Date(ChainsSeason.byT[slot.t].start_date+"T00:00:00");return isNaN(d)?"soon":d.toLocaleDateString(undefined,{weekday:"long"});})() : "soon")) : "Round " + round + " of " + (((window.ChainsSeason && ChainsSeason.byT && ChainsSeason.byT[slot.t] && ChainsSeason.byT[slot.t].rounds) || maxRound(safeRows) || 3)) + " · tap a round to review it"} />}

        {!eventId ? (
          <Card pad={24}><Empty title="No data for this event yet" sub="Live scores appear once PDGA posts them." /></Card>
        ) : loading && !rows ? (
          <Card pad={24}><Empty title="Loading tournament…" /></Card>
        ) : (
          <React.Fragment>
            <OurPicks slot={slot} rows={safeRows} pre={pre} viewRound={vr} mobile={mobile} />
            <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", padding: "2px 0 8px" }}>
              {updated ? "Updated " + updated.toLocaleTimeString() + " · auto-refreshes every 5 min" : "Auto-refreshes every 5 min"}
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }

  // ---- one-time keyframes for weather icons (deliberate, reduced-motion safe)
  if (!document.getElementById("cw-weather-anim")) {
    const st = document.createElement("style");
    st.id = "cw-weather-anim";
    st.textContent = [
      "@keyframes cwSpin{to{transform:rotate(360deg)}}",
      "@keyframes cwPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}",
      "@keyframes cwDrift{0%,100%{transform:translateX(0)}50%{transform:translateX(2.5px)}}",
      "@keyframes cwDrift2{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}",
      "@keyframes cwRain{0%{opacity:0;transform:translateY(-3px)}30%{opacity:1}100%{opacity:0;transform:translateY(7px)}}",
      "@keyframes cwFlash{0%,45%,55%,100%{opacity:.35}50%{opacity:1}}",
      "@keyframes cwFog{0%,100%{transform:translateX(0);opacity:.6}50%{transform:translateX(4px);opacity:1}}",
      ".cw-spin{animation:cwSpin 18s linear infinite}",
      ".cw-pulse{animation:cwPulse 3s ease-in-out infinite}",
      ".cw-drift{animation:cwDrift 5s ease-in-out infinite}",
      ".cw-drift2{animation:cwDrift2 7s ease-in-out infinite}",
      ".cw-rain{animation:cwRain 1.1s linear infinite}",
      ".cw-flash{animation:cwFlash 2.4s ease-in-out infinite}",
      ".cw-fog{animation:cwFog 4s ease-in-out infinite}",
      "@media (prefers-reduced-motion: reduce){.cw-spin,.cw-pulse,.cw-drift,.cw-drift2,.cw-rain,.cw-flash,.cw-fog{animation:none}}",
      "@keyframes cwLive{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.78)}}",
      ".cw-livedot{animation:cwLive 1.6s ease-in-out infinite}",
      "@keyframes cwWind{0%{opacity:0;transform:translateX(-6px)}30%{opacity:1}100%{opacity:0;transform:translateX(8px)}}",
      ".cw-windline{animation:cwWind 1.6s ease-in-out infinite}",
      "@media (prefers-reduced-motion: reduce){.cw-livedot,.cw-windline{animation:none}.cw-windline{opacity:1;transform:none}}",
    ].join("");
    document.head.appendChild(st);
  }

  // expose whether the current event is "in progress" (Thu–Sun) for the nav pulse
  function eventInProgress() {
    const slot = currentSlot();
    if (!slot) return false;
    const d = new Date().getDay(); // 0 Sun … 4 Thu, 5 Fri, 6 Sat
    const isThuSun = d === 0 || d >= 4;
    return !!(slot.status === "live") || (isThuSun && !!slot.soon);
  }

  window.ThisWeekView = ThisWeekView;
  window.ChainsWeather = Weather; // mounted on the Live Course tab
  window.ThisWeekMeta = { eventInProgress: eventInProgress };
})();
