# Add a trophy ladder
1. `src/module_032.js`: add a `{ id, cat, name, icon (unused), value, tiers: [...], how, tierNames? }` entry to `defs`; compute `value` in the same function (there are per-round loops you can extend). Keep the first tier honest (FIRST_TIER map makes "it happened once" ladders need 3).
2. Add the SVG glyph: `GLYPH_BY_ID[id] = "<Icons name>"` (module 46 has the set) or rely on the category default.
3. Keep ids unique (a duplicate id caused a React key warning once). Count must stay a round number people can quote (100 now).
4. Verify in the harness: `w.ChainsBadges.compute(await w.ChainsRounds.loadGroup(), 'will', null).badges.find(b => b.id === '<id>')`.
5. CHALLENGES.md if the ladder changes the design; AGENT_LOG always.
