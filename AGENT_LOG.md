# CHAINS AGENT LOG — persistent memory for the autonomous loop
Protocol: READ this whole file before working. CLAIM your run by committing a line under CURRENT RUN (time + what you're starting). WORK. Then REPLACE your claim with a RUN LOG entry (what you did / found / next). If CURRENT RUN has a claim younger than 20 minutes, another run is active: do NOT duplicate it — pick a different open item or exit.

## MISSION (owner: Guillermo)
Package the Chains disc golf app to market and sell. Priorities:
1. Go Throw round tracker at UDisc quality: reliable save, blank-until-entered scoring, always-visible scorecard, tap-any-hole edit, correct running totals, history + score-to-beat, delete-round in UI, live-watch, rounds backup.
2. 2. STRIP all betting/money UI from the live app (keep code dormant, nothing visible/reachable).
   3. 3. Keep GitHub + Firebase healthy; deploy clean builds to the live host.
      4. 4. Marketing site live. Course data expansion runs as its own task (chains-course-expansion).
        
         5. ## RESOURCES
         6. - App (live): https://bonnaroo.github.io/chains-app  (repo Bonnaroo/chains-app, deploy = index.html)
            - - Design System (builds the app): https://claude.ai/design/p/56b805f6-d4d3-4ee4-b8ab-c51ed711a3b9
              - - Firebase: chains-app-f38f8 (app data). NEVER touch chains-fantasy /league (live friends league).
                - - Data repo: Bonnaroo/chains-dgpt-data (results, courses, discs, daily league backups). Assets: Bonnaroo/chains-dgpt-assets.
                  - - Safety: back up to _trash/<ts> before any delete. Betting = back burner.
                   
                    - ## CURRENT RUN
                    - (idle)
                   
                    - ## OPEN ITEMS (top = next)
                    - 1. VERIFY Design's RoundDetail fix (v401 regression: "Element type is invalid... Check the render method of RoundDetail") — test Go Throw in preview, tap a round.
                      2. 2. SEND Design (when idle): strip all betting/money UI (Live Betting nav + views, pools, bet-a-buddy, moneyball, coins chip; keep modules dormant; don't touch Go Throw/picks/standings/stats/friends/bag).
                         3. 3. DEPLOY next clean build to Bonnaroo/chains-app as index.html (live site still pre-v401).
                            4. 4. Go Throw UX overhaul spec: blank-until-entered scores, scorecard always visible, obvious tap-to-edit, consistent running total.
                               5. 5. Delete-round button in UI.
                                  6. 6. Add playRounds to daily backup workflow (currently only /league).
                                     7. 7. Marketing site: create repo + GitHub Pages, deploy Chains Marketing Site.html (waitlist Formspree ID needs Guillermo).
                                        8. 8. After deploys: verify standings header shows Cory 56 on live site.
                                          
                                           9. ## RUN LOG (newest first: date time | did | found | next)
                                           10. - 2026-07-25 ~11:00 | Manual session: found+fixed v400 Go Throw white-screen (hs.forEach; Firebase object-vs-array holeScores) via Design=v401 (toArr/fixRound + error boundary, verified). Found v401 RoundDetail regression, fix requested from Design (was building). Deleted 3 stale test rounds from Firebase (backed up _trash). Created this repo as agent memory. | Next: item 1.
                                               - 
