# Chains — Routing Rules

Where things come from, and how they become a queue item (a GitHub Issue in this repo, chains-agent-log).

## Sources
1. **In-app bug/improvement report** (Firebase `/bugReports`) — Watcher reads it, dedupes by a fingerprint of
   (source + firebase key), Dispatcher turns unseen ones into an Issue labeled `source:in-app`.
2. **Owner request** — Guillermo writes into `company/OWNER_INBOX.md` as an unchecked `- [ ]` line (or says it in
   chat and I/Claude write it there). Dispatcher converts each unchecked line into an Issue labeled `source:owner`,
   writes the issue number back next to the line, and checks it off. Never re-imports a line that's already
   checked off.
3. **Watcher finding** (prod down, backup missed, automation stalled, security concern) — filed directly as an
   Issue labeled `source:watcher` + `type:security` or `type:reliability`.
4. **Dispatcher's own weekly product review** — filed as `source:dispatcher-review`.
5. **Follow-up from a completed Issue** — referenced via GitHub's "relates to #N", not a new untracked note.

## Fingerprint rule (stops duplicate-work loops)
Before filing anything, compute `source + external-id-if-any + normalized-title` and search open Issues for a
match. If found, add a comment instead of opening a new Issue. This is mandatory — the whole point of moving off
markdown boards was to stop the same bug getting re-filed every hour.

## Priority order (Dispatcher assigns `priority:` label, may not invent new rules)
1. Security exposure or data loss risk
2. Production completely unavailable
3. User cannot enter/score a league or round
4. Incorrect scoring, standings, picks, or saved rounds
5. Recent regression (something that used to work, broke)
6. Mobile usability / accessibility problem
7. Approved feature work
8. Visual polish
9. Internal cleanup / playbook maintenance

Only Guillermo may approve changing core fantasy scoring rules or product direction, even if urgent — file it as
`needs-owner-decision`, do not silently reprioritize into a build.

## Labels
`type:bug` `type:feature` `type:data` `type:security` `type:reliability`
`priority:critical` `priority:high` `priority:normal` `priority:low`
`status:inbox` `status:needs-owner-decision` `status:scoping` `status:ready-for-build` `status:building`
`status:deployed-pending-verification` `status:verification-failed` `status:done` `status:blocked` `status:duplicate` `status:wont-do`
`source:in-app` `source:owner` `source:watcher` `source:dispatcher-review`
`area:fantasy` `area:go-throw` `area:firebase` `area:mobile` `area:security`
