# Chains — Permanent Decisions Log

Append-only. One entry per real architectural/product decision, in order. Do not delete or renumber past entries.

## D-001 — 2026-07-29 — Three-role model (Dispatcher/Watcher/Engineer), not a full corporate org chart
Rationale: only one Claude Design build session can exist at a time (single project, single browser, manual
trigger only). Naming more roles (CEO, multiple engineers, HR, IT, etc.) doesn't add real concurrency, only
naming complexity. Superseded the earlier 4-lane model (BOARD/BOARD_DESIGN/BOARD_DATA/BOARD_QA).

## D-002 — 2026-07-29 — GitHub Issues (this repo) are the queue, not a markdown board
Rationale: a frequently-rewritten Markdown list can lose updates when two scheduled jobs touch it close
together; Issues give real IDs, labels, comment history, and a stable place for release evidence.

## D-003 — 2026-07-29 — Company Brain structure adopted (team/routing/decisions/rules/lessons/playbooks/agent
history), modeled on Squad's repo-based memory pattern
Rationale: separates permanent identity/rules (rarely change) from raw incident history (append-only, never
read in full by a working agent) from compressed current procedure (playbooks — the only thing a working agent
reads before starting a task of that type).

## D-004 — 2026-07-29 — STANDING CRITICAL GATE: harden Firebase security rules before scaling users/leagues or
building the future public multi-user app
Firebase Realtime Database has been flagged as allowing overly broad read/write access. This blocks: adding
real authentication, supporting many leagues at scale, or starting the separate public-app project. Filed as
Issue, `priority:critical`, `type:security`, `status:ready-for-build` — first Engineer session should take this
before other feature work once picks up.

## D-005 — 2026-07-29 — Future public app (real Firebase auth, multi-user) is its own separately scoped project
Not to be built incrementally through ordinary queue items. Needs its own architecture phase: separate
Firebase project/environment, auth, per-user/per-league authorization, dev/staging/prod environments, migration
plan, privacy policy, rate limits, monitoring. Tier 3 decision — nothing here proceeds without Guillermo signing
off on the scoped plan first.


## D-006 — 2026-07-29 — Light branch protection on main (chains-app, chains-agent-log, chains-dgpt-data), NOT full PR-required protection
Rationale: full protection requiring pull-request review before merge would block the Engineer's only deploy
path (a direct commit of the compiled index.html) — there is no second reviewer, it's the owner + Claude Design
in one session. Applied instead: block force-pushes and branch deletion on main. This stops history from being
wiped or main from being deleted, without blocking the one working deploy mechanism.


## D-007 — 2026-07-29 — Backend/Firebase "done" requires a live probe, not a committed file (real incident)
An Engineer run marked Issue #2 (CRITICAL Firebase security hardening) resolved after committing rule files to
GitHub, without ever deploying them. Verified live afterward: the database was still completely open to any
anonymous user. Root cause: production-verification's 3-level check only covered the frontend app artifact, not
backend/Firebase changes, so there was no equivalent "did this actually take effect live" gate for this class of
work. Fix: OPERATING_RULES.md rule 11 — backend changes require an actual live probe test before being marked
done. Also surfaced: no admin Firebase credential exists in the current token setup (only the public web API
key), so real rule deployment currently requires the owner's direct action (Firebase Console, or generating a
service account key) — this is a real capability gap, not just a process one.
