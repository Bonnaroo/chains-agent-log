# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

**Last verified:** 2026-08-05 02:45 UTC by [GPT]

## ACTIVE EVENT: T15 Discmania Challenge — August 7–9, 2026 — Indianola, Iowa

Primary-source facts:

- PDGA event `96415` lists 168 total players and 116 MPO players, last updated `04-Aug-2026 11:53:02 CDT`.
- DGPT lists August 7–9 at Pickard Park and a projected MPO Round 1 broadcast at 3:00 PM CDT. That is a broadcast time, not proof of the first player tee time or the league pick-lock deadline.

### A. Live app / draft

- [x] Cache-busted live app loads at a 390×844 viewport as `Fantasy DGPT v454` at https://bonnaroo.github.io/chains-app/?cb=202608050235#dashboard.
- [x] Dashboard identifies `Discmania Challenge`, Indianola, IA, August 7–9, and shows `Picks open`.
- [x] Live Registered screen states `116 pros registered · updated Aug 4, 9:04 PM`, matching current `field.json` and PDGA.
- [ ] Regular-member own-picks-only check FAILS in the visible Will session: all 12 T15 Player 1/2 buttons were disabled and exposed `Only the commissioner can edit picks and scores`. This may be an auth/role mismatch or a real permission regression; PM/Engineer must establish the signed-in UID/role without handling passwords, then QA must re-run before GREEN.
- [ ] Verify the official first-player tee time before setting or approving a pick-lock timestamp. Do not substitute DGPT's 3:00 PM broadcast time.

### B. Current data feed

- [x] `Bonnaroo/chains-dgpt-data/data/field.json` is T15 / event `96415`, `player_count: 116`, updated `2026-08-05T01:04:52.730048+00:00` (blob `e79e2eace48faed4146e9e4f09b6d85d7143b231`, roster hash `46e7cea96c95`).
- [x] The feed count matches PDGA's official 116-player MPO count as of this check.
- [ ] Roster is still moving: `stable_hours: 6.7`. Data lane must continue refreshes and re-check withdrawals/additions through tee-off.
- [ ] `data/events/96415-MPO.json` returned 404. Data lane must either publish the per-event artifact or document that `field.json` intentionally supersedes it; silent absence is not green.

### C. Current build and known round-path risk

- [x] `chains-app` main HEAD is `fcb86480fa3ec1770277b759ccdcc9ad1a9283be` (internally labeled v454, 2026-08-05 02:13 UTC), and production visibly reports v454. `index.html` and `test.html` are byte-identical at blob `59642dea0b9ebf2c9638acb2ecc8660f9ea2ec68` / SHA-256 `FA99551DE831B0AB48C88BBD4EF5744AD52F91E89B21E1A3019CE6B9CAE67085`.
- [ ] Current-head discard verification FAILS source acceptance: its active-round handler calls `ChainsRounds.remove(cloudIdRef.current)` without await/return/result handling, immediately clears local state, and exits. `ChainsRounds.remove` itself can return `true` from an 8-second timeout before `settle` completes. This does not satisfy ROUND_QUEUE #2's real success/failure requirement and can still hide a failed cloud delete behind a successful-looking exit.
- [ ] The ready Design download named v456 was inspected before staging. It closes the missing-ID race by creating/adopting a round ID before remove, but still does not await or branch on the delete result and still embeds the v454 label. SHA-256 `AC4DBC3B17B2FDB2F570F101230F8C8B0D139FD6E0370DA839346D087A6A6A0B`; QA rejected it before staging/deployment.
- [ ] QA must independently complete the destructive round walkthrough only with a newly created, backup-safe test record. This shift did not delete a round because the visible app contained existing member records and no `_trash/<timestamp>` backup had been made.
- [ ] Phone-sized Go Throw showed three identical LIVE NOW cards and nine ROUND IN PROGRESS controls (Tadpole Beach ×6, Otterburn ×2, Old Farm ×1). PM/Engineer must determine whether these are duplicate records or duplicate rendering before QA mutates anything.

## STATUS

**AMBER.** Live v454 and the T15 feed are aligned on event `96415` and 116 MPO players, but both the promoted current head and ready v456-named export fail the await/result contract, the visible Will session cannot edit its own T15 picks, duplicate open-round cards need triage, the roster is not yet settled, the per-event JSON artifact is absent, and the official first-player tee time/pick-lock proof remains open.

## SAFETY

No app, Firebase, picks, rounds, users, league standings, or legacy `chains-fantasy /league` data was changed by this readiness pass.
