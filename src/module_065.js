/* Chains app — Highlights & video hub. Tabs: Highlights · Tournament Rounds ·
   Practice Rounds · The Guys. 100% read-only; every video is a plain outbound
   link to YouTube (no embed). window.HighlightsView */
(function () {
  const REPO = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data";
  const HIGHLIGHTS_URL = REPO + "/highlights.json";
  const VIDEOS_URL = REPO + "/videos.json";
  const PLAYERS_VIDEOS_URL = REPO + "/players_videos.json";

  // shimmer for loading skeletons (injected once)
  (function injectHlStyles() {
    if (typeof document === "undefined" || document.getElementById("chains-hl-styles")) return;
    const s = document.createElement("style"); s.id = "chains-hl-styles";
    s.textContent = "@keyframes hlShim{0%,100%{opacity:.5}50%{opacity:.85}}.hl-shim{animation:hlShim 1.3s ease-in-out infinite}";
    document.head.appendChild(s);
  })();

  function ic(name, size) { const I = window.Icons && (window.Icons[name] || window.Icons.Dot); return I ? <I size={size || 14} /> : null; }
  function timeAgo(ts) {
    if (!ts) return "";
    const d = Math.max(0, Date.now() - ts), day = 86400000;
    if (d < 3600000) { const m = Math.round(d / 60000); return m <= 1 ? "just now" : m + "m ago"; }
    if (d < day) return Math.round(d / 3600000) + "h ago";
    if (d < 7 * day) return Math.round(d / day) + "d ago";
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function roundParts(title) {
    const parts = String(title || "").split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) return { round: parts[1], who: parts[2] };
    if (parts.length === 2) return { round: parts[1], who: "" };
    return { round: title || "", who: "" };
  }

  function Thumb({ src }) {
    return (
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "var(--bg-sunken)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", overflow: "hidden" }}>
        <img src={src} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(12,22,15,0.6)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>{ic("Play", 22)}</span>
        </span>
      </div>
    );
  }
  function Empty({ icon, title, sub }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "48px 20px", textAlign: "center" }}>
        <span style={{ width: 30, height: 30, color: "var(--text-faint)" }}>{ic(icon || "Play", 30)}</span>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-muted)" }}>{title}</div>
        {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", maxWidth: 340 }}>{sub}</div>}
      </div>
    );
  }
  // Loading placeholder — shimmer tiles, so the tab never flashes an "empty" message
  // while it's actually still fetching.
  function SkeletonGrid({ mobile }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} pad={0}>
            <div className="hl-shim" style={{ width: "100%", aspectRatio: "16 / 9", background: "var(--bg-sunken)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
            <div style={{ padding: "11px 13px 13px" }}>
              <span className="hl-shim" style={{ display: "block", width: "40%", height: 9, borderRadius: 4, background: "var(--bg-sunken)" }} />
              <span className="hl-shim" style={{ display: "block", width: "85%", height: 12, borderRadius: 4, background: "var(--bg-sunken)", marginTop: 8 }} />
            </div>
          </Card>
        ))}
      </div>
    );
  }
  // Plain-language error state (feed unreachable) instead of a permanent "empty".
  function ErrorState({ what }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "44px 20px", textAlign: "center" }}>
        <span style={{ width: 28, height: 28, color: "var(--text-faint)" }}>{ic("Alert", 28) || ic("Dot", 28)}</span>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-muted)" }}>Couldn't load {what || "videos"}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", maxWidth: 320 }}>Check your connection and reopen this tab — the feed refreshes a couple times a day.</div>
      </div>
    );
  }
  function Updated({ at, label }) {
    return at ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", textAlign: "center" }}>{label || "Updated"} {timeAgo(Date.parse(at))}</div> : null;
  }

  // A single video card. mode "round" shows the parsed round label; "title"
  // shows the video title (clamped); "player" shows the player label + title.
  function VideoTile({ v, mode }) {
    const rp = roundParts(v.title);
    return (
      <a href={v.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <Card pad={0} hover>
          <Thumb src={v.thumbnail} />
          <div style={{ padding: "10px 12px 12px" }}>
            {mode === "round" ? (
              <>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12, color: "var(--text-strong)" }}>{rp.round}</div>
                {rp.who && <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rp.who}</div>}
              </>
            ) : (
              <>
                {mode === "player" && <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "var(--ace-600)" }}>{v.player === "Aaron Gossage" ? "Goose" : v.player === "Ezra Aderhold" ? "Ezra" : v.player}</div>}
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.title}</div>
              </>
            )}
          </div>
        </Card>
      </a>
    );
  }

  /* ---- HIGHLIGHTS (short clips) ----------------------------------------- */
  function HighlightsTab({ clips, updatedAt, mobile, failed }) {
    if (failed) return <ErrorState what="highlights" />;
    if (clips == null) return <SkeletonGrid mobile={mobile} />;
    if (!clips.length) return <Empty icon="Flame" title="No highlights right now" sub="Top-shot reels and big moments show up here twice a day." />;
    const sorted = clips.slice().sort((a, b) => (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {sorted.map((c, i) => (
            <a key={(c.video_id || "") + i} href={c.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
              <Card pad={0} hover>
                <Thumb src={c.thumbnail} />
                <div style={{ padding: "11px 13px 13px" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "var(--ace-600)" }}>{c.channel}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)", marginTop: 3, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.title}</div>
                </div>
              </Card>
            </a>
          ))}
        </div>
        <Updated at={updatedAt} label="Highlights updated" />
      </div>
    );
  }

  /* ---- BY-EVENT TABS (rounds / practice) -------------------------------- */
  function EventTab({ tournaments, kind, updatedAt, mobile, emptyTitle, emptySub, failed }) {
    const [year, setYear] = React.useState("All");
    const [open, setOpen] = React.useState({});
    if (failed) return <ErrorState what="videos" />;
    if (tournaments == null) return <SkeletonGrid mobile={mobile} />;
    const groups = (tournaments || [])
      .map((t) => ({ meta: t, vids: (t.videos || []).filter((v) => v.kind === kind) }))
      .filter((g) => g.vids.length);
    if (!groups.length) return <Empty icon={kind === "practice" ? "Disc" : "Play"} title={emptyTitle} sub={emptySub} />;
    const years = ["All"].concat(Array.from(new Set(groups.map((g) => g.meta.year))));
    const shown = year === "All" ? groups : groups.filter((g) => g.meta.year === year);
    const isOpen = (key, i) => (key in open ? open[key] : i === 0);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {years.length > 2 && (
          <div style={{ display: "flex", gap: 7 }}>
            {years.map((y) => {
              const active = y === year;
              return (
                <button key={y} onClick={() => setYear(y)}
                  style={{ height: 32, padding: "0 14px", borderRadius: "var(--radius-pill)", border: `1px solid ${active ? "transparent" : "var(--border-default)"}`, background: active ? "var(--pine-800)" : "var(--bg-elevated)", color: active ? "var(--bone-50)" : "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{y}</button>
              );
            })}
          </div>
        )}
        {shown.map((g, i) => {
          const t = g.meta; const key = t.tournament; const expanded = isOpen(key, i);
          return (
            <Card key={key} pad={0}>
              <button onClick={() => setOpen((o) => ({ ...o, [key]: !expanded }))}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: mobile ? "14px 16px" : "15px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--ace-600)" }}>{t.year} · {t.channel} · {g.vids.length} {kind === "practice" ? "practice" : "round"} videos</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: mobile ? 16 : 19, color: "var(--text-strong)", lineHeight: 1.1, marginTop: 2 }}>{t.tournament}</div>
                </div>
                <span style={{ flexShrink: 0, width: 20, height: 20, color: "var(--text-muted)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform var(--dur-fast)" }}>{ic("ChevDown", 20)}</span>
              </button>
              {expanded && (
                <div style={{ padding: mobile ? "0 14px 14px" : "0 18px 18px", display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
                  {g.vids.map((v, j) => <VideoTile key={(v.video_id || "") + j} v={v} mode={kind === "round" ? "round" : "title"} />)}
                </div>
              )}
            </Card>
          );
        })}
        <Updated at={updatedAt} label="Coverage updated" />
      </div>
    );
  }

  /* ---- THE GUYS (Goose & Ezra) ------------------------------------------ */
  function GuysTab({ videos, updatedAt, mobile, failed }) {
    if (failed) return <ErrorState what="videos" />;
    if (videos == null) return <SkeletonGrid mobile={mobile} />;
    if (!videos || !videos.length) return <Empty icon="Users" title="No videos right now" sub="Goose & Ezra's latest uploads show up here." />;
    const sorted = videos.slice().sort((a, b) => (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Card pad={0}>
          <div style={{ padding: mobile ? "14px 16px" : "15px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5, color: "var(--ace-600)" }}>The team · {sorted.length} videos</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: mobile ? 18 : 21, color: "var(--text-strong)", lineHeight: 1.1, marginTop: 2 }}>Goose &amp; Ezra</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>Aaron Gossage &amp; Ezra Aderhold's personal channels.</div>
          </div>
          <div style={{ padding: mobile ? "14px" : "18px", display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {sorted.map((v, i) => <VideoTile key={(v.video_id || "") + i} v={v} mode="player" />)}
          </div>
        </Card>
        <Updated at={updatedAt} label="Channels updated" />
      </div>
    );
  }

  /* ---- ROOT ------------------------------------------------------------- */
  function HighlightsView() {
    const { mobile } = useViewport();
    const [tab, setTab] = React.useState("highlights");
    const [clips, setClips] = React.useState(null);
    const [clipsUpdated, setClipsUpdated] = React.useState(null);
    const [tournaments, setTournaments] = React.useState(null);
    const [videosUpdated, setVideosUpdated] = React.useState(null);
    const [guys, setGuys] = React.useState(null);
    const [guysUpdated, setGuysUpdated] = React.useState(null);
    const [failed, setFailed] = React.useState({});

    React.useEffect(() => {
      let alive = true;
      const fail = (k) => { if (alive) setFailed((f) => ({ ...f, [k]: true })); };
      fetch(HIGHLIGHTS_URL, { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
        if (alive && j) { setClips(j.clips || []); setClipsUpdated(j.updated_at || null); }
      }).catch(() => fail("clips"));
      fetch(VIDEOS_URL, { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
        if (alive && j) { setTournaments(j.tournaments || []); setVideosUpdated(j.updated_at || null); }
      }).catch(() => fail("videos"));
      fetch(PLAYERS_VIDEOS_URL, { cache: "no-store" }).then((r) => r.ok ? r.json() : Promise.reject()).then((j) => {
        if (alive && j) { setGuys(j.videos || []); setGuysUpdated(j.updated_at || null); }
      }).catch(() => fail("guys"));
      return () => { alive = false; };
    }, []);

    const tabs = [
      { id: "highlights", label: "Highlights", icon: ic("Flame", 15) },
      { id: "rounds", label: "Rounds", icon: ic("Play", 15) },
      { id: "practice", label: "Practice", icon: ic("Disc", 15) },
      { id: "guys", label: "The Guys", icon: ic("Users", 15) },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader kicker="Press play" title="Highlights" size="lg"
          subtitle="Top-shot reels, full tournament coverage, practice rounds, and the guys' own channels — every clip opens on YouTube." />
        <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 16px", borderRadius: "var(--radius-pill)", border: `1px solid ${active ? "transparent" : "var(--border-default)"}`, background: active ? "var(--pine-800)" : "var(--bg-elevated)", cursor: "pointer" }}>
                <span style={{ width: 15, height: 15, color: active ? "var(--ace-400)" : "var(--text-faint)", display: "inline-flex" }}>{t.icon}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 13, color: active ? "var(--bone-50)" : "var(--text-muted)" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
        {tab === "highlights" && <HighlightsTab clips={clips} updatedAt={clipsUpdated} mobile={mobile} failed={failed.clips} />}
        {tab === "rounds" && <EventTab tournaments={tournaments} kind="round" updatedAt={videosUpdated} mobile={mobile} failed={failed.videos} emptyTitle="No round coverage yet" emptySub="Round-by-round videos show up here as events are played." />}
        {tab === "practice" && <EventTab tournaments={tournaments} kind="practice" updatedAt={videosUpdated} mobile={mobile} failed={failed.videos} emptyTitle="No practice rounds yet" emptySub="Jomez practice-round videos show up here, grouped by event." />}
        {tab === "guys" && <GuysTab videos={guys} updatedAt={guysUpdated} mobile={mobile} failed={failed.guys} />}
      </div>
    );
  }

  window.HighlightsView = HighlightsView;
})();
