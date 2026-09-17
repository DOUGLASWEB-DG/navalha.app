'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Scissors,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const items = [
  {
    href: '/dashboard',
    label: 'Painel',
    iconUrl: '/assets/painel-icon.png',
    match: (p: string) => p === '/dashboard',
    adminOnly: true,
  },
  {
    href: '/dashboard/appointments',
    label: 'Agenda',
    iconUrl: '/assets/agendamentos-icon.png',
    match: (p: string) => p.startsWith('/dashboard/appointments'),
  },
  {
    href: '/dashboard/clients',
    label: 'Clientes',
    iconUrl: '/assets/clientes-icon.png',
    match: (p: string) => p.startsWith('/dashboard/clients'),
    adminOnly: true,
  },
  {
    href: '/dashboard/finances',
    label: 'Finanças',
    iconUrl: '/assets/finaces-icon.png',
    match: (p: string) => p.startsWith('/dashboard/finances'),
    adminOnly: true,
  },
  {
    href: '/dashboard/services',
    label: 'Serviços',
    iconUrl: '/assets/servicos-icon.png',
    match: (p: string) => p.startsWith('/dashboard/services'),
    adminOnly: true,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { data: alertData } = useSWR('/api/finances/alerts', fetcher, {
    refreshInterval: 60000,
  })
  const alertCount = alertData?.unreadCount ?? 0
  const { data: authData } = useSWR('/api/auth/me', fetcher)
  const user = authData?.user

  return (
    <nav
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-50',
        'border-t border-border bg-card/90 backdrop-blur-xl',
        'supports-[backdrop-filter]:bg-card/75',
        'pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-2 px-1',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
      )}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex max-w-lg mx-auto items-stretch justify-between gap-0.5">
        {items
          .filter(item => !('adminOnly' in item && item.adminOnly) || user?.role === 'ADMIN')
          .map((item) => {
          const active = item.match(pathname)
          const showBadge = item.href === '/dashboard/finances' && alertCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl min-h-12 py-2 px-1',
                'transition-all duration-150 active:scale-[0.97] active:bg-muted',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span className={cn(
                "relative inline-flex w-7 h-7 items-center justify-center transition-all duration-200 overflow-hidden rounded-md",
                active ? "opacity-100" : "opacity-75 grayscale-[30%]"
              )}>
                <img src={item.iconUrl} alt={item.label} className="w-full h-full object-contain scale-[1.4]" />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white tabular-nums z-10">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold leading-tight truncate max-w-[4.25rem] text-center',
                  active ? 'text-primary font-bold' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
