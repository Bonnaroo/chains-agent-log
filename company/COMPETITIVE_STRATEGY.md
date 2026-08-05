# CHAINS vs UDISC — what the research says, and what we do about it

Built from UDisc's own forum, App Store / Play Store reviews, and disc golf community sites. This is
not opinion; every claim below traces to what real UDisc users are actually saying. **Read this before
arguing about priorities.** The owner's standard is "make it feel like UDisc" — this file says which
parts of UDisc to match, which to beat, and which to leave alone.

---

## UDisc's real moat — DO NOT attack this head-on
**10,000+ mapped courses with hole-level GPS layouts.** Years of crowdsourced data. We will not
replicate it quickly, and trying would burn the whole roadmap. SPEC §1–§4 (course discovery, maps,
layouts) is **data-bound, not UI-bound** — `courses.json` exists but hole maps, tee/basket coordinates
and distances do not. Treat course discovery as long-horizon, not next-quarter.

Where that leaves us: **be a companion-strength app on gear, social and fantasy** — the areas UDisc
users are actively complaining about — rather than a worse clone of its course database.

---

## Their three biggest weaknesses = our three biggest openings

### 1. The paywall is UDisc's single loudest complaint
Free accounts are capped at **10 scorecards**. Users say basic scorekeeping should not be gated, and
many explicitly ask for a **one-time purchase instead of a subscription**. That's a validated demand
signal, not a guess.

**Our move:** unlimited free scoring, permanently. This already matches SPEC §32 ("make the free
version completely usable") and the existing rule *do not build paywalls at six users*. When
monetization eventually happens, charge for depth (advanced analysis, ratings, traffic) and strongly
consider a one-time tier. **Never cap scorecards.** That single decision is worth more goodwill than
any feature we could ship.

### 2. The "disc shelf" — requested for years, still not shipped
The most detailed wishlist on UDisc's own forum is a social disc logbook: owned / former / wanted
discs, **wear tracking and how condition affects flight**, community reviews from *similarly-skilled*
players, and **bag comparisons with friends or pros**. A UDisc team member replied positively over a
year ago and it still doesn't exist.

**Our move — this is the highest-leverage thing in the whole roadmap.** We already have **In the Bag**
with a 1197-disc catalog. It is the feature their users are begging for. Queue item 6 (SPEC §15) should
go deeper than UDisc ever has:
- flight numbers, plastic, weight, colour, **condition/wear**
- owned vs former vs wishlist (their exact ask)
- multiple bags, active vs stored
- **per-disc stats derived from real scored rounds** — thrown how often, how it scores, longest throw
- bag sharing and comparison with friends
Nobody else links the bag to actual scoring data. That's the differentiator, and it's already half built.

### 3. Course reviews aren't trusted
UDisc's ratings are seen as inconsistently calibrated with no skill-level breakdown; one community
member called the review content "junk" versus dedicated sites. Their **Ambassador approval process**
for course edits is seen as gatekeeping that stops locals fixing bad data.

**Our move (SPEC §25):** rate by skill level — a beginner and a pro rating the same hole differently is
*signal, not noise*. And let locals correct course data without an approval priesthood. Trust
compounds: the more people use it the better it gets, and it's culturally hard for an incumbent to
retrofit.

---

## What they're good at — this is the bar, not the target
- **On-course utility**: GPS navigation, hole maps, scoring depth. Reviewers compare the scoring UI
  favourably to pro broadcasts.
- **Intuitive for casual AND serious players simultaneously.** That's the hard part of the design.
- Apple Watch *concept* is loved.

**Match this, don't try to beat it.** Course-finding and scoring are table stakes — they don't win
users, but their absence loses them.

---

## Their bugs = our minimum standard
- **GPS accuracy**: users report standing inside Circle 1 while the app records Circle 2, which
  corrupts their stats. → If we ship C1/C2 tracking (SPEC §7, §11), it must be *right*, or make it
  manual. Wrong stats are worse than no stats.
- **Apple Watch is glitchy and years behind.** → Confirms the existing rule: **do not build the watch
  (§19) until phone scoring is rock solid.** Their worst reviews live here.
- **Live social during rounds barely exists** — seeing friends' hole-by-hole progress in real time was
  a top forum request. → We already have shared scoring, `liveRounds`, and the animated viewer.
  Queue item 3 (viewer persistence, SPEC §30) is directly on this seam.

---

## What we have that UDisc has no answer to
**The fantasy season and your own game in one app.** `ChainsImpact` already ties a pro's birdie to your
fantasy standing in real time. UDisc has no fantasy product. Fantasy is what makes Chains *sticky
between rounds* — UDisc is only open when you're playing.

Every phase should deepen that link. Concretely: fantasy-linked achievements (drafted the winner, won
from behind), your bag stats next to the pros you drafted, live leaderboards that matter to your team.

---

## Priority implication for the queue
Nothing above changes queue order 1–3 (fix phantom partners, UDisc-quality round flow, live viewer
persistence) — those are correctness and polish on what exists.

**It does raise item 6 (Bag depth).** It is the clearest validated demand in the entire disc golf
market, we already have the catalog built, and the incumbent has publicly declined to ship it. When
items 1–3 close, **do 6 before 4 and 5.**
