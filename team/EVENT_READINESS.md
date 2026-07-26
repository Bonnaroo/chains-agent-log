# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

The owner's rule: BEFORE an event, everything must be verified ready — especially the registered field and the
background event wiring, which have broken before. File every gap as a HIGH-PRIORITY board task.

## ACTIVE EVENT: Ledgestone Open — starts 2026-07-30. GET IT READY. Job #1.

Verified source facts from the 2026-07-26 CEO pass:
- Real event = "DGPT+ Ledgestone Open", 30-Jul to 02-Aug-2026, Peoria IL, PDGA event 96414.
- Published MPO registration = 154 named players plus 2 Sunday-Qualifier TBD slots (156 total snapshot).

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
- [x] Event identifiers/naming/dates line up end-to-end.
- [ ] Verify chains-dgpt-data field.json is current, its two-hour collection workflow is green, and the live app
      consumes it before relying on the bundled fallback.
- [ ] Verify automatic registration-finalized -> draft-open behavior, not just this event's manual/snapshot fix.

## STATUS
v405 removed the known field-loading blocker and preserved the correct order in engineering verification, but the
event is not fully green until independent LIVE QA closes every unchecked item above. Do not repeat the earlier
reversed-order mistake; Cory won Heinola and correctly picks last.

## REUSABLE
Repeat A-D for every DGPT event about five days before it starts. Log sources, checks, fixes, and final green status.
