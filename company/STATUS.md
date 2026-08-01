# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 21:43 UTC (Run #37) |
| Status | ✓ Nominal - Watcher recovered, all systems verified; Issue #29 CRITICAL filed (Firebase keys list stale during live event) |
| Currently | Monitoring Issue #29 (data visibility verification), Engineer building Issue #6, queue health confirmed |

## Production Health
| Component | Status | Last Verified |
|-----------|--------|---------------|
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 21:40 UTC (Watcher Run #89) |
| Firebase (chains-fantasy) | ✓ 200 OK (all 14 rounds accessible via direct fetch) | 2026-08-01 21:40 UTC |
| GitHub Actions | ✓ All passing | 2026-08-01 21:40 UTC |
| Backups | ⚠️ Issues #25, #27 (stale/incomplete logic) | 2026-08-01 21:40 UTC |

## Data Status
| Tournament | State |
|------------|-------|
| T1-T13 | Complete, final scores in |
| T14 (Ledgestone Open) | Live - all 6 members's picks in, scores pending |

## Known Issues (open) — Priority by Impact
| # | Title | Priority | Status | Notes |
|---|-------|----------|--------|-------|
| #29 | [CRITICAL] Firebase /league.json keys stale — T12-14 missing from list | CRITICAL | [needs-verification] | Data present + accessible (Watcher verified); keys list stale (rev from 07-31). **Verification needed**: Does app UX actually break (show only 11 rounds)? If not, cosmetic bug; if yes, user-blocking. Accept criteria: Confirm which key-fetch method app uses. |
| #22 | Live Chains stuck awaiting Discmania Challenge | HIGH | | Blocking during Ledgestone event |
| #25 | Backup staleness (last_known_picks.json incomplete) | HIGH | | Rounds 2-11 missing |
| #27 | Backup refresh logic incomplete | HIGH | | Commits not capturing all rounds |
| #19 | Cory picking gate (European Open not done) | TOP | | Resolved for T14; verify if permanent fix |
| #18 | Field/registered players tab | TOP | | |
| #15 | HTTP 401 notification noise | HIGH | | |
| #12 | Field roster mobile Safari | HIGH | | |
| #11 | Report a Bug button | TOP | | |
| #10 | sw.js 404 + version label visibility | TOP | | |
| #6 | Scoring screen placeholder ⬅️ **BUILDING** | TOP | [ready-for-build] | Engineer session active; clear acceptance criteria |

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
| Status | ✓ Nominal (recovered from 4h+ blackout, all checks passed) |
| Currently | Monitoring T14 live event, all 14 tournaments synced |
| Next | Continue 5-min cadence; standing by for T14 final round score updates |

### Run #89 Summary (Watcher recovered)
**Duration**: ~3 min | **Status**: ✓ Complete — all systems nominal

**Checks performed**:
- ✓ STEP 1 (Real-time pick log): No changes since last backup (17:19 UTC); all tournaments stable
- ✓ STEP 4 (Production health): App 200 OK, Firebase 200 OK (no 401s), Actions passing
- ✓ STEP 5 (Data audit): All 14 tournaments present, 6 members assigned, structures nominal
- ⚠️ ISSUE #29 FILED: During recovery, detected /league.json keys list stale (T12-14 refs missing) while individual keys present with current revisions

**Findings**:
- ✓ No pick changes since last backup
- ✓ All 14 tournaments verified accessible (direct key fetch)
- ✓ Backup current (latest.json from 17:19 UTC today)
- ✓ Production nominal — T14 live monitoring active
- ⚠️ Firebase data consistency issue: Keys list vs individual keys revisions out of sync

**Issues filed**: 1 new (#29 CRITICAL — data visibility)

**Confidence**: ✓ All checks passed; data integrity verified; Issue #29 requires UX verification
