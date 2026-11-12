// Página inicial própria da América. A barbearia de subdomínio "america" mostra /america (as cores, os cursos e as fotos dela)
// no lugar da landing genérica. Qualquer outra barbearia segue com a landing de sempre, e /america só existe na América.
// Função pura, no mesmo desenho de lib/demo-landing.ts: o middleware aplica o resultado, e os testes cobrem todos os casos sem banco.

export const CASA_SUBDOMAIN = 'america'
export const CASA_PAGE_PATH = '/america'

export type CasaLandingRoute =
  | { action: 'next' }
  | { action: 'rewrite'; to: string }
  | { action: 'notFound' }

export function landingDaCasaRoute(subdomain: string, pathname: string): CasaLandingRoute {
  const isCasa = subdomain === CASA_SUBDOMAIN
  const isCasaPage = pathname === CASA_PAGE_PATH || pathname.startsWith(`${CASA_PAGE_PATH}/`)

  if (isCasa && pathname === '/') return { action: 'rewrite', to: CASA_PAGE_PATH }
  if (!isCasa && isCasaPage) return { action: 'notFound' }
  return { action: 'next' }
}
