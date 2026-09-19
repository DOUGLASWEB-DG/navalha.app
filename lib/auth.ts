import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { SignJWT, jwtVerify } from 'jose'
// Throwing at module level breaks Next.js build if env var is missing during build time

const SESSION_COOKIE = 'barberos_session'
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback_secret_for_development_only_123456789'
)

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
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

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId: string, role: string) {
  const cookieStore = await cookies()
  const sessionStart = Date.now()
  
  const token = await new SignJWT({ userId, role, sessionStart })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(SECRET_KEY)

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
