# chains-agent-log — the brain of Chains

Chains is a disc golf app (score rounds, names on every course, leagues, your crew). The app itself is the
single file `index.html` in `Bonnaroo/chains-app`; data files live in `Bonnaroo/chains-dgpt-data`; the
scoring poller in `Bonnaroo/chains-poller`. **This repo is where any person, app or AI should start.**

**Every session, in this order:** `AGENTS.md` (one screen) → `START_HERE.md` (first hour, cold start) →
`ops/PROTOCOL.md` (how a session starts and ends, claims) → `ops/STATE.md` (what is true now) → last 10
entries of `AGENT_LOG.md` → `ops/TODO.md` "Next up". Then `python3 ops/check.py` must print ALL GREEN.

Reference, read when needed: `HANDOFF.md` (the manual) · `CHAINS_SYSTEM.md` (architecture, data model) ·
`DESIGN.md` (screens) · `CHALLENGES.md` (trophies, challenges, titles) · `AUDIT-2026-10-24.md` (findings
behind the TODO numbers; papers in `research/`) · `OPERATIONS.md` (release, rollback, backups, incidents) ·
`BRAND.md` · `GLOSSARY.md` · `ops/HOWTO/` (one recipe per job) · `ops/CAPABILITIES.md` (what your setup
can verify) · `ops/APPSTORE.md`, `ops/MONITORING.md` · `firebase/` (rules; v2 is the file to publish) ·
`src/` (the app's module sources — the source of truth since v537) · `archive/` (old, don't use).

Owner: Will (commissioner). Rules of the road: ship to `test.html` first, verify in a real browser, then
`index.html`; log every deploy; keep words plain; nothing from UDisc is copied.
