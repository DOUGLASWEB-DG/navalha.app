import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { notFound, requireTenantUser, tenantErrorResponse } from '@/lib/api'
import { sendTextMessage } from '@/lib/whatsapp'
import { normalizeBrazilPhone } from '@/lib/format'

const createClientPackageSchema = z.object({
  clientId: z.string().min(1).max(LIMITES.id),
  packageId: z.string().min(1).max(LIMITES.id),
  barberId: z.string().max(LIMITES.id).optional().nullable(),
  paidToAdmin: z.boolean().default(true),
  notes: z.string().max(LIMITES.notas).optional().nullable(),
}).strict()

export async function GET(req: NextRequest) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const barberId = searchParams.get('barberId')

    const where: any = {
      barbeariaId: barbearia.id,
      ...(clientId ? { clientId } : {}),
      ...(status && status !== 'ALL' ? { status } : {}),
    }

    if (user.role === 'BARBER') {
      // Barbeiro vê pacotes atribuídos a ele ou gerais
      where.OR = [{ barberId: user.id }, { barberId: null }]
    } else if (barberId) {
      where.barberId = barberId
    }

    const clientPackages = await prisma.clientPackage.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        package: true,
        barber: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(clientPackages)
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[ClientPackages GET]', error)
    return NextResponse.json({ error: 'Erro ao listar pacotes de clientes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, barbearia } = await requireTenantUser()
    const body = await req.json()
    const parsed = createClientPackageSchema.parse(body)

    const [pkg, client] = await Promise.all([
      prisma.package.findFirst({
        where: { id: parsed.packageId, barbeariaId: barbearia.id, active: true },
      }),
      prisma.client.findFirst({
        where: { id: parsed.clientId, barbeariaId: barbearia.id, isActive: true },
      }),
    ])

    if (!pkg) throw notFound('Pacote não encontrado ou inativo')
    if (!client) throw notFound('Cliente não encontrado')

    const assignedBarberId = user.role === 'BARBER' ? user.id : (parsed.barberId || pkg.barberId || null)

    const startDate = new Date()
    const expiresAt = new Date(startDate.getTime() + pkg.validityDays * 24 * 60 * 60 * 1000)

    const clientPackage = await prisma.$transaction(async (tx) => {
      const created = await tx.clientPackage.create({
        data: {
          barbeariaId: barbearia.id,
          clientId: client.id,
          packageId: pkg.id,
          barberId: assignedBarberId,
          totalCuts: pkg.totalCuts,
          usedCuts: 0,
          startDate,
          expiresAt,
          status: 'ACTIVE',
          paidToAdmin: parsed.paidToAdmin,
          notes: parsed.notes,
        },
        include: {
          client: true,
          package: true,
          barber: true,
        },
      })

      // Se pago no ato da compra, lança receita imediata no caixa da barbearia
      if (parsed.paidToAdmin) {
        await tx.transaction.create({
          data: {
            barbeariaId: barbearia.id,
            type: 'INCOME',
            amount: pkg.price,
            description: `Pacote: ${pkg.name} — ${client.name}`,
            category: 'Pacotes',
            date: startDate,
          },
        })
      }

      return created
    })

    // Notificação via WhatsApp ao cliente sobre o pacote adquirido
    const targetPhone = normalizeBrazilPhone(client.phone)
    if (targetPhone) {
      const formattedDate = new Intl.DateTimeFormat('pt-BR', { timeZone: barbearia.timezone }).format(expiresAt)
      const msg = `💈 *Novo Pacote de Cortes!*\n\nOlá, *${client.name}*! Seu pacote *${pkg.name}* (${pkg.totalCuts} cortes) foi registrado com sucesso!\n\n📅 Validade: até ${formattedDate}\n✂️ Saldo: ${pkg.totalCuts} cortes disponíveis.\n\nObrigado pela preferência e até o seu próximo corte!`
      sendTextMessage(targetPhone, msg).catch((err) => console.error('[WhatsApp ClientPackage] Erro ao enviar mensagem:', err))
    }

    return NextResponse.json(clientPackage, { status: 201 })
  } catch (error: any) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[ClientPackages POST]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Dados inválidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atribuir pacote' }, { status: 500 })
  }
}
