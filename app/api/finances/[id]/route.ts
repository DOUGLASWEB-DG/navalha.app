import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { id } = await params
    // where com barbeariaId: checagem e exclusão numa só operação; id de outra barbearia vira P2025 (404)
    await prisma.transaction.delete({ where: { id, barbeariaId: barbearia.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Finances DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
