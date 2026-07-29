# Chains — Operating Rules

1. GitHub Issues in this repo (chains-agent-log) are the ONE queue. No task exists unless it's an Issue.
2. Only one Issue may be `status:building` at a time (see company/BUILD_LOCK.json). Dispatcher enforces this.
3. Every run of every role starts by reading, in order: company/team.md, company/routing.md,
   company/DECISION_POLICY.md, the relevant company/playbooks/*.md, and its own company/agents/<role>/history.md.
   It does NOT read the full company/LESSONS_LEARNED.md every run — that file is for auditing and for R&D
   promoting lessons into playbooks, not routine reading.
4. Every run ends by: updating the Issue(s) it touched, appending a short structured note to its own
   company/agents/<role>/history.md (what happened, evidence, next responsible role), and — only if something
   went wrong, took unusual effort, or Guillermo had to step in — appending a raw entry to
   company/LESSONS_LEARNED.md.
5. A lesson is only promoted into a playbook after the fix has been verified working in production at least
   once. This is a deliberate, separate step — never automatic, never done by the same run that just tried the
   fix for the first time.
6. Watcher never writes app code or Firebase data (except its own daily backup file, which is additive, never
   overwrites live nodes). It only files findings as Issues.
7. Dispatcher never builds. It only manages the queue: intake, dedupe (via fingerprint), prioritize, mark
   ready/blocked, run the weekly self-directed product review, write the owner report.
8. Engineer is the only role permitted to change the live app, and only in a live, connected Chrome session
   (cannot run unattended — no browser, no build). Tier-3 decisions (see DECISION_POLICY.md) always stop and
   wait for Guillermo regardless of queue priority.
9. Deletes of production data always go to `_trash/<timestamp>` first. Never a hard delete.
10. If the same mistake, blocker, or false alarm shows up twice in company/LESSONS_LEARNED.md, that's a
    standing signal the relevant playbook is wrong or missing — fix the playbook, don't just log it a third time.


11. BACKEND/FIREBASE CHANGES ARE NOT "DONE" JUST BECAUSE A FILE WAS COMMITTED. Committing a rules file, a schema
    doc, or a config file to a GitHub repo changes nothing live — Firebase rules only take effect once actually
    published to the real project (via Firebase CLI + admin credentials, or pasted into the Firebase Console by
    a human). Before ANY backend/security Issue is marked done, run an actual live probe: sign in anonymously
    with the public API key (the same way a real attacker could) and confirm reads that should be blocked
    actually return 401/403. This incident happened for real on 2026-07-29 — Issue #2 (Firebase security
    hardening) was marked resolved after only committing files, while the live database remained completely
    open to any anonymous user. See company/LESSONS_LEARNED.md and Issue #2's comment history for the full
    incident. No current token/credential setup can actually publish Firebase rules (only a public web API key
    exists, not an admin service account) — until that's resolved, backend/Firebase changes of this kind require
    the owner to either generate a service account key or manually publish rules in the Firebase Console
    themselves. Retag such Issues "[needs-owner-decision]" rather than "[ready-for-build]" until that's true.
