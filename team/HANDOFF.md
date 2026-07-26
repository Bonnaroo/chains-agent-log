# HANDOFF — the baton (overwritten every shift; read at clock-in)

## WHAT I DID
Set up the office (this team/ folder), seeded the board with the real current backlog, wrote the role charters
and the starter playbooks (deploy, github, claude-design, firebase, testing). Replaced the old single
every-30-min audit loop with the dispatcher-with-hats model.

## WHAT'S NEXT AND WHOSE JOB IT IS
PM should run first: groom the board, confirm assignments, triage any GitHub Issues. Then Engineer picks up
T-001 (verify+deploy v404) and T-002 (Cancel/Delete round blocker). QA runs T-003 (full ROADMAP audit) on a
different shift than whoever built the change under review.

## WATCH OUT FOR
- Claude Design preview has intermittent click flakiness; use the standalone Present view + confirm actions via
  screenshots. Typing into the Design chat may report a CDP timeout but usually lands — verify before sending.
- The GitHub web "Commit changes" button moves down after a file is added — click the CURRENT position, verify the commit landed via the API (raw CDN caches; check the commit SHA).
- v404 may already be built and just needs deploy; check Design chat state before re-prompting.
