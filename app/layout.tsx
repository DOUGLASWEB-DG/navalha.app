  import type { Metadata, Viewport } from 'next'
  import { Inter } from 'next/font/google'
  import { Toaster } from 'sonner'
  import './globals.css'

  const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
  })

  import { tenantConfig } from '@/config/tenant'

  export const metadata: Metadata = {
    title: `${tenantConfig.name} — Sistema de Agendamento`,
    description: tenantConfig.description,
    generator: 'Navalha.app',
    icons: {
      icon: tenantConfig.logoUrl,
      apple: tenantConfig.logoUrl,
    },
  }

  export const viewport: Viewport = {
    themeColor: '#09090b',
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  }

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode
  }>) {
    return (
      <html lang="pt-BR">
        <body
          className={`${inter.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}
        >
          {children}
          <Toaster
            position="top-center"
            expand={false}
            richColors={true}
            toastOptions={{
              classNames: {
                toast: 'rounded-2xl shadow-xl',
                title: 'font-semibold',
                description: 'text-xs opacity-90',
              },
            }}
          />
        </body>
      </html>
    )
  }
