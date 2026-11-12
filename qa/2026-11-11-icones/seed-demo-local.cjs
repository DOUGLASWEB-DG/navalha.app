const {PrismaClient}=require('@prisma/client'),bcrypt=require('bcryptjs');
const db=new PrismaClient();
(async()=>{
const id='icons-qa-demo';
await db.barbearia.upsert({where:{id},update:{},create:{id,name:'Barbearia Demo QA',subdomain:'demo',timezone:'America/Porto_Velho'}});
const password=await bcrypt.hash('Icons-Local-Test-2026',10);
await db.user.upsert({where:{id:'icons-qa-admin'},update:{},create:{id:'icons-qa-admin',barbeariaId:id,name:'Administrador Demo QA',email:'icons.demo@local.dev',password,role:'ADMIN'}});
await db.user.upsert({where:{id:'icons-qa-barber'},update:{},create:{id:'icons-qa-barber',barbeariaId:id,name:'Barbeiro Demo QA',email:'icons.barber@local.dev',password,role:'BARBER',commissionPercent:30}});
await db.client.upsert({where:{id:'icons-qa-client'},update:{},create:{id:'icons-qa-client',barbeariaId:id,name:'Cliente fictício QA',phone:'5500000000000'}});
await db.service.upsert({where:{id:'icons-qa-service'},update:{},create:{id:'icons-qa-service',barbeariaId:id,name:'Corte de demonstração',price:40,durationMins:30}});
const today=new Date();today.setHours(18,0,0,0);
await db.appointment.upsert({where:{id:'icons-qa-appt'},update:{},create:{id:'icons-qa-appt',barbeariaId:id,clientId:'icons-qa-client',serviceId:'icons-qa-service',barberId:'icons-qa-barber',date:today,status:'CONFIRMED',appointmentServices:{create:[{serviceId:'icons-qa-service',price:40,durationMins:30}]}}});
await db.product.upsert({where:{id:'icons-qa-product'},update:{},create:{id:'icons-qa-product',barbeariaId:id,name:'Pomada de demonstração',price:30,stock:8}});
await db.transaction.upsert({where:{id:'icons-qa-income'},update:{},create:{id:'icons-qa-income',barbeariaId:id,type:'INCOME',amount:120,description:'Receita fictícia QA',date:new Date()}});
await db.transaction.upsert({where:{id:'icons-qa-expense'},update:{},create:{id:'icons-qa-expense',barbeariaId:id,type:'EXPENSE',amount:25,description:'Despesa fictícia QA',date:new Date()}});
await db.goal.upsert({where:{id:'icons-qa-goal'},update:{},create:{id:'icons-qa-goal',barbeariaId:id,title:'Meta de demonstração',type:'REVENUE',targetAmount:500,period:'monthly',startDate:new Date(today.getFullYear(),today.getMonth(),1),endDate:new Date(today.getFullYear(),today.getMonth()+1,0)}});
console.log('Demo local com dados fictícios pronta.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
