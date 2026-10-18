import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { checkLimited, clear, getClientIp, hit, tooManyRequestsHeaders } from '@/lib/rate-limit'

const WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const ip = getClientIp(req.headers)
    // Somente falhas contam; sucesso zera o contador do e-mail.
    const failureRules = [
      { key: `login:email:${normalizedEmail}`, limit: 5, windowMs: WINDOW_MS },
      ...(ip ? [{ key: `login:ip:${ip}`, limit: 20, windowMs: WINDOW_MS }] : []),
    ]

    const retryAfter = checkLimited(failureRules)
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
        { status: 429, headers: tooManyRequestsHeaders(retryAfter) }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false

    if (!user || !passwordMatch) {
      hit(failureRules)
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    clear([`login:email:${normalizedEmail}`])

    await createSession(user.id, user.role)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
