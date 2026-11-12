const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
const AxeBuilder=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@axe-core/playwright').default;
const sharp=require('sharp'),root=process.cwd(),out=path.join(root,'qa/2026-11-11-icones/rodada-1');
fs.mkdirSync(out,{recursive:true});
const catalog=JSON.parse(fs.readFileSync('public/assets/icons/catalogo.json'));
(async()=>{
const checks=[],icons=catalog.flatMap(c=>c.icons);
assert.equal(catalog.length,7);assert.equal(icons.length,34);assert.equal(new Set(icons.map(i=>i.id)).size,34);
for(const icon of icons){
 const file=path.join(root,'public',icon.src);assert(fs.existsSync(file));assert(fs.existsSync(path.join(root,'public',icon.original)));
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,192);assert.equal(info.height,192);assert.equal(data[3],0);
 assert(data.some((v,i)=>i%4===3&&v>0));
 checks.push({label:icon.label,bytes:fs.statSync(file).size,transparent:true});
}
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'public','.'+pathname);
 if(!file.startsWith(path.join(root,'public')+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.json')?'application/json':'image/png');
 fs.createReadStream(file).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const results=[];
 for(const width of [390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}); const page=await context.newPage();
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/assets/icons/index.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('article').count(),34);
  assert(await page.locator('article img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth===192)));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const theme of ['dark','light']){
   if(theme==='light')await page.getByRole('button',{name:'Alternar fundo claro/escuro'}).click();
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
   fs.writeFileSync(path.join(out,'axe-'+width+'-'+theme+'.json'),JSON.stringify(axe.violations,null,2));
   await page.screenshot({path:path.join(out,'catalogo-'+width+'-'+theme+'.png'),fullPage:true});
   results.push({width,theme,axeViolations:axe.violations.length});
  }
  assert.equal(failures.length,0);await context.close();
 }
 fs.writeFileSync(path.join(out,'verificacao.json'),JSON.stringify({icons:checks,browser:results},null,2));
 console.log(JSON.stringify({icons:checks.length,totalBytes:checks.reduce((n,i)=>n+i.bytes,0),browser:results}));
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
