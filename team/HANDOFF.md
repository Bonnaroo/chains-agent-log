# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] GPT | CEO | 2026-07-27 07:29 UTC | T-009/T-017: collector cadence + official tee-time audit**

## WHAT CHANGED
- [GPT] Reused the prior [GPT] immutable #528 roster evidence and did not repeat [CLAUDE]'s v409 commissioner-path
  QA. Fresh official PDGA event 96414 now reports `Last Updated: 26-Jul-2026 22:55:02 CDT` (03:55:02Z), 156 MPO
  registrations, Kayleb Gillmore #245013 present, Thomas Earhart absent, and no Tee Time, Round 1, or Withdrawn
  section. DGPT still lists 3:00 PM CDT only under BROADCAST SCHEDULE.
- [GPT] Found a distinct event-critical reliability gap: `.github/workflows/collect.yml` blob `a003c23` is
  configured `*/15`, but Actions still showed scheduled #528 at 05:58Z as the latest run at 07:24Z—a 1h26m gap
  with five expected starts absent. One scheduled run proved the path can fire; it did not prove cadence health.
- [GPT] Updated `team/BOARD.md`, `EVENT_READINESS.md`, and `TO_OWNER.md` at office commit
  `4d82d054edc14f556a25c24b2182141ae83aa4cd`; added the reusable cadence distinction to `kb/LESSONS.md` and
  `kb/testing.md` at `80b0cc10359e80fc8b90804ff667e8d2173f95d3`; logged the CEO shift at
  `67244fa4cb147956859069382dc3994eb84bcf49`.

## VERIFICATION / EVIDENCE
- [GPT] Primary PDGA URL `https://www.pdga.com/tour/event/96414` shows Ledgestone Jul 30-Aug 2, Last Updated
  26-Jul 22:55:02 CDT, and MPO (156); text search returned no `Tee Time`, `Round 1`, `Withdrawn`, or Thomas
  Earhart, while Kayleb Gillmore #245013 is present. DGPT URL
  `https://www.dgpt.com/event/2026-ledgestone-open/` labels 3:00 PM CDT as `MPO Round 1 LIVE` under
  `BROADCAST SCHEDULE`, so it remains invalid as a first-tee lock.
- [GPT] Current `data/field.json` blob `9743387f2cc70c671505b20ee3f9b4e9660ef79e` has 156 entrants and
  `updated_at` 06:00:04Z; `data/events/96414-MPO.json` blob
  `7dfca62400953c7bf1ef60ecab95d58355550c30` has 156 and `collected_at` 05:59:45Z. Both were generated after
  PDGA's 03:55:02Z update, exclude Earhart, and include Gillmore #245013, so no manual refresh was justified.
- [GPT] GitHub Actions UI at 07:24Z listed 528 total collector runs with successful scheduled #528 (05:58Z,
  1m16s) still newest; there was no #529. `chains-app` main HEAD remains [CLAUDE] v409 commit
  `94a95a26abb9c858ec494bc4c989b47a1164c1fa`, the Design project remains v409, and open chains-app issues = 0.

## DATA / SAFETY
- [GPT] No app, Design, Firebase, pick, score, round, user, workflow, generated-data, deletion, backup, or legacy
  `chains-fantasy /league` write occurred. This shift only updated shared-office evidence/playbooks. Confirmed-good
  KADEY-first/CORY-last order, Watch, Settings, standings, scoring, and betting-removed behavior were untouched.

## REUSABLE METHOD FOR THE OTHER AI
- [GPT] Improved the previous recurrence method: treat one genuine scheduled run as `recurrence path PASS`, not
  `cadence healthy`. Compare the latest scheduled run to the configured interval; after two missed intervals,
  mark cadence degraded, keep event readiness amber, and route a backstop/alert with an explicit freshness target.
  Claude should reuse this distinction and not restore green from #528 alone. It is now in LESSONS/testing.

## WHAT'S NEXT AND WHO OWNS IT
- PM: create/assign a HIGH-priority collector reliability/backstop task. Done when event-field data is published
  no later than 30 minutes after a source change and a visible signal catches missed scheduled runs; preserve the
  existing single-event manual backstop and do not touch Firebase or legacy `/league`.
- QA: independently verify the live Registered/Picks screen shows the corrected 156-entry feed, Earhart absent,
  and Gillmore #245013 present without selecting a player. After owner sign-in, close T-016 only if Draft Now and
  own-two-slots-only pass for a true member.
- Guillermo/owner: the non-commissioner Chrome sign-in request remains OPEN in `team/INBOX.md`; do not send a
  password.
- Engineer: wait for the official PDGA first-player tee time before T-017 lock work; do not spend a Design build
  on a guessed deadline. Then verify WD non-draftability, lock, and registration-finalized -> draft-open.

## WATCH OUT FOR
- Current roster data is correct and newer than the latest PDGA update; cadence is the failure, so do not run a
  manual refresh merely to create activity.
- Scheduled #528 proves the scheduler fired once but no subsequent `*/15` run appeared for 1h26m. Do not call
  background health green until the new cadence/backstop done-when is met.
- No official tee-time table exists in the current PDGA page text; never substitute DGPT's broadcast time.
- The documented office app identity remains commissioner uid `chains_commish_uid_v1`; it cannot prove T-016.

