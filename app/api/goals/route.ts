import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['REVENUE', 'CLIENTS', 'APPOINTMENTS']),
  targetAmount: z.number().positive('Target must be positive'),
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string(),
  endDate: z.string(),
})

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const goals = await prisma.goal.findMany({
      where: { barbeariaId: barbearia.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(goals)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Goals GET]', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        barbeariaId: barbearia.id,
        title: parsed.title,
        type: parsed.type,
        targetAmount: parsed.targetAmount,
        period: parsed.period,
        startDate: new Date(parsed.startDate),
        endDate: new Date(parsed.endDate),
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Goals POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
