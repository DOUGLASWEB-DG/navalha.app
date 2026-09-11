import { Skeleton } from "@/components/ui/skeleton"
import { Users } from 'lucide-react'

export default function ClientsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie a base de clientes e históricos.</p>
          </div>
        </div>
        <Skeleton className="h-11 w-[160px] rounded-xl" />
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 lg:p-6 space-y-4">
        {/* Search bar skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-11 w-full sm:w-[300px] rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="border border-border rounded-xl overflow-hidden mt-6">
          <div className="bg-muted/50 p-4 border-b border-border hidden sm:grid sm:grid-cols-4 gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-5 w-40 hidden sm:block" />
                <Skeleton className="h-6 w-24 rounded-full hidden sm:block" />
                <Skeleton className="h-9 w-20 rounded-xl justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
