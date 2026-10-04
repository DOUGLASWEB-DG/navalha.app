import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { SignJWT, jwtVerify } from 'jose'
import { getJwtSecretKey } from '@/lib/jwt'

const SESSION_COOKIE = 'barberos_session'

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  
  if (!token) return null

  try {
    const secretKey = getJwtSecretKey()
    const { payload } = await jwtVerify(token, secretKey)
    const userId = payload.userId as string

    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    })
    return user
  } catch {
    return null
  }
}

export async function requireAdmin() {
  const user = await getSession()
  if (!user) {
    return { error: 'Não autenticado.', status: 401 as const, user: null }
  }
  if (user.role !== 'ADMIN') {
    return { error: 'Acesso negado. Apenas administradores podem executar esta ação.', status: 403 as const, user: null }
  }
  return { error: null, status: 200 as const, user }
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

export async function createSession(userId: string, role: string) {
  const cookieStore = await cookies()
  const sessionStart = Date.now()
  const secretKey = getJwtSecretKey()
  
  const token = await new SignJWT({ userId, role, sessionStart })
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
