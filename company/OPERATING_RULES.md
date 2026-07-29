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
