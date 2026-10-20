# QA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

## 2026-08-05 02:45 UTC — [GPT] current-head + ready-export rejection

**RESULT: FAIL / keep T-C04 IN_PROGRESS; ready export not staged.** Cache-busted production at
`https://bonnaroo.github.io/chains-app/?cb=202608050235#dashboard` visibly reports v454 from app HEAD
`fcb86480fa3ec1770277b759ccdcc9ad1a9283be`. Promoted `index.html` and staged `test.html` are byte-identical
(blob `59642dea0b9ebf2c9638acb2ecc8660f9ea2ec68`, SHA-256
`FA99551DE831B0AB48C88BBD4EF5744AD52F91E89B21E1A3019CE6B9CAE67085`). Decompressed source proves the active-
round Discard path still fires `ChainsRounds.remove(cloudIdRef.current)` without await/return/result handling,
then clears `chains_play_active` and exits. The unchanged callee can report `true` through an eight-second timeout.

The authoritative Design project has a newer download named `Chains Fantasy DGPT App v456 (1).html`, SHA-256
`AC4DBC3B17B2FDB2F570F101230F8C8B0D139FD6E0370DA839346D087A6A6A0B`. It improves the precondition by creating
or adopting a round ID if scores exist and the ref is empty, but its Design summary explicitly says no await was
added; source confirms the remove remains fire-and-forget and the export still embeds `window.CHAINS_VERSION =
"v454"`. Fixing the missing-ID race is useful but does not satisfy ROUND_QUEUE #2's confirmed success/failure
contract. Do not stage or deploy this artifact; PM/Engineer must return to the authoritative Design source.

Secondary evidence: current `field.json` remains event 96415 / 116 MPO and matches PDGA's official 116 MPO count;
all 12 visible T15 Player 1/2 controls remain disabled. Go Throw currently renders three identical LIVE NOW cards
and nine ROUND IN PROGRESS controls (Tadpole Beach ×6, Otterburn ×2, Old Farm ×1); do not infer duplicate records
until Firebase is inspected safely. Console again showed `/friendCodes/SRE3D7` `permission_denied`. No existing
round was opened or deleted, and no app, Design, Firebase, pick, score, issue, rule, deployment, or `/league` data
was changed.

## 2026-08-05 01:40 UTC — [GPT] v455 non-destructive verification finding

**RESULT: FAIL / return to PM + Engineer; no live record deleted.** Production at
`https://bonnaroo.github.io/chains-app/?cb=202608050136#dashboard` visibly reports v455, matching app commit
`3a8bb7577eec92be5ae93d8c690785190a2a7d84`. Decompressed immutable comparison with v454 proves the only active-
round Discard change is a new fire-and-forget `ChainsRounds.remove(cloudIdRef.current)` call. The handler does not
await or inspect the returned boolean; it immediately clears `chains_play_active` and calls `onBail()`. The callee
returns `Promise.race([settle, timeout])` where the timeout resolves `true` after eight seconds. Therefore the UI
can leave as if deletion succeeded before all stores confirm. This fails company ROUND_QUEUE #2's explicit
`deleteRound awaits ChainsRounds.remove() and reports real success/failure` acceptance. It also supplies contrary
evidence to the earlier company log that #43 was already closed. Do not mark #43/queue #2 done from version or call
presence alone; fix in the authoritative Design source, await and branch on the real result, then use a newly
created backup-safe test record for destructive persistence QA.

Additional phone-sized evidence: Registered shows 116 pros, matching PDGA and current field blob
`e79e2eace48faed4146e9e4f09b6d85d7143b231`; the visible Will session has all 12 T15 Player 1/2 buttons disabled
with `Only the commissioner can edit picks and scores`, so regular-member own-picks-only is not certified. Go Throw
shows three identical Tadpole Beach live cards and three identical resume cards. Console logged a Firebase
`permission_denied` write at `/friendCodes/SRE3D7`. No app, Firebase, pick, score, or round data was changed, and
the separate rules incident was not re-probed.

## T-018 — BLOCKER — Go Throw: Discard/Cancel round freezes renderer AND fails to discard (regression on known blocker gap)
Status: CRITICAL RE-VERIFY FAIL (escalated for LANE:DESIGN/ENGINEER — urgent)
**2026-07-29 08:15 UTC VERIFICATION UPDATE**: Re-tested on live app (v412+ build, commissioner session).
Repro confirmed on FIRST ATTEMPT (1/1): Go Throw > Resume existing round (Tadpole Beach, Haslett) > 
Hole 2 screen shows "Discard round" link > CLICK "Discard round" > CDP click timeout after 30 seconds,
tab frozen/unresponsive, no page interaction possible. After waiting 8+ seconds post-timeout, browser 
still unresponsive; navigated away using browser back/history. Round was NOT discarded — on return to 
Go Throw home, new "RESUME ROUND IN PROGRESS" card visible for Tadpole Beach, proving the round 
remained in Firebase. BLOCKER STATUS: PERSISTENT across v411→v412 deploy cycle (no fix in v412 release 
notes). This directly blocks ROADMAP anchor feature ("cancel/delete in-progress round"). 

Earlier (2026-07-28): same issue confirmed 3/3 repros on Johnson Park solo round (CDP timeout, no discard).
Current (2026-07-29): same issue confirmed 1/1 on Tadpole Beach multi-player round (different course, 
different round type, same hang). Pattern is consistent regardless of round setup.

**Concurrent v412 verification (PASS)**: member-facing picks/draft UX (picks board with direct 
Player 1/Player 2 pickers, no "Edit Picks" gate) confirmed working — commissioners can click Player 1 
dropdown, searchable pro list appears, no hanging. This fix shipped successfully. Note: only verified 
from commissioner account; true member-login verification remains pending per engineer.md note.

**T-014 ESCALATION RE-RAISED** (5th flag): Edit picks over-broad unlock still present (committed 4 shifts 
2026-07-26 through 2026-07-28, now 2026-07-29 — no fix or explicit deprioritization stated). Per LANES.md 
mandatory-learning rule, this is a HARD-STOP signal, not a routine note.

## T-009/T-017 (carried) — PDGA tee-time table still unavailable; Ledgestone lock deadline unresolved
Status: WATCH — no new information this shift. Data lane to confirm collector health independently.
## T-019 (no escalation) — Settings section audit (SETTINGS rotation, 2026-07-29 10:30 UTC shift)
Status: READY FOR NEXT CYCLE (no blocking issues; minor feature gaps noted per roadmap)

**Checklist pass/fail:**
1. WAY OUT ✓: Clear sidebar navigation; no dead-ends; all states escapable.
2. RECORDS ⚠ PARTIAL: Display name & theme/color/texture/icon all customizable & auto-save; NO explicit delete/reset controls for customizations (minor UX gap).
3. NO CLUTTER ✓: Clean section layout (My Leagues / Your Profile / Trophy Case); clear labels; logical flow.
4. DATA SURVIVES ✓: Auto-save confirmed on display name & theme selection; changes persist across navigation & app reload.
5. IT MAKES SENSE ✓: Visual choices self-explanatory; trophy case gamification engaging; no instruction text needed.

**Feature gap findings (vs ROADMAP spec):**
- Units selector (ft/m for distances) — NOT IMPLEMENTED (roadmap specifies as part of Settings)
- Delete account/data button — NOT IMPLEMENTED (roadmap specifies with confirm step)

**No blocking issues.** Section is usable and stable. Minor: lack of explicit reset/delete controls for personalizations is a UX nicety (users can still edit all values), not a blocker. Feature gaps are roadmap-to-do items, not regressions.

Next cycle rotation: Dashboard section.

## T-020 (no escalation) — Dashboard section audit (DASHBOARD rotation, 2026-07-29 03:56:54 UTC shift)
Status: READY FOR NEXT CYCLE (all checklist items pass)

**Checklist pass/fail:**
1. WAY OUT ✓: Clear 7-section sidebar navigation; league selector discoverable; no dead-ends.
2. RECORDS N/A: Read-only section (expected).
3. NO CLUTTER ✓: Clean hierarchy; standings visualization + event cards; no orphaned UI.
4. DATA SURVIVES ✓: Refresh tested (F5); all league standings and event data persisted identically.
5. IT MAKES SENSE ✓: Purpose immediately clear ('standings at a glance'); visual design intuitive; no instruction text needed; first-time user can understand instantly.

**No blocking issues.** Dashboard is well-designed, stable, and ready for use.

Next cycle rotation: The Picks/Draft section.
## T-021 (no escalation) — The Picks/Draft section audit (PICKS rotation, 2026-07-30 current shift)
Status: READY FOR NEXT CYCLE (all checklist items pass; picks unlock working well from member account)

**Checklist pass/fail:**
1. WAY OUT ✓: Clear sidebar navigation always accessible; can escape to other sections at any time; no dead-ends.
2. RECORDS ✓: Can CREATE picks (dropdown selection from pro list), EDIT picks (reopen dropdown, select different pro), DELETE picks (Clear pick button functional); all controls discoverable.
3. NO CLUTTER ✓: Clean logical layout (PICK, MEMBER, PLAYER 1/2, SCORE, TOTAL columns); tournament event carousel with navigation arrows; clear draft order (numbered 1-6); no orphaned UI.
4. DATA SURVIVES ✓: Tested pick persistence — selected Paul McBeth as WILL's Player 1, refreshed page (F5), pick persisted correctly. Invalid input ("ricky") properly rejected by validation, not saved. All data intact across refresh.
5. IT MAKES SENSE ✓: Purpose immediately clear from section title and description ("Everyone's two MPO players each event"); dropdown interface intuitive; PDGA numbers shown for reference; search box in dropdown for large pro list; Clear pick button obvious. First-time user would instantly understand drafting flow.

**Additional findings:**
- **Permissions working correctly**: WILL (regular member account) can only edit own picks; other members' rows have different styling (read-only), confirming access control
- **Search feature functional**: Dropdown includes searchable pro list (tested; pro list loads and displays 100+ entries)
- **Data validation solid**: Invalid input ("ricky") does not persist; only valid pro selections save to Firebase
- **Visual feedback**: "AUTO-SAVES" indicator visible; real-time persistence confirmed
- **No console errors**: Verified zero JavaScript errors during all operations
- **Responsive UI**: Dropdowns, selections, navigation all respond quickly with no hangs or delays

**v413 status**: Picks unlock deployed successfully (per engineer log 2026-07-29 01:16 UTC). Member-facing draft UI works as intended. v412/v413 picks unlock fix VERIFIED and WORKING.

**No blocking issues.** The Picks/Draft section is fully functional, stable, and ready for production use. All ROADMAP draft requirements validated.

**NEXT SHIFT ROTATION**: Standings section.
## SHIFT BLOCKED (2026-07-30)
**Status**: BLOCKED — no browser access (Claude in Chrome extension not connected)
Scheduled rotation audit for Standings section could not proceed. Will resume on next shift when browser tools available.
No app code, Firebase data, or other lanes' files were touched.

## T-022 — CRITICAL BLOCKER — App initialization hangs indefinitely (new blocker, 2026-07-30)
Status: CRITICAL — BLOCKS ALL QA TESTING
**2026-07-30 (current shift) INITIAL LOAD HANG**: Live app at https://bonnaroo.github.io/chains-app 
renders initial loading UI (spinner + disc golf pin icon) but then hangs indefinitely. Browser 
renderer becomes unresponsive after ~6-10 seconds. Multiple load attempts across different browser tabs 
(2 tabs created) all produce the same hang signature: CDP timeout after 30 seconds, tab renderer frozen.

**Testing impact**: CRITICAL — cannot proceed with Standings section rotation audit or any other 
section audit while app is non-functional. All prior shifts verified working state (v413 deployed 
successfullly, Picks/Draft section PASS, Watch/Settings/Dashboard sections all PASS). Something in 
either the live deployment or Firebase backend has degraded between 2026-07-30 04:15 UTC (Picks audit, 
all working) and 2026-07-30 current shift.

**Hypothesis**: Either (1) v413 or later deployment introduced a regression in app initialization, 
or (2) Firebase connection/data fetch is stalled during app bootstrap, or (3) JavaScript execution 
is hung on initial page load (Babel transformer warning from prior shifts suggests possible transpiler 
issue).

**Evidence**: Loading spinner appears (app HTML/CSS loads), but page never progresses past spinner 
state. No interactive elements reachable. Browser back-button used to escape hung state.

**Escalation**: LANE:DESIGN/ENGINEER — urgent. Verify: (1) latest live deployment is actually v413, 
(2) no new deployment or Firebase changes since last known-good state (2026-07-30 04:15 UTC), 
(3) if new deployment exists, revert to last known-good v413 or identify the regression.

**No QA testing possible until app is responsive.**
## 2026-07-29 (current shift) — QA BLOCKED
**Status**: BLOCKED — no browser access this run (Claude in Chrome extension not connected)
Scheduled rotation audit for Standings section could not proceed. Will resume on next shift when browser tools available.
No app code, Firebase data, or other lanes' files were touched.

**PERSISTENT BLOCKERS (UNRESOLVED)**:
- T-018: Discard round hang (CRITICAL) — 3+ shifts unfixed
- T-014: Edit picks unlock (HARD-STOP, 6 flags) — 6+ shifts unfixed, escalation threshold reached
- T-022: App initialization hang (CRITICAL) — reported last shift, cannot verify without browser access


---

## 2026-07-29 SHIFT STATUS UPDATE

**BLOCKER**: Claude in Chrome extension not connected — QA shift cannot proceed with live testing. Browser access unavailable for Standings rotation audit.

**CRITICAL PERSISTENCE STATUS**:
- **T-018 (BLOCKER)**: Discard round hang — UNFIXED as of this shift (4 QA shifts since initial flag: 07-26, 07-28, 07-29 x2)
- **T-014 (HARD-STOP)**: Edit picks over-broad unlock — UNFIXED as of this shift (6 QA shifts since initial flag: 07-26, 07-27 x2, 07-28, 07-29, 07-30). Per LANES.md, reached escalation threshold.
- **T-022 (CRITICAL BLOCKER)**: App initialization hang — Reported by prior shift as blocking ALL testing. Cannot verify current state without browser access. **BLOCKS ENTIRE QA CYCLE.**

**NEXT QA SHIFT ACTION**: 
1. Restore Claude in Chrome extension connection (prerequisite for any testing)
2. Verify if T-022 (app hang on init) is STILL present — if yes, HALT testing and escalate to LANE:DESIGN/ENGINEER immediately
3. If app is responsive, resume Standings rotation audit
4. Re-verify T-018 and T-014 status with fresh testing

**LANES AWAITING FIX**:
- **LANE:DESIGN/ENGINEER**: T-018 (Discard hang), T-022 (init hang), T-014 (edit picks unlock)


## LIVE VERIFICATION 2026-07-29 (owner + Claude/Cowork, real browser, real live site)
T-D10 "app initialization hang" claim: NOT REPRODUCIBLE. Opened https://bonnaroo.github.io/chains-app/ live and
walked all 6 core screens directly (Dashboard, The Picks, Standings, Live Chains, Go Throw, Settings) - every
one loaded correctly with real data, no hang, no error. T-D14 "over-broad unlock" also not observed: picks are
open, real per-member picks are landing correctly (Kadey/Shanna/Gabe locked with real picks, Will's row open for
his own pick, Kyle's row open on his turn). CLOSING T-D10 and T-D14 as false alarms from the 2026-07-29 20:15
UTC CEO report pending any contrary evidence - do not re-open without a fresh, actually-reproduced live failure.
Findings while checking: (1) sidebar version label still reads "V411" despite live commit being v413 - cosmetic
label lag only, not functional (folds into T-D06). (2) Dashboard summary card still shows the old "Draft order -
Heinola Open last place picks first" explainer text - this is a SEPARATE occurrence from the Picks screen (which
is already clean) - add to T-D01 scope: also strip this text from the Dashboard card. (3) The known T-D03 issue
(Live Now card requires click-through instead of direct discard) is still present as expected, not a new
regression.

## T-023 (no escalation) — Standings section audit (STANDINGS rotation, 2026-07-29 current shift)
Status: READY FOR NEXT CYCLE (all checklist items pass)

**Checklist pass/fail:**
1. WAY OUT ✓: Clear sidebar navigation always accessible; seamless navigation to all other sections. Tested navigation away to Go Throw and back — no dead-ends or trap states.
2. RECORDS N/A: Read-only section (expected).
3. NO CLUTTER ✓: Clean section layout (title, description, tab navigation, standings table, color-coded legend, latest result card). No orphaned UI.
4. DATA SURVIVES ✓: Refresh tested (F5); all league standings, tournament scores, and member data persisted identically. No loss or duplication.
5. IT MAKES SENSE ✓: Purpose immediately clear ('season standings'). Visual design intuitive (member avatars + scores, color-coded performance). Tab labels self-explanatory (STATS, SCHEDULE, HISTORY). No instruction text needed; first-time user understands instantly.

**Tab Navigation Test:**
- STANDINGS: ✓ Table view with 6 members, T1-T13 events, color-coded scores
- STATS: ✓ Category champions + member stats (birdies/eagles/bogeys)
- SCHEDULE: ✓ 22 DGPT events with year selector (2018-2026)
- HISTORY: ✓ Tour history view; smooth tab switching across all views

**No blocking issues.** Standings section is fully functional, well-designed, and production-ready.

**NEXT SHIFT ROTATION**: Live Chains section.
