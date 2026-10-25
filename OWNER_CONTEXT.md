# OWNER_CONTEXT — what Will has decided and how he works (for any AI; distilled from three weeks of chats)

Will (Guillermo) is the commissioner of a six-friend fantasy DGPT league and the owner of Chains. He is not a
developer. He tests on his iPhone at Otterburn Disc Golf Park (Swartz Creek, MI), usually 9 or 18 holes with
Kyle; Cory, Gabe, Kadey, Katie are the rest of the crew. He wants Chains released next season, free at first,
eventually in the app stores, and "a one-stop shop for disc golf": score rounds, names on every course,
leagues, fantasy, friends, bag, videos.

## How he works with an AI
- Goal-oriented autonomy: open what's needed, do the work, report. He does the clicks only when a credential
  or approval genuinely needs him (Firebase console, GitHub secrets, Railway). Give him click-by-click steps.
- Keep going; never propose "tomorrow". Don't ask clarifying questions about bugs — reproduce and fix.
- Short plain updates: what changed, what to try on his phone, what he needs to do.
- When he says something is cheesy, clunky, gimmicky or "not like a real app", remove it. Don't argue.
- Big asks: build rough bones first, say what's rough, then he tweaks.
- Everything lives in GitHub, labelled. Never put files in his Downloads/Desktop ("I don't collect files").
- Archive rather than delete when something has reference value; explain why before removing.
- His word on league picks, rules and scores is final.

## Product decisions (don't reopen)
- The app is just **Chains**. No "Fantasy DGPT" in the name. Tagline "Disc golf, with your crew".
- Plain words: no king/queen/crown/legend. No emoji as icons. One accent colour. Fewer tiles. Rarely-used
  things under More. A way back on every screen. Nothing moves on its own while scoring.
- Four lanes, kept visually apart: trophies (permanent, profile) · personal goals (private, Home) · weekly
  challenges (Challenges tab) · titles/territory (public, course pages + the Home chase line).
- Titles stay with the holder until beaten; count-title ties keep the incumbent; both players are told on a
  change; empty titles say "nobody holds this yet". Hole ownership needs 3+ plays (one visit = cheesy).
- Trophies: ~100 tiered ladders; first tiers must feel earned (he got 30 at once and called it too easy);
  the reveal is liked. Realistic ratings (his −4 at Otterburn ≈ 830, not 1010).
- Scoring: tap the number for par, −/+ to adjust, a visible Next, nothing auto-advances; a 9-hole round
  must be closable; 9-hole rounds count for showing-up titles.
- Leagues: fantasy league closed until the 2027 season; course leagues friends create (one window or weekly,
  pledge-to-start, honor system, witnessed final) — he asked for many options and a scheduler.
- Groups: wanted, but only as bones; nothing may pool or override an individual's titles; nothing nags you
  to create one.
- Course data: never scrape UDisc (declined three times). OSM, PDGA licence, players adding courses, his files.
  UDisc CSV import of a player's own rounds is fine. UDisc is the *feature* reference, never copied visually.
- Stickers / promotion: parked until the app is where he likes it. Website and App Store are on the list.
- Security/ops: everyone has their own data, rules must be real before strangers join, backups and records
  never lost, policies and procedures written down.

## Things he has said he likes (keep)
Progress-for-the-month on Home; last round + newest trophies on Home; the trophy reveal; the bottom bar;
the inline map while scoring with his own dot; the course page content (records, leaders); the finish recap.

## Things he has rejected (don't bring back)
"Your territory / crews / latest moves" on the Challenges screen; owning all 18 holes after one play; the
Me emoji; the Start-a-round button on Home (Play is on the bar); Leagues/Go Throw in the bottom bar;
"Names" as a feature name; INTVL-style wording copied straight; betting/coins; the "company of agents" of
September that talked to itself.

## Standing requests from him to the AI
Keep improving, keep it light on data, make sure the back end saves everything, keep the to-do list and the
manuals current in GitHub, make the app easy for the next AI to pick up, and tell him exactly what to do when
only he can do it.
