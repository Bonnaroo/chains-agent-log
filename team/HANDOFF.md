# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[GPT] ChatGPT/Codex | CEO | 2026-07-26 18:15 UTC | Cross-AI attribution and memory protocol**

## WHAT CHANGED
- [GPT] Replaced team/PROTOCOL.md with a two-worker operating standard. Mandatory identities are `[GPT]` for
  ChatGPT/Codex and `[CLAUDE]` for Claude/Cowork/Claude-in-Chrome.
- [GPT] Stamps are now required in LOCK.md claims, GitHub commit summaries, BOARD notes, role logs, HANDOFF,
  LESSONS, DECISIONS, and TO_OWNER entries. The stamp follows the worker even when it operates the other company's
  site or tool.
- [GPT] Added a detailed evidence standard and a required HANDOFF structure so either AI can resume cold.
- [GPT] Added a cross-AI learning loop: read the other worker's recent results, preserve verified work, record good
  methods in LESSONS/playbooks, and explicitly report whether the next worker reused or challenged the method.
- [GPT] Updated DECISIONS.md and kb/LESSONS.md to make this an owner-directed standing rule.

## VERIFICATION / EVIDENCE
- GitHub connector could read but still returned HTTP 403 when attempting to claim LOCK.md through the contents API.
- [GPT] Claimed the shared lock through Codex-controlled Chrome and verified the exact lock text through GitHub.
- The updated files were committed with a `[GPT]` commit prefix and then re-read from GitHub to confirm the identity,
  evidence, and cross-AI sections landed.

## DATA / SAFETY
No application, Firebase, league, pick, standings, round, or user data changed. Legacy chains-fantasy /league was
not accessed. No Design build or live deploy occurred.

## REUSABLE METHOD FOR THE OTHER AI
Use identity-by-worker, not identity-by-tool. Example: GPT driving Claude Design remains `[GPT]`; Claude editing
GitHub remains `[CLAUDE]`. Before starting, read HANDOFF + LESSONS + relevant log/task notes; do not spend a shift
rediscovering a verified method. If evidence conflicts, record the contrary evidence rather than silently overriding.

## WHAT'S NEXT AND WHO OWNS IT
- [CLAUDE] On the next Claude shift: acknowledge this handoff in the selected role log using `[CLAUDE]`; use the
  new stamp everywhere; state whether the cross-AI method was reused or whether contrary evidence was found.
- [GPT] On the next GPT shift: use the same `[GPT]` stamps and detailed handoff; do not fall back to generic "agent."
- QA/PM priorities from the preceding shift remain: independently close Ledgestone v405 readiness and groom the
  newly authorized backend-first Phase 2 work.

## WATCH OUT FOR
- GitHub connector writes still return 403 even though read access works; Chrome is the verified write path.
- Historical entries are intentionally unstamped; do not rewrite them.
- Attribution must never be inferred from role or commit author alone; the explicit bracket stamp is authoritative.
- Preserve the confirmed-correct Ledgestone order: Kadey first, Cory last.
