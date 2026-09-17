import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.appointment.count();
  const withServiceId = await prisma.appointment.count({ where: { serviceId: { not: '' } } });
  
  const appointmentsWithPivot = await prisma.appointment.findMany({
    include: { appointmentServices: true }
  });
  const withPivotCount = appointmentsWithPivot.filter(a => a.appointmentServices.length > 0).length;
  const withoutPivotCount = appointmentsWithPivot.filter(a => a.appointmentServices.length === 0).length;
  
  let inconsistentPivots = 0;
  for (const a of appointmentsWithPivot) {
    if (a.appointmentServices.length > 0) {
      const hasMainServiceIdInPivot = a.appointmentServices.some(p => p.serviceId === a.serviceId);
      if (!hasMainServiceIdInPivot) inconsistentPivots++;
    }
  }

  console.log('Total Appointments:', total);
  console.log('With serviceId:', withServiceId);
  console.log('With pivot (AppointmentService):', withPivotCount);
  console.log('Without pivot (need migration):', withoutPivotCount);
  console.log('Inconsistent pivots (serviceId not in pivot):', inconsistentPivots);
}

main().finally(() => prisma.$disconnect())
