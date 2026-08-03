# Chains — CURRENT STATE

_Generated 2026-08-03 21:24 UTC from live systems. Nothing here is typed by hand._

**Everyone reads this first — Cowork, Design, Engineer, Watcher, the owner.**
It exists so nobody works from a stale memory of the app.

## The app

- **Live version: `v445`** (2,347,147 bytes)
- Any new build MUST be numbered higher than `v445`.
- Fixes confirmed present in the live build:
  - ✅ `auth_gate`
  - ✅ `cdn_assets`
  - ✅ `fantasy_impact`
  - ✅ `in_the_bag_nav`
  - ✅ `login_required`
  - ✅ `round_save_fix`

> If a fix shows ❌ that you believe shipped, it was clobbered — see
> `company/playbooks/never-clobber-a-deploy.md` before deploying anything.

## Season

- Scored events: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14
- Next event: **T15 Discmania Challenge** (2026-08-07 → 2026-08-09, id 96415)
- Live poller is on: Discmania Challenge (id 96415)

## Registered field (can people draft?)

- ✅ **111 players** loaded for T15
- Roster unchanged for **0.0h** — still moving. (>24h = registration effectively done.)
- field.json updated: 2026-08-03T21:20:43.370045+00:00

## Work

- **23 open issues**, 13 tagged [TOP]
  - #5 [TOP][bug][owner] Go Throw pre-round flow has no cancel/back and no way to find+delete a
  - #6 [TOP][building][ready-for-build][bug][owner] Scoring screen shows placeholder 'Player, P
  - #7 [TOP][bug][owner] In-progress round forces you through 'Live Now' card instead of direct
  - #10 [TOP][bug][owner] Version number not visible on mobile (sw.js 404 half fixed in v438)
  - #11 [TOP][feature][owner] Report a Bug button (in-app feedback channel)
  - #18 [TOP][feature][source:owner] Add a visible "registered players / field" tab for the curr
  - #32 [TOP][owner-directive] Team focus shift: prioritize Go Throw section for near term
  - #34 [TOP][Go Throw][feature] Fantasy Impact on live scoring events
  - #40 [TOP][needs-owner-decision][Go Throw][epic] Real accounts - username + password login, r
  - #41 [TOP][Go Throw][In the Bag] Make In the Bag UDisc-grade: disc detail, flight numbers, st
  - #42 [TOP][Go Throw][bug] Start-a-round pre-fills people nobody chose (Will, Player, Player, 
  - #43 [TOP][Go Throw][bug] Rounds still cannot be deleted - delete reports success then the ro

## Who owns what

| | Design | Cowork (backend) |
|---|---|---|
| Owns | screens, flows, components, copy — anything a user sees or taps | Firebase nodes, rules, accounts, data scripts, Actions, deploys |

Full workflow: `company/DESIGN_LOOP.md`. Never interrupt Design mid-build.
Never deploy without the 3-level verification in `company/playbooks/production-verification.md`.
