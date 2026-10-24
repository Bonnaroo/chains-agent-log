# OPERATIONS.md — how Chains is run

Policies, procedures and work instructions for keeping the app up, the data safe and releases boring.
HANDOFF.md says how to *build*; this says how to *operate*. Owner: Will. Executed by whichever AI is on
the app, except the steps marked **Will only**.

## 1. What we run (inventory)

| Thing | Where | Who can touch it |
|---|---|---|
| The app (`index.html`, `test.html`) | GitHub Pages, repo `Bonnaroo/chains-app` | AI (token: Contents) |
| Accounts database | Firebase Realtime Database, project `chains-app-f38f8` | app users (rules), Will (console) |
| Legacy fantasy database (`/notifications`, `/live`) | Firebase project `chains-fantasy` | Railway poller, Will |
| Fantasy poller + password-reset worker | Railway | Will (env vars) |
| Course catalog + DGPT data + daily rounds backup | repo `Bonnaroo/chains-dgpt-data` (public), GitHub Actions | AI, Will |
| System docs, logs, this file | repo `Bonnaroo/chains-agent-log` | AI |
| Full nightly backups | repo `chains-backups` (PRIVATE — **not created yet**) | Will to create |
| Map imagery | Esri World Imagery (dev use); production key needed before App Store | Will |

All four existing repos are **public**. Nothing with user data beyond names and scores may be committed to
them. Full database exports go only to the private repo.

## 2. Release procedure (every change)

1. **Rebuild the workbench** (HANDOFF §4) and read DESIGN.md before touching a screen.
2. Edit the module(s) in `/tmp/chains/mods/`. Python edits must `out.encode('utf-8')` before writing
   (a bad write once truncated module 45 to zero bytes).
3. **Syntax check** each touched module with esbuild (`--loader:.js=jsx`). Never deploy on a failed check.
4. `build.py vNNN test.html "message"` → wait until the live page reports `CHAINS_VERSION = "vNNN"`
   (1–3 minutes; check with curl, or compare byte size with `app_vNNN.html`).
5. **Verify on test.html in the 400-px harness**: open every screen you changed, 0 console errors,
   0 emoji, the back control present, the data you expected actually shows. If a Firebase write is part of
   the change, confirm the node exists afterwards (anonymous REST read from the sandbox).
6. `build.py vNNN index.html "message"` — same version number. Never promote a version that was not seen
   on test.html first.
7. **Log it the same session**: AGENT_LOG.md entry (what, why, where in the code), HANDOFF §9 current-state
   line, ops/TODO.md ticks. A deploy without a log entry is incomplete.
8. Tell Will in one or two plain sentences what changed and what to try on his phone.

Version numbers only go up. One version per build; if a build is redone, the number stays the same until it
is promoted.

## 3. Rollback

- The last ~10 full builds are in `/tmp/chains/app_vNNN.html` during a session, and every build is a
  commit in `chains-app` forever.
- To roll back: `build.py` is not needed. Fetch the previous version's `index.html` from the commit
  (`https://api.github.com/repos/Bonnaroo/chains-app/commits?path=index.html`), and PUT it back as
  `index.html` with a message "rollback to vNNN". Then update HANDOFF §9 and log the reason.
- Data written by the rolled-back version stays in Firebase. Unknown fields are ignored by older versions,
  so rolling the app back never needs a data rollback.

## 4. Backups

| What | Cadence | Where | Status |
|---|---|---|---|
| Rounds (names + scores) | daily, GitHub Actions | `chains-dgpt-data/data/backups/rounds-*.json` | running |
| Full database (every node, both projects) | nightly 06:15 UTC | private `chains-backups` | **waiting on Will** (ops/backups-kit/README.md, 6 steps) |
| App code | every build is a commit | `chains-app` history | running |
| Docs, rules, kits | every change is a commit | `chains-agent-log` | running |
| Point-in-time zip of all repos on Will's computer | on request | Desktop/Chains-backup | last 2026-10-23 |

Retention: 45 daily full backups; rounds backups unlimited (small). A backup whose core nodes shrank by
half is saved as `-SUSPECT` and never overwrites `full-latest.json`.

**Restore one node** (e.g. `courseStats`): open the backup, copy the node's object, Firebase console →
Realtime Database → click the node → ⋮ → Import JSON (or PUT it with the REST API and an admin token).
Restore `users/` only after confirming with Will — it holds every account's profile and trophies.

**Restore everything**: import the whole file at the database root. Only after a confirmed total loss.

## 5. Incident checklist (app down, data wrong, user locked out)

1. **Confirm**: open `index.html` fresh (private window). Read `CHAINS_VERSION`. Check the Firebase status
   page and GitHub Pages status.
2. **Scope**: one user or everyone? One screen or sign-in? Read the console on test.html in the harness.
3. **Stop the bleeding**: if the latest release is the cause, roll back (§3) first, investigate second.
4. **Data**: if records were corrupted, note the exact paths and the time; restore from the latest clean
   backup for those paths only (§4).
5. **Tell Will** what happened, what was done, what is still at risk — in plain words, no blame.
6. **Log it** in AGENT_LOG.md under "Incident <date>" with cause and the fix. Add a TODO to prevent repeat.

Known failure modes so far: Chrome extension offline (testing only), renderer freeze in the harness
(navigate to a fresh URL), raw.githubusercontent cache ignoring query strings (catalog key rolls weekly),
Firebase rules rejecting a new node (publish rules v2), a mis-tapped 1 creating a phantom ace (8-second
retract exists).

## 5b. Monitoring
Set-up steps for UptimeRobot (site up, version keyword, database answering) and Sentry (errors on
players' phones, no user identity sent) are in `ops/MONITORING.md`. Until Will does them, the AI's
weekly check is the only monitor.

## 6. Weekly checks (first session of the week)

- GitHub Actions in `chains-dgpt-data`: all workflows green (DGPT collect, daily rounds backup, discs, OSM
  geo, course pipeline on Sundays). Re-run a red one once; if still red, fix and log.
- Firebase: database size (console → Usage) — we budget under 1 GB for 2027; `notifications` are pruned at
  45 days by the app.
- `usernames` count vs last week (growth) and `playRounds` count (activity) — one line in AGENT_LOG.
- Open TODO: anything marked `will` older than two weeks gets re-raised to Will with exact steps.

## 7. Data policy

- We store: account email (auth), username, display name, optional photo, rounds (course, date, holes,
  scores, who was on the card), bag, friends, messages, league memberships, trophies/points, home course,
  challenge progress. Nothing else.
- We never store: payment details, precise location history (a round's GPS points are used in the
  session, not kept), anything scraped from other apps' course data.
- Public (readable by any signed-in user): `usernames` (name, photo, points, badge), `courseStats`,
  `territory`, `courseFirsts`, `weekly`, `lostFound`, `courseLeagues`. Private: `users/{uid}` (own user
  and `admins` only once rules v2 are live).
- Deleting an account: Will removes the Auth user; the AI removes `users/{uid}`, the `usernames/{key}`
  entry and the player's name from `courseStats` on request. Rounds the player shared with others keep the
  scores but the name becomes "Former player".
- Course data: only sources listed in `chains-dgpt-data/pipeline/SOURCES.md` (OSM, licensed PDGA, players'
  own entries). No UDisc scraping — this is a standing rule.

## 8. Who does what

| Task | Will | AI |
|---|---|---|
| Publish Firebase rules, add admins, Railway env vars, create private repos, secrets, App Store accounts | ✔ | writes the exact steps |
| Build, test, deploy, log | | ✔ |
| Decide product direction, approve wording, test on the course | ✔ | proposes |
| Backups running, restores | ✔ (console) | prepares files and steps |
| Licence emails (PDGA, Metrix) | ✔ | drafts |

## 9. Standing actions waiting on Will (as of 2026-10-23)

1. Publish rules v2 (`firebase/chains-app-f38f8.rules.v2.json`) — steps in AGENT_LOG 2026-10-21.
2. Create private `chains-backups` + bot user + two secrets (ops/backups-kit/README.md).
3. Click **Run workflow** once on "Course data pipeline" in chains-dgpt-data.
4. Railway env vars + service-account key for the password-reset worker.
5. Send the licence emails in `pipeline/SOURCES.md`.
6. Two-phone test with Kyle or Gabe (card from two phones, friend request, DM, league invite).
7. UptimeRobot + Sentry accounts (ops/MONITORING.md, 20 minutes).
8. When ready for the stores: Apple Developer + Codemagic accounts (ops/APPSTORE.md).
