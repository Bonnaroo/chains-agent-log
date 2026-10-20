# Playbook — Bug Report Processing (Watcher intake -> Dispatcher routing)

1. Watcher: GET Firebase /bugReports. For each report without "seen":true — this is the fingerprint source
   (firebase key). Do not re-process a key already marked seen.
2. Watcher: PATCH the report to set "seen":true (never delete the record).
3. Watcher: hand off to Dispatcher via a new Issue (or Dispatcher does this step directly reading the same
   Firebase node) — either way, exactly ONE Issue per real report, labeled `source:in-app`, `type:bug`, priority
   assigned per routing.md's rules (a real user hitting a real problem outranks routine backlog).
4. Issue body must quote the actual report text, screen/section if given, and the Firebase key for traceability.
5. "Done when" on the Issue: the reported issue no longer reproduces on live production (functional verification,
   see production-verification.md) AND it's actually deployed.
6. An Issue open for longer than one Dispatcher shift with no action is itself a signal — Dispatcher escalates.
