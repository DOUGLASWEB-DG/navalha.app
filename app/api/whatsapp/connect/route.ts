import { NextResponse } from 'next/server';
import { connectInstance, EvolutionConfigError } from '@/lib/whatsapp';
import { requireTenantAdmin, tenantErrorResponse } from '@/lib/api';

// A instância do WhatsApp ainda é única para o sistema todo (não é por barbearia): ver relatório do Bloco 3.
export async function GET() {
  try {
    await requireTenantAdmin();
    const result = await connectInstance();
    return NextResponse.json(result);
  } catch (error) {
    const handled = tenantErrorResponse(error);
    if (handled) return handled;
    if (error instanceof EvolutionConfigError) {
      return NextResponse.json({ error: 'Integração WhatsApp não configurada.' }, { status: 503 });
    }
    throw error;
  }
}
