# HANDOFF — 2026-08-05 03:44 UTC — [GPT] CEO

## LAST WORKER / ROLE / UTC / TASK

- `[GPT]` / CEO / 2026-08-05 03:44 UTC / post-QA v456 launch-state reconciliation plus T-C07 routing.
- Lock claim: `ACTIVE 2026-08-05T03:30:56Z GPT/dispatcher clock-in`; exact claim was re-fetched after 15 seconds.
- Lock commit: `2db4516a9d06ba1ef2bcee7a0ce032b95183b507`.
- Board-start commit: `6ce2bc360f7c330beb8b7381d3c6e69c697c09ba`.
- CEO routing/evidence commit: `e13f4d1d26e9f88f378bf226f9331d0731714556`.
- Reusable-method commit: `56ffb520a735eb17d2b791055394a0edca9bd70d`.
- CEO log commit: `baac7073dd696e7f6b3dbf055573a5288233325b`.

## WHAT CHANGED

- [GPT] filed `Bonnaroo/chains-app` issue #3 from verified [CLAUDE] evidence in office commit
  `980a3877f29c892c8f7b971180408356c2174380`: an authenticated member could PATCH a disposable field onto another
  member's `playRounds/{id}` record (HTTP 200). Claude deleted only the probe field and verified it null with the
  rest of the round unchanged. GPT did not repeat the live write and omitted credentials from the public issue.
- Routed issue #3 as BOARD T-C07, blocked on owner-controlled rules backup and Emulator/non-production remediation.
  Updated `TO_OWNER.md`, `DECISIONS.md`, and `REPORT.md` with exact owner and team actions.
- Corrected current app identity and T-C04. App main/live are v456 at
  `d48d0b83c7bd91b7a131f6aa2796e33f06c12c1d`, not v476. The newest [CLAUDE] company log's unanchored `v476`
  match came from a long encoded payload; explicit `window.CHAINS_VERSION` and production UI both report v456.
- Kept #43 / ROUND_QUEUE #2 open. Current Discard creates/adopts a missing round ID, then calls
  `ChainsRounds.remove(cloudIdRef.current)` without await/return/result handling, clears local state, and exits.
  The callee starts `Promise.all(jobs)` but returns `Promise.race([settle, timeout])`, where timeout resolves
  optimistic `true` at eight seconds.
- Refreshed T15 readiness to current v456 and issue #3. `field.json` remains event 96415 / 116 MPO and current PDGA
  remains 116 MPO / 168 total; readiness stays AMBER.

## VERIFICATION / EVIDENCE

- PASS: cache-busted `https://bonnaroo.github.io/chains-app/?cb=202608050337#dashboard` visibly rendered
  `Fantasy DGPT v456`, current league/standings data, Discmania Challenge, and `Picks open`; no initialization hang.
- PASS: app `index.html` and `test.html` are byte-identical, 2,369,279 bytes, git blob
  `e0918ffe0cb133ce9aad91214387b0ac17532af8`, SHA-256
  `C5AE3BE195536B2740F9B4E4B59A6C166EDF56BF096E6B205F785E564DF3F4F3`.
- FAIL: decompressed immutable v456 contains one active-round fire-and-forget remove caller followed by local clear
  and `onBail()`, plus one optimistic eight-second `Promise.race` in the callee. This is contrary evidence to the
  [CLAUDE] callee-only/#43-closed conclusion; the useful missing-ID fix is preserved but acceptance is not met.
- PASS: GitHub issue #3 is open at `https://github.com/Bonnaroo/chains-app/issues/3`; connector re-fetch returns
  the stamped [GPT]/[CLAUDE] attribution, cleanup proof, credential omission, no-reprobe rule, remediation matrix,
  and closing conditions.
- PASS: PDGA event 96415 still lists Aug 7–9, 168 total / 116 MPO, last updated
  `04-Aug-2026 11:53:02 CDT`. Data blob `e79e2eace48faed4146e9e4f09b6d85d7143b231` remains 116 players,
  updated `2026-08-05T01:04:52.730048+00:00`, roster hash `46e7cea96c95`, stable 6.7h.
- OPEN: `data/events/96415-MPO.json` is absent; no official first-player tee-time table is present; regular-member
  pick controls and duplicate Go Throw cards retain the prior QA blockers.

## DATA / SAFETY

- GPT changed only `chains-app` issue #3 and shared-office Markdown.
- No app, Design project, Firebase node/rule, user, pick, score, round, deployment, deletion, backup, or legacy
  `chains-fantasy /league` data changed by GPT.
- GPT did not repeat either the legacy-fantasy unauthenticated probe (issue #1) or Claude's `playRounds` cross-user
  probe (issue #3). No `_trash/<timestamp>` backup was created because GPT performed no data mutation or deletion.
- Issue #3 intentionally omits member credentials. Do not copy credentials from company logs into public surfaces.

## REUSABLE METHOD FOR THE OTHER AI

- [GPT] reused [CLAUDE]'s verified request/response/cleanup evidence instead of rediscovering the permission gap.
  Use issue #3 as shared memory until a rules change makes re-testing necessary.
- [GPT] improved build identification: never accept an unanchored `vNNN` match in a self-contained export. Require
  explicit `window.CHAINS_VERSION`, main commit, git blob, SHA-256, stage/live byte comparison, and cache-busted UI.
- Verify async repairs as a caller/callee pair. Callee `Promise.all` does not pass when the caller exits
  fire-and-forget or the callee races optimistic success. This method is now in `kb/LESSONS.md` and `kb/testing.md`.

## WHAT'S NEXT AND WHO OWNS IT

1. **Owner / Security [BLOCKING T-C05 + T-C07]:** export and date-back-up the exact current `chains-fantasy` and
   `chains-app-f38f8` rules; approve Emulator/non-production remediation and rollback paths. Do not send credentials.
2. **PM + Engineer:** in the authoritative Design source, retain v456's missing-ID fix but make Discard await and
   branch on a real non-optimistic result; separately fix issue #2's league-code failure visibility.
3. **Security/PM + QA after owner approval:** scope top-level `playRounds` writes to owner and participant writes to
   their authorized player subtree; prove owner/participant/unrelated/unauthenticated allow-deny matrix plus full
   resume/live/finish/discard regression before outside testers.
4. **Data + QA:** keep event 96415 current through tee-off, resolve/document missing `96415-MPO.json`, obtain the
   official first-player tee time, verify regular-member own-picks-only, and triage duplicate round cards safely.

## WATCH OUT FOR

- Live is v456, not v476. Search explicit version assignment; encoded assets contain misleading version-like text.
- Do not close #43 from Design prose, filename, call presence, or callee-only inspection. Awaited non-optimistic
  caller behavior and backed-up destructive persistence QA are both required.
- Do not repeat issue #1 or #3 live writes. Do not deploy rules without dated backups, offline review, regression
  matrix, rollback, and owner-controlled authorization.
- Never touch legacy `chains-fantasy /league`; keep betting removed and protect owner-confirmed-good behavior.
