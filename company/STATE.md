# Chains — CURRENT STATE

_Updated 2026-08-05 by Cowork BACKEND TRACK run — live version, 8 regression markers, and #43 re-verified
directly against committed HEAD + CDN (decompress-and-search on the live gzip/base64 blob, not local memory)._

**Everyone reads this first — Cowork, Design, Engineer, Watcher, the owner.**
It exists so nobody works from a stale memory of the app.

## The app

- **Live version: `v460`** (2,373,523 bytes) — verified 2026-08-05: `raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html`
  (CDN) is byte-identical (md5 `83724f2cd1bac3e671c920bdc1aa9c68`) to the committed HEAD fetched via the
  Contents API (sha `9f3fe7d77568588bc7f4b11a940bf423141afcad`). CDN is not lagging right now.
- Any new build MUST be numbered higher than `v460`.
- Fixes/regression markers confirmed present in the live build (all 8 standing markers, decompress-and-search):
  - OK function authUid()
  - OK function _indexWrite(
  - OK Teemu Paakinen
  - OK label: "In the Bag"
  - OK window.AuthGate
  - OK ANONYMOUS SESSIONS NO LONGER GRANT ACCESS
  - OK window.ChainsImpact
  - OK window.ChainsAssets

> If a marker shows missing that you believe shipped, it was clobbered — see
> `company/playbooks/never-clobber-a-deploy.md` before deploying anything.

## #43 — deleted round comes back

**CLOSED, re-verified 2026-08-05 against v460 (previously verified against v456).** Decompiled source confirms
unchanged since the original fix: `_indexWrite` returns a real `true`/`false` (no swallowed errors);
`ChainsRounds.remove()` builds a `jobs[]` array (index write, playRounds+liveRounds update, legacy REST
delete — the legacy store's result now counts toward `ok`) and does
`Promise.all(jobs).then(rs => rs.every(x => x !== false))`, calling `_failOnce(...)` on any partial failure
instead of reporting silent success. No regression across the v457-v460 builds that shipped since.

## Since STATE.md was last accurate (was stale at v456; jumped straight to v460 this run)

Per the Design project chat transcript (read this run, no build performed by Cowork -- UI is Design's):
- **v457** -- ROUND_QUEUE #7: in-progress round now resumable directly from the dashboard (Resume/Discard card),
  instead of forcing a detour through Live Now. Reused existing onResumeId/resumeFromCloud/remove() paths;
  no new Firebase reads/writes.
- **v458** -- ROUND_QUEUE #10: version tag (window.CHAINS_VERSION) now shown on the mobile header, matching
  the existing desktop sidebar tag. No backend change.
- **v459** -- ROUND_QUEUE #11: in-app "Report a Bug" -- a "?" icon (mobile header + desktop sidebar) opens a modal
  that writes to /bugReports/{uid}/{id}. Uses existing auth != null Firebase rule coverage, no new rule
  needed. No listener/webhook wired yet -- owner reviews entries manually.
- **v460** -- ROUND_QUEUE #18: "Registered field" promoted from a buried Picks sub-tab to a sub-tab under the
  Course/Live Chains primary tab, reusing PlayersView/reviving the previously-dead PlayersHub component
  instead of duplicating it. No backend/Firebase change (field.json is a static bundled/cached asset, not
  Firebase). stable_hours does not exist in live field.json -- Design correctly declined to guess/invent it
  and flagged it for the owner instead of rendering something wrong.
- All four builds verified live and byte-identical to committed HEAD as of this run (see version block above).

## Season

_Not re-verified this run -- carried over from the prior STATE.md; re-check field.json/live poller before trusting._
- Scored events: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14
- Next event: T15 Discmania Challenge (2026-08-07 -> 2026-08-09, id 96415)
- Live poller is on: Discmania Challenge (id 96415)

## Registered field (can people draft?)

_Not re-fetched this run -- carried over from the prior STATE.md; field.json should be re-checked next run._
- 111 players loaded for T15 as of last check
- field.json updated: 2026-08-03T21:20:43.370045+00:00

## Work

_Issue list not re-fetched this run (no Issues API call made) -- treat counts below as stale pending a fresh pull._
- #43 is CLOSED (see above); #7, #10, #11, #18 appear shipped per the Design transcript (v457-v460) -- issue
  tracker itself was not reconciled/closed this run, that's a follow-up (check whether these still show as open
  boxes in company/ROUND_QUEUE.md / GitHub Issues and close them if the shipped work matches).
- Known still-open items from before this run: #5, #6, #32, #34, #40 [needs-owner-decision], #41, #42.
- playRounds/{id} write-scope gap still [needs-owner-decision], untouched.
- kyle's real test-account email still unresolved (blocks negative-test Firebase rules item).

## Who owns what

| | Design | Cowork (backend) |
|---|---|---|
| Owns | screens, flows, components, copy -- anything a user sees or taps | Firebase nodes, rules, accounts, data scripts, Actions, deploys |

Full workflow: `company/DESIGN_LOOP.md`. Never interrupt Design mid-build.
Never deploy without the 3-level verification in `company/playbooks/production-verification.md`.
