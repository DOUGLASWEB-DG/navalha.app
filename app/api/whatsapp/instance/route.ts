import { NextResponse } from 'next/server';
import { createInstance, EvolutionConfigError, fetchConnectionStatus } from '@/lib/whatsapp';
import { requireAdmin } from '@/lib/auth';

function configErrorResponse(error: unknown) {
  if (error instanceof EvolutionConfigError) {
    return NextResponse.json({ error: 'Integração WhatsApp não configurada.' }, { status: 503 });
  }
  throw error;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const status = await fetchConnectionStatus();
    return NextResponse.json(status);
  } catch (error) {
    return configErrorResponse(error);
  }
}

export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const instance = await createInstance();
    return NextResponse.json(instance);
  } catch (error) {
    return configErrorResponse(error);
  }
}
