import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api-error'
import { limiteBarbeiros, mensagemLimiteBarbeiros } from '@/lib/plan'

// Barbeiros ativos (cargo BARBER) contam para o limite do plano; o proprietário (ADMIN) não.
// Lança 403 se já não couber mais um. `ignorarUserId` serve à edição: a própria pessoa não conta contra si mesma.
export async function assertCabeMaisUmBarbeiro(barbeariaId: string, ignorarUserId?: string) {
  const ativos = await prisma.user.count({
    where: { barbeariaId, role: 'BARBER', active: true, ...(ignorarUserId ? { id: { not: ignorarUserId } } : {}) },
  })
  if (ativos >= limiteBarbeiros()) throw new ApiError(403, mensagemLimiteBarbeiros())
}
