import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { checkLimited, clear, getClientIp, hit, tooManyRequestsHeaders } from '@/lib/rate-limit'
import { getCurrentBarbearia, TenantNotFoundError } from '@/lib/tenant'

const WINDOW_MS = 15 * 60 * 1000

// Hash de uma senha aleatória, gerado uma vez por processo. E-mail inexistente também passa por um
// bcrypt.compare (contra este hash, que nunca confere), para o tempo de resposta não revelar se a conta existe.
// Mesmo custo (10) dos hashes reais.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomUUID(), 10)

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

    const barbearia = await getCurrentBarbearia()
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    const passwordMatch = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH) && Boolean(user)

    // Login só vale na barbearia do usuário. Conta de outra barbearia recebe a mesma resposta de senha
    // errada (e a senha é comparada do mesmo jeito), para não revelar que o e-mail existe em outro lugar.
    if (!user || !passwordMatch || user.barbeariaId !== barbearia.id) {
      hit(failureRules)
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    clear([`login:email:${normalizedEmail}`])

    // Só depois da senha correta: não revela a quem não tem a senha que a conta existe.
    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário desativado. Fale com o administrador da barbearia.' },
        { status: 403 }
      )
    }

    await createSession(user)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
