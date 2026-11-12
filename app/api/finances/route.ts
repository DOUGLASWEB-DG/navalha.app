import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { sendTextMessage } from '@/lib/whatsapp'
import { notFound, requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { parseZonedDate, zonedMonthRange } from '@/lib/time-zone'

const createSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(LIMITES.descricaoFinanceira),
  category: z.string().max(LIMITES.categoria).optional(),
  categoryId: z.string().max(LIMITES.id).optional(),
  date: z.string().max(LIMITES.data),
})

export async function GET(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month') // "2024-01"
    const type = searchParams.get('type') // INCOME | EXPENSE | null

    // Filtros opcionais da tela; a barbearia entra explícita em cada consulta abaixo
    const filters: any = {}

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      // Mês do calendário no fuso da barbearia, intervalo [início, próximo mês)
      const { start, end } = zonedMonthRange(year, month, barbearia.timezone)
      filters.date = { gte: start, lt: end }
    }

    if (type && type !== 'ALL') {
      filters.type = type
    }

    const [transactions, groupedSummary] = await Promise.all([
      prisma.transaction.findMany({
        where: { ...filters, barbeariaId: barbearia.id },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          category: true,
          categoryId: true,
          appointmentId: true,
          date: true,
          createdAt: true,
          updatedAt: true,
          appointment: {
            select: {
              id: true,
              client: { select: { id: true, name: true } },
              service: { select: { id: true, name: true } },
              appointmentServices: {
                select: {
                  price: true,
                  durationMins: true,
                  service: { select: { id: true, name: true } },
                },
              },
            },
          },
          categoryRef: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
      }),
      prisma.transaction.groupBy({
        by: ['type'],
        where: { ...filters, barbeariaId: barbearia.id },
        _sum: { amount: true },
      }),
    ])

    // Summary
    let income = 0
    let expense = 0

    for (const group of groupedSummary) {
      if (group.type === 'INCOME') {
        income = group._sum.amount ?? 0
      } else if (group.type === 'EXPENSE') {
        expense = group._sum.amount ?? 0
      }
    }

    return NextResponse.json({
      transactions,
      summary: {
        income,
        expense,
        profit: income - expense,
      },
    })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Finances GET]', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const body = await req.json()
    const parsed = createSchema.parse(body)

    // Referência cruzada: a categoria precisa ser da mesma barbearia (o banco não impede o contrário)
    if (parsed.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsed.categoryId, barbeariaId: barbearia.id },
        select: { id: true },
      })
      if (!category) throw notFound('Categoria não encontrada.')
    }

    const transaction = await prisma.transaction.create({
      data: {
        barbeariaId: barbearia.id,
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        categoryId: parsed.categoryId || null,
        date: parseZonedDate(parsed.date, barbearia.timezone),
      },
    })

    try {
      const adminPhone = process.env.ADMIN_PHONE;
      const symbol = transaction.type === 'INCOME' ? '🟢' : '🔴';
      const tipoStr = transaction.type === 'INCOME' ? 'Receita' : 'Despesa';
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);
      const msg = `${symbol} *Nova Transação Registrada*\n\nTipo: ${tipoStr}\nValor: ${formattedAmount}\nDescrição: ${transaction.description}\nCategoria: ${transaction.category || 'Outros'}`;
      
      if (adminPhone) {
        await sendTextMessage(adminPhone, msg).catch(e => console.error('WhatsApp message error:', e));
      } else {
        console.warn('[Finances POST] ADMIN_PHONE não configurado. Mensagem ao administrador ignorada.');
      }

      // Disparar Evento para Webhook (Fire-and-forget)
      import('crypto').then(({ randomUUID }) => {
        const eventId = randomUUID();
        import('@/lib/events').then(({ dispatchWebhookEvent }) => {
          dispatchWebhookEvent({
            eventId,
            event: 'finance.transaction.created',
            occurredAt: new Date().toISOString(),
            data: {
              transaction: {
                id: transaction.id,
                amount: Number(transaction.amount),
                type: transaction.type,
                description: transaction.description,
                category: transaction.category || 'Outros'
              }
            }
          });
        });
      });
    } catch (e) {
      console.error('Error checking WhatsApp integration:', e);
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Finances POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
