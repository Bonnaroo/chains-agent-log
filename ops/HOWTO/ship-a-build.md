# Ship a build
Prereq: workbench rebuilt (START_HERE §3), `python3 ops/check.py` → `COLD START OK`.
1. Next version = HANDOFF §9 Live + 1 (also check `ops/STATE.md`; if another agent moved it, re-pull `src/`).
2. Edit `/tmp/chains/mods/module_NNN.js` (only modules listed in `mods={...}` at the top of build.py; add a module there if you must touch a new one — and push that build.py change).
3. `./node_modules/.bin/esbuild mods/module_NNN.js --loader:.js=jsx --target=es2018 --log-level=error > /tmp/c.js && node tdz.js /tmp/c.js` → `clean`.
4. `python3 build.py vNNN test.html "vNNN: what changed"` → prints `test.html vNNN commit … blob ok True`.
5. Wait ~2 min: `curl -s https://bonnaroo.github.io/chains-app/test.html | md5sum` = `md5sum < app_vNNN.html`.
6. Verify (HOWTO/verify-*). 0 console errors. Remove any test data.
7. `python3 build.py vNNN index.html "vNNN live: what changed"`.
8. For every edited module: `python3 push.py chains-agent-log src/module_NNN.js mods/module_NNN.js "src: module NNN vNNN"`.
9. AGENT_LOG entry (HOWTO/update-docs.md), HANDOFF Live line, TODO tick, STATE.md. Push each with push.py.
Rebuilding the same version on test.html is fine; never reuse a version number on index.html.
