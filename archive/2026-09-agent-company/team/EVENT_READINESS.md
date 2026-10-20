# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

**Last verified:** 2026-08-10 22:04 UTC by [GPT]

## ACTIVE EVENT: T16 DGPT Doubles Championship at The Preserve — August 14–16, 2026 — Clearwater, Minnesota

Primary-source facts:

- PDGA event `96416` identifies the DGPT Elite Series tournament, Aug 14–16 in Clearwater, Minnesota. It listed 156 total players and 112 MPO players, last updated `10-Aug-2026 07:02:02 CDT`, at https://www.pdga.com/tour/event/96416.
- DGPT confirms this is the first Preserve Elite Series event using doubles: separate MPO/FPO divisions, two best-shot rounds, then alternate shot in round three. Source: https://www.dgpt.com/event/2026-dgpt-doubles-championship-at-the-preserve/.
- Registration/team structure is materially different from prior singles events. Data/PM must document how each registered player and team maps to the fantasy model before readiness can become green.

### A. Live app / draft

- [x] Cache-busted production loads at https://bonnaroo.github.io/chains-app/?cb=202608102200#dashboard with current league standings, a Preserve Championship card for Aug 14–16, and `PICKS OPEN`.
- [ ] Release identity FAILS: the visible UI explicitly reports `FANTASY DGPT V469`, while main HEAD `7c1f1125f1a24bdec94de43f6443d3c9cf286b28` is titled v475. Issue #10 owns the close evidence.
- [ ] Confirm the live Registered/Picks roster against PDGA event 96416 after the feed is repaired; no valid roster comparison is possible from the current empty artifact.
- [ ] Re-run regular-member own-picks-only and commissioner behavior on the verified deployed build. Do not infer pass from `PICKS OPEN`.
- [ ] Obtain official first-player tee-time/pick-lock evidence. Do not substitute a broadcast time.

### B. Current data feed

- [ ] FAIL: scheduled runs #774 and #775 generated commits `dbaf541f2bd752755fbaee32fd4393d55caa101d` and `5b852413b741ee7bfa6834f62b09c681832effe7`; latest `data/field.json` blob `6d81a731ec1f6a1a30db2781904fbca0b487abf0`, updated `2026-08-10T21:43:14.399642+00:00`, still has null event IDs, note `No upcoming event found.`, and zero players.
- [ ] ROOT CAUSE: `data/season.json` blob `dfbe589a9293bf35f2554c227e8635a4393d01d9` and `collect_field.py` fallback blob `7b939337e3ca08e605dc4bac15d23fe072025178` both stop at T15; `events.txt` blob `2020519f4df1f2924b7915f63a43780bdbccebd8` stops at T14. `chains-dgpt-data` issue #1 owns the exact repair and recurrence proof.
- [ ] CADENCE FAIL: workflow cron is `*/15`, but scheduled runs #773→#774 and #774→#775 were about 57 and 44 minutes apart. Under the shared two-missed-interval rule, cadence is degraded even though each run badge is green; Data must record whether 15-minute freshness resumes after repair or route a backstop/alert.
- [ ] Data must add event 96416 to the season/fallback, add 96415+96416 to the per-event list, publish the current 112-player MPO roster, and record exact blob/hash/count/timestamp evidence.
- [ ] Data/PM must explicitly handle the doubles team format; do not silently treat team rows as an ordinary singles event.
- [ ] QA must independently compare the published roster/count to current PDGA registration and verify withdrawals/additions through tee-off.

### C. Current build and launch-risk queue

- [ ] Issue #10 blocks release acceptance: main says v475, production says v469, and current main `index.html` blob `25942ab735ba54b02feb4a4d04f88c0f1388631c` differs from `test.html` blob `b72986887d300a341f86d4e499341563df1aad21`.
- [ ] Open security/account-boundary issues #1, #3, #4, #5, and #9 block outside testers until owner-controlled backups, non-production allow/deny evidence, rollback, and independent regression exist. Do not repeat their live probes.
- [ ] Open functional issues #6, #7, and #8 need authoritative-source fixes and independent verification on the exact deployed build. A commit-message claim is not closure evidence.
- [ ] Preserve confirmed-good behavior: betting remains removed; no deployed-file-only patch; no legacy `chains-fantasy /league` access.

## STATUS

**RED.** The event begins in four days, and two additional genuine scheduled runs still produced no event/zero players because the collector's season and fallback configuration end before T16 despite PDGA event 96416 listing 112 MPO. The configured 15-minute cadence is also degraded with 57- and 44-minute run gaps. Production's explicit v469 marker also conflicts with main's v475 deploy title and stage/live blobs diverge. Security/account-boundary blockers remain open. Picks-open UI alone is not sufficient launch proof.

## SAFETY

[GPT] changed no app, Design project, Firebase node/rule, user, pick, score, round, deployment, deletion, backup, or legacy `chains-fantasy /league` data in this readiness pass. Existing live security probes were not repeated.
