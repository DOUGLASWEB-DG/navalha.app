import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const todayStart = startOfDay(now)

    // --- Otimização: Buscas em Paralelo ---
    const [totalClients, goals, todayAppointments] = await Promise.all([
      prisma.client.count({ where: { isActive: true } }),
      prisma.goal.findMany({
        where: { startDate: { lte: now }, endDate: { gte: now } },
      }),
      prisma.appointment.findMany({
        where: {
          date: { gte: todayStart, lte: endOfDay(now) },
          status: { not: 'CANCELED' },
        },
        include: { client: true, service: true },
        orderBy: { date: 'asc' },
      }),
    ])

    // --- Otimização: Uma Única Busca para Transações ---
    // Buscamos todas as transações desde o início do mês para calcular tudo em memória
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: monthStart } },
      orderBy: { date: 'desc' },
    })
    
    // --- Processamento em Memória (Super Rápido) ---
    let dailyRevenue = 0
    let weeklyRevenue = 0
    const monthlyRevenue = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const chartDataMap = new Map<string, { income: number; expense: number }>()

    for (const t of transactions) {
      if (t.type === 'INCOME') {
        if (t.date >= weekStart) weeklyRevenue += t.amount
        if (t.date >= todayStart) dailyRevenue += t.amount
      }

      // Dados do Gráfico (últimos 7 dias)
      const dayKey = t.date.toISOString().slice(0, 10)
      if (!chartDataMap.has(dayKey)) {
        chartDataMap.set(dayKey, { income: 0, expense: 0 })
      }
      const dayData = chartDataMap.get(dayKey)!
      if (t.type === 'INCOME') dayData.income += t.amount
      else dayData.expense += t.amount
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
      recentTransactions: transactions.slice(0, 5),
      goals,
      chartData,
    })
  } catch (error) {
    console.error('[Dashboard API]', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
