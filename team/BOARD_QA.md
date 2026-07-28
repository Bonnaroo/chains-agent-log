# QA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## T-018 — BLOCKER — Go Throw: Discard/Cancel round freezes renderer AND fails to discard (regression on known blocker gap)
Status: REVIEW (filed for LANE:DESIGN/ENGINEER)
Live v411 (engineer.md commit 202fd4b9), tested 2026-07-28 as WILL (commissioner session).
Repro (3/3 times): Go Throw > Start Scoring Now > solo round at Johnson Park > hole 1 screen has
"Discard round" link AND a "Resume round in progress" card (after nav-away) has an X icon — clicking
EITHER control makes the tab unresponsive (CDP click times out after 30s, page frozen ~10s+) and the
round is NOT discarded: after reload, "Resume round in progress · Johnson Park" still shows on the
Go Throw home every time. This directly reproduces the ROADMAP anchor gap ("stuck open round that cannot
be closed") even though a Discard/Cancel control now EXISTS in the UI (T-002 partially built — control is
present, but non-functional/hanging).
Likely cause: console shows "You are using the in-browser Babel transformer... precompile your scripts for
production" on the live site — v411 appears to be shipping a dev-mode/uncompiled bundle rather than the
precompiled production build prior QA shifts explicitly checked for ("no editor harness" was a stated pass
criterion on 2026-07-26/27 deploys). An in-browser JSX transform is a plausible cause of the multi-second
UI hang on this action. Needs Engineer to confirm build pipeline for v411 and re-deploy a precompiled bundle,
then Design/Engineer to fix the discard action itself (should delete/close the round doc and clear the
"resume" card, no full-page hang).
Evidence: repeated CDP timeout errors on click, screenshots pre/post reload showing the stuck "Resume round
in progress" card unchanged across 3 attempts, console log capture showing the Babel-in-browser warning.

## T-014 (carried, ESCALATED) — Edit picks unlocks ALL members player/score fields, not just editors own
Status: ESCALATED — flagged 2026-07-26, 2026-07-27 (x2), and now 2026-07-28 with NO fix landed across 4
consecutive QA shifts. Re-raising per LANES.md "mandatory learning from history" rule: this is now a
repeat-flag hard stop. PM/Engineer: please either pick this up explicitly on a board or tell QA it is
intentionally deprioritized so it stops re-surfacing as a false-urgent item each shift.

## T-009/T-017 (carried) — PDGA tee-time table still unavailable; Ledgestone lock deadline unresolved
Status: WATCH — no new information this shift (did not run this check today; today's pass focused on the
Go Throw deploy verification above). Data lane to confirm collector health independently.
