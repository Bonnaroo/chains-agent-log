# Chains — Lessons Learned (append-only, chronological, raw incident diary)

Rules: nothing here is ever edited or deleted. Nothing reads this file at the start of an ordinary task — it's
for auditing "how many times has this system needed Guillermo's help," and for R&D to mine when writing/updating
a playbook. A lesson only gets promoted into a playbook once the fix has been verified working in production at
least once (not just "seemed to work") — that promotion is a separate, deliberate step.

Format per entry: date/time, what was attempted, what failed, why, what finally worked, did Guillermo have to
step in, is this likely to recur, which playbook needs updating.

---
## Seeded from prior kb/LESSONS.md and team/logs/ (pre-2026-07-29 incidents, carried forward, not rewritten)

- 2026-07-27 08:27 UTC — Availability is not architectural fit for a reliability backstop. Before piggybacking on
  an existing worker, verify its source, sink, credentials, and protected-data boundary. (chains-poller default
  FIREBASE_URL pointed at chains-fantasy; do not repurpose without an explicit safe sink.) Guillermo did not have
  to intervene directly; caught before it happened. Likely to recur in any future "reuse an existing worker"
  shortcut — playbook: firebase-backup.md and any future "add a new automated Firebase writer" note should
  reference this check.

- 2026-07-27 07:25 UTC — Separate recurrence-path proof from cadence health: one genuine scheduled run proves the
  scheduler can fire, not that a fast-interval collector is meeting its freshness target. Compare newest
  scheduled run to configured interval; after two missed intervals, mark cadence degraded. Recurring risk for any
  frequent automated job — playbook: production-verification.md should include a cadence-health check, not just
  a single-run-success check.

- 2026-07-26 21:05 UTC — A successful manual workflow run proves the repair path works, it does NOT prove
  unattended recurrence is healthy. Wait for a genuine schedule-triggered run and reconcile artifacts at that
  run's actual commit before declaring automation healthy.

- 2026-07-26 20:00 UTC — Reconcile event fields by ID sets, not raw totals — a total count can match by
  coincidence while the actual entrant set is wrong (Ledgestone: 156 slots, 154 real entrants + 2 placeholders).

- 2026-07-26 18:58 UTC — A correct-looking cached/fallback data file can mask a dead live feed. Before declaring
  readiness green, verify the live upstream ID is actually in the active collector list and the UI is consuming
  fresh, not stale-but-plausible, data.

- 2026-07-29 (this session) — "Fix a pick" button false alarm: grep on the compiled index.html for plaintext app
  copy returned 0 matches across 3 rebuild/redownload attempts, leading to a wrong conclusion that Design's
  bundler wasn't picking up in-place edits. Real cause: the app's content is stored as gzip-compressed base64
  blobs — plaintext grep always false-negatives on this file. Guillermo had to intervene (pointed out his phone
  showed the button while the agent's check said it was missing) before the real cause was found. PROMOTED to
  playbooks/production-verification.md and playbooks/claude-design-editing.md — decompress-and-search is now the
  mandatory method, never plaintext grep, on this specific file format.

- 2026-07-29 (this session) — "Claude Design is down" false alarm: navigated to the wrong URL (design.claude.ai)
  and concluded the whole service was unreachable. The correct URL was different. Guillermo did not have to
  intervene technically, but the false alarm reached him. PROMOTED to playbooks/claude-design-editing.md — the
  exact correct project URL is now hardcoded, never guessed from memory.

- 2026-07-29 (this session) — CEO daily report falsely claimed a critical app-initialization hang and recommended
  an emergency rollback, based on inference rather than direct live observation. Guillermo directly disputed it
  ("everybody can pick their players, it's working fine") and the agent then verified live and found no hang.
  Lesson: never issue a "critical"/rollback-recommending claim without directly observing the actual failure
  live. PROMOTED into DECISION_POLICY.md-equivalent hard rule (now: production verification, tier "functional",
  is mandatory before any critical/rollback claim).

- 2026-07-29 (this session) — GitHub upload took multiple attempts to get right before landing on: use the
  Contents API directly with a token (GET for sha, PUT with base64 content), and for files over ~1MB the GET
  response's inline content is empty — must follow download_url instead. Guillermo helped get the token set up.
  PROMOTED to playbooks/github-upload.md.
