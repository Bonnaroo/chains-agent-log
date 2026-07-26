# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] ChatGPT/Codex | CEO | 2026-07-26 18:58 UTC | T-009 Ledgestone background-feed audit**

## WHAT CHANGED
- [GPT] Found a launch-relevant background wiring failure that v405's bundled fallback was masking.
  `Bonnaroo/chains-dgpt-data/data/field.json` was freshly generated at `2026-07-26T18:41:51.027994+00:00` but
  contains `event_id: null`, `players: []`, and `note: "No upcoming event found."`
- [GPT] Traced the cause to `collect_field.py`: its `EVENT_IDS` array ends at `("T13", 96413)` and therefore
  cannot select Ledgestone T14/96414. The scheduled `.github/workflows/collect.yml` does run the collector every
  15 minutes; the schedule is green-looking but deterministically publishes an empty field.
- [GPT] Found related stale event coverage: root `events.txt` ends at 96410 and
  `data/events/96414-MPO.json` returns 404. The prior T13 file exists, but Ledgestone event data is absent.
- [GPT] Updated EVENT_READINESS and BOARD evidence so T-009 stays red and T-014 is not closed as background-ready.
  Routed the exact repair to PM -> Engineer without changing app/data code under the CEO role.
- [GPT] Added the dynamic-feed validation method to kb/testing.md and kb/LESSONS.md and informed Guillermo in
  TO_OWNER.md because this is a material event-readiness risk.

## VERIFICATION / EVIDENCE
- Primary PDGA event page `https://www.pdga.com/tour/event/96414` showed DGPT+ Ledgestone Open, Jul 30-Aug 2,
  Peoria IL, and MPO registration `(156)` at the 2026-07-26 18:58 UTC check.
- `chains-dgpt-data` main commit `e2d57088cab8cce03c44c358a4e86d73d0e47e01` refreshed `data/field.json`
  at 18:41:51Z, proving the workflow ran recently; the payload was still null/empty.
- `.github/workflows/collect.yml` schedule is `*/15 * * * *` and runs `python collect_field.py`.
- `chains-app` main remains v405 deploy commit `1f22274e4ad9b9746c08be058d69d1ca655c40ab` from 16:46:13Z.
- Open issues search for `Bonnaroo/chains-app` returned none.
- [GPT] Office evidence landed in commits `7b3f84719d779f34b147f07ed192d7ef0859c510` (BOARD,
  EVENT_READINESS, HANDOFF, TO_OWNER), `b1e15ab0c78d652ade0cbe6b9dd7c4c5c6fd2ee1` (CEO log), and
  `d4ef8e26ed345731ada4a1eec4e06598188a21f5` (LESSONS/testing playbook); each file was re-read via GitHub.

## DATA / SAFETY
No app, Firebase, league, pick, standings, round, registration, or user data changed. No Design build or live
deploy occurred. Legacy `chains-fantasy /league` was not accessed. The confirmed-good draft order (Kadey first,
Cory last), betting removal, Watch screen, Settings, and starter-league pin were not touched.

## REUSABLE METHOD FOR THE OTHER AI
[GPT] improved the prior UI-only readiness method: a correct-looking fallback is not proof of a healthy dynamic
feed. For each event, inspect `data/field.json` for a fresh `updated_at`, exact `event_id`, expected
`player_count`, and non-empty `players`; confirm the event ID exists in `collect_field.py` and `events.txt`; then
verify the live UI consumes the feed. Claude should reuse this three-layer check (collector -> artifact -> UI)
before marking event background wiring green.

## WHAT'S NEXT AND WHO OWNS IT
- [PM] Create/assign one high-priority Engineer repair under T-009: add T14/96414 to `collect_field.py`, bring
  `events.txt` through the active event, and define rollback/verification without touching App A or Firebase.
- [Engineer] After assignment, patch only `Bonnaroo/chains-dgpt-data`; run or await `Collect DGPT Data`; verify
  `data/field.json` says `event_id: 96414` with 156 MPO players and that `data/events/96414-MPO.json` exists.
- [QA] Independently compare the repaired feed/live Registered list to PDGA 96414 one-for-one, confirm member
  picks are open/own-only and discoverable, and confirm Kadey-first/Cory-last before closing T-014/T-015.

## WATCH OUT FOR
- v405's expiring 156-slot bundled fallback keeps the screen usable and can hide a dead feed; do not call this
  green from the visible count alone.
- The collector filters any name containing `Qualifier`; reconcile the two Sunday-Qualifier TBD slots explicitly
  when comparing the 156-slot PDGA field with named feed entries.
- GitHub connector reads work but contents writes still return 403; Chrome upload is the verified office-write path.
- Do not hand-edit `chains-app/index.html`; do not touch legacy `chains-fantasy /league`.
