# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

**Last verified:** 2026-08-04 22:33 UTC by [GPT]

## ACTIVE EVENT: T15 Discmania Challenge — August 7–9, 2026 — Indianola, Iowa

Primary-source facts:

- PDGA event `96415` lists 168 total players and 116 MPO players, last updated `04-Aug-2026 11:53:02 CDT`.
- DGPT lists August 7–9 at Pickard Park and a projected MPO Round 1 broadcast at 3:00 PM CDT. That is a broadcast time, not proof of the first player tee time or the league pick-lock deadline.

### A. Live app / draft

- [x] Live app loads to Dashboard as `Fantasy DGPT v453` at https://bonnaroo.github.io/chains-app/.
- [x] Dashboard identifies `Discmania Challenge`, Indianola, IA, August 7–9, and shows `Picks open`.
- [ ] Independent QA must verify the live Picks screen uses the current 116-player MPO field and that each regular member can edit only their own two picks.
- [ ] Verify the official first-player tee time before setting or approving a pick-lock timestamp. Do not substitute DGPT's 3:00 PM broadcast time.

### B. Current data feed

- [x] `Bonnaroo/chains-dgpt-data/data/field.json` is T15 / event `96415`, `player_count: 116`, updated `2026-08-04T21:34:09.661860+00:00` (blob `c8c3a8b54e128a93d7d6b74efb55ee09aa10cdfd`).
- [x] The feed count matches PDGA's official 116-player MPO count as of this check.
- [ ] Roster is still moving: `stable_hours: 3.2`. Data lane must continue refreshes and re-check withdrawals/additions through tee-off.
- [ ] `data/events/96415-MPO.json` returned 404. Data lane must either publish the per-event artifact or document that `field.json` intentionally supersedes it; silent absence is not green.

### C. Current build and known round-path risk

- [x] `chains-app` main HEAD is `73d7d057eeecaa32558b24ed5dbd990965b007d0` (v453, 2026-08-04 21:07 UTC).
- [x] The commit's recorded functional evidence says a start-round/add-two-friends/discard path completed without the native-dialog freeze after replacing 47 native alert/confirm/prompt calls with in-app dialogs.
- [ ] QA must independently repeat the phone-sized round walkthrough. [GPT] did not self-approve another worker's functional test this shift.

## STATUS

**AMBER.** The current app and live T15 feed are aligned on event `96415` and 116 MPO players, but the roster is not yet stable, the per-event JSON artifact is absent, member pick permissions still need independent QA, and the official first-player tee time/pick-lock proof remains open.

## SAFETY

No app, Firebase, picks, rounds, users, league standings, or legacy `chains-fantasy /league` data was changed by this readiness pass.
