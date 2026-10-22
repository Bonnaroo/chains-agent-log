# chains-backups (PRIVATE)

Nightly full export of the Chains databases. Runs on GitHub Actions on a schedule — no AI, no laptop.

## Set-up (one time, ~5 minutes)
1. On GitHub: **New repository** → name `chains-backups` → **Private** → Create.
2. Upload these three files keeping the folder names:
   `backup_all.py`, `README.md`, `.github/workflows/nightly-backup.yml`
   (Add file → Upload files; drag the whole `chains-backups-kit` contents in.)
3. Firebase console → project **chains-app-f38f8** → **Authentication** → **Users** → **Add user**:
   email `chainsbot@chains.app`, any long password. Copy the new user's **UID**.
4. Firebase → **Realtime Database** → **Data** → at the root add `admins` → `<that UID>` = `true`.
   (This lets the bot read `users/` — profiles, trophies — once the v2 rules are published.)
5. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**, twice:
   `CHAINS_BACKUP_EMAIL` = `chainsbot@chains.app` · `CHAINS_BACKUP_PASSWORD` = the password.
6. **Actions** tab → "Nightly Chains backup" → **Run workflow** once. A `data/backups/full-<date>.json`
   appears. From then on it runs every night at 06:15 UTC and keeps 45 days.

## What's in a backup
One JSON file: every node of `chains-app-f38f8` (accounts, rounds, course stats, names/territory, leagues,
crews, bags, community, messages) plus the legacy `chains-fantasy` nodes (`_legacy`). `_meta.nodes` shows
how many records each node had — if a count ever drops sharply the file is saved as `-SUSPECT` and
`full-latest.json` is left alone, so a bad night never overwrites a good one.

## Restore (one node, e.g. courseStats)
1. Open the backup file, copy the value of the node (the object after `"courseStats":`).
2. Firebase console → Realtime Database → Data → click the node → ⋮ → **Import JSON** (replaces that node),
   or ask the AI to PUT it back with the admin token. Never import the whole root.
