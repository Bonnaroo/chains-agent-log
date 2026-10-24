import sys,re,zlib,base64,gzip,io,json,hashlib,urllib.request,subprocess,os
"""build.py vNNN <test.html|index.html> "msg" [--babel]
v537+: JSX modules are compiled with esbuild at build time and Babel standalone (640 KB gzipped, plus
seconds of compile on every phone load) is dropped from the bundle. --babel builds the old way."""
ver,target,msg=sys.argv[1],sys.argv[2],sys.argv[3]; LEGACY='--babel' in sys.argv
mods={60:'module_060.js',8:'module_008.js',46:'module_046.js',24:'module_024.js',57:'module_057.js',42:'module_042.js',38:'module_038.js',45:'module_045.js',32:'module_032.js',31:'module_031.js',70:'module_070.js',68:'module_068.js',17:'module_017.js',19:'module_019.js',47:'module_047.js',58:'module_058.js',41:'module_041.js'}
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
compiled={}
for idx,fn in mods.items():
    u=ids[idx]; src=open('/tmp/chains/mods/'+fn,encoding='utf-8').read(); out=src if LEGACY else jsx(src)
    man[u]['data']=gz(out); man[u]['compressed']=True; compiled[u]=out
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
T=open('/tmp/chains/tok').read().strip()
def req(url,data=None,method='GET',raw=False):
    r=urllib.request.Request(url,data=data,method=method,headers={'Authorization':'token '+T,'Content-Type':'application/json','Accept':'application/vnd.github.raw' if raw else 'application/vnd.github+json'})
    return urllib.request.urlopen(r).read() if raw else json.load(urllib.request.urlopen(r))
cur=req('https://api.github.com/repos/Bonnaroo/chains-app/contents/'+target); body=out.encode('utf-8')
res=req('https://api.github.com/repos/Bonnaroo/chains-app/contents/'+target,data=json.dumps({'message':target+': '+ver+' '+msg,'content':base64.b64encode(body).decode(),'sha':cur['sha']}).encode(),method='PUT')
b=req('https://api.github.com/repos/Bonnaroo/chains-app/git/blobs/'+res['content']['sha'],raw=True)
print(target,ver,'commit',res['commit']['sha'][:8],'blob ok',hashlib.sha256(b).hexdigest()==hashlib.sha256(body).hexdigest())
