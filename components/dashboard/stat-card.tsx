import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  accent?: 'gold' | 'green' | 'blue' | 'red'
}

const accentClasses = {
  gold: 'bg-primary/10 text-primary border-primary/20',
  green: 'bg-success/10 text-success border-success/20',
  blue: 'bg-info/10 text-info border-info/20',
  red: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, accent = 'gold' }: StatCardProps) {
  return (
    <div className="flex min-w-[min(100%,17rem)] snap-start flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-150 lg:min-w-0 lg:w-full">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
            accentClasses[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
          <span>{trend.positive ? '+' : ''}{trend.value}</span>
          <span className="text-muted-foreground font-normal">vs semana passada</span>
        </div>
      )}
    </div>
  )
}
