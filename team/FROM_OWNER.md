# FROM OWNER — Guillermo's desk (drop anything here; the CEO triages it every shift)

How to use: add a line under NEW with whatever you noticed. Half-formed is fine. The CEO turns it into work and
replies in TO_OWNER.md. You never talk to the workers directly.

## NEW (unprocessed — CEO picks these up)
- [NEW] PHASE 2 = GO (efficiency). The app is set up now, so STOP rebuilding the whole app in Claude Design for
  every change — that burns my AI credits. BACKEND-FIRST from now on: dynamic data (event fields, registered
  pro lists, standings, results, registration status) should live in FIREBASE and the app should READ it live,
  so updating it is FREE (a Firebase write, no rebuild). FIRST PHASE-2 MOVE: migrate the static event/player/
  standings data out of the code bundle (players.js etc.) into Firebase and make the app read from there — one
  Design rebuild now, then all future data updates cost zero credits. Only use Claude Design for genuine UI/
  feature changes (delete buttons, new screens), not data edits. (GitHub token for browser-free commits is in
  the Cowork folder's github-token.txt — waiting on my paste; that unlocks browser-free agent work.)
- [NEW] DRAFT ORDER — GROUND TRUTH (do not re-break): Cory WON Heinola (T13), so Cory picks LAST; Kadey finished
  last, so Kadey picks FIRST. Cory picks twice at the snake turn but picks last. The LIVE app already shows this
  correctly (Kadey #1 ... Cory #6). The engineer's earlier note had it backwards. QA: confirm against Heinola
  final results and CLOSE T-015 as already-correct — do NOT "fix" a working order.
- [NEW] REGISTRATION -> PICKS logic (CEO owns this pre-event): use the PDGA event page/API (event 96414 =
  Ledgestone) to detect when registration closes / the field is finalized, and AUTO-OPEN picks then. Also fix
  the "feels locked" problem: on the live app picks are in DRAFTING but read-only until you tap "Edit picks" —
  make starting a draft obvious/discoverable (a clear "Draft now" affordance), not a hidden Edit-picks toggle.
- [NEW] DELETE BUTTONS / escape hatches still missing across the app (cancel/delete a round, delete a disc, etc.)
  — real UI gaps; build them (Design work). Every destructive/in-progress action needs an obvious way out.
- [NEW] GO THROW needs a lot of work — and I don't want to spell out every feature. Be CREATIVE and self-directed:
  RESEARCH what UDisc and other disc golf apps do, benchmark Go Throw (and the whole app) against them, make sure
  the BASELINE features people expect are all there, PLUS extra/fun features that make people choose Chains over
  the competition. Produce a competitive feature-gap list and work it down. Don't wait for me to name each thing.
- [NEW] CEO MANDATE: catch this class of thing yourself — pre-event readiness logic (registration->picks, draft
  order, field sync), missing escape hatches, and normal "walk the whole app and make sure everything works"
  iterations. You're the one who should surface these before I have to.

## CONFIRMED GOOD by owner — protect these, do NOT regress (2026-07-26 walkthrough)
- WATCH tab: great as-is — highlights, rounds, practice rounds, and the split between Ezra and Goose is exactly right.
- SETTINGS: looks good. Starter league correctly pinned up top.
- DRAFT ORDER on live app: correct (Kadey first, Cory last) — see the ground-truth note above.

## HANDLED (CEO moves items here with a status once routed/answered)
- [ROUTED -> T-009/T-014/T-015] LEDGESTONE readiness: event data verified vs PDGA; T-014 field-sync shipped in
  v405 (picks DRAFTING); T-015 draft order is actually CORRECT per owner ground truth — QA confirm + close.
- [ROUTED -> T-010] ACE WALL auto-logging. [ROUTED -> T-011] IN THE BAG feature. [ROUTED -> T-012] GO THROW round
  management. [ROUTED -> T-013] LEAGUES e2e. [ROUTED -> STRATEGY.md] Phase 2 (now GO) + browser-free via token.
