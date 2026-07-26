# Task Board
<!-- Statuses: BACKLOG -> ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->
<!-- Only the PM creates tasks and moves them to ASSIGNED. -->
<!-- Workers move their own tasks ASSIGNED -> IN_PROGRESS -> REVIEW. -->
<!-- Only QA or PM moves tasks REVIEW -> DONE. One owner per task. -->

## T-001 | Engineer | ASSIGNED
**Goal:** Verify v404 (Go Throw polish: tap-any-hole edit, solo instant-start, finish/share card) in the
Design preview against the checklist, then DEPLOY it live via kb/deploy.md.
**Done when:** Live app at bonnaroo.github.io/chains-app is v404, the three polish items work, no console errors.
**Attempts:** 0
**Notes:** v404 was sent to Design in a prior session and should be built or building. If still building, park and note it.

## T-002 | Engineer | ASSIGNED
**Goal:** BLOCKER — add a reachable Cancel/Delete control for IN-PROGRESS (live/open) rounds in Go Throw.
Live rounds currently show only as "Watch ->" cards with no way to cancel/abandon; add a Cancel Round control
(mid-play, with confirm) and make live rounds openable so they can be cancelled/deleted. Delete must also work
for finished rounds. Do it via a scoped Claude Design prompt (Go Throw only; DO-NOT-TOUCH list applies).
**Done when:** A user can cancel/abandon an in-progress round and delete a finished one from the UI, with a
confirm step; verified by QA in the built app; no orphan records left in Firebase.
**Attempts:** 0
**Notes:** Anchor "no way out" bug (ROADMAP principles 1 & 2). Stuck test rounds were cleared from Firebase
2026-07-26 (_trash/1785076527527); the missing UI control is the real fix.

## T-003 | QA | ASSIGNED
**Goal:** Full ROADMAP audit pass of the current live app — walk every screen + every button against the 6
principles (way-out, reachable destructive/in-progress actions, data survives refresh, truth-of-data,
security, live-updates) and run 2 adversarial thought experiments. Log every defect as notes for the PM.
**Done when:** A dated findings list is in team/logs/qa.md with a severity per issue; PM can turn them into tasks.
**Attempts:** 0
**Notes:** Use the FEATURE CHECKLIST in ROADMAP.md. QA never creates board tasks — log findings, PM converts them.

## T-004 | Designer | ASSIGNED
**Goal:** Spec the Cancel/Delete-round UX (T-002): where the control lives on the live-round card and the
scoring screen, the confirm copy, and the empty-state after cancelling. Deliver as a markdown spec.
**Done when:** A concrete spec an engineer can implement without asking questions, committed to team/ (or a
design note in DECISIONS.md); linked from T-002.
**Attempts:** 0
**Notes:** Keep consistent with the existing Go Throw look; principle 1 (every action has a clear way out + explanation).

## T-005 | Marketing | ASSIGNED
**Goal:** Draft app-store / landing "what is Chains" positioning copy (short + long) and a launch checklist,
as DRAFTS for Guillermo. Nothing published.
**Done when:** Markdown drafts committed to team/marketing/; sources cited if any research used.
**Attempts:** 0
**Notes:** Marketing site already live at bonnaroo.github.io/chains-site; this is supporting copy + launch prep only.
