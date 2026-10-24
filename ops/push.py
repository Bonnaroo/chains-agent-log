#!/usr/bin/env python3
"""push.py <repo> <path-in-repo> <local-file> "<msg>"  — create/update one file via the Contents API."""
import sys,json,base64,urllib.request
repo,path,local,msg=sys.argv[1:5]
tok=open('/tmp/chains/tok').read().strip()
H={"Authorization":"token "+tok,"User-Agent":"chains-build","Accept":"application/vnd.github+json"}
url=f"https://api.github.com/repos/Bonnaroo/{repo}/contents/{path}"
sha=None
try:
    r=urllib.request.urlopen(urllib.request.Request(url,headers=H)); sha=json.load(r)["sha"]
except Exception: pass
body={"message":msg,"content":base64.b64encode(open(local,'rb').read()).decode()}
if sha: body["sha"]=sha
req=urllib.request.Request(url,data=json.dumps(body).encode(),headers=H,method="PUT")
d=json.load(urllib.request.urlopen(req)); print(repo,path,d["commit"]["sha"][:8])
