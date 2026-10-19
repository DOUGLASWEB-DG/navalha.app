'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Target,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
  Shield,
  Package,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { tenantConfig } from '@/config/tenant'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems: { label: string; href: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { label: 'Painel', href: '/dashboard', icon: LayoutDashboard, adminOnly: true },
  { label: 'Agendamentos', href: '/dashboard/appointments', icon: CalendarDays },
  { label: 'Clientes', href: '/dashboard/clients', icon: Users, adminOnly: true },
  { label: 'Finanças', href: '/dashboard/finances', icon: DollarSign, adminOnly: true },
  { label: 'Metas', href: '/dashboard/goals', icon: Target, adminOnly: true },
  { label: 'Serviços', href: '/dashboard/services', icon: Scissors, adminOnly: true },
  { label: 'Produtos', href: '/dashboard/products', icon: Package, adminOnly: true },
  { label: 'Equipe', href: '/dashboard/users', icon: UserCog, adminOnly: true },
]

const bottomItems = [
  {
    label: 'Página de Agendamento',
    href: '/book',
    icon: Globe,
    external: true,
  },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: alertData } = useSWR('/api/finances/alerts', fetcher, { refreshInterval: 60000 })
  const alertCount = alertData?.unreadCount ?? 0
  const { data: authData } = useSWR('/api/auth/me', fetcher)
  const user = authData?.user


  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-sidebar border-r border-border transition-all duration-300 relative shrink-0',
        open ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-sidebar-border px-4 shrink-0', !open && 'justify-center')}>
        {open ? (
          <img
            src={tenantConfig.logoWordmarkUrl}
            alt={tenantConfig.name}
            className="h-9 w-auto max-w-full object-contain"
          />
        ) : (
          <img
            src={tenantConfig.logoIconUrl}
            alt={tenantConfig.name}
            className="w-9 h-9 object-contain"
          />
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
        {navItems
          .filter(item => !item.adminOnly || user?.role === 'ADMIN')
          .map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const showBadge = item.href === '/dashboard/finances' && alertCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!open ? item.label : undefined}
              className={cn(
                'flex min-h-12 items-center rounded-xl transition-all duration-150 active:scale-[0.98] group relative',
                open ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5',
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
              {open && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {showBadge && (
                <span className={cn(
                  'flex items-center justify-center rounded-full text-xs font-bold',
                  open
                    ? 'ml-auto w-5 h-5 bg-destructive text-white'
                    : 'absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white'
                )}>
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Itens inferiores */}
      <div className="py-4 px-2 border-t border-border flex flex-col gap-2">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              title={!open ? item.label : undefined}
              className={cn(
                'flex min-h-12 items-center rounded-xl transition-all duration-150 text-muted-foreground hover:text-foreground active:scale-[0.98] group',
                open ? 'gap-3 px-3 py-2.5 hover:bg-muted/30' : 'justify-center p-2.5'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {/* Botão de Sair */}
        <button
          onClick={handleLogout}
          title={!open ? 'Sair' : undefined}
          className={cn(
            'flex min-h-12 w-full items-center rounded-xl transition-all duration-150 text-destructive/70 hover:text-destructive active:scale-[0.98] group',
            open ? 'gap-3 px-3 py-2.5 hover:bg-destructive/5' : 'justify-center p-2.5'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {open && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  )
}
