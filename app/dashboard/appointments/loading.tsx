import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays } from 'lucide-react'

export default function AppointmentsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground ">Agendamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">Controle sua agenda diária e horários.</p>
          </div>
        </div>
        <Skeleton className="h-11 w-[160px] rounded-xl" />
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-4 lg:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar Side */}
          <div className="w-full md:w-auto shrink-0 flex flex-col gap-4">
            <Skeleton className="h-[320px] w-full md:w-[320px] rounded-2xl" />
            <Skeleton className="h-[200px] w-full md:w-[320px] rounded-2xl" />
          </div>

          {/* Appointments List */}
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-full max-w-md rounded-xl mb-6" />
            
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card/50 flex gap-4">
                  <div className="flex flex-col items-center justify-center pr-4 border-r border-border shrink-0">
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="shrink-0 flex items-center">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
