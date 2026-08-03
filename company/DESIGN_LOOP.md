# Design is a team member — the working loop

Owner directive, 2026-08-03: *"any changes that would require the design system to be involved you
need to include him as the main team member."*

Claude Design is not a tool. It is the role that owns the **app's UI and UX**, the same way Cowork
owns the **backend and data**. Neither ships the other's half.

## Who owns what

| | Design | Cowork (backend) |
|---|---|---|
| Owns | screens, flows, components, copy, anything a user sees or taps | Firebase nodes, security rules, accounts, data scripts, GitHub Actions, deploys |
| Never does | write security rules, provision accounts, hand-edit live data | hand-patch UI inside compiled modules to avoid asking Design |

**The rule:** if a change alters what a user sees or does, it goes to Design. Backend patches Cowork
makes directly are limited to logic/data/rules with no UI surface. When in doubt it is Design's.

## The loop (this is the workflow, follow it)

1. **Design raises a request** — what it wants to build, what it needs decided, what backend it needs.
2. **Cowork decides and builds** — answers every open question with a ruling and reasoning, then
   actually builds and **verifies** the backend (positive AND negative rule tests, real signed-in
   accounts). Never hand Design a brief that says "please build the backend."
3. **Cowork writes the brief back** in the established format:
   `0. Backend is DONE` (exact node shapes + verified rules) → decisions table → UI sections in
   priority order → guardrails → definition of done → *"what I need back from you."*
4. **Cowork pastes it into Design** — the owner should not be a copy/paste courier.
5. **Design exports**, ending with: version number, modules changed, issues closed, items skipped and
   why, **and anything backend it needed that wasn't there.** That last line is what keeps the loop
   honest — Cowork would rather build a gap than have Design work around it.
6. **Cowork verifies and deploys** — 3 levels, version bumped, anti-clobber rules, nothing reverted.

Everything lands in `company/briefs/` so all three of us can see the same state.

## Hard rules

- **Never interrupt Design mid-build.** Queue the next brief; don't send it while a build is running.
  That is how v438 got clobbered.
- **Version numbers must be reconciled.** Design numbered a build v445 while production was already
  on a different v445. Always tell Design the current live version and require the next export to be
  higher, and always re-fetch live `index.html` before exporting.
- **Backend claims in a brief must be tested, not asserted.** "Rules written" is not "rules verified."
- Design reads live truth from
  `https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html` — never its own memory of
  the app, which goes stale the moment Cowork ships anything.

## Why this exists

The scheduled agent roles produced 195 chat comments and one real app change (which clobbered a
deploy). Every meaningful thing shipped came from Design building UI or Cowork building backend,
working directly. This document makes that the official structure instead of the accident.
