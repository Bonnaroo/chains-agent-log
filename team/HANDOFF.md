# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] ChatGPT/Codex | CEO | 2026-07-27 00:28 UTC | T-009 Ledgestone readiness deadline audit**

## WHAT CHANGED
- [GPT] Corrected team/EVENT_READINESS.md from contradictory "GREEN except member-permission check" wording to
  AMBER because T-016 (member own-only drafting / Draft Now) and T-017 (first-tee lock / WD / automatic
  registration-close -> draft-open) remain unverified.
- [GPT] Added a T-017 guardrail to team/BOARD.md, team/kb/LESSONS.md, and team/kb/testing.md: use the earliest
  official player tee time; never use a broadcast start as the pick-lock deadline.
- [GPT] Updated team/TO_OWNER.md and appended team/logs/ceo.md. No new task, repo, project, roadmap, or coordination
  file was created.

## VERIFICATION / EVIDENCE
- [GPT] Office commits: `61b4bf4d288e78946599133798216a7e15c65a96` updated BOARD,
  EVENT_READINESS, TO_OWNER, and the first cold handoff; `cff025a1914bab67e1c9fd13ba097115ebb4645d`
  updated LESSONS/testing; `72fa6af62c223692a6ba2567cfd59f79920bcf11` appended the CEO log.
  Each target was re-fetched through the contents API and matched the expected stamped text.
- [GPT] Reused [CLAUDE]'s independent 2026-07-26 23:55 QA proof for v406 live-feed consumption, 154 named
  draftable players, qualifier exclusion, picks-open, and confirmed-good Kadey-first/Cory-last order; did not
  repeat the auto-saving member draft path.
- [GPT] GitHub: chains-app main HEAD `b3be8101789fc6f67fb4fff828973016a714117a` removes miscased
  `Index.html`; lowercase v406 deployment is commit `30a2201ba124c064d84d355e3482be783f2f90f3`.
  Open chains-app issues = 0.
- [GPT] Live https://bonnaroo.github.io/chains-app loaded at `#dashboard`, title
  `Chains · Fantasy DGPT 2026`, with Ledgestone `PICKS OPEN`.
- [GPT] Data artifacts: `data/field.json` blob
  `ecc27a039512b43a1c4fd8ab0f251a0ca0f202e2` = event 96414, 154 players, updated
  2026-07-26T23:54:03.260167Z; `data/events/96414-MPO.json` blob
  `cb8c2ba4df5e0a80c7d95aa1560949d989be5752` = 156 slots, collected
  2026-07-26T23:53:51.918336Z.
- [GPT] Primary PDGA https://www.pdga.com/tour/event/96414 lists Jul 30-Aug 2, 156 MPO registrations, last
  updated Jul 25 19:20 CDT, and currently no Tee Time table/column. DGPT
  https://www.dgpt.com/event/2026-ledgestone-open/ labels 3:00 PM CDT as the MPO Round 1 LIVE broadcast,
  so it is not valid first-tee evidence.

## DATA / SAFETY
- [GPT] No app build, Claude Design version, Firebase node, picks, scores, rounds, users, or legacy
  `chains-fantasy /league` data changed. No deletion and therefore no backup path. Betting remains removed.
  Protected Kadey-first/Cory-last draft order and the live v406 lowercase `index.html`.

## REUSABLE METHOD FOR THE OTHER AI
- [GPT] Improved the shared readiness method: before approving a pick lock, compare the intended deadline with
  the official PDGA player tee-time table. Treat DGPT broadcast schedules as media times only. If PDGA has not
  posted tee times, keep the gate amber and recheck; never guess.

## WHAT'S NEXT AND WHO OWNS IT
- [Designer -> Engineer] Start T-016 now: spec and build member own-only picks plus a discoverable Draft Now,
  while retaining commissioner correction authority and leaving draft-order logic untouched.
- [Engineer] Implement T-017 with the earliest official player tee time once PDGA publishes it; include WD
  exclusion and automatic registration-close -> draft-open. Recheck PDGA 96414 before setting the deadline.
- [QA] Independently verify T-016/T-017 live without selecting a player or changing scores on the starter league.
- [CEO] Keep T-009 AMBER/IN_PROGRESS until both tasks pass; recheck the official tee-time table on the next shift.

## WATCH OUT FOR
- [GPT] "Edit picks" auto-saves; live QA must not select players or alter scores.
- [GPT] Do not use DGPT's 3:00 PM CDT broadcast start as first tee. Official player tee time is still unpublished.
- [GPT] Draft order is CONFIRMED GOOD: Kadey first, Cory last. Do not touch it.
- [GPT] Pages filenames are case-sensitive; only lowercase `index.html` is served. [GPT] reused [CLAUDE]'s
  verified casing lesson; no deploy occurred this shift.
