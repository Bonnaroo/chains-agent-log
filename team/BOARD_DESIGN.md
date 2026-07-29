# DESIGN/ENGINEER LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

(no open tasks yet - seeded 2026-07-28)

## T-D01 | ASSIGNED | PRIORITY: TOP (owner walkthrough, 2026-07-28)
**Goal:** GO THROW pre-round flow escape hatches. Owner walked the live app and found real dead-ends:
(a) After picking a course + friends, on the "send invite" step there is no clear way to NOT send an invite/
   cancel out of it, and no clear way to go back and delete an invite already sent.
(b) "Upcoming Rounds" has a delete/cancel control ("Delete plan") but owner could not find it easily — make it
   obviously visible and consistently placed, not something you stumble into.
**Done when:** From the course+friends pick screen there's an obvious Cancel/Back that doesn't send an invite;
an already-sent invite/plan can be found and deleted from Upcoming Rounds with an obvious, visible control;
owner can walk this flow start-to-finish and never gets stuck.

## T-D02 | ASSIGNED | PRIORITY: TOP
**Goal:** SCORING SCREEN player picker. Right now the scoring screen shows placeholder text "Player, Player,
Player" instead of real players. Replace with an actual friends list: dropdown/searchable list of the user's
friends, simple add-a-player flow, no placeholder text ever shown to a real user.
**Done when:** Starting a round lets you pick real friends by name (search or dropdown), not generic placeholders.

## T-D03 | ASSIGNED | PRIORITY: TOP
**Goal:** IN-PROGRESS ROUND card behavior. Owner left a round mid-play; it correctly shows "Resume round in
progress" with an X to discard - but there is ALSO a separate "Live Now" card for the same round, and clicking
that live card lets you click INTO it, which shouldn't be needed/possible for your own in-progress round from
that entry point - you should be able to discard directly without being forced to open it first.
**Done when:** Your own in-progress round's card lets you Resume or Discard directly; you are not forced to
open/click into "Live Now" just to get to a discard option. (Other people's live rounds - i.e. Watch - are a
separate, correct feature; do not change that.)
**DO NOT TOUCH:** the WATCH feature for OTHER people's live rounds - owner confirmed that's good as-is.

## T-D04 | ASSIGNED | PRIORITY: HIGH
**Goal:** REMOVE the Ace Wall feature entirely (owner: "we don't need the ace wall, that's stupid"). Keep the
underlying behavior of auto-logging an ace into the player's OWN stats/game log when it happens during scoring
- just remove the separate Ace Wall screen/feature, don't remove ace auto-detection.
**Done when:** Ace Wall is gone from the UI/nav; scoring an ace (18 on a hole... i.e. a 1, hole-in-one) still
logs correctly into the player's personal stats.

## T-D05 | ASSIGNED | PRIORITY: MEDIUM
**Goal:** "YOUR GAME" stats expansion. Owner likes this feature and wants it built out: show stats for the
specific course currently being played / a selected course (not just overall), AND overall/all-time stats
across all rounds. Round out with reasonable additional stat types (scoring average, best round, rounds played,
etc.) - use good judgment on what a disc golf player would want to see, this does not need a design decision
from the owner first.
**Done when:** Your Game shows per-course stats (selectable) and overall stats, with a real, useful stat set.

## CONFIRMED GOOD - DO NOT REGRESS (owner walkthrough 2026-07-28)
- WATCH / "Live Now" for other people's rounds - correct as-is, do not change the broadcast/watch mechanic itself
  (T-D03 above only changes YOUR OWN round's card, not how others' live rounds are watched).
- IN THE BAG - owner: "I really like it. All that's really good." No changes needed - protect this.

## GENERAL DIRECTIVE FOR ALL GO THROW WORK
Owner's words: "make sure it works intuitively, so any 15-year-old could use it... I don't want you to dumb it
down, I just want you to fix stuff." Read this as: fix real usability bugs and confusing flows, don't strip
features or add hand-holding text/explainers. If something needs an explanation to be usable, that's a sign the
FLOW is broken, not that it needs more instructional copy.

## T-D06 | ASSIGNED | PRIORITY: TOP (owner: phone not showing updates, 2026-07-29)
**Goal:** Two real bugs found while investigating owner's "phone shows no updates" report. (1) index.html
registers a service worker at /sw.js via navigator.serviceWorker.register('sw.js') but that file returns 404 -
it's dead/broken code that could cause unpredictable caching on some phones. Either build a real, correct
service worker with proper update/activate logic (skipWaiting + clients.claim, cache versioned by app version so
old caches get purged on new deploys) OR remove the registration entirely if offline support isn't a near-term
goal - do not leave a broken registration in place either way. (2) The new version-number indicator (shipped in
v411, in the sidebar) is likely invisible on mobile if the sidebar isn't part of the mobile layout - confirm,
and if so, add a visible version indicator somewhere in the mobile view too (e.g. Settings screen) so version
can always be confirmed regardless of device.
**Done when:** No 404s for sw.js in console (either a working SW or no registration at all); version number is
visible and confirmable on both desktop AND mobile layouts.
