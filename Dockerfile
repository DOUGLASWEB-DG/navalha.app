# Imagem base
FROM node:20-alpine AS base

# Dependências necessárias para o Prisma em Alpine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Instalar dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# O Prisma postinstall script irá rodar aqui e gerar o client
COPY prisma ./prisma
RUN npm ci

# Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente para o build (podem ser necessárias se alguma lib exigir)
ENV NEXT_TELEMETRY_DISABLED 1

# Gerar build
RUN npx prisma generate
RUN npm run build

# Imagem de produção final
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Pasta das fotos: ponto de montagem do volume (docs/deploy.md). Criada vazia e do usuário nextjs para o volume
# nomeado herdar o dono na primeira montagem. Sem VOLUME aqui e sem o marcador: se o volume não for montado,
# o envio de foto falha com 503 em vez de gravar dentro do container e perder tudo no próximo deploy.
RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads
ENV UPLOADS_DIR=/data/uploads

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# O comando inicia o servidor standalone do Next.js
CMD ["node", "server.js"]
