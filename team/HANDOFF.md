# HANDOFF — 2026-08-04 22:36 UTC — [GPT] CEO

## LAST WORKER / ROLE / UTC / TASK

- `[GPT]` / CEO / 2026-08-04 22:36 UTC / `T-C02` many-league scale options brief.
- Lock claim: `ACTIVE 2026-08-04T22:26:43Z GPT/dispatcher clock-in`; exact claim was re-fetched after 15 seconds before work.
- Shared-office delivery commit: `e34b17a1f7677b170338b477532ad388fb4e802d` (`[GPT] Complete T-C02 scale options brief`).
- Knowledge-base delivery commit: `6944864196cbd3e1fc7b742cde342a39f766b901` (`[GPT] Add reusable scale planning method`).

## WHAT CHANGED

- Completed `T-C02` in the existing `team/STRATEGY.md` under `T-C02 OPTIONS BRIEF`; no new project, repository,
  database, app, roadmap, or coordination file was created.
- Documented four bounded choices: harden APP A on RTDB; Firestore-first APP B with optional measured RTDB live
  sync; all-RTDB public scale; or all-Firestore public scale. Recommended keeping APP A on RTDB for the live
  founders season and using Firestore for future durable multi-league state, adding RTDB only when measured
  presence/high-frequency sync justifies it.
- Captured tenant paths, phase triggers, metrics, migration/cost/security risks, owner decisions, and official
  Firebase evidence. Marked `T-C02` DONE in `team/BOARD.md`, moved the owner request to completed in
  `team/FROM_OWNER.md`, and summarized the decision in `team/TO_OWNER.md`.
- Added the reusable rule/scale method to `team/kb/firebase.md` and `team/kb/LESSONS.md` so the next `[CLAUDE]` or
  `[GPT]` worker can reuse it rather than rediscovering it.
- Refreshed `team/EVENT_READINESS.md` from the newer T15 feed artifact: event `96415`, 116 players, updated
  `2026-08-04T21:34:09.661860+00:00`, `stable_hours: 3.2`.

## VERIFICATION / EVIDENCE

- PASS: shared-office commit `e34b17a1f7677b170338b477532ad388fb4e802d` contains `BOARD.md`, `STRATEGY.md`,
  `EVENT_READINESS.md`, `FROM_OWNER.md`, and `TO_OWNER.md` updates stamped `[GPT]`.
- PASS: knowledge-base commit `6944864196cbd3e1fc7b742cde342a39f766b901` contains the `[GPT]` scale lesson and
  `SCALE PLANNING METHOD` playbook section for the next worker.
- PASS: Firebase's official comparison says Firestore supplies document/collection data, indexed shallow compound
  queries, non-cascading rules, automatic scale, and regional/multi-region placement; RTDB uses one JSON tree,
  cascading rules, and per-database scale that requires sharding beyond its documented connection/write ranges.
  Source checked: https://firebase.google.com/docs/database/rtdb-vs-firestore
- PASS: Firebase documents that RTDB and Firestore can coexist but there is no automated migration; mapping data
  and rules requires custom scripts, and staged synchronization needs guarded Cloud Functions. Source checked:
  https://firebase.google.com/docs/firestore/firestore-for-rtdb
- PASS: current office evidence in `company/LOOP_LOG.md` says `/playRounds` has parent `.write: auth != null` and
  signed-in users can forge another member's write; because RTDB grants cascade, child rules cannot revoke it.
- PASS: `chains-app` remains live v453 at main `73d7d057eeecaa32558b24ed5dbd990965b007d0`; no app build was needed.
- PASS: `chains-dgpt-data/data/field.json` blob `c8c3a8b54e128a93d7d6b74efb55ee09aa10cdfd` is T15 / `96415`, 116
  players, updated `2026-08-04T21:34:09.661860+00:00`, `stable_hours: 3.2`; PDGA still lists 116 MPO.

## DATA / SAFETY

- Changed shared-office Markdown only. No app file, `index.html`, Design version, Firebase project/node/rule,
  workflow, issue, user, pick, round, score, league member, or live deployment changed.
- No backup, deletion, migration, dual-write, or privileged service identity was created.
- Legacy `chains-fantasy /league` was not read or touched. Betting stays removed. Confirmed-good v453 behavior was
  not changed.

## REUSABLE METHOD FOR THE OTHER AI

- `[GPT]` reused the current `[CLAUDE]`/company evidence about the permissive `/playRounds` parent rule and improved
  it into a repeatable architecture gate: first separate current-product hardening from future-database selection;
  then measure provider/usage thresholds, cost per real workflow, cross-tenant denies, backup restore results, and
  p95 latency before choosing a migration. A future user count by itself is not evidence.
- RTDB child rules cannot make a broadly granted parent safe. Remove the broad parent grant, then run an explicit
  allow-own / deny-other-user / deny-other-league matrix before inviting outsiders.
- For APP B planning, default durable multi-tenant state to Firestore and make RTDB live-sync optional and measured.
  Avoid permanent dual-write; if a migration window is approved, map data/rules explicitly and guard sync triggers
  against loops and drift.

## WHAT'S NEXT AND WHO OWNS IT

1. **Data:** claim `T-C01`; specify approved backup scope, cadence, retention, storage/access, RPO/RTO, restore
   procedure, and a non-production restore drill before any write or delete.
2. **Engineer/Data + independent QA:** before any outside APP A tester, replace broad `/playRounds` authenticated
   parent writes with least-privilege rules and prove the cross-tenant deny matrix. Rule deployment still requires
   the owner/service-account/manual Firebase-console path recorded in `company/OPERATING_RULES.md`.
3. **Data:** keep T15 event `96415` current through tee-off and resolve or document the missing
   `data/events/96415-MPO.json` artifact.
4. **QA:** verify live Picks contains the official 116-player MPO field from a regular-member session, prove members
   can edit only their own two picks, and independently repeat the phone-sized v453 round walkthrough.
5. **Owner (only before APP B implementation):** approve Firestore-first with optional RTDB live-sync; set backup
   RPO/RTO and retention; choose regional versus multi-region placement and a monthly budget guardrail.

## WATCH OUT FOR

- `T-C02` is a completed options brief, not authorization to create APP B, another repository, another production
  Firebase project, or a mid-season migration.
- APP A's broad `/playRounds` parent write remains a hard stop for outside testers; this shift documented but did
  not deploy rules.
- T15 readiness remains AMBER: the field matches PDGA at 116, but the per-event artifact, regular-member pick
  permissions, independent v453 round test, and official first-player tee time remain open.
- Do not use DGPT's broadcast time as a tee-time or pick-lock deadline.
