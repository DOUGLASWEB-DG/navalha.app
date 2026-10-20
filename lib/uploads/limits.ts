// Limites das fotos, num arquivo sem dependências: usado pelo servidor (lib/uploads) e pelo formulário no navegador.
// Ao mudar MAX_UPLOAD_BYTES, ajuste junto: experimental.middlewareClientMaxBodySize em next.config.js
// e o request_body do Caddy na VPS (docs/deploy.md). Os dois precisam ficar ACIMA deste valor.

// 15 MB cobre fotos de celular (12 MP: 3 a 6 MB; 48/50 MP: até ~15 MB). O que fica guardado é bem menor (WebP 800 px).
export const MAX_UPLOAD_MB = 15
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
export const MAX_UPLOAD_MESSAGE = `A foto pode ter no máximo ${MAX_UPLOAD_MB} MB.`
