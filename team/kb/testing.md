# PLAYBOOK: How to "test" Chains (no unit tests — this is human-style QA)
There is no automated test suite. To verify a change or audit the app:
1. Open the built app (Design Present view for an unreleased build, or bonnaroo.github.io/chains-app for live).
2. Walk the FEATURE CHECKLIST in team/ROADMAP.md, exercising each screen + every clickable control.
3. Judge each against the 6 ROADMAP principles: WAY OUT (back/cancel/close on every action, esp. in-progress +
   destructive), DATA SURVIVES refresh, TRUTH OF DATA (pick lists = real registered players / real event field),
   SECURITY (auth, own-data-only, input validation), LIVE UPDATES refresh, ADVERSARIAL (run 2 edge/exploit cases).
4. For dynamic event-field readiness, verify all three layers instead of trusting a bundled fallback:
   - collector: active PDGA ID exists in `chains-dgpt-data/collect_field.py` and the event list;
   - artifact: `data/field.json` has a fresh `updated_at`, exact `event_id`, expected `player_count`, and players;
   - recurrence: after a repair is manually proven, require the next genuine schedule-triggered workflow run;
     record run ID, base SHA, generated data SHA, and validate artifacts at that immutable generated commit;
   - cadence: a single scheduled run proves the path can fire, not that the configured cron is meeting freshness.
     Compare the latest scheduled run with the configured interval; after two missed intervals, mark cadence
     degraded, keep event readiness amber, and route a backstop/alert with an explicit freshness target;
   - backstop boundary: before reusing an existing worker, verify its source, sink, credentials, and protected-data
     boundary. In particular, `chains-poller` is a live-score/Firebase worker, not a drop-in public field collector;
     do not point it at legacy `chains-fantasy` or repurpose it without an explicitly safe sink and authorization;
   - stale-roster backstop: if a fresh primary-source diff proves the field is wrong and the scheduled workflow is
     overdue, manually dispatch `Collect DGPT Data` with the single PDGA event ID. Verify all workflow steps,
     generated commit, `field.json`, and `data/events/<event>-MPO.json`; call the roster repaired, but keep
     recurrence amber until the next genuine `schedule` run preserves the correction;
   - roster reconciliation: compare PDGA-number sets. Report named/draftable players separately from registration
     placeholders such as `Sunday Qualifier`; a 154-player feed can exactly cover a 156-slot field with two TBDs;
   - UI: the live Registered list consumes that artifact and matches the primary PDGA event page one-for-one.
5. For pick-lock readiness, source the deadline from the earliest official player tee time in the PDGA event
   tee-time table. A DGPT broadcast start is not first tee. If the official tee-time table is absent, keep the gate
   amber, record the source check, and recheck later rather than guessing or approving a lock.
6. Watch the browser console for errors on each screen (read_console_messages).
7. Check Firebase (kb/firebase.md) for lost/duplicated/orphan records after the flow.
8. Record PASS/FAIL with a concrete repro. A task is only DONE when its "done when" is met against the real app.

## Protected live-delete verification — 2026-08-05 [GPT]

Before exercising Delete/Discard against APP A, compare the immutable base/head handlers and trace the full caller
plus callee promise contract. Call presence is not acceptance: the caller must await/return the delete promise,
inspect its real success/failure result, keep failure visible, and avoid clearing local state or navigating away
first. A callee that races a success timeout against pending writes is not confirmed deletion. If source fails this
contract, record a non-destructive QA FAIL and do not mutate live records. After the source contract passes, create
a new test-only record, back it up to `_trash/<timestamp>` before deletion, exercise the real UI, reload, and verify
every documented store is absent. Never use an existing member round as the destructive test fixture and never
touch legacy `chains-fantasy /league`.
