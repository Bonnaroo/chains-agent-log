# HANDOFF — the baton (overwritten every shift; read at clock-in)

## WHAT I DID
Engineer shift 2026-07-26 ~16:30-16:50 UTC (started as a scheduled run that stalled — Chrome extension was
down, no GitHub writes possible; owner replied in chat, tools came back, shift resumed). Verified the v405
build in the Design preview and DEPLOYED IT LIVE:
- T-014 DONE-pending-QA: T14 Ledgestone REGISTERED tab shows the real field (154 named pros, updated Jul 25
  8:00 PM), T14 card is DRAFTING, picks unlocked. The build bundles a 156-player snapshot fallback (PDGA 96414,
  2 Sunday-Qualifier TBD, self-expires Aug 3) and reads the live field.json feed from Bonnaroo/chains-dgpt-data
  (updated every 2h by a GitHub Action).
- T-015 NOT A BUG: Heinola T13 result = Cory 1st ... Kadey 6th, so the KADEY-first draft order was already
  correct (worst-to-best). CEO pass had the columns inverted; owner confirmed in Design chat. No code touched.
- Deploy: clean-checks passed, committed to Bonnaroo/chains-app 16:46:13Z, live site serves the full 9,641,939
  bytes = v405 LIVE. (Commit msg is GitHub's default — a permission classifier blocked typing; owner approved
  the upload in chat.) v405 also carries v404's Go Throw polish, so T-001 is now effectively a QA verify.

## WHAT'S NEXT AND WHOSE JOB IT IS
QA (next shift): on the LIVE site — (1) T-014: check the Ledgestone field 1:1 against pdga.com/tour/event/96414
(154 named + 2 TBD; no stale/missing/extra), confirm picks unlock + draft board works read-only; (2) T-015:
confirm draft order KADEY→SHANNA→GABE→WILL→KYLE→CORY and close as not-a-bug; (3) T-001: verify v404's three
Go Throw polish items (tap-any-hole edit, solo instant-start, finish/share card). Move all three to DONE if
green. CEO: after QA, green the EVENT_READINESS.md Active-Event boxes and tell the owner in TO_OWNER.md that
Ledgestone is ready. PM: groom T-001 (now a QA task), and note the owner asked in chat (2026-07-26) about a
GitHub token / starting Phase 2 sooner — the CEO should answer him properly in TO_OWNER.md.

## WATCH OUT FOR
- Ledgestone starts 2026-07-30. Field data now comes from the chains-dgpt-data field.json feed (2h Action) with
  the bundled snapshot as fallback — if QA sees a wrong field, check that feed before re-prompting Design.
- Draft board is commissioner-only for edits; do NOT click "Edit picks" during testing — it auto-saves and
  syncs to the real league.
- The Design HTML is a pako/base64 bundle: plaintext grep finds nothing; decompress blobs to verify content.
- Scheduled runs die if Chrome/extension is down, and the permission classifier can block large uploads until
  the owner replies in chat. GitHub-token decision is still pending with the owner (STRATEGY.md / TO_OWNER.md).
- Do NOT start Phase-2 coding rebuild before the access method + date in STRATEGY.md are in place.
