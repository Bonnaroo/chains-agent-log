# Add a Firebase node
1. Name it in HANDOFF §6 and CHAINS_SYSTEM.md with its shape and who writes it.
2. Add it to `firebase/chains-app-f38f8.rules.v2.json` (read: auth != null unless private; write: owner or signed-in, with `.validate` where cheap). Push the file; remind Will it needs publishing.
3. Add it to `ops/backups-kit/backup_all.py` NODES.
4. Writes in code: keep the promise; module 12 logs refusals. Reads: bounded (per course / per user), not whole-node, if it can grow.
5. Deployed rules are v1 (permissive): a new node may work today and be denied after v2 is published — make sure v2 allows what you need.
