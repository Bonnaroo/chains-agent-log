# CHAINS — HAND-OFF MANUAL (read this first)

> **Paste this to a new AI:** "You are taking over engineering for Chains, a disc golf app. Read HANDOFF.md
> in the GitHub repo `Bonnaroo/chains-agent-log` top to bottom, then `CHAINS_SYSTEM.md` (architecture)
> and the last 5 entries of `AGENT_LOG.md` (what just happened). Do not change anything until you have
> rebuilt the workbench (section 4) and deployed one no-op build to `test.html` successfully. Every change
> ships to `test.html` first, gets verified in a real browser, then goes to `index.html`. Every deploy ends
> with an entry in `AGENT_LOG.md` and an update to section 9 of this file."

Owner: Will (Guillermo), commissioner. He is not a developer — give him exact click-by-click steps for
anything he must do (Firebase console, Railway, GitHub secrets). He tests on his iPhone at Otterburn Disc
Golf Park (Swartz Creek, MI). Keep words plain in the app: no "king/queen/crown" wording.

---

## 1. What this is (30 seconds)

One single-file web app (`index.html`, ~2.5 MB) hosted on GitHub Pages at
`https://bonnaroo.github.io/chains-app/`. It does:

- **Fantasy DGPT league** (6 friends draft pros; 2026 season is over, 2027 opens in spring).
- **Go Throw** — score your own disc golf rounds (solo or a card of friends, live sync), maps, bag, trophies.
- **Takeover** — INTVL-style territory: every hole at every course has an owner; crews; monthly race.
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
  {sweptBy…}; `territoryLog/{YYYY-MM}/{id}`; `users/{uid}/takeover` counters; crews: `crews/{id}`,
  `crewByUser/{key}`, `crewCodes/{CODE}`.
- Leagues: `courseLeagues/{id}` (+ `minPlayers`, `signupBy`, `finalAt`, `judge`, `acePot`, `verifiedOnly`,
  `members{key}.hcp`), `courseLeagueCodes/{CODE}`.
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

- **Live:** index.html **v514** (2026-10-22). Staging test.html v514.
- **Just shipped:** Takeover hub (month race, courses, crews), lost & found per course, 86 trophies,
  leagues v2 (pledge-to-start, handicap, verified-only, final/judge, ace pot), profile photos.
- **Known gaps / next:** second test account for two-player checks (none exists yet — create one via the
  app's sign-up: username `claudetest`); App Store path = PWA first, then Capacitor; nightly backup job;
  Sentry; 86 → 100 trophies (ideas in AGENT_LOG 2026-10-22); per-hole Takeover notifications only fire on
  the finisher's device; rules v2 still unpublished by Will.
- **Open bugs:** none confirmed. Will reported a missing avatar once (not reproduced; photos now override).
