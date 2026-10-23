# Chains — running to-do list

Owner: Will. Maintained by whichever AI is working the app. **Every session: tick what shipped, add what came up.**
Status words: `todo` · `doing` · `done <version>` · `will` (needs Will's hands) · `later`.

## Bugs / fixes
- [ ] `todo` Two-player test of every shared flow with a second account (card from two phones, friend request, DM, league invite, Takeover notifications) — nothing shared has had a real two-phone test yet
- [ ] `todo` Lost & found friend notification didn't post in the harness test (board itself works) — reproduce on a phone
- [ ] `todo` Course-page "Everyone who's played here" table only shows the first 6 — paginate
- [ ] `todo` Avatar once went missing on Will's phone (not reproduced; photos now override the icon)
- [ ] `will` Publish Firebase rules v2 (`firebase/chains-app-f38f8.rules.v2.json`) — step list in AGENT_LOG 2026-10-21
- [ ] `will` Railway env vars + service-account key for the password-reset worker

## Structure / UI (the uplift)
- [x] `done v519` DESIGN.md rulebook; real icons; 4 Home tiles; bar Home·Courses·Play·Challenges·More; More = rarely used; Names → Challenges/Territory; season page cleanup; reveal capped
- [x] `done v527` My stats: rating hero + trend, scoring mix, last six months, home course numbers
- [ ] `todo` Go Throw hub: trim to rounds + stats + trophies; move rivalries/aces/crew rounds behind their own rows
- [x] `done v525` Trophies: "Next up" progression card · `done v526` SVG glyphs, no emoji anywhere in trophies
- [x] `done v529` First tiers steeper (event ladders need 3); 27 → 19 earned on Will's three rounds
- [x] `done v530` Weekly leagues: league night + weeks, best N of M, league-night-only option, divisions by rating, week grid, reminders, calendar file
- [ ] `todo` Leagues next: points-per-week scoring (10/8/6…), doubles/partner format, commissioner can edit the schedule after creation, per-week card view
- [x] `done v516` Home as tiles: Go Throw · Courses · Leagues · Names · Friends · Bag · Live Chains · Me
- [ ] `todo` Leagues hub: your course leagues + "Season 2026" archive card (standings, champion) — picks/dashboard live there
- [x] `done v516` Live Chains dormant screen until spring 2027
- [x] `done v516` Me: profile photo, trophies, names, settings in one place
- [x] `done v516` Bag and Names grouped under Go Throw in More; Names tab lives on each course page
- [ ] `todo` Copy audit: plain words, no jargon, no stray escape text (one found and fixed in v515)
- [x] `done v532` Trophies → 100 (collections, problem solved, beat your ghost, birdie run, dime, nine counts, long haul, return visit, league player/winner)

## Ops (policies, procedures, backups)
- [ ] `will` Create PRIVATE repo `chains-backups` and follow `ops/backups-kit/README.md` (6 steps) — until then the nightly rounds backup in chains-dgpt-data is the only one, and that repo is public
- [x] `done 2026-10-23` OPERATIONS.md: release procedure, rollback, backup/restore, incident steps, weekly checks, who does what
- [ ] `will` Sentry (crash reporting) + UptimeRobot (uptime) — I give exact steps when you say go
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
- [ ] `todo` Brand guidelines: name is just **Chains**; colours/type already in the app's CSS variables; logo, voice, the one-line pitch
- [ ] `todo` Web page (landing: what it is, screenshots, download/open link, "Names on the course" pitch)
- [ ] `todo` **Course stickers with a QR code** — posted at courses: "Think you own this course? Prove it." / "Every hole here has a name on it. Is it yours?" → QR opens the app at that course (link `#course=<id>`)
- [ ] `todo` App Store: PWA first (Add to Home Screen, icon, offline shell), then Capacitor wrapper → Apple ($99/yr) + Google ($25)
- [x] `done v531` "Add your course" flow (two minutes: name, town, holes, pars, location)
- [ ] `later` Bag tags (crew ladder), call-outs (hole challenges between two players)

## Challenges & trophies (CHALLENGES.md build order)
- [x] `done v524` Home course + mastery map + "What moved" recap
- [x] `done v525` Week · Month · Trophies tabs, month set + Month complete ladder, points, streak freeze
- [x] `done v527` Trophy points board (everyone on Chains)
- [x] `done v529` Titles: featured trophy shows as a text title on the Me page + points board
- [x] `done v528` Crowns v2 on the course page: course champion (year), local regular (distinct days, 90 d), birdie leader (distinct holes); held log + notice when lost
- [ ] `todo` Most improved crown (needs 10+ rounds; biggest sustained drop in 5-round average)
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
