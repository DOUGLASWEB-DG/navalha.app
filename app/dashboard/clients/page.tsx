'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  Search,
  Users,
  MessageCircle,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/lib/confirm-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientFormModal } from '@/components/clients/client-form-modal'
import { PageHeader } from '@/components/dashboard/page-header'
import { formatBrazilPhone, getInitial, normalizeBrazilPhone } from '@/lib/format'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)

  const url = `/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`
  const { data: clients, mutate } = useSWR(url, fetcher)

  async function deleteClient(id: string, name: string) {
    const ok = await confirmAction({
      title: `Excluir cliente "${name}"?`,
      description: 'Isso também removerá os agendamentos vinculados.',
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Sucesso!', { description: 'Cliente excluído.' })
    } catch {
      toast.error('Erro', { description: 'Falha ao excluir cliente.' })
    }
  }

  function openWhatsApp(client: any) {
    const phone = normalizeBrazilPhone(client.phone)
    if (!phone) {
      toast.error('Telefone inválido', { description: 'Atualize o telefone antes de abrir o WhatsApp.' })
      return
    }
    const msg = encodeURIComponent(`Olá ${client.name}! Temos horários disponíveis. Gostaria de agendar um horário?`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        description={`${clients?.length ?? 0} clientes cadastrados no sistema`}
      >
        <Button
          onClick={() => { setEditingClient(null); setModalOpen(true) }}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </PageHeader>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-12 rounded-xl border border-border bg-card pl-10 text-sm text-foreground placeholder:text-muted-foreground shadow-sm"
          />
        </div>
      </div>

      {/* Lista Inteligente de Clientes */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {clients && clients.length > 0 ? (
          <div className="flex flex-col gap-3 p-3 lg:gap-0 lg:divide-y lg:divide-border lg:p-0">
            {clients.map((client: any) => {
              const lastAppt = client.appointments?.[0]
              return (
                <div
                  key={client.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-all duration-150 active:scale-[0.99] active:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-5 lg:py-3.5 lg:hover:bg-secondary/20 lg:active:scale-100"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <span className="text-base font-bold text-primary">
                        {getInitial(client.name)}
                      </span>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{client.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-muted-foreground">{formatBrazilPhone(client.phone)}</p>
                        
                        {client.email && (
                          <>
                            <span className="text-muted-foreground hidden sm:inline">·</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px] hidden sm:inline">{client.email}</span>
                          </>
                        )}
                        
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{client._count?.appointments ?? 0} visitas</span>
                        
                        {lastAppt && (
                          <>
                            <span className="text-muted-foreground hidden lg:inline">·</span>
                            <span className="text-xs text-muted-foreground hidden lg:inline">
                              Última visita: {format(new Date(lastAppt.date), "dd/MM/yy")}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Observações mostradas no mobile sob o nome ou em desktop expandido */}
                      {client.notes && (
                         <p className="mt-1 text-xs italic text-muted-foreground line-clamp-1 lg:hidden">
                            &quot;{client.notes}&quot;
                         </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWhatsApp(client)}
                      className="h-9 gap-2 border-border text-foreground hover:border-success hover:text-success sm:h-8"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs">WhatsApp</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground sm:h-8 sm:w-8 sm:opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100"
                        >
                          <MoreVertical className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingClient(client); setModalOpen(true) }} className="gap-2 cursor-pointer">
                          <Pencil className="w-4 h-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={() => deleteClient(client.id, client.name)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-14">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </p>
            <p className="text-xs text-muted-foreground">
              {search ? 'Tente um termo de busca diferente' : 'Adicione seu primeiro cliente para começar'}
            </p>
            {!search && (
              <Button
                onClick={() => { setEditingClient(null); setModalOpen(true) }}
                variant="link"
                className="mt-2 text-primary"
              >
                Adicionar Cliente
              </Button>
            )}
          </div>
        )}
      </div>

      <ClientFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null) }}
        client={editingClient}
        onSaved={() => { mutate(); setModalOpen(false); setEditingClient(null) }}
      />
    </div>
  )
}
