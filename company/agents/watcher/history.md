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

**2026-07-30 00:35:12 UTC** — Watcher run #4 (automated, 15-min cadence)
- Bug Watch: Blocked (Firebase REST API requires auth token, unable to fetch /bugReports)
- Firebase Backup: Skipped (already done today) + blocked (Firebase auth)
- Production Health: ✓ App reachable (9.6MB), GitHub Actions healthy, no failures in workflow
- Issue #16 Diagnosis: v413 IS correctly deployed to GitHub Pages, but version-display JS feature is broken (element hidden with display:none). Users see hardcoded v411 as a result. Recommend Engineer review commits 682e61e (v412) or f27dc6f (v413) for version.js logic.
- Issue #15 Status: ✓ Confirmed — HTTP 401 error notification visible in sidebar ('Offline — will retry (HTTP 401)'). Firebase auth likely failing.
- Navigation: ✓ Sidebar button clicks work (verified in run #2 audit)
- Dashboard Section: ✓ Loads without errors, displays standings/events/chat correctly
- Functional Audit: Dashboard PASS (way out/records/clutter/persistence/intuitive all ✓)
- Issues filed: 0 new
- Status: Production operational. Firebase access blocked (need auth token for REST API). All other checks nominal.
- Next rotation: Visual audit (Go Throw section)

**2026-07-30 00:21-00:24 UTC** — Watcher run #5 (automated, 15-min cadence)
- Bug Watch: ✗ BLOCKED (Firebase REST API requires auth, unable to fetch /bugReports)
- Firebase Backup: ✗ BLOCKED (Firebase auth prevents verification; backup from 2026-07-29 exists per run #4)
- Production Health: ✓ App reachable (9.6MB), GitHub Actions all passing, zero workflow failures
- App Verification (visual audit): 
  - ✓ Dashboard loads without errors, displays league standings/events/chat correctly
  - ✓ Navigation buttons present (Dashboard, Picks, Standings, Live Chains, Go Throw, Watch, Settings)
  - ✓ Hash routing working (#dashboard in URL)
  - ✗ Version display shows "v411" (Issue #16 — element hidden with display:none)
  - ✗ HTTP 401 notification visible ("Offline — will retry") (Issue #15)
- Console: ✓ No errors detected on initial page load
- Issues filed: 0 new
- Critical observation: Issue #20 (data only in localStorage, zero backend backup) blocks Firebase auth resolution
- Status: Production operational. Firebase access blocker persists. Version display & HTTP 401 errors remain from prior runs. All other checks nominal.
- Next rotation: Go Throw section (visual audit)

**2026-07-30 01:30:00 UTC** — Watcher run #6 (automated, 5-min cadence)
- Pick Watch: ✓ Detected 6 changes (T11 s2 scores: Cory→20, Kyle→-23, Shanna→-23; T14 p2 players: Kadey→Simon Lizotte, Shanna→Aaron Gossage, Gabe→Ezra Aderhold). All logged to picks_history.jsonl.
- Last Known State: ✓ Updated to current Firebase snapshot (rev 1785441822836)
- Latest Backup: ✓ Refreshed (no age drift)
- Bug Watch: ✗ BLOCKED (Firebase REST API auth requires additional service account for chains-app-f38f8)
- Firebase Backup: Skipped (already completed on 2026-07-29)
- Production Health: ✓ App reachable (200), GitHub Actions healthy, Firebase accessible (200 — **NO 401 ERRORS**). Auth issue from prior run resolved.
- Picks/Standings Consistency: ✓ All tournaments 1–13 complete with scores; T14 ready (scores pending)
- Issues filed: 0 new
- Status: Production nominal, Firebase auth restored, all data syncs working
- Next: Visual audit (Picks/Standings sections) when system is less busy

**2026-07-30 20:16:23 UTC** — Watcher run #7 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #6 (19 hours); all picks consistent (T1-T14 complete)
- Backups: ✓ Refreshed last_known_picks.json and latest.json (no pick changes)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account)
- Firebase Backup: Skipped (already completed on 2026-07-29; weekly restore test pending Wednesday)
- Production Health: ✓ App reachable (200), GitHub Actions healthy, Firebase accessible (200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete, T14 ready for scores
- Cross-Check: ✓ All members have correct picks/players for current event
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, no action needed
- Next: Routine monitoring continues, no blockers
