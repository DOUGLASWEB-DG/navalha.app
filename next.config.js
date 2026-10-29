/** @type {import('next').NextConfig} */
// Cabeçalhos de segurança em todas as respostas do app. Só regras que não alteram o que a página carrega:
//  - frame-ancestors / X-Frame-Options: nenhum outro site pode embutir o painel (clickjacking);
//  - nosniff: o navegador não "adivinha" o tipo de um arquivo enviado;
//  - HSTS: depois de uma visita por HTTPS, o navegador só volta por HTTPS (sem includeSubDomains de propósito);
//  - base-uri, form-action e object-src: fecham brechas clássicas de injeção sem restringir scripts, estilos nem imagens.
// Uma Content-Security-Policy completa (script-src etc.) fica para depois, com teste tela por tela.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
]

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // O middleware bufferiza o corpo das requisições; acima deste valor o Next corta o corpo e a rota falha (500).
    // Precisa ficar ACIMA do limite de foto (lib/uploads/limits.ts: 15 MB) mais o multipart. Padrão do Next: 10 MB.
    middlewareClientMaxBodySize: 16 * 1024 * 1024,
  },
}

module.exports = nextConfig
