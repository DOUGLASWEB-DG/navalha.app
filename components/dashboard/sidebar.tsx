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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { tenantConfig } from '@/config/tenant'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  { label: 'Painel', href: '/dashboard', iconUrl: '/assets/painel-icon.png', adminOnly: true },
  { label: 'Agendamentos', href: '/dashboard/appointments', iconUrl: '/assets/agendamentos-icon.png' },
  { label: 'Clientes', href: '/dashboard/clients', iconUrl: '/assets/clientes-icon.png', adminOnly: true },
  { label: 'Finanças', href: '/dashboard/finances', iconUrl: '/assets/finaces-icon.png', adminOnly: true },
  { label: 'Metas', href: '/dashboard/goals', iconUrl: '/assets/metas-icon.png', adminOnly: true },
  { label: 'Serviços', href: '/dashboard/services', iconUrl: '/assets/servicos-icon.png', adminOnly: true },
  { label: 'Produtos', href: '/dashboard/products', iconUrl: '/assets/produtos-icon.png', adminOnly: true },
  { label: 'Equipe', href: '/dashboard/users', iconUrl: '/assets/equipe-icon.png', adminOnly: true },
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
      <div className={cn('flex items-center h-16 border-b border-sidebar-border px-4 shrink-0', open ? 'gap-3' : 'justify-center')}>
        <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-xl shrink-0 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <img 
            src={tenantConfig.logoUrl} 
            alt="Logo" 
            className="w-full h-full object-contain p-0" 
          />
        </div>
        {open && (
          <div>
            <p className="text-sm font-bold text-foreground font-sans tracking-tight">{tenantConfig.name}</p>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-widest">{tenantConfig.shortName}</p>
          </div>
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
              <div className={cn(
                "flex items-center justify-center shrink-0 w-8 h-8 rounded-lg transition-all duration-200 overflow-hidden",
                isActive ? "opacity-100" : "opacity-75 grayscale-[30%] group-hover:opacity-100 group-hover:grayscale-0"
              )}>
                <img src={item.iconUrl} alt={item.label} className="w-full h-full object-contain" />
              </div>
              {open && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {showBadge && (
                <span className={cn(
                  'flex items-center justify-center rounded-full text-[10px] font-bold',
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
      <div className="py-4 px-2 border-t border-border flex flex-col gap-1">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              title={!open ? item.label : undefined}
              className={cn(
                'flex min-h-12 items-center rounded-xl transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98] active:bg-muted/80 group',
                open ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
              )}
            >
              <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg transition-all duration-200 bg-transparent text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-primary">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}

        {/* Botão de Sair */}
        <button
          onClick={handleLogout}
          title={!open ? 'Sair' : undefined}
          className={cn(
            'flex min-h-12 w-full items-center rounded-xl transition-all duration-150 text-destructive/70 hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] group',
            open ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
          )}
        >
          <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg transition-all duration-200 bg-transparent text-destructive/70 group-hover:bg-destructive/10">
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </div>
          {open && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  )
}
