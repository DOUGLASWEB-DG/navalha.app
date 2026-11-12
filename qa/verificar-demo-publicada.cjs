const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict'),path=require('path');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
const base='https://demo.navalhaapp.tech';
const out='qa/2026-11-12-demo-publicada';fs.mkdirSync(out,{recursive:true});
const tokenHelper="const { PrismaClient } = require('@prisma/client')\nconst { createHmac } = require('node:crypto')\nconst db = new PrismaClient()\n;(async () => {\n const role = process.argv[2] === 'BARBER' ? 'BARBER' : 'ADMIN'\n const user = await db.user.findFirst({ where: { role, active: true, barbearia: { subdomain: 'demo' } }, select: { id: true, role: true, barbeariaId: true } })\n if (!user || !process.env.JWT_SECRET) throw new Error('Demo QA identity unavailable')\n const now = Math.floor(Date.now() / 1000)\n const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')\n const body = encode({ alg: 'HS256' }) + '.' + encode({ userId: user.id, role: user.role, barbeariaId: user.barbeariaId, sessionStart: Date.now(), iat: now, exp: now + 900 })\n const token = body + '.' + createHmac('sha256', process.env.JWT_SECRET).update(body).digest('base64url')\n process.stdout.write(JSON.stringify({ token, userId: user.id, role: user.role }))\n})().catch(() => { process.stderr.write('Demo QA identity unavailable'); process.exitCode = 1 }).finally(() => db.$disconnect())\n";
function identity(role){return JSON.parse(cp.execFileSync('ssh',['-o','BatchMode=yes','-o','ConnectTimeout=12','root@2.24.117.253','docker exec -i navalha-demo-app-1 node - '+role],{input:tokenHelper,encoding:'utf8',maxBuffer:1048576}));}
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true}),results={public:[],private:[],screens:[],notes:['Only the demo was authenticated; no real client installation was logged into.']};
try{
const anon=await browser.newContext();
for(const route of ['/','/produto','/login','/book','/assets/icons/catalogo.json']){
const r=await anon.request.get(base+route);assert.equal(r.status(),200,route);results.public.push({route,status:r.status()});
}
const unauth=await anon.request.get(base+'/api/team-permissions');assert.equal(unauth.status(),401);
const admin=identity('ADMIN');
const context=await browser.newContext({viewport:{width:1280,height:900}});
await context.addCookies([{name:'barberos_session',value:admin.token,domain:'demo.navalhaapp.tech',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}]);
const team=await context.request.get(base+'/api/team-permissions');assert.equal(team.status(),200);assert.equal(Object.keys((await team.json()).permissions).length,6);results.private.push({role:'ADMIN',route:'/api/team-permissions',status:team.status()});
const page=await context.newPage();
for(const width of [1280,390]){
await page.setViewportSize({width,height:900});
for(const route of ['/dashboard','/dashboard/appointments','/dashboard/packages','/dashboard/users']){
await page.goto(base+route,{waitUntil:'networkidle',timeout:60000});
assert(!page.url().includes('/login'));
await page.evaluate(()=>document.fonts.ready);
const info=await page.evaluate(()=>({font:getComputedStyle(document.body).fontFamily,overflow:document.documentElement.scrollWidth>innerWidth}));
assert.equal(info.overflow,false,route+' overflow');
assert(info.font.includes('Inter'),'font family preserved');
const visible=await page.locator('img').evaluateAll(images=>images.filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0}).map(i=>({loaded:i.complete&&i.naturalWidth>0,src:i.getAttribute('src')})));
assert(visible.every(i=>i.loaded),'visible images loaded');
await page.screenshot({path:path.join(out,route.split('/').pop()+'-'+width+'.png')});
results.screens.push({route,width,...info});
}
}
await page.getByRole('button',{name:'Permissões da equipe',exact:true}).click();
await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('checkbox').first().waitFor();assert.equal(await page.getByRole('dialog').getByRole('checkbox').count(),6);
await page.screenshot({path:path.join(out,'permissoes-equipe-390.png')});await page.keyboard.press('Escape');
const barber=identity('BARBER'),bc=await browser.newContext();
await bc.addCookies([{name:'barberos_session',value:barber.token,domain:'demo.navalhaapp.tech',path:'/',httpOnly:true,secure:true,sameSite:'Lax'}]);
for(const route of ['/api/team-permissions','/api/finances']){
const r=await bc.request.get(base+route);assert.equal(r.status(),403);results.private.push({role:'BARBER',route,status:r.status()});
}
const appts=await bc.request.get(base+'/api/appointments');assert.equal(appts.status(),200);
assert((await appts.json()).every(a=>a.barber?.id===barber.userId),'own appointments only');results.private.push({role:'BARBER',route:'/api/appointments',status:200,scope:'own'});
fs.writeFileSync(path.join(out,'resultado.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({publicChecks:results.public.length,privateChecks:results.private.length,screens:results.screens.length,fontsPreserved:true}));
}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
