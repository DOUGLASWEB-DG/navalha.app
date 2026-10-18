// Helper canônico de leitura de chave JWT compartilhado entre lib/auth e middleware
// Edge-safe: utiliza apenas TextEncoder padrão, compatível com Edge Runtime da Vercel e Node.js

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET

  // Sem fallback em nenhum ambiente: um segredo conhecido permitiria forjar sessões.
  if (!secret) {
    throw new Error('[FATAL] JWT_SECRET não configurado.')
  }

  if (secret.length < 32) {
    throw new Error('[FATAL] JWT_SECRET deve possuir no mínimo 32 caracteres.')
  }

  return new TextEncoder().encode(secret)
}
