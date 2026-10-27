import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

import { getJwtSecretKey } from '@/lib/jwt'
import { resolveBarbeariaByHost } from '@/lib/tenant'
import { demoLandingRoute } from '@/lib/demo-landing'
import { bloqueioDoCaminho, MENSAGEM_RECURSO_FORA_DO_PLANO } from '@/lib/plan'

const SESSION_COOKIE = 'barberos_session'

const protectedPaths = ['/dashboard']
const publicPaths = ['/login', '/', '/book', '/api/auth/login', '/api/book']

function tenantNotFound(pathname: string) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Barbearia não encontrada.' }, { status: 404 })
  }
  return new NextResponse(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Página não encontrada</title><p>Página não encontrada.</p></html>',
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Barreira de tenant: host sem barbearia ativa (desconhecido, inativo, domínio raiz, reservado) é 404
  // em páginas e APIs. Os handlers revalidam por conta própria; esta barreira não substitui o filtro deles.
  const barbearia = await resolveBarbeariaByHost(request.headers.get('host'))
  if (!barbearia) return tenantNotFound(pathname)

  // Demo: a raiz mostra a página do produto; /produto não existe nas outras barbearias (lib/demo-landing.ts)
  const landing = demoLandingRoute(barbearia.subdomain, pathname)
  if (landing.action === 'notFound') return tenantNotFound(pathname)
  if (landing.action === 'rewrite') return NextResponse.rewrite(new URL(landing.to, request.url))

  // Plano da instalação (NAVALHA_PLANO, lib/plan.ts): Finanças, Metas e Produtos só existem no Completo. Barra as páginas
  // (volta ao painel) e as rotas da API (403) antes de qualquer sessão ou consulta. Sem a variável, nada é barrado.
  const bloqueio = bloqueioDoCaminho(pathname)
  if (bloqueio.action === 'forbidden') {
    return NextResponse.json({ error: MENSAGEM_RECURSO_FORA_DO_PLANO }, { status: 403 })
  }
  if (bloqueio.action === 'redirect') return NextResponse.redirect(new URL('/dashboard', request.url))

  const token = request.cookies.get(SESSION_COOKIE)?.value

  let userRole = null
  let sessionId = null
  let shouldRenew = false
  let renewedToken = null
  let sessionStart = Date.now()
  let discardCookie = false

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))
  const isApiDashboard = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/book')

  if (token) {
    try {
      const secretKey = getJwtSecretKey()
      const { payload } = await jwtVerify(token, secretKey)
      // Sessão vale só na barbearia em que foi criada. Token sem a claim (anterior ao Bloco 3) também é recusado.
      if (payload.barbeariaId !== barbearia.id) throw new Error('sessão de outra barbearia')
      userRole = payload.role as string
      sessionId = payload.userId as string
      sessionStart = (payload.sessionStart as number) || Date.now()

      const now = Date.now()
      const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000 // 8 horas

      // Verifica Timeout Absoluto
      if (now - sessionStart > ABSOLUTE_TIMEOUT_MS) {
        if (isApiDashboard) {
          const response = NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
          response.cookies.delete(SESSION_COOKIE)
          return response
        }
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.delete(SESSION_COOKIE)
        return response
      }

      // Verifica Inatividade (Sliding Session)
      const exp = payload.exp as number
      const timeLeftSec = exp - Math.floor(now / 1000)
      const RENEW_THRESHOLD_SEC = 60 * 60 // 1 hora

      // Renova se faltar menos de 1 hora para expirar (2h originais)
      if (timeLeftSec > 0 && timeLeftSec < RENEW_THRESHOLD_SEC) {
        shouldRenew = true
        renewedToken = await new SignJWT({ userId: sessionId, role: userRole, barbeariaId: barbearia.id, sessionStart })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('2h')
          .sign(secretKey)
      }
    } catch {
      // Token inválido, expirado ou de outra barbearia: descartado
      sessionId = null
      discardCookie = true
    }
  }

  let response = NextResponse.next()

  // Sem sessão: API responde 401 em JSON (redirect quebraria o fetch); página vai para o login
  if ((isProtectedRoute || isApiDashboard) && !sessionId) {
    if (isApiDashboard) {
      response = NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    } else {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      response = NextResponse.redirect(loginUrl)
    }
  } else if (sessionId && userRole === 'BARBER') {
    // Controle de Acesso por Papel (RBAC)
    const isAllowedBarberPath =
      pathname === '/dashboard/appointments' ||
      pathname.startsWith('/api/appointments') ||
      pathname.startsWith('/api/clients') ||
      pathname.startsWith('/api/services')

    if (isApiDashboard && !isAllowedBarberPath) {
      response = NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    } else if (isProtectedRoute && !isAllowedBarberPath) {
      response = NextResponse.redirect(new URL('/dashboard/appointments', request.url))
    }
  } else if (pathname === '/login' && sessionId) {
    // Se está na página de login e já tem sessão, redirecionar
    if (userRole === 'BARBER') {
      response = NextResponse.redirect(new URL('/dashboard/appointments', request.url))
    } else {
      response = NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Aplica o cookie renovado à resposta, se aplicável
  if (shouldRenew && renewedToken && sessionId) {
    response.cookies.set(SESSION_COOKIE, renewedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60 * 60, // estende por +2 horas de inatividade
    })
  } else if (discardCookie) {
    response.cookies.delete(SESSION_COOKIE)
  }

  return response
}

export const config = {
  // Node.js (estável desde o Next 15.5): a barreira de tenant consulta o banco via Prisma.
  runtime: 'nodejs',
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - envio de foto (api/services/<id>/image, api/users/<id>/avatar): no Next 15.5, o middleware em Node.js
     *   corrompe de forma intermitente corpos acima de ~100 KB ("Response body object should not be disturbed
     *   or locked", 500 em ~25% dos envios; medido em 2026-10-19). Fora do middleware: 0 falhas em 100.
     *   ATENÇÃO: rota nesta lista não passa pela barreira de tenant nem de sessão daqui. Ela PRECISA validar
     *   tudo no handler (requireTenantAdmin), e a suíte de isolamento precisa cobri-la.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/services/[^/]+/image$|api/users/[^/]+/avatar$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
