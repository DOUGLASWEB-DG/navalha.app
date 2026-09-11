import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('[Products GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, price, stock, active } = await req.json()
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        active: active ?? true,
      }
    })
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('[Products POST]', error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
