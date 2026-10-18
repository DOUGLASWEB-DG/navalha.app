import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const products = await prisma.product.findMany({
      where: { barbeariaId: barbearia.id },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Products GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const { name, description, price, stock, active } = await req.json()

    const product = await prisma.product.create({
      data: {
        barbeariaId: barbearia.id,
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        active: active ?? true,
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Products POST]', error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
