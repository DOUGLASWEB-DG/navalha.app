'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  DollarSign,
  User,
  CheckCircle2,
  Clock,
  Scissors,
  Calendar,
  AlertCircle,
  Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { confirmAction } from '@/lib/confirm-toast'
import { apiFetcher, apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'
import { cn } from '@/lib/utils'

export function BarberCommissions() {
  const { data, isLoading, mutate } = useSWR('/api/finances/commissions', apiFetcher)
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)

  const summaries = data?.summaries || []
  const appointments = data?.appointments || []

  // Totais gerais
  const totalEarnedAll = summaries.reduce((acc: number, s: any) => acc + s.totalEarned, 0)
  const totalPaidAll = summaries.reduce((acc: number, s: any) => acc + s.totalPaid, 0)
  const balancePendingAll = summaries.reduce((acc: number, s: any) => acc + s.balancePending, 0)

  // Filtra agendamentos do barbeiro selecionado (se houver)
  const activeBarber = selectedBarberId ? summaries.find((s: any) => s.barber.id === selectedBarberId) : null
  const displayedAppointments = selectedBarberId
    ? appointments.filter((a: any) => a.barberId === selectedBarberId)
    : appointments

  async function handlePayCommissions(barberSummary: any) {
    const pendingAppts = appointments.filter(
      (a: any) => a.barberId === barberSummary.barber.id && !a.commissionPaid && (a.commissionAmount || 0) > 0
    )

    if (pendingAppts.length === 0 || barberSummary.balancePending <= 0) {
      toast.info('Nenhum saldo pendente para repasse a este barbeiro.')
      return
    }

    const confirmed = await confirmAction({
      title: `Confirmar repasse de R$ ${barberSummary.balancePending.toFixed(2)} para ${barberSummary.barber.name}?`,
      confirmLabel: 'Confirmar Pagamento',
      tone: 'default',
    })
    if (!confirmed) return

    try {
      await apiRequest('/api/finances/commissions', {
        method: 'POST',
        json: {
          barberId: barberSummary.barber.id,
          appointmentIds: pendingAppts.map((a: any) => a.id),
          amount: barberSummary.balancePending,
          notes: `Repasse de comissão (${barberSummary.barber.commissionPercent}%)`,
        },
      })

      toast.success('Repasse registrado com sucesso!', {
        description: `Despesa lançada no caixa e ${pendingAppts.length} atendimentos marcados como pagos.`,
      })
      mutate()
    } catch (error) {
      showError('Não foi possível registrar o pagamento da comissão', error)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Carregando dados de comissões...</div>
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-primary" /> Total em Comissões Geradas
          </span>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            R$ {totalEarnedAll.toFixed(2)}
          </p>
          <span className="text-xs text-muted-foreground">Acumulado de serviços e pacotes</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Total Já Pago
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            R$ {totalPaidAll.toFixed(2)}
          </p>
          <span className="text-xs text-muted-foreground">Repasses já efetuados aos barbeiros</span>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Saldo Pendente a Pagar
          </span>
          <p className="text-2xl font-extrabold text-primary mt-2">
            R$ {balancePendingAll.toFixed(2)}
          </p>
          <span className="text-xs text-muted-foreground">Aguardando fechamento do Mateus</span>
        </div>
      </div>

      {/* Tabela de Barbeiros e Repasses */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Comissões por Barbeiro
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((s: any) => {
            const isSelected = selectedBarberId === s.barber.id
            return (
              <div
                key={s.barber.id}
                className={cn(
                  'rounded-2xl border bg-card p-5 shadow-sm transition-all flex flex-col justify-between',
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'
                )}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-foreground">{s.barber.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Comissão: <span className="font-semibold text-foreground">{s.barber.commissionPercent}%</span> por corte
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Saldo a Pagar</span>
                      <span className={cn('text-lg font-black', s.balancePending > 0 ? 'text-primary' : 'text-muted-foreground')}>
                        R$ {s.balancePending.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground block">Total Ganho</span>
                      <span className="font-bold text-foreground">R$ {s.totalEarned.toFixed(2)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-muted-foreground block">Já Repassado</span>
                      <span className="font-bold text-emerald-600">R$ {s.totalPaid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBarberId(isSelected ? null : s.barber.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isSelected ? 'Ver Todos' : `Ver Atendimentos (${s.totalAppointments})`}
                  </Button>

                  <Button
                    size="sm"
                    disabled={s.balancePending <= 0}
                    onClick={() => handlePayCommissions(s)}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Pagar Repasse (R$ {s.balancePending.toFixed(2)})
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detalhamento dos Atendimentos */}
      <div className="space-y-3 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Histórico de Atendimentos & Comissões {activeBarber ? `(${activeBarber.barber.name})` : ''}
          </h3>
          {selectedBarberId && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedBarberId(null)} className="text-xs">
              Limpar Filtro
            </Button>
          )}
        </div>

        {displayedAppointments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border">
            Nenhum atendimento concluído encontrado.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Serviço / Pacote</th>
                    <th className="p-3 text-right">Valor Corte</th>
                    <th className="p-3 text-right">Comissão</th>
                    <th className="p-3 text-center">Status Repasse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedAppointments.map((a: any) => {
                    const serviceName = a.clientPackage
                      ? `[Pacote] ${a.clientPackage.package.name}`
                      : a.service?.name || 'Serviço'
                    const servicePrice = a.service?.price || 0
                    return (
                      <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
                            new Date(a.date)
                          )}
                        </td>
                        <td className="p-3 font-semibold text-foreground">{a.client?.name || '—'}</td>
                        <td className="p-3 text-foreground">{serviceName}</td>
                        <td className="p-3 text-right text-muted-foreground">
                          {servicePrice > 0 ? `R$ ${servicePrice.toFixed(2)}` : 'Incluso'}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">
                          R$ {(a.commissionAmount || 0).toFixed(2)} ({a.commissionPercent || 50}%)
                        </td>
                        <td className="p-3 text-center">
                          {a.commissionPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                              Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
