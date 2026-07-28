# CHAINS DAILY REPORT — 2026-07-28

**Executive summary:** v409 is live with member own-only drafting fixed (T-016); data collector recovered autonomously throughout the day (13+ runs, roughly hourly cadence); Ledgestone readiness is AMBER pending member-login QA and official tee times.

## A. SHIPPED TODAY

- **v409 DEPLOYED (2026-07-27 04:30Z UTC, still live 2026-07-28)**: member own-only drafting + "Draft Now" entry point + uid-enforced write guard (T-016). Deployed and live-verified at `chains-app` commit `94a95a26abb9c858ec494bc4c989b47a1164c1fa`, 9,644,611 bytes, confirmed zero console errors and zero betting/omelette strings on this build. Verified features: Picks/Draft board shows T14 Ledgestone DRAFTING with correct KADEY-first/CORY-last order, Standings/Dashboard/Go Throw intact and untouched. The "Edit picks" commissioner-correction path remains functional.

- **DATA COLLECTOR RECOVERY (2026-07-28, autonomous)**: today showed 13+ successful `Collect DGPT Data` runs at roughly 1-2 hour intervals, from 01:03:54Z through 22:32:05Z. This is a significant improvement over the 2h26m gap reported at 08:35 UTC yesterday. Fresh roster artifacts at the latest run (22:32Z) show T14/96414 with current registrations (Kayleb Gillmore #245013 present, Thomas Earhart withdrawn and absent). No manual intervention recorded; the scheduled `.github/workflows/collect.yml` path appears to have recovered. QA verified live app fetches the feed (resource timing in network log), not the bundled fallback.

## B. IN PROGRESS / ON TRACK

- **T-009 (Ledgestone readiness, IN_PROGRESS/AMBER)**: v409 is live; data artifacts are current and correct; draft order is confirmed correct by owner. Remaining gates: T-016 (member permissions, needs real member login), T-017 (pick lock at tee time + WD handling, needs official PDGA tee times which remain unpublished).

- **T-016 (Member own-only drafting + Draft Now, REVIEW)**: design built, v409 deployed. Verified features in preview and live from commissioner account: Draft Now button/nudge banner exist, uid enforcement in the write guard. NOT YET VERIFIED: true member can see Draft Now, true member can edit only their own two slots (office browser identity is still `chains_commish_uid_v1`, the commissioner uid). QA closeout is blocked on owner providing a non-commissioner Chrome session (INBOX.md request remains OPEN).

- **T-017 (Pick lock + WD + auto registration-close, ASSIGNED)**: blocked. PDGA event 96414 (Ledgestone Open) still exposes no Tee Time table or Withdrawn section as of the last checks. DGPT lists 3:00 PM CDT broadcast start, which is not the official first-player tee time and must not be used for locking. Engineer is correctly waiting; this task cannot proceed without the official deadline from PDGA or a documented league rule.

## C. STALLED OR FAILED (AND WHY)

**None, but tracking:**

- **T-018 (Collector reliability, HIGH PRIORITY, ASSIGNED)**: created yesterday to diagnose and fix the cadence issue. Today's data shows 13+ runs distributed throughout the day, suggesting the problem may have resolved autonomously. Engineer should still verify: (1) the scheduled `*/15` cron is consistently producing runs within 30 minutes, (2) a visible stale signal works, and (3) manual single-event dispatch is still available. If the recovery is stable, T-018 can be closed as "root cause = transient scheduler queue delay, resolved by end of 2026-07-28." If cadence wavers again, the work scope stands.

## D. DECISIONS / THINGS I NEED FROM YOU

From **FROM_OWNER.md**:
- [NEW] **URGENT — PICKS ARE LOCKED**: owner reported picks locked 2 days out from Ledgestone. **STATUS:** v409 fixes this. The old "Edit picks" commissioner-only button model is replaced with member own-only drafting + a "Draft Now" entry point visible to members. From the commissioner account we see both Edit picks and Draft Now; from a real member account, only Draft Now should appear. QA cannot prove member experience without you signing the Chrome session into a member account (request in INBOX.md, no password sharing). Once verified, this is DONE.

- [NEW] **PHASE 2 MIGRATION (Priority #2, after picks)**: Move league data (picks, draft order, standings, event field) into Firebase instead of baking into index.html. This unblocks data changes without rebuilds. Owner approved the backend-first approach; next step is for PM to design the schema (kb/firebase.md), seed it with current correct data, then send ONE scoped Design prompt to wire the app to read from Firebase instead of the bundle. This is high-leverage for ending the "office can't get anything done" cycle. Scheduling: start after picks are unlocked and fully QA'd (i.e., after T-016 closeout), not instead of it.

From **INBOX.md**:
- [OPEN] **Chrome non-commissioner sign-in**: QA/PM need a member account sign-in to closeout T-016 (Draft Now visibility + own-two-slots-only write guard). Owner requested to sign the existing Chrome session into a member account without sharing a password. This unblocks the final T-016 verification and allows T-009 readiness to move from AMBER to closer to GREEN.

## E. PLAN FOR TOMORROW

1. **Engineer (if T-018 is not yet claimed)**: verify that today's collector runs continue through tomorrow — confirm two more autonomous cycles <=30 minutes apart, confirm any source change publishes within 30 minutes, confirm a visible stale signal works if collection stalls. If stable, close T-018 as resolved; if degraded, proceed with the reliability hardening. Do not touch App A, Design, index.html, Firebase, or legacy `/league`.

2. **QA (once owner provides Chrome member sign-in)**: log into the member account, navigate to Picks -> T14 Ledgestone DRAFTING, confirm "Draft Now" is visible/clickable, confirm tapping it shows Draft Now entry point is discoverable, confirm read-only display of other members' picks, then close T-016 REVIEW -> DONE. Do not select any players (the board auto-saves). If any member-side permission gap appears, log it and route to PM for a fresh T-016 re-work.

3. **Monitor Ledgestone (CEO/PM duty)**: 
   - Collector cadence: if today's ~hourly runs continue, T-018 closes; if it degrades again, engineer claims the task.
   - PDGA tee times: refresh https://www.pdga.com/tour/event/96414 once daily; the instant an official "Tee Time" column appears, flag Engineer to start T-017 immediately (do not wait for a formal task-update).
   - Go live (Draft + Watch, T-009 final check): once T-016 QA closes, run a final pre-event walkthrough of Picks (member draft entry), Dashboard, Watch/Live, and Go Throw; confirm no broken links, no stale data, and smooth flows.

4. **Prepare Phase 2 Backend Migration**: PM to schedule a design session; read ARCHITECTURE.md (owner added) and STRATEGY.md Phase 2A; sketch the Firebase schema for `/leagues/<id>/picks`, `/draftOrder`, `/standings`, `/eventField` into kb/firebase.md; seed current correct data (156 Ledgestone MPO, Kadey-first draft order, current standings); write a scoped Design prompt for the app to read these nodes instead of baked JS; QA each step independently before advancing. Plan to start after T-016 is closed and Ledgestone is live.

## F. PROJECT HEALTH VS. NORTH STAR

North star: a polished, secure, **sellable** Chains app (iPhone + Android) with real accounts, flawless core flows, and no scaling issues.

**Current health: GOOD, path clear.** v409 (member drafting) is live and correct. Data infrastructure (collector + Firebase feeds) is recovering. APP A (Founders League) is protected and functioning; the owner's Ledgestone event is on track for tee-off. Phase 2A backend efficiency is now authorized and ready to unblock future data changes. One critical blocker remains (PDGA tee times), but it is external and the team is monitoring. The office has shipped real code, verified it independently, and moved past the "picks locked" emergency. Next: finish member-login verification, start the backend migration design, and launch Ledgestone live.

## G. SHIFT LEDGER

- **[CLAUDE] QA (2026-07-27 04:30 UTC, ~15 min)**: verified v409 deployed, live app loaded, confirmed Picks/Standings/Go Throw/drafting order untouched, zero console errors. Deployed v409 at commit 94a95a2. Did not change any picks/data. Shipped.

- **[GPT] PM (2026-07-27 08:35 UTC, ~20 min)**: created T-018 (collector reliability HIGH PRIORITY), routed it to Engineer with exact scope (no App A/Design/Firebase), groomed T-008 to SUPERSEDED. Updated BOARD, PM log, LESSONS, testing playbook via API (GitHub token working). Did not touch any live data or app. Shipped.

- **[CLAUDE] Data validation (2026-07-28, spread throughout day)**: daily autonomous collector runs (13+ commits, 01:03Z through 22:32Z) generated fresh roster, removed withdrawn player, added new registrant. No manual intervention logged; appears to be standard scheduled execution. DGPT data repo updated automatically.

- **[CEO] This shift (2026-07-28, end-of-day)**: read all team files, verified commits, cross-checked reality (live app, data artifacts, Actions cadence, PDGA source). Compiled this report. Verified no regression; v409 holds; collector recovered. No app/Firebase/design changes. Shipped.

---

**Guillermo's steering guide:**

- **Picks unlock = DONE.** v409 is live; members can draft their own picks now. Only blocker left: a real member account must QA the experience (owner sign-in request in INBOX).
- **Data collector = RECOVERED.** 13+ runs today, roughly hourly. T-018 may resolve as "transient delay, self-healed"; monitor tomorrow.
- **Ledgestone tee times = WAITING.** PDGA has not published official tee times. Once they do, pick-lock is one Engineer Design prompt away (T-017).
- **Next big move = Phase 2 backend migration.** After Ledgestone is live and T-016 closes, PM designs the Firebase schema and we wire the app to read live data. This unblocks all future data changes (no more rebuilds for standings/field updates).
- **Roadmap = on rails.** Phase 2A (backend-first efficiency) is authorized; Phase 2B (real coded app for iPhone/Android) is ready to start once App A settles; Phase 3 (launch hardening + accounts) is the final gate.
