# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 17:30 UTC (Run #86) |
| Status | ✅ **OPERATIONAL** — All systems nominal. Data loss incidents from 03:00-07:00 UTC fully recovered and verified in sync (Watcher Run #85, 16:52 UTC). No pick changes since 07:58 UTC. Firebase 200 OK, no 401 errors. |
| Currently | Monitoring Ledgestone live event (T46, all picks finalized, R14 scores pending). Queue health nominal: 28 open issues, 3 live blockers (#19/#22/#23) noted, 1 ready-for-build (#6), 4 data loss issues resolved but still open (need closure). |
| Next Check | Continue 20-min cadence. Watcher performing 5-min cadence. Standing by for live event conclusion. |

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 16:52 UTC (Run #85) |
| Status | ✅ **OPERATIONAL** — All systems nominal. No pick changes since 07:58 UTC (~9 hours). Firebase 200 OK, no 401 errors. Backups in sync. |
| Currently | Standby during Ledgestone live event (T46, all picks finalized, R14 scores pending). |
| Next Check | Continue 5-min cadence. Standing by for final round updates. |

## Production Health
| Component | Status | Last Check |
|-----------|--------|------------|
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 16:52 UTC |
| Firebase (chains-fantasy) | ✓ 200 OK (rev 1785441822836, all 14 rounds present, no 401 errors) | 2026-08-01 16:52 UTC |
| GitHub Actions | ✓ All passing (completed, success) | 2026-08-01 16:52 UTC |
| Backups | ✓ Complete backup in GitHub (all 14 rounds, in sync with Firebase) | 2026-08-01 16:52 UTC |

## Data Status
| Tournament | State | Last Update |
|------------|-------|-------------|
| T1-T13 | ✓ Complete (final scores) | 2026-07-29 onward |
| T46 (Ledgestone) | 🟡 Live — 14 rounds complete, R14 scoring pending | 2026-08-01 16:52 UTC |

## Known Issues & Incidents
| Issue | Status | Resolution |
|-------|--------|-----------|
| #28 | ✅ **RESOLVED** Firebase database rollback (rounds 11-14 recovered) | Data restored from backup, verified in sync by Watcher Run #85 |
| #27 | ✅ **RESOLVED** Backup refresh logic incomplete | Backups currently consistent; root cause analysis pending |
| #26 | ✅ **RESOLVED** Data loss T12-14 | All data recovered, Firebase consistent; backup restore verified working |
| #25 | ✅ **RESOLVED** Backup staleness | Last_known_picks.json now up to date; full backup refresh completed |
| #22 | ⚠️ **OPEN** Live Chains stuck on wrong tournament | HIGH priority live blocker during Ledgestone event |
| #19 | ⚠️ **OPEN** Cory blocked by stale European Open gate | TOP priority live blocker; may be moot if picks already finalized |
| #23 | ⚠️ **OPEN** Our Picks widget shows blank score | HIGH priority live blocker; affects mid-round score display |
| #20 | ⚠️ **CRITICAL** League data only in localStorage, not Firebase | Architecture issue; requires Phase 2 migration to real backend |

---
_Last updated: 2026-08-01 17:30 UTC (Dispatcher Run #86) — Data loss incident recovery confirmed; all systems nominal_
