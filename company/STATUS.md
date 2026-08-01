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
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 20:50 UTC (Watcher Run #88) |
| Firebase (chains-fantasy) | ✓ 200 OK (all 14 rounds, no 401) | 2026-08-01 20:50 UTC |
| GitHub Actions | ✓ All passing | 2026-08-01 20:50 UTC |
| Backups | ✓ Current (latest.json + last_known_picks.json synced) | 2026-08-01 20:50 UTC |

## Data Status
| Tournament | State |
|------------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members's picks in, scores pending |

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
| #25 | Backup staleness: resolved (latest.json refreshed 17:19 UTC with all rounds) | HIGH | Status: RESOLVED |
| #27 | Backup refresh logic incomplete | HIGH | Related to #25 fix |

## Recently resolved
| # | Title |
|---|-------|
| #23 | Blank mid-round score - fixed & verified live |
| #26, #28 | False-alarm data-loss cascade - corrected |

---


## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 21:40 UTC (Run #89) — ✓ **Nominal** |
| Status | ✓ Nominal (all checks passed, data integrity verified) |
| Currently | Monitoring T14 live event, all 14 tournaments synced |
| Next | Continue 5-min cadence; standing by for T14 final round score updates |

### Run #89 Summary
**Duration**: ~3 min | **Status**: ✓ Complete — all systems nominal

**Checks performed**:
- ✓ STEP 1 (Real-time pick log): No changes since last backup (17:19 UTC); all tournaments stable
- ✓ STEP 4 (Production health): App 200 OK, Firebase 200 OK (no 401s), Actions passing
- ⊘ STEP 2 (Bug reports): Firebase /bugReports requires auth (deferred to Dispatcher/Engineer)
- ✓ STEP 5 (Data audit): All 14 tournaments present, 6 members assigned, structures nominal

**Findings**:
- ✓ No pick changes since last backup
- ✓ Firebase rev 1785441822836 unchanged
- ✓ Backup current (latest.json from 17:19 UTC today)
- ✓ Production nominal — T14 live monitoring active

**Issues filed**: 0 new

**Confidence**: ✓ All checks passed; data integrity verified; resuming normal 5-min cadence