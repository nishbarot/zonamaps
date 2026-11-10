/* zōna lot math. Pure geometry, no drawing: it runs in the browser and in Node (tools/check_lots.js).
   For one lot it works out which side faces the street, where a new building could sit under the
   draft's yard distances, and whether each choice fits: a cottage, a house, a duplex, a fourplex,
   townhomes, apartments, or one larger building with the stories the draft allows. All numbers come
   from the "lot" block of the lot's draft district in data/rules.json. Nothing town-specific lives here.

   Frame used in the results: metres, u runs along the front lot line (left to right when you stand
   in the street and face the lot), v runs from the front lot line into the lot. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ZonaLot=factory();})(this,function(){
'use strict';
var FT=0.3048,SQFT=FT*FT,ACRE=43560;
var TOL_FT=5;        /* lot shapes are rounded to about 1 m, so widths within 5 ft of a limit are too close to call */
var TOL_AREA=0.03;   /* lot sizes come in hundredths of an acre: within 3% of a limit is too close to call */

/* ---------- small geometry helpers (rings are open: no repeated last point) ---------- */
function sub(a,b){return [a[0]-b[0],a[1]-b[1]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1];}
function cross(a,b){return a[0]*b[1]-a[1]*b[0];}
function len(a){return Math.sqrt(a[0]*a[0]+a[1]*a[1]);}
function area(r){var s=0;for(var i=0,n=r.length;i<n;i++){var a=r[i],b=r[(i+1)%n];s+=a[0]*b[1]-b[0]*a[1];}return s/2;}
function centroid(r){var x=0,y=0;r.forEach(function(p){x+=p[0];y+=p[1];});return [x/r.length,y/r.length];}
function inRing(p,r){var ins=false;for(var i=0,j=r.length-1;i<r.length;j=i++){var a=r[i],b=r[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))ins=!ins;}return ins;}
function segDist(p,a,b){var ab=sub(b,a),t=dot(sub(p,a),ab)/(dot(ab,ab)||1);t=Math.max(0,Math.min(1,t));return len(sub(p,[a[0]+ab[0]*t,a[1]+ab[1]*t]));}
function ringDist(p,r){var d=1e9;for(var i=0;i<r.length;i++)d=Math.min(d,segDist(p,r[i],r[(i+1)%r.length]));return d;}
function bbox(r){var b=[1e12,1e12,-1e12,-1e12];r.forEach(function(p){if(p[0]<b[0])b[0]=p[0];if(p[1]<b[1])b[1]=p[1];if(p[0]>b[2])b[2]=p[0];if(p[1]>b[3])b[3]=p[1];});return b;}
/* keep the part of ring r where dot(p,n) <= c (Sutherland-Hodgman, one half-plane) */
function clip(r,n,c){var o=[];for(var i=0;i<r.length;i++){var a=r[i],b=r[(i+1)%r.length],da=dot(a,n)-c,db=dot(b,n)-c;if(da<=0)o.push(a);if((da<0&&db>0)||(da>0&&db<0)){var t=da/(da-db);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return o;}
function clipRect(r,x0,y0,x1,y1){r=clip(r,[1,0],x1);r=clip(r,[-1,0],-x0);r=clip(r,[0,1],y1);return clip(r,[0,-1],-y0);}
/* drop points that sit within tol of the line between their neighbours (rounding jitter, extra points on a straight side) */
function simplify(r,tol){
  r=r.slice();var changed=true;
  while(changed&&r.length>3){changed=false;var best=-1,bd=tol;
    for(var i=0;i<r.length;i++){var a=r[(i+r.length-1)%r.length],b=r[(i+1)%r.length],d=segDist(r[i],a,b);if(d<bd){bd=d;best=i;}}
    if(best>=0){r.splice(best,1);changed=true;}}
  return r;
}
function isConvex(r,tol){for(var i=0;i<r.length;i++){var a=r[i],b=r[(i+1)%r.length],c=r[(i+2)%r.length];if(cross(sub(b,a),sub(c,b))<-tol)return false;}return true;}
/* left and right ends of a convex ring at depth v */
function span(r,v){var lo=1e9,hi=-1e9;for(var i=0;i<r.length;i++){var a=r[i],b=r[(i+1)%r.length];if((a[1]-v)*(b[1]-v)>0)continue;if(a[1]===b[1]){lo=Math.min(lo,a[0],b[0]);hi=Math.max(hi,a[0],b[0]);continue;}var t=(v-a[1])/(b[1]-a[1]),x=a[0]+(b[0]-a[0])*t;if(x<lo)lo=x;if(x>hi)hi=x;}return hi>=lo?[lo,hi]:null;}
function rectRing(q){return [[q.u0,q.v0],[q.u1,q.v0],[q.u1,q.v1],[q.u0,q.v1]];}
function rectIn(q,r){return rectRing(q).every(function(p){return inRing(p,r)||ringDist(p,r)<0.02;});}
function rectGap(q,r){var rr=rectRing(q),d=1e9,i;for(i=0;i<r.length;i++){if(r[i][0]>=q.u0&&r[i][0]<=q.u1&&r[i][1]>=q.v0&&r[i][1]<=q.v1)return 0;d=Math.min(d,ringDist(r[i],rr));}for(i=0;i<4;i++){if(inRing(rr[i],r))return 0;d=Math.min(d,ringDist(rr[i],r));}return d;}
/* smallest rectangle around a ring: {c:[u,v], w, d, ang, fill} with w along the direction ang */
function minRect(r){var best=null,A=Math.abs(area(r));for(var i=0;i<r.length;i++){var e=sub(r[(i+1)%r.length],r[i]),l=len(e);if(l<0.5)continue;var ux=[e[0]/l,e[1]/l],uy=[-ux[1],ux[0]],x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;r.forEach(function(p){var x=dot(p,ux),y=dot(p,uy);if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;});var a=(x1-x0)*(y1-y0);if(!best||a<best.a){var cx=(x0+x1)/2,cy=(y0+y1)/2;best={a:a,c:[ux[0]*cx+uy[0]*cy,ux[1]*cx+uy[1]*cy],w:x1-x0,d:y1-y0,ang:Math.atan2(ux[1],ux[0])};}}
  if(best)best.fill=A/(best.a||1);return best;}

/* ---------- index: metres for every lot and building, and a grid to find what is near a point ---------- */
function outer(g){return g.type==='Polygon'?g.coordinates[0]:null;}
function makeIndex(parcels,buildings){
  var F=parcels.features,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  F.forEach(function(f){var c=(f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.coordinates[0][0])[0];if(c[0]<x0)x0=c[0];if(c[0]>x1)x1=c[0];if(c[1]<y0)y0=c[1];if(c[1]>y1)y1=c[1];});
  var lon0=(x0+x1)/2,lat0=(y0+y1)/2,kx=111320*Math.cos(lat0*Math.PI/180),ky=110574;
  function m(c){return [(c[0]-lon0)*kx,(c[1]-lat0)*ky];}
  function ring(cs){var r=cs.map(m);if(r.length>1){var a=r[0],b=r[r.length-1];if(a[0]===b[0]&&a[1]===b[1])r.pop();}return r;}
  var CELL=60,grid={},bgrid={},lots={},L=[],B=[];
  function put(g,b,i){for(var x=Math.floor(b[0]/CELL);x<=Math.floor(b[2]/CELL);x++)for(var y=Math.floor(b[1]/CELL);y<=Math.floor(b[3]/CELL);y++){var k=x+','+y;(g[k]||(g[k]=[])).push(i);}}
  F.forEach(function(f){var g=f.geometry,polys=g.type==='Polygon'?[g.coordinates]:g.coordinates,rs=polys.map(function(p){return ring(p[0]);});
    var all=[];rs.forEach(function(r){all=all.concat(r);});var o={id:f.properties.id,pr:f.properties,rings:rs,simple:g.type==='Polygon'&&g.coordinates.length===1,bb:bbox(all)};
    lots[o.id]=o;put(grid,o.bb,L.length);L.push(o);});
  (buildings?buildings.features:[]).forEach(function(f){var o=outer(f.geometry);if(!o)return;var r=ring(o),c=centroid(r);B.push({ring:r,c:c});var k=Math.floor(c[0]/CELL)+','+Math.floor(c[1]/CELL);(bgrid[k]||(bgrid[k]=[])).push(B.length-1);});
  function near(g,b){var seen={},o=[];for(var x=Math.floor(b[0]/CELL);x<=Math.floor(b[2]/CELL);x++)for(var y=Math.floor(b[1]/CELL);y<=Math.floor(b[3]/CELL);y++){(g[x+','+y]||[]).forEach(function(i){if(!seen[i]){seen[i]=1;o.push(i);}});}return o;}
  return {lots:lots,
    ll:function(p){return [lon0+p[0]/kx,lat0+p[1]/ky];},   /* metres back to longitude and latitude */
    lotAt:function(p,skip){var c=near(grid,[p[0],p[1],p[0],p[1]]);for(var i=0;i<c.length;i++){var o=L[c[i]];if(o.id===skip)continue;if(p[0]<o.bb[0]||p[0]>o.bb[2]||p[1]<o.bb[1]||p[1]>o.bb[3])continue;for(var k=0;k<o.rings.length;k++)if(inRing(p,o.rings[k]))return o;}return null;},
    lotsIn:function(b){return near(grid,b).map(function(i){return L[i];}).filter(function(o){return !(o.bb[2]<b[0]||o.bb[0]>b[2]||o.bb[3]<b[1]||o.bb[1]>b[3]);});},
    bldIn:function(b){return near(bgrid,b).map(function(i){return B[i];}).filter(function(o){return o.c[0]>=b[0]&&o.c[0]<=b[2]&&o.c[1]>=b[1]&&o.c[1]<=b[3];});}};
}

/* ---------- which side is the street ---------- */
/* Lots tile each block, so a side with no lot across it faces a public way. A narrow gap is an alley,
   a wide one is a street, and nothing at all within about 100 ft is open land or the edge of the data.
   Returns 'lot', 'alley', 'street' or 'open' for the side a-b of lot o. */
function sideKind(ix,o,a,b,n){
  var votes={lot:0,alley:0,street:0,open:0};
  [0.25,0.5,0.75].forEach(function(t){var p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],gap=99;
    for(var d=2.5;d<=32.5;d+=2.5){if(ix.lotAt([p[0]+n[0]*d,p[1]+n[1]*d],o.id)){gap=d;break;}}
    votes[gap<=2.5?'lot':gap<=10?'alley':gap<=32.5?'street':'open']++;});
  var best='lot';['alley','street','open'].forEach(function(k){if(votes[k]>votes[best])best=k;});
  return best;
}

/* a lot with no model: code, and words that finish the sentence "This lot ..." */
function why(code,text){return {ok:false,why:code,text:text};}
var BIG=25;          /* acres: beyond this a lot is a campus or a golf course, and a model of it shows nothing */
var USEKEY={adu:'adu',house:'one_family',duplex:'two_to_four',fourplex:'two_to_four',townhomes:'townhome',apartments:'apartments'};
var ORDER=['adu','house','duplex','fourplex','townhomes','apartments','block'];
var UNIT=20*FT;      /* a townhome is drawn 20 ft wide */

/* ---------- the analysis ----------
   R is the "lot" block of the lot's draft district (may be missing). uses is that district's use table, so a
   choice the draft does not list reads "no" and one that needs a hearing says so.
   Every lot up to 25 acres gets a model. When the yard lines cannot be drawn (odd shape, no rules, no clear
   street side) the model is "plain": the lot, its buildings and its neighbours, with the choices as words only. */
function analyse(ix,id,R,uses){
  var o=ix.lots[id];if(!o)return why('none','');
  R=R||{};
  var pr=o.pr,T=R.types||null,H=R.height||null,i;
  if(pr.acres>BIG)return why('size','is larger than '+BIG+' acres');
  var sq=pr.acres*ACRE;
  var rs=o.rings.map(function(r){r=simplify(r,1.0);if(area(r)<0)r.reverse();return r;}).filter(function(r){return r.length>=3;}).sort(function(a,b){return area(b)-area(a);});
  if(!rs.length)return why('shape','has no outline we can draw');
  var ring=rs[0],plain=null;
  if(!T)plain={code:'rules',text:''};
  else if(!o.simple)plain={code:'shape',text:'is in more than one piece'};
  else if(pr.units>1)plain={code:'condo',text:'is split into condo units'};
  else if(pr.acres<0.03)plain={code:'size',text:'is very small'};
  else if(pr.acres>(R.max_acres||1))plain={code:'size',text:'is larger than '+(R.max_acres||1)+((R.max_acres||1)>1?' acres':' acre')};
  else if(ring.length>8||!isConvex(ring,2.0))plain={code:'shape',text:'has an irregular shape'};

  var n=ring.length,E=[];
  for(i=0;i<n;i++){var a=ring[i],b=ring[(i+1)%n],e=sub(b,a),l=len(e)||1e-6,nn=[e[1]/l,-e[0]/l];E.push({a:a,b:b,len:l,n:nn,kind:n<=24?sideKind(ix,o,a,b,nn):'lot'});}
  /* street frontages: runs of street sides that point roughly the same way (a curved or two-part front is one frontage) */
  var G=[],first=0;
  for(i=0;i<n;i++){if(E[i].kind!=='street'||E[(i+n-1)%n].kind!=='street'||dot(E[i].n,E[(i+n-1)%n].n)<0.9){first=i;break;}}
  for(var k=0;k<n;k++){var e1=E[(first+k)%n];if(e1.kind!=='street')continue;var g=G[G.length-1];
    if(g&&g.last===(first+k+n-1)%n&&dot(g.es[g.es.length-1].n,e1.n)>=0.9){g.es.push(e1);g.last=(first+k)%n;}else G.push({es:[e1],last:(first+k)%n});}
  G.forEach(function(g){g.a=g.es[0].a;g.b=g.es[g.es.length-1].b;var c=sub(g.b,g.a);g.len=len(c);g.n=[c[1]/g.len,-c[0]/g.len];});
  var noFront=!G.length||!E.some(function(e){return e.kind==='lot';});
  if(noFront&&!plain)plain={code:'street',text:'does not show us which side faces the street'};

  /* buildings on the lot, in metres */
  var mine=ix.bldIn(o.bb).filter(function(b){return rs.some(function(r){return inRing(b.c,r);});});
  /* Where buildings stand wall to wall, one outline often covers several lots and its middle falls on only one of
     them. There, a lot also gets the part of any outline that stands on it (lots with a simple convex shape only). */
  var spanned=!!R.flat_today&&o.simple&&ring.length<=8&&isConvex(ring,2.0),spans=[];
  if(spanned){var pad=30,near=ix.bldIn([o.bb[0]-pad,o.bb[1]-pad,o.bb[2]+pad,o.bb[3]+pad]);
    mine=[];near.forEach(function(b){var br=b.ring.slice();if(area(br)<0)br.reverse();var part=br,rest=[];
      for(var j=0;j<ring.length&&part.length>=3;j++){var a=ring[j],c=ring[(j+1)%ring.length],e=sub(c,a),l=len(e)||1e-6,nn=[e[1]/l,-e[0]/l],d=dot(a,nn);
        var off=clip(part,[-nn[0],-nn[1]],-d);if(off.length>=3)rest.push(off);part=clip(part,nn,d);}
      if(part.length<3)return;var pa=Math.abs(area(part)),ba=Math.abs(area(br));
      if(pa>=ba*0.98)mine.push(b);
      /* the rest of that outline stays with the neighbours, so it is not drawn twice */
      else if(pa>=15&&(pa>=0.1*ba||pa>=0.2*Math.abs(area(ring)))){mine.push({ring:part,c:centroid(part),part:true});spans.push({b:b,rest:rest});}});}
  mine.sort(function(x,y){return Math.abs(area(y.ring))-Math.abs(area(x.ring));});
  /* the front: the only frontage. With more than one, the shorter one (a corner lot's narrow end), and when
     they are about the same length, the one nearest the main building. Clipped corners are never the front. */
  var front=null,udir,vdir,org;
  if(!noFront){
    var cand=G.filter(function(g){return g.len>=6;});if(!cand.length)cand=G;
    var mc=mine.length?mine[0].c:null;
    cand.sort(function(x,y){if(Math.abs(x.len-y.len)>0.15*Math.max(x.len,y.len))return x.len-y.len;if(mc)return segDist(mc,x.a,x.b)-segDist(mc,y.a,y.b);return x.len-y.len;});
    front=cand[0];vdir=[-front.n[0],-front.n[1]];udir=[vdir[1],-vdir[0]];org=[(front.a[0]+front.b[0])/2,(front.a[1]+front.b[1])/2];
  }else{
    /* no street side found: lay the lot along its longer direction */
    var mr=minRect(ring),ang=mr.w>=mr.d?mr.ang:mr.ang+Math.PI/2;udir=[Math.cos(ang),Math.sin(ang)];vdir=[-udir[1],udir[0]];
    var lo=1e12,u0=1e12,u1=-1e12;ring.forEach(function(p){var u=dot(p,udir),v=dot(p,vdir);if(v<lo)lo=v;if(u<u0)u0=u;if(u>u1)u1=u;});
    org=[udir[0]*(u0+u1)/2+vdir[0]*lo,udir[1]*(u0+u1)/2+vdir[1]*lo];
  }
  function uv(p){var q=sub(p,org);return [dot(q,udir),dot(q,vdir)];}
  function world(q){return [org[0]+q[0]*udir[0]+q[1]*vdir[0],org[1]+q[0]*udir[1]+q[1]*vdir[1]];}
  var lot=ring.map(uv);if(area(lot)<0)lot.reverse();
  var more=rs.slice(1).map(function(r){return r.map(uv);});
  var sides=[],corner=false,through=false;
  if(front)for(i=0;i<n;i++){var e2=E[i],d=dot(e2.n,front.n),isMain=front.es.indexOf(e2)>=0,st=e2.kind==='street';
    if(st&&!isMain){if(d<=-0.6)through=true;else corner=true;}
    sides.push({a:uv(e2.a),b:uv(e2.b),len:e2.len,kind:e2.kind,role:st?'front':d<=-0.6?'rear':'side',main:isMain,e:e2});}
  var hasRear=sides.some(function(s){return s.role==='rear';});
  var all=lot.slice();more.forEach(function(r){all=all.concat(r);});
  var lb=bbox(all),depth=lb[3];

  /* what is next door on each side that touches another lot or an alley: the lot there, and whether it is zoned residential */
  sides.forEach(function(s){if(s.kind!=='lot'&&s.kind!=='alley')return;var e=s.e,p=[(e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2];
    for(var d=1.5;d<=12;d+=1.5){var q=ix.lotAt([p[0]+e.n[0]*d,p[1]+e.n[1]*d],id);if(q){s.next=q;s.res=/^res-/.test(q.pr.draft_class||'');break;}}});

  /* today's buildings in the lot frame */
  var bl=mine.map(function(b){var r=b.ring.map(uv);return {ring:r,sqft:Math.abs(area(r))/SQFT,rect:minRect(r),part:!!b.part};});
  var main=bl[0]||null,covered=bl.reduce(function(s,b){return s+b.sqft;},0);

  /* the neighbours, for context: lots and building outlines inside a pedestal around the lot */
  var padS=13,padR=8,padF=15,ped={u0:lb[0]-padS,u1:lb[2]+padS,v0:Math.min(0,lb[1])-padF,v1:depth+padR};
  /* the four corners of that patch on the real map, so an aerial photo can be laid under the model */
  var pc=[[ped.u0,ped.v0],[ped.u1,ped.v0],[ped.u1,ped.v1],[ped.u0,ped.v1]];
  ped.ll=pc.map(function(q){return ix.ll(world(q));});
  var wb=bbox(pc.map(world));
  var around=[],aroundB=[];
  ix.lotsIn(wb).forEach(function(q){if(q.id===id)return;q.rings.forEach(function(r){var c=clipRect(r.map(uv),ped.u0,ped.v0,ped.u1,ped.v1);if(c.length>=3&&Math.abs(area(c))>4)around.push(c);});});
  ix.bldIn(wb).forEach(function(b){var c=uv(b.c);if(c[0]<ped.u0+1||c[0]>ped.u1-1||c[1]<ped.v0+1||c[1]>ped.v1-1)return;if(mine.indexOf(b)>=0||(!spanned&&rs.some(function(r){return inRing(b.c,r);})))return;
    var sp=spans.filter(function(x){return x.b===b;})[0];
    if(sp){sp.rest.forEach(function(r){if(Math.abs(area(r))>4){var q=r.map(uv);aroundB.push({ring:q,rect:minRect(q)});}});return;}
    aroundB.push({ring:b.ring.map(uv),rect:minRect(b.ring.map(uv))});});

  function useV(k,t){var u=t&&('use' in t)?t.use:USEKEY[k];if(!u||!uses)return 'P';return uses[u]||null;}
  function areaCheck(t){if(!t.area_sqft)return null;return {k:'area',need:t.area_sqft,have:Math.round(sq/100)*100,acres:pr.acres,state:sq>=t.area_sqft*(1+TOL_AREA)?'ok':sq<t.area_sqft*(1-TOL_AREA)?'short':'close'};}
  function tidy(){sides.forEach(function(x){delete x.e;delete x.next;});}
  var choices=[{k:'today',state:'now',n:bl.length,sqft:Math.round(covered/10)*10,cover:sq?Math.round(covered/sq*100):0}];
  var out={ok:true,id:id,lot:lot,more:more,sides:sides,build:[],ped:ped,around:around,aroundB:aroundB,bld:bl,
    width_ft:Math.round((lb[2]-lb[0])/FT),depth_ft:Math.round(depth/FT),sqft:Math.round(sq/100)*100,acres:pr.acres,
    set:null,corner:corner,through:through,height_ft:H?H.ft:null,stories:H?H.stories:null,flat:!!R.flat_today,
    outside:false,choices:choices,most:0};

  if(plain){
    /* no yard lines: the district's choices are listed, with what can be said without drawing them */
    out.plain=true;out.why=plain.code;out.text=plain.text;
    if(T)ORDER.forEach(function(k){var t=T[k];if(!t)return;if(k==='adu'&&!main)return;if(k==='house'&&main)return;
      var v=useV(k,t);if(!v){choices.push({k:k,state:'no',listed:false});return;}
      var ac=areaCheck(t),c={k:k,via:v,checks:ac?[ac]:[],state:ac&&ac.state==='short'?'no':'nd',nodraw:true};choices.push(c);});
    (T&&R.not_here||[]).forEach(function(k){choices.push({k:k,state:'no',listed:false});});
    tidy();return out;
  }

  /* ----- yard lines for one kind of building: where it could sit ----- */
  var rearNear=1e9;sides.forEach(function(s){if(s.role==='rear')rearNear=Math.min(rearNear,s.a[1],s.b[1]);});
  /* the front distance the buildings next door keep, measured on our outlines (for districts that set the front yard by the block) */
  var nextFront=null;
  function blockFront(){
    if(nextFront)return nextFront;var got=[];
    sides.forEach(function(s){if(s.role!=='side'||s.kind!=='lot'||!s.next)return;var q=s.next,r=q.rings[0].map(uv),lv=1e9;r.forEach(function(p){if(p[1]<lv)lv=p[1];});if(Math.abs(lv)>4)return;
      var bs=ix.bldIn(q.bb).filter(function(b){return inRing(b.c,q.rings[0]);}).sort(function(x,y){return Math.abs(area(y.ring))-Math.abs(area(x.ring));});if(!bs.length)return;
      var bv=1e9;bs[0].ring.forEach(function(p){var v=uv(p)[1];if(v<bv)bv=v;});got.push(Math.max(0,bv-lv));});
    nextFront={n:got.length,m:got.length?got.reduce(function(s,x){return s+x;},0)/got.length:null};return nextFront;
  }
  var frames={};
  function frameOf(t){
    var fb=R.front_block&&t.front_ft==null?R.front_block:null,key=JSON.stringify([t.front_ft,t.side_ft,t.rear_ft,t.rear,t.alley_ft,t.alley_side_ft,t.corner_side_ft,t.side_res_ft,t.rear_res_ft,!!fb]);
    if(frames[key])return frames[key];
    var F={est:false,front_unknown:false},ffront;
    if(fb){var nf=blockFront();
      if(nf.m!=null){ffront=nf.m;F.est=true;F.est_n=nf.n;}
      else if(main){var mv=1e9;main.ring.forEach(function(p){if(p[1]<mv)mv=p[1];});ffront=Math.max(0,mv);F.est=true;F.est_own=true;}
      else if(fb.min_ft!=null){ffront=fb.min_ft*FT;F.fallback=true;}
      else{ffront=0;F.front_unknown=true;}
      if(fb.min_ft!=null&&nf.m==null&&!main){F.front_max_ft=fb.max_ft;}
    }else ffront=(t.front_ft||0)*FT;
    var rr=t.rear||(t.rear_ft==null?R.rear:null),rear=0;
    if(hasRear)rear=rr?Math.max(rr.min_ft*FT,rr.pct_depth/100*(rearNear-ffront)):(t.rear_ft||0)*FT;
    var build=lot.slice(),sets=[],sideMax=0,usedRes=false,usedAlley=false,usedCorner=false;
    sides.forEach(function(s){var set;
      if(s.role==='front')set=ffront;
      else if(s.role==='rear'){set=rear;if(s.kind==='alley'&&t.alley_ft!=null){set=t.alley_ft*FT;usedAlley=true;}else if(s.res&&t.rear_res_ft!=null){set=t.rear_res_ft*FT;usedRes=true;}}
      else{set=(t.side_ft||0)*FT;
        if(s.kind==='alley'&&(t.alley_side_ft!=null||t.alley_ft!=null)){set=(t.alley_side_ft!=null?t.alley_side_ft:t.alley_ft)*FT;usedAlley=true;}
        else if(s.res&&t.side_res_ft!=null){set=t.side_res_ft*FT;usedRes=true;}
        else if(corner&&t.corner_side_ft!=null&&s.kind==='lot'){set=t.corner_side_ft*FT;usedCorner=true;}
        if(set>sideMax)sideMax=set;}
      sets.push(Math.round(set/FT));if(build.length<3||set<=0)return;var e=sub(s.b,s.a),l=len(e),nn=[e[1]/l,-e[0]/l];build=clip(build,nn,dot(s.a,nn)-set);});
    F.build=build.length>=3?build:[];F.area=F.build.length?Math.abs(area(F.build)):0;F.bb=F.area?bbox(F.build):null;F.sets=sets;
    /* lot width: between the side lines at the back edge of the front yard, held for 30 ft (H.2.1(c)) */
    var w1=span(lot,Math.max(0.3,ffront)),w2=span(lot,Math.min(depth-0.5,Math.max(0.3,ffront)+30*FT));
    F.width=Math.min(w1?w1[1]-w1[0]:0,w2?w2[1]-w2[0]:1e9);
    F.set={front_ft:Math.round(ffront/FT),side_ft:t.side_ft||0,rear_ft:hasRear?Math.round(rear/FT):null,est:F.est,est_own:!!F.est_own,est_n:F.est_n||0,fallback:!!F.fallback,front_max_ft:F.front_max_ft||null,
      res:usedRes,alley:usedAlley,corner_side_ft:usedCorner?t.corner_side_ft:null,side_res_ft:usedRes?t.side_res_ft:null,rear_res_ft:usedRes?t.rear_res_ft:null,alley_ft:usedAlley?(t.alley_ft!=null?t.alley_ft:t.alley_side_ft):null};
    return frames[key]=F;
  }
  function widthCheck(t,F){if(!t.width_ft)return null;var need=t.width_ft,have=F.width/FT;return {k:'width',need:need,have:Math.round(have),state:have>=need+TOL_FT?'ok':have<need-TOL_FT?'short':'close'};}
  function verdict(checks,F){
    if(checks.some(function(c){return c&&c.k==='area'&&c.state==='short';}))return 'no';
    if(F.front_unknown)return 'nd';
    if(checks.some(function(c){return c&&c.state!=='ok';}))return 'nd';
    return 'may';
  }
  /* the biggest block up to maxW x maxD, set at the front of the buildable area, no larger than maxA */
  function block(F,maxW,maxD,maxA){
    if(!F.area)return null;var bb=F.bb,build=F.build;
    for(var v0=bb[1]+0.05;v0<bb[3]-4;v0+=0.5){
      for(var d=Math.min(maxD,bb[3]-v0-0.05);d>=6;d-=0.5){var s1=span(build,v0),s2=span(build,v0+d);if(!s1||!s2)continue;var lo=Math.max(s1[0],s2[0]),hi=Math.min(s1[1],s2[1]),w=Math.min(maxW,hi-lo-0.1);
        if(w<4.5)continue;if(w*d>maxA){d=Math.max(6,Math.min(d,maxA/w));if(w*d>maxA)w=maxA/d;}
        var c=Math.max(lo+w/2+0.05,Math.min(hi-w/2-0.05,0));return {u0:c-w/2,u1:c+w/2,v0:v0,v1:v0+d};}
    }
    return null;
  }
  function start(k,t,F,homes){
    var ck=[areaCheck(t),widthCheck(t,F)].filter(function(x){return x;});
    return {k:k,via:useV(k,t),homes:homes,checks:ck,state:verdict(ck,F),park:t.parking,build:F.build,set:F.set,sets:F.sets,nofront:F.front_unknown,
      stories:H?Math.min(2,H.stories):2,height_ft:H?H.ft:null,cover_max:t.cover_pct||null};
  }
  function withBlock(c,q){c.ex=q;if(q){c.sqft=Math.round((q.u1-q.u0)*(q.v1-q.v0)/SQFT/10)*10;c.cover=Math.round(c.sqft/sq*100);}else if(c.state==='may'){c.state='nd';c.tight=true;}return c;}
  var lotA=sq*SQFT,maxD=(R.max_depth_ft||1e6)*FT,house=T.house||T.duplex||null,first=null;
  function coverA(t,k){return t.cover_pct?t.cover_pct/100*lotA*k:1e9;}

  ORDER.forEach(function(k){
    var t=T[k];if(!t)return;
    if(k==='adu'&&(!main||!house))return;
    if(k==='house'&&main)return;
    var v=useV(k,t);if(!v){choices.push({k:k,state:'no',listed:false});return;}
    var F=frameOf(k==='adu'?house:t),c;if(!first)first=F;
    if(k==='adu'){
      c=start(k,house,F,2);c.keep=true;c.park=t.parking;c.stories=1;
      var cap=Math.min(t.max_sqft,t.max_share_pct/100*2*main.sqft),S=Math.max(200,Math.round(cap/20)*20)*SQFT,spot=null,frontV=bbox(main.ring)[1],bb=F.bb;
      c.sqft=Math.round(S/SQFT);c.cap=t.max_sqft;c.share=t.max_share_pct;c.sep_ft=t.sep_ft;
      if(F.area){var shapes=[[Math.sqrt(S*1.3),Math.sqrt(S/1.3)],[Math.sqrt(S/1.3),Math.sqrt(S*1.3)]];
        for(var v1=bb[3]-0.05;v1>bb[1]&&!spot;v1-=0.5){shapes.forEach(function(sh){if(spot)return;var w=sh[0],d=sh[1],v0=v1-d;if(v0<frontV-0.01)return;var s1=span(F.build,v0),s2=span(F.build,v1);if(!s1||!s2)return;var lo=Math.max(s1[0],s2[0])+0.05,hi=Math.min(s1[1],s2[1])-0.05;if(hi-lo<w)return;
          [hi-w,lo,(lo+hi-w)/2].forEach(function(u0){if(spot)return;var q={u0:u0,u1:u0+w,v0:v0,v1:v1};if(!rectIn(q,F.build))return;if(rectGap(q,main.ring)<t.sep_ft*FT)return;for(var j=1;j<bl.length;j++)if(rectGap(q,bl[j].ring)<0.6)return;spot=q;});});}}
      c.ex=spot;c.cover=Math.round((covered+c.sqft)/sq*100);c.cover_max=house.cover_pct;
      if(!spot&&c.state==='may'){c.state='nd';c.tight=true;}
      if(c.cover>c.cover_max&&c.state==='may'){c.state='nd';c.full=true;}
    }else if(k==='house')c=withBlock(start(k,t,F,1),block(F,11,12,Math.min(120,coverA(t,0.8))));
    else if(k==='duplex')c=withBlock(start(k,t,F,2),block(F,14.6,Math.min(maxD,15.3),Math.min(160,coverA(t,0.8))));
    else if(k==='fourplex')c=withBlock(start(k,t,F,4),block(F,18.3,Math.min(maxD,15.3),Math.min(250,coverA(t,0.8))));
    else if(k==='townhomes'){
      /* a row of homes side by side: three or more, each two stories (the draft's definition), drawn 20 ft wide */
      c=start(k,t,F,0);var q=block(F,8*UNIT,Math.min(maxD,12.2),coverA(t,0.9)),nh=q?Math.floor((q.u1-q.u0+0.05)/UNIT):0;
      if(q&&nh>=3){var mid=(q.u0+q.u1)/2,w=Math.min(q.u1-q.u0,nh*UNIT*1.15);q.u0=mid-w/2;q.u1=mid+w/2;withBlock(c,q);c.homes=nh;c.example=true;}
      else{c.ex=null;c.homes=0;if(c.state==='may'){c.state='nd';c.tight=true;}}
    }else{
      /* apartments, or one mixed building: as large as the yards and the lot cover limit allow, to the height limit */
      c=start(k,t,F,0);c.open=true;c.stories=H?H.stories:2;c.ground=t.ground||null;
      var capA=Math.min(coverA(t,0.9),t.max_sqft?t.max_sqft*SQFT:1e9);
      if(capA<1e9||maxD<1e5)withBlock(c,block(F,1e9,maxD,capA));
      else if(F.area>25){c.poly=F.build;c.ex=null;c.sqft=Math.round(F.area/SQFT/10)*10;c.cover=Math.round(c.sqft/sq*100);}
      else if(c.state==='may'){c.state='nd';c.tight=true;}
    }
    choices.push(c);
    /* the same building with the extra stories the draft lets an owner earn */
    if(R.bonus&&R.bonus.of===k&&c.state==='may'&&(c.ex||c.poly)){var b2={};for(var p in c)b2[p]=c[p];b2.k='bonus';b2.bonus=true;b2.base_stories=c.stories;b2.base_ft=c.height_ft;b2.stories=R.bonus.stories;b2.height_ft=R.bonus.ft;choices.push(b2);}
  });
  (R.not_here||[]).forEach(function(k){var q=first?block(first,17,27,1e9):null;choices.push({k:k,state:'no',listed:false,ex:q,build:first?first.build:[]});});

  var most=0;choices.forEach(function(c){if(c.state==='may'&&!c.open&&!c.example&&c.homes>most)most=c.homes;});
  out.most=most;
  if(first){out.build=first.build;out.set=first.set;out.width_ft=Math.round(first.width/FT);out.outside=!!(main&&first.area&&main.ring.some(function(p){return !inRing(p,first.build)&&ringDist(p,first.build)>1.5;}));}
  out.stepback=R.stepback||null;
  tidy();
  return out;
}
return {FT:FT,index:makeIndex,analyse:analyse,_:{simplify:simplify,isConvex:isConvex,span:span,minRect:minRect,area:area,clip:clip}};
});
