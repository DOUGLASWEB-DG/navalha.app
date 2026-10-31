// Dados desta INSTALAÇÃO (um cliente = uma instalação). Função pura, sem Next nem banco: o middleware, a página de perfil,
// a rota pública e os testes usam as mesmas regras.
//
// Por que existe: o config/tenant.ts é o da América (telefone, Instagram, endereço, mapa). Sem isto, a página de qualquer
// outro cliente mostraria o contato dela. Cada instalação define o que é dela no .env (SEM aspas: o env_file as levaria literais):
//
//   INSTALACAO_WHATSAPP   número com DDI e DDD, só dígitos (ex.: 5569992353561). Ausente: vale o da América (padrão antigo).
//   INSTALACAO_TIPO       "barbeiro" troca a página inicial por uma página de perfil do profissional. Ausente: landing de barbearia.
//   INSTALACAO_NOME       nome que aparece na página de perfil (obrigatório quando TIPO=barbeiro)
//   INSTALACAO_INSTAGRAM  usuário sem @ (opcional)
//   INSTALACAO_CIDADE     cidade (opcional)
//   INSTALACAO_SOBRE      2 ou 3 frases sobre o profissional (opcional)
//
// Configuração inválida é ERRO (falha fechada): preferível uma página com erro a mostrar o contato de outra barbearia.
import { z } from 'zod'

export class InstalacaoConfigError extends Error {}

type Env = Record<string, string | undefined>

const WHATSAPP_RE = /^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/ // 55 + DDD (2, sem zero) + fixo (8 dígitos, começa de 2 a 5) ou celular (9 dígitos, começa com 9)
const INSTAGRAM_RE = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/ // como o Instagram: sem ponto no início, no fim ou repetido

const SEM_CONTROLE = /^[^\u0000-\u001f\u007f]*$/ // nada de quebra de linha, tabulação ou outros caracteres de controle

const vazioParaUndefined = (v: string | undefined) => {
  const t = v?.trim()
  return t ? t : undefined
}

export function whatsappDaInstalacao(env: Env = process.env): string | null {
  const bruto = vazioParaUndefined(env.INSTALACAO_WHATSAPP)
  if (!bruto) return null
  if (!WHATSAPP_RE.test(bruto)) {
    throw new InstalacaoConfigError('INSTALACAO_WHATSAPP inválido: use só dígitos, com DDI 55 e DDD (ex.: 5569992353561).')
  }
  return bruto
}

export interface PerfilBarbeiro {
  tipo: 'barbeiro'
  nome: string
  whatsapp: string
  instagram: string | null
  cidade: string | null
  sobre: string | null
}

const perfilSchema = z.object({
  nome: z.string().min(1, 'INSTALACAO_NOME é obrigatório quando INSTALACAO_TIPO=barbeiro.').max(80, 'INSTALACAO_NOME muito longo (máximo 80).').regex(SEM_CONTROLE, 'INSTALACAO_NOME com caractere inválido.'),
  instagram: z.string().regex(INSTAGRAM_RE, 'INSTALACAO_INSTAGRAM inválido: use só o usuário, sem @ (letras, números, ponto e _).').optional(),
  cidade: z.string().max(60, 'INSTALACAO_CIDADE muito longa (máximo 60).').regex(SEM_CONTROLE, 'INSTALACAO_CIDADE com caractere inválido.').optional(),
  sobre: z.string().max(600, 'INSTALACAO_SOBRE muito longo (máximo 600).').regex(SEM_CONTROLE, 'INSTALACAO_SOBRE com caractere inválido.').optional(),
})

// null quando a instalação usa a landing de barbearia de sempre (a América e a demo).
export function resolvePerfil(env: Env = process.env): PerfilBarbeiro | null {
  const tipo = vazioParaUndefined(env.INSTALACAO_TIPO)?.toLowerCase()
  if (!tipo) return null
  if (tipo !== 'barbeiro') throw new InstalacaoConfigError(`INSTALACAO_TIPO="${tipo}" inválido: o único valor aceito é "barbeiro".`)

  const whatsapp = whatsappDaInstalacao(env)
  if (!whatsapp) throw new InstalacaoConfigError('INSTALACAO_WHATSAPP é obrigatório quando INSTALACAO_TIPO=barbeiro.')

  const lido = perfilSchema.safeParse({
    nome: vazioParaUndefined(env.INSTALACAO_NOME) ?? '',
    instagram: vazioParaUndefined(env.INSTALACAO_INSTAGRAM),
    cidade: vazioParaUndefined(env.INSTALACAO_CIDADE),
    sobre: vazioParaUndefined(env.INSTALACAO_SOBRE),
  })
  if (!lido.success) throw new InstalacaoConfigError(lido.error.issues[0].message)

  const { nome, instagram, cidade, sobre } = lido.data
  return { tipo: 'barbeiro', nome, whatsapp, instagram: instagram ?? null, cidade: cidade ?? null, sobre: sobre ?? null }
}

export const PERFIL_PATH = '/perfil'

export type RotaDoPerfil = { action: 'next' } | { action: 'rewrite'; to: string } | { action: 'notFound' }

// A raiz "/" desta instalação vai para a página de perfil? Só quando TIPO=barbeiro; qualquer erro de
// configuração também manda para /perfil, onde o erro aparece (em vez de cair na landing e mostrar o contato da América).
export function raizVaiParaPerfil(env: Env = process.env): boolean {
  return Boolean(vazioParaUndefined(env.INSTALACAO_TIPO))
}

// O que o middleware faz com "/" e "/perfil" nesta instalação: com INSTALACAO_TIPO a raiz mostra o perfil; sem ela, /perfil não existe.
export function rotaDoPerfil(pathname: string, env: Env = process.env): RotaDoPerfil {
  const ativo = raizVaiParaPerfil(env)
  if (pathname === '/' && ativo) return { action: 'rewrite', to: PERFIL_PATH }
  if (pathname === PERFIL_PATH && !ativo) return { action: 'notFound' }
  return { action: 'next' }
}

// Número de WhatsApp das páginas públicas desta instalação. `padraoAmerica` só vale quando a instalação NÃO declara nada de si
// (a América e a demo). Instalação de profissional sem número, ou com número malformado, fica SEM número (os botões somem) em
// vez de mostrar o da América, e o erro vai para o log; a agenda continua funcionando.
export function whatsappPublico(padraoAmerica: string, env: Env = process.env): string | null {
  try {
    const proprio = whatsappDaInstalacao(env)
    if (proprio) return proprio
  } catch (error) {
    if (error instanceof InstalacaoConfigError) {
      console.error('[Instalacao]', error.message)
      return null
    }
    throw error
  }
  return raizVaiParaPerfil(env) ? null : padraoAmerica
}

export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

// Monograma do nome: a inicial das duas primeiras palavras que começam com letra ("Vitor Barber" -> "VB"; números ficam de fora).
export function iniciaisDoNome(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((palavra) => /^\p{L}/u.test(palavra))
    .slice(0, 2)
    .map((palavra) => palavra.charAt(0).toLocaleUpperCase('pt-BR'))
    .join('')
}
