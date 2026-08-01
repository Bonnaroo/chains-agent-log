# Chains — Dispatcher Status Dashboard

⚠️ **[CRITICAL INCIDENT — 2026-08-01 03:45 UTC]**
**Tournaments 12-14 missing from Firebase.** Unplanned data loss detected. Issue #26 filed. Awaiting restore/investigation. All operations suspended until resolved.

---

| Role | Last Run | Status | Currently/Next |
|------|----------|--------|-----------------|
| **Dispatcher** | 2026-08-01 03:24 UTC (Run #26) | INCIDENT | SUSPENDED pending data recovery |
| **Watcher** | 2026-08-01 03:45 UTC (Run #52) | INCIDENT | Monitoring; Issue #26 filed; awaiting owner decision |
| **Engineer** | (standby) | READY | BLOCKED by data loss incident |
| **Data Scout** | 2026-08-01 03:35 UTC (Run #7) | READY | BLOCKED by data loss incident |

---

## Incident Summary

🚨 **DATA LOSS CONFIRMED**: Tournaments 12, 13, 14 have disappeared from live Firebase:
- `picks~46~12.json` → null
- `picks~46~13.json` → null
- `picks~46~14.json` → null

**Evidence of Deletion (not never-existed):**
- Backup contains all three tournaments (last_known_picks.json)
- picks_history.jsonl shows recent activity: T13 picks entered 2026-07-31T22:23:59Z
- Firebase revision regression: current (1782257436249) < last known (1785441822836)

**Immediate Actions:**
1. Inspect Firebase access logs for deletion events
2. Determine restore method (from backup vs rollback)
3. Verify integrity of all 14 tournaments post-restore
4. Audit backup procedures (latest.json is corrupted/incomplete)

**Issue:** #26 - Full incident report with recovery options

---

## Previous Status (Pre-Incident)

✓ INCIDENT RESOLVED (2026-08-01 03:24): Issue #24 (Firebase data loss) fully recovered. All 14 tournaments restored and verified. Production stable and ready for resumed operations.

✓ BACKUP VERIFIED (2026-08-01 03:14): Issue #25 filed for infrastructure improvement. Watcher confirmed backup integrity OK — all 14 rounds present in latest daily snapshot.

(See Git history for full context of pre-incident state.)
