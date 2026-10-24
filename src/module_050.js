/* Chains app — MPO Player Database + registered field. window.PlayersView
   Searchable, sortable, compact tappable rows. Tap a row to expand recent
   form. Rating is pulled from the MPO_PLAYERS DB by PDGA number (field.json
   itself carries no rating). "Picked" badges read the league picks for the
   upcoming event (read-only). */
(function () {
  const ED = () => window.ExploreData;
  function ordinal(n) { if (n == null) return "—"; const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function initialsOf(name) { return String(name || "").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }

  function MiniAvatar({ name, color, size = 22 }) {
    return <span title={name} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, flexShrink: 0, background: color, color: "#fff", borderRadius: "50%", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: size <= 22 ? 9 : 10 }}>{initialsOf(name)}</span>;
  }

  function PlayerRow({ p, open, onToggle, members, stats }) {
    const pickedMembers = (p.picked || []).map((id) => members[id]).filter(Boolean);
    const drafters = p.byMember ? Object.keys(p.byMember) : [];
    return (
      <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", overflow: "hidden", alignSelf: "start" }}>
        <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", cursor: "pointer" }}>
          <MiniAvatar name={p.name} color={p.picked.length ? "var(--fairway-600)" : "var(--chain-400)"} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
            {p.drafted > 0 && <div style={{ marginTop: 1, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--fairway-700)", fontWeight: 600 }}>{p.drafted}× drafted</div>}
          </div>
          {pickedMembers.length > 0 && (
            <span style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              {pickedMembers.map((m) => <MiniAvatar key={m.id} name={m.name} color={m.disc} size={18} />)}
            </span>
          )}
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, minWidth: 38 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: p.rating ? "var(--text-strong)" : "var(--text-faint)", lineHeight: 1 }}>{p.rating || "—"}</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 8, color: "var(--text-faint)", marginTop: 1 }}>rating</span>
          </span>
          <span style={{ width: 12, textAlign: "center", color: "var(--text-faint)", fontSize: 10, flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 150ms" }}>▶</span>
        </div>
        {open && (
          <div style={{ padding: "0 10px 12px", borderTop: "1px solid var(--border-subtle)", paddingTop: 10 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {!stats ? (
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>No 2026 results yet for this player.</span>
              ) : (
                <React.Fragment>
                  <Stat label="Avg finish · last 3" value={stats.n ? ordinal(Math.round(stats.avgFinish)) : "—"} />
                  <Stat label="Birdie rate" value={stats.birdieRate != null ? stats.birdieRate.toFixed(0) + "%" : "—"} />
                  <Stat label="Events tracked" value={stats.n || "—"} />
                </React.Fragment>
              )}
            </div>
            {drafters.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Drafted this season by</span>
                {drafters.map((mid) => members[mid] ? <span key={mid} style={{ display: "flex", alignItems: "center", gap: 3 }}><MiniAvatar name={members[mid].name} color={members[mid].disc} size={16} /><span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{p.byMember[mid]}×</span></span> : null)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  function Stat({ label, value }) {
    return (
      <div>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "var(--text-strong)" }}>{value}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 1 }}>{label}</div>
      </div>
    );
  }

  function PlayersView({ onPlayer }) {
    const { mobile } = useViewport();
    const [q, setQ] = React.useState("");
    const [sort, setSort] = React.useState("rating"); // rating | name
    const [field, setField] = React.useState(null);
    const [fieldPhase, setFieldPhase] = React.useState("loading"); // loading | done — gates rendering so we never flash the MPO fallback before field.json settles
    const [loaded, setLoaded] = React.useState(null);
    const [loaded25, setLoaded25] = React.useState(null);
    const [openPdga, setOpenPdga] = React.useState(null);

    React.useEffect(() => {
      let alive = true;
      if (window.ChainsField) {
        window.ChainsField.load()
          .then((f) => { if (alive) { setField(f); setFieldPhase("done"); } })
          .catch(() => { if (alive) setFieldPhase("done"); });
      } else {
        setFieldPhase("done");
      }
      if (ED()) {
        ED().loadSeason("2026").then((l) => { if (alive) setLoaded(l); }).catch(() => {});
        ED().loadSeason("2025").then((l) => { if (alive) setLoaded25(l); }).catch(() => {});
      }
      return () => { alive = false; };
    }, []);

    if (fieldPhase === "loading") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHeader kicker="Registered field" title="Loading…" size="lg" subtitle="Fetching the current tournament roster…" />
          <Card pad={0}>
            <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="cw-skel" style={{ height: 48, borderRadius: "var(--radius-md)" }} />)}
            </div>
          </Card>
        </div>
      );
    }

    // Rating + name lookup from the MPO database, keyed by PDGA number.
    const mpoByPdga = {};
    (window.MPO_PLAYERS || []).forEach((p) => { if (p.pdga != null) mpoByPdga[String(p.pdga)] = p; });
    // Derived rating: average a player's event_ratings across loaded seasons.
    // Covers the whole field (incl. Euro pros) when the MPO DB has no rating.
    const ratingByPdga = {};
    [loaded, loaded25].forEach((L) => {
      if (!L || !L.byPdga) return;
      Object.values(L.byPdga).forEach((rec) => {
        const ers = (rec.apps || []).map((a) => a.row.event_rating).filter((v) => v != null);
        if (!ers.length) return;
        const bucket = ratingByPdga[rec.pdga] || (ratingByPdga[rec.pdga] = []);
        ers.forEach((v) => bucket.push(v));
      });
    });
    const derivedRating = (pdga) => { const b = ratingByPdga[pdga]; return b && b.length ? Math.round(b.reduce((s, x) => s + x, 0) / b.length) : null; };
    // Season-long draft history, keyed by player name.
    const dstats = ChainsEngine.playerStats();

    // Members + picked map for the upcoming event (read-only).
    const membersArr = ChainsEngine.members();
    const members = {};
    membersArr.forEach((m) => { members[m.id] = m; });
    const meta = ChainsEngine.seasonMeta();
    const upcoming = meta.live || meta.next;
    const pickedBy = {};
    if (upcoming) {
      (ChainsEngine.picksFor(upcoming.t) || []).forEach((row) => {
        [row.p1, row.p2].forEach((nm) => { if (nm) (pickedBy[nm] = pickedBy[nm] || []).push(row.m); });
      });
    }

    // Primary list = the registered field (field.json); fall back to the MPO DB.
    let list;
    if (field && field.players && field.players.length) {
      list = field.players.map((fp) => {
        const pdga = String(fp.pdgaNumber);
        const name = [fp.firstName, fp.lastName].join(" ");
        const mpo = mpoByPdga[pdga];
        const ds = dstats[name];
        return { pdga, name, rating: (mpo && mpo.rating) || derivedRating(pdga) || null, picked: pickedBy[name] || [], drafted: ds ? ds.picks : 0, byMember: ds ? ds.byMember : null };
      });
    } else {
      list = (window.MPO_PLAYERS || []).map((p) => { const ds = dstats[p.name]; const pd = p.pdga != null ? String(p.pdga) : p.name; return { pdga: pd, name: p.name, rating: p.rating || derivedRating(pd) || null, picked: pickedBy[p.name] || [], drafted: ds ? ds.picks : 0, byMember: ds ? ds.byMember : null }; });
    }

    if (!list.length) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SectionHeader kicker="Registered field" title="Players" size="lg" subtitle="Not available right now." />
          <Card pad={26}><Empty title="Couldn't load players" sub="The registered field isn't available right now — check back closer to the event." /></Card>
        </div>
      );
    }

    const total = list.length;
    if (q) { const ql = q.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(ql)); }
    list = list.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return ((b.rating || 0) - (a.rating || 0)) || a.name.localeCompare(b.name);
    });

    function recentStats(pdga) {
      const rec = loaded && loaded.byPdga ? loaded.byPdga[pdga] : null;
      if (!rec) return null;
      const apps = rec.apps.slice().sort((a, b) => (a.meta.t || 0) - (b.meta.t || 0)).slice(-3);
      const places = apps.map((a) => a.row.place).filter((p) => p > 0);
      const brs = [];
      apps.forEach((a) => { const s = a.row.stats || {}; if (s.birdie_rate_pct && s.birdie_rate_pct.value != null) brs.push(s.birdie_rate_pct.value); });
      return {
        n: places.length,
        avgFinish: places.length ? places.reduce((s, p) => s + p, 0) / places.length : null,
        birdieRate: brs.length ? brs.reduce((s, x) => s + x, 0) / brs.length : null,
      };
    }

    const eventName = field ? (field.event_tag || "upcoming event") : null;
    let updatedStr = null;
    if (field && field.updated_at) { try { updatedStr = new Date(field.updated_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) {} }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionHeader kicker="Registered field" title={field && upcoming ? upcoming.name : "Players"} size="lg"
          subtitle={field ? `${total} pros registered${updatedStr ? " · updated " + updatedStr : ""}` : "Search, sort, tap a name for recent form."} />

        {/* Search + sort */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            {window.Icons && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-faint)" }}><Icons.Search size={16} /></span>}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players…"
              style={{ width: "100%", height: 42, padding: "0 14px 0 38px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 14, background: "var(--bg-elevated)", outline: "none", boxSizing: "border-box", boxShadow: "var(--shadow-xs)" }} />
          </div>
          <div style={{ display: "flex", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}>
            {[["rating", "Rating"], ["name", "A–Z"]].map(([k, lbl]) => (
              <button key={k} onClick={() => setSort(k)} style={{ height: 42, padding: "0 14px", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, background: sort === k ? "var(--fairway-600)" : "var(--bg-elevated)", color: sort === k ? "#fff" : "var(--text-muted)" }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <Card pad={0}>
          <div style={{ padding: "12px 14px" }}>
            {!list.length ? (
              <div style={{ padding: "22px 6px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>No players match “{q}”.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 8, alignItems: "start" }}>
                {list.map((p) => (
                  <PlayerRow key={p.pdga} p={p} members={members}
                    open={openPdga === p.pdga}
                    onToggle={() => setOpenPdga(openPdga === p.pdga ? null : p.pdga)}
                    stats={openPdga === p.pdga ? recentStats(p.pdga) : null} />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  function PlayersHub({ onPlayer }) {
    const [tab, setTab] = React.useState("field");
    return (
      <div>
        <SubTabs value={tab} onChange={setTab} items={[
          { id: "field", label: "Registered", icon: <Icons.Users size={15} /> },
          { id: "browse", label: "Browse Pros", icon: <Icons.Search size={15} /> },
        ]} />
        {tab === "field" ? <PlayersView onPlayer={onPlayer} /> : <ExploreView />}
      </div>
    );
  }

  window.PlayersView = PlayersView;
  window.PlayersHub = PlayersHub;
})();
