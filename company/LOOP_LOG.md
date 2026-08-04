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

---

**2026-08-03 22:35 UTC · v450 shipped · ROOT CAUSE of the recurring breakage found**

Owner: *"It keeps breaking."* He is right, and it is one specific thing repeating.

**Three consecutive Design exports — v447, v449, and the v450 base — all arrived MISSING the v444/v445
login-gate fixes.** I have now re-applied the same two patches three times.

**Root cause:** those fixes were only ever patched into the deployed `index.html` on GitHub. They were
never written back into Design's own project file. So every build Design produces descends from a
lineage that never contained them, and faithfully reintroduces the bug. This is not Design being
careless — it is us patching production without patching the source.

**Lesson (this generalises):** any fix applied by direct module patch MUST be written back into
Design's project file, or it will be silently reverted on the next export. A pre-deploy marker check
catches it, but catching it every cycle is not a fix — it is a tax.

Action taken: sent Design the exact code for all three changes (the two AuthGate branches plus the
signOut ordering) and told it to verify by searching its own file for
`ANONYMOUS SESSIONS NO LONGER GRANT ACCESS`. Once that lands, the tax goes away.

**v450 is live** = Design's v449 + the re-applied fixes. Verified present: login block, authUid,
_indexWrite, European Open, In the Bag nav, AuthGate, ChainsImpact, ChainsAssets, editHistory.

v449's actual work shipped and is good: post-finish edit **with audit trail** (owner edits any row,
participant only their own, every change logs who/when/hole/from→to), mark-as-practice, starting-hole
choice, honors-based tee order, per-hole notes, adjustable hole par, and the **36h draft window with
on-the-clock enforcement + autopick** (closes #44). Design verified most of the round lifecycle was
already solid rather than rebuilding it, and deferred manual old-round entry openly instead of
faking it.

Still open: `editHistory`/`practice`/`notes` ride the same permissive `playRounds` write path as
`scorePatch`/`joinRequests` — Design flagged it independently, matching my own finding. Rules pass
deferred until the round lifecycle stabilises; **must close before outside testers get accounts.**

---

**2026-08-04 · v452 deployed · LOOP RESTRUCTURED to three phases · next: PHASE A on native-dialog replacement**

Two real wins and one correction.

**1. The revert loop is CLOSED.** v452 is the first Design export that already contained the
login-gate fixes **in Design's own source** — verified the marker before deploying, present.
v447/v449/v451 all reverted them because they were only ever patched into production. Telling Design
to fix its source worked. Keep doing that for every direct patch.

**2. v452 is live** — round lifecycle work: post-finish edit with audit trail, mark-as-practice,
starting-hole choice, honors tee order, per-hole notes, adjustable par, 36h draft window with
on-the-clock enforcement + autopick.

**3. CORRECTION — I was running the loop wrong.** Owner: *"It's supposed to think of a good way to do
it, to tell you to make the instructions to tell it. Ask it the best way to do it, so you can make
instructions for it."*

I had been handing Design solutions I designed. Wrong. Design sees the UI surface and component
structure; I don't. The loop is now explicitly **three phases per feature, one per run**:
  - **PHASE A (ASK)** — "How would you build X? Don't build yet. Approach, what needs deciding,
    what backend you need, what already exists."
  - **PHASE B (INSTRUCT)** — I answer every question with a ruling, build AND verify the backend it
    asked for, then write instructions **from its approach**, not mine.
  - **PHASE C (BUILD)** — Design builds; I verify markers, walkthrough, deploy.
LOOP_LOG must now record the current item AND its phase, so the next run knows where it is.

**Also set: never run Design on FABLE** (owner directive). Model check is now step zero.

**Next queue action:** open **PHASE A** on replacing the ~28 native `window.confirm()` calls with
in-app modals. This is the fix that unblocks automated walkthroughs *and* removes jarring OS popups
for real users on mobile. Ask Design how it wants to approach it — do not prescribe.
