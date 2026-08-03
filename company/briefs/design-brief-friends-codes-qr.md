# Chains — Design Brief: Friends network, codes & QR

Paste into the Claude Design project. Written 2026-08-03 against live **v445**.
Answers your request; all six decisions are made below and the backend is built and verified.

---

## 0. BACKEND IS DONE — verified, not planned

Every node and rule below was created and **tested against real signed-in accounts**, positive and
negative. Do not rebuild any of it. Do not touch `friends.js` or `qr.js` — they already work.

### `leagueCodes/{CODE}` — NEW, live
```json
{ "leagueId": "chains-dgpt-2026", "createdBy": "<uid>", "ts": 1785791329000, "active": true }
```
Rules: **read** = any signed-in user (that's how a code resolves). **write** = only the
commissioner of the league the code points at, on both create and delete.

Verified:
- commissioner creates a code for their own league → **succeeds**
- non-commissioner creates a code for someone else's league → **denied**
- commissioner deletes (revokes) their own code → **succeeds**
- any signed-in user resolves a code → **succeeds**

### `leagues/chains-dgpt-2026` — NEW, live
Created with `commissioner` = Will's uid and all six members keyed by uid → `{ memberId }`.
This node did not exist before; league isolation had nothing to read. Read is gated on
`members/{auth.uid}` existing, so non-members can't see it.

### Seeded league code: **`CHAINS26`** → `chains-dgpt-2026`, active
Use this to test the join flow immediately.

### `friendRequests/{recipientUid}/{senderUid}` — NEW rules
```json
{ "ts": 1785791000000 }
```
Rules: recipient reads their own inbox. Sender may **only create** their own request in someone
else's inbox. Recipient may **only delete** (accept/decline). Sender may delete to withdraw.

Verified:
- sender creates a request in recipient's inbox → **succeeds**
- sender withdraws it → **succeeds**
- user forges an *inbound* request into their **own** inbox → **denied**
  *(this one initially passed; the rule was tightened and re-verified. It mattered: if accept does a
  both-sides write, forging an inbound request would let you befriend someone who never asked.)*
- user reads someone else's inbox → **denied**

### `friendCodes/{CODE}` — rules tightened for decision 4
Read = any signed-in user. Write = only if the record points at **yourself**, on create and delete.
So codes are now regenerable without anyone being able to hijack another person's code.

Verified: user sets their own code → succeeds. User writes a code pointing at someone else → denied.

### Accounts (context you'll need)
Six real accounts exist and work: `will, cory, kyle, shanna, gabe, kadey`. Starter password
`chains1234`, forced change on first login — **and it's working in the wild**: Will and Kadey have
already changed theirs. `users/{uid}/profile` holds `{ username, memberId, name, disc, leagues,
mustChangePassword }` and is readable only by that user.

---

## 1. DECISIONS — all six settled

| # | Decision | Ruling |
|---|---|---|
| 1 | QR vs typed code | **QR scan = instant mutual friends. Typed code = request/accept.** Scanning proves you're physically together. Always show a confirm card with name + avatar before writing. |
| 2 | League join | **Instant, revocable code.** No approval queue — it's a six-person friend league, not a marketplace. |
| 3 | Mid-round join | **Owner gets a tap-to-approve toast. Auto-approve if already friends.** |
| 4 | Friend codes | **Move to stored, regenerable.** Deterministic-from-uid means a code you once shared can never be taken back. Add "Regenerate my code" in Settings; clean up the old code on regenerate. Rules already support this. |
| 5 | What friends see | **Bag + rounds you actually played together. Nothing else.** Personal stats, other rounds, league picks stay private. Start closed; loosening later is easy, tightening isn't. |
| 6 | League codes | **No expiry, revocable, one active code per league.** |

---

## 2. UI TO BUILD — priority order

### A. Friends screen (highest value — there is currently *no* friends UI at all)
- **My QR** — full-screen, encodes `https://bonnaroo.github.io/chains-app/#add=<CODE>`.
  Big, bright, readable across a table. Show the 6-char code as text underneath so it can be read
  aloud or typed.
- **Add a friend** — enter a code, or scan. Scanning is optional: because the QR encodes a real URL,
  the phone's native camera works. Don't make an in-app scanner a prerequisite.
- **Friends list** — name, avatar, "played N rounds together". Remove with confirm.
- **Requests** — inbound with accept/decline, outbound with withdraw.
- **Regenerate my code** in Settings, with a plain warning that old QRs/links stop working.

### B. Round QR + join flow
- QR on the scorecard and watch screen encoding `https://bonnaroo.github.io/chains-app/#watch=<roundId>`.
- Scanner lands by role: **on the card** → straight to score-your-row. **Not on the card** → watch,
  plus "Ask to join". Owner sees a tap-to-approve toast; auto-approve if already friends.
- Watch must keep working with **no account** — that path exists, don't regress it.

### C. League code + join flow
- Commissioner sees the league code + QR in league settings, encoding
  `https://bonnaroo.github.io/chains-app/#league=<CODE>`. Copy, share, regenerate/revoke.
- Joining writes `leagues/{id}/members/{uid} = { memberId }` **and**
  `users/{uid}/profile.leagues/{id} = true`. Both, or the isolation gate won't see them.
- The interim isolation gate must accept these new members — right now it recognises only the
  hardcoded six. Read membership from `profile.leagues`, not a name list.

### D. Onboarding through a code (the one that gets new people in)
Someone with no account scans a friend/league/round QR. They must land on **sign-up**, create an
account, and then **the original action completes automatically** — friend added, league joined,
round opened. The `#watch=` path already stashes the hash and resumes; extend that same pattern to
`#add=` and `#league=`, and make it survive account *creation*, not just sign-in.

---

## 3. GUARDRAILS

- **Never** touch league/season data (`chains-fantasy` `/league`, `/live`). Read-only, always.
- Keys are `memberId` (`will`, `kyle`) — **never** change a memberId; it's what ties a person to
  their league history. Usernames and passwords can change; memberId cannot.
- **Version floor: v445.** Never ship a build numbered lower. Always bump.
- Re-fetch `https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html` immediately
  before exporting — other work ships between your sessions.
- Don't rebuild `ChainsQR`, `ChainsFriends`, or the auth layer. They exist and work.
- Every QR encodes a **full URL**, never a bare code — that's what makes native cameras work.

---

## 4. DEFINITION OF DONE

- [ ] Friends screen exists: My QR (full-screen), add by code, friends list, requests in/out
- [ ] Regenerate my code works and cleans up the old code
- [ ] Round QR on scorecard + watch; scanner lands correctly by role; no-account watch still works
- [ ] Mid-round join: owner tap-to-approve; auto-approve when already friends
- [ ] League code + QR in league settings; join writes **both** membership paths
- [ ] Isolation gate reads `profile.leagues` instead of the hardcoded six
- [ ] `#add=`, `#league=`, `#watch=` all survive sign-in **and** sign-up, then complete the action
- [ ] Friends see bag + shared rounds only
- [ ] Version bumped, changelog written, nothing from v445 reverted

---

## 5. WHAT I NEED BACK FROM YOU

End your export with, as plain text I can commit:
1. New version number
2. Modules changed, by name
3. Which items above are done vs. deliberately skipped, and why
4. **Anything you needed from the backend that wasn't there** — that's my half of the loop, and I'd
   rather build it than have you work around it.
