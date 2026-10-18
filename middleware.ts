import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

import { getJwtSecretKey } from '@/lib/jwt'
import { resolveBarbeariaByHost } from '@/lib/tenant'

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

  const token = request.cookies.get(SESSION_COOKIE)?.value

  let userRole = null
  let sessionId = null
  let shouldRenew = false
  let renewedToken = null
  let sessionStart = Date.now()

  if (token) {
    try {
      const secretKey = getJwtSecretKey()
      const { payload } = await jwtVerify(token, secretKey)
      userRole = payload.role as string
      sessionId = payload.userId as string
      sessionStart = (payload.sessionStart as number) || Date.now()

      const now = Date.now()
      const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000 // 8 horas

      // Verifica Timeout Absoluto
      if (now - sessionStart > ABSOLUTE_TIMEOUT_MS) {
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
        renewedToken = await new SignJWT({ userId: sessionId, role: userRole, sessionStart })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('2h')
          .sign(secretKey)
      }
    } catch {
      // Invalid or expired token
      sessionId = null
    }
  }

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))
  const isApiDashboard = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/book')

  let response = NextResponse.next()

  // Se é rota protegida e não tem sessão, redirecionar para login
  if ((isProtectedRoute || isApiDashboard) && !sessionId) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    response = NextResponse.redirect(loginUrl)
  } else if (sessionId && userRole === 'BARBER') {
    // Controle de Acesso por Papel (RBAC)
    const isAllowedBarberPath = 
      pathname === '/dashboard/appointments' || 
      pathname.startsWith('/api/appointments') ||
      pathname.startsWith('/api/clients') ||
      pathname.startsWith('/api/services')

    if ((isProtectedRoute || isApiDashboard) && !isAllowedBarberPath) {
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
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
