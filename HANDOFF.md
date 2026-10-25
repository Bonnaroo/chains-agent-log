# CHAINS — HAND-OFF MANUAL (read this first)

> **Paste this to a new AI:** "You are one of several AI engineers on Chains, a disc golf app. Open the
> GitHub repo `Bonnaroo/chains-agent-log` and read `AGENTS.md`, then `START_HERE.md`, then `ops/PROTOCOL.md`
> and `ops/STATE.md`. Follow the protocol exactly: name yourself, rebuild the workbench, run
> `python3 ops/check.py` until it prints ALL GREEN, claim one item from `ops/TODO.md` 'Next up', ship it to
> `test.html` first, verify, then `index.html`, push your sources to `src/`, write the AGENT_LOG entry, and
> run the session-end checklist. Never skip the checklist."

Owner: Will (Guillermo), commissioner. He is not a developer — give him exact click-by-click steps for
anything he must do (Firebase console, Railway, GitHub secrets). He tests on his iPhone at Otterburn Disc
Golf Park (Swartz Creek, MI). Keep words plain in the app: no "king/queen/crown" wording.

---

## 1. What this is (30 seconds)

One single-file web app (`index.html`, ~2.5 MB) hosted on GitHub Pages at
`https://bonnaroo.github.io/chains-app/`. It does:

- **Fantasy DGPT league** (6 friends draft pros; 2026 season is over, 2027 opens in spring).
- **Go Throw** — score your own disc golf rounds (solo or a card of friends, live sync), maps, bag, trophies.
- **Titles on every course** — course record, champion, most rounds, local regular, birdie leader, most
  improved, hole owners, permanent firsts; shown on course pages and chased from Home. (Plain words: no
  king/crown.) Groups and call-outs between friends.
- **Course leagues** (friends' leagues at a real course), **course pages** (ratings, notes, lost & found),
  **friends + messaging**, **weekly challenges**, **in-app notifications**, **UDisc CSV import**.

Goal: a free app people come back to because of trophies + territory, then a real App Store app.

## 2. Where everything lives

| Thing | Where | Notes |
|---|---|---|
| App code (built) | GitHub `Bonnaroo/chains-app` → `index.html` (live), `test.html` (staging) | Single HTML; 93 gzip+base64 blobs inside, 72 are real JS/JSX modules |
| Data files | GitHub `Bonnaroo/chains-dgpt-data` → `data/courses.json`, `discs.json`, `plastics.json`, `news.json`, `geo/*.json` | Served raw via raw.githubusercontent.com (CDN lag 5–10 min; the app pins a cache key `CAT_VER`) |
| This manual + logs | GitHub `Bonnaroo/chains-agent-log` → `HANDOFF.md`, `CHAINS_SYSTEM.md`, `AGENT_LOG.md`, `firebase/*.rules*.json` | **Update after every deploy** |
| Accounts + all Go Throw data | Firebase Realtime DB project **`chains-app-f38f8`** | Auth = username+password (email is `username@chains.app`). Rules v2 file in agent-log is the one to publish |
| Fantasy league data + shared notification feed | Firebase Realtime DB project **`chains-fantasy`** (legacy, open REST) | `/live`, `/notifications`, picks, standings |
| Live PDGA scoring poller + password-reset worker | Railway service `chains-poller` (repo `Bonnaroo/chains-poller`: `poller.py`, `reset_worker.py`) | Needs env vars for the reset worker (see CHAINS_SYSTEM §7) |
| GitHub token | On Will's PC: Desktop `DGFT Token.txt` (Contents scope; **no Actions scope**) | Never print it. Never commit it |

## 3. How the app is put together (what you must know before editing)

- `index.html` contains the React/Babel runtime and the modules as `"data":"<gzip+base64>"` blobs. The
  version marker is the string `CHAINS_VERSION = \"vNNN\"` (escaped quote). Bump it every build.
- Module map (blob index → what it is): 12 Firebase init · 17 ChainsBag · 19 Bag UI · 23 ChainsBuild ·
  **24 UI primitives (Button/Card/Avatar/Icons)** · **31 ChainsRounds + ChainsTakeover** · **32 ChainsBadges** ·
  38 ChainsNotify · 41 Settings/Account (photo, notify prefs) · 42 ChainsAces · 44 fantasy engine ·
  **45 PlayView = Go Throw, course pages, Takeover hub, challenges, lost & found** · 47 app shell/nav/bottom
  tabs · 57 ChainsRating · 58 AuthGate/LoginView · 60 ChainsAuth · **68 MyLeagues + course leagues + Friends UI** ·
  70 ChainsFriends/ChainsChat.
- Modules are JSX compiled in the browser; variable names survive, so a phone error like
  "undefined is not an object (evaluating 'h.name.split')" points straight at source.
- **Gotcha #1:** the app container has a CSS transform, so `position:fixed` inside it pins to the document
  bottom. Every modal/sheet/bottom bar must render through a Portal to `document.body` (`Portal`/`__Portal`).
- **Gotcha #2:** JSX *text* does not process `\uXXXX` escapes — write real characters (—, ·, emoji).
- **Gotcha #3:** `courseStats/{course}/{roundId}.players[k].total` is TO PAR; `.strokes` is raw; `.hs` is the
  per-hole array (used by Takeover).
- **Gotcha #4:** `raw.githubusercontent.com` ignores query strings for cache busting; bump `CAT_VER` in
  module 45 and wait.
- **Gotcha #5:** Python edit scripts — check every anchor (`assert s.count(a) == 1`) *before* any replace,
  and write the file once at the end. A script that crashes on a later anchor leaves the earlier
  replacements unwritten, and the next build silently ships half a change (v530 "kind is not defined").
  Validate `out.encode('utf-8')` before writing. No trailing commas on edit tuples.
- **Gotcha #7:** silent `try {} catch {}` around Firebase writes hid a ReferenceError for days (v542). When a
  write "doesn't happen", check the console for `[ChainsRounds] write refused / bad write / courseStats
  build failed` first; never add a bare catch around a write.
- **Gotcha #8:** blob *order* changed in v537 — the live manifest no longer has the Babel entry, so a
  workbench rebuilt from live index.html numbers blobs ≥5 one lower than `src/module_NNN.js`. Match by
  uuid: `ops/blob_ids.json` maps the original index → uuid.
- **Gotcha #6:** DESIGN.md §3 — no emoji as icons. Trophies render through `BadgeIcon` (`ChainsBadges.glyphName`);
  the `icon` field in ladder data is never shown.
- Identity: a player is a **member key** (`will`, `kyle`…) = lowercase username; auth uid lives at
  `users/{uid}/profile.memberId`. Public per-player card: `usernames/{key}` {uid,name,disc,badge,photo}.

## 4. Rebuild the workbench (do this at the start of every session — the sandbox is wiped)

```bash
mkdir -p /tmp/chains/mods && cd /tmp/chains
tr -d '\r\n' < "<path to DGFT Token.txt>" > tok && chmod 600 tok
T=$(cat tok)
curl -s -H "Authorization: token $T" -H "Accept: application/vnd.github.raw" \
  https://api.github.com/repos/bonnaroo/chains-app/contents/index.html -o app_base.html
python3 - <<'EOF'
import re,zlib,base64
s=open('/tmp/chains/app_base.html',encoding='utf-8').read()
ms=list(re.finditer(r'"data":"([A-Za-z0-9+/=]{200,})"',s))
for i,m in enumerate(ms):
    try: open('/tmp/chains/mods/module_%03d.js'%i,'w',encoding='utf-8').write(zlib.decompress(base64.b64decode(m.group(1)),16+zlib.MAX_WBITS).decode('utf-8'))
    except Exception: pass
EOF
npm init -y >/dev/null; npm install esbuild@0.21.5 --silent   # syntax check: esbuild --loader:.js=jsx mods/module_045.js --outfile=/dev/null
```

Then recreate `build.py` (it is reproduced in `AGENT_LOG.md` entry "v513" and in CHAINS_SYSTEM §7): it
re-gzips the modules you edited (set `mods={idx:'module_xxx.js',...}`), splices them into the base HTML
by blob index, rewrites the version marker, PUTs the file to the repo via the Contents API, and verifies the
blob SHA. **Never write a module file with a Python `open(...,'w')` whose content might fail to encode —
validate first (`out.encode('utf-8')`) or you truncate the file (it happened).**

## 4b. v537+: the build precompiles JSX (read this before the first build)
`build.py` now compiles the 27 JSX modules with esbuild at build time and drops Babel from the bundle
(reference copy: `ops/build.py` in chains-agent-log; `ops/tdz.js` next to it). Consequences:
- The live index.html no longer contains Babel; the workbench rebuild still extracts modules the same way
  (blobs are gzip+base64; JSX modules in the live file are now *compiled* JS, so edit the JSX sources in
  `mods/` — keep them from the last session's `app_vNNN.html` or from git history before v537, or
  take them from **`chains-agent-log/src/module_NNN.js`** — that folder is the source of truth now; push every edited module back there after each build).
- `const`/`let` are real now (Babel used to turn them into `var`). Run `node tdz.js` on every compiled
  module before building; "used before its const" = a crash on that screen.
- `build.py vNNN local "msg"` builds `app_vNNN.html` without pushing.
- **Cold start (v550+)**: `curl live index.html > /tmp/chains/app_base.html`; `ops/blob_ids.json` →
  `/tmp/chains/blob_ids.json`; `src/module_NNN.js` → `/tmp/chains/mods/`; `ops/build.py` → `/tmp/chains/
  build.py`; `ops/tdz.js`; `npm i esbuild@0.21.5 espree eslint-scope`; token → `/tmp/chains/tok`. The
  build maps module numbers to blob uuids through blob_ids.json, so the live file (which has no Babel
  entry) works as the base. Verified 2026-10-24.

## 5. Ship a change (the only workflow)

1. Edit `mods/module_NNN.js`. Run esbuild on it (`--loader:.js=jsx`) — must be clean.
2. `python3 build.py vNNN test.html "message"` → wait ~1–3 min → confirm
   `curl -s https://bonnaroo.github.io/chains-app/test.html | grep -o 'CHAINS_VERSION = \\"v[0-9]*'`.
3. Verify in a real browser signed in as Will (a 400-px iframe of the app on the same origin is the phone
   harness; `window.ChainsRounds`, `ChainsTakeover`, `ChainsBadges`, `ChainsCourseLeagues` etc. are all on
   `window` for scripted checks). Clean up any test rounds/leagues/posts you create (`ChainsRounds.remove(id)`
   removes all five round nodes).
4. `python3 build.py vNNN index.html "message"` → confirm live.
5. Append an entry to `AGENT_LOG.md`, update **section 9 below**, push both to `chains-agent-log`.

## 6. Data model you'll touch most (project `chains-app-f38f8`)

- Rounds: `playRounds/{id}` (owner), `sharedRounds/{id}` (everyone on the card), `liveRounds/{id}` (open
  only), `roundsByPlayer/{key}/{id}`, `courseStats/{course}/{id}` (per-course aggregate incl. `hs`).
- Takeover: `territory/{course}/holes/{n}` {key,name,avg,plays,since}, `/held/{key}`, `/meta`
  {sweptBy…}, `/crowns/{record|champion|regular|birdieLeader}` {key,name,title,since},
  `/heldLog/{key}/{id-since}` {title,from,to,lostTo}; `territoryLog/{YYYY-MM}/{id}`; `courseFirsts/{course}`;
  `users/{uid}/takeover` counters; crews (dormant): `crews/{id}`, `crewByUser/{key}`, `crewCodes/{CODE}`.
- Leagues: `courseLeagues/{id}` (+ `minPlayers`, `signupBy`, `finalAt`, `judge`, `acePot`, `verifiedOnly`,
  `members{key}.hcp|.division`, weekly: `format:"weekly"`, `schedule{day,time,weeks,firstAt,countBest,dayOnly}`,
  `divisions`), `courseLeagueCodes/{CODE}`.
- Challenges: `weekly/{YYYY-Www}/{key}` public weekly card, `users/{uid}/challenges/{week|month}`,
  `usernames/{key}.points` (trophy points, public), `usernames/{key}.badge` (= the player's title).
- Courses: catalog = courses.json (chains-dgpt-data) + `playerCourses/{pc-id}` (player-added, merged on
  load), `users/{uid}/profile/homeCourse`.
- Community: `courseCommunity/{course}/{ratings|notes}`, `lostFound/{course}/{id}`, `courseGeo/{course}`.
- People: `users/{uid}`, `usernames/{key}`, `friends`, `friendRequests`, `friendCodes`, `messages/{a~b}`,
  `threads`, `users/{uid}/badgeSnap`, `users/{uid}/challenges/{week}`.
- Full table with who-can-write: `CHAINS_SYSTEM.md` §3. Rules to publish: `firebase/chains-app-f38f8.rules.v2.json`.

## 7. Things only Will can do (ask him, with exact steps)

- Publish Firebase rules (Realtime Database → Rules → paste → Publish; History tab to roll back).
- Railway env vars for the reset worker; Firebase service-account key.
- Run the OSM course-geo GitHub Action (token lacks Actions scope).
- Create the free safety nets when he says go: nightly Firebase export to a private repo (GitHub Action
  + one secret), Sentry (crash reporting), UptimeRobot (uptime pings).

## 8. Product rules Will has set (don't undo these)

- Hole 1 first; no "mark tee/basket" buttons up front; map inline on the scoring screen with throw arrows;
  the hole card popup stays as is; scorecard under the Next button; floating Prev/Next hole bar.
- Score pad (tap your score), no phantom par. Ace auto-detect waits 8 s and retracts on correction.
- Ratings pinned per course (`courses.json` → `rating:{ssa,ppt}`); Otterburn −4 ≈ 830.
- Plain words everywhere. Keep it simple. Free app first. Takeover is the headline feature.
- Nothing exports to UDisc; UDisc CSV import is fine. No bulk scraping of UDisc.
- Fantasy league builder hidden for members until 2027 (commissioner can still see it).

## 9. CURRENT STATE — update this every deploy

- **Live:** index.html **v556** (2026-10-25). Staging test.html v556. Read DESIGN.md and CHALLENGES.md. **Read DESIGN.md before touching any screen.**
- **Start with `START_HERE.md`** (cold start verified byte-for-byte from GitHub alone on 2026-10-25).
- **What the app is now:** Home = "What you're chasing" (a title within reach at your home course, your
  next breakthrough, this week) · last round · newest trophies · weekly challenges · feed. Challenges tab =
  This week · This month · Trophies (100 ladders, points, level 1–10, titles). Course pages = Course ·
  Holes (mastery + who owns each hole) · Territory (titles: record, champion, most rounds, local regular,
  birdie leader, most improved; hole owners; firsts; everyone who's played) · Board (ratings, notes, lost &
  found). Courses browse: Recent · Favourites · Nearby · All + add your course. Leagues: one-window formats
  and weekly leagues (league night, best N of M, strokes or points, divisions, reminders, calendar).
  Friends: requests, chat, call-outs (challenge a friend this week), groups (bones). Settings: photo,
  password, username, recovery email, notifications, delete account. Fantasy league: 2026 archived, 2027
  opens in spring.
- **Engineering state:** JSX precompiled at build (no Babel); sources in `src/`; every Firebase write
  logs a refusal + one toast; save-state line while scoring; phone Back closes pushed screens; 9-hole
  rounds count for showing-up titles; `tdz.js` check before every build.
- **Waiting on Will:** publish rules v2 · test account `chainstest` · private backups repo · monitoring ·
  run the course pipeline once · imported-rounds policy.
- **Next for the AI:** `ops/TODO.md` → "Next up", in order.
- **Open bugs:** none confirmed. Unverified: lost & found friend notice in the harness; Will's one-time
  missing avatar; every two-phone flow (no second account yet).
