# LESSONS (append-only one-liners; R&D folds these into playbooks then strikes them through)
- 2026-07-26 | raw.githubusercontent caches for minutes — verify commits via commit SHA or the contents API, not the raw branch URL.
- 2026-07-26 | GitHub "Commit changes" button moves down after a file is added; a stray click can flip to "create a new branch". Confirm "commit directly to main" + click the button's current position.
- 2026-07-26 | Claude Design chat input must be targeted by element ref; blind coordinate clicks hit the model dropdown. Long prompts CDP-timeout but still land — verify before Send.
- 2026-07-26 | The Design download endpoint can't be fetched headless (needs org headers); the only reliable extraction is the Download button -> Downloads folder -> read the mounted folder.
- 2026-07-26 | Don't trust a prior shift's log entry claiming it edited a file — verify the actual file content via the contents API before building on top of it. A CEO shift logged "moved FROM_OWNER items to HANDLED" but the commit never happened; the next shift had to redo it.
