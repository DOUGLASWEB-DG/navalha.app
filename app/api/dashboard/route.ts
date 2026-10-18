import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const barbeariaId = barbearia.id
    const now = new Date()
    const monthStart = startOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const todayStart = startOfDay(now)

    // chart covers last 7 days (today included)
    const chartStart = new Date(now)
    chartStart.setDate(chartStart.getDate() - 6)
    chartStart.setHours(0, 0, 0, 0)

    const earliestTxDate = new Date(Math.min(weekStart.getTime(), chartStart.getTime()))

    // --- Otimização: Buscas em Paralelo e Agregações ---
    const [
      totalClients,
      goals,
      todayAppointments,
      monthlyIncomeResult,
      recentTransactions,
      recentTxForCalculations
    ] = await Promise.all([
      prisma.client.count({ where: { barbeariaId, isActive: true } }),
      prisma.goal.findMany({
        where: { barbeariaId, startDate: { lte: now }, endDate: { gte: now } },
      }),
      prisma.appointment.findMany({
        where: {
          barbeariaId,
          date: { gte: todayStart, lte: endOfDay(now) },
          status: { not: 'CANCELED' },
        },
        include: { client: true, service: true, appointmentServices: { include: { service: true } }, barber: true },
        orderBy: { date: 'asc' },
      }),
      prisma.transaction.aggregate({
        where: { barbeariaId, date: { gte: monthStart }, type: 'INCOME' },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        where: { barbeariaId },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, type: true, description: true, date: true, amount: true }
      }),
      prisma.transaction.findMany({
        where: { barbeariaId, date: { gte: earliestTxDate } },
        select: { date: true, type: true, amount: true }
      })
    ])

    // --- Processamento em Memória Otimizado ---
    let dailyRevenue = 0
    let weeklyRevenue = 0
    const monthlyRevenue = monthlyIncomeResult._sum.amount ?? 0

    const chartDataMap = new Map<string, { income: number; expense: number }>()

    for (const t of recentTxForCalculations) {
      if (t.type === 'INCOME') {
        if (t.date >= weekStart) weeklyRevenue += t.amount
        if (t.date >= todayStart) dailyRevenue += t.amount
      }

      // Apenas processa para o gráfico se a transação estiver na janela de 7 dias do gráfico
      if (t.date >= chartStart) {
        const dayKey = t.date.toISOString().slice(0, 10)
        if (!chartDataMap.has(dayKey)) {
          chartDataMap.set(dayKey, { income: 0, expense: 0 })
        }
        const dayData = chartDataMap.get(dayKey)!
        if (t.type === 'INCOME') dayData.income += t.amount
        else dayData.expense += t.amount
      }
    }

    const chartData = Array.from({ length: 7 }, (_, i) => {
        const day = new Date()
        day.setDate(day.getDate() - i)
        const dayKey = day.toISOString().slice(0, 10)
        const data = chartDataMap.get(dayKey) || { income: 0, expense: 0 }
        return {
          day: day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
          ...data
        }
    }).reverse()
    
    const appointmentStats = {
        total: todayAppointments.length,
        pending: todayAppointments.filter(a => a.status === 'PENDING').length,
        confirmed: todayAppointments.filter(a => a.status === 'CONFIRMED').length,
        completed: todayAppointments.filter(a => a.status === 'COMPLETED').length,
    }
    
    return NextResponse.json({
      todayAppointments,
      revenue: {
        daily: dailyRevenue,
        weekly: weeklyRevenue,
        monthly: monthlyRevenue,
      },
      totalClients,
      appointmentStats,
      recentTransactions,
      goals,
      chartData,
    })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Dashboard API]', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
