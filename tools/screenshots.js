const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const out=process.argv[2]||'.'; const BASE='http://localhost:'+(process.env.PORT||8000); const errs=[];
  async function pg(w,h,s,dpr){const p=await b.newPage({viewport:{width:w,height:h},colorScheme:s,deviceScaleFactor:dpr||1});
    p.on('console',m=>{if(m.type()==='error')errs.push(s+w+': '+m.text())});p.on('pageerror',e=>errs.push(s+w+' PAGEERROR '+e.message));
    await p.goto(''+BASE+'/simple.html');await p.waitForTimeout(8000);return p;}
  for (const s of ['light']){
    const p=await pg(1440,900,s);
    await p.screenshot({path:`${out}/${s}-desk.jpg`,quality:80});
    await p.click('#viewBtn');await p.waitForTimeout(300);await p.screenshot({path:`${out}/${s}-view.jpg`,quality:80,clip:{x:900,y:0,width:540,height:420}});
    await p.close();
  }
  const p=await pg(390,844,'light',2);
  await p.screenshot({path:`${out}/phone-peek.jpg`,quality:75});
  await p.click('#grab');await p.waitForTimeout(700);await p.screenshot({path:`${out}/phone-open.jpg`,quality:75});
  await p.click('#grab');await p.waitForTimeout(700);await p.click('#viewBtn');await p.waitForTimeout(300);await p.screenshot({path:`${out}/phone-view.jpg`,quality:75});
  await p.close();
  // A lot page and the lot view. Set LOT to a parcel number that has a lot model (node tools/check_lots.js <parcel> shows "ok": true).
  // ?still skips the opening animation, and the address is swapped for a made-up one before the picture is taken.
  if(process.env.LOT){
    for(const [w,h,dpr,name] of [[1440,900,1,'lot-desk'],[390,844,2,'lot-phone']]){
      const l=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:dpr});
      l.on('console',m=>{if(m.type()==='error')errs.push(name+': '+m.text())});l.on('pageerror',e=>errs.push(name+' PAGEERROR '+e.message));
      await l.goto(BASE+'/simple.html?still#lot='+encodeURIComponent(process.env.LOT));await l.waitForTimeout(9000);
      await l.evaluate(()=>{const t=document.querySelector('.ttl h1');if(t)t.textContent='123 Main Street';});
      await l.screenshot({path:`${out}/${name}.jpg`,quality:80});
      if(w>=900){await l.click('[data-tab="changes"]');await l.waitForTimeout(500);await l.evaluate(()=>{const t=document.querySelector('.ttl h1');if(t)t.textContent='123 Main Street';});await l.screenshot({path:`${out}/lot-changes.jpg`,quality:80,clip:{x:0,y:0,width:460,height:900}});}
      await l.close();
    }
  }
  const q=await pg(1024,700,'light');await q.screenshot({path:`${out}/mid.jpg`,quality:75});await q.close();
  console.log(errs.join('\n')||'no console errors');await b.close();
})();
