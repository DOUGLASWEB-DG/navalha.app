import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { requireTenantAdmin, requireTenantUser, tenantErrorResponse } from '@/lib/api'

const payCommissionSchema = z.object({
  barberId: z.string().min(1),
  appointmentIds: z.array(z.string()).min(1),
  amount: z.number().min(0.01),
  notes: z.string().optional(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const { searchParams } = new URL(req.url)
    const barberIdFilter = searchParams.get('barberId')

    const isBarber = user.role === 'BARBER'
    const targetBarberId = isBarber ? user.id : barberIdFilter

    // Busca barbeiros ativos da barbearia
    const barbers = await prisma.user.findMany({
      where: {
        barbeariaId: barbearia.id,
        role: 'BARBER',
        ...(targetBarberId ? { id: targetBarberId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        commissionPercent: true,
        avatarUrl: true,
      },
      orderBy: { name: 'asc' },
    })

    // Busca agendamentos concluídos com comissão calculada
    const appointments = await prisma.appointment.findMany({
      where: {
        barbeariaId: barbearia.id,
        status: 'COMPLETED',
        barberId: targetBarberId ? targetBarberId : { not: null },
      },
      select: {
        id: true,
        date: true,
        barberId: true,
        commissionPercent: true,
        commissionAmount: true,
        commissionPaid: true,
        client: { select: { id: true, name: true } },
        service: { select: { name: true, price: true } },
        appointmentServices: { select: { price: true, service: { select: { name: true } } } },
        clientPackage: { select: { id: true, package: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
    })

    // Agrupa totais por barbeiro
    const summaryByBarber = barbers.map((b) => {
      const barberAppts = appointments.filter((a) => a.barberId === b.id)
      const totalEarned = barberAppts.reduce((acc, a) => acc + (a.commissionAmount || 0), 0)
      const totalPaid = barberAppts
        .filter((a) => a.commissionPaid)
        .reduce((acc, a) => acc + (a.commissionAmount || 0), 0)
      const balancePending = barberAppts
        .filter((a) => !a.commissionPaid)
        .reduce((acc, a) => acc + (a.commissionAmount || 0), 0)

      return {
        barber: b,
        totalAppointments: barberAppts.length,
        totalEarned: Math.round(totalEarned * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        balancePending: Math.round(balancePending * 100) / 100,
      }
    })

    return NextResponse.json({
      summaries: summaryByBarber,
      appointments: isBarber ? appointments.filter((a) => a.barberId === user.id) : appointments,
    })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Commissions GET]', error)
    return NextResponse.json({ error: 'Erro ao carregar comissões' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const body = await req.json()
    const parsed = payCommissionSchema.parse(body)

    const barber = await prisma.user.findFirst({
      where: { id: parsed.barberId, barbeariaId: barbearia.id },
    })
    if (!barber) {
      return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Marca os agendamentos selecionados como pagos
      await tx.appointment.updateMany({
        where: {
          id: { in: parsed.appointmentIds },
          barbeariaId: barbearia.id,
          barberId: parsed.barberId,
        },
        data: {
          commissionPaid: true,
        },
      })

      // 2. Registra a despesa de repasse no caixa financeiro
      const expense = await tx.transaction.create({
        data: {
          barbeariaId: barbearia.id,
          type: 'EXPENSE',
          amount: parsed.amount,
          description: `Repasse de Comissão — ${barber.name}`,
          category: 'Comissões',
          date: new Date(),
        },
      })

      return expense
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Commissions POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao registrar pagamento de comissão' }, { status: 500 })
  }
}
