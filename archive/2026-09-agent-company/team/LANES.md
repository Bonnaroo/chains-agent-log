# LANES.md — the parallel team model (read this once, understand the whole setup)

As of 2026-07-28 the office runs as 4 parallel lanes instead of one worker taking hourly turns. Each lane owns
its OWN files and never writes outside them — that is what lets them run at the same time without collisions
(no more single LOCK.md gate for everything; the lock model is retired for cross-lane conflicts, each lane's
territory is its own boundary now).

## LANE 1 — DESIGN/ENGINEER (owns: Claude Design project, Bonnaroo/chains-app, team/BOARD_DESIGN.md, team/logs/engineer.md)
Job: ship UI/behavior changes (Design builds) and deploy them. Runs on the `chains-design-request` schedule
(on-demand) plus picks up ASSIGNED tasks tagged [LANE:DESIGN] in BOARD.md.

## LANE 2 — DATA (owns: Firebase chains-app-f38f8, Bonnaroo/chains-dgpt-data, team/BOARD_DATA.md, team/logs/data.md)
Job: keep the PDGA event field, standings, and course catalog current; own the Phase 2 migration (moving
picks/draft-order/standings into Firebase). Runs on `chains-data-lane` schedule.

## LANE 3 — QA (owns: team/BOARD_QA.md, team/logs/qa.md — READ-ONLY everywhere else)
Job: verify what Design/Engineer and Data ship actually works on the live app + real Firebase data. Never
edits app code or data directly — files findings for the other lanes to act on. Runs on `chains-qa-lane` schedule.

## LANE 4 — CEO/PM (owns: team/BOARD.md, team/FROM_OWNER.md, team/TO_OWNER.md, team/REPORT.md, team/HANDOFF.md)
Job: routes owner requests into the other 3 lanes' boards, tracks overall status, writes the daily report.
Runs on `chains-office-on-shift` (now CEO/PM-only, not a generalist) + `chains-pm-daily-report`.

## THE ONE SHARED FILE: BOARD.md
BOARD.md stays as the CEO's master list/backlog. Each lane also gets its OWN board file
(BOARD_DESIGN.md / BOARD_DATA.md / BOARD_QA.md) that only that lane writes to, so a Design-lane run and a
Data-lane run at the same moment never touch the same file. The CEO/PM lane periodically rolls up all 3 lane
boards into BOARD.md for a single overview - that rollup is the ONLY place lane boards get read cross-lane.

## LEARNING FROM HISTORY (mandatory, not optional)
Every lane run MUST read its own last 5 entries in its team/logs/<lane>.md log BEFORE starting work. If the same
mistake/blocker shows up again, that is a hard stop - flag it in HANDOFF.md and do not repeat the failed
approach a third time. This is how each lane is supposed to actually get better run over run instead of
re-learning the same lesson forever.
