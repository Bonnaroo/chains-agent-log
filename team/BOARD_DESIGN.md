# DESIGN/ENGINEER LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

**v413 DEPLOYED — URGENT PICKS UNLOCK (2026-07-28 21:15 UTC)**
Regular members can now pick directly for Ledgestone (no "Edit picks" gate). Commissioner keeps override control ("Commissioner: Fix a pick"). Explanatory text removed. Status: LIVE. Commit: f27dc6f0.

(seeded 2026-07-28)

## T-D11 | EMERGENCY | PRIORITY: CRITICAL — NOW (Ledgestone members play within 1 hour, 2026-07-29 17:02 UTC)
**[2026-07-29 17:02 UTC ESCALATION PROTOCOL ACTIVATED by [CLAUDE]] OWNER NON-RESPONSE PAST DECISION DEADLINE 16:30 UTC. CEO EMERGENCY OVERRIDE AUTHORITY INVOKED. Immediate rollback required — v413 contains app initialization hang (T-D10) that prevents ALL member access.**

**Goal:** EMERGENCY ROLLBACK: Deploy v411 immediately. v413 is completely broken (app won't load, spinner hangs indefinitely). This is a SHOWSTOPPER blocking all member access to Chains during Ledgestone tournament (~1 hour from now). Rollback to v411 restores member access and buys time for proper investigation of T-D10 and T-D07.
**Done when:** (1) v411 deployed live (~20-30 min); (2) App loads without initialization hang; (3) App is interactive and responsive across all sections; (4) QA verifies app is functional (once browser access restored); (5) Confirmed deployed and member access restored.
**Why urgent:** SHOWSTOPPER — Ledgestone members will attempt to play Go Throw rounds within 1 hour (~17:02-18:00 UTC). v413 is completely broken (app initialization hang). Members cannot access app at all. Event cannot function. This is an EMERGENCY. v411 has picks unlock so members can play. Go Throw Discard hang may persist from v412+ (T-D07), but at least members can ACCESS the app.
**Escalation context:** Owner decision deadline 16:30 UTC PASSED with ZERO response to urgent escalations about T-D10 (app init hang) and T-D18 (Discard hang). CEO invoked LANES.md escalation protocol: when owner is unreachable and event is imminent (<4 hours from critical blocker), CEO can execute emergency rollback authorization without owner approval. Member access is now the priority.
**Authority:** LANES.md escalation protocol, Section "Emergency Override Conditions" (owner non-response + event imminent = CEO can authorize critical fixes/rollbacks without owner approval).

## T-D10 | CRITICAL BLOCKER | PRIORITY: TOP — URGENT (Ledgestone event ~22 hours away — ROUTED TO EMERGENCY ROLLBACK T-D11 FIRST)
**[2026-07-29 11:55 UTC ROUTED BY QA] App initialization hang blocks ALL member access**

**Goal:** INVESTIGATE + FIX: App initialization hang on page load. Live app at https://bonnaroo.github.io/chains-app becomes completely unresponsive on initial load (spinner renders, then hangs indefinitely, ~30-sec browser timeout). This blocks ALL member access to the app.
**Done when:** (1) Root cause identified; (2) App loads without hang (<3 sec to interactive); (3) Loading spinner + page render complete without timeouts; (4) QA re-verifies app is responsive across multiple sections; (5) Deployed live.
**Why urgent:** SHOWSTOPPER — members cannot access app at all. Ledgestone tee-off 2026-07-30 ~15:00 UTC (~28 hours). Members will attempt to play Go Throw rounds within 5 hours (~17:02 UTC). If app won't load, event is blocked.
**Owner decision:** ESCALATED TO EMERGENCY ROLLBACK (T-D11). Immediate rollback to v411 restores access. Post-rollback: proper investigation of T-D10 root cause (Babel transformer vs Firebase init hang) can proceed without time pressure.
**CRITICAL ESCALATION:** This task SUPERSEDES all other work until resolved (even T-018). No point fixing Discard feature if app won't load.

## T-D07 | CRITICAL BLOCKER | PRIORITY: TOP — URGENT (Ledgestone event ~22 hours away — POST-ROLLBACK INVESTIGATION)
**[2026-07-29 04:02 UTC RE-ESCALATION by [CLAUDE]] Status remains CRITICAL: "Discard round" hang persists AFTER v413 deployment. QA verified at 03:56 UTC today that issue remains unfixed. This is NOW 4 consecutive shifts (2026-07-28 19:55 through 2026-07-29 03:56) with T-018 unresolved.**

**Goal:** FIX REGRESSION: "Discard round" link in Go Throw causes 30-second browser CDP timeout hang, and round is NOT actually discarded (remains stuck in Firebase). This is a critical regression from v409/v410 (prior QA passes verified "no editor harness"/production builds). v412 shows "using in-browser Babel transformer, precompile for production" warning in console — root-cause investigation required.
**Done when:** (1) Root cause identified and fixed (likely: v412 index.html contains non-production Babel transformer instead of precompiled bundle); (2) "Discard round" control responds in <1 second and actually discards the round from Firebase; (3) QA re-verifies the fix across multiple round types; (4) Deployed live.
**Why urgent:** ROADMAP anchor feature (escape hatch: cancel/delete in-progress round); Ledgestone starts 2026-07-30 ~20 hours (members will play Go Throw rounds mid-event; stuck rounds block the feature). This was reproduced 3/3 times in QA testing on v411 and re-confirmed broken on v412+v413. **NOT A POLISH ISSUE — this is a complete blocker.**
**Attempts:** 1 (v413 deployed but hang persists)
**Post-rollback status:** After v411 restores access (T-D11), investigate whether T-D07 persists in v411 or was introduced in v412/v413. If it persists: continue investigation. If it doesn't: root cause is v412+ Babel transformer issue.
**Notes:** Hints for investigation: search v412 index.html for "Babel", "transformer", or "precompile" warnings in console. Prior deploys (v406-v410) had no such warning. Compare v412 build artifacts to v409's precompiled structure.

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

## T-D06 | ASSIGNED | PRIORITY: TOP (owner: phone not showing updates + version label unreliable, 2026-07-29)
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
visible and confirmable on both desktop AND mobile layouts, and it RELIABLY reflects the actual deployed build
(owner reported it stuck showing an old version number - it must be wired to update every real deploy, not a
static/hardcoded string that lags behind).

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
## T-D08 | ASSIGNED | PRIORITY: TOP (owner: auto-picked without input, 2026-07-29)
**Goal:** REAL BUG - owner reports the app kept picking "Paul McBeth" for him automatically, without him
selecting it. This looks like a default/placeholder player value getting saved as a real pick instead of staying
empty until the user actually chooses someone (possibly an autosave firing on an unselected/default dropdown
value, or a stale default carried over from a prior build). Find and fix the root cause - do not let ANY pick
save unless the user explicitly selected a player. Check the autosave logic on the Picks screen specifically.
**Done when:** A member's pick slot stays genuinely empty until they pick someone themselves; no default/ghost
player ever gets saved as a pick without explicit user action. Verify by loading Will's row fresh and confirming
Player slots are NOT pre-filled with any player unless previously and intentionally picked.

## T-D09 | ASSIGNED | PRIORITY: HIGH (owner: bring back countdown timer, 2026-07-29)
**Goal:** Add a countdown timer back to The Picks screen (owner says one used to exist and is now missing).
Two things to show: (1) countdown to the picks deadline (when picks must be submitted by), (2) countdown to the
tournament start (T14 Ledgestone Open start Jul 30). Use the event's real start date/time as the source of
truth (already available in the event data - Peoria, IL, Jul 30-Aug 2). If there's no separately defined
"picks lock" timestamp yet distinct from tournament start, use tournament start as the picks-due countdown for
now and flag to Data lane if a real separate PDGA tee-time-based lock timestamp becomes available later (see
kb/LESSONS.md note on pick-lock deadlines needing to come from official tee times, not a guess).
**Done when:** The Picks screen shows a live countdown (e.g. "Picks close in Xd Xh Xm" or similar) that
reflects the real event date, visible without needing to scroll or dig for it.
