import { NextResponse } from 'next/server';
import { connectInstance, EvolutionConfigError } from '@/lib/whatsapp';
import { requireWhatsappAdmin, tenantErrorResponse } from '@/lib/api';

// Instância única para o sistema todo: só a barbearia padrão acessa (requireWhatsappAdmin).
export async function GET() {
  try {
    await requireWhatsappAdmin();
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
