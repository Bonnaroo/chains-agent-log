# BRAND.md — how Chains looks and sounds outside the app

DESIGN.md is for screens. This is for everything else: the name, the website, stickers, store listings,
social posts, emails. Same rules of plainness apply.

## 1. Name
**Chains.** One word, capital C. Never "Chains Fantasy DGPT", "Chains app", "the Chains". In a sentence:
"Score it in Chains." The sound of a disc hitting chains is the whole brand — the moment the putt drops.

## 2. The one line
**Disc golf, with your crew.** (already the app's tagline). Longer: *Score your rounds, put your name on
every course, run a league with your friends.*

Supporting lines (pick one per surface, never stack them):
- Every hole has a name on it. Is it yours?
- Think you own this course? Prove it.
- Your rounds, your trophies, your course records — and your friends' too.

## 3. Voice
Plain, direct, a little competitive, never cute. We talk like a good cardmate: short sentences, real
disc golf words (birdie, card, ace, layout), no slang invented for the app, no exclamation marks in a row,
no "king/queen/crown/legend" (names on the course are earned, not crowned). Numbers over adjectives:
"−4 at Otterburn" beats "an amazing round". We never trash other apps by name. We never promise what the
app doesn't do yet.

## 4. Colour (the app's own CSS variables — use these exact values)
| Role | Name | Hex |
|---|---|---|
| Accent, text-free (bars, dots, rings) | ace-500 | `#FF5A1F` |
| Action fill under white text | ace-700 | `#C23E10` (5.3:1) |
| Action pressed | ace-800 | `#A6330C` |
| Brand green (good, under par) | fairway-700 | `#205539` |
| Green mid | fairway-500 | `#3A8657` |
| Dark background (hero, stickers) | pine-800 | `#16261E` |
| Darker | pine-700 | `#1C3A2A` |
| Light background | bone-50 | `#FBFAF6` |
| Light panel | bone-100 | `#F5F2EB` |
| Neutral text on light | chain-800 | `#2E3833` |
| Muted text | chain-500 | `#7C8882` |
| Gold (tiers, records) | gold-600 | `#B8860B` |

Rules: one orange thing per surface. White text only on ace-700 or darker (ace-500 measures 3.1:1). Green is the brand, orange is the action. Black-on-white body text.
No gradients in print. No purple, no blue.

## 5. Type
- Display: **Saira Condensed** 700/800, uppercase, tight — headlines, numbers that shout.
- Text: **Archivo** 400/600/700 — everything readable.
- Numbers in tables: **JetBrains Mono**.
(Google Fonts, all free; the app already loads them.)

## 6. Logo
The wordmark is "CHAINS" in Saira Condensed 800, uppercase, tracked 0.02em, in fairway-700 on light or
bone-50 on dark. The app icon is the existing chain-link mark on pine-800 (generated in the app's
manifest code). Don't redraw it per surface; don't add a disc, a basket, or a crown. Minimum clear space =
the height of the C. Never stretch, outline, or put it on orange.

## 7. Stickers (the first promotion)
3 × 3 in, pine-800 background, bone-50 text, one orange line, QR code centred. The QR opens the app at
that course (`https://bonnaroo.github.io/chains-app/#course=<courseId>`); the first run shows the course
page, so a stranger lands on the names already on that course.
Copy (pick one per sticker): "Think you own this course? Prove it." · "Every hole here has a name on it.
Is it yours?" · "Score it in Chains. Free."
Small print: "Chains · disc golf, with your crew". Nothing else. Source file: `chains-app/stickers/`.

## 8. Website
One page (`chains-app/about.html` — served at https://bonnaroo.github.io/chains-app/about.html):
what it is in one line, three feature blocks (Score · Names on the course · Leagues), one button
"Open Chains", the QR, and a footer with the data policy in two sentences. No screenshots of other apps,
no stock photos. Real screenshots only, from the app, on a phone frame.

## 9. Store listing (when we get there)
Name: Chains. Subtitle: Disc golf, with your crew. Keywords: disc golf, scorecard, league, course,
frisbee golf. Category: Sports. Age: 4+. Privacy: data linked to you = email, name, scores you enter.

## 10. Don'ts
No emoji in brand copy. No "gamified". No "AI". No "revolutionary". No UDisc comparisons or data. No
player names or scores in marketing without asking them.
