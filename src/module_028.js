/* Chains app — Past-event archive board. window.ArchiveBoard
   Given a slot (t), shows the FULL FIELD hole-by-hole for a completed event,
   round by round, with our drafted pros highlighted. Read-only:
   Source 2 (Firebase /rounds_index + /rounds) for hole scores.
   Reuses the same player shape as the Live Course. */
(function () {
  var FB = "https://chains-fantasy-default-rtdb.firebaseio.com";

  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, " "); }
  function flk(s) { var w = norm(s).split(" ").filter(Boolean); return w.length >= 2 ? w[0] + " " + w[w.length - 1] : norm(s); }
  function getJSON(u) { return fetch(u, { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { try { return JSON.parse(t); } catch (e) { return null; } }); }

  function parseRow(p, pars) {
    var scores = Array.isArray(p.hole_scores) ? p.hole_scores.map(function (x) { return (x == null || String(x).trim() === "") ? null : Number(x); }) : [];
    return { pdga: p.pdga != null ? String(p.pdga) : null, name: p.name || "", norm: norm(p.name), short: p.short || p.name,
      scores: scores, pars: pars, toPar: p.round_to_par != null ? Number(p.round_to_par) : null,
      place: p.place, completed: p.completed === true || p.completed == 1 };
  }

  function ArchiveBoard(props) {
    var t = props.t, mobile = props.mobile;
    var eventId = window.ChainsProStats ? String(window.ChainsProStats.resultsIdForSlot(t) || "") : "";
    var ref = React.useState(null), idx = ref[0], setIdx = ref[1];
    var rc = React.useState({}), cache = rc[0], setCache = rc[1];
    var vrS = React.useState(null), vr = vrS[0], setVr = vrS[1];
    var st = React.useState("loading"), status = st[0], setStatus = st[1];
    var hf = React.useState("f9"), half = hf[0], setHalf = hf[1];
    var holeRange = half === "f9" ? [0, 9] : half === "b9" ? [9, 18] : [0, 18];
    var hi0 = holeRange[0], hi1 = holeRange[1], hN = hi1 - hi0;

    // our drafted pros for this event → highlight + member color
    var ourByKey = React.useMemo(function () {
      var map = {};
      function add(key, mem) { if (!key) return; (map[key] = map[key] || []).push(mem); }
      var nameToPdga = {}; (window.MPO_PLAYERS || []).forEach(function (mp) { if (mp.pdga != null) nameToPdga[flk(mp.name)] = String(mp.pdga); });
      if (props.leaguePicks && props.leaguePicks.length) {
        props.leaguePicks.forEach(function (tm) {
          (tm.picks || []).forEach(function (nm) {
            if (!nm) return; var mem = { name: tm.name, disc: tm.color };
            add("f" + flk(nm), mem); var pd = nameToPdga[flk(nm)]; if (pd) add("p" + pd, mem);
          });
        });
        return map;
      }
      var picks = ChainsEngine.picksFor(t) || [];
      picks.forEach(function (pk) {
        var mem = ChainsEngine.member(pk.m);
        [pk.p1, pk.p2].forEach(function (nm) { if (!nm) return; add("f" + flk(nm), mem); var pd = nameToPdga[flk(nm)]; if (pd) add("p" + pd, mem); });
      });
      return map;
    }, [t, props.leaguePicks]);
    var ownersOf = function (p) {
      var a = (p.pdga && ourByKey["p" + p.pdga]) || ourByKey["f" + flk(p.name)] || [];
      var seen = {}, out = []; a.forEach(function (mm) { var k = mm.name + "|" + mm.disc; if (!seen[k]) { seen[k] = 1; out.push(mm); } }); return out;
    };
    var ownerOf = function (p) { var a = ownersOf(p); return a.length ? a[a.length - 1] : null; };

    React.useEffect(function () {
      if (!eventId) { setStatus("none"); return; }
      getJSON(FB + "/rounds_index/" + eventId + ".json").then(function (j) {
        if (j && j.rounds_list && j.rounds_list.length) { setIdx(j); setVr(j.rounds_list[0].n); setStatus("ready"); }
        else setStatus("none");
      }).catch(function () { setStatus("none"); });
    }, [eventId]);

    React.useEffect(function () {
      if (vr == null || !idx) return;
      var item = idx.rounds_list.find(function (r) { return r.n === vr; });
      if (!item || cache[vr]) return;
      getJSON(FB + "/rounds/" + item.key + ".json").then(function (rd) {
        if (!rd || !rd.players) { setCache(function (c) { var n = Object.assign({}, c); n[vr] = "none"; return n; }); return; }
        var pars = (rd.holes || []).map(function (h) { return h.par != null ? Number(h.par) : null; });
        var rows = rd.players.map(function (p) { return parseRow(p, pars); });
        setCache(function (c) { var n = Object.assign({}, c); n[vr] = { rows: rows, pars: pars }; return n; });
      }).catch(function () { setCache(function (c) { var n = Object.assign({}, c); n[vr] = "none"; return n; }); });
    }, [vr, idx]);

    // Full-tournament total per player = sum of round_to_par across ALL rounds
    // (same number the Picks screen shows), independent of the selected round tab.
    var tt = React.useState(null), totals = tt[0], setTotals = tt[1];
    React.useEffect(function () {
      if (!idx || !idx.rounds_list || !idx.rounds_list.length) return;
      var alive = true;
      Promise.all(idx.rounds_list.map(function (it) { return getJSON(FB + "/rounds/" + it.key + ".json"); })).then(function (rounds) {
        if (!alive) return;
        var map = {};
        rounds.forEach(function (rd) {
          if (!rd || !rd.players) return;
          var pars = (rd.holes || []).map(function (h) { return h.par != null ? Number(h.par) : null; });
          rd.players.forEach(function (p) {
            var rtp = p.round_to_par != null ? Number(p.round_to_par) : null;
            if (rtp == null && Array.isArray(p.hole_scores)) { var s = 0, ok = false; p.hole_scores.forEach(function (x, i) { var v = (x == null || String(x).trim() === "") ? null : Number(x); if (v != null && pars[i] != null) { s += v - pars[i]; ok = true; } }); rtp = ok ? s : null; }
            if (rtp == null) return;
            if (p.pdga != null) { var pk = "p" + p.pdga; map[pk] = (map[pk] || 0) + rtp; }
            var fk = "f" + flk(p.name); map[fk] = (map[fk] || 0) + rtp;
          });
        });
        setTotals(map);
      }).catch(function () {});
      return function () { alive = false; };
    }, [idx]);

    if (status === "loading") return React.createElement("div", { style: { padding: "18px 4px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" } }, "Loading full field…");
    if (status === "none") return React.createElement("div", { style: { padding: "16px 4px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, "Full-field hole-by-hole isn't archived for this event.");

    var data = cache[vr];
    var fmt = function (v) { return v == null ? "—" : v === 0 ? "E" : v > 0 ? "+" + v : String(v); };
    var col = function (v) { return v == null ? "var(--text-faint)" : v < 0 ? "var(--fairway-700)" : v > 0 ? "var(--clay-600, #b4452f)" : "var(--text-strong)"; };
    var totalOf = function (p) { if (!totals) return null; var v = (p.pdga != null) ? totals["p" + p.pdga] : undefined; if (v == null) v = totals["f" + flk(p.name)]; return v == null ? null : v; };
    function cell(s, par) {
      if (s == null) return React.createElement("span", { style: { color: "var(--border-default)" } }, "·");
      var d = par != null ? s - par : 0;
      var bg = d <= -2 ? "var(--ace-500)" : d === -1 ? "var(--fairway-500)" : d === 0 ? "transparent" : d === 1 ? "var(--clay-500, #c96a4f)" : "var(--clay-700, #8f3320)";
      var fg = d === 0 ? "var(--bone-50)" : "#fff";
      return React.createElement("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 19, height: 19, borderRadius: d === 0 ? 0 : "50%", background: bg, color: fg, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 11 } }, s);
    }

    // round tabs
    var tabsHint = React.createElement("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--text-faint)", marginBottom: 6 } }, "Tap a round to see that day's scores · Front 9 / Back 9 fits the phone");
    var tabs = React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 } },
      idx.rounds_list.map(function (r) {
        var on = r.n === vr;
        return React.createElement("button", { key: r.n, onClick: function () { setVr(r.n); }, style: { height: 28, padding: "0 12px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, cursor: "pointer" } }, mobile ? r.abbr : r.label);
      }));

    if (!data) return React.createElement("div", null, tabs, React.createElement("div", { style: { padding: "14px 4px", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-faint)" } }, "Loading round…"));
    if (data === "none") return React.createElement("div", null, tabs, React.createElement("div", { style: { padding: "14px 4px", fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--text-faint)" } }, "This round isn't archived."));

    var rows = data.rows.slice().sort(function (a, b) {
      var pa = a.place == null ? 9999 : Number(a.place), pb = b.place == null ? 9999 : Number(b.place);
      if (pa !== pb) return pa - pb;
      return (a.toPar == null ? 999 : a.toPar) - (b.toPar == null ? 999 : b.toPar);
    });

    var head = React.createElement("tr", { style: { background: "var(--bg-ink)" } },
      [React.createElement("th", { key: "p", style: { position: "sticky", left: 0, background: "var(--bg-ink)", textAlign: "left", padding: "7px 9px", fontFamily: "var(--font-display)", fontWeight: 600, textTransform: "uppercase", fontSize: 9, color: "var(--chain-400)", zIndex: 1 } }, "Player")]
        .concat(Array.from({ length: hN }, function (_, k) { var i = hi0 + k; return React.createElement("th", { key: i, style: { padding: "7px 3px", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--chain-400)", minWidth: 20 } }, i + 1); }))
        .concat([React.createElement("th", { key: "tot", style: { padding: "7px 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 9, color: "var(--ace-400)" } }, "RND"), React.createElement("th", { key: "total", style: { padding: "7px 10px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 9, color: "var(--gold-500)", background: "var(--bg-ink)" } }, "TOTAL")]));

    var body = rows.map(function (p, ri) {
      var owners = ownersOf(p); var owner = owners.length ? owners[owners.length - 1] : null;
      var dotEl = (props.leaguePicks && owners.length)
        ? React.createElement("span", { style: { display: "inline-flex", gap: 2, flexShrink: 0 } }, owners.map(function (o, oi) { return React.createElement("span", { key: oi, title: o.name + "'s pick", style: { width: 8, height: 8, borderRadius: "50%", background: o.disc } }); }))
        : (owner ? React.createElement("span", { title: owner.name + "'s pick", style: { width: 8, height: 8, borderRadius: "50%", background: owner.disc, flexShrink: 0 } }) : React.createElement("span", { style: { width: 8, flexShrink: 0 } }));
      var cells = [React.createElement("td", { key: "n", style: { position: "sticky", left: 0, background: owner ? "var(--fairway-50)" : "var(--bg-elevated)", padding: "6px 9px", borderRight: "1px solid var(--border-subtle)" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } },
          dotEl,
          React.createElement("span", { style: { fontFamily: "var(--font-sans)", fontWeight: owner ? 700 : 500, fontSize: 11.5, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 92, display: "inline-block" } }, p.short || p.name)))];
      cells = cells.concat(Array.from({ length: hN }, function (_, k) { var i = hi0 + k; return React.createElement("td", { key: i, style: { textAlign: "center", padding: "6px 2px" } }, cell(p.scores[i], p.pars[i])); }));
      cells.push(React.createElement("td", { key: "tot", style: { textAlign: "center", padding: "6px 8px", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12.5, color: col(p.toPar) } }, fmt(p.toPar)));
      cells.push(React.createElement("td", { key: "total", style: { textAlign: "center", padding: "6px 10px", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 13, color: col(totalOf(p)), background: "var(--bg-sunken)" } }, fmt(totalOf(p))));
      return React.createElement("tr", { key: ri, style: { borderTop: "1px solid var(--border-subtle)", background: owner ? "var(--fairway-50)" : "transparent" } }, cells);
    });

    var halfToggle = React.createElement("div", { style: { display: "flex", gap: 5, marginBottom: 9 } },
      [["f9", "Front 9"], ["b9", "Back 9"], ["all", "All 18"]].map(function (o) {
        var on = half === o[0];
        return React.createElement("button", { key: o[0], onClick: function () { setHalf(o[0]); }, style: { flex: 1, padding: "7px 8px", borderRadius: "var(--radius-sm)", border: "1px solid " + (on ? "var(--fairway-500)" : "var(--border-default)"), background: on ? "var(--fairway-600)" : "var(--bg-elevated)", color: on ? "#fff" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", fontSize: 11, cursor: "pointer" } }, o[1]);
      }));

    return React.createElement("div", null, tabsHint, tabs, halfToggle,
      React.createElement("div", { style: { overflowX: "auto", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" } },
        React.createElement("table", { style: { borderCollapse: "collapse", width: "100%" } },
          React.createElement("thead", null, head),
          React.createElement("tbody", null, body))),
      React.createElement("div", { style: { fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-faint)", marginTop: 6 } }, data.rows.length + " players · your pros highlighted"));
  }

  window.ArchiveBoard = ArchiveBoard;
})();
