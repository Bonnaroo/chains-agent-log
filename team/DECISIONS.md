# Decisions log (append-only — stop re-litigating settled choices)

- 2026-07-26 | ARCHITECTURE | The Chains app is built in Claude Design and ships as one index.html. There is no
  hand-written source, no branches, no PRs, no CI. "Engineering" = prompt Claude Design + deploy the built HTML;
  "QA" = exercise the built app + Firebase. (Owner decision, this session.)
- 2026-07-26 | OFFICE | Office repo = Bonnaroo/chains-agent-log (team/ folder). App deploy repo = Bonnaroo/chains-app.
- 2026-07-26 | BETTING | All betting/money UI removed in v402 and stays removed. Modules may remain dormant; nothing visible.
- 2026-07-26 | WAITLIST | Marketing-site waitlist writes signups into Firebase /waitlist via anonymous auth (no Formspree/third-party).
- 2026-07-26 | SCORING | League scoring: finishes pay 6->1, competition ranking for ties; season standings cumulative. Verified correct — do not change without flagging.
- 2026-07-26 | OFF-LIMITS | The chains-fantasy project's /league node (live 6-friend league) is never read/written/deleted by the team.
- 2026-07-26 | PHASE 2 | Owner superseded the July 29 gate: Phase 2 is GO now, beginning backend-first. Dynamic
  event/field/registration/standings/results data moves out of the bundled app; Design is for genuine UI changes.
  APP A remains protected and App B/public deployment still requires separation, verification, and owner approval.
- 2026-07-26 18:15 UTC | [GPT] | ATTRIBUTION | Two AIs share the office. Every new lock, commit, BOARD note,
  role-log entry, handoff, lesson, decision, and owner update must identify the actual worker as `[GPT]` or
  `[CLAUDE]`. Both workers must read and reuse the other's verified findings and document detailed evidence.
