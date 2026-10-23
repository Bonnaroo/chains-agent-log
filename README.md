# chains-agent-log — the brain of Chains

Chains is a disc golf app (score rounds, names on every course, leagues, your crew). The app itself is the
single file `index.html` in `Bonnaroo/chains-app`; data files live in `Bonnaroo/chains-dgpt-data`; the
scoring poller in `Bonnaroo/chains-poller`. **This repo is where any person, app or AI should start.**

1. `HANDOFF.md` — read first. What it is, where everything lives, how to build, ship and test.
2. `CHAINS_SYSTEM.md` — architecture and data model.
3. `AGENT_LOG.md` — what changed, when, and why (newest at the bottom).
4. `DESIGN.md` (how screens must look) and `CHALLENGES.md` (how trophies, challenges, home course and crowns fit together).
5. `OPERATIONS.md` — how it is run: release, rollback, backups, incidents, weekly checks, data policy.
6. `ops/TODO.md` — the running to-do list. `ops/` — kits (backups).
7. `firebase/` — database rules.

Owner: Will (commissioner). Rules of the road: ship to `test.html` first, verify in a real browser, then
`index.html`; log every deploy; keep words plain; nothing from UDisc is copied.
