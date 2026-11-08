import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { notFound, requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { removeStoredImage } from '@/lib/uploads/route-helpers'

const updateUserSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres').max(LIMITES.nome).optional(),
  email: z.string().trim().toLowerCase().max(LIMITES.email).email('E-mail inválido').optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').max(LIMITES.senha).optional(),
  role: z.enum(['ADMIN', 'BARBER']).optional(),
  active: z.boolean().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
}).strict()

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantAdmin()
    const barbeariaId = auth.barbearia.id

    const resolvedParams = await params
    const targetUserId = resolvedParams.id
    const body = await req.json()
    const parsed = updateUserSchema.parse(body)

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, barbeariaId },
      select: { id: true, role: true, email: true, active: true }
    })

    if (!targetUser) throw notFound('Usuário não encontrado')

    const deactivating = parsed.active === false && targetUser.active
    if (deactivating && auth.user.id === targetUserId) {
      return NextResponse.json({ error: 'Você não pode desativar sua própria conta.' }, { status: 400 })
    }

    // Regra de integridade: sempre sobra ao menos um ADMIN ativo (rebaixar ou desativar o último trava o sistema).
    // Conta só ativos: um admin desativado não consegue administrar.
    const losingActiveAdmin = targetUser.role === 'ADMIN' && targetUser.active
      && ((parsed.role && parsed.role !== 'ADMIN') || deactivating)
    if (losingActiveAdmin) {
      const activeAdminCount = await prisma.user.count({ where: { barbeariaId, role: 'ADMIN', active: true } })
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: deactivating
            ? 'Não é possível desativar o único administrador ativo.'
            : 'Não é possível rebaixar o único administrador ativo.' },
          { status: 400 }
        )
      }
    }

    // Se o email está sendo alterado, verificar unicidade
    if (parsed.email && parsed.email !== targetUser.email) {
      const emailInUse = await prisma.user.findUnique({ where: { email: parsed.email } })
      if (emailInUse) {
        return NextResponse.json({ error: 'E-mail já cadastrado por outro usuário' }, { status: 400 })
      }
    }

    const data: { name?: string; email?: string; role?: 'ADMIN' | 'BARBER'; password?: string; active?: boolean; commissionPercent?: number } = {}
    if (parsed.name) data.name = parsed.name
    if (parsed.email) data.email = parsed.email
    if (parsed.role) data.role = parsed.role
    if (parsed.active !== undefined) data.active = parsed.active
    if (parsed.commissionPercent !== undefined) data.commissionPercent = parsed.commissionPercent
    if (parsed.password) {
      data.password = await bcrypt.hash(parsed.password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId, barbeariaId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        commissionPercent: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[User PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantAdmin()
    const barbeariaId = auth.barbearia.id

    const resolvedParams = await params
    const targetUserId = resolvedParams.id

    // Regra de segurança: impedir que o usuário autenticado delete a si mesmo
    if (auth.user.id === targetUserId) {
      return NextResponse.json(
        { error: 'Você não pode excluir sua própria conta enquanto logado.' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, barbeariaId },
      select: { id: true, role: true, avatarUrl: true }
    })

    if (!targetUser) throw notFound('Usuário não encontrado')

    // Regra de integridade: impedir que o último ADMIN seja excluído
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { barbeariaId, role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível excluir o único administrador do sistema.' },
          { status: 400 }
        )
      }
    }

    await prisma.user.delete({
      where: { id: targetUserId, barbeariaId }
    })
    // Usuário excluído: a foto fica órfã no disco, então é removida (falha aqui não desfaz a exclusão)
    await removeStoredImage(targetUser.avatarUrl, 'User DELETE')

    return NextResponse.json({ success: true })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[User DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 })
  }
}
