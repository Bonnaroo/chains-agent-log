# Chains — Full Product Roadmap Brief

For the Claude Design project. Written 2026-08-03 against live **v448**.
Source: the owner's 32-section complete feature specification.

---

## 0. READ FIRST

**Live version is `v448`.** Always re-fetch
`https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html` before building, and number
every export **higher than what is live**. Two builds have already been clobbered by exporting from a
stale base — v447 shipped without the v444/v445 login fixes and had to be repaired into v448.

**Do not rebuild any of this. It exists and works today:**

| Already built | Module |
|---|---|
| Username/password login, forced first change, account panel | `ChainsAuth`, `AuthGate`, `ForcedPasswordChange` |
| Friends, friend codes (regenerable), QR generation | `ChainsFriends`, `ChainsQR` |
| League codes + join, `#add=` / `#league=` / `#watch=` deep links | league settings panel |
| Personal round scoring, resume-from-cloud, shared scoring | `ChainsRounds`, `PlayView` |
| In the Bag — own nav section, 1197-disc catalog, lost marking | `ChainsBag`, `BagView` |
| Aces (auto-detected from real rounds only) | `ChainsAces` |
| Badges / streaks | `ChainsBadges` |
| Fantasy Impact + pick alerts | `ChainsImpact` |
| Live tournament feed, hole-by-hole animated viewer | `CourseView`, Railway poller |
| Course catalog | `courses.json` in chains-dgpt-data |

---

## 1. THE HONEST SCOPE READ

The 32-section list is **three products**: UDisc (course discovery, scoring, stats, maps), PDGA Live
(tournaments, live leaderboards, TD tools), and a fantasy platform. UDisc has a full team and a
decade of work. We should not try to match it feature-for-feature — we will lose that race and ship
thirty half-features instead of six good ones.

**What we have that nobody else does: the fantasy season and the player's own game live in one app.**
`ChainsImpact` already connects a pro's birdie to your fantasy standing in real time. No competitor
does this. Every phase below is sequenced to deepen that, not to chase UDisc's feature count.

**The rule for this roadmap: finish a feature before starting the next one.** The owner's standard,
stated plainly: *"we're starting to work on each feature, fill them out so they're feature rich and
they're not bugged, and they work very well."*

---

## 2. PHASE 1 — FINISH WHAT'S HALF-BUILT (do this first, nothing else)

These are open bugs on features that already exist. They are the reason the app feels unfinished, and
every one of them has bitten the owner personally.

1. **#43 — rounds cannot be deleted.** `deleteRound` returns success without awaiting the delete and
   never touches the legacy `chains-fantasy/play_rounds` node. Must await, cover every store, and
   report real failure. Shared rounds: hide-for-me, not hard-delete. Add bulk cleanup.
2. **#42 / #6 — start-a-round pre-fills "Player, Player, Player."** Corrupted local member cache is
   rendered as literal placeholder chips. Default to solo; never render a row named "Player";
   adding people is explicit (friends / recent partners / guest / QR).
3. **#5 — no cancel/back in the pre-round flow**, and no way to find and delete a sent invite.
4. **#7 — resuming an in-progress round** should be direct Resume/Discard, not routed via Live Now.
5. **#10 — version number invisible on mobile** (it lives in the desktop sidebar only).
6. **#11 — in-app "Report a Bug"** writing to Firebase `/bugReports` (already watched, nothing writes
   to it yet).
7. **#18 — visible "registered field" tab** for the current tournament. `field.json` now carries 110+
   players plus `stable_hours`; surface it so people can see who's actually registered before drafting.
8. **Draft window (#44)** — picks open **36 hours** before event start (owner decision). Needs a new
   "Picks open in Xd HH:MM:SS" state. **Strongly paired with a per-pick clock (~4h) and autopick** —
   the draft is turn-based, so one slow picker blocks all twelve turns regardless of window width.

Maps to owner sections: 5 (scorecards), 6 (shared scoring), 29 (fantasy), 31 (notifications).

---

## 3. PHASE 2 — DEEPEN SCORING & STATS (the core loop)

**§7 Basic / advanced / map scoring** — quick scoring stays the default, one tap per player per hole,
defaulting to par. Advanced stats are an *optional layer* and must never slow the fast path. This is
the #1 complaint in competitor reviews.

**§11 Player statistics** — we already compute rounds, best, average, birdie/par/bogey. Add: C1/C2
putting %, fairway hits, greens in regulation, scramble %, OB %, per-course and per-layout averages,
per-hole best/average, streaks. Filterable by recent / month / year / all-time / course / round type.

**§13 Hole comparisons** — your average on this hole, your best, last five attempts, course average,
birdie %. Show it *while playing the hole*.

**§12 Round & player ratings** — a per-round performance rating and a rolling player rating. Must be
labelled **projected/unofficial**. This is the strongest "keep opening the app" feature in the list.

**§15 Bag depth (#41)** — flight numbers (speed/glide/turn/fade), plastic, weight, colour, condition.
Then the differentiator: **per-disc stats derived from real scored rounds** — how often thrown, how it
scores, longest throw. That links the bag to actual scoring, which competitors do poorly.

**§18 Achievements** — extend `ChainsBadges`: first ace, bogey-free round, personal best, new course,
streaks, and fantasy-specific ones (drafted the winner, won from behind).

---

## 4. PHASE 3 — SOCIAL & COMPETITION

**§17 Friends & community** — friends now exist; add public profiles, stat comparison, recent-round
feed, round invitations, privacy controls (who sees rounds / location / stats).

**§21 League features** — recurring weekly events, divisions, handicap scoring, season standings,
bag tags, ace pools, closest-to-pin. The league code + membership backend is already live.

**§23 Live leaderboards** — extend the existing tournament view: position, division, thru, projected
finish, movement.

**§30 Animated live viewer** — already built. Remaining work is **persistence**: it must resume from
saved round progress, not restart on every screen open. Owner has flagged this repeatedly.

**§25 Course reviews & photos** — ratings by category (design, maintenance, navigation, scenery,
signage, safety, beginner-friendliness), written reviews, photos, helpful sorting.

---

## 5. PHASE 4 — COURSE PLATFORM (big, needs real data)

**§1 Course discovery**, **§2 conditions**, **§3 maps/navigation**, **§4 layouts**, **§24 traffic**.

This is the largest chunk and it is **data-bound, not UI-bound**. `courses.json` exists and the Course
Scout is filling it state by state, but hole-level maps, GPS tee/basket coordinates, layouts and
distances are not there. Reviewing course conditions or drawing fairways is pointless without them.

Build order when we get here: search + filters + course detail → played/wishlist tracking →
conditions reporting → hole maps → multiple layouts → traffic.

**§26 course-management tools and §27 course analytics are out of scope for now.** Those serve course
owners and parks departments — a different customer, a different product, and a support burden.
Revisit only if that becomes a deliberate business direction.

---

## 6. PHASE 5 — LATER / PREMIUM

- **§8 throw tracking, §9 GPS rangefinder, §10 measure-a-throw, §14 activity tracking** — all need
  device GPS, which we have not touched. Real work, high value, but after the core is solid.
- **§16 practice tools** — putting/accuracy/approach with streaks and records. Self-contained; can
  slot in earlier if wanted.
- **§19 smartwatch** — **do not build until phone scoring is rock solid.** This is where competitors
  get their worst reviews (watches jumping to old holes). Server state must be authoritative.
- **§20 offline play** — partly there via localStorage. Needs deliberate design: preloaded maps,
  queued writes, conflict resolution on reconnect.
- **§22 tournament/TD tools** — a whole product. Only if we decide to compete with PDGA Live.
- **§28 store directory** — needs business relationships, not code.
- **§32 free vs premium** — the split in the spec is sensible (free stays fully usable; premium =
  deeper analysis, ratings, traffic, watch, unlimited fantasy). **Do not build paywalls yet.** We
  have six users. Revisit at real scale, and be explicit about what's locked *before* asking for money.

---

## 7. BACKEND — MY HALF (Cowork), by phase

**Already live and verified:** accounts + forced password change; `usernames`, `users/{uid}/profile`;
`leagueCodes` (commissioner-only write, verified both directions); `friendRequests` (sender creates,
recipient deletes, forgery denied); `friendCodes` (self-only write); `leagues/chains-dgpt-2026` with
all six members; seeded league code `CHAINS26`; `field.json` with `player_count` / `stable_hours`.

**Known gaps I owe:**
- `playRounds` is `.write: auth != null` — fully permissive; `joinRequests` inherits it. Needs tightening.
- A league-code joiner gets membership but **no `memberId`**, so they cannot be drafted. I can assign
  `memberId = username` on join; them *appearing in the draft* needs the hardcoded six-person roster
  to become dynamic — that is the **season-data migration**.
- **Season-data migration is the single biggest blocker** to multi-league. The live 2026 season sits in
  the legacy `chains-fantasy /league` node, globally readable, no tenancy. It must not be attempted
  mid-season. Until then, the interim rule stands: the known six see Chains, everyone else sees an
  empty-league state.
- Phase 2 stats need a per-throw/per-hole schema decision before advanced scoring is built. **Ask me
  for it — don't invent one**, or we'll migrate it twice.
- Phase 4 needs a real course-data schema (GPS tee/basket coords, layouts, hole distances).

---

## 8. WHAT NEEDS AN OWNER DECISION (don't guess)

1. Do we ever want to serve **course managers / parks departments** (§26, §27)? Different customer.
2. Do we compete with **PDGA Live** on TD tools (§22), or stay a player-and-fantasy app?
3. Is **GPS** in scope? It gates §3, §8, §9, §10, §14 and changes permissions/battery/privacy.
4. **Monetization timing** (§32) — nothing built until this is decided.

---

## 9. DEFINITION OF DONE — PHASE 1 ONLY

Do not start Phase 2 until every one of these is true:

- [ ] A round can be deleted and stays deleted; shared rounds hide-for-me; bulk cleanup exists
- [ ] Starting a round defaults to solo; no chip ever reads "Player"; adding people is explicit
- [ ] Every step of the pre-round flow has a back/cancel; sent invites can be found and deleted
- [ ] An in-progress round offers direct Resume / Discard
- [ ] Version number visible on mobile
- [ ] In-app Report a Bug writes to `/bugReports`
- [ ] Registered field is visible before drafting, with how long it's been stable
- [ ] Picks open exactly 36h before start, with a per-pick clock and autopick
- [ ] Version bumped above live, changelog written, nothing from v448 reverted

---

## 10. WHAT I NEED BACK FROM YOU

End every export with, as plain text I can commit:
1. New version number
2. Modules changed, by name
3. Which items are done vs. deliberately skipped, and why
4. **Any backend you needed that wasn't there** — that's my half of the loop, and I'd rather build it
   than have you work around it.

And tell me if you disagree with the phase order. You see the UI surface; if something in Phase 3 is
actually cheap because of how a component is built, say so and I'll re-sequence.
