const assert=require('assert/strict'),fs=require('fs');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true});try{
const c=await b.newContext({viewport:{width:1280,height:900}});
const r=await c.request.post('http://127.0.0.1:3473/api/auth/login',{headers:{Host:'demo.localhost:3473'},data:{email:'icons.demo@local.dev',password:'Icons-Local-Test-2026'}});assert.equal(r.status(),200);
await c.addCookies([{name:'barberos_session',value:r.headers()['set-cookie'].match(/barberos_session=([^;]+)/)[1],domain:'demo.localhost',path:'/',httpOnly:true,secure:false,sameSite:'Lax'}]);
const p=await c.newPage();const ready=p.waitForResponse(r=>r.url().includes('/api/auth/me')&&r.status()===200,{timeout:90000});await p.goto('http://demo.localhost:3473/dashboard/packages',{waitUntil:'domcontentloaded'});await ready;
const pkg=decodeURIComponent(await p.locator('aside a[href="/dashboard/packages"] img').getAttribute('src'));
const product=decodeURIComponent(await p.locator('aside a[href="/dashboard/products"] img').getAttribute('src'));
assert(pkg.includes('clube-de-assinatura-vip'));assert(product.includes('produtos-estoque'));assert.notEqual(pkg,product);
const add=p.getByRole('button',{name:'Adicionar Cliente ao Pacote',exact:true});assert(decodeURIComponent(await add.locator('img').getAttribute('src')).includes('lista-de-clientes'));
for(const width of [1280,390]){await p.setViewportSize({width,height:900});await p.waitForTimeout(300);await p.screenshot({path:'qa/2026-11-11-icones/interno/icones-pacotes-'+width+'.png'});}
fs.writeFileSync('qa/2026-11-11-icones/icones-pacotes.json',JSON.stringify({distinctModules:true,noSparklesOnAddClient:true},null,2));console.log('PASS package and product icons differ; client action uses client icon.');
}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
