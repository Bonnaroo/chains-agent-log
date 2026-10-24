# src/ — the JSX sources of the app's own modules (since v537)

The live `index.html` carries these modules **compiled** (esbuild, no JSX). Edit the files here, never the
compiled blobs. Blob index = file number (`module_045.js` = manifest entry 45; the order is the manifest's).
Vendor blobs (React, Firebase, fonts…) are not here — the workbench takes them from the live index.html.

Workflow: copy these into `/tmp/chains/mods/`, edit, `esbuild --loader:.js=jsx` syntax check, `node
ops/tdz.js` on the compiled output, `python3 ops/build.py vNNN test.html "msg"`, verify, promote, then
push the changed source files back here (`push.py chains-agent-log src/module_NNN.js ...`). A build
without pushing the source here loses the JSX for the next session.
