# Chains — Standing Audit Log

Auditor's memory across runs. One entry per pass. Do not re-audit a section already logged here as
clean unless new evidence surfaces — check this file before starting.

---

## 2026-08-05 — Auditor run #1 (first-ever pass; this file created this run)

**Section audited:** 1. Auth & identity (`ChainsAuth`, `AuthGate`, `whoami()` vs `auth.uid`, session
persistence, sign-out) — first item in TRIAGE_AND_AUDIT.md's ordered list. `LOOP_LOG.md` showed the
build loop mid-work on Round lifecycle (#7 resume flow, Design track) — not Auth — so this section was
safe to audit without racing an active rebuild. `BUILD_LOCK.json` was `{"locked": false}`.

**What I checked, specifically:**
- Pulled live `chains-app/index.html` fresh via `download_url` (sha `e0918ffe0cb133ce9aad91214387b0ac17532af8`,
  2,368,887 bytes — same sha the prior LOOP_LOG run verified, confirming no in-flight auth rebuild).
  Decompressed all 92 embedded blobs (71 gzip+base64, 21 non-gzip assets — matches prior runs' counts).
- Read the full `ChainsAuth` module source (signUp/signIn/signOut/signInAnonymouslyAs/linkPassword/
  onChange/current/sessionId/bridge/changePassword/changeUsername) and the `AuthGate`/`LoginView`/
  `OnboardingView` components end to end.
- **Negative security testing against the real `chains-app-f38f8` backend**, signed in as the real
  seeded account **cory** (starter password `chains1234`) via Firebase Auth REST
  (`accounts:signInWithPassword`), fresh ID token confirmed valid (JWT `iat` within 2s of request
  time — first attempt's token was stale/cached by the sandbox network path and correctly rejected
  as `INVALID_ID_TOKEN` by Google, which is itself a sandbox networking quirk worth knowing about,
  not a Chains bug: retry with a fresh call fixed it).

**Findings — code read (STABILITY/UPSCALING lens):**
- `AuthGate` is well-hardened against the historical anonymous-session bypass: `signOut()` explicitly
  resets `ChainsID` *before* calling `auth.signOut()` (commented: avoids the gate seeing a stale local
  identity mid-transition and silently re-admitting the user). Anonymous sessions are now rejected at
  the gate unless the URL carries `watch=` (shared spectator links) — matches the code comments
  describing this as a fix for ~119 stale anon sessions from the old name-pick era. Read as correct;
  no negative test run against this specific path this session (would need an anon-session client,
  not just REST) — flagging as a good candidate for next Auth pass if one is ever repeated.
- **Known, accepted design tradeoff, not a new bug:** if Firebase is unreachable, `AuthGate` fails
  OPEN (`phase: "unavailable"` renders `ChainsApp` directly, no auth at all) — intentional per the
  file's own header comment ("fail OPEN to the app so it's never bricked"). Worth the owner knowing
  this exists as a standing tradeoff (availability over auth when the backend itself is down), but
  it is documented in the code, not silent, so not filing as a new finding.
- `changePassword()` explicitly blocks re-using the starter password (`chains1234`) as the new
  password — good, prevents a forced-change flow that doesn't actually change anything meaningful.
- `changeUsername()` is a real multi-step transaction with rollback (`usernames/{new}` write ->
  `updateEmail` -> profile update -> old key removal, unwinding on any failure) — no silent partial
  state observed by reading the code.

**Findings — negative security tests (SECURITY lens), all with pasted evidence, all cleaned up
same-session:**
- Re-confirmed **Issue #46** (`chains-agent-log#46`, already open, CRITICAL) is still unresolved:
  cory (signed in, not the round's owner) can `PUT` into another user's `playRounds/{roundId}` tree
  and into `admin/passwordResets` (both read AND write) — exactly the gap #46 already documents.
  Used throwaway probe sub-keys, deleted immediately, verified null after. Did not touch `/league` or
  `/live`.
- Contrast-verified `users/{uid}/profile` IS correctly scoped: `PUT` to another user's profile ->
  HTTP 401 Permission denied. Confirms the rules engine works correctly elsewhere; the gap is specific
  missing child rules, not a broken rules engine.
- **New evidence added to #46** (not previously documented there): `/ledger` — the coin-economy audit
  trail — has the exact same gap. Any signed-in user can `GET` the full ledger (every user's coin
  transactions, pool entries, amounts) and `PUT`/forge new entries. Posted as a comment on #46 with
  full evidence rather than opening a duplicate issue, and recommended folding `ledger/**` into #46's
  existing closing-condition checklist. Comment:
  https://github.com/Bonnaroo/chains-agent-log/issues/46#issuecomment-5188381154

**What I fixed:** Nothing — the rules issue is explicitly owner/DECISION_POLICY territory per
TRIAGE_AND_AUDIT.md Section 5 (rules changes need a saved-ruleset backup first and carry real risk of
breaking live picking), and #46 already has clear closing conditions. Fixing it was out of scope for
an auditor run per the rules ("never fix a security issue by loosening a check" doesn't apply here,
but a rules *tightening* is still a live-risk change that belongs to the owner's queue, not a solo
auditor edit).

**What I filed:** No new issue — added corroborating evidence + the `/ledger` gap as a comment on the
existing #46 (closing condition already defined there: must close before outside/non-team testers get
accounts). Did not touch #45/#47/#48/#49 (other open security issues) — out of scope for the Auth
section pass; worth a Firebase-rules-specific pass (TRIAGE_AND_AUDIT.md section 2) reading all of
#45–#49 together next, since several look related/overlapping and might consolidate.

**Clean result, for the record:** The `ChainsAuth`/`AuthGate` *client logic itself* (as opposed to the
Firebase rules behind it) checked out clean this pass — no silent catches found in the sign-in/sign-out
critical path, no anon-bypass reproducible at the gate level, starter-password reuse blocked, username
change is transactional with rollback. Verified by full source read of the auth module + AuthGate/
LoginView/OnboardingView components against the live sha above.

**Next:** Section 2 (Firebase rules, whole ruleset) is the natural next pass — read #45/#46/#47/#48/#49
together first (they may overlap/consolidate), pull and save the current `chains-app-f38f8` ruleset to
`company/backups/` per Section 5 before touching anything, and run the same
signed-in-account negative-test method against every top-level node, not just the ones this run
happened to probe. Section 1 (Auth & identity) can be considered done for this pass; a future repeat
should specifically negative-test the anonymous-session/`watch=` path with a live browser session
rather than REST alone.


## 2026-08-05 — Auditor run #2

**Section audited:** 2. Firebase rules, whole ruleset — next item in TRIAGE_AND_AUDIT.md after Section 1
(Auth, closed in run #1). `LOOP_LOG.md` at time of this run showed the build loop mid-work on Round
lifecycle (#7 resume-flow build in progress on the Design side) — that is Section 3 territory, not
Section 2, so this pass was safe. `BUILD_LOCK.json` was `{"locked": false}`.

**What I checked, specifically:**
- Pulled live `chains-app/index.html` fresh via raw.githubusercontent.com (2,368,543 bytes fetched this
  run), decompressed all 92 embedded gzip+base64 blobs with `zlib.decompress(base64.b64decode(b),
  16+zlib.MAX_WBITS)` to pull the live Firebase config (`chains-app-f38f8-default-rtdb`, apiKey) rather
  than trusting a stale value.
- Attempted to fetch the actual ruleset (`/.settings/rules.json`) via REST with a real user ID token —
  denied (`Permission denied`; rules-file reads require Firebase Console OAuth/admin creds, not a normal
  user token). **Could not save the ruleset to a file this run** — flagging as a real gap: nobody who has
  actually read the deployed ruleset text has recorded it in `company/`. All rules knowledge in this repo
  is inferred from probe behavior, not read from source. Recommend the owner (who has Console access)
  paste the ruleset into `company/backups/rules-<date>.json` once, so future runs have ground truth
  instead of re-deriving it by trial and error every time.
- **Negative security testing** signed in as two real seeded accounts, **cory** and **shanna**
  (starter password `chains1234`), via Firebase Auth REST (`accounts:signInWithPassword`), fresh tokens
  each confirmed via `localId` match. All probe writes cleaned up (DELETE or restore-to-original) and
  verified removed/restored via read-back in the same session, before this log entry was written.

**Findings — re-confirmed still-open (Issue #46, evidence pasted, cleaned up after):**
- `admin/passwordResets/__negtest__` — cory PUT succeeded (200), confirmed written, then deleted +
  confirmed null. Any signed-in user can still queue a fake password reset for another account.
- `ledger/__negtest__` — cory PUT of a forged `{amount:999999,type:"forge"}` entry succeeded, confirmed
  written, then deleted + confirmed null. Ledger forgery gap still open.
- `usernames/gabe` and `usernames/kyle` — **two independent account/node tests**: cory overwrote gabe's
  entire `usernames/gabe` node (uid field replaced), confirmed via read-back, then restored the exact
  original values and confirmed restored. Separately, shanna overwrote kyle's node the same way,
  confirmed, restored, confirmed. Real identity-hijack primitive, still open.

**New finding this run — `liveRounds` has the same non-owner write gap as `playRounds`:** cory (not a
participant on any live round) successfully `PUT {"probe":true}` to `liveRounds/__negtest__`, then
deleted it, confirmed null. Added to Issue #46's checklist via a comment
(https://github.com/Bonnaroo/chains-agent-log/issues/46#issuecomment-5189451010) rather than filing a
duplicate issue — #46 already has the right closing condition ("before outside testers get accounts").

**Findings — correctly scoped, tested NEGATIVELY this run (rules engine works fine here, no action
needed — worth recording so nobody re-tests these from scratch):**
- `leagueCodes` — cory read OK (expected, needed to join a league by code), but PUT of a brand-new code
  -> `{"error":"Permission denied"}`. Commissioner-only write holds.
- `friendCodes/{other_uid}` — cory PUT into shanna's own node -> denied.
- `friendRequests` (broad read of whole node) — denied. Correctly not publicly listable.
- `leagues` (broad read of whole node) — denied.
- `usernames` READ (as opposed to write) is intentionally broad (needed for username->uid lookup at
  login) — the asymmetry is real (broad read + unscoped write) but the read side itself is not a bug.

**What I fixed:** Nothing — every open gap here is a Firebase security-rules change, explicitly Tier-3
per TRIAGE_AND_AUDIT.md Section 5 (rules changes need a saved ruleset backup first, and this session
could not even fetch the ruleset to back it up — see gap above). All belongs to the owner's decision
queue, same as the prior run correctly deferred it.

**What I filed:** No new GitHub Issue — posted a consolidated evidence comment on the existing
Issue #46 (chains-agent-log) adding the `liveRounds` node to its scope and re-confirming the rest with
fresh, independent evidence. Closing condition unchanged: must close before outside/non-team testers get
accounts.

**Clean result, for the record:** `leagueCodes`, `friendCodes`, `friendRequests`, and `leagues` all
passed negative testing this run — no cross-user access possible on any of them. That part of the rules
tree is solid.

**Real limitation to flag plainly:** I could not fetch and save the actual deployed ruleset text — only
user-token REST access was available, and Firebase rules reads require Console-level admin credentials.
Everything in this and prior audit passes about the ruleset is inferred from probe behavior (what got
denied/allowed), not from reading rule source directly. This should be corrected once, by whoever has
Firebase Console access, rather than re-derived indefinitely.

**Next:** Section 3 (Round lifecycle) is currently mid-rebuild per LOOP_LOG (#7 resume flow) — skip it
until that stabilizes. Section 4 (Picks & scoring engine) or Section 5 (League & membership, including
the hardcoded six-member roster blocking new-member drafts) are the next safe candidates. Also worth a
follow-up: get the owner to paste the real ruleset text into `company/backups/` once, so future Section 2
passes can diff against ground truth instead of re-probing blind every time.
