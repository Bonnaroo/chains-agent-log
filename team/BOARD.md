# Task Board
<!-- Statuses: BACKLOG -> ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->
<!-- Only the PM creates tasks and moves them to ASSIGNED. -->
<!-- Workers move their own tasks ASSIGNED -> IN_PROGRESS -> REVIEW. -->
<!-- Only QA or PM moves tasks REVIEW -> DONE. One owner per task. -->

## T-001 | Engineer | DONE
**Goal:** Verify v404 (Go Throw polish: tap-any-hole edit, solo instant-start, finish/share card) in the
Design preview against the checklist, then DEPLOY it live via kb/deploy.md.
**Done when:** Live app at bonnaroo.github.io/chains-app is v404, the three polish items work, no console errors.
**Attempts:** 1
**Notes:** ✓ Deployed 2026-07-28 23:43:28 UTC via GitHub API. Commit: 11ecf7ad3aa1253fc132c2e2738580781d1ef5be. File: index.html SHA 89e6fb73. Verified: no editor harness, no betting strings, correct title. Live app now running v404.

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

## T-009 | CEO/PM | ASSIGNED (HIGH PRIORITY — time-boxed to the event)
**Goal:** LEDGESTONE OPEN pre-event readiness. Drive team/EVENT_READINESS.md to green: correct event ID/naming,
the pickable pro field = the REAL registered Ledgestone field, picks unlock when the field is in, standings/
stats/schedule/history correct, Live Chains queued, and all background event numbers/identifiers lined up.
**Done when:** Every box in EVENT_READINESS.md (Active Event section) is checked green, with any gap fixed and
verified; confirmed in team/logs/ceo.md before ~2026-07-30.
**Attempts:** 0
**Notes:** Owner's job #1 right now. The recurring risk is truth-of-data + background event wiring — verify explicitly.

## T-010 | Designer -> Engineer | ASSIGNED
**Goal:** ACE WALL auto-logging. Remove manual "log an ace"; instead auto-log an ace when a player records a 1
on a hole during a Go Throw round. Ace appears on the Ace wall automatically, attributed to the player + hole + course.
**Done when:** Scoring a 1 in a round creates the ace entry automatically; no manual ace entry path remains; QA verified.
**Attempts:** 0
**Notes:** From FROM_OWNER 2026-07-26.

## T-011 | Designer -> Engineer | ASSIGNED
**Goal:** IN THE BAG as a real feature: quick disc COUNT at the top; drill-down to see all discs; optional
detailed inventory (log every disc you own) that can be SHARED so other users can view your bag; plus obvious
add/delete-disc with a way out (supersedes/absorbs T-006).
**Done when:** A user can see their disc count, view all discs, add/remove discs (with confirm + way out), and
optionally build + share a detailed bag others can view; QA verified; no orphan discs in Firebase.
**Attempts:** 0
**Notes:** From FROM_OWNER 2026-07-26. Folds in T-006 (mark T-006 merged into T-011 when PM grooms).

## T-012 | Engineer | ASSIGNED
**Goal:** GO THROW round management completeness: start a round, save it, delete finished rounds, QUIT/cancel a
round mid-play (folds into T-002), and ADD or REMOVE players in the middle of a round. Each action has a clear
control + confirm + way out.
**Done when:** All of the above work in the built app and persist correctly (no orphan/stuck records); QA verified.
**Attempts:** 0
**Notes:** From FROM_OWNER 2026-07-26. Coordinate with T-002 (cancel/delete round) so they don't collide.

## T-013 | QA | ASSIGNED
**Goal:** LEAGUES end-to-end check: create-a-league flow + all league features (invite, commissioner controls,
leave, read-only board) work; starter league stays pinned up top. Log defects for the PM.
**Done when:** A dated pass/fail of the league flows is in team/logs/qa.md; any breakage filed for the PM.
**Attempts:** 0
**Notes:** From FROM_OWNER 2026-07-26.
