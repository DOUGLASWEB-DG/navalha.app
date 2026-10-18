// Barbearia que recebeu todos os dados existentes na migration 20261018130000_bloco2_multitenant_base.
// Precisa continuar igual ao INSERT daquela migration.
export const DEFAULT_BARBEARIA_ID = 'barbearia-america'

// Barbearia da requisição atual. Enquanto o isolamento por subdomínio (Bloco 3) não existe, o sistema
// opera uma única barbearia. É assíncrona de propósito: no Bloco 3 a resolução passa a ler a requisição,
// e os pontos que chamam esta função já estarão mapeados e prontos para isso.
export async function getCurrentBarbeariaId(): Promise<string> {
  return DEFAULT_BARBEARIA_ID
}
