/* Chains app — Explore: browse real PDGA tournaments, players & stats.
   Read-only over window.ExploreData / window.ChainsProStats. window.ExploreView */
(function () {
  const ED = () => window.ExploreData;

  function fmtMoney(n) { return "$" + Math.round(n || 0).toLocaleString(); }
  function ic(name, size) { const I = (window.Icons && (window.Icons[name] || window.Icons.Dot)); return I ? <I size={size || 14} /> : null; }

  /* ---- shared bits ------------------------------------------------------ */
  function Pillbar({ items, value, onChange }) {
    return (
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 0", WebkitOverflowScrolling: "touch" }}>
        {items.map((it) => {
          const active = value === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 15px", borderRadius: "var(--radius-pill)", border: `1px solid ${active ? "transparent" : "var(--border-default)"}`, background: active ? "var(--pine-800)" : "var(--bg-elevated)", cursor: "pointer", transition: "background var(--dur-fast)" }}>
              {it.icon && <span style={{ width: 15, height: 15, color: active ? "var(--ace-400)" : "var(--text-faint)", display: "inline-flex" }}>{it.icon}</span>}
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 13, color: active ? "var(--bone-50)" : "var(--text-muted)" }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function SeasonToggle({ season, onChange }) {
    const [years, setYears] = React.useState(null);
    React.useEffect(() => {
      if (window.ChainsHistory) window.ChainsHistory.loadManifest().then((m) => { if (m && m.seasons) setYears(m.seasons.map((s) => String(s.year)).sort((a, b) => b - a)); });
    }, []);
    const list = years || ["2026", "2025"];
    return (
      <select value={season} onChange={(e) => onChange(e.target.value)}
        style={{ height: 38, padding: "0 34px 0 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", color: "var(--text-strong)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 13, cursor: "pointer", outline: "none", appearance: "none", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='3'><polyline points='6 9 12 15 18 9'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 13px center" }}>
        {list.map((y) => <option key={y} value={y}>{y} Season</option>)}
      </select>
    );
  }

  function PlayerLink({ pdga, name, onOpen, color, strong }) {
    const clickable = pdga != null && pdga !== "null";
    return (
      <span onClick={() => clickable && onOpen(pdga)}
        style={{ fontFamily: "var(--font-sans)", fontWeight: strong ? 700 : 600, fontSize: 13.5, color: color || "var(--text-strong)", cursor: clickable ? "pointer" : "default", borderBottom: clickable ? "1px dashed var(--border-default)" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
    );
  }

  function Empty({ icon, title, sub }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "44px 20px", textAlign: "center" }}>
        <span style={{ width: 30, height: 30, color: "var(--text-faint)" }}>{ic(icon || "Search", 30)}</span>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-muted)" }}>{title}</div>
        {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)", maxWidth: 320 }}>{sub}</div>}
      </div>
    );
  }

  function Loading({ label }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "56px 20px" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", border: "3px solid var(--bone-300)", borderTopColor: "var(--fairway-600)", animation: "chains-spin 0.8s linear infinite" }} />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 12, color: "var(--text-muted)" }}>{label || "Loading the tour…"}</div>
      </div>
    );
  }

  /* ---- TOURNAMENTS ------------------------------------------------------ */
  function TournamentsTab({ loaded, season, onPlayer, mobile }) {
    const events = loaded.events;
    const [sel, setSel] = React.useState(events.length ? events[0].meta.id : null);
    React.useEffect(() => { setSel(events.length ? events[0].meta.id : null); }, [season]);
    if (!events.length) return <Empty icon="Calendar" title={season === "2025" ? "2025 archive coming soon" : "No events posted yet"} sub={season === "2025" ? "The 2025 season index isn't published in the feed yet — it'll appear here automatically once it is." : "Tournament fields show up here as the tour posts them."} />;
    const cur = events.find((e) => e.meta.id === sel) || events[0];
    const rows = cur.rows.slice().sort((a, b) => a.place - b.place);
    const ED0 = ED();
    return (
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "230px 1fr", gap: 16, alignItems: "start" }}>
        {/* event rail */}
        <div style={{ display: mobile ? "flex" : "flex", flexDirection: mobile ? "row" : "column", gap: 7, overflowX: mobile ? "auto" : "visible", paddingBottom: mobile ? 4 : 0 }}>
          {events.map((e) => {
            const active = e.meta.id === sel;
            return (
              <button key={e.meta.id} onClick={() => setSel(e.meta.id)}
                style={{ flexShrink: 0, textAlign: "left", minWidth: mobile ? 180 : 0, padding: "10px 12px", borderRadius: "var(--radius-md)", border: `1px solid ${active ? "var(--fairway-500)" : "var(--border-subtle)"}`, background: active ? "var(--fairway-600)" : "var(--bg-elevated)", cursor: "pointer" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: active ? "#fff" : "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.meta.t ? "T" + e.meta.t + " · " : ""}{e.meta.name || e.ev.event_name}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: active ? "rgba(255,255,255,.8)" : "var(--text-faint)", marginTop: 2 }}>{e.meta.dates || ""}{e.meta.dates ? " · " : ""}{e.rows.length} players</div>
              </button>
            );
          })}
        </div>
        {/* leaderboard */}
        <Card pad={0}>
          <div style={{ padding: mobile ? "16px" : "18px 22px", background: "var(--bg-ink)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: mobile ? 18 : 22, color: "var(--bone-50)", lineHeight: 1 }}>{cur.ev.event_name}</span>
              {cur.meta.tier && <TierTag tier={cur.meta.tier} />}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 7, fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", flexWrap: "wrap" }}>
              {cur.meta.loc && <span>{cur.meta.loc}</span>}
              {cur.meta.dates && <span>· {cur.meta.dates}</span>}
              <span>· {cur.ev.rounds_count || rows[0] && (rows[0].rounds || []).length} rounds</span>
              <span>· {rows.length}-player field</span>
            </div>
          </div>
          {/* header */}
          {!mobile && (
            <div style={{ display: "grid", gridTemplateColumns: "46px 1fr 74px 70px 84px", gap: 10, padding: "9px 22px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
              {["", "Player", "To par", "Birdies", "Prize"].map((h, i) => (
                <span key={i} style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)", textAlign: i >= 2 ? "right" : "left" }}>{h}</span>
              ))}
            </div>
          )}
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            {rows.map((r, i) => {
              const tied = r.tied;
              const birdies = ED0.statCount(r, "birdie_count");
              if (mobile) {
                return (
                  <div key={r.pdga_number + "-" + i} onClick={() => onPlayer(String(r.pdga_number))} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 16px", borderTop: i ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" }}>
                    <span style={{ width: 30, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: r.place === 1 ? "var(--gold-500)" : "var(--text-faint)" }}>{tied ? "T" : ""}{r.place}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <PlayerLink pdga={String(r.pdga_number)} name={ED0.nameOf(r)} onOpen={onPlayer} strong />
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>{birdies != null ? birdies + " birdies" : ""}{r.prize_usd ? " · " + fmtMoney(r.prize_usd) : ""}</div>
                    </div>
                    <ScoreValue value={r.to_par} size={16} />
                  </div>
                );
              }
              return (
                <div key={r.pdga_number + "-" + i} onClick={() => onPlayer(String(r.pdga_number))} style={{ display: "grid", gridTemplateColumns: "46px 1fr 74px 70px 84px", gap: 10, padding: "10px 22px", alignItems: "center", borderTop: i ? "1px solid var(--border-subtle)" : "none", cursor: "pointer" }}>
                  <span style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: r.place === 1 ? "var(--gold-500)" : r.place <= 5 ? "var(--text-strong)" : "var(--text-faint)" }}>{tied ? "T" : ""}{r.place}</span>
                  <PlayerLink pdga={String(r.pdga_number)} name={ED0.nameOf(r)} onOpen={onPlayer} strong />
                  <span style={{ textAlign: "right" }}><ScoreValue value={r.to_par} size={15} /></span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-body)" }}>{birdies != null ? birdies : "—"}</span>
                  <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: r.prize_usd ? "var(--fairway-700)" : "var(--text-faint)" }}>{r.prize_usd ? fmtMoney(r.prize_usd) : "—"}</span>
                </div>
              );
            })}
          </div>
        </Card>
        {cur.meta.t != null && window.ArchiveBoard && (
          <div style={{ gridColumn: mobile ? "auto" : "1 / -1" }}>
            <div style={{ margin: "4px 0 10px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Full field · hole by hole</div>
            {React.createElement(window.ArchiveBoard, { t: cur.meta.t, mobile: mobile })}
          </div>
        )}
      </div>
    );
  }

  /* ---- LEADERBOARDS ----------------------------------------------------- */
  function BoardCard({ lb, onPlayer }) {
    const b = lb.board;
    return (
      <Card pad={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: b.accent, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic(b.icon, 16)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)", lineHeight: 1 }}>{b.title}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>{b.sub}</div>
          </div>
        </div>
        <div style={{ padding: "4px 12px 8px" }}>
          {lb.rows.map((r, i) => (
            <div key={r.pdga + "-" + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ width: 16, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 ? "var(--gold-500)" : "var(--text-faint)" }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <PlayerLink pdga={r.pdga} name={r.name} onOpen={onPlayer} />
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.meta.t ? "T" + r.meta.t + " · " : ""}{r.meta.name || ""}</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", flexShrink: 0 }}>{b.fmt(r.value)}{b.suffix ? <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: 3 }}>{b.suffix}</span> : null}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  // Season prize-money leaderboard for the PROS — total winnings across the whole
  // season (fills the slot beside "Biggest Paydays", which is single-event prize).
  // Top 5 pros by cumulative prize_usd via ExploreData.seasonEarnings().
  function SeasonEarningsBoard({ loaded, onPlayer }) {
    const rows = (window.ExploreData && loaded) ? ED().seasonEarnings(loaded, 5) : [];
    return (
      <Card pad={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <span style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: "var(--gold-500)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ic("Trophy", 16)}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)", lineHeight: 1 }}>Most Money Won</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>season total · prize money</div>
          </div>
        </div>
        <div style={{ padding: "4px 12px 8px" }}>
          {rows.length === 0 ? (
            <div style={{ padding: "14px 4px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>No prize money in the feed yet.</div>
          ) : rows.map((r, i) => (
            <div key={r.pdga} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ width: 16, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: i === 0 ? "var(--gold-500)" : "var(--text-faint)" }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <PlayerLink pdga={r.pdga} name={r.name} onOpen={onPlayer} />
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.events} {r.events === 1 ? "event" : "events"} cashed</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--text-strong)", flexShrink: 0 }}>{fmtMoney(r.total)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  function LeaderboardsTab({ loaded, onPlayer, mobile }) {
    const boards = ED().allBoards(loaded, 5);
    if (!boards.length) return <Empty icon="Medal" title="No leaderboards yet" sub="Once events are in the feed, the fun stats land here." />;
    return (
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2, 1fr)", gap: 16, alignItems: "start" }}>
        {boards.map((lb) => <BoardCard key={lb.board.key} lb={lb} onPlayer={onPlayer} />)}
        <SeasonEarningsBoard loaded={loaded} onPlayer={onPlayer} />
      </div>
    );
  }

  /* ---- PLAYERS (search) ------------------------------------------------- */
  function PlayersTab({ loaded, onPlayer, mobile }) {
    const [q, setQ] = React.useState("");
    const results = ED().searchPlayers(q);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ position: "relative", maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--text-faint)" }}>{ic("Search", 16)}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the MPO field…"
            style={{ width: "100%", height: 44, padding: "0 14px 0 36px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fill, minmax(190px, 1fr))", gap: 10 }}>
          {results.map((p) => {
            const has = p.pdga != null;
            const prof = has ? ED().playerProfile(loaded, p.pdga) : null;
            return (
              <button key={p.name} onClick={() => has && onPlayer(String(p.pdga))} disabled={!has}
                style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", cursor: has ? "pointer" : "default", opacity: has ? 1 : 0.55 }}>
                <Avatar name={p.name} color={prof && prof.wins ? "var(--gold-500)" : "var(--fairway-500)"} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>{prof ? prof.played + " events · best " + ordinal(prof.bestFinish) : has ? "no events yet" : "no PDGA #"}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  function ordinal(n) { if (n == null) return "—"; const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  /* ---- NEWS ------------------------------------------------------------- */
  function NewsTab({ loaded, onPlayer, mobile }) {
    const items = ED().newsItems(loaded);
    const Recap = (window.ClubhouseParts || {}).PostCard;
    if (!items.length && !Recap) return <Empty icon="Flame" title="Nothing to report yet" sub="Fresh tour headlines appear here as results come in." />;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
        {Recap && <Recap mobile={mobile} />}
        {items.map((it, i) => (
          <Card key={i} pad={0}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "14px 16px" }}>
              <span style={{ flexShrink: 0, marginTop: 1, padding: "3px 9px", borderRadius: "var(--radius-pill)", background: "var(--pine-800)", color: "var(--bone-50)", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10 }}>{it.tag}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14.5, color: "var(--text-strong)", lineHeight: 1.35 }}>
                  {it.pdga ? <PlayerLink pdga={it.pdga} name={it.lead} onOpen={onPlayer} strong /> : it.lead}
                </div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{it.detail}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  /* ---- PLAYER SHEET (overlay) ------------------------------------------ */
  function PStat({ label, value, accent }) {
    return (
      <div style={{ background: "var(--pine-700)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: accent || "var(--bone-50)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", fontSize: 9, color: "var(--chain-400)", marginTop: 5 }}>{label}</div>
      </div>
    );
  }
  function PlayerSheet({ pdga, loaded, season, onClose, onPlayer }) {
    if (pdga == null) return null;
    const prof = ED().playerProfile(loaded, pdga);
    const dbName = (window.MPO_PLAYERS || []).find((p) => String(p.pdga) === String(pdga));
    const name = prof ? prof.name : (dbName ? dbName.name : "Player");
    const ED0 = ED();
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(12,22,15,0.5)", backdropFilter: "blur(3px)", zIndex: 120, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 480, maxWidth: "94vw", height: "100%", background: "var(--bg-page)", boxShadow: "var(--shadow-xl)", overflowY: "auto", animation: "chains-slide .28s var(--ease-out)" }}>
          <div style={{ background: "var(--bg-ink)", padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-400)" }}>MPO Player · {season}</span>
              <IconButton title="Close" variant="ghost" size="sm" onClick={onClose} style={{ color: "var(--chain-300)" }}>{ic("X", 16)}</IconButton>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 28, color: "var(--bone-50)", lineHeight: 1 }}>{name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}>
              {prof && prof.rating != null && (
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5, padding: "3px 10px", background: "var(--ace-500)", borderRadius: "var(--radius-pill)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: "#fff" }}>{prof.rating}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9, color: "#fff" }}>rating</span>
                </span>
              )}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--chain-400)" }}>PDGA #{pdga}</span>
            </div>
            {prof ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
                <PStat label="Events" value={prof.played} />
                <PStat label="Best" value={ordinal(prof.bestFinish)} accent="var(--gold-500)" />
                <PStat label="Avg finish" value={prof.avgFinish != null ? prof.avgFinish.toFixed(1) : "—"} />
                <PStat label="Wins" value={prof.wins} />
                <PStat label="Top 5s" value={prof.top5} />
                <PStat label="Earnings" value={fmtMoney(prof.earnings)} accent="var(--fairway-300)" />
              </div>
            ) : null}
          </div>
          {!prof ? (
            <Empty icon="Disc" title={"No " + season + " stats yet"} sub="This player hasn't appeared in a tracked event this season. Their stat page lights up once they tee off." />
          ) : (
            <div style={{ padding: "18px 24px 30px" }}>
              {/* titles & podiums — the announcer's résumé */}
              {prof.podiums && prof.podiums.length > 0 && (
                <React.Fragment>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>{season} podiums</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 22 }}>
                    {prof.podiums.slice().sort((a, b) => a.place - b.place).map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: t.place === 1 ? "var(--gold-50, #fdf6e3)" : "var(--bg-elevated)", border: "1px solid " + (t.place === 1 ? "var(--gold-500)" : "var(--border-subtle)"), borderRadius: "var(--radius-md)" }}>
                        <span style={{ fontSize: 17 }}>{t.place === 1 ? "🏆" : t.place === 2 ? "🥈" : "🥉"}</span>
                        <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.place === 1 ? "Won " : ordinal(t.place) + " · "}{t.name}</span>
                        <ScoreValue value={t.toPar} size={14} />
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              )}
              {/* standout */}
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Season standouts</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                <Standout label="Most birdies (event)" v={prof.standout.birdies} fmt={(x) => x} />
                <Standout label="Best C1X putting" v={prof.standout.c1x} fmt={(x) => x.toFixed(1) + "%"} />
                <Standout label="Longest throw-in" v={prof.standout.throwin} fmt={(x) => Math.round(x) + " ft"} />
                <Standout label="Best scramble" v={prof.standout.scramble} fmt={(x) => Math.round(x) + "%"} />
              </div>
              {/* event log */}
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Every event ({season})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {prof.apps.slice().reverse().map((a, i) => {
                  const r = a.row;
                  const birdies = ED0.statCount(r, "birdie_count");
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ width: 34, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: r.place === 1 ? "var(--gold-500)" : "var(--text-faint)" }}>{r.tied ? "T" : ""}{r.place}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.meta.t ? "T" + a.meta.t + " · " : ""}{a.meta.name || ""}</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>{birdies != null ? birdies + " birdies" : ""}{r.prize_usd ? " · " + fmtMoney(r.prize_usd) : ""}</div>
                      </div>
                      <ScoreValue value={r.to_par} size={16} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  function Standout({ label, v, fmt }) {
    return (
      <div style={{ padding: "11px 13px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9.5, color: "var(--text-faint)" }}>{label}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 19, color: "var(--text-strong)", marginTop: 3 }}>{v ? fmt(v.v) : "—"}</div>
        {v && v.meta && <div style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)", marginTop: 1 }}>{v.meta.t ? "T" + v.meta.t : ""}{v.meta.name ? " · " + v.meta.name : ""}</div>}
      </div>
    );
  }

  /* ---- ROOT ------------------------------------------------------------- */
  function ExploreView() {
    const { mobile } = useViewport();
    const [season, setSeason] = React.useState("2026");
    const [tab, setTab] = React.useState("tournaments");
    const [loaded, setLoaded] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [openPdga, setOpenPdga] = React.useState(null);

    React.useEffect(() => {
      let alive = true;
      setLoading(true); setLoaded(null);
      ED().loadSeason(season).then((res) => { if (alive) { setLoaded(res); setLoading(false); } })
        .catch(() => { if (alive) { setLoaded({ season: season, events: [], byPdga: {} }); setLoading(false); } });
      return () => { alive = false; };
    }, [season]);

    const tabs = [
      { id: "tournaments", label: "Tournaments", icon: ic("Calendar", 15) },
      { id: "leaderboards", label: "Leaderboards", icon: ic("Medal", 15) },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <SectionHeader kicker="The Vault · real PDGA data" title="Explore" size="lg"
            subtitle="Every tournament, player and stat from the pro tour — browse, scout, and settle arguments." />
          <SeasonToggle season={season} onChange={setSeason} />
        </div>

        <Pillbar items={tabs} value={tab} onChange={setTab} />
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: -6, lineHeight: 1.5 }}>
          {tab === "tournaments" ? "Final results from every event this season — tap one for the full field, payouts and round scores."
            : "Who led the tour in birdies, putting, distance and more — the season's stat leaders, ranked."}
        </div>

        {loading ? <Loading label={"Crunching the " + season + " season…"} /> : !loaded ? null : (
          <div>
            {tab === "tournaments" && <TournamentsTab loaded={loaded} season={season} onPlayer={setOpenPdga} mobile={mobile} />}
            {tab === "leaderboards" && <LeaderboardsTab loaded={loaded} onPlayer={setOpenPdga} mobile={mobile} />}
          </div>
        )}

        {loaded && <PlayerSheet pdga={openPdga} loaded={loaded} season={season} onClose={() => setOpenPdga(null)} onPlayer={setOpenPdga} />}
      </div>
    );
  }

  window.ExploreView = ExploreView;
})();
