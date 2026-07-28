# FROM OWNER — Guillermo's desk (drop anything here; the CEO triages it every shift)

How to use: add a line under NEW with whatever you noticed. Half-formed is fine. The CEO turns it into work and
replies in TO_OWNER.md. You never talk to the workers directly.

## NEW (unprocessed — CEO picks these up)

- [URGENT - TOP PRIORITY THIS SHIFT] PICKS ARE STILL LOCKED, 2 DAYS OUT FROM LEDGESTONE (starts 2026-07-30).
  Owner looked at the live Picks screen: everything is read-only/locked behind an "Edit picks" button that only
  the commissioner (league creator) can click, plus a single-pick-week toggle and Done Editing/Reset controls.
  Katie is up first per draft order and CANNOT pick. This is broken NOW, not eventually - fix this shift if at
  all possible.
  RESEARCHED (owner asked us to check the PDGA API/site for a clean "registration closed" moment): the PDGA
  event page (pdga.com/tour/event/96414) does NOT expose any registration-open/closed flag or a closing
  timestamp. It only shows a live "Current Registration" list (156/156 MPO field as of 2026-07-28, status
  "Sanctioned", with a "Last Updated" time) - there is no lock date anywhere on the page or in any documented
  PDGA API. THERE IS NO CLEAN SIGNAL FOR "REGISTRATION JUST CLOSED" - do not build logic that waits on one, it
  does not exist. Practical rule instead: treat the field as final once it hits the event's published field
  size (156 MPO) OR the tournament start date is within a few days (Ledgestone is both, right now) - so picks
  should be OPEN as of this shift. Re-verify the 156 count against pdga.com/tour/event/96414 once more before
  shipping.
  THE ACTUAL FIX NEEDED (this is a permission-model bug, not a timing gate):
  1. Every league member should be able to open their OWN pick screen directly and draft their own two players -
     no "Edit picks" gate in front of a normal member. That lock should not exist for regular members at all.
  2. Commissioner keeps an OVERRIDE control (fix another member's pick if needed) - that is the only thing
     "Edit picks" should mean for the commissioner, and it should be labeled that way (e.g. "Commissioner: fix a
     pick") so it's obviously not the normal way to pick.
  3. Make sure the draft board/pick pool pulls the LATEST field data (156 MPO from Ledgestone), not a stale
     cached list.
  4. WORDING: remove the explanatory blurb about "last place drafts first / Helena Open" from the draft board -
     owner's words: "it just looks dumb," everyone in the league already knows the rule. Cut any other
     over-explained, condescending copy like this anywhere in the app; if in doubt, cut it.
  Ship as one Design build if possible. SCOPE the prompt to the Picks screen only - do not bundle with Go
  Throw/In the Bag work in the same prompt.

## CONFIRMED GOOD by owner — protect these, do NOT regress (2026-07-26 walkthrough)
- WATCH tab: great as-is — highlights, rounds, practice rounds, and the split between Ezra and Goose is exactly right.
- SETTINGS: looks good. Starter league correctly pinned up top.
- DRAFT ORDER on live app: correct (Kadey first, Cory last) — Cory won Heinola; Kadey finished last.

## HANDLED (CEO moves items here with a status once routed/answered)
- [ROUTED -> STRATEGY.md / PM NEXT] PHASE 2 = GO. Backend-first efficiency is now active: changing tournament
  data belongs in Firebase/backend, with Design reserved for actual UI changes. PM must split the migration into
  reversible tasks that protect App A. The old July 29 hard gate is superseded by the owner's 2026-07-26 directive.
- [ROUTED -> T-015 QA] DRAFT ORDER ground truth: Kadey first and Cory last is correct. Do not re-break it.
- [ROUTED -> T-009/T-014 + PM NEXT] REGISTRATION -> PICKS: v405 has shipped the Ledgestone field/unlock fix;
  QA must verify it live. PM must separately capture automatic registration-close/open logic and a discoverable
  member-facing Draft Now flow, where each member picks only their own players and the commissioner retains
  correction authority.
- [ROUTED -> T-002/T-011/T-012] DELETE BUTTONS / escape hatches: cancel/delete rounds and add/remove bag discs
  remain existing-feature hardening work.
- [ROUTED -> T-003 + PM/R&D NEXT] GO THROW competitive audit: benchmark baseline expectations against UDisc and
  other current disc-golf apps, record gaps, and route only owner-approved or existing-roadmap work for execution.
- [FOLDED INTO CEO MANDATE / EVENT_READINESS] Proactively catch pre-event wiring, missing escape hatches, broken
  permissions, and whole-app workflow defects before the owner has to report them.
- [ROUTED -> T-009/T-014/T-015] Earlier Ledgestone readiness request: v405 field sync shipped; draft order was
  confirmed already correct; both await the independent live QA closeout recorded on the board.
- [ROUTED -> T-010] ACE WALL auto-logging.
- [ROUTED -> T-011] IN THE BAG feature.
- [ROUTED -> T-012] GO THROW round management.
- [ROUTED -> T-013] LEAGUES end-to-end verification.
