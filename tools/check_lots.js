/* Runs the lot math (app/lotmath.js) over every lot and prints what it found.
   Use it after changing lotmath.js or the "lot" blocks in app/data/rules.json:
     node tools/check_lots.js            summary
     node tools/check_lots.js <parcel>   one lot in full */
const path=require('path'),D=path.join(__dirname,'..','app');
const Z=require(path.join(D,'lotmath.js'));
const P=require(path.join(D,'data','parcels.json')),B=require(path.join(D,'data','buildings.json')),R=require(path.join(D,'data','rules.json'));
const t0=Date.now(),ix=Z.index(P,B),t1=Date.now();
const one=process.argv[2];
if(one){const pr=ix.lots[one]&&ix.lots[one].pr;if(!pr){console.error('No such parcel');process.exit(1);}console.log(JSON.stringify(Z.analyse(ix,one,(R.draft[pr.draft]||{}).lot,(R.draft[pr.draft]||{}).use),null,1));process.exit(0);}
const n={lots:0,ruled:0,ok:0,full:0,plain:0},whyN={},plainN={},st={},most={},kinds={corner:0,through:0,outside:0},byD={};let bad=0;
P.features.forEach(f=>{n.lots++;const pr=f.properties,D=R.draft[pr.draft]||{},L=D.lot;if(L&&L.types)n.ruled++;
  const m=Z.analyse(ix,pr.id,L,D.use),d=byD[pr.draft||'none']||(byD[pr.draft||'none']={lots:0,full:0,plain:0,none:0});d.lots++;
  if(!m.ok){whyN[m.why]=(whyN[m.why]||0)+1;d.none++;return;}
  n.ok++;if(m.plain){n.plain++;d.plain++;plainN[m.why]=(plainN[m.why]||0)+1;}else{n.full++;d.full++;}
  most[m.most]=(most[m.most]||0)+1;if(m.corner)kinds.corner++;if(m.through)kinds.through++;if(m.outside)kinds.outside++;
  m.choices.forEach(c=>{const k=(m.plain?'plain ':'')+c.k+':'+c.state+(c.tight?'(no room)':'');st[k]=(st[k]||0)+1;
    /* an example must sit inside the yard lines it was drawn for */
    if(c.ex&&c.build&&c.listed!==false&&c.state!=='no'){const q=c.ex;if(!(q.u1>q.u0&&q.v1>q.v0)||[[q.u0,q.v0],[q.u1,q.v0],[q.u1,q.v1],[q.u0,q.v1]].some(p=>!inside(p,c.build))){bad++;if(bad<6)console.log('example outside the buildable area:',pr.id,c.k);}}});
});
function inside(p,r){let s=null;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],c=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);if(Math.abs(c)<0.2)continue;if(s===null)s=c>0;else if((c>0)!==s)return false;}return true;}
console.log('index '+(t1-t0)+' ms, all lots '+(Date.now()-t1)+' ms');
console.log(n.lots+' lots, '+n.ruled+' in a district with building rules, '+n.ok+' get a lot model: '+n.full+' with yard lines, '+n.plain+' plain');
console.log('no model:',whyN);console.log('plain because:',plainN);console.log('by district:');Object.keys(byD).sort().forEach(k=>console.log('  '+k.padEnd(6),JSON.stringify(byD[k])));
console.log('most homes:',most);console.log('kinds:',kinds);console.log('choices:',st);
if(bad){console.error(bad+' examples sit outside the buildable area');process.exit(1);}
