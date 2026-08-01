# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | pending next cycle |
| Status | Reset after audit - false-alarm cascade (#26-28) corrected, see LESSONS_LEARNED.md |
| Currently | Standby during Ledgestone (T14) live event |

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | pending next cycle |
| Status | Reset after audit - key-encoding bug fixed in instructions (was misreading picks~46~N as "T46") |
| Currently | Standby during Ledgestone (T14) live event |

## Production Health (verified directly by owner-level check, 2026-08-01 17:06 UTC)
| Component | Status |
|-----------|--------|
| Live App (GitHub Pages) | OK, v430 deployed |
| Firebase (chains-fantasy /league) | OK - T11-T14 all confirmed intact with real data |
| GitHub Actions | passing |
| Backups | in sync |

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

## Recently resolved
| # | Title |
|---|-------|
| #23 | Blank mid-round score - fixed & verified live |
| #26, #27, #28 | False-alarm data-loss cascade - corrected, root cause fixed in Watcher prompt |

---
_Last reset: 2026-08-01 17:06 UTC after full scheduling audit_
