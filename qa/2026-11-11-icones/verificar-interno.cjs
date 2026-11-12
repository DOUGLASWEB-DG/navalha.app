const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
const out='qa/2026-11-11-icones/interno';fs.mkdirSync(out,{recursive:true});
const cases=[
['agenda','/dashboard/appointments','Novo Agendamento'],
['clientes','/dashboard/clients','Novo Cliente'],
['servicos','/dashboard/services','Novo Serviço'],
['produtos','/dashboard/products','Novo Produto'],
['equipe','/dashboard/users','Novo Usuário'],
['metas','/dashboard/goals','Nova Meta'],
['pacote-modelo','/dashboard/packages','Novo Modelo'],
['pacote-cliente','/dashboard/packages','Adicionar Cliente ao Pacote'],
['despesa','/dashboard/finances','Nova Despesa'],
['permissoes','/dashboard/users','Permissões da equipe']];
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900}});
const login=await context.request.post('http://127.0.0.1:3473/api/auth/login',{headers:{Host:'demo.localhost:3473'},data:{email:'icons.demo@local.dev',password:'Icons-Local-Test-2026'}});
assert.equal(login.status(),200);
await context.addCookies([{name:'barberos_session',value:login.headers()['set-cookie'].match(/barberos_session=([^;]+)/)[1],domain:'demo.localhost',path:'/',httpOnly:true,secure:false,sameSite:'Lax'}]);
const page=await context.newPage(),results=[];
try{
for(const width of [390,768,1280]){
 await page.setViewportSize({width,height:900});
 for(const [id,route,label]of cases){
  const hydrated = page.waitForResponse(r => r.url().includes('/api/auth/me') && r.status() === 200, {timeout:90000}); await page.goto('http://demo.localhost:3473'+route,{waitUntil:'domcontentloaded',timeout:90000}); await hydrated;
  await page.getByRole('button',{name:label,exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  await page.waitForTimeout(700);
  const bounds=await dialog.boundingBox();
  assert(bounds.x>=-1&&bounds.x+bounds.width<=width+1,id+' dialog width '+width);
  const overflow=await dialog.evaluate(el=>el.scrollWidth>el.clientWidth+1);
  assert.equal(overflow,false,id+' horizontal overflow');
  const icons=await dialog.locator('img').evaluateAll(images=>images.map(i=>({width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height,loaded:i.complete&&i.naturalWidth>0})));
  assert(icons.length>0,id+' system icons');
  await page.screenshot({path:path.join(out,id+'-'+width+'.png')});
  await dialog.evaluate(el=>{el.scrollTop=el.scrollHeight});
  await page.waitForTimeout(150);
  await page.screenshot({path:path.join(out,id+'-'+width+'-rodape.png')});
  results.push({id,width,dialogBounds:bounds,icons:icons.length,horizontalOverflow:overflow});
  fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(results,null,2));
  console.log('PASS',id,width);
  await page.keyboard.press('Escape');
 }
}
console.log('PASS',results.length,'responsive dialog checks');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
