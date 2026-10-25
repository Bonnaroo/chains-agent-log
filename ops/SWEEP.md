# SWEEP — the audit every session does (one screen group per session, rotate)

Pick the group with the oldest "last swept" date, walk it as a player would, and record what you find in
`ops/BUGS.md` (bugs, with steps) or `ops/TODO.md` (improvements, with a "done =" line). Update the date here.
Use the harness if you have it (ops/HOWTO/verify-with-harness.md); otherwise read the source for that
screen and ask Will to walk it on his phone.

| # | Screen group | Where in code | Last swept | By |
|---|---|---|---|---|
| 1 | Sign-in, first run, Home ("What you're chasing", last round, trophies, this week, feed) | 058, 045 (PlayView home), 047 | 2026-10-24 | claude-cowork |
| 2 | Courses: browse (Recent/Favourites/Nearby/All), add a course, course page tabs Course·Holes·Territory·Board, lost & found | 045 (CoursePick, AddCourse, CourseView, TakeoverCard, TerritoryCard) | 2026-10-24 | claude-cowork |
| 3 | Scoring: start a round (group, holes plan), score rows, hole strip, map, Finish now, finish card, trophies reveal | 045 (GroupPick, ScoreBoard, FinishCard, TakeoverResult), 031 | 2026-10-25 | claude-cowork |
| 4 | Challenges: This week, this month, Trophies (Next up, points board, shelf, titles) | 045 (TakeoverHub, WeeklyChallenges, BadgeShelf), 032 | 2026-10-24 | claude-cowork |
| 5 | Friends: requests, codes, chat, call-outs, groups, friends' rounds | 068, 070 | 2026-10-24 | claude-cowork |
| 6 | Leagues: create (one-window, weekly), league page, standings, calendar; Season 2026 archive | 068, 008 | 2026-10-24 | claude-cowork |
| 7 | Me, My stats, Go Throw hub rows, Bag, Settings/account (photo, password, delete) | 045 (MeView, MyStats), 041, 060 | 2026-10-24 | claude-cowork |
| 8 | Data side: courseStats written on finish, titles recompute, weekly card, notifications, rules file vs nodes in use, backups green | 031, 038, firebase/, chains-dgpt-data Actions | 2026-10-25 | claude-cowork |

Checks for every screen (DESIGN.md §9): a way back · one primary action · no emoji icons · nothing moves on its
own · plain words · no stray text (`}`, `undefined`, `NaN`, `\uXXXX`) · 0 console errors · readable
contrast · tap targets ≥ 44 px · empty / loading / error states make sense · the data it shows matches
Firebase · it still works with a 9-hole round and with a brand-new account.
