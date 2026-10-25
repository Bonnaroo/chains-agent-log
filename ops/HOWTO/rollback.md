# Roll back a bad release
1. Find the last good version's commit: `curl -s -H "Authorization: token $T" "https://api.github.com/repos/Bonnaroo/chains-app/commits?path=index.html&per_page=10"` (messages carry the version).
2. Fetch that file: `curl -s -H "Authorization: token $T" -H "Accept: application/vnd.github.raw" "https://api.github.com/repos/Bonnaroo/chains-app/contents/index.html?ref=<sha>" -o good.html`.
3. Push it back as index.html with push.py (message "rollback to vNNN"). The version marker inside stays vNNN — that's correct.
4. Log it (AGENT_LOG "Incident"), update HANDOFF Live line and STATE.md, tell Will.
5. Data written by the bad build stays; changes are additive by convention, so older builds ignore new fields.
