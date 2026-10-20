# Playbook — GitHub Upload/Deploy (API-first)

1. Read the token: first non-comment TOKEN= line of github-token.txt. Never print/log it.
2. To read a file: GET https://api.github.com/repos/Bonnaroo/<repo>/contents/<path>?ref=main
   -H "Authorization: Bearer <TOKEN>". Base64-decode `content`. Keep `sha` for updates.
   IMPORTANT: for files over ~1MB (e.g. chains-app/index.html), the inline `content` field comes back EMPTY.
   Follow the `download_url` field instead (a raw.githubusercontent.com URL) and GET that.
3. To write: PUT https://api.github.com/repos/Bonnaroo/<repo>/contents/<path>
   -H "Authorization: Bearer <TOKEN>" body {"message","content":base64,"branch":"main","sha":<if updating>}.
   The response body IS your confirmation of success — no separate re-fetch needed for routine writes.
4. GitHub Pages (chains-app) has CDN lag (Fastly) of several minutes after a push. A live browser tab can show
   stale content even after a successful deploy. To check ground truth, re-fetch via the contents API's
   download_url (bypasses the CDN), not a browser tab.
5. Never write the token itself into any repo, log, or Issue.

LESSON this came from: multiple failed browser-upload attempts before the token+API approach was adopted
(2026-07-29, see LESSONS_LEARNED.md).
