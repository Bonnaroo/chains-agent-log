# CAPABILITIES — what each AI setup can do, and how to verify when it can't

| Setup | Shell + Python/Node | GitHub Contents API (token) | Browser harness signed in as Will | Can verify a screen? |
|---|---|---|---|---|
| Claude Cowork on Will's PC (Claude-in-Chrome extension) | yes | yes | yes (iframe of test.html) | yes — drive it, read console |
| Claude / ChatGPT / other with a code sandbox but no browser on Will's PC | yes | yes | no | static checks only → **Will tries test.html on his phone**; promote after he confirms |
| Local model (Ollama/Hermes) with shell on Will's PC | yes | yes | maybe (if a browser tool exists) | as above |
| Chat-only model, no tools | no | no | no | can plan, review diffs, write docs; cannot build or ship |

Rules that follow from this:
- **Static checks are mandatory for everyone**: esbuild syntax (`--loader:.js=jsx`), `node ops/tdz.js`
  on the compiled module, `python3 ops/check.py`.
- **Promotion to index.html needs a real check** of the changed screen: by the harness, or by Will on his
  phone. "It compiled" is not a check.
- If you cannot build at all, do not edit `src/`. Write findings and recipes instead.
- Anonymous Firebase reads (START_HERE §5) work from any shell; writes need Will's session or the test account.
