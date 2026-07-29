# DATA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## PHASE 2 — Firebase schema migration (picks/draftOrder/standings/eventField)
- [DONE 2026-07-28] Step 1: Design + document schema for /leagues/<id>/{meta,members,eventField,draftOrder,picks,standings}
  in team/kb/firebase.md. Additive only, nothing live reads it yet.
- [DONE 2026-07-28] Step 2: Seeded one real /leagues/ledgestone-test-2026/eventField/96414 node with realistic Ledgestone MPO data (10-player sample, fieldSize=156, collectedAt timestamp, source URL). Smoke test complete — schema is sound, Firebase writes work. Still additive; no app build has been wired to read these nodes yet.
- [NEXT] Step 3 (future run): wire the Design build to read from Phase 2 nodes instead of baked-in data. Once Design completes that build and deploys it, all data changes (field roster, draft order, standings) become backend-only (no rebuild needed).

- [VERIFICATION 2026-07-29] Health check: playRounds/liveRounds/waitlist all clean (1 active round, no orphans); Phase 2 ledgestone-test-2026 seed data verified intact; chains-dgpt-data Actions green. Data readiness = 100% — awaiting Design lane Step 3 build.
(no other open tasks)