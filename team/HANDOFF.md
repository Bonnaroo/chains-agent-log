# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] GPT | CEO | 2026-07-27 05:32 UTC | T-009: repair stale Ledgestone roster + unblock T-016 access**

## WHAT CHANGED
- [GPT] Reused [CLAUDE]'s 05:10 QA comparison instead of repeating it. Claude proved the 02:03Z T14 draft feed
  was stale against PDGA: withdrawn Thomas Earhart remained; new registrant Kayleb Gillmore (#245013) was missing;
  the last scheduled collector run was #526 at 02:02Z.
- [GPT] Confirmed the stale blobs, inspected `.github/workflows/collect.yml` (`*/15` schedule), then manually
  dispatched the existing `Collect DGPT Data` workflow with event input `96414`. Run 30239662932 (#527) completed
  all 21 steps successfully from base `23d04a84f7a710e67b65368828ea491ab60490ac` and generated data commit
  `5e643c00e5511b70b41438ee5b60c465c58c9ef6`.
- [GPT] Updated `team/BOARD.md`, `EVENT_READINESS.md`, `TO_OWNER.md`, and opened the precise T-016 owner sign-in
  question in `INBOX.md` at office commit `355c375c9ed192b37b70921d01dce0ea15713ed2`. Updated
  `kb/LESSONS.md` + `kb/testing.md` at `12dc49799855ddac388e88e7a985cf52a7f06e2e`; logged the CEO shift at
  `a5da34e0341dabb9fa369fb3a80e3f363f234033`; added the GitHub attribution safeguard to `kb/github.md` and
  LESSONS at `6e9279882001398e960f687b685451f29afc4cba`.

## VERIFICATION / EVIDENCE
- [GPT] Before run #527: `field.json` blob `c3ab164` and event blob `cbfb654`, both 02:03Z, still contained
  Earhart and omitted Gillmore. Actions showed no scheduled run for 3h22m despite the configured `*/15` cadence.
- [GPT] After generated commit `5e643c0`: `data/field.json` blob
  `334569b26d56d331601e9761bea397c6877eddbf` = T14/96414, updated 05:24:59Z, 156 entrants, 154 PDGA-numbered
  plus Gracen Lomelino and Chris Reliford unnumbered; Earhart absent; Gillmore #245013 present.
  `data/events/96414-MPO.json` blob `e7933f96261e1a8813976720bd7d73e33ed16b7c` = 156 entrants, collected
  05:24:43Z, with the same Earhart/Gillmore correction.
- [GPT] The correction proves the collector follows current registration/WD state when run. It does not prove
  the live app refreshed or that scheduled recurrence recovered. T-009 therefore remains IN_PROGRESS/AMBER.

## DATA / SAFETY
- [GPT] Only the existing public `chains-dgpt-data` workflow wrote generated `data/field.json` and
  `data/events/96414-MPO.json`. No manual data-file edit, Firebase node, league, pick, score, round, user,
  `chains-fantasy /league`, App A build, or Design version changed. No deletion or backup path applies.
- Confirmed-good KADEY-first/CORY-last order, Watch, Settings, standings, scoring, and betting-removed state were
  not touched.

## REUSABLE METHOD FOR THE OTHER AI
- [GPT] Improved the existing collector check: when the other AI has a fresh primary-source roster diff and the
  scheduled job is overdue, reuse that diff, dispatch `Collect DGPT Data` with the single event ID, and record
  run/base/generated SHAs plus both artifact blobs. Call data repaired only after the entrants change; keep
  recurrence amber until a later genuine `schedule` run preserves it.
- [GPT] GitHub edit dialogs may overwrite a filled commit summary after delayed Copilot generation. Wait for it
  to settle, fill the exact worker-stamped message, wait again, visibly re-read the textbox, then commit.

## WHAT'S NEXT AND WHO OWNS IT
- QA: on the live Registered/Picks view, verify the dynamic list now shows the corrected 156-entry feed, Earhart
  is absent, and Gillmore is present. Do not select any player or change any score.
- CEO: verify the next genuine `schedule`-triggered collector run after 05:24Z succeeds and preserves the roster.
  If the schedule stays silent, keep readiness amber and have PM route a reliability fix; do not treat #527 as
  recurrence proof.
- Guillermo/owner: sign the existing Chrome session into a true non-commissioner Founders League account without
  sharing a password; the precise request is OPEN in `team/INBOX.md`.
- QA/PM after owner sign-in: close T-016 only after live v409 shows Draft Now and enables only that member's two
  slots, without selecting an auto-saving pick. Engineer still owns T-017 official first-tee lock/auto-open work.

## WATCH OUT FOR
- The roster is correct now, but the nominal `*/15` schedule missed at least 3h22m. Manual run #527 is a backstop,
  not evidence the scheduler recovered.
- Current PDGA/collector roster shape is 156 entrants = 154 numbered + two unnumbered real rows; do not reapply
  the earlier assumption that the final two are Sunday Qualifier placeholders without fresh source evidence.
- No official PDGA tee-time table exists yet; never substitute DGPT's 3:00 PM broadcast time for the lock.
- The only current office app identity is commissioner uid `chains_commish_uid_v1`; it cannot prove T-016.
- Lock content was stamped GPT, but GitHub's delayed generated message overwrote summaries on claim commits
  `fadfefb` and `9377a48`. The release commit must be visibly rechecked for `[GPT]` before clicking Commit.
