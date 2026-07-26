# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

The owner's rule: BEFORE an event, everything must be verified ready — especially the registered field and the
background event wiring, which have broken before. File every gap as a HIGH-PRIORITY board task.

## ACTIVE EVENT: Ledgestone Open — starts 2026-07-30. GET IT READY. Job #1.

Verified source facts from the 2026-07-26 CEO passes:
- Real event = "DGPT+ Ledgestone Open", 30-Jul to 02-Aug-2026, Peoria IL, PDGA event 96414.
- PDGA event page showed MPO registration = 156 at the 2026-07-26 18:58 UTC check.

### A. The Picks / Draft
- [x] Correct event ID, number, name, dates, tier, and location are shown for T14.
- [x] LIVE QA DONE — 2026-07-26 23:55 UTC [CLAUDE]: live app (v406) itself fetches data/field.json (verified in
      resource timing); Registered list shows 154 named pros updated Jul 26 6:52 PM = the 22:52Z feed run for
      T14/96414; qualifier placeholders not draftable; picks open. T-014 closed.
- [x] LIVE QA DONE — 2026-07-26 23:55 UTC [CLAUDE]: live order KADEY ... CORY confirmed against the T13 result
      panel (Cory 1st, Kadey 6th). T-015 closed as not-a-bug.
- [ ] MEMBER PERMISSIONS / DISCOVERABILITY: confirm a signed-in member can pick only their own players when the
      draft is open; commissioner editing is correction authority, not the normal drafting path. Confirm the
      way to start drafting is obvious. PM must route any failure immediately.
- [ ] PICK LOCK + WD handling: verify against the real first-tee deadline and the documented league rule.

### B. Standings / Stats / Schedule / History
- [x] Season standings rendered correctly in the prior pass: 13 events scored; Cory led with 56 points.
- [x] Schedule showed the correct Ledgestone dates/tier/status and the first 13 events as final.
- [x] History showed real results through T13 Heinola Open.

### C. Live Chains
- [x] Prior pass showed AWAITING NEXT TOURNAMENT — LEDGESTONE OPEN, queued for tee-off.

### D. Background data wiring
- [x] BACKGROUND ID COVERAGE FIXED — 2026-07-26 20:00 UTC [GPT]: commit
      `4cb6a21ba221d77e9a1bf8590c5add72a34ca7dc` added T14/96414 to `collect_field.py` and brought `events.txt`
      through 96414. Manual `Collect DGPT Data` run 30217973885 (#521) succeeded in 39 seconds.
- [x] FIELD FEED FIXED — generated commit `03b17dc284b9c61c8601033daac67f0ad7581a32` published a fresh
      `data/field.json` at 2026-07-26T19:58:54Z with `event_tag: T14`, `event_id: 96414`, and 154 named players.
      `data/events/96414-MPO.json` now has the full 156-slot PDGA field: 154 PDGA-numbered players plus two
      `Sunday Qualifier` placeholders. PDGA-number set comparison = 154/154, zero missing, zero extra.
- [x] AUTOMATIC COLLECTION PROVEN — 2026-07-26 21:05 UTC [GPT]: the first post-fix scheduled run
      30219698728 (#522) triggered via schedule at 20:46 UTC and completed Success in 1m 7s. Generated commit
      `5fc3a0e7466c3985566efb8bcf8fa2bc95719535` refreshed `field.json` at 20:47:51Z and event 96414 at
      20:47:39Z; the exact-commit artifacts still reconcile 154/154 numbered players with zero missing/extra,
      plus two non-draftable Sunday Qualifier placeholders.
- [x] VERIFIED — 2026-07-26 23:55 UTC [CLAUDE]: the live page's own network log shows it fetched
      Bonnaroo/chains-dgpt-data data/field.json; rendered count/timestamp match the 22:52Z generated artifact.
- [ ] Verify automatic registration-finalized -> draft-open behavior, not just this event's manual/snapshot fix.

## STATUS
**GREEN except member-permission check.** Field feed, live consumption, roster 154/154, draft order, and picks-open are all verified live on v406. The collector and generated artifacts now cover
Ledgestone correctly, and v405's fallback still protects availability. T-009 remains open until QA proves the live
app consumed the repaired feed and T-014/T-015 are closed. REMAINING (PM): member own-only drafting does NOT
exist today — "Edit picks" as member WILL-C unlocks every member's picks and scores; plus pick-lock/WD behavior
at the real first tee. Also note: a 21:46Z deploy landed as miscased `Index.html` and never went live; [CLAUDE]
redeployed v406 to lowercase index.html (commit 30a2201) and removed the stray file (b3be810).

## REUSABLE
Repeat A-D for every DGPT event about five days before it starts. Do not accept a correct-looking UI fallback as
proof that the dynamic feed is healthy: inspect `data/field.json` metadata (`updated_at`, `event_id`, `player_count`,
non-empty `players`), confirm the event ID exists in the collector/list, then verify the live app consumes the feed.
Compare PDGA-number sets, not just counts: total registration slots may include non-draftable qualifier placeholders.
