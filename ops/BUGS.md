# BUGS — confirmed defects (anyone can add; fix in severity order; move to "Fixed" with the version)

Format: `- [ ] S1|S2|S3 · screen · what happens · steps to see it · found by, date`
S1 = data loss / can't score / crash · S2 = wrong numbers or a broken feature · S3 = polish.
Suspected but not reproduced goes under "Unconfirmed" with how to try to reproduce it.

## Open
- (none confirmed as of 2026-10-25)

## Unconfirmed
- [ ] S3 · Lost & found · friend notification didn't post in one harness test (board itself works) · post a lost disc with a friend on the list, check the friend's bell · claude-cowork, 2026-10-23
- [ ] S3 · Me · avatar once missing on Will's phone; photos now override the icon; not reproduced · Will, 2026-10-21
- [ ] S2 · Every two-phone flow (cardmate finish, friend request, DM, invite, call-out, title change) is untested — needs the `chainstest` account · 2026-10-25

## Fixed
- [x] S1 · courseStats never written after 2026-10-21 (variable scope, swallowed by a bare catch) · fixed v542, backfilled
- [x] S2 · two use-before-declare crashes exposed when Babel was removed · fixed v537
- [x] S3 · stray `}` text on the Territory tab · fixed v549
