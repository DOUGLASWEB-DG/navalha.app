import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const apps = await prisma.appointment.findMany({
    include: { client: true, service: true, appointmentServices: { include: { service: true } } }
  });
  console.log(JSON.stringify(apps, null, 2));
}
main().finally(() => prisma.$disconnect());
