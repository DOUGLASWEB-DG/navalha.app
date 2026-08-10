import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
        className={`${inter.variable} ${playfair.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}
      >
        {children}
        <Toaster
          position="top-center"
          offset="1rem"
          mobileOffset={{ top: 'max(env(safe-area-inset-top), 0.75rem)' }}
          toastOptions={{
            unstyled: false,
            classNames: {
              toast:
                'rounded-2xl border border-border bg-card text-foreground shadow-lg',
              title: 'text-foreground font-semibold',
              description: 'text-muted-foreground',
              success:
                '!border-success/40 !bg-success/5 !text-success',
              error:
                '!border-destructive/40 !bg-destructive/5 !text-destructive',
              warning:
                '!border-warning/40 !bg-warning/5 [&_[data-title]]:text-warning-foreground [&_[data-description]]:text-warning-foreground',
              info: '!border-info/40 !bg-info/5 [&_[data-title]]:text-info',
              closeButton: 'text-muted-foreground hover:text-foreground',
              actionButton:
                '!rounded-xl !bg-primary !px-4 !py-2 !font-semibold !text-primary-foreground hover:!bg-primary/90',
              cancelButton:
                '!rounded-xl !border !border-border !bg-card !px-4 !py-2 !font-medium !text-foreground hover:!bg-muted',
            },
          }}
        />
      </body>
    </html>
  )
}
