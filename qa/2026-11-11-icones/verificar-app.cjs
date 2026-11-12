const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
const AxeBuilder=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@axe-core/playwright').default;
const out=path.resolve('qa/2026-11-11-icones/app');
fs.mkdirSync(out,{recursive:true});
const routes=['/dashboard','/dashboard/appointments','/dashboard/clients','/dashboard/finances','/dashboard/goals','/dashboard/services','/dashboard/products','/dashboard/users','/dashboard/packages'];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const result={pages:[],api:[],notes:['Dados exclusivamente fictícios em Postgres local isolado. Cookie do login API é copiado para HTTP local sem Secure; não há alteração no app.'],errors:[]};
 try{
  for(const port of [3472,3471]){
   const context=await browser.newContext({viewport:{width:1280,height:900}});
   const login=await context.request.post('http://127.0.0.1:'+port+'/api/auth/login',{headers:{Host:'demo.localhost:'+port},data:{email:'icons.demo@local.dev',password:'Icons-Local-Test-2026'}});
   assert.equal(login.status(),200,'login '+port);
   const cookie=login.headers()['set-cookie'].match(/barberos_session=([^;]+)/)[1];
   await context.addCookies([{name:'barberos_session',value:cookie,domain:'demo.localhost',path:'/',httpOnly:true,secure:false,sameSite:'Lax'}]);
   const page=await context.newPage();
   page.on('pageerror',e=>result.errors.push({port,message:e.message}));
   for(const width of (port===3471?[390,768,1280]:[390,1280])){
    await page.setViewportSize({width,height:900});
    for(const route of routes){
     const failed=[];
     const onResponse=r=>{if(r.status()>=400&&r.url().includes('/assets/icons/'))failed.push({url:r.url(),status:r.status()});};
     page.on('response',onResponse);
     await page.goto('http://demo.localhost:'+port+route,{waitUntil:'networkidle',timeout:60000});
     await page.waitForTimeout(200);
     assert(!page.url().includes('/login'),'session '+route);
     await page.evaluate(()=>document.fonts.ready);
     await page.waitForFunction(()=>[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0}).every(i=>i.complete&&i.naturalWidth>0),{},{timeout:20000}); const info=await page.evaluate(()=>({
      font:getComputedStyle(document.body).fontFamily,
      overflow:document.documentElement.scrollWidth>innerWidth,
      icons:[...document.images].filter(i=>i.src.includes('/assets/icons/')||i.src.includes('assets%2Ficons')).map(i=>({src:i.getAttribute('src'),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,loaded:i.complete&&i.naturalWidth>0,visible:i.getBoundingClientRect().width>0&&i.getBoundingClientRect().height>0&&i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0&&i.getBoundingClientRect().left<innerWidth&&i.getBoundingClientRect().right>0})),
      heading:document.querySelector('h1')?.textContent
     }));
     assert.equal(info.overflow,false,'horizontal overflow '+width+' '+route);
     assert.equal(failed.length,0,'missing icons '+route);
     if(!info.icons.filter(i=>i.visible).every(i=>i.loaded)){ console.log(JSON.stringify(info)); await page.screenshot({path:require('path').join(out,'diagnostico.png')}); } assert(info.icons.filter(i=>i.visible).every(i=>i.loaded),'images loaded '+route);
     const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
     const name=(route.split('/').pop()||'dashboard')+'-'+port+'-'+width;
     fs.writeFileSync(path.join(out,name+'-axe.json'),JSON.stringify(axe.violations,null,2));
     await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
     result.pages.push({port,width,route,...info,axe:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});
     fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(result,null,2)); console.log(port,width,route); page.off('response',onResponse);
    }
   }
   if(port===3471){
    for(const route of ['/','/produto','/login','/book','/api/book']){
     await page.goto('http://demo.localhost:'+port+'/login',{waitUntil:'networkidle'}); const status=await page.evaluate(async route=>(await fetch(route)).status,route); const r={status:()=>status};
     result.api.push({route,status:r.status()});assert.equal(r.status(),200);
    }
    // Cookie copied across tenants must be refused.
    const r=await context.request.get('http://127.0.0.1:'+port+'/api/clients',{headers:{Host:'teste-b.localhost:'+port,Cookie:'barberos_session='+cookie},maxRedirects:0});
    result.api.push({route:'cross-tenant cookie',status:r.status()});assert.equal(r.status(),401);
    await page.goto('http://demo.localhost:'+port+'/dashboard/finances',{waitUntil:'networkidle'});
    for(const label of ['Comissões & Repasses','Relatórios','Transações']){
     await page.getByRole('button',{name:label,exact:true}).click();
     await page.waitForLoadState('networkidle');await page.waitForTimeout(500);
     await page.screenshot({path:path.join(out,'finance-tab-'+label.replace(/[^a-z0-9]/gi,'-')+'.png')});
    }
   }
   await context.close();
  }
  for(const p of result.pages.filter(p=>p.port===3471&&p.width!==768)){
   const old=result.pages.find(b=>b.port===3472&&b.width===p.width&&b.route===p.route);
   assert.equal(p.font,old.font,'Font family changed '+p.route);
  }
  assert.equal(result.errors.length,0,'browser JavaScript errors');
  fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({pages:result.pages.length,errors:result.errors.length,fontsPreserved:true,api:result.api}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
