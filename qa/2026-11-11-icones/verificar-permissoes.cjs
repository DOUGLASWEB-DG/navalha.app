const http=require('http'),assert=require('assert/strict'),fs=require('fs');
const {PrismaClient}=require('@prisma/client'),bcrypt=require('bcryptjs');
const url=process.env.DATABASE_URL||'';
if(!['localhost','127.0.0.1'].includes(new URL(url).hostname))throw Error('Only isolated local DB allowed');
const db=new PrismaClient(),port=Number(process.env.QA_PORT || 3473),results=[];
function request(method,route,body,token,host='demo.localhost'){
return new Promise((resolve,reject)=>{
const data=body===undefined?undefined:JSON.stringify(body);
const r=http.request({hostname:'127.0.0.1',port,path:route,method,headers:{Host:host+':'+port,...(data?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}:{}),...(token?{Cookie:'barberos_session='+token}:{})}},res=>{
const parts=[];res.on('data',x=>parts.push(x));res.on('end',()=>{const text=Buffer.concat(parts).toString();let json;try{json=JSON.parse(text)}catch{}resolve({status:res.statusCode,json,headers:res.headers})});});
r.setTimeout(90000,()=>r.destroy(Error('timeout '+route)));r.on('error',reject);if(data)r.write(data);r.end();
});}
const ok=(name,actual,expected)=>{assert.equal(actual,expected,name);results.push({name,status:'PASS'});console.log('PASS',name);};
(async()=>{
const group=await db.barbearia.findUniqueOrThrow({where:{id:'icons-qa-demo'}});
const testId='icons-qa-permissions-runtime-'+process.pid;
const testEmail='icons.permissions.'+process.pid+'@local.dev';
await db.user.create({data:{id:testId,barbeariaId:group.id,name:'Permission runtime QA',email:testEmail,password:await bcrypt.hash('Icons-Local-Test-2026',10),role:'BARBER'}});
const barber=await db.user.findUniqueOrThrow({where:{id:testId}});
let ownId,otherId;
try{
await db.barbearia.update({where:{id:group.id},data:{barberPermissions:{}}});
await db.user.update({where:{id:barber.id},data:{permissionOverrides:{}}});
await db.user.upsert({where:{id:'icons-qa-barber-other'},update:{},create:{id:'icons-qa-barber-other',barbeariaId:group.id,name:'Outro profissional QA',email:'icons.other@local.dev',password:await bcrypt.hash('Icons-Local-Test-2026',10),role:'BARBER'}});
const date=new Date();date.setUTCDate(date.getUTCDate()+8);while(date.getUTCDay()===0)date.setUTCDate(date.getUTCDate()+1);date.setUTCHours(14,0,0,0);
const apptBody={clientId:'icons-qa-client',serviceIds:['icons-qa-service'],barberId:'icons-qa-barber-other',date:date.toISOString(),status:'PENDING'};
const adminLogin=await request('POST','/api/auth/login',{email:'icons.demo@local.dev',password:'Icons-Local-Test-2026'});ok('admin login',adminLogin.status,200);
const barberLogin=await request('POST','/api/auth/login',{email:testEmail,password:'Icons-Local-Test-2026'});ok('barber login',barberLogin.status,200);
const token=r=>r.headers['set-cookie'][0].match(/barberos_session=([^;]+)/)[1];
const adminToken=token(adminLogin),barberToken=token(barberLogin);
const created=await request('POST','/api/appointments',apptBody,barberToken);ok('barber creates own appointment',created.status,201);ownId=created.json.id;ok('client-supplied other barber ignored',created.json.barberId,barber.id);
const other=await db.appointment.create({data:{barbeariaId:group.id,clientId:'icons-qa-client',serviceId:'icons-qa-service',barberId:'icons-qa-barber-other',date,status:'PENDING'}});otherId=other.id;
const list=await request('GET','/api/appointments',undefined,barberToken);ok('barber lists own appointments only',list.json.every(a=>a.barber?.id===barber.id),true);
ok('cannot edit other barber', (await request('PATCH','/api/appointments/'+other.id,{notes:'must fail'},barberToken)).status,403);
ok('cannot grant own admin role',(await request('PATCH','/api/users/'+barber.id,{role:'ADMIN'},barberToken)).status,403);
ok('cannot change team permissions',(await request('PATCH','/api/team-permissions',{permissions:{}},barberToken)).status,403);
ok('cannot access shop finances',(await request('GET','/api/finances',undefined,barberToken)).status,403);
ok('admin saves group policy',(await request('PATCH','/api/team-permissions',{permissions:{'appointments.edit':false,'appointments.create':false,'clients.create':false}},adminToken)).status,200);
ok('group immediately blocks editing',(await request('PATCH','/api/appointments/'+ownId,{notes:'blocked'},barberToken)).status,403);
ok('group immediately blocks creation',(await request('POST','/api/appointments',apptBody,barberToken)).status,403);
ok('group blocks client creation',(await request('POST','/api/clients',{name:'Must not create',phone:'5569900009999'},barberToken)).status,403);
ok('admin grants individual exception',(await request('PATCH','/api/users/'+barber.id,{permissionOverrides:{'appointments.edit':true}},adminToken)).status,200);
ok('exception allows own edit with same session',(await request('PATCH','/api/appointments/'+ownId,{notes:'exception allowed'},barberToken)).status,200);
ok('exception never allows editing colleague',(await request('PATCH','/api/appointments/'+other.id,{notes:'must still fail'},barberToken)).status,403);
ok('exception does not allow new appointments',(await request('POST','/api/appointments',apptBody,barberToken)).status,403);
ok('unknown privileged capability rejected',(await request('PATCH','/api/team-permissions',{permissions:{'finances.manage':true}},adminToken)).status,400);
const auth=await request('GET','/api/auth/me',undefined,barberToken);ok('frontend gets effective override',auth.json.permissions['appointments.edit'],true);ok('frontend gets group denial',auth.json.permissions['appointments.create'],false);
ok('cross tenant cookie refused',(await request('GET','/api/appointments',undefined,barberToken,'teste-b.localhost')).status,401);
fs.writeFileSync('qa/2026-11-11-icones/permissoes-integracao.json',JSON.stringify(results,null,2));
console.log('ALL',results.length,'permission integration checks passed');
}finally{
await db.barbearia.update({where:{id:group.id},data:{barberPermissions:group.barberPermissions}});
await db.user.update({where:{id:barber.id},data:{permissionOverrides:barber.permissionOverrides}});
for(const id of [ownId,otherId].filter(Boolean))await db.appointment.deleteMany({where:{id,barbeariaId:group.id}});
await db.user.deleteMany({where:{id:'icons-qa-barber-other',barbeariaId:group.id}});
await db.user.deleteMany({where:{id:testId,barbeariaId:group.id}});
await db.$disconnect();
}
})().catch(e=>{console.error(e);process.exitCode=1;});
