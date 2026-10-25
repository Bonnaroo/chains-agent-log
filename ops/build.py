import sys,re,zlib,base64,gzip,io,json,hashlib,urllib.request,subprocess,os
"""build.py vNNN <test.html|index.html|local> "msg" [--babel] [--dry]
Needs /tmp/chains/agent (your agent name) for any push; see ops/PROTOCOL.md.
v537+: JSX modules are compiled with esbuild at build time and Babel standalone (640 KB gzipped, plus
seconds of compile on every phone load) is dropped from the bundle. --babel builds the old way."""
ver,target,msg=sys.argv[1],sys.argv[2],sys.argv[3]; LEGACY='--babel' in sys.argv
mods={12:'module_012.js',60:'module_060.js',8:'module_008.js',46:'module_046.js',24:'module_024.js',57:'module_057.js',42:'module_042.js',38:'module_038.js',45:'module_045.js',32:'module_032.js',31:'module_031.js',70:'module_070.js',68:'module_068.js',17:'module_017.js',19:'module_019.js',47:'module_047.js',58:'module_058.js',41:'module_041.js'}
base=open('/tmp/chains/app_base.html',encoding='utf-8').read()
ESB='/tmp/chains/node_modules/.bin/esbuild'
def gz(src):
    b=io.BytesIO()
    with gzip.GzipFile(fileobj=b,mode='wb',mtime=0,compresslevel=9) as f: f.write(src.encode('utf-8'))
    return base64.b64encode(b.getvalue()).decode()
def ungz(data,comp=True): return (zlib.decompress(base64.b64decode(data),16+zlib.MAX_WBITS) if comp else base64.b64decode(data)).decode('utf-8')
def get(u): return ungz(man[u]['data'],man[u].get('compressed',True))
def jsx(src):
    p=subprocess.run([ESB,'--loader=jsx','--target=es2018','--log-level=error'],input=src.encode('utf-8'),capture_output=True)
    if p.returncode!=0: raise SystemExit('esbuild failed: '+p.stderr.decode()[:400])
    return p.stdout.decode('utf-8')
# --- manifest + template
mi=base.find('<script type="__bundler/manifest">'); mj=base.find('</script>',mi); man_txt=base[mi+len('<script type="__bundler/manifest">'):mj]
man=json.loads(man_txt); ids=list(man.keys())
try:
    _orig=json.load(open('/tmp/chains/blob_ids.json')); _orig=[_orig[str(i)] for i in range(len(_orig))]
    if len(ids)!=len(_orig) and all(u in man for u in _orig if u in man): ids=_orig   # base without Babel: keep the original numbering
except Exception: pass
ti=re.search(r'<script type="__bundler/template"[^>]*>',base).end(); tj=base.find('</script',ti)
tpl=json.loads(base[ti:tj])
# --- module overrides: every edited module is run through esbuild (JSX → JS; plain JS passes through unchanged)
compiled={}; touched=[]
for idx,fn in mods.items():
    u=ids[idx]; src=open('/tmp/chains/mods/'+fn,encoding='utf-8').read(); out=src if LEGACY else jsx(src)
    try:
        if get(u)!=out: touched.append(idx)
    except Exception: touched.append(idx)
    man[u]['data']=gz(out); man[u]['compressed']=True; compiled[u]=out
print('modules changed vs the base:',sorted(touched) or 'none')
if not LEGACY:
    # legacy base (pre-v537): compile the remaining text/babel modules and drop Babel; a v537+ base has neither
    for m in re.finditer(r'<script type="text/babel" src="([0-9a-f-]{36})">',tpl):
        u=m.group(1)
        if u in compiled: continue
        src=get(u); out=jsx(src); man[u]['data']=gz(out); man[u]['compressed']=True; compiled[u]=out
    tpl=re.sub(r'<script type="text/babel" src="([0-9a-f-]{36})">',r'<script src="\1">',tpl)
    im=re.search(r'<script type="text/babel" data-presets="env,react">(.*?)</script>',tpl,re.S)
    if im: tpl=tpl[:im.start()]+'<script>'+jsx(im.group(1))+'</script>'+tpl[im.end():]
    babel=[u for u in ids if man.get(u) and man[u].get('mime','').endswith('javascript') and 'transformScriptTags' in get(u)]
    for bu in babel: tpl=re.sub(r'<script src="'+bu+r'"[^>]*></script>\s*','',tpl); del man[bu]
    assert not re.search(r'<script type="text/babel"[^>]*src="[0-9a-f-]{36}"', tpl) and 'data-presets' not in tpl
tpl=re.sub(r'CHAINS_VERSION = "v[0-9]+','CHAINS_VERSION = "'+ver,tpl)
tpl=tpl.replace('<title>Chains · Fantasy DGPT 2026</title>','<title>Chains</title>')
assert ('CHAINS_VERSION = "'+ver) in tpl
tpl_json=json.dumps(tpl,ensure_ascii=False).replace('</','<\\u002F')
out=base[:mi+len('<script type="__bundler/manifest">')]+json.dumps(man,separators=(',',':'))+base[mj:ti]+'\n'+tpl_json+'\n  '+base[tj:]
# verify
man2=json.loads(out[out.find('<script type="__bundler/manifest">')+len('<script type="__bundler/manifest">'):out.find('</script>',out.find('<script type="__bundler/manifest">'))])
for idx,fn in mods.items():
    u=ids[idx]; want=compiled.get(u, open('/tmp/chains/mods/'+fn,encoding='utf-8').read()); assert ungz(man2[u]['data'],man2[u].get('compressed',True))==want, 'blob mismatch '+fn
open('/tmp/chains/app_'+ver+'.html','w',encoding='utf-8').write(out)
print('built',len(out)//1024,'KB','compiled',len(compiled),'modules','babel dropped' if not LEGACY else 'legacy')
if target=='local': raise SystemExit(0)
# ---------------------------------------------------------------------------------------------------
# v555 coordination (ops/PROTOCOL.md §D): every push is attributed to an agent, test.html is a single
# shared staging slot with a lock in ops/STATE.md, versions must move forward, and promoting to
# index.html rewrites the Live lines in HANDOFF.md and ops/STATE.md itself (no hand edit to drift).
import datetime,os
T=open('/tmp/chains/tok').read().strip()
AGENT=(os.environ.get('CHAINS_AGENT') or (open('/tmp/chains/agent').read().strip() if os.path.exists('/tmp/chains/agent') else '')).strip()
if not AGENT: raise SystemExit('ABORT: name yourself first — echo "<agent-name>:<tier>" > /tmp/chains/agent (tiers: full | limited; e.g. claude-code:full, hermes-local:limited)')
TIER='limited'
if ':' in AGENT: AGENT,TIER=AGENT.split(':',1); TIER=TIER.strip().lower()
if TIER not in ('full','limited'): raise SystemExit('ABORT: tier must be full or limited (agent file: name:tier)')
# limited tier (ops/PROTOCOL.md §F): may stage to test.html only, and only modules on the limited list
LIMITED_MODS={8,12,17,19,24,32,38,41,42,46,57,58}   # engines/leaf modules; NOT 31 (rounds), 45 (PlayView), 47 (shell), 60 (auth), 68 (leagues/friends), 70 (chat)
if TIER=='limited':
    if target=='index.html': raise SystemExit('ABORT: limited-tier agents do not promote to index.html. Leave it on test.html, tell Will, and a full-tier agent (or Will) promotes.')
    bad=[i for i in touched if i not in LIMITED_MODS]
    if bad: raise SystemExit('ABORT: limited-tier agents may not change modules '+str(sorted(bad))+' (rounds engine, PlayView, shell, auth, leagues/friends, chat). Allowed: '+str(sorted(LIMITED_MODS))+'. Put the change in ops/TODO.md for a full-tier agent instead.')
DRY='--dry' in sys.argv
def req(url,data=None,method='GET',raw=False):
    r=urllib.request.Request(url,data=data,method=method,headers={'Authorization':'token '+T,'Content-Type':'application/json','Accept':'application/vnd.github.raw' if raw else 'application/vnd.github+json','User-Agent':'chains-build'})
    return urllib.request.urlopen(r).read() if raw else json.load(urllib.request.urlopen(r))
AL='https://api.github.com/repos/Bonnaroo/chains-agent-log/contents/'
def gh_get(path): return req(AL+path,raw=True).decode('utf-8')
def gh_put(path,text,message):
    if DRY: print('DRY would write',path,'::',message); return
    try: sha=req(AL+path)['sha']
    except Exception: sha=None
    body={'message':message,'content':base64.b64encode(text.encode('utf-8')).decode()}
    if sha: body['sha']=sha
    req(AL+path,data=json.dumps(body).encode(),method='PUT')
now=datetime.datetime.utcnow(); nowS=now.strftime('%Y-%m-%d %H:%MZ'); today=now.strftime('%Y-%m-%d')
vn=int(ver[1:])
state=gh_get('ops/STATE.md'); handoff=gh_get('HANDOFF.md')
mLive=re.search(r'index\.html: \*\*(v\d+)\*\*',state); liveV=int(mLive.group(1)[1:]) if mLive else 0
mStg=re.search(r'^- Staging: (.*)$',state,re.M); stg=(mStg.group(1).strip() if mStg else 'free')
# staging lock: "free" or "<agent> vNNN since YYYY-MM-DD HH:MMZ"
held=re.match(r'(\S+?)(?::\w+)? (v\d+) since (\d{4}-\d\d-\d\d \d\d:\d\dZ)',stg)
if held and held.group(1)!=AGENT:
    age=(now-datetime.datetime.strptime(held.group(3),'%Y-%m-%d %H:%MZ')).total_seconds()/3600
    if age<2: raise SystemExit('ABORT: test.html is held by '+held.group(1)+' ('+held.group(2)+', '+('%.1f'%age)+' h ago). Wait, or coordinate in ops/STATE.md.')
    print('note: taking over a stale staging lock from',held.group(1),'(%.1f h)'%age)
if target=='test.html' and vn<=liveV: raise SystemExit('ABORT: '+ver+' is not above live v'+str(liveV)+' — use v'+str(liveV+1))
if target=='index.html':
    if vn!=liveV+1 and vn!=liveV: raise SystemExit('ABORT: promote '+ver+' but live is v'+str(liveV)+' (expected v'+str(liveV+1)+'). Someone shipped in between — re-pull src/ and rebuild.')
    if not (held and held.group(1)==AGENT and held.group(2)==ver): print('warning: promoting '+ver+' without having staged it as '+AGENT+' (staging: '+stg+')')
# --- push the app file
body=out.encode('utf-8')
if DRY: print('DRY would push',target,ver)
else:
    cur=req('https://api.github.com/repos/Bonnaroo/chains-app/contents/'+target)
    res=req('https://api.github.com/repos/Bonnaroo/chains-app/contents/'+target,data=json.dumps({'message':target+': '+ver+' '+msg+' ['+AGENT+':'+TIER+']','content':base64.b64encode(body).decode(),'sha':cur['sha']}).encode(),method='PUT')
    print('tier',TIER)
    b=req('https://api.github.com/repos/Bonnaroo/chains-app/git/blobs/'+res['content']['sha'],raw=True)
    print(target,ver,'commit',res['commit']['sha'][:8],'blob ok',hashlib.sha256(b).hexdigest()==hashlib.sha256(body).hexdigest(),'by',AGENT)
# --- update the board
if target=='test.html':
    state2=re.sub(r'^- Staging: .*$','- Staging: '+AGENT+':'+TIER+' '+ver+' since '+nowS,state,flags=re.M) if mStg else state.replace('## In flight','- Staging: '+AGENT+':'+TIER+' '+ver+' since '+nowS+'\n\n## In flight',1)
    gh_put('ops/STATE.md',state2,'STATE: staging '+ver+' by '+AGENT)
else:
    state2=re.sub(r'index\.html: \*\*v\d+\*\* \([^)]*\) · test\.html: v\d+','index.html: **'+ver+'** ('+today+') · test.html: '+ver,state)
    state2=re.sub(r'^- Staging: .*$','- Staging: free',state2,flags=re.M)
    gh_put('ops/STATE.md',state2,'STATE: live '+ver+' ('+AGENT+')')
    h2=re.sub(r'- \*\*Live:\*\* index\.html \*\*v\d+\*\* \([^)]*\)\. Staging test\.html v\d+\.','- **Live:** index.html **'+ver+'** ('+today+'). Staging test.html '+ver+'.',handoff)
    if h2!=handoff: gh_put('HANDOFF.md',h2,'HANDOFF: live '+ver+' ('+AGENT+')')
    else: print('warning: HANDOFF Live line not found — update it by hand')
    print('board updated: live',ver,'by',AGENT,'— now write the AGENT_LOG entry and tick ops/TODO.md')
