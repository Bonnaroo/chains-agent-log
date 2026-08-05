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
