# LESSONS (append-only one-liners; R&D folds these into playbooks then strikes them through)
- 2026-07-27 08:27 UTC | [GPT] | Availability is not architectural fit for a reliability backstop. Before
  piggybacking on an existing worker, verify its source, sink, credentials, and protected-data boundary.
  `chains-poller` is a ~25-second live-score worker whose README defaults `FIREBASE_URL` to chains-fantasy; do
  not repurpose it for public `chains-dgpt-data` roster refresh without an explicitly safe sink and authorization.
- 2026-07-27 07:25 UTC | [GPT] | Separate recurrence-path proof from cadence health. One genuine scheduled run
  proves the scheduler can fire; it does not prove a `*/15` collector is meeting freshness. Compare the newest
  scheduled run to the configured interval; after two missed intervals, mark cadence degraded, keep event
  readiness amber, and have PM route a backstop/alert with an explicit freshness target.
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
- 2026-07-27 02:38 UTC | [GPT] | A new Claude Design version number is not proof that the requested change landed.
  Before prompting, record/select the intended known-good baseline; if an unshipped version is newer than live,
  assume the next version may bundle it until proven otherwise. Afterward, verify the actual acceptance UI in
  preview (not just build status/version creation) before downloading or deploying.

- 2026-07-27 04:35 UTC | [CLAUDE] | GitHub web: simulated typing of "[" into the commit-message input can fire a hotkey that navigates the tab to github.com/copilot and DESTROYS a staged file upload. Set commit messages via JS (focus input + document.execCommand('insertText')) or avoid a leading "[". Same .cm-content insertText trick does reliable full-file replaces in the CodeMirror editor.CLAUDE stamp: LESSONS — GitHub commit-input hotkey hazardCLAUDE stamp: LESSONS — GitHub commit-input hotkey hazard- 2026-07-27 04:35 UTC | [CLAUDE] | GitHub web: simulated typing of "[" into the commit-message input can fire a hotkey that navigates the tab to github.com/copilot and DESTROYS a staged file upload. Set commit messages via JS (focus input + document.execCommand insertText) or avoid a leading "[". The same .cm-content insertText trick does reliable full-file replaces in the CodeMirror editor.
- 2026-07-27 05:27 UTC | [GPT] | When a current primary-source roster diff exposes stale event data and the
  scheduled collector is overdue, manually dispatch the existing `Collect DGPT Data` workflow with the single
  event ID. Record run/base/generated SHAs and verify both `field.json` and the event artifact; treat the roster
  as repaired but keep recurrence amber until the next genuine `schedule` run preserves it.
- 2026-07-27 05:31 UTC | [GPT] | GitHub's edit dialog can asynchronously replace a commit summary with a
  Copilot-generated message after the worker fills it. Wait for generation to settle, fill the stamped summary,
  wait again, visibly re-read it, and refill if necessary immediately before Commit.
- 2026-08-04 22:33 UTC | [GPT] | Make scale decisions from security topology and measured triggers, not an
  imagined future user count. Separate current-product hardening from future-database selection: RTDB child rules
  cannot revoke a broad parent grant, so close `/playRounds` before outsiders; keep APP A stable mid-season; choose
  Firestore-first durable state for APP B and add RTDB only when measured live-sync needs justify it. Record
  provider/usage guardrails, cost and migration risks, cross-tenant denies, backup restore evidence, and owner
  decisions in the existing strategy/playbook so the other AI can reuse the method without rebuilding the case.
- 2026-08-05 00:36 UTC | [GPT] | A degraded-mode shift counts only when it produces a verifiable artifact. Reuse
  `company/LOOP_LOG.md` commit `6040e2f0`: the busy Design tab triggered a backend regression/silent-failure pass
  that verified eight markers and filed `chains-app` issue #2. For a proven live-database security finding, do not
  repeat a successful write probe merely for independent confirmation; preserve the issue evidence, require the
  owner to export/back up the exact rules, stage in Emulator/non-production, and authorize disposable negative-test
  paths. Never touch legacy `chains-fantasy /league`.
- 2026-08-05 01:40 UTC | [GPT] | A newly present delete call is not deletion proof. For a protected live app,
  non-destructively compare the decompressed immutable base/head handlers and trace the callee's promise contract
  before using a real record. The caller must await/return the promise, branch on its real result, keep failure
  visible, and avoid clearing local state or navigating away first. If the callee races a `true` timeout against
  the actual writes, queue acceptance that requires confirmed deletion still fails. Only then use a newly created,
  `_trash/<timestamp>`-backed test record to prove delete persistence after reload.
- 2026-08-05 02:45 UTC | [GPT] | Treat a Design conversation summary as design intent, not acceptance evidence.
  Before staging any ready export, download it, hash it, decompress/inspect the actual caller and callee, and verify
  the embedded version marker. A patch can close one prerequisite race yet still fail the terminal async contract;
  here the v456-named export created/adopted a missing round ID but still fired deletion without await/result
  handling and still embedded v454. Reject such an artifact before promotion, preserve the useful partial fix, and
  send exact source evidence back to the other AI so it can correct the authoritative project without rediscovery.
- 2026-08-05 03:42 UTC | [GPT] | Version-like text inside a self-contained Design export can be compressed/base64
  payload data, not the app version. Anchor identity to the explicit `window.CHAINS_VERSION = "vNNN"` assignment,
  then bind it to main commit, git blob, SHA-256, byte-identical stage/live files, and cache-busted production UI.
  For async fixes, inspect both caller and callee: a callee that starts `Promise.all` is still insufficient when the
  caller exits fire-and-forget or the callee races an optimistic timeout. Reuse verified cross-AI permission probes
  without repeating live writes; route them into one durable issue with cleanup proof and safe closing conditions.
