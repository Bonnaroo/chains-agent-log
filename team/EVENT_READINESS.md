# EVENT READINESS — pre-tournament checklist (CEO owns; drive to green before every DGPT event)

The owner's rule: BEFORE an event, everything must be verified ready — especially the registered field and the
background event wiring, which have broken before. File every gap as a HIGH-PRIORITY board task.

## ACTIVE EVENT: Ledgestone Open — starts 2026-07-30 (~4 days out). GET IT READY. Job #1.

CEO verification pass 2026-07-26 (cross-checked live app against DGPT/PDGA source):
- Real event = "DGPT+ Ledgestone Open", DISC GOLF PRO TOUR ELITE SERIES, 30-Jul to 02-Aug-2026, Peoria IL
  (PDGA event 96414, dgpt.com/event/2026-ledgestone-open). Registered MPO field = 156 players (confirmed live
  on PDGA event page, updated today).

### A. The Picks / Draft (truth-of-data — the top risk)
- [x] The event exists in the app with the CORRECT event ID / number / name: Dashboard + Schedule show
      "LEDGESTONE OPEN · ELITE+ · Peoria, IL · Jul 30 – Aug 2" as T14 — matches the real DGPT+ event exactly.
- [ ] GAP: The pickable PRO FIELD is NOT loaded yet. The Picks page for T14 shows "Loading the registered field
      for this event — player picks unlock as soon as it's in" even though the REAL field (156 MPO players) is
      already published on PDGA (event 96414, last updated today 2026-07-26). Filed as T-014 (HIGH PRIORITY).
- [ ] GAP: Draft order looks REVERSED. T14's board reads "Draft order · Heinola Open last place picks first" and
      shows KADEY, SHANNA, GABE, WILL, KYLE, CORY. But per the T13 (Heinola) standings columns, Kadey placed 1st
      (best, 6pts) and Cory placed 6th (worst, 1pt) — so "last place picks first" should start with CORY, not
      KADEY. Current order is exactly backwards (best-to-worst instead of worst-to-best). Filed as T-015 (HIGH
      PRIORITY) — engineer must verify the draft-order formula and fix before picks lock.
- [ ] Pick lock at first tee + WD handling: not yet testable until the field loads (blocked on T-014).

### B. Standings / Stats / Schedule / History
- [x] Season standings render correctly: 13 of 22 events scored, Cory leads with 56 pts, math checks out
      (1st=6pts...6th=1pt per the on-screen legend).
- [x] Schedule shows Ledgestone Open (#14) with the right dates/tier (ELITE+, Jul 30 – Aug 2, Peoria IL) and
      UPCOMING status; prior 13 events all show FINAL with pro + league winners.
- [x] History (The Vault / Pros & Tournaments) shows real per-event PDGA-style results through T13 Heinola Open.

### C. Live Chains (queued, not live yet)
- [x] Live Chains correctly shows "AWAITING NEXT TOURNAMENT — LEDGESTONE OPEN" — wired to the right event, ready
      to go live at tee-off, nothing stale displayed.

### D. Background data wiring (the recurring pain point)
- Event ID/naming/dates all line up end-to-end between the app and the real DGPT/PDGA source (verified above).
- The one live mismatch is the field-sync pipeline (T-014) and the draft-order calculation (T-015) — both
  block real picks and must close before 2026-07-30.

## REUSABLE (for future events): repeat A-D for each upcoming DGPT event ~5 days before it starts. Log the
## event, what was checked, what was fixed, and confirm green in team/logs/ceo.md and the daily report.
