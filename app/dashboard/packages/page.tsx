'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Package as PackageIcon,
  Plus,
  Scissors,
  CheckCircle2,
  Calendar,
  User,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  DollarSign,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { confirmAction } from '@/lib/confirm-toast'
import { apiFetcher, apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'
import { cn } from '@/lib/utils'
import { PackageFormModal } from '@/components/packages/package-form-modal'
import { ClientPackageModal } from '@/components/packages/client-package-modal'
import { AppIcon } from '@/components/shared/app-icon'

export default function PackagesPage() {
  const [tab, setTab] = useState<'client_packages' | 'package_models'>('client_packages')
  const [packageModalOpen, setPackageModalOpen] = useState(false)
  const [clientPackageModalOpen, setClientPackageModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')

  const { data: authData } = useSWR('/api/auth/me', apiFetcher)
  const isAdmin = authData?.user?.role === 'ADMIN'

  // Busca cartelas dos clientes
  const {
    data: clientPackages,
    isLoading: loadingClientPackages,
    mutate: mutateClientPackages,
  } = useSWR(`/api/client-packages?status=${statusFilter}`, apiFetcher)

  // Busca modelos de pacotes
  const {
    data: packageModels,
    isLoading: loadingModels,
    mutate: mutateModels,
  } = useSWR('/api/packages?all=true', apiFetcher)

  // Ticar / Usar 1 corte
  async function handleUseCut(cp: any) {
    const nextCut = cp.usedCuts + 1
    const isLast = nextCut >= cp.totalCuts

    const confirmed = await confirmAction({
      title: isLast
        ? `Confirmar ÚLTIMO corte de ${cp.client.name}?`
        : `Ticar corte (${nextCut}/${cp.totalCuts}) para ${cp.client.name}?`,
      confirmLabel: isLast ? 'Concluir Último Corte' : 'Confirmar Corte',
      tone: isLast ? 'danger' : 'default',
    })
    if (!confirmed) return

    try {
      await apiRequest(`/api/client-packages/${cp.id}`, {
        method: 'PATCH',
        json: { action: 'use_cut' },
      })

      if (isLast) {
        toast.warning('Último corte concluído!', {
          description: `O pacote de ${cp.client.name} foi finalizado. WhatsApp de renovação enviado com sucesso!`,
          duration: 6000,
        })
      } else {
        toast.success('Corte registrado!', {
          description: `Restam ${cp.totalCuts - nextCut} cortes disponíveis no pacote.`,
        })
      }
      mutateClientPackages()
    } catch (error) {
      showError('Não foi possível registrar o corte', error)
    }
  }

  // Filtragem de clientes por busca
  const filteredClientPackages = (clientPackages || []).filter((cp: any) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      cp.client.name.toLowerCase().includes(q) ||
      cp.client.phone.includes(q) ||
      cp.package.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Planos & Pacotes de Cortes"
        iconUrl="/assets/icons/servicos-produtos/produtos-estoque.png"
        description="Controle de pacotes pré-pagos, cartelas de clientes e disparos automáticos"
      >
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingPackage(null)
                setPackageModalOpen(true)
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Novo Modelo
            </Button>
          )}

          <Button
            onClick={() => setClientPackageModalOpen(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" /> Adicionar Cliente ao Pacote
          </Button>
        </div>
      </PageHeader>

      {/* Navegação entre Abas */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setTab('client_packages')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all',
            tab === 'client_packages'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Scissors className="h-4 w-4" />
          Cartelas dos Clientes ({filteredClientPackages.length})
        </button>

        <button
          onClick={() => setTab('package_models')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all',
            tab === 'package_models'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <PackageIcon className="h-4 w-4" />
          Modelos de Pacotes ({packageModels?.length || 0})
        </button>
      </div>

      {/* ABA 1: Cartelas dos Clientes */}
      {tab === 'client_packages' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <AppIcon src="/assets/icons/navegacao-painel/buscar.png" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por cliente ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
             />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    statusFilter === st
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {st === 'ACTIVE' ? 'Ativos' : st === 'COMPLETED' ? 'Finalizados' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {loadingClientPackages ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando cartelas...</div>
          ) : filteredClientPackages.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50">
              <Scissors className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-base font-semibold text-foreground">Nenhuma cartela encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione clientes aos pacotes clicando no botão &quot;Adicionar Cliente ao Pacote&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClientPackages.map((cp: any) => {
                const remaining = Math.max(0, cp.totalCuts - cp.usedCuts)
                const percentUsed = Math.min(100, (cp.usedCuts / cp.totalCuts) * 100)
                const isExpired = new Date(cp.expiresAt) < new Date() && cp.status === 'ACTIVE'
                const isLastCut = remaining === 1 && cp.status === 'ACTIVE'

                return (
                  <div
                    key={cp.id}
                    className={cn(
                      'flex flex-col justify-between rounded-2xl border bg-card p-5 shadow-sm transition-all relative overflow-hidden',
                      cp.status === 'COMPLETED'
                        ? 'border-border opacity-70 bg-muted/20'
                        : isExpired
                          ? 'border-destructive/40 bg-destructive/5'
                          : isLastCut
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-base text-foreground leading-tight">{cp.client.name}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {cp.client.phone}
                          </p>
                        </div>

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
                            cp.status === 'COMPLETED'
                              ? 'bg-muted text-muted-foreground'
                              : isExpired
                                ? 'bg-destructive/10 text-destructive'
                                : isLastCut
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-emerald-500/10 text-emerald-600'
                          )}
                        >
                          {cp.status === 'COMPLETED'
                            ? 'Concluído'
                            : isExpired
                              ? 'Expirado'
                              : isLastCut
                                ? 'Último Corte!'
                                : 'Em Uso'}
                        </span>
                      </div>

                      {/* Informações do Pacote */}
                      <div className="mt-3 py-2 px-3 rounded-xl bg-muted/40 text-xs flex justify-between items-center">
                        <span className="font-medium text-foreground">{cp.package.name}</span>
                        {cp.barber && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" /> {cp.barber.name}
                          </span>
                        )}
                      </div>

                      {/* Barra de Progresso dos Cortes */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="text-foreground">
                            {cp.usedCuts} de {cp.totalCuts} cortes
                          </span>
                        </div>

                        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-500',
                              cp.status === 'COMPLETED'
                                ? 'bg-muted-foreground'
                                : isLastCut
                                  ? 'bg-amber-500'
                                  : 'bg-primary'
                            )}
                            style={{ width: `${percentUsed}%` }}
                         />
                        </div>
                      </div>

                      {/* Validade */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Válido até: {new Intl.DateTimeFormat('pt-BR').format(new Date(cp.expiresAt))}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Ação: Ticar Corte */}
                    <div className="mt-5 pt-3 border-t border-border">
                      {cp.status === 'ACTIVE' && remaining > 0 ? (
                        <Button
                          onClick={() => handleUseCut(cp)}
                          className={cn(
                            'w-full gap-2 font-bold',
                            isLastCut
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isLastCut ? 'Ticar ÚLTIMO Corte' : 'Ticar Corte (+1)'}
                        </Button>
                      ) : (
                        <div className="text-center py-1.5 text-xs font-semibold text-muted-foreground">
                          {cp.status === 'COMPLETED' ? 'Pacote Finalizado' : 'Pacote Expirado'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: Modelos de Pacotes */}
      {tab === 'package_models' && (
        <div className="space-y-4">
          {loadingModels ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando modelos...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packageModels?.map((pkg: any) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-foreground">{pkg.name}</h4>
                      <span className="text-base font-extrabold text-primary">
                        R$ {pkg.price.toFixed(2)}
                      </span>
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{pkg.description}</p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-muted/40">
                        <span className="text-muted-foreground block">Cortes Inclusos</span>
                        <span className="font-bold text-sm text-foreground">{pkg.totalCuts} cortes</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/40">
                        <span className="text-muted-foreground block">Validade</span>
                        <span className="font-bold text-sm text-foreground">{pkg.validityDays} dias</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Valor por corte:</span>
                      <span className="font-semibold text-foreground">
                        R$ {(pkg.price / pkg.totalCuts).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-5 pt-3 border-t border-border flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPackage(pkg)
                          setPackageModalOpen(true)
                        }}
                      >
                        Editar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      {packageModalOpen && (
        <PackageFormModal
          open={packageModalOpen}
          onClose={() => setPackageModalOpen(false)}
          pkg={editingPackage}
          onSaved={() => {
            setPackageModalOpen(false)
            mutateModels()
          }}
       />
      )}

      {clientPackageModalOpen && (
        <ClientPackageModal
          open={clientPackageModalOpen}
          onClose={() => setClientPackageModalOpen(false)}
          onSaved={() => {
            setClientPackageModalOpen(false)
            mutateClientPackages()
          }}
       />
      )}
    </div>
  )
}
