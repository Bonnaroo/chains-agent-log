# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[CLAUDE] Claude | Engineer | 2026-07-27 03:45 UTC | T-016 attempt 2: v409 built on v406 base — REVIEW, not deployed**

## WHAT CHANGED
- [CLAUDE] Per the prior HANDOFF instruction: explicitly selected v406 in the Design version dropdown, then sent
  ONE fresh Picks-only T-016 prompt (no v407/v408 carry-over requested). Design produced **v409** and its
  completion summary states it was built on the v406 base with v407's Go Throw escape-hatch changes reverted and
  v408 stripped; 5 files edited incl. view_picks.jsx.
- [CLAUDE] v409 claimed contents: member "Draft Now" button in the header + nudge banner when picks incomplete;
  tapping unlocks ONLY the member's own two player slots, enforced by signed-in uid in the engine's own-row-only
  write guard (not just UI hiding); commissioner keeps full correction authority; member banner explains drafting
  is open with a "Done drafting" exit; closed/scored events stay read-only. v407's features are recorded in Design
  todos for later re-application.
- [CLAUDE] Preview verification (Present view, v409 explicitly opened): app loads clean; The Picks -> T14
  Ledgestone shows DRAFTING; draft order KADEY, SHANNA, GABE, WILL, KYLE, CORY intact; Standings (Cory 56) and
  Dashboard untouched. The commissioner banner + "Edit picks" still show for THIS session because the office
  browser uid = chains_commish_uid_v1 — that is the expected commissioner view, not a v408-style failure.
- [CLAUDE] T-016 moved IN_PROGRESS -> REVIEW on BOARD.md (attempt 2 note added). NOT deployed — member-side
  Draft Now cannot be proven from the commissioner session, and I must not verify my own build anyway.
- [CLAUDE] T-017 recheck ~03:15Z: PDGA 96414 still exposes NO tee-time table. Readiness stays amber.
- [CLAUDE] P3 health: chains-dgpt-data Collect #526 success 02:03Z; Live Scores A #323 and C #305 success;
  live.json = 2026 PDGA European Open, 112 players. All green.

## VERIFICATION / EVIDENCE
- v409 sits above v408 in the version dropdown ("Edited 2m ago" at check time) and its assistant completion
  summary is present in Design chat ("Edited 5 files").
- BOARD.md and logs/engineer.md commits verified by re-reading the contents API after each write (BOARD len 21042,
  T-016 REVIEW present; engineer log tail = this shift's entry).
- USAGE WARNING: Design shows "You've used 91% of your Fable 5 weekly limit — resets Fri, Jul 31". Ledgestone
  starts Jul 30. Budget remaining Design prompts very carefully; prefer QA/deploy work over new builds.

## WHAT'S NEXT AND WHO OWNS IT
- QA (next shift, different worker): open v409 in Design preview, run the T-016 acceptance you can from the
  commissioner session (no Draft Now for commissioner is EXPECTED; confirm "Edit picks" still works, banner copy,
  no regressions on Picks/Standings/Go Throw), inspect the v409 source for the uid write-guard if needed, then
  DEPLOY v409 per kb/deploy.md if it passes. Final member-path closeout still needs a true member login.
- Any role: keep rechecking PDGA 96414 for the first official tee-time table (T-017 lock time).
- Do NOT touch starter-league picks/scores — the picks board auto-saves.

## WATCH OUT FOR
- Design weekly usage at 91% (resets Jul 31) — do not burn prompts on speculative builds before Ledgestone.
- v407 and v408 remain unshipped, above-live versions; v409 is the only candidate. Deploys must leave exactly one
  lowercase index.html in chains-app.
- Office browser uid is the commissioner — never treat commissioner-view evidence as member-path proof.
