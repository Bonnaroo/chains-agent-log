# HANDOFF — the baton (overwritten every shift; read at clock-in)

## WHAT I DID
Three shifts today (2026-07-26), the last two back-to-back at the owner's request (he didn't want to wait for
the next hourly dispatch): (1) CEO — created LOCK.md, routed FROM_OWNER.md, ran the Ledgestone Open readiness
pass, found + filed T-014 (real MPO field not loaded) and T-015 (draft order backwards) as HIGH PRIORITY.
(2) A second CEO shift ran ~2 min later in parallel/overlap with my own follow-up work — it re-did the
FROM_OWNER.md->HANDLED routing (harmless, same end state) based on a stale raw-CDN read, and its own HANDOFF
snapshot ("T-014/T-015 still unclaimed") is now OUT OF DATE — ignore that specific claim, this file supersedes
it. (3) Engineer — claimed T-014 + T-015, read the Design project readme (confirms "last place drafts first" is
the real rule and the MPO field is a static, manually-grown database — exactly matching both bugs), and sent one
scoped Claude Design prompt fixing both: the real 156-player Ledgestone field (PDGA event 96414) + corrected
draft-order sort. Design started building; did not wait for/verify it.

NOTE ON CONCURRENCY: two shifts ran on top of each other around 16:03-16:11 UTC despite the LOCK mechanism —
worth the CEO/PM checking why (possibly raw-CDN cache lag on the LOCK.md read, or a scheduler double-fire). No
data was lost this time (only CEO-scoped files overlapped, harmlessly), but flag it — see WATCH OUT FOR.

## WHAT'S NEXT AND WHOSE JOB IT IS
Engineer (next shift): check if the build after "v404" cleared. If so, verify in the Design Present view —
Ledgestone Open shows the real MPO field, picks unlock, and draft order starts with CORY (T13 last place), not
KADEY — then deploy via kb/deploy.md. If still building or paused on a usage limit, note it and let a later
shift pick it up. QA: once deployed, verify the field 1:1 against pdga.com/tour/event/96414 and confirm draft
order against Standings. CEO/PM: investigate the concurrency incident above before it causes a real conflict.

## WATCH OUT FOR
- Ledgestone Open starts 2026-07-30 — T-014/T-015 are the real go/no-go items, not cosmetic.
- Two shifts ran concurrently today despite LOCK.md — always verify LOCK + the file you're about to edit via the
  contents API (not raw.githubusercontent, which caches for minutes) immediately before writing, and re-check
  right before clock-out in case another shift landed a commit while you worked.
- Long Claude Design prompts (~5000+ chars) can CDP-timeout and kill the browser tab via the normal "type"
  action — use execCommand('insertText') on the ProseMirror contenteditable instead (see kb/LESSONS.md).
- Do NOT start any Phase-2 coding rebuild before 2026-07-29 (STRATEGY.md gate) — still not in place.
- Never disrupt App A / the founders' league data — friends are playing their season on it.
