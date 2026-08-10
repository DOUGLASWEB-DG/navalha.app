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
} from '@/components/ui/dropdown-menu'
import { UserFormModal } from '@/components/users/user-form-modal'
import { PageHeader } from '@/components/dashboard/page-header'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UsersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const { data: users, mutate } = useSWR('/api/users', fetcher)

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

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {users && users.length > 0 ? (
          <div className="flex flex-col gap-3 p-3 lg:gap-0 lg:divide-y lg:divide-white/5 lg:p-0">
            {users.map((u: any) => (
              <div
                key={u.id}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 transition-all duration-150 active:scale-[0.99] active:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-6 lg:py-5 lg:hover:bg-white/5 lg:active:scale-100"
              >
                <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                    u.role === 'ADMIN' ? 'border-primary/20 bg-primary/10 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]' : 'border-info/20 bg-info/10'
                  }`}>
                    {u.role === 'ADMIN' ? <ShieldCheck className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-info" />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-foreground">{u.name}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:border-t-0 sm:pt-0 sm:shrink-0">
                  <div className="flex items-center">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      u.role === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-info/10 text-info border-info/20'
                    }`}>
                      {u.role === 'ADMIN' ? 'Administrador' : 'Barbeiro'}
                    </span>
                  </div>

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
                      <DropdownMenuItem onClick={() => { setEditingUser(u); setModalOpen(true) }} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteUser(u.id, u.name)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]">
              <Shield className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
            </div>
            <p className="text-lg font-serif font-bold text-foreground mb-2">Nenhum usuário cadastrado</p>
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
