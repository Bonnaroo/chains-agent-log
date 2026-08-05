# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

**Last verified:** 2026-08-05 00:36 UTC by [GPT]

## ACTIVE EVENT: T15 Discmania Challenge — August 7–9, 2026 — Indianola, Iowa

Primary-source facts:

- PDGA event `96415` lists 168 total players and 116 MPO players, last updated `04-Aug-2026 11:53:02 CDT`.
- DGPT lists August 7–9 at Pickard Park and a projected MPO Round 1 broadcast at 3:00 PM CDT. That is a broadcast time, not proof of the first player tee time or the league pick-lock deadline.

### A. Live app / draft

- [x] Cache-busted live app loads to Dashboard as `Fantasy DGPT v454` at https://bonnaroo.github.io/chains-app/?cb=202608050032#dashboard.
- [x] Dashboard identifies `Discmania Challenge`, Indianola, IA, August 7–9, and shows `Picks open`.
- [ ] Independent QA must verify the live Picks screen uses the current 116-player MPO field and that each regular member can edit only their own two picks.
- [ ] Verify the official first-player tee time before setting or approving a pick-lock timestamp. Do not substitute DGPT's 3:00 PM broadcast time.

### B. Current data feed

- [x] `Bonnaroo/chains-dgpt-data/data/field.json` is T15 / event `96415`, `player_count: 116`, updated `2026-08-04T23:42:38.850720+00:00` (blob `083254df93400aeb595fefa6ce26c7986a1c42a3`).
- [x] The feed count matches PDGA's official 116-player MPO count as of this check.
- [ ] Roster is still moving: `stable_hours: 5.3`. Data lane must continue refreshes and re-check withdrawals/additions through tee-off.
- [ ] `data/events/96415-MPO.json` returned 404. Data lane must either publish the per-event artifact or document that `field.json` intentionally supersedes it; silent absence is not green.

### C. Current build and known round-path risk

- [x] `chains-app` main HEAD is `5e339c23ba89edf2a8e10a784bf89d14acae59a1` (v454, 2026-08-04 23:18 UTC), and production visibly reports v454.
- [x] v453's commit recorded a start-round/add-two-friends/discard pass after replacing 47 native dialogs; v454's commit records pre-round Back/Cancel consistency and sent-invite cancellation with offline/already-gone/already-responded handling.
- [ ] QA must independently repeat the phone-sized round walkthrough on v454 and exercise pre-round Back/Cancel plus sent-invite cancellation. [GPT] did not self-approve another worker's build this shift.

## STATUS

**AMBER.** Live v454 and the T15 feed are aligned on event `96415` and 116 MPO players, but the roster is not yet settled, the per-event JSON artifact is absent, member pick permissions and v454 need independent QA, and the official first-player tee time/pick-lock proof remains open.

## SAFETY

No app, Firebase, picks, rounds, users, league standings, or legacy `chains-fantasy /league` data was changed by this readiness pass.
