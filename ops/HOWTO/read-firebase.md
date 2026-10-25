# Read Firebase from a shell (public nodes)
```bash
T=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyAZ9T16EZSngQxNevsil-txb3xpEC4RKIE" -H 'Content-Type: application/json' -d '{"returnSecureToken":true}' | python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])")
curl -s "https://chains-app-f38f8-default-rtdb.firebaseio.com/courseStats/mi-otterburn.json?auth=$T" | python3 -m json.tool | head -60
```
Readable this way: courseStats, territory, courseFirsts, usernames, weekly, courseLeagues, playerCourses, callouts, crews, lostFound. Not readable: users/{uid} (private). This creates a throwaway anonymous auth user each time; that's fine.
Node list and shapes: HANDOFF §6, CHAINS_SYSTEM.md, firebase/chains-app-f38f8.rules.v2.json.
