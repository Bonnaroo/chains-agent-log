# TRIAGE — when something breaks

Read this the moment production looks wrong. Do these in order. Do not improvise.

## 0. Is it actually broken? (2 minutes, always do this first)
Three false CRITICAL alarms have been filed on this project. Before declaring anything:
- Fetch the live URL **cache-busted**. GitHub Pages CDN lags ~1 min; browser tabs cache far longer.
- Decompress the **committed blob** — the app is gzip+base64 module blobs, plain `grep` gives false
  negatives on content that IS present.
- Read the same thing **twice, seconds apart**. Transient reads have caused false data-loss reports.
- `~46~` is an escaped `.` — `picks~46~14` is tournament 14. **There is no "T46."**
If you can't paste raw evidence of the breakage, you don't have a breakage yet.

## 1. Stop the bleeding
- Set `company/BUILD_LOCK.json` to `{"locked": true, ...}` so no agent deploys into a fire.
- If a deploy caused it, **roll back first, diagnose second.** Rollback = re-commit the previous
  known-good `index.html` blob by its sha. Every deploy log line records that sha — that's why.

## 2. Rollback procedure
1. `GET /repos/Bonnaroo/chains-app/commits?path=index.html` — find the last good commit.
2. Fetch that commit's blob (git blob API, never `download_url` — it can be CDN-stale).
3. **Verify the blob before restoring it**: decompress and confirm the eight markers are present.
   A rollback to a build that was itself missing a fix just moves the bug.
4. PUT it back as `index.html` with the CURRENT sha. Bump the version (rollbacks get a number too —
   never reuse or go backwards).
5. Verify all three levels. Log it.

## 3. Known-good rollback points
Keep this list current — every deploy appends one line.
- `10ff1d6236ae8fdf4240ca7c9f8badfd68b80c3b` — v445 (auth gate solid)
- `191af2445bc1fbdf7b59333c40fa9a1ff649a6b0` — v452 (first export carrying login fix in Design source)

## 4. Data incidents are different — NEVER improvise
The live 2026 season lives in `chains-fantasy /league`. It is **read-only to every agent.**
- Daily backups: `chains-dgpt-data/data/backups/league-YYYY-MM-DD.json` (unbroken since 2026-07-26).
- Per-pick change history: `data/picks_history.jsonl`.
- **Restore is an owner decision, never an agent's.** Surface the evidence and stop.

## 5. Back up BEFORE you change anything
Non-negotiable, and it has already saved us once (T14 picks before entering Ledgestone scores):
- Editing league/season data -> commit the current value to `data/backups/` first.
- Changing Firebase **security rules** -> save the current ruleset to a file before publishing.
  A bad rules push once broke live picking for a full day.
- Deleting anything in `chains-app-f38f8` -> copy to `_trash/<Date.now()>` first.
- Deploying -> record the outgoing sha as the rollback point in the same log line.

## 6. Escalate to the owner (don't guess)
- Anything touching the live season's scores, picks, or draft order
- A security hole that exposes one user's data to another
- Anything irreversible
State plainly: what's broken, what you verified, what you did, what you need decided.

---

# AUDIT — standing, section by section

Owner: *"Start auditing the system also. Every little section, every little corner, every line of
code to make sure everything lines up properly. Security, stability, upscaling."*

Work **one section per pass**. Depth over coverage. Log findings as Issues with evidence, fix what's
clearly in scope, escalate what isn't.

## The three lenses — apply all three to every section
**SECURITY** — Can user A reach user B's data? Is every write rule tested NEGATIVELY, not just
positively? Are there paths with no explicit rule falling through to a permissive parent? (Firebase
rules cascade and only ADD permission — a child rule can never restrict a permissive parent. This has
already bitten us: `playRounds` `.write: auth != null` makes `scorePatch`/`joinRequests`/`editHistory`
/`practice`/`notes` all writable by any signed-in user. **CLOSED 2026-08-05** — top-level
`playRounds.write` removed, replaced with owner/participant-scoped rules at `$roundId` level;
verified with real negative tests (5/5 hostile writes denied) and positive tests (owner + real
`scorePatch()` pattern still work). See `company/LOOP_LOG.md` 2026-08-05 entry. Same class of hole
still open on `liveRounds` — flagged as follow-up, not yet fixed.)
Any secret in client code? Any PII we don't need?

**STABILITY** — What happens offline? Mid-write? On a stale cache? If two people edit at once? Does
it fail loudly or silently? Silent failure is the worst bug class here — round save/delete failed
silently for weeks. Are errors surfaced to the user, or swallowed in a `catch {}`?

**UPSCALING** — Does it still work at 10x? Any unbounded read (fetching every round to show one)?
Anything hardcoded that shouldn't be — the six-member roster is hardcoded, which currently blocks
new league members from being drafted. Any per-user work that should be per-league?

## Sections to audit, in order
1. **Auth & identity** — `ChainsAuth`, `AuthGate`, `whoami()` vs `auth.uid`, session persistence, sign-out
2. **Firebase rules, whole ruleset** — every node, positive AND negative tests, cascade traps
3. **Round lifecycle** — `ChainsRounds`: save, delete, resume, shared scoring, edit history
4. **Picks & scoring engine** — the fantasy math, draft order, lock/unlock windows
5. **League & membership** — isolation, `memberId` assignment, the hardcoded roster
6. **Data pipeline** — poller, collectors, `season.json`, `field.json`, backups
7. **Bag / friends / QR / deep links** — `#add=`, `#league=`, `#watch=` and their onboarding paths
8. **Client resilience** — offline, CDN staleness, service worker, error surfacing

## Rules for auditing
- **Evidence or it didn't happen.** Paste the actual read, the actual denial, the actual line.
- A negative test that PASSES (correctly denied) is the finding that matters most.
- Don't fix security by loosening a check. Ever.
- If a fix is risky and the system is mid-change, log it with a **condition for when it must close**
  rather than doing it at a bad moment.
