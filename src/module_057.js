/* ============================================================
   CHAINS — "Chains rating" for Go Throw rounds. window.ChainsRating
   A casual, UDisc-style estimate (NOT an official PDGA number).

   Same SHAPE as the PDGA formula:
       roundRating = 1000 + (baseline − yourScore) × pointsPerThrow
   where:
   • baseline = your crew's expected even score on that layout. Starts at
     course PAR and self-calibrates toward your group's scoring AVERAGE there
     as rounds accumulate (small-data stand-in for UDisc's per-hole score
     distribution). More crew rounds → better baseline.
   • pointsPerThrow ≈ how much a stroke is worth, by difficulty. PDGA bands:
     SSA ~44→13 · ~50→10 · ~53→10 · ~61→7.5 · ~68→6 (interpolated).
   • NO weather factor — conditions are baked into the expected baseline, not
     added on (matches how PDGA/UDisc actually work).

   Overall player rating = UDisc rule: the BEST 8 of your last 20 rounds
   (or the top 40% when you have fewer than 20). Rewards your good rounds,
   forgives the blow-ups. Only FULL rounds are rated.
   ============================================================ */
(function () {
  // pointsPerThrow from the PDGA difficulty bands, by 18-hole baseline (SSA-like).
  function pointsPerThrow(baseline18) {
    var pts = [[44, 13], [50, 10], [53, 10], [61, 7.5], [68, 6]];
    if (baseline18 <= pts[0][0]) return pts[0][1];
    if (baseline18 >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
    for (var i = 1; i < pts.length; i++) {
      if (baseline18 <= pts[i][0]) { var a = pts[i - 1], b = pts[i]; return a[1] + (baseline18 - a[0]) / (b[0] - a[0]) * (b[1] - a[1]); }
    }
    return 10;
  }

  // Self-calibrating baseline for a course: blends par toward the crew's scoring
  // average there. nRounds bigger → trust the group average more (smoothing K=5).
  function courseBaseline(parTotal, groupAvgStrokes, nRounds) {
    if (parTotal == null) return groupAvgStrokes != null ? groupAvgStrokes : 54;
    if (groupAvgStrokes == null || !nRounds) return parTotal;
    var w = nRounds / (nRounds + 5);
    return parTotal * (1 - w) + groupAvgStrokes * w;
  }

  // Firebase returns sparse arrays as objects — restore, scores kept at their hole index.
  function toArr(hs) { if (Array.isArray(hs)) return hs; if (!hs || typeof hs !== "object") return []; var out = []; Object.keys(hs).forEach(function (k) { var i = Math.floor(Number(k)); if (isFinite(i) && i >= 0) out[i] = hs[k]; }); for (var j = 0; j < out.length; j++) if (out[j] === undefined) out[j] = null; return out; }
  function holesOf(round, key) {
    var hs = null;
    if (round.players && round.players[key]) hs = round.players[key].holeScores;
    else if (round.hole_scores && round.hole_scores[key]) hs = round.hole_scores[key];
    return hs != null ? toArr(hs) : null;
  }

  // Rating for ONE player's FULL round. opts.baseline (total strokes expected for
  // the round's holes) overrides the par default — pass the self-calibrated value
  // when you have the crew's history. Returns { rating, toPar, holes, baseline, ppt } or null.
  function roundRating(round, key, opts) {
    if (!round) return null;
    var course = round.course || {};
    var hs = holesOf(round, key); if (!hs) return null;
    var pars = course.pars || round.pars || null;
    var N = course.holes || (pars ? pars.length : hs.length);
    var strokes = 0, parSum = 0, played = 0;
    for (var i = 0; i < N; i++) { var s = hs[i]; if (s == null) continue; var p = (pars && pars[i] != null) ? pars[i] : 3; strokes += s; parSum += p; played++; }
    if (played < N) return null;                  // partial round — not rated
    // v511: the 1000-rated line is NOT par. A 1000-rated player shoots well under par on a short
    // course, so the baseline is what such a player would expect on these holes: from hole lengths
    // when we have them (≈1.9 + 0.0024/ft per hole → ~2.45 on a 230 ft hole, ~3.3 on 600 ft), else
    // by par (par 3 → 2.65, par 4 → 3.55, par 5 → 4.55). course.ssa (total) overrides everything.
    var lens = course.hole_lengths || round.hole_lengths || null;
    var expected = 0;
    for (var j = 0; j < N; j++) {
      var L = lens && lens[j] > 0 ? lens[j] : null, pj = (pars && pars[j] != null) ? pars[j] : 3;
      expected += L ? Math.max(1.9, Math.min(pj + 0.3, 1.9 + L * 0.0024)) : (pj >= 5 ? 4.55 : pj === 4 ? 3.55 : 2.65);
    }
    // v512: per-course calibration — course.rating = { ssa, ppt } (or legacy course.ssa). When a course
    // is pinned we trust it over the length model. Default points-per-throw is steeper than the PDGA
    // bands (×1.35): casual short-course rounds were reading too high next to UDisc.
    var cal = course.rating || {};
    var ssaTotal = (cal.ssa > 0) ? cal.ssa : (course.ssa > 0 ? course.ssa : null);
    var baseline = ssaTotal ? ssaTotal * N / (course.holes || N) : (opts && opts.baseline != null) ? opts.baseline : expected;
    var baseline18 = baseline * 18 / N;
    var ppt = (cal.ppt > 0) ? cal.ppt : pointsPerThrow(baseline18) * 1.35;
    var diff18 = (baseline - strokes) * 18 / N;   // normalize to an 18-hole swing
    var rating = Math.round(1000 + diff18 * ppt);
    return { rating: rating, toPar: strokes - parSum, holes: played, baseline: Math.round(baseline * 10) / 10, ppt: Math.round(ppt * 10) / 10 };
  }

  // Overall player rating — best 8 of your last 20 (top 40% if fewer than 20).
  // `rounds` = round records (any shape); ratings computed with the par baseline
  // unless a baselineFor(round) callback supplies the self-calibrated one.
  function playerRating(rounds, key, baselineFor) {
    var rated = [];
    (rounds || []).forEach(function (r) {
      var opts = baselineFor ? { baseline: baselineFor(r) } : null;
      var rr = roundRating(r, key, opts);
      if (rr) rated.push({ rating: rr.rating, at: r.updatedAt || r.startedAt || r.date || "" });
    });
    if (!rated.length) return null;
    rated.sort(function (a, b) { return (b.at || "").localeCompare(a.at || ""); });
    var last20 = rated.slice(0, 20);
    var keep = last20.length >= 20 ? 8 : Math.max(1, Math.ceil(last20.length * 0.4));
    var best = last20.slice().sort(function (a, b) { return b.rating - a.rating; }).slice(0, keep);
    var avg = best.reduce(function (s, x) { return s + x.rating; }, 0) / best.length;
    return { rating: Math.round(avg), n: rated.length, counted: best.length };
  }

  function tier(rating) {
    if (rating == null) return "";
    if (rating >= 1000) return "Touring pro line";
    if (rating >= 950) return "Advanced";
    if (rating >= 900) return "Intermediate";
    if (rating >= 850) return "Recreational";
    if (rating >= 780) return "Weekend warrior";
    return "Getting reps";
  }

  window.ChainsRating = { roundRating: roundRating, playerRating: playerRating, tier: tier, pointsPerThrow: pointsPerThrow, courseBaseline: courseBaseline };
})();
