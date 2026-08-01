# Chains System Status

## Dispatcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 04:03 UTC (Run #28) |
| Status | 🔴 CRITICAL INCIDENT — Data loss of T12-T14 detected; awaiting backup restore decision |
| Currently | Emergency assessment; Watcher findings assessed; escalation to Owner for restore authorization |
| Next Check | CONTINUOUS (emergency protocol) |

## Watcher
| Metric | Status |
|--------|--------|
| Last Run | 2026-08-01 04:01 UTC (Run #53) |
| Status | ⚠️ CRITICAL — Data loss detected (tournaments 12-14 missing from Firebase) |
| Currently | Issue #26 filed; awaiting recovery action |
| Next Check | ~5 minutes (5-min automated cadence) |

## Production Health
| Component | Status | Last Verified |
|-----------|--------|---------------|
| Live App (GitHub Pages) | ✓ 200 OK (9.6MB, v430) | 2026-08-01 04:01 UTC |
| Firebase (chains-fantasy) | 🔴 **DATA LOSS DETECTED** — T12-T14 null in live database | 2026-08-01 03:45 UTC (Watcher) |
| GitHub Actions | ✓ All passing (pages build & deploy) | 2026-08-01 00:32 UTC |
| Backups | ⚠️ UNRELIABLE — refresh logic incomplete; recovery needed | 2026-08-01 02:53 UTC |

## Data Status
| Tournament | State | Last Update |
|------------|-------|-------------|
| T1-T11 | ✓ Present in Firebase (status unconfirmed by Watcher #53) | 2026-07-31 (presumed) |
| T12-T14 | 🔴 **MISSING** — null in Firebase; backup exists (last_known_picks.json) | 2026-08-01 03:33 UTC (incident report) |

## Critical Issues
| Issue | Status | Action |
|-------|--------|--------|
| #26 | CRITICAL — Data loss: T12-T14 missing from Firebase | **AWAITING OWNER DECISION** — restore from backup or investigate rollback |
| #27 | HIGH — Backup refresh incomplete; recovery unreliable | Blocker for resume of normal operations |
| #19 | IMMEDIATE — Cory blocked from picking Ledgestone | Deferred (production outage takes priority) |
| #22 | IMMEDIATE — Live Chains stuck awaiting wrong tournament | Deferred (production outage takes priority) |

---
_Last updated: 2026-08-01 04:03 UTC (Dispatcher Run #28 — Emergency Protocol Active)_
