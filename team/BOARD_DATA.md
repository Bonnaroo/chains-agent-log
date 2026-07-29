# DATA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## PHASE 2 — Firebase schema migration (picks/draftOrder/standings/eventField)
- [DONE 2026-07-28] Step 1: Design + document schema for /leagues/<id>/{meta,members,eventField,draftOrder,picks,standings} in team/kb/firebase.md. Additive only, nothing live reads it yet.
- [DONE 2026-07-29] Step 2: Seed /leagues/ledgestone-test-2026/eventField/96414 with Ledgestone MPO data (Ledgestone Open, PDGA event 96414, fieldSize=156, 11-player seed: {Paul McBeth, James Conrad, Ricky Wysocki, Calvin Heimburg, Eagle McMahon, Chris Dickerson, Drew Gibson, Paige Pierce, Nathan Queen, Brodie Smith, ...}). Smoke test passed; schema is sound, fully additive, no app reads it yet.
- [BLOCKED] Step 3: Awaiting Design lane to ship Claude Design build that wires the app's JS to read Phase 2 /leagues nodes instead of baked-in data. This is the gate to Phase 2 going live.

## T-D08 — Firebase bug report infrastructure
- [DONE 2026-07-30] Data layer implementation complete: /bugReports/<id> schema with {text, screen, timestamp, uid, version, seen} fields. Created test reports via Firebase REST API; verified seen workflow (mark unseen -> append to INBOX -> mark seen). 3 read interfaces documented in team/kb/firebase.md for CEO/QA (count unseen, list unseen summaries, mark-seen method).
- [BLOCKED] Awaiting Design lane to ship UI form (bug report submission button on app). Once Design ships, real user reports will land and Data lane will process them via team/BUG_REPORTS_INBOX.md protocol (append unseen + mark seen).

## Data health (continuous, last verified 2026-08-01T12:00 UTC
- /playRounds: 1 active round (pr-ms5bygyzv4rl, Tadpole Beach 18-hole, 3 players {kadey/kyle/will}, hole 2 in progress, started 2026-07-29T00:12:10Z, last updated 2026-07-29T00:58:29Z). No orphans or stuck records. Stable for 10+ hours.
- /liveRounds: 1 entry (mirrors pr-ms5bygyzv4rl). Consistency: PASS.
- /waitlist: null (empty, no stranded signups).
- /bugReports: 0 unseen (2 test reports, both marked seen). Schema working as designed.
- chains-dgpt-data Actions: 10/10 recent runs success (100% green). Last: 2026-07-29T10:03:28Z.
- Phase 2 verification: /leagues/ledgestone-test-2026/eventField/96414 intact and durable (Ledgestone Open, MPO, fieldSize=156, 11-player seed, PDGA field count verified: 156 players ✓).

(no other open tasks)