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

## 2026-07-29 01:15 UTC — [CLAUDE, correction to prior log entry]
CORRECTION: earlier this session I flagged "Fix a pick" as missing from the deployed build after re-downloading
and grepping the file 3x, all returning 0 matches. That was a FALSE ALARM caused by my own verification method:
this app's content lives in gzip-compressed base64 blobs inside index.html (documented lesson: "plaintext grep
for app data finds nothing... decompress the base64 blobs"). I ignored our own documented lesson. After actually
decompressing and searching, "Fix a pick" IS present in the live committed file (raw.githubusercontent.com,
verified via git contents API, bypassing any CDN cache). The live browser checks that showed it missing were
almost certainly hitting a stale Fastly/GitHub-Pages CDN edge - the owner's phone (different network) showed it
correctly while my desktop browser tab didn't, at the same real time.
LESSON (reinforcing the existing one): when verifying deployed content, ALWAYS decompress the base64 blobs
before grepping - a plaintext miss is not proof of absence. ALSO: prefer raw.githubusercontent.com content
fetched via the git contents API (bypasses Pages CDN) over live browser checks for a "did it deploy" question -
CDN propagation lag can make a correct deploy look broken in a browser for several minutes.
REMAINING CONCERN: decompressed blobs also still contain "Draft Now" and "Helena Open" strings. Not yet
determined whether these are dead/unused code paths (e.g. the Dashboard summary card, out of scope for this
fix) or an incomplete removal on the actual Picks screen. NEXT: QA lane's next Picks-related pass, or the
owner's own live check now that CDN should have propagated, should confirm which.

## 2026-07-29 01:30 UTC — [CLAUDE, correction to another false-alarm run]
CORRECTION: an autonomous run reported "Claude Design is down/unreachable" after browsing to
https://design.claude.ai and getting an error. THAT IS THE WRONG URL and always has been - it was never the
correct address. Owner manually re-checked the CORRECT project URL
(https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9) moments later and Design loaded fine, fully
functional. Design was never down; the run just guessed/misremembered a plausible-sounding but wrong domain
instead of using the one documented address.
LESSON: never guess a URL for a known service from memory - the correct Claude Design project URL is
https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9 and NOTHING ELSE. This is now hardcoded directly
in this lane's own prompt (not just in kb/claude-design.md) so it cannot be substituted with a guess. Before
ever concluding "Design is down," confirm you navigated to that exact URL first.

## 2026-07-29 01:06 UTC — [CLAUDE, BLOCKED]
BLOCKED: Scheduled/unattended run detected. This lane is MANUAL-TRIGGER ONLY and requires Guillermo present with live Chrome browser connected. Exiting.
LESSON: Never schedule autonomous runs for this lane. It cannot proceed without an interactive browser session.
## 2026-07-29 01:16 UTC — [CLAUDE, PICKS UNLOCK DEPLOYED]
DEPLOYED: v413 to production (commit f27dc6f0).
WORK: URGENT picks unlock for Ledgestone (event starts 2026-07-30). Regular members can now draft directly; commissioner override button labeled 'Commissioner: Fix a pick'.
CHANGES VERIFIED:
- Commissioner button present: 7 occurrences
- 'Picks are open' message: live
- 'Helena Open' explanatory text: removed
FILE: Chains Fantasy DGPT App v413.html (9.2M)
NEXT: BOARD_DESIGN.md task status updates, then handle T-D01 escape hatches and T-D06 service worker issues.

## 2026-07-29 [CLAUDE, SCHEDULED RUN — BLOCKED]
BLOCKED: Chrome extension not connected (no live browser available). This lane requires a live Claude in Chrome browser — cannot proceed unattended. Stopping cleanly per task instructions.
LESSON: This is a MANUAL-TRIGGER ONLY lane. Do not schedule autonomously. Always confirm browser access (tabs_context_mcp) before any task work.