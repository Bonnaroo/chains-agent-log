# LOG: engineer (append a dated entry every shift; nobody else writes here)

- 2026-07-26 | First engineer shift logged. Claimed T-014 + T-015 (both HIGH PRIORITY, Ledgestone Open event-
  readiness gaps found by CEO this morning). Read team/roles/engineer.md + kb/claude-design.md + kb/deploy.md
  first. Opened the Chains Design project — confirmed via its readme that the app's MPO field is a static
  "114-player database... meant to grow as more players register" (not a live sync), and that the documented
  draft rule is genuinely "last place drafts first (self-balancing snake)" — both confirm the two bugs CEO found.
  Sent ONE scoped prompt: (1) add the real 156-player Ledgestone Open MPO field (PDGA event 96414, verified live
  today) to players.js and wire T14's picks to it so drafting unlocks, explicitly leaving the 2 open Sunday
  Qualifier slots as TBD; (2) fix the draft-order sort, which is currently backwards (best-finisher-first instead
  of last-place-first per T13 Heinola standings). Scoped strictly to the Picks/Draft Room screen; told it not to
  touch Dashboard/Standings/Schedule/Go Throw/Bag/Settings/betting-removal. Design started building
  ("Shelling...") after send — did not sit and watch a multi-minute build per protocol.
  Note for next shift: had to paste the prompt via a JS execCommand('insertText') workaround — a normal simulated
  "type" of ~5300 chars hit a 30s CDP timeout and killed the browser tab/group entirely (had to reopen). Added to
  LESSONS.md.

- 2026-07-26 (2nd engineer shift, ~16:30-16:50 UTC) | Verified + DEPLOYED v405. Chrome extension was down at
  clock-in (scheduled run couldn't get access; shift initially aborted with lock untouched) — owner replied in
  chat, extension came back, shift resumed and claimed the lock. Verified v405 in Design preview: T14 Ledgestone
  REGISTERED tab shows 154 named pros ("updated Jul 25, 8:00 PM"), T14 card = DRAFTING, picks unlocked, draft
  board read-only for non-commissioners. KEY FINDING: T-015 is NOT A BUG — Heinola T13 result is Cory 1st ...
  Kadey 6th, so KADEY-first order is correct worst-to-best; CEO pass had the columns inverted; owner confirmed
  same in Design chat. Downloaded v405 (9,641,939 bytes), ran kb/deploy.md clean-checks (omelette 0, betting 0,
  title OK). Deep-verified content by decompressing the pako/base64 bundle: 190-entry MPO_PLAYERS DB + field
  loader with bundled 156-player Ledgestone snapshot (96414, expires Aug 3) that yields to the live field.json
  feed (Bonnaroo/chains-dgpt-data, 2h GitHub Action). Uploaded to Bonnaroo/chains-app (commit 16:46:13Z,
  default msg "Add files via upload" — a permission classifier blocked typing the commit message; owner approved
  the upload in chat). Live site now serves the full 9,641,939 bytes = v405 LIVE. Next: QA field 1:1 check +
  close T-014/T-015; CEO to green the EVENT_READINESS boxes.

- 2026-07-27 02:15 UTC | [CLAUDE] | T-016 (member own-only drafting + Draft Now): claimed lock 02:04:20Z, sent ONE
  scoped Claude Design prompt (1,214 chars, execCommand insert per LESSONS — no CDP timeout). Scope: Picks screen
  only; member edits ONLY own two picks when DRAFTING; commissioner (chains_commish_uid_v1) keeps full authority;
  member "Draft Now" entry when picks incomplete; member banner copy updated. DO-NOT-TOUCH stated in-prompt:
  draft order (Kadey-first/Cory-last CONFIRMED GOOD), scoring, standings, Watch, Settings, Go Throw, field.json
  feed. Build started ("Scrambling") — per one-build-per-shift, next shift verifies the new version in preview,
  then deploys via kb/deploy.md. QA closeout still needs a TRUE member login (office uid = commissioner).
  Secondary: T-017 recheck — pdga.com/tour/event/96414 at ~02:12Z still has NO tee-time table (page last updated
  25-Jul-2026 19:20 CDT); pick-lock deadline still unknown, readiness stays AMBER.

- 2026-07-27 02:38 UTC | [GPT] | T-016 verification attempt 1 FAILED safely; no deploy and no Firebase writes.
  Reused [CLAUDE]'s exact prompt scope and opened the same Design project `56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9`
  instead of rediscovering the requirement. The version dropdown shows v408 edited ~18 minutes earlier, after
  unshipped v407 and live-baseline v406. In v408 preview, navigated to The Picks -> T14 Ledgestone Open: the exact
  old commissioner-only banner remains once, `Draft Now` button count = 0, and 12 player buttons are disabled.
  The chat has the T-016 user prompt but no assistant completion response. That observable failure blocks download
  and deploy; live remains lowercase v406 (`chains-app` deploy `30a2201`, main HEAD `b3be810`). Added a reusable
  Design baseline/preview rule to `kb/claude-design.md` and `kb/LESSONS.md` so [CLAUDE] will not mistake a new
  version number for a landed fix or unknowingly bundle an unshipped predecessor. Secondary P3 evidence: latest
  `chains-dgpt-data` Collect run 30231210987 (#526) succeeded at 02:02Z and generated `23d04a8`; backup run
  30194452812 (#41) succeeded at 08:20Z on Jul 26; `data/live.json` updated 01:13:05Z for European Open with
  112 players. Firebase `/playRounds`/`/liveRounds` read could not be completed because Chrome blocked the RTDB
  endpoint with `net::ERR_BLOCKED_BY_CLIENT`; no auth token was created and no data was touched. Next Engineer:
  explicitly select v406, send one fresh T-016-only prompt on a later shift, verify actual preview UI, then deploy;
  QA closeout still needs a true non-commissioner login and must not change auto-saving starter-league picks.

- 2026-07-27 03:40 UTC [CLAUDE] Engineer (T-016 attempt 2): Explicitly selected v406 in the Design version dropdown per HANDOFF, sent ONE fresh Picks-only T-016 prompt. Design built v409 on the v406 base (its summary states v407's escape-hatch work reverted and v408 stripped; 5 files edited incl. view_picks.jsx): member Draft Now (header + nudge banner), own-two-slots editing enforced by uid in the engine write guard, commissioner authority unchanged. Verified in Present view: v409 loads clean, The Picks -> T14 DRAFTING, draft order KADEY->CORY intact, Standings/Dashboard untouched. Office uid = commissioner, so absence of Draft Now in this session is expected behavior, not a failure — member path unprovable here; NOT deployed. Second visible items: PDGA 96414 recheck ~03:15Z still has NO tee-time table (T-017 stays amber); P3 health: Collect #526 success 02:03Z, Live Scores A/C success, live.json = European Open 112 players. NOTE: Design shows 91% of Fable 5 weekly limit used (resets Fri Jul 31) — budget prompts carefully before Ledgestone.
