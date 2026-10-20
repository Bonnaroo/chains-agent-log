# CHAINS — Master Brief (everything, as of 2026-08-02, live = v440)

Paste this whole file into Claude Design as your first message.
Design project: https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9

This supersedes the two earlier briefs (`design-brief-gothrow-v440.md`,
`design-brief-accounts-login.md`). Everything is here.

---

# PART 0 — READ BEFORE YOU TOUCH ANYTHING

## 0.1 Your copy of the app is stale and will destroy work

Design believes the app is on **v438**. **Production is v440.** Versions 439 and 440 were shipped
as direct module patches to GitHub, not through Design. **If you export from your current state you
will silently wipe out five shipped fixes.**

**First action, every session:** fetch the real build.

```
https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html
```

Confirm you can see `Fantasy DGPT <span ...>v440</span>` (or higher) before you edit anything.
If the version you see is lower, you have the wrong file.

## 0.2 Five things that must survive every edit

| Shipped fix | Where | Marker that must still exist |
|---|---|---|
| Go Throw save + delete permission fix | `window.ChainsRounds` | `function authUid()` **and** `function _indexWrite(` |
| European Open completion (unblocks Cory) | seed-data module | `proWinner: "Teemu Paakinen"` on `t: 10` |
| In the Bag as its own nav section | app shell | `label: "In the Bag"` in `nav`, and `view === "bag"` in the router |
| Manual "Log an ace" removed | `AcesWall` in PlayView | **no** `logManual`, **no** `"Log an ace"` |
| Run a League entry point removed | PlayView | **no** `setShowWeeklies(true)` button |

## 0.3 Never clobber a deploy

This already happened once: a v438 deploy was wiped 2.5 minutes after shipping because another
agent wrote the whole 9.6MB `index.html` from a copy it had fetched earlier. GitHub's sha check did
**not** catch it — the sha was fresh, the content was stale.

Rules (full version: `company/playbooks/never-clobber-a-deploy.md`):

1. Check `company/BUILD_LOCK.json`. If `locked: true` and unexpired — stop, work something else.
2. Re-fetch `index.html` as the **last step** before building your export. Never patch a copy you
   fetched earlier in the session.
3. Note the version marker before and after. If it moved while you worked, rebase onto their build.
4. **Always bump the version.** Same-or-lower version = you clobbered someone.
5. Preserve modules you don't recognize — they're someone else's fix.

## 0.4 Verification — three levels, no exceptions

A change is not done until all three pass. Never weaken a check to force a pass.

1. **Artifact** — decompress the committed file and confirm your change is actually in it.
   The app is a single HTML file containing gzip+base64 module blobs matching `"data":"<base64>"`.
   A plain `grep` returns nothing even when text is present. Decompress with
   `zlib.decompress(base64.b64decode(b), 16 + zlib.MAX_WBITS)`.
2. **Deployment** — fetch the live URL and confirm the version marker. The GitHub Pages CDN lags a
   few minutes and browser tabs cache hard; use a cache-busted URL.
3. **Functional** — open it in a real browser and actually use the thing you changed.

---

# PART 1 — ARCHITECTURE (so you don't rediscover it)

## 1.1 Two Firebase projects. Do not mix them up.

**`chains-app-f38f8`** — the NEW app.
- `playRounds/{id}`, `liveRounds/{id}`, `users/{uid}/…`, `usernames/{username}`, `friends`,
  `bugReports`, `admins`, `leagues`
- Rules: `users/$userId` requires `$userId === auth.uid`. Most other nodes require `auth != null`.

**`chains-fantasy`** — the LEGACY project the fantasy season still runs on.
- `/league` — picks & scores for the live 2026 season (T1–T14)
- `/live` — tournament feed, written every ~25s by an external Railway poller. **Never write here.**
- `/play_rounds` — an old Go Throw store that still holds records

**Key encoding gotcha:** under `/league/keys/`, `~<charcode>~` escapes characters Firebase keys
can't hold. `~46~` is an escaped `.` — so `picks~46~14` means `picks.14` = **tournament 14**.
There is no "T46". A past agent misread this and filed three false CRITICAL data-loss alarms.

## 1.2 Identity — the single most important thing to understand

- `ChainsID.whoami()` → app-level member id: `"will"`, `"kyle"`, …
- `ChainsFB.auth.currentUser.uid` → real Firebase uid: `"wp1ywNFroiZzCOUqvezfuJYYAYd2"`

**These are different values.** Writing to `users/{whoami()}/…` fails the security rule. Because it
was inside an atomic multi-path `update()`, that one illegal path killed the *entire* write —
which is why round save *and* delete were both silently broken. `authUid()` and `_indexWrite()`
fixed it. Keep this in mind for anything new you write under `users/`.

## 1.3 Modules already in the build

| Module | Purpose |
|---|---|
| `window.ChainsAuth` | Username+password auth. `signUp, signIn, signOut, linkPassword, onChange, current, sessionId, emailFor, available, friendlyError, saveOnboarding, saveProfile, markOnboarded, isOnboarded, fetchOnboarded, localProfile, coins, adjustCoins` |
| `window.ChainsRounds` | Go Throw round store. `start, save, finalize, remove, loadMine, loadGroup, headToHead, available`. Local mirror: `localStorage["chains_rounds_v1"]` |
| `window.ChainsBag` | Disc bag. `get, hydrate, effectiveCount, setCount, addDisc, addDiscObj, bagType, removeDisc, setLost, breakdown, loadCatalog, stabilityColor, TYPES` |
| `window.BagView({onBack, mobile})` | Standalone In the Bag screen, routed at `#bag` |
| `window.PlayView` | Go Throw screen. `LAST_GROUP_KEY = "chains_play_lastgroup"`, `LAST_COURSE_KEY = "chains_play_lastcourse"` |
| `window.ChainsAces` | Ace log; auto-detects a 1 on a par-3+ while scoring |
| `window.ChainsAdmin` | `isOwner()` — checks `admins/{uid} === true` with an OWNER_UID fallback |
| `window.ChainsBadges` | Badges/streaks derived from rounds |

---

# PART 2 — ACCOUNTS & LOGIN

## 2.1 The backend is DONE. Do not rebuild it.

Verified working 2026-08-02:

- Firebase **Email/Password provider is enabled**.
- `ChainsAuth` already maps username → synthetic email `username@chains.app`, so **nobody ever
  types an email address**. `ChainsAuth.sessionId()` resolves the account back to the member id
  every existing screen keys on.
- **All six accounts provisioned, every sign-in tested:**

| Username | Password | Member | Firebase uid |
|---|---|---|---|
| `will` | `chains1234` | Will *(owner)* | `wp1ywNFroiZzCOUqvezfuJYYAYd2` |
| `cory` | `chains1234` | Cory | `fJPXm2FJiSayOtfhpK7RJDaqNUJ3` |
| `kyle` | `chains1234` | Kyle | `LoVsKQWMXoQa6daNo3eINmSRCcs1` |
| `shanna` | `chains1234` | Shanna | `Gmewm5Ll1XeCgcVkrIOc44Z8k1j1` |
| `gabe` | `chains1234` | Gabe | `2ZGiHBt5gofD1z8B5sKLyyl5vq43` |
| `kadey` | `chains1234` | Kadey | `PiZrpHVIoGP9rbE5FhrCAyg57xB2` |

- `usernames/{username}` → `{name, disc, uid, memberId}` — readable by any signed-in user
  (needed to resolve a username at login).
- `users/{uid}/profile` → `{username, memberId, name, disc, leagues, mustChangePassword}` —
  readable/writable **only by that user**. Verified: Kyle can read his own and is denied Will's.
- **All six**, owner included, have `mustChangePassword: true`. Nobody is exempt.
- Owner gate: `admins/{will uid} = true` and `profile.isOwner = true`. That is the *only* thing
  special about the owner account — he logs in exactly like everyone else.

**The owner's message to the group:** *"Your username is your first name, your password is
`chains1234`."* Build for that. (Note: `1234` alone was impossible — Firebase enforces 6 characters
minimum.)

## 2.2 Login gate

Replace the "Who's playing? Tap your name" identity picker with real sign-in.

- Two fields: **Username**, **Password**. No email field.
- Lowercase and trim the username — `will`, `Will`, ` WILL ` must all work.
- Friendly errors via `ChainsAuth.friendlyError`. Never reveal whether a username exists.
- **Stay signed in** (persistence is already LOCAL). Nobody logs in twice on the same device.
- **Sign out** in Settings.
- Keep anonymous/name-pick **only** as a fallback when `ChainsAuth.available()` is false
  (Firebase blocked/offline). Do not offer it as a normal option.

## 2.3 Forced password change on first login

If `users/{uid}/profile.mustChangePassword === true`, the user hits a change-password screen before
reaching the app. Not skippable.

- New password + confirm. Minimum 6 characters — state it up front, don't wait for the error.
- Reject reusing `chains1234`.
- On success: update password, set `mustChangePassword: false`, continue in.
- Offer on the same screen, clearly optional and skippable: **pick a different username**, and
  **add an email so you can reset it yourself**. Email is never required — say so.

## 2.4 Profile management (Settings)

- **Change password** — current, new, confirm.
- **Change username** — must be unique. Write new `usernames/{new}`, delete the old, update
  `profile.username`, and update the Firebase account email to `newname@chains.app` so sign-in keeps
  working. Do it as one transaction with clean rollback. **Never change `memberId`** — that is what
  ties them to their league history and must stay stable forever.
- **Add/change email (optional)** — only so they can self-serve a reset.

## 2.5 Owner console — account recovery

The owner asked to be able to "recover" passwords. **He can't, and neither can we** — Firebase
stores only a salted hash. Do not build anything that stores or displays passwords. Build **reset**,
which is what he actually needs:

- List every member: username, name, member id, whether they've changed the starter password,
  last sign-in.
- **Reset password** per member → owner sets or generates a temporary password, it's applied, and
  `mustChangePassword` is set back to `true`. Show it once on screen for him to pass along.
  Never persist it.
- **Add a member** — username + starter password + member id link.
- Copy should say plainly: *"Passwords can't be looked up — only reset. That's deliberate: it means
  nobody, including you, can read someone's password."*

## 2.6 League isolation

Owner's requirement: *"Where other people log in, they shouldn't see our league. Our league is
specific to us."*

**Current state:** the fantasy season lives in the legacy `chains-fantasy` `/league` node, globally
readable, no tenancy at all. Anyone who signs in today sees the Chains league.

**Build now:**
- Use `users/{uid}/profile.leagues` (already seeded `{"chains-dgpt-2026": true}` for all six) as the
  source of truth for "which leagues am I in".
- A user with no leagues gets an empty state — *"You're not in a league yet"* — with **Create a
  league** and **Join with a code**. Never the Chains league.
- **Interim rule that is acceptable and unblocks outside testers:** if the signed-in user is one of
  the six known members, show Chains as today; anyone else gets the empty state.

**Do NOT migrate the live season data.** T1–T14 of a real in-progress season live in that legacy
node and the app reads it every 5 seconds. A botched migration loses the season. That migration is
its own project with a written plan, verified backup, and rollback path. Flag it as the blocking
dependency for true multi-tenancy.

---

# PART 3 — GO THROW BUGS

## 3.1 #42 — Start-a-round pre-fills people nobody chose

**Now:** Go Throw → Start Scoring Now → pick a course → "Who's playing?" already lists
`Will, Player, Player, Player, Kyle, Kadey`. The owner picked none of them. Three rows are literal
placeholders named "Player".

**Cause:** the card is silently restored from `localStorage["chains_play_lastgroup"]` and padded
with unnamed placeholder slots, so the user has to *remove* strangers before starting. Backwards.

**Fix:**
- Default to **just you**. Solo is the common case and should take zero taps.
- **Never** render a row labelled "Player". No real person → no slot.
- Adding people is explicit: **"+ Add players"** → friends list / recent partners (this is where
  last-group belongs, as a labelled suggestion — *"Played with recently"*) / guest by name /
  share-QR for someone who has the app but isn't a friend yet.
- Show a clear count: "Playing solo" / "You + 2".

## 3.2 #43 — Rounds cannot be deleted; deleted rounds come back

**Now:** ~13 junk test rounds. Deleting appears to work, then they return.

**Cause found** — in `PlayView`:

```js
function deleteRound(id) {
  if (window.ChainsRounds) { try { window.ChainsRounds.remove(id); return Promise.resolve(true); } catch (e) {} }
  // legacy fallbacks below never run
}
```

Returns `true` immediately without awaiting `ChainsRounds.remove()`, so the UI claims success and
the reload races an unfinished delete. It also never touches legacy
`chains-fantasy/play_rounds` — confirmed: `example-goldenrod-1` is sitting there right now.

**Fix:**
- `ChainsRounds.remove()` returns a Promise; `deleteRound` **awaits** it and reports real
  success/failure. Never claim a delete worked when it didn't.
- Delete must cover: local mirror, `playRounds/{id}`, `liveRounds/{id}`, the per-user index under
  the **real auth uid**, and legacy `chains-fantasy/play_rounds/{id}`.
- Show a real error if it fails, instead of silently reverting.

**Shared rounds** — owner's words: *"if there's people hooked to those rounds, then you have to
figure out a way to work that out. Maybe it still shows up for them, but not me."*
- Solo round → hard delete.
- Round with other real players → **hide-for-me only** (per-user removed flag). Record stays intact
  for everyone else, and say so: *"This round has other players, so it's been removed from your
  history but they'll still see it."*
- Only the owner of a round may delete it for everyone, behind a confirmation naming who it affects.

**Also:** bulk cleanup — multi-select, or "delete all my test rounds". There's a backlog right now.

## 3.3 #5 — No cancel/back in the pre-round flow

No way out of the start-a-round flow once you're in it, and no way to find and delete a sent invite.
Every step needs a back affordance and a clean exit that doesn't leave an orphaned round or invite.

## 3.4 #7 — In-progress round forces you through the "Live Now" card

Resuming should be direct: **Resume** / **Discard** on the round itself, not routed through the
Live Now card. (A "Resume round in progress" card already exists — make it the primary path.)

## 3.5 #10 — Version number not visible on mobile

The version label lives in the desktop sidebar, which is hidden at phone width. Surface the build
version somewhere always reachable on mobile (Settings footer is fine). The `sw.js` 404 half of this
issue is already fixed in v438.

## 3.6 Remove the duplicate In the Bag button

In the Bag now has its own top-level nav section. **Delete the `In the Bag · N discs` button from
the Go Throw home screen.** Go Throw home should be: Start Scoring Now, Plan a Round & Invite
Friends, then live/resume state and stats.

---

# PART 4 — NEW FEATURES

## 4.1 "Heading out with N discs" — disc count check

Owner's actual use case: *"a lot of people can just count their discs at the end of the hole and
make sure they still have all of their discs. So if they started with twenty two discs, as long as
they have twenty two discs in their bag when they get done, they know they didn't lose anything."*

Build it into the **round flow**, not the home screen:
- **Round start:** light, skippable step — *"Heading out with 22 discs?"* with `-` / count / `+`,
  a **Start round** confirm, and a clear **Skip**. Default from `ChainsBag.effectiveCount()`.
- **During:** keep the count quietly visible in the scorecard header — a mid-round check needs no
  navigation.
- **Round end:** *"Still have all 22 discs?"* → **Yes** / **I'm missing one**. "Missing" lets them
  mark which disc, flagged `lost` via `ChainsBag.setLost`. That closes the loop between Go Throw
  and In the Bag.
- Remember the skip preference. Skipped twice → stop offering, leave it in Settings.

## 4.2 #41 — Make In the Bag UDisc-grade

Already shipped: own nav section, live disc count, per-type breakdown, 1197-disc searchable catalog
with brand/type filters, lost-disc marking.

Still needed:
- **Disc detail:** flight numbers (speed/glide/turn/fade) prominent, plastic, weight, colour, wear.
- **Per-disc stats from real scored rounds** — how often thrown, average result on holes where
  used, longest recorded throw. **This is the differentiator.** It links the bag to actual scoring,
  which competitors don't do well.
- **Flight-chart view** (turn/fade scatter) so gaps and overlaps in the bag are obvious.
- **"What should I throw?"** — suggest from the bag based on hole distance and past results.
  Present as personal history, never as unquestionable AI advice.
- In-bag vs. in-collection; multiple bags/loadouts; share your bag (a shared mirror already exists).

## 4.3 #34 — Fantasy Impact on live scoring events

**The single most differentiated idea in the product. No competitor connects live tournament scoring
to fantasy standings in real time.**

Every live scoring event shows two effects — what it did to the tournament, and what it did to *your*
fantasy standing:

> **Gannon Buhr — birdie, hole 12**
> Tournament: moves to T3
> Fantasy: Guillermo +4.5 pts, takes the lead

Users should never have to work out why their league position changed.

## 4.4 Other queued features

- **#36** live share link / join code / QR for a round — watch without signing in
- **#37** favourite-player and fantasy-roster live alerts (started, top 10, ace/eagle, OB, lead change)
- **#35** score verification + read-only historical scorecards (explicit "Edit round" to change)
- **#38** automatic round + fantasy recap (best/worst hole, streaks, "what decided the matchup")
- **#11** in-app Report a Bug button (writes to Firebase `/bugReports`, already watched)
- **#18** visible "registered players / field" tab for the current tournament
- **#9** expand "Your Game" stats — per-course and overall
- **#4** countdown timer on The Picks screen
- **#3** ghost/default pick — app auto-saved "Paul McBeth" without the user selecting it
- **#12** field roster not loading on mobile Safari (iOS/iPad)

---

# PART 5 — STANDARDS

## 5.1 The bar

Owner: *"This should be more like a premium golf scoring app... We're gonna be competition to UDisc.
We're gonna be competition to any fantasy disc golf."*

Ship features **finished and unbugged** rather than broad and half-working. Applies equally to Go
Throw, In the Bag, Live Chains, Standings, and the leagues.

Positioning — don't lead with "fantasy disc golf with scorecards". Lead with:
**Follow your pros. Battle your friends. Track your own game.**

## 5.2 Mistakes competitors made — design around them

Taken from real user reviews of UDisc, 18Birdies, TheGrint, Hole19, Golfshot, Garmin, Arccos:

1. **Too many taps.** Advanced stats must never slow down basic scoring. Quick scoring stays the
   default: one tap per player per hole, defaulting to par.
2. **Inconsistent stat entry** — e.g. recording more putts than the hole score. Validate and warn.
3. **Accidental editing of history.** Completed scorecards open read-only; explicit "Edit round".
4. **Losing a live round after a crash.** Autosave every action, offline copy, clear sync indicator,
   resume-in-place. (Chains already fixed resume-without-restart — keep it that way.)
5. **Watch sync jumping to old holes.** If watch support ever happens, server state is authoritative.
   Don't build it until phone scoring is rock solid.
6. **Confusing subscription tiers.** Be explicit about what's locked before asking for money.
7. **Wrong course data with no correction path.** Report-a-correction flow with verification status,
   and never silently rewrite completed historical rounds.

---

# PART 6 — GITHUB & STAYING IN SYNC

**Repos** (owner `Bonnaroo`):
- `chains-app` — the live app. `index.html` = production, `test.html` = staging.
  Served at https://bonnaroo.github.io/chains-app/
- `chains-agent-log` — the team brain. GitHub **Issues are the task queue**; `company/` holds
  playbooks and briefs.
- `chains-dgpt-data` — `data/season.json` (schedule), course catalog, backups.

**Reading — public, no credentials:**
- live build: `https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html`
- open work: `https://api.github.com/repos/Bonnaroo/chains-agent-log/issues?state=open`
- schedule: `https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/season.json`

Re-read the live `index.html` at the **start** of a session and again immediately **before**
exporting. Other agents ship fixes continuously — Watcher every 5 min, Dispatcher every 20,
Engineer every 30. If the version moved while you worked, rebase onto their build.

**Writing:** the GitHub token is on the owner's machine at
`Cowork Design Folder\Chains Fantasy DGPT\github-token.txt`. **Never paste that token into a Design
chat, a file, or generated code.** Deploys are performed by the Engineer agent: stage to
`test.html` → verify three levels → promote to `index.html` → verify again → bump version.

**End every export with this, as plain text for the Engineer to commit:**
1. New version number
2. Modules changed, by name
3. Issue numbers it closes
4. Anything you deliberately did **not** do, and why

---

# PART 7 — PRIORITY ORDER

**Do these first — they block real use:**
1. **#43** delete rounds (owner can't clear a backlog of junk test data)
2. **#42** start-a-round pre-fill (every round starts with strangers on the card)
3. **Login UI** (Part 2) — accounts exist and are tested; only the UI is missing
4. **Remove the duplicate In the Bag button** (3.6) — trivial

**Then:**
5. #5 cancel/back in pre-round flow, #7 direct resume
6. "Heading out with N discs" (4.1)
7. League isolation interim rule (2.6)
8. #10 version on mobile

**Then the value features:**
9. #34 Fantasy Impact — the differentiator
10. #41 In the Bag depth (per-disc stats from real rounds)
11. #36 share/join, #37 alerts, #35 verification, #38 recaps

**Blocked / needs its own project:**
- Live season data migration for true multi-tenancy — do not attempt mid-season

---

# PART 8 — DEFINITION OF DONE

- [ ] Working from real v440+; all five "must survive" markers still present
- [ ] Login: username + password, no email field, stays signed in, sign-out in Settings
- [ ] Forced password change when `mustChangePassword` is true, optional username/email alongside
- [ ] Change password / username / optional email from Settings; username change never breaks
      sign-in or loses league history; `memberId` never changes
- [ ] Owner console lists members and can reset any password, with honest copy about why passwords
      can't be read
- [ ] A signed-in user who isn't one of the six sees an empty-league state, not Chains
- [ ] Start-a-round defaults to solo; no row ever reads "Player"; adding people is explicit
- [ ] Deleting a round actually deletes it and it stays gone; shared rounds hide-for-me; bulk cleanup
- [ ] Duplicate In the Bag button gone from Go Throw home
- [ ] "Heading out with N discs" at round start (skippable) + disc check at end that can mark lost
- [ ] Version bumped, changelog written, nothing from v440 reverted
