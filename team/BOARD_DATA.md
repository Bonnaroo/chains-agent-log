# DATA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## PHASE 2 — Firebase schema migration (picks/draftOrder/standings/eventField)
- [DONE 2026-07-28] Step 1: Design + document schema for /leagues/<id>/{meta,members,eventField,draftOrder,picks,standings}
  in team/kb/firebase.md. Additive only, nothing live reads it yet.
- [NEXT] Step 2 (future run): seed one real /leagues/<id>/eventField node with current Ledgestone (PDGA event
  96414) MPO field data as a smoke test. Still additive; do not touch playRounds/liveRounds/users/waitlist or
  the separate chains-fantasy project's /league node.

(no other open tasks)
