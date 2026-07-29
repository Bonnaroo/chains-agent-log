# LOG: engineer (append a dated entry every shift; nobody else writes here)

- 2026-07-26 | office created; awaiting first engineer shift.
- 2026-07-28 | [CLAUDE] T-001 DONE: v404 deployed. Built from Design (Go Throw polish: tap-any-hole edit, solo instant-start, finish/share card). Verified clean (no editor harness, no betting strings, title correct). Deployed via GitHub API to Bonnaroo/chains-app at 23:43:28 UTC. Commit: 11ecf7ad3aa1253fc132c2e2738580781d1ef5be. File SHA: 89e6fb73. Main blocker: T-002 (Cancel/Delete in-progress round UI) unchanged — blocks Go Throw UX completeness.

2026-07-28 (Deploy): v411 deployed commit 202fd4b9. Live at https://bonnaroo.github.io/chains-app

2026-07-28 (Deploy): v411 deployed with version display commit 17d26acf9e90e87be999468b2f784b4f28a40689. QA: verify v411 shows in bottom-right corner.

## 2026-07-29 00:26 UTC — [OWNER-LOGGED, correcting a bad autonomous run]
LESSON: A design-lane run at 00:23 UTC had no live Chrome browser (unattended/scheduled), got "cannot interact
with Claude Design," and instead of stopping cleanly it improvised: wrote local scratch files to the Cowork
folder and edited the LEGACY team/PROGRESS.md (stale v404/T-002 content) instead of team/BOARD_DESIGN.md. Root
cause: this lane cannot run unattended at all - Claude Design has no API, only a browser. FIX APPLIED: this
lane is now MANUAL-TRIGGER ONLY (no cron), must confirm browser access first and stop cleanly (log "BLOCKED",
no improvising) if it's missing, and is explicitly told team/PROGRESS.md is legacy/off-limits. DO NOT repeat:
scheduling this lane on a cron, or falling back to local files/legacy docs when browser access is missing.

2026-07-29 ~01:15 UTC — [ENGINEER LANE — BLOCKED]
Browser available (Chrome confirmed active), live app verified at v411. Attempted to access Claude Design (https://design.claude.ai) but received error page (unreadable frame). Cannot proceed with design/build workflow without access to Design.
LESSON: Claude Design accessibility is a hard blocker for this lane. If Design is down/unreachable, any design work is blocked until service restored. Next run: check Design accessibility early before attempting task work.
## 2026-07-29 00:50 UTC — [CLAUDE, owner-driven interactive session]
Owner reported live (via phone + Design System chat) that the picks fix claimed in v409/v410 never actually
worked: members still saw "Edit picks"/"Done editing" gate and the Helena Open/last-place explainer text was
still showing. Diagnosed the real bug: members had to tap "Draft Now" to unlock, which is not the same as being
able to pick directly on their turn. Sent one scoped prompt to Design (Picks screen only). v412 built and
verified in Present view: draft board header simplified to "Draft order" (no explainer text), commissioner
control relabeled "Fix a pick" (override-only), member rows show direct Player 1/Player 2 pickers. DEPLOYED to
Bonnaroo/chains-app via API, commit 682e61e69d8d35a7cb9a654e5d59097d454dc903.
LESSON: a task marked DONE in a prior log (v409/v410 "member drafting fix") was not actually verified against
real member behavior before being called done - it shipped a partial fix (removed a write-guard) without fixing
the actual UX gate blocking access. Future engineer runs: "done" must mean verified against the acceptance
criteria in Present view, not just "a related code change was made."
Also noted: Design usage was at 87% of weekly limit (resets Fri Jul 31) as of this session - budget builds
carefully until reset.
NOT YET VERIFIED: cannot confirm from this session whether a true non-commissioner member account sees this
correctly (no member login available) - owner should spot-check on his phone, or QA lane's next pass should
attempt this if it can access a member view.
