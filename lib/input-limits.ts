import { z } from 'zod'

// Tamanhos máximos aceitos nas rotas da API. Generosos de propósito: só recusam o que é claramente abusivo (um formulário
// gigante, uma lista com milhares de ids). Nenhuma tela do sistema chega perto desses valores.
//
// Por que existem: o corpo de uma requisição pode ter até 16 MiB (limite do Caddy) e o banco guarda texto sem limite
// (Postgres `text`). Sem um máximo, um campo grande custa memória e CPU antes de qualquer regra de negócio rodar.
export const LIMITES = {
  notas: 1000, // observações de agendamento e de cliente
  descricao: 1000, // descrição de serviço
  descricaoFinanceira: 300, // descrição de um lançamento
  categoria: 100,
  titulo: 150, // título de meta
  nome: 100,
  email: 254, // máximo de um endereço de e-mail
  telefone: 30, // aceita DDD, +55, espaços e traços
  senha: 128,
  id: 64, // ids do sistema (cuid, ou texto curto como "barbearia-america")
  ids: 20, // quantos ids em uma lista (serviços de um agendamento)
  data: 40, // "2026-10-29" ou ISO completo
} as const

// Mensagens em português para o limite de tamanho (as demais seguem o texto padrão do zod). O primeiro erro volta ao usuário
// pela API; sem isto, ele veria "String must contain at most 1000 character(s)".
z.setErrorMap((issue, ctx) => {
  if (issue.code === 'too_big' && issue.type === 'string') return { message: `Texto muito longo: o máximo é ${issue.maximum} caracteres.` }
  if (issue.code === 'too_big' && issue.type === 'array') return { message: `Itens demais: o máximo é ${issue.maximum}.` }
  return { message: ctx.defaultError }
})
