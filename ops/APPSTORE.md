# APPSTORE.md — getting Chains onto phones, then into the stores

Where we are: Chains is a single `index.html` on GitHub Pages with a manifest and a service worker. On a
phone it already installs to the home screen and runs full-screen like an app. That is step 1 and it is
done; everything below is about the stores.

## Step 1 — home-screen install (done; tell players this)
- iPhone: open https://bonnaroo.github.io/chains-app/ in Safari → Share → **Add to Home Screen**.
- Android: open it in Chrome → menu → **Add to Home screen** (or the "Install" banner).
The icon, name ("Chains"), full-screen mode and portrait lock come from the manifest the app builds at
runtime. No store, no review, no fee. Updates are instant (every deploy).

What a home-screen PWA cannot do yet: push notifications on iPhone need the app to be installed this way
*and* iOS 16.4+, and the player must allow them; background GPS is not available; no App Store listing
for discovery. Those three are the only real reasons to wrap it.

## Step 2 — the wrapper (Capacitor), when we want the stores
Capacitor (free, by Ionic) wraps a web app in a real iOS/Android shell. Two ways to feed it:
1. **Bundle** the built `index.html` + `sw.js` inside the app (works offline, store review sees real
   code; every app update = a store release). 
2. **Load the live URL** inside the shell (updates stay instant; Apple allows it when the app is a real
   product and not just a browser — ours is). We start with 2 for speed and switch to 1 if review pushes back.

Plumbing the AI prepares (in a new repo `chains-native`, public is fine — no secrets in it):
- `package.json` with `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`,
  `@capacitor/push-notifications`, `@capacitor/geolocation`.
- `capacitor.config.ts`: appId `app.chains.disc` (or whatever Will reserves), appName `Chains`,
  `server.url` = the live URL for mode 2, `webDir` = `www` for mode 1.
- Icons and splash from BRAND.md colours (`pine-800` background, the chain mark) at every required size.
- A GitHub Actions workflow that builds the Android `.aab` on every tag.

## The honest part: iOS needs a Mac
Apple only builds and signs iOS apps with Xcode on macOS. Will's computer is Windows. Options:
- **A cloud Mac build service** — Codemagic (free tier: 500 build minutes/month) or Bitrise. They run
  Xcode for us from the GitHub repo and upload to TestFlight. This is the recommended route.
- A borrowed/used Mac mini (one-off cost) — only if the cloud route annoys us.
Android builds fine on Windows or in GitHub Actions.

## Accounts and costs (Will only)
| Item | Cost | Needed for |
|---|---|---|
| Apple Developer Program | $99/year | TestFlight + App Store |
| Google Play Console | $25 once | Play Store |
| Codemagic | free tier, then ~$0.04/min | iOS builds without a Mac |
| Firebase Cloud Messaging | free | push notifications (both platforms) |
| Esri Location Platform or MapTiler key | free tier | satellite imagery in production (dev key today) |
| A domain (e.g. chainsdisc.app) | ~$15/year | nice-to-have; GitHub Pages supports custom domains |

## Store review checklist (what gets apps rejected)
- Sign-in works and a reviewer can make an account in under a minute (they will).
- Account deletion from inside the app (Apple requires it) — **to build**: Settings → Delete my account.
- A privacy policy URL (about.html footer grows a Privacy section; also pasted into the listing).
- Nothing says "beta", "test", "coming soon" on screens a reviewer can reach; the fantasy league must be
  clearly "opens 2027" rather than broken.
- Screenshots at the required sizes (6.7", 6.5", 5.5" iPhone; 7" and 10" tablet for Google) — real
  screens from the app, no mockups.
- App name "Chains" may be taken on the App Store; the display name can be "Chains — Disc Golf".

## Order of work
1. Player-facing: tell people "Add to Home Screen" now (about.html already says it).
2. Build **account deletion** + **privacy policy** (both needed regardless).
3. `chains-native` repo with Capacitor mode 2 + Android build in Actions → Will installs the APK on an
   Android friend's phone to see it run.
4. Will: Apple Developer account + Codemagic account → iOS TestFlight → Kyle and Gabe test.
5. Push notifications via FCM (league night reminders, "someone took your hole" are the first two).
6. Store listings from BRAND.md §9, screenshots, submit.
