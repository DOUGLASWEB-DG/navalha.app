// Plano da instalação (Essencial ou Completo). Função pura, sem Next nem banco: o middleware, as rotas, o WhatsApp e os
// testes usam as mesmas regras.
//
// Como se define: variável de ambiente NAVALHA_PLANO da instância.
//  - ausente ou "completo": tudo liberado (é o que a América e a demo usam hoje; nada muda para elas);
//  - "essencial": sem Finanças, Metas, Produtos e WhatsApp, e no máximo 2 barbeiros;
//  - qualquer outro valor (erro de digitação): vale o plano mais restrito e o erro vai para o log. Falha fechada.
// O que o plano oferece é o mesmo que a vitrine promete (navalhaapp.tech/#planos).

export type Plano = 'essencial' | 'completo'
export type Recurso = 'financas' | 'metas' | 'produtos' | 'whatsapp'

const RECURSOS: Record<Plano, Record<Recurso, boolean>> = {
  essencial: { financas: false, metas: false, produtos: false, whatsapp: false },
  completo: { financas: true, metas: true, produtos: true, whatsapp: true },
}

// Barbeiros ativos (cargo BARBER). O proprietário (ADMIN) não conta no limite.
const LIMITE_BARBEIROS: Record<Plano, number> = { essencial: 2, completo: 5 }

// Páginas e rotas de cada recurso. Casa pelo segmento inteiro: /api/finances e /api/finances/stats, mas não /api/finances-x.
const CAMINHOS: Record<Exclude<Recurso, 'whatsapp'>, string[]> = {
  financas: ['/dashboard/finances', '/api/finances'],
  metas: ['/dashboard/goals', '/api/goals'],
  produtos: ['/dashboard/products', '/api/products'],
}

export function resolvePlano(env: Record<string, string | undefined> = process.env): Plano {
  const bruto = env.NAVALHA_PLANO?.trim().toLowerCase()
  if (!bruto) return 'completo'
  if (bruto === 'completo' || bruto === 'essencial') return bruto
  console.error(`[Plano] NAVALHA_PLANO="${env.NAVALHA_PLANO}" inválido: usando o plano essencial (valores aceitos: essencial, completo).`)
  return 'essencial'
}

export function planoPermite(recurso: Recurso, plano: Plano = resolvePlano()): boolean {
  return RECURSOS[plano][recurso]
}

export function limiteBarbeiros(plano: Plano = resolvePlano()): number {
  return LIMITE_BARBEIROS[plano]
}

// Resumo que a tela recebe em /api/auth/me para esconder o que o plano não inclui
export function resumoDoPlano(plano: Plano = resolvePlano()) {
  return { nome: plano, recursos: { ...RECURSOS[plano] }, limiteBarbeiros: LIMITE_BARBEIROS[plano] }
}

// Recurso que um caminho exige, ou null quando o caminho não pertence a nenhum recurso de plano.
export function recursoDoCaminho(pathname: string): Exclude<Recurso, 'whatsapp'> | null {
  for (const [recurso, bases] of Object.entries(CAMINHOS) as [Exclude<Recurso, 'whatsapp'>, string[]][]) {
    if (bases.some((base) => pathname === base || pathname.startsWith(`${base}/`))) return recurso
  }
  return null
}

export type BloqueioDePlano = { action: 'next' } | { action: 'forbidden'; recurso: Recurso } | { action: 'redirect'; recurso: Recurso }

// Decide o que o middleware faz com um caminho: libera, responde 403 (API) ou volta ao painel (página).
export function bloqueioDoCaminho(pathname: string, plano: Plano = resolvePlano()): BloqueioDePlano {
  const recurso = recursoDoCaminho(pathname)
  if (!recurso || planoPermite(recurso, plano)) return { action: 'next' }
  return pathname.startsWith('/api/') ? { action: 'forbidden', recurso } : { action: 'redirect', recurso }
}

export const MENSAGEM_RECURSO_FORA_DO_PLANO = 'Este recurso faz parte do plano Completo. Fale com a DrewaWeb para ampliar o seu plano.'

export function mensagemLimiteBarbeiros(plano: Plano = resolvePlano()): string {
  return `O plano ${plano === 'essencial' ? 'Essencial' : 'Completo'} permite até ${limiteBarbeiros(plano)} barbeiros. Fale com a DrewaWeb para ampliar o seu plano.`
}
