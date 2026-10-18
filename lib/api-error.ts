// Erro com status HTTP. Sem dependências de Next ou banco: pode ser lançado por libs também usadas pelo cron.
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// Registro inexistente OU de outra barbearia: mesma resposta, para não revelar que o id existe.
export function notFound(message = 'Não encontrado.') {
  return new ApiError(404, message)
}
