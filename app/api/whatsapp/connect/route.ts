import { NextResponse } from 'next/server';
import { connectInstance, EvolutionConfigError } from '@/lib/whatsapp';
import { requireWhatsappAdmin, tenantErrorResponse } from '@/lib/api';

// A instância pertence a uma barbearia por instalação: só o admin dela acessa (requireWhatsappAdmin, lib/whatsapp-config.ts).
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
