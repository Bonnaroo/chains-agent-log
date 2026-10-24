/* Chains app — Weekly detail + event screens. Extends window.WeeklyView via
   window.WeeklyDetail / window.WeeklyEvent. Live leaderboard + scorecard + finalize. */
(function () {
  const E = React.createElement;
  const wkPar = (v) => v == null ? "E" : v === 0 ? "E" : v > 0 ? "+" + v : String(v);
  // Firebase returns sparse arrays as objects — restore, scores kept at their hole index.
  const wkToArr = (hs) => { if (Array.isArray(hs)) return hs; if (!hs || typeof hs !== "object") return []; const out = []; Object.keys(hs).forEach((k) => { const i = Math.floor(Number(k)); if (isFinite(i) && i >= 0) out[i] = hs[k]; }); for (let j = 0; j < out.length; j++) if (out[j] === undefined) out[j] = null; return out; };
  const wkParColor = (v) => v == null || v === 0 ? "var(--text-strong)" : v < 0 ? "var(--score-under, #1f8a5b)" : "var(--score-over, #c23a33)";
  const wkStepBtn = { width: 44, height: 44, flexShrink: 0, borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--bg-sunken)", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 20, color: "var(--text-strong)" };
  function Head({ title, sub, onBack, right }) {
    return E("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
      E("button", { onClick: onBack, "aria-label": "Back", style: { width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", cursor: "pointer", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, E(Icons.ChevRight, { size: 18, style: { transform: "rotate(180deg)" } })),
      E("div", { style: { flex: 1, minWidth: 0 } },
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 20, color: "var(--text-strong)", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, title),
        sub ? E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 } }, sub) : null),
      right || null);
  }

  // Live-subscribe to one weekly (events, cards, standings update in real time).
  function useWeekly(id) {
    const [wk, setWk] = React.useState(undefined);
    React.useEffect(() => {
      if (!window.ChainsWeekly) { setWk(null); return; }
      const unsub = window.ChainsWeekly.watch(id, (v) => setWk(v));
      return unsub;
    }, [id]);
    return wk;
  }

  /* ============================ DETAIL ================================= */
  window.WeeklyDetail = function WeeklyDetail({ id, onBack, onOpenEvent, mobile }) {
    const wk = useWeekly(id);
    const me = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    if (wk === undefined) return E("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, E(Head, { title: "Weekly", onBack: onBack }), E(Card, { pad: 20 }, E("div", { style: { color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontSize: 13 } }, "Loading…")));
    if (!wk) return E("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, E(Head, { title: "Weekly", onBack: onBack }), E(Card, { pad: 22 }, E("div", { style: { textAlign: "center", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontSize: 13 } }, "This weekly isn't available.")));
    const isOwner = wk.ownerWhoami === me;
    const events = wk.events ? Object.keys(wk.events).map((k) => Object.assign({ id: k }, wk.events[k])).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))) : [];
    const standings = wk.standings ? Object.keys(wk.standings).map((k) => Object.assign({ who: k }, wk.standings[k])).sort((a, b) => (b.points || 0) - (a.points || 0)) : [];
    function startEvent() {
      const r = window.ChainsWeekly.startEvent(id, {});
      if (r && r.ok) { if (window.ChainsToast) ChainsToast.show("Event started — check in to score"); onOpenEvent(r.event.id); }
    }
    return E("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
      E(Head, { title: wk.name, sub: (wk.course && wk.course.name ? wk.course.name : "") + (wk.format ? " · " + wk.format : ""), onBack: onBack }),
      isOwner ? E("button", { onClick: startEvent, className: "cw-press", style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px", borderRadius: "var(--radius-lg)", border: "none", background: "linear-gradient(180deg, var(--ace-400), var(--ace-500))", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 15 } }, E("span", { style: { width: 18, height: 18, display: "inline-flex" } }, E(Icons.Disc, { size: 18 })), "Start this week's event") : null,
      // standings
      standings.length > 0 ? E("div", null,
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 } }, "Season standings"),
        E(Card, { pad: 0 }, standings.map((s, i) => {
          const prof = window.ChainsWeekly.profileFor(s.who);
          return E("div", { key: s.who, style: { display: "flex", alignItems: "center", gap: 11, padding: "11px 15px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: s.who === me ? "var(--fairway-50)" : "transparent" } },
            E("span", { style: { width: 18, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: i === 0 ? "var(--gold-600, #b8902a)" : "var(--text-faint)" } }, i + 1),
            E(Avatar, { name: prof.name, color: prof.disc, size: 26 }),
            E("span", { style: { flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, prof.name),
            E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" } }, (s.wins || 0) + "W · " + (s.played || 0) + " played"),
            E("span", { style: { minWidth: 38, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: "var(--text-strong)" } }, s.points || 0));
        }))) : null,
      // events
      E("div", null,
        E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 } }, "Events"),
        events.length === 0
          ? E(Card, { pad: 20 }, E("div", { style: { textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" } }, isOwner ? "No events yet — tap “Start this week's event” to run your first." : "No events yet — the owner starts each week's round."))
          : E("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, events.map((ev) => {
            const cardCount = ev.cards ? Object.keys(ev.cards).length : (ev.result ? ev.result.length : 0);
            const live = ev.status === "live", fin = ev.status === "final";
            return E("button", { key: ev.id, onClick: () => onOpenEvent(ev.id), style: { display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 15px", borderRadius: "var(--radius-md)", border: "1px solid " + (live ? "var(--live-300, #f0b9b3)" : "var(--border-default)"), background: live ? "var(--live-50, #fdeeec)" : "var(--bg-elevated)", cursor: "pointer" } },
              E("span", { style: { width: 38, height: 38, borderRadius: "var(--radius-md)", background: fin ? "var(--bg-sunken)" : "var(--ace-50, #fff3ec)", color: fin ? "var(--text-muted)" : "var(--ace-600)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, E(Icons.Calendar, { size: 18 })),
              E("div", { style: { flex: 1, minWidth: 0 } },
                E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)" } }, new Date(ev.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })),
                E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)", marginTop: 1 } }, fin ? cardCount + " players · final" : live ? cardCount + " on the card · live" : "open · tap to check in")),
              live ? E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 10, color: "var(--live-600, #c23a33)" } }, "● Live") : E("span", { style: { width: 16, height: 16, color: "var(--text-faint)" } }, E(Icons.ChevRight, { size: 16 })));
          }))));
  };

  /* ============================ EVENT (check-in · score · leaderboard) === */
  window.WeeklyEvent = function WeeklyEvent({ weeklyId, eventId, onBack, mobile }) {
    const wk = useWeekly(weeklyId);
    const me = window.ChainsID && ChainsID.whoami && ChainsID.whoami();
    const [hole, setHole] = React.useState(0);
    const ev = wk && wk.events ? wk.events[eventId] : null;
    if (wk === undefined) return E("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, E(Head, { title: "Event", onBack: onBack }), E(Card, { pad: 20 }, E("div", { style: { color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontSize: 13 } }, "Loading…")));
    if (!ev) return E("div", { style: { display: "flex", flexDirection: "column", gap: 14 } }, E(Head, { title: "Event", onBack: onBack }), E(Card, { pad: 22 }, E("div", { style: { textAlign: "center", color: "var(--text-faint)", fontFamily: "var(--font-sans)", fontSize: 13 } }, "This event isn't available.")));
    const course = ev.course || {};
    const pars = course.pars || Array(course.holes || 18).fill(3);
    const N = pars.length;
    const isOwner = wk.ownerWhoami === me;
    const cards = ev.cards || {};
    const myCard = cards[me] || null;
    const checkedIn = !!myCard;
    const isFinal = ev.status === "final";
    const par = pars[hole];

    function checkIn() { window.ChainsWeekly.checkIn(weeklyId, eventId, me); }
    function setStroke(v) {
      const arr = wkToArr(myCard && myCard.holeScores).slice();
      arr[hole] = Math.max(1, v);
      window.ChainsWeekly.saveCard(weeklyId, eventId, me, arr, pars);
    }
    function curStroke() { const arr = myCard && myCard.holeScores; return arr && arr[hole] != null ? arr[hole] : par; }
    function finalize() {
      ChainsConfirm.show({ title: "Finalize this event?", message: "Standings update and it locks.", confirmLabel: "Finalize" }).then((ok) => { if (!ok) return; window.ChainsWeekly.finalize(weeklyId, eventId).then((r) => { if (r && r.ok) { if (window.ChainsToast) ChainsToast.show("Event final — standings updated"); } else if (window.ChainsToast) ChainsToast.show((r && r.err) || "Couldn't finalize", "error"); }); });
    }

    // live leaderboard from the event cards — FORMAT-AWARE (teams combined, handicap
    // netted) via the same engine finalize uses, so what you watch == what you get.
    const fmt = (wk && wk.format) || "singles";
    let board, teamMode = false;
    if (window.ChainsFormats && window.ChainsFormats.scoreEvent) {
      const res = window.ChainsFormats.scoreEvent(fmt, cards, { pars: pars, teams: ev.teams, teamNames: ev.teamNames });
      teamMode = res.mode === "team";
      board = res.rows.slice().filter((r) => r.thru > 0).sort((a, b) => a[res.sortKey] - b[res.sortKey]).map((r) => ({ who: r.key, name: r.name, disc: r.disc, total: (res.sortKey === "net" ? r.net : r.toPar), thru: r.thru, members: r.members }));
    } else {
      board = Object.keys(cards).map((k) => Object.assign({ who: k }, cards[k])).sort((a, b) => (a.total || 0) - (b.total || 0));
    }
    const result = ev.result || null;

    return E("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
      E("style", null, "@keyframes cwLivePulse{0%,100%{opacity:1}50%{opacity:.35}}"),
      E(Head, { title: wk.name, sub: new Date(ev.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) + " · " + course.name, onBack: onBack }),
      ev.notes ? E("div", { style: { padding: "10px 13px", borderRadius: "var(--radius-md)", background: "var(--gold-50, #fbf6e9)", border: "1px solid var(--gold-300, #e6cf86)", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--gold-800, #8a6d12)" } }, ev.notes) : null,
      // live leaderboard
      E("div", null,
        E("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 8 } },
          !isFinal ? E("span", { style: { width: 8, height: 8, borderRadius: "50%", background: "var(--live-500, #e0483d)", animation: "cwLivePulse 1.4s ease-in-out infinite" } }) : null,
          E("span", { style: { fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", fontSize: 11, color: isFinal ? "var(--text-muted)" : "var(--live-600, #c23a33)" } }, isFinal ? "Final results" : "Live leaderboard")),
        board.length === 0
          ? E(Card, { pad: 18 }, E("div", { style: { textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" } }, "Nobody's checked in yet."))
          : E(Card, { pad: 0 }, (result || board).map((p, i) => {
            const who = p.who, total = p.total || 0, thru = p.thru != null ? p.thru : (p.holeScores ? wkToArr(p.holeScores).filter((x) => x != null).length : 0);
            const prof = (p.name && p.disc) ? { name: p.name, disc: p.disc } : window.ChainsWeekly.profileFor(who);
            const place = result ? p.place : i + 1;
            return E("div", { key: who, style: { display: "flex", alignItems: "center", gap: 11, padding: "11px 15px", borderTop: i ? "1px solid var(--border-subtle)" : "none", background: who === me ? "var(--fairway-50)" : "transparent" } },
              E("span", { style: { width: 18, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: place === 1 ? "var(--gold-600, #b8902a)" : "var(--text-faint)" } }, place),
              E(Avatar, { name: prof.name, color: prof.disc, size: 26 }),
              E("span", { style: { flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 14, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, prof.name, who === me ? " (you)" : ""),
              result ? E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" } }, "+" + p.points + " pts") : E("span", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)" } }, "thru " + thru),
              E("span", { style: { minWidth: 38, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 18, color: wkParColor(total) } }, wkPar(total)));
          }))),
      // scorecard (mine) — same stepper UX as Go Throw
      !isFinal ? (!checkedIn
        ? E("button", { onClick: checkIn, className: "cw-press", style: { padding: "15px", borderRadius: "var(--radius-lg)", border: "none", background: "var(--fairway-600)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", fontSize: 16 } }, "Check in & join the card")
        : E("div", { style: { display: "flex", flexDirection: "column", gap: 12, padding: "14px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" } },
          E("div", { style: { textAlign: "center" } },
            E("div", { style: { fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", fontSize: 26, color: "var(--text-strong)", lineHeight: 1 } }, "Hole ", hole + 1, " ", E("span", { style: { fontSize: 14, color: "var(--text-faint)" } }, "of ", N)),
            E("div", { style: { fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-muted)", marginTop: 4 } }, "Par ", par)),
          E("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14 } },
            E("button", { onClick: () => setStroke(curStroke() - 1), className: "cw-press", style: wkStepBtn }, "−"),
            E("span", { style: { minWidth: 44, textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 30, color: wkParColor(curStroke() - par) } }, curStroke()),
            E("button", { onClick: () => setStroke(curStroke() + 1), className: "cw-press", style: wkStepBtn }, "+")),
          E("div", { style: { display: "flex", gap: 10 } },
            hole > 0 ? E(Button, { variant: "secondary", size: "lg", onClick: () => setHole((h) => h - 1) }, "← Back") : null,
            hole < N - 1 ? E(Button, { variant: "accent", full: true, size: "lg", onClick: () => setHole((h) => h + 1) }, "Next hole →") : E("div", { style: { flex: 1, textAlign: "center", padding: "13px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", fontSize: 13, color: "var(--fairway-700)" } }, "Last hole — owner finalizes")),
          // mini running card
          (() => { const arr = wkToArr(myCard && myCard.holeScores); const playedTo = arr.reduce((m, v, i) => v != null ? i : m, -1); if (playedTo < 0) return null; return E("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" } }, arr.slice(0, playedTo + 1).map((v, i) => { const d = v != null ? v - pars[i] : 0; const bg = v == null ? "var(--bg-sunken)" : d < 0 ? "var(--score-under, #1f8a5b)" : d > 0 ? "var(--score-over, #c23a33)" : "var(--bg-sunken)"; const fg = v != null && d !== 0 ? "#fff" : "var(--text-muted)"; return E("button", { key: i, onClick: () => setHole(i), style: { width: 28, height: 32, borderRadius: 6, border: i === hole ? "2px solid var(--ace-500)" : "1px solid var(--border-subtle)", background: bg, color: fg, cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 12 } }, v == null ? "·" : v); })); })())) : null,
      // finalize (owner)
      isOwner && !isFinal && board.length > 0 ? E("button", { onClick: finalize, style: { padding: "13px", borderRadius: "var(--radius-md)", border: "1px solid var(--clay-400, #d98b7a)", background: "transparent", color: "var(--clay-700, #8f2f1f)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 14 } }, "Finalize event & update standings") : null);
  };
})();
