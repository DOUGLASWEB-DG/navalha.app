// Helper canônico de leitura de chave JWT compartilhado entre lib/auth e middleware
// Edge-safe: utiliza apenas TextEncoder padrão, compatível com Edge Runtime da Vercel e Node.js

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL] JWT_SECRET não configurado em ambiente de PRODUÇÃO.')
    }
    // Fallback restrito estritamente a desenvolvimento local
    return new TextEncoder().encode('fallback_secret_for_development_only_123456789')
  }

  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('[FATAL] JWT_SECRET deve possuir no mínimo 32 caracteres em ambiente de PRODUÇÃO.')
  }

  return new TextEncoder().encode(secret)
}
