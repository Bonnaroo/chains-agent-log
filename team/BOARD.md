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
2026-07-26 (Engineer): v405 (which includes v404's Go Throw polish) is now DEPLOYED live. Remaining work = verify
the three v404 polish items on the live site — effectively a QA pass now.

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

## T-006 | Designer -> Engineer | MERGED INTO T-011
**Goal:** IN THE BAG fix (owner-reported). Make managing the bag obvious: a clear way to ADD and DELETE/REMOVE a
disc, sensible handling when there are many discs, and a way out of every state. Designer specs it first, then
Engineer builds it via Claude Design (Go Throw / In the Bag only; DO-NOT-TOUCH applies).
**Done when:** A user can add and delete discs from their bag with an obvious control + confirm; many-disc list is
tidy; QA verifies in the built app; no orphan discs left in Firebase.
**Attempts:** 0
**Notes:** From FROM_OWNER.md 2026-07-26. Anchor UX principle: every action has a clear way out + explanation.
2026-07-27 (PM): groomed — T-006 is fully absorbed by T-011 (per T-011 notes). No separate work; do not claim T-006.

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

## T-009 | CEO/PM | IN_PROGRESS (HIGH PRIORITY — time-boxed to the event)
**Goal:** LEDGESTONE OPEN pre-event readiness. Drive team/EVENT_READINESS.md to green: correct event ID/naming,
the pickable pro field = the REAL registered Ledgestone field, picks unlock when the field is in, standings/
stats/schedule/history correct, Live Chains queued, and all background event numbers/identifiers lined up.
**Done when:** Every box in EVENT_READINESS.md (Active Event section) is checked green, with any gap fixed and
verified; confirmed in team/logs/ceo.md before ~2026-07-30.
**Attempts:** 0
**Notes:** Owner's job #1 right now. The recurring risk is truth-of-data + background event wiring — verify explicitly.
2026-07-26 18:58 UTC [GPT] CEO moved T-009 to IN_PROGRESS after finding a concrete background failure:
`chains-dgpt-data/data/field.json` was freshly generated at 18:41:51Z with null event ID/zero players because
`collect_field.py` ends at T13/96413; `events.txt` ends at 96410 and `data/events/96414-MPO.json` is absent.
PDGA event 96414 currently shows 156 MPO registrations. v405's fallback masks this failure. PM must assign a
narrow Engineer data-repo repair; require regenerated 96414/156 evidence and independent live QA before green.
2026-07-26 20:00 UTC [GPT] CEO completed the narrow backend repair under T-009. Data commit
`4cb6a21ba221d77e9a1bf8590c5add72a34ca7dc` added T14/96414 to `collect_field.py` and added 96411-96414 to
`events.txt`; local Python syntax validation passed. Manual Actions run 30217973885 (#521) succeeded in 39s and
generated commit `03b17dc284b9c61c8601033daac67f0ad7581a32`. Fresh `field.json` = T14/96414 with 154 named players;
fresh `96414-MPO.json` = 156 slots (154 PDGA-numbered + two Sunday Qualifier placeholders). ID-set comparison:
154/154, zero missing, zero extra. Backend is fixed; T-009 stays IN_PROGRESS for independent live QA only.
2026-07-26 21:05 UTC [GPT] CEO proved the repair survives unattended execution. The first post-fix scheduled
`Collect DGPT Data` run 30219698728 (#522) triggered via schedule at 20:46 UTC, completed Success in 1m 7s from
base commit `8e7ba35597d8c760d85437e75302ee6d85b6ce67`, and generated data commit
`5fc3a0e7466c3985566efb8bcf8fa2bc95719535`. At that exact commit, `field.json` is T14/96414 with 154 named
players updated 20:47:51Z; `96414-MPO.json` has 156 slots collected 20:47:39Z (154 numbered + two Sunday
Qualifier placeholders). PDGA-number comparison remains 154/154 with zero missing/extra. Scheduled collection
is now independently proven; T-009 remains IN_PROGRESS only for the already-assigned live/drafting QA gates.
2026-07-27 00:28 UTC [GPT] CEO deadline audit kept T-009 IN_PROGRESS/AMBER. Reused [CLAUDE]'s independent v406
feed/draft-order proof rather than changing picks. Live https://bonnaroo.github.io/chains-app loaded as
`Chains · Fantasy DGPT 2026` and shows Ledgestone PICKS OPEN; app main HEAD `b3be810` only removes the stray
miscased file, while served lowercase v406 came from `30a2201`. Current data artifacts remain healthy:
`field.json` blob `ecc27a0` = T14/96414, 154 players, updated 23:54:03Z; `96414-MPO.json` blob
`cb8c2ba` = 156 slots, collected 23:53:51Z. Primary-source risk: PDGA 96414 currently has no Tee Time table;
DGPT's 3:00 PM CDT MPO listing is a broadcast start, not first tee. Readiness stays amber for T-016 and T-017.

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

## T-014 | CEO/PM -> Engineer | DONE
**Goal:** Sync the REAL registered Ledgestone Open MPO field into the app's Picks page. The Picks page for T14
currently shows "Loading the registered field for this event" even though the real field is published (156 MPO
players, PDGA event 96414, dgpt.com/event/2026-ledgestone-open, last updated 2026-07-26). Find and fix whatever
is blocking the field-sync (data source, trigger, or Firebase write) so the real field loads and picks unlock.
**Done when:** The Picks page for Ledgestone Open shows the real 156-player MPO field (name-matched, no stale/
missing/extra players) and members can draft from it; verified by QA.
**Attempts:** 2
**Notes:** From CEO event-readiness pass 2026-07-26 (EVENT_READINESS.md). Event ID/name/dates already verified
correct — this is specifically the field-loading step. Ledgestone starts 2026-07-30; this is time-critical.
Claimed by Engineer 2026-07-26: scoped Claude Design prompt sent covering T-014 + T-015 together (same screen).
2026-07-26 16:46 UTC (Engineer, attempt 2): v405 built, VERIFIED in Design preview (T14 REGISTERED tab shows
154 named pros updated Jul 25 8:00 PM; T14 card DRAFTING; picks unlocked) and DEPLOYED live (full 9,641,939
bytes served). The build bundles a snapshot fallback (156 registered incl. 2 Sunday-Qualifier TBD, PDGA 96414,
self-expires Aug 3) AND reads the live field.json feed from Bonnaroo/chains-dgpt-data (updates every 2h via
GitHub Actions). QA: verify field 1:1 vs pdga.com/tour/event/96414 on the LIVE site, then close.
2026-07-26 18:58 UTC [GPT] CEO background audit: do not close T-014 as background-ready yet. The current
`data/field.json` feed is fresh but empty/null because `collect_field.py` omits T14/96414. The live screen may
still pass from the expiring fallback; QA must distinguish fallback success from repaired-feed consumption.
2026-07-26 20:00 UTC [GPT] Backend blocker repaired and generated artifacts verified. QA may now perform the
independent live pass: prove the app consumes fresh T14/96414 feed data, compare all 154 named PDGA-numbered
players (plus two displayed Sunday Qualifier slots where applicable), and confirm picks are open/own-only.
2026-07-26 23:55 UTC [CLAUDE] QA CLOSED T-014. Live pass on bonnaroo.github.io/chains-app (v406, commit 30a2201):
the app itself fetched raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/field.json (seen in the
page's own resource timing, no cache-buster) — real feed consumption, not the bundled fallback. Registered tab
shows "LEDGESTONE OPEN — 154 pros registered · updated Jul 26, 6:52 PM" which matches the 22:52:22Z scheduled
feed run (event_tag T14, event_id 96414, 154 players). No Sunday Qualifier placeholders shown as draftable.
Picks screen: T14 DRAFTING, picks open. OPEN FINDING for PM (out of T-014 scope): signed in as member WILL-C,
tapping "Edit picks" unlocked ALL six members' player+score fields ("Editing unlocked — set members' players
and scores") — there is no member own-only drafting restriction visible; commissioner-vs-member permission and
a member-facing Draft Now flow still need product work (already routed in FROM_OWNER HANDLED). No picks changed.

## T-015 | CEO/PM -> Engineer | DONE (NOT A BUG)
**Goal:** Fix the T14 (Ledgestone Open) draft order, which appears REVERSED. The app states "Heinola Open last
place picks first" and shows order KADEY, SHANNA, GABE, WILL, KYLE, CORY — but per the T13 Heinola standings
columns, KADEY placed 1st (best, 6pts) and CORY placed 6th (worst, 1pt), so the worst-place-first rule should
start with CORY, not KADEY. Current order runs best-to-worst instead of worst-to-best. Verify the draft-order
formula/sort direction and correct it before the draft locks.
**Done when:** Draft order for T14 (and future events) correctly starts with the prior event's last-place
finisher and ends with the prior event's first-place finisher; verified against standings data by QA.
**Attempts:** 2
**Notes:** From CEO event-readiness pass 2026-07-26 (EVENT_READINESS.md). Coordinate with T-014 (fix field load
first, or in the same pass, since both block real drafting for this event).
Claimed by Engineer 2026-07-26: bundled into the same scoped Claude Design prompt as T-014 (same screen/data
path). 2026-07-26 (Engineer, attempt 2): NOT A BUG. Verified in v405 preview: T13 Heinola RESULT is CORY 1st
(-42) ... KADEY 6th (-27); draft order KADEY, SHANNA, GABE, WILL, KYLE, CORY = exactly worst-to-best. The CEO
readiness pass had the Heinola columns inverted; the owner also confirmed in Design chat the order is right.
Design left the code untouched. QA: confirm the same on the LIVE site and close as not-a-bug.
2026-07-26 23:55 UTC [CLAUDE] QA CLOSED T-015 as NOT A BUG. Live site dashboard + Picks (v406): draft order
KADEY, SHANNA, GABE, WILL, KYLE, CORY with "Heinola Open last place picks first"; T13 result panel shows CORY
1st (-42) ... KADEY 6th (-27). Matches owner ground truth (Kadey first, Cory last). Do not re-break.

## T-016 | Designer -> Engineer | IN_PROGRESS
**Goal:** Member own-only drafting + discoverable "Draft Now" flow. QA (2026-07-26 23:55Z, T-014 closeout) proved that as
regular member WILL-C, tapping "Edit picks" unlocks ALL six members' player AND score fields ("Editing unlocked — set
members' players and scores") — no own-only restriction exists. Build: a member can set only their OWN players from the
registered field; commissioner retains full correction authority; add a clear member-facing Draft Now entry point.
Scoped Claude Design prompt (Picks screen only; DO-NOT-TOUCH applies; do NOT alter draft-order logic — CONFIRMED GOOD
by owner, Kadey first / Cory last).
**Done when:** A signed-in member can edit only their own picks (others read-only to them); commissioner can still
correct all; Draft Now is discoverable from the member's view; QA verifies live WITHOUT changing any picks/scores on
the starter league.
**Attempts:** 0
**Notes:** From FROM_OWNER HANDLED routing + QA open finding 2026-07-26. Time-sensitive: Ledgestone tees off
2026-07-30. WARNING: "Edit picks" auto-saves — never test by selecting players on the live league (see LESSONS).
2026-07-27 01:15 UTC [CLAUDE] (QA): Correction — this office browser's Firebase uid equals chains_commish_uid_v1, so
the WILL-C session used for the 23:55Z proof IS the commissioner account. Member-session behavior is UNVERIFIED; the
build gap stands on UI evidence alone (read-only banner: "Only the commissioner edits picks"; no member Draft Now
entry). Engineer can proceed; final QA closeout needs a true member login.
2026-07-27 02:10 UTC [CLAUDE] (Engineer): IN_PROGRESS — scoped Design prompt SENT (Picks screen only: member
own-only two-pick editing when DRAFTING, commissioner uid chains_commish_uid_v1 keeps full authority, member
Draft Now entry when picks incomplete, member banner copy; DO-NOT-TOUCH: draft order, scoring, standings, Watch,
Settings, Go Throw, field.json feed). Build was Scrambling at send time — next shift verifies the new version
(v407+) in the Design preview, then deploy per kb/deploy.md; QA closeout still needs a true member login.

## T-017 | Engineer | ASSIGNED
**Goal:** Pick-lock at first tee + automatic registration-close -> draft-open handling for T14 and future events:
picks lock when the event's first round tees off (Ledgestone 2026-07-30); WD/withdrawn players are flagged
non-draftable before lock; registration close automatically opens drafting (no manual step).
**Done when:** Picks show a clear locked state at event start; WD players non-draftable; registration-close ->
draft-open happens automatically; QA verified; no orphan records.
**Attempts:** 0
**Notes:** Created by PM 2026-07-27 from FROM_OWNER HANDLED routing + HANDOFF. Coordinate with T-016 (same Picks
screen) — bundle into one scoped Design prompt only if deliberate.
2026-07-27 00:28 UTC [GPT] Implementation guardrail: compute lock from the earliest official player tee time in
PDGA's event-96414 tee-time table once published; do not use DGPT's projected 3:00 PM CDT broadcast start. Until
an official tee-time table exists, keep readiness amber, recheck the primary page, and do not claim the deadline
verified. Preserve commissioner correction authority and the confirmed Kadey-first/Cory-last order.
2026-07-27 01:15 UTC [CLAUDE] (QA): PDGA 96414 re-fetched ~01:00Z — still no tee-time table; page last updated
25-Jul 19:20 CDT. Deadline remains unavailable; readiness stays amber.

