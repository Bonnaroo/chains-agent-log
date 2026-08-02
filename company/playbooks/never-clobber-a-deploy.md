# NEVER CLOBBER ANOTHER ROLE'S DEPLOY (mandatory before any index.html write)

## What happened, 2026-08-02
Engineer shipped v438 at 13:06:24 UTC fixing Issue #31 (Go Throw round save AND delete both
failing with permission_denied). At 13:08:56 UTC — 2.5 minutes later — Dispatcher committed its own
Issue #19 fix and **silently wiped v438 out of production**. The #31 fix was gone from the live app and
the version label fell back to v437. The owner noticed before the team did.

Dispatcher did nothing "wrong" by its own logic. It fetched index.html early in its run, edited that
copy in memory, then wrote the whole 9.6MB file back. GitHub's sha check did NOT save us: Dispatcher
re-read the sha right before writing, so the write was accepted — it just carried stale *content*.
That is a classic lost update. Both fixes were real; one destroyed the other.

## The rule
`index.html` is ~9.6MB and every write replaces the ENTIRE file. Any role writing it MUST:

1. **Hold the build lock.** Read `company/BUILD_LOCK.json`. If `locked: true` and not expired, DO NOT
   WRITE — go work something else. Acquire the lock yourself before you start, release it when done.
2. **Re-fetch immediately before writing.** Fetch the current committed `index.html` as the LAST step
   before building your payload — not at the start of your run. Apply your patch to THAT freshly
   fetched content. Never write a copy you fetched earlier, even minutes earlier.
3. **Check the version marker before and after.** Note the `>vNNN</span>` value in the copy you fetched.
   If it is higher than the version you last saw, someone deployed while you were working — start over
   from their build. After your write, re-read the committed blob and confirm BOTH your change and the
   expected prior version-or-higher are present.
4. **Bump the version.** Every production write increments `>vNNN</span>`. A deploy that leaves the
   version unchanged or lower is a red flag that you clobbered someone.
5. **Preserve what you find.** If the freshly fetched file contains a module you do not recognize as
   yours, it is someone else's fix. Keep it. Only replace the specific module you are changing.

## Who may write index.html
Engineer, primarily. Watcher and Dispatcher may patch it for urgent data/config/logic fixes, but the
five rules above are not optional for anyone. Dispatcher should prefer fixing queue state, data files,
and docs over touching app code when Engineer is running normally.

## Recovering from a clobber
Do not simply revert — that destroys the other role's work too. Diff the two builds module by module
(decompress each `"data":"<base64>"` blob), take the correct version of each changed module, merge them
into one build, bump the version, and deploy that. v439 was produced exactly this way: Dispatcher's
Issue #19 seed-data fix plus Engineer's Issue #31 ChainsRounds fix, merged, both verified present.
