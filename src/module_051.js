/* Chains app — Plan a round + invite. window.PlanRound
   Pick a course, date & time → see the weather forecast for that day, course
   info + address (Open in Maps), and send an invite to the crew with RSVP.
   Reads courses.json (cached by view_play). Writes Firebase /play_invites. */
(function () {
  const FB = "https://chains-fantasy-default-rtdb.firebaseio.com";
  const COURSES_URL = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/courses.json";

  function getJSON(u) { return fetch(u, { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).catch(() => null); }
  let CAT = null;
  try { CAT = JSON.parse(localStorage.getItem("chains_courses_cache") || "null"); } catch (e) {}
  function loadCat() { if (CAT) return Promise.resolve(CAT); return getJSON(COURSES_URL).then((j) => { CAT = Array.isArray(j) ? j : (j && (j.courses || Object.values(j))) || []; try { localStorage.setItem("chains_courses_cache", JSON.stringify(CAT)); } catch (e) {} return CAT; }); }

  // WMO weather-code → short condition text (Open-Meteo daily weathercode).
  function wmoText(code) {
    code = Number(code);
    if (code === 0) return "Clear";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Fog";
    if (code >= 51 && code <= 57) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code === 85 || code === 86) return "Snow showers";
    if (code >= 95) return "Thunderstorm";
    return "";
  }

  // Geocode a US place name → {lat,lng}, cached per session. Open-Meteo, no key.
  const _geo = {};
  function geocode(city) {
    city = String(city || "").split(",")[0].trim();
    if (!city) return Promise.resolve(null);
    if (_geo[city] !== undefined) return Promise.resolve(_geo[city]);
    return getJSON("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1&country=US").then((j) => {
      const r = j && j.results && j.results[0];
      const out = r ? { lat: r.latitude, lng: r.longitude } : null;
      _geo[city] = out; return out;
    });
  }

  // Forecast for a place on a given date, via Open-Meteo (free, no key, CORS-OK,
  // 16-day range). Geocode the city → daily forecast → pick the chosen day.
  // Falls back to wttr.in if Open-Meteo is unreachable.
  function weatherFor(place, dateISO, coords) {
    if (!place && !coords) return Promise.resolve(null);
    const ll = (coords && coords.lat != null) ? Promise.resolve({ lat: coords.lat, lng: coords.lng }) : geocode(place);
    return ll.then((g) => {
      if (!g) return wttrFor(place, dateISO);
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + g.lat + "&longitude=" + g.lng +
        "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max" +
        "&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=16";
      return getJSON(url).then((j) => {
        const d = j && j.daily;
        if (!d || !d.time) return wttrFor(place, dateISO);
        let i = d.time.indexOf(dateISO);
        if (i < 0) return null; // outside the 16-day window
        return {
          date: d.time[i], maxF: Math.round(d.temperature_2m_max[i]), minF: Math.round(d.temperature_2m_min[i]),
          cond: wmoText(d.weathercode[i]), windMph: Math.round(d.windspeed_10m_max[i]),
          chanceRain: d.precipitation_probability_max[i] != null ? d.precipitation_probability_max[i] : 0,
        };
      }).catch(() => wttrFor(place, dateISO));
    });
  }

  // Legacy wttr.in fallback (rate-limited; only used if Open-Meteo fails).
  function wttrFor(place, dateISO) {
    return getJSON("https://wttr.in/" + encodeURIComponent(place) + "?format=j1").then((j) => {
      if (!j || !j.weather) return null;
      const day = j.weather.find((w) => w.date === dateISO) || j.weather[0];
      if (!day) return null;
      const noon = (day.hourly || []).find((h) => h.time === "1200") || (day.hourly || [])[4] || {};
      return {
        date: day.date, maxF: day.maxtempF, minF: day.mintempF,
        cond: (noon.weatherDesc && noon.weatherDesc[0] && noon.weatherDesc[0].value) || "",
        windMph: noon.windspeedMiles, chanceRain: noon.chanceofrain,
      };
    }).catch(() => null);
  }

  // Course coordinates → precise {lat,lng} for the Directions link, so Maps lands
  // ON the course. courses.json now ships lat/lng on every course, so we read those
  // directly (instant, no network). The Nominatim lookup below is a fallback only
  // for the rare course that somehow lacks coordinates; results are cached per-course.
  let GEO = {};
  try { GEO = JSON.parse(localStorage.getItem("chains_course_geo") || "{}") || {}; } catch (e) {}
  function cleanPlace(name) {
    return String(name || "")
      .replace(/\b(disc golf course|disc golf|dgc|dg course)\b/gi, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/\s{2,}/g, " ").trim();
  }
  function geoCourse(course) {
    if (!course) return Promise.resolve(null);
    // Prefer coordinates baked into courses.json (lat/lng on every course).
    const lat = course.lat != null ? course.lat : (course.latitude != null ? course.latitude : null);
    const lng = course.lng != null ? course.lng : (course.lon != null ? course.lon : (course.longitude != null ? course.longitude : null));
    if (lat != null && lng != null) return Promise.resolve({ lat: lat, lng: lng });
    // Fallback: on-demand geocode (only courses still missing coords). Cached per course.
    const key = course.id || (course.name + "|" + course.city);
    if (GEO[key] !== undefined) return Promise.resolve(GEO[key]);
    const q = [cleanPlace(course.name), course.city, course.state].filter(Boolean).join(", ");
    return getJSON("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q)).then((j) => {
      const hit = Array.isArray(j) && j[0];
      const out = hit ? { lat: hit.lat, lng: hit.lon } : null;
      GEO[key] = out;
      try { localStorage.setItem("chains_course_geo", JSON.stringify(GEO)); } catch (e) {}
      return out;
    }).catch(() => null);
  }

  // Turn-by-turn directions to the course (hands off to the Maps app on phones).
  // Prefers exact coordinates when we've geocoded them; otherwise a name search.
  function mapsUrl(c, coords) {
    if (coords && coords.lat != null) return "https://www.google.com/maps/dir/?api=1&destination=" + coords.lat + "," + coords.lng;
    const q = encodeURIComponent([c.name, c.city, c.state].filter(Boolean).join(", "));
    return "https://www.google.com/maps/dir/?api=1&destination=" + q;
  }

  // #5: response summary for a sent invite — "pending" means no one but the
  // organizer has answered yet.
  function inviteStatus(inv, me) {
    const rsvp = inv.rsvp || {};
    const others = (inv.group || []).filter((g) => g.id !== me);
    if (!others.length) return "Just you so far \u2014 no one else invited yet";
    const inCount = others.filter((g) => rsvp[g.id] === "in").length;
    const outCount = others.filter((g) => rsvp[g.id] === "out").length;
    const waiting = others.length - inCount - outCount;
    if (!inCount && !outCount) return "Pending \u2014 no responses yet";
    const parts = [];
    if (inCount) parts.push(inCount + " in");
    if (outCount) parts.push(outCount + " out");
    if (waiting) parts.push(waiting + " waiting");
    return parts.join(" \u00b7 ");
  }

  function PlanRound({ onBack, mobile, invites, me: meProp, onViewInvite, onInvitesChanged }) {
    const me = meProp || (window.ChainsID && ChainsID.whoami());
    const [step, setStep] = React.useState("list"); // list | course | details | sent
    const [course, setCourse] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [cat, setCat] = React.useState(CAT);
    const today = new Date(); today.setDate(today.getDate() + 1);
    const [date, setDate] = React.useState(today.toISOString().slice(0, 10));
    const [time, setTime] = React.useState("10:00");
    const [wx, setWx] = React.useState(null);
    const [coords, setCoords] = React.useState(null);
    const [group, setGroup] = React.useState(() => { const m = me ? ChainsEngine.member(me) : null; return m ? [{ id: m.id, name: m.name, color: m.disc }] : []; });
    const [sentId, setSentId] = React.useState(null);
    const [cancelingId, setCancelingId] = React.useState(null);
    const sentInvites = React.useMemo(() => {
      if (!invites) return [];
      return Object.keys(invites).map((k) => Object.assign({ id: k }, invites[k])).filter((v) => v && v.organizer === me)
        .sort((a, b) => String(b.date + (b.time || "")).localeCompare(String(a.date + (a.time || ""))));
    }, [invites, me]);
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    const loadingInvites = invites == null;
    function cancelSent(inv) {
      if (!window.ChainsPlayInvites || !window.ChainsPlayInvites.requestCancel || cancelingId) return;
      setCancelingId(inv.id);
      window.ChainsPlayInvites.requestCancel(inv.id, me, inv, {
        onDeleted: () => { setCancelingId(null); onInvitesChanged && onInvitesChanged(); },
        onGone: () => { setCancelingId(null); onInvitesChanged && onInvitesChanged(); },
        onChanged: () => { setCancelingId(null); onInvitesChanged && onInvitesChanged(); },
        onError: () => setCancelingId(null),
      }).then((ok) => { if (!ok) setCancelingId(null); });
    }

    React.useEffect(() => { if (!cat) loadCat().then(setCat); }, []);
    React.useEffect(() => {
      if (!course) { setCoords(null); return; }
      let alive = true;
      geoCourse(course).then((c) => { if (alive) setCoords(c); });
      return () => { alive = false; };
    }, [course]);
    React.useEffect(() => {
      if (step !== "details" || !course) return;
      const place = [course.city, course.state].filter(Boolean).join(", ") || course.name;
      setWx("loading");
      weatherFor(place, date, coords).then((w) => setWx(w || "none"));
    }, [step, course, date, coords]);

    let list = cat || [];
    if (q) { const ql = q.toLowerCase(); list = list.filter((c) => (c.name + " " + (c.city || "") + " " + (c.state || "")).toLowerCase().includes(ql)); }
    list = list.slice(0, 40);
    const members = ChainsEngine.members();
    const inGroup = (id) => group.some((g) => g.id === id);
    const toggle = (m) => setGroup((g) => inGroup(m.id) ? g.filter((x) => x.id !== m.id) : g.concat([{ id: m.id, name: m.name, color: m.disc }]));

    function send() {
      const id = "inv-" + Date.now().toString(36);
      const invite = {
        course_id: course.id || null, course_name: course.name, city: [course.city, course.state].filter(Boolean).join(", "),
        date: date, time: time, par_total: course.par_total || null, rating: course.rating || null,
        organizer: me || null, group: group, rsvp: (function () { const o = {}; if (me) o[me] = "in"; return o; })(),
        created_at: new Date().toISOString(),
      };
      // Save the invite to chains-app (saves in EVERY build, never the live
      // legacy project) using the shared helper, mirroring playRounds. #5: refresh
      // the parent's shared invites map once the save lands, so "Your sent
      // invites" shows this one immediately instead of on next reload.
      const saved = window.ChainsPlayInvites ? Promise.resolve(window.ChainsPlayInvites.save(id, invite)) : ChainsBuild.legacyWrite(FB + "/play_invites/" + id + ".json", { method: "PUT", body: JSON.stringify(invite) }).catch(() => {});
      saved.then(() => onInvitesChanged && onInvitesChanged());
      // Playing a round together connects the crew: become mutual friends in
      // chains-app with everyone invited (skip self + guests). Rules-safe — each
      // client only writes its own edges via befriend().
      if (window.ChainsFriends && ChainsFriends.available && ChainsFriends.available()) {
        group.forEach((g) => { if (g.id && g.id !== me && !/^guest/.test(g.id)) { try { ChainsFriends.befriend(g.id); } catch (e) {} } });
      }
      // drop a bell notification to the crew (excluding organizer)
      if (window.ChainsNotify) {
        const aud = group.map((g) => g.id).filter((x) => x && x !== me && !/^guest/.test(x));
        if (aud.length) window.ChainsNotify.post({ type: "round_invite", title: "Round invite 🥏", body: (ChainsEngine.member(me) ? ChainsEngine.member(me).name : "Someone") + " wants to play " + course.name + " " + fmtDate(date) + ".", audience: aud, link: "play" });
      }
      setSentId(id); setStep("sent");
    }

    function FlowHead({ title, sub, onBackFn }) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBackFn} aria-label="Back" style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icons.ChevRight size={18} style={{ transform: "rotate(180deg)" }} /></button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 19, color: "var(--text-strong)", lineHeight: 1 }}>{title}</div>
            {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
          </div>
        </div>
      );
    }

    // STEP 0 — your sent invites
    if (step === "list") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FlowHead title="Plan a round" sub="Your sent invites" onBackFn={onBack} />
          <Button variant="accent" full size="lg" icon={<Icons.Calendar size={16} />} onClick={() => setStep("course")}>Plan a new round</Button>
          {loadingInvites && !offline ? (
            <Card pad={22}><div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Loading your invites…</div></Card>
          ) : loadingInvites && offline ? (
            <Card pad={22}>
              <div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", marginBottom: 12 }}>You're offline — can't check your sent invites right now.</div>
              <Button variant="secondary" full onClick={() => onInvitesChanged && onInvitesChanged()}>Try again</Button>
            </Card>
          ) : sentInvites.length === 0 ? (
            <Card pad={22}><div style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No pending invites yet — plan a round above and the crew's RSVPs will show up here.</div></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sentInvites.map((inv) => (
                <Card key={inv.id} pad={0}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 12px 12px 14px" }}>
                    <button onClick={() => onViewInvite && onViewInvite(inv.id)} style={{ flex: 1, minWidth: 0, textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{inv.course_name}</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{fmtDate(inv.date)} · {fmt12(inv.time)}</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--fairway-700)", marginTop: 3 }}>{inviteStatus(inv, me)}</div>
                    </button>
                    <button onClick={() => cancelSent(inv)} disabled={cancelingId === inv.id} title="Cancel invite" aria-label="Cancel invite" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: cancelingId === inv.id ? "default" : "pointer", opacity: cancelingId === inv.id ? 0.5 : 1, color: "var(--clay-600, #b4452f)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.X size={17} /></button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }

    // STEP 1 — course
    if (step === "course") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FlowHead title="Plan a round" sub="Where are we playing?" onBackFn={() => setStep("list")} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 530 courses…" autoFocus style={{ width: "100%", height: 46, padding: "0 16px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 15, background: "var(--bg-elevated)", outline: "none", boxSizing: "border-box" }} />
          <Card pad={0}>
            {cat == null ? <div style={{ padding: 20, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Loading courses…</div>
              : list.length === 0 ? <div style={{ padding: 20, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No match.</div>
              : list.map((c, i) => (
                <button key={c.id || i} onClick={() => { setCourse(c); setStep("details"); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "12px 14px", border: "none", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: "transparent", cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{[c.city, c.state].filter(Boolean).join(", ")}{c.holes ? " · " + c.holes + " holes · par " + c.par_total : ""}</div>
                  </div>
                  <span style={{ width: 16, height: 16, color: "var(--text-faint)", flexShrink: 0 }}><Icons.ChevRight size={16} /></span>
                </button>
              ))}
          </Card>
        </div>
      );
    }

    // STEP 3 — sent confirmation
    if (step === "sent") {
      const goingCount = 1;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 40 }}>🥏</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, color: "var(--text-strong)", marginTop: 6 }}>Invite sent</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 4 }}>The crew got a notification. Their RSVPs show up here.</div>
          </div>
          <InviteCard inv={{ course_name: course.name, city: [course.city, course.state].filter(Boolean).join(", "), date, time, par_total: course.par_total, rating: course.rating }} course={course} coords={coords} wx={wx} />
          <Button variant="accent" full size="lg" onClick={() => setStep("list")}>Done</Button>
        </div>
      );
    }

    // STEP 2 — details (date, time, weather, course info, crew)
    const ratingStr = course.rating ? course.rating : null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FlowHead title={course.name} sub={[course.city, course.state].filter(Boolean).join(", ")} onBackFn={() => setStep("course")} />

        {/* date + time */}
        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ flex: 1 }}>
            <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)", marginBottom: 5 }}>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", height: 44, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)", marginBottom: 5 }}>Tee time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: "100%", height: 44, padding: "0 12px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
          </label>
        </div>

        {/* weather forecast */}
        <Card pad={0}>
          <div style={{ padding: "11px 14px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>Forecast for {fmtDate(date)}</div>
          <div style={{ padding: "14px" }}>
            {wx === "loading" ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Checking the skies…</div>
              : !wx || wx === "none" ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>No forecast this far out yet — check back within ~2 weeks.</div>
              : (
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <div><span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 30, color: "var(--text-strong)" }}>{wx.maxF}°</span><span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-faint)" }}>/{wx.minF}°</span></div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }}>{wx.cond}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>Wind {wx.windMph} mph · {wx.chanceRain}% rain</div>
                  </div>
                  {Number(wx.windMph) > 18 && <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 10, color: "#fff", background: "var(--clay-600, #b4452f)", padding: "3px 8px", borderRadius: "var(--radius-pill)" }}>Windy</span>}
                </div>
              )}
          </div>
        </Card>

        {/* course info + maps */}
        <Card pad={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 14, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)" }}>
                {course.holes && <span><b style={{ color: "var(--text-strong)" }}>{course.holes}</b> holes</span>}
                {course.par_total && <span>Par <b style={{ color: "var(--text-strong)" }}>{course.par_total}</b></span>}
                {ratingStr && <span><b style={{ color: "var(--text-strong)" }}>{ratingStr}</b> rating</span>}
              </div>
            </div>
            <a href={mapsUrl(course, coords)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: "var(--radius-pill)", background: "var(--fairway-600)", color: "#fff", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11 }}>
              <span style={{ width: 13, height: 13 }}><Icons.Pin size={13} /></span> Directions
            </a>
          </div>
        </Card>

        {/* crew */}
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Invite your friends</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {members.map((m) => (
              <button key={m.id} onClick={() => toggle(m)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px 8px 8px", borderRadius: "var(--radius-pill)", border: "1px solid " + (inGroup(m.id) ? m.disc : "var(--border-default)"), background: inGroup(m.id) ? "var(--fairway-50)" : "var(--bg-elevated)", cursor: "pointer" }}>
                <Avatar name={m.name} color={m.disc} size={24} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{m.name}</span>
                {inGroup(m.id) && <span style={{ width: 14, height: 14, color: m.disc }}><Icons.Check size={14} /></span>}
              </button>
            ))}
          </div>
        </div>

        <Button variant="accent" full size="lg" icon={<Icons.Send size={16} />} disabled={group.length < 1} onClick={send}>Send invite to {group.length} {group.length === 1 ? "player" : "players"}</Button>
      </div>
    );
  }

  function InviteCard({ inv, course, coords, wx }) {
    return (
      <Card pad={0}>
        <div style={{ padding: "16px 18px", background: "var(--bg-ink)", color: "var(--bone-50)", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18 }}>{inv.course_name}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-300)", marginTop: 3 }}>{fmtDate(inv.date)} · {fmt12(inv.time)}{inv.city ? " · " + inv.city : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 16, padding: "12px 18px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", flexWrap: "wrap" }}>
          {inv.par_total && <span>Par <b style={{ color: "var(--text-strong)" }}>{inv.par_total}</b></span>}
          {inv.rating && <span><b style={{ color: "var(--text-strong)" }}>{inv.rating}</b> rating</span>}
          {wx && wx !== "loading" && wx !== "none" && <span><b style={{ color: "var(--text-strong)" }}>{wx.maxF}°</b> {wx.cond}</span>}
          {course && <a href={mapsUrl(course, coords)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--fairway-700)", fontWeight: 700 }}>Directions →</a>}
        </div>
      </Card>
    );
  }

  function fmtDate(d) { if (!d) return ""; const dt = new Date(d + "T00:00:00"); return isNaN(dt) ? d : dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); }
  function fmt12(t) { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; const hh = h % 12 || 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; }

  window.PlanRound = PlanRound;
})();
