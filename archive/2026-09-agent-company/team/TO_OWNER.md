# TO OWNER — 2026-08-10 22:04 UTC [GPT] SHIFT

## MATERIAL ALERT — T16 BACKEND STILL RED; CADENCE ALSO DEGRADED

- [GPT] verified two more scheduled collector runs after data issue #1 was filed. Run #774 (20:58 UTC, base `a8d526a`) generated `dbaf541f2bd752755fbaee32fd4393d55caa101d`; run #775 (21:42 UTC, base `dbaf541`) generated `5b852413b741ee7bfa6834f62b09c681832effe7`.
- Latest `data/field.json` blob `6d81a731ec1f6a1a30db2781904fbca0b487abf0`, updated `2026-08-10T21:43:14.399642+00:00`, still says `No upcoming event found.` with zero players; `data/events/96416-MPO.json` is still absent. The season/fallback/event-list source blobs remain unchanged.
- The workflow is configured for every 15 minutes, but the last two gaps were about 57 and 44 minutes. [GPT] added immutable run/base/generated evidence to https://github.com/Bonnaroo/chains-dgpt-data/issues/1 and marked cadence degraded under the team's existing two-missed-interval rule.
- Cache-busted production still loads current standings and the Aug 14–16 Preserve card with Picks open, but it explicitly reports v469 while main is still titled v475. That does not override either RED gate.

## NEXT ACTION / OWNER NEED

- Data should apply the issue's existing three-file 96416 repair now, manually dispatch once, verify both artifacts, then prove a later scheduled run preserves them and whether the 15-minute freshness target resumes. QA owns PDGA-number-set and live Registered/Picks reconciliation.
- No new owner decision is required for that repair. Existing owner-controlled rules backups, Emulator/non-production allow-deny authority, and rollback remain required before outside testers for app issues #1/#3/#4/#5/#9.

## SAFETY

- [GPT] changed one comment on data issue #1 and shared-office Markdown only. No app, Design project, collector file, workflow, Firebase node/rule, user, pick, score, round, deployment, deletion, backup, or legacy `chains-fantasy /league` data changed.

---

# TO OWNER — 2026-08-10 21:05 UTC [GPT] SHIFT

## MATERIAL ALERT — T16 READINESS IS RED

- [GPT] found the exact backend cause and filed https://github.com/Bonnaroo/chains-dgpt-data/issues/1: the live collector's `season.json` and fallback end at T15, while `events.txt` ends at T14. The workflow is running; it simply has no T16/96416 configuration. Data owns the three-file repair, manual 96416 dispatch, roster proof, and next scheduled-run recurrence check.
- Preserve begins Aug 14. Official PDGA event `96416` currently lists 156 total / 112 MPO, but the production data repository's fresh `field.json` says `No upcoming event found` and contains zero players. Data/QA own the repair and independent roster check; do not rely on the dashboard's `PICKS OPEN` label.
- GitHub main is titled v475, while a cache-busted live load explicitly shows v469 and current `index.html`/`test.html` blobs differ. [GPT] filed https://github.com/Bonnaroo/chains-app/issues/10 with immutable close evidence. Engineer/QA must restore exact Design → stage → main → live lineage; nobody should hand-edit deployed `index.html`.
- The app now has nine open issues. Existing cleanup-backed security/account findings #1, #3, #4, #5, and #9 block outside testers. Do not repeat their live probes.

## OWNER ACTION — SECURITY BACKUPS / TEST AUTHORITY

- Export dated copies of the exact current Firebase rules and relevant approved account-boundary data before any rule or migration change. Approve an Emulator/non-production allow-deny regression path and rollback.
- Keep outside testers paused until the security issues have owner-controlled backup, non-production remediation evidence, and independent regression. Do not send credentials into office files.
- No owner decision is required for the current Data/QA event-feed repair or issue #10 lineage verification; those are routed team actions.

## CURRENT VERIFIED EVIDENCE

- PDGA: https://www.pdga.com/tour/event/96416 — Aug 14–16, Clearwater; 156 total / 112 MPO; updated `10-Aug-2026 07:02:02 CDT`.
- DGPT: https://www.dgpt.com/event/2026-dgpt-doubles-championship-at-the-preserve/ — two best-shot rounds, then alternate shot.
- Data: `chains-dgpt-data/data/field.json` blob `c1d121ae8a676dee42d6e4c92f3a38cf16bf463f`; null event, zero players, updated `2026-08-10T19:14:24.067382+00:00`.
- Release: main `7c1f1125f1a24bdec94de43f6443d3c9cf286b28` says v475; cache-busted production reports v469; issue #10 is open.
- Safety: [GPT] changed only issue #10 and shared-office Markdown. No app, Design, Firebase, picks, rounds, users, rules, deployment, deletion, backup, or legacy `/league` data changed.

---

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
