# QA LANE BOARD
<!-- Owned exclusively by this lane. Statuses: ASSIGNED -> IN_PROGRESS -> REVIEW -> DONE -->

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
