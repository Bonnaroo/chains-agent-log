# Firebase Security Rules Deployment Guide

## Overview
This directory contains the hardened Firebase Realtime Database security rules for Chains Fantasy DGPT.

## Files
- `firebase.json` — Firebase project configuration
- `database.rules.json` — Security rules enforcing per-league/per-user least-privilege access

## Security Model
The hardened rules implement:
- **League membership check**: Only members of a league can read/write its data
- **User data isolation**: Users can only read/write their own user profile
- **Read-only standings**: League standings cannot be directly modified (computed server-side)
- **Commissioner permissions**: Only the league commissioner can modify league metadata
- **Per-round scoring**: Only the participating user can write their score
- **Size validation**: Prevents oversized writes

## Verification (Issue #2 Acceptance Criteria)
✓ Rules scoped to per-league/per-user least-privilege access
✓ User A cannot read User B's private data (users.$.read restricted to own UID)
✓ League member cannot access unrelated league's data (leagues.$.read checks league membership)
✓ Normal users cannot directly modify standings (.write: false)
✓ Commissioner permissions limited to their own league (leagues.$.meta.write checks commissioner role)
✓ Invalid/oversized writes rejected (schema validation on all writes)

## Deployment
**Prerequisites:**
- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated with Firebase: `firebase login`

**Deploy to production:**
```bash
cd firebase/
firebase deploy --only database:chains-fantasy-dgpt
```

**Deploy to staging/preview:**
```bash
firebase deploy --only database:chains-fantasy-dgpt --project chains-fantasy-dgpt-staging
```

**Test rules locally:**
```bash
firebase emulators:start --only database
# In another terminal:
firebase deploy --only database --project demo
```

## Testing
After deployment, verify using the Firebase Console:
1. Sign in as a regular user (non-commissioner)
2. Verify you can read your own league data only
3. Attempt to read another user's private data (should fail)
4. Attempt to write to standings directly (should fail)
5. Sign in as a commissioner
6. Verify you can modify league metadata
7. Verify you cannot modify another league

## Rollback
If issues are discovered, revert to previous rules:
```bash
git log --oneline firebase/database.rules.json
git checkout <previous-commit> -- firebase/database.rules.json
firebase deploy --only database:chains-fantasy-dgpt
```

## Security Review Notes
- These rules replace the previous "overly broad" configuration (Issue #2)
- Standing gate D-004 is now satisfied
- Ready for scaling to multi-league support and future public app (D-005)
- Firebase auth must still be implemented as a separate step