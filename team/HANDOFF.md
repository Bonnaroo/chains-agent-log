# HANDOFF — 2026-08-10 20:10 UTC — [GPT] CEO

## LAST WORKER / ROLE / UTC / TASK

- `[GPT]` / CEO / 2026-08-10 20:10 UTC / replace expired T15 state with current T16 readiness, file release-integrity issue #10, and route nine open app issues.
- Lock claim: `ACTIVE 2026-08-10T19:53:05Z GPT/dispatcher clock-in`; exact claim was re-fetched after 15 seconds.
- Lock commit: `ba42b3d2e86a9e9794ac297591d76c1ef7d900b4`.
- Board commit: `8d2fd37aabe0e8fc379a5abaaf2dc6c895de4c3c`.
- Event-readiness commit: `4220dcc44e8f888011192e25d2a7e3269c4c8c4b`.
- Owner-alert commit: `0d6a4c6e311f252949ad63cfa7d87ba7aaa39a14`.
- CEO-log commit: `f864031f68994bbc928c133a54299dc664a0a07e`.
- Deploy-playbook commit: `ba69a8b6afa80b01ac97d659ef398b9cceaedfaa`.
- Lessons commit: `e4b64f4693d8e7278ce4262bb4c641d63debb8f7`.

## WHAT CHANGED

- [GPT] filed `Bonnaroo/chains-app` issue #10:
  https://github.com/Bonnaroo/chains-app/issues/10. Main HEAD
  `7c1f1125f1a24bdec94de43f6443d3c9cf286b28` is titled v475, but cache-busted production explicitly renders
  `FANTASY DGPT V469`. Current main blobs also diverge: `index.html`
  `25942ab735ba54b02feb4a4d04f88c0f1388631c` vs `test.html`
  `b72986887d300a341f86d4e499341563df1aad21`.
- Added provenance to #10 from office commit `94e89207e7020fa532388d84016b8dc3d43c9536`: its engineer log records v474
  as a byte-swapped rebuild of deployed v473 when Design did not produce a compiled export. v475 then changed only
  `index.html` by +2/-2. Current protocol forbids another deployed-file repair; recovery must start from the
  existing authoritative Claude Design project.
- Replaced stale T15 readiness with T16 DGPT Doubles Championship at The Preserve. BOARD T-C08 owns the empty field
  recovery, T-C09 owns release lineage, and T-C10 routes the nine-open-issue launch queue.
- Moved `EVENT_READINESS.md` to RED. Official PDGA event `96416` is Aug 14–16 in Clearwater with 156 total /
  112 MPO, but current `chains-dgpt-data/data/field.json` identifies no event and contains zero players.
- Updated `TO_OWNER.md`: outside testers remain blocked by cleanup-backed security/account issues #1, #3, #4, #5,
  and #9. Owner action is current rules/data-scope backups plus an Emulator/non-production allow-deny and rollback
  path; no credential exchange is requested.
- Added the reusable immutable-provenance method to `kb/deploy.md` and `kb/LESSONS.md`.

## VERIFICATION / EVIDENCE

- PASS: cache-busted https://bonnaroo.github.io/chains-app/?cb=202608101958#dashboard loaded current league
  standings, Preserve Championship Aug 14–16, and `PICKS OPEN`; the explicit visible version is v469.
- PASS: app main HEAD is `7c1f1125f1a24bdec94de43f6443d3c9cf286b28`; its commit page shows one changed file
  (`index.html`, +2/-2) and 3/3 green checks.
- FAIL: main/live release identity. The v475 title, visible v469 marker, and unequal index/test blobs cannot all
  describe one promoted immutable Design artifact. Issue #10 contains the exact close evidence.
- PASS: PDGA https://www.pdga.com/tour/event/96416 listed 156 total / 112 MPO, updated
  `10-Aug-2026 07:02:02 CDT`. DGPT
  https://www.dgpt.com/event/2026-dgpt-doubles-championship-at-the-preserve/ confirms two best-shot rounds plus
  alternate-shot round three.
- FAIL: `chains-dgpt-data/data/field.json` blob `c1d121ae8a676dee42d6e4c92f3a38cf16bf463f`, updated
  `2026-08-10T19:14:24.067382+00:00`, has null event IDs, note `No upcoming event found.`, and zero players.
- PASS: connector re-fetch verified BOARD blob `0280f91c6665d2c214b93f08e37079100436e80e`, EVENT_READINESS blob
  `bb4fbd7e1db17fdbb3ef9a40f3cb6e1dcc0b2b5a`, TO_OWNER blob `5981c11a4c6bab8b505f4b35e44bc102b52e90bc`,
  and CEO log blob `faeb6c8d92ee9089f0dbf97e622d8c11ef2c36ae`.

## DATA / SAFETY

- [GPT] changed `chains-app` issue #10 and shared-office Markdown only.
- No app source, Design project, Firebase node/rule, user, pick, score, round, workflow, deployment, deletion,
  backup, or legacy `chains-fantasy /league` data changed.
- [GPT] did not repeat any live security write behind issues #1/#3/#4/#5/#9. Their cleanup-backed evidence remains
  shared memory until a relevant rules/build change requires owner-authorized non-production regression.
- No `_trash/<timestamp>` backup was created because no Firebase mutation or deletion occurred.
- Betting remains removed; no deployed-file-only patch was made.

## REUSABLE METHOD FOR THE OTHER AI

- [GPT] reused the shared exact-build-identity method and [CLAUDE]'s/no-reprobe shared security findings instead of
  rediscovering them. Prior verified findings were treated as memory; only state made stale by later commits was
  re-checked.
- [GPT] improved release acceptance: inspect the claimed deploy commit's changed-file scope and its parent
  provenance in addition to version text and hashes. Reject a deployed-bundle descendant even if its commit title
  and checks are green. Require one authoritative Design export, export hash, stage blob/hash, live blob/hash,
  explicit version marker, main SHA, and cache-busted production observation.
- The repeatable method is recorded in `kb/deploy.md` commit `ba69a8b6afa80b01ac97d659ef398b9cceaedfaa`
  and `kb/LESSONS.md` commit `e4b64f4693d8e7278ce4262bb4c641d63debb8f7`.

## WHAT'S NEXT AND WHO OWNS IT

1. **Data + QA — T-C08 (CRITICAL):** repair current-event discovery for PDGA `96416`, publish the current MPO
   roster with exact blob/hash/count/timestamp, document doubles-team mapping, and independently compare to PDGA.
2. **Engineer + independent QA — T-C09 / issue #10:** recover from the existing authoritative Design project,
   stage the exact export, and prove Design/stage/main/live identity. Do not patch or byte-swap `index.html`.
3. **Owner + Security — T-C10 security slice:** date-back-up current rules/approved scopes and authorize
   Emulator/non-production allow-deny plus rollback for #1/#3/#4/#5/#9 before outside testers.
4. **PM + Engineer + QA — T-C10 functional slice:** independently verify #6 on the exact deployed build; fix and
   verify #7 dashboard membership and #8 2/2 sign-out hook crash in the authoritative source.
5. **QA:** after the feed and lineage gates pass, verify live Registered/Picks, regular-member own-picks-only,
   commissioner behavior, and official first-player pick-lock proof before moving readiness from RED.

## WATCH OUT FOR

- The dashboard's `PICKS OPEN` label does not make a zero-player/no-event backend artifact launch-ready.
- The event is doubles. Do not silently map a PDGA team row as an ordinary singles event.
- A `Deploy vNNN` title or green checks are not proof of an authoritative Design build; v474/v475 provenance is
  specifically suspect and issue #10 is the shared record.
- Do not close issue #6 from its v469 commit message alone; independent QA must verify the exact deployed version.
- Do not repeat live security probes or deploy rules without dated backups, offline/Emulator matrices, rollback,
  and owner-controlled authorization.
- Never touch legacy `chains-fantasy /league`; keep betting removed and protect confirmed-good behavior.
