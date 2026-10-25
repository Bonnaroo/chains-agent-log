# STATE — what is true right now (hand-maintained; `ops/check.py` verifies the measurable parts)

Update at every session start and end. Keep it short. Dates are YYYY-MM-DD.

## Live
- index.html: **v554** (2026-10-25) · test.html: v554
- Staging: free
- Database: Firebase `chains-app-f38f8` (rules **v1 deployed**, v2 file written but unpublished)
- Automation running: chains-dgpt-data workflows (DGPT collect, daily rounds backup, discs, OSM geo, course pipeline Sundays)

## In flight
- (nobody) — no item claimed

## Blocked on Will
- publish rules v2 · test account `chainstest` · private `chains-backups` repo + bot login + secrets · UptimeRobot/Sentry (ops/MONITORING.md) · Run workflow once on "Course data pipeline" · imported-rounds policy (audit 1.6)

## Last sessions (newest first; one line each: date · agent · what)
- 2026-10-25 · claude-cowork · v552–v554 (contrast, write logging + save-state, ties/labels/Back); audit of Will's four papers; handoff pack (START_HERE, PROTOCOL, STATE, HOWTO, check.py)
- 2026-10-24 · claude-cowork · v537–v551 (precompiled build, Chase on Home, nearby/favourites, 9-hole rounds, groups, call-outs, courseStats bug fixed + backfilled)
- 2026-10-23 · claude-cowork · v525–v536 (challenges tabs, stats page, crowns v2, titles, weekly leagues, add-your-course, 100 trophies, delete account, brand/site)

## Known open risks
- No shared flow has been tested from a second account/phone.
- Every harness test runs as Will's own account on the live database.
- Reads are whole-node (usernames, courseStats, courseLeagues) — fine at ~13 users.
