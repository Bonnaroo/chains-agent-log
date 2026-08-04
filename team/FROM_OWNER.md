# FROM OWNER — Guillermo's desk (drop anything here; the CEO triages it every shift)

How to use: add a line under NEW with whatever you noticed. Half-formed is fine. The CEO turns it into work and
replies in TO_OWNER.md. You never talk to the workers directly.

## NEW (unprocessed — CEO picks these up)

(none)

## HANDLED (CEO moves items here with a status once routed/answered)
- [ROUTED 2026-08-04 by [GPT] -> BOARD T-C01 / DATA] REGULAR BACKUPS. Assigned a recurring, retrievable Firebase backup design with explicit node scope, cadence, rolling retention, restore procedure, and non-production restore drill. This is planning/implementation work for the Data lane; no deletion or legacy `chains-fantasy /league` access is authorized.
- [ROUTED 2026-08-04 by [GPT] -> BOARD T-C02 / STRATEGY] SCALE FOR REAL GROWTH. Added a tracked many-league planning gate covering isolation, security rules, RTDB vs Firestore, cost thresholds, observability, and migration triggers. This is an options brief, not authorization for a parallel app/repository or a mid-season migration.
- [COMPLETED 2026-08-04 by [GPT] -> STRATEGY T-C02] SCALE FOR REAL GROWTH. Delivered the requested source-backed options brief in the existing `team/STRATEGY.md`: harden APP A RTDB in place for the season; recommend Firestore-first durable state for future APP B with RTDB only for measured live-sync needs; defined usage/provider triggers, migration/cost/security risks, observability, and owner decisions. No build, repository, database, or live-data change was made.
- [ROUTED 2026-08-04 by [GPT] -> BOARD T-C03 / CEO SUPERVISION] STOP STOPPING. Blocked lanes must complete and evidence an allowed fallback in the same shift; blocked-with-no-fallback is a supervision failure that CEO/PM must surface and correct.
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
- [ROUTED -> T-D08 (BOARD_DESIGN) + BOARD_DATA] REPORT A BUG button (2026-07-29 02:03 UTC). Owner wants a
  visible feedback channel: a "Report a Bug" button (Settings or persistent affordance) with short text field +
  screen context capture. Data: /bugReports/<id> Firebase node + read interface for CEO/QA to surface counts/
  summaries in reports. Ensures user-submitted bugs become actionable board tasks, not just stored data. Added
  to both lane boards, TOP priority (user feedback is critical for live operations).
- [ROUTED -> TO_OWNER.md + T-D07 escalation] PICKS ARE STILL LOCKED (2026-07-29 02:03 UTC). v413 deployed with
  picks unlock (direct Player 1/Player 2 pickers for members, commissioner "Fix a pick" override). QA verified
  from commissioner account. **Needs owner member-account live verification before Ledgestone starts (~22 hours).**
  Sign into app from member account (phone recommended) and confirm: (1) direct pickers visible, (2) no "Edit
  picks" gate, (3) dropdowns clickable. Updated TO_OWNER.md with verification request. Also re-escalated urgent
  T-018 (Discard hang, v413 still broken per QA) to TO_OWNER.md — this is the hard blocker preventing Ledgestone
  playability.
- [ROUTED -> TO_OWNER.md / AWAITING OWNER DECISION] T-014 hard-stop escalation (5th consecutive flag since
  2026-07-26). Edit picks over-broad unlock remains unresolved. Owner must decide: (a) FIX THIS SHIFT (Engineer
  rebuilds with uid guard), or (b) ACCEPT AS-IS (acknowledge, protect from regression). No PM routing exists; cannot
  remain unrouted a 6th shift. Prior CEO shift escalated; this shift re-confirms urgency. Response needed in
  TO_OWNER.md or email to diamashield@gmail.com.
- [ROUTED -> BOARD_DESIGN.md / T-D07 / URGENT] T-018 CRITICAL regression (Discard round hang, 30s timeout, round
  NOT discarded, stuck in Firebase). Persists after v413 deploy (verified QA 08:20 UTC). Root cause suspected:
  Babel transformer in v412 build instead of precompiled production. Blocks ROADMAP anchor feature + Ledgestone
  playability (~22 hours to event). Prior CEO shift filed T-D07; this shift re-escalates urgency: Design/Engineer
  must investigate immediately and deploy fix or rollback before ~03:00 UTC (12 hours before Ledgestone tee-off).
  If diagnosis takes >30 min, escalate to owner with "consider rollback to v411?" question.
- [NOTED / POST-LEDGESTONE LOW PRIORITY] SIGN OUT BROKEN. "Tap to sign out" button in navigation does not work.
  Minor UX issue (users can close browser tab / PWA app). Not urgent for Ledgestone (July 30 start). Route to
  whoever owns authentication flow once event concludes.

## CONFIRMED GOOD by owner — protect these, do NOT regress (2026-07-26 walkthrough)
- WATCH tab: great as-is — highlights, rounds, practice rounds, and the split between Ezra and Goose is exactly right.
- SETTINGS: looks good. Starter league correctly pinned up top.
- DRAFT ORDER on live app: correct (Kadey first, Cory last) — Cory won Heinola; Kadey finished last.
