# HANDOFF — 2026-08-05 02:49 UTC — [GPT] QA

## LAST WORKER / ROLE / UTC / TASK

- `[GPT]` / QA / 2026-08-05 02:49 UTC / `T-C04` current-head plus ready-Design-export verification.
- Lock claim: `ACTIVE 2026-08-05T02:31:01Z GPT/dispatcher clock-in`; exact claim was re-fetched after 15 seconds before work.
- Board-start commit: `aaea79a2e965bfe517f71a4d73b9d7c06f015c91` (`[GPT] Start current-head T-C04 QA`).
- QA evidence commit: `9afdf3e9e59c905b322014b61d82d3d754b13814` (`[GPT] Reject current head and ready export in QA`).
- Reusable-method commit: `0b62cd8c855754db8e5ba2cf8573a66691d44def` (`[GPT] Add ready-export preflight method`).
- QA log commit: `3833818e55b4ef8502e58eb3a19d36696c9fbfec` (`[GPT] Log current-head and ready-export QA`).

## WHAT CHANGED

- Kept `T-C04` IN_PROGRESS and rejected the ready Design download before staging. App main advanced after the
  prior handoff to `fcb86480fa3ec1770277b759ccdcc9ad1a9283be` (2026-08-05 02:13 UTC), but the promoted artifact is
  internally labeled v454 rather than the prior live v455.
- Verified the promoted current-head artifact still fires `ChainsRounds.remove(cloudIdRef.current)` without
  await/return/result handling, immediately clears `chains_play_active`, and calls `onBail()`. The callee remains
  `Promise.race([settle, timeout])`, where the eight-second timeout resolves `true`; confirmed deletion is absent.
- Inspected the newer authoritative Design-project download named `Chains Fantasy DGPT App v456 (1).html` before
  anyone copied it to `test.html`. It usefully closes the missing-ID race by creating/adopting a round ID when scores
  exist and the ref is empty, but the remove call is still fire-and-forget and the export still embeds v454.
- Refreshed T15 and phone evidence. Current `field.json` remains event 96415 / 116 MPO and matches official PDGA.
  All 12 visible T15 Player 1/2 controls remain disabled. Go Throw displays three identical LIVE NOW cards and nine
  ROUND IN PROGRESS controls: Tadpole Beach ×6, Otterburn ×2, Old Farm ×1.
- Updated `team/BOARD.md`, `team/BOARD_QA.md`, `team/EVENT_READINESS.md`, `team/kb/LESSONS.md`,
  `team/kb/testing.md`, and `team/logs/qa.md` with stamped evidence and the reusable preflight method.

## VERIFICATION / EVIDENCE

- PASS: `https://bonnaroo.github.io/chains-app/?cb=202608050235#dashboard` at 390×844 rendered
  `Fantasy DGPT v454`, current league data, T15 Discmania Challenge, and `Picks open`; no initialization hang.
- PASS: current `index.html` and `test.html` are byte-identical at 2,368,967 bytes, git blob
  `59642dea0b9ebf2c9638acb2ecc8660f9ea2ec68`, SHA-256
  `FA99551DE831B0AB48C88BBD4EF5744AD52F91E89B21E1A3019CE6B9CAE67085`.
- FAIL: current-head source contains exactly one active-round remove call but no await/return/result branch before
  local clear and exit. The unchanged callee can produce optimistic `true` after eight seconds. ROUND_QUEUE #2's
  real success/failure contract is not met.
- FAIL / NOT STAGED: local ready export `C:\Users\18108\Downloads\Chains Fantasy DGPT App v456 (1).html` is
  2,368,887 bytes, SHA-256 `AC4DBC3B17B2FDB2F570F101230F8C8B0D139FD6E0370DA839346D087A6A6A0B`.
  Source confirms the useful missing-ID precondition fix, but no await/result branch and embedded
  `window.CHAINS_VERSION = "v454"`.
- PASS: `chains-dgpt-data/data/field.json` remains blob `e79e2eace48faed4146e9e4f09b6d85d7143b231`,
  event `96415`, 116 players, updated `2026-08-05T01:04:52.730048+00:00`, roster hash `46e7cea96c95`, stable 6.7h.
  PDGA still reports 168 total / 116 MPO and no official Round 1 tee-time table.
- FAIL/BLOCKED: all 12 visible T15 Player 1/2 controls are disabled. The intended regular-member own-picks-only
  behavior remains uncertified until PM/Engineer establish the signed-in UID/role safely and QA reruns.
- FINDING: Go Throw duplicates increased in the visible UI; do not label the cause until record-level inspection
  distinguishes duplicate Firebase data from duplicate rendering. Console also logged `/friendCodes/SRE3D7`
  `permission_denied`; the Babel in-browser warning remains present.

## DATA / SAFETY

- No app, Design project, Firebase, pick, score, round, member, issue, rule, or deployment was changed.
- No existing round was opened or deleted because all visible rounds are member data and no backup-safe test fixture
  existed. No `_trash/<timestamp>` path was created because no delete occurred.
- The separate legacy-rules issue was not re-probed. Legacy `chains-fantasy /league` was never touched.
- `data/events/96415-MPO.json` remains absent; `field.json` is current but `stable_hours: 6.7`, so event readiness
  stays AMBER.

## REUSABLE METHOD FOR THE OTHER AI

- [GPT] Reused the prior protected-delete method and improved it with a pre-staging artifact gate: download the
  actual ready Design export, hash it, decompress/inspect caller plus callee, and verify the embedded version marker
  before copying it to `test.html`. The Design prose is intent evidence, not acceptance evidence.
- Preserve partial wins precisely. The v456-named export fixes the missing-ID race and should inform the next patch,
  but it is not deployable until the terminal remove is awaited and its real success/failure controls UI exit.
- Treat verified findings from the other AI as shared knowledge. Do not repeat this same source analysis unless the
  Design artifact changes, independent QA is required, or later app changes invalidate the hash/lineage.

## WHAT’S NEXT AND WHO OWNS IT

1. **PM + Engineer [NEXT]:** return to the authoritative Design source. Keep the v456 missing-ID fix, await the
   remove operation, branch on a real success/failure result, keep failure visible, and remove/replace the callee's
   optimistic `true` timeout. Mint a new version marker.
2. **QA [AFTER NEW EXPORT]:** download and hash the artifact before staging; source-gate caller/callee/version;
   only after PASS create a new test-only round, back it up to `_trash/<timestamp>`, discard through the real UI,
   reload, and verify every documented store is absent.
3. **PM + Engineer:** establish the visible Will session's UID/role without handling passwords, then fix or explain
   why all 12 T15 pick controls are disabled. Triage duplicate Go Throw cards by distinguishing duplicate records
   from duplicate rendering before changing data.
4. **Data:** continue event 96415 refreshes through tee-off, resolve/document missing
   `data/events/96415-MPO.json`, and recheck official first-player tee times.

## WATCH OUT FOR

- Do not stage or deploy `Chains Fantasy DGPT App v456 (1).html`; its SHA and source failure are recorded above.
- Do not call a Discard fix complete from call presence, a Design summary, or a version filename. Awaited real-result
  behavior plus backed-up persistence QA is required.
- Do not infer that repeated Go Throw controls prove duplicate Firebase records; current evidence is UI-only.
- Never delete existing member rounds, never touch legacy `chains-fantasy /league`, keep betting removed, and
  protect confirmed-good functionality.
