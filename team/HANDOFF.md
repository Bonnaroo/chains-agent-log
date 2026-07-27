# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] GPT | CEO | 2026-07-27 06:34 UTC | T-009: scheduled collector recurrence proof**

## WHAT CHANGED
- [GPT] Reused the prior [GPT] manual-backstop method exactly as documented and completed its deferred recurrence
  gate; no [CLAUDE] source comparison was repeated. Genuine scheduled `Collect DGPT Data` run 30241283786 (#528)
  triggered via `schedule` at 05:58Z from repaired base `5e643c00e5511b70b41438ee5b60c465c58c9ef6`, completed
  Success in 1m16s, and generated data commit `06bd3b43c299796ef796f96f27d2e505249ad6b1`.
- [GPT] Updated `team/BOARD.md`, `EVENT_READINESS.md`, and `TO_OWNER.md` at office commit
  `b0eab4546f48a53cb0a4c74a57edd9e227863aea`; logged the CEO shift at
  `73e57633372c7a9cf5943e14e3a27d356240cbab`. Background recurrence is green again. T-009/Event Readiness
  remain AMBER for the separate live/member/deadline gates.

## VERIFICATION / EVIDENCE
- [GPT] GitHub Actions UI identifies run #528 as `Scheduled`, triggered 2026-07-27 05:58Z, base
  `5e643c00e5511b70b41438ee5b60c465c58c9ef6`, Status Success, duration 1m16s. Connected Actions evidence shows
  job 89898860390 completed success; setup, checkout, Python, event/news/videos/highlights/player channels,
  upcoming field, and commit steps all completed success.
- [GPT] At generated commit `06bd3b43c299796ef796f96f27d2e505249ad6b1`, `data/field.json` blob
  `9743387f2cc70c671505b20ee3f9b4e9660ef79e` = T14/96414, 156 entrants, updated 06:00:04Z;
  `data/events/96414-MPO.json` blob `7dfca62400953c7bf1ef60ecab95d58355550c30` = 156 entrants, collected
  05:59:45Z. Exact-commit and current-main reads match: Thomas Earhart absent, Kayleb Gillmore #245013 present,
  and Gracen Lomelino/Chris Reliford are the two unnumbered real registrations.
- [GPT] `chains-app` main HEAD remains [CLAUDE] v409 commit
  `94a95a26abb9c858ec494bc4c989b47a1164c1fa`; the existing Design project remains v409; open chains-app issue
  search returned zero. No newer build exists to ship.

## DATA / SAFETY
- [GPT] This shift made no app, Design, Firebase, pick, score, round, user, legacy `chains-fantasy /league`, or
  generated-data write. Run #528 was an unattended existing workflow write; no manual data edit, deletion, or
  backup path applies. Confirmed-good KADEY-first/CORY-last order, Watch, Settings, standings, scoring, and
  betting-removed behavior were not touched.

## REUSABLE METHOD FOR THE OTHER AI
- [GPT] Reused the existing [GPT] method without modification: after a manual single-event repair, keep recurrence
  amber until a later run is visibly `Scheduled`; pin its trigger/base/run/job/generated SHA and both artifact
  blobs, then compare the corrected roster at the generated commit and current main. This run satisfied every
  step, so Claude should treat recurrence as shared verified knowledge unless later data or workflow changes
  invalidate it. No new LESSON/playbook change was necessary.

## WHAT'S NEXT AND WHO OWNS IT
- QA: on the live Registered/Picks view, verify the dynamic list now shows the corrected 156-entry feed, Earhart
  is absent, and Gillmore #245013 is present. Do not select any player or change any score.
- Guillermo/owner: sign the existing Chrome session into a true non-commissioner Founders League account without
  sharing a password; the precise request remains OPEN in `team/INBOX.md`.
- QA/PM after owner sign-in: close T-016 only after live v409 shows Draft Now and enables only that member's two
  slots, without selecting an auto-saving pick.
- Engineer: complete T-017 only when the official PDGA first-tee table exists; verify WD non-draftability, pick
  lock, and automatic registration-finalized -> draft-open. PM may separately route the non-blocking Actions
  Node.js 20 deprecation warning to maintenance.

## WATCH OUT FOR
- Run #528 carries one non-blocking warning: `actions/checkout@v4` and `actions/setup-python@v5` target Node.js 20
  and GitHub currently forces them onto Node 24. The run passed; this is maintenance risk, not failed recurrence.
- No official PDGA tee-time table is documented yet; never substitute DGPT's 3:00 PM broadcast time for the lock.
- The only documented office app identity is commissioner uid `chains_commish_uid_v1`; it cannot prove T-016.
- GitHub upload/edit commit summaries must be visibly re-read after delayed Copilot generation; every GPT commit
  this shift was checked and verified through the connected contents/commit reads.

