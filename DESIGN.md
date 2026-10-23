# DESIGN.md — the Chains UI rulebook

Read this before building or changing any screen. It exists so the app looks like one app, made by people
who make apps, not like an AI guessing at style. When a rule here conflicts with a quick idea, the rule wins.

## 1. Who it's for and where it's used
Disc golfers, on a phone, outdoors, often in sunlight, one-handed, between throws. So: high contrast, big
targets, the thing you need next is on screen without scrolling, and nothing clever that needs explaining.

## 2. The three references
Apple Human Interface Guidelines (iOS) for navigation, back buttons, tab bars, tap targets and type;
Material 3 where Android differs; and three real apps for feel: **Strava** (stats and social that stay
calm), **AllTrails** (maps with controls out of the way), **Apple Maps** (one accent, lots of white space).
UDisc is a feature reference only, never a visual one.

## 3. Hard rules (an AI must not break these)
- **No emoji as icons.** Icons come from the app's own SVG set (`Icons.*`, module 46 — add there if one is
  missing). Emoji may appear only inside user-made content (a note, a crew emblem the user picked).
- **One accent colour** (`--ace-500` orange) for the primary action on a screen, and one only. Everything
  else is neutral or the fairway green used for "good/under par". No purple, no blue-purple gradients, no
  rainbow chips, no glassy blur panels.
- **One type family** (the app's `--font-sans` for text, `--font-display` for headings and labels,
  `--font-mono` for numbers that line up). Sizes: 11 (caption) · 13 (body small) · 15 (body) · 17 (title) ·
  22+ (hero). Don't invent sizes between them.
- **Spacing on an 8 px grid** (4 allowed inside a component). Card padding 14–16. Section gap 16.
- **Tap targets ≥ 44 × 44 px.** Primary buttons 52–56 px tall. Row height ≥ 56 px.
- **Every screen has a way back**: a back control top-left on pushed screens, or a tab in the bottom bar.
  Never trap the user; never rely on the browser back button.
- **Plain words.** No "king/queen/crown", no jargon, no cute labels. Say what the thing is: "Finish round",
  "Course record", "Your holes". Sentences, not slogans, in helper text.
- **Nothing moves on its own.** No auto-advance, no auto-select, no surprise navigation after a tap. The
  user's tap does one thing, visibly, and stops.
- **No stray text.** Every string rendered is a real word or symbol (no `·`, no debug notes, no
  version numbers in content).
- **Portals for anything fixed** (sheets, bars, modals) — the app container has a CSS transform.

## 4. Structure
- **Bottom bar — five, and only these:** Home · Courses · Play (the raised centre button) · Challenges ·
  More. Nothing else goes in the bar.
- **Home** = greeting, this month's numbers, Start a round, then four tiles (Go Throw · Courses ·
  Leagues · Challenges), then this week, then the feed. Home is a front door, not a dashboard.
- **More** = things used rarely: Profile & account, Friends & messages, Bag, Watch, Season 2026 (Dashboard
  · Standings · Picks · Live Chains), Settings, Sign out. Never duplicate what's already on the bar.
- **Push, don't stack.** A tile opens a screen with a back control; that screen doesn't contain the Home
  tiles again.
- **One screen's worth per tab.** If a page needs more than ~3 screens of scrolling, split it into tabs
  (as the course page does: Course · Holes · Territory · Board).

## 5. Components (use these, don't improvise new ones)
- **Card**: `--bg-elevated`, 1 px `--border-subtle`, radius `--radius-lg`, no shadow unless it floats.
- **Primary button**: full width, 52–56 px, `--ace-500` → `--ace-600` gradient allowed, white display text,
  uppercase. One per screen.
- **Secondary button**: outline, `--border-default`, text `--text-strong`.
- **Row** (list item): icon 24 px in `--fairway-600` · title 15/700 · sub 13 `--text-muted` · chevron right.
- **Stat tile**: number in `--font-mono` 22–26/800, label 11 uppercase `--text-muted`.
- **Chip / tag**: 11–12 px, `--bg-sunken`, text `--text-strong`; the "you" state uses `--ace-500` + white.
- **Segmented control**: `--bg-sunken` track, `--fairway-700` selected pill, 36–40 px tall.
- **Score colours** (the only semantic colours): under par `--score-under` green, par `--fairway-700`,
  over par `--score-over` red. Never use red/green for anything that isn't a score.
- **Hero/ink panel**: dark pine gradient, bone text — one per screen at most, for the one big number.

## 6. Scoring screen specifics
Hole header → owner/target line → map (toggle) → one row per player ([−] [score] [+], par dashed until
tapped) → hole strip → scorecard strip → floating bar (Back · Next / Finish) that always stays clear of
the content and the bottom tabs. Celebrations are short (≤ 2 s), never block a tap.

## 7. Trophies and progress
A reveal shows at most **5** new trophies (highest tier first) with "+N more in your trophy case"; the
case itself shows every ladder with a progress bar to the next tier. Earning should feel rare by month
two: thresholds step up fast after the first tier.

## 8. Copy
Sentence case for everything except display labels (uppercase display font for section headers only).
Numbers use the mono font. Dates read "Wed, Oct 21". Distances in feet. Never exclamation-mark more than
one line per screen.

## 9. Checklist before shipping a screen
Back control present · one primary action · no emoji icons · 8-px spacing · ≥ 44 px targets · reads in
sunlight (contrast ≥ 4.5:1 for text) · nothing fixed outside a portal · tested in the 400-px harness ·
no console errors · words a stranger understands.
