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

---

## 9. Replace all native `window.confirm()` popups (~28 of them)
- [ ] Resume-round, discard, delete and every other confirm becomes an **in-app modal**
- [ ] Two reasons, both real: native dialogs look broken on mobile, AND they freeze all browser
      automation until a human clicks — which blocked five straight verification cycles
- [ ] Nothing may silently change data without a confirmation the app itself owns

---

# WHEN THIS QUEUE IS DONE — DO NOT STOP HERE

The round is the *first* phase, not the whole product. The owner gave a complete 32-section feature
specification. It is sequenced into five phases in **`company/briefs/ROADMAP.md`** — read it and
continue from **Phase 2**. Do not re-derive the plan; it already exists.

**What comes next, in order (full detail in ROADMAP.md):**

**Phase 2 — deepen scoring & stats (the core loop)**
- Basic / advanced / map-based scoring modes (quick scoring stays the default, always)
- Full player statistics: C1/C2 putting %, fairway hits, GIR, scramble %, OB %, per-course and
  per-layout averages, per-hole best/average, streaks — filterable by recent/month/year/all-time
- Hole comparisons shown **while you're playing that hole** — your average, your best, last five,
  course average, birdie %
- Round & player ratings (labelled projected/unofficial until official)
- **In the Bag depth (#41)** — flight numbers (speed/glide/turn/fade), plastic, weight, colour,
  condition; multiple bags/loadouts; in-bag vs collection; share your bag. Then the differentiator:
  **per-disc stats derived from real scored rounds** — how often thrown, how it scores, longest
  throw. That links the bag to actual scoring, which competitors do poorly. This one matters.
- Achievements extending ChainsBadges (first ace, bogey-free, personal best, new course, streaks,
  and fantasy ones — drafted the winner, won from behind)

**Phase 3 — social & competition**
Friends profiles + stat comparison + privacy controls · league features (recurring weeklies,
divisions, handicaps, season standings, bag tags, ace pools, closest-to-pin) · live leaderboards ·
**animated live viewer persistence** (it must resume from saved progress, not restart on every open —
the owner has raised this repeatedly) · course reviews & photos

**Phase 4 — course platform** (data-bound, not UI-bound; needs real course data first)
Discovery + filters · conditions reporting · hole maps & navigation · multiple layouts · traffic

**Phase 5 — later / premium**
Throw tracking · GPS rangefinder · measure-a-throw · activity tracking · practice tools ·
smartwatch (NOT until phone scoring is rock solid) · offline · scorecard photo import ·
free/premium split (do not build paywalls at six users)

**Explicitly out of scope unless the owner reverses it:** course-management tools for arbitrary
courses, parks-department analytics, store directory, and a public multi-league tournament platform.
Different customers, different products.

**The standing rule for all of it:** finish a feature before starting the next. Overbuild rather than
underbuild. The differentiator is that the fantasy season and your own game live in one app — every
phase should deepen that, not chase UDisc's feature count.
