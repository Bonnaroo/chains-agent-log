# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 21:04 UTC (Run #36) |
| Status | ⚠️ ESCALATION: Watcher offline 3h 41m (last reliable data 17:23 UTC); all production verified nominal; queue healthy |
| Currently | Monitoring queue + Engineer building Issue #6; Watcher offline escalation in effect |
| Next Check | Continue 20-min cadence; owner intervention needed for Watcher investigation |

## Production Health
| Component | Status | Last Verified |
|-----------|--------|---------------|
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 17:23 UTC (Watcher Run #87) |
| Firebase (chains-fantasy) | ✓ 200 OK (all 14 rounds, no 401) | 2026-08-01 17:23 UTC |
| GitHub Actions | ✓ All passing | 2026-08-01 17:23 UTC |
| Backups | ✓ Current (latest.json + last_known_picks.json synced) | 2026-08-01 17:23 UTC |

## Data Status
| Tournament | State |
|-----------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members' picks in, scores pending |

## Known Issues (open)
| # | Title | Priority | Notes |
|---|-------|----------|-------|
| #25 | Backup staleness: last_known_picks.json missing rounds 2-11 (18+ days out of sync) | HIGH | NEW (filed 2026-08-01 20:23 UTC) |
| #22 | Live Chains schedule edge case | HIGH | |
| #19 | Cory picking gate (European Open) | TOP | Status: Resolved for T14 (all picks in); verify if fix permanent |
| #18 | Field/registered players tab | TOP | |
| #15 | HTTP 401 notification noise | HIGH | |
| #12 | Field roster mobile Safari | HIGH | |
| #11 | Report a Bug button | TOP | |
| #10 | sw.js 404 + version label visibility | TOP | |
| #6 | Scoring screen placeholder ⬅️ **BUILDING** | TOP | [ready-for-build] Engineer session active |
| #27 | Backup refresh logic incomplete | HIGH | |

## Recently resolved
| # | Title |
|---|-------|
| #23 | Blank mid-round score - fixed & verified live |
| #26, #28 | False-alarm data-loss cascade - corrected |

---

## ⚠️ WATCHER OFFLINE ESCALATION (3h 41m since Run #87)
- **Last Watcher run**: 17:23:34 UTC (Run #87) — 3h 41m ago
- **Expected cadence**: 5 minutes during live events
- **Pattern**: Exponential growth (40 min → 60 min → 120 min) indicates systematic failure, not transient glitch
- **Escalation level**: OUTER (third+ bounce-back per company escalation ladder, adopted 2026-08-01)
- **Production impact**: None (all systems verified nominal as of 17:23 UTC; T14 live event ongoing)
- **Dispatcher findings (Run #36)**: Queue healthy, all checks nominal, Issue #6 building clear, no stale issues
- **Action required**: Owner investigation of Watcher scheduler/process state
- **Proposed next steps**: Check Watcher logs, verify token validity, confirm job configuration, restart if needed

_Last updated: 2026-08-01 21:04 UTC by Dispatcher Run #36_

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 17:23:34 UTC (Run #87) — ⚠️ **~3h 41m offline** |
| Status | Unknown (cadence failure; no recent activity detected) |
| Currently | Offline (requires investigation) |