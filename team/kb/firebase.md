# PLAYBOOK: Firebase data checks (app project chains-app-f38f8)
Public web API key (ships in the client, not a secret): AIzaSyAZ9T16EZSngQxNevsil-txb3xpEC4RKIE
DB root: https://chains-app-f38f8-default-rtdb.firebaseio.com
Reads/writes need auth != null; anonymous sign-in is enough (the app does it). From bash:
  1) POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<API> {"returnSecureToken":true} -> idToken
  2) GET/PUT/POST/DELETE  <DB>/<path>.json?auth=<idToken>
Key nodes: /playRounds/<id> (durable rounds, full objects), /liveRounds/<id> (in-progress mirror), /users/<uid>,
/waitlist/<id> (marketing signups). Data-integrity checks: look for orphan/duplicate/"open"-forever records.
RULES: back up to <DB>/_trash/<Date.now()> before ANY delete. NEVER touch the SEPARATE chains-fantasy project's
/league node (the live 6-friend league) — different project, off-limits.

NOTE 2026-07-28: actual root keys observed today are: ledger, friendCodes, users, config, admins, joinCodes,
friends, diagnostics, usernames, sharedBags, _trash. playRounds/liveRounds/waitlist currently read null (empty) —
they exist as concepts in ARCHITECTURE.md but have no live data as of this check. No /eventField or /leagues
node exists yet — confirms PHASE 2 has not started.

## PHASE 2 SCHEMA (proposed, DATA lane, step 1 — additive only, not yet consumed by the app)
Design goal: move league picks/draft-order/standings/event-field out of the compiled index.html into Firebase,
mirroring how /playRounds already works. These nodes are NEW and additive — writing to them is safe because
no current app build reads them yet. A Design build must switch the app's JS to read these before they do
anything live; until then this is pure documentation + (later) seed data.

/leagues/<leagueId>/
  meta/
    name: string
    season: string              # e.g. "2026"
    ownerUid: string
    createdAt: number (epoch ms)
    status: "draft_pending" | "draft_open" | "season_active" | "season_complete"
  members/<uid>/
    displayName: string
    joinedAt: number
    isCommissioner: boolean
  eventField/<pdgaEventId>/       # roster of real pros available to draft for one event, sourced from PDGA
    eventName: string
    eventId: string               # PDGA numeric event id, e.g. "96414"
    division: "MPO" | "FPO"
    fieldSize: number             # total players in division per PDGA (integrity check vs pdga.com)
    players/<pdgaNumber>/
      name: string
      pdgaNumber: number
      rating: number | null
    collectedAt: number (epoch ms)
    source: string                 # PDGA URL this was pulled from, for auditability
  draftOrder/<eventId>/
    order: array<uid>              # snake-draft order, set at draft start
    currentPickIndex: number
    round: number
    locked: boolean                # true once draft begins, prevents order tampering
  picks/<eventId>/<uid>/
    pdgaNumber: number              # which pro this member drafted
    pickedAt: number
    pickNumber: number              # overall pick # in the draft, for audit/replay
  standings/<eventId>/
    <uid>/
      totalScore: number
      rank: number
      updatedAt: number

Design notes:
- eventField is keyed by real PDGA event id so it can be refreshed idempotently from chains-dgpt-data collectors
  without colliding with league-specific data.
- picks/draftOrder are keyed by eventId + leagueId path so multiple leagues can draft the same real-world event
  independently.
- fieldSize + collectedAt/source exist specifically so future health-checks can flag stale or mismatched field
  counts against live pdga.com data (see 2026-07-28 Ledgestone MPO check: PDGA site showed 156 in MPO; no
  matching baked-in or Firebase field data was found anywhere in the app to compare against yet, since Phase 2
  hasn't started — this schema is what future field-count seeds will land in).
- Nothing under /leagues exists in the live DB yet as of 2026-07-28; this section is documentation only. Next
  Phase 2 step (future run): seed one real /leagues/<id>/eventField node with current Ledgestone MPO data as a
  smoke test, still fully additive, no reads wired up yet.

## BUG REPORTS SCHEMA (implemented 2026-07-30, DATA lane T-D08)
User-submitted bug reports flow: app form → /bugReports/<id> write → Data lane processes unseen reports → appends to team/BUG_REPORTS_INBOX.md UNROUTED section → Design lane converts to tasks.

/bugReports/<id>/
  text: string                      # user's bug description, e.g. "Crash when entering league after selecting team"
  screen: string                    # which screen/view the bug occurred on, e.g. "draft-screen", "field-view"
  timestamp: number (epoch ms)      # when user submitted the report
  uid: string                       # Firebase Auth uid of the user who submitted
  version: string                   # app version at time of report, e.g. "1.0.0"
  seen: boolean                     # true once Data lane has processed it and appended to INBOX; false initially

Read interfaces for CEO/QA:
  1. Count unseen: GET /bugReports.json?auth=<idToken> | jq '[.[] | select(.seen == false)] | length'
     Returns: number of unprocessed reports
  2. List unseen (summary): GET /bugReports.json?auth=<idToken> | jq '[.[] | select(.seen == false) | {screen, text, uid, version, timestamp}]'
     Returns: array of unseen report summaries
  3. Mark seen after processing: PATCH /bugReports/<id>.json?auth=<idToken> with {"seen": true}
     Prevents re-processing on next run

Tested 2026-07-30: created 2 test reports via POST, verified structure, tested seen workflow (1 report marked seen, 1 unseen), read counts and lists both work. Schema is production-ready.

## SCALE PLANNING METHOD (2026-08-04 [GPT])

- Treat rule topology as a scale gate, not cleanup. The current `/playRounds` parent `.write: auth != null` is
  unsafe for outside users because RTDB rules cascade and a child cannot revoke a parent grant. Before onboarding
  outsiders, remove broad parent grants and prove own-write allow plus other-user/other-league deny cases in the
  Emulator Suite.
- Keep APP A on RTDB during the live season and harden it in reversible slices. Do not force a database migration
  to repair an authorization rule.
- For future APP B, default durable multi-tenant data to Firestore; use RTDB only when measured presence or
  high-frequency live-sync behavior makes it valuable. Firebase supports both in one project, but there is no
  automated RTDB-to-Firestore migration. Use mapped scripts and a bounded migration window; avoid permanent
  dual-write and guard Cloud Function triggers against loops.
- Capture evidence before committing: concurrent connections, writes/second, bytes transferred, Firestore
  reads/writes per screen and per round, p95 latency, denied-rule counts, cross-tenant test results, backup success,
  and restore RPO/RTO. Load/cost test before 10,000 MAU or 25% of any provider ceiling; 25% is an internal Chains
  guardrail, not a Firebase limit.
- Official references: https://firebase.google.com/docs/database/rtdb-vs-firestore and
  https://firebase.google.com/docs/firestore/firestore-for-rtdb.

## LIVE RULES INCIDENT METHOD (2026-08-05 [GPT])

- Do not reproduce a documented successful write/delete probe against a live database simply to confirm another
  worker's exact evidence. Treat the open issue, request/response, cleanup proof, timestamp, and path as shared
  evidence until a rules change could invalidate it.
- For `chains-fantasy` issue #1, [GPT] is not authorized to inspect, write, delete, or deploy anything. The owner
  must export the current rules from Firebase Console and save a dated rules backup before any proposed edit.
- Review rule inheritance offline and stage corrected rules in Emulator Suite or a non-production project. Test
  required existing reads/writes plus explicit unauthenticated-deny cases. Use only owner-approved disposable
  paths; never use or inspect legacy `/league`.
- Deploy through the owner-controlled console/service identity only after the backup and regression matrix exist.
  Re-test denied writes after deployment and record observable status, exact rules artifact, deployment timestamp,
  and rollback path. A rule file in Git without proof that it is live is not closure.
- Source incident: https://github.com/Bonnaroo/chains-app/issues/1.
