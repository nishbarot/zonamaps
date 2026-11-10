/* Runs the lot math (app/lotmath.js) over every lot and prints what it found.
   Use it after changing lotmath.js or the "lot" blocks in app/data/rules.json:
     node tools/check_lots.js            summary
     node tools/check_lots.js <parcel>   one lot in full */
const path=require('path'),D=path.join(__dirname,'..','app');
const Z=require(path.join(D,'lotmath.js'));
const P=require(path.join(D,'data','parcels.json')),B=require(path.join(D,'data','buildings.json')),R=require(path.join(D,'data','rules.json'));
const t0=Date.now(),ix=Z.index(P,B),t1=Date.now();
const one=process.argv[2];
if(one){const pr=ix.lots[one]&&ix.lots[one].pr;if(!pr){console.error('No such parcel');process.exit(1);}console.log(JSON.stringify(Z.analyse(ix,one,(R.draft[pr.draft]||{}).lot),null,1));process.exit(0);}
const n={lots:0,ruled:0,ok:0},whyN={},st={},most={},kinds={corner:0,through:0,outside:0};let bad=0;
P.features.forEach(f=>{n.lots++;const pr=f.properties,L=(R.draft[pr.draft]||{}).lot;if(!L)return;n.ruled++;
  const m=Z.analyse(ix,pr.id,L);
  if(!m.ok){whyN[m.why]=(whyN[m.why]||0)+1;return;}
  n.ok++;most[m.most]=(most[m.most]||0)+1;if(m.corner)kinds.corner++;if(m.through)kinds.through++;if(m.outside)kinds.outside++;
  m.choices.forEach(c=>{const k=c.k+':'+c.state+(c.tight?'(no room)':'');st[k]=(st[k]||0)+1;
    if(c.ex&&c.k!=='apartments'&&c.state!=='no'){const q=c.ex;if(!(q.u1>q.u0&&q.v1>q.v0)||[[q.u0,q.v0],[q.u1,q.v0],[q.u1,q.v1],[q.u0,q.v1]].some(p=>!inside(p,m.build))){bad++;if(bad<6)console.log('example outside the buildable area:',pr.id,c.k);}}});
});
function inside(p,r){let s=null;for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length],c=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);if(Math.abs(c)<0.2)continue;if(s===null)s=c>0;else if((c>0)!==s)return false;}return true;}
console.log('index '+(t1-t0)+' ms, all lots '+(Date.now()-t1)+' ms');
console.log(n.lots+' lots, '+n.ruled+' in a district with lot rules, '+n.ok+' get a lot model');
console.log('no model:',whyN);console.log('most homes:',most);console.log('kinds:',kinds);console.log('choices:',st);
if(bad){console.error(bad+' examples sit outside the buildable area');process.exit(1);}
