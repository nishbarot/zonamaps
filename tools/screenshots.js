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
    await p.click('#lot',{position:{x:5,y:5}}).catch(()=>{});
    await p.click('[data-tab="changes"]');await p.waitForTimeout(500);await p.screenshot({path:`${out}/${s}-changes.jpg`,quality:80,clip:{x:0,y:0,width:460,height:900}});
    await p.click('[data-tab="lot"]');await p.waitForTimeout(300);await p.screenshot({path:`${out}/${s}-lottab.jpg`,quality:80,clip:{x:0,y:0,width:460,height:900}});
    await p.close();
  }
  const p=await pg(390,844,'light',2);
  await p.screenshot({path:`${out}/phone-peek.jpg`,quality:75});
  await p.click('#grab');await p.waitForTimeout(700);await p.screenshot({path:`${out}/phone-open.jpg`,quality:75});
  await p.click('#grab');await p.waitForTimeout(700);await p.click('#viewBtn');await p.waitForTimeout(300);await p.screenshot({path:`${out}/phone-view.jpg`,quality:75});
  await p.close();
  const q=await pg(1024,700,'light');await q.screenshot({path:`${out}/mid.jpg`,quality:75});await q.close();
  console.log(errs.join('\n')||'no console errors');await b.close();
})();
