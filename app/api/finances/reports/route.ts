import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = parseInt(searchParams.get('period') || '6')
    const now = new Date()

    // ─── Dados mensais por período ────────────────────────────────────
    const monthlyData: { month: string; receitas: number; despesas: number; saldo: number }[] = []
    for (let i = period - 1; i >= 0; i--) {
      const date = subMonths(now, i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      const income = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: start, lte: end } },
        _sum: { amount: true },
      })
      const expense = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: start, lte: end } },
        _sum: { amount: true },
      })

      const incomeVal = income._sum.amount ?? 0
      const expenseVal = expense._sum.amount ?? 0

      monthlyData.push({
        month: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas: incomeVal,
        despesas: expenseVal,
        saldo: incomeVal - expenseVal,
      })
    }

    // ─── Evolução do patrimônio (acumulado) ───────────────────────────
    const netWorthData = monthlyData.map((m, i) => {
      const cumSaldo = monthlyData.slice(0, i + 1).reduce((s, x) => s + x.saldo, 0)
      return { month: m.month, patrimonio: cumSaldo }
    })

    // ─── Totais gerais ────────────────────────────────────────────────
    const allIncome = await prisma.transaction.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true },
    })
    const allExpense = await prisma.transaction.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true },
    })

    const totalIncome = allIncome._sum.amount ?? 0
    const totalExpense = allExpense._sum.amount ?? 0

    // ─── Breakdown por categoria (todo o período) ─────────────────────
    const periodStart = startOfMonth(subMonths(now, period - 1))
    const periodEnd = endOfMonth(now)

    const catBreakdown = await prisma.transaction.groupBy({
      by: ['categoryId'] as any,
      where: {
        type: 'EXPENSE',
        date: { gte: periodStart, lte: periodEnd },
        categoryId: { not: null },
      } as any,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } } as any,
    })

    const categoryIds = (catBreakdown as any[])
      .map((c: any) => c.categoryId)
      .filter((id: string | null): id is string => id !== null)

    const categories = categoryIds.length > 0
      ? await (prisma as any).category.findMany({ where: { id: { in: categoryIds } } })
      : []

    const catMap = Object.fromEntries((categories as any[]).map((c: any) => [c.id, c]))

    const categoryData = (catBreakdown as any[]).map((c: any) => ({
      id: c.categoryId,
      name: catMap[c.categoryId]?.name ?? 'Outros',
      color: catMap[c.categoryId]?.color ?? '#6b7280',
      value: c._sum?.amount ?? 0,
    }))

    return NextResponse.json({
      monthlyData,
      netWorthData,
      categoryBreakdown: categoryData,
      totals: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
    })
  } catch (error) {
    console.error('[Reports GET]', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
