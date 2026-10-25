# Clean up test data (you are on the live database)
In the harness iframe (`w` = iframe window):
- Test round: `await w.ChainsRounds.remove(id)`; `await w.ChainsFB.db.ref('courseStats/<course>/'+id).remove()`; then `await w.ChainsTakeover.sync('<course>', await w.ChainsRounds.courseBoard('<course>'), 'will', '<Course name>')` so titles recompute. Find ids with `(await w.ChainsRounds.loadMine()).filter(r => r.date === today)`.
- Open round left behind: also `localStorage.removeItem('chains_play_active')` and delete it from `chains_rounds_v1`.
- League: `w.ChainsCourseLeagues.remove(id)` (removes the code too). Group: `crews/{id}` + `crewCodes/{code}` + leave. Call-out: `callouts/{id}`. Course: `playerCourses/{id}`.
- Title/goal/favourites you changed on Will's account: put them back (`ChainsFriends.setFeaturedBadge(null)`, `ChainsGoals.set(null)`, `ChainsFavs.toggle`).
- Never remove rounds with more than one participant unless you created them.
