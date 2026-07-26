# CHAINS — Product Roadmap & Spec (the "how it should work" bible)

Purpose: this is the definition of how the Chains app SHOULD behave at launch. The audit agent tests the
REAL app against this spec every run and files every gap as a bug in PROGRESS.md (severity: blocker/major/
minor). When Guillermo changes the vision, update THIS file first; the agent audits against it.
Raw: https://raw.githubusercontent.com/Bonnaroo/chains-agent-log/main/ROADMAP.md

## LAUNCH GOAL
A polished, secure fantasy disc-golf LEAGUE app with built-in round tracking. Real people sign up, add
friends, form a league, draft real DGPT pros before each event, and watch their picks score live all
weekend — PLUS track their own casual rounds in Go Throw. Launch with as few bugs as possible, real
accounts, real security, and NO dead-ends anywhere.

## THE 6 PRINCIPLES THE AUDIT ENFORCES (test every screen/button against these)
1. WAY OUT: every screen and every clickable control has an escape — back / cancel / close / undo — and a
   short explanation where the action isn't obvious. No dead-ends, no trap states, no "now what?" screens.
2. DESTRUCTIVE + IN-PROGRESS ACTIONS ARE REACHABLE: cancelling a round mid-play, leaving a league, removing
   a friend, changing/removing a pick, deleting a finished round — each has a clear, findable control with a
   confirm step. (Anchor example / known gap: a LIVE round with no cancel button — that must never exist.)
3. DATA SURVIVES: everything a user does persists correctly and survives a refresh / re-login. Nothing
   silently lost, nothing duplicated, no ghost/stuck records (e.g. "open" rounds that can't be closed).
4. ADVERSARIAL BY DEFAULT: assume users are both careless AND clever. For every feature run the thought
   experiment "how could a normal person break this, and how could a motivated person exploit it?" — then
   close the gap. If it CAN be done, someone WILL do it.
5. TRUTH OF DATA: every pick list is drawn from REAL registered entities — league drafts pick from actually
   registered league members; pro drafts pick from the REAL field entered in that event, cross-checked
   against the live source (PDGA/DGPT) before each tournament. No stale, fake, or hard-coded rosters.
6. SECURITY & LEAST PRIVILEGE: real auth; a user can only read/write their OWN data and data for leagues
   they belong to; no impersonation, no reading others' private data, no open-write to sensitive nodes.

## FEATURE MAP — expected behavior + escape hatches + what to audit
### Auth & Accounts  [MAJOR GAP: currently test-mode "pick your name," no password]
Target: real email/password sign-up + login; session persists across refresh; logout; password reset;
optional anonymous "try" mode kept separate from real accounts. Audit: can't impersonate another user;
can't see another user's data; password reset works; logout actually clears session.
### Friends
Add / accept / remove friends, drawn from registered users only. Escape hatches on every step. Audit:
can't add a non-user silently; removing a friend is reachable + confirmed; pending requests are visible.
### Leagues
Create a league; invite registered friends; commissioner controls (pick locks, single-pick weeks, score
entry, edits); members get a read-only board; LEAVE a league (confirm); commissioner can remove a member /
delete the league (confirm). Audit: leaving mid-season keeps standings coherent; only the commissioner has
commissioner powers.
### The Picks / Draft
When it's your turn, you draft from the REAL pool: for pro drafts that's the actual field entered in the
upcoming event; snake order; two picks per member per event; change a pick freely BEFORE first-tee lock;
locked after. Audit (principle 5): the selectable list = the real event field, verified pre-tournament;
you can't draft the same pro twice, can't draft after lock, can't draft someone not in the field; a pro who
WDs is handled per the WD rule, not left as a silent broken pick.
### Pro-field verification (pre-tournament job)
Before each event the agent cross-checks the app's pickable pro list against the real field on the live
source (PDGA/DGPT event page) and flags/queues a fix if they don't match. This is a recurring audit item,
not a one-off.
### Standings
Cumulative season + per-event; correct scoring math (finishes pay 6→1 with competition ranking for ties);
updates as pro scores post. Audit: ties handled right; totals reconcile with per-event points.
### Live Chains / Watch
Live tournament scoring updates in (near) real time; spectate a friend's in-progress round; no stale data.
Audit: values actually refresh; no frozen boards; watching a round that ends resolves cleanly.
### Go Throw (personal round tracker)
Start a SOLO round right now (no forced invite) OR plan+invite; per-hole scoring starts blank (no par
prefill); persistent 18-hole scorecard, tap any hole to edit; next-hole gating; CANCEL/DELETE a round
mid-play (KNOWN GAP — must exist) AND delete a finished round; finish → shareable summary; round history;
live-watch. Audit: no round can get "stuck open" with no way to end/cancel it; deleting is reachable +
confirmed; refresh mid-round keeps scores.
### In the Bag
Disc bag tracker + brand→mold disc picker. Audit: add/remove discs has escape hatches; picker data loads.
### Settings
Display name, avatar, units (ft/m), logout, delete-my-account/data (confirm). Audit: changes persist.

## SECURITY / DATA CHECKLIST (audit every run at least at spot-check depth)
- Firebase rules: auth != null; users read/write only their own node; league data scoped to members;
  no world-writable sensitive nodes. (The public web API key is fine to ship; it is not a secret.)
- Input validation: emails, scores (sane range), names, no script injection in user-entered text.
- Abuse/rate: waitlist spam, round spam, pick spam — basic guards.
- Privacy: no PII in URLs/query strings; no cross-user data leakage.
- Never touch the legacy chains-fantasy /league DB (the live 6-friend league) — different project, off-limits.

## ADVERSARIAL / EDGE-CASE CATALOG (run these as thought experiments; append new ones every run)
- Cancel/abandon a round mid-hole — is there a control? (was NO — anchor gap)
- Two people scoring the same live round at once — conflicts / last-write-wins problems?
- Draft a pro who then withdraws, or who isn't actually in the field.
- Draft the same pro twice, or draft after the lock.
- Leave a league mid-season — do standings stay coherent?
- Refresh / lose signal mid-scoring — does data survive?
- Log in on two devices at once.
- Brand-new user empty states (no friends, no league, no rounds) — are they friendly, not broken?
- Enter garbage (huge score, emoji name, empty pick) — handled gracefully?
- Back button / browser refresh on every screen — any dead-ends?

## KNOWN GAPS / TARGET FEATURES (seed the PROGRESS.md backlog from these; keep in sync)
- BLOCKER: no UI way to cancel/delete an IN-PROGRESS (live/open) round. Build a reachable Cancel Round
  (mid-play, confirm) + Delete Round (finished) control. (Stuck test rounds were cleared from Firebase
  2026-07-26, but the missing control is the real fix.)
- MAJOR: real email/password accounts for launch (replace test-mode name-pick), with logout + reset.
- MAJOR: draft pool = real registered players / real event field; pre-tournament field verification vs PDGA/DGPT.
- MAJOR: full escape-hatch sweep — every screen/button gets a Way Out per principle 1.
- MAJOR: security pass on Firebase rules per the checklist above.
- (agent appends as audits surface more)

## ONCE LIVE (future)
When the app has real users, the agent also reads in-app feedback / bug reports / comments and turns them
into backlog items, same triage (blocker/major/minor), same fix loop.
