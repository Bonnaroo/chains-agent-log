# TO OWNER — CEO's brief to Guillermo (updated every shift)

## THIS SHIFT (2026-07-29 01:08 UTC)

**🔴 HARD-STOP ESCALATION — T-014 (EDIT PICKS OVER-BROAD UNLOCK) — DECISION REQUIRED:**

This issue has been flagged 5 consecutive shifts (Jul 26, 27 x2, 28, 29) per team/logs/qa.md. It remains unresolved and unassigned. Per LANES.md mandatory rule ("If the same mistake/blocker shows up again, that is a hard stop..."), this requires an explicit owner decision TODAY:

- **The bug:** When a league commissioner clicks "Edit picks" to unlock the draft board, ALL members' pick-edit screens unlock (not just their own). A member like "WILL-C" can see and modify OTHER members' player selections + their scores. This violates draft integrity.
- **Why it persists:** Engineer task T-016 (member-permission write guard for own-slots-only) was marked REVIEW on v409 (2026-07-27 04:10 UTC) but remains unverified and no follow-up rebuild happened. The root cause — a missing uid-comparison check during edit — has not been diagnosed in writing.
- **What's needed:** Either (1) Engineer diagnoses and fixes the uid-write guard in Claude Design (the actual fix, expected ~30-60 min rebuild), or (2) Owner deprioritizes this issue as non-blocking and accepts the current behavior as-is for Ledgestone (event in ~22 hours).
- **Current status:** No PM routing exists; no fix in progress; no explicit deprioritization stated.

**ACTION REQUIRED:** Respond in this file or reply to diamashield@gmail.com with which path: (a) **FIX THIS SHIFT** — Engineer rebuilds today with uid guard (requires Claude Design session with you present), or (b) **ACCEPT AS-IS** — acknowledge it and we protect the current behavior from further regression. Cannot stay in limbo a 6th shift.

---

**CRITICAL BLOCKER — URGENT INVESTIGATION NEEDED:**

v412 deployed this morning with your requested picks/draft fix (members see direct Player 1/2 pickers, no "Edit picks" gate). Picks fix is WORKING in testing. **However, QA discovered a critical regression that blocks Go Throw completely:**

- **T-018 CRITICAL: "Discard round" link causes 30-second browser hang.** When a user clicks "Discard round" on a scoring screen, the browser freezes for 30+ seconds via a CDP/engine timeout, and the round is NOT actually discarded — it remains stuck in Firebase. Reproduced multiple times across different round types (Johnson Park, Tadpole Beach). This blocks ROADMAP principle #1 (every action has a way out).
- **Regression indicator:** Prior QA passes (Jul 26/27) verified all deployed builds had "no editor harness" (precompiled production bundles). v412 shows a "using the in-browser Babel transformer, precompile for production" warning in console, suggesting the build process changed or a non-production artifact shipped.
- **Action needed:** Design/Engineer must root-cause the Babel transformer presence in v412 and rebuild without it. **Ledgestone starts 2026-07-30 (~22 hours); this hang blocks users from playing Go Throw rounds mid-event.** Task T-D07 filed on BOARD_DESIGN.md.

**Picks unlock status:**
- ✓ v412 deployed with your UX fixes (draft order visible, member player pickers direct, "Fix a pick" override for you only, Helena explainer text removed)
- ⏳ Picks unlock needs ONE live verification: sign into the running app on any non-commissioner account (your phone recommended) and verify the member experience matches v412's design. Request queued in INBOX.md. **This must happen before Ledgestone starts.**

**Ledgestone readiness (22 hours to event):**
- ✓ Data: 156 MPO field correct, Collector healthy
- ⚠️ Picks: UX deployed (pending live member verification + T-014 decision)
- 🔴 Go Throw: BLOCKED by T-018 (Discard hang) — must be fixed
- ⏳ Tee times: PDGA has not yet published official first-player time (use 3:00 PM CDT broadcast + ~30-min buffer)

**Full escalation summary:** team/HANDOFF.md
