import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const categories = await prisma.category.findMany({
      where: { barbeariaId: barbearia.id, active: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Categories GET]', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
