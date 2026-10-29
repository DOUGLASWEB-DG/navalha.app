// Qual instância do WhatsApp (Evolution) e qual barbearia pertencem a ESTA instalação. Função pura, sem Next nem banco:
// o app, as rotas, o robô de lembretes e os testes usam as mesmas regras.
//
// Como se define (variáveis de ambiente da instalação):
//  - nenhuma das duas: vale o padrão histórico, instância "barberos_main" da barbearia "barbearia-america" (a América e a
//    demo continuam exatamente como estão);
//  - EVO_INSTANCE_NAME e WHATSAPP_BARBEARIA_ID juntas: a instalação de um cliente, com o WhatsApp dele;
//  - qualquer combinação incoerente: ERRO (falha fechada). Em especial, uma barbearia de cliente nunca usa a instância da
//    América, e a barbearia da América nunca usa a instância de um cliente.
import { DEFAULT_BARBEARIA_ID } from './tenant-host'

export const INSTANCIA_PADRAO = 'barberos_main'

// Vai para o caminho da URL do Evolution: só letras, números, "_" e "-", sem "/" nem "..".
const NOME_VALIDO = /^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/

export class EvolutionConfigError extends Error {}

export interface ConfigWhatsapp {
  instancia: string
  barbeariaId: string
}

export function resolveWhatsapp(env: Record<string, string | undefined> = process.env): ConfigWhatsapp {
  const instancia = env.EVO_INSTANCE_NAME?.trim() ?? ''
  const barbeariaId = env.WHATSAPP_BARBEARIA_ID?.trim() ?? ''

  if (!instancia && !barbeariaId) {
    // NAVALHA_PLANO só existe em instalação de cliente (a América e a demo não a definem). Sem as duas variáveis o padrão
    // seria o número da América: numa instalação de cliente isso é falha aberta, então vira erro.
    if (env.NAVALHA_PLANO?.trim()) {
      throw new EvolutionConfigError(
        '[WhatsApp] Instalação de cliente (NAVALHA_PLANO definida) precisa de EVO_INSTANCE_NAME e WHATSAPP_BARBEARIA_ID: sem elas o padrão seria o número da América.',
      )
    }
    return { instancia: INSTANCIA_PADRAO, barbeariaId: DEFAULT_BARBEARIA_ID }
  }

  if (!instancia || !barbeariaId) {
    throw new EvolutionConfigError('[WhatsApp] Defina EVO_INSTANCE_NAME e WHATSAPP_BARBEARIA_ID juntas (ou nenhuma das duas).')
  }
  if (!NOME_VALIDO.test(instancia)) {
    throw new EvolutionConfigError('[WhatsApp] EVO_INSTANCE_NAME inválido: use só letras, números, "_" e "-" (até 63 caracteres).')
  }
  // Sem diferenciar maiúsculas: "BARBEROS_MAIN" não pode escapar da checagem.
  const instanciaDaAmerica = instancia.toLowerCase() === INSTANCIA_PADRAO
  const barbeariaDaAmerica = barbeariaId.toLowerCase() === DEFAULT_BARBEARIA_ID
  if (instanciaDaAmerica !== barbeariaDaAmerica) {
    throw new EvolutionConfigError(
      instanciaDaAmerica
        ? `[WhatsApp] A instância "${INSTANCIA_PADRAO}" é da América: uma barbearia de cliente não pode usá-la.`
        : '[WhatsApp] A barbearia da América só pode usar a instância dela; use as duas variáveis do cliente juntas.',
    )
  }
  return { instancia, barbeariaId }
}
