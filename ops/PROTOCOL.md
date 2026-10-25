# PROTOCOL — one work session, any AI, any model

Same steps whether you are Claude, ChatGPT, Hermes, a local model, or a person. Copy the checklists into
your own notes and tick them. The repository is the only shared memory: if it isn't written here, it
didn't happen.

## A. Session start (15–30 minutes, no exceptions)
1. **Identify yourself**: pick a short agent name (e.g. `claude-cowork`, `gpt-5`, `hermes-local`). Use it
   in every log entry and claim.
2. **Read**: `START_HERE.md` → `ops/STATE.md` → last 10 entries of `AGENT_LOG.md` → `ops/TODO.md` "Next
   up". If `ops/STATE.md` says someone else is `doing` an item with a claim younger than 24 hours, do not
   touch that item.
3. **Rebuild the workbench** (START_HERE §3) and run `python3 ops/check.py`. It must say `COLD START OK`
   and `DOCS OK`. If it doesn't, fixing that *is* your first task (log what was wrong).
4. **Claim** one item: in `ops/TODO.md` change its `todo` to `doing <agent>, <YYYY-MM-DD>`; in
   `ops/STATE.md` fill "In flight"; push both files **before** you start working.
5. Say hello to Will in one line: what you're about to do and roughly how long.

## B. Work — three duties every session, in this order
1. **Bugs first**: anything S1/S2 in `ops/BUGS.md` "Open" outranks the TODO queue (full tier; limited tier if the module is allowed).
2. **One queue item** from `ops/TODO.md` "Next up".
3. **Sweep**: audit the screen group with the oldest date in `ops/SWEEP.md` (it is the next item in the rotation, not optional). Bugs → BUGS.md with steps; improvements → TODO.md with a "done =" line; small clear fixes within DESIGN/CHALLENGES rules → ship them (full tier). Update the sweep date.
If you only have time for one thing, do 1, then 3, then 2.

### Work rules (one item at a time)
- Follow the loop in START_HERE §4: edit `mods/` → esbuild + `tdz.js` clean → build to **test.html** →
  verify → promote to **index.html** → push `src/` → log → HANDOFF Live line → tick TODO.
- Verify with what you have (`ops/CAPABILITIES.md`). If you cannot verify a screen yourself, build to
  test.html only and ask Will to try it on his phone; do **not** promote until he confirms.
- Keep changes small and additive. If an item turns out bigger than a session, finish a safe slice,
  ship it, and write the rest back into TODO as new items with done-criteria.
- Test data: create as little as possible and remove it (START_HERE §6, `ops/HOWTO/clean-test-data.md`).
- Never do the things in START_HERE §2.

## C. Session end (10 minutes, even if you're cut off early — do this first when you feel the end coming)
1. **Sources pushed**: every edited `mods/module_NNN.js` → `src/module_NNN.js` (HOWTO/ship-a-build.md §6).
   If an edit is unfinished and not shipped, do **not** push it to `src/`; describe it in TODO instead.
2. **AGENT_LOG.md**: one entry — date, agent name, version(s), what/why/where, how verified, "Compatibility:".
3. **HANDOFF.md §9** Live line matches what is actually live (`ops/check.py` tells you).
4. **ops/TODO.md**: item ticked `done vNNN` or returned to `todo` with a note of what's left; new items added
   with done-criteria. Release your claim.
5. **ops/STATE.md**: version, "In flight" cleared or updated, "Last sessions" line added, blocked list current.
6. Run `python3 ops/check.py` once more. Tell Will: what shipped, what to try, what you need from him.

## D. If two AIs overlap (the build enforces most of this)
- You must be named: `/tmp/chains/agent` holds your agent name; every commit message carries it.
- Claims are per TODO item; one item per agent at a time. A claim older than 24 h is stale and may be taken
  over — note the takeover in STATE.md.
- **test.html is one shared slot.** `build.py` writes `- Staging: <agent> vNNN since <time>` into
  `ops/STATE.md` when you build to test.html and refuses to let anyone else build to test.html for 2 hours
  or until you promote (which sets it back to `free`). Promote or free it (edit the line) before you stop.
- Versions move forward: build.py refuses a test.html version that isn't above live, and a promote that
  isn't live+1 ("someone shipped in between" → re-pull `src/` for your modules, merge, rebuild).
- Promote rewrites the Live lines in HANDOFF.md and STATE.md itself; you still write the AGENT_LOG entry.
- Never force-overwrite a module another agent changed; `src/` history in git is the tie-breaker. If two
  agents must touch the same module, the second waits for the first's promote, re-pulls, then edits.

## E. If something is broken when you arrive
- App down or a screen crashing: OPERATIONS.md §5 (incident) → roll back first (HOWTO/rollback.md), log,
  then investigate.
- Docs disagree: newest AGENT_LOG entry wins; fix the stale doc the same session.
- You can't build: don't ship anything; write what fails in STATE.md "Blocked" and tell Will.

## F. Tiers — which agents may do what (the build enforces it)
Name yourself with a tier in `/tmp/chains/agent`: `<name>:full` or `<name>:limited`. Be honest; Will decides
who is which. Rule of thumb from Will: strong coding agents (Claude Code, Codex CLI, GPT-class) are
**full**; smaller, local or unfamiliar models (Ollama/Hermes/Qwen/DeepSeek etc.) are **limited**.

| | full | limited |
|---|---|---|
| Claim TODO items | any | only items tagged `[any]` |
| Edit modules | all | only `8 12 17 19 24 32 38 41 42 46 57 58` (trophies, rating, notifications, aces, icons, settings UI, Firebase init, season panel, primitives) — **never** 31 rounds engine, 45 PlayView, 47 shell, 60 auth, 68 leagues/friends, 70 chat |
| Build to test.html | yes | yes (same staging lock) |
| Promote to index.html | yes | **no** — leave it staged, tell Will; a full agent or Will promotes |
| Docs, tests, recipes, research, reviews | yes | yes — this is where limited agents add the most value |
| Firebase rules file, backup kit, build.py | yes | no |

A limited agent that needs a protected module writes the change as a TODO item (what, where, done =) for
a full agent. `build.py` refuses limited promotes and limited edits to protected modules outright.
