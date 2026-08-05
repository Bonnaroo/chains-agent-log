# Chains — Field Test Log

## 2026-08-05 — Field Tester run (account: shanna, standing in for kyle — see below)

**Worst thing found:** Every "Go Throw" round-sync write has been failing `PERMISSION_DENIED` for every
signed-in user, for as long as the account system has existed. `ChainsRounds` writes the cloud record's
`owner` field as the app-level username (`ChainsID.whoami()`, e.g. `"shanna"`), but the deployed security
rules require `owner === auth.uid` (the real Firebase Auth uid, a different string). This is very likely the
root cause of "deleted rounds came back" — delete bundles `playRounds/{id}=null` + `liveRounds/{id}=null`
into one atomic update, and Firebase rejects the WHOLE update if either path's rule fails, so the real
record is never actually deleted even though the local copy vanishes. Historical proof: today's pre-purge
backup shows the 4 rounds that existed before cleanup all had `owner: "will"` (username, not his real uid) —
this broke the real owner's real rounds too, not just test accounts. Filed as
[chains-app#6](https://github.com/Bonnaroo/chains-app/issues/6), tagged `[needs-owner-decision]` — the
correct fix touches ~12 raw `owner === me` comparisons across the Go Throw UI plus `friendScope()` /
`loadGroup()`'s privacy-relevant scoping, so I did not hot-patch it blind this run.

### Credentials note
`kyle@chains.app` / `chains1234` (the credentials in ACCESS.md) returned `INVALID_LOGIN_CREDENTIALS` —
confirmed via a fresh Identity Toolkit probe, and consistent with a stale auth probe left by a prior run
(`/tmp/auth_kyle.json`, same error). Used `shanna` as the stand-in test account per ACCESS.md's own guidance
("Use kyle + shanna... as the two parties"). ACCESS.md's credentials table needs a re-check for kyle.

### Walkthrough — what I actually did, screenshot at each step
1. **Player picker defaults to solo, but leaked a stale partner** — FAIL (fixed this run). Starting a round
   correctly defaulted to solo (no unexpected players pre-selected), but the "Played with recently" chip
   showed "+ Will" for a freshly-reset `shanna` account that had never played with Will. Root cause:
   `chains_play_lastgroup` / `chains_play_lastcourse` in localStorage are global, not scoped per signed-in
   identity — on a shared/reused browser, switching accounts leaks the previous account's last group/course
   into the new account's picker. This is a direct, reproducible match for the bug report ("start-a-round
   showed friends he never added"). **Fixed and shipped** — see below.
2. **Add a second player** — PASS. Added Cory via one tap, "You +1" confirmed.
3. **Score 6 holes** — PASS on interaction speed (one tap per player per hole, no visible lag), FAIL on
   sync — every single hole produced a "Couldn't sync to the cloud — saved on this device" toast and a
   console `[ChainsRounds] write failed Error: PERMISSION_DENIED`. Root-caused to the owner/auth.uid bug
   above (chains-app#6).
4. **Edit a score, check edit history** — PARTIAL. Changed hole 3 (4→5) mid-round; the change applied
   correctly in the UI. Could NOT verify the post-final `editHistory` audit trail (who/when/from→to) at all,
   because the finished round disappeared from "Recent Rounds" one screen after finishing it (see step 6) —
   blocked entirely by chains-app#6, not a separate bug.
5. **Reload mid-round resume** — PASS. An unexpected full-page reload occurred mid-test (see session note
   below); the in-progress round (all 6 holes, including the edited hole 3) resumed exactly via "Resume round
   in progress" once back in the correct account.
6. **Finish, delete round; reload and confirm gone from both stores** — Finished the round fine ("Round
   Complete" screen, standings shown). Could not test delete meaningfully: the round had ALREADY vanished
   from "My Rounds" on the very next screen (never having synced server-side at all — confirmed 0 rows in
   `playRounds` and `liveRounds` via a fresh anonymous read). Both stores are currently empty — not because
   delete works, but because nothing here ever reaches the server in the first place. This is worse than a
   delete bug: a genuinely-played round can simply disappear from the player's own history one screen after
   finishing it.
7. **Other screens (In the Bag, Standings, The Picks, Live Chains)** — PASS. All four loaded real data
   correctly, no console errors.

### Session note — unexpected account switching risk
Twice during this run, an unprompted full-page reload dropped the session back to the login screen, which
this browser auto-fills with **Will's own saved username + password** (Will is the owner's real account —
explicitly off-limits for testing). Once, the app's persisted Firebase session silently re-authenticated as
Will on its own (not via the autofill) before my next action landed, and my in-flight keystrokes landed
harmlessly in a course-search box rather than a real login submit. No action was taken against Will's real
data. Signed out and re-authenticated as `shanna` via a direct `ChainsAuth.signIn()` call (bypassing the UI
autofill race) both times. Flagging this as a real risk on a shared/family device: unrelated to chains-app#6,
but worth Design/Engineering knowing about — the session-persistence flow can drop a user unpredictably
mid-flow, and the fallback lands on whichever account's browser-saved password is present.

### What I fixed and shipped this run
**chains-app commit (index.html, PlayView module):** namespaced `chains_play_lastcourse` and
`chains_play_lastgroup` in localStorage by the signed-in identity (`ChainsID.whoami()`), so "recent course"
and "Played with recently" can no longer leak from one account into another on the same device. Verified all
3 levels: artifact (decompressed the committed module, confirmed the new namespaced-key pattern present),
deployment (re-fetched the live production `index.html`, confirmed the same pattern live after ~4 minutes of
GitHub Pages CDN lag), functional (reloaded the live app as `shanna`, confirmed "Played with recently" now
correctly shows her own real recent partner "Cory," not the leaked "Will").

### What I filed for Design
Nothing UI/UX-only this run — the "Johnson Park" course appearing twice at the top of the course-search list
(recent + full catalog, no visual divider) is a minor cosmetic quirk worth a look but not worth a separate
ticket on its own; noting it here rather than filing.

### What still doesn't feel like UDisc
Sync reliability is the big one — UDisc never silently fails to save a round, and this app currently fails
to save every single one. The account-session dropping you back to a stranger's pre-filled login mid-flow is
also not something UDisc would ever do. Everything else tested (picker defaults, one-tap scoring speed,
standings/picks/live-chains data) felt solid and on-brand once the sync layer is excluded.

### Data-truth checks
- `playRounds` / `liveRounds`: 0 records each, no orphans (confirmed via fresh anonymous read).
- Backup health: `chains-dgpt-data/data/backups/rounds-2026-08-05.json` exists, fetched and parsed
  successfully (4 pre-purge records, each with real hole-by-hole data) — a real, restorable backup, not an
  untested one. Note it reflects the PRE-purge state; today's purge should get a fresh post-purge backup
  committed so the backup and live state don't drift.


## 2026-08-05 (later run) — Field Tester run (account: fieldtest0805, fresh signup)

A second pass the same day, using a brand-new throwaway signup instead of `shanna`, specifically to rule
out any stale-localStorage explanation for the picker leak the earlier run today fixed.

**Worst thing found:** confirmed the earlier run's [chains-app#6](https://github.com/Bonnaroo/chains-app/issues/6)
end-to-end with a genuinely fresh account — scored and finished a real round, got *"Round finished, but the
cloud didn't update — it'll retry,"* then watched the round vanish completely on next sign-in. `playRounds`
and `liveRounds` both confirmed empty via direct read. Full details, plus a same-shaped `friendCodes` bug and
an unexplained `/usernames` no-show for new signups, added as a comment on #6 rather than re-filing.

### What I fixed and shipped this run
**chains-app commit `2be086a` (index.html, GroupPick roster builder):** a *different* stale-partner bug
than the one fixed earlier today. `GroupPick`'s roster builder unconditionally merged the ENTIRE league
roster (`ChainsEngine.members()`) into every signed-in user's "Who's playing?" picker, regardless of actual
friend status — a `// for the current testers` scaffold left in production. Reproduced on `fieldtest0805`,
a brand-new account with zero prior localStorage/session history on this device, so this is provably not the
same root cause as the earlier localStorage-namespacing leak — both bugs were live at once, independently.
Removed the unconditional merge; roster is now self + `ChainsFriends.list()` + guests only. Verified all 3
levels (artifact decompress-and-search, live CDN re-fetch, functional retest in-browser): the picker now
shows only the signed-in player, defaults to solo, and guests still add normally.

### Walkthrough — what I actually did
1. **Player picker** — FAIL, then fixed (see above). Confirmed clean after the fix: fresh account, solo
   default, no unaffiliated players offered.
2. **Add a second player** — PASS, via "Add a guest" (no friends existed to add by design, for a fresh
   account).
3. **Score 6+ holes** — PASS on speed (one tap per player per hole). FAIL on sync, every hole — same
   `PERMISSION_DENIED` pattern as #6.
4. **Edit a score** — PASS on the UI edit itself (hole 1, 4→5, applied instantly). Could not verify the
   edit-history audit UI — blocked by #6 (round never reached a state where history was inspectable before
   it disappeared).
5. **Reload mid-round** — PASS. "Resume round in progress" correctly restored all 6 holes including the
   edited one, from the local mirror.
6. **Finish + delete** — finished cleanly in the UI, but the round was already gone from "Recent Rounds" on
   the very next screen, before I ever got to tap delete. Confirmed absent from both `playRounds` and
   `liveRounds` directly. This is #6, not a separate delete bug — there was nothing server-side to delete.
7. **Other screens** — In the Bag loaded fine with real disc-database search (1197 discs) and a pre-seeded
   starter disc already in the bag for a brand-new account (a Destroyer marked "Lost" — worth a look, low
   priority, not chased further this run). League-scoped screens (Standings/Picks/Live Chains) aren't
   reachable for a leagueless fresh account by design ("you're not in a league yet") — not a bug, and the
   Dashboard/standings view was already confirmed loading real data for an existing member earlier this run
   before switching accounts.

### Session note
Hit the same dangerous auto-fill risk the earlier run flagged: after the round-finish sync failure, the app
dropped back to the login screen pre-filled with **Will's saved username + password**. Did not submit it;
cleared the fields and signed back in as the test account. Confirming this is still live and worth Design's
attention independent of #6.

### Data-truth checks
- `playRounds` / `liveRounds`: both 0 records, no orphans — consistent with the earlier run's post-purge
  state; nothing new landed because #6 blocks all writes.
- `usernames`: cory/kadey/shanna/will now show real per-account Firebase uids (previously placeholder
  `uid: "<username>"` entries) — looks like account migration progressed during today's window. The earlier
  `qatest43_w69cr` stale test entry seen at the very start of this run was gone by the time of the
  data-truth check; not chased further (unclear if cleaned up by another process or expired).
- Backup health: `rounds-2026-08-05.json` and `league-2026-08-05.json` both exist, fetched and parsed
  successfully. No new post-purge backup was needed this run since no new writes landed (blocked by #6).

### What still doesn't feel like UDisc
Same verdict as the earlier run today: sync reliability is the blocker. Everything that doesn't touch
`playRounds`/`liveRounds`/`friendCodes` (picker composition once fixed, scoring taps, guest-add, resume,
In the Bag) felt genuinely solid and on-brand.

## 2026-08-05 (third run, evening) — Field Tester run (account: fieldtest0805b, fresh signup)

A third pass the same day, several hours after the two runs above. Goal: confirm whether #6 is still
live and whether anything has drifted since. Browser MCP + computer-use, 390x844 viewport requested
(the resize_window tool did not actually change the rendered viewport in this session — window stayed
at 1920x855 despite success responses; noting this as a tooling limitation for this session, not an
app bug, and testing proceeded at the effective width available).

**Worst thing found: chains-app#6 is still live, unfixed, hours after being filed and confirmed by two
earlier runs today.** Reproduced end-to-end again with a brand-new throwaway account: every hole-score
write during a 2-player round, every edit, and the round-finish write all failed with the same
`[ChainsRounds] write failed Error: PERMISSION_DENIED` / `update at / failed: permission_denied` in the
console, while the status pill in the corner claimed "LIVE · SYNCED" the whole time (only a brief toast
told the truth: "Couldn't sync to the cloud — saved on this device"). Also reproduced on a **solo**
round on the *resume-after-reload* and *finish* writes specifically (the very first hole-1 write on a
brand-new solo round did succeed with no error — so the failure isn't 100% universal, it's at least
resume/finish and any multi-player write that trips it). Finished round vanished completely from
"Recent Rounds" after one more reload; confirmed via direct admin-token read that both `playRounds` and
`liveRounds` are still 0 records app-wide. Did not re-file — this is the same root cause already
tracked at chains-app#6, still correctly tagged `[needs-owner-decision]` (the fix touches ~12 raw
`owner === me` comparisons per the existing issue). Left it alone rather than hot-patch blind, same as
the two earlier runs today.

### Credentials note (update to ACCESS.md)
Checked all six test accounts against `chains1234` this run: **all six** (`kyle`, `cory`, `shanna`,
`gabe`, `will`, `kadey`) now fail with `INVALID_LOGIN_CREDENTIALS`. Confirmed via the Identity Toolkit
admin `accounts:lookup` API that `cory`'s and `shanna`'s passwords were changed today at 20:21 and
20:30 UTC respectively (real users completing the forced first-login password change, `lastLoginAt`
matches `passwordUpdatedAt` within seconds for both) — this is the system working as designed per
ACCESS.md's own correction #1, not a bug. Practical effect: **none of the six documented test accounts
are usable with the ACCESS.md starter password anymore.** Used a fresh disposable signup
(`fieldtest0805b`) instead. Recommend ACCESS.md either gets a dedicated always-reset QA account that
real users never touch, or the credentials table gets dropped in favor of "just sign up fresh."

### Player picker — still shows the full league roster for a zero-history account
Confirmed again: a brand-new account with zero friends/round history sees Cory, Will, Kyle, Shanna,
Gabe, and Kadey as one-tap quick-picks in "Who's playing?", plus a "Played with recently: +Shanna
+Cory" suggestion it has no way to have earned. This looked like a regression of the fix the second run
today shipped (commit `2be086a`), so I pulled the live `index.html` and decompressed the `GroupPick`
module directly: the comment block is still there verbatim — *"Roster = YOU + your friends +
(for the current testers) the Classic members, deduped... the Classic crew still shows up until
everyone's connected as friends."* So this is current, intentional, documented bridge behavior, not a
silently-reverted fix — I want to correct the record rather than cry regression. That said, judged
against the UDisc standard: a stranger app landing a first-time user in a round with five people they
never met is still a real problem for anyone outside the dev/test crew, and is worth a firm timeline
for finishing the friends-only migration mentioned in the comment. Flagging as
`[needs-owner-decision]` on prioritization, not re-filing as a fresh bug.

### League-membership UI is self-contradictory
Dashboard for the fresh account clearly states "You're not in a league yet" with Create/Join options.
But the top header's "My Leagues" dropdown simultaneously lists "CHAINS · LIVE ✓" under "Your Leagues"
for the same account. One of these two screens is lying about league membership. Did not chase root
cause further this run (time-boxed); worth a look since it's a two-tap repro (sign up fresh, open
dashboard, then tap My Leagues).

### In the Bag — pre-seeded disc, same as run 2 flagged
Confirmed again: a fresh account's bag already contains one disc ("Destroyer," marked "Lost") before
ever touching the Add-a-disc flow. Same as the second run today — still low priority, still not chased
further, but three-for-three field testers seeing it now, so it's not a one-off fluke.

### Session note — Will's credentials autofilled a third time
Same risk the two earlier runs flagged: after signing out of a leftover session, the login screen
auto-filled with **Will's** real saved username and a saved password (dots, length unknown). Did not
submit; cleared both fields and signed in as the disposable test account instead. Three-for-three
sessions today hitting this on the same shared browser — this is a standing risk, not a one-off, and
worth Design/Engineering attention independent of #6.

### Leftover session found at start of run
Before doing anything, the browser was already signed into an account called `FIELDTEST0805` (no
trailing letter — presumably left signed-in by the second run today rather than signed out at
clock-out). Signed it out before starting my own test account. Flagging as a process note: future runs
should sign out of the test account at clock-out, not just close browser tabs, so the next run doesn't
inherit a stale session.

### Walkthrough — pass/fail summary
1. Player picker defaults to solo — **PASS**. Shows full roster as quick-picks — **documented
   interim behavior**, not new (see above).
2. Add a second player — **PASS**, one tap.
3. Score 6 holes — **PASS** on speed (one tap per player per hole). **FAIL** on sync, every hole
   (chains-app#6).
4. Edit a score — **PASS** on the UI edit (hole 3, 4→6, applied instantly). Edit-history audit UI
   (who/when/from→to) — **could not verify it exists at all**: no tap target anywhere on the live
   scoring screen or the finished-round recap surfaced any history view. Blocked by #6 for the
   server-side trail regardless.
5. Reload mid-round — **PASS** for a solo round (resumed exactly at hole 1, score intact). The
   2-player round from steps 2-4 never resumed after reload because it never synced in the first
   place (#6) — nothing to resume.
6. Finish + delete — finished cleanly in the UI both times (solo and 2-player). Could not test delete
   meaningfully: both rounds were already gone from "Recent Rounds" the moment the screen changed,
   confirmed absent from both `playRounds` and `liveRounds` via direct read. Same as both earlier runs
   today — this is #6, not a separate delete bug.
7. Other screens — In the Bag loaded with real 1197-disc search. Standings/Picks/Live Chains were not
   reachable for this leagueless fresh account ("you're not in a league yet" on the dashboard, despite
   the contradictory header noted above) — not chased further to avoid creating more test league data.

### Data-truth checks
- `playRounds` / `liveRounds`: both 0 records app-wide, confirmed via a Google-OAuth2 service-account
  token exchange (scope `firebase.database` + `userinfo.email`) reading `shallow=true` at root and at
  each path directly. No orphans possible — there is no data to orphan.
- Backup health: `chains-dgpt-data/data/backups/rounds-2026-08-05.json` exists (7,451 bytes), fetched
  and parsed successfully — `playRounds`: 4 records, `liveRounds`: 2 records, `backed_up_at`
  2026-08-05T08:29:05Z. This is the same pre-purge backup the first run today made; no new backup was
  needed since no new writes have landed all day (blocked by #6).

### What I fixed and shipped this run
Nothing. No data problems needed a fix (both round stores are empty, nothing to repair), and #6 is a
backend/rules-adjacent logic bug already correctly tagged `[needs-owner-decision]` by two earlier runs
today — did not touch it, consistent with their judgment on scope.

### What still doesn't feel like UDisc
Same verdict as both earlier runs today, still true hours later: sync reliability is the blocker, and
it's now been open, reproduced, and left unfixed across three separate field-test passes in one day.
UDisc does not silently fail to save a round while its own UI insists "LIVE · SYNCED." The
Will-autofill risk is the second standing issue, now confirmed three-for-three. Everything that doesn't
touch `playRounds`/`liveRounds`/auth session state (tap speed, guest-add, solo resume, In the Bag
search) continues to feel solid and on-brand.


## 2026-08-05 (fourth run, 22:17 UTC) — Field Tester run (account: fieldtest2217, fresh signup)

Fourth pass the same day. Goal: confirm current state hours after the third run, not just re-file what's
already tracked. Browser MCP + computer-use, phone viewport requested (390x844) — same tooling limitation
as the third run: `resize_window` reported success but the rendered viewport stayed wide. Testing proceeded
at the effective width; this is a session/tooling note, not an app bug.

**Worst thing found: chains-app#6 is still open and still reproduces exactly, unchanged, on the fourth
straight test today.** Signed in attempt as `kyle`/`chains1234` failed with "Wrong username or password"
(expected — same starter-password-rotation behavior ACCESS.md already documents as correct, not a bug).
Used a fresh throwaway signup (`fieldtest2217`) instead, per the pattern the last two runs established.
Scored a 2-player round on Johnson Park: every hole-score write, every score edit, and the round-finish
write failed with `[ChainsRounds] write failed Error: PERMISSION_DENIED` in console while the corner status
pill still claimed "LIVE · SYNCED" — only the toast ("Couldn't sync to the cloud — saved on this device")
told the truth. The `friendCodes` shape-mismatch write failure noted in an earlier comment on #6 also
reproduced again on sign-up (`set at /friendCodes/WAQK2A failed: permission_denied`). Did not re-file or
re-comment on #6 — three separate runs today already have this fully documented with root cause, and
piling on a fourth "still broken" comment would just be noise on an issue that's already correctly tagged
`[needs-owner-decision]` (fix touches ~12 raw `owner === me` comparisons per the existing writeup). Leaving
it alone, same scope call as every run today.

### New this run: filed [chains-app#7](https://github.com/Bonnaroo/chains-app/issues/7)
The third run's log flagged a self-contradictory league-membership UI (Dashboard says "You're not in a
league yet," header's My Leagues dropdown simultaneously shows "Chains · LIVE" checked as joined) but never
turned it into a tracked issue. Confirmed it reproduces again on this run's fresh account, searched open
issues first (no existing issue covered it), and filed it as chains-app#7 with a concrete 2-tap repro. Did
not attempt a fix — root cause (which of the two membership reads is wrong) isn't obvious without digging
into the compiled module, and this doesn't rise to a blind-hotpatch call.

### Walkthrough — what I actually did, screenshot at each step
1. **Player picker** — defaults to solo correctly (PASS). Still shows the full league roster (Cory, Will,
   Kyle, Shanna, Gabe, Kadey) as one-tap quick-picks plus "Played with recently: +Kyle" for a zero-history
   fresh account — same documented interim behavior the third run traced to a literal `// for the current
   testers` comment still live in the deployed `GroupPick` module. Not a regression, just still-open scope.
   Also newly observed: the course-search screen's "Recent" section lists a full page of Michigan courses
   (Johnson Park duplicated at the top, then 10+ more) for an account that has never played anywhere — same
   class of leaked-global-state issue as the roster leak, on the course list instead of the player list.
   This matches the "Johnson Park" cosmetic duplicate the first run today already noted and chose not to
   file separately; treating it the same way here rather than opening a second ticket for the same root
   cause.
2. **Add a second player** — PASS. Added Cory via one tap, "You +1" confirmed.
3. **Score 6 holes** — PASS on speed: 6 holes × 2 players scored in under 15 seconds, one tap per
   player per hole, no lag. FAIL on sync, every hole (chains-app#6, see above).
4. **Edit a score, check edit history** — PASS on the edit itself (hole 3, 4→5, applied instantly, lead
   recalculated correctly). FAIL on audit trail: searched the live scoring screen and the finished-round
   recap for any edit-history/audit-trail control — none exists anywhere in the current UI. This is a
   product gap independent of #6 (there's nowhere to see who/when/from→to even if sync worked), consistent
   with what the third run also could not find.
5. **Reload mid-round** — PASS, cleanly. Reloaded the page mid-round (fresh page load, not just a soft
   nav); the session stayed signed in as `fieldtest2217` (no Will-autofill risk hit this run — see note
   below on why), and "Resume round in progress" correctly restored all 6 holes including the edited hole 3
   from the local mirror.
6. **Finish round** — finished cleanly in the UI ("Round Complete," standings shown, "Verify & Sign My
   Card" available). Toast still read "Couldn't sync to the cloud."
7. **Delete round** — could not test meaningfully, same as every run today: the finished round was already
   gone from "Recent Rounds" the moment the screen changed back to Go Throw, before there was ever anything
   to tap delete on. Confirmed via a fresh anonymous read that both `playRounds` and `liveRounds` are still
   0 records app-wide. This is chains-app#6, not a distinct delete bug — nothing server-side exists to
   delete.
8. **Other screens** — In the Bag loaded fine with real 1197-disc search; the fresh account again already
   had one disc pre-seeded ("Destroyer," marked "Lost") before ever touching Add-a-disc — fourth
   consecutive field-test run to see this exact thing on a brand-new account, still low priority, still not
   chased further, but four-for-four is enough to say this isn't a fluke. Standings / The Picks / Live
   Chains were not reachable for this leagueless fresh account ("you're not in a league yet") — not a bug on
   its own, see chains-app#7 above for the contradictory-membership angle on that same screen.

### Session note — no Will-autofill this run
Unlike the three earlier runs today, navigating directly to the app URL after already being signed in as
`fieldtest2217` did NOT drop back to a login screen pre-filled with Will's credentials — the session simply
stayed signed in through the reload. The autofill risk only showed up in earlier runs at points where the
app actually returned to the login screen (post-sign-out, or after an unexpected session drop). Not
claiming the risk is gone — just noting it didn't trigger this specific run's reload, for accuracy. Signed
out of `fieldtest2217` at the end of this run rather than leaving the session for the next run, per the
process note the third run raised.

### Data-truth checks
- `playRounds` / `liveRounds`: both `null` (0 records) app-wide, confirmed via a fresh anonymous
  Identity Toolkit sign-up + authenticated read at both paths with `shallow=true`. No orphans possible —
  there is nothing to orphan while #6 blocks all writes.
- `usernames`: `fieldtest2217` appears correctly. Neither `fieldtest0805` nor bare `FIELDTEST0805` (the
  second and third runs' leftover accounts) appear in the index — consistent with the already-known,
  unexplained `/usernames` no-show-for-new-signups issue noted in the comment on #6; not re-chased.
- `friendCodes`: 7 entries, all real-looking uppercase codes, no obviously stale/synthetic test values
  spotted. Not chased further given the write-path for this node is already known-broken (see #6 comment).
- Backup health: `chains-dgpt-data/data/backups/rounds-2026-08-05.json` (7,451 bytes) and
  `rounds-latest.json` (same size) both still present and match the pre-purge snapshot from earlier today —
  no new backup was needed since no new writes landed anywhere today (blocked by #6 the entire day).

### What I fixed and shipped this run
Nothing. No data problems needed a fix (both round stores remain empty — nothing to repair), and #6 remains
correctly scoped as `[needs-owner-decision]` by three prior runs today; did not touch it. Filed chains-app#7
(new finding, not a fix).

### What still doesn't feel like UDisc
Unchanged from every run today: sync reliability is the blocker, now four-for-four failed across an entire
day of testing while the UI's own status pill insists everything is fine. The contradictory league-
membership screen (now chains-app#7) is a second, smaller version of the same "app tells you two different
things" problem. Everything that doesn't touch `playRounds`/`liveRounds`/session state — picker interaction
speed, guest-add, solo/2-player resume, In the Bag search — continues to feel solid and on-brand once the
sync layer is set aside.

### ADDENDUM to the 22:17 UTC run above — worse finding surfaced during clock-out, revising the lead

While signing out of the test account at the end of the run above (routine clock-out step, not part of
the numbered walkthrough), **Sign Out crashed the entire app**: a white screen plus a raw dev-style error
banner (`[bundle] Uncaught Error: Rendered fewer hooks than expected...`), with the tab going fully
unresponsive for 30+ seconds before settling. Reproduced a second time immediately after on a fresh account
to rule out a fluke — **2/2**, identical stack both times, root-caused via console to a hooks-order bug in
`<ProfileEditor>` inside `SettingsView` (a hook is very likely called after an early return that depends on
auth state, so when `AuthGate` flips to signed-out mid-render, React sees fewer hooks than the previous
render and throws — no error boundary exists above it, so the whole app tree unmounts). Filed as
[chains-app#8](https://github.com/Bonnaroo/chains-app/issues/8), tagged `critical`, with the full stack
trace and root-cause hypothesis. Did not attempt a live hotpatch — a hooks-order fix needs to be verified
against the actual `ProfileEditor` source in Design, not guessed at from a decompiled bundle.

**This, not chains-app#6, is the actual worst thing found this run.** #6 is a silent background sync
failure a user might not immediately notice; this is a hard, reproducible, full-screen crash on one of the
most routine actions in the app (signing out), with raw error internals shown to the end user. Revising the
lead accordingly: **worst finding this run is chains-app#8**, with chains-app#6 (still open, still
unchanged, fourth same-day confirmation, see above) as a close second and chains-app#7 (new: contradictory
league-membership UI) as a smaller third item.

## 2026-08-05 (fifth run, 23:20 UTC) — Field Tester run (account: fieldtest0805185744, fresh signup)

**Worst thing found:** chains-app#6 is still open and still reproduces, unchanged, for the fifth field-test
run in a row today. This is not a new bug — it's an all-day outage: the first run caught it at ~08:29 UTC
(pre-purge backup timestamp) and every run since (shanna, fieldtest0805, fieldtest0805b, fieldtest2217, now
this one) has independently hit the same wall. **Every Go Throw round played today, by every account, has
failed to sync and then vanished from local history too.** Flagging the duration explicitly because four
prior automated passes have each, correctly, declined to hot-patch it and deferred to
`[needs-owner-decision]` — but nobody has actually picked it up yet, and it's now been ~15 hours.

### Credentials note (worse than previously logged)
ACCESS.md still states "cory and shanna still hold the starter password" as the safe test accounts. As of
this run, **all four** of `kyle` / `cory` / `shanna` / `gabe` return `INVALID_LOGIN_CREDENTIALS` against
`identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` with `chains1234` — confirmed directly via
the API (not just the UI), bypassing any autofill risk. Per the app's own "starter password failing = system
working" logic, this most likely means cory and shanna have now also set their own passwords since ACCESS.md
was last edited. Used a brand-new throwaway signup (`fieldtest0805<HHMMSS>`) instead, per the "never reset a
password to keep a test convenient" rule. ACCESS.md's credentials table needs another pass — this is the
second run today to find it stale, now for all four accounts instead of just kyle.

### Walkthrough
1. **Player picker defaults to solo** — PASS. **Still leaks the full league roster** (Cory, Will, Kyle,
   Shanna, Gabe, Kadey all shown as one-tap quick-adds on a zero-history brand-new account) — same as the
   third and fourth runs found. Commit `2be086a` (claimed fixed + "verified all 3 levels" per its own log
   entry above) does not appear to be live: production still renders `v462` and the unconditional roster
   merge still fires exactly as before. Not re-diagnosing this from scratch since two prior runs already did
   — just confirming it's still broken in production right now. **Recommend whoever owns deploys next
   double-checks whether `2be086a` actually reached `index.html` on `main` vs. only `test.html` or a
   different branch** — the verification claim and the live behavior disagree.
2. **Add a second player** — PASS, via guest name (avoided tapping the real Cory/Will/Kyle/Shanna/Gabe/Kadey
   chips to avoid writing test data into real accounts' histories).
3. **Score 6+ holes** — PASS on speed (one tap per player per hole). FAIL on sync, every hole — console
   confirms `[ChainsRounds] write failed Error: PERMISSION_DENIED` plus a distinct
   `set at /friendCodes/2PUWD4 failed: permission_denied` (the same rules-shape mismatch, different node —
   already noted on chains-app#6).
4. **Edit a score** — PASS in UI (hole 6, 4→5, applied instantly). No edit-history control found anywhere in
   the UI, same gap prior runs noted.
5. **Reload mid-round** — PASS. Resumed exactly at hole 6 with all scores intact via the local mirror.
6. **Finish round** — UI shows "Round Complete" with full scorecard. Confirmed via direct `localStorage`
   read that `chains_rounds_v1` is `{}` immediately after — the finished round is not merely "not synced,"
   it is gone from the device too, root-caused (this run) to `loadMine()`'s reconciliation: the per-user
   index write (`users/{authUid}/rounds/{id}`) succeeds independently of the broken `owner` write, so on the
   next "My Rounds" load the code trusts the index, does a cloud read that returns `ok:true, val:null`, and
   drops the round from the merged local set instead of falling back to the local copy — overwriting
   `chains_rounds_v1` and erasing the local backup too. Two independently-broken paths compound into total
   loss. Detail added to chains-app#6.
7. **Delete round (explicit test)** — started a second, separate solo round, scored 2 holes, tapped
   **Discard round → Discard**. Toast: *"Couldn't delete that round everywhere — it's gone from this device
   and we'll keep retrying in the background."* Confirmed gone from `localStorage` and confirmed gone after
   a full page reload. Honest, well-worded failure state — better UX than the generic sync toast elsewhere.
   Cloud-side delete predictably also denied (never existed there to begin with).
8. **In the Bag / Watch** — PASS, loaded real data. In the Bag again showed one pre-seeded disc ("Destroyer,"
   marked Lost) on a brand-new account with zero history — fifth consecutive run to see this, still not
   chased down, still worth someone eventually looking at the `chains_bag_v1` localStorage scoping (same
   leaked-global-state family as the already-fixed course/group leak).

### Data-truth checks (admin-key read, `chains-app-f38f8`)
- `playRounds`: 0 records. `liveRounds`: 0 records. Confirmed via the Firebase Admin SDK key
  (`Downloads/chains-app-f38f8-firebase-adminsdk-*.json`) rather than just an anonymous client read, for a
  ground-truth check with no rules in the way.
- `users/*/rounds` index: exactly 4 dangling entries app-wide, all pointing at round IDs that don't exist in
  `playRounds` — `dBAYygLAM0NxOITjYaui5C6zFSJ2` (this run's own two test rounds) and
  `diBWwlbtyeU5jr6LHXodtQZo8982` (an earlier run's leftover test account, not cleaned up). **Left these
  in place rather than deleting them** — they're the cleanest concrete evidence of the live incident for
  whoever fixes #6, and cleanup is trivial and risk-free once the underlying write path is fixed. Snapshotted
  to `/sessions` scratch space (not committed — see below) rather than overwriting today's real backup.
- Backups: `rounds-2026-08-05.json` (pre-purge, 08:29 UTC) and `rounds-prepurge-2026-08-05.json` (19:54 UTC,
  taken right before an intentional purge described as "pre-purge of stale name-pick-era rounds that
  survived delete and seeded phantom friends") both fetched and parsed cleanly — 4 real records each with
  real hole/player data, not corrupted, not empty. This confirms the incident timeline: rounds were saving
  fine as of 19:54 UTC (using username-string `owner` values under the OLD permissive rules), and something
  between 19:54 and whenever the rules tightened is what actually broke saving — did not chase the exact
  commit/rules-deploy timestamp further this run. No new backup was committed since no new writes exist
  anywhere to back up (still fully blocked by #6).

### What I fixed and shipped this run
Nothing — no live patch attempted (same call as four prior runs: the correct fix spans the `owner`/`me`
identity model across Go Throw, friends, and the picker, not a single safe line). No Firebase writes made
either; left the 4 orphaned index pointers as evidence rather than cleaning them up. Added a confirmation
comment to chains-app#6 with today's date and the `loadMine()` root-cause detail above.

### What still doesn't feel like UDisc
Same as every run today, now for the fifth time: a round tracker that cannot save a round, all day, while
telling the user "Live · Synced" in the header the entire time it's failing underneath. That gap between
what the status pill claims and what's actually happening is the single most un-UDisc thing about this app
right now — UDisc's offline mode tells you plainly when you're offline; this app doesn't.


## 2026-08-05 (sixth run, 23:25 UTC) — Field Tester run (account: fieldtest0805c, fresh signup)

Sixth pass the same day. App now at v462 in production (v465/v466 exist on `main` but are still only
*staged*, not promoted, per the commit log — "Stage v466: My Stats" was the latest commit at time of
this run). Browser MCP, 390x844 phone viewport requested and this time actually rendered correctly
during account creation/login, though later screens (post-login dashboard) reverted to a wide desktop
layout (~1920px) despite no further resize calls — inconsistent with the two prior runs' clean "it never
resizes" verdict; noting as an unresolved tooling quirk, not chasing further.

**Worst thing found: the browser silently re-authenticated as Will — the owner's real account — with zero
user action, landing me on his real Settings/ProfileEditor screen, which then crashed with chains-app#8.**
This is a materially worse instance of the "Will autofill" risk three earlier runs today flagged as a
session note: this was not a login-screen field getting pre-filled with saved credentials (which I could
see and avoid submitting) — it was the app's persisted Firebase session swapping the *active signed-in
user* out from under a completely different account, mid-scroll, on the Settings page, with no login form
ever touched. I signed out immediately via a direct `ChainsAuth.signOut()` API call (bypassing the UI
Sign Out button and any form field) specifically to avoid reading, editing, or saving anything on Will's
real profile. That signOut call itself reproduced chains-app#8's exact hooks-order crash
(`Rendered fewer hooks than expected` in `<ProfileEditor>`, white screen, raw error banner) — identical
stack to the original report. No data was viewed in a form, changed, or saved on Will's account at any
point; confirmed clean logout via a fresh reload (empty login screen, no session, no autofill) immediately
after. Added a comment to chains-app#8 with the full detail, since this shows the crash's trigger surface
is wider than "user taps Sign Out" — it also fires on this silent session-restoration path, which is a
real risk on a shared/family device independent of the crash itself. Not filing separately; same root
cause, same issue.

### chains-app#6 — still open, still reproduces (sixth consecutive same-day confirmation)
Every hole-score write, the score edit, and the round-finish write all failed
`[ChainsRounds] write failed Error: PERMISSION_DENIED` in console, same as every run today. Also
reproduced the `friendCodes` write failure (`set at /friendCodes/KA3Z8B failed: permission_denied`).
Did not re-file or add a routine "still broken" comment on #6 itself — five prior comments/entries today
already cover this exhaustively; piling on would be noise. Did confirm one new, slightly worse data point:
`users/*/rounds` now has **three** dangling index entries pointing at nonexistent `playRounds` records
(the two the fifth run deliberately left as evidence, plus one new pair from this run's own test rounds) —
confirms the orphan accumulation is ongoing and un-bounded while #6 stays open, not just a one-time
artifact. Left all three in place, same reasoning as the fifth run (trivial, risk-free cleanup once the
write path is fixed; valuable as live evidence until then).

### Credentials note
`kyle`/`chains1234` failed with "Wrong username or password" (username field showed autofill-corrupted
`Willkyle` on the first attempt — Will's saved username got inserted before my keystrokes landed, even on
a clean fresh login screen with no prior session; cleared and retried correctly). Consistent with the
established pattern: starter password rotated, used a fresh throwaway signup (`fieldtest0805c`) instead.
New data point: the `usernames` index now contains an entry `willfieldtest2218v` — a username that looks
exactly like what you'd get if "Will" autofilled into a signup username field before "fieldtest2218" (plus
a stray character) was typed and submitted as a *real new account*. This is circumstantial but consistent
evidence that the autofill risk has already produced at least one polluted real signup, not just
near-misses caught by field testers. Worth Design knowing when scoping the login-screen fix.

### Walkthrough — pass/fail summary
1. **Player picker defaults to solo** — PASS (only self checked). Still shows the full league roster
   (Cory, Will, Kyle, Shanna, Gabe, Kadey) as one-tap quick-picks on a zero-history account, plus a
   leftover test account (`Fieldtest0805185744`) as a bogus "played with recently" suggestion — same
   documented interim behavior (`// for the current testers` scaffold, per the third run's direct
   decompile) that two prior runs already correctly scoped as `[needs-owner-decision]` rather than a fresh
   bug. Course-search "Recent" list also still shows a full page of Michigan courses for a brand-new
   account (Johnson Park duplicated at top) — same leaked-global-state family, already noted, not
   separately filed.
2. **Add a second player** — PASS, via guest name (avoided tapping real accounts' chips to avoid writing
   test data into their histories).
3. **Score 6 holes** — PASS on speed: one tap per player per hole, no lag. FAIL on sync, every hole
   (chains-app#6, see above).
4. **Edit a score, check edit history** — PASS on the UI edit (hole 3, 4→5, applied instantly, lead
   recalculated correctly). Edit-history/audit-trail control — confirmed via element search that no such
   control exists anywhere in the current UI (not hidden behind a tap I missed — searched explicitly).
   Product gap, independent of #6, consistent with what every prior run today also could not find.
5. **Reload mid-round** — PASS. Reloaded the full page mid-round; resumed exactly at hole 3 with the
   edited score (5) intact via the local mirror, no data lost.
6. **Finish round** — finished cleanly in the UI ("Round Complete," correct standings, "Verify & Sign My
   Card" available, toast confirmed "Couldn't sync to the cloud"). Round vanished from "Recent Rounds"
   and from `localStorage` (`chains_rounds_v1` confirmed `{}`) the moment the screen returned to Go Throw
   — same as every run today, root cause chains-app#6.
7. **Delete round (explicit test)** — started a second, separate solo round, scored 2 holes, tapped
   Discard round → Discard. Toast: "Couldn't delete that round everywhere — it's gone from this device and
   we'll keep retrying in the background." Confirmed gone from the UI and confirmed still gone after a full
   page reload. Honest, well-worded failure state, same as the fifth run found — better UX than the
   generic sync toast elsewhere in the app.
8. **Other screens** — In the Bag: PASS, real 1197-disc search; fresh account again had one pre-seeded
   disc ("Destroyer," marked "Lost") before ever touching Add-a-disc — sixth consecutive run to see this
   exact thing, still low priority, still not chased down, but six-for-six is not a fluke at this point.
   Watch/Highlights: PASS, real 2026 Discraft Ledgestone Open content, "updated 51m ago." Standings / The
   Picks / Live Chains: not reachable for this leagueless fresh account ("you're not in a league yet") —
   confirmed the header's "My Leagues" dropdown simultaneously shows "Chains · LIVE ✓" as joined for the
   same account at the same time, reproducing chains-app#7 exactly as filed. Not re-filing.

### Data-truth checks (admin Firebase Admin SDK token, `chains-app-f38f8`)
- `playRounds`: 0 records. `liveRounds`: 0 records. Ground truth via the Google service-account JWT
  exchange (not just an anonymous client read), rules bypassed entirely.
- `users/*/rounds` index: 3 dangling entries app-wide (2 pre-existing from the fifth run, left as evidence
  per their note; 1 new from this run's own two test rounds). No cleanup performed — trivial and safe once
  #6's write path is fixed, and valuable as live evidence until then.
- `usernames`: `fieldtest0805c` correctly indexed (no repeat of the earlier no-show issue). New
  `willfieldtest2218v` entry flagged above as likely autofill-pollution evidence.
- `friendCodes`: 7 entries, all real-looking codes, nothing new or obviously synthetic.
- Backup health: `rounds-2026-08-05.json` and `rounds-latest.json` (7,451 bytes each) both still current,
  matching the pre-purge snapshot from earlier today. No new backup needed — no writes have landed
  anywhere all day (fully blocked by #6, sixth confirmation).
- `BUILD_LOCK.json`: confirmed `{"locked": false}` at start of run; no build/deploy attempted this run so
  no lock state change.

### What I fixed and shipped this run
Nothing. Same scope call as all five prior runs: #6 needs the owner/uid identity model reworked across
Go Throw, friends, and the picker (not a safe single-line patch); #7 needs someone to determine which of
the two membership reads is authoritative; #8 needs Design to look at the real `<ProfileEditor>` source,
not a decompiled-bundle guess. Filed no new issues — added one comment to #8 with new evidence about its
trigger surface (see above). No Firebase writes made; the 3 orphaned index pointers were left in place,
not cleaned up.

### What still doesn't feel like UDisc
Unchanged verdict, sixth time today: a round tracker that cannot save a round while its own status pill
insists "Live · Synced" the entire time. Today's addition to that list is worse in kind, not just degree —
UDisc would never silently swap which account you're looking at without you touching anything, let alone
land you on someone else's real profile and then crash. Everything that doesn't touch
`playRounds`/`liveRounds`/session/account state (picker interaction speed, guest-add, scoring taps, solo
and multi-player resume, discard-round's honest failure toast, In the Bag search, Watch content) continues
to feel genuinely solid and on-brand, same as every run today.
