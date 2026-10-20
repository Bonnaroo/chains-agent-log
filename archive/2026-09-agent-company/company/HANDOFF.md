# CHAINS — START HERE (handoff for a fresh chat)

Paste this at the top of a new conversation:

> Read https://raw.githubusercontent.com/Bonnaroo/chains-agent-log/main/company/HANDOFF.md
> and everything it links to, then tell me where we stand before doing anything.

You are the **Cowork/backend half** of a two-agent team building **Chains**, a disc golf app for
Guillermo (owner). Claude **Design** owns the UI. You own backend, Firebase, rules, data, deploys.
**Work without asking the owner** — decide things yourself, only stop for irreversible calls.

## What Chains is
A 6-person DGPT fantasy league **plus** a personal round-scoring app ("Go Throw"). The owner's target
is **UDisc quality** for scoring, with the differentiator that **your fantasy season and your own game
live in one app** — nobody else does that. Do not chase UDisc's feature count; deepen that link.

## Read these, in order — they are the memory
| File (repo `Bonnaroo/chains-agent-log`) | What it is |
|---|---|
| `company/STATE.md` | measured live facts. Regenerate with `build_state.py`, never hand-edit |
| `company/LOOP_LOG.md` | running narrative — what happened, current item, current phase |
| `company/ROUND_QUEUE.md` | ordered feature queue; when empty it points at `briefs/ROADMAP.md` |
| `company/ACCESS.md` | test accounts, project split, credentials map, backup jobs |
| `company/TRIAGE_AND_AUDIT.md` | what to do when prod breaks + the standing audit plan |
| `company/DESIGN_LOOP.md` | how Design and Cowork work together |

## The workflow (owner's design — follow it)
**ASK -> INSTRUCT -> BUILD.** Never hand Design a solution you invented; it sees the UI, you don't.
1. **Ask**: "How would you build X? Don't build yet. Approach, what needs deciding, what backend you
   need, what already exists."
2. **Instruct**: rule on every question, build AND verify the backend, then write detailed
   instructions **from its approach**. Exhaustive on what/why, loose on how it structures things.
3. **Build**: it builds; you verify markers, run the walkthrough, deploy.
Two scheduled tasks run this: `chains-design-loop` (15 min) and `chains-auditor` (hourly).

## Hard-won rules — violating these has cost real days
- **Verify before every deploy.** The app is gzip+base64 module blobs. **Plain grep gives false
  negatives.** Decompress (`zlib.decompress(base64.b64decode(b), 16+zlib.MAX_WBITS)`) and confirm all
  eight markers: `function authUid()`, `function _indexWrite(`, `Teemu Paakinen`,
  `label: "In the Bag"`, `window.AuthGate`, `ANONYMOUS SESSIONS NO LONGER GRANT ACCESS`,
  `window.ChainsImpact`, `window.ChainsAssets`.
- **Any fix you patch into production MUST also go into Design's source**, or the next export reverts
  it. This happened three times (v447/v449/v451).
- **Back up before changing anything.** Rules, league data, deletions. Record the outgoing sha.
- **Never write to `chains-fantasy` `/league` or `/live`** — that's the live 2026 season. Read-only.
- **Never interrupt Design mid-build.** Do backend work instead; never end a run having done nothing.
- **Never run Design on Fable.** Owner directive.
- CDN lags ~1 min; always cache-bust when verifying.

## WHERE WE STAND (2026-08-05)
Live: **v464**. Phase 1 is ~8/9 done — delete, pre-round cancel, resume, mobile version label, in-app
bug report, registered-field tab, 36h draft window + per-pick clock + autopick, achievements, and all
47 native popups replaced with in-app modals.

## THE THREE THINGS THAT ACTUALLY MATTER RIGHT NOW

**1. `remove()` must clear BOTH round stores. Ship this first.**
Rounds live in **`playRounds/{id}` AND `liveRounds/{id}`** — two separate stores. Delete cleared one,
so the round rebuilt from the other on reload. That is the real "I deleted them and they came back."
On 2026-08-05 I purged both stores (backup: `chains-dgpt-data/data/backups/rounds-prepurge-2026-08-05.json`)
but **the code fix is not in** — the next delete will regress. Also: `_indexWrite` swallows errors and
`remove()` only checks the first job's result, so a partial failure still reports success. Make it
await ALL writes across BOTH stores and surface real failure.

**2. Start-a-round shows people the owner never added as friends.**
Not a friends bug — the picker seeds "recent partners" from previous rounds, and the old name-pick-era
test rounds had `will/kyle/kadey` baked in as players. Purging the rounds cleared it *today*. The real
fix: recent-partners must come from **real friend relationships / rounds you actually played**, never
from stale round docs, and must show nothing when there's no history.

**3. The owner wants it to feel like UDisc.** His words, repeatedly. Go Throw is the weakest surface.
Ask Design to do a UDisc-quality pass on the round flow specifically — that's a Design judgement call,
so **ask it how**, don't prescribe.

## Known-open, with a deadline
`playRounds` is `.write: auth != null`, so `scorePatch` / `joinRequests` / `editHistory` / `practice` /
`notes` all inherit full write access for **any signed-in user**. Firebase rules **cascade and only ADD
permission** — a child rule can never restrict a permissive parent. Real fix = granular per-field rules
replacing the blanket write. Ground truth ruleset:
`company/backups/firebase-rules-chains-app-f38f8.json`.
**Must close before anyone outside the six gets an account.**

Also open: league-code joiners get membership but no `memberId`, so they can't be drafted — the
six-member roster is hardcoded. Fixing that is the **season-data migration**, which must NOT be
attempted mid-season.
