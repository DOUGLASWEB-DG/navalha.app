import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { getZonedParts, startOfZonedMonth } from '@/lib/time-zone'

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const alerts = await prisma.financeAlert.findMany({
      where: { barbeariaId: barbearia.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = alerts.filter((a) => !a.read).length

    return NextResponse.json({ alerts, unreadCount })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Alerts GET]', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const barbeariaId = barbearia.id
    const body = await req.json()
    const { action, id } = body

    if (action === 'markRead' && id) {
      await prisma.financeAlert.update({
        where: { id, barbeariaId },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'markAllRead') {
      await prisma.financeAlert.updateMany({
        where: { barbeariaId, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'generate') {
      const now = new Date()
      const timeZone = barbearia.timezone
      // Mês atual e anterior no fuso da barbearia, intervalos [início, próximo início)
      const currentStart = startOfZonedMonth(now, timeZone)
      const currentEnd = startOfZonedMonth(now, timeZone, 1)
      const prevStart = startOfZonedMonth(now, timeZone, -1)
      const prevEnd = currentStart

      const currentExpense = await prisma.transaction.aggregate({
        where: { barbeariaId, type: 'EXPENSE', date: { gte: currentStart, lt: currentEnd } },
        _sum: { amount: true },
      })
      const prevExpense = await prisma.transaction.aggregate({
        where: { barbeariaId, type: 'EXPENSE', date: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      })
      const currentIncome = await prisma.transaction.aggregate({
        where: { barbeariaId, type: 'INCOME', date: { gte: currentStart, lt: currentEnd } },
        _sum: { amount: true },
      })

      const currExp = currentExpense._sum.amount ?? 0
      const prevExp = prevExpense._sum.amount ?? 0
      const currInc = currentIncome._sum.amount ?? 0

      const newAlerts: { type: string; message: string; severity: string }[] = []

      // Comparação com mês anterior
      if (prevExp > 0 && currExp > prevExp) {
        const diff = ((currExp - prevExp) / prevExp) * 100
        if (diff > 30) {
          newAlerts.push({
            type: 'HIGH_SPENDING',
            message: `Despesas ${diff.toFixed(0)}% maiores que o mês anterior. Atual: R$${currExp.toFixed(2)} vs Anterior: R$${prevExp.toFixed(2)}.`,
            severity: 'DANGER',
          })
        } else if (diff > 10) {
          newAlerts.push({
            type: 'MONTH_COMPARISON',
            message: `Despesas ${diff.toFixed(0)}% maiores que o mês anterior. Fique atento aos gastos.`,
            severity: 'WARNING',
          })
        }
      }

      // Saldo negativo
      const profit = currInc - currExp
      if (profit < 0) {
        newAlerts.push({
          type: 'NEGATIVE_BALANCE',
          message: `Atenção! Prejuízo de R$${Math.abs(profit).toFixed(2)} neste mês. Receitas: R$${currInc.toFixed(2)}, Despesas: R$${currExp.toFixed(2)}.`,
          severity: 'DANGER',
        })
      }

      // Sem receitas registradas após dia 10
      if (currInc === 0 && getZonedParts(now, timeZone).day > 10) {
        newAlerts.push({
          type: 'MONTH_COMPARISON',
          message: 'Nenhuma receita registrada este mês. Lembre-se de registrar seus recebimentos.',
          severity: 'WARNING',
        })
      }

      // Saúde financeira positiva
      if (newAlerts.length === 0 && currInc > currExp && currInc > 0) {
        newAlerts.push({
          type: 'MONTH_COMPARISON',
          message: `Ótimo trabalho! Lucro de R$${profit.toFixed(2)} neste mês. Margem: ${((profit / currInc) * 100).toFixed(1)}%.`,
          severity: 'INFO',
        })
      }

      // Salvar alertas no banco
      for (const alert of newAlerts) {
        await prisma.financeAlert.create({
          data: {
            barbeariaId,
            type: alert.type as any,
            message: alert.message,
            severity: alert.severity as any,
            read: false,
          },
        })
      }

      return NextResponse.json({ generated: newAlerts.length, alerts: newAlerts })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Alerts POST]', error)
    return NextResponse.json({ error: 'Failed to process alert action' }, { status: 500 })
  }
}
