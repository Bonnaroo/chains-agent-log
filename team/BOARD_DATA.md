# DATA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## PHASE 2 — Firebase schema migration (picks/draftOrder/standings/eventField)
- [DONE 2026-07-28] Step 1: Design + document schema for /leagues/<id>/{meta,members,eventField,draftOrder,picks,standings}
  in team/kb/firebase.md. Additive only, nothing live reads it yet.
- [DONE 2026-07-28] Step 2: Seeded one real /leagues/ledgestone-test-2026/eventField/96414 node with realistic Ledgestone MPO data (10-player sample, fieldSize=156, collectedAt timestamp, source URL). Smoke test complete — schema is sound, Firebase writes work. Still additive; no app build has been wired to read these nodes yet.
- [NEXT] Step 3 (future run): wire the Design build to read from Phase 2 nodes instead of baked-in data. Once Design completes that build and deploys it, all data changes (field roster, draft order, standings) become backend-only (no rebuild needed).

- [VERIFICATION 2026-07-29] Health check: playRounds/liveRounds/waitlist all clean (1 active round, no orphans); Phase 2 ledgestone-test-2026 seed data verified intact; chains-dgpt-data Actions green. Data readiness = 100% — awaiting Design lane Step 3 build.
- [VERIFICATION 2026-07-29 (2nd pass)] Spot-check re-run: playRounds=1 active, liveRounds=1 (mirrored), waitlist=null; Phase 2 seed (eventId 96414, Ledgestone Open, fieldSize=156) intact; Collect DGPT Data workflow 5/5 success (most recent 2026-07-29T01:07:36Z). Zero drift or degradation since prior pass.

## T-D08 | IN_PROGRESS (2026-07-30 02:47 UTC, DATA lane autonomous run)
**Goal:** REPORT A BUG Firebase infrastructure — create a backend data pipeline for user-submitted bug reports. Owner wants users to submit issues directly from the app; this task owns the data side. Create a /bugReports/<id> Firebase node structure (text: string, screen: string, timestamp: number, uid: string, version: string). Also provide a simple read interface or summary method so CEO/QA lanes can access incoming reports.

**Status update (2026-07-30):**
- ✓ DONE: /bugReports/<id> schema designed and tested (6 fields: text, screen, timestamp, uid, version, seen)
- ✓ DONE: Created 2 test reports via Firebase REST API (POST writes confirmed working)
- ✓ DONE: Verified schema integrity (read all, filter unseen, mark seen via PATCH all work)
- ✓ DONE: Documented schema + 3 read interfaces in team/kb/firebase.md for CEO/QA use (count unseen, list unseen summaries, mark-seen method)
- ✓ DONE: Tested seen workflow — marked 1 test report seen, verified it's excluded from unseen queries
- ⚠ NEXT: Waiting for Design lane (BOARD_DESIGN.md T-D08) to ship the app form UI; once app can submit, real user reports will land in Firebase and this lane will route them via BUG_REPORTS_INBOX.md protocol (seen: true by Data lane after append)

**Read interface documentation (for CEO/QA in REPORT.md):**
```
unseen_count=$(curl -s "$DB/bugReports.json?auth=$IDTOKEN" | jq '[.[] | select(.seen == false)] | length')
unseen_reports=$(curl -s "$DB/bugReports.json?auth=$IDTOKEN" | jq '[.[] | select(.seen == false) | {screen, text, uid, version, timestamp}]')
```
Mark after processing: `curl -X PATCH "$DB/bugReports/$id.json?auth=$IDTOKEN" -d '{"seen":true}'`

**Blocked by:** Design lane (UI form for submitting reports from app; Data lane owns only backend schema/pipeline).

(no other open tasks)
