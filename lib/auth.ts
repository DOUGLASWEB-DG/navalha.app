import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { SignJWT, jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'
import { getCurrentBarbearia } from '@/lib/tenant'

// Escopo do cookie: SEM atributo Domain, de propósito. O navegador só envia o cookie ao host exato que o
// criou (america.navalha.app), nunca a outra barbearia (teste-b.navalha.app) nem ao domínio raiz. Não
// adicionar Domain: isso compartilharia a sessão entre todas as barbearias do domínio.
const SESSION_COOKIE = 'barberos_session'

const sessionUserSelect = { id: true, name: true, email: true, role: true, barbeariaId: true } as const

// Sessão válida NA barbearia do Host: o JWT precisa ter sido emitido para ela (claim barbeariaId) e o
// usuário precisa pertencer a ela e estar ativo. Qualquer divergência é tratada como "sem sessão".
// Host sem barbearia lança TenantNotFoundError (404), que não se confunde com "sem sessão" (401).
export async function getTenantSession() {
  const barbearia = await getCurrentBarbearia()
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey())
    const userId = payload.userId as string
    if (!userId || payload.barbeariaId !== barbearia.id) return null

    // Usuário desativado perde a sessão já aberta na próxima requisição, mesmo com o JWT ainda válido.
    const user = await prisma.user.findFirst({
      where: { id: userId, barbeariaId: barbearia.id, active: true },
      select: sessionUserSelect,
    })
    if (!user) return null
    return { user, barbearia }
  } catch {
    // Token inválido ou expirado
    return null
  }
}

export async function getSession() {
  try {
    return (await getTenantSession())?.user ?? null
  } catch {
    return null
  }
}

export async function verifySessionToken(token: string) {
  try {
    const secretKey = getJwtSecretKey()
    const { payload } = await jwtVerify(token, secretKey)
    return payload
  } catch {
    return null
  }
}

export async function createSession(user: { id: string; role: string; barbeariaId: string }) {
  const cookieStore = await cookies()
  const sessionStart = Date.now()
  const secretKey = getJwtSecretKey()

  const token = await new SignJWT({ userId: user.id, role: user.role, barbeariaId: user.barbeariaId, sessionStart })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secretKey)

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 2, // 2 horas (Idle timeout)
  }
  
  cookieStore.set(SESSION_COOKIE, token, options)
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
