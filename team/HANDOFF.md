# HANDOFF — the baton (overwritten every shift; read at clock-in)

## LAST WORKER / ROLE / UTC / TASK
**[CLAUDE] Claude/Cowork | QA | 2026-07-27 00:05 UTC | T-014 + T-015 live QA + v406 deploy repair**

## WHAT CHANGED
- [CLAUDE] Found the 21:46Z v406 deploy never went live: it was committed as miscased `Index.html` (62e2a46)
  while Pages kept serving `index.html` (byte-identical to v405 commit 1f22274, md5 42da2a19...).
- [CLAUDE] Verified v406 offline (gzip-decompressed the Design bundle: Ledgestone feed wiring identical to v405;
  only diff = new "You have a live round open / round in progress" affordance; no harness; betting strings at
  exact dormant parity with v405), then deployed it to lowercase index.html (chains-app commit 30a2201) and
  deleted the stray `Index.html` (b3be810).
- [CLAUDE] Closed T-014 (live feed consumption + 154-pro Registered list verified) and T-015 (not-a-bug,
  Kadey-first order confirmed live). BOARD, EVENT_READINESS, qa log, LESSONS updated.

## VERIFICATION / EVIDENCE
- Live https://bonnaroo.github.io/chains-app/index.html serves 9,643,999 bytes, md5 98a498e3f6c043a21156376ebadf4641
  = exact v406 file. Repo root now has exactly one index.html.
- The live page's own resource timing lists a fetch of
  raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/field.json (no cache-buster = app-initiated).
  That feed at 22:52:22Z: event_tag T14, event_id 96414, 154 players. UI shows "154 pros registered · updated
  Jul 26, 6:52 PM" — same artifact. Draft order on dashboard + Picks: KADEY, SHANNA, GABE, WILL, KYLE, CORY.
- Office commits this shift: 9468bf9 (lock claim), then the clock-out batch (see latest commits).

## DATA / SAFETY
No Firebase, league, pick, standings, round, or user data changed. Entered and exited the Picks "Edit picks" mode
as WILL-C without selecting any player (returned to read-only). Legacy chains-fantasy /league untouched. Betting
stays removed; Watch/Settings/starter-league pin/draft order protected.

## REUSABLE METHOD FOR THE OTHER AI
[CLAUDE] Deploy verification gate: after any chains-app upload, GET /contents/?ref=main and confirm exactly one
`index.html` whose size+md5 equal the intended build, then curl the live URL and md5-compare. A green commit with
a miscased filename ships nothing. (Reused GPT's decompress-and-grep method to verify the bundle offline.)

## WHAT'S NEXT AND WHOSE JOB
- [PM] Convert the permission finding into a task: member own-only drafting does not exist — "Edit picks" as a
  regular member unlocks all six members' players AND scores. Also still open: pick-lock/WD handling at the real
  first tee (Ledgestone tees off 2026-07-30) and automatic registration-close→draft-open logic.
- [Engineer] T-002/T-012: v406's live-round banner is a step; the reachable Cancel/Delete round control is still
  the anchor bug and unverified.
- [Owner] github-token.txt still holds the placeholder; pasting a real token makes shifts browser-free.

## WATCH OUT FOR
- Do not upload build files with a capitalized filename; Pages is case-sensitive (see LESSONS).
- The two Sunday Qualifier slots are non-draftable placeholders, not missing players (154 named is correct).
- The Picks "Edit picks" mode auto-saves — do not test it by selecting players on the live league.
- 2026-07-26 lock races: two 21:5xZ claims collided earlier; re-read LOCK via contents API right before writes.
