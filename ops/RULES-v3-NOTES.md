# Firebase rules v3 — draft, not published (2026-10-25)

File: `firebase/chains-app-f38f8.rules.v3.json`. Built from v2 after GPT's read-only review
(`ops/reviews/2026-10-25-gpt-rules-v2-and-restore-drill.md`). **Deployed rules are still v1.**
Only Will publishes rules. Do not publish v3 until the test in §3 passes with two accounts.

## 1. What v3 tightens (and what the app still does)
| Node | v2 | v3 | App path that must keep working |
|---|---|---|---|
| `sharedRounds/{id}` | anyone may create | create only with `owner === auth.uid`; edits by owner or a participant (unchanged) | host starts a card (module 31 `SR()`); cardmates update their scores |
| `courseStats/{course}/{id}` | any signed-in user, any write | anyone may **create** (a cardmate may finish a card the owner closed); **change or delete** only by `ownerKey` or a key under `players/`; `id` must equal the path | finish (31:242), per-hole backfill (31:582), remove (31:810) |
| `territory/{course}` | any signed-in user, any write | same, but the whole course can't be deleted or replaced with nothing | `ChainsTakeover.sync` writes `holes/`, `crowns`, `heldLog`, `meta` children |
| `callouts/{id}` | any signed-in user, any write | create: `from` = you, `status` = open, `to` ≠ `from`; after that only the two parties, and `from/to/week` can't change | create (68:559), settle (68:569) by either party |
| `usernames/{name}` | owner may rewrite any field incl. `uid` | `uid` can never change; owner may delete the mapping | username change (60:275), delete account (60:349), photo/badge/points writes (70) |
| `weekly`, `courseFirsts`, `users`, `playRounds` | — | unchanged | — |

## 2. What v3 does NOT protect (be honest about it)
The app computes contested results **on the phone** and writes them: titles (`territory`), weekly
standings (`weekly`), trophy points (`usernames/{k}/points`), call-out winners, firsts. Rules can stop
a player editing *someone else's* record; they cannot tell an honest derived value from a forged one.
A forged `courseStats` create with an invented round id is still possible. Making those values
authoritative needs server-side derivation (Cloud Functions, which needs the Blaze plan — Will's
decision, TODO "later"). For 13 friends, v3 is containment: nobody can wipe or rewrite another
player's data. Treat it as that, not as anti-cheat.

## 3. Test before publishing (needs the `chainstest` account — blocked on Will)
Run in the Firebase console **Rules Playground** against v3, or on test.html with two phones:
1. Will starts a card with chainstest, both score, chainstest taps Finish → `courseStats` write allowed.
2. chainstest tries to overwrite a `courseStats` record of a round they weren't on → denied.
3. chainstest tries to delete `territory/mi-otterburn` → denied; `sync` after a finish → allowed.
4. chainstest creates a call-out to Will → allowed; sets `from` to Will's key → denied; Will settles → allowed; a third account edits it → denied.
5. chainstest changes their photo → allowed; sets `usernames/chainstest/uid` to another uid → denied; changes username → old mapping deleted, new created → allowed.
6. Delete-account flow on chainstest end to end → allowed.
Log the matrix (allowed/denied per row) in AGENT_LOG, then Will publishes: Firebase console →
Realtime Database → Rules → paste `rules.v3.json` → Publish.

## 4. Restore drill (GPT §B, kept verbatim in the review file)
Needs the private `chains-backups` repo and a **separate** Firebase test project — both Will's.
Then an AI runs: extract one node from a backup → import into the test project → export → canonical
SHA-256 must match, counts must match, no production write. Pass/fail logged.
