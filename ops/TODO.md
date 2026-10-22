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
- [ ] `todo` Home as tiles: Go Throw · Leagues · Live Chains · Me; bottom bar to match
- [ ] `todo` Leagues hub: your course leagues + "Season 2026" archive card (standings, champion) — picks/dashboard live there
- [ ] `todo` Live Chains dormant screen until spring 2027 (shows last event, says when it's back)
- [ ] `todo` Me: profile photo, trophies, names, settings in one place
- [ ] `todo` Bag moves under Go Throw; Takeover folded into Go Throw/courses, not a top-level thing
- [ ] `todo` Copy audit: plain words, no jargon, no stray escape text (one found and fixed in v515)
- [ ] `todo` Trophies 86 → 100 (ideas in AGENT_LOG 2026-10-22 brainstorm)

## Ops (policies, procedures, backups)
- [ ] `will` Create PRIVATE repo `chains-backups` and follow `ops/backups-kit/README.md` (6 steps) — until then the nightly rounds backup in chains-dgpt-data is the only one, and that repo is public
- [ ] `todo` OPERATIONS.md: release procedure, backup/restore, incident steps, data retention, who does what
- [ ] `will` Sentry (crash reporting) + UptimeRobot (uptime) — I give exact steps when you say go
- [ ] `later` Consider making chains-agent-log private (it holds system docs; no secrets, no user data)

## Course data (the side project — `chains-dgpt-data/pipeline/`)
- [ ] `will` Click **Run workflow** once on "Course data pipeline" in chains-dgpt-data (Actions tab) — then it runs every Sunday on its own
- [ ] `will` Send the three licence emails in `pipeline/SOURCES.md` (PDGA, UDisc, DiscGolfMetrix)
- [ ] `todo` App: course catalog cache key should roll weekly so phones pick up pipeline updates without a release
- [ ] `todo` App: "Add your course" flow (name, holes, pars, lengths, mark tees/baskets) + Pioneer name for the mapper; show `needs_review` courses as "community course — help map it"
- [ ] `todo` Imagery for production: Esri Location Platform key (or MapTiler) before App Store
- [ ] `later` Google Places: store `place_id` only; show rating/reviews live when a key exists
- [ ] `later` County/city GIS park layers for Michigan first

## Growth
- [ ] `todo` Brand guidelines: name is just **Chains**; colours/type already in the app's CSS variables; logo, voice, the one-line pitch
- [ ] `todo` Web page (landing: what it is, screenshots, download/open link, "Names on the course" pitch)
- [ ] `todo` **Course stickers with a QR code** — posted at courses: "Think you own this course? Prove it." / "Every hole here has a name on it. Is it yours?" → QR opens the app at that course (link `#course=<id>`)
- [ ] `todo` App Store: PWA first (Add to Home Screen, icon, offline shell), then Capacitor wrapper → Apple ($99/yr) + Google ($25)
- [ ] `todo` "Add your course" flow so players can create a course page in two minutes (hole count, pars, lengths, mark tees/baskets on site) — how we get every course without copying anyone's data
- [ ] `later` Bag tags (crew ladder), call-outs (hole challenges between two players)

## Done recently
- `done v515` Names on the course (firsts + holds), course page tabs, in-round owner target + "hole is yours", crews emblem/colour/cap, branding = Chains
- `done v514` Takeover hub + crews + monthly race, lost & found, 86 trophies, leagues v2 (pledge/handicap/verified/final/ace pot), HANDOFF.md
- `done v513` Takeover v1, profile photos · `v512` rating pinned per course, weekly challenges · `v511` floating hole bar, ace mis-tap protection · `v510` score pad
