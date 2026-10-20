# Chains — Design Brief: Go Throw fixes + In the Bag (from live v440)

Paste this whole file into the Claude Design project as your first message.
Design project: https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9

---

## 0. READ THIS FIRST — your copy of the app is STALE

Design currently believes the app is on **v438**. It is not. **Production is on v440**, and
v439 + v440 were shipped by direct module patches to `index.html` on GitHub, *not* through
Design. If you export from your current state you will silently destroy three shipped fixes.

**Before you change anything, pull the real current build:**

```
https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html
```

That file is the single source of truth. Load it, work from it, and confirm you can see
`Fantasy DGPT <span ...>v440</span>` in it before making any edit. If the version you see is
lower than v440, you have the wrong file — re-fetch.

**What is already in v440 that must survive your edits** (do not remove or revert these):

| Shipped | Where | Marker to check |
|---|---|---|
| Go Throw round save + delete permission fix | `window.ChainsRounds` module | `function authUid()` and `function _indexWrite(` must both still exist |
| European Open completion (unblocks Cory's picks) | seed-data module | `proWinner: "Teemu Paakinen"` on `t: 10` |
| In the Bag promoted to its own nav section | app shell module | `label: "In the Bag"` in the `nav` array, and `view === "bag"` in the router |
| Manual "Log an ace" removed | `AcesWall` in PlayView | there must be **no** `logManual` and no `"Log an ace"` |
| Run a League entry point removed | PlayView | there must be **no** `setShowWeeklies(true)` button |

Every export from now on must **bump the version number** (`>v440</span>` → `>v441</span>`, etc).
A build whose version is the same or lower than what is live is a red flag that something was
clobbered.

---

## 1. Architecture facts you need (so you don't have to rediscover them)

**There are TWO separate Firebase projects. Do not mix them up.**

- `chains-app-f38f8` — the NEW app: `playRounds/{id}`, `liveRounds/{id}`, `users/{uid}/rounds/{id}`,
  `friends`, `bugReports`. Rules: `users/$userId` requires `$userId === auth.uid`; most other
  nodes just require `auth != null`.
- `chains-fantasy` — the LEGACY project the fantasy side still uses: `/league` (picks & scores),
  `/live` (the tournament poller feed), and an old `/play_rounds` node.

**Key modules already in the build:**

- `window.ChainsRounds` — the Go Throw round store. Public: `start, save, finalize, remove,
  loadMine, loadGroup, headToHead, available`. Local mirror in `localStorage["chains_rounds_v1"]`.
- `window.ChainsBag` — the bag store. Public: `get, hydrate, effectiveCount, setCount, addDisc,
  addDiscObj, bagType, removeDisc, setLost, breakdown, loadCatalog, stabilityColor, TYPES`.
- `window.BagView({ onBack, mobile })` — standalone In the Bag screen. Already routed at `#bag`.
- `window.PlayView` — the Go Throw screen. Uses `LAST_GROUP_KEY = "chains_play_lastgroup"` and
  `LAST_COURSE_KEY = "chains_play_lastcourse"`.
- `window.ChainsAces` — ace log; auto-detects a 1 on a par-3+ during scoring.

**Identity:** `ChainsID.whoami()` returns an *app-level* member/session id (e.g. `"will"`). The
real Firebase uid is `ChainsFB.auth.currentUser.uid`. **These are not the same value.** Writing to
`users/{whoami()}/...` fails the security rule and — because it was inside an atomic multi-path
`update()` — used to kill the entire round save and delete. That is what `authUid()` fixed. Keep
that distinction in mind for anything new you write under `users/`.

---

## 2. BUG — "Who's playing?" pre-fills people nobody chose

**What happens now:** Go Throw → Start Scoring Now → pick a course → the "Who's playing?" step
already lists `Will, Player, Player, Player, Kyle, Kadey`. The owner picked none of them. Three of
them are literal placeholder rows called "Player".

**Why it's wrong:** it silently restores the last group from `localStorage["chains_play_lastgroup"]`
and pads the card with unnamed placeholder slots. A user starting a round has to *remove* strangers
before they can start, which is backwards.

**What it should be:**
- Default to **just you**, nobody else. Solo is the common case and should need zero taps.
- Never render a placeholder row labelled "Player". If there is no real person in a slot, there is
  no slot.
- Adding people is an explicit action: **"+ Add players"**, which opens a picker offering
  (a) your friends list, (b) recent playing partners (this is where last-group belongs — as a
  one-tap *suggestion*, clearly labelled "Played with recently", not as a silent default),
  (c) add a guest by typing a name, (d) a share/QR option for someone with the app who isn't a
  friend yet.
- Show a clear count: "Playing solo" / "You + 2".

## 3. BUG — rounds cannot be deleted, and deleted rounds come back

**What happens now:** the owner has ~13 rounds, all of them junk test data. Deleting one appears to
work, then it reappears. This is still broken after the v439 permission fix.

**Known contributing cause — start here:** in `PlayView`, `deleteRound(id)` short-circuits:

```js
function deleteRound(id) {
  if (window.ChainsRounds) { try { window.ChainsRounds.remove(id); return Promise.resolve(true); } catch (e) {} }
  ...legacy fallbacks never run...
}
```

It returns `true` immediately, without awaiting `ChainsRounds.remove()` and without ever touching
the legacy `chains-fantasy/play_rounds` node where older rounds still live. So the UI reports
success, the reload races the (possibly unfinished) delete, and anything stored legacy-side is
never removed at all.

**What to fix:**
- `ChainsRounds.remove()` should return a Promise; `deleteRound` must **await** it and report a real
  success/failure to the UI. Never claim a delete worked when it didn't.
- Delete must cover **every** place the round can live: the local mirror, `playRounds/{id}`,
  `liveRounds/{id}`, the per-user index under the **real auth uid**, and the legacy
  `chains-fantasy/play_rounds/{id}` node.
- Surface a real error toast if it genuinely fails, instead of silently reverting.

**Shared rounds — the owner's own instruction:** *"if there's people hooked to those rounds, then
you have to figure out a way to work that out. Maybe it still shows up for them, but not me."*

So: a round with other real players in it must **not** be hard-deleted by one participant.
- If you are the only player → hard delete.
- If others are on the card → **remove it from your view only** (a per-user hidden/removed flag),
  leave the record intact for everyone else. Tell the user exactly that: *"This round has other
  players, so it's been removed from your history but they'll still see it."*
- Only the round owner should be able to delete it for everyone, and that should ask for
  confirmation naming who else it affects.

**Also needed:** a way to clear out junk in bulk — multi-select in the rounds list, or a
"Delete all my test rounds" action — because there is a backlog of them right now.

## 4. CHANGE — remove the In the Bag button from Go Throw

In the Bag now has its **own top-level nav section** (directly under Go Throw, showing the live
disc count). The duplicate `In the Bag · N discs` button on the Go Throw home screen is redundant.
**Delete that button.** Go Throw's home should be: Start Scoring Now, Plan a Round & Invite Friends,
then live/resume state and stats.

## 5. FEATURE — "Heading out with N discs" (the real reason the count matters)

The owner's actual use case, in his words: *"a lot of people can just count their discs at the end
of the hole and make sure they still have all of their discs. So if they started with twenty two
discs, as long as they have twenty two discs in their bag when they get done, they know they didn't
lose anything."*

Build this into the **round flow**, not the home screen:

- **Starting a round:** a light, skippable step — *"Heading out with 22 discs?"* with a
  `-` / count / `+` control, a **Start round** confirm, and a clear **Skip** so anyone who doesn't
  care never sees friction again. Default the number from `ChainsBag.effectiveCount()`.
- **During the round:** keep the count quietly visible (small, in the scorecard header) so a
  mid-round check needs no navigation.
- **Finishing a round:** *"Still have all 22 discs?"* → **Yes** / **I'm missing one**. Choosing
  "missing" should let them mark which disc, and that disc gets flagged `lost` in `ChainsBag`
  (the store already supports `setLost`). That closes the loop between Go Throw and In the Bag.
- Remember the skip preference. If someone skips it twice, stop offering it and leave it available
  in settings.

## 6. DIRECTION — this is meant to compete with UDisc

The owner's standard, stated plainly: *"I want stats and everything here. This should be more like
a premium golf scoring app."* Every feature we ship should be finished and unbugged rather than
broad and half-working. Applies to Go Throw, In the Bag, Live Chains, Standings, and the leagues.

Priority order for In the Bag after the above: flight numbers per disc (speed/glide/turn/fade),
per-disc stats derived from **real scored rounds** (how often thrown, how it scores, longest
throw), a flight-chart view showing gaps in the bag, multiple loadouts, and bag sharing.
The per-disc-stats piece is the differentiator — it links the bag to actual scoring, which the
competitors don't do well.

---

## 7. Staying in sync with GitHub

**Repos** (owner: `Bonnaroo`)
- `chains-app` — the live app. `index.html` is production, `test.html` is staging. Served at
  https://bonnaroo.github.io/chains-app/
- `chains-agent-log` — the team's brain: GitHub Issues are the task queue, `company/` holds
  playbooks, `company/playbooks/never-clobber-a-deploy.md` is mandatory reading before any write.
- `chains-dgpt-data` — schedule (`data/season.json`), course catalog, backups.

**Reading (no credentials needed — these are public):**
- current live build: `https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html`
- open work: `https://api.github.com/repos/Bonnaroo/chains-agent-log/issues?state=open`
- schedule: `https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/season.json`

Always re-read the live `index.html` at the **start** of a session and again immediately **before**
producing an export. Other agents (Watcher every 5 min, Dispatcher every 20, Engineer every 30) are
also shipping fixes; if the version marker moved while you were working, rebase onto their build
rather than overwriting it.

**Writing:** the GitHub token lives on the owner's machine at
`Cowork Design Folder\Chains Fantasy DGPT\github-token.txt`. **Never paste that token into a Design
chat, a file, or any generated code.** Deploys are performed by the Engineer agent, which stages to
`test.html`, verifies at three levels (the committed artifact, the CDN response, and a real browser),
then promotes to `index.html` and bumps the version.

**What you should produce with each export**, so the rest of the team stays informed — put this in
your final message as plain text for the Engineer to commit:
1. New version number.
2. Which modules you changed, by name.
3. Which GitHub Issue numbers it closes (see below).
4. Anything you deliberately did *not* do, and why.

**Relevant open Issues:** #6 (placeholder players instead of real friends list), #5 (no cancel/back
in the pre-round flow, can't find/delete a round), #7 (in-progress round forces you through the
Live Now card), #41 (make In the Bag UDisc-grade), #40 (real username/password accounts — owner
decided username + password now, email later; do **not** build this without checking in first).

---

## 8. Definition of done for this brief

- [ ] Working from the real v440 build; all five "must survive" markers still present.
- [ ] Starting a round defaults to solo; no row ever reads "Player"; adding people is explicit and
      offers friends / recent partners / guest / share-code.
- [ ] Deleting a round actually deletes it and it stays gone; shared rounds hide-for-me instead of
      hard-deleting, with honest messaging; bulk cleanup available.
- [ ] The duplicate In the Bag button is gone from Go Throw home.
- [ ] "Heading out with N discs" exists at round start (skippable) and a disc check at round end
      that can mark a disc lost.
- [ ] Version bumped, changelog written, no existing fix reverted.
