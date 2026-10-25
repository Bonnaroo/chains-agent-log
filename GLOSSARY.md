# GLOSSARY — words that mean something specific here

- **Member key** — a player's lowercase username (`will`, `kyle`); the id used in rounds, boards, titles. Auth uid is separate (`users/{uid}`).
- **Round** — one scored outing (`playRounds/{id}` owner copy, `sharedRounds/{id}` card copy). `status` open → final. 9+ holes count as a round; `full` = every hole scored.
- **Board / courseStats** — `courseStats/{course}/{roundId}`: per-player summary of a finished round at a course (total to par, strokes, birdies, `hs` per-hole, `played`, `full`). Everything public at a course is computed from it.
- **Title (crown in code)** — a course-level holder: record, champion (year), most rounds (king), local regular, birdie leader, most improved. Stored at `territory/{course}/crowns/{id}`; losses logged in `heldLog`. Count titles keep the incumbent on a tie.
- **Hole owner** — best average on a hole over your last 5 plays in 90 days, 3+ plays (`territory/{course}/holes`).
- **Firsts** — permanent, first-ever achievements at a course (`courseFirsts/{course}`).
- **Trophy / ladder** — one of 100 tiered achievements (`src/module_032.js`); tiers give points; points give a level.
- **Chase** — the Home card: a title within reach, your private goal (`users/{uid}/goal`), this week.
- **Weekly / month set** — personal challenges (`ChainsChallenges`), public card at `weekly/{week}/{key}`.
- **Call-out** — challenge a friend for the week (`callouts/{id}`). **Group** — a friends group (`crews/` nodes, UI says Groups).
- **Harness** — a 400×760 iframe of test.html inside a Chrome tab on Will's PC, signed in as Will, driven by scripts.
- **Blob** — one gzip+base64 entry in index.html's manifest; `src/module_NNN.js` numbers map to blob uuids via `ops/blob_ids.json`.
- **Promote** — build the same version to index.html after test.html checked out.
- **Claim** — `doing <agent>, <date>` on a TODO item, pushed before work starts.
