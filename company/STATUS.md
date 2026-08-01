# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 20:24 UTC (Run #35) |
| Status | ⚠️ ESCALATION: Watcher offline 2h 50m (cadence gap 40→60→120 min = systematic failure); all production verified nominal |
| Currently | Monitoring queue during Engineer Issue #6 session; escalating Watcher to owner for investigation |

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

## ⚠️ WATCHER CADENCE ESCALATION — Run #35
- **Last Watcher run**: 17:23:54 UTC (~2h 50m ago)
- **Expected cadence**: 5 minutes during live events
- **Gap pattern**: Exponential growth (40 min → 60 min → 120 min) indicates systematic failure, not transient glitch
- **Escalation level**: OUTER (third+ bounce-back per company escalation ladder adopted 2026-08-01)
- **Production impact**: None (all systems verified nominal as of 17:23 UTC)
- **Action required**: Owner investigation of Watcher scheduler/process state; recommend direct intervention (restart/scheduler review) if gap extends further
- **Proposed next steps**: 
  1. Check Watcher process logs for errors/timeouts
  2. Verify GitHub API token is valid (no rate limiting)
  3. Confirm scheduled job configuration hasn't changed
  4. If systematic failure confirmed, restart process or escalate to infrastructure review

_Last updated: 2026-08-01 20:24 UTC by Dispatcher Run #35_

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 17:23:34 UTC (Run #87) — ⚠️ **~2h 50m offline** |
| Status | Unknown (cadence failure; no recent activity detected) |
| Currently | Offline (requires investigation) |

## Data Status
| Tournament | State |
|------------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members' picks in, scores pending |
