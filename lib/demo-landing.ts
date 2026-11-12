// Página inicial da demo. A barbearia de subdomínio "demo" mostra a página do produto (/produto) no lugar da landing
// de barbearia. Qualquer outra barbearia (a América inclusive) segue com a landing de sempre, e /produto só existe na demo.
// Função pura: o middleware aplica o resultado, e os testes cobrem todos os casos sem banco.

export const DEMO_SUBDOMAIN = 'demo'
export const PRODUCT_PAGE_PATH = '/produto'

export type DemoLandingRoute =
  | { action: 'next' }
  | { action: 'rewrite'; to: string }
  | { action: 'notFound' }

export function demoLandingRoute(subdomain: string, pathname: string): DemoLandingRoute {
  const isDemo = subdomain === DEMO_SUBDOMAIN
  const isProductPage = pathname === PRODUCT_PAGE_PATH || pathname.startsWith(`${PRODUCT_PAGE_PATH}/`)

  if (isDemo && pathname === '/') return { action: 'rewrite', to: PRODUCT_PAGE_PATH }
  if (!isDemo && isProductPage) return { action: 'notFound' }
  return { action: 'next' }
}
