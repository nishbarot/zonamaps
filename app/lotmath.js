/* zōna lot math. Pure geometry, no drawing: it runs in the browser and in Node (tools/check_lots.js).
   For one lot it works out which side faces the street, where a new building could sit under the
   draft's yard distances, and whether each housing choice fits. All numbers come from the "lot"
   block of the lot's draft district in data/rules.json. Nothing town-specific lives in this file.

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

/* ---------- the analysis ---------- */
function analyse(ix,id,R){
  var o=ix.lots[id];if(!o)return why('none','');
  var pr=o.pr,T=R&&R.types;
  if(!T)return why('rules','');
  if(!o.simple)return why('shape','is in more than one piece');
  if(pr.units>1)return why('condo','is split into condo units');
  var sq=pr.acres*ACRE;
  if(pr.acres<0.03||pr.acres>(R.max_acres||1))return why('size',pr.acres<0.03?'is very small':'is larger than '+(R.max_acres||1)+(R.max_acres>1?' acres':' acre'));
  var ring=simplify(o.rings[0],1.0);
  if(area(ring)<0)ring.reverse();                       /* counter-clockwise */
  if(ring.length<3||ring.length>8||!isConvex(ring,2.0))return why('shape','has an irregular shape');
  var n=ring.length,E=[],i;
  for(i=0;i<n;i++){var a=ring[i],b=ring[(i+1)%n],e=sub(b,a),l=len(e),nn=[e[1]/l,-e[0]/l];E.push({a:a,b:b,len:l,n:nn,kind:sideKind(ix,o,a,b,nn)});}
  /* street frontages: runs of street sides that point roughly the same way (a curved or two-part front is one frontage) */
  var G=[],first=0;
  for(i=0;i<n;i++){if(E[i].kind!=='street'||E[(i+n-1)%n].kind!=='street'||dot(E[i].n,E[(i+n-1)%n].n)<0.9){first=i;break;}}
  for(var k=0;k<n;k++){var e1=E[(first+k)%n];if(e1.kind!=='street')continue;var g=G[G.length-1];
    if(g&&g.last===(first+k+n-1)%n&&dot(g.es[g.es.length-1].n,e1.n)>=0.9){g.es.push(e1);g.last=(first+k)%n;}else G.push({es:[e1],last:(first+k)%n});}
  G.forEach(function(g){g.a=g.es[0].a;g.b=g.es[g.es.length-1].b;var c=sub(g.b,g.a);g.len=len(c);g.n=[c[1]/g.len,-c[0]/g.len];});
  if(!G.length)return why('street','does not show us which side faces the street');
  if(!E.some(function(e){return e.kind==='lot';}))return why('street','does not show us which side faces the street');

  /* buildings on the lot, in metres */
  var mine=ix.bldIn(o.bb).filter(function(b){return inRing(b.c,ring);}).sort(function(x,y){return Math.abs(area(y.ring))-Math.abs(area(x.ring));});
  /* the front: the only frontage. With more than one, the shorter one (a corner lot's narrow end), and when
     they are about the same length, the one nearest the main building. Clipped corners are never the front. */
  var cand=G.filter(function(g){return g.len>=6;});if(!cand.length)cand=G;
  var mc=mine.length?mine[0].c:null;
  cand.sort(function(x,y){if(Math.abs(x.len-y.len)>0.15*Math.max(x.len,y.len))return x.len-y.len;if(mc)return segDist(mc,x.a,x.b)-segDist(mc,y.a,y.b);return x.len-y.len;});
  var front=cand[0];
  var nf=front.n,vdir=[-nf[0],-nf[1]],udir=[vdir[1],-vdir[0]],org=[(front.a[0]+front.b[0])/2,(front.a[1]+front.b[1])/2];
  function uv(p){var q=sub(p,org);return [dot(q,udir),dot(q,vdir)];}
  var lot=ring.map(uv);if(area(lot)<0)lot.reverse();
  var sides=[],corner=false,through=false;
  for(i=0;i<n;i++){var e2=E[i],d=dot(e2.n,nf),isMain=front.es.indexOf(e2)>=0,st=e2.kind==='street';
    if(st&&!isMain){if(d<=-0.6)through=true;else corner=true;}
    sides.push({a:uv(e2.a),b:uv(e2.b),len:e2.len,kind:e2.kind,role:st?'front':d<=-0.6?'rear':'side',main:isMain});}
  var hasRear=sides.some(function(s){return s.role==='rear';});
  var lb=bbox(lot),depth=lb[3];

  var house=T.house||T.duplex,ffront=house.front_ft*FT,fside=house.side_ft*FT;
  /* lot width: between the side lines at the back edge of the front yard, held for 30 ft (H.2.1(c)) */
  var w1=span(lot,ffront),w2=span(lot,Math.min(depth-0.5,ffront+30*FT));
  var width=Math.min(w1?w1[1]-w1[0]:0,w2?w2[1]-w2[0]:1e9);
  /* rear yard: a share of the depth from the front building line to the nearest point of the rear line */
  var rearNear=1e9;sides.forEach(function(s){if(s.role==='rear')rearNear=Math.min(rearNear,s.a[1],s.b[1]);});
  var rear=hasRear?Math.max(R.rear.min_ft*FT,R.rear.pct_depth/100*(rearNear-ffront)):0;

  /* where a new building could sit */
  var build=lot.slice();
  sides.forEach(function(s){var set=s.role==='front'?ffront:s.role==='rear'?rear:fside;s.set_ft=Math.round(set/FT);if(build.length<3)return;var e=sub(s.b,s.a),l=len(e),nn=[e[1]/l,-e[0]/l];build=clip(build,nn,dot(s.a,nn)-set);});
  var bArea=build.length>=3?Math.abs(area(build)):0,bb=bArea?bbox(build):null;

  /* today's buildings in the lot frame */
  var bl=mine.map(function(b){var r=b.ring.map(uv);return {ring:r,sqft:Math.abs(area(r))/SQFT,rect:minRect(r)};});
  var main=bl[0]||null,covered=bl.reduce(function(s,b){return s+b.sqft;},0);

  /* the neighbours, for context: lots and building outlines inside a pedestal around the lot */
  var padS=13,padR=8,padF=15,ped={u0:lb[0]-padS,u1:lb[2]+padS,v0:-padF,v1:depth+padR};
  /* the four corners of that patch on the real map, so an aerial photo can be laid under the model */
  ped.ll=[[ped.u0,ped.v0],[ped.u1,ped.v0],[ped.u1,ped.v1],[ped.u0,ped.v1]].map(function(q){return ix.ll([org[0]+q[0]*udir[0]+q[1]*vdir[0],org[1]+q[0]*udir[1]+q[1]*vdir[1]]);});
  var corners=[[ped.u0,ped.v0],[ped.u1,ped.v0],[ped.u1,ped.v1],[ped.u0,ped.v1]].map(function(p){return [org[0]+udir[0]*p[0]+vdir[0]*p[1],org[1]+udir[1]*p[0]+vdir[1]*p[1]];}),wb=bbox(corners);
  var around=[],aroundB=[];
  ix.lotsIn(wb).forEach(function(q){if(q.id===id)return;q.rings.forEach(function(r){var c=clipRect(r.map(uv),ped.u0,ped.v0,ped.u1,ped.v1);if(c.length>=3&&Math.abs(area(c))>4)around.push(c);});});
  ix.bldIn(wb).forEach(function(b){var c=uv(b.c);if(c[0]<ped.u0+1||c[0]>ped.u1-1||c[1]<ped.v0+1||c[1]>ped.v1-1)return;if(inRing(b.c,ring))return;aroundB.push({ring:b.ring.map(uv),rect:minRect(b.ring.map(uv))});});

  /* ----- does each choice fit ----- */
  function widthCheck(t){var need=t.width_ft,have=width/FT;return {k:'width',need:need,have:Math.round(have),state:have>=need+TOL_FT?'ok':have<need-TOL_FT?'short':'close'};}
  function areaCheck(t){if(!t.area_sqft)return null;return {k:'area',need:t.area_sqft,have:Math.round(sq/100)*100,acres:pr.acres,state:sq>=t.area_sqft*(1+TOL_AREA)?'ok':sq<t.area_sqft*(1-TOL_AREA)?'short':'close'};}
  function verdict(t,checks){
    if(checks.some(function(c){return c&&c.k==='area'&&c.state==='short';}))return 'no';
    if(checks.some(function(c){return c&&c.state!=='ok';}))return 'nd';
    return 'may';
  }
  /* the biggest block up to maxW x maxD, set at the front of the buildable area, no larger than maxA */
  function block(maxW,maxD,maxA){
    if(!bArea)return null;
    for(var v0=bb[1]+0.05;v0<bb[3]-4;v0+=0.5){
      for(var d=Math.min(maxD,bb[3]-v0-0.05);d>=6;d-=0.5){var s1=span(build,v0),s2=span(build,v0+d);if(!s1||!s2)continue;var lo=Math.max(s1[0],s2[0]),hi=Math.min(s1[1],s2[1]),w=Math.min(maxW,hi-lo-0.1);
        if(w<4.5)continue;if(w*d>maxA){d=Math.max(6,Math.min(d,maxA/w));if(w*d>maxA)w=maxA/d;}
        var c=Math.max(lo+w/2+0.05,Math.min(hi-w/2-0.05,0));return {u0:c-w/2,u1:c+w/2,v0:v0,v1:v0+d};}
    }
    return null;
  }
  function withBlock(c,q,t){c.ex=q;if(q){c.sqft=Math.round((q.u1-q.u0)*(q.v1-q.v0)/SQFT/10)*10;c.cover=Math.round(c.sqft*SQFT/(sq*SQFT)*100);}else if(c.state==='may'){c.state='nd';c.tight=true;}c.cover_max=t.cover_pct;return c;}

  var choices=[],useOf=R.uses||{};
  choices.push({k:'today',state:'now',n:bl.length,sqft:Math.round(covered/10)*10,cover:Math.round(covered/sq*100)});
  if(T.adu&&main){
    var t=T.adu,ck=[widthCheck(house)],c={k:'adu',homes:2,keep:true,checks:ck,state:verdict(t,ck),park:t.parking};
    var cap=Math.min(t.max_sqft,t.max_share_pct/100*2*main.sqft),S=Math.max(200,Math.round(cap/20)*20)*SQFT,spot=null,frontV=bbox(main.ring)[1];
    c.sqft=Math.round(S/SQFT);c.cap=t.max_sqft;c.share=t.max_share_pct;
    if(bArea){var shapes=[[Math.sqrt(S*1.3),Math.sqrt(S/1.3)],[Math.sqrt(S/1.3),Math.sqrt(S*1.3)]];
      for(var v1=bb[3]-0.05;v1>bb[1]&&!spot;v1-=0.5){shapes.forEach(function(sh){if(spot)return;var w=sh[0],d=sh[1],v0=v1-d;if(v0<frontV-0.01)return;var s1=span(build,v0),s2=span(build,v1);if(!s1||!s2)return;var lo=Math.max(s1[0],s2[0])+0.05,hi=Math.min(s1[1],s2[1])-0.05;if(hi-lo<w)return;
        [hi-w,lo,(lo+hi-w)/2].forEach(function(u0){if(spot)return;var q={u0:u0,u1:u0+w,v0:v0,v1:v1};if(!rectIn(q,build))return;if(rectGap(q,main.ring)<t.sep_ft*FT)return;for(var k=1;k<bl.length;k++)if(rectGap(q,bl[k].ring)<0.6)return;spot=q;});});}}
    c.ex=spot;c.cover=Math.round((covered+c.sqft)/sq*100);c.cover_max=house.cover_pct;
    if(!spot&&c.state==='may'){c.state='nd';c.tight=true;}
    if(c.cover>c.cover_max&&c.state==='may'){c.state='nd';c.full=true;}
    choices.push(c);
  }
  if(T.house&&!main){var ch=[widthCheck(T.house)];choices.push(withBlock({k:'house',homes:1,checks:ch,state:verdict(T.house,ch),park:T.house.parking},block(11,12,Math.min(120,T.house.cover_pct/100*sq*SQFT*0.8)),T.house));}
  if(T.duplex){var cd=[widthCheck(T.duplex)];choices.push(withBlock({k:'duplex',homes:2,checks:cd,state:verdict(T.duplex,cd),park:T.duplex.parking},block(14.6,R.max_depth_ft*FT,Math.min(160,T.duplex.cover_pct/100*sq*SQFT*0.8)),T.duplex));}
  if(T.fourplex){var cf=[areaCheck(T.fourplex),widthCheck(T.fourplex)];choices.push(withBlock({k:'fourplex',homes:4,checks:cf,state:verdict(T.fourplex,cf),park:T.fourplex.parking},block(18.3,R.max_depth_ft*FT,Math.min(250,T.fourplex.cover_pct/100*sq*SQFT*0.8)),T.fourplex));}
  (R.not_here||[]).forEach(function(k){var q=block(17,27,1e9);choices.push({k:k,state:'no',listed:false,ex:q});});

  var most=0;choices.forEach(function(c){if(c.state==='may'&&c.homes>most)most=c.homes;});
  return {ok:true,id:id,lot:lot,sides:sides,build:build,ped:ped,around:around,aroundB:aroundB,bld:bl,
    width_ft:Math.round(width/FT),depth_ft:Math.round(depth/FT),sqft:Math.round(sq/100)*100,acres:pr.acres,
    set:{front_ft:house.front_ft,side_ft:house.side_ft,rear_ft:hasRear?Math.round(rear/FT):null},
    corner:corner,through:through,height_ft:R.height.ft,stories:R.height.stories,
    outside:!!(main&&bArea&&main.ring.some(function(p){return !inRing(p,build)&&ringDist(p,build)>1.5;})),
    choices:choices,most:most};
}
return {FT:FT,index:makeIndex,analyse:analyse,_:{simplify:simplify,isConvex:isConvex,span:span,minRect:minRect,area:area,clip:clip}};
});
