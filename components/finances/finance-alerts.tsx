'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Bell,
  X,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const severityConfig = {
  INFO: {
    icon: <Info size={16} />,
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-500',
    label: 'Informação',
  },
  WARNING: {
    icon: <AlertTriangle size={16} />,
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-500',
    label: 'Atenção',
  },
  DANGER: {
    icon: <TrendingDown size={16} />,
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-500',
    label: 'Crítico',
  },
}

export function FinanceAlerts() {
  const { data, isLoading, mutate } = useSWR('/api/finances/alerts', fetcher)

  // Gerar alertas automaticamente ao carregar
  useEffect(() => {
    fetch('/api/finances/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate' }),
    }).then(() => mutate())
  }, [mutate])

  async function markRead(id: string) {
    await fetch('/api/finances/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id }),
    })
    mutate()
  }

  async function markAllRead() {
    await fetch('/api/finances/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    })
    mutate()
  }

  async function regenerate() {
    await fetch('/api/finances/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate' }),
    })
    mutate()
  }

  if (isLoading) return <AlertsSkeleton />

  const alerts = data?.alerts ?? []
  const unread = alerts.filter((a: any) => !a.read)
  const read = alerts.filter((a: any) => a.read)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {unread.length > 0 ? `${unread.length} alerta${unread.length > 1 ? 's' : ''} não lido${unread.length > 1 ? 's' : ''}` : 'Nenhum alerta pendente'}
            </p>
            <p className="text-xs text-muted-foreground">Análise automática das suas finanças</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={regenerate}
            variant="outline"
            size="sm"
            className="border-border text-foreground gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </Button>
          {unread.length > 0 && (
            <Button
              onClick={markAllRead}
              variant="outline"
              size="sm"
              className="border-border text-foreground gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Marcar todos como lidos
            </Button>
          )}
        </div>
      </div>

      {/* Alertas não lidos */}
      {unread.length > 0 && (
        <div className="space-y-2">
          {unread.map((alert: any) => {
            const cfg = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.INFO
            return (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl p-4 border transition-all',
                  cfg.bg, cfg.border
                )}
              >
                <span className={cn('mt-0.5 flex-shrink-0', cfg.text)}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wide', cfg.text)}>
                      {cfg.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(alert.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => markRead(alert.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Estado vazio */}
      {unread.length === 0 && read.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold text-foreground mb-1">Tudo em ordem!</p>
          <p className="text-xs text-muted-foreground">Nenhum alerta registrado. Suas finanças estão saudáveis.</p>
        </div>
      )}

      {/* Alertas lidos (histórico) */}
      {read.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Histórico ({read.length})
          </p>
          <div className="space-y-2">
            {read.slice(0, 10).map((alert: any) => {
              const cfg = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.INFO
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 rounded-xl p-4 border opacity-50',
                    cfg.bg, cfg.border
                  )}
                >
                  <span className={cn('mt-0.5 flex-shrink-0', cfg.text)}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('text-[10px] font-semibold uppercase tracking-wide', cfg.text)}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  )
}
