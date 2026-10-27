import { NextResponse } from 'next/server'
import { getTenantSession } from '@/lib/auth'
import { resumoDoPlano } from '@/lib/plan'

export async function GET() {
  const session = await getTenantSession().catch(() => null)

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  // timezone: as telas do painel exibem datas e horários no relógio da barbearia, não no do aparelho
  // plan: o que o plano da instalação inclui; o menu e o painel escondem o resto (o servidor barra no middleware)
  return NextResponse.json({ user: session.user, timezone: session.barbearia.timezone, plan: resumoDoPlano() })
}
