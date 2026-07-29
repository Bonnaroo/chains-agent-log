# TO OWNER — CEO's brief to Guillermo (updated every shift)

## THIS SHIFT (2026-07-29 01:07 UTC) — 🚨 CRITICAL ESCALATIONS

**LEDGESTONE STARTS IN ~22.8 HOURS (2026-07-30). Two blockers block playability:**

### 1. PICKS STILL LOCKED — T-016 Member Permissions (URGENT)
Your report (FROM_OWNER.md): picks screen read-only, members cannot pick, Katie up first cannot draft. v412 deployed at 00:49 UTC with claimed member-facing "Draft Now" + direct Player 1/2 picker (no Edit Picks gate), but **live member experience unverified**. 

**What's needed RIGHT NOW:** Sign into your live app on a NON-COMMISSIONER member account (e.g. use the member browser extension login or a test account) and confirm:
- [ ] Picks screen shows direct Player 1/Player 2 dropdowns (no "Edit Picks" gate in front)
- [ ] You can pick your two players without an Edit Picks gate
- [ ] Commissioner correction button exists and is labeled clearly (not a generic "Edit picks")
- [ ] Field shows 156 Ledgestone MPO entrants

**If this works:** replies yes and we're green. **If it fails or is unclear:** Design lane must rebuild immediately with a focused Picks-screen prompt (member permissions + UX clarity). 

**If v412 is correct but you can't sign in as a member:** alternative: I can queue a Design session to be triggered as soon as you're ready, so it's not blocked on member-account prep.

### 2. T-018 BLOCKER — Go Throw Discard Round (CRITICAL)
The "Discard round" link (both in-round and on the Resume card) causes a 30-second browser hang and does NOT actually discard the round — it stays stuck in Firebase. QA reproduced this 4 times across different round types (Johnson Park, Tadpole Beach). **This blocks ROADMAP anchor feature (cancel/delete in-progress round)** and breaks Go Throw playability if a user opens a round and then wants out.

Root cause flag: v411/412 appears to contain an in-browser Babel transformer instead of a precompiled production bundle (warning seen in console). Prior QA passes verified "no editor harness" so this is a regression.

**What's needed RIGHT NOW:** This requires Design/Engineer trigger + fix. Engineer lane is manual-trigger-only (cannot run autonomously). The fix is urgent because QA's next :54 UTC verification will re-flag it if still broken.

**Suggested action:** When you trigger the next Design session (for picks or otherwise), include a tight scope: "Fix Discard round hang (T-018): inspect v412 index.html for Babel transformer, replace with precompiled production bundle, verify hang is gone, test Discard works." Or trigger a focused session just for this if separate.

---

## SUMMARY OF STATUS (updated 01:07 UTC)

- **Picks unlocked:** ⚠️ AMBER — v412 deployed with member fix, but UNVERIFIED on real member account. Owner verification needed now.
- **Discard round (Go Throw):** ⛔ RED — BLOCKER. 30-second hang, no actual discard. Requires Design/Engineer fix before QA re-verifies at ~01:54 UTC.
- **Data health:** ✓ (autonomous, running well, no issues)
- **QA lane:** ⚠️ MISSED scheduled run at 00:54 UTC (reason unknown; may have been event/manual-trigger only)
- **Ledgestone readiness:** 🟠 AMBER with two critical gates (picks member UX + discard round)

---

## WHAT NEEDS OWNER ACTION

1. **Member account sign-in test (10 min):** Confirm v412 picks unlocking works for a member. Report yes/no/unclear in email.
2. **T-018 Design trigger:** When you have a Design window, fix the Discard round hang (root cause: likely Babel transformer). Tight scope: inspect build output, replace with production bundle, verify hang gone. Expected 30-60 min.

**If #1 fails:** rebuild picks permissions. **If #2 not fixed by ~00:54 UTC next shift:** we've missed the Ledgestone launch window and need escalation.

---

## TEAMS / LANE STATUS

- **Data lane:** ✓ WORKING. Phase 2 Step 2 seeded Firebase, awaiting Design build to wire reads.
- **QA lane:** ⚠️ MISSED scheduled :54 run; last entry 2026-07-27 04:30 UTC. Unclear if this is schedule/infrastructure or lane issue. Next run at ~01:54 UTC should resolve.
- **Engineer lane:** MANUAL-TRIGGER ONLY. Cannot fix T-018 autonomously; requires Design session trigger.
- **CEO lane:** 🟠 ESCALATING critical blockers this shift.

---

## NEXT SHIFT PRIORITIES

1. Owner verifies member picks UX (passes / fails / inconclusive)
2. Owner triggers Design/Engineer if T-018 still broken or picks fix needed
3. By ~00:54 UTC: QA verifies live app state (member picks + Discard round status)
4. If both gates close: Ledgestone is GREEN. If either remains: escalate and consider member notification.

