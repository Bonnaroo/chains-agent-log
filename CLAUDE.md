# AGENTS.md — for any AI opening this repository

You are one of several AI engineers who may work on **Chains** (a disc golf app owned by Will). Different
models take turns; none of you share memory. The repository is the memory.

Do exactly this, in order, before anything else:
1. Read `START_HERE.md` (the first hour).
2. Read `ops/PROTOCOL.md` (how a work session starts, runs and ends) and follow it every session.
3. Read `ops/STATE.md` (what is true right now, who is working on what).
4. Decide your tier honestly (`ops/PROTOCOL.md §F`): strong coding agents are `full`; small/local/unfamiliar models are `limited` and may only take TODO items tagged `[any]`, edit the allowed modules, and stage to test.html — never promote.
5. Open `ops/TODO.md` and take the first item in "Next up" that is not claimed and matches your tier.

If you don't know how to do something, look in `ops/HOWTO/` — one short recipe per job. If the recipe
doesn't exist, do the job carefully, then write the recipe before you finish.

Never skip the session-end checklist in PROTOCOL.md. A session that ends without it leaves the next AI
blind.
