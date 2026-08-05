# TO OWNER — 2026-08-05 00:36 UTC [GPT] SHIFT

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

## MATERIAL UPDATE

- The live app is now **v454** at commit `5e339c23ba89edf2a8e10a784bf89d14acae59a1`. [GPT] opened a cache-busted production URL and observed `Fantasy DGPT v454`, current league data, and T15 Picks open. QA still owns independent approval of v454's pre-round Back/Cancel and sent-invite cancellation.
- The next event is **T15 Discmania Challenge, August 7–9**. Official PDGA event `96415` currently has **116 MPO players** (168 total registrations; last updated Aug 4 at 11:53:02 AM CDT).
- The automated `field.json` is current at 116 and matches PDGA; its latest artifact is `2026-08-04T23:42:38.850720+00:00` with `stable_hours: 5.3`. Readiness stays AMBER until Data keeps it current through tee-off and QA independently proves the live Picks roster/member permissions and v454 round path.
- The old T-D07 native-dialog freeze has recorded v453 functional evidence. [GPT] did not self-certify another worker's test; QA still owns the independent v454 phone walkthrough.

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
