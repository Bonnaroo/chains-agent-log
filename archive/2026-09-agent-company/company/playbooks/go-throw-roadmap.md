# Go Throw — Feature Roadmap (from competitor research, 2026-08-02)

Source: owner-directed research pass across UDisc, PDGA Live, Tjing, Disc Golf Metrix, 18Birdies, TheGrint,
Hole19, Golfshot, Garmin Golf, Arccos — app store listings, marketing sites, docs, and real user reviews.
Full research is preserved in this file; Dispatcher should use this for STEP 3 (Product Review) while the
Go Throw priority is active. Do not treat this as a spec to build all at once — work top to bottom, first
release before anything else.

## Positioning
Chains should not market Go Throw as "fantasy disc golf with scorecards." Target framing:
"Follow your pros. Battle your friends. Track your own game." — three sides of the product: pro tournament
following, fantasy competition, and the user's own disc golf, tied together (see Fantasy Impact below).

## What competitors do well (reference table)
- UDisc: fast scoring, course maps, round history, disc bag, throw measuring, course traffic/conditions.
- PDGA Live: multiple scorekeepers, discrepancy warnings, favorite-player tracking.
- Tjing: live hole-by-hole ratings, throw-by-throw stats, live followers, scoring verification.
- Disc Golf Metrix: tours, weekly series, handicaps, bag tags.
- 18Birdies: historical hole insights, AI analysis, side games, skill comparisons.
- TheGrint: group scoring, scorecard-photo import, friend rankings.
- Hole19: LivePlay, course preview, voice commands, auto hole advancement.
- Golfshot: automated tracking, post-round replay, strokes-gained analysis.
- Garmin Golf: weekly leaderboards, user tournaments, live chat, shot maps.
- Arccos: automatic shot capture, personalized benchmarks, AI strategy.

## Known failure modes to design around (from real user reviews — avoid these)
1. Too many taps in default scoring — advanced stats must never slow down quick scoring.
2. Inconsistent stat entry (e.g. putts exceeding hole score) — needs validation/reconciliation.
3. Accidental editing of historical rounds — historical scorecards should open read-only; explicit "Edit round" required.
4. Losing a live round after a crash/reconnect — needs autosave every action, offline copy, clear sync indicator,
   "resume active round" (Chains already fixed the resume-without-restart bug — this is the same class of issue).
5. Watch sync jumping to old holes (future risk once/if watch support is built — server state must be authoritative).
6. Confusing subscription tiers — be explicit about what's locked before asking for payment.
7. Incorrect course layouts with no correction path — need a report-a-correction flow with verification status,
   without silently rewriting completed historical rounds.

## Build order

### First release — make Go Throw excellent at the core
- Fast personal scorecard: quick-tap scoring, defaults to par, one tap per player per hole in the common case.
- Resume an active round from any device (server-authoritative state, not local-only) — extends the existing
  resume-in-place fix; ties directly into Issue #31 (sync bug) since resume depends on the cloud copy being real.
- Registered players + guest players on a round.
- Live share link / join code for a round.
- Simple stats + OB tracking (optional layer, never blocking quick scoring).
- Fantasy Impact on live scoring events — e.g. "Gannon Buhr birdies Hole 12 → Guillermo +4.5 pts, takes the lead."
  This is the single most differentiated idea in the whole research pass — no competitor connects tournament
  scoring directly to fantasy standings in real time. High priority.
- Favorite-player / fantasy-roster alerts (player started, moved into top 10, ace/eagle, OB, lead change).
- Automatic personal + fantasy round recaps (best hole, worst hole, birdie streak, "what decided the matchup").
- Score verification (player confirms, optional second scorekeeper, discrepancy warning, locked final scorecard).
- Read-only historical scorecards with explicit "Edit round" action required to change anything.

### Second release — social and competitive
Friends/private groups, live chat/reactions, achievements, monthly challenges, bag-tag competitions, side
games (skins, match play, wolf, birdie bounty, ace pool), public/private leaderboards, course condition
reporting (mud/water, mowed, basket changes, closures — reports should expire unless reconfirmed), course
notes/hole history, shareable recap cards.

### Later / premium
Full throw-by-throw map tracking + visual replay, advanced comparisons/trends, skill benchmarks, AI round
analysis, scorecard-photo import, voice scoring, watch scoring (explicitly: do not build until phone scoring
is rock solid — this is where competitors get the most negative reviews), advanced league admin/custom scoring.

## Immediate next actions (filed as Issues)
See GitHub Issues tagged [Go Throw][roadmap] in chains-agent-log for the first concrete, scoped build items
pulled from this list.
