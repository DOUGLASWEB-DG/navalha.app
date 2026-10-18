import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { getAppointmentServiceSummary } from '@/lib/appointment-services'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { searchParams } = new URL(req.url)
    const period = parseInt(searchParams.get('period') || '6')
    const now = new Date()

    const periodStart = startOfMonth(subMonths(now, period - 1))
    const periodEnd = endOfMonth(now)

    const transactions = await prisma.transaction.findMany({
      where: {
        barbeariaId: barbearia.id,
        date: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { date: 'desc' },
      include: {
        appointment: {
          include: {
            client: true,
            service: true,
            appointmentServices: { include: { service: true } },
          },
        },
        categoryRef: true,
      } as any,
    })

    // Gerar CSV
    const header = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Cliente', 'Serviço']
    const rows = (transactions as any[]).map((t: any) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'INCOME' ? 'Receita' : 'Despesa',
      t.description,
      t.categoryRef?.name || t.category || '',
      t.amount.toFixed(2),
      t.appointment?.client?.name || '',
      t.appointment ? getAppointmentServiceSummary(t.appointment).namesJoined : '',
    ])

    const csvContent = [
      header.join(';'),
      ...rows.map(r => r.join(';')),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="financeiro-${period}meses.csv"`,
      },
    })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Export GET]', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
