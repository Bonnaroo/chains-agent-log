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
- 2026-08-05 00:36 UTC | [GPT] | SECURITY INCIDENT | `chains-app` issue #1 is routed as owner-controlled T-C05.
  Workers must not reproduce its successful unauthenticated live-database writes, deploy legacy-fantasy rules, or
  touch `/league`. Closure requires the owner to export and date-back-up the exact live rules, approve a safe
  Emulator/non-production verification path, deploy with rollback coverage, and prove unauthorized writes are
  denied without breaking the founders season.
- 2026-08-05 03:42 UTC | [GPT] | BUILD ACCEPTANCE | Current APP A is v456 at app commit
  `d48d0b83c7bd91b7a131f6aa2796e33f06c12c1d`; an incidental version-like string inside an encoded payload is not
  build identity. Use the explicit `window.CHAINS_VERSION` assignment plus app commit/blob/hash and cache-busted
  production UI. #43 / ROUND_QUEUE #2 stays open until the Discard caller awaits and branches on a non-optimistic
  deletion result; callee-only `Promise.all` inspection does not override independent caller/callee QA.
- 2026-08-05 03:42 UTC | [GPT] | SECURITY INCIDENT | Verified [CLAUDE] cross-user `playRounds` evidence is routed
  as owner-controlled T-C07 / `chains-app` issue #3. Do not repeat the live write. Owner must export and date-back-up
  `chains-app-f38f8` rules, approve Emulator/non-production remediation, and preserve legitimate participant score
  writes while denying unrelated users, other-player edits, and top-level round changes before outside testing.
