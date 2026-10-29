import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getTenantSession } from '@/lib/auth'
import { getCurrentBarbearia, TenantNotFoundError } from '@/lib/tenant'
import { resolveWhatsapp } from '@/lib/whatsapp-config'
import { ApiError, notFound } from '@/lib/api-error'

export { ApiError, notFound } from '@/lib/api-error'

// Sessão obrigatória na barbearia do Host. Retorna o usuário e a barbearia usados em todos os filtros.
export async function requireTenantUser() {
  const session = await getTenantSession()
  if (!session) throw new ApiError(401, 'Não autenticado.')
  return session
}

export async function requireTenantAdmin() {
  const session = await requireTenantUser()
  if (session.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Acesso negado. Apenas administradores podem executar esta ação.')
  }
  return session
}

// Rotas públicas (reserva): sem sessão, mas sempre presas à barbearia do Host.
export async function requireTenant() {
  return getCurrentBarbearia()
}

// A instância do WhatsApp (Evolution) pertence a UMA barbearia por instalação: quem a controla controla o número dela.
// Só o admin dessa barbearia acessa (WHATSAPP_BARBEARIA_ID; sem a variável é a da América, como sempre foi). As demais
// recebem 404, como se a rota não existisse (a checagem vem antes da sessão). Configuração incoerente: falha fechada, também 404.
export async function requireWhatsappAdmin() {
  const barbearia = await getCurrentBarbearia()
  let dona: string
  try {
    dona = resolveWhatsapp().barbeariaId
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    throw notFound()
  }
  if (barbearia.id !== dona) throw notFound()
  return requireTenantAdmin()
}

// Mapeamento central dos erros de tenant. Cada rota chama no início do seu catch:
//   const handled = tenantErrorResponse(error); if (handled) return handled
// P2025 aparece quando update/delete com where { id, barbeariaId } não encontra o registro, o que inclui
// o id de outra barbearia: vira 404, nunca 403.
export function tenantErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof TenantNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })
  }
  return null
}
