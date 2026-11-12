const fs=require('fs'),assert=require('assert/strict');
const {PrismaClient}=require('@prisma/client');
const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
if(new URL(process.env.DATABASE_URL).hostname!=='127.0.0.1')throw Error('Local fixtures only');
const db=new PrismaClient();
(async()=>{
const original=await db.user.findUniqueOrThrow({where:{id:'icons-qa-barber'}});
const group=await db.barbearia.findUniqueOrThrow({where:{id:'icons-qa-demo'}});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const context=await browser.newContext({viewport:{width:1280,height:900}});
const r=await context.request.post('http://127.0.0.1:3473/api/auth/login',{headers:{Host:'demo.localhost:3473'},data:{email:'icons.demo@local.dev',password:'Icons-Local-Test-2026'}});
assert.equal(r.status(),200);
await context.addCookies([{name:'barberos_session',value:r.headers()['set-cookie'].match(/barberos_session=([^;]+)/)[1],domain:'demo.localhost',path:'/',httpOnly:true,secure:false,sameSite:'Lax'}]);
const page=await context.newPage();
const hydrated=page.waitForResponse(r=>r.url().includes('/api/auth/me')&&r.status()===200,{timeout:90000});
await page.goto('http://demo.localhost:3473/dashboard/users',{waitUntil:'domcontentloaded'});await hydrated;
await page.getByText('Barbeiro Demo QA',{exact:true}).waitFor();
const card=page.locator('div.group').filter({has:page.getByText('Barbeiro Demo QA',{exact:true})});
await card.getByRole('button').first().click();
await page.getByRole('menuitem',{name:/Editar/}).click();
await page.getByRole('dialog').waitFor();
await page.getByRole('dialog').getByLabel('Cadastrar agendamentos',{exact:true}).selectOption('deny');
const saved=page.waitForResponse(r=>r.url().includes('/api/users/icons-qa-barber')&&r.request().method()==='PATCH');
await page.getByRole('dialog').getByRole('button',{name:'Salvar',exact:true}).click();
assert.equal((await saved).status(),200);
assert.equal((await db.user.findUniqueOrThrow({where:{id:original.id}})).permissionOverrides['appointments.create'],false);
console.log('PASS UI saves individual deny');
await page.getByRole('button',{name:'Permissões da equipe',exact:true}).click();
await page.getByRole('dialog').getByRole('checkbox',{name:/Cadastrar agendamentos/}).uncheck();
const teamSaved=page.waitForResponse(r=>r.url().includes('/api/team-permissions')&&r.request().method()==='PATCH');
await page.getByRole('button',{name:'Salvar permissões',exact:true}).click();assert.equal((await teamSaved).status(),200);
assert.equal((await db.barbearia.findUniqueOrThrow({where:{id:group.id}})).barberPermissions['appointments.create'],false);
console.log('PASS UI saves group policy');
fs.writeFileSync('qa/2026-11-11-icones/permissoes-ui.json',JSON.stringify({individualSave:'PASS',groupSave:'PASS'},null,2));
}finally{
await browser.close();
await db.user.update({where:{id:original.id},data:{permissionOverrides:original.permissionOverrides}});
await db.barbearia.update({where:{id:group.id},data:{barberPermissions:group.barberPermissions}});
await db.$disconnect();
}
})().catch(e=>{console.error(e);process.exitCode=1;});
