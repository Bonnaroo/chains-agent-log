# Playbook — Firebase Backup (Watcher role, daily)

1. Check company/agents/watcher/history.md for today's date already having a completed backup — skip if so.
2. GET the Firebase tree via <DB>/.json?auth=<idToken> (anonymous sign-in via identitytoolkit for the idToken),
   or the key top-level nodes individually if the full tree is too large in one call (see kb/firebase.md for
   current node names).
3. Before committing: record timestamp, record counts per node, and a simple checksum. Redact/strip anything
   that looks like a password, token, or unnecessary personal identifier — do not blindly commit raw personal
   data even to a private repo.
4. Commit as Bonnaroo/chains-dgpt-data/backups/firebase-<YYYY-MM-DD>.json via the API.
5. Retention: keep the last 14 daily backups; on cleanup, only ever delete files under backups/, nothing else.
6. Note the backup (path, size, node/record counts) in company/agents/watcher/history.md.
7. WEEKLY: pick one recent backup and attempt an actual restoration into a scratch/local structure (not back
   into live Firebase) to confirm the backup is real and readable, not just present. A backup is not proven
   until it has been successfully restored at least once. Log the restoration test result.
8. If a backup is missing, empty, or dramatically smaller than the prior day's, that's a `priority:high` Issue
   on its own — do not silently skip it.
