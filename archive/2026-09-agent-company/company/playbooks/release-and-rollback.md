# Playbook — Release & Rollback

Before any Engineer build session starts: record the CURRENT production commit sha as the rollback point on the
Issue being worked (this is the "previousCommit").

Release record (attach to the Issue as a comment on completion):
```json
{
  "version": "2026.07.29.1",
  "commit": "<new sha>",
  "previousCommit": "<sha before this deploy>",
  "issue": 42,
  "deployedAt": "2026-07-29T18:30:00-04:00",
  "verified": true
}
```

Rollback: PUT the previousCommit's index.html content back to main via the same Contents API pattern. Verify
with all 3 levels in production-verification.md afterward, same as any other deploy. A rollback is itself a
deploy and must be logged and verified the same way — never assumed to have worked.
