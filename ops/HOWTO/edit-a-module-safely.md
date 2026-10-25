# Edit a module safely (the traps that bit us)
- JSX text does not decode `\uXXXX` — write real characters (—, ·).
- `const`/`let` are real (no Babel): using one before its line in the same function = crash on that screen. `tdz.js` catches most; keep hooks and derived consts in top-down order inside components.
- Python edits: `assert s.count(anchor) == 1` for **every** anchor first, replace, then write the file **once** at the end; `s.encode('utf-8')` before writing. A script that crashes mid-way after writing leaves half a change.
- No trailing commas on edit tuples (`('a','b'),` inside a list is fine; a lone `('a','b'),` assigned to a variable becomes a tuple-of-tuple).
- Fixed/modal elements must render through `Portal`/`__Portal` (the app container has a CSS transform).
- No emoji as icons; use `Icons.*` (module 46). Plain words (DESIGN.md §3).
- `courseStats` entries: `total` is TO PAR, `strokes` raw, `hs` per hole, `full` false for 9-hole rounds.
- Firebase writes: never wrap in a bare `catch`; module 12 logs refusals anyway, but keep the promise.
- After editing, grep your own strings in the built file is useless (blobs are gzip) — verify in the app.
