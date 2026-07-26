# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

The owner's rule: BEFORE an event, everything must be verified ready — especially the registered field and the
background event wiring, which have broken before. File every gap as a HIGH-PRIORITY board task.

## ACTIVE EVENT: Ledgestone Open — starts 2026-07-30. GET IT READY. Job #1.

Verified source facts from the 2026-07-26 CEO passes:
- Real event = "DGPT+ Ledgestone Open", 30-Jul to 02-Aug-2026, Peoria IL, PDGA event 96414.
- PDGA event page showed MPO registration = 156 at the 2026-07-26 18:58 UTC check.

### A. The Picks / Draft
- [x] Correct event ID, number, name, dates, tier, and location are shown for T14.
- [ ] LIVE QA PENDING (T-014 REVIEW): v405 is deployed with the field feed + expiring 156-slot fallback; confirm
      the live Registered list matches PDGA 96414 one-for-one and picks are open for members.
- [ ] LIVE QA PENDING (T-015 REVIEW): owner ground truth says the displayed order is correct — KADEY first,
      then SHANNA, GABE, WILL, KYLE, CORY last because Cory won Heinola. Confirm live and close as not-a-bug.
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
- [ ] BACKGROUND ID COVERAGE FAIL — 2026-07-26 18:58 UTC [GPT]: `chains-dgpt-data/collect_field.py` stops at
      T13/96413, while `events.txt` stops at 96410. `data/events/96414-MPO.json` is absent. Add T14/96414 (and
      repair the stale event list) before treating identifiers as lined up end-to-end.
- [ ] FIELD FEED FAIL — 2026-07-26 18:58 UTC [GPT]: current `data/field.json` was generated at
      2026-07-26T18:41:51Z with `event_id: null`, `players: []`, and `No upcoming event found`. The 15-minute
      `Collect DGPT Data` workflow is running, but it cannot select Ledgestone because the collector omits T14.
      Repair the collector, run/await the workflow, and require `event_id: 96414` plus 156 MPO entries before green.
- [ ] Verify the live app consumes the repaired field feed before relying on the bundled fallback.
- [ ] Verify automatic registration-finalized -> draft-open behavior, not just this event's manual/snapshot fix.

## STATUS
**RED — background field feed is broken.** v405 keeps the live Picks page usable through its expiring 156-slot
fallback, and the confirmed-correct order remains Kadey first / Cory last. However, the fallback currently masks an
empty scheduled feed, so T-009 cannot be green and T-014 must not be closed as background-ready until the collector
publishes Ledgestone data and independent live QA closes the remaining A-section checks.

## REUSABLE
Repeat A-D for every DGPT event about five days before it starts. Do not accept a correct-looking UI fallback as
proof that the dynamic feed is healthy: inspect `data/field.json` metadata (`updated_at`, `event_id`, `player_count`,
non-empty `players`), confirm the event ID exists in the collector/list, then verify the live app consumes the feed.
