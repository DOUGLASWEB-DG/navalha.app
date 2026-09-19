'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, User, Shield, ShieldCheck, Pencil, Trash2, MoreVertical, Mail } from 'lucide-react'
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
import { UserFormModal } from '@/components/users/user-form-modal'
import { PageHeader } from '@/components/dashboard/page-header'

import { ErrorState, GridSkeleton } from '@/components/shared/data-state'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const { data: users, error, isLoading, mutate } = useSWR('/api/users', fetcher)

  async function deleteUser(id: string, name: string) {
    const ok = await confirmAction({
      title: `Excluir usuário "${name}"?`,
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      mutate()
      toast.success('Sucesso!', { description: 'Usuário excluído.' })
    } catch {
      toast.error('Erro', { description: 'Falha ao excluir usuário.' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Equipe e Usuários"
        description="Gerencie os barbeiros e administradores do sistema"
      >
        <Button
          onClick={() => { setEditingUser(null); setModalOpen(true) }}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </PageHeader>

      <div className="w-full">
        {isLoading ? (
          <GridSkeleton message="Carregando usuários..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar os usuários." onRetry={() => mutate()} />
        ) : users && users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map((u: any) => (
              <div
                key={u.id}
                className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40"
              >
                {/* Header (Ícone e Ações) */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                      u.role === 'ADMIN' ? 'border-primary/20 bg-primary/10' : 'border-info/20 bg-info/10'
                    }`}>
                      {u.role === 'ADMIN' ? <ShieldCheck className="h-6 w-6 text-primary" /> : <User className="h-6 w-6 text-info" />}
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
                      <DropdownMenuItem onClick={() => { setEditingUser(u); setModalOpen(true) }} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => deleteUser(u.id, u.name)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Corpo do Card */}
                <div className="flex-1 mt-1">
                  <p className="text-base font-bold text-foreground line-clamp-1">{u.name}</p>
                  
                  <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé (Cargo) */}
                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <span className="text-sm font-bold text-foreground">
                    Cargo
                  </span>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                    u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-info/10 text-info border-info/20'
                  }`}>
                    {u.role === 'ADMIN' ? 'Administrador' : 'Barbeiro'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]">
              <Shield className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
            </div>
            <p className="text-lg font-bold text-foreground mb-2">Nenhum usuário cadastrado</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Adicione barbeiros e outros administradores para utilizarem o sistema.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Criar Primeiro Usuário
            </Button>
          </div>
        )}
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null) }}
        user={editingUser}
        onSaved={() => { mutate(); setModalOpen(false); setEditingUser(null) }}
      />
    </div>
  )
}
