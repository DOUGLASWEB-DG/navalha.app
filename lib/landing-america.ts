// Regras da página da América (/america): os cursos, o quiz "Qual curso é o seu?" e as mensagens de WhatsApp.
// Tudo puro e testado sem banco. O quiz não guarda nada no servidor: o resultado só vira uma mensagem pronta no WhatsApp.
// O que a página afirma sobre os cursos fica no mínimo (nome, uma pergunta e "conversamos pelo WhatsApp"): conteúdo, turmas e
// valores são do dono, e a conversa é justamente o objetivo da página.

export type CursoId = 'barbeiro' | 'aperfeicoamento' | 'quimicas'

export interface Curso {
  id: CursoId
  nome: string // nome completo, usado na mensagem do WhatsApp
  titulo: string // título curto do cartão
  gancho: string // uma pergunta, nunca uma promessa
}

export const CURSOS: Record<CursoId, Curso> = {
  barbeiro: {
    id: 'barbeiro',
    nome: 'Curso de Barbeiro Profissional',
    titulo: 'Barbeiro Profissional',
    gancho: 'Do zero à primeira cadeira: como começa?',
  },
  aperfeicoamento: {
    id: 'aperfeicoamento',
    nome: 'Curso de Aperfeiçoamento',
    titulo: 'Aperfeiçoamento',
    gancho: 'Você já corta. O que falta para o cliente pagar mais?',
  },
  quimicas: {
    id: 'quimicas',
    nome: 'Curso de Químicas em Geral',
    titulo: 'Químicas em Geral',
    gancho: 'Cor, pigmentação, luzes e selagem: por onde começar?',
  },
}

export const ORDEM_DOS_CURSOS: readonly CursoId[] = ['barbeiro', 'aperfeicoamento', 'quimicas']

export interface OpcaoDoQuiz {
  texto: string
  curso: CursoId
  resumo: string // entra na mensagem do WhatsApp, em primeira pessoa
}

export interface PerguntaDoQuiz {
  id: 'nivel' | 'interesse' | 'objetivo'
  texto: string
  opcoes: readonly OpcaoDoQuiz[]
}

export const PERGUNTAS_DO_QUIZ: readonly PerguntaDoQuiz[] = [
  {
    id: 'nivel',
    texto: 'Você já corta cabelo?',
    opcoes: [
      { texto: 'Ainda não, quero começar', curso: 'barbeiro', resumo: 'quero começar do zero' },
      { texto: 'Corto, mas quero evoluir', curso: 'aperfeicoamento', resumo: 'já corto e quero evoluir' },
      { texto: 'Já trabalho como barbeiro', curso: 'aperfeicoamento', resumo: 'já trabalho como barbeiro' },
    ],
  },
  {
    id: 'interesse',
    texto: 'O que você mais quer aprender?',
    opcoes: [
      { texto: 'Cortar e fazer barba, do básico ao profissional', curso: 'barbeiro', resumo: 'quero aprender a cortar e fazer barba' },
      { texto: 'Refinar a técnica e o acabamento', curso: 'aperfeicoamento', resumo: 'quero refinar a técnica e o acabamento' },
      { texto: 'Química: cor, pigmentação, luzes e selagem', curso: 'quimicas', resumo: 'quero aprender química (cor, pigmentação, luzes e selagem)' },
    ],
  },
  {
    id: 'objetivo',
    texto: 'E o que te move?',
    opcoes: [
      { texto: 'Começar uma profissão', curso: 'barbeiro', resumo: 'quero começar uma profissão' },
      { texto: 'Cobrar mais pelo meu trabalho', curso: 'aperfeicoamento', resumo: 'quero cobrar mais pelo meu trabalho' },
      { texto: 'Oferecer serviços novos na minha cadeira', curso: 'quimicas', resumo: 'quero oferecer serviços novos na minha cadeira' },
    ],
  },
]

// Cada resposta vota no curso da opção escolhida. Ganha quem tiver mais votos; no empate, vale a resposta de "o que você mais
// quer aprender" (a mais específica), e se ela não estiver entre os empatados, a ordem das perguntas.
export function resultadoDoQuiz(respostas: readonly number[]): CursoId {
  if (respostas.length !== PERGUNTAS_DO_QUIZ.length) throw new RangeError('Responda todas as perguntas do quiz.')
  const escolhidas = PERGUNTAS_DO_QUIZ.map((p, i) => {
    const opcao = p.opcoes[respostas[i] ?? -1]
    if (!opcao) throw new RangeError(`Resposta inválida na pergunta ${p.id}.`)
    return opcao
  })
  const votos = new Map<CursoId, number>()
  for (const o of escolhidas) votos.set(o.curso, (votos.get(o.curso) ?? 0) + 1)
  const maximo = Math.max(...votos.values())
  const empatados = [...votos.entries()].filter(([, n]) => n === maximo).map(([id]) => id)
  if (empatados.length === 1) return empatados[0]!
  const desempate = escolhidas[1]!.curso // "interesse"
  if (empatados.includes(desempate)) return desempate
  return escolhidas.map((o) => o.curso).find((id) => empatados.includes(id))!
}

export function resumoDasRespostas(respostas: readonly number[]): string[] {
  return PERGUNTAS_DO_QUIZ.map((p, i) => {
    const opcao = p.opcoes[respostas[i] ?? -1]
    if (!opcao) throw new RangeError(`Resposta inválida na pergunta ${p.id}.`)
    return opcao.resumo
  })
}

// "Vim pelo site da América" é a marca: o dono conta no próprio WhatsApp quantas conversas vieram da página, e de qual curso.
export function mensagemDoCurso(curso: Curso): string {
  return `Olá! Vim pelo site da América e quero saber como funciona o ${curso.nome}.`
}

export function mensagemDoQuiz(curso: Curso, respostas: readonly number[]): string {
  return `Olá! Vim pelo site da América. Fiz o quiz e o ${curso.nome} parece ser o meu caminho (${resumoDasRespostas(respostas).join('; ')}). Como funciona?`
}

export function mensagemSobreOsCursos(): string {
  return 'Olá! Vim pelo site da América e quero conversar sobre os cursos.'
}

export function mensagemGeral(): string {
  return 'Olá! Vim pelo site da América e gostaria de agendar um horário. Quais horários estão disponíveis?'
}

export function mensagemDoServico(servico: string): string {
  return `Olá! Vim pelo site da América. Gostaria de agendar um(a) ${servico}. Esse horário está disponível?`
}

export function linkWhatsapp(numero: string, texto: string): string {
  const digitos = numero.replace(/\D/g, '')
  return `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}`
}
