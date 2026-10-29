import { NextResponse } from 'next/server';
import { createInstance, EvolutionConfigError, fetchConnectionStatus } from '@/lib/whatsapp';
import { requireWhatsappAdmin, tenantErrorResponse } from '@/lib/api';

// A instância pertence a uma barbearia por instalação: só o admin dela acessa (requireWhatsappAdmin, lib/whatsapp-config.ts).
function errorResponse(error: unknown) {
  const handled = tenantErrorResponse(error);
  if (handled) return handled;
  if (error instanceof EvolutionConfigError) {
    return NextResponse.json({ error: 'Integração WhatsApp não configurada.' }, { status: 503 });
  }
  throw error;
}

export async function GET() {
  try {
    await requireWhatsappAdmin();
    const status = await fetchConnectionStatus();
    return NextResponse.json(status);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    await requireWhatsappAdmin();
    const instance = await createInstance();
    return NextResponse.json(instance);
  } catch (error) {
    return errorResponse(error);
  }
}
