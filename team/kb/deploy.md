# PLAYBOOK: Deploy a new app build to the live site
The app is a single index.html served by GitHub Pages at bonnaroo.github.io/chains-app (repo Bonnaroo/chains-app).
1. In Claude Design, open the target version file, click its row "..." -> Download. It lands in Guillermo's Downloads.
2. Mount Downloads if needed: request_cowork_directory path "C:\Users\18108\Downloads".
3. Find the build in bash: newest "Chains Fantasy DGPT App v*.html" under /sessions/<session>/mnt/Downloads.
4. VERIFY it is clean before shipping:
   - grep -c "data-omelette-injected"  -> must be 0 (no editor harness)
   - betting strings must be 0: grep -ci "LIVE BETTING" ; "bet-a-buddy" ; "MoneyDisc"
   - title present: grep "<title>Chains · Fantasy DGPT 2026</title>"
5. Copy it to "Cowork Design Folder/Chains Fantasy DGPT/deploy/index.html".
6. Upload-replace to Bonnaroo/chains-app as index.html via kb/github.md (commit "Deploy vNNN: <what changed>").
7. VERIFY LIVE: chains-app HEAD moved (api.github.com/repos/Bonnaroo/chains-app/commits/main), then wait ~1-2 min and
   curl https://bonnaroo.github.io/chains-app/index.html — expect the full ~9.6MB. A ~1-2KB reply = Pages still
   rebuilding; wait and recheck. Only mark deployed once the full build is served.
