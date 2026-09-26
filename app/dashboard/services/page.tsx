'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Scissors, Clock, DollarSign, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/lib/confirm-toast'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ServiceFormModal } from '@/components/services/service-form-modal'

import { PageHeader } from '@/components/dashboard/page-header'

import { ErrorState, GridSkeleton } from '@/components/shared/data-state'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ServicesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const { data: services, error, isLoading, mutate } = useSWR('/api/services', fetcher)

  async function deleteService(id: string, name: string) {
    const ok = await confirmAction({
      title: `Excluir serviço "${name}"?`,
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Sucesso!', { description: 'Serviço excluído.' })
    } catch {
      toast.error('Erro', { description: 'Falha ao excluir serviço.' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Catálogo de Serviços"
        description="Gerencie os serviços, preços e durações oferecidos"
      >
        <Button
          onClick={() => { setEditingService(null); setModalOpen(true) }}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Novo Serviço
        </Button>
      </PageHeader>

      {/* Lista Inteligente de Serviços */}
      <div className="w-full">
        {isLoading ? (
          <GridSkeleton message="Carregando serviços..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar os serviços." onRetry={() => mutate()} />
        ) : services && services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map((svc: any) => (
              <div
                key={svc.id}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40"
              >
                {/* Header (Ícone e Ações) */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <Scissors className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingService(svc); setModalOpen(true) }} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => deleteService(svc.id, svc.name)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Corpo do Card */}
                <div className="flex-1 mt-1">
                  <p className="text-base font-bold text-foreground line-clamp-1">{svc.name}</p>
                  {svc.description ? (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{svc.description}</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground italic">Sem descrição</p>
                  )}
                  
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg border border-border w-fit">
                    <Clock className="w-4 h-4 text-primary/70" />
                    <span>{svc.durationMins} min</span>
                  </div>
                </div>

                {/* Rodapé (Preço) */}
                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <span className="text-sm font-bold text-foreground">
                    Valor
                  </span>
                  <span className="text-base font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    R$ {svc.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]">
              <Scissors className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
            </div>
            <p className="text-lg font-bold text-foreground mb-2">Nenhum serviço ainda</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Monte seu catálogo de serviços, definindo preços justos e o tempo necessário para cada corte.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Adicionar Primeiro Serviço
            </Button>
          </div>
        )}
      </div>

      <ServiceFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingService(null) }}
        service={editingService}
        onSaved={() => { mutate(); setModalOpen(false); setEditingService(null) }}
      />
    </div>
  )
}
