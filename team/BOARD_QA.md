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

