import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const resolvedParams = await params
    const { name, description, price, stock, active } = await req.json()

    const product = await prisma.product.update({
      where: { id: resolvedParams.id, barbeariaId: barbearia.id },
      data: {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        active
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Product PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const resolvedParams = await params
    await prisma.product.delete({
      where: { id: resolvedParams.id, barbeariaId: barbearia.id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Product DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 })
  }
}
