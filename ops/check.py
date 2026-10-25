#!/usr/bin/env python3
"""check.py — run at session start and end. Measures instead of trusting prose.
Needs: /tmp/chains with build.py, mods/, blob_ids.json, node_modules (esbuild), tok (optional for docs check)."""
import re, subprocess, hashlib, urllib.request, json, os, sys
W = "/tmp/chains"; ok = True
def say(s): print(s)
def fail(s):
    global ok; ok = False; print("FAIL  " + s)
live = urllib.request.urlopen("https://bonnaroo.github.io/chains-app/index.html").read()
lv = re.search(rb'CHAINS_VERSION = \\"(v\d+)', live); lv = lv.group(1).decode() if lv else "?"
say("live index.html is " + lv)
# 1. cold start: build the live version locally from src + live base and compare
try:
    open(W + "/app_base.html", "wb").write(live)
    out = subprocess.run([sys.executable, W + "/build.py", lv, "local", "check"], capture_output=True, text=True, cwd=W)
    built = open(W + "/app_" + lv + ".html", "rb").read()
    if hashlib.md5(built).hexdigest() == hashlib.md5(live).hexdigest(): say("COLD START OK (local build of " + lv + " == live byte for byte)")
    else: fail("local build of " + lv + " differs from live — src/ or build.py is not what shipped; do not ship until you know why")
except Exception as e: fail("cold start build failed: " + str(e)[:200])
# 2. static checks on every module in the build set
try:
    mods = re.search(r"mods=\{([^}]*)\}", open(W + "/build.py").read()).group(1)
    files = re.findall(r"'(module_\d+\.js)'", mods); bad = []
    for f in files:
        c = subprocess.run([W + "/node_modules/.bin/esbuild", W + "/mods/" + f, "--loader:.js=jsx", "--target=es2018", "--log-level=error"], capture_output=True, text=True)
        if c.returncode: bad.append(f + " (syntax)"); continue
        open("/tmp/_c.js", "w").write(c.stdout)
        t = subprocess.run(["node", W + "/tdz.js", "/tmp/_c.js"], capture_output=True, text=True).stdout.strip()
        if t != "clean": bad.append(f + " (" + t.splitlines()[0] + ")")
    if bad: fail("modules not clean: " + "; ".join(bad))
    else: say("STATIC OK (" + str(len(files)) + " modules: esbuild + tdz clean)")
except Exception as e: fail("static checks errored: " + str(e)[:200])
# 3. docs agree with live
try:
    tok = open(W + "/tok").read().strip() if os.path.exists(W + "/tok") else None
    H = {"User-Agent": "chains-check"}; H.update({"Authorization": "token " + tok} if tok else {}); H["Accept"] = "application/vnd.github.raw"
    def gh(p): return urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/Bonnaroo/chains-agent-log/contents/" + p, headers=H)).read().decode()
    h = gh("HANDOFF.md"); m = re.search(r"\*\*Live:\*\* index\.html \*\*(v\d+)\*\*", h)
    if not m or m.group(1) != lv: fail("HANDOFF Live line says " + (m.group(1) if m else "?") + " but live is " + lv)
    st = gh("ops/STATE.md"); m2 = re.search(r"index\.html: \*\*(v\d+)\*\*", st)
    if not m2 or m2.group(1) != lv: fail("ops/STATE.md says " + (m2.group(1) if m2 else "?") + " but live is " + lv)
    log = gh("AGENT_LOG.md")
    if lv not in log: fail("AGENT_LOG.md has no entry mentioning " + lv)
    todo = gh("ops/TODO.md"); claims = re.findall(r"`doing ([^`]+)`", todo)
    say("claims in TODO: " + (", ".join(claims) if claims else "none"))
    if ok: say("DOCS OK")
except Exception as e: fail("docs check errored (token missing?): " + str(e)[:160])
print("ALL GREEN" if ok else "NOT GREEN — fix before shipping")
sys.exit(0 if ok else 1)
