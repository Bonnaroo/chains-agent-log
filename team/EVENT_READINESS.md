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
  - 2026-07-27 01:15 UTC [CLAUDE] QA evidence: the office browser's Firebase uid == chains_commish_uid_v1, so the earlier
    "member WILL-C" proof was a commissioner session; member-side enforcement is UNVERIFIED. UI evidence stands:
    read-only banner says "Only the commissioner edits picks" and no member Draft Now entry exists in v406 —
    T-016 build required either way. Final verification needs a true member login.
- [ ] PICK LOCK + WD handling: verify against the real first-tee deadline and the documented league rule.
  - 2026-07-27 00:28 UTC [GPT] Primary-source deadline audit: PDGA event 96414 (https://www.pdga.com/tour/event/96414)
    lists Jul 30-Aug 2, 156 MPO registrations, last updated Jul 25 19:20 CDT, but currently exposes no Tee Time
    table/column. DGPT (https://www.dgpt.com/event/2026-ledgestone-open/) lists 3:00 PM CDT for MPO Round 1
    broadcast, which is not the first player tee time. T-017 must not use the broadcast time as the lock.
  - 2026-07-27 01:15 UTC [CLAUDE] Recheck: PDGA 96414 still shows no tee-time table (last updated 25-Jul 19:20 CDT). Amber holds.

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
**AMBER — data/live consumption are green; two time-critical drafting gates remain.** [CLAUDE] independently
verified v406 live-feed consumption, the 154 named-player field, qualifier exclusion, picks-open, and the
owner-confirmed Kadey-first/Cory-last order. [GPT] reused those verified findings instead of repeating the
destructive drafting path. At 2026-07-27 00:28 UTC, [GPT] also rechecked the live app (title `Chains · Fantasy DGPT 2026`,
dashboard shows Ledgestone `PICKS OPEN`) and current artifacts: `data/field.json` blob
`ecc27a039512b43a1c4fd8ab0f251a0ca0f202e2` = T14/96414, 154 players, updated
2026-07-26T23:54:03Z; `data/events/96414-MPO.json` blob
`cb8c2ba4df5e0a80c7d95aa1560949d989be5752` = 156 slots, collected 23:53:51Z. Remaining blockers:
T-016 member own-only drafting / Draft Now discoverability, and T-017 first-tee lock / WD / automatic
registration-close-to-draft-open. PDGA has not published the official tee-time table yet, so the exact safe lock
deadline is still unknown; DGPT's 3:00 PM CDT MPO broadcast time must not be substituted. T-009 stays IN_PROGRESS.

## REUSABLE
Repeat A-D for every DGPT event about five days before it starts. Do not accept a correct-looking UI fallback as
proof that the dynamic feed is healthy: inspect `data/field.json` metadata (`updated_at`, `event_id`, `player_count`,
non-empty `players`), confirm the event ID exists in the collector/list, then verify the live app consumes the feed.
Compare PDGA-number sets, not just counts: total registration slots may include non-draftable qualifier placeholders.
