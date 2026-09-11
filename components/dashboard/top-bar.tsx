'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { Menu, Bell, MoreHorizontal, Globe, LogOut, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TopBarProps {
  onMenuToggle: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Painel',
  '/dashboard/appointments': 'Agendamentos',
  '/dashboard/clients': 'Clientes',
  '/dashboard/finances': 'Controle Financeiro',
  '/dashboard/goals': 'Metas',
  '/dashboard/services': 'Serviços',
}

const severityColors = {
  INFO: 'text-blue-400 bg-blue-400/10',
  WARNING: 'text-amber-400 bg-amber-400/10',
  DANGER: 'text-red-400 bg-red-400/10',
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'NAVALHA.APP'
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const { data: alertData } = useSWR('/api/finances/alerts', fetcher, { refreshInterval: 30000 })
  const alerts = alertData?.alerts ?? []
  const unreadCount = alertData?.unreadCount ?? 0

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 lg:h-16 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="hidden shrink-0 text-muted-foreground lg:flex"
          aria-label="Alternar menu lateral"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-foreground lg:text-lg uppercase font-serif">
            {title}
          </h1>
          <p className="hidden text-xs capitalize text-muted-foreground sm:block">{today}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        
        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-card animate-in zoom-in">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden bg-card backdrop-blur-xl border-border shadow-md">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">Notificações</p>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                  {unreadCount} Novas
                </span>
              )}
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert: any) => (
                  <DropdownMenuItem key={alert.id} asChild>
                    <Link href="/dashboard/finances" className="flex flex-col items-start gap-1 p-4 cursor-pointer hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          alert.severity === 'DANGER' ? 'bg-red-500' : alert.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {alert.severity === 'DANGER' ? 'Crítico' : alert.severity === 'WARNING' ? 'Atenção' : 'Info'}
                        </span>
                        {!alert.read && <span className="text-[10px] font-bold text-primary ml-auto">Nova</span>}
                      </div>
                      <p className="text-xs text-foreground leading-relaxed line-clamp-2">{alert.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {format(new Date(alert.createdAt), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma notificação por enquanto</p>
                </div>
              )}
            </div>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/finances" className="w-full text-center p-3 text-xs font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                Ver todos os alertas
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground lg:hidden"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border border-border bg-card p-1 backdrop-blur-xl shadow-md"
          >
            <DropdownMenuItem asChild className="min-h-12 rounded-xl">
              <Link href="/dashboard/goals" className="cursor-pointer gap-3">
                <Target className="h-5 w-5 shrink-0" />
                Metas
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-12 rounded-xl">
              <Link href="/book" target="_blank" rel="noopener noreferrer" className="cursor-pointer gap-3">
                <Globe className="h-5 w-5 shrink-0" />
                Página de agendamento
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="min-h-12 cursor-pointer gap-3 rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
