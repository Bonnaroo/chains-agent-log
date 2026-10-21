# CHAINS — System Guide (source of truth)

Last updated: 2026-10-20 (evening), end of the 2026 season. Read this first in any new chat.
Owner: Guillermo ("Will"), commissioner. League: 6 members — will, cory, kyle, shanna, gabe, kadey.

---

## 1. What Chains is

A fantasy league for the DGPT pro disc golf tour plus (eventually) a UDisc-style scorekeeper for
your own rounds ("Go Throw"). Each DGPT event, every member drafts two MPO pros (snake order);
lowest combined score-to-par wins the week. Points 6-5-4-3-2-1 per event. Season = 22 events.

**2026 final:** Kyle 85 (champion, on tiebreak: total strokes −716), Cory 85 (−654), Will 84,
Kadey 76, Gabe 75, Shanna 68. Tiebreak order in the engine: points → total strokes under par →
wins → top-3s → name.

---

## 2. The pieces (and where each lives)

| Piece | Where | What it is |
|---|---|---|
| **The app** | GitHub repo `Bonnaroo/chains-app` → GitHub Pages `bonnaroo.github.io/chains-app` | One `index.html` (~2.4 MB). React, compiled by Claude Design. The real code is **72 gzip+base64 blobs** inside it (`"data":"..."`); plain `grep` on the file finds nothing. `CHAINS_VERSION = "vNNN"` is the version marker. `test.html` is the staging copy (read-only against the league DB). |
| **Data pipeline** | `Bonnaroo/chains-dgpt-data` (public) | Python collectors + GitHub Actions. Produces `data/season.json`, `data/field.json`, `data/events/<id>-MPO.json`, course/disc catalogs, daily backups. **Only three workflows remain (2026-10-20): Collect DGPT Data (every 15 min), Backup League Data (daily), Update disc catalog (weekly).** The duplicate live/score workflows were deleted. |
| **The engine** | `Bonnaroo/chains-poller` → Railway project "bubbly-truth", service "worker" (auto-deploys on push to main) | **The single owner** of `/live`, `/rounds`, `/rounds_index`, `/draft`, `/field`, `/health` and pick scores. `poller.py` v2 (2026-10-20): scores from PDGA official results, provisional 48 h then locked; no turn clock; deadline = first tee time; opt-in auto-pick only. |
| **League database** | Firebase RTDB project `chains-fantasy` (`chains-fantasy-default-rtdb.firebaseio.com`) | Picks, scores, settings, chat, live feed, round archives, draft records. Rules: `/leagues` and `/users` locked; **everything else is open read/write without auth** (`$other`). That's how the app and scripts write. |
| **Accounts / Go Throw DB** | Firebase project `chains-app-f38f8` | Login (username → synthetic email), Go Throw rounds (`playRounds`, `liveRounds`), friends. Proper auth rules. |
| **Agent log** | `Bonnaroo/chains-agent-log` | `AGENT_LOG.md` (every deploy + incident), roadmap, team docs. Append an entry after any production change. |
| **Design source** | Claude Design project "Chains Fantasy DGPT" | Where UI is built. Exports → download → deploy. Design's copy drifts from production; re-sync before big builds. |

Credentials: GitHub fine-grained token `chains-claude-2027` (expires Oct 2027), saved on Will's Desktop as `DGFT Token.txt`; Contents + Workflows read/write on chains-app, chains-dgpt-data, chains-agent-log, chains-poller. It does NOT carry Administration (can't archive repos) or the bulk Git Data API — use the Contents API per file. Firebase `chains-fantasy` needs no credentials; `chains-app-f38f8` needs a signed-in user (use the Firebase console in Will's Chrome).

---

## 3. Firebase `chains-fantasy` — schema

```
/league                      the app's sync snapshot
  app: "chains-dgpt-2026", fmt: 2, rev: <epoch ms>
  keys/
    picks~46~<t>             {r: <epoch ms>, v: "<JSON array>"}   ("." encoded as "~46~")
       row: {slot, m, p1, s1, p2, s2, p1At, p2At, scr, w1, w2, x1, x2}
       p = player name (exact PDGA "First Last"), s = score-to-par (null = unscored)
       scr=1 → commissioner scratched the row (last place, 1 pt, no penalty shown)
       x1/x2 → explicit "clear this pick" markers (travel once, then deleted)
    k~46~chains_dgpt_2026_settings_v1   {buyInPerEvent, seasonPot, onepick_<t>: 1}
    k~46~chains_dgpt_2026_members_v1
    k~46~chains_dgpt_2026_chat_v1
/live                        current event, poller-shaped (see §5)
/rounds/<eventId>-r<n>       archive of each round (same shape as /live)
/rounds_index/<eventId>      {event_final: bool, rounds_list, finalized_at}  ← the scorer's gate
/draft/<t>                   draft record: order, seq (one step per pick), clocks, log
/draft_prefs/<member>        {autopick: bool}
/field                       registered field for the draft event
/notifications/<id>          in-app notices
```

**League event numbering:** `t` = 1..22 = the app's baked-in `TOURNAMENTS` array (module 7) =
`data/season.json`. PDGA event IDs map via season.json (`event_id`). 2026 IDs: T15 96415
Discmania, T16 96416 Preserve (doubles), T17 97344 Worlds, T18 96417 Idlewild, T19 96418 GMC,
T20 96419 MVP Open, T21 97346 USDGC, T22 96421 Powerball Cup.

---

### Firebase `chains-app-f38f8` — nodes (after the 2026-10-20 cleanup)
`users/{uid}`, `usernames`, `friends`, `friendCodes`, `friendRequests`, `joinCodes`, `leagueCodes`,
`leagues`, `sharedBags`, `admins`, `config` (feature flags), `bugReports`. Deleted 2026-10-20 (start
fresh): `playRounds`, `liveRounds`, `roundsByPlayer`, `sharedRounds`, `ledger` (coins), `_trash`,
`diagnostics`. ~20 accounts exist. The owner Console shows 0 users/leagues because the rules let each
user read only their own record — fix: add an admin `.read` on `users` and `leagues`.

### Go Throw round model (module 31) — keep, it's sound
`playRounds/{id}` = {owner, course{id,name,city,parTotal}, date, players{key:{name,disc,holeScores[18],
total,thru}}, participants, weather, status open|final, startedAt, updatedAt}; per-hole writes go to
`players/{key}/holeScores/{h}` (path-level, so two scorers don't clobber each other); `liveRounds/{id}`
mirror while open (that's how friends see you playing now); `roundsByPlayer/{key}/{id}` index;
`courseStats/{courseId}/{id}` for course records. Badges (14) and the Ace Wall already read from this.

## 4. Data flow — one event, start to finish

1. **Schedule** — `data/season.json` (T, event_id, dates, rounds). Everything keys off this.
   If an event isn't in it, the field collector says "no upcoming event" and picks lock.
2. **Field** — `collect_field.py` (Actions, ~every 15 min) walks season.json, finds the first
   unfinished event, pulls the registered MPO field from PDGA → `data/field.json`. The app's pick
   dropdown is restricted to this field, matched by PDGA event id (`eventIdForSlot(t)`).
3. **Draft** — referee in `poller_once.py` (runs inside the long-running Actions poller).
   Window opens 36 h before `start_date 00:00Z`, deadline = start_date 00:00Z (the evening
   before round 1 — **too early**, should be first tee time). Writes `/draft/<t>`.
   Rules as coded in Sept: turn clock, drop-a-spot on timeout, auto-pick at deadline.
   **Will's decision 2026-10-06:** remove the turn clock and drop-a-spot; keep the deadline
   countdown; empty slots stay empty for the commissioner unless the member opted into auto-pick
   (best available by rating). Not yet shipped (token expired).
4. **Picks** — members edit their own row in the app → `setPicks` → localStorage → sync to
   `/league/keys/picks~46~<t>`. Commissioner "Fix a pick" can edit any row.
5. **Live** — poller fetches PDGA live API (`live_results_fetch_event`, `live_results_fetch_round`)
   → `/live` (+ `/rounds/<id>-r<n>` archives). App's Live Chains screen reads `/live` every 60 s.
   Multi-pool events (Worlds) return a LIST of pools; parser flattens and tags `pool`.
6. **Finalize** — poller marks `/rounds_index/<id>.event_final=true`; then (a) the app's
   in-browser `ChainsAutoFinalize` and (b) the server `finalize_picks` fill `s1/s2` from the last
   played round's `event_to_par`. "Never overwrite a set score." Missing/withdrawn pick =
   worst finisher + 1. `onepick_<t>` → only p1 counts.
7. **Standings / draft order** — computed live in the engine (`eventResults`, `standings`,
   `draftOrder`): next draft order = previous event's last place picks first, ties by season points.

---

## 5. The app internals that matter

- **Engine** (module 44): `eventResults(t)`, `standings()`, `draftOrder(t)`, `onePick(t)`,
  `seasonMeta()` (live/next/completed), `mergePickRow/mergePicksArr`, `setPicks`.
- **Picks screen** (module 63): `canEdit(mid)`; commissioner unlock = "Fix a pick".
- **Live Chains** (module 64): reads `/live`; rolls over to "awaiting next" when the live
  event is already scored or `/live` points at a scored event. Course tab has per-pool selector.
- **Auto-finalize** (module 16), **sync** (module 69), **PlayerSelect** (module 24).
- **Sync merge rule (critical):** incoming vs local, field-level. A populated pick beats null.
  *Same player + blank incoming score ⇒ keeps the recorded score.* If the merge "rescues"
  anything, the client bumps its rev and **pushes its copy back to Firebase**. Consequence: you
  cannot un-score an event by writing nulls — every phone will restore and re-publish the old
  scores. To force a clear, the player string must differ (e.g. trailing space; the live view
  normalizes names). Clean the names again when you write final scores.

---

## 6. Every bug we hit in 2026 and the root cause (don't relearn these)

| Symptom | Root cause | Status |
|---|---|---|
| Pick dropdown empty, "loading registered field" | `season.json` ended at T15; collector found no upcoming event | Fixed: full T1–T22 schedule |
| Live Chains showed next-event countdown during Worlds | `collect_live.py` had the event ID **hardcoded** (June's European Open); local `poller.py` had died; Worlds' two pools crashed both parsers | Fixed: schedule-driven, multi-pool |
| "Round 2 of 2" on a 5-round major; distances ×3.28 | rounds list truncated to played rounds; no `unit` on holes (PDGA = feet, app default = m) | Fixed in poller |
| Phantom picks (e.g. Hammes on Cory) | in-browser 4 h autopick computed deadlines from stale timestamps | Removed (v471); later replaced by server referee |
| Commissioner couldn't make own picks | `canEdit` short-circuited for commish | Fixed v470 |
| Draft tiebreak wrong (Gabe before Shanna) | ties broke **alphabetically** | Fixed v472: season points |
| Green Mountain scored on round-3 totals; Powerball scored on round-4 totals | `event_final` set early: PDGA's `HighestCompletedRound` is unreliable (GMC reported 13, Powerball 5 before the last round teed off) and nobody had `status:"I"` yet; "never overwrite" then locked it | **Open** — needs scorer rewrite |
| MVP Open and USDGC never scored | server scorer refuses while any player has `status:"I"` — PDGA leaves that flag on after rounds end, so it skips every event | Fixed: poller v2 scores from PDGA official results + `Completed`, lock-before-rescore |
| Picks closed the evening before round 1 | deadline = `start_date 00:00Z` − 0 h | Fixed: poller v2 deadline = first round-1 tee time (event timezone) |
| Go Throw: "Save & exit" then reopen app left an orphaned open round; stats showed 2 rounds | `resumeRound()` rebuilt the draft without `cloudId`, so ScoreBoard called `ChainsRounds.start()` again | Fixed v487: resume carries cloudId/format/handicaps/weather |
| Go Throw: in-progress round counted in Rounds/Best/stats on the home screen | home `myRounds` didn't filter `status==="open"` (My Stats + badges already did) | Fixed v487 |
| Go Throw: finish card said "last time here you shot X — matched it" on a first-ever round | `rounds` is refreshed with the just-finished round before the card renders, so it compared to itself | Fixed v487: excludes `result.cloudId` |
| Go Throw: course picker listed the Recent course twice | Recent row + same course at the top of the catalog | Fixed v487 |
| Go Throw: "Clean up · delete my solo test rounds" button on the home screen | dev-era leftover; deleted every solo round a user had | Removed v487 (function kept, button hidden) |
| Go Throw: editing an earlier hole "kept jumping" on the phone | old scoring screen stacked scorecard + editor + steppers; opening the editor / changing label widths moved everything under the thumb | Fixed v488: rebuilt scoring screen (fixed-size steppers, editor in a reserved slot, hole strip, `touch-action: manipulation`) |
| Go Throw: "Round finished, but the cloud didn't update" toast on a saved round | `finalize()` removes the `liveRounds` mirror; when it was never written the rules refuse the no-op remove | Fixed v488: only reported if the mirror still exists |
| Go Throw: Will's real round didn't count in stats | he tapped "Mark as practice"; practice rounds are excluded from stats/badges by design | Not a bug — un-flag on the round page |
| GitHub Actions cron late by up to an hour | best-effort scheduling | Known; long-running poller mitigates |
| `live_C.yml` silently failing | stray characters from a browser edit → invalid YAML | Fixed |
| Workflow files can't be edited via API | token lacks `workflow` scope | Regenerate token with Workflows scope |

---

## 7. Operating procedures

- **Deploy an app change:** patch the decompressed module → re-gzip (`mtime=0`) → splice blob →
  bump `CHAINS_VERSION` → commit to `test.html` → verify → commit to `index.html` → log it.
  Verify three ways: the git **blob** (not `raw.githubusercontent`, which lags minutes), the
  live URL, and a real browser session. Never claim "broken" from `grep` on the compiled file.
- **Score an event by hand:** PDGA `api/v1/feat/live-tournaments/<id>/event-division-results/MPO`
  → `toPar` per player → write `s1/s2` → bump `/league/rev` → set `rounds_index.event_final`.
- **Un-score an event:** write nulls **and** alter the player strings (see §5), then clean up.
- **Backups:** `backup_league.py` daily → `data/backups/league-YYYY-MM-DD.json`. Take one before
  any bulk write. Rollback = revert the file/commit; the agent log records every deploy.
- **Browser edits of workflow YAML:** verify the file parses afterwards (GitHub shows the file
  path instead of the workflow name when YAML is broken).

---

## 7b. What UDisc's course model has that ours doesn't (observed 2026-10-20 on udisc.com)
Their course page is server-rendered; the data model is embedded in the page. Course: id, name,
lat/lng, holeCount, access/fee, amenities, rating, timezone, photos, playCount, liveGroupCount.
Layout: id, courseId, name, type, status, holes[], distance, time, stepCount, difficultyBin,
lengthBin, playCount30. **Hole: holeId, name (display number), par, distance (metres), status,
teePosition{lat,lng,label main/alt,teeType,isTemporary}, targetPosition{lat,lng,basket model},
doglegs[] (path waypoints).** Ours (`data/courses.json`): course-level lat/lng geocoded from the name,
per-hole pars and lengths (Otterburn matches UDisc hole for hole). The gap is per-hole tee/basket GPS —
that is what enables maps, distance-to-basket and auto-advance. Scoring UX and friend flows are
observable patterns, not code; do not decompile their app or hit their private API.

## 8. Off-season plan (agreed 2026-10-12, scoped 2026-10-20)

1. **Scorer rewrite** — score from PDGA's *final results* endpoint, not the live archive; finalize
   when end date passed and every result has a final `toPar`; re-pull for 48 h then lock. Removes
   every scoring failure above. Deadline = first tee time.
2. **Draft simplification** — per Will's 2026-10-06 rules (§4 step 3).
3. **Replay sandbox** — test league + separate Firebase, replay any archived event (2025/2026
   results + hole-by-hole archives already exist) at high speed: field → draft → live → finalize
   → standings. Lets us test year-round and onboard beta testers.
4. **Go Throw** — own-round scoring with friends. No PDGA dependency, so it's off-season work.
   Needs a real data model and a tested backup/restore before anything else (round data has
   silently vanished before). **Status 2026-10-20 (v487):** solo end-to-end verified in a real
   browser — course pick → 18 holes → finish → verify & sign → Done → round detail; tap-to-fix;
   Save & exit → reload → resume on the same record; discard deletes `playRounds`, `sharedRounds`,
   `roundsByPlayer`, `courseStats`, `liveRounds`. Not yet field-tested: multi-player cards (two
   phones), doubles/scramble formats, guest players, invites, share-watch link.
   **v488 (2026-10-21) — UDisc-class flow in Chains style** (Will's reference: 15 UDisc screenshots;
   match features/flows, never their visual design/code): course picker ("Where are you playing?",
   Recent/All) → Cardmates (Frequent/Recent/Name, rounds-played counts, Add new cardmate sheet:
   friend / Chains username / guest) → scoring screen (hole header, fixed-size −/+ rows with "E (6)",
   bottom hole strip, scorecard toggle with tap-to-fix in a reserved slot, round menu sheet) →
   finish overview (score hero, player overview with birdie bars, Dist/Par scorecard, confetti, new
   badge reveal). Badges (module 32) are now a tiered trophy case: 38 badges, Bronze→Platinum ladders,
   `compute()` returns value/level/progress/next/tier; `diff()` tracks new unlocks via
   `localStorage chains_badges_seen_v2:<me>`. Module 45 helpers: `GuestAddSheet`, `ScoreHero`,
   `PlayerOverview`, `ScorecardTable`, `NewBadgesReveal`, `BadgeShelf`, `withLine`, `myDisplayName`.
   Catalog has no GPS, so "Nearby" courses and layout maps are blocked on course data.
5. **Release path** — free tier first, validate with real leagues, then decide on paid.
6. **Scope cuts (Will, 2026-10-20):** remove the coin/betting economy (flag off, then strip the code);
   "Classic" is just the league; two league types (snake draft; pick-your-own-team); Console stays
   minimal; friends must be robust (friend code → request → accept; test both sides).
7. **Firebase quota:** the app re-downloads `/league.json` every 5 s per phone (5 GB/week during
   events vs a 10 GB/month free cap). Not urgent off-season; must be fixed (conditional requests or a
   listener) before next season's first event.
