# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[CLAUDE] Claude/Cowork | Engineer | 2026-07-27 02:15 UTC | T-016 Design prompt sent (build pending)**

## WHAT CHANGED
- [CLAUDE] T-016 moved to IN_PROGRESS. ONE scoped Claude Design prompt sent to project 56b805f6 (v406 baseline):
  member own-only drafting on the Picks screen (own two picks only while DRAFTING), commissioner
  chains_commish_uid_v1 keeps full correction authority, member-facing "Draft Now" entry when picks are
  incomplete, member banner copy replaced. DO-NOT-TOUCH stated explicitly: draft-order logic (Kadey first /
  Cory last — owner CONFIRMED GOOD), scoring, standings, results, Watch, Settings, Go Throw, field.json feed.
- [CLAUDE] T-017 recheck ~02:12Z: PDGA 96414 still has NO tee-time table (last updated 25-Jul 19:20 CDT).
  Pick-lock deadline still unavailable; do NOT use DGPT's 3:00 PM CDT broadcast time.
- [CLAUDE] Office writes: LOCK claim commit + this clock-out batch (BOARD/engineer log/HANDOFF via upload flow,
  LOCK release) — all verified via contents API.

## VERIFICATION / EVIDENCE
- Design chat showed the full prompt rendered and "Scrambling…" (build started) after Send; input length 1,214
  chars confirmed via textContent before Send. Baseline live app = v406, chains-app HEAD b3be810 (unchanged).
- PDGA fetch evidence: page contains zero "tee time" matches; Last Updated 25-Jul-2026 19:20 CDT.

## DATA / SAFETY
- No Firebase data touched. No picks/scores changed. Live league untouched. No deploy this shift.

## REUSABLE METHOD FOR THE OTHER AI
- GitHub's web CodeMirror virtualizes hard: on an 18.7KB file only ~900 chars render, window.find fails, and
  el.cmView is NOT exposed — do NOT attempt full-file paste or find-based edits there. Reliable no-token write
  path for long files: build the file locally, then github.com/<repo>/upload/main/<dir> + file_upload (same-name
  replace), verify via contents API after.

## WHAT'S NEXT AND WHO OWNS IT
- Engineer (next shift): open Design project, verify the new version (v407+) against T-016 "done when" in the
  preview (do NOT touch draft order), then deploy per kb/deploy.md and set T-016 REVIEW.
- QA: after deploy, verify member own-only behavior — REQUIRES a true non-commissioner login (office browser uid
  == chains_commish_uid_v1). Never select players/scores on the live starter league (auto-save).
- Any role: re-check PDGA 96414 each shift for the tee-time table; hand the earliest official player tee time to
  T-017. Ledgestone tees off 2026-07-30.

## WATCH OUT FOR
- github-token.txt is still the PASTE_TOKEN_HERE placeholder — all writes are browser-based; verify every commit
  via the contents API (R2).
- "Edit picks" AUTO-SAVES on the live starter league.
- EVENT_READINESS stays AMBER until T-016 and T-017 verify. Do not regress Kadey-first/Cory-last order.
