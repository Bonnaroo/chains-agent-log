# Playbook — Production Verification (3 levels, all required before "done")

## 1. Artifact verification (the committed file)
Fetch index.html via the GitHub contents API's download_url (not the inline `content` field — too large).
Decompress and search using this exact method (plaintext grep gives FALSE NEGATIVES on this file — the app's
real content is stored in gzip-compressed base64 blobs):
```python
import re, base64, zlib
data = open("PATH", errors="ignore").read()
blobs = re.findall(r'"data":"([A-Za-z0-9+/=]{200,})"', data)
hits = 0
for b in blobs:
    try:
        dec = zlib.decompress(base64.b64decode(b), 16 + zlib.MAX_WBITS).decode(errors="ignore")
        if "SEARCH TEXT" in dec: hits += dec.count("SEARCH TEXT")
    except Exception:
        pass  # some blobs are legitimate embedded course images and will legitimately fail to decompress — not corruption
print(hits)
```
Also confirm: expected build marker present, no truncation (file size roughly in line with prior builds), basic
structural sanity.

## 2. Deployment verification (the live URL)
Fetch https://bonnaroo.github.io/chains-app/ (or test.html during staging) via the contents API's download_url
path, not a browser tab alone — GitHub Pages' CDN (Fastly) can lag several minutes and show stale content even
after a successful push. Confirm the build/version marker matches what was just deployed.

## 3. Functional verification (a real user's experience)
Open the actual production URL in a live browser and exercise the changed workflow: app loads, Firebase
connection works, existing league data appears, the changed feature meets the Issue's acceptance criteria,
mobile-sized viewport still works, no new console errors.

A change is not "done" — do not close the Issue or claim it shipped — until all 3 levels pass. Never issue a
"critical"/rollback-recommending claim without having done level 3 directly (see LESSONS_LEARNED.md, the
2026-07-29 false "critical hang" incident).
