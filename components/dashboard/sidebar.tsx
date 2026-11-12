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
import { AppIcon } from '@/components/shared/app-icon'
import { tenantConfig } from '@/config/tenant'
import { apiFetcher } from '@/lib/http-errors'

const fetcher = apiFetcher

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  { label: 'Painel', href: '/dashboard', iconUrl: '/assets/icons/navegacao-painel/inicio-painel.png', adminOnly: true },
  { label: 'Agendamentos', href: '/dashboard/appointments', iconUrl: '/assets/icons/agenda-atendimento/agenda-horarios.png' },
  { label: 'Clientes', href: '/dashboard/clients', iconUrl: '/assets/icons/clientes-equipe/clientes.png' },
  { label: 'Pacotes', href: '/dashboard/packages', iconUrl: '/assets/icons/desempenho-relacionamento/clube-de-assinatura-vip.png' },
  { label: 'Finanças', href: '/dashboard/finances', iconUrl: '/assets/icons/financeiro/financeiro-caixa.png', adminOnly: true },
  { label: 'Metas', href: '/dashboard/goals', iconUrl: '/assets/icons/desempenho-relacionamento/metas-desempenho.png', adminOnly: true },
  { label: 'Serviços', href: '/dashboard/services', iconUrl: '/assets/icons/servicos-produtos/servicos-tesoura.png', adminOnly: true },
  { label: 'Produtos', href: '/dashboard/products', iconUrl: '/assets/icons/servicos-produtos/produtos-estoque.png', adminOnly: true },
  { label: 'Equipe', href: '/dashboard/users', iconUrl: '/assets/icons/clientes-equipe/equipe.png', adminOnly: true },
  // Conexão do WhatsApp; a API só aceita o admin da barbearia (requireWhatsappAdmin)
  { label: 'Configurações', href: '/dashboard/settings', iconUrl: '/assets/icons/configuracoes/configuracoes-ajustes.png', adminOnly: true },
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
              aria-label={!open ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-12 items-center rounded-xl transition-all duration-150 active:scale-[0.98] group relative',
                open ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5',
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80'
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl p-1 transition-all duration-200",
                isActive ? "bg-primary/10" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
              )}>
                <AppIcon src={item.iconUrl} />
              </div>
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
              <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-muted/50 border border-border text-muted-foreground group-hover:bg-muted group-hover:text-primary transition-all duration-200">
                <Icon className="w-4 h-4" strokeWidth={2.5} />
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
            'flex min-h-12 w-full items-center rounded-xl transition-all duration-150 text-destructive/70 hover:text-destructive active:scale-[0.98] group',
            open ? 'gap-3 px-3 py-2.5 hover:bg-destructive/5' : 'justify-center p-2.5'
          )}
        >
          <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive/80 group-hover:bg-destructive/15 group-hover:text-destructive transition-all duration-200">
            <LogOut className="w-4 h-4" strokeWidth={2.5} />
          </div>
          {open && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  )
}
