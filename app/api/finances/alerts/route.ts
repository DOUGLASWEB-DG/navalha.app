import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET() {
  try {
    const alerts = await prisma.financeAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = alerts.filter((a) => !a.read).length

    return NextResponse.json({ alerts, unreadCount })
  } catch (error) {
    console.error('[Alerts GET]', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, id } = body

    if (action === 'markRead' && id) {
      await prisma.financeAlert.update({
        where: { id },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'markAllRead') {
      await prisma.financeAlert.updateMany({
        where: { read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'generate') {
      const now = new Date()
      const currentStart = startOfMonth(now)
      const currentEnd = endOfMonth(now)
      const prevStart = startOfMonth(subMonths(now, 1))
      const prevEnd = endOfMonth(subMonths(now, 1))

      const currentExpense = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: currentStart, lte: currentEnd } },
        _sum: { amount: true },
      })
      const prevExpense = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      })
      const currentIncome = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: currentStart, lte: currentEnd } },
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
      if (currInc === 0 && now.getDate() > 10) {
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
    console.error('[Alerts POST]', error)
    return NextResponse.json({ error: 'Failed to process alert action' }, { status: 500 })
  }
}
