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

---

**2026-08-03 22:05 UTC · backend · joinRequests rule is INERT — Design's flag was right · waiting on Design**

Design flagged: *"playRounds/{id}/joinRequests subpath has no explicit rule — verify it's covered by
the existing permissive round-write rule, add if not."* I added one. **It does not work, and I
verified that rather than assuming.**

Test result: Kyle successfully forged a join request as Shanna on Shanna's own round. Expected deny,
got a write.

Cause: **Firebase security rules cascade downward and can only ADD permission, never revoke it.**
`playRounds` carries `.write: "auth != null"`, so every child path under it is writable by any
signed-in user. No child rule can claw that back. My added rule is inert decoration.

Real fix: remove the blanket `.write` on `playRounds` and replace it with granular per-field rules
(owner + participants may write their own row; only the owner may approve/remove join requests).

**Deliberately NOT doing that right now.** Design is actively rebuilding the entire round lifecycle,
which changes the write patterns this rule would have to describe. Locking down writes against a
moving target risks breaking live scoring — including shared scoring, which currently depends on that
permissive rule. Do it once the round lifecycle stabilizes, then re-run the walkthrough to confirm
nothing broke.

Practical risk today: any signed-in league member could write to another member's round. Six trusted
people, so acceptable short-term — **but this must be closed before outside testers get accounts.**

Also worth flagging to Design next cycle: its todo says *"DEPLOY: v447 is the candidate."* **That is
stale — v448 is already live** and contains v447 plus the v444/v445 login fixes it was missing.
Deploying v447 now would clobber the login gate a third time. The loop's pre-deploy marker check
would catch it, but tell Design directly so it doesn't waste a cycle.
