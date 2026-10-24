/* Chains app — shell: sidebar, routing, member drawer. window.ChainsApp */
(function () {
  const __Portal = ({ children }) => (window.ReactDOM && ReactDOM.createPortal) ? ReactDOM.createPortal(children, document.body) : children;

  // Shared overlay contract: Esc closes any active overlay (drawers, sheets,
  // menus), alongside tap-outside and an explicit × — one dismissal model everywhere.
  function useEscToClose(active, onClose) {
    React.useEffect(() => {
      if (!active) return;
      const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [active, onClose]);
  }

  function Mark({ size = 38 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", flexShrink: 0 }}>
        <circle cx="32" cy="32" r="32" fill="#16261E" />
        <rect x="20" y="14" width="24" height="3.4" rx="1.7" fill="#FF5A1F" />
        <rect x="30.6" y="17" width="2.8" height="33" rx="1.4" fill="#C7CEC9" />
        <g stroke="#93C9A8" strokeWidth="1.7" strokeLinecap="round">
          <path d="M22 18.5 L30 30" /><path d="M27 18.5 L31 30" /><path d="M37 18.5 L33 30" /><path d="M42 18.5 L34 30" /><path d="M32 18.5 L32 30" />
        </g>
        <path d="M19 31.5 H45 L41.5 41 H22.5 Z" fill="#2E6B45" />
        <path d="M19 31.5 H45" stroke="#5BA978" strokeWidth="2" strokeLinecap="round" />
        <g stroke="#0C160F" strokeWidth="1" opacity="0.45">
          <path d="M25 32 L26.5 40" /><path d="M30 32 L30.7 40" /><path d="M34 32 L33.3 40" /><path d="M39 32 L37.5 40" />
        </g>
      </svg>
    );
  }

  function NavItem({ icon, label, desc, active, onClick, pulse }) {
    const [h, setH] = React.useState(false);
    return (
      <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 14px", border: "none", borderRadius: "var(--radius-md)", background: active ? "var(--pine-700)" : h ? "rgba(255,255,255,0.05)" : "transparent", cursor: "pointer", textAlign: "left", transition: "background var(--dur-fast)" }}>
        <span style={{ position: "relative", width: 18, height: 18, color: active ? "var(--ace-400)" : "var(--chain-400)", display: "inline-flex", flexShrink: 0 }}>{icon}{pulse && <span className="cw-livedot" style={{ position: "absolute", top: -3, right: -4, width: 8, height: 8, borderRadius: "50%", background: "var(--clay-500, #d2502f)", boxShadow: "0 0 0 2px var(--bg-ink-deep)" }} />}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 14, color: active ? "var(--bone-50)" : "var(--chain-300)" }}>{label}</span>
          {desc && <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 10.5, color: active ? "var(--chain-400)" : "var(--chain-600)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc}</span>}
        </span>
        {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--ace-500)", flexShrink: 0 }} />}
      </button>
    );
  }

  function MemberDrawer({ memberId, onClose }) {
    useEscToClose(!!memberId, onClose);
    if (!memberId) return null;
    const L = window.ChainsActive ? ChainsActive.league() : null;
    const mPtsLabel = (L && L.scoring === "cumulative-down") ? "down" : "pts";
    const standings = L ? L.standings : ChainsEngine.standings();
    const m = standings.find((x) => x.id === memberId);
    if (!m) return null;
    const TS = ChainsEngine.SEED.TOURNAMENTS;
    // collect this member's picks history
    const history = [];
    if (!L) TS.forEach((t) => {
      const picks = ChainsEngine.picksFor(t.t);
      if (!picks) return;
      const mine = picks.find((p) => p.m === memberId);
      const r = ChainsEngine.eventResults(t.t);
      const rr = r && r.scored ? r.rows.find((x) => x.m === memberId) : null;
      if (mine) history.push({ t, mine, rr });
    });
    const Lhistory = L ? (L.events || []).map((t) => {
      const ev = m.events[t.t] || null;
      return { t, picks: ChainsActive.memberPicks(L, t.t, memberId), total: ev ? ev.total : null, place: ev ? ev.place : null };
    }).filter((h) => h.picks.length) : [];

    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(12,22,15,0.5)", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "92vw", height: "100%", background: "var(--bg-page)", boxShadow: "var(--shadow-xl)", overflowY: "auto", animation: "chains-slide .28s var(--ease-out)" }}>
          <div style={{ background: "var(--bg-ink)", padding: "22px 24px", position: "relative" }}>
            <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: m.disc }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--chain-400)" }}>Member card</span>
              <IconButton title="Close" variant="ghost" size="sm" onClick={onClose} style={{ color: "var(--chain-300)" }}><Icons.X size={16} /></IconButton>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={m.name} color={m.disc} size={56} ring />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 28, color: "var(--bone-50)", lineHeight: 1 }}>{m.name}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
                  <Badge tone="gold" emphasis="solid">{m.rankTie ? "T" : ""}{m.rank}{rankSuffix(m.rank)} place</Badge>
                  <Badge tone="fairway" emphasis="solid">{m.points} {mPtsLabel}</Badge>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 18 }}>
              <MiniStat label="Wins" value={m.wins} />
              <MiniStat label="Top 3" value={m.top3} />
              <MiniStat label="Events" value={m.played} />
            </div>
          </div>
          <div style={{ padding: "18px 24px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>Pick history</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!L && history.map(({ t, mine, rr }) => (
                <div key={t.t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ width: 30, textAlign: "center", flexShrink: 0 }}>
                    {rr && rr.place ? <PlaceBadge place={rr.place} size={28} points={rr.points} /> : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-faint)", fontSize: 13 }}>T{t.t}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{mine.p1}{mine.p2 && mine.p2 !== "N/A" ? ` · ${mine.p2}` : ""}</div>
                  </div>
                  {rr ? <ScoreValue value={rr.total} size={16} /> : <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}>—</span>}
                </div>
              ))}
              {L && Lhistory.map((h) => (
                <div key={h.t.t} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ width: 30, textAlign: "center", flexShrink: 0 }}>
                    {h.place ? <PlaceBadge place={h.place} size={28} /> : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-faint)", fontSize: 13 }}>T{h.t.t}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.t.name}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 3 }}>
                      {h.picks.map((pk, pi) => (
                        <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-muted)" }}>
                          {pi > 0 && <span style={{ color: "var(--border-default)" }}>·</span>}
                          {pk.name}<ScoreValue value={pk.score} size={11} />
                        </span>
                      ))}
                    </div>
                  </div>
                  <ScoreValue value={h.total} size={16} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function MiniStat({ label, value }) {
    return (
      <div style={{ background: "var(--pine-700)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24, color: "var(--bone-50)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--chain-400)", marginTop: 4 }}>{label}</div>
      </div>
    );
  }

  function rankSuffix(n) { return n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"; }

  function EventAbout({ t, status }) {
    const info = (window.EVENT_INFO || {})[t];
    const facts = info ? [["Course", info.course], ["Par", info.par], ["Purse", info.purse], ["Champ", info.champ]].filter((f) => f[1]) : [];
    if (!info || (!facts.length && !info.note)) {
      if (status === "complete") return null;
      return (
        <div style={{ margin: "0 0 16px", padding: "11px 14px", border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>
          Course details, purse, and storylines drop before tee-off.
        </div>
      );
    }
    return (
      <div style={{ margin: "0 0 18px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>About this event</div>
        {facts.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: info.note ? 10 : 0 }}>
            {facts.map(([k, v]) => (
              <div key={k} style={{ padding: "9px 11px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", fontSize: 9.5, color: "var(--text-faint)" }}>{k}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--text-strong)", marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
        {info.note && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-body)", lineHeight: 1.55, margin: 0 }}>{info.note}</p>}
      </div>
    );
  }

  function EventDrawer({ eventT, onClose, onMember }) {
    useEscToClose(eventT != null, onClose);
    if (eventT == null) return null;
    const tour = ChainsEngine.SEED.TOURNAMENTS.find((x) => x.t === eventT);
    if (!tour) return null;
    const L = window.ChainsActive ? ChainsActive.league() : null;
    const res = ChainsEngine.eventResults(eventT);
    const picks = ChainsEngine.picksFor(eventT) || [];
    const byM = {};
    if (res) res.rows.forEach((r) => (byM[r.m] = r));
    const ordered = [...picks].sort((a, b) => {
      const ra = byM[a.m], rb = byM[b.m];
      if (res && res.scored && ra && rb) return ra.place - rb.place;
      return a.slot - b.slot;
    });
    const tierColor = tour.tier === "Major" ? "var(--gold-500)" : "var(--ace-400)";
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(12,22,15,0.5)", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 1080, maxWidth: "96vw", height: "100%", background: "var(--bg-page)", boxShadow: "var(--shadow-xl)", overflowY: "auto", animation: "chains-slide .28s var(--ease-out)" }}>
          <div style={{ background: "var(--bg-ink)", padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: tierColor }}>Event {tour.t} · {tour.tier}</span>
              <IconButton title="Close" variant="ghost" size="sm" onClick={onClose} style={{ color: "var(--chain-300)" }}><Icons.X size={16} /></IconButton>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 26, color: "var(--bone-50)", lineHeight: 1.02 }}>{tour.name}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400)", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 13, height: 13 }}><Icons.Pin size={13} /></span>{tour.loc}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 13, height: 13 }}><Icons.Calendar size={13} /></span>{tour.dates}</span>
            </div>
            {tour.proWinner && <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 11px", background: "var(--pine-700)", borderRadius: "var(--radius-pill)" }}><span style={{ width: 14, height: 14, color: "var(--gold-500)" }}><Icons.Trophy size={14} /></span><span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--bone-50)" }}>Pro winner: <b>{tour.proWinner}</b></span></div>}
          </div>
          <div style={{ padding: "16px 18px 28px" }}>
            <EventAbout t={tour.t} status={tour.status} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>League result</span>
              {res && res.scored ? <Badge tone="fairway">Final</Badge> : tour.status === "live" ? <Badge tone="live">Live</Badge> : <Badge tone="ace">Picks locked</Badge>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!L && ordered.map(({ m: mid, p1, p2, s1, s2, slot }) => {
                const m = ChainsEngine.member(mid);
                const r = byM[mid];
                return (
                  <div key={mid} onClick={() => onMember && onMember(mid)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                    <div style={{ width: 30, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      {r && r.place ? <PlaceBadge place={r.place} size={30} points={r.points} /> : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-faint)", fontSize: 13 }}>{slot}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={m.name} color={m.disc} size={24} />
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{p1 || "—"} <ScoreValueInline value={s1} /></span>
                        <span style={{ color: "var(--border-default)" }}>·</span>
                        <span>{p2 && p2 !== "N/A" ? p2 : "—"} <ScoreValueInline value={s2} /></span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <ScoreValue value={r ? r.total : ChainsEngine.projTotal({ s1, s2 }, ordered)} size={18} />
                      {r && r.place ? <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, color: "var(--text-faint)" }}>+{r.points} pts</div> : null}
                    </div>
                  </div>
                );
              })}
              {L && ChainsActive.rankedForEvent(L, eventT).map((row) => {
                const mem = row.m;
                return (
                  <div key={mem.id} onClick={() => onMember && onMember(mem.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                    <div style={{ width: 30, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                      {row.place ? <PlaceBadge place={row.place} size={30} /> : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-faint)", fontSize: 13 }}>—</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={mem.name} color={mem.disc} size={24} />
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{mem.name}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {ChainsActive.memberPicks(L, eventT, mem.id).map((pk, pi) => (
                          <span key={pi} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{pk.name || "—"} <ScoreValueInline value={pk.score} /></span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <ScoreValue value={row.total} size={18} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 22, marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Full field · hole by hole</span>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>Every player's round-by-round scores — switch rounds with the tabs below.</div>
            </div>
            {window.ArchiveBoard ? React.createElement(window.ArchiveBoard, { t: tour.t, mobile: true, leaguePicks: L ? ChainsActive.leaguePicks(L, eventT) : undefined }) : null}
          </div>
        </div>
      </div>
    );
  }

  function ScoreValueInline({ value }) {
    if (value == null) return null;
    return <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11, color: value < 0 ? "var(--score-under)" : value > 0 ? "var(--score-over)" : "var(--score-even)" }}>{value === 0 ? "E" : value < 0 ? value : "+" + value}</span>;
  }

  function PlayerDrawer({ name, onClose, onMember }) {
    useEscToClose(!!name, onClose);
    if (!name) return null;
    const stats = ChainsEngine.playerStats()[name] || { picks: 0, byMember: {}, bestScore: null, events: [] };
    const player = (window.MPO_PLAYERS || []).find((p) => p.name === name) || {};
    const TS = ChainsEngine.SEED.TOURNAMENTS;
    const evs = [...stats.events].sort((a, b) => a.t - b.t);
    const scored = stats.events.filter((e) => e.score != null);
    const avgScore = scored.length ? Math.round(scored.reduce((s, e) => s + e.score, 0) / scored.length) : null;
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(12,22,15,0.5)", backdropFilter: "blur(3px)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "92vw", height: "100%", background: "var(--bg-page)", boxShadow: "var(--shadow-xl)", overflowY: "auto", animation: "chains-slide .28s var(--ease-out)" }}>
          <div style={{ background: "var(--bg-ink)", padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-400)" }}>MPO Player</span>
              <IconButton title="Close" variant="ghost" size="sm" onClick={onClose} style={{ color: "var(--chain-300)" }}><Icons.X size={16} /></IconButton>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 28, color: "var(--bone-50)", lineHeight: 1 }}>{name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 16 }}>
              <DStat label="Rating" value={player.rating || "—"} />
              <DStat label="Times picked" value={stats.picks} />
              <DStat label="Best round" value={<ScoreValue value={stats.bestScore} size={22} />} />
              <DStat label="Avg round" value={<ScoreValue value={avgScore} size={22} />} />
            </div>
          </div>
          <div style={{ padding: "18px 24px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Drafted by</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {Object.keys(stats.byMember).length ? Object.entries(stats.byMember).map(([mid, c]) => {
                const m = ChainsEngine.member(mid);
                return (
                  <div key={mid} onClick={() => onMember && onMember(mid)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px 5px 6px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-pill)", cursor: "pointer" }}>
                    <Avatar name={m.name} color={m.disc} size={22} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 12, color: "var(--text-strong)" }}>{m.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>×{c}</span>
                  </div>
                );
              }) : <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Not drafted yet this season.</span>}
            </div>
            {evs.length > 0 && <>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>Every time picked</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {evs.map((e, i) => {
                  const tour = TS.find((x) => x.t === e.t);
                  const m = ChainsEngine.member(e.member);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text-faint)", width: 28 }}>T{e.t}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tour ? tour.name : "Event " + e.t}</div>
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{m ? m.name + "'s pick" : ""}</div>
                      </div>
                      <ScoreValue value={e.score} size={16} />
                    </div>
                  );
                })}
              </div>
            </>}
          </div>
        </div>
      </div>
    );
  }

  function DStat({ label, value }) {
    return (
      <div style={{ background: "var(--pine-700)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color: "var(--bone-50)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 9, color: "var(--chain-400)", marginTop: 5 }}>{label}</div>
      </div>
    );
  }

  function TopTabs({ nav, view, onPick }) {
    const ref = React.useRef(null);
    const liveNow = (function () { try { const m = ChainsEngine.seasonMeta(); return !!(m && m.live); } catch (e) { return false; } })();
    const friendReqs = (function () { try { return ChainsFriends.requests().length + (window.ChainsChat ? ChainsChat.unread() : 0); } catch (e) { return 0; } })();
    // Keep the active pill in view by scrolling THIS strip only (never scrollIntoView,
    // which can yank the whole page).
    React.useEffect(() => {
      const c = ref.current; if (!c) return;
      const el = c.querySelector('[data-active="1"]');
      if (el) {
        const target = el.offsetLeft - (c.clientWidth - el.clientWidth) / 2;
        try { c.scrollTo({ left: Math.max(0, target), behavior: "smooth" }); } catch (e) { c.scrollLeft = Math.max(0, target); }
      }
    }, [view]);
    return (
      <div ref={ref} className="cw-hscroll" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "9px 12px", background: "var(--bg-ink-deep)", borderTop: "1px solid var(--border-ink)", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {nav.map((n) => {
          const active = view === n.id;
          const pulse = (n.id === "course" && liveNow) || (n.id === "friends" && friendReqs > 0);
          return (
            <button key={n.id} data-active={active ? "1" : "0"} onClick={() => onPick(n.id)}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 15px", borderRadius: "var(--radius-pill)", border: `1px solid ${active ? "transparent" : "var(--border-ink)"}`, background: active ? "var(--ace-500)" : "transparent", cursor: "pointer", transition: "background var(--dur-fast)" }}>
              <span style={{ position: "relative", width: 16, height: 16, color: active ? "#fff" : "var(--chain-400)", display: "inline-flex" }}>{n.icon}{pulse && <span className="cw-livedot" style={{ position: "absolute", top: -3, right: -4, width: 7, height: 7, borderRadius: "50%", background: active ? "#fff" : "var(--clay-500, #d2502f)" }} />}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 13, color: active ? "#fff" : "var(--chain-300)", whiteSpace: "nowrap" }}>{n.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- Bottom tab bar + More sheet (mobile primary nav) -------------- */
  // v505 phone-first: the front door is Go Throw. Fantasy screens live under More / Leagues.
  const PRIMARY_NAV_IDS = ["play", "courses", "playstart", "takeover"];
  const PRIMARY_TABS = [
    { id: "play", label: "Home", icon: <Icons.Home size={20} /> },
    { id: "courses", label: "Courses", icon: <Icons.Map size={20} /> },
    { id: "playstart", label: "Play", icon: <Icons.Disc size={22} />, accent: true },
    { id: "takeover", label: "Challenges", icon: <Icons.Flag size={20} /> },
  ];

  function BottomNav({ nav, view, onTab, onMore }) {
    const liveNow = (function () { try { const m = ChainsEngine.seasonMeta(); return !!(m && m.live); } catch (e) { return false; } })();
    const friendReqs = (function () { try { return ChainsFriends.requests().length + (window.ChainsChat ? ChainsChat.unread() : 0); } catch (e) { return 0; } })();
    const primary = PRIMARY_TABS;
    const moreActive = !PRIMARY_NAV_IDS.includes(view) && view !== "play";
    function Tab({ active, label, icon, pulse, onClick }) {
      return (
        <button onClick={onClick} aria-label={label} aria-current={active ? "page" : undefined}
          style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, minHeight: 54, padding: "7px 2px 0", border: "none", background: "transparent", cursor: "pointer", position: "relative", WebkitTapHighlightColor: "transparent" }}>
          {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 26, height: 3, borderRadius: "0 0 3px 3px", background: "var(--ace-500)" }} />}
          <span style={{ position: "relative", width: 23, height: 23, display: "inline-flex", alignItems: "center", justifyContent: "center", color: active ? "var(--ace-400)" : "var(--chain-400)", transition: "color var(--dur-fast), transform var(--dur-fast)", transform: active ? "translateY(-1px)" : "none" }}>
            {icon}
            {pulse && <span className="cw-livedot" style={{ position: "absolute", top: -2, right: -3, width: 8, height: 8, borderRadius: "50%", background: "var(--clay-500, #d2502f)", boxShadow: "0 0 0 2px var(--bg-ink-deep)" }} />}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 9.5, color: active ? "var(--bone-50)" : "var(--chain-500)", lineHeight: 1, whiteSpace: "nowrap" }}>{label}</span>
        </button>
      );
    }
    return (
      <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 85, display: "flex", alignItems: "stretch", background: "var(--bg-ink-deep)", borderTop: "1px solid var(--border-ink)", paddingBottom: "env(safe-area-inset-bottom, 0px)", boxShadow: "0 -6px 20px rgba(0,0,0,.18)" }}>
        {primary.map((n) => n.accent
          ? <button key={n.id} onClick={() => onTab(n.id)} aria-label="Start scoring" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", cursor: "pointer", padding: "4px 2px 0" }}><span style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(180deg, var(--ace-400), var(--ace-500))", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px -6px var(--ace-500)", marginTop: -14, border: "3px solid var(--bg-ink-deep)" }}>{n.icon}</span><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 9.5, color: "var(--chain-300)", marginTop: 2 }}>{n.label}</span></button>
          : <Tab key={n.id} active={view === n.id} label={n.label} icon={n.icon} pulse={n.id === "friends" && friendReqs > 0} onClick={() => onTab(n.id)} />)}
        <Tab active={moreActive} label="More" icon={<Icons.Grid size={18} />} onClick={onMore} />
      </nav>
    );
  }

  function MoreSheet({ open, onClose, nav, view, onPick }) {
    const [owner, setOwner] = React.useState(false);
    React.useEffect(() => {
      if (!open) return;
      let live = true;
      if (window.ChainsAdmin && ChainsAdmin.isOwner) ChainsAdmin.isOwner().then((v) => { if (live) setOwner(!!v); });
      return () => { live = false; };
    }, [open]);
    useEscToClose(open, onClose);
    if (!open) return null;
    const secondary = nav.filter((n) => !PRIMARY_NAV_IDS.includes(n.id) && n.id !== "play");
    const items = secondary.slice();
    // v492: Owner Console no longer reachable from the app
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(12,22,15,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", animation: "chains-fade .2s var(--ease-out) both" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--bg-page)", borderRadius: "20px 20px 0 0", padding: "10px 14px calc(18px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -10px 40px rgba(0,0,0,.3)", animation: "chains-slide-up .28s var(--ease-out) both", maxHeight: "82vh", overflowY: "auto" }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "var(--border-default)", margin: "4px auto 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 10px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>More</span>
            <button onClick={onClose} aria-label="Close" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", color: "var(--text-muted)", cursor: "pointer" }}><Icons.X size={16} /></button>
          </div>
          {["You", "Play", "Season 2026"].map((g) => { const gi = items.filter((n) => (n.group || "You") === g); if (!gi.length) return null; return (
            <div key={g} style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10.5, color: "var(--text-faint)", margin: "6px 4px 6px" }}>{g}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {gi.map((n) => {
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => onPick(n.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 9, padding: "14px", minHeight: 92, borderRadius: "var(--radius-md)", border: "1px solid " + (active ? "var(--ace-500)" : "var(--border-subtle)"), background: active ? "var(--ace-50, #fff3ec)" : "var(--bg-elevated)", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 24, height: 24, color: active ? "var(--ace-600, #d24f1a)" : "var(--fairway-600)", display: "inline-flex" }}>{n.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)", lineHeight: 1 }}>{n.label}</span>
                    <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 3, lineHeight: 1.3 }}>{n.id === "friends" && (function () { try { const k = ChainsFriends.requests().length; return k ? k + (k === 1 ? " request waiting" : " requests waiting") : null; } catch (e) {} return null; })() || n.desc}</span>
                  </span>
                </button>
              );
                })}
              </div>
            </div>); })}
          <button onClick={() => { onClose(); if (window.ChainsConfirm && window.ChainsAuth) ChainsConfirm.show({ title: "Sign out of Chains?", confirmLabel: "Sign out" }).then((ok) => { if (ok) ChainsAuth.signOut(); }); }} style={{ width: "100%", padding: "12px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" }}>Sign out</button>
        </div>
      </div>
    );
  }

  /* ---- Who are you? — first-open member gate ------------------------- */
  const GATE_PALETTE = ["#E0467C", "#FF5A1F", "#F2A900", "#2FB67A", "#2A9D8F", "#2A6FDB", "#7C5CFF", "#C2410C", "#0EA5A5", "#D4456B", "#5BA978", "#8B5CF6"];
  function gateIcons() {
    const out = [];
    ["a", "b", "c"].forEach((s) => { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) out.push("av-" + s + r + c + ".png"); });
    return out;
  }
  // write profile fields onto a member (same shape ProfileEditor uses). Upserts:
  // a brand-new account isn't in members() yet, so create the row instead of dropping
  // the write. Also persists avatar/color/texture to the account (users/{uid}) so it
  // belongs to the account and syncs across devices — same path as displayName/disc.
  // Save profile fields. Persists to the ACCOUNT (users/{uid}) always; only reflects
  // into the live Classic roster if this user is ALREADY a Classic member — a brand-new
  // / test account must NOT be injected into Classic's standings (that was the leak).
  function gatePatch(id, fields) {
    try { if (window.ChainsEngine && ChainsEngine.member && ChainsEngine.member(id)) ChainsEngine.upsertMember(id, fields); } catch (e) {}
    try { if (window.ChainsAuth && ChainsAuth.saveProfile) ChainsAuth.saveProfile(fields); } catch (e) {}
  }

  // Step 2 of the gate: set up your avatar (color + icon, or randomize).
  function AvatarSetup({ id, onDone, onBack }) {
    const [, force] = React.useState(0);
    const m = ChainsEngine.member(id) || { id: id, name: ((window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()) || {}).username || id, disc: "#2A6FDB" };
    const ICONS = gateIcons();
    const set = (f) => { gatePatch(id, f); force((x) => x + 1); };
    const randomize = () => {
      const col = GATE_PALETTE[Math.floor(Math.random() * GATE_PALETTE.length)];
      const ic = ICONS[Math.floor(Math.random() * ICONS.length)];
      set({ disc: col, avatarIcon: ic });
      if (window.ChainsTheme) { const ts = window.ChainsTheme.THEMES; window.ChainsTheme.set(ts[Math.floor(Math.random() * ts.length)].id); }
    };
    const Preview = () => (
      m.avatarIcon
        ? <span style={{ display: "inline-flex", width: 84, height: 84, borderRadius: "50%", overflow: "hidden", boxShadow: "inset 0 0 0 3px rgba(255,255,255,.25)" }}><img src={window.ChainsAssets ? ChainsAssets.avatar(m.avatarIcon) : ((window.CHAINS_AVATARS && window.CHAINS_AVATARS[m.avatarIcon]) || ("avatars/" + m.avatarIcon))} alt="" onError={window.ChainsAssets ? ChainsAssets.onErr("avatars", m.avatarIcon) : undefined} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
        : <Avatar name={m.name} color={m.disc} size={84} />
    );
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(120% 90% at 50% -10%, var(--pine-800) 0%, var(--bg-ink-deep) 55%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center", animation: "chains-rise .45s var(--ease-out, cubic-bezier(.22,1,.36,1)) both" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Preview /></div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, color: "var(--bone-50)", lineHeight: 1 }}>Hey, {m.name}</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--chain-300)", margin: "8px auto 0", maxWidth: 300, lineHeight: 1.5 }}>Make it yours — pick a theme, color and icon. You can change these anytime in Settings.</div>

          <button onClick={randomize}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, margin: "16px auto 4px", padding: "9px 16px", background: "var(--ace-500)", border: "none", borderRadius: "var(--radius-pill)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "#fff" }}>
            <span style={{ width: 15, height: 15, display: "inline-flex" }}><Icons.Refresh size={15} /></span> Surprise me
          </button>

          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10.5, color: "var(--chain-500)", margin: "18px 0 9px" }}>Theme</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {(window.ChainsTheme ? window.ChainsTheme.THEMES : []).map((th) => {
              const on = (window.ChainsTheme && window.ChainsTheme.current()) === th.id;
              return <button key={th.id} onClick={() => { window.ChainsTheme.set(th.id); force((x) => x + 1); }} title={th.label}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                <span style={{ display: "flex", width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: on ? "3px solid var(--bone-50)" : "2px solid var(--border-ink)", boxShadow: on ? "0 0 0 2px var(--bg-ink-deep)" : "none" }}>
                  {th.swatch.map((c, i) => <span key={i} style={{ flex: 1, background: c }} />)}
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 9, color: on ? "var(--bone-50)" : "var(--chain-500)" }}>{th.label}</span>
              </button>;
            })}
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10.5, color: "var(--chain-500)", margin: "18px 0 9px" }}>Color</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
            {GATE_PALETTE.map((c) => {
              const on = (m.disc || "").toLowerCase() === c.toLowerCase();
              return <button key={c} onClick={() => set({ disc: c })} title={c}
                style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: on ? "3px solid var(--bone-50)" : "2px solid var(--border-ink)", cursor: "pointer", padding: 0, boxShadow: on ? "0 0 0 2px var(--bg-ink-deep)" : "none" }} />;
            })}
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 10.5, color: "var(--chain-500)", margin: "18px 0 9px" }}>Icon</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(46px, 1fr))", gap: 7, maxHeight: 220, overflowY: "auto", padding: 2 }}>
            <button onClick={() => set({ avatarIcon: null })} title="No icon"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", aspectRatio: "1", borderRadius: "50%", background: "var(--bg-ink)", border: !m.avatarIcon ? "3px solid var(--bone-50)" : "1px solid var(--border-ink)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, color: "var(--chain-400)" }}>OFF</button>
            {ICONS.map((ic) => {
              const on = m.avatarIcon === ic;
              return <button key={ic} onClick={() => set({ avatarIcon: ic })}
                style={{ padding: 0, aspectRatio: "1", borderRadius: "50%", overflow: "hidden", background: "var(--bg-ink)", border: on ? "3px solid var(--ace-500)" : "1px solid var(--border-ink)", cursor: "pointer" }}>
                <img src={window.ChainsAssets ? ChainsAssets.avatar(ic) : ((window.CHAINS_AVATARS && window.CHAINS_AVATARS[ic]) || ("avatars/" + ic))} alt="" loading="lazy" onError={window.ChainsAssets ? ChainsAssets.onErr("avatars", ic) : undefined} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </button>;
            })}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button onClick={onBack}
              style={{ flex: "0 0 auto", padding: "13px 18px", background: "transparent", border: "1px solid var(--border-ink)", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, color: "var(--chain-400)" }}>Back</button>
            <button onClick={onDone}
              style={{ flex: 1, padding: "13px 18px", background: "var(--fairway-600)", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 14, color: "#fff" }}>Enter Chains</button>
          </div>
        </div>
      </div>
    );
  }

  function WelcomeGate({ onPick }) {
    const members = ChainsEngine.members();
    const standings = ChainsEngine.standings();
    const rankOf = {}; standings.forEach((s, i) => { rankOf[s.id] = { rank: i + 1, points: s.points }; });
    const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
    const [how, setHow] = React.useState(false);
    const [claiming, setClaiming] = React.useState(null); // member id mid-setup
    const meta = ChainsEngine.seasonMeta();
    const upcoming = meta.live || meta.next;

    if (claiming) {
      return <AvatarSetup id={claiming} onBack={() => setClaiming(null)} onDone={() => { try { localStorage.setItem("chains_setup_" + claiming, "1"); } catch (e) {} onPick(claiming); }} />;
    }
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(120% 90% at 50% -10%, var(--pine-800) 0%, var(--bg-ink-deep) 55%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <div style={{ width: "100%", maxWidth: 440, textAlign: "center", animation: "chains-rise .5s var(--ease-out, cubic-bezier(.22,1,.36,1)) both" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Mark size={58} /></div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 34, color: "var(--bone-50)", lineHeight: 0.95, letterSpacing: "-.01em" }}>Chains</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".2em", fontSize: 10, color: "var(--ace-400)", marginTop: 5, marginBottom: 22 }}>Disc golf, with your crew</div>
          {upcoming && <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-ink)", border: "1px solid var(--border-ink)", marginBottom: 22 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--ace-500)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: "var(--chain-300)" }}>Up next · {upcoming.name}</span>
          </div>}

          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--chain-500)", marginBottom: 12 }}>Tap your name to jump in</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {members.map((m, i) => {
              const r = rankOf[m.id];
              return (
                <button key={m.id} onClick={() => { try { if (localStorage.getItem("chains_setup_" + m.id) === "1" || m.avatarIcon) { onPick(m.id); return; } } catch (e) {} setClaiming(m.id); }}
                  style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", background: "var(--bg-ink)", border: "1px solid var(--border-ink)", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", animation: "chains-rise .45s var(--ease-out, cubic-bezier(.22,1,.36,1)) both", animationDelay: (0.06 + i * 0.04) + "s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.disc; e.currentTarget.style.background = "var(--pine-800)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-ink)"; e.currentTarget.style.background = "var(--bg-ink)"; }}>
                  <Avatar name={m.name} color={m.disc} size={34} ring={r && r.rank === 1} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--bone-50)", lineHeight: 1 }}>{m.name}</div>
                    {r && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: r.rank === 1 ? "var(--gold-500)" : "var(--chain-400)", marginTop: 3 }}>{ord(r.rank)} · {r.points} pts</div>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional, collapsed-by-default "how it works" — never forced */}
          <button onClick={() => setHow((v) => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "20px auto 0", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)" }}>
            New here? How Chains works
            <span style={{ width: 14, height: 14, display: "inline-flex", transform: how ? "rotate(180deg)" : "none", transition: "transform var(--dur-fast)" }}><Icons.ChevDown size={14} /></span>
          </button>
          {how && (
            <div style={{ textAlign: "left", maxWidth: 360, margin: "10px auto 0", padding: "14px 16px", background: "var(--bg-ink)", border: "1px solid var(--border-ink)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 9, animation: "chains-fade .26s var(--ease-out) both" }}>
              {[
                ["Draft two pros", "Before each event you pick two MPO pros. Last place picks first."],
                ["Follow it live", "This Week and the Dashboard update round by round once the tournament starts."],
              ].map(([t, d], i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--pine-700)", color: "var(--ace-400)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 12, color: "var(--bone-50)" }}>{t}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--chain-400)", marginTop: 1, lineHeight: 1.45 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--chain-600)", marginTop: 18 }}>Switch anytime from the badge at the bottom of the menu.</div>
        </div>
      </div>
    );
  }

  /* ---- Sync status pill + identity badge ------------------------------ */
  function SyncPill({ dark }) {
    const [, tick] = React.useState(0);
    React.useEffect(() => {
      const fn = () => tick((x) => x + 1);
      window.addEventListener("chains:sync-status", fn);
      return () => window.removeEventListener("chains:sync-status", fn);
    }, []);
    const s = ChainsSync.state();
    let dot = "var(--ace-500)", label = "Connecting…";
    if (s.busy) { dot = "var(--ace-500)"; label = "Syncing…"; }
    else if (s.error) { dot = "#E0467C"; label = "Offline · tap to retry"; }
    else if (s.connected) { dot = "var(--fairway-500, #2FB67A)"; label = "Live · synced"; }
    return (
      <button onClick={() => ChainsSync.pull()} title={s.error || (s.lastSync ? "Last synced " + new Date(s.lastSync).toLocaleTimeString() : label)}
        style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", background: "transparent", border: "none", cursor: "pointer" }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: dot, flexShrink: 0 }} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", fontSize: 10, color: dark ? "var(--chain-400)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{label}</span>
      </button>
    );
  }

  function NotifBell({ dark, onGo }) {
    const [, tick] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const btnRef = React.useRef(null);
    const [pos, setPos] = React.useState(null);
    React.useEffect(() => {
      if (!window.ChainsNotify) return;
      const un = ChainsNotify.subscribe(() => tick((x) => x + 1));
      const id = () => tick((x) => x + 1);
      window.addEventListener("chains:identity", id);
      return () => { un(); window.removeEventListener("chains:identity", id); };
    }, []);
    // Esc closes the popover (tap-outside + Esc, per overlay rules).
    React.useEffect(() => {
      if (!open) return;
      const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open]);
    // Anchor the popover to the bell, then render it in a body PORTAL so no
    // ancestor stacking context (sticky header / sidebar) can trap it beneath
    // the page content. Right-aligned to the bell; opens up (sidebar) or down (header).
    function toggleMenu() {
      if (!open && btnRef.current) {
        const r = btnRef.current.getBoundingClientRect();
        const W = 300;
        // sidebar bell sits on the left → align left edge to it; header bell sits on
        // the right → align right edge to it. Then clamp fully inside the viewport.
        let left = dark ? r.left : (r.right - W);
        left = Math.min(Math.max(8, left), window.innerWidth - W - 8);
        setPos({ left: Math.round(left), top: dark ? null : Math.round(r.bottom + 8), bottom: dark ? Math.round(window.innerHeight - r.top + 8) : null });
      }
      setOpen((o) => !o);
    }
    if (!window.ChainsNotify || !(window.ChainsID && ChainsID.whoami())) return null;
    const list = ChainsNotify.mine();
    const unread = ChainsNotify.unreadCount();
    const myId = ChainsID.whoami();
    const rel = (iso) => { if (!iso) return ""; const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return "just now"; if (s < 3600) return Math.round(s / 60) + "m ago"; if (s < 86400) return Math.round(s / 3600) + "h ago"; return Math.round(s / 86400) + "d ago"; };
    return (
      <div style={{ position: "relative" }}>
        <button ref={btnRef} onClick={toggleMenu} title="Notifications" aria-label="Notifications"
          style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", border: "1px solid " + (dark ? "var(--border-ink)" : "var(--border-default)"), background: "transparent", cursor: "pointer", color: dark ? "var(--chain-300)" : "var(--text-muted)" }}>
          <span style={{ width: 17, height: 17, display: "inline-flex" }}><Icons.Bell size={17} /></span>
          {unread > 0 && <span style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 99, background: "var(--ace-500)", color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 9.5, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px " + (dark ? "var(--bg-ink-deep)" : "var(--bg-page)") }}>{unread}</span>}
        </button>
        {open && pos && ReactDOM.createPortal(
          <React.Fragment>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000 }} />
            <div role="menu" style={{ position: "fixed", left: pos.left, top: pos.top != null ? pos.top : "auto", bottom: pos.bottom != null ? pos.bottom : "auto", zIndex: 1001, width: 300, maxWidth: "calc(100vw - 16px)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", overflow: "hidden", animation: "chains-fade .16s var(--ease-out, ease) both" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 12, color: "var(--text-strong)" }}>Notifications</span>
                {list.length > 0 && <button onClick={() => { ChainsNotify.clearAll(); }} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 10.5, color: "var(--ace-600, #d24f1a)" }}>Clear all</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {list.length === 0 ? (
                  <div style={{ padding: "22px 14px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" }}>You're all caught up.</div>
                ) : list.map((n) => {
                  const read = n.read_by && n.read_by[myId];
                  return (
                    <button key={n.id} onClick={() => { ChainsNotify.markRead(n.id); setOpen(false); if (n.link && onGo) onGo(n.link, n.t); }}
                      style={{ display: "flex", gap: 10, width: "100%", textAlign: "left", padding: "11px 14px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: read ? "transparent" : "var(--ace-50, #fff3ec)", cursor: "pointer" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, flexShrink: 0, marginTop: 5, background: read ? "transparent" : "var(--ace-500)" }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)" }}>{n.title}</span>
                        <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1, lineHeight: 1.4 }}>{n.body}</span>
                        <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--text-faint)", marginTop: 3 }}>{rel(n.created_at)}</span>
                      </span>
                      <span onClick={(e) => { e.stopPropagation(); ChainsNotify.dismiss(n.id); }} role="button" aria-label="Dismiss" title="Dismiss" style={{ flexShrink: 0, width: 22, height: 22, alignSelf: "center", borderRadius: "50%", color: "var(--text-faint)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.X size={13} /></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </React.Fragment>,
          document.body
        )}
      </div>
    );
  }

  function WhoBadge({ dark, compact }) {
    const [, tick] = React.useState(0);
    React.useEffect(() => {
      const fn = () => tick((x) => x + 1);
      window.addEventListener("chains:identity", fn);
      window.addEventListener("chains:friends", fn); // v513: re-render when a profile photo lands
      return () => { window.removeEventListener("chains:identity", fn); window.removeEventListener("chains:friends", fn); };
    }, []);
    const id = ChainsID.whoami();
    if (!id) return null;
    const m = ChainsEngine.member(id) || (function () { var p = (window.ChainsAuth && ChainsAuth.localProfile && window.ChainsAuth.current()) ? ChainsAuth.localProfile(ChainsAuth.current().uid) : null; return { name: (p && p.displayName) || id, disc: (p && p.disc) || "#5BA978" }; })();
    const authed = !!(window.ChainsAuth && ChainsAuth.available && ChainsAuth.available());
    return (
      <button onClick={() => { if (authed) { ChainsConfirm.show({ title: "Sign out of Chains?", confirmLabel: "Sign out" }).then((ok) => { if (ok) ChainsAuth.signOut(); }); } else { ChainsConfirm.show({ title: "Switch member on this device?", confirmLabel: "Switch" }).then((ok) => { if (ok) ChainsID.reset(); }); } }}
        title={authed ? "Tap to sign out" : "Tap to switch member"}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: compact ? "4px 8px" : "6px 10px", background: "transparent", border: "1px solid " + (dark ? "var(--border-ink)" : "var(--border-subtle)"), borderRadius: "var(--radius-pill)", cursor: "pointer" }}>
        <Avatar name={m.name} color={m.disc} size={compact ? 18 : 22} />
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: compact ? 11 : 12, color: dark ? "var(--bone-50)" : "var(--text-strong)" }}>
          {m.name}
        </span>
        {window.ChainsAuth && ChainsAuth.coins && false ? (
          <span title="Your balance — play money" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: compact ? "2px 7px" : "3px 9px", borderRadius: "var(--radius-pill)", background: dark ? "rgba(247,201,72,.16)" : "var(--gold-50, #fbf6e9)", border: "1px solid " + (dark ? "rgba(247,201,72,.35)" : "var(--gold-300, #e6cf86)") }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: compact ? 11 : 12.5, color: dark ? "var(--gold-300, #f3d27a)" : "var(--gold-700, #9a7209)" }}>${ChainsAuth.coins()}</span>
          </span>
        ) : null}
      </button>
    );
  }

  function SubTabs({ items, value, onChange }) {
    return (
      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "2px 0 16px", WebkitOverflowScrolling: "touch" }}>
        {items.map((it) => {
          const active = it.id === value;
          const tint = it.tint || (it.pop ? "var(--ace-500)" : null);
          return (
            <button key={it.id} onClick={() => onChange(it.id)}
              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 16px", borderRadius: "var(--radius-pill)", border: `1px solid ${active ? "transparent" : (tint || "var(--border-default)")}`, background: active ? (tint || "var(--pine-800)") : "var(--bg-elevated)", color: active ? "#fff" : (tint || "var(--text-muted)"), cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 12.5 }}>
              {it.icon && <span style={{ width: 15, height: 15, display: "inline-flex" }}>{it.icon}</span>}
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }
  window.SubTabs = SubTabs;

  function PicksHub({ initialT, onPlayer }) {
    const [tab, setTab] = React.useState("picks");
    return (
      <div>
        <SubTabs value={tab} onChange={setTab} items={[
          { id: "picks", label: "The Picks", icon: <Icons.Disc size={15} />, tint: "var(--fairway-600)" },
          { id: "field", label: "Registered", icon: <Icons.Users size={15} />, tint: "var(--sky-600, #2e6fa8)" },
          { id: "browse", label: "Pros & Tournaments", icon: <Icons.Search size={15} />, tint: "var(--chain-600)" },
        ]} />
        {tab === "picks" ? <PicksView key={initialT} initialT={initialT} />
          : tab === "field" ? <PlayersView onPlayer={onPlayer} />
          : <ExploreView />}
      </div>
    );
  }

  function WelcomePop() {
    const me = window.ChainsID && ChainsID.whoami();
    const [show, setShow] = React.useState(false);
    const [data, setData] = React.useState(null);
    React.useEffect(() => {
      if (!me) return;
      const st = ChainsEngine.standings();
      const idx = st.findIndex((s) => s.id === me);
      if (idx < 0) return;
      const row = st[idx];
      const rank = idx + 1;
      // re-show only when the standings picture changes (rank+points+played)
      const sig = me + ":" + rank + ":" + row.points + ":" + (row.played || 0);
      try { if (sessionStorage.getItem("chains_welcome_sig") === sig) return; } catch (e) {}
      try { sessionStorage.setItem("chains_welcome_sig", sig); } catch (e) {}
      setData({ rank, row, total: st.length, m: ChainsEngine.member(me) });
      setShow(true);
      const tmr = setTimeout(() => setShow(false), 5200);
      return () => clearTimeout(tmr);
    }, []);
    useEscToClose(show, () => setShow(false));
    if (!show || !data) return null;
    const { rank, row, total, m } = data;
    const ord = (n) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n] || "th");
    const first = rank === 1, podium = rank <= 3, last = rank === total;
    const accent = first ? "var(--gold-500)" : podium ? "var(--ace-500)" : last ? "var(--clay-600, #b4452f)" : "var(--fairway-600)";
    const headline = first ? "You're on top \uD83D\uDC51" : rank === 2 ? "Right in the hunt" : podium ? "On the podium" : last ? "Someone's gotta be last \uD83D\uDE05" : "Here's where you stand";
    const sub = first ? "Leading the league — don't let up." : last ? "Plenty of season left to climb." : "Keep climbing.";
    return (
      <div onClick={() => setShow(false)} style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,22,15,0.55)", backdropFilter: "blur(4px)", animation: "chains-fade .25s var(--ease-out, ease) both", padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: 340, maxWidth: "90vw", background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", overflow: "hidden", animation: "chains-pop .5s var(--ease-out, cubic-bezier(.22,1,.36,1)) both", textAlign: "center" }}>
          <div style={{ height: 6, background: accent }} />
          {first && <div className="cw-shine" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)", backgroundSize: "250% 100%" }} />}
          <div style={{ padding: "26px 24px 24px" }}>
            <div style={{ position: "relative", display: "inline-flex", marginBottom: 14 }}>
              <span style={{ animation: first ? "chains-bounce 1.1s var(--ease-out) both" : "none", display: "inline-flex" }}>
                <Avatar name={m.name} color={m.disc} size={72} ring={podium} />
              </span>
              <span style={{ position: "absolute", bottom: -6, right: -8, minWidth: 30, height: 30, padding: "0 7px", borderRadius: 99, background: accent, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px var(--bg-elevated)" }}>{ord(rank)}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)", lineHeight: 1 }}>{headline}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-muted)", marginTop: 7 }}>Hey {m.name} — you're <b style={{ color: accent }}>{ord(rank)} of {total}</b> with <b>{row.points} pts</b>. {sub}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 16 }}>
              <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>{row.wins || 0}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>Wins</div></div>
              <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>{row.top3 || 0}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>Top 3s</div></div>
              <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>{row.played || 0}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>Played</div></div>
            </div>
            <button onClick={() => setShow(false)} style={{ marginTop: 18, width: "100%", padding: "11px", border: "none", borderRadius: "var(--radius-md)", background: accent, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, cursor: "pointer" }}>Let's go</button>
          </div>
        </div>
      </div>
    );
  }

  function StandingsHub({ onMember, onGoPicks, onEvent }) {
    const [tab, setTab] = React.useState("standings");
    return (
      <div>
        <SubTabs value={tab} onChange={setTab} items={[
          { id: "standings", label: "Standings", icon: <Icons.List size={15} />, tint: "var(--fairway-600)" },
          { id: "stats", label: "Stats", icon: <Icons.Medal size={15} />, tint: "var(--gold-600, #b8860b)" },
          { id: "schedule", label: "Schedule", icon: <Icons.Calendar size={15} />, tint: "var(--sky-600, #2e6fa8)" },
          { id: "history", label: "History", icon: <Icons.Pin size={15} />, tint: "var(--chain-600)" },
        ]} />
        {tab === "standings" ? <StandingsView onMember={onMember} /> : tab === "stats" ? <StatsView /> : tab === "history" ? <HistoryView /> : <TournamentsView onGoPicks={onGoPicks} onEvent={onEvent} />}
      </div>
    );
  }

  // Persistent League bar — shows the active league on every tab and doubles as
  // the "My Leagues" switcher. Reuses the chains_active_league id + ChainsActive.
  function LeagueBar() {
    const [, tick] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
      const fn = () => tick((x) => x + 1);
      window.addEventListener("chains:remote-update", fn);
      return () => window.removeEventListener("chains:remote-update", fn);
    }, []);
    const activeId = (() => { try { return localStorage.getItem("chains_active_league") || "classic"; } catch (e) { return "classic"; } })();
    const tests = (window.ChainsTestData ? ChainsTestData.loadTest() : []) || [];
    const showS = (function () { try { return localStorage.getItem("chains_show_samples") === "1"; } catch (e) { return false; } })();
    const seasonLive = (function () { try { const m = ChainsEngine.seasonMeta(); return !!(m && m.live); } catch (e) { return false; } })();
    const leagues = [{ id: "classic", name: "Chains", live: seasonLive }].concat(tests.filter(function (l) { return !/probe/i.test(l.name || "") && (l.created || (l.demo && showS)); }).map((l) => ({ id: l.id, name: l.name })));
    const active = leagues.find((l) => l.id === activeId) || leagues[0];
    const pick = (id) => {
      try { localStorage.setItem("chains_active_league", id); } catch (e) {}
      setOpen(false);
      try { window.dispatchEvent(new Event("chains:remote-update")); } catch (e) {}
      tick((x) => x + 1);
    };
    useEscToClose(open, () => setOpen(false));
    return (
      <div style={{ position: "relative", marginBottom: 18 }}>
        <button onClick={() => setOpen((o) => !o)}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "11px 14px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", cursor: "pointer", textAlign: "left", boxShadow: "var(--shadow-xs)" }}>
          <span style={{ width: 30, height: 30, flexShrink: 0, borderRadius: "var(--radius-sm)", background: "var(--bg-ink)", color: "var(--ace-400)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icons.Target size={16} /></span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 9.5, color: "var(--text-faint)" }}>League</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{active.name}</span>
              {active.live && <Badge tone="live" emphasis="solid">Live</Badge>}
            </span>
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            My Leagues <span style={{ width: 16, height: 16, display: "inline-flex", transform: open ? "rotate(180deg)" : "none", transition: "transform var(--dur-fast)" }}><Icons.ChevDown size={16} /></span>
          </span>
        </button>
        {open && (
          <React.Fragment>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000 }} />
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 1001, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
              <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--border-subtle)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 10.5, color: "var(--text-muted)" }}>Your leagues</div>
              {leagues.map((l) => {
                const on = l.id === activeId;
                return (
                  <button key={l.id} onClick={() => pick(l.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 14px", border: "none", borderTop: "1px solid var(--border-subtle)", background: on ? "var(--bg-sunken)" : "transparent", cursor: "pointer" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</span>
                    {l.live && <Badge tone="fairway">Live</Badge>}
                    {on && <span style={{ width: 16, height: 16, color: "var(--fairway-600)", flexShrink: 0 }}><Icons.Check size={16} /></span>}
                  </button>
                );
              })}
              <div style={{ display: "flex", borderTop: "2px solid var(--border-default)" }}>
                <button onClick={() => { setOpen(false); try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "friends" })); } catch (e) {} }}
                  style={{ flex: 1, padding: "11px 14px", border: "none", borderRight: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--text-strong)" }}>Friends</button>
                <button onClick={() => { setOpen(false); try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "myleagues" })); } catch (e) {} }}
                  style={{ flex: 1, padding: "11px 14px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11.5, color: "var(--fairway-600)" }}>Leagues</button>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }

  function AdminMount({ onExit }) {
    const [ok, setOk] = React.useState(null); // null=checking, false=denied, true=owner
    React.useEffect(() => {
      let live = true;
      if (window.ChainsAdmin && ChainsAdmin.isOwner) {
        ChainsAdmin.isOwner().then((v) => { if (live) setOk(!!v); });
      } else setOk(false);
      return () => { live = false; };
    }, []);
    if (ok === null) return <div style={{ padding: 40, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Checking access…</div>;
    if (!ok) return (
      <div style={{ padding: 48, textAlign: "center", fontFamily: "var(--font-sans)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)" }}>Not authorized</div>
        <div style={{ color: "var(--text-muted)", marginTop: 8 }}>This area is owner-only.</div>
        <button onClick={onExit} style={{ marginTop: 18, height: 40, padding: "0 18px", border: "1px solid var(--border-default)", borderRadius: 8, background: "transparent", color: "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13 }}>Back to app</button>
      </div>
    );
    if (!window.AdminConsole) return <div style={{ padding: 40, color: "var(--text-muted)" }}>Admin module unavailable.</div>;
    return React.createElement(window.AdminConsole, { onExit });
  }

  function ChainsApp() {
    const validViews = ["dashboard", "thisweek", "picks", "standings", "stats", "players", "course", "play", "bag", "highlights", "settings", "createleague", "myleagues", "friends", "takeover"];
    const hashView = (location.hash || "").replace("#", "");
    const [view, setView] = React.useState((/watch=/.test(location.hash || "") || localStorage.getItem("chains_pending_course")) ? "play" : (validViews.includes(hashView) ? hashView : ((typeof window !== "undefined" && window.innerWidth < 760) ? "play" : "dashboard")));
    const [picksT, setPicksT] = React.useState(null);
    const [drawer, setDrawer] = React.useState(null);
    const [eventT, setEventT] = React.useState(null);
    const [playerName, setPlayerName] = React.useState(null);
    const [moreOpen, setMoreOpen] = React.useState(false);
    const [navDir, setNavDir] = React.useState(null);
    const { mobile } = useViewport();

    React.useEffect(() => { try { location.hash = view; } catch (e) {} }, [view]);
    React.useEffect(() => { window.scrollTo(0, 0); }, [view]);

    // Re-render when the sync layer applies remote league data.
    const [, syncTick] = React.useState(0);
    React.useEffect(() => {
      const fn = () => syncTick((x) => x + 1);
      window.addEventListener("chains:remote-update", fn);
      return () => window.removeEventListener("chains:remote-update", fn);
    }, []);

    function goPicks(t) { setNavDir(null); setPicksT(t || null); setView("picks"); }

    // Primary-tab navigation that knows swipe direction (mobile slide transition).
    function navTo(id, dir) { setNavDir(dir || null); setView(id); }
    function swipeTo(delta) {
      const ids = nav.map((n) => n.id);
      const idx = ids.indexOf(view);
      if (idx < 0) return;
      const ni = idx + delta;
      if (ni < 0 || ni >= ids.length) return;
      navTo(ids[ni], delta > 0 ? "l" : "r");
    }
    const touch = React.useRef(null);
    function onTouchStart(e) {
      if (!e.touches || e.touches.length !== 1) { touch.current = null; return; }
      // Bail if the gesture starts inside a horizontal scroller (sub-tabs, tables,
      // the field grid) so swipe-to-navigate never fights content scrolling.
      let el = e.target;
      while (el && el !== e.currentTarget) {
        try {
          const ov = getComputedStyle(el).overflowX;
          if ((ov === "auto" || ov === "scroll") && el.scrollWidth > el.clientWidth + 4) { touch.current = null; return; }
        } catch (err) {}
        el = el.parentElement;
      }
      const t = e.touches[0];
      touch.current = { x: t.clientX, y: t.clientY, at: Date.now() };
    }
    function onTouchEnd(e) {
      const s = touch.current; touch.current = null;
      if (!s || !e.changedTouches || !e.changedTouches.length) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (Date.now() - s.at > 600) return;          // too slow = not a flick
      if (Math.abs(dx) < 56) return;                 // too short
      if (Math.abs(dx) < Math.abs(dy) * 1.7) return; // mostly vertical = a scroll
      swipeTo(dx < 0 ? 1 : -1);                       // swipe left → next tab
    }

    React.useEffect(() => {
      const nav = (e) => { const v = e && e.detail; if (v && validViews.includes(v)) setView(v); };
      window.addEventListener("chains:navigate", nav);
      return () => window.removeEventListener("chains:navigate", nav);
    }, []);

    // Identity gate: every device picks a member before entering.
    const [, idTick] = React.useState(0);
    React.useEffect(() => {
      const fn = () => idTick((x) => x + 1);
      window.addEventListener("chains:identity", fn);
      return () => window.removeEventListener("chains:identity", fn);
    }, []);
    // Owner gate for the Admin/Console nav item (owner-only, on phone + desktop).
    const [isOwner, setIsOwner] = React.useState(false);
    React.useEffect(() => {
      let live = true;
      if (window.ChainsAdmin && ChainsAdmin.isOwner) ChainsAdmin.isOwner().then((v) => { if (live) setIsOwner(!!v); });
      const fn = () => { if (window.ChainsAdmin && ChainsAdmin.isOwner) ChainsAdmin.isOwner().then((v) => { if (live) setIsOwner(!!v); }); };
      window.addEventListener("chains:identity", fn);
      return () => { live = false; window.removeEventListener("chains:identity", fn); };
    }, []);

    // League isolation: fantasy screens are member-only. Anonymous name-pick and
    // the six known members see Chains (interim rule); other accounts get the
    // empty state until profile.leagues says otherwise.
    const [leagueOk, setLeagueOk] = React.useState(true);
    React.useEffect(() => {
      let live = true;
      const compute = () => { try { const a = (window.ChainsAuth && ChainsAuth.leagueAccess) ? ChainsAuth.leagueAccess() : "member"; if (live) setLeagueOk(a !== "none"); } catch (e) {} };
      compute();
      ["chains:identity", "chains:profile"].forEach((ev) => window.addEventListener(ev, compute));
      return () => { live = false; ["chains:identity", "chains:profile"].forEach((ev) => window.removeEventListener(ev, compute)); };
    }, []);

    // v466 hook-order fix: this gate now runs AFTER every hook above (it used to
    // sit between the identity-gate hooks and the isOwner/leagueOk hooks). Signed
    // -out ChainsApp used to call 4 fewer hooks than signed-in, tripping React's
    // "Rendered fewer hooks than expected" invariant and hard-crashing the app on
    // every sign-out. Pure reorder — no auth/session logic changed.
    if (!ChainsID.whoami() && !(window.ChainsAuth && ChainsAuth.available && ChainsAuth.available())) {
      return <WelcomeGate onPick={(id) => ChainsID.setWhoami(id)} />;
    }

    const navAll = [
      { id: "dashboard", group: "Season 2026", label: "Dashboard", short: "Home", desc: "Who won, at a glance", icon: <Icons.Target size={18} /> },
      { id: "picks", group: "Season 2026", label: "The Picks", short: "Picks", desc: "Every event's picks", icon: <Icons.Disc size={18} /> },
      { id: "standings", group: "Season 2026", label: "Standings", short: "Ranks", desc: "Final points & stats", icon: <Icons.List size={18} /> },
      { id: "course", group: "Season 2026", label: "Live Chains", short: "Live", desc: "Back for the 2027 season", icon: <Icons.Pin size={18} /> },
      { id: "play", label: "Go Throw", short: "Throw", desc: "Score your own rounds", icon: <Icons.Disc size={18} /> },
      { id: "bag", group: "You", label: "Bag", short: "Bag", desc: "What you're throwing", icon: <Icons.Backpack size={18} /> },
      { id: "friends", group: "You", label: "Friends & messages", short: "Friends", desc: "Requests, codes, chat", icon: <Icons.Users size={18} /> },
      { id: "myleagues", group: "Play", label: "Leagues", short: "Leagues", desc: "Course leagues · season 2026", icon: <Icons.Trophy size={18} /> },
      { id: "takeover", label: "Challenges", short: "Challenges", desc: "This week's challenges · scoreboard", icon: <Icons.Flag size={18} /> },
      { id: "highlights", group: "Play", label: "Watch", short: "Watch", desc: "Videos & highlights", icon: <Icons.Tv size={18} /> },
      { id: "settings", group: "You", label: "Profile & settings", short: "Settings", desc: "Photo, account, theme", icon: <Icons.User size={18} /> },
    ]; // v492: Owner Console removed from the shipped app (admin tooling lives outside the client)
    const nav = leagueOk ? navAll : navAll.filter((n) => ["play", "bag", "friends", "myleagues", "takeover", "highlights", "settings"].includes(n.id));
    const LEAGUE_VIEWS = ["dashboard", "thisweek", "picks", "standings", "stats", "players", "course"];
    const gated = !leagueOk && LEAGUE_VIEWS.includes(view);

    const content = (
      <div key={view} className="chains-view" style={navDir ? { animation: (navDir === "l" ? "chains-swin-l" : "chains-swin-r") + " .3s var(--ease-out, cubic-bezier(.22,1,.36,1)) both" } : undefined}>
        {gated && (window.NoLeagueView ? React.createElement(window.NoLeagueView, { mobile: mobile }) : <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-sans)", color: "var(--text-muted)" }}>You're not in a league yet.</div>)}
        {!gated && view === "dashboard" && <DashboardView onGoPicks={() => goPicks()} onGoStandings={() => setView("standings")} onMember={setDrawer} onEvent={setEventT} />}
        {!gated && view === "thisweek" && <CourseView />}
        {!gated && view === "picks" && <PicksHub initialT={picksT} onPlayer={setPlayerName} />}
        {!gated && view === "standings" && <StandingsHub onMember={setDrawer} onGoPicks={goPicks} onEvent={setEventT} />}
        {!gated && view === "stats" && <StandingsHub onMember={setDrawer} onGoPicks={goPicks} onEvent={setEventT} />}
        {!gated && view === "players" && <PicksHub initialT={picksT} onPlayer={setPlayerName} />}
        {!gated && view === "course" && (() => { let live = false, done = false; try { const m = ChainsEngine.seasonMeta(); live = !!(m && m.live); done = !!(m && m.total && m.completed >= m.total); } catch (e) {} return !live ? (
          <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: "var(--radius-lg)", background: "radial-gradient(120% 140% at 0% 0%, var(--pine-700) 0%, var(--bg-ink-deep) 70%)", color: "var(--bone-50)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 18, lineHeight: 1.05 }}>Between seasons</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--chain-400)", marginTop: 5, lineHeight: 1.45 }}>{done ? "The 2026 season is done. " : ""}Live Chains comes back when the 2027 DGPT season starts in the spring. Below is the last event as it finished.</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{[["standings", "Final standings"], ["dashboard", "Dashboard"], ["myleagues", "Course leagues"]].map(([id, l]) => <button key={id} onClick={() => navTo(id)} style={{ padding: "7px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5 }}>{l}</button>)}</div>
          </div>) : null; })()}
        {!gated && view === "course" && <CourseView />}
        {view === "play" && <PlayView />}
        {view === "bag" && (window.BagView ? React.createElement(window.BagView, { onBack: () => setView("play"), mobile: mobile }) : null)}
        {view === "highlights" && <HighlightsView />}
        {view === "settings" && <SettingsView />}
        {false && view === "admin" && <AdminMount onExit={() => setView("settings")} />}
        {view === "myleagues" && <MyLeaguesView />}
        {view === "takeover" && (window.TakeoverHub ? <TakeoverHub /> : null)}
        {view === "friends" && window.FriendsSection && <div style={{ maxWidth: 760, margin: "0 auto" }}>{React.createElement(window.FriendsSection, { mobile: mobile })}</div>}
        {view === "createleague" && (
          <div>
            <button onClick={() => setView("settings")} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "7px 13px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: "var(--text-muted)" }}>← Settings</button>
            <CreateLeagueView />
          </div>
        )}
      </div>
    );

    if (mobile) {
      return (
        <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 80 }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(11px + env(safe-area-inset-top, 0px)) 16px 11px", background: "var(--bg-ink-deep)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Mark size={28} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 17, color: "var(--bone-50)", lineHeight: 0.9 }}>Chains</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".16em", fontSize: 8, color: "var(--ace-400)", marginTop: 1, whiteSpace: "nowrap" }}>Disc golf, with your crew <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-faint)", marginLeft: 6 }}>{window.CHAINS_VERSION || "v441"}</span></div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => { try { if (window.ChainsBugReport) window.ChainsBugReport.open(); } catch (e) {} }} title="Report a bug" aria-label="Report a bug" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", color: "var(--chain-400)", cursor: "pointer", fontSize: 14, fontFamily: "var(--font-display)", WebkitTapHighlightColor: "transparent" }}>?</button>
                <NotifBell onGo={(link, t) => { if (link === "picks") goPicks(t); else navTo(link); }} />
                <SyncPill dark />
                <WhoBadge dark compact />
              </div>
            </header>
          </div>
          <main style={{ padding: "14px 14px calc(96px + env(safe-area-inset-bottom, 0px))", width: "100%", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>{view !== "play" && view !== "friends" && view !== "bag" ? <LeagueBar /> : null}{content}</main>
          <__Portal><BottomNav nav={nav} view={view} onTab={(id) => { setMoreOpen(false); if (id === "courses") { navTo("play"); setTimeout(() => { try { window.dispatchEvent(new CustomEvent("chains:play-nav", { detail: "browse" })); } catch (e) {} }, 60); return; } if (id === "playstart") { navTo("play"); setTimeout(() => { try { window.dispatchEvent(new CustomEvent("chains:play-nav", { detail: "start" })); } catch (e) {} }, 60); return; } if (id === "play") { navTo("play"); setTimeout(() => { try { window.dispatchEvent(new CustomEvent("chains:play-nav", { detail: "home" })); } catch (e) {} }, 60); return; } navTo(id); }} onMore={() => setMoreOpen(true)} />
          <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} nav={nav} view={view} onPick={(id) => { setMoreOpen(false); navTo(id); }} /></__Portal>
          <MemberDrawer memberId={drawer} onClose={() => setDrawer(null)} />
          <EventDrawer eventT={eventT} onClose={() => setEventT(null)} onMember={(id) => { setEventT(null); setDrawer(id); }} />
          <PlayerDrawer name={playerName} onClose={() => setPlayerName(null)} onMember={(id) => { setPlayerName(null); setDrawer(id); }} />
          <JoinGate />
          <AddFriendGate />
          <EmailPrompt />
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "var(--sidebar-w) 1fr", minHeight: "100vh", background: "var(--bg-page)" }}>
        {/* Sidebar */}
        <aside style={{ background: "var(--bg-ink-deep)", display: "flex", flexDirection: "column", padding: "20px 14px", position: "sticky", top: 0, height: "100vh", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 22px" }}>
            <Mark size={38} />
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 24, color: "var(--bone-50)", lineHeight: 0.9, letterSpacing: "-.01em" }}>Chains</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".18em", fontSize: 9, color: "var(--ace-400)", marginTop: 2 }}>Disc golf, with your crew <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text-faint)", marginLeft: 6 }}>{window.CHAINS_VERSION || "v441"}</span></div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nav.map((n) => <NavItem key={n.id} {...n} active={view === n.id} onClick={() => setView(n.id)} />)}
          </nav>
          <div style={{ marginTop: "auto", padding: "16px 8px 4px", borderTop: "1px solid var(--border-ink)", display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => { try { if (window.ChainsBugReport) window.ChainsBugReport.open(); } catch (e) {} }} title="Report a bug" aria-label="Report a bug" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", color: "var(--chain-400)", cursor: "pointer", fontSize: 16, fontFamily: "var(--font-display)" }}>?</button>
              <WhoBadge dark />
              <NotifBell dark onGo={(link, t) => { if (link === "picks") goPicks(t); else setView(link); }} />
            </div>
            <SyncPill dark />
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--chain-500)", lineHeight: 1.5 }}>2026 season · Feb–Oct.<br />Tap a member or event for more.</div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: "28px 32px 60px", maxWidth: 1180, width: "100%", minWidth: 0, boxSizing: "border-box" }}>
          <LeagueBar />
          {content}
        </main>

        <MemberDrawer memberId={drawer} onClose={() => setDrawer(null)} />
        <EventDrawer eventT={eventT} onClose={() => setEventT(null)} onMember={(id) => { setEventT(null); setDrawer(id); }} />
        <PlayerDrawer name={playerName} onClose={() => setPlayerName(null)} onMember={(id) => { setPlayerName(null); setDrawer(id); }} />
        <JoinGate />
        <AddFriendGate />
        <LeagueCodeGate />
      </div>
    );
  }

  /* ---- League join: confirm dialog for an invite link / code -------------- */
  function JoinGate() {
    const [reqId, setReqId] = React.useState(null);
    const [league, setLeague] = React.useState(null);
    React.useEffect(function () {
      function authed() { return ChainsID.whoami() || (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()); }
      function open(id) {
        if (!id || id === "classic") return;
        const L = window.ChainsTestData ? ChainsTestData.byId(id) : null;
        setReqId(id); setLeague(L);
      }
      function tryPending() {
        let id; try { id = localStorage.getItem("chains_pending_join"); } catch (e) {}
        if (id && authed()) { try { localStorage.removeItem("chains_pending_join"); } catch (e) {} open(id); }
      }
      tryPending();
      const onReq = function (e) { const id = e && e.detail; if (!id) return; if (authed()) open(id); else { try { localStorage.setItem("chains_pending_join", id); } catch (er) {} } };
      const onId = function () { tryPending(); };
      const onUpd = function () { setReqId(function (cur) { if (cur && window.ChainsTestData) { const L = ChainsTestData.byId(cur); if (L) setLeague(L); } return cur; }); };
      window.addEventListener("chains:join-request", onReq);
      window.addEventListener("chains:identity", onId);
      window.addEventListener("chains:remote-update", onUpd);
      const onKey = function (e) { if (e.key === "Escape") setReqId(null); };
      window.addEventListener("keydown", onKey);
      return function () { window.removeEventListener("chains:join-request", onReq); window.removeEventListener("chains:identity", onId); window.removeEventListener("chains:remote-update", onUpd); window.removeEventListener("keydown", onKey); };
    }, []);
    if (!reqId) return null;
    const name = (league && league.name) || "this league";
    let commish = "";
    if (league && Array.isArray(league.members)) { const c = league.members.find(function (m) { return m.role === "commish"; }); commish = c ? (c.name || c.displayName) : ((league.members[0] || {}).name || ""); }
    function join() {
      const nm = (league && league.name) || "the league";
      if (window.ChainsTestData) ChainsTestData.join(reqId);
      setReqId(null); setLeague(null);
      if (window.ChainsToast) ChainsToast.show("You joined " + nm);
      try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "dashboard" })); } catch (e) {}
    }
    function cancel() { setReqId(null); setLeague(null); }
    return (
      <div onClick={cancel} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,20,16,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div onClick={function (e) { e.stopPropagation(); }} style={{ width: "100%", maxWidth: 380, background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "0 20px 50px rgba(0,0,0,.3)", overflow: "hidden" }}>
          <div style={{ padding: "22px 22px 8px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-500)" }}>League invite</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)", marginTop: 6, lineHeight: 1.1 }}>Join {name}?</div>
            {commish ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Invited by <b style={{ color: "var(--text-body)" }}>{commish}</b>. You'll be added to the roster and the league shows up in your My Leagues.</div>
              : <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>You'll be added to the roster and the league shows up in your My Leagues.</div>}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "16px 22px 22px" }}>
            <button onClick={cancel} style={{ flex: 1, height: 44, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, color: "var(--text-muted)" }}>Cancel</button>
            <button onClick={join} style={{ flex: 1.4, height: 44, border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>Join league</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- v492: one-time "get notified" prompt — collects an email for alerts ---- */
  /* v503: one-time re-sign-in (Will, 2026-10-21) so everyone lands on the login screen once
     and the email prompt catches accounts without a recovery email. Flag per device. */
  (function reloginOnce() {
    try {
      if (localStorage.getItem("chains_relogin_v2") === "done") return;
      if (!window.ChainsAuth || !ChainsAuth.onChange) return;
      var off = ChainsAuth.onChange(function (user, unavailable) {
        if (unavailable) return;
        try { localStorage.setItem("chains_relogin_v2", "done"); } catch (e) {}
        if (user && !user.anon) { try { ChainsAuth.signOut(); } catch (e) {} }
        try { off && off(); } catch (e) {}
      });
    } catch (e) {}
  })();
  function EmailPrompt() {
    const [show, setShow] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");
    const SNOOZE = "chains_email_prompt_snooze_v1";
    React.useEffect(() => {
      let alive = true;
      function check() {
        try {
          const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current(); if (!u || u.isAnonymous) return;
          const sn = parseInt(localStorage.getItem(SNOOZE) || "0", 10); if (sn && Date.now() < sn) return;
          ChainsAuth.fetchAccountProfile().then((p) => { if (!alive) return; if (p && (p.recoveryEmail || p.notifyEmail)) return; setTimeout(() => { if (alive) setShow(true); }, 2500); });
        } catch (e) {}
      }
      check();
      const fn = () => check(); window.addEventListener("chains:identity", fn);
      return () => { alive = false; window.removeEventListener("chains:identity", fn); };
    }, []);
    if (!show) return null;
    const later = () => { try { localStorage.setItem(SNOOZE, String(Date.now() + 7 * 86400000)); } catch (e) {} setShow(false); };
    const save = () => {
      const v = email.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr("That doesn't look like an email."); return; }
      setBusy(true);
      ChainsAuth.setRecoveryEmail(v).then(() => { try { const f = window.ChainsFB; const u = ChainsAuth.current(); if (f && f.db && u) f.db.ref("users/" + u.uid + "/profile/notify").update({ email: true, at: Date.now() }).catch(() => {}); } catch (e) {} setBusy(false); setShow(false); try { window.ChainsToast && ChainsToast.show("Saved — we'll email you when something happens on Chains.", "success"); } catch (e) {} })
        .catch((e) => { setBusy(false); setErr((e && e.message) || "Couldn't save that — try again."); });
    };
    return (<__Portal>
      <div onClick={later} style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(10,20,14,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div onClick={(e) => e.stopPropagation()} className="gt-sheet" style={{ width: "100%", maxWidth: 520, background: "var(--bg-elevated)", borderRadius: "22px 22px 0 0", padding: "20px 18px calc(18px + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)", lineHeight: 1.05 }}>Don't miss a round 🔔</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>Add your email so we can tell you when a friend adds you, puts you on a card, starts a league, or your picks are due. It's also how you recover your account.</div>
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@example.com" style={{ width: "100%", height: 48, marginTop: 14, padding: "0 14px", border: "1px solid " + (err ? "var(--score-over, #c23a33)" : "var(--border-default)"), borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 16, background: "var(--bg-sunken)", color: "var(--text-strong)", outline: "none", boxSizing: "border-box" }} />
          {err ? <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--score-over, #c23a33)", marginTop: 6 }}>{err}</div> : null}
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={later} style={{ flex: 1, height: 48, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14 }}>Not now</button>
            <button onClick={save} disabled={busy} style={{ flex: 2, height: 48, borderRadius: "var(--radius-md)", border: "none", background: "var(--ace-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 15, opacity: busy ? .6 : 1 }}>{busy ? "Saving…" : "Turn on alerts"}</button>
          </div>
        </div>
      </div></__Portal>
    );
  }
  /* ---- Add-friend: confirm dialog for a friend code / link --------------- */
  function AddFriendGate() {
    const [uid, setUid] = React.useState(null);
    const [name, setName] = React.useState("");
    const [sent, setSent] = React.useState(false);
    React.useEffect(function () {
      function authed() { return ChainsID.whoami() || (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()); }
      function open(raw) {
        if (!raw || !window.ChainsFriends) return;
        // v482: the QR / link carries a friend CODE (#add=SRE3D7) or a member id
        // (#addfriend=kyle). Resolve to the member id FIRST - befriending the raw
        // code wrote junk friendships nobody could see.
        const finish = (id) => {
          if (!id) { try { if (window.ChainsToast) ChainsToast.show("That friend link didn\u2019t match anyone \u2014 ask them to share it again.", "error"); } catch (e) {} return; }
          if (ChainsFriends.myUid && id === ChainsFriends.myUid()) { try { if (window.ChainsToast) ChainsToast.show("That\u2019s your own code.", "info"); } catch (e) {} return; }
          const p = ChainsFriends.profile ? ChainsFriends.profile(id) : null;
          if (!p && ChainsFriends.hydrate) { try { ChainsFriends.hydrate(id); } catch (e) {} }
          let nm = p ? p.name : "";
          try { const mm = window.ChainsEngine && ChainsEngine.member ? ChainsEngine.member(id) : null; if (mm && mm.name) nm = mm.name; } catch (e) {}
          setUid(id); setName(nm); setSent(false);
        };
        if (ChainsFriends.resolveAny) ChainsFriends.resolveAny(raw).then(finish, () => finish(null));
        else finish(raw);
      }
      function tryPending() { let id; try { id = localStorage.getItem("chains_pending_addfriend"); } catch (e) {} if (id && authed()) { try { localStorage.removeItem("chains_pending_addfriend"); } catch (e) {} open(id); } }
      tryPending();
      const onReq = function (e) { const id = e && e.detail; if (!id) return; if (authed()) open(id); else { try { localStorage.setItem("chains_pending_addfriend", id); } catch (er) {} } };
      const onId = function () { tryPending(); };
      const onFr = function () { setUid(function (cur) { if (cur && window.ChainsFriends) { const p = ChainsFriends.profile(cur); if (p) setName(p.name); } return cur; }); };
      window.addEventListener("chains:addfriend-request", onReq);
      window.addEventListener("chains:identity", onId);
      window.addEventListener("chains:friends", onFr);
      const onKey = function (e) { if (e.key === "Escape") setUid(null); };
      window.addEventListener("keydown", onKey);
      return function () { window.removeEventListener("chains:addfriend-request", onReq); window.removeEventListener("chains:identity", onId); window.removeEventListener("chains:friends", onFr); window.removeEventListener("keydown", onKey); };
    }, []);
    if (!uid) return null;
    function send() { let ok = false; if (window.ChainsFriends) ok = ChainsFriends.befriend(uid); if (ok === false) { if (window.ChainsToast) ChainsToast.show("Sign in first, then scan again.", "error"); return; } setSent(true); if (window.ChainsToast) ChainsToast.show("You're friends now"); setTimeout(function () { setUid(null); }, 1100); }
    function cancel() { setUid(null); }
    const who = name || "this player";
    return (
      <div onClick={cancel} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,20,16,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div onClick={function (e) { e.stopPropagation(); }} style={{ width: "100%", maxWidth: 360, background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "0 20px 50px rgba(0,0,0,.3)", overflow: "hidden" }}>
          <div style={{ padding: "22px 22px 8px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-500)" }}>Friend request</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 21, color: "var(--text-strong)", marginTop: 6, lineHeight: 1.1 }}>{sent ? "You're friends" : "Add " + who + "?"}</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>{sent ? "You can see each other's bag and shared rounds." : "You scanned their QR — that's enough proof you're together. You'll be friends immediately, no accept step."}</div>
          </div>
          {!sent && (
            <div style={{ display: "flex", gap: 10, padding: "16px 22px 22px" }}>
              <button onClick={cancel} style={{ flex: 1, height: 44, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, color: "var(--text-muted)" }}>Cancel</button>
              <button onClick={send} style={{ flex: 1.4, height: 44, border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>Add friend</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Small non-blocking ribbon shown on test/preview builds (never on live index.html).
  function TestBuildBadge() {
    if (!(window.ChainsBuild && ChainsBuild.isTest)) return null;
    return (
      <div style={{ position: "fixed", left: 10, bottom: "calc(62px + env(safe-area-inset-bottom, 0px))", zIndex: 190, pointerEvents: "none", display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: "var(--radius-pill)", background: "rgba(217,119,6,.96)", color: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,.25)", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10.5 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }}></span>Test build · preview
      </div>
    );
  }

  /* ---- League-code join: confirm dialog for #league=<CODE> (decision 2: instant,
     revocable — a light confirm here, no commissioner approval queue). ---- */
  function LeagueCodeGate() {
    const [code, setCode] = React.useState(null);
    const [resolved, setResolved] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    function authed() { return ChainsID.whoami() || (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current()); }
    function db() { return (window.ChainsFB && ChainsFB.ok) ? ChainsFB.db : null; }
    function resolve(c) {
      const d = db(); if (!d) return;
      d.ref("leagueCodes/" + c).once("value").then(function (s) {
        const v = s.val();
        if (v && v.active && v.leagueId) setResolved({ leagueId: v.leagueId });
        else { setCode(null); setResolved(null); if (window.ChainsToast) ChainsToast.show("That league code isn't valid anymore.", "error"); }
      }).catch(function () {});
    }
    React.useEffect(function () {
      function tryPending() { let c; try { c = localStorage.getItem("chains_pending_leaguecode"); } catch (e) {} if (c && authed()) { try { localStorage.removeItem("chains_pending_leaguecode"); } catch (e) {} setCode(c); resolve(c); } }
      tryPending();
      const onReq = function (e) { const c = e && e.detail; if (!c) return; if (authed()) { setCode(c); resolve(c); } else { try { localStorage.setItem("chains_pending_leaguecode", c); } catch (er) {} } };
      const onId = function () { tryPending(); };
      window.addEventListener("chains:leaguecode-request", onReq);
      window.addEventListener("chains:identity", onId);
      const onKey = function (e) { if (e.key === "Escape") { setCode(null); setResolved(null); } };
      window.addEventListener("keydown", onKey);
      return function () { window.removeEventListener("chains:leaguecode-request", onReq); window.removeEventListener("chains:identity", onId); window.removeEventListener("keydown", onKey); };
    }, []);
    if (!code || !resolved) return null;
    function cancel() { setCode(null); setResolved(null); }
    function join() {
      const d = db(); const u = window.ChainsAuth && ChainsAuth.current && ChainsAuth.current();
      if (!d || !u) return;
      setBusy(true);
      const uid = u.uid, lid = resolved.leagueId;
      const upd = {};
      upd["leagues/" + lid + "/members/" + uid] = { memberId: (window.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null };
      upd["users/" + uid + "/profile/leagues/" + lid] = true;
      d.ref().update(upd).then(function () {
        setBusy(false); cancel();
        try { window.dispatchEvent(new Event("chains:profile")); } catch (e) {}
        if (window.ChainsToast) ChainsToast.show("You're in!");
        try { window.dispatchEvent(new CustomEvent("chains:navigate", { detail: "dashboard" })); } catch (e) {}
      }).catch(function () { setBusy(false); if (window.ChainsToast) ChainsToast.show("Couldn't join — try again.", "error"); });
    }
    return (
      <div onClick={cancel} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(12,20,16,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div onClick={function (e) { e.stopPropagation(); }} style={{ width: "100%", maxWidth: 380, background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", boxShadow: "0 20px 50px rgba(0,0,0,.3)", overflow: "hidden" }}>
          <div style={{ padding: "22px 22px 8px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-500)" }}>League code</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)", marginTop: 6, lineHeight: 1.1 }}>Join this league?</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>You'll show up in the league right away — no approval needed.</div>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "16px 22px 22px" }}>
            <button onClick={cancel} style={{ flex: 1, height: 44, border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13, color: "var(--text-muted)" }}>Cancel</button>
            <button onClick={join} disabled={busy} style={{ flex: 1.4, height: 44, border: "none", borderRadius: "var(--radius-md)", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 13 }}>{busy ? "…" : "Join league"}</button>
          </div>
        </div>
      </div>
    );
  }

  // Capture an inbound #join=<leagueId> or #addfriend=<uid> as soon as the script
  // runs — before the auth gate — so a not-yet-logged-in invitee resumes after sign-up.
  (function () {
    try {
      var hash = location.hash || "", touched = false;
      var j = hash.match(/[#&]join=([^&]+)/);
      if (j) { localStorage.setItem("chains_pending_join", decodeURIComponent(j[1])); touched = true; }
      var f = hash.match(/[#&](?:addfriend|add)=([^&]+)/);
      if (f) { localStorage.setItem("chains_pending_addfriend", decodeURIComponent(f[1])); touched = true; }
      var lg = hash.match(/[#&]league=([^&]+)/);
      if (lg) { localStorage.setItem("chains_pending_leaguecode", decodeURIComponent(lg[1])); touched = true; }
      // v534 — sticker / QR deep link: #course=<id> opens that course page (Play view)
      var cq = hash.match(/[#&]course=([^&]+)/);
      if (cq) { localStorage.setItem("chains_pending_course", decodeURIComponent(cq[1])); touched = true; }
      if (touched) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; } }
    } catch (e) {}
  })();
  window.ChainsJoin = {
    prompt: function (id) {
      if (!id || id === "classic") return;
      const authed = ChainsID.whoami() || (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current());
      if (!authed) { try { localStorage.setItem("chains_pending_join", id); } catch (e) {} }
      try { window.dispatchEvent(new CustomEvent("chains:join-request", { detail: id })); } catch (e) {}
    }
  };
  window.ChainsAddFriend = {
    prompt: function (uid) {
      if (!uid) return;
      const authed = ChainsID.whoami() || (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current());
      if (!authed) { try { localStorage.setItem("chains_pending_addfriend", uid); } catch (e) {} }
      try { window.dispatchEvent(new CustomEvent("chains:addfriend-request", { detail: uid })); } catch (e) {}
    }
  };
  window.ChainsLeagueCode = {
    prompt: function (code) {
      if (!code) return;
      const authed = ChainsID.whoami() || (window.ChainsAuth && ChainsAuth.current && ChainsAuth.current());
      if (!authed) { try { localStorage.setItem("chains_pending_leaguecode", code); } catch (e) {} }
      try { window.dispatchEvent(new CustomEvent("chains:leaguecode-request", { detail: code })); } catch (e) {}
    }
  };

  window.ChainsApp = ChainsApp;
})();
