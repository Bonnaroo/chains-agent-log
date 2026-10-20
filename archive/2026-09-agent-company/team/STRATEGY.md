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

### T-C02 OPTIONS BRIEF — 2026-08-04 [GPT]

**Current reality and hard stop.** APP A is a six-person, direct-client Realtime Database (RTDB) system. The
current `/playRounds` parent rule grants `.write` to any authenticated user. RTDB rules cascade, so a narrower
child rule cannot revoke that parent grant; a signed-in client can therefore forge another member's round write.
That is tolerable only inside today's trusted founders group and must be closed before any outside tester is
invited. Do not migrate APP A mid-season merely to solve this: first replace broad parent grants with
league/member/user-scoped rules and prove both allowed-own and denied-cross-tenant cases in the Emulator Suite.

**Options.**

1. **Harden APP A on RTDB (recommended now).** Keep the live season on its current backend, scope every durable
   path by `leagueId` and `uid`, remove broad authenticated parent writes, add cross-user/cross-league deny tests,
   and complete T-C01 backup/restore work. This is the smallest reversible change and avoids a risky season-time
   data migration. It is not the recommended public-product architecture.
2. **Firestore-first APP B, with RTDB only for measured live-sync needs (recommended future architecture).** Put
   durable, queryable multi-tenant state in Firestore: `/users/{uid}`, `/leagues/{leagueId}`,
   `/leagues/{leagueId}/members/{uid}`, `/events/{eventId}`,
   `/leagues/{leagueId}/events/{eventId}/picks/{uid}`, `/rounds/{roundId}`, and
   `/rounds/{roundId}/participants/{uid}`. Keep an optional RTDB `/liveRounds/{roundId}` channel only if measured
   presence or very high-frequency live updates justify it. Use a bounded migration window, not permanent
   dual-write. Firestore's document model, indexed compound queries, non-cascading rules, automatic scaling, and
   regional/multi-region choices fit many leagues better than one shared JSON tree.
3. **Public product entirely on RTDB (not recommended).** This minimizes rewrite but moves scale into sharding,
   fan-out indexes, cascading-rule review, connection/write ceilings, and cross-database operations. Firebase's
   current comparison describes roughly 200,000 concurrent connections and 1,000 writes/second per RTDB database,
   with additional databases required beyond that. Chains should not volunteer for that operational burden when
   the durable product is naturally queryable by user, league, event, and round.
4. **Public product entirely on Firestore (viable alternative).** This keeps one database and strong tenant/query
   boundaries, but live presence and rapid score mirroring can create many small billed operations or hot documents.
   Choose it only after a realistic round simulation shows acceptable operation count, latency, and cost.

**Phase recommendation and decision triggers.**

- **Founders season:** stay on RTDB; harden `/playRounds`; add a least-privilege deny matrix and recurring restorable
  backups. No new app, repository, database, or production migration is authorized by this brief.
- **Private App B beta:** only after owner approval and a separate Firebase project exists, use Firestore for durable
  multi-league state. Add RTDB only when captured product measurements show a real presence/live-sync advantage.
- **Growth:** before 10,000 monthly active users *or* projected usage reaches 25% of any provider ceiling, run load
  and cost tests. The 25% threshold is a Chains internal guardrail, not a Firebase limit. Track concurrent
  connections, writes/second, Firestore reads/writes per screen and per round, bytes transferred, p95 latency,
  denied-rule counts, cross-tenant test results, backup success, restore RPO, and restore RTO.

**Risks and owner decisions.** Firebase documents no automated RTDB-to-Firestore migration: data and rules require
custom mapping/scripts. A phased dual-write can use Cloud Functions, but poorly guarded triggers can loop or drift.
Firestore can cost more when one user action becomes many small operations; RTDB can cost more in bandwidth and
operational sharding. Server SDKs are governed by IAM rather than client security rules, so future privileged
workers need separate least-privilege service identities and audit logs. Before App B implementation, the owner
must approve (1) Firestore-first with optional RTDB live-sync, (2) backup RPO/RTO and retention, and (3) regional
versus multi-region placement and the monthly budget guardrail.

**Official evidence checked 2026-08-04 [GPT]:**

- Firebase database comparison: https://firebase.google.com/docs/database/rtdb-vs-firestore
- Firebase RTDB-to-Firestore migration and coexistence guidance:
  https://firebase.google.com/docs/firestore/firestore-for-rtdb
