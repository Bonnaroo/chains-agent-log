# ops/ — how Chains is run

| File | What it is |
|---|---|
| `TODO.md` | The running to-do list (bugs, uplift, ops, growth). Updated every session. |
| `backups-kit/` | Drop-in nightly full-database backup for a PRIVATE repo (`chains-backups`). README inside has the 6 set-up steps. |
| `../HANDOFF.md` | Start here if you are a new AI or developer. |
| `../CHAINS_SYSTEM.md` | Architecture, data model, every bug we hit and why. |
| `../AGENT_LOG.md` | Chronological log of every deploy. |
| `../firebase/` | Database rules (v2 is the file to publish). |

Automation that already runs on schedules in `Bonnaroo/chains-dgpt-data` (no AI involved):
DGPT scores (every few hours) · daily rounds/league backup · weekly disc catalog · weekly OpenStreetMap course geometry.
