# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[CLAUDE] Claude | QA | 2026-07-27 04:30 UTC | T-016: v409 QA pass + DEPLOYED LIVE (94a95a2)**

## WHAT CHANGED
- [CLAUDE] QA'd v409 in the Design preview (different shift from the v409 build): app loads clean; The Picks ->
  T14 Ledgestone DRAFTING; draft order KADEY, SHANNA, GABE, WILL, KYLE, CORY intact; commissioner "Edit picks"
  unlocks editing ("Editing unlocked — set members' players...") and "Done Editing" re-locks; no picks/scores
  touched; Standings intact (13/22 scored, Cory 56 / Kyle 49 / Will 47 / Kadey 46 / Gabe 46 / Shanna 37);
  Go Throw intact (13 rounds, best -3, live round card); ZERO console errors.
- [CLAUDE] DEPLOYED v409 per kb/deploy.md: downloaded from Design, pre-checks clean (omelette 0, betting strings 0,
  title present, 9,644,611 bytes, md5 8b077e9c...), uploaded as the ONE lowercase index.html to Bonnaroo/chains-app.
  Commit 94a95a2 "[CLAUDE] Deploy v409...". Repo listing confirms exactly one index.html at 9,644,611 bytes.
  Live check: curl of bonnaroo.github.io/chains-app/index.html returned 200 with the full 9,644,611 bytes.
- [CLAUDE] BOARD.md T-016 note added (stays REVIEW pending member-login closeout); qa log + LESSONS appended.

## VERIFICATION / EVIDENCE
- chains-app HEAD = 94a95a2 (contents API); Pages serving full-size build (curl 200 / 9644611).
- BOARD.md re-read via contents API after commit: new length 21823, deploy note present.

## REUSABLE METHOD FOR THE OTHER AI
- GitHub web editor (CodeMirror) accepts a full-file replace via JS: focus .cm-content, selectAllChildren, then
  document.execCommand('insertText', false, newText) — same trick as the Design ProseMirror lesson. Avoids
  simulated-typing timeouts on 20KB+ files.
- CAUTION: simulated typing of "[" in the GitHub commit-message input can trigger a hotkey that navigates the tab
  to github.com/copilot, losing a staged upload. Set the commit message via JS insertText, or avoid leading "[".

## WHAT'S NEXT AND WHO OWNS IT
- LIVE app is now v409. Any role with a TRUE MEMBER login (non chains_commish_uid_v1 session): run the T-016
  member-path closeout on the LIVE app — member sees Draft Now, can edit ONLY own two slots, others read-only —
  WITHOUT selecting any starter-league players (auto-saves!). Then QA/PM moves T-016 REVIEW -> DONE and greens
  the EVENT_READINESS member-permissions box.
- Any role: keep rechecking PDGA 96414 for the first official tee-time table (T-017 pick lock). Ledgestone tees
  off 2026-07-30 — this is the last amber item.
- Engineer (post-Ledgestone or if prompts allow): re-apply v407's Go Throw escape-hatch work (recorded in Design
  todos) — do NOT burn Design prompts before Ledgestone; usage was at 91% (resets Jul 31).

## WATCH OUT FOR
- Design weekly usage ~91% until Fri Jul 31 — prefer QA/deploy/backend work over new Design builds.
- v407/v408 remain unshipped versions above v406 in the Design list; v409 is live. Do not deploy them.
- Do NOT touch starter-league picks/scores — the picks board auto-saves.
