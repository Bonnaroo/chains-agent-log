# Verify without a browser on Will's PC
1. Static: esbuild + tdz.js clean for every edited module; `python3 ops/check.py` green.
2. Build to test.html only. Confirm the md5 is live.
3. Tell Will exactly: open **test.html** (not the app icon) on his phone, which screen, what to tap, what he should see, and what would mean it's broken. One screen per message.
4. Promote only after he says it works. If he's unavailable, leave it on test.html, note it in STATE.md "In flight" and TODO, and stop there.
5. Data-side checks you can still do from a shell: HOWTO/read-firebase.md.
