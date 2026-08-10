'use client'

import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  List,
  BarChart3,
  Bell,
} from 'lucide-react'

export type FinanceTab = 'overview' | 'transactions' | 'reports' | 'alerts'

interface FinanceTabsProps {
  active: FinanceTab
  onChange: (tab: FinanceTab) => void
  alertCount?: number
}

const tabs: { value: FinanceTab; label: string; icon: React.ElementType }[] = [
  { value: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { value: 'transactions', label: 'Transações', icon: List },
  { value: 'reports', label: 'Relatórios', icon: BarChart3 },
  { value: 'alerts', label: 'Alertas', icon: Bell },
]

export function FinanceTabs({ active, onChange, alertCount = 0 }: FinanceTabsProps) {
  return (
    <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto rounded-xl border border-white/10 bg-zinc-900/80 p-1 touch-pan-x backdrop-blur-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon
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
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50 active:bg-white/5'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
            {tab.value === 'alerts' && alertCount > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center',
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
