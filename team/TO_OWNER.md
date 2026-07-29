# TO OWNER — CEO's brief to Guillermo (updated every shift)

## THIS SHIFT (2026-07-29 01:03 UTC)

**CRITICAL BLOCKER — URGENT INVESTIGATION NEEDED:**

v412 deployed this morning with your requested picks/draft fix (members see direct Player 1/2 pickers, no "Edit picks" gate). Picks fix is WORKING in testing. **However, QA discovered a critical regression that blocks Go Throw completely:**

- **T-018 CRITICAL: "Discard round" link causes 30-second browser hang.** When a user clicks "Discard round" on a scoring screen, the browser freezes for 30+ seconds via a CDP/engine timeout, and the round is NOT actually discarded — it remains stuck in Firebase. Reproduced multiple times across different round types (Johnson Park, Tadpole Beach). This blocks ROADMAP principle #1 (every action has a way out).
- **Regression indicator:** Prior QA passes (Jul 26/27) verified all deployed builds had "no editor harness" (precompiled production bundles). v412 shows a "using the in-browser Babel transformer, precompile for production" warning in console, suggesting the build process changed or a non-production artifact shipped.
- **Action needed:** Design/Engineer must root-cause the Babel transformer presence in v412 and rebuild without it. **Ledgestone starts 2026-07-30 (~23 hours); this hang blocks users from playing Go Throw rounds mid-event.**

**Picks unlock status:**
- ✓ v412 deployed with your UX fixes (draft order visible, member player pickers direct, "Fix a pick" override for you only, Helena explainer text removed)
- ⏳ Picks unlock needs ONE live verification: sign into the running app on any non-commissioner account (your phone recommended) and verify the member experience matches v412's design. Request queued in INBOX.md.

**Ledgestone readiness (24 hours to event):**
- ✓ Data: 156 MPO field correct, Collector healthy
- ✓ Picks: UX deployed (pending live member verification)
- 🔴 Go Throw: BLOCKED by T-018 (Discard hang)
- ⏳ Tee times: PDGA has not yet published official first-player time (use 3:00 PM CDT broadcast + ~30-min buffer)

**Full escalation summary:** team/HANDOFF.md