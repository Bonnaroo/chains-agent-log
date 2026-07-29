# Watcher — History (this project only; append one short entry per run)

Format: date/time, what happened, evidence (Issue #/commit sha), next responsible role.
**2026-07-29 23:18:50 UTC** — Watcher run #1 (automated)
- Bug Watch: ✓ All reports already seen (2 in Firebase), no new issues to file
- Firebase Backup: ✓ Today's backup exists (49.5KB, valid JSON, 1 league), no weekly test (Wednesday)
- Production Health: ✓ App reachable, workflows recovered (failures from 2026-07-24, today's all successful), Firebase records healthy
- Functional Audit: Dashboard PASS (way out/records/clutter/persistence/intuitive all ✓, data survived navigation and refresh)
- Issues reviewed: 12 open total, recent deploys v412-v413 working, Picks section verified functional
- Next section rotation: Picks/Draft (to verify v412-v413 changes)
- Issues filed: 0 new
- Status: All systems nominal, no blockers

**2026-07-29 23:40:12 UTC** — Watcher run #2 (automated)
- Bug Watch: ✓ All reports already seen (2 in Firebase), no new issues to file
- Firebase Backup: Skipped (already completed today)
- Production Health: ✓ App reachable (9.6MB), GitHub Actions healthy, Firebase records normal (playRounds: 1, liveRounds: 1)
- Functional Audit: Picks/Draft section PASS (navigation ✓, editability ✓, no clutter ✓, data persists on refresh ✓, intuitive ✓, no console errors)
- Issues reviewed: 12 open total, recent deploys working
- Next section rotation: Standings (after Picks/Draft)
- Issues filed: 0 new
- Status: All systems nominal, no blockers

**2026-07-29 23:52:30 UTC** — Watcher run #3 (automated, 15-min cadence)
- Bug Watch: ✓ All reports already seen (2 in Firebase), no new issues to file
- Firebase Backup: Skipped (already completed today)
- Production Health: ✓ App reachable via GitHub API, Firebase accessible (playRounds: 1, liveRounds: 1)
  ⚠ HTTP 401 error detected in app (filed #15)
  ⚠ Version mismatch: app showing v411 but v413 deployed (filed #16)
- CRITICAL ROUTING BUG DISCOVERED: All hash routes (#standings, #go-throw, #picks, etc.) display Dashboard content instead of their respective sections (filed #17 CRITICAL)
- PDGA Cross-check: Ledgestone Open roster identified, deferred full verification to next run
- Functional Audit: Navigation completely broken due to routing bug - unable to properly audit other sections
- Issues filed: 3 total (#15 HTTP 401, #16 version mismatch, #17 CRITICAL routing)
- Status: CRITICAL BLOCKER - app routing broken, users cannot access key features
- Next: Engineer must investigate and fix routing issue immediately (blocks all section access)
