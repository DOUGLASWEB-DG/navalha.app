import { getUserPermissions } from '@/lib/api'
import { NextResponse } from 'next/server'
import { getTenantSession } from '@/lib/auth'

export async function GET() {
  const session = await getTenantSession().catch(() => null)

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // timezone: as telas do painel exibem datas e horários no relógio da barbearia, não no do aparelho
  const permissions = await getUserPermissions(session)
  return NextResponse.json({ user: session.user, timezone: session.barbearia.timezone, permissions })
}
