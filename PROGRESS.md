# Chains — Agent PROGRESS (the brain)

This is the single source of truth for the Chains maintenance/improvement agent. The scheduled task reads
this FIRST every run and rewrites it LAST. Raw copy:
https://raw.githubusercontent.com/Bonnaroo/chains-agent-log/main/PROGRESS.md
Write protocol: edit the local copy (C:\Users\18108\Cowork Design Folder\Chains Fantasy DGPT\PROGRESS.md),
then upload-replace it at https://github.com/Bonnaroo/chains-agent-log/upload/main (NEVER GitHub's inline
editor — it mangles lists). Reconcile first: whichever copy has the newer top RUN LOG timestamp wins.

## NEEDS HUMAN INPUT (Guillermo) — check first, never spin on these
- WAITLIST: the marketing site (https://bonnaroo.github.io/chains-site) needs a Formspree form ID. Until
  it's added, signups only save in the visitor's own browser and never reach Guillermo. When he provides an
  ID, set it in index.html's ENDPOINT constant and redeploy chains-site.
- COURSE DATA: state-by-state course expansion is PAUSED (UDisc/robots.txt blocks the per-hole data source).
  Needs Guillermo to pick a data source before re-enabling. Do NOT work course data or the course loader.

## LAST SESSION SUMMARY (2026-07-26)
Live app is v403 (betting removed, Go Throw scoring overhaul) and confirmed live at
https://bonnaroo.github.io/chains-app . v404 (Go Throw polish, backlog item B1) was SENT to Design and is
building. Marketing site published at https://bonnaroo.github.io/chains-site with all "Try the app" links
removed (waitlist-only until launch). Course task paused. Agent switched to this backlog-driven PROGRESS.md.

## FEATURE CHECKLIST (walk every run in the Design preview / live app; keep this list current as the app grows)
Log any defect into BACKLOG with a severity. Check for console errors on every screen.
- [ ] Sign-in / identity (test-mode name pick; loads to Dashboard, correct member)
- [ ] Dashboard (standings header correct: Cory 56/1, Kyle 49/2, Will 47/3, Kadey 46/4, Gabe 46/5, Shanna 37/6; no betting UI/coins chip)
- [ ] The Picks (draft two pros per event, pick lock, no MoneyDisc/betting)
- [ ] Standings (season leaderboard + per-event)
- [ ] Live Chains (live scoring view during events)
- [ ] Go Throw home (rounds list, best score, entry buttons, no betting UI)
- [ ] Go Throw — Start a Round → Pick Course → Who's Playing → Start Scoring (SOLO instant-start, no forced invite)
- [ ] Go Throw — Plan a Round & Invite Friends (separate scheduling flow, unchanged)
- [ ] Go Throw scoring screen (blank-until-entered scores, persistent 18-hole scorecard, TAP ANY HOLE to jump/edit, next-hole gating, running Thru/to-par in sync)
- [ ] Go Throw finish (unentered holes save as null; shareable Round Summary card with Share/Save)
- [ ] Watch (spectate live rounds)
- [ ] In the Bag (disc bag tracker + disc picker brand→mold dropdown)
- [ ] Settings (display name, avatar, units)
- [ ] Mobile / responsive layout
- [ ] No console errors anywhere

## BACKLOG (work top-down by severity; fix blockers → majors → minors; re-test the fixed flow + one adjacent flow)
### Blockers
- (none known)
### Majors
- B1 (BUILDING as v404) Go Throw scoring polish: (i) tap ANY scorecard hole to jump/edit; (ii) solo
  "start scoring now" path with no forced invite; (iii) shareable Round Summary card on Finish. When Design
  finishes: verify against the checklist, then deploy.
### Minors
- (none known yet — add from checklist walkthroughs)

## IDEAS (only when BACKLOG is empty; implement ONE small item per run; never anything needing a design decision — flag those under NEEDS HUMAN INPUT instead)
- B2 My Rounds + personal stats: round-history list; per-course personal best, rounds played, scoring
  average; per-course friend leaderboard. (Read existing rounds data; don't change how rounds save.)
- B3 First-run / sellability polish: friendly empty-states (Dashboard + Go Throw), short skippable first-run
  explainer, Settings section for name/avatar/units.

## DO-NOT-TOUCH (confirmed working; propose + flag before changing, never silently refactor)
- Betting/money REMOVAL (v402): stays removed. Do not re-add any betting/coins/pools/moneyball UI.
- League pick scoring + season standings math (Dashboard/The Picks/Standings) — verified correct.
- The chains-fantasy Firebase project's /league node (the live 6-friend league). NEVER read/write/delete it.
- Firebase app data: back up to _trash/<Date.now()> before ANY delete in chains-app-f38f8.
- The deploy flow (Downloads → verify clean → upload to Bonnaroo/chains-app as index.html).

## OPERATING RULES
- One build per run. If Design is mid-build, don't interrupt — do a health check and exit; next run verifies.
- If Design shows a usage-limit/paused banner, log it and exit; retry next run.
- Deploy only builds that pass the relevant checklist items with no console errors.
- Concurrency: if CURRENT RUN below has a claim <45 min old, another run is live — stand down.
- Chrome outage: if the browser extension won't connect after 1 retry, increment the outage counter below;
  at 3 consecutive failures, auto-pause the schedule (update_scheduled_task enabled:false) and flag it here.

## CURRENT RUN
(idle)

## CHROME OUTAGE
consecutive_failures: 0 | last_failure: none

## NEXT RUN STARTS WITH
Check whether Design has finished building v404 (Go Throw polish, B1). If finished: verify tap-any-hole edit,
solo instant-start, and the finish/share card against the checklist, then deploy to chains-app. If still
building: do a health check and exit. If already deployed: pick up B2 (My Rounds + stats) from IDEAS.

## RUN LOG (newest first — date time UTC | did | found | next; keep ~30 entries, compress older)
2026-07-26 ~12:40 | Interactive session (Guillermo): diagnosed the stall — loop had no self-refilling backlog
so it idled once unblocked work ran out. Adopted Guillermo's improved framework: rebuilt the brain as this
structured PROGRESS.md (checklist + severity backlog + refill rule + DO-NOT-TOUCH + NEEDS HUMAN INPUT).
Deployed v403 earlier; sent v404 (B1 Go Throw polish) to Design (building). Published marketing site and
removed all "Try the app" links. Paused course expansion. | Next: verify + deploy v404.
