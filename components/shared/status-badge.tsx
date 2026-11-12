import { XCircle } from 'lucide-react'
import { SystemIcon, type SystemIconName } from '@/components/shared/system-icon'
import { cn } from '@/lib/utils'

type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'
interface StatusBadgeProps { status: Status; className?: string }
const statusConfig: Record<Status, { label: string; icon: SystemIconName | null; tone: string }> = {
 PENDING: { label: 'Pendente', icon: 'pendentes', tone: 'border-warning/25 bg-warning/10 text-warning' },
 CONFIRMED: { label: 'Confirmado', icon: 'confirmados', tone: 'border-info/25 bg-info/10 text-info' },
 COMPLETED: { label: 'Concluído', icon: 'concluidos', tone: 'border-success/25 bg-success/10 text-success' },
 CANCELED: { label: 'Cancelado', icon: null, tone: 'border-border bg-muted text-muted-foreground' },
}
export function StatusBadge({ status, className }: StatusBadgeProps) {
 const config = statusConfig[status]
 return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium', config.tone, className)}>
  {config.icon ? <SystemIcon name={config.icon} className="h-4 w-4" /> : <XCircle className="h-3.5 w-3.5" aria-hidden />}
  {config.label}
 </span>
}
