# ROUND QUEUE — one feature per cycle, built properly

Owner directive 2026-08-03: *"do them one at a time so they don't get underbuilt. If anything, they
need to be overly built."* He wants to use this **in the field**. Nothing else matters until the
round works standing on a tee with friends.

**Rules for this queue**
- Work the list **top to bottom**. One item per Design cycle. Never batch.
- An item is done only when it passes **THE WALKTHROUGH** (bottom of this file) — not when the code exists.
- Overbuild rather than underbuild: handle the empty state, the error state, the offline state, the
  someone-else-changed-it state, and the phone-sized viewport. If you're unsure whether an edge case
  matters, build for it.
- Do not start the next item while the current one is unfinished.
- Mark items `[x]` only after the walkthrough passes. Add the version it shipped in.

---

## THE LIST

### 1. Start a round — the picker
- [ ] Defaults to **solo**. Zero taps for the common case.
- [ ] **Never** renders a chip labelled "Player" (bug #42 — corrupted local member cache rendered literally)
- [ ] Add people explicitly: friends list / recent cardmates ("Played with recently") / guest by typed name / QR
- [ ] Clear count: "Playing solo" / "You + 2"
- [ ] Course + layout + **starting hole** (not always hole 1)
- [ ] Scoring format: singles / doubles / teams
- [ ] **Back and Cancel at every step**; cancelling orphans nothing (#5)

### 2. Delete a round and have it stay deleted (#43)
- [ ] `deleteRound` **awaits** `ChainsRounds.remove()` and reports real success/failure
- [ ] Covers: local mirror, `playRounds/{id}`, `liveRounds/{id}`, per-user index under the **real auth uid**, and legacy `chains-fantasy/play_rounds/{id}`
- [ ] Solo round -> hard delete. Round with other players -> **hide-for-me only**, record intact for them, and say so plainly
- [ ] Real error surfaced on failure — never a silent revert
- [ ] **Bulk cleanup** (multi-select / "delete my test rounds") — there is a live backlog

### 3. Resume — the one that cost a real round
- [ ] Works after: app killed, browser closed, storage cleared, **different phone**
- [ ] Rebuilt from the **cloud**, never from a localStorage pointer alone
- [ ] Direct **Resume / Discard**, not routed via the Live Now card (#7)
- [ ] Any open round is reachable from Go Throw home, not just the newest

### 4. Scoring — the fast path
- [ ] Quick scoring is the default: **one tap per player per hole, defaults to par**
- [ ] Advanced stats are an optional layer that **never** slows the fast path
- [ ] Penalty strokes; adjust a hole's par; skip a hole; play holes out of order
- [ ] Notes on the round and on a specific hole
- [ ] Save a round without keeping score

### 5. Changing scores — owner called this out specifically
- [ ] Edit any score **during** the round
- [ ] Edit any score **after** it's finished, behind an explicit "Edit round" (history opens read-only)
- [ ] **Edit history: who changed what, when.** In a group round, silent edits are poison
- [ ] Enter an old round manually, after the fact

### 6. Adding people to a round already in progress
- [ ] Add a player mid-round, including someone joining at hole 7
- [ ] Their earlier holes handled sensibly — blank, not zero, and totals stay correct
- [ ] Join by QR/link: on the card -> score your row; not on it -> watch + ask to join
- [ ] Owner gets tap-to-approve; auto-approve if already friends

### 7. Group / shared scoring
- [ ] Live sync across everyone on the card; simultaneous entry
- [ ] Each person scores their own row, **or** one person scores everybody
- [ ] Tee order calculated and shown
- [ ] Guests with no account fully supported

### 8. Ending a round
- [ ] End early and keep what's scored
- [ ] Discard with confirm
- [ ] Mark as practice -> excluded from stats
- [ ] Share a finished scorecard

---

## THE WALKTHROUGH — run this before marking ANYTHING done

At a **phone-sized viewport**, against the deployed build, as if standing on a tee:

1. Start a round. Add two friends.
2. Score nine holes.
3. Add a third person mid-round.
4. Fix a score you typed wrong.
5. Kill the app entirely.
6. Reopen. Resume the round.
7. Finish it.
8. Delete it. Confirm it's still gone after a reload.

**If any step is awkward, confusing, or fails — the item is NOT done.** Say exactly which step broke
and what you saw. Do not mark it complete and move on. Do not weaken the test to make it pass.
