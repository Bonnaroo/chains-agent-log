# DATA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## PHASE 2 — Firebase schema migration (picks/draftOrder/standings/eventField)
- [DONE 2026-07-28] Step 1: Design + document schema for /leagues/<id>/{meta,members,eventField,draftOrder,picks,standings}
  in team/kb/firebase.md. Additive only, nothing live reads it yet.
- [DONE 2026-07-28] Step 2: Seeded one real /leagues/ledgestone-test-2026/eventField/96414 node with realistic Ledgestone MPO data (10-player sample, fieldSize=156, collectedAt timestamp, source URL). Smoke test complete — schema is sound, Firebase writes work. Still additive; no app build has been wired to read these nodes yet.
- [NEXT] Step 3 (future run): wire the Design build to read from Phase 2 nodes instead of baked-in data. Once Design completes that build and deploys it, all data changes (field roster, draft order, standings) become backend-only (no rebuild needed).

- [VERIFICATION 2026-07-29] Health check: playRounds/liveRounds/waitlist all clean (1 active round, no orphans); Phase 2 ledgestone-test-2026 seed data verified intact; chains-dgpt-data Actions green. Data readiness = 100% — awaiting Design lane Step 3 build.
- [VERIFICATION 2026-07-29 (2nd pass)] Spot-check re-run: playRounds=1 active, liveRounds=1 (mirrored), waitlist=null; Phase 2 seed (eventId 96414, Ledgestone Open, fieldSize=156) intact; Collect DGPT Data workflow 5/5 success (most recent 2026-07-29T01:07:36Z). Zero drift or degradation since prior pass.

## T-D08 | ASSIGNED | PRIORITY: TOP (2026-07-29 02:03 UTC routed by CEO)
**Goal:** REPORT A BUG Firebase infrastructure — create a backend data pipeline for user-submitted bug reports. Owner wants users to submit issues directly from the app; this task owns the data side. Create a /bugReports/<id> Firebase node structure (text: string, screen: string, timestamp: number, uid: string, version: string). Also provide a simple read interface or summary method so CEO/QA lanes can access incoming reports (e.g. a /bugReports/count or a summary query) and surface them in daily reports/BOARD.md, ensuring user-submitted bugs become actionable BOARD_DESIGN.md tasks, not just stored in a database nobody reads.
**Done when:** (1) /bugReports/<id> node structure confirmed working with test report; (2) CEO/QA can read new report count or summary easily (method documented for use in REPORT.md or BOARD.md); (3) at least one real user report from the app (once Design ships the UI) lands in Firebase and is readable by CEO lane.
**Notes:** Design lane (BOARD_DESIGN.md T-D08) owns the UI/form affordance. This lane owns the Firebase schema, write pipeline, and read interface so reports don't vanish after submission. Coordinate with Design lane to ensure the form captures the right context (screen, version, timestamp, uid).

(no other open tasks)
