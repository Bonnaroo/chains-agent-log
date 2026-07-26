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

## T-006 | Designer -> Engineer | ASSIGNED
**Goal:** IN THE BAG fix (owner-reported). Make managing the bag obvious: a clear way to ADD and DELETE/REMOVE a
disc, sensible handling when there are many discs, and a way out of every state. Designer specs it first, then
Engineer builds it via Claude Design (Go Throw / In the Bag only; DO-NOT-TOUCH applies).
**Done when:** A user can add and delete discs from their bag with an obvious control + confirm; many-disc list is
tidy; QA verifies in the built app; no orphan discs left in Firebase.
**Attempts:** 0
**Notes:** From FROM_OWNER.md 2026-07-26. Anchor UX principle: every action has a clear way out + explanation.

## T-007 | Engineer | ASSIGNED
**Goal:** COUNCIL / Admin dashboard v1 (READ-ONLY). A separate small page (its own repo + GitHub Pages, e.g.
Bonnaroo/chains-admin — NOT inside the product app) that reads Firebase and shows live metrics: # accounts,
# leagues, # players, # rounds (play/live), # waitlist signups, and a list of open GitHub Issues. Owner-facing.
**Done when:** Guillermo can open one page and see current counts + the issue list. Read-only only — no delete/
create yet (management actions are a later, carefully-authed task). Link it in TO_OWNER.md when live.
**Attempts:** 0
**Notes:** From FROM_OWNER.md 2026-07-26 ("the council"). Points at App A's Firebase (chains-app-f38f8) for now;
will repoint to App B later. Use the anon-auth read pattern from kb/firebase.md. Management actions = future task.

## T-008 | PM | ASSIGNED
**Goal:** Keep STRATEGY.md's phase gate honored: do NOT let any coding-path/rebuild work start before 2026-07-29.
Until then, all engineering is Claude-Design polish on App A. Groom the board to reflect this.
**Done when:** Board + assignments contain no Phase-2 code-rebuild tasks before 2026-07-29; note it in the pm log.
**Attempts:** 0
**Notes:** Owner gated the coding path to "a few days" out. CEO owns STRATEGY.md; PM enforces the gate on the board.
