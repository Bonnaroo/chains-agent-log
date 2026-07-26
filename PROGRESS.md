# Chains — Agent PROGRESS (the brain)

Single source of truth for the Chains launch-hardening agent. Read FIRST every run, rewrite LAST.
Companion spec: ROADMAP.md (how the app SHOULD work — audit reality against it).
Raw: https://raw.githubusercontent.com/Bonnaroo/chains-agent-log/main/PROGRESS.md
Write protocol: edit local copy (C:\Users\18108\Cowork Design Folder\Chains Fantasy DGPT\PROGRESS.md), then
upload-replace at https://github.com/Bonnaroo/chains-agent-log/upload/main (NEVER the inline editor).
Reconcile by newest RUN LOG timestamp.

## MISSION
Get Chains launch-ready: a secure fantasy disc-golf league app + Go Throw round tracking, with as few bugs
as possible and NO dead-ends. Audit the app against ROADMAP.md every run, find bugs / trap-states / exploits
via thought experiments, and fix them top-down. See ROADMAP.md for the 6 principles and full feature spec.

## NEEDS HUMAN INPUT (Guillermo) — check first, never spin; keep this as empty as possible
- (none blocking right now — the agent is unblocked. Waitlist no longer needs Formspree; course data paused.)
- FYI/optional: waitlist signups now land in Firebase /waitlist (chains-app-f38f8). Guillermo can view them
  anytime; agent can report the count on request or build a tiny admin view later.

## LAST SESSION SUMMARY (2026-07-26)
Live app v403 (betting removed, Go Throw scoring overhaul); v404 (Go Throw polish) building in Design.
Marketing site live at bonnaroo.github.io/chains-site (waitlist-only; waitlist now self-collects into
Firebase /waitlist — no Formspree/account needed). Course expansion paused. Cleared 3 stuck "open" test
rounds + test data from Firebase (backed up to _trash/1785076527527) — but the REAL fix (a UI way to
cancel/delete an in-progress round) is now the top backlog blocker. Adopted ROADMAP.md as the audit spec and
switched the scheduled task to a launch-hardening adversarial audit engine.

## FEATURE CHECKLIST (walk every run against ROADMAP.md; log defects to BACKLOG by severity; note console errors)
Screens: [ ] Sign-in/identity  [ ] Dashboard  [ ] The Picks/Draft  [ ] Standings  [ ] Live Chains  [ ] Watch
[ ] Go Throw home  [ ] Start-a-round→Pick Course→Who's Playing→Score (solo instant-start)  [ ] Plan+Invite
[ ] Scoring screen (blank-until-entered, persistent scorecard, tap-any-hole edit, next-gating)  [ ] Finish+share
[ ] In the Bag  [ ] Settings  [ ] Mobile/responsive
Cross-cutting (apply to EVERY screen/button):
[ ] WAY OUT — back/cancel/close/undo exists and is reachable (esp. in-progress + destructive actions)
[ ] DATA SURVIVES refresh/re-login; nothing lost/duplicated; no stuck/ghost records
[ ] TRUTH OF DATA — pick lists come from real registered players / real event field (verify pro field vs PDGA/DGPT)
[ ] SECURITY — auth required; user only sees/edits own data; Firebase rules sane; input validated
[ ] LIVE UPDATES actually refresh (Live Chains / Watch)
[ ] ADVERSARIAL — run 1-2 edge-case/exploit thought experiments (see ROADMAP catalog) and log findings

## BACKLOG (fix blockers → majors → minors; each fix: build via Design, re-test that flow + one adjacent flow, deploy)
### Blockers
- CANCEL/DELETE IN-PROGRESS ROUND: Go Throw has no UI control to cancel/abandon a live (open) round, and
  live rounds show only as "Watch →" cards that can't be opened to delete. Build a reachable Cancel Round
  (mid-play, with confirm) and ensure Delete Round works for finished rounds too. This is the anchor
  "no way out" bug — principle 1/2 in ROADMAP.
### Majors
- B1 (BUILDING as v404) Go Throw polish: tap-any-hole edit, solo instant-start, finish/share card. Verify+deploy.
- REAL ACCOUNTS for launch: replace test-mode name-pick with email/password sign-up + login, session
  persistence, logout, password reset. (Enable Firebase Email/Password auth path in the app.)
- TRUTH-OF-DATA picks: draft pool = real registered league members / real event field; pre-tournament
  cross-check the pickable pro list against PDGA/DGPT and flag mismatches.
- ESCAPE-HATCH SWEEP: audit every screen/button for a Way Out per principle 1; file each missing one.
- SECURITY PASS: review Firebase rules (own-data-only, league-scoped, no world-write) + input validation.
### Minors
- (add from checklist walkthroughs)

## IDEAS (only when BACKLOG empty; ONE per run; never anything needing a design decision — move those to NEEDS HUMAN INPUT)
- My Rounds + personal stats (history list; per-course PR/average/count; friend leaderboard).
- First-run/sellability polish (empty states, first-run explainer, Settings name/avatar/units).
- Tiny in-app admin view of the /waitlist signups.

## DO-NOT-TOUCH (confirmed working; propose + flag before changing, never silently refactor)
- Betting/money REMOVAL (v402) — stays removed.
- League pick scoring + season standings math (verified correct) — don't alter the math without flagging.
- chains-fantasy Firebase project's /league node (live 6-friend league) — NEVER read/write/delete.
- Back up to _trash/<Date.now()> before ANY delete in chains-app-f38f8.
- Deploy flow (Downloads → verify clean → upload to Bonnaroo/chains-app as index.html).

## OPERATING RULES
- One build per run. Don't interrupt a mid-build Design; health-check and exit, next run verifies.
- Usage-limit banner in Design → log and exit; retry next run.
- Deploy only builds that pass the relevant checklist items with no console errors.
- Concurrency: if CURRENT RUN claim is <45 min old, stand down.
- Chrome outage: after 1 failed retry increment counter; at 3 consecutive, auto-pause (enabled:false) + flag.

## CURRENT RUN
CLAIMED 2026-07-26 14:47 UTC | scheduled run "chains-go-throw-loop" | verifying/deploying v404, then Cancel-Round blocker build.

## CHROME OUTAGE
consecutive_failures: 0 | last_failure: none

## NEXT RUN STARTS WITH
Check if Design finished v404 (Go Throw polish). If yes: verify tap-any-hole edit / solo instant-start /
finish-share against the checklist, then deploy. THEN start the top BLOCKER: send Design a scoped prompt to
add a Cancel Round control (reachable mid-play, with confirm) + make live/open rounds openable so they can be
cancelled/deleted. If Design is mid-build: health-check + exit.

## RUN LOG (newest first — date time UTC | did (commit) | tested | next; keep ~30 entries)
2026-07-26 ~13:00 | Interactive (Guillermo): reframed the mission to launch-hardening. Wrote ROADMAP.md (6
principles: way-out, reachable destructive/in-progress actions, data survives, adversarial-by-default,
truth-of-data picks, security). Cleared 3 stuck "open" test rounds + test data from Firebase
(_trash/1785076527527) — anchor gap = no UI cancel for live rounds, now top blocker. Moved waitlist off
Formspree to self-collect into Firebase /waitlist (redeployed chains-site, commit 794224c). v404 still
building. | Next: verify+deploy v404, then build Cancel-Round control.
