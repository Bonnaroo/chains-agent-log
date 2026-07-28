# LOG: qa (append a dated entry every shift; nobody else writes here)

- 2026-07-26 | office created; awaiting first qa shift.
- 2026-07-26 23:55 UTC | [CLAUDE] | QA shift (also fixed a dead deploy). (1) FOUND+FIXED: the 21:46Z "v406" deploy
  was committed as miscased `Index.html` (62e2a46) — GitHub Pages kept serving v405 (live index.html md5 identical
  to 1f22274). Verified v406 offline first (gzip-decompressed the Design bundle: Ledgestone feed wiring intact;
  only change vs v405 = "You have a live round open / round in progress" affordance; no betting strings beyond the
  dormant parity with v405; no editor harness; title OK), then deployed it to lowercase index.html (commit 30a2201)
  and deleted the stray Index.html (b3be810). Live site now serves 9,643,999 bytes, md5 98a498e3... = exact v406.
  (2) T-014 CLOSED: live app fetches data/field.json itself (resource timing, no cache-buster); Registered shows
  154 pros updated Jul 26 6:52 PM = the 22:52:22Z scheduled run for T14/96414; placeholders excluded; picks open.
  (3) T-015 CLOSED not-a-bug: live order KADEY...CORY matches Cory-won-Heinola ground truth.
  (4) FINDING for PM: as member WILL-C, "Edit picks" unlocks ALL members' players AND scores — no own-only
  restriction exists. Routed via BOARD T-014 note + HANDOFF. No picks/data changed; league/Firebase untouched.
- 2026-07-27 01:15 UTC | [CLAUDE] | T-016/T-017 evidence pass (live v406). CORRECTION: this office browser's Firebase uid equals
  chains_commish_uid_v1, so the signed-in "WILL-C" session IS the commissioner account — the 2026-07-26 23:55Z
  "regular member" edit-unlock proof was actually a commissioner session. True member-session permissions remain
  UNVERIFIED (needs a real member login). What IS proven from the UI alone: the read-only banner says "Only the
  commissioner edits picks" and there is no member-facing Draft Now entry, so the owner-directed member drafting
  path does not exist in v406 regardless of permissions — T-016 build still required. Entered and exited edit mode
  via DONE EDITING with ZERO changes; board confirmed back to Read-only; no console errors. T-017: re-fetched
  pdga.com/tour/event/96414 ~01:00Z — still NO tee-time table (page last updated 25-Jul-2026 19:20 CDT); MPO 156;
  lock deadline still unavailable, keep amber.

- 2026-07-27 04:30 UTC | [CLAUDE] | QA: v409 preview acceptance (commissioner-session scope) PASS — Picks/Standings/Go Throw/dash intact, Edit picks + Done Editing work, 0 console errors. Then deployed v409 per kb/deploy.md: chains-app commit 94a95a2, one lowercase index.html 9,644,611 B (md5 8b077e9c), Pages serving full build (curl 200). T-016 stays REVIEW pending true-member-login closeout of the own-slots uid write guard. Evidence in BOARD T-016 note + HANDOFF.
- 2026-07-27 05:10 UTC | [CLAUDE] | QA data-health pass (T-009/T-017 support, read-only shift — token file still placeholder, browser commits only, LOCK left FREE). FINDING (P1 for Engineer/PM): field.json (updated 02:03Z) is STALE vs live PDGA 96414 — Thomas Earhart no longer in PDGA MPO registration (withdrawn) but still in the draftable pool; Kayleb Gillmore (#245013) now registered but MISSING from the pool. Name-normalized diff; other 12 diffs were name variants (Alex/Alexander etc). 154 pool vs 156 PDGA header = 2 rows without PDGA numbers (Gracen Lomelino, Chris Reliford) — expected. T-017 still blocked: NO tee-time table on PDGA (fresh 05:05Z fetch); no Withdrawn section (earlier WD greps = cookie-banner markup). Collector health: collect.yml active, ~hourly, last success 02:02Z at 05:05Z check — slightly overdue, watch for stall. NEXT SHIFT: verify a fresh collect run drops Earhart + adds Gillmore; if not, collector source lags PDGA and Engineer must fix before Ledgestone lock.

- 2026-07-28 19:55 UTC | [CLAUDE] | QA verification pass on today's Engineer deploy (v411, commit 202fd4b9,
  live at bonnaroo.github.io/chains-app). Chose live-verification per priority order since Engineer log
  showed a deploy today; Data lane log 404s (no team/logs/data.md file exists in repo — nothing to
  spot-check there this shift). RESULT: FAIL. Go Throw solo-round start works (matches T-001's claimed
  "solo instant-start" feature — no invite required, course picker has a back/way-out). But the round
  Discard control (both the in-round "Discard round" link and the "Resume round in progress" card's X icon
  on the Go Throw home) hangs the browser tab for 30+ seconds on click (CDP dispatch timeout) and does NOT
  actually discard the round — reproduced 3/3 times; a Johnson Park round is now stuck permanently in
  "resume" state on the live WILL account. This reproduces ROADMAP's anchor BLOCKER gap (stuck open round,
  no working cancel) even though a Discard control now exists in the UI — so the control was BUILT but is
  non-functional. Console showed a "using the in-browser Babel transformer, precompile for production"
  warning on the live site, a plausible root cause and also a red flag: earlier QA shifts (07-26/07-27)
  explicitly verified deploys had "no editor harness" before shipping; v411 looks like it may not be a
  precompiled production bundle. Filed as T-018 BLOCKER on BOARD_QA.md for Design/Engineer. Also
  re-escalating T-014 (edit-picks over-broad unlock, first flagged 07-26) which has now gone 4 shifts
  (07-26, 07-27 x2, 07-28) with no fix and no explicit deprioritization from PM/Engineer — per LANES.md
  this repeat-flag is a hard-stop signal, not a routine note, so escalating explicitly this run rather than
  re-noting quietly. No app code, no Firebase data, no other lane's files touched; left one test round stuck
  in WILL's Go Throw history as evidence (Johnson Park, hole 1, unscored) — flagged in BOARD_QA T-018 for
  whoever fixes the discard bug to clean up, since QA cannot write to Firebase or app code.
