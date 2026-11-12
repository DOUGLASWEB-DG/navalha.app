const {chromium}=require('C:/Users/SETUP.SH/Desktop/SALAO_AMERICA/ferramentas-qa/node_modules/@playwright/test');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:false,args:['--start-maximized']});
const context=await browser.newContext({viewport:null});
const r=await context.request.post('http://127.0.0.1:3473/api/auth/login',{headers:{Host:'demo.localhost:3473'},data:{email:'icons.demo@local.dev',password:'Icons-Local-Test-2026'}});
if(r.status()!==200)throw Error('Login local falhou: '+r.status());
const cookie=r.headers()['set-cookie'].match(/barberos_session=([^;]+)/)[1];
await context.addCookies([{name:'barberos_session',value:cookie,domain:'demo.localhost',path:'/',httpOnly:true,secure:false,sameSite:'Lax'}]);
const page=await context.newPage();
await page.goto('http://demo.localhost:3473/dashboard',{waitUntil:'domcontentloaded'});
console.log('Navegador aberto no painel local com os ícones novos.');
await new Promise(resolve=>browser.on('disconnected',resolve));
})().catch(e=>{console.error(e.message);process.exit(1)});
