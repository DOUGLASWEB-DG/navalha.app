import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'
import { sendTextMessage } from '@/lib/whatsapp'

const createSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  date: z.string(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const monthParam = searchParams.get('month') // "2024-01"
    const type = searchParams.get('type') // INCOME | EXPENSE | null

    const where: any = {}

    if (monthParam) {
      const [year, month] = monthParam.split('-').map(Number)
      const start = startOfMonth(new Date(year, month - 1))
      const end = endOfMonth(new Date(year, month - 1))
      where.date = { gte: start, lte: end }
    }

    if (type && type !== 'ALL') {
      where.type = type
    }

    const [transactions, groupedSummary] = await Promise.all([
      prisma.transaction.findMany({
        where,
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
        where,
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
    console.error('[Finances GET]', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const transaction = await prisma.transaction.create({
      data: {
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        categoryId: parsed.categoryId || null,
        date: new Date(parsed.date),
      },
    })

    try {
      const adminPhone = process.env.ADMIN_PHONE || '5569999630329';
      const symbol = transaction.type === 'INCOME' ? '🟢' : '🔴';
      const tipoStr = transaction.type === 'INCOME' ? 'Receita' : 'Despesa';
      const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);
      const msg = `${symbol} *Nova Transação Registrada*\n\nTipo: ${tipoStr}\nValor: ${formattedAmount}\nDescrição: ${transaction.description}\nCategoria: ${transaction.category || 'Outros'}`;
      
      await sendTextMessage(adminPhone, msg).catch(e => console.error('WhatsApp message error:', e));

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
    console.error('[Finances POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
