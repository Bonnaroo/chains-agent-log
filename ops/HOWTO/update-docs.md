# Update the docs at session end (the order matters)
**Re-fetch every doc from GitHub right before you edit it** — build.py and other agents write HANDOFF.md and STATE.md; pushing a stale local copy silently undoes their lines (it happened to claude-cowork on v555; check.py caught it).
1. `src/`: push every edited module (`push.py chains-agent-log src/module_NNN.js mods/module_NNN.js "src: module NNN vNNN"`).
2. `AGENT_LOG.md`: append `## YYYY-MM-DD — vNNN: title` + bullets: what, why, where (module/function), how verified, `Compatibility: additive` (or what breaks), your agent name. Push.
3. `HANDOFF.md` §9 first line: `- **Live:** index.html **vNNN** (date). Staging test.html vNNN.` Push.
4. `ops/TODO.md`: tick (`done vNNN`), un-claim, add follow-ups with "done =". Push.
5. `ops/STATE.md`: Live, In flight, Last sessions, Blocked. Push.
6. `python3 ops/check.py` → everything green. Then tell Will.
Use `push.py` for each file (it handles the sha). Never use the GitHub inline editor for AGENT_LOG (concurrent edits clobber).
