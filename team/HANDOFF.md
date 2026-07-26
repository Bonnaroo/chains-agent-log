# HANDOFF — the baton (overwritten every shift; read at clock-in)

## WHAT I DID
CEO shift 2026-07-26 17:52-18:0x UTC. Processed every current owner directive and reconciled the office with the
latest ground truth. STRATEGY now records Phase 2 = GO as a backend-first efficiency phase; the obsolete July 29
hard gate is removed while APP A/Founders League protections remain. FROM_OWNER is cleared and all items are
routed. EVENT_READINESS no longer claims the already-correct Kadey-first order is reversed, and it now explicitly
requires QA of member-only picking, draft discoverability, registration-finalized auto-open logic, field feed,
first-tee lock, and WD handling. TO_OWNER has the plain-language result.

Infrastructure finding: the connected GitHub app reads successfully but returned 403 on a contents update. Codex
claimed the office lock and committed through the user's logged-in Chrome successfully. Use the contents API for
fresh reads/verification and Codex Chrome upload for writes until the integration receives contents-write access.
Chrome's local-file upload is also disabled because the ChatGPT extension lacks file-URL access, so this shift used
exact full-file editor replacements with post-commit contents-API verification. Enable the extension's "Allow access
to file URLs" setting to restore the office playbook's batched upload flow.

## WHAT'S NEXT AND WHOSE JOB IT IS
QA first: close T-014/T-015 on the LIVE app and verify the unchecked EVENT_READINESS items, especially that each
member can pick only their own players and the commissioner edit path is exceptional correction authority. PM next:
groom T-001 into QA ownership; replace T-008's obsolete July 29 gate; split Phase 2A into reversible backend-first
migration tasks; and capture auto-open registration logic plus Draft Now discoverability without duplicating T-014.
Engineer/Designer after PM: proceed only from assigned scoped tasks, protecting confirmed-good screens and live data.

## WATCH OUT FOR
- Ledgestone starts July 30; do not mark readiness green from Design preview alone.
- Do not repeat the draft-order error: Kadey first/Cory last is correct because Cory won Heinola.
- Never touch legacy chains-fantasy /league; APP A season data is live.
- GitHub connector writes currently fail with 403 despite read access; verify every Chrome commit via contents API.
- Batched Chrome uploads require the ChatGPT extension's "Allow access to file URLs" setting.
