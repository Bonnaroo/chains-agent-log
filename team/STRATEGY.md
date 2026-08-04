# STRATEGY — where Chains is going (CEO owns this; the team aims at it)

North star (owner's goal): a polished, secure, SELLABLE Chains app on iPhone + Android, with real email/password
accounts, that works flawlessly and scales without issues.

## THE APPS (keep these straight — do not muddle them)
- APP A — "Chains, Founders League" (LIVE, do not disrupt): the current HTML app. Repo Bonnaroo/chains-app,
  Firebase chains-app-f38f8. Guillermo + his 6 friends use this for the WHOLE current season. Changes here are
  polish only, and must never break their season or their data. This is also our REFERENCE design.
- APP B — "Chains, Public" (FUTURE, the commercial product): a SEPARATE app with its OWN repo and its OWN Firebase
  project (owner must create the new Firebase project when we get there). Real email/password sign-up + accounts.
  LEAGUE-OPTIONAL: a user can sign up and use Go Throw, Watch / Live Chains, videos, and Settings WITHOUT joining
  or running a league — the league is one mode, not a requirement. This is what we polish -> code natively -> launch.
- COUNCIL — "Chains Admin" (back office, owner-only): a SEPARATE small app/dashboard (its own page/repo, not inside
  the product). Read metrics (accounts, leagues, players, rounds, waitlist, issues) and manage (create/remove
  leagues, open/close accounts, help a stuck user look up their login). Points at App B's data (can preview against
  App A now). Read-only first; management actions added later with proper owner-only auth.

## PHASES — OWNER UPDATED 2026-07-26
- PHASE 1 — CONTINUES IN PARALLEL: polish APP A until its existing features truly work, with no dead-ends and no
  regression to the live Founders League. Build the Council read-only dashboard when authorized and practical.
- PHASE 2A — GO NOW (backend-first efficiency): stop rebuilding the whole app for dynamic-data changes. Move event
  fields, registered-player lists, registration state, standings, results, and similar changing data out of the
  static bundle and into the chains-app-f38f8 backend. One scoped Design build may be used to make APP A read those
  backend values; afterward routine data updates are backend writes, not Design rebuilds. Use Design only for real
  UI/feature work such as escape hatches and delete controls. PM must split and assign this safely; protect the live
  season and never touch the legacy chains-fantasy /league node.
- PHASE 2B — REAL CODED PUBLIC APP: one codebase (React + Capacitor) for web + iPhone + Android, with automated
  tests and normal version control. This is APP B, separate from the live Founders League. Internal planning and
  reversible scaffolding may begin now that the owner said Phase 2 is GO, but it must not alter APP A or publish a
  new app without owner approval. A separate Firebase project is still required before connecting real App B data.
- PHASE 3 — launch hardening: real accounts + security pass, Council management actions, app-store submission.

## EFFICIENCY RULE
Choose the cheapest reliable layer: backend/data update first, real coded source second once App B exists, and a
Design rebuild only when the visible interface itself must change. Do not spend Design credits baking tournament
data into the HTML bundle.

## ACCESS REALITY (verified 2026-07-26)
Codex's connected GitHub integration can read the Chains repositories but returned HTTP 403 on a contents write.
Codex's logged-in Chrome session can commit to GitHub and is the current verified write path. Continue working via
that path; do not wait for CLAW or require github-token.txt. If the owner wants fully browser-free unattended writes,
the GitHub integration must be granted repository-contents write permission. This is an efficiency improvement, not
a blocker to office work.

## WHAT ONLY THE OWNER CAN PROVIDE (CEO flags these when actually needed)
- A new Firebase project for App B.
- Apple Developer Program ($99/yr) + Google Play Console ($25 one-time) for store submission.
- Final approval for any new public deployment, app-store submission, or irreversible action.

## SAFETY GATE
Phase 2 is authorized, but APP A remains protected: no migration may risk Founders League season data, scoring,
picks, standings, or confirmed-good screens. Changes must be scoped, backed up where applicable, independently
verified, and rolled out in reversible slices.

## SCALE & RESILIENCE GATE — OWNER REQUEST ROUTED 2026-08-04 BY [GPT]

Before inviting outside leagues or treating Chains as a large public service, complete two planning tracks:

1. **Restorable operations:** scheduled snapshots of approved Firebase nodes, dated/immutable artifacts, rolling retention, access controls, documented recovery time/recovery point targets, and a restore drill. Git history protects app code; it does not by itself protect live Firebase data.
2. **Many-league architecture:** define league-scoped data paths, membership claims, multi-league access, least-privilege rules, cross-league test cases, abuse/rate limits, observability, and cost thresholds. Compare Realtime Database and Firestore against the actual read/write patterns; choose from evidence, not fashion.

This is a tracked planning gate, not permission to create App B, a new repository, or a second production Firebase project. APP A remains the six-person live-season system. The options brief must give near-term hardening, medium-scale triggers, and large-scale migration choices with risks and owner decisions before any irreversible work.
