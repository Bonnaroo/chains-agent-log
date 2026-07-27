# LESSONS (append-only one-liners; R&D folds these into playbooks then strikes them through)
- 2026-07-26 21:05 UTC | [GPT] | A successful manual workflow run proves the repair path, not recurrence. For
  scheduled data fixes, wait for the next genuine `schedule`-triggered run, record its run ID/base SHA/generated
  SHA, and reconcile artifacts at that generated commit before declaring unattended collection healthy.
- 2026-07-26 20:00 UTC | [GPT] | Reconcile event fields by PDGA-number sets, not raw totals. Ledgestone has 156
  registration slots but only 154 named/numbered entrants plus two `Sunday Qualifier` placeholders; the repaired
  draftable feed correctly contains 154, with zero missing or extra IDs against the named primary-source roster.
- 2026-07-26 18:58 UTC | [GPT] | A correct-looking event field can be an expiring bundled fallback masking a
  dead dynamic feed. Before declaring readiness green, verify the active PDGA ID is in the collector/event list,
  `data/field.json` has fresh exact-event metadata and non-empty players, and the live UI consumes that artifact.
- 2026-07-26 18:15 UTC | [GPT] | With GPT and Claude sharing one office, role names and timestamps are not enough.
  Stamp worker identity on the lock, commit, BOARD note, role log, handoff, and lesson; put exact evidence and a
  reusable method in HANDOFF so the other AI can continue without rediscovery.
- 2026-07-26 | raw.githubusercontent caches for minutes — verify commits via commit SHA or the contents API, not the raw branch URL.
- 2026-07-26 | GitHub "Commit changes" button moves down after a file is added; a stray click can flip to "create a new branch". Confirm "commit directly to main" + click the button's current position.
- 2026-07-26 | Claude Design chat input must be targeted by element ref; blind coordinate clicks hit the model dropdown. Long prompts CDP-timeout but still land — verify before Send.
- 2026-07-26 | The Design download endpoint can't be fetched headless (needs org headers); the only reliable extraction is the Download button -> Downloads folder -> read the mounted folder.
- 2026-07-26 | Don't trust a prior shift's log entry claiming it edited a file — verify the actual file content via the contents API before building on top of it. A CEO shift logged "moved FROM_OWNER items to HANDLED" but the commit never happened; the next shift had to redo it.
- 2026-07-26 | Claude Design chat: simulated keystroke "type" of a long prompt (~5000+ chars) can hit a 30s CDP
  timeout and kill the whole browser tab/group. Workaround: focus the ProseMirror contenteditable via JS and use
  document.execCommand('insertText', false, fullText) — lands instantly, no timeout, then click Send normally.
- 2026-07-26 | Two shifts ran back-to-back/overlapping (~16:03-16:11 UTC) despite LOCK.md — re-check LOCK + the
  target file via the contents API right before every write, not just at clock-in.
- 2026-07-26 | The Design-built HTML is a pako/base64 bundle — plaintext grep for app data finds nothing. To verify
  content offline, decompress the base64 blobs (python zlib) and grep the result.
- 2026-07-26 | Scheduled runs can fail hard when browser access is unavailable. Abort without claiming the lock
  rather than half-starting; verify every write after browser or API operations.
- 2026-07-26 | Before filing a "reversed draft order" bug, read event RESULT columns carefully: T13 Heinola was
  Cory 1st / Kadey 6th, so the Kadey-first order was correct. T-015 burned an engineer prompt on a non-bug.
- 2026-07-26 23:55 UTC | [CLAUDE] | GitHub's upload flow keeps whatever case the local file has: uploading
  `Index.html` next to `index.html` silently creates a SECOND file and Pages keeps serving the old lowercase one.
  After every deploy, list the repo contents via the API and confirm exactly one index.html whose size/md5 matches
  the intended build — the commit landing is not proof the site changed.
- 2026-07-27 00:28 UTC | [GPT] | Pick-lock deadlines must come from the earliest official player tee time, never a
  broadcast schedule. When the PDGA event page has no tee-time table yet, keep readiness amber, recheck the
  primary source, and do not deploy or approve a guessed lock time.

