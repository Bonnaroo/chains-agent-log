# CHAINS — WORK QUEUE

**THIS QUEUE IS NEVER EMPTY. There is no state called "nothing left to do."**

The loop previously stalled because it worked down a short list, found it finished, and idled. That is
a bug, not a milestone. `company/SPEC.md` is a 32-section specification — the work is measured in
months. If this file's active section ever looks complete, **you pull the next item from Phase 2 below
and add it here yourself.** Never report "queue empty." Never wait for the owner to refill it.

The owner, plainly: *"There's not very much going on when I'm not here... I'm busy. You need to work
on this app."* He should not be the thing that unblocks you.

**Standing rule:** one feature at a time, finished properly. Overbuild rather than underbuild.
Ask Design *how* first — never hand it a solution you invented.

---

## PHASE 1 — SHIPPED (do not rebuild)

- [x] Replace all 47 native `window.confirm/alert/prompt` with in-app modals — v453
- [x] #5 pre-round back/cancel at every step + find and delete a sent invite — v454
- [x] #43 delete a round and it stays deleted (clears `playRounds` AND `liveRounds`) — v455/456
- [x] #7 resuming an in-progress round → direct Resume/Discard — v457
- [x] #10 version number visible on mobile — v458
- [x] #11 in-app Report a Bug writing to `/bugReports` — v459
- [x] #18 registered-field tab with stability — v460/461
- [x] #44 36h draft window + per-pick clock + autopick + timezone fix — v462
- [x] #45 achievements / badge shelf — v464
- [x] #42/#6 start-a-round defaults to solo, no "Player" chips
- [x] Post-finish edit with audit trail, mark-as-practice, starting hole, tee order, per-hole notes,
      adjustable par — v449→v452

---

## ACTIVE QUEUE — work top to bottom

### 1. Recent-partners must come from REAL history
- [ ] The picker seeded "recent partners" from stale round docs, so the owner saw friends he never
      added. Rounds were purged 2026-08-05; the CODE is unfixed.
- [ ] Source it from actual friend relationships and rounds genuinely played together
- [ ] Show nothing when there is no history — never invent a chip
- [ ] Guard: a round doc with unknown/legacy member keys must never produce a suggestion

### 2. UDisc-quality pass on the round flow (SPEC §5, §6)
Owner: *"This looks nothing like UDisc. That's what I'm trying to emulate."* **Ask Design how** — this
is its judgement, not yours. From the spec, still missing:
- [ ] Save a round **without keeping score**
- [ ] Enter an old round **manually**
- [ ] Front-nine / back-nine totals, player position, estimated finish time on the card
- [ ] Score verification for group rounds
- [ ] Automatic tee-order calculation (audio announcement optional)

### 3. Live viewer persistence (SPEC §30) — owner has raised this repeatedly
- [ ] Animation must NOT restart when the screen is reopened
- [ ] Derive state from saved round progress + timing: waiting at tee / driving / walking / approaching
      / putting / holing out / moving to next tee

### 4. Player statistics, real depth (SPEC §11)
- [ ] Averages by course and by layout; best and average on each hole
- [ ] Longest birdie streak, longest par-or-better streak, bogey-free rounds
- [ ] Filters: latest / month / year / previous year / all time / course / layout / casual / league
- [ ] **Ask Cowork for the per-hole/per-throw schema before building advanced stats** — inventing one
      means migrating it twice

### 5. Hole comparisons while playing (SPEC §13)
- [ ] Your average on this hole, your best, last five attempts, birdie %
- [ ] Shown *on the hole you're playing*, not buried in a stats screen

### 6. Bag depth (SPEC §15)
- [ ] Flight numbers, plastic, weight, colour, condition, purchase info, photo
- [ ] Multiple bags / loadouts; active vs stored
- [ ] **Per-disc stats from real scored rounds** — thrown how often, how it scores, longest throw.
      This is the differentiator: it links the bag to actual scoring.

### 7. Round & player ratings (SPEC §12)
- [ ] Per-round rating from score + course/layout difficulty + expected score
- [ ] Rolling player rating, history, trends
- [ ] **Must be labelled projected/unofficial**

### 8. Friends & profiles (SPEC §17)
- [ ] Public profile, stat comparison, recent-round feed, round invitations
- [ ] Privacy controls: who sees rounds, location, statistics

---

## WHEN THE ACTIVE QUEUE EMPTIES — REFILL IT YOURSELF

Read `company/briefs/ROADMAP.md` for the phase order and `company/SPEC.md` for the definition. Take the
next unstarted item, write it into the ACTIVE QUEUE above with real acceptance criteria drawn from the
spec, and start Phase A on it. **Do not ask permission. Do not idle. Do not report an empty queue.**

Rough order after the above: achievements depth (§18) → league features (§21) → live leaderboards (§23)
→ course reviews (§25) → practice tools (§16) → course discovery and maps (§1–§4, needs real course
data first) → offline (§20) → GPS-dependent work (§8, §9, §10, §14) → smartwatch (§19, **not until
phone scoring is rock solid**).

**Not in scope unless the owner reverses it:** course-management tools (§26), course analytics (§27),
store directory (§28), TD/tournament platform (§22), and any paywall (§32 — six users; do not build
monetization yet).

---

## BLOCKERS THAT NEED CLOSING (not features, but they gate real users)

- [ ] **`playRounds` is `.write: auth != null`** — `scorePatch`, `joinRequests`, `editHistory`,
      `practice`, `notes` all inherit full write access for any signed-in user. Firebase rules cascade
      and only ADD permission, so a child rule cannot restrict it. Needs granular per-field rules.
      **MUST close before anyone outside the six gets an account.**
- [ ] **League-code joiners get no `memberId`**, so they cannot be drafted; the six-member roster is
      hardcoded. Fixing it is the season-data migration — **do not attempt mid-season.**
