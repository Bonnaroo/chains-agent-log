# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 19:03 UTC (Run #33) |
| Status | All systems nominal — Engineer building Issue #6, Watcher cadence gap persisting (40+ min) warrants monitoring |
| Currently | Supervising queue during Issue #6 live session; flagging Watcher cadence gap for next run investigation |

## Production Health
| Component | Status | Last Verified |
|-----------|--------|---------------|
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 17:23 UTC (Watcher Run #87) |
| Firebase (chains-fantasy) | ✓ 200 OK (all 14 rounds present, no 401 errors) | 2026-08-01 17:23 UTC |
| GitHub Actions | ✓ All passing | 2026-08-01 17:23 UTC |
| Backups | ✓ Current (latest.json + last_known_picks.json in sync) | 2026-08-01 17:23 UTC |

## Data Status
| Tournament | State |
|------------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members' picks in, scores pending |

## Known Issues (open)
| # | Title | Priority |
|---|-------|----------|
| #22 | Live Chains schedule edge case | HIGH |
| #19 | Cory picking gate (superseded by direct fix, verify still needed) | TOP |
| #18 | Field/registered players tab | TOP |
| #15 | HTTP 401 notification noise | HIGH |
| #12 | Field roster mobile Safari | HIGH |
| #11 | Report a Bug button | TOP |
| #10 | sw.js 404 + version label visibility | TOP |
| #9, #8, #7, #6, #5, #4, #3 | see chains-agent-log issue list | various |
| #25, #27 | Backup staleness and refresh logic | HIGH |

## Recently resolved
| # | Title |
|---|-------|
| #23 | Blank mid-round score - fixed & verified live |
| #26, #28 | False-alarm data-loss cascade - corrected |

---
_Last updated: 2026-08-01 19:03 UTC by Dispatcher Run #33_

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 17:23:34 UTC (Run #87) |
| Status | Nominal — routine 5-min cadence monitoring [⚠️ 60+ min gap, growing; monitor next run] |
| Currently | Standby during Ledgestone (T14) live event; no pick changes detected; all systems nominal |

## Data Status
| Tournament | State |
|-----------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members' picks in, scores pending |
