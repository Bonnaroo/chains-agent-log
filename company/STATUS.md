# Chains — Dispatcher Status Dashboard

| Role | Last Run | Status | Currently/Next |
|------|----------|--------|-----------------|
| **Dispatcher** | 2026-08-01 02:10 UTC (Run #19) | **CRITICAL ESCALATION** | STEP 0: Supervising Issue #24 Firebase data loss emergency; Issue #14 escalation posted |
| **Watcher** | 2026-08-01 01:45:40 UTC (Run #36) | CRITICAL ALERT FILED | Filed Issue #24 (data loss); awaiting recovery action |
| **Engineer** | (unknown) | STANDBY | Awaiting Dispatcher/Owner decision on Issue #24 recovery prioritization |
| **Data Scout** | 2026-07-31 22:30 UTC (Run #7) | NORMAL | IL expansion ongoing (70/393 courses), 5-state coverage at 901/1500 courses (60%) |

---

## 🚨 CRITICAL INCIDENT STATUS: Issue #24

**Summary:** Tournaments 12, 13, 14 deleted from Firebase ~2026-07-31 23:50 UTC (30 minutes after last Watcher verification at 23:25 UTC showing all 14 tournaments present).

**Timeline:**
- 2026-07-31 22:30 UTC: Watcher run #35 verified all 14 tournaments, including live Ledgestone (T14)
- 2026-07-31 23:50 UTC: Data loss detected (~1h 20m elapsed)
- 2026-08-01 01:45:40 UTC: Watcher run #36 filed Issue #24 CRITICAL
- 2026-08-01 02:10 UTC: **THIS RUN** — Dispatcher escalation and recovery plan initiation

**Backup Available:**
- Daily backup: chains-dgpt-data/data/backups/firebase-2026-07-31.json (created 12:48:56 UTC, contains all 14 tournaments pre-loss)
- Last known state: data/last_known_picks.json (sparse, recovery plan should restore from full daily backup)

**Immediate Actions Required:**
1. Owner decision: Restore from backup yes/no (data integrity risk vs. event completion)
2. Engineer: Execute restore (restore picks~46~12/13/14 from backup to Firebase)
3. Verify: Re-run Watcher checks to confirm integrity post-restore
4. Learn: Audit Firebase access logs for deletion events (prevent recurrence)

**Next Responsible:** Owner + Engineer (pending Dispatcher escalation via Issue #14)

---

## Queue Status (18 open issues, all tracked)

**CRITICAL PRIORITY (Issue #24):**
- Issue #24 [CRITICAL] Firebase data loss — T12/13/14 deleted, live event impacted

**IMMEDIATE PRIORITY (Ledgestone T14 live, owner-blocking):**
- Issue #19: Cory blocked from picking Ledgestone
- Issue #22: Live Chains stuck, skipping Ledgestone
- Issue #23: Mid-round player scores show blank "-"

**NEXT PRIORITY (Ready-for-build):**
- Issue #6 [TOP][ready-for-build] Scoring screen placeholder

**LATER (Well-scoped, no action needed this cycle):**
- Issues #5, #7, #8, #9, #10, #11, #12, #15, #16, #18 (all tracked, acceptance criteria clear)

---

## Product Review & Vision Coverage

**Coverage Status:** Comprehensive across fantasy/scoring/mobile/reliability per PRODUCT_VISION.md — no gaps identified outside current queue.

---

## Dispatcher Notes for This Run

✓ STEP 0: Supervision complete
  - Watcher: ALERT STATUS (Issue #24 data loss filed)
  - BUILD_LOCK: Clear
  - Watcher escalation: YES, posted to Issue #14

⏸ STEP 1: Intake paused pending critical issue resolution

⏸ STEP 2: Queue health review paused (Issue #24 takes priority)

⏸ STEP 3: Product review: deferred to next run post-recovery

✓ STEP 4: Owner report — CRITICAL ALERT written (this file + Issue #14 escalation)

⏸ STEP 5: Never-idle — paused pending critical issue resolution

---

## Next Actions

1. **Owner decision:** Approve restore from daily backup (Issue #24 acceptance criteria)
2. **Engineer execution:** Restore T12/13/14 from backup to Firebase
3. **Verification:** Watcher confirms post-restore integrity
4. **Recovery completion:** Dispatcher resumes normal cadence (Steps 1-5)
5. **Learning:** Audit and lessons learned post-event
