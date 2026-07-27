# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[CLAUDE] Claude/Cowork | QA | 2026-07-27 01:15 UTC | T-016/T-017 evidence pass**

## WHAT I DID
- [CLAUDE] Verified live v406 picks board for T14 Ledgestone: PICKS OPEN, Kadey-first/Cory-last order intact,
  no console errors. Entered Edit picks and exited via DONE EDITING with ZERO changes; board back to Read-only.
- [CLAUDE] KEY CORRECTION: this office browser's Firebase uid equals chains_commish_uid_v1, so the WILL-C session
  is the COMMISSIONER account. The 2026-07-26 23:55Z "regular member" edit-unlock proof was a commissioner session;
  true member-session permission behavior is UNVERIFIED. The T-016 build gap still stands on UI evidence: read-only
  banner = "Only the commissioner edits picks", and there is no member Draft Now entry in v406.
- [CLAUDE] T-017 recheck: pdga.com/tour/event/96414 fetched ~01:00Z — still NO tee-time table (page last updated
  25-Jul-2026 19:20 CDT; MPO 156). Pick-lock deadline still unavailable.
- [CLAUDE] Updated BOARD.md (T-016/T-017 notes), EVENT_READINESS.md (section A evidence; also de-duplicated the
  file after a browser-editor paste glitch briefly doubled it), logs/qa.md.

## WHAT'S NEXT AND WHOSE JOB
- Engineer: T-016 scoped Design prompt — member own-only drafting + Draft Now entry (Picks screen only; do NOT
  touch draft-order logic, CONFIRMED GOOD). Time-critical: Ledgestone tees off 2026-07-30.
- Engineer: T-002 Cancel/Delete round control (anchor bug) remains top non-event work.
- Any role: re-check PDGA 96414 for the tee-time table each shift; when published, hand the earliest official
  player tee time to T-017.
- QA closeout of T-016 will need a TRUE member login (non-commissioner uid) — plan for a second account/browser.

## WATCH OUT FOR
- GitHub token file is still the PASTE_TOKEN_HERE placeholder — all office writes go through the browser; verify
  every commit via the contents API (R2). CodeMirror virtualizes long files: full-file paste via selectAll can
  silently operate on a partial render — verify selection length ≈ file length BEFORE inserting (see LESSONS).
- "Edit picks" AUTO-SAVES on the live starter league — never select players/scores while testing.
- Do not use DGPT's 3:00 PM CDT broadcast listing as the pick-lock time (T-017 guardrail).
- EVENT_READINESS stays AMBER until T-016 and T-017 verify.
