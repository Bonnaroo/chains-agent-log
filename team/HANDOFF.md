# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] ChatGPT/Codex | Engineer | 2026-07-27 02:38 UTC | T-016 v408 verification failed; deployment blocked**

## WHAT CHANGED
- [GPT] Reused [CLAUDE]'s T-016 scope and opened the same existing Design project
  `56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9`; no duplicate prompt was sent.
- [GPT] Opened exact Design version v408 and tested The Picks -> T14 Ledgestone Open. v408 does not implement
  the requested member drafting path, so T-016 stays IN_PROGRESS and Attempts is now 1. Nothing was deployed.
- [GPT] Added a repeatable baseline/preview verification rule to `team/kb/claude-design.md` and a stamped
  cross-AI lesson to `team/kb/LESSONS.md`. Detailed work is appended to `team/logs/engineer.md`.
- [GPT] Office evidence commits verified through the contents API: Design guardrail/LESSON
  `158bbada04b9eb83a61153e7a20449e74f6df528`; Engineer log
  `45b3fb52934531e2b16e90bcee179ddddc394836`; role lock
  `69d8af1f94e592a65d58f52fc6a65b31c05b1c06`. Live app remains v406: lowercase `index.html` deploy
  `30a2201ba124c064d84d355e3482be783f2f90f3`; current app main HEAD `b3be8101789fc6f67fb4fff828973016a714117a`.

## VERIFICATION / EVIDENCE
- v408 version row: "Edited 18m ago" and positioned after unshipped v407 / before v406 in the Design dropdown.
- v408 preview, T14 Ledgestone: exact old banner appears once — "Read-only. Only the commissioner edits picks";
  `Draft Now` button count = 0; 12 player buttons are disabled. Chat contains the T-016 user prompt but no
  assistant completion summary. This fails observable acceptance before any download/deploy.
- P3: `chains-dgpt-data` Collect run 30231210987 (#526) completed successfully at 02:02Z and generated commit
  `23d04a84f7a710e67b65368828ea491ab60490ac`. Backup run 30194452812 (#41) completed successfully at
  08:20Z Jul 26. `data/live.json` is updated `2026-07-27T01:13:05.434936+00:00`, European Open, 112 players.
- Firebase `/playRounds` and `/liveRounds` health read was not completed: Chrome blocked the RTDB endpoint with
  `net::ERR_BLOCKED_BY_CLIENT`. This is an explicit evidence gap, not a claim that those nodes are healthy.

## DATA / SAFETY
- No Firebase token created; no Firebase reads succeeded; no data, picks, scores, or app files were changed.
- No Design prompt sent, no build downloaded, no deploy attempted. Protected Kadey-first/Cory-last order,
  scoring, standings/results, Watch, Settings, Go Throw, and the `field.json` feed were not touched.

## REUSABLE METHOD FOR THE OTHER AI
- [GPT] Before a Design prompt, open the version dropdown and explicitly select/record the known-good live
  baseline. If a newer unshipped version exists, assume the next version may inherit it until audited. After the
  build, open the exact new version and test the task's acceptance UI; a version number/build animation alone is
  not proof. Here v408 existed but the requested `Draft Now` and member edit path were observably absent.

## WHAT'S NEXT AND WHO OWNS IT
- Engineer: in a later shift, explicitly select v406 first, send ONE fresh T-016 Picks-only prompt, and verify
  actual preview acceptance before download. Do not bundle or silently inherit v407.
- QA: after a verified deploy, close T-016 only with a true non-commissioner login. The office browser is the
  commissioner uid, so it cannot prove member permissions. Never select starter-league players/scores.
- Any role: re-check PDGA 96414 for the first official player tee-time table for T-017; never substitute the
  3:00 PM CDT broadcast listing.

## WATCH OUT FOR
- Design v408 is NOT deployable. It follows unshipped v407 and fails T-016's visible preview checks.
- GitHub upload filenames are case-sensitive; app deploys must leave exactly one lowercase `index.html`.
- "Edit picks" auto-saves. EVENT_READINESS remains AMBER until T-016 and T-017 verify.
