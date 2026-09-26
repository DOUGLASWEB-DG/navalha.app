import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorState({ message, onRetry }: { message: string, onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-300 border border-destructive/20 rounded-2xl bg-destructive/5">
      <div className="bg-destructive/10 p-3 rounded-full mb-4">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-foreground font-semibold mb-1">Ops! Ocorreu um erro.</p>
      <p className="text-sm text-muted-foreground mb-5">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2 border-border">
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </Button>
      )}
    </div>
  )
}

export function GridSkeleton({ count = 8, message }: { count?: number, message?: string }) {
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      {message && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">{message}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-[180px] animate-pulse flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div className="h-5 w-1/2 bg-muted rounded-md"></div>
               <div className="h-8 w-8 bg-muted rounded-md"></div>
            </div>
            <div className="space-y-3 mt-4">
               <div className="h-4 w-3/4 bg-muted rounded-md"></div>
               <div className="h-4 w-1/2 bg-muted rounded-md"></div>
            </div>
            <div className="mt-auto pt-4 border-t border-border flex justify-between">
               <div className="h-4 w-1/4 bg-muted rounded-md"></div>
               <div className="h-5 w-1/3 bg-muted rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5, message }: { count?: number, message?: string }) {
  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500">
      {message && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">{message}</p>
      )}
      <div className="flex flex-col gap-3 p-3 lg:p-0">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 h-[88px] animate-pulse flex items-center justify-between">
             <div className="flex flex-col gap-2 w-1/2">
                <div className="h-4 w-3/4 bg-muted rounded-md"></div>
                <div className="h-3 w-1/2 bg-muted rounded-md"></div>
             </div>
             <div className="h-8 w-8 bg-muted rounded-md"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
