# PLAYBOOK: Deploy a new app build to the live site
The app is a single index.html served by GitHub Pages at bonnaroo.github.io/chains-app (repo Bonnaroo/chains-app).
1. In Claude Design, open the target version file, click its row "..." -> Download. It lands in Guillermo's Downloads.
2. Mount Downloads if needed: request_cowork_directory path "C:\Users\18108\Downloads".
3. Find the build in bash: newest "Chains Fantasy DGPT App v*.html" under /sessions/<session>/mnt/Downloads.
4. VERIFY it is clean before shipping — DO NOT plain-grep the file, it will give false negatives (see below):
   - grep -c "data-omelette-injected"  -> must be 0 (no editor harness)
   - title present: grep "<title>Chains · Fantasy DGPT 2026</title>"
   - For ANY check of actual app content/copy/feature text (betting strings, a button label, explainer text,
     etc.): the app's real content lives in gzip-compressed base64 blobs inside the HTML, NOT as plaintext.
     A plain `grep "some text"` will almost always return 0 matches even when the text IS there — this is not
     proof of absence. ALWAYS decompress first using this exact snippet before concluding anything is missing:
     ```python
     import re, base64, zlib
     data = open("PATH_TO_FILE.html", errors="ignore").read()
     blobs = re.findall(r'"data":"([A-Za-z0-9+/=]{200,})"', data)
     hits = 0
     for b in blobs:
         try:
             dec = zlib.decompress(base64.b64decode(b), 16 + zlib.MAX_WBITS).decode(errors="ignore")
             if "SEARCH TEXT HERE" in dec:
                 hits += dec.count("SEARCH TEXT HERE")
         except Exception:
             pass
     print("occurrences:", hits)
     ```
     Run this BEFORE reporting anything as broken/missing/not-deployed. A 0 result from plain grep is not a
     finding — it is a sign you used the wrong method.
5. Copy it to "Cowork Design Folder/Chains Fantasy DGPT/deploy/index.html".
6. Deploy via the GitHub API (kb/github.md) — PUT to Bonnaroo/chains-app as index.html (commit "Deploy vNNN: <what changed>").
7. VERIFY LIVE — DO NOT trust a live browser tab alone for a few minutes after deploy:
   - First, verify the COMMITTED file is correct: GET the contents API for Bonnaroo/chains-app/index.html,
     follow its download_url (raw.githubusercontent.com), and run the decompress-and-search snippet above
     against that fetched content. This bypasses GitHub Pages' CDN and is ground truth for "did it deploy."
   - THEN, separately, check the live browser URL (bonnaroo.github.io/chains-app) if you want to see it
     rendered — but if it looks wrong here while the raw committed file (step above) looks right, that is CDN
     propagation lag, not a failed deploy. Different networks/devices can see different CDN edge states for
     several minutes after a push. Do not conclude "the deploy failed" from a live browser check alone — always
     cross-check against the raw committed file first.
   - Only mark something as a REAL bug/regression if the decompressed CONTENT of the raw committed file itself
     is wrong, not just a live-tab rendering that hasn't caught up yet.


## ADDENDUM: not every blob is gzip text — course images are in there too
The app embeds real course photos used during LIVE tournament play (shown once live scoring/play starts, e.g.
during Live Chains). These are stored as base64 blobs alongside the gzip-compressed text bundles, so when
running the decompress-and-search snippet above, SOME blobs will legitimately fail to decompress with zlib
(they're images, not gzip text) — that is NORMAL and NOT evidence of a corrupt build. Do not treat a partial
decompress-failure count alone as a red flag. If you want to sanity-check the blob mix, compare the failing
blob count against a known-good prior version's count for the same file — a big, unexplained JUMP in failures
version-over-version is worth a closer look; a stable baseline count of image blobs is not a bug.
