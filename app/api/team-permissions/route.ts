import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api'
import { permissionOverridesSchema } from '@/lib/permission-schema'
import { resolvePermissions } from '@/lib/permissions'
import { z } from 'zod'

export async function GET() {
  try {
    const { barbearia } = await requireTenantAdmin()
    const team = await prisma.barbearia.findFirst({ where: { id: barbearia.id }, select: { barberPermissions: true } })
    return NextResponse.json({ permissions: resolvePermissions('BARBER', team?.barberPermissions, {}) })
  } catch (error) {
    return tenantErrorResponse(error) ?? NextResponse.json({ error: 'Não foi possível consultar as permissões.' }, { status: 500 })
  }
}
export async function PATCH(req: NextRequest) {
  try {
    const { barbearia } = await requireTenantAdmin()
    const body = z.object({ permissions: permissionOverridesSchema }).strict().parse(await req.json())
    const team = await prisma.barbearia.update({
      where: { id: barbearia.id },
      data: { barberPermissions: body.permissions },
      select: { barberPermissions: true },
    })
    return NextResponse.json({ permissions: resolvePermissions('BARBER', team.barberPermissions, {}) })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Permissões inválidas.' }, { status: 400 })
    return tenantErrorResponse(error) ?? NextResponse.json({ error: 'Não foi possível salvar as permissões.' }, { status: 500 })
  }
}
