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
import { formatBrazilPhone, formatDate, getInitial, normalizeBrazilPhone } from '@/lib/format'
import { toZonedWallClock } from '@/lib/time-zone'
import { useBarbeariaTimeZone } from '@/lib/use-barbearia-time-zone'

import { ErrorState, ListSkeleton } from '@/components/shared/data-state'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ClientRow {
  id: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  completedCount: number
  lastCompletedAt: string | null
  nextAppointmentAt: string | null
}

function formatNextAppointment(value: string | null, timeZone?: string) {
  if (!value) return '—'
  return format(toZonedWallClock(value, timeZone), "dd/MM 'às' HH:mm", { locale: ptBR })
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null)

  const url = `/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`
  const { data: clients, error, isLoading, mutate } = useSWR<ClientRow[]>(url, fetcher)
  const { data: authData } = useSWR('/api/auth/me', fetcher)
  // Datas no relógio da barbearia, não no do aparelho
  const timeZone = useBarbeariaTimeZone()
  const isAdmin = authData?.user?.role === 'ADMIN'

  function openCreate() {
    setEditingClient(null)
    setModalOpen(true)
  }

  function openEdit(client: ClientRow) {
    setEditingClient(client)
    setModalOpen(true)
  }

  async function deleteClient(client: ClientRow) {
    const ok = await confirmAction({
      title: `Excluir cliente "${client.name}"?`,
      description: 'O cliente deixa de aparecer na lista. O histórico de agendamentos é mantido.',
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      const response = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || 'Falha ao excluir cliente.')
      }
      mutate()
      toast.success('Cliente excluído')
    } catch (error) {
      toast.error('Erro', { description: error instanceof Error ? error.message : 'Falha ao excluir cliente.' })
    }
  }

  function openWhatsApp(client: ClientRow) {
    const phone = normalizeBrazilPhone(client.phone)
    if (!phone) {
      toast.error('Telefone inválido', { description: 'Atualize o telefone antes de abrir o WhatsApp.' })
      return
    }
    const msg = encodeURIComponent(`Olá ${client.name}! Temos horários disponíveis. Gostaria de agendar um horário?`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  function renderActions(client: ClientRow) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground lg:h-9 lg:w-9"
            aria-label={`Ações de ${client.name}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openEdit(client)} className="gap-2 cursor-pointer">
            <Pencil className="w-4 h-4" /> Editar
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => deleteClient(client)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <Trash2 className="w-4 h-4" /> Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        description={!isLoading && !error ? `${clients?.length ?? 0} clientes cadastrados` : 'Gerencie seus clientes'}
      >
        <Button
          onClick={openCreate}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </PageHeader>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-12 rounded-xl border border-border bg-card pl-10 text-sm text-foreground placeholder:text-muted-foreground shadow-sm"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="p-4"><ListSkeleton message="Carregando clientes..." /></div>
        ) : error ? (
          <ErrorState message="Não foi possível carregar os clientes." onRetry={() => mutate()} />
        ) : clients && clients.length > 0 ? (
          <>
            {/* Desktop: tabela */}
            <table className="hidden w-full text-sm lg:table">
              <thead className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Cliente</th>
                  <th scope="col" className="px-4 py-3 font-medium">Telefone</th>
                  <th scope="col" className="px-4 py-3 font-medium">E-mail</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Atendimentos</th>
                  <th scope="col" className="px-4 py-3 font-medium">Último atendimento</th>
                  <th scope="col" className="px-4 py-3 font-medium">Próximo horário</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                          <span className="text-sm font-semibold text-primary">{getInitial(client.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{client.name}</p>
                          {client.notes && (
                            <p className="max-w-[220px] truncate text-xs text-muted-foreground" title={client.notes}>{client.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-foreground tabular-nums">{formatBrazilPhone(client.phone)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">{client.email || '—'}</td>
                    <td className="px-4 py-3 text-right text-foreground tabular-nums">{client.completedCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                      {client.lastCompletedAt ? formatDate(client.lastCompletedAt, timeZone) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      <span className={client.nextAppointmentAt ? 'font-medium text-primary' : 'text-muted-foreground'}>
                        {formatNextAppointment(client.nextAppointmentAt, timeZone)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openWhatsApp(client)}
                          className="h-9 w-9 text-muted-foreground hover:text-success"
                          aria-label={`Abrir WhatsApp de ${client.name}`}
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        {renderActions(client)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile e tablet: cards com rótulos */}
            <ul className="divide-y divide-border lg:hidden">
              {clients.map((client) => (
                <li key={client.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <span className="text-base font-semibold text-primary">{getInitial(client.name)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{client.name}</p>
                      {client.email && <p className="truncate text-xs text-muted-foreground">{client.email}</p>}
                    </div>
                    {renderActions(client)}
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Telefone</dt>
                      <dd className="text-foreground tabular-nums">{formatBrazilPhone(client.phone)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Atendimentos</dt>
                      <dd className="text-foreground tabular-nums">{client.completedCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Último atendimento</dt>
                      <dd className="text-foreground tabular-nums">{client.lastCompletedAt ? formatDate(client.lastCompletedAt, timeZone) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Próximo horário</dt>
                      <dd className={client.nextAppointmentAt ? 'font-medium text-primary tabular-nums' : 'text-foreground'}>
                        {formatNextAppointment(client.nextAppointmentAt, timeZone)}
                      </dd>
                    </div>
                  </dl>

                  {client.notes && (
                    <p className="mt-3 line-clamp-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{client.notes}</p>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => openWhatsApp(client)}
                    className="mt-3 h-11 w-full gap-2 border-border text-foreground hover:border-success hover:text-success"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </li>
              ))}
            </ul>
          </>
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
              <Button onClick={openCreate} variant="link" className="mt-2 text-primary">
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
