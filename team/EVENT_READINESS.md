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
  - 2026-07-27 04:29 UTC [GPT] Reused [CLAUDE]'s fresh v409 QA/deploy evidence: app commit
    `94a95a26abb9c858ec494bc4c989b47a1164c1fa` is live; commissioner edit/unlock/done, draft order,
    standings, and Go Throw passed with zero preview console errors. v409 adds the member path, but the available
    browser uid is still the commissioner. T-016 therefore stays REVIEW until a true non-commissioner proves
    Draft Now + own-two-slots-only on live without selecting any auto-saving pick.
  - 2026-07-27 05:27 UTC [GPT] No non-commissioner session or credential is documented in the office; the only
    available identity remains `chains_commish_uid_v1`. Routed an owner-safe unblock in `team/INBOX.md`: Guillermo
    signs Chrome into a member account without sharing a password, then QA/PM runs the no-pick closeout.
- [ ] PICK LOCK + WD handling: verify against the real first-tee deadline and the documented league rule.
  - 2026-07-27 00:28 UTC [GPT] Primary-source deadline audit: PDGA event 96414 (https://www.pdga.com/tour/event/96414)
    lists Jul 30-Aug 2, 156 MPO registrations, last updated Jul 25 19:20 CDT, but currently exposes no Tee Time
    table/column. DGPT (https://www.dgpt.com/event/2026-ledgestone-open/) lists 3:00 PM CDT for MPO Round 1
    broadcast, which is not the first player tee time. T-017 must not use the broadcast time as the lock.
  - 2026-07-27 01:15 UTC [CLAUDE] Recheck: PDGA 96414 still shows no tee-time table (last updated 25-Jul 19:20 CDT). Amber holds.
  - 2026-07-27 04:29 UTC [GPT] Fresh primary-page recheck: PDGA 96414 still shows 156 MPO registrations and
    `Last updated: 25-Jul-2026 19:20:02 CDT`; there is no `Tee Time` table and no `Withdrawn` text. The DGPT
    event page still provides broadcast programming, not an official first-player tee time. T-017 remains open;
    do not invent a lock timestamp.
  - 2026-07-27 05:27 UTC [GPT] Reused [CLAUDE]'s fresh 05:10 PDGA roster diff: Thomas Earhart had left the
    registration while Kayleb Gillmore (#245013) had joined. Manual workflow #527 generated commit `5e643c0`;
    both current artifacts now exclude Earhart, include Gillmore, and hold 156 entrants. Backend WD/registration
    following passes for this change; live non-draftability still needs QA, and the official tee table is absent.

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
- [x] CURRENT ARTIFACT RECHECK — 2026-07-27 04:29 UTC [GPT]: `data/field.json` blob
      `c3ab164203068b55cebe685f3231f49b1a54f221` remains T14/96414 with 154 named players, updated 02:03:55Z;
      `data/events/96414-MPO.json` blob `cbfb65408e4ab319b1e0a504657ca6eb345ef23f` remains 156 slots,
      collected 02:03:39Z. No backend repair or Firebase write was needed.
- [x] ROSTER STALENESS REPAIRED — 2026-07-27 05:27 UTC [GPT]: reused [CLAUDE]'s 05:10 PDGA diff and confirmed
      the 02:03 artifacts still had Thomas Earhart and lacked Kayleb Gillmore. Manually dispatched workflow
      30239662932 (#527) with event input `96414`; all 21 steps succeeded from base `23d04a8` and generated
      commit `5e643c00e5511b70b41438ee5b60c465c58c9ef6`. `field.json` blob `334569b` is T14/96414, 156 entrants,
      updated 05:24:59Z (154 numbered + Gracen Lomelino/Chris Reliford unnumbered); event blob `e7933f9` is 156,
      collected 05:24:43Z. Earhart absent and Gillmore #245013 present in both.
- [x] RECURRENCE RECHECK — 2026-07-27 06:26 UTC [GPT]: genuine scheduled run 30241283786 (#528) triggered via
      `schedule` at 05:58Z from repaired base `5e643c00e5511b70b41438ee5b60c465c58c9ef6`, completed Success
      in 1m16s, and every collect/commit job step passed. Generated commit
      `06bd3b43c299796ef796f96f27d2e505249ad6b1` pins `field.json` blob
      `9743387f2cc70c671505b20ee3f9b4e9660ef79e` (156 entrants, updated 06:00:04Z) and event blob
      `7dfca62400953c7bf1ef60ecab95d58355550c30` (156, collected 05:59:45Z). Exact-commit and current-main
      reads match: Earhart absent, Gillmore #245013 present, and Gracen Lomelino/Chris Reliford remain the two
      unnumbered real registrations. Background recurrence is green again; the Actions page carries a
      non-blocking Node.js 20 deprecation warning for checkout/setup-python now forced onto Node 24.
- [ ] Verify automatic registration-finalized -> draft-open behavior, not just this event's manual/snapshot fix.

## STATUS
**AMBER — v409 is live, the roster is correct, and scheduled collection has recovered; member/deadline gates
remain.** [GPT] proved recurrence with genuine scheduled run #528 and generated commit `06bd3b43`: current
artifacts still contain 156 entrants, exclude withdrawn Earhart, and include Gillmore #245013. QA must still
confirm that corrected roster on the live Registered/Picks screen without selecting a player. T-016 needs a true
non-commissioner proof (owner sign-in request is OPEN in INBOX). T-017 still needs the official earliest tee time,
live WD non-draftability, pick lock, and automatic registration-finalized -> draft-open proof. PDGA has not
published the tee-time table, so DGPT's 3:00 PM broadcast time must not be substituted. T-009 stays IN_PROGRESS.

## REUSABLE
Repeat A-D for every DGPT event about five days before it starts. Do not accept a correct-looking UI fallback as
proof that the dynamic feed is healthy: inspect `data/field.json` metadata (`updated_at`, `event_id`, `player_count`,
non-empty `players`), confirm the event ID exists in the collector/list, then verify the live app consumes the feed.
Compare PDGA-number sets, not just counts: total registration slots may include non-draftable qualifier placeholders.

