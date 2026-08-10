import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'

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

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        appointment: {
          include: { client: true, service: true },
        },
        categoryRef: true,
      },
    })

    // Summary
    const income = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

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

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('[Finances POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
