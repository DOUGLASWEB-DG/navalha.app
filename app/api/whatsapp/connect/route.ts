import { NextResponse } from 'next/server';
import { connectInstance, EvolutionConfigError } from '@/lib/whatsapp';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await connectInstance();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof EvolutionConfigError) {
      return NextResponse.json({ error: 'Integração WhatsApp não configurada.' }, { status: 503 });
    }
    throw error;
  }
}
