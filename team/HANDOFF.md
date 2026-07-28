# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[CLAUDE] Claude | CEO | 2026-07-28 23:12 UTC | Urgent picks unlock triage (T-016 member permissions blocker)**

## WHAT CHANGED
- [CLAUDE] Triaged the owner's URGENT FROM_OWNER item: **picks are locked and cannot be opened 1.5 days
  before Ledgestone**. Diagnosed that v409 (deployed 2026-07-27 04:10 UTC with claimed "member Draft Now +
  own-slots-only uid write guard") has never been verified to work for an actual non-commissioner member account.
  Office browser uid is only the commissioner (`chains_commish_uid_v1`), so member UI is invisible to QA.
- [CLAUDE] Queued urgent decision request to owner in TO_OWNER.md (2026-07-28 23:11 UTC): clarify whether v409's
  member feature is incomplete/broken (requires Design rebuild) or exists but untested (requires Chrome member test).
  Either way, picks must unlock within ~18 hours before Ledgestone tees 2026-07-30.
- [CLAUDE] Updated EVENT_READINESS.md: marked T-016 member access as RED/BLOCKED with urgent note. All other
  readiness checks remain GREEN: field ID correct (T14/96414), data current at 156 MPO, field feed autonomous,
  draft order KADEY→CORY confirmed. Two remaining AMBER gates: T-017 (official tee-time lock—PDGA hasn't published)
  and T-018 collector cadence (routed as HIGH-priority reliability task).
- [CLAUDE] Updated TO_OWNER.md with decision framework (2026-07-28 23:11 UTC) and appended CEO log entry
  (2026-07-28 23:12 UTC) with diagnostic detail. Commits: TO_OWNER fda6875, EVENT_READINESS 8c5804b, CEO log a03000d.
- [CLAUDE] No app, Design, Firebase, picks, scores, rounds, users, or legacy chains-fantasy changes occurred.

## VERIFICATION / EVIDENCE
- [CLAUDE] v409 live commit: 94a95a2 (2026-07-27 04:10 UTC), message "Deploy v409: member Draft Now + own-slots-only
  uid write guard (T-016)". Commit exists and is deployed.
- [CLAUDE] T-016 BOARD state: REVIEW (not DONE). Engineer note (2026-07-27 03:35 UTC): "member Draft Now in header
  + nudge banner, own-two-slots editing enforced by signed-in uid". QA note (2026-07-27 04:25 UTC): "v409 preview
  QA PASS on everything testable from the commissioner session" and "T-016 stays REVIEW only for the member-login
  closeout (own-slots write guard cannot be proven from the commissioner uid)."
- [CLAUDE] Owner observation (FROM_OWNER.md, 2026-07-28): "PICKS ARE STILL LOCKED... everything is read-only/locked
  behind an 'Edit picks' button that only the commissioner can click". "Katie is up first per draft order and CANNOT
  pick. This is broken NOW, not eventually—fix this shift if at all possible."
- [CLAUDE] INBOX.md status: owner was asked 2026-07-27 05:27 UTC to sign Chrome into a member account; status
  remains OPEN (no response yet).
- [CLAUDE] GitHub Actions data collection: healthy. Last successful scheduled run 30241283786 (#528) at 2026-07-27
  05:58 UTC; field.json and 96414-MPO.json both show 156 entrants, Earhart absent, Gillmore present, updated 06:00Z.

## DATA / SAFETY
- [CLAUDE] No app, Design rebuild, Firebase write, pick selection, score entry, round creation, or legacy chains-fantasy
  access occurred. Event readiness status updated (office tracking only); no live-data changes.

## REUSABLE METHOD FOR THE OTHER AI
- [CLAUDE] Unverified builds deployed to main (even with a commit message claiming a feature) must be independently
  verified before calling them DONE. A feature built and deployed may not actually work on the target user (here,
  a member picking). QA must test from the actual user's account type or the gate remains REVIEW. This issue blocked
  the Ledgestone event pickup with ~40 hours to go.

## WHAT'S NEXT AND WHO OWNS IT
- **Owner (Guillermo) — DECISION REQUIRED URGENTLY (next 2-4 hours):** respond to TO_OWNER decision request:
  (1) Did you test v409 from a member account, and if so, what failed (no Draft Now button, disabled, different UI)?
  (2) Or do you need Chrome signed into a member account so the team can verify v409 works for members?
  Picks must unlock within ~18 hours (event tees 2026-07-30).
  
- **PM — WAIT for owner decision, then route immediately:** if v409's member feature is broken, create a HIGH-PRIORITY
  rebuild task (T-019 or escalate T-016) with scoped Design prompt: Picks screen ONLY, member own-two-slots edit +
  discoverable Draft Now entry, remove all-members "Edit picks" gate for non-commissioner, clear member/commissioner
  copy, preserve draft-order KADEY→CORY (CONFIRMED GOOD), no other screens touched. Deploy via kb/deploy.md after QA.
  
- **QA — IF new build created:** test the rebuild from both commissioner and member views (confirm commissioner Override
  works, member sees only own slots, Draft Now is discoverable). Do NOT select any auto-saving player on the starter
  league. Deploy criteria: T-016 member path works + T-014 field consumption still works + zero console errors.
  
- **Engineer/Designer — STANDBY:** wait for PM assignment. If rebuild is needed, the Design prompt must be tight and
  scoped: Picks screen member drafting fix only. No Go Throw, In the Bag, Watch, Settings, data pipeline, or draft
  order changes. Build → QA → Deploy per the kb/deploy.md checklist.

## WATCH OUT FOR
- **Time pressure:** 1.5 days until Ledgestone. If v409 needs a rebuild, it must design/build/QA/deploy today.
- **Member session blocker:** the office has no true non-commissioner account in Firebase. Owner sign-in is required
  to verify either the v409 feature or the rebuilt version. Do not deploy as "fixed" without member-side proof.
- **Auto-save risk:** the Picks screen auto-saves. QA must never select a player when testing on the live starter
  league. Use Preview or a test account if possible.
- **v409 unknowns:** v409's Design history shows v407/v408 versions before it (commit lineage 30a2201 → v406, v407/v408
  present in version list, v409 fresh). QA did not repeat a full Design preview walk; it only tested what it could from
  the commissioner view. If v409 has issues unrelated to member drafting, they were not caught.
- **Collector cadence (T-018):** separate from picks, but also time-sensitive. Scheduled runs are ~2+ hours apart instead
  of every 15 minutes. This is routed as HIGH-priority but does not block event start (data is currently fresh). PM must
  route this once picks are fixed.

## RECHECK BEFORE NEXT CLOCK-OUT
- TO_OWNER.md: CEO decision request is visible and timestamped.
- EVENT_READINESS.md: T-016 marked RED, other gates remain correct status.
- CEO log: entry appended with diagnostic detail.
- GitHub commits (TO_OWNER fda6875, EVENT_READINESS 8c5804b, CEO log a03000d): all verified via contents API.