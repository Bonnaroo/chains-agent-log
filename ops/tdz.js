const fs=require('fs'); const espree=require('espree'); const eslintScope=require('eslint-scope');
const file=process.argv[2]; const src=fs.readFileSync(file,'utf8');
const ast=espree.parse(src,{ecmaVersion:2022,sourceType:'script',range:true,loc:true});
const parent=new Map(); (function walk(n,p){ if(!n||typeof n.type!=='string') return; parent.set(n,p); for(const k of Object.keys(n)){ if(k==='parent') continue; const v=n[k]; if(Array.isArray(v)) v.forEach(c=>c&&typeof c.type==='string'&&walk(c,n)); else if(v&&typeof v.type==='string') walk(v,n);} })(ast,null);
const SYNC=/^(map|forEach|filter|reduce|sort|find|some|every|flatMap|useMemo|useState|useReducer|useSyncExternalStore|Object\.keys|then)$/;
function calleeName(c){ if(!c) return ''; if(c.type==='Identifier') return c.name; if(c.type==='MemberExpression'&&c.property&&c.property.type==='Identifier') return c.property.name; return ''; }
function isSyncFn(node){ const p=parent.get(node); if(!p) return false;
  if(p.type==='CallExpression'&&p.callee===node) return true; // IIFE
  if(p.type==='CallExpression'&&p.arguments.includes(node)){ const n=calleeName(p.callee); if(n==='then') return false; return SYNC.test(n); }
  return false; }
const sm=eslintScope.analyze(ast,{ecmaVersion:2022,sourceType:'script'});
function fnScope(s){ while(s){ if(s.type==='function'){ if(isSyncFn(s.block)) { s=s.upper; continue; } return s; } if(s.type==='module'||s.type==='global') return s; s=s.upper; } return s; }
const out=[];
for(const scope of sm.scopes){ for(const v of scope.variables){ const def=v.defs[0]; if(!def||def.type!=='Variable'||!def.parent||!(def.parent.kind==='const'||def.parent.kind==='let')) continue; const vf=fnScope(scope);
  for(const ref of v.references){ if(ref.identifier.range[0]<def.node.range[0] && fnScope(ref.from)===vf && !ref.init){ out.push(`${ref.identifier.loc.start.line}:${ref.identifier.loc.start.column} '${v.name}' used before its ${def.parent.kind} on line ${def.node.loc.start.line}`); } } } }
console.log(out.length? out.join('\n') : 'clean');
