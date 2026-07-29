# Chains — Decision Policy (3 tiers)

## Tier 1 — Acts alone, no notification needed
Monitoring email/GitHub/Firebase for problems; processing user bug reports into queue items; routine backlog
prioritization; daily Firebase backups; playbook maintenance; small backend bug fixes; adding an obviously
missing standard control (back/cancel/confirm button); mobile/accessibility fixes; testing and verifying
releases; rolling back an obviously broken release; the weekly self-directed product review.

## Tier 2 — Acts, then tells Guillermo (short note in TO_OWNER.md or next daily report)
Noticeable-but-low-risk UI changes; new monitoring/support features; minor Firebase rule corrections; new
standard controls that change a workflow's shape (not just add a missing button, but change how a flow works).

## Tier 3 — Stops and asks first (files as `needs-owner-decision`, does not proceed)
Changing fantasy scoring or league rules; major new product areas; monetization; branding redesign;
authentication architecture; moving Realtime Database -> Firestore (or any DB migration); launching the future
public multi-user app; collecting new personal information; large expenses; production-data deletion; any
irreversible architectural decision.

## Hard gates (enforced structurally, not just written policy)
- Only ONE Issue may be `status:building` at a time — enforced by company/BUILD_LOCK.json (see below), not by
  agents remembering to check.
- Engineer never pushes straight to `main` for anything except the compiled index.html deploy itself, which IS
  the product artifact — that path is intentionally direct (see playbooks/claude-design-editing.md for why a
  PR flow doesn't fit a single binary-blob file). Everything else (company brain, Issues, labels) goes through
  normal API writes, not force-pushes or history rewrites.
- No production deployment without passing all 3 verification levels (artifact / deployment / functional) —
  see playbooks/production-verification.md.
- No Firebase schema or security-rule change without a security review pass first (see the standing
  `priority:critical` gate in decisions.md: harden Firebase rules before scaling).
- No autonomous deletion of production data — deletes go to `_trash/<timestamp>` first, always.
- Daily API-cost / task-count sanity: if a lane would need to run more than ~3x its normal cadence in a day to
  keep up, that's itself a Dispatcher-filed reliability issue, not something to just keep doing.

## Build lock (company/BUILD_LOCK.json)
```json
{
  "locked": true,
  "issue": 42,
  "holder": "Guillermo + Claude Design",
  "startedAt": "2026-07-29T18:00:00-04:00",
  "expiresAt": "2026-07-29T22:00:00-04:00"
}
```
Dispatcher must not mark a second Issue `status:building` while a lock is present and unexpired. An expired lock
(session got interrupted) is fair game to clear and reassign — Dispatcher clears it and notes why.
