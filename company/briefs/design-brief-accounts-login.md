# Chains — Design Brief: Real accounts, login, and league isolation

Paste this into the Claude Design project. Read the Go Throw brief first if you haven't —
**production is v440**, pull `https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html`
before editing, and never ship a build whose version is not higher than what is live.

---

## 0. The backend is DONE. This brief is the UI half.

Do not rebuild any of this — it exists and is verified working as of 2026-08-02:

- **Firebase Email/Password provider is enabled** on `chains-app-f38f8`.
- **`window.ChainsAuth` already exists** and does exactly what we need. Public API:
  `signUp, signIn, signOut, signInAnonymouslyAs, linkPassword, onChange, current, sessionId,
  emailFor, available, friendlyError, saveOnboarding, saveProfile, markOnboarded, isOnboarded,
  fetchOnboarded, localProfile, coins, adjustCoins`.
- Usernames map to a **synthetic email**: `username@chains.app`. Members never type an email
  address. `ChainsAuth.sessionId()` resolves the signed-in account back to the app's member id
  (`will`, `kyle`, …), which every existing screen already keys on.
- **All six league accounts are provisioned and tested.** Every one of these sign-ins was verified
  working on 2026-08-02:

  | Username | Password | Member | Firebase uid |
  |---|---|---|---|
  | `will` | `chains1234` | Will *(owner)* | `wp1ywNFroiZzCOUqvezfuJYYAYd2` |
  | `cory` | `chains1234` | Cory | `fJPXm2FJiSayOtfhpK7RJDaqNUJ3` |
  | `kyle` | `chains1234` | Kyle | `LoVsKQWMXoQa6daNo3eINmSRCcs1` |
  | `shanna` | `chains1234` | Shanna | `Gmewm5Ll1XeCgcVkrIOc44Z8k1j1` |
  | `gabe` | `chains1234` | Gabe | `2ZGiHBt5gofD1z8B5sKLyyl5vq43` |
  | `kadey` | `chains1234` | Kadey | `PiZrpHVIoGP9rbE5FhrCAyg57xB2` |

  The owner has a real account on exactly the same footing as everyone else — same starter
  password, same forced change on first login. He is **not** a special case in the login flow.
  His account carries `admins/{uid} = true` and `profile.isOwner = true`, which is what unlocks
  the Console; that is the *only* difference.

- **`usernames/{username}`** → `{ name, disc, uid, memberId }` — readable by any signed-in user
  (needed to resolve a username at login).
- **`users/{uid}/profile`** → `{ username, memberId, name, disc, leagues, mustChangePassword }` —
  readable/writable **only by that user**. Verified: Kyle can read his own profile and is denied
  reading Will's.
- **All six**, owner included, have **`mustChangePassword: true`**. That flag is the trigger for
  section 2. Nobody skips it.

**Owner's message to the group will be:** *"Your username is your first name, your password is
`chains1234`."* Build for that.

---

## 1. Login gate

Replace the current "Who's playing? Tap your name" identity picker with a real sign-in screen.

- Two fields: **Username** and **Password**. No email field. Lowercase/trim the username before
  calling `ChainsAuth.signIn` — `will`, `Will`, and ` WILL ` must all work.
- Friendly errors via `ChainsAuth.friendlyError` — "That username or password isn't right" rather
  than a raw Firebase code. Never reveal whether the username exists.
- **Stay signed in.** Persistence is already set to LOCAL. Nobody should have to log in twice on
  the same device.
- A visible **Sign out** in Settings.
- Keep the existing anonymous/name-pick path **only** as a fallback if `ChainsAuth.available()` is
  false (Firebase blocked/offline). Do not offer it as a normal choice — the point is that people
  log in.

## 2. Forced password change on first login

If `users/{uid}/profile.mustChangePassword === true`, the user lands on a change-password screen
before reaching the app. They cannot skip it.

- Fields: new password, confirm password. Minimum 6 characters (Firebase's rule — surface it up
  front, don't wait for the error).
- Reject reusing `chains1234`.
- On success: update the password, set `mustChangePassword: false`, continue into the app.
- Offer, on the same screen but clearly optional: **"Want to pick a different username?"** and
  **"Add an email so you can reset this yourself (optional)"**. Both skippable. Email is never
  required, and the copy should say so.

## 3. Profile management (Settings)

- **Change password** — current password, new password, confirm.
- **Change username** — must be unique. On change: write the new `usernames/{new}` entry, delete
  the old one, update `users/{uid}/profile.username`, and update the Firebase account email to
  `newname@chains.app` so sign-in keeps working. This is the fiddly one — do it as a single
  transaction and roll back cleanly if any step fails. Do **not** change `memberId`; that is what
  ties them to their league history and must stay stable forever.
- **Add/change email (optional)** — purely so they can self-serve a reset. Make clear it is
  optional and not shared.

## 4. Owner console — account recovery

Owner-only screen (there is already an `isOwner` gate and an `admin`/Console nav item).

The owner explicitly asked to be able to "recover" passwords. **He cannot, and neither can we** —
Firebase stores only a salted hash; the plaintext does not exist anywhere. Do not build anything
that stores or displays passwords. Build **reset** instead, which is what he actually needs:

- A list of every member: username, display name, member id, whether they've changed their
  starter password, last sign-in.
- **Reset password** button per member → owner types (or accepts a generated) temporary password,
  it is applied, and `mustChangePassword` is set back to `true` so they must change it on next
  login. Show the temporary password once, on screen, for the owner to pass along — never persist it.
- **Add a member** — create username + starter password + link to a member id, same shape as the
  six above.
- Copy on this screen should say plainly: *"Passwords can't be looked up — only reset. This is
  deliberate; it means nobody, including you, can read someone's password."*

## 5. League isolation — the important architectural piece

Owner's requirement: *"Where other people log in, they shouldn't see our league. Our league is
specific to us."*

**Current state — this is the real problem.** The fantasy league (picks, scores, standings) lives
in the LEGACY `chains-fantasy` project under a single global `/league` node with wide-open rules.
Every client reads the same node. There is no tenancy at all. Anyone who signs in today sees the
Chains league.

**Target:** membership-gated leagues, with the app showing a user only leagues they belong to.

- `users/{uid}/profile.leagues` already exists and is seeded with `{"chains-dgpt-2026": true}` for
  all six members. Use it as the source of truth for "which leagues am I in".
- A user with no leagues should land on an empty state — *"You're not in a league yet"* — with
  **Create a league** and **Join with a code** options, **not** on the Chains league.
- Reads of a league's picks/standings must be gated on membership. The `chains-app-f38f8` project
  already has the right rule shape under `leagues/$leagueId` (member-gated read, commissioner-gated
  meta). The work is migrating the live season data onto that shape.

**Do NOT migrate the live season data as part of this brief.** T1–T14 of a real in-progress season
live in that legacy node, the fantasy app reads it every 5 seconds, and a botched migration loses
the season. Treat migration as its own project with a written plan, a verified backup, and a
rollback path. For *this* brief: build the UI and the membership gating, and read the league id
from `profile.leagues`. Flag the migration as the blocking dependency.

**Interim behaviour that is acceptable right now:** if the signed-in user is one of the six known
members, show the Chains league as today. If they are anyone else, show the empty state. That
alone satisfies "other testers don't see our league" without touching the live season data.

## 6. Guardrails

- `chains1234` is fine for six people in a private test league with no personal data. It is **not**
  fine once outside testers join — by then the forced-change flow in section 2 must be working, and
  starter passwords should be generated per person rather than shared.
- Never log, display, or store a password anywhere except the one-time owner reset display.
- `memberId` is permanent. Usernames and passwords change; the link to league history must not.
- Anonymous accounts already number ~119 (every device visit creates one). Don't create more —
  once real login is in, only fall back to anonymous when Firebase is genuinely unavailable.

---

## 7. Definition of done

- [ ] Username + password sign-in; no email field; stays signed in; sign-out in Settings.
- [ ] Forced password change when `mustChangePassword` is true, with optional username/email on the
      same screen.
- [ ] Change password / change username / optional email all work from Settings, and changing a
      username does not break sign-in or lose league history.
- [ ] Owner console lists members and can reset any password, with honest copy about why passwords
      can't be read.
- [ ] A signed-in user who is not one of the six sees an empty-league state, not the Chains league.
- [ ] Version bumped, changelog written, nothing from v440 reverted.

Related issue: **#40**. Full account table and verification results are in the Office Chat thread
(Issue #14) and `company/briefs/`.
