# PLAYBOOK: Firebase data checks (app project chains-app-f38f8)
Public web API key (ships in the client, not a secret): AIzaSyAZ9T16EZSngQxNevsil-txb3xpEC4RKIE
DB root: https://chains-app-f38f8-default-rtdb.firebaseio.com
Reads/writes need auth != null; anonymous sign-in is enough (the app does it). From bash:
  1) POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<API> {"returnSecureToken":true} -> idToken
  2) GET/PUT/POST/DELETE  <DB>/<path>.json?auth=<idToken>
Key nodes: /playRounds/<id> (durable rounds, full objects), /liveRounds/<id> (in-progress mirror), /users/<uid>,
/waitlist/<id> (marketing signups). Data-integrity checks: look for orphan/duplicate/"open"-forever records.
RULES: back up to <DB>/_trash/<Date.now()> before ANY delete. NEVER touch the SEPARATE chains-fantasy project's
/league node (the live 6-friend league) — different project, off-limits.
