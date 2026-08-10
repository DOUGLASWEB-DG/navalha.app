import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'barberos_session'

const protectedPaths = ['/dashboard']
const publicPaths = ['/login', '/', '/book', '/api/auth/login', '/api/book']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value

  const userRole = request.cookies.get('barberos_role')?.value

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path))
  const isApiDashboard = pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/book')

  // Se é rota protegida e não tem sessão, redirecionar para login
  if ((isProtectedRoute || isApiDashboard) && !sessionId) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Controle de Acesso por Papel (RBAC)
  if (sessionId && userRole === 'BARBER') {
    const isAllowedBarberPath = 
      pathname === '/dashboard/appointments' || 
      pathname.startsWith('/api/appointments') ||
      pathname.startsWith('/api/clients') || // Pode precisar ver clientes no form
      pathname.startsWith('/api/services')   // Pode precisar ver serviços no form

    if ((isProtectedRoute || isApiDashboard) && !isAllowedBarberPath) {
      return NextResponse.redirect(new URL('/dashboard/appointments', request.url))
    }
  }

  // Se está na página de login e já tem sessão, redirecionar
  if (pathname === '/login' && sessionId) {
    if (userRole === 'BARBER') {
      return NextResponse.redirect(new URL('/dashboard/appointments', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
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
