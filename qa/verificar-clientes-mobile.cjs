const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),path=require('path');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
const source=fs.readFileSync('qa/verificar-demo-publicada.cjs','utf8');
const helper=JSON.parse(source.match(/^const tokenHelper=(.*);$/m)[1]);
const out='qa/2026-11-12-demo-publicada';fs.mkdirSync(out,{recursive:true});
(async()=>{
const auth=JSON.parse(cp.execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=12','root@2.24.117.253','docker exec -i navalha-demo-app-1 node - ADMIN'],{input:helper,encoding:'utf8'}));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
await context.addCookies([{name:'barberos_session',value:auth.token,domain:'demo.navalhaapp.tech',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}]);
const page=await context.newPage();const results=[];
for(const width of [375,390,430]){
await page.setViewportSize({width,height:844});
await page.goto('https://demo.navalhaapp.tech/dashboard/clients',{waitUntil:'networkidle',timeout:60000});
const nav=page.getByRole('navigation',{name:'Navegação principal'});
const client=nav.locator('a[href="/dashboard/clients"]');
const clientImage=await client.locator('img').boundingBox(),reference=await nav.locator('a[href="/dashboard"] img').boundingBox(),link=await client.boundingBox();
assert(clientImage && reference && link);
assert(Math.abs(clientImage.width/reference.width-1.35)<0.02,'optical correction applied');
assert(clientImage.x>=link.x&&clientImage.x+clientImage.width<=link.x+link.width,'icon fits touch area');
assert(link.height>=44,'touch target preserved');
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
await nav.screenshot({path:path.join(out,'barra-mobile-'+width+'.png')});
results.push({width,clientImageWidth:clientImage.width,referenceImageWidth:reference.width,touchHeight:link.height});
}
fs.writeFileSync(path.join(out,'clientes-mobile.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({mobileWidths:results.length,correctionApplied:true,noOverflow:true}));
}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
