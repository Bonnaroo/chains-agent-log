# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] GPT | PM | 2026-07-27 08:35 UTC | T-018: collector reliability routing**

## WHAT CHANGED
- [GPT] Reused the prior [GPT] CEO cadence finding and did not repeat [CLAUDE]'s verified v409 commissioner-path
  QA. Created HIGH-priority `T-018` and assigned it to Engineer in `team/BOARD.md`: repair the existing
  `chains-dgpt-data` autonomous freshness path, publish source changes within 30 minutes, add an independent
  visible >30-minute stale signal, preserve manual single-event dispatch, and prove two consecutive autonomous
  cycles before QA closeout. Board commit: `ee5711bbf776ef1294877ef8b9d4e1156a9959e5`.
- [GPT] Groomed obsolete `T-008` to `SUPERSEDED BY CURRENT STRATEGY`. The old July 29 hold must not be revived;
  current `team/STRATEGY.md` already authorizes backend-first Phase 2A while protecting App A's rails.
- [GPT] Appended the detailed PM log at commit `64a29677cc91a4a24bca47a6769275b9cc4f3aff` and added the safe
  backstop-boundary method to `team/kb/LESSONS.md` plus `team/kb/testing.md` at commit
  `338b3e4f16efcfb2ff294d331712714112bee1f7`.

## VERIFICATION / EVIDENCE
- [GPT] Fresh GitHub Actions UI inspection at 08:24Z showed 528 total `Collect DGPT Data` runs; scheduled run
  `30241283786` (#528, started 05:58Z, success in 1m16s) was still newest. That is a 2h26m gap despite
  `.github/workflows/collect.yml` blob `a003c23d158a281a2dc9a0a39228ce6da3dcbdf8` declaring `*/15`.
  No #529 existed. The scheduler path can fire, but launch-grade cadence remains degraded.
- [GPT] `chains-poller/README.md` blob `7db7e9aec429ae06abba3fac8f5d311c6981375a` identifies that service as
  a ~25-second PDGA live-score worker whose `FIREBASE_URL` defaults to chains-fantasy. It is not a safe drop-in
  roster backstop and T-018 explicitly forbids casual reuse across that protected-data boundary.
- [GPT] Contents-API verification after each write: BOARD blob `ec3dc540691c92bff0ecde321f90498c6fc5519a`
  contains T-018 and the T-008 supersession; PM log blob `c7f20354393230c42bbdf4438c06609d09a71e2d`
  contains the detailed [GPT] entry; LESSONS blob `e97f70c97143faf44ffa1c5cf415443ec70fc13d`
  and testing blob `3ea5e6a78978880660d253c250a0574005f4384c` contain the backstop-boundary rule.
- [GPT] `chains-app` main HEAD remains [CLAUDE] v409
  `94a95a26abb9c858ec494bc4c989b47a1164c1fa`; open `chains-app` issues remain zero.

## DATA / SAFETY
- [GPT] No app, Design, Firebase, pick, score, round, user, workflow, generated-data, deletion, backup, or legacy
  `chains-fantasy /league` write occurred. No new repo, service, board, roadmap, or coordination file was created.
  Confirmed-good KADEY-first/CORY-last order, Watch, Settings, standings, scoring, and betting-removed behavior
  were untouched.

## REUSABLE METHOD FOR THE OTHER AI
- [GPT] Reused the existing cadence rule—one scheduled run proves a path, not cadence—and improved it with a sink
  boundary check. Before Claude or GPT reuses an always-on worker as a backstop, verify its source, sink,
  credentials, and protected-data boundary. Here, `chains-poller` targets live scores/Firebase and defaults to
  chains-fantasy, so T-018 must stay on an explicitly safe public-artifact path unless the owner authorizes a
  different sink. This is now in LESSONS/testing; the other AI should reuse it rather than rediscovering it.

## WHAT'S NEXT AND WHO OWNS IT
- Engineer: claim T-018 first. Diagnose why `collect.yml`'s `*/15` trigger has produced no run after #528, then
  implement the smallest reliable backstop/monitor in existing safe infrastructure. Do not create a parallel repo
  or touch App A/Design/Firebase. Record exact files, run/base/generated SHAs, two <=30-minute autonomous cycles,
  a real source-change publication within 30 minutes, the visible stale signal, risks, and manual-dispatch proof.
- QA: independently verify T-018's cadence/freshness/stale-signal evidence before DONE. Separately verify the live
  Registered/Picks roster and T-016 true-member path when owner access is available; never select an auto-saving
  starter-league pick.
- Guillermo/owner: the non-commissioner Chrome sign-in request remains OPEN in `team/INBOX.md`; no password is
  requested. If T-018 requires paid hosting, credentials, or new external configuration, Engineer must route a
  decision here rather than assuming permission.
- Engineer for T-017: wait for the official PDGA first-player tee-time table; never substitute DGPT broadcast time.

## WATCH OUT FOR
- Current Ledgestone roster artifacts were correct at the last immutable check; the failure is autonomous cadence.
  A manual refresh can restore data temporarily but cannot satisfy T-018 or turn readiness green.
- GitHub Actions schedules can be delayed; adding a second cron on the same unreliable scheduler is not an
  independent backstop unless two autonomous <=30-minute cycles and the separate stale signal prove otherwise.
- `chains-poller`'s default chains-fantasy Firebase sink crosses a protected boundary. Do not repurpose it casually.
- The office Chrome identity is still commissioner uid `chains_commish_uid_v1`; it cannot close T-016.
