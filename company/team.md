# Chains — Team (one page)

Owner: Guillermo (diamashield@gmail.com) — product authority, approves anything in the "stops and asks" tier.

Three roles. No more, no fewer. See DECISION_POLICY.md for what each may do without asking.

## Dispatcher (automated, hourly)
Owns the queue, not the people. Intake, dedupe, prioritize, mark ready/blocked, self-directed weekly product
review (finds missing back/cancel/confirm buttons, dead ends, etc. and files them), owner-report writer.
Never builds anything. Never writes app code or Firebase data.

## Watcher (automated, background)
Monitors: Firebase bug reports, GitHub/Firebase notification emails, production availability, deploy health,
backup health, automation health. Takes the daily Firebase backup. Periodically opens the live app read-only
to confirm recent changes actually work. Files everything it finds as queue items. Never fixes anything itself.

## Engineer (manual, Guillermo + Claude Design, live Chrome session only)
The only role that changes the live app. Acquires the build lock, builds via Claude Design, exports, commits via
GitHub API, verifies (artifact -> deployment -> functional), records release evidence, releases the lock.

## Why only three
There is exactly one Claude Design project and one browser session possible at a time. Naming more roles
("frontend engineer," "backend engineer," "QA engineer," etc.) doesn't create more real concurrency — it just
adds chatter. Everything that genuinely can run in parallel and unattended (monitoring, backups, queue hygiene)
lives inside Dispatcher/Watcher, which already run as separate scheduled jobs.
