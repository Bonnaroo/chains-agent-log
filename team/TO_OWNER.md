# TO OWNER — 2026-08-05 03:42 UTC [GPT] SHIFT

## NEW OWNER ACTION — APP ROUND SECURITY

- [GPT] filed `chains-app` issue #3 from verified [CLAUDE] evidence: a signed-in member could add a disposable field to another member's `playRounds/{id}` record (HTTP 200). Claude removed only the probe field and verified it null; GPT did not repeat the live write or expose credentials in the issue.
- **What you need to do:** export and date-back-up the exact current `chains-app-f38f8` rules, then approve an Emulator/non-production remediation plan. Top-level round fields must become owner-only while legitimate participants retain only their authorized score subtree. Do not send credentials into office files.
- Until backup, offline review, allow/deny regression testing, deployment/rollback coverage, and independent round-lifecycle QA exist, issue #3 blocks outside testers. No worker should repeat the live probe or deploy rules.

## CURRENT LIVE BUILD CORRECTION

- Live and app main are v456 at commit `d48d0b83c7bd91b7a131f6aa2796e33f06c12c1d`; `index.html` and `test.html` match at SHA-256 `C5AE3BE195536B2740F9B4E4B59A6C166EDF56BF096E6B205F785E564DF3F4F3`.
- The newest Claude company log called the build v476 and #43 closed. GPT found contrary immutable evidence: the explicit version assignment is v456; the `v476` match came from encoded payload text. The v456 Discard caller still fires deletion, clears local state, and exits without awaiting or branching on the result; the callee can still return optimistic `true` after eight seconds. T-C04/#43 therefore remains open.
- Production still loads current league data and T15 Picks open. T15 remains 116 MPO in both `field.json` and current PDGA registration, but readiness is AMBER for the discard contract, issue #3, member pick permissions, duplicate round cards, missing per-event JSON, unsettled roster, and missing first-player tee-time proof.

## CRITICAL OWNER ACTION — FIREBASE RULES EXPOSURE

- Open `chains-app` issue #1 contains detailed Auditor evidence that unauthenticated REST clients could write and delete disposable paths in `chains-fantasy-default-rtdb`, including a nested test under `/picks/2099`. The Auditor removed every probe and verified null; it explicitly did not touch `/league`. [GPT] did not repeat the live probe or access that database.
- **What you need to do:** export the exact current Firebase rules from the console and save a dated backup before any change. Then provide an owner-controlled deployment/test path so the rules can deny unauthenticated writes without breaking the founders season. Do not send passwords or service credentials into office files.
- Until that exists, `T-C05` is blocked on owner and no worker is authorized to run another live write probe, deploy rules, or touch legacy `chains-fantasy /league`. Evidence: https://github.com/Bonnaroo/chains-app/issues/1.

## PROACTIVE BUG ROUTING

- `chains-app` issue #2 is now `T-C06`: league-code regenerate/revoke can swallow Firebase promise failures and leave a code usable while the commissioner sees no error. PM/Engineer/QA must fix it in the authoritative Design source, surface retry messaging, and test both success and failure. No deployed-file-only patch is allowed.
- The browser-optional scheduled loop is now proven: when Design was busy, it completed a backend regression/silent-failure pass and filed issue #2 instead of clocking out blocked. `T-C03` is complete and remains a standing supervision rule.

## T-C02 SCALE BRIEF COMPLETED

- **Recommended now:** keep the six-person live APP A on Realtime Database for the season, but close the broad authenticated `/playRounds` write before any outside tester and prove cross-user/cross-league denies.
- **Recommended for future APP B:** Firestore for durable, queryable user/league/event/pick/round data; add RTDB only if measured presence or high-frequency live-round sync justifies a second database.
- **Why:** this avoids a risky season-time migration while giving the public product non-cascading tenant rules, compound queries, automatic scale, and regional/multi-region options. Permanent dual-write is not recommended.
- **Owner decisions before APP B implementation:** approve the Firestore-first direction, set backup RPO/RTO and retention, and choose region/multi-region plus a monthly budget guardrail. No action is required today; the full source-backed options and risks are in `team/STRATEGY.md` under `T-C02 OPTIONS BRIEF`.

## PRIOR 00:36 CONTEXT — SUPERSEDED BY THE CURRENT LIVE BUILD CORRECTION ABOVE

- T15 remains Discmania Challenge, August 7–9, event `96415`, with 116 MPO / 168 total on PDGA.
- `field.json` still matches at 116, updated `2026-08-05T01:04:52.730048+00:00`, `stable_hours: 6.7`; Data must keep it current through tee-off.
- v454/v455 notes below this point are retained only as shift history. Current main/live and the open discard contract are the v456 facts at the top of this file.

## YOUR BACKUP + SCALE REQUEST IS ROUTED

- `T-C01` sends recurring, retrievable Firebase backups to Data with retention, restore instructions, and a restore drill.
- `T-C02` is complete in STRATEGY; it is planning only, not a rushed migration or parallel app.
- `T-C03` is complete: a blocked primary browser task now has a proven backend fallback with a visible artifact.

Owner action is required only for the T-C05 Firebase rules incident above. The event-readiness watch items are the moving roster, missing `96415-MPO.json`, regular-member own-picks-only proof, v454 independent QA, and the official first-player tee time before any pick-lock decision.

---

# HISTORICAL OWNER NOTE — 2026-07-29 22:32 UTC SHIFT

## ✅ LEDGESTONE IS PLAYABLE — v413 LIVE & WORKING

Event starts tomorrow (~19:30 UTC). Members can draft, play, and access all core features. Owner verified live app is working correctly.

**Two decisions needed:**

1. **T-D07 (Discard hang):** Fix now (risky, 1–2 hrs mid-event) or accept workaround (members close/reopen app, safer)? Bug documented on BOARD_DESIGN.md.

2. **T-D14 (Edit picks unlock):** Fix now (30–60 min rebuild) or defer post-event? Permission not properly gated; 6+ shift escalation threshold hit.

→ **Full details in team/REPORT.md (daily report)**

---

## CONFIRMED GOOD (DO NOT REGRESS)
- v413 deployed, live, and working
- Picks unlock functional (owner verified)
- WATCH feature correct
- Settings correct
- Data layer 100% healthy
- Ledgestone roster 156 MPO (PDGA-verified, locked)

---

## FALSE ALARM CORRECTED
Previous shift escalated "app initialization hang blocking all member access" based on log inference. Owner checked live app directly and confirmed it works. Do not escalate without testing live.
