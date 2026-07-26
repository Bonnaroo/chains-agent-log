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
   - UI: the live Registered list consumes that artifact and matches the primary PDGA event page one-for-one.
5. Watch the browser console for errors on each screen (read_console_messages).
6. Check Firebase (kb/firebase.md) for lost/duplicated/orphan records after the flow.
7. Record PASS/FAIL with a concrete repro. A task is only DONE when its "done when" is met against the real app.
