# Verify with the Chrome harness (Claude-in-Chrome on Will's PC)
1. `tabs_context_mcp` (createIfEmpty) → a tab id. Navigate it to `https://bonnaroo.github.io/chains-app/test.html?harness=N#play` (N = any new number; the page is only a host).
2. `javascript_exec`: replace the document with a 400×760 `<iframe id="ph" src="https://bonnaroo.github.io/chains-app/test.html?vNNN&r=<Date.now()>#play">`. Wait ~16 s.
3. Drive it: `const w=document.getElementById('ph').contentWindow, D=w.document;` buttons by text, `await sleep()`, read `D.body.innerText`. Hook `w.console.error` and `w.onerror` into an array and report its length at the end.
4. Output rules: tool results containing `=`, `;` or `:` next to long strings get `[BLOCKED]` — `.replace(/[=;:]/g,' ')` before returning; keep returns under ~1500 chars.
5. Renderer freezes after long scripts: navigate to a fresh `?harness=N+1` URL and rebuild the iframe. Screenshots of this tab usually time out — don't rely on them.
6. Globals available in the iframe: `ChainsRounds`, `ChainsTakeover`, `ChainsNames`, `ChainsBadges`, `ChainsCourseLeagues`, `ChainsCallouts`, `ChainsFB.db`, `ChainsAuth`, `ChainsHome`, `ChainsGoals`, `ChainsFavs`.
7. Clean up (HOWTO/clean-test-data.md) before you finish.
