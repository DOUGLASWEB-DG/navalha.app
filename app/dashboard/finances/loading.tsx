import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign } from 'lucide-react'

export default function FinancesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">Fluxo de Caixa</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe suas receitas e despesas em tempo real.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-32 mt-auto" />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 lg:p-6 space-y-4">
        <Skeleton className="h-6 w-48 mb-6" />
        
        {/* Table skeleton */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
