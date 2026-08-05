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
