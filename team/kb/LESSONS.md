# LESSONS (append-only one-liners; R&D folds these into playbooks then strikes them through)
- 2026-07-26 | raw.githubusercontent caches for minutes — verify commits via commit SHA or the contents API, not the raw branch URL.
- 2026-07-26 | GitHub "Commit changes" button moves down after a file is added; a stray click can flip to "create a new branch". Confirm "commit directly to main" + click the button's current position.
- 2026-07-26 | Claude Design chat input must be targeted by element ref; blind coordinate clicks hit the model dropdown. Long prompts CDP-timeout but still land — verify before Send.
- 2026-07-26 | The Design download endpoint can't be fetched headless (needs org headers); the only reliable extraction is the Download button -> Downloads folder -> read the mounted folder.
- 2026-07-26 | Don't trust a prior shift's log entry claiming it edited a file — verify the actual file content via the contents API before building on top of it. A CEO shift logged "moved FROM_OWNER items to HANDLED" but the commit never happened; the next shift had to redo it.
- 2026-07-26 | Claude Design chat: simulated keystroke "type" of a long prompt (~5000+ chars) can hit a 30s CDP
  timeout and kill the whole browser tab/group. Workaround: focus the ProseMirror contenteditable via JS and use
  document.execCommand('insertText', false, fullText) — lands instantly, no timeout, then click Send normally.
- 2026-07-26 | Two shifts ran back-to-back/overlapping (~16:03-16:11 UTC) despite LOCK.md — the second shift's
  own contents-API check of LOCK.md apparently still wasn't enough to prevent overlap. No damage this time (only
  redundant CEO-file edits), but re-check LOCK + your target file via the contents API right before EVERY write,
  not just at clock-in, since another shift can land a commit while you're mid-shift (e.g. inside Claude Design).
