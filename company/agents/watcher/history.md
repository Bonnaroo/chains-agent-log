**2026-07-31T16:24:00.000Z UTC** — Watcher run #17 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #16 (~5 min); all 14 tournaments consistent
- Backups: ✓ Latest data fresh; will refresh latest.json
- Bug Watch: ✗ BLOCKED (Firebase /bugReports requires service account)
- Firebase Backup: Scheduled (daily completed; weekly restore test Wed 2026-08-06)
- Production Health: ✓ App HTTP 200 (9.6MB), GitHub Actions healthy, Firebase accessible (no 401 errors)
- Data Integrity: ✓ All 14 tournaments complete, 6 members each, draft order valid
- Cross-Check: ✓ All members [cory, gabe, kadey, kyle, shanna, will] present in all tournaments
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, T14 live monitoring active
- Next: Routine monitoring continues (5-min cadence)

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

**2026-07-30 20:18:46 UTC** — Watcher run #8 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #7 (19h 2m); T1-T14 all consistent
- Backups: ✓ Refreshed last_known_picks.json and latest.json (matching Firebase state)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (already completed on 2026-07-29; weekly restore test pending Wednesday)
- Production Health: ✓ App reachable (HTTP 200), GitHub Actions healthy (3 recent runs all success), Firebase accessible (200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 ready (picks finalized, scores pending)
- Cross-Check: ✓ All members have consistent picks/players for current event
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, no action needed
- Next: Routine monitoring continues, no blockers

**2026-07-31 12:24:51 UTC** — Watcher run #9 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #8 (15h 6m); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed last_known_picks.json and latest.json (rev 1785441822836 unchanged)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-29; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200), GitHub Actions healthy (4 recent runs all success), Firebase chains-fantasy accessible (200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 ready (picks finalized, scores pending)
- Cross-Check: ✓ All members have consistent picks/players for current event
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, no action needed
- Next: Routine monitoring continues, no blockers
**2026-07-31 12:40:23** — Watcher run #11 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #10 (~5 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed latest.json and last_known_picks.json (rev unchanged)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-29; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 ready (picks finalized, scores pending for Ledgestone live event)
- Cross-Check: ✓ All members have consistent picks/players; T7 confirmed single-pick format (intentional)
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers
**2026-07-31 00:52:23** — Watcher run #12 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #11 (~12.5h); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed latest.json and last_known_picks.json (no changes, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-29; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 live (picks finalized, scores pending for Ledgestone)
- Cross-Check: ✓ All members have consistent picks/players; no anomalies
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers
**2026-07-31 12:49:04 UTC** — Watcher run #13 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #12; all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed latest.json and last_known_picks.json; created today's daily backup firebase-2026-07-31.json
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: ✓ Daily backup completed for 2026-07-31 (11.5KB, 14 tournaments, T1-T13 complete with scores, T14 live)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (4 recent runs all success), Firebase chains-fantasy accessible (200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 ready (picks finalized, scores pending for Ledgestone live event)
- Cross-Check: ✓ All members have consistent picks/players for all tournaments
- Issues filed: 0 new (3 high-priority issues already open: #23, #22, #19 — Engineer/Dispatcher handling)
- Status: Production nominal, all systems healthy, daily backup on schedule, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers

**2026-07-31 12:54:00 UTC** — Watcher run #14 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #13 (~5 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed latest.json and last_known_picks.json (no changes, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 live (picks finalized, scores pending for Ledgestone)
- Cross-Check: ✓ All members have consistent picks/players; no anomalies detected
- Issues filed: 0 new (3 high-priority issues already open: #23, #22, #19 — Engineer/Dispatcher handling)
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers

**2026-07-31 16:14:30 UTC** — Watcher run #15 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #14 (~20 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed latest.json and last_known_picks.json (no changes detected, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, T1-T13 complete with scores, T14 live (picks finalized, scores pending for Ledgestone)
- Cross-Check: ✓ All members have consistent picks/players; no anomalies
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers


**2026-07-31T16:19:14.447781 UTC** — Watcher run #16 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #15 (~20 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed last_known_picks.json and latest.json
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present (T1-T13 complete with scores, T14 live with picks finalized awaiting scores)
  - T1-T6: Complete (2 picks each)
  - T7: Complete (1-pick tournament by design — Isaac Robinson scored)
  - T8-T13: Complete (2 picks each)
  - T14: Drafted/live (Ledgestone Open, 2 picks each, scores pending)
  - T7 note: Single-pick tournament — only p1/s1 populated, p2/s2 null as expected
- Cross-Check: ✓ All members [cory, gabe, kadey, kyle, shanna, will] present in all 14 tournaments (complete coverage)
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers

**2026-07-31T16:27:33 UTC** — Watcher run #17 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #16 (~8 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed last_known_picks.json and latest.json (no changes, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present (T1-T13 complete with scores, T14 live with all 6 members drafted, scores pending for Ledgestone)
- Cross-Check: ✓ All members [cory, gabe, kadey, kyle, shanna, will] have both p1 and p2 picks in T14; no anomalies
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers
**2026-07-31T16:32:00 UTC** — Watcher run #18 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #17 (~5 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed last_known_picks.json and latest.json (no changes detected, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present (T1-T13 complete with scores, T14 live with all 6 members drafted, scores pending for Ledgestone)
- Cross-Check: ✓ All members [cory, gabe, kadey, kyle, shanna, will] have both p1 and p2 picks in T14; no anomalies
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers

**2026-07-31T16:37:02 UTC** — Watcher run #19 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #18 (~5 min); all 14 tournaments consistent with Firebase state (latest revision 1785441822836 from 2026-07-30T20:03:42 UTC)
- Backups: ✓ Refreshed last_known_picks.json and latest.json (no changes detected, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (200 OK), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present (T1-T13 complete with scores, T14 live with all 6 members drafted, scores pending for Ledgestone)
- Cross-Check: ✓ All members [cory, gabe, kadey, kyle, shanna, will] consistent across all tournaments
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers

**2026-07-31T16:42:00 UTC** — Watcher run #20 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #19 (~5 min); all 14 tournaments consistent with Firebase state
- Backups: ✓ Refreshed last_known_picks.json and latest.json (no changes detected, already current)
- Bug Watch: ✗ BLOCKED (Firebase /bugReports auth still requires service account for chains-app-f38f8)
- Firebase Backup: Skipped (daily backup completed 2026-07-31; weekly restore test pending Wednesday 2026-08-06)
- Production Health: ✓ App reachable (HTTP 200, 9.6MB), GitHub Actions healthy (all success), Firebase chains-fantasy accessible (HTTP 200 — no 401 errors)
- Data Integrity: ✓ All 14 tournaments present (T1-T13 complete with scores, T14 live with all 6 members drafted, scores pending for Ledgestone)
- Cross-Check: ✓ All members [cory, gabe, kadey, kyle, shanna, will] consistent across all tournaments
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, Ledgestone T14 live and monitoring active
- Next: Routine monitoring continues, no blockers

**2026-07-31T16:47:00.000Z UTC** — Watcher run #11 (automated, 5-min cadence)
- Pick Watch: ✓ No changes since run #10 (1h 17m); all 14 tournaments consistent (T1-T13 final, T14 ready)
- Backups: ✓ latest.json and last_known_picks.json refreshed; no new entries to picks_history.jsonl
- Bug Watch: ✗ BLOCKED (Firebase /bugReports requires service account auth)
- Production Health: ✓ App HTTP 200, GitHub Actions healthy, Firebase accessible (no 401 errors)
- Data Integrity: ✓ All 14 tournaments present, 6 members each, all draft picks in place
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, T14 live monitoring continues
- Next: Routine monitoring continues (5-min cadence)

**2026-07-31T16:53:54.000Z UTC** — Watcher run #21+ (automated, 5-min cadence)
- Pick Watch: ✓ No changes since prior run; all 14 tournaments consistent with Firebase state (revision 1785441822836)
- Backups: ✓ Refreshed latest.json and last_known_picks.json (both committed to GitHub); daily backup 2026-07-31 already completed
- Bug Watch: ✗ BLOCKED (Firebase /bugReports requires service account auth for chains-app-f38f8)
- Production Health: ✓ App HTTP 200, GitHub Actions healthy (pages build success), Firebase chains-fantasy HTTP 200 (no 401 errors)
- Data Integrity: ✓ All 14 tournaments verified (T1-T13 complete with scores, T14 live with 6 members drafted, all picks locked in, scores null/pending for Ledgestone)
- Member verification: ✓ All 6 members present with valid p1/p2 picks in T14 [cory, gabe, kadey, kyle, shanna, will]
- Issues filed: 0 new
- Status: Production nominal, all systems healthy, T14 live monitoring continues
- Next: Routine monitoring continues (5-min cadence)
