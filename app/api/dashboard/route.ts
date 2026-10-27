import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { planoPermite } from '@/lib/plan'
import { startOfZonedDay, startOfZonedMonth, startOfZonedWeek, zonedDayKey } from '@/lib/time-zone'

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const barbeariaId = barbearia.id
    const timeZone = barbearia.timezone
    const now = new Date()
    // "Hoje", "semana" e "mês" no relógio da barbearia, não no fuso do servidor
    const monthStart = startOfZonedMonth(now, timeZone)
    const weekStart = startOfZonedWeek(now, timeZone)
    const todayStart = startOfZonedDay(now, timeZone)
    const tomorrowStart = startOfZonedDay(now, timeZone, 1)

    // chart covers last 7 days (today included)
    const chartStart = startOfZonedDay(now, timeZone, -6)

    const earliestTxDate = new Date(Math.min(weekStart.getTime(), chartStart.getTime()))

    // Plano: sem Finanças não se consulta nem se devolve receita, transações e gráfico; sem Metas, nenhuma meta.
    // O dado continua sendo gravado (concluir um atendimento lança a receita), então ao ampliar o plano nada se perde.
    const comFinancas = planoPermite('financas')
    const comMetas = planoPermite('metas')

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
      comMetas
        ? prisma.goal.findMany({ where: { barbeariaId, startDate: { lte: now }, endDate: { gte: now } } })
        : Promise.resolve([]),
      prisma.appointment.findMany({
        where: {
          barbeariaId,
          date: { gte: todayStart, lt: tomorrowStart },
          status: { not: 'CANCELED' },
        },
        include: { client: true, service: true, appointmentServices: { include: { service: true } }, barber: true },
        orderBy: { date: 'asc' },
      }),
      comFinancas
        ? prisma.transaction.aggregate({
            where: { barbeariaId, date: { gte: monthStart }, type: 'INCOME' },
            _sum: { amount: true }
          })
        : Promise.resolve({ _sum: { amount: null as number | null } }),
      comFinancas
        ? prisma.transaction.findMany({
            where: { barbeariaId },
            orderBy: { date: 'desc' },
            take: 5,
            select: { id: true, type: true, description: true, date: true, amount: true }
          })
        : Promise.resolve([] as { id: string; type: 'INCOME' | 'EXPENSE'; description: string; date: Date; amount: number }[]),
      comFinancas
        ? prisma.transaction.findMany({
            where: { barbeariaId, date: { gte: earliestTxDate } },
            select: { date: true, type: true, amount: true }
          })
        : Promise.resolve([] as { date: Date; type: 'INCOME' | 'EXPENSE'; amount: number }[])
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
        const dayKey = zonedDayKey(t.date, timeZone)
        if (!chartDataMap.has(dayKey)) {
          chartDataMap.set(dayKey, { income: 0, expense: 0 })
        }
        const dayData = chartDataMap.get(dayKey)!
        if (t.type === 'INCOME') dayData.income += t.amount
        else dayData.expense += t.amount
      }
    }

    const chartData = Array.from({ length: 7 }, (_, i) => {
        // Meio-dia do dia (no fuso) evita cair no dia vizinho ao formatar
        const day = new Date(startOfZonedDay(now, timeZone, -i).getTime() + 12 * 60 * 60 * 1000)
        const dayKey = zonedDayKey(day, timeZone)
        const data = chartDataMap.get(dayKey) || { income: 0, expense: 0 }
        return {
          day: day.toLocaleDateString('pt-BR', { weekday: 'short', timeZone }).replace('.', ''),
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
      revenue: comFinancas
        ? { daily: dailyRevenue, weekly: weeklyRevenue, monthly: monthlyRevenue }
        : null,
      totalClients,
      appointmentStats,
      recentTransactions,
      goals,
      chartData: comFinancas ? chartData : [],
    })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Dashboard API]', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
