import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  durationMins: z.number().int().positive().default(30),
  active: z.boolean().default(true),
})

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(services)
  } catch (error) {
    console.error('[Services GET]', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.parse(body)

    const service = await prisma.service.create({ data: parsed })
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('[Services POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
