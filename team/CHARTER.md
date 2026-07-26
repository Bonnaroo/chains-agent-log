# CHARTER — what Chains is (read every shift so you know the product)

**Chains** is a fantasy disc golf LEAGUE app with built-in personal round tracking ("Go Throw"), owned by
Guillermo. Goal: launch a polished, secure app with as few bugs as possible and NO dead-ends.

## The two halves
1. FANTASY LEAGUE: friends form a league and, before each DGPT (Disc Golf Pro Tour) event, each member drafts
   two real tour pros (snake order). The pros' real finishes score the members; lowest total wins the event;
   finishes pay 6->1 with competition ranking for ties; season standings accumulate. Screens: Dashboard, The
   Picks/Draft, Standings, Live Chains (live tournament scoring), Watch.
2. GO THROW: personal disc-golf round tracker (like UDisc, "our own"). Start a solo round now or plan+invite;
   blank-until-entered per-hole scoring; persistent 18-hole scorecard, tap any hole to edit; finish + share;
   round history; live-watch a friend. Plus "In the Bag" (disc bag tracker) and Settings.

## Audience
Disc golf crews (groups of friends) who want to draft pros AND track their own casual rounds in one app.

## Tech reality
Built in Claude Design (no-code), ships as one index.html on GitHub Pages. Data in Firebase RTDB
(chains-app-f38f8). Marketing site at bonnaroo.github.io/chains-site (waitlist self-collects into Firebase
/waitlist). See team/ROADMAP.md for the full feature spec, the 6 audit principles, and the adversarial catalog.

## Current status (keep updated by PM)
Live app = v403 (betting removed, Go Throw scoring overhaul). v404 (Go Throw polish) building/deploying.
Top priority: a reachable Cancel/Delete control for in-progress rounds (the anchor "no way out" bug).
Launch-critical majors: real email/password accounts, real-registered-player + real-event-field picks with
pre-tournament PDGA/DGPT verification, an escape-hatch sweep, a Firebase security pass.
