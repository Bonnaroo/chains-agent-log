# Playbook — Claude Design Editing (Engineer role, manual session only)

1. Confirm live browser access first: ToolSearch the claude-in-chrome tool set, call tabs_context_mcp, note the
   CURRENT tab/group baseline (for cleanup at the end).
2. Navigate to the EXACT project URL: https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9
   Never guess/construct a URL from memory (design.claude.ai is WRONG and has caused a false "Design is down"
   incident — see LESSONS_LEARNED.md 2026-07-29).
3. If browser access or the exact URL fails: STOP. Do not improvise, do not write local scratch files. Log
   "BLOCKED: <reason>" to company/agents/engineer/history.md and end the run.
4. Acquire the build lock (company/BUILD_LOCK.json) before starting real build work: set locked:true, the Issue
   number, holder, startedAt, and an expiresAt a few hours out. If a lock already exists and is unexpired, do
   not start a second build — work on verification/cleanup instead.
5. Write ONE tight, scoped prompt: state exactly what to change AND what NOT to touch. Vague prompts cause
   unwanted rebuilds/regressions.
6. Wait for the build, review in Present view against the Issue's acceptance criteria before exporting.
7. Export the compiled index.html via the three-dot menu.
8. Deploy to test.html FIRST (staging), verify there, THEN promote (same PUT) to index.html — see
   playbooks/production-verification.md for the 3-level check, required both times.
9. Record release evidence on the Issue: commit sha, previous commit sha (rollback point), verification results.
10. Release the build lock (locked:false).
11. Clean up: close every tab/group opened this session, restoring to the baseline captured in step 1.

LESSON this came from: a scheduled run without browser access improvised local files and edited legacy files
instead of stopping cleanly (2026-07-28) — now hard-blocked by step 3.
