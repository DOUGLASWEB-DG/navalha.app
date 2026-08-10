import { cn } from '@/lib/utils'

type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<Status, { label: string; dot: string; text: string }> = {
  PENDING: {
    label: 'PENDENTE',
    dot: 'bg-warning',
    text: 'text-warning',
  },
  CONFIRMED: {
    label: 'CONFIRMADO',
    dot: 'bg-info',
    text: 'text-info',
  },
  COMPLETED: {
    label: 'CONCLUÍDO',
    dot: 'bg-success',
    text: 'text-success',
  },
  CANCELED: {
    label: 'CANCELADO',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-card border border-border shadow-sm', config.text, className)}>
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
