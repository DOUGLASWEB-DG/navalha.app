import { tenantConfig } from '@/config/tenant'
import { whatsappPublico } from '@/lib/instalacao'
import BookingClient from './booking-client'

// Página de agendamento do cliente. O número do WhatsApp é decidido no servidor, a cada requisição (lib/instalacao.ts): o da
// instalação (INSTALACAO_WHATSAPP) ou, só quando a instalação não declara nada de si, o da América (config/tenant.ts).
// Instalação de profissional sem número válido fica sem botão de WhatsApp, e nunca com o número de outra barbearia.
export const dynamic = 'force-dynamic'

export default function BookPage() {
  return <BookingClient whatsappNumber={whatsappPublico(tenantConfig.whatsappNumber)} />
}
