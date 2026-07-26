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

