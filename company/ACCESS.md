# ACCESS — what the loop and auditor need, in one place

Written because three consecutive runs were blocked on things that were already known but never
recorded. If a run gets stuck on "I don't have X", the answer probably belongs in this file.

## Test accounts — for negative/cross-user testing
Usernames map to a **synthetic email**: `<username>@chains.app`. Nobody types a real email.

| Username | Email for sign-in | Password |
|---|---|---|
| `cory` | `cory@chains.app` | `chains1234` |
| `kyle` | `kyle@chains.app` | `chains1234` |
| `shanna` | `shanna@chains.app` | `chains1234` |
| `gabe` | `gabe@chains.app` | `chains1234` |
| `will` | `will@chains.app` | **owner-changed — do not use in tests** |
| `kadey` | `kadey@chains.app` | **owner-changed — do not use in tests** |

Sign in via `identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<WEB_API_KEY>`.
Use kyle + shanna (or gabe/cory) as the two parties for any A-cannot-reach-B test.

## Firebase projects — do not mix them up
- **`chains-app-f38f8`** — the NEW app. `playRounds`, `liveRounds`, `users`, `usernames`, `friends`,
  `friendRequests`, `friendCodes`, `leagues`, `leagueCodes`, `bugReports`, `admins`.
  Web API key is embedded in the deployed `index.html` (decompress the `ChainsFB` module to read it).
- **`chains-fantasy`** — the LEGACY project holding the LIVE 2026 season: `/league` (picks & scores),
  `/live` (poller feed). **READ-ONLY. Never write.** Reads need no auth.

## Reading the deployed security rules
Previous audits could only *infer* rules from probe behaviour, because reading them needs admin
credentials. The current deployed ruleset is now saved as ground truth at:
`company/backups/firebase-rules-chains-app-f38f8.json`
**Diff against that file instead of re-probing blind.** If you change rules, save the current version
there first (TRIAGE_AND_AUDIT.md §5), then update it after publishing.

Admin access is a Google service-account JWT-bearer exchange using the key file on the owner's
machine at `Downloads/chains-app-f38f8-firebase-adminsdk-*.json` — scope
`https://www.googleapis.com/auth/firebase.database`, exchanged at `oauth2.googleapis.com/token`.
Tokens last ~1 hour. **The key file is local-only and must never be committed anywhere.**

## Backups — which job covers what
- `data/backups/rounds-YYYY-MM-DD.json` — Go Throw rounds from **chains-app-f38f8**
  (`/playRounds` + `/liveRounds`). Anonymous sign-in is sufficient. The loop can take these.
- `data/backups/league-YYYY-MM-DD.json` — the fantasy season from **chains-fantasy** `/league`.
  Plain unauthenticated GET of `https://chains-fantasy-default-rtdb.firebaseio.com/league.json`
  works — no credentials needed. A GitHub Action (`backup.yml` / `backup_league.py`) normally does
  this daily. If a day is missing, taking a read-only snapshot and committing it is allowed and
  safe; **that is a read of /league, never a write.**
- A backup is only real if you re-fetch it, parse it, and confirm all 14 `picks~46~N` keys carry
  values. An untested backup is not a backup.

## Known-good rollback points
- `10ff1d6236ae8fdf4240ca7c9f8badfd68b80c3b` — v445
- `191af2445bc1fbdf7b59333c40fa9a1ff649a6b0` — v452
