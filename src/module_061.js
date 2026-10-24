/* Chains app — Stats view: The Pot (money), Total Down, Fun facts. window.StatsView */
(function () {
  function money(n) { return "$" + Math.round(n).toLocaleString(); }

  function MoneyInput({ value, onCommit, placeholder }) {
    const [v, setV] = React.useState(value == null ? "" : String(value));
    React.useEffect(() => { setV(value == null ? "" : String(value)); }, [value]);
    return (
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-faint)" }}>$</span>
        <input value={v} inputMode="numeric" placeholder={placeholder || "0"}
          onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={() => onCommit(v === "" ? null : parseInt(v, 10))}
          style={{ width: "100%", height: 34, padding: "0 8px 0 18px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--text-strong)", background: "var(--bg-elevated)", outline: "none", boxSizing: "border-box" }} />
      </div>
    );
  }

  function PayoutEditor({ mobile, onChange }) {
    const TS = ChainsEngine.SEED.TOURNAMENTS.filter((t) => { const r = ChainsEngine.eventResults(t.t); return r && r.scored; });
    const [t, setT] = React.useState(TS.length ? TS[TS.length - 1].t : 1);
    const [, force] = React.useState(0);
    const picks = ChainsEngine.picksFor(t) || [];
    const purse = ChainsEngine.getPurse(t);
    function refresh() { force((x) => x + 1); onChange && onChange(); }
    return (
      <div style={{ padding: mobile ? "14px 16px" : "16px 22px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>Enter prize money</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Purse</span>
            <div style={{ width: 110 }}><MoneyInput value={purse} placeholder="total" onCommit={(val) => { ChainsEngine.setPurse(t, val); refresh(); }} /></div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
          {TS.map((x) => (
            <button key={x.t} onClick={() => setT(x.t)} style={{ flexShrink: 0, padding: "6px 11px", borderRadius: "var(--radius-sm)", border: `1px solid ${x.t === t ? "var(--fairway-500)" : "var(--border-subtle)"}`, background: x.t === t ? "var(--fairway-600)" : "var(--bg-elevated)", color: x.t === t ? "#fff" : "var(--text-strong)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12 }}>T{x.t}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {picks.map((p) => {
            const m = ChainsEngine.member(p.m);
            const pay = ChainsEngine.getPayout(t, p.m);
            return (
              <div key={p.m} style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "120px 1fr 1fr", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Avatar name={m.name} color={m.disc} size={22} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: "var(--text-strong)" }}>{m.name}</span>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.p1 || "Pick 1"}</span>
                  <MoneyInput value={pay.p1} onCommit={(val) => { ChainsEngine.setPayout(t, p.m, "p1", val); refresh(); }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.p2 && p.p2 !== "N/A" ? p.p2 : "Pick 2"}</span>
                  <MoneyInput value={pay.p2} onCommit={(val) => { ChainsEngine.setPayout(t, p.m, "p2", val); refresh(); }} />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function PotSection({ mobile }) {
    const [, force] = React.useState(0);
    const [editing, setEditing] = React.useState(false);
    const pot = ChainsEngine.money();
    const leader = pot.rows[0];
    const max = Math.max(1, ...pot.rows.map((r) => r.won));
    return (
      <Card pad={0}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center", padding: mobile ? "16px" : "18px 22px", background: "var(--bg-ink)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--ace-400)" }}>The Pot · real PDGA winnings</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 22, color: "var(--bone-50)", lineHeight: 1 }}>Money won</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--chain-400)", marginTop: 5 }}>Total prize money each member's drafted pros have earned</div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div><div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 24, color: "var(--gold-500)", lineHeight: 1 }}>{money(leader.won)}</div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--chain-400)", marginTop: 3 }}>{leader.name} leads</div></div>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ padding: "6px 14px 8px" }}>
          {pot.rows.map((m, i) => (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "26px 1fr 96px", alignItems: "center", gap: 12, padding: "10px 8px", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 ? "var(--gold-500)" : "var(--text-faint)" }}>{i + 1}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Avatar name={m.name} color={m.disc} size={26} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
                </div>
                <div style={{ height: 6, background: "var(--bg-sunken)", borderRadius: 3, overflow: "hidden", marginTop: 6 }}>
                  <div style={{ width: (m.won / max) * 100 + "%", height: "100%", background: i === 0 ? "var(--gold-500)" : "var(--fairway-500)", borderRadius: 3 }} />
                </div>
              </div>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: "var(--text-strong)" }}>{money(m.won)}</span>
            </div>
          ))}
        </div>

        {/* Edit toggle */}
        <div style={{ padding: "0 14px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          {ChainsID.isCommish() && <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)" }}>Grab payouts from PDGA Live (event → Finals → Prize) and paste them in.</span>}
          {ChainsID.isCommish() && <Button variant={editing ? "primary" : "secondary"} size="sm" icon={<Icons.Settings size={14} />} onClick={() => setEditing((e) => !e)}>{editing ? "Done editing" : "Edit payouts"}</Button>}
        </div>
        {editing && <PayoutEditor mobile={mobile} onChange={() => force((x) => x + 1)} />}
      </Card>
    );
  }

  function TotalDownSection({ mobile }) {
    const L = window.ChainsActive ? ChainsActive.league() : null;
    const st = [...(L ? L.standings : ChainsEngine.standings())].sort((a, b) => a.down - b.down);
    const min = Math.min(...st.map((m) => m.down));
    return (
      <Card pad={mobile ? 16 : 20}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Cumulative</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)" }}>Total Down</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>Every player's tournament totals added up — who's the most under par all season.</div>
        </div>
        {st.map((m, i) => {
          const pct = min < 0 ? Math.max(8, (m.down / min) * 100) : 8;
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <Avatar name={m.name} color={m.disc} size={28} />
              <span style={{ width: mobile ? 54 : 64, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
              <div style={{ flex: 1, height: 12, background: "var(--bg-sunken)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: i === 0 ? "linear-gradient(90deg,var(--birdie-500),var(--fairway-600))" : "var(--fairway-400)", borderRadius: 6 }} />
              </div>
              <span style={{ width: 56, textAlign: "right" }}><ScoreValue value={m.down} size={17} /></span>
            </div>
          );
        })}
      </Card>
    );
  }

  function FunCard({ kicker, title, value, sub, accent, icon }) {
    return (
      <Card pad={16} style={{ height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <span style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", background: (accent || "var(--fairway-600)"), color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: "var(--text-muted)" }}>{kicker}</span>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1 }}>{title}</div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 8 }}>{value}</div>
        {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>{sub}</div>}
      </Card>
    );
  }

  function FunSection({ mobile }) {
    const f = ChainsEngine.funStats();
    const m = (id) => ChainsEngine.member(id);
    const Big = ({ children }) => <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 26, color: "var(--text-strong)" }}>{children}</span>;
    return (
      <div>
        <SectionHeader kicker="For the group chat" title="Fun Facts" size={mobile ? "sm" : "md"} />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
          <FunCard kicker="Biggest blowout" title={f.best.m ? m(f.best.m).name : "—"} icon={<Icons.Flame size={14} />} accent="var(--ace-500)"
            value={<ScoreValue value={f.best.total} size={26} />} sub={f.best.t ? `Lowest single total · T${f.best.t}` : ""} />
          <FunCard kicker="Steal of the season" title={f.bestPick.name || "—"} icon={<Icons.Star size={14} />} accent="var(--gold-500)"
            value={<ScoreValue value={f.bestPick.score} size={26} />} sub={f.bestPick.m ? `${m(f.bestPick.m).name}'s pick · T${f.bestPick.t}` : ""} />
          <FunCard kicker="Hot hand" title={f.hottest ? f.hottest.name : "—"} icon={<Icons.TrendUp size={14} />} accent="var(--birdie-600)"
            value={<Big>{f.hottest ? f.hottest.avgFinish.toFixed(1) : "—"}</Big>} sub="Best average finish" />
          <FunCard kicker="Crowd favorite" title={f.mostPicked ? f.mostPicked.name : "—"} icon={<Icons.Users size={14} />} accent="var(--sky-500)"
            value={<Big>{f.mostPicked ? f.mostPicked.picks : 0}<span style={{ fontSize: 13, color: "var(--text-faint)", marginLeft: 4 }}>picks</span></Big>} sub="Most-drafted pro in the league" />
        </div>

        {/* Each member's favorite pro */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {ChainsEngine.members().map((mem) => {
            const fav = f.favorites[mem.id];
            return (
              <Card key={mem.id} pad={12} accentBar={mem.disc}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <Avatar name={mem.name} color={mem.disc} size={24} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 12, color: "var(--text-strong)" }}>{mem.name}</span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 9, color: "var(--text-faint)" }}>Go-to pick</div>
                <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--text-strong)", marginTop: 2, lineHeight: 1.15 }}>{fav ? fav.name : "—"}</div>
                {fav && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>×{fav.count}</div>}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  function HeadToHead({ mobile }) {
    const st = ChainsEngine.standings();
    const MEMBERS = ChainsEngine.members();
    const [aId, setAId] = React.useState(st[0].id);
    const [bId, setBId] = React.useState(st[1].id);
    const same = aId === bId;
    const h = ChainsEngine.headToHead(aId, bId);
    const aWon = h.aWins > h.bWins, bWon = h.bWins > h.aWins;
    const [showEvents, setShowEvents] = React.useState(false);

    const Picker = ({ value, onChange, label }) => (
      <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 10, color: "var(--text-muted)" }}>{label}</span>
        <div style={{ position: "relative" }}>
          <select value={value} onChange={(e) => onChange(e.target.value)}
            style={{ appearance: "none", WebkitAppearance: "none", MozAppearance: "none", width: "100%", height: 44, padding: "0 34px 0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", cursor: "pointer", boxShadow: "var(--shadow-xs)" }}>
            {MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", width: 16, height: 16, color: "var(--text-muted)" }}><Icons.ChevDown size={16} /></span>
        </div>
      </label>
    );

    const Side = ({ who, total, win }) => (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "9px 12px", borderRadius: "var(--radius-sm)", background: win ? "var(--fairway-100)" : "var(--bg-surface)", border: win ? "1px solid var(--fairway-300)" : "1px solid var(--border-subtle)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 13, color: win ? "var(--fairway-700)" : "var(--text-muted)" }}>
          {win && <span style={{ width: 13, height: 13, color: "var(--fairway-600)" }}><Icons.Check size={13} /></span>}{who.name}
        </span>
        <ScoreValue value={total} size={15} />
      </div>
    );

    return (
      <Card pad={0}>
        <div style={{ padding: mobile ? "16px" : "18px 22px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>Compare two members</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 22, color: "var(--text-strong)" }}>Head to Head</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 14 }}>
            <Picker value={aId} onChange={setAId} label="Player 1" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-faint)", fontSize: 13, paddingBottom: 12 }}>vs</span>
            <Picker value={bId} onChange={setBId} label="Player 2" />
          </div>
        </div>

        {same ? (
          <div style={{ padding: "28px 22px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)" }}>Pick two different members to compare.</div>
        ) : (
          <div style={{ padding: mobile ? "16px" : "18px 22px" }}>
            {/* plain-English summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--bg-ink)", borderRadius: "var(--radius-md)", marginBottom: 16 }}>
              <Avatar name={h.a.name} color={h.a.disc} size={38} ring={aWon} />
              <div style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--bone-50)", lineHeight: 1.45 }}>
                In the <b>{h.events.length}</b> events they both played, <b style={{ color: h.a.disc }}>{h.a.name}</b> finished ahead <b>{h.aWins} {h.aWins === 1 ? "time" : "times"}</b> and <b style={{ color: h.b.disc }}>{h.b.name}</b> ahead <b>{h.bWins} {h.bWins === 1 ? "time" : "times"}</b>{h.ties ? `, with ${h.ties} ${h.ties === 1 ? "tie" : "ties"}` : ""}.
              </div>
              <Avatar name={h.b.name} color={h.b.disc} size={38} ring={bWon} />
            </div>

            {/* per-event breakdown — collapsed into a dropdown, closed by default */}
            <button onClick={() => setShowEvents((v) => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: "pointer" }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", fontSize: 12, color: "var(--text-strong)" }}>Event-by-event · {h.events.length} {h.events.length === 1 ? "event" : "events"}</span>
              <span style={{ width: 18, height: 18, color: "var(--text-muted)", transform: showEvents ? "rotate(180deg)" : "none", transition: "transform var(--dur-fast)" }}><Icons.ChevDown size={18} /></span>
            </button>
            {showEvents && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {h.events.map((e) => {
                const tour = ChainsEngine.SEED.TOURNAMENTS.find((x) => x.t === e.t);
                return (
                  <div key={e.t}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 11, color: "var(--text-faint)", marginBottom: 5 }}>T{e.t} · {tour ? tour.name : ""}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Side who={h.a} total={e.aTotal} win={e.winner === "a"} />
                      <Side who={h.b} total={e.bTotal} win={e.winner === "b"} />
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  function RaceSection({ mobile }) {
    const race = ChainsEngine.clinchRace();
    return (
      <Card pad={mobile ? 16 : 20}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)" }}>The Race</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)" }}>Points Back</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 3 }}>{race.remaining} events left · up to {race.remaining * ChainsEngine.members().length} points still on the table.</div>
        </div>
        {race.rows.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
            <Avatar name={m.name} color={m.disc} size={26} />
            <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" }}>{m.name}</span>
            {i === 0
              ? <Badge tone="gold" emphasis="solid">Leader</Badge>
              : <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: "var(--text-muted)" }}>−{m.back}</span>}
          </div>
        ))}
      </Card>
    );
  }

  function AwardsSection({ mobile }) {
    const aw = ChainsEngine.awards();
    const ic = (name) => Icons[name] || Icons.Dot;
    return (
      <div>
        <SectionHeader kicker="Hardware" title="Season Awards" size={mobile ? "sm" : "md"} subtitle="Auto-awarded from the numbers — earn your trophies." />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
          {aw.map((a) => {
            const m = ChainsEngine.member(a.who);
            const I = ic(a.icon);
            return (
              <Card key={a.key} pad={16} accentBar={m ? m.disc : "var(--ace-500)"}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "var(--radius-sm)", background: "var(--pine-800)", color: "var(--gold-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I size={15} /></span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 15, color: "var(--text-strong)" }}>{a.title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  {m && <Avatar name={m.name} color={m.disc} size={30} />}
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 18, color: "var(--text-strong)" }}>{m ? m.name : a.who}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{a.detail}</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>{a.blurb}</div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---- Per-member season stats — everyone's numbers, good and bad -------- */
  function MemberStatsSection({ mobile }) {
    const [loaded, setLoaded] = React.useState(null);
    React.useEffect(() => {
      const ED = window.ExploreData;
      if (ED) ED.loadSeason("2026").then(setLoaded).catch(() => {});
    }, []);

    const L = window.ChainsActive ? ChainsActive.league() : null;
    const members = L ? L.members : ChainsEngine.members();
    const nameToPdga = {};
    (window.MPO_PLAYERS || []).forEach((p) => { if (p.pdga != null) nameToPdga[p.name] = String(p.pdga); });

    const rows = React.useMemo(() => {
      if (!loaded) return null;
      // index every completed event's pros by pdga
      const evByT = {};
      loaded.events.forEach((e) => {
        if (!e.rows || !e.rows.length) return;
        const byPdga = {}; e.rows.forEach((r) => { if (r.pdga_number != null) byPdga[String(r.pdga_number)] = r; });
        evByT[e.meta.t] = byPdga;
      });
      const sCount = (r, k) => (r && r.stats && r.stats[k] && r.stats[k].count != null) ? r.stats[k].count : 0;
      const sVal = (r, k) => (r && r.stats && r.stats[k] && r.stats[k].value != null) ? r.stats[k].value : null;

      return members.map((m) => {
        let birdies = 0, bogeys = 0, eagles = 0, ob = 0, events = 0;
        let bestRoundRating = null, bestFinish = null;
        const c1x = [], scr = [];
        (L ? L.events : ChainsEngine.SEED.TOURNAMENTS).forEach((tt) => {
          const byPdga = evByT[tt.t];
          if (!byPdga) return;
          const picks = L ? (L.picks[tt.t] || []) : (ChainsEngine.picksFor(tt.t) || []);
          const mine = picks.find((p) => p.m === m.id);
          if (!mine) return;
          let played = false;
          const names = [];
          for (let k = 1; k <= (L ? L.picksCount : 2); k++) { if (mine["p" + k] != null) names.push(mine["p" + k]); }
          names.forEach((nm) => {
            const pd = nameToPdga[nm];
            const r = pd ? byPdga[pd] : null;
            if (!r) return;
            played = true;
            birdies += sCount(r, "birdie_count");
            bogeys += sCount(r, "bogey_count");
            eagles += sCount(r, "eagle_or_better_count");
            ob += sCount(r, "ob_count");
            const cv = sVal(r, "c1x_putting_pct"); if (cv != null) c1x.push(cv);
            const sv = sVal(r, "scramble_pct"); if (sv != null) scr.push(sv);
            if (r.place > 0 && (bestFinish == null || r.place < bestFinish)) bestFinish = r.place;
            (r.rounds || []).forEach((rd) => { if (rd && rd.rating != null && (bestRoundRating == null || rd.rating > bestRoundRating)) bestRoundRating = rd.rating; });
          });
          if (played) events++;
        });
        const avg = (a) => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null;
        return { m, events, birdies, bogeys, eagles, ob, c1x: avg(c1x), scr: avg(scr), bestRoundRating, bestFinish };
      });
    }, [loaded, L ? L.id : null]);

    const cols = [
      { key: "birdies", label: "Birdies", good: "high", fmt: (v) => v },
      { key: "eagles", label: "Eagles", good: "high", fmt: (v) => v },
      { key: "bogeys", label: "Bogeys", good: "low", fmt: (v) => v },
      { key: "ob", label: "OB", good: "low", fmt: (v) => v },
      { key: "c1x", label: "C1X Putt", good: "high", fmt: (v) => v == null ? "—" : v + "%" },
      { key: "scr", label: "Scramble", good: "high", fmt: (v) => v == null ? "—" : v + "%" },
    ];
    // champion per category (subtle highlight + badges)
    const CHAMP = [
      { key: "birdies", icon: "TrendUp", title: "Birdie Machine", good: "high", unit: "birdies" },
      { key: "eagles", icon: "Star", title: "Eagle Eye", good: "high", unit: "eagles" },
      { key: "c1x", icon: "Target", title: "Best Putter", good: "high", unit: "% C1X" },
      { key: "scr", icon: "Reset", title: "Escape Artist", good: "high", unit: "% scramble" },
      { key: "ob", icon: "Pin", title: "Most Lost", good: "high", unit: "OB" },
      { key: "bogeys", icon: "Flame", title: "Bogey Trouble", good: "high", unit: "bogeys" },
    ];
    const leaders = {};
    const champ = {};
    if (rows) {
      cols.forEach((c) => {
        let best = null, who = null;
        rows.forEach((r) => { const v = r[c.key]; if (v == null) return; if (best == null || (c.good === "high" ? v > best : v < best)) { best = v; who = r.m.id; } });
        leaders[c.key] = who;
      });
      CHAMP.forEach((c) => {
        let best = null, who = null;
        rows.forEach((r) => { const v = r[c.key]; if (v == null) return; if (best == null || (c.good === "high" ? v > best : v < best)) { best = v; who = r.m; } });
        champ[c.key] = who ? { m: who, v: best } : null;
      });
    }
    // which champions does each member hold? (for badges on their card)
    const badgesFor = (mid) => CHAMP.filter((c) => champ[c.key] && champ[c.key].m.id === mid);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Champions strip — the badges */}
        {rows && (
          <div>
            <SectionHeader kicker="Who leads what" title="Category Champions" size={mobile ? "sm" : "md"} />
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
              {CHAMP.map((c) => {
                const w = champ[c.key];
                if (!w) return null;
                const shame = c.key === "ob" || c.key === "bogeys";
                return (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", borderLeft: "3px solid " + w.m.disc }}>
                    <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", justifyContent: "center", background: shame ? "rgba(180,69,47,0.12)" : "var(--fairway-50)", color: shame ? "var(--clay-600, #b4452f)" : "var(--fairway-700)" }}>{React.createElement((window.Icons || {})[c.icon] || window.Icons.Dot, { size: 16 })}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <Avatar name={w.m.name} color={w.m.disc} size={20} />
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.m.name}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color: shame ? "var(--clay-600, #b4452f)" : "var(--fairway-700)" }}>{w.v}{(c.key === "c1x" || c.key === "scr") ? "%" : ""}</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 9.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".04em" }}>{c.unit.replace(/^%\s?/, "")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-member cards */}
        <div>
          <SectionHeader kicker="Everyone's season · drafted pros combined" title="Member Stats" size={mobile ? "sm" : "md"}
            subtitle={rows && rows[0] ? `Birdies to bogeys across ${rows[0].events} scored events — highlighted means league best.` : ""} />
          {!rows ? (
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <Card key={i} pad={0} style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px 11px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div className="cw-skel" style={{ width: 30, height: 30, borderRadius: "50%" }} />
                    <div className="cw-skel" style={{ width: 90, height: 14 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border-subtle)" }}>
                    {[0, 1, 2, 3, 4, 5].map((j) => (
                      <div key={j} style={{ padding: "13px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "var(--bg-elevated)" }}>
                        <div className="cw-skel" style={{ width: 28, height: 18 }} />
                        <div className="cw-skel" style={{ width: 34, height: 8 }} />
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
              {rows.map((r) => (
                <Card key={r.m.id} pad={0} style={{ overflow: "hidden" }} accentBar={r.m.disc}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px 11px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <Avatar name={r.m.name} color={r.m.disc} size={30} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 16, color: "var(--text-strong)", flex: 1 }}>{r.m.name}</span>
                    <span style={{ display: "flex", gap: 3 }}>
                      {badgesFor(r.m.id).map((c) => <span key={c.key} title={c.title} style={{ width: 15, height: 15, display: "inline-flex", color: "var(--gold-500)" }}>{React.createElement(window.Icons.Medal, { size: 14 })}</span>)}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: "var(--border-subtle)" }}>
                    {cols.map((c) => {
                      const lead = leaders[c.key] === r.m.id;
                      return (
                        <div key={c.key} style={{ padding: "11px 8px", textAlign: "center", background: "var(--bg-elevated)" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 19, color: lead ? (c.good === "low" ? "var(--clay-600, #b4452f)" : "var(--fairway-700)") : "var(--text-strong)" }}>{c.fmt(r[c.key])}</div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 9, color: "var(--text-faint)", marginTop: 2 }}>{c.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  function ordinalShort(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function StatsView() {
    const { mobile } = useViewport();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionHeader kicker="Beyond the points" title="Stats" size="lg"
          subtitle="Everyone's real numbers from their drafted pros — and who leads each category." />
        <MemberStatsSection mobile={mobile} />
        <TotalDownSection mobile={mobile} />
      </div>
    );
  }

  window.StatsView = StatsView;
  // Head-to-Head lives in the Clubhouse now (fun item), shared from here.
  window.StatsParts = { HeadToHead };
})();
