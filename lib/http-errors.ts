// Erros de requisição no navegador: toda tela fala com a API por aqui, para o usuário sempre receber uma
// mensagem em português que diga o que aconteceu e o que fazer, em vez de "Erro" ou de um texto técnico.

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    // Texto original do servidor, só para diagnóstico (console); nunca é mostrado ao usuário
    public serverMessage?: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

// Mensagens técnicas da API (em inglês ou de infraestrutura) não servem para o usuário final
const TECHNICAL = /^(invalid|failed|unexpected|not found|unauthorized|forbidden|bad request|internal)/i

function readServerMessage(body: unknown): string | null {
  const error = (body as { error?: unknown } | null)?.error
  if (typeof error === 'string' && error.trim() && !TECHNICAL.test(error.trim())) return error.trim()
  return null
}

export function friendlyMessage(status: number, body?: unknown, overrides: Partial<Record<number, string>> = {}): string {
  if (overrides[status]) return overrides[status] as string
  const fromServer = readServerMessage(body)
  switch (status) {
    case 400:
    case 422:
      // Validação do servidor: a mensagem dele costuma dizer exatamente o campo ou a regra
      return fromServer ?? 'Confira os dados informados e tente novamente.'
    case 401:
      return 'Sua sessão expirou. Entre novamente para continuar.'
    case 403:
      return fromServer ?? 'Você não tem permissão para fazer isso.'
    case 404:
      return fromServer ?? 'Não encontramos este item. Ele pode ter sido removido; atualize a página.'
    case 409:
      return fromServer ?? 'Esta informação conflita com outra já cadastrada.'
    case 413:
      return 'O arquivo é grande demais. A foto pode ter no máximo 2 MB.'
    case 429:
      return fromServer ?? 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.'
    default:
      if (status >= 500) return 'O sistema teve um problema. Tente novamente em instantes; se continuar, avise o suporte.'
      return fromServer ?? 'Não foi possível concluir a ação. Tente novamente.'
  }
}

const NETWORK_MESSAGE = 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  // Objeto enviado como JSON
  json?: unknown
  // Corpo já pronto (FormData, por exemplo)
  body?: BodyInit
  // Mensagem própria para um status específico (ex.: 503 no envio de foto)
  messages?: Partial<Record<number, string>>
}

// fetch que lança HttpError (com mensagem amigável) quando o servidor responde com erro ou não responde.
export async function apiRequest<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { json, body, messages, headers, ...init } = options
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : body,
    })
  } catch {
    throw new HttpError(0, NETWORK_MESSAGE)
  }

  // Resposta que não é JSON (ex.: página de erro HTML do servidor) vira null
  const parsed = await response.json().catch(() => null)
  if (!response.ok) {
    const serverText = (parsed as { error?: unknown } | null)?.error
    throw new HttpError(response.status, friendlyMessage(response.status, parsed, messages), typeof serverText === 'string' ? serverText : undefined)
  }
  return parsed as T
}

// Leitura para o SWR: erro de status vira exceção (a tela mostra o estado de erro), nunca "dados".
// (retorno `any`, como o fetcher antigo: cada tela já tipa o que usa)
export const apiFetcher = (url: string): Promise<any> => apiRequest<any>(url)

// Texto para mostrar ao usuário a partir de qualquer erro capturado
export function errorMessage(error: unknown, fallback = 'Não foi possível concluir a ação. Tente novamente.'): string {
  if (error instanceof HttpError) return error.message
  if (error instanceof TypeError) return NETWORK_MESSAGE
  return fallback
}

export function isSessionExpired(error: unknown): boolean {
  return error instanceof HttpError && error.status === 401
}
