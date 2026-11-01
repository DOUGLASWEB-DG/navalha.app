import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(LIMITES.nome),
  email: z.string().trim().toLowerCase().max(LIMITES.email).email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(LIMITES.senha),
  role: z.enum(['ADMIN', 'BARBER']).default('BARBER'),
}).strict()

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()

    const users = await prisma.user.findMany({
      where: { barbeariaId: barbearia.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(users)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Users GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()

    const body = await req.json()
    const parsed = createUserSchema.parse(body)

    // E-mail é único no sistema todo (o login é global), por isso a checagem não filtra por barbearia
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10)
    
    const user = await prisma.user.create({
      data: {
        barbeariaId: barbearia.id,
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        role: parsed.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })
    
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Users POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
