import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { notFound, requireTenantUser, tenantErrorResponse } from '@/lib/api'
import { sendTextMessage } from '@/lib/whatsapp'
import { normalizeBrazilPhone } from '@/lib/format'

const patchSchema = z.object({
  action: z.enum(['use_cut', 'revert_cut', 'update']).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELED']).optional(),
  notes: z.string().optional().nullable(),
  paidToAdmin: z.boolean().optional(),
}).strict()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { barbearia } = await requireTenantUser()
    const resolvedParams = await params
    const id = resolvedParams.id

    const cp = await prisma.clientPackage.findFirst({
      where: { id, barbeariaId: barbearia.id },
      include: {
        client: true,
        package: true,
        barber: { select: { id: true, name: true } },
        appointments: { select: { id: true, date: true, status: true } },
      },
    })
    if (!cp) throw notFound('Pacote do cliente não encontrado')

    return NextResponse.json(cp)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[ClientPackage GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar pacote' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const resolvedParams = await params
    const id = resolvedParams.id
    const body = await req.json()
    const parsed = patchSchema.parse(body)

    const existing = await prisma.clientPackage.findFirst({
      where: { id, barbeariaId: barbearia.id },
      include: { client: true, package: true, barber: true },
    })
    if (!existing) throw notFound('Pacote do cliente não encontrado')

    // Ticar / Utilizar 1 corte
    if (parsed.action === 'use_cut') {
      if (existing.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Este pacote não está ativo.' }, { status: 400 })
      }
      if (existing.usedCuts >= existing.totalCuts) {
        return NextResponse.json({ error: 'Todos os cortes deste pacote já foram utilizados.' }, { status: 400 })
      }

      const nextUsed = existing.usedCuts + 1
      const isLastCut = nextUsed >= existing.totalCuts
      const newStatus = isLastCut ? 'COMPLETED' : 'ACTIVE'
      const remaining = Math.max(0, existing.totalCuts - nextUsed)

      const updated = await prisma.clientPackage.update({
        where: { id, barbeariaId: barbearia.id },
        data: {
          usedCuts: nextUsed,
          status: newStatus,
        },
        include: { client: true, package: true, barber: true },
      })

      // Envia notificação WhatsApp para o cliente
      const phone = normalizeBrazilPhone(existing.client.phone)
      if (phone) {
        const formattedDate = new Intl.DateTimeFormat('pt-BR', { timeZone: barbearia.timezone }).format(existing.expiresAt)
        let message = ''

        if (isLastCut) {
          message = `💈 *Atendimento Concluído!*\n\nOlá, *${existing.client.name}*! Seu corte foi finalizado com sucesso.\n\n⚠️ *Atenção:* Este foi o *ÚLTIMO CORTE* do seu pacote *${existing.package.name}*!\n\nEntre em contato com o Mateus ou seu barbeiro para renovar seu pacote e continuar aproveitando o desconto! 👊✂️`
        } else {
          message = `✅ *Corte do Pacote Registrado!*\n\nOlá, *${existing.client.name}*! Você acabou de utilizar 1 corte do pacote *${existing.package.name}*.\n\n✂️ Cortes restantes: *${remaining}*\n📅 Validade: até ${formattedDate}\n\nObrigado pela preferência! 💈`
        }

        sendTextMessage(phone, message).catch((err) => console.error('[WhatsApp use_cut]', err))
      }

      return NextResponse.json(updated)
    }

    // Estornar / Desfazer 1 corte
    if (parsed.action === 'revert_cut') {
      if (existing.usedCuts <= 0) {
        return NextResponse.json({ error: 'Nenhum corte foi utilizado ainda.' }, { status: 400 })
      }

      const nextUsed = existing.usedCuts - 1
      const updated = await prisma.clientPackage.update({
        where: { id, barbeariaId: barbearia.id },
        data: {
          usedCuts: nextUsed,
          status: 'ACTIVE',
        },
        include: { client: true, package: true, barber: true },
      })
      return NextResponse.json(updated)
    }

    // Atualização normal de campos
    const data: any = {}
    if (parsed.status) data.status = parsed.status
    if (parsed.notes !== undefined) data.notes = parsed.notes
    if (parsed.paidToAdmin !== undefined) data.paidToAdmin = parsed.paidToAdmin

    const updated = await prisma.clientPackage.update({
      where: { id, barbeariaId: barbearia.id },
      data,
      include: { client: true, package: true, barber: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[ClientPackage PATCH]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar pacote do cliente' }, { status: 500 })
  }
}
