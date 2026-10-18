import { NextResponse } from 'next/server';
import { createInstance, EvolutionConfigError, fetchConnectionStatus } from '@/lib/whatsapp';
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api';

// A instância do WhatsApp ainda é única para o sistema todo (não é por barbearia): ver relatório do Bloco 3.
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
    await requireTenantAdmin();
    const status = await fetchConnectionStatus();
    return NextResponse.json(status);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    await requireTenantAdmin();
    const instance = await createInstance();
    return NextResponse.json(instance);
  } catch (error) {
    return errorResponse(error);
  }
}
