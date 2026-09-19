'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/lib/confirm-toast'
import { Button } from '@/components/ui/button'
import { TransactionFormModal } from '@/components/finances/transaction-form-modal'
import { FinanceTabs, type FinanceTab } from '@/components/finances/finance-tabs'
import { FinanceDashboard } from '@/components/finances/finance-dashboard'
import { FinanceReports } from '@/components/finances/finance-reports'
import { FinanceAlerts } from '@/components/finances/finance-alerts'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const typeFilters = [
  { value: 'ALL', label: 'Todos' },
  { value: 'INCOME', label: 'Receitas' },
  { value: 'EXPENSE', label: 'Despesas' },
]

export default function FinancesPage() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview')
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<'INCOME' | 'EXPENSE'>('INCOME')

  // Dados de transações (para aba Transações)
  const url = `/api/finances?month=${month}&type=${typeFilter}`
  const { data, mutate, isLoading, error } = useSWR(url, fetcher)

  // Contagem de alertas não lidos
  const { data: alertData } = useSWR('/api/finances/alerts', fetcher)
  const alertCount = alertData?.unreadCount ?? 0

  const transactions = data?.transactions ?? []
  const summary = data?.summary ?? { income: 0, expense: 0, profit: 0 }

  async function deleteTransaction(id: string) {
    const ok = await confirmAction({
      title: 'Excluir esta transação?',
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      await fetch(`/api/finances/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Transação excluída')
    } catch {
      toast.error('Falha ao excluir transação')
    }
  }

  function openIncome() { setDefaultType('INCOME'); setModalOpen(true) }
  function openExpense() { setDefaultType('EXPENSE'); setModalOpen(true) }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Controle Financeiro</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Gestão completa das finanças da barbearia</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            onClick={openExpense}
            variant="outline"
            className="w-full gap-2 border-border text-foreground sm:w-auto"
          >
            <TrendingDown className="h-4 w-4 text-destructive" />
            Nova Despesa
          </Button>
          <Button onClick={openIncome} className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* Abas */}
      <FinanceTabs active={activeTab} onChange={setActiveTab} alertCount={alertCount} />

      {/* Conteúdo por aba */}
      {activeTab === 'overview' && <FinanceDashboard />}

      {activeTab === 'transactions' && (
        <TransactionsView
          month={month}
          setMonth={setMonth}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          transactions={transactions}
          summary={summary}
          deleteTransaction={deleteTransaction}
          isLoading={isLoading}
          error={error}
          mutate={mutate}
        />
      )}

      {activeTab === 'reports' && <FinanceReports />}

      {activeTab === 'alerts' && <FinanceAlerts />}

      {/* Modal */}
      <TransactionFormModal
        open={modalOpen}
        defaultType={defaultType}
        onClose={() => setModalOpen(false)}
        onSaved={() => { mutate(); setModalOpen(false) }}
      />
    </div>
  )
}

// ─── Aba de Transações (extraída da versão anterior) ──────────────────────────

import { ErrorState } from '@/components/shared/data-state'

interface TransactionsViewProps {
  month: string
  setMonth: (m: string) => void
  typeFilter: string
  setTypeFilter: (t: string) => void
  transactions: any[]
  summary: { income: number; expense: number; profit: number }
  deleteTransaction: (id: string) => void
  isLoading?: boolean
  error?: any
  mutate?: () => void
}

function TransactionsView({
  month, setMonth, typeFilter, setTypeFilter,
  transactions, summary, deleteTransaction, isLoading, error, mutate
}: TransactionsViewProps) {
  
  if (isLoading) {
    return <TransactionsSkeleton />
  }

  if (error) {
    return <ErrorState message="Não foi possível carregar as informações financeiras." onRetry={mutate} />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cards de Resumo — carrossel no mobile */}
      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 touch-pan-x lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0 lg:snap-none">
        <div className="min-w-[min(100%,13rem)] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-150 active:scale-[0.99] lg:min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-success/20 bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Receitas</p>
          </div>
          <p className="text-lg font-bold text-success">R${summary.income.toFixed(2)}</p>
        </div>
        <div className="min-w-[min(100%,13rem)] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-150 active:scale-[0.99] lg:min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Despesas</p>
          </div>
          <p className="text-lg font-bold text-destructive">R${summary.expense.toFixed(2)}</p>
        </div>
        <div className="min-w-[min(100%,13rem)] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-150 active:scale-[0.99] lg:min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border',
                summary.profit >= 0 ? 'border-primary/20 bg-primary/10' : 'border-destructive/20 bg-destructive/10'
              )}
            >
              <DollarSign
                className={cn('h-5 w-5', summary.profit >= 0 ? 'text-primary' : 'text-destructive')}
              />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Lucro</p>
          </div>
          <p className={cn('text-lg font-bold', summary.profit >= 0 ? 'text-primary' : 'text-destructive')}>
            R${summary.profit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="min-h-12 rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm"
        />
        <div className="scrollbar-hide flex max-w-full snap-x snap-mandatory items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 touch-pan-x">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'shrink-0 snap-start rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-150 active:scale-[0.98]',
                typeFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground active:bg-white/5'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {transactions.length > 0 ? (
          <div className="flex flex-col gap-3 p-3 lg:gap-0 lg:divide-y lg:divide-border lg:p-0">
            {transactions.map((txn: any) => (
              <div
                key={txn.id}
                className="group flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-all duration-150 active:scale-[0.99] active:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-5 lg:py-3.5 lg:hover:bg-secondary/20 lg:active:scale-100"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                      txn.type === 'INCOME'
                        ? 'border-success/20 bg-success/10 text-success'
                        : 'border-destructive/20 bg-destructive/10 text-destructive'
                    )}
                  >
                    {txn.type === 'INCOME' ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{txn.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(txn.date), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      {(txn.categoryRef?.name || txn.category) && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          {txn.categoryRef ? (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                background: `${txn.categoryRef.color}20`,
                                color: txn.categoryRef.color,
                              }}
                            >
                              {txn.categoryRef.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">{txn.category}</span>
                          )}
                        </>
                      )}
                      {txn.appointment?.client && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{txn.appointment.client.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
                  <span
                    className={cn(
                      'text-sm font-bold',
                      txn.type === 'INCOME' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {txn.type === 'INCOME' ? '+' : '-'}R${txn.amount.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTransaction(txn.id)}
                    className="shrink-0 text-muted-foreground sm:opacity-100 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100"
                    aria-label="Excluir transação"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14">
            <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Sem transações</p>
            <p className="text-xs text-muted-foreground">Nenhuma transação para o período selecionado</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton de Transações ──────────────────────────────────────────────────

import { Skeleton } from '@/components/ui/skeleton'

function TransactionsSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <p className="text-sm text-muted-foreground font-medium animate-pulse mb-2">Carregando informações financeiras...</p>
      <div className="flex gap-4 overflow-hidden">
        <Skeleton className="h-[104px] w-full min-w-[13rem] rounded-2xl" />
        <Skeleton className="h-[104px] w-full min-w-[13rem] rounded-2xl" />
        <Skeleton className="h-[104px] w-full min-w-[13rem] rounded-2xl" />
      </div>
      
      <div className="flex gap-3">
        <Skeleton className="h-12 w-48 rounded-xl" />
        <Skeleton className="h-12 w-64 rounded-xl" />
      </div>
      
      <div className="rounded-3xl border border-border bg-card shadow-sm p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
            <div className="flex gap-4 items-center">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
