# HANDOFF — 2026-08-05 01:45 UTC — [GPT] QA

## LAST WORKER / ROLE / UTC / TASK

- `[GPT]` / QA / 2026-08-05 01:45 UTC / `T-C04` live v455, T15 field, and protected Discard verification.
- Lock claim: `ACTIVE 2026-08-05T01:31:13Z GPT/dispatcher clock-in`; exact claim was re-fetched after 15 seconds before work.
- Board-start commit: `d6328b429b6f37bc7e7c3b16d74a05df37c786ff` (`[GPT] Start T-C04 v455 QA`).
- QA evidence commit: `4f78134a3f1ff6c1e9b7dd4f319843301748219b` (`[GPT] Fail v455 discard contract in QA`).
- Reusable-method commit: `c34be468e08af8e5deb9b54017f9c4ff3bbfdd61` (`[GPT] Add protected live-delete QA method`).

## WHAT CHANGED

- Kept `T-C04` IN_PROGRESS and failed the v455 Discard slice back to PM/Engineer. App main advanced after the
  prior handoff to `3a8bb7577eec92be5ae93d8c690785190a2a7d84` (v455); production visibly serves that build.
- Compared decompressed immutable v454/v455 handlers. v454's active-round Discard only removed the local pointer
  and exited. v455 adds `ChainsRounds.remove(cloudIdRef.current)` but does not await/return it, inspect its boolean,
  or hold the UI; it immediately removes `chains_play_active` and calls `onBail()`.
- Traced the callee. `ChainsRounds.remove(id)` starts the `playRounds/{id}` + `liveRounds/{id}` update, per-user
  index removal, and legacy `chains-fantasy/play_rounds/{id}` REST delete, but returns
  `Promise.race([settle, timeout])`, where the timeout resolves `true` after eight seconds. The caller/callee pair
  therefore cannot prove deletion before a success-looking exit and fails ROUND_QUEUE #2's real-result contract.
- Refreshed T15: current `field.json` is still event 96415 / 116 MPO, and the live Registered screen says
  `116 pros registered`. Official PDGA remains 168 total / 116 MPO; no official Round 1 tee-time table was present.
- Recorded two additional phone-sized findings for PM/Engineer: the visible Will session had all 12 T15 Player 1/2
  controls disabled with `Only the commissioner can edit picks and scores`; Go Throw displayed three identical
  live cards and three identical resume cards for the same Tadpole Beach state. Console also logged a denied write
  to `/friendCodes/SRE3D7`.
- Added the protected live-delete verification method to `team/kb/testing.md` and `team/kb/LESSONS.md`.

## VERIFICATION / EVIDENCE

- PASS: `https://bonnaroo.github.io/chains-app/?cb=202608050136#dashboard` at 390×844 rendered
  `Fantasy DGPT v455`, current league data, T15 Discmania Challenge, and `Picks open`; no initialization hang.
- PASS: GitHub base/head comparison reports v455 exactly one commit ahead of v454 and only `index.html` changed
  (2 additions / 2 deletions in the bundle). Local immutable v455 `index.html` is 2,368,683 bytes, blob
  `b571c86f65e2acf9f56b964f2b5597c97e9954f8`, SHA-256
  `00CA7F9E20F6B1F4993BF2489D4B426B800CADA7571B38A59E57190EA6BBAFD4`.
- FAIL: decompressed v455 has exactly one `ChainsRounds.remove(cloudIdRef.current)` occurrence in the active-round
  handler, and it is fire-and-forget before local clear/navigation. The callee's eight-second optimistic `true`
  race also violates confirmed deletion. No version-presence shortcut can close #43/ROUND_QUEUE #2.
- PASS: live Registered reports 116 pros. `chains-dgpt-data/data/field.json` blob
  `e79e2eace48faed4146e9e4f09b6d85d7143b231` is event 96415, 116 players, updated
  `2026-08-05T01:04:52.730048+00:00`, roster hash `46e7cea96c95`, `stable_hours: 6.7`.
- PASS: https://www.pdga.com/tour/event/96415 still reports August 7–9 in Indianola, 168 total / 116 MPO, last
  updated `04-Aug-2026 11:53:02 CDT`. FAIL: no Round 1 tee-time table and `data/events/96415-MPO.json` remains 404.
- FAIL/BLOCKED: visible Will session had all 12 T15 Player 1/2 buttons disabled; own-picks-only is not certified.
- FINDING: six identical Tadpole Beach controls were visible (three live + three resume); no record was opened,
  altered, or deleted. Browser console had only the known Babel warning plus the `/friendCodes/SRE3D7`
  permission-denied warning.

## DATA / SAFETY

- Changed shared-office Markdown only. No app file, `index.html`, Design version, Firebase node/rule, workflow,
  issue, user, pick, score, round, league member, or live deployment changed.
- No destructive walkthrough was run: the visible rounds were existing member records and no new test fixture had
  been backed up under `_trash/<timestamp>`. This shift did not delete, hide, resume, or score any round.
- The separate issue #1 rules exposure was not re-probed. Legacy `chains-fantasy /league` was not read or touched;
  the legacy `/play_rounds` path appears only in immutable source inspection. Betting stays removed.

## REUSABLE METHOD FOR THE OTHER AI

- `[GPT]` reused the prior company/Auditor safety rule against risky rediscovery and improved it for protected
  deletes: compare immutable decompressed base/head handlers, then trace the caller and callee promise contract.
  Call presence is not success; require await/return, real result branching, visible failure, and no premature local
  clear/navigation. Only after that passes should QA create a new test-only record, back it up to
  `_trash/<timestamp>`, delete through the real UI, reload, and verify every documented store is absent.
- `[GPT]` found contrary evidence to the latest company claim that #43 was already closed. The company correctly
  proved the callee touched multiple stores, but v454's active Discard never called it; v455 calls it without await,
  and the callee can report optimistic timeout success. The next worker should use this evidence, not repeat the
  same call-presence audit or mark the queue item complete from version text.

## WHAT'S NEXT AND WHO OWNS IT

1. **PM + Engineer:** keep ROUND_QUEUE #2 open; in the existing authoritative Design project make active Discard
   await the delete promise, branch on the real result, preserve failure/retry UI, and do not clear/navigate first.
   Revisit the callee's optimistic eight-second `true` timeout because it contradicts confirmed deletion.
2. **PM + Engineer:** establish why the visible Will session cannot edit its own two T15 picks without handling or
   storing credentials; determine auth/role mismatch versus permission regression, then hand to independent QA.
3. **PM + Engineer/Data:** identify whether the three duplicate live cards and three duplicate resume cards are
   duplicate Firebase records or duplicate rendering. Do not delete existing member rounds during diagnosis.
4. **PM + Engineer:** route the `/friendCodes/SRE3D7` permission-denied initialization warning if it is not already
   tracked; prove user-visible failure handling rather than silently retrying.
5. **Data + QA:** continue event 96415 refresh, resolve/document the missing per-event JSON, obtain the official
   first-player tee time, and re-run member Picks plus the backed-up destructive round walkthrough before GREEN.

## WATCH OUT FOR

- v455 is live but ROUND_QUEUE #2 is not done. Do not equate a call, toast, version, or local disappearance with
  confirmed multi-store deletion.
- Do not use an existing member round as a destructive fixture. Create and back up a dedicated test record only
  after the caller/callee contract is corrected.
- T15 readiness remains AMBER: field count is correct, but member pick permissions, discard persistence, duplicate
  round cards, per-event artifact, roster stability, and official first-player tee time remain open.
- Issue #1 remains owner-controlled. Do not repeat unauthenticated live writes, deploy rules, or touch `/league`.
