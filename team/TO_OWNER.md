# TO OWNER — CEO's brief to Guillermo (updated every shift)

## THIS SHIFT (2026-07-29 08:02 UTC) — CRITICAL ESCALATION CHECKPOINT

**🔴🔴 T-018 CRITICAL BLOCKER — ESCALATION CHECKPOINT (12+ hours unresolved, 19 hours to event)**

**Status:** UNRESOLVED since 2026-07-28 19:55 UTC (over 12 hours). v413 deployed 01:16 UTC but Discard round hang PERSISTS. This is now the 5th CEO shift documenting the same unresolved issue. No diagnosis, no fix, no rollback. Go Throw Discard is broken.

**Timeline:**
- 2026-07-28 19:55 UTC: QA first reported (hang verified, CDP 30s timeout, round stuck in Firebase)
- 2026-07-28 21:15 UTC: v412 deployed with picks fix; hang persists
- 2026-07-29 01:16 UTC: v413 deployed; hang STILL persists
- 2026-07-29 04:02 UTC: CEO escalation sent with rollback option
- **2026-07-29 08:02 UTC (NOW):** T-018 STILL UNRESOLVED. 4 hours have elapsed. 19 hours remain until Ledgestone tee-off.

**What members will encounter at Ledgestone (in 19 hours):**
- Play rounds normally, score normally
- When attempting to cancel mid-round via "Discard round" link: 30-second browser freeze, round NOT actually discarded, stuck in Firebase
- Go Throw becomes unplayable mid-tournament

**ACTION REQUIRED — IMMEDIATE (within 4 hours, by ~12:00 UTC):**

**OPTION A: Deploy v414 fix** — Authorize Design/Engineer to immediately (1) diagnose root cause (suspected: Babel transformer in v412 build; needs precompilation), (2) rebuild v414, (3) deploy live. If diagnosis takes >30 min, escalate to Option B. QA will verify across 3+ round types before Ledgestone start.

**OPTION B: Emergency rollback to v411** — Authorize immediate rollback to v411. v411 has the picks UX unlock you want; Go Throw may be more stable. Members will have working Picks + functional Go Throw at tee-off. This is the faster path if Option A diagnosis stalls.

**DECISION REQUIRED:** Email or message (1) which option, (2) approvals for immediate Design/Engineer session (if Option A) or rollback authorization (if Option B). **Cannot remain unresolved at Ledgestone start.**

---

**🔴 T-014 HARD-STOP — Still waiting for owner decision (5th consecutive flag, no response)**

Edit picks over-broad unlock persists. When commissioner clicks "Edit picks," ALL members' pick-edit screens unlock (not just the commissioner's). Members can modify OTHER members' player selections. This violates draft integrity.

**Status:** Escalated 5 consecutive shifts (Jul 26, 27 x2, 28, 29); still unresolved. No PM routing; no fix in progress; no explicit deprioritization.

**DECISION REQUIRED:** (1) **FIX THIS SHIFT** — Engineer rebuilds with uid-write guard (~30-60 min after v414 or Option B), OR (2) **ACCEPT AS-IS** — you acknowledge it and we protect current behavior from regression.

**Per LANES.md rule:** If this remains unrouted a 6th shift (next CEO round), will escalate to explicit "is this a legitimate decision or an unresolved issue?" challenge. Response needed before next CEO shift (09:02 UTC).

---

## PRIOR SHIFTS (for reference)

[Previous escalations and decisions recorded in prior shifts — see team/logs/ceo.md for full history]