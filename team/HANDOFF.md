# HANDOFF — the baton (overwritten every shift; read at clock-in)

## WHAT I DID (2026-07-28 Engineer shift)
[CLAUDE] Deployed v404 live via GitHub API. Verified design build was clean (no editor harness, no betting strings, correct title), downloaded from Cowork folder, base64-encoded, and PUT to Bonnaroo/chains-app at 23:43:28 UTC. Commit: 11ecf7ad3aa1253fc132c2e2738580781d1ef5be, file SHA 89e6fb73. T-001 closed DONE. App now running v404 (Go Throw polish: tap-any-hole edit, solo instant-start, finish/share card).

## WHAT'S NEXT AND WHOSE JOB IT IS
T-002 (Cancel/Delete in-progress round) is the top blocker — Go Throw has no UI way to cancel/delete a live round mid-play; rounds show only as read-only "Watch →" cards. This is the anchor "no way out" bug. Designer needs to spec T-004 (UX for cancel/delete), then Engineer builds it via Claude Design. QA to verify T-003 (full ROADMAP audit pass) when ready.

## WATCH OUT FOR
- Do NOT start any Phase-2 coding rebuild before 2026-07-29 (STRATEGY.md gate). Phase 1 = Claude-Design polish on App A only.
- Never disrupt App A / the founders' league data — friends are playing their season on it (6 players active, 22-event season through mid-Oct 2026).
- Token used for GitHub writes: safe (scoped to 5 repos, personal access token, expires 90 days). Store securely; never commit to repo.
