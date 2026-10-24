# MONITORING.md — knowing when Chains is down or broken before players tell us

Two free services, 20 minutes of Will's time. Everything else the AI does.

## 1. UptimeRobot (is the site up?) — Will, ~8 minutes
1. https://uptimerobot.com → Sign up (free plan: 50 monitors, 5-minute checks).
2. **+ New monitor** → type *HTTP(s)* → name `Chains app` → URL
   `https://bonnaroo.github.io/chains-app/index.html` → interval 5 min → Create.
3. **+ New monitor** again → type *Keyword* → name `Chains version` → same URL → keyword
   `CHAINS_VERSION` → alert when keyword *not* found. (Catches a half-written or empty deploy.)
4. **+ New monitor** → *HTTP(s)* → name `Chains database` → URL
   `https://chains-app-f38f8-default-rtdb.firebaseio.com/.json?shallow=true` → expected: any 2xx/4xx
   (a 401 "Permission denied" is healthy — it means Firebase answered). Choose "Alert when down" only.
5. **My settings → Alert contacts**: your email is there by default; add your phone as SMS if you want.
6. Optional: **Status page** → create a public one → paste the link into OPERATIONS.md §1.

What it does not catch: a page that loads but a screen inside is broken. That's Sentry.

## 2. Sentry (does the app throw errors on players' phones?) — Will ~10 minutes, AI 1 build
1. https://sentry.io → Sign up (free: 5k errors/month) → Create project → platform **Browser JavaScript**
   → name `chains-app`.
2. Sentry shows a **DSN** (a URL starting `https://…@…ingest.sentry.io/…`). It is safe to be public
   (it only lets browsers *send* errors). Paste it to the AI in chat, or put it in
   `chains-agent-log/ops/sentry.dsn` (one line).
3. The AI adds this to `app_base.html` right after the opening `<head>` and ships it in the next build:
   ```html
   <script src="https://browser.sentry-cdn.com/8.33.1/bundle.min.js" crossorigin="anonymous"></script>
   <script>
     try { Sentry.init({ dsn: "PASTE_DSN", release: "chains@" + (window.CHAINS_VERSION || "dev"),
       sampleRate: 1.0, tracesSampleRate: 0, beforeSend: function (e) { try { delete e.user; } catch (x) {} return e; } }); } catch (e) {}
   </script>
   ```
   No user identity is sent (beforeSend strips it); errors carry the version so we know which build.
4. Sentry → **Alerts** → "Send a notification when a new issue is created" → email.
5. Weekly check (OPERATIONS.md §6): open Sentry → Issues → anything new since last week goes on TODO.

## 3. Firebase's own signals — Will, 2 minutes once
Firebase console → project `chains-app-f38f8` → **Realtime Database → Usage**: watch *Storage* and
*Downloads*. Alerts: Google Cloud → Billing → Budgets & alerts → create a $1 budget on the project —
free plan can't bill, but the email tells us if usage ever approaches the limits.

## 4. What "down" looks like and who acts
| Alert | Likely cause | First move |
|---|---|---|
| UptimeRobot: app down | GitHub Pages outage, or a bad deploy wiped index.html | githubstatus.com; roll back (OPERATIONS §3) |
| UptimeRobot: keyword missing | truncated build | roll back, rebuild from `app_vNNN.html` |
| UptimeRobot: database down | Firebase outage | status.firebase.google.com; wait; tell players rounds save on the phone |
| Sentry: new issue, many users | a screen crashing | reproduce in the harness, hot-fix to test.html, promote |
| Sentry: new issue, one user | that phone/browser | ask them for the screen; fix in the next release |
