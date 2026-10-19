import { NextResponse } from 'next/server'
import { requireTenant, tenantErrorResponse } from '@/lib/api'
import { parseObjectKey, readObject } from '@/lib/uploads/storage'

// Fotos públicas (a página de agendamento não exige login). O matcher do middleware ignora URLs terminadas
// em .webp, então a barreira de tenant não roda aqui: esta rota confere o Host por conta própria.
// Só serve a foto à barbearia dona dela; qualquer outra combinação é 404.
const NOT_FOUND = () => NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key: parts } = await params
    const key = parts.join('/')
    const parsed = parseObjectKey(key)
    if (!parsed) return NOT_FOUND()

    const barbearia = await requireTenant()
    if (barbearia.id !== parsed.barbeariaId) return NOT_FOUND()

    const data = await readObject(key)
    if (!data) return NOT_FOUND()

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': String(data.length),
        // O nome do arquivo é um UUID novo a cada troca de foto: pode ficar em cache para sempre
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    const handled = tenantErrorResponse(error)
    if (handled) return handled
    console.error('[Media GET]', error)
    return NextResponse.json({ error: 'Falha ao carregar a foto.' }, { status: 500 })
  }
}
