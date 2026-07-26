# PLAYBOOK: GitHub writes via the browser (there is NO gh CLI / git creds in this environment)
All commits happen through the GitHub web upload flow using Claude in Chrome.
- Read a file fresh: curl https://raw.githubusercontent.com/<owner>/<repo>/main/<path>?cb=<epoch>. The raw CDN CACHES
  for minutes and can serve stale content or stale 404s. To verify a just-committed change, get the commit SHA
  (api.github.com/repos/<owner>/<repo>/commits/main) and fetch raw at that SHA, or check the contents API.
- Upload/replace a file: navigate to https://github.com/<owner>/<repo>/upload/main (or /upload/main/<subfolder> to
  land files inside a folder). Use the "Choose your files" file input, then click "Commit changes".
  GOTCHA: after a file is added, the page grows and the green "Commit changes" button MOVES DOWN — screenshot and
  click its CURRENT position, or target it by element ref. A stray click can flip the radio to "Create a new branch"
  (button then reads "Propose changes") — make sure "Commit directly to the main branch" is selected first.
- Multiple files in one commit: put them all in the file input in one upload; they commit together into the folder
  the /upload URL points at.
- NEVER use GitHub's inline text editor for markdown files with lists — it silently mangles list formatting. Always
  local-write + upload-replace.
- Office markdown (board/logs/docs) commits directly to main. There are no PRs here.
