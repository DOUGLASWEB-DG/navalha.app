/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
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
