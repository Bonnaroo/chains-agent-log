# START HERE — taking over Chains (written 2026-10-25, live = v554)

You are the next engineer for **Chains**, a disc golf app owned by Will (Guillermo). This page is the
shortest safe path from zero to a correct first build. Follow it in order. Do not skip the checks.
If something here disagrees with another document, this page and `AGENT_LOG.md` (newest entry) win.

## 0. The one rule
**Nothing goes to `index.html` without first going to `test.html` and being checked.** Every build you
ship gets: a version number one higher than the last, an `AGENT_LOG.md` entry, the HANDOFF "Live" line,
and the edited sources pushed to `src/`. If you cannot do all four, do not ship.

## 1. Read these, in this order (30 minutes)
1. This file.
2. `HANDOFF.md` — the manual (sections 3, 4b, 5, 6, 8 matter most).
3. `AGENT_LOG.md` — **the last 10 entries** (what just happened and why).
4. `ops/TODO.md` — the only task list. The top section "Next up" is the queue; take the first unclaimed item.
5. `DESIGN.md` — before touching any screen. `CHALLENGES.md` — before touching trophies/challenges/titles.
6. `AUDIT-2026-10-24.md` — the open findings behind the TODO items (numbers match).
7. `OPERATIONS.md` — release, rollback, backups, incidents.

## 2. What you must never do (product decisions already made — don't reopen them)
- No scraping UDisc or any other app's course data. Courses come from OpenStreetMap, PDGA licence,
  players adding them in the app (`playerCourses`), or Will's own files. Never run or save a UDisc scraper.
- No "king / queen / crown / legend" wording. Plain words. No emoji as icons (SVG `Icons.*` only).
- No stickers/promotion work until Will says the app is where he wants it.
- Don't rewrite the app, change the build system, add a state library, add frameworks, or "clean up"
  modules you weren't asked to touch. Small, verified steps.
- Don't create accounts, publish Firebase rules, create repos, or set secrets — those are Will's actions;
  give him exact click-by-click steps instead.
- Don't put files in Will's Downloads/Desktop. Everything goes to GitHub (he said "I don't collect files").
- Don't print the GitHub token. Don't commit it. Don't commit user data (emails, messages, full DB
  exports) to any of the four public repos.
- Don't delete other people's rounds, titles or data while testing. Test as Will's account only if you
  must, create at most one small round, and remove it afterwards (see §6).

## 3. Cold start — the workbench (copy these commands)
The sandbox is wiped between sessions. The GitHub token is in Will's `Desktop\DGFT Token.txt`
(Contents + Workflows on the four repos; cannot create repos or dispatch Actions).

```bash
mkdir -p /tmp/chains/mods && cd /tmp/chains
# token: copy the contents of Desktop\DGFT Token.txt into /tmp/chains/tok (one line, no newline issues)
T=$(cat /tmp/chains/tok); AL="https://api.github.com/repos/Bonnaroo/chains-agent-log/contents"
raw() { curl -s -H "Authorization: token $T" -H "Accept: application/vnd.github.raw" "$AL/$1" -o "$2"; }
raw ops/build.py build.py; raw ops/push.py push.py; raw ops/tdz.js tdz.js; raw ops/blob_ids.json blob_ids.json
raw HANDOFF.md HANDOFF.md; raw AGENT_LOG.md AGENT_LOG.md; mkdir -p ops && raw ops/TODO.md ops/TODO.md
for i in 008 012 017 019 024 031 032 038 041 042 045 046 047 057 058 060 068 070; do raw src/module_$i.js mods/module_$i.js; done
curl -s https://bonnaroo.github.io/chains-app/index.html -o app_base.html      # the live file is the base
npm init -y >/dev/null 2>&1; npm i esbuild@0.21.5 espree eslint-scope --silent
grep -o 'CHAINS_VERSION = \\"v[0-9]*' app_base.html                             # must print the live version
python3 build.py v999 local "check" | tail -1                                   # must print "built … babel dropped"
```
If the last line fails, stop and read `HANDOFF.md §4b`. Do not ship.

`build.py` takes **`mods={...}`** (the modules it rebuilds) from its own first lines; every module listed
there is read from `/tmp/chains/mods/`. Edit only those files. Numbers = `src/module_NNN.js` names.

## 4. Make a change (the loop)
1. Edit `/tmp/chains/mods/module_NNN.js` (JSX allowed). Python edits: check every anchor with
   `assert s.count(a) == 1` **before** any replace, write the file **once at the end**, and
   `s.encode('utf-8')` before writing (HANDOFF gotchas 5 and 6).
2. Check: `./node_modules/.bin/esbuild mods/module_NNN.js --loader:.js=jsx --target=es2018 > /tmp/c.js && node tdz.js /tmp/c.js` → must print `clean`.
3. Build to staging: `python3 build.py v555 test.html "v555: what changed"` (next number after the HANDOFF Live line).
4. Wait ~2 minutes, confirm: `curl -s https://bonnaroo.github.io/chains-app/test.html | md5sum` equals `md5sum < app_v555.html`.
5. Verify on test.html (§5). 0 console errors, the change visible, nothing else broken.
6. Promote: `python3 build.py v555 index.html "v555 live: what changed"`.
7. Push sources: `python3 push.py chains-agent-log src/module_NNN.js mods/module_NNN.js "src: module NNN v555"` for every edited module.
8. Log: append an entry to `AGENT_LOG.md` (date, version, what/why/where, how verified, "Compatibility:
   additive" or what an older build would not understand), push it; update the HANDOFF §9 Live line;
   tick `ops/TODO.md`. Push each with `push.py chains-agent-log <path> <localfile> "<msg>"`.

## 5. How to verify (pick what you have)
- **Best**: Claude-in-Chrome on Will's PC: open `https://bonnaroo.github.io/chains-app/test.html?harness=N#play`,
  replace the page with a 400×760 iframe of test.html (it is signed in as Will), drive it with
  `javascript_exec`, capture `console.error` and `window.onerror`. Examples are all over AGENT_LOG (v537+).
- **No browser automation?** Build, then run the static checks (esbuild + tdz.js for every edited
  module), confirm the md5 is live, and ask Will to open **test.html** on his phone and try the one screen
  you changed. Say exactly what to tap and what he should see. Do not promote until he says it works.
- **Anonymous data check** from the sandbox (no login needed for public nodes):
  `curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAZ9T16EZSngQxNevsil-txb3xpEC4RKIE" -H 'Content-Type: application/json' -d '{"returnSecureToken":true}'`
  → use the `idToken` as `?auth=` on `https://chains-app-f38f8-default-rtdb.firebaseio.com/<node>.json`.
  (Anonymous sign-ins are allowed by the rules for reads; this creates a throwaway anonymous user.)

## 6. Testing etiquette (shared, live database)
test.html and index.html share the **same** Firebase database and the same sign-in. Anything you do in
the harness is real. If you score a test round: solo, at Otterburn (`mi-otterburn`), finish it, then
remove it: `ChainsRounds.remove(id)` and `ChainsFB.db.ref('courseStats/mi-otterburn/'+id).remove()`, then
re-run `ChainsTakeover.sync('mi-otterburn', await ChainsRounds.courseBoard('mi-otterburn'), 'will',
'Otterburn Disc Golf Park')`. Never leave test leagues, groups, call-outs or courses behind (remove the
record and its code entry). Never change Will's title/goal/favourites without putting them back.

## 7. Where things are (so you don't search)
| Need | Place |
|---|---|
| App shell, nav, bottom bar, More sheet | `src/module_047.js` |
| Home, Chase card, courses, course page, scoring (ScoreBoard), finish card, trophies UI, Me, stats | `src/module_045.js` (big) |
| Rounds engine, course board (`courseStats`), titles (`courseTerritory`), hole owners (`ChainsTakeover`), firsts, sync state | `src/module_031.js` |
| Trophy ladders (100), points, level, glyph map | `src/module_032.js` |
| Leagues (one-window + weekly), friends UI, groups, call-outs | `src/module_068.js` |
| Friends/chat engine, photos, featured title | `src/module_070.js` |
| Auth, delete account | `src/module_060.js` · Settings/account UI `src/module_041.js` |
| Firebase init + write-refusal logging | `src/module_012.js` |
| Rating | `src/module_057.js` · Notifications `src/module_038.js` · Aces `src/module_042.js` · Icons `src/module_046.js` |
| CSS tokens / themes / manifest / loader | inside `app_base.html` (not a module) — change via a Python replace on the base and rebuild |
| Data model | `HANDOFF.md §6`, rules: `firebase/chains-app-f38f8.rules.v2.json` (unpublished) |
| Course catalog + pipeline | repo `chains-dgpt-data` (`data/courses.json`, `pipeline/`) |

## 8. Current state (2026-10-25) and what to do next
- **Live v554.** Home opens with "What you're chasing"; weekly/monthly challenges; 100 trophies, points,
  levels; titles per course (record, champion, most rounds, local regular, birdie leader, most improved,
  hole owners); weekly leagues; groups and call-outs on Friends; add-your-course; nearby/favourites;
  delete account; precompiled build (no Babel); every cloud write logged; save-state line while scoring;
  phone Back works on pushed screens.
- **Waiting on Will** (ask him once, politely, with steps; don't block on it): publish rules v2; create a
  test account `chainstest`; create the private `chains-backups` repo; UptimeRobot/Sentry; run the course
  pipeline workflow once.
- **Next up for you**: the "Next up" list at the top of `ops/TODO.md`, in order. Each item says what
  "done" looks like. Take one, finish it end to end (build → verify → promote → src → log → tick), then the next.
- **Known weak spots to keep in mind**: nothing has been tested from a second phone/account; the harness
  only runs as Will; imported UDisc rounds count like any other round (Will to decide); reads are whole-node
  (fine for 13 users).

## 9. Talking to Will
Short, plain updates: what changed, what to try on his phone, what you need from him. He is the product
owner: when he says a thing is cheesy, clunky or gimmicky, remove it, don't argue. When he asks for
something big, build rough bones first and say what's rough.
