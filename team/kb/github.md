# PLAYBOOK: GitHub writes (API-first as of 2026-07-28 - token is live)

## API path (USE THIS - the token in github-token.txt is real, use it)
- Read: GET https://api.github.com/repos/<owner>/<repo>/contents/<path>?ref=main -H "Authorization: Bearer <TOKEN>"
  (base64-decode "content"; keep the "sha" for writes).
- Write: PUT https://api.github.com/repos/<owner>/<repo>/contents/<path> -H "Authorization: Bearer <TOKEN>"
  -d '{"message":"...","content":"<base64>","branch":"main","sha":"<sha-if-updating>"}'. The response IS your
  verification (it contains the new commit sha/url) - no separate re-check needed.
- Never print/log/commit the token itself.
- This works for ALL repos: chains-agent-log, chains-app, chains-dgpt-data, chains-site, chains-dgpt-assets.
- Deploying a new app build = PUT the downloaded index.html straight to Bonnaroo/chains-app as `index.html`.
  No browser upload step needed for GitHub at all once you have the file locally.

## Browser fallback (ONLY if github-token.txt still says PASTE_TOKEN_HERE)
- Read a file fresh: curl https://raw.githubusercontent.com/<owner>/<repo>/main/<path>?cb=<epoch>. The raw CDN CACHES
  for minutes and can serve stale content or stale 404s. To verify a just-committed change, get the commit SHA
  (api.github.com/repos/<owner>/<repo>/commits/main) and fetch raw at that SHA, or check the contents API.
- Upload/replace a file: navigate to https://github.com/<owner>/<repo>/upload/main (or /upload/main/<subfolder> to
  land files inside a folder). Use the "Choose your files" file input, then click "Commit changes".
  GOTCHA: after a file is added, the page grows and the green "Commit changes" button MOVES DOWN - screenshot and
  click its CURRENT position, or target it by element ref. A stray click can flip the radio to "Create a new branch"
  (button then reads "Propose changes") - make sure "Commit directly to the main branch" is selected first.
- Commit attribution: GitHub may generate or regenerate a Copilot commit message asynchronously after the dialog
  opens. Wait until generation settles, set the exact `[GPT]`/`[CLAUDE]` summary, wait again, then visibly re-read
  the textbox immediately before clicking Commit.
- NEVER use GitHub's inline text editor for markdown files with lists - it silently mangles list formatting. Always
  local-write + upload-replace (or API PUT).
- Office markdown (board/logs/docs) commits directly to main. There are no PRs here, no gh CLI, no git creds
  installed in this environment - the API token is the only credential-based path.
