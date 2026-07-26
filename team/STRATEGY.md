# STRATEGY — where Chains is going (CEO owns this; the team aims at it)

North star (owner's goal): a polished, secure, SELLABLE Chains app on iPhone + Android, with real email/password
accounts, that works flawlessly and scales without issues.

## THE APPS (keep these straight — do not muddle them)
- APP A — "Chains, Founders League" (LIVE, do not disrupt): the current HTML app. Repo Bonnaroo/chains-app,
  Firebase chains-app-f38f8. Guillermo + his 6 friends use this for the WHOLE current season. Changes here are
  polish only, and must never break their season or their data. This is also our REFERENCE design.
- APP B — "Chains, Public" (FUTURE, the commercial product): a SEPARATE app with its OWN repo and its OWN Firebase
  project (owner must create the new Firebase project when we get there). Real email/password sign-up + accounts.
  LEAGUE-OPTIONAL: a user can sign up and use Go Throw, Watch / Live Chains, videos, and Settings WITHOUT joining
  or running a league — the league is one mode, not a requirement. This is what we polish -> code natively -> launch.
- COUNCIL — "Chains Admin" (back office, owner-only): a SEPARATE small app/dashboard (its own page/repo, not inside
  the product). Read metrics (accounts, leagues, players, rounds, waitlist, issues) and manage (create/remove
  leagues, open/close accounts, help a stuck user look up their login). Points at App B's data (can preview against
  App A now). Read-only first; management actions added later with proper owner-only auth.

## PHASES
- PHASE 1 — NOW (a few days): polish APP A in Claude Design until it truly works — every feature solid, no
  dead-ends, backend clean. Build the Council dashboard v1 (read-only metrics) early; it's useful and low-risk.
  Get the design RIGHT here because App B forks from it.
- PHASE 2 — starts ~2026-07-29 (NOT before; owner gated it "a few days"): graduate to a REAL coded app. Standard
  path: one codebase (React + Capacitor) that ships to web + iPhone + Android, reusing Firebase. This is where real
  branches / pull-requests / CI / automated tests actually apply. Fork App B (public, league-optional, real
  accounts) from the polished App A design. Owner still steers + tests (via TestFlight/preview builds); he just
  won't hand-build in Claude Design anymore.
- PHASE 3 — launch hardening: real accounts + security pass, Council management actions, app-store submission.

## WHAT ONLY THE OWNER CAN PROVIDE (CEO flags these in TO_OWNER.md when each is needed — not yet)
- A new Firebase project for App B (Google account / Firebase console).
- Apple Developer Program ($99/yr) + Google Play Console ($25 one-time) for store submission.
- A privacy policy + store listing assets (marketing role can draft copy; owner publishes).

## HARD GATE
Do NOT begin the Phase 2 coding rebuild before 2026-07-29. Until then, all engineering is Claude-Design polish on App A.

## UPDATE 2026-07-26 — owner wants agents to work "virtually" (no browser) and may bring Phase 2 forward
The browser-driving overhead is the owner's pain point. Moving to a real codebase is what removes it (agents
edit real code + use real git instead of clicking a browser). Owner is open to starting the code path SOONER.
BLOCKER / OWNER DECISION NEEDED (flag in TO_OWNER.md): to let scheduled agents work on code WITHOUT the browser,
the team needs a non-browser way to write to GitHub — i.e. a GitHub access token / connected GitHub integration
(there is currently no git CLI or credentials in the agent environment; all writes go through the browser).
Options for the owner: (a) generate a GitHub personal access token for the team to use, or (b) connect a GitHub
integration/MCP. Once that exists, we can scaffold the real app (React + Capacitor, reuse Firebase) in a new
repo and the team works in code, browser-free. Until the owner provides that access, keep the 2026-07-29 gate and
keep polishing App A in Claude Design. Do NOT start the code rebuild until the access method is in place.
