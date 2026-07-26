# Chains — Daily Report — 2026-07-26

_Written 2026-07-26 ~22:35 UTC by the CEO desk [CLAUDE]. Everything below was checked against the live app,
the app repo, and the data repo — not just what the logs claim._

**EMAIL NOTE:** Gmail on this run is draft-only (no send permission). A draft of this report titled
"Chains Daily Report — 2026-07-26" was created in your Gmail drafts — open Drafts to read or send it.
This file is the source of truth either way.

## A. SHIPPED TODAY (verified real)
- **v403 deployed overnight (00:45 UTC):** betting/money UI fully removed + the Go Throw scoring overhaul
  (blank-until-entered scores, persistent scorecard, next-hole gating). Superseded later in the day by v405.
- **v405 deployed live (16:46 UTC):** the big Ledgestone fix. The T14 Picks page now shows the REAL registered
  field — 154 named pros plus 2 "Sunday Qualifier" TBD slots, matching PDGA's 156 exactly — and picks are
  unlocked. Also includes the v404 Go Throw polish (tap-any-hole edit, solo instant start, finish/share card).
  Verified: the live site serves the exact v405 file, byte-for-byte.
- **Ledgestone background data feed FIXED** — today's most important catch. The automatic data collector didn't
  know Ledgestone existed, so the app was quietly surviving on a temporary built-in snapshot that self-expires
  Aug 3. The collector was repaired in the data repo, verified with a manual run, and then proven with a real
  unattended scheduled run (success, correct 154-player output). The pipeline now feeds Ledgestone on its own.
- **Draft order confirmed NOT broken:** Kadey-first / Cory-last is correct (worst-place-first off Heinola, where
  Cory won). You confirmed the same. Protected as ground truth.

## B. IN PROGRESS / ON TRACK
- **Live QA of the Ledgestone picks screen (T-014/T-015 closeout):** a QA shift claimed the office at 21:51 UTC
  and is working as this report is written. Ledgestone readiness is AMBER — backend fixed, live-screen
  verification (real feed consumption, member-only drafting, Draft Now discoverability, pick lock) outstanding.
  Event starts Thursday, July 30.
- **Phase 2A backend-first migration:** authorized per your directive; awaiting PM grooming into safe,
  reversible tasks.

## C. STALLED OR FAILED (the honest list)
- **v406 upload landed with the WRONG FILENAME.** At 21:46 UTC a new ~9.64 MB build was uploaded to the app repo
  as "Index.html" (capital I). GitHub Pages serves lowercase "index.html", so **the live site is still v405 —
  whatever v406 contains is NOT live.** No office log describes this upload; the hourly dispatcher has since
  queued "v406 verification" for the Engineer. It must be verified and re-uploaded under the correct name (or
  discarded), and the stray files (Index.html, test.html) cleaned out of the app repo.
- **Five of seven roles produced nothing today.** PM, QA, Designer, Marketing, and R&D logs all still read
  "awaiting first shift." Concretely: no ROADMAP audit (T-003), no Cancel-Round UX spec (T-004), no leagues
  end-to-end check (T-013), no marketing drafts (T-005). All of today's progress came from CEO and Engineer hats.
- **Untouched named tasks:** T-002 Cancel/Delete an in-progress round (your oldest reported dead-end), T-006/T-011
  In the Bag, T-007 Council read-only dashboard, T-010 Ace Wall auto-logging, T-012 round management.

## D. DECISIONS / THINGS I NEED FROM YOU
- **Nothing needs your decision tonight.** INBOX is empty, and your desk (FROM_OWNER) has no [NEW] items — all
  six notes from your walkthrough were routed this afternoon (Phase 2 GO, draft-order truth, registration→picks,
  delete buttons, Go Throw audit, proactive event-readiness).
- Standing items only you can provide, **not needed yet:** a new Firebase project for App B; Apple Developer
  ($99/yr) and Google Play ($25 one-time) accounts at store-submission time.
- Optional efficiency: granting the GitHub integration contents-write permission would let shifts commit without
  driving your Chrome. Not a blocker.

## E. PLAN FOR TOMORROW
1. Finish the Ledgestone live QA and close T-014/T-015 — the only gate to event-ready green before Thursday.
2. Resolve the mis-named v406 upload: verify what it is, deploy it correctly or discard it; clean the repo.
3. PM grooming shift: fold T-006 into T-011, rewrite obsolete T-008 (the July 29 gate is superseded by your
   Phase-2-GO directive), split Phase 2A into reversible tasks.
4. Start moving the silent roles: first QA audit pass (T-003) and the Cancel-Round track (T-002/T-004).

## F. PROJECT HEALTH (vs the STRATEGY north star)
**AMBER-GOOD.** App A polish moved meaningfully today (v405 live; Ledgestone data pipeline now self-sustaining)
but event readiness isn't green yet and most roles haven't produced work. App B, Council, and the coding path are
future phases — note the old coding-path gate date (2026-07-29) was superseded by your Phase-2-GO directive; PM
grooming is the real gate now.

## G. SHIFT LEDGER (since the last report — this is the first; all 2026-07-26 UTC)
- 00:45 | Engineer — deployed v403 (betting stripped, Go Throw scoring overhaul).
- Morning | CEO #1 — created the office lock, routed your first four notes, filed T-014/T-015 from the
  event-readiness pass.
- Morning | CEO #2 — fixed a FROM_OWNER update a prior shift claimed but never actually landed.
- Midday | Engineer #1 — sent the scoped Design prompt for the Ledgestone field + draft-order fixes (v405 build).
- 16:30–16:50 | Engineer #2 — verified v405 in preview, found T-015 was not a bug, deployed v405 live.
- 17:52 | CEO #3 [GPT] — processed your six directives; Phase 2 = GO written into STRATEGY.
- 18:15 | CEO [GPT] — added the cross-AI attribution/handoff protocol.
- 18:58 | CEO [GPT] — discovered the empty Ledgestone background feed (readiness RED).
- 20:00 | CEO [GPT] — repaired the data collector; manual run verified (154/154 match).
- 21:05 | CEO [GPT] — proved the scheduled unattended run works (#522, success).
- 21:46 | **UNLOGGED upload** of "Index.html" (presumably v406) to the app repo — wrong filename, not live,
  no log entry. Flagged in section C.
- 21:51 | QA [CLAUDE] — claimed the office for T-014/T-015 live QA; in progress at report time.
- 22:35 | CEO [CLAUDE] — this report.
- **Zero shifts today from PM, Designer, Marketing, or R&D.**

---
## Guillermo's steering guide (keep this footer)
- You steer through TWO files: answer questions in team/INBOX.md, and reorder team/ROADMAP.md. The PM picks both up. You never talk to workers directly.
- Report any problem by opening a GitHub Issue on Bonnaroo/chains-app — untriaged issues are the dispatcher's #1 priority.
- Scale down cost: the dispatcher runs 24/7 hourly (~24 shifts/day). Narrow its hours or slow it anytime — just ask.
- Watch it get faster: team/kb/ is the team's memory. If it keeps repeating mistakes, the R&D role isn't folding LESSONS into playbooks.
