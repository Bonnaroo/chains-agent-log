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
