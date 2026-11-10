/* zōna lot model. Draws one lot, worked out by lotmath.js, as a small 3D model with three.js.
   This file and three.js are loaded only when someone opens a lot that has a model.

   What is real: the lot's shape, the neighbouring lots, building outlines, and the dashed teal frame
   (the draft's yard distances and height limit). What is an example: the orange buildings, and how
   tall today's buildings are drawn, because building heights are not on file. */
(function(){
'use strict';
var T=window.THREE,FT=0.3048;
var C={bg:0xE8E4DC,road:0xC9C3B7,ped:0xBDB6A8,lawn:0xDCE2CC,lawnLine:0xB7BFA3,mine:0xF7F5F0,wall:0xFCFCFA,roof:0x8B939A,trim:0xD9D4CA,newWall:0xFFF1E4,orange:0xC85400,orangeDk:0xA34200,teal:0x12585C,navy:0x0E2340,glass:0xBCCFD6,grey:0x8E8B84,car:0x8D97A3,pave:0xE2DED5,door:0x6B7480};
var STORY=2.9;

function mount(o){
  var stage=o.stage,canvas=o.canvas,tagsEl=o.tags,CALM=!!o.calm;
  var renderer=new T.WebGLRenderer({canvas:canvas,antialias:true});   /* throws when WebGL is off: the page keeps its flat plan */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  var scene=new T.Scene();scene.background=new T.Color(C.bg);
  var cam=new T.OrthographicCamera(-1,1,1,-1,-600,1200);
  scene.add(new T.HemisphereLight(0xffffff,0xe2dccf,0.7));
  var sun=new T.DirectionalLight(0xffffff,0.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-0.0006;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
  var mats={};
  function mat(c,p){var k=c+'|'+(p?JSON.stringify(p):'');if(!mats[k]){var q={color:c,flatShading:true};if(p)for(var i in p)q[i]=p[i];mats[k]=new T.MeshLambertMaterial(q);}return mats[k];}
  function box(w,h,d,c,p){var m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c,p));m.castShadow=!(p&&p.transparent);m.receiveShadow=true;return m;}
  function at(m,x,y,z){m.position.set(x,y,z);return m;}
  function dashed(pts,c,closed){var p=pts.slice();if(closed)p.push(pts[0]);var l=new T.Line(new T.BufferGeometry().setFromPoints(p),new T.LineDashedMaterial({color:c,dashSize:0.9,gapSize:0.6}));l.computeLineDistances();return l;}
  function boxEdges(m,c){var l=new T.LineSegments(new T.EdgesGeometry(m.geometry),new T.LineDashedMaterial({color:c,dashSize:0.9,gapSize:0.6}));l.computeLineDistances();l.position.copy(m.position);return l;}

  /* ---------- model state ---------- */
  var M=null,uc=0,vc=0,root=new T.Group(),gBase,gToday,gNew,gFrame,choice=null,peek=false,view='corner';
  scene.add(root);
  var anchors=[],tagList=[],dims=[],tweens=[],raf=0,dirty=true,alive=true;
  /* f: how far to close in from the whole pedestal (0) to just the lot (1) */
  var VIEWS={street:{th:-16,ph:9,f:0.9},corner:{th:38,ph:27,f:0.35},back:{th:205,ph:25,f:0.35},above:{th:0,ph:82,f:0.3}};
  var cs={th:38,ph:27,f:0.35},boxP=null,boxL=null;
  function X(u){return u-uc;}function Z(v){return vc-v;}
  function shapeOf(ring){var s=new T.Shape();ring.forEach(function(p,i){if(i)s.lineTo(p[0]-uc,p[1]-vc);else s.moveTo(p[0]-uc,p[1]-vc);});return s;}
  function flat(ring,c,y){var g=new T.ShapeGeometry(shapeOf(ring));g.rotateX(-Math.PI/2);var m=new T.Mesh(g,mat(c));m.position.y=y;m.receiveShadow=true;return m;}
  function slab(ring,h,c,p){var g=new T.ExtrudeGeometry(shapeOf(ring),{depth:h,bevelEnabled:false});g.rotateX(-Math.PI/2);var m=new T.Mesh(g,mat(c,p));m.castShadow=!(p&&p.transparent);m.receiveShadow=true;return m;}
  function clear(g){while(g.children.length)g.remove(g.children[0]);}

  /* ---------- small parts ---------- */
  function person(x,z){var g=new T.Group(),b=new T.Mesh(new T.CylinderGeometry(0.2,0.26,1.2,10),mat(C.navy));b.position.y=0.6;b.castShadow=true;var h=new T.Mesh(new T.SphereGeometry(0.25,12,10),mat(C.navy));h.position.y=1.47;h.castShadow=true;g.add(b,h);g.position.set(x,0,z);return g;}
  function car(x,z,rot){var g=new T.Group();g.add(at(box(1.8,0.75,4.3,C.car),0,0.62,0),at(box(1.6,0.6,2.2,C.car),0,1.25,-0.2),at(box(1.62,0.42,2.0,C.glass),0,1.27,-0.2));[[-0.9,1.35],[0.9,1.35],[-0.9,-1.35],[0.9,-1.35]].forEach(function(p){var w=new T.Mesh(new T.CylinderGeometry(0.34,0.34,0.22,12),mat(0x4A4F57));w.rotation.z=Math.PI/2;w.position.set(p[0],0.34,p[1]);g.add(w);});g.position.set(x,0,z);g.rotation.y=rot||0;return g;}
  /* a gabled shell: span is across the gable, len runs along the ridge (local z) */
  function shell(span,len,wallH,roofH,wall,roof){
    var g=new T.Group();g.add(at(box(span,wallH,len,wall),0,wallH/2,0));
    var s=new T.Shape();s.moveTo(-span/2,0);s.lineTo(span/2,0);s.lineTo(0,roofH);s.lineTo(-span/2,0);
    var gm=new T.Mesh(new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false}),mat(wall));gm.position.set(0,wallH,-len/2);gm.castShadow=true;g.add(gm);
    var a=Math.atan2(roofH,span/2),sl=Math.sqrt(span*span/4+roofH*roofH),ov=0.45,th=0.24;
    [-1,1].forEach(function(k){var r=box(sl+ov,th,len+ov*2,roof);r.rotation.z=-k*a;var mx=k*(span/4),my=wallH+roofH/2;mx+=k*Math.cos(a)*ov/2;my-=Math.sin(a)*ov/2;mx+=k*Math.sin(a)*th/2;my+=Math.cos(a)*th/2;r.position.set(mx,my,0);g.add(r);});
    return g;
  }
  function win(g,x,y,z,side){g.add(at(side?box(0.1,1.2,1.0,C.glass):box(1.0,1.2,0.1,C.glass),x,y,z));}
  /* a house in its own frame: the front wall is at z=+d/2. doors: x positions on the front. sideDoors: z positions on the right wall. */
  function house(h){
    var g=new T.Group(),wallH=h.stories*STORY,sh,an=[];
    if(h.ridge==='x'){sh=shell(h.d,h.w,wallH,h.roofH,h.wall,h.roof);sh.rotation.y=Math.PI/2;}else sh=shell(h.w,h.d,wallH,h.roofH,h.wall,h.roof);
    g.add(sh);var zf=h.d/2,xr=h.w/2;
    (h.doors||[]).forEach(function(x){g.add(at(box(1.9,0.22,1.2,C.pave),x,0.11,zf+0.6),at(box(1.05,2.1,0.14,h.doorC),x,1.27,zf+0.05),at(box(1.3,0.14,0.5,h.doorC),x,2.5,zf+0.25));if(h.people)g.add(person(x+1.0,zf+0.8));an.push(new T.Vector3(x,3.4,zf+0.3));});
    (h.sideDoors||[]).forEach(function(z){g.add(at(box(1.2,0.22,1.9,C.pave),xr+0.6,0.11,z),at(box(0.14,2.1,1.05,h.doorC),xr+0.05,1.27,z),at(box(0.5,0.14,1.3,h.doorC),xr+0.25,2.5,z));if(h.people)g.add(person(xr+0.8,z+1.0));an.push(new T.Vector3(xr+0.3,3.4,z));});
    var nx=Math.max(1,Math.min(5,Math.floor(h.w/3.2))),nz=Math.max(1,Math.min(4,Math.floor(h.d/4)));
    for(var s=0;s<Math.floor(h.stories+0.01);s++){var y=1.75+s*STORY;
      for(var i=0;i<nx;i++){var x=-h.w/2+h.w/nx*(i+0.5);if(!(s===0&&(h.doors||[]).some(function(dx){return Math.abs(dx-x)<1.25;})))win(g,x,y,zf+0.02);win(g,x,y,-zf-0.02);}
      for(var j=0;j<nz;j++){var z=-h.d/2+h.d/nz*(j+0.5);win(g,-xr-0.02,y,z,true);if(!(s===0&&(h.sideDoors||[]).some(function(dz){return Math.abs(dz-z)<1.25;})))win(g,xr+0.02,y,z,true);}}
    g.userData.anchors=an;g.userData.top=wallH+h.roofH;return g;
  }
  /* a building drawn from a real outline. Near-rectangles get a pitched roof; anything else is a plain block of the same shape. */
  function fromOutline(b,o2){
    var r=b.rect,g;
    if(r&&r.fill>=0.78&&Math.min(r.w,r.d)>=4.5&&Math.max(r.w,r.d)<=22){
      var ang=r.ang,w=r.w,d=r.d,k=Math.round(ang/(Math.PI/2));ang-=k*Math.PI/2;if(Math.abs(k)%2===1){var t=w;w=d;d=t;}
      g=house({w:w,d:d,stories:o2.stories,roofH:o2.roofH,ridge:d>=w?'z':'x',wall:C.wall,roof:C.roof,doors:o2.door?[Math.max(-w/2+1,Math.min(w/2-1,-w/5))]:[],doorC:o2.doorC||C.door,people:false});
      g.position.set(X(r.c[0]),0,Z(r.c[1]));g.rotation.y=ang;
      if(o2.door){g.updateMatrix();g.userData.anchor=g.userData.anchors[0].clone().applyMatrix4(g.matrix);}
    }else{g=new T.Group();var h=o2.stories*STORY+0.6;g.add(slab(b.ring,h,C.wall));var cap=slab(b.ring,0.25,C.roof);cap.position.y=h;g.add(cap);
      if(o2.door){var best=null;b.ring.forEach(function(p){if(!best||p[1]<best[1])best=p;});g.userData.anchor=new T.Vector3(X(best[0]),3.4,Z(best[1])+0.3);}}
    return g;
  }
  function ghost(q,h,c){var w=q.u1-q.u0,d=q.v1-q.v0,g=new T.Group(),m=box(w,h,d,c,{transparent:true,opacity:0.2,depthWrite:false});m.position.y=h/2;g.add(m,boxEdges(m,c));g.position.set(X((q.u0+q.u1)/2),0,Z((q.v0+q.v1)/2));return g;}

  /* ---------- the fixed parts of a lot ---------- */
  function setModel(m){
    M=m;choice=null;clear(root);gBase=new T.Group();gToday=new T.Group();gNew=new T.Group();gFrame=new T.Group();root.add(gBase,gToday,gNew,gFrame);
    var p=m.ped,pw=p.u1-p.u0,pd=p.v1-p.v0;uc=(p.u0+p.u1)/2;vc=(p.v0+p.v1)/2;
    var l0=1e9,l1=-1e9,d0=1e9,d1=-1e9,top=Math.max(m.height_ft*FT+1.5,9);m.lot.forEach(function(q){if(q[0]<l0)l0=q[0];if(q[0]>l1)l1=q[0];if(q[1]<d0)d0=q[1];if(q[1]>d1)d1=q[1];});
    boxP=[-pw/2,pw/2,-pd/2,pd/2,top];boxL=[X(l0)-3,X(l1)+3,Z(d1)-2,Z(d0)+5,top];
    sun.position.set(34,60,42);sun.target.position.set(0,0,0);var sc=sun.shadow.camera,ext=Math.max(pw,pd)*0.85;sc.left=-ext;sc.right=ext;sc.top=ext;sc.bottom=-ext;sc.near=1;sc.far=260;sc.updateProjectionMatrix();
    var ped=box(pw+1.6,2.2,pd+1.6,C.ped);ped.position.set(0,-1.14,0);ped.castShadow=false;gBase.add(ped);
    var road=box(pw,0.06,pd,C.road);road.position.set(0,-0.03,0);road.castShadow=false;gBase.add(road);
    m.around.forEach(function(r){gBase.add(flat(r,C.lawn,0.02));var pts=r.map(function(q){return new T.Vector3(X(q[0]),0.05,Z(q[1]));});pts.push(pts[0]);gBase.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:C.lawnLine})));});
    m.aroundB.forEach(function(b){gBase.add(fromOutline(b,{stories:1.6,roofH:2.3}));});
    gBase.add(flat(m.lot,C.mine,0.04));
    m.lot.forEach(function(a,i){var b=m.lot[(i+1)%m.lot.length],dx=b[0]-a[0],dv=b[1]-a[1],l=Math.sqrt(dx*dx+dv*dv),ln=box(l+0.24,0.1,0.24,C.navy);ln.castShadow=false;ln.position.set(X((a[0]+b[0])/2),0.09,Z((a[1]+b[1])/2));ln.rotation.y=Math.atan2(dv,dx);gBase.add(ln);});
    /* scale figures stand in the street, never on the lot */
    var lb=[1e9,-1e9];m.lot.forEach(function(q){if(q[0]<lb[0])lb[0]=q[0];if(q[0]>lb[1])lb[1]=q[0];});
    gBase.add(person(X(lb[1])-1.5,Z(-2.2)),car(X(lb[0])+3,Z(-6.5),Math.PI/2));
    /* where a new building could sit and how tall: the rule, drawn as a dashed teal frame */
    if(m.build.length>=3){var H=m.height_ft*FT,g0=m.build.map(function(q){return new T.Vector3(X(q[0]),0.14,Z(q[1]));}),g1=m.build.map(function(q){return new T.Vector3(X(q[0]),H,Z(q[1]));});
      gFrame.add(dashed(g0,C.teal,true),dashed(g1,C.teal,true));g0.forEach(function(a,i){gFrame.add(dashed([a,g1[i]],C.teal,false));});
      var g=new T.ShapeGeometry(shapeOf(m.build));g.rotateX(-Math.PI/2);var top=new T.Mesh(g,mat(C.teal,{transparent:true,opacity:0.07,depthWrite:false,side:T.DoubleSide}));top.position.y=H;gFrame.add(top);
      gFrame.userData.tops=g1;}
    dims=[];m.sides.forEach(function(sd){if(!sd.set_ft||sd.len<6)return;var ex=sd.b[0]-sd.a[0],ev=sd.b[1]-sd.a[1],l=Math.sqrt(ex*ex+ev*ev),k=sd.set_ft*FT/2;dims.push({p:new T.Vector3(X((sd.a[0]+sd.b[0])/2-ev/l*k),0.2,Z((sd.a[1]+sd.b[1])/2+ex/l*k)),t:sd.set_ft+' ft'});});
    /* what is there today, from the building outlines */
    m.bld.forEach(function(b,i){var g=fromOutline(b,i?{stories:1,roofH:1.4}:{stories:1.6,roofH:2.5,door:true,doorC:C.navy});gToday.add(g);if(!i)gToday.userData.anchor=g.userData.anchor;});
    kick();
  }

  /* ---------- one choice ---------- */
  function pick(k,animate){
    if(!M)return;choice=null;M.choices.forEach(function(c){if(c.k===k)choice=c;});if(!choice)choice=M.choices[0];
    clear(gNew);anchors=[];tagList=[];var c=choice,q=c.ex,g=null,ok=c.state==='may';
    if(c.keep&&gToday.userData.anchor)anchors.push({p:gToday.userData.anchor,was:true});
    if(q&&c.k!=='today'){var w=q.u1-q.u0,d=q.v1-q.v0,H=M.height_ft*FT,two=Math.min(2.4,H+1.1-2*STORY),lab=o.label?o.label(c):'';
      if(!ok){g=ghost(q,c.k==='apartments'?Math.max(10.6,H+2.2):c.k==='adu'?4.6:2*STORY+1.2,C.grey);tagList.push({p:new T.Vector3(g.position.x,(c.k==='apartments'?Math.max(10.6,H+2.2):c.k==='adu'?4.6:2*STORY+1.2)+0.4,g.position.z),t:lab,c:c.state==='no'?'no':'nd'});}
      else if(c.k==='adu')g=house({w:w,d:d,stories:1,roofH:1.8,ridge:w>=d?'x':'z',wall:C.newWall,roof:C.orange,doors:[-w/5],doorC:C.orangeDk,people:true});
      else if(c.k==='house')g=house({w:w,d:d,stories:2,roofH:two,ridge:d>=w?'z':'x',wall:C.newWall,roof:C.orange,doors:[-w/5],doorC:C.orangeDk,people:true});
      else if(c.k==='duplex'){
        if(w>=10){g=new T.Group();g.userData.anchors=[];[-1,1].forEach(function(s){var h=house({w:w/2,d:d,stories:2,roofH:two,ridge:'z',wall:C.newWall,roof:C.orange,doors:[s*-Math.min(1.3,w/8)],doorC:C.orangeDk,people:true});h.position.x=s*w/4;g.add(h);h.userData.anchors.forEach(function(a){g.userData.anchors.push(a.clone().add(h.position));});});}
        else g=house({w:w,d:d,stories:2,roofH:two,ridge:'z',wall:C.newWall,roof:C.orange,doors:[-w/4,w/4],doorC:C.orangeDk,people:true});}
      else if(c.k==='fourplex'){
        if(w>=11)g=house({w:w,d:d,stories:2,roofH:two,ridge:'x',wall:C.newWall,roof:C.orange,doors:[-0.375*w,-0.125*w,0.125*w,0.375*w],doorC:C.orangeDk,people:true});
        else g=house({w:w,d:d,stories:2,roofH:two,ridge:'z',wall:C.newWall,roof:C.orange,doors:[-w/4,w/4],sideDoors:[d/5,-d/4],doorC:C.orangeDk,people:true});}
      if(g&&ok)g.position.set(X((q.u0+q.u1)/2),0,Z((q.v0+q.v1)/2));
    }else if(c.k!=='today'&&!ok&&o.label){var bb=M.build.length>=3?M.build:M.lot,cx=0,cv=0;bb.forEach(function(p2){cx+=p2[0];cv+=p2[1];});tagList.push({p:new T.Vector3(X(cx/bb.length),3,Z(cv/bb.length)),t:o.label(c),c:c.state==='no'?'no':'nd'});}
    if(g){gNew.add(g);g.updateMatrix();(g.userData.anchors||[]).forEach(function(a){anchors.push({p:a.clone().applyMatrix4(g.matrix)});});
      if(animate&&!CALM&&ok){g.scale.y=0.02;tween(420,function(t){g.scale.y=Math.max(0.02,back(t));});}}
    applyVis();renderTags(animate&&ok);kick();
  }
  function applyVis(){if(!choice)return;var today=choice.k==='today';gNew.visible=!peek;gToday.visible=peek||today||!!choice.keep;gFrame.visible=!peek&&!today;}
  function setPeek(on){peek=on;applyVis();tagsEl.style.visibility=on?'hidden':'';kick();}

  /* ---------- labels over the model ---------- */
  function renderTags(animate){
    tagsEl.innerHTML='';var n=0;
    function tag(cls,txt,p){var e=document.createElement('span');e.className=cls;e.textContent=txt;e._p=p;tagsEl.appendChild(e);e._hw=e.offsetWidth/2+8;return e;}
    anchors.forEach(function(a,i){var e=tag('lvbadge'+(a.was?' was':''),String(++n),a.p);e._hw=0;if(animate&&!CALM){e.style.opacity='0';setTimeout(function(){e.style.opacity='';e.classList.add('pop');},260+i*190);}});
    tagList.forEach(function(t){tag('lvtag '+t.c,t.t,t.p);});
    if(choice.k!=='today'&&M.build.length>=3){dims.forEach(function(d){tag('lvtag dim',d.t,d.p);});if(o.limit)tag('lvtag lim',o.limit(M),gFrame.userData.tops[0])._ps=gFrame.userData.tops;}
  }
  var v3=new T.Vector3();
  function placeTags(){var w=stage.clientWidth,h=stage.clientHeight;Array.prototype.forEach.call(tagsEl.children,function(e){
    if(e._ps){var hi=-9;e._ps.forEach(function(p){v3.copy(p).project(cam);if(v3.y>hi){hi=v3.y;e._p=p;}});}
    v3.copy(e._p).project(cam);var x=(v3.x+1)/2*w,y=(1-v3.y)/2*h;if(e._hw)x=Math.max(e._hw,Math.min(w-e._hw,x));
    e._x=x;e._y=y;});
    /* door numbers that land on top of each other on a small screen are nudged apart */
    var bs=Array.prototype.filter.call(tagsEl.children,function(e){return !e._hw&&!e._ps&&e.className.indexOf('lvbadge')===0;}),D=bs.length?bs[0].offsetWidth+3:0;
    for(var it=0;it<4;it++)for(var i=0;i<bs.length;i++)for(var j=i+1;j<bs.length;j++){var a=bs[i],b=bs[j],dx=b._x-a._x,dy=b._y-a._y,l=Math.sqrt(dx*dx+dy*dy);
      if(l<D){if(l<0.01){dx=1;dy=0;l=1;}var k=(D-l)/2/l;a._x-=dx*k;a._y-=dy*k;b._x+=dx*k;b._y+=dy*k;}}
    Array.prototype.forEach.call(tagsEl.children,function(e){e.style.transform='translate('+e._x.toFixed(1)+'px,'+e._y.toFixed(1)+'px)';});}

  /* ---------- camera: four fixed views and one sideways drag ---------- */
  /* fit the camera to the model: project the box around it onto the screen and leave room for the buttons */
  function frame(){var w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||!boxP)return false;renderer.setSize(w,h,false);
    var ins=o.inset?o.inset():{top:0,bottom:0},fh=Math.max(120,h-ins.top-ins.bottom);
    var th=cs.th*Math.PI/180,ph=cs.ph*Math.PI/180,dx=Math.sin(th)*Math.cos(ph),dy=Math.sin(ph),dz=Math.cos(th)*Math.cos(ph),rx=Math.cos(th),rz=-Math.sin(th),ux=dy*rz,uy=dz*rx-dx*rz,uz=-dy*rx;
    var f=Math.min(1,cs.f+(w<560?0.3:0)),B=[0,1,2,3,4].map(function(i){return boxP[i]+(boxL[i]-boxP[i])*f;}),x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    [B[0],B[1]].forEach(function(x){[0,B[4]].forEach(function(y){[B[2],B[3]].forEach(function(z){var px=x*rx+z*rz,py=x*ux+y*uy+z*uz;if(px<x0)x0=px;if(px>x1)x1=px;if(py<y0)y0=py;if(py>y1)y1=py;});});});
    var upp=Math.max((x1-x0)/(w*0.94),(y1-y0)/(fh*0.9)),cx=(x0+x1)/2,cy=(y0+y1)/2-(ins.bottom-ins.top)/2*upp,R=300;
    cam.left=-upp*w/2;cam.right=upp*w/2;cam.top=upp*h/2;cam.bottom=-upp*h/2;cam.updateProjectionMatrix();
    var tx=rx*cx+ux*cy,ty=uy*cy,tz=rz*cx+uz*cy;cam.position.set(tx+dx*R,ty+dy*R,tz+dz*R);cam.lookAt(tx,ty,tz);return true;}
  function setView(v,fast){if(!VIEWS[v])return;view=v;tagsEl.setAttribute('data-view',v);var a={th:cs.th,ph:cs.ph,f:cs.f},b=VIEWS[v],d=((b.th-a.th+540)%360)-180;
    if(fast||CALM){cs={th:b.th,ph:b.ph,f:b.f};kick();return;}
    tweens=tweens.filter(function(t){return !t.cam;});var tw=tween(620,function(t){var e=t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;cs.th=a.th+d*e;cs.ph=a.ph+(b.ph-a.ph)*e;cs.f=a.f+(b.f-a.f)*e;});tw.cam=true;}
  function back(t){var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);}
  function tween(ms,fn){var tw={fn:fn,ms:ms,t0:performance.now()};tweens.push(tw);kick();return tw;}
  function loop(now){raf=0;if(!alive)return;tweens=tweens.filter(function(tw){var t=Math.min(1,(now-tw.t0)/tw.ms);tw.fn(t);return t<1;});
    if(frame()){renderer.render(scene,cam);placeTags();dirty=false;}
    if(tweens.length||drag||dirty)raf=requestAnimationFrame(loop);}
  function kick(){dirty=true;if(!raf&&alive)raf=requestAnimationFrame(loop);}

  var drag=null;
  canvas.addEventListener('pointerdown',function(e){if(o.onTouch)o.onTouch();drag={x:e.clientX,th:cs.th,m:0};tweens=tweens.filter(function(t){return !t.cam;});try{canvas.setPointerCapture(e.pointerId);}catch(x){}kick();});
  canvas.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x;drag.m=Math.max(drag.m,Math.abs(dx));if(drag.m>6){cs.th=drag.th-dx*0.45;dirty=true;}});
  function endDrag(){if(!drag)return;var moved=drag.m>6;drag=null;if(!moved)return;var best='corner',bd=1e9;['street','corner','back'].forEach(function(v){var d=Math.abs(((VIEWS[v].th-cs.th+540)%360)-180);if(d<bd){bd=d;best=v;}});setView(best);if(o.onView)o.onView(best);}
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);

  return {setModel:setModel,pick:pick,view:setView,peek:setPeek,resize:kick,
    stop:function(){alive=false;if(raf)cancelAnimationFrame(raf);raf=0;},start:function(){alive=true;kick();},
    state:function(){return {view:view,choice:choice&&choice.k,badges:anchors.length,tags:tagList.map(function(t){return t.t;})};}};
}
window.ZonaLot3D={mount:mount};
})();
