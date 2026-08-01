# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 19:23 UTC (Run #34) |
| Status | ⚠️ ESCALATION: Watcher cadence gap now ~120 min (40→60→120 min); systematic issue likely; production nominal |
| Currently | Monitoring queue; Issue #6 Engineer session active; Watcher scheduler/timeout investigation needed |

## Production Health
| Component | Status | Last Verified |
|-----------|--------|---------------|
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 17:23 UTC (Watcher Run #87) |
| Firebase (chains-fantasy) | ✓ 200 OK (all 14 rounds, no 401) | 2026-08-01 17:23 UTC |
| GitHub Actions | ✓ All passing | 2026-08-01 17:23 UTC |
| Backups | ✓ Current (latest.json + last_known_picks.json synced) | 2026-08-01 17:23 UTC |

## Data Status
| Tournament | State |
|------------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members' picks in, scores pending |

## Known Issues (open)
| # | Title | Priority | Notes |
|---|-------|----------|-------|
| #22 | Live Chains schedule edge case | HIGH | |
| #19 | Cory picking gate (European Open) | TOP | Status: Resolved for T14 (all picks in); verify if fix permanent |
| #18 | Field/registered players tab | TOP | |
| #15 | HTTP 401 notification noise | HIGH | |
| #12 | Field roster mobile Safari | HIGH | |
| #11 | Report a Bug button | TOP | |
| #10 | sw.js 404 + version label visibility | TOP | |
| #6 | Scoring screen placeholder ⬅️ **BUILDING** | TOP | [ready-for-build] Engineer session active |
| #25, #27 | Backup staleness and refresh logic | HIGH | |

## Recently resolved
| # | Title |
|---|-------|
| #23 | Blank mid-round score - fixed & verified live |
| #26, #28 | False-alarm data-loss cascade - corrected |

---

## ⚠️ WATCHER CADENCE ESCALATION — Run #34
- **Last Watcher run**: 17:23:54 UTC (~120 min ago)
- **Expected cadence**: 5 minutes during live events
- **Pattern**: Exponential gap growth (40 min → 60 min → 120 min) suggests systematic failure, not transient
- **Production impact**: None (all systems verified nominal as of 17:23 UTC)
- **Action required**: Investigate Watcher scheduler config or process state next run; if gap extends, escalate to owner

_Last updated: 2026-08-01 19:23 UTC by Dispatcher Run #34_

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 17:23:34 UTC (Run #87) — ⚠️ **~120 min offline** |
| Status | Unknown (no recent activity detected; scheduler/timeout concern) |
| Currently | Standby (no recent ping) |

## Data Status
| Tournament | State |
|------------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members' picks in, scores pending |
