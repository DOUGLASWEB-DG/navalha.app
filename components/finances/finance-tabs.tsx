'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  List,
  BarChart3,
  Bell,
  Percent,
} from 'lucide-react'
import { AppIcon } from '@/components/shared/app-icon'

export type FinanceTab = 'overview' | 'transactions' | 'reports' | 'alerts' | 'commissions'

interface FinanceTabsProps {
  active: FinanceTab
  onChange: (tab: FinanceTab) => void
  alertCount?: number
}

const tabs: { value: FinanceTab; label: string; icon: string }[] = [
  { value: 'overview', label: 'Visão Geral', icon: '/assets/icons/financeiro/financeiro-caixa.png' },
  { value: 'transactions', label: 'Transações', icon: '/assets/icons/financeiro/receita-alt.png' },
  { value: 'commissions', label: 'Comissões & Repasses', icon: '/assets/icons/financeiro/comissoes.png' },
  { value: 'reports', label: 'Relatórios', icon: '/assets/icons/navegacao-painel/relatorios.png' },
  { value: 'alerts', label: 'Alertas', icon: '/assets/icons/navegacao-painel/notificacoes.png' },
]

export function FinanceTabs({ active, onChange, alertCount = 0 }: FinanceTabsProps) {
  return (
    <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 touch-pan-x">
      {tabs.map((tab) => {
        const isActive = active === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            aria-label={tab.label}
            aria-pressed={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative flex min-h-12 shrink-0 snap-start items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98]',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:bg-muted'
            )}
          >
            <AppIcon src={tab.icon} className="h-7 w-7 shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
            {tab.value === 'alerts' && alertCount > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center',
                isActive ? 'bg-white text-primary' : 'bg-destructive text-white'
              )}>
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
