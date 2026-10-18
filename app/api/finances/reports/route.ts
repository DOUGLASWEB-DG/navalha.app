import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { startOfZonedMonth } from '@/lib/time-zone'

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const barbeariaId = barbearia.id
    const timeZone = barbearia.timezone
    const { searchParams } = new URL(req.url)
    const period = parseInt(searchParams.get('period') || '6')
    const now = new Date()

    // Meses do calendário no fuso da barbearia; periodEnd é o início do mês seguinte (exclusivo)
    const periodStart = startOfZonedMonth(now, timeZone, -(period - 1))
    const periodEnd = startOfZonedMonth(now, timeZone, 1)

    // ─── Disparo Paralelo Massivo ──────────────────────────────────────
    const [
      periodTransactions,
      allIncomeReq,
      allExpenseReq,
      catBreakdown,
    ] = await Promise.all([
      // 1. Histórico do período
      prisma.transaction.findMany({
        where: { barbeariaId, date: { gte: periodStart, lt: periodEnd } },
        select: { amount: true, type: true, date: true }
      }),
      // 2. Totais de toda a vida
      prisma.transaction.aggregate({ where: { barbeariaId, type: 'INCOME' }, _sum: { amount: true } }),
      // 3. Totais de toda a vida
      prisma.transaction.aggregate({ where: { barbeariaId, type: 'EXPENSE' }, _sum: { amount: true } }),
      // 4. Breakdown de categorias do período
      prisma.transaction.groupBy({
        by: ['categoryId'] as any,
        where: { barbeariaId, type: 'EXPENSE', date: { gte: periodStart, lt: periodEnd }, categoryId: { not: null } } as any,
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } } as any
      })
    ])

    // ─── Processamento em Memória ────────────────────────────────────
    const monthBoundaries = Array.from({ length: period }, (_, idx) => {
      const i = period - 1 - idx
      const start = startOfZonedMonth(now, timeZone, -i)
      // Dia 15 do mês para o rótulo: longe das bordas, nunca cai no mês vizinho
      const label = new Date(start.getTime() + 14 * DAY_MS)
      return {
        month: label.toLocaleString('pt-BR', { month: 'short', year: '2-digit', timeZone }),
        start,
        end: startOfZonedMonth(now, timeZone, -i + 1),
        receitas: 0,
        despesas: 0
      }
    })

    for (const t of periodTransactions) {
      for (const m of monthBoundaries) {
        if (t.date >= m.start && t.date < m.end) {
          if (t.type === 'INCOME') m.receitas += t.amount
          else m.despesas += t.amount
          break
        }
      }
    }

    const monthlyData = monthBoundaries.map(m => ({
      month: m.month,
      receitas: m.receitas,
      despesas: m.despesas,
      saldo: m.receitas - m.despesas
    }))

    // ─── Evolução do patrimônio (acumulado) ───────────────────────────
    const netWorthData = monthlyData.map((m, i) => {
      const cumSaldo = monthlyData.slice(0, i + 1).reduce((s, x) => s + x.saldo, 0)
      return { month: m.month, patrimonio: cumSaldo }
    })

    // ─── Totais gerais ────────────────────────────────────────────────
    const totalIncome = allIncomeReq._sum.amount ?? 0
    const totalExpense = allExpenseReq._sum.amount ?? 0

    // ─── Breakdown por categoria (todo o período) ─────────────────────
    const categoryIds = (catBreakdown as any[])
      .map((c: any) => c.categoryId)
      .filter((id: string | null): id is string => id !== null)

    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({ where: { id: { in: categoryIds }, barbeariaId } })
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
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Reports GET]', error)
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
