# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] ChatGPT/Codex | CEO | 2026-07-26 20:00 UTC | T-009 Ledgestone backend-feed repair**

## WHAT CHANGED
- [GPT] Reused the 18:58 [GPT] collector diagnosis instead of repeating the visible-app audit. The scheduled
  19:52 UTC job reproduced the null/empty field, confirming the defect was active.
- [GPT] Committed an additive data-only repair to `Bonnaroo/chains-dgpt-data` as
  `4cb6a21ba221d77e9a1bf8590c5add72a34ca7dc`: `collect_field.py` now includes `("T14", 96414)`, and
  `events.txt` now covers 96411, 96412, 96413, and 96414.
- [GPT] Manually started existing `Collect DGPT Data` workflow run 30217973885 (#521). It regenerated the
  active field and the Ledgestone event artifact; no Design build, App A deploy, or Firebase write was needed.
- [GPT] Advanced T-009 and T-014 notes, changed EVENT_READINESS from RED to AMBER, informed Guillermo in
  TO_OWNER, and added named-roster-versus-placeholder reconciliation to LESSONS and kb/testing.md.

## VERIFICATION / EVIDENCE
- Local `python -m py_compile collect_field.py` passed before upload.
- Workflow run `https://github.com/Bonnaroo/chains-dgpt-data/actions/runs/30217973885` completed Success in 39s
  against commit `4cb6a21ba221d77e9a1bf8590c5add72a34ca7dc`.
- Generated commit `03b17dc284b9c61c8601033daac67f0ad7581a32` published `data/field.json` at
  `2026-07-26T19:58:54.471332+00:00` with `event_tag: T14`, `event_id: 96414`, `player_count: 154`.
- `data/events/96414-MPO.json` now exists with `event_id: 96414`, event name `DGPT+ Ledgestone Open`, 156 slots,
  and collection time `2026-07-26T19:58:42.352067+00:00`.
- Primary PDGA page `https://www.pdga.com/tour/event/96414` still shows MPO (156): 154 named/PDGA-numbered players
  plus two `Sunday Qualifier` placeholders. Set comparison between the field feed and event artifact = 154/154,
  zero missing IDs, zero extra IDs.
- `chains-app` main remains v405 commit `1f22274e4ad9b9746c08be058d69d1ca655c40ab`; open Issues = none.

## DATA / SAFETY
Changed only two version-controlled collector inputs in `chains-dgpt-data`: `collect_field.py` and `events.txt`.
The workflow regenerated public JSON artifacts from PDGA. No Firebase, league, picks, standings, rounds, accounts,
or user data changed; no deletion or backup was needed. Legacy `chains-fantasy /league` was not accessed. App A,
betting removal, Watch, Settings, starter-league pin, and Kadey-first/Cory-last order were untouched.

## REUSABLE METHOD FOR THE OTHER AI
[GPT] improved the prior three-layer method: compare PDGA-number sets, not raw registration totals. A field can
have 156 slots while the safe draftable feed correctly has 154 named players because two slots are non-draftable
`Sunday Qualifier` placeholders. Verify collector coverage -> generated artifact -> named ID-set equality -> UI.
Claude should reuse this exact distinction and should not re-add qualifier placeholders to the draftable pool.

## WHAT'S NEXT AND WHO OWNS IT
- [QA] Independently verify the live app consumes the fresh T14/96414 feed rather than its bundled fallback;
  compare all 154 named players, confirm how the two qualifier slots display, and record observable evidence.
- [QA] Confirm picks are open, a member can draft only their own players, the Draft Now path is discoverable,
  the lock/WD behavior matches the league rule, and order remains Kadey first / Cory last. Then close T-014/T-015.
- [PM] Groom obsolete T-008 wording and split Phase 2A backend migration only after the event-readiness QA gate.

## WATCH OUT FOR
- Do not treat raw count 154 versus 156 as a regression: the two excluded records are duplicate Sunday Qualifier
  placeholders with no PDGA number and must not become draftable players.
- Workflow #521 has one non-blocking GitHub warning: checkout/setup-python target Node 20 and are forced to Node 24.
- The GitHub connector still reads but cannot write contents (403); Codex Chrome upload remains the verified path.
- Do not hand-edit `chains-app/index.html`; do not touch legacy `chains-fantasy /league`.
