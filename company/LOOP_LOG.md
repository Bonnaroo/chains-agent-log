# LOOP LOG — the running memory

Every Design-loop cycle appends here. Read the last ~30 lines before doing anything. This file is
the only reason a fresh run knows what already happened. Newest at the bottom.

Format: `YYYY-MM-DD HH:MM UTC · queue item · what happened · waiting on`

---

**2026-08-03 21:50 UTC · SETUP · loop rebuilt around the round · waiting on Design**

Owner redirected scope: build the ROUND, in the field, one feature at a time, overbuilt not
underbuilt. Everything else (stats, practice, fantasy extensions, course discovery) is parked.

Created `company/ROUND_QUEUE.md` — 8 ordered items, each gated by THE WALKTHROUGH (start a round,
add two friends, score nine, add someone mid-round, fix a score, kill the app, resume, finish,
delete). Loop cadence moved from daily to **every 30 minutes**.

State at handoff:
- **Live: v448.** All markers verified present (authUid, _indexWrite, European Open, In the Bag nav,
  AuthGate, anonymous-block, ChainsImpact, ChainsAssets).
- v447 shipped from a stale base **missing the v444/v445 login fixes** — repaired into v448. Second
  clobber in two days. Always verify an export before deploying.
- Standalone exports re-embed images: 9.7MB vs v443's 2.3MB. Works, but undoes the CDN size win.
- Accounts live: will/cory/kyle/shanna/gabe/kadey. Starter `chains1234`, forced change on first
  login. Will and Kadey have already changed theirs — the flow works.
- Backend built + verified this session: `leagueCodes` (commissioner-only write), `friendRequests`
  (sender creates / recipient deletes / forgery denied), `friendCodes` (self-only),
  `leagues/chains-dgpt-2026` with all six members, seeded code `CHAINS26`.
- Field collector fixed (hardcoded event list stopped at T14) — now reads season.json and tracks
  `stable_hours`. **111 players loaded for T15 Discmania. The league can draft.**
- T14 Ledgestone scored from real PDGA results; season rolled to 14/22; draft order unlocked.

Known backend gaps I owe:
- `playRounds` is `.write: auth != null` — fully permissive; `joinRequests` inherits it.
- League-code joiners get membership but no `memberId`, so they can't be drafted. Half-fixable
  (`memberId = username`); fully fixing needs the hardcoded six-person roster to become dynamic —
  that's the season-data migration, **not to be attempted mid-season**.
- Per-user round hiding + edit history will need schema decisions for queue items 2 and 5.

Last message sent to Design: full round-lifecycle scope change. It was mid-read (~22k tokens) and
is now working on it. **Next cycle: check whether it answered or exported; do not interrupt.**
