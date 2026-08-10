import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const monthsParam = parseInt(searchParams.get('months') || '6', 10)
    const now = new Date()

    // ─── Otimização Principal: Uma única viagem ao banco de dados ─────
    // Buscamos todas as transações dos últimos N meses de uma só vez.
    const firstMonth = startOfMonth(subMonths(now, monthsParam - 1))
    const allTransactions = await prisma.transaction.findMany({
      where: {
        date: { gte: firstMonth },
      },
      select: {
        amount: true,
        type: true,
        date: true,
        categoryId: true,
      },
    })

    // ─── Processamento em Memória (muito mais rápido) ───────────────
    const monthlyMap = new Map<
      string,
      { receitas: number; despesas: number }
    >()
    const categoryMap = new Map<string, number>()
    const currentMonthStart = startOfMonth(now)
    let incomeTotal = 0
    let expenseTotal = 0
    let prevIncomeVal = 0
    let prevExpenseVal = 0

    const prevMonthStart = startOfMonth(subMonths(now, 1))

    for (const t of allTransactions) {
      const monthKey = t.date.toISOString().slice(0, 7) // ex: "2023-04"

      // Inicializa o mapa do mês se não existir
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { receitas: 0, despesas: 0 })
      }
      const monthData = monthlyMap.get(monthKey)!

      // Agrega receitas e despesas
      if (t.type === 'INCOME') {
        monthData.receitas += t.amount
      } else {
        monthData.despesas += t.amount
      }

      // Agrega totais do mês atual
      if (t.date >= currentMonthStart) {
        if (t.type === 'INCOME') {
          incomeTotal += t.amount
        } else {
          expenseTotal += t.amount
          // Agrega breakdown de categorias do mês atual
          if (t.categoryId) {
            categoryMap.set(t.categoryId, (categoryMap.get(t.categoryId) || 0) + t.amount)
          }
        }
      }
      
      // Agrega totais do mês anterior
      if (t.date >= prevMonthStart && t.date < currentMonthStart) {
        if (t.type === 'INCOME') {
          prevIncomeVal += t.amount
        } else {
          prevExpenseVal += t.amount
        }
      }
    }

    // Monta o array de dados mensais
    const monthlyData = Array.from({ length: monthsParam }, (_, i) => {
      const date = subMonths(now, monthsParam - 1 - i)
      const monthKey = date.toISOString().slice(0, 7)
      const data = monthlyMap.get(monthKey) || { receitas: 0, despesas: 0 }
      return {
        month: date.toLocaleString('pt-BR', { month: 'short' }),
        monthFull: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas: data.receitas,
        despesas: data.despesas,
        saldo: data.receitas - data.despesas,
      }
    })

    // Monta o breakdown de categorias
    const categoryIds = Array.from(categoryMap.keys())
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    })
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
    const categoryData = Array.from(categoryMap.entries()).map(([id, sum]) => ({
      id,
      name: catMap[id]?.name ?? 'Outros',
      color: catMap[id]?.color ?? '#6b7280',
      icon: catMap[id]?.icon ?? 'CircleDollarSign',
      value: sum,
    })).sort((a, b) => b.value - a.value)


    // Calcula os totais e tendências
    const profit = incomeTotal - expenseTotal
    const profitMargin = incomeTotal > 0 ? (profit / incomeTotal) * 100 : 0
    const expenseTrend = prevExpenseVal > 0 ? ((expenseTotal - prevExpenseVal) / prevExpenseVal) * 100 : 0
    const incomeTrend = prevIncomeVal > 0 ? ((incomeTotal - prevIncomeVal) / prevIncomeVal) * 100 : 0

    return NextResponse.json({
      currentMonth: { income: incomeTotal, expense: expenseTotal, profit, profitMargin },
      trends: { expense: expenseTrend, income: incomeTrend },
      monthlyData,
      categoryBreakdown: categoryData,
      // allTime pode ser otimizado similarmente se necessário, ou calculado de outra forma
    })
  } catch (error) {
    console.error('[Finance Stats GET]', error)
    return NextResponse.json({ error: 'Failed to fetch finance stats' }, { status: 500 })
  }
}
