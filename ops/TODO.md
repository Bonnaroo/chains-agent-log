# Chains — running to-do list

Owner: Will. Maintained by whichever AI is working the app. **Every session: tick what shipped, add what came up.**
Status words: `todo` · `doing` · `done <version>` · `will` (needs Will's hands) · `later`.

## From the 2026-10-24 audit (AUDIT-2026-10-24.md — numbers refer to it)
- [x] `done v552` P1 2.1 Contrast tokens (light themes); `todo` re-measure the dark themes and the hero/ink panels
- [ ] `will` P1 3.4 Publish rules v2, then AI runs the allowed/denied matrix with a test account
- [ ] `will` P1 3.5 Create a test account (`chainstest`) so two-account flows can be exercised without Will's account
- [ ] `todo` P1 3.2 Save-state truth: writeLocal reports failure; "Saved · Synced / Saving…" indicator on the scoring screen
- [ ] `todo` P1 3.1 Write-failure sweep: no bare catch around a cloud write (modules 31/45/68/70)
- [ ] `will` P1 3.7 Private backups repo → then AI restore drill into an isolated node; consider stopping the public rounds backup
- [x] `done` P1 4.3 chains-app README no longer calls sw.js an offline shell
- [ ] `todo` P2 1.2 Count-title ties keep the incumbent (most rounds, birdie leader, local regular)
- [ ] `todo` P2 2.2/2.3 Browser Back for pushed screens; aria-labels on score −/+ (player + hole)
- [ ] `todo` P2 2.8 Scoring screen states: offline, pending sync, couldn't save
- [ ] `todo` P2 3.14 tests/ with node tests for courseTerritory, weeklyStandings, level, ladder
- [ ] `todo` P2 4.1/4.2 build.py writes the HANDOFF live line on promote; CHAINS_SYSTEM.md reconciled (build, nodes v542–v551)
- [ ] `todo` P2 3.8 Points board from a maintained top-N node; home-course reads instead of allCourseStats where possible
- [ ] `todo` P2 1.9/3.9 Minimal metrics counters (round_started/final, goal_picked, callout_created, time-to-home)
- [ ] `todo` P2 1.6 Imported-rounds policy (personal history yes; course record/champion no?) — Will decides
- [ ] `todo` P2 3.12 OPERATIONS rollback sentence qualified; "compatibility" line in each release entry
- [ ] `todo` P2 3.11 Account deletion end-to-end with the test account; scrub names in shared scores
- [ ] `later` P3 1.3 rules sheet per title · 1.5 goal baseline median/back-it-up · 1.7 layout versions · 1.8 notification digest · 2.4 focus trap in sheets · 2.7 readiness-driven deep link · 3.10 service-worker decision · 4.4 task claims when a second agent exists · 4.6 release manifest with artifact hash

## Bugs / fixes
- [x] `done v542` courseStats never written since the pars field (silent ReferenceError) — backfilled 10/22 + 10/23; refused writes now logged
- [ ] `todo` Two-player test of every shared flow with a second account (card from two phones, friend request, DM, league invite, Takeover notifications) — nothing shared has had a real two-phone test yet
- [ ] `todo` Lost & found friend notification didn't post in the harness test (board itself works) — reproduce on a phone
- [x] `done v549` "Everyone who's played here" — Show all
- [ ] `todo` Avatar once went missing on Will's phone (not reproduced; photos now override the icon)
- [ ] `will` Publish Firebase rules v2 (`firebase/chains-app-f38f8.rules.v2.json`) — step list in AGENT_LOG 2026-10-21
- [ ] `will` Railway env vars + service-account key for the password-reset worker

## Structure / UI (the uplift)
- [x] `done v519` DESIGN.md rulebook; real icons; 4 Home tiles; bar Home·Courses·Play·Challenges·More; More = rarely used; Names → Challenges/Territory; season page cleanup; reveal capped
- [x] `done v527` My stats: rating hero + trend, scoring mix, last six months, home course numbers
- [x] `done v521/v545` Go Throw hub rows: My rounds · My stats · Trophy case · Titles you hold · Rivalries & aces · Friends' rounds
- [x] `done v525` Trophies: "Next up" progression card · `done v526` SVG glyphs, no emoji anywhere in trophies
- [x] `done v529` First tiers steeper (event ladders need 3); 27 → 19 earned on Will's three rounds
- [x] `done v530` Weekly leagues: league night + weeks, best N of M, league-night-only option, divisions by rating, week grid, reminders, calendar file
- [x] `done v536` Points-per-week league scoring
- [ ] `todo` Leagues next: doubles/partner format, commissioner edits the schedule after creation, per-week card view
- [x] `done v516` Home as tiles: Go Throw · Courses · Leagues · Names · Friends · Bag · Live Chains · Me
- [ ] `todo` Leagues hub: your course leagues + "Season 2026" archive card (standings, champion) — picks/dashboard live there
- [x] `done v516` Live Chains dormant screen until spring 2027
- [x] `done v516` Me: profile photo, trophies, names, settings in one place
- [x] `done v516` Bag and Names grouped under Go Throw in More; Names tab lives on each course page
- [x] `done v533` Emoji sweep of every screen (only the ★ rating control and user-picked reactions remain)
- [ ] `todo` Copy audit: plain words, no jargon (read every string on every screen once, slowly)
- [x] `done v532` Trophies → 100 (collections, problem solved, beat your ghost, birdie run, dime, nine counts, long haul, return visit, league player/winner)

## Ops (policies, procedures, backups)
- [ ] `will` Create PRIVATE repo `chains-backups` and follow `ops/backups-kit/README.md` (6 steps) — until then the nightly rounds backup in chains-dgpt-data is the only one, and that repo is public
- [x] `done 2026-10-23` OPERATIONS.md: release procedure, rollback, backup/restore, incident steps, weekly checks, who does what
- [ ] `will` Sentry + UptimeRobot — exact steps in `ops/MONITORING.md` (20 minutes)
- [ ] `later` Consider making chains-agent-log private (it holds system docs; no secrets, no user data)

## Course data (the side project — `chains-dgpt-data/pipeline/`)
- [ ] `will` Click **Run workflow** once on "Course data pipeline" in chains-dgpt-data (Actions tab) — then it runs every Sunday on its own
- [ ] `will` Send the three licence emails in `pipeline/SOURCES.md` (PDGA, UDisc, DiscGolfMetrix)
- [x] `done v516` App: course catalog cache key rolls weekly
- [x] `done v531` App: "Add your course" (name, town, holes, pars, GPS) → playerCourses, merged into the catalog, community note on the page
- [ ] `todo` Pipeline: promote reviewed playerCourses into courses.json (weekly job reads Firebase); lengths + tee/basket mapping from the Holes tab
- [ ] `todo` Imagery for production: Esri Location Platform key (or MapTiler) before App Store
- [ ] `later` Google Places: store `place_id` only; show rating/reviews live when a key exists
- [ ] `later` County/city GIS park layers for Michigan first

## Growth
- [x] `done 2026-10-24` BRAND.md (name, pitch, voice, colours, type, logo, stickers, website, store listing)
- [x] `done 2026-10-24` about.html landing page (chains-app) · `todo` real phone screenshots once Will likes the look
- [x] `done v534` First sticker file exists · **parked** (Will 2026-10-24: not ready for stickers until the app is where he likes it)
- [x] `done v535` Account deletion in Settings + privacy policy on about.html
- [ ] `todo` App Store: `chains-native` (Capacitor) repo per `ops/APPSTORE.md`; `will` Apple Developer + Codemagic accounts when ready
- [x] `done v531` "Add your course" flow (two minutes: name, town, holes, pars, location)
- [ ] `later` Bag tags (crew ladder), call-outs (hole challenges between two players)

## Challenges & trophies (CHALLENGES.md build order)
- [x] `done v538` Chase on Home (title within reach · next breakthrough · this week) · `v540` hole birdie titles in the chase
- [x] `done v539` Courses: Recent · Favourites · Nearby · All
- [x] `done v546` Groups bones on Friends (start/join by code, members, month together, group birdie map)
- [ ] `todo` Groups next: group challenge of the month with a reward, group vs group at a course, group chat
- [x] `done v541` Post-round recap names titles taken/lost
- [x] `done v524` Home course + mastery map + "What moved" recap
- [x] `done v525` Week · Month · Trophies tabs, month set + Month complete ladder, points, streak freeze
- [x] `done v527` Trophy points board (everyone on Chains)
- [x] `done v529` Titles: featured trophy shows as a text title on the Me page + points board
- [x] `done v528` Crowns v2 on the course page: course champion (year), local regular (distinct days, 90 d), birdie leader (distinct holes); held log + notice when lost
- [x] `done v536` Most improved crown
- [ ] `later` Crew challenges (crew birdie map, team improvement) once there are local players
- [ ] `later` Practice tracking (opt-in; putting / range) — never claims causation

## Done recently
- `done v527` My stats rebuilt, trophy points board, rating pin used everywhere (Me view showed 965, now 830)
- `done v526` SVG trophy glyphs, duplicate ladder id fixed · `v525` Challenges tabs, month set, points, streak freeze
- `done v524` home course + mastery map · `v523` Home = progress/last round/trophies/this week · `v522` Challenges rebuilt, scoreboard
- `done v519` DESIGN.md + de-gimmick pass · `v517-518` group scoring rows, finish-now, scorecard strip fix
- `done v515` Names on the course (firsts + holds), course page tabs, in-round owner target + "hole is yours", crews emblem/colour/cap, branding = Chains
- `done v514` Takeover hub + crews + monthly race, lost & found, 86 trophies, leagues v2 (pledge/handicap/verified/final/ace pot), HANDOFF.md
- `done v513` Takeover v1, profile photos · `v512` rating pinned per course, weekly challenges · `v511` floating hole bar, ace mis-tap protection · `v510` score pad
