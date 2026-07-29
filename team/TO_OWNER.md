# TO OWNER — CEO's brief to Guillermo (updated every shift)

## THIS SHIFT (2026-07-29 09:16 UTC) — CRITICAL BLOCKER AT TEEOFF MINUS 18 HOURS

**🔴 T-018 CRITICAL BLOCKER — GO THROW DISCARD HANG (UNRESOLVED 12+ HOURS, 18 HOURS TO EVENT)**

**Status:** UNRESOLVED since 2026-07-28 19:55 UTC (over 12 hours). v413 deployed 01:16 UTC but Discard round hang PERSISTS.

**What members will hit at Ledgestone (in ~18 hours):** Play Go Throw rounds normally. Click "Discard round" mid-round. 30-second browser freeze. Round NOT discarded; stuck in Firebase. Go Throw unplayable mid-tournament.

**ACTION REQUIRED — WITHIN 4 HOURS (by ~13:00 UTC today):**

**OPTION A: Deploy v414 fix** — Authorize Design/Engineer to immediately diagnose Babel transformer in v412 build (suspected root cause: non-production build artifact), rebuild v414, deploy live. If diagnosis takes >30 min, escalate to Option B. QA will re-verify.

**OPTION B: Emergency rollback to v411** — Rollback now. v411 has the picks UX unlock you need; Go Throw was more stable. Faster path if Option A stalls.

**Email decision to diamashield@gmail.com or reply to this task within 4 hours: "A" or "B"?**

---

**🔴 T-014 HARD-STOP — EDIT PICKS OVER-BROAD UNLOCK (5 CONSECUTIVE SHIFTS, NO OWNER RESPONSE)**

Edit picks over-broad unlock persists 5 shifts (Jul 26, 27 x2, 28, 29). When commissioner clicks "Edit picks," ALL members' screens unlock (not just commissioner's). Members can modify OTHER members' picks.

**Decision required:** (1) FIX THIS SHIFT (Engineer rebuilds with uid guard, ~30-60 min), OR (2) ACCEPT AS-IS (acknowledge current behavior).

**Per team rule:** Cannot remain unrouted a 6th shift. Response needed: "Fix" or "Accept".

---

## SUMMARY OF 2026-07-29

v413 deployed with picks unlock (T-016 DONE, member-verified working). Data collector autonomous + correct. **But T-018 Go Throw Discard regression unresolved 12+ hours before Ledgestone tee-off.** This is the showstopper. Full report in team/REPORT.md.

**Full report:** https://github.com/Bonnaroo/chains-agent-log/blob/main/team/REPORT.md

**Quick facts:**
- Picks unlock: ✓ DONE (v413 live, member QA verified)
- Data: ✓ NOMINAL (13+ autonomous collector runs today)
- Go Throw Discard: 🔴 BROKEN (Discard hang, 12+ hours unresolved)
- Ledgestone readiness: RED (blocked by T-018)
- Timeline: 18 hours to tee-off; decision + fix/rollback must complete by ~13:00 UTC today

**Next:** Owner decision on T-018 (A or B). T-014 decision (Fix or Accept). Everything else is ready.
