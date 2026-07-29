# DESIGN/ENGINEER LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

**v413 DEPLOYED — URGENT PICKS UNLOCK (2026-07-28 21:15 UTC)**
Regular members can now pick directly for Ledgestone (no "Edit picks" gate). Commissioner keeps override control ("Commissioner: Fix a pick"). Explanatory text removed. Status: LIVE. Commit: f27dc6f0.


(seeded 2026-07-28)

## T-D07 | CRITICAL BLOCKER | PRIORITY: TOP — URGENT (Ledgestone event ~20 hours away)
**[2026-07-29 04:02 UTC RE-ESCALATION by [CLAUDE]] Status remains CRITICAL: "Discard round" hang persists AFTER v413 deployment. QA verified at 03:56 UTC today that issue remains unfixed. This is NOW 4 consecutive shifts (2026-07-28 19:55 through 2026-07-29 03:56) with T-018 unresolved.**

**Goal:** FIX REGRESSION: "Discard round" link in Go Throw causes 30-second browser CDP timeout hang, and round is NOT actually discarded (remains stuck in Firebase). This is a critical regression from v409/v410 (prior QA passes verified "no editor harness"/production builds). v412 shows "using in-browser Babel transformer, precompile for production" warning in console — root-cause investigation required.
**Done when:** (1) Root cause identified and fixed (likely: v412 index.html contains non-production Babel transformer instead of precompiled bundle); (2) "Discard round" control responds in <1 second and actually discards the round from Firebase; (3) QA re-verifies the fix across multiple round types; (4) Deployed live.
**Why urgent:** ROADMAP anchor feature (escape hatch: cancel/delete in-progress round); Ledgestone starts 2026-07-30 ~20 hours (members will play Go Throw rounds mid-event; stuck rounds block the feature). This was reproduced 3/3 times in QA testing on v411 and re-confirmed broken on v412+v413. **NOT A POLISH ISSUE — this is a complete blocker.**
**Attempts:** 1 (v413 deployed but hang persists)
**Notes:** Hints for investigation: search v412 index.html for "Babel", "transformer", or "precompile" warnings in console. Prior deploys (v406-v410) had no such warning. Compare v412 build artifacts to v409's precompiled structure. **ESCALATION: If this cannot be fixed within the next 2 hours, consider rollback to v411 as emergency fallback (v411 has the picks UX fix; Go Throw hang may be less severe). Do NOT allow this to reach Ledgestone tee-off broken.**

## T-D01 | DEPLOYED v412, awaiting real-member verification | PRIORITY: TOP (owner walkthrough, 2026-07-28)
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

## T-D08 | ASSIGNED | PRIORITY: TOP (2026-07-29 02:03 UTC routed by CEO)
**Goal:** REPORT A BUG button — create a visible, discoverable "Report a Bug" affordance for users. Owner wants a real feedback channel so users can submit bug/issue reports directly from the app. Consider Settings as default location, plus evaluate whether a small persistent icon elsewhere makes sense (e.g. Help or feedback button in nav). Affordance should include a short text field for the issue description and auto-capture context data (current screen/section, timestamp, uid).
**Done when:** User can see and tap a "Report a Bug" or "Send Feedback" button from at least the Settings screen; tapping opens a form with a text field for the issue, screen context is auto-captured (or user can edit it), and submission stores the report (Data lane owns the Firebase side).
**Notes:** This is the UI/Design part. Data lane (BOARD_DATA.md) owns creating the /bugReports Firebase node and a read interface (count/summary) for CEO/QA to surface reports in daily operations so they become actionable board tasks, not just stored data.

## T-D09 | NEW | PRIORITY: HIGH | ROUTED from BUG_REPORTS_INBOX 2026-07-29 04:02 UTC
**Goal:** FIX: Field roster not loading on mobile Safari. User (user-test-002) reported on 2026-07-28T17:38:20Z that the field-view screen (Picks/Draft roster display) does not render correctly in Safari on iOS/iPad.
**Symptoms:** iOS/Safari browser hangs or displays blank/incomplete field roster when viewing the Picks screen for the active tournament.
**Done when:** Field roster loads and displays correctly in Safari on both iPhone and iPad; no rendering gaps, no hangs, team roster is fully visible and scrollable.
**Notes:** This is a mobile-specific rendering issue (Safari). Ledgestone event starts 2026-07-30 (~20 hours); iOS users may encounter this during live draft. HIGH priority: diagnose and fix within 6 hours if possible.
**Context from report:** Screen=field-view, Version=1.0.0 (app version), UID=user-test-002.

## CONFIRMED GOOD - DO NOT REGRESS (owner walkthrough 2026-07-28)
- WATCH / "Live Now" for other people's rounds - correct as-is, do not change the broadcast/watch mechanic itself
  (T-D03 above only changes YOUR OWN round's card, not how others' live rounds are watched).
- IN THE BAG - owner: "I really like it. All that's really good." No changes needed - protect this.

## GENERAL DIRECTIVE FOR ALL GO THROW WORK
Owner's words: "make sure it works intuitively, so any 15-year-old could use it... I don't want you to dumb it
down, I just want you to fix stuff." Read this as: fix real usability bugs and confusing flows, don't strip
features or add hand-holding text/explainers. If something needs an explanation to be usable, that's a sign the
FLOW is broken, not that it needs more instructional copy.
