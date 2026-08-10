'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Package, DollarSign, Pencil, Trash2, MoreVertical, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { confirmAction } from '@/lib/confirm-toast'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProductFormModal } from '@/components/products/product-form-modal'
import { PageHeader } from '@/components/dashboard/page-header'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const { data: products, mutate } = useSWR('/api/products', fetcher)

  async function deleteProduct(id: string, name: string) {
    const ok = await confirmAction({
      title: `Excluir produto "${name}"?`,
      confirmLabel: 'Excluir',
    })
    if (!ok) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Sucesso!', { description: 'Produto excluído.' })
    } catch {
      toast.error('Erro', { description: 'Falha ao excluir produto.' })
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title="Catálogo de Produtos"
        description="Gerencie os produtos para venda no salão"
      >
        <Button
          onClick={() => { setEditingProduct(null); setModalOpen(true) }}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </PageHeader>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {products && products.length > 0 ? (
          <div className="flex flex-col gap-3 p-3 lg:gap-0 lg:divide-y lg:divide-white/5 lg:p-0">
            {products.map((p: any) => (
              <div
                key={p.id}
                className={`group flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 transition-all duration-150 active:scale-[0.99] active:bg-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-6 lg:py-5 lg:hover:bg-white/5 lg:active:scale-100 ${
                  !p.active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-base font-bold text-foreground">{p.name}</p>
                      {!p.active && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-card text-muted-foreground border border-border">Inativo</span>
                      )}
                    </div>
                    {p.description ? (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">{p.description}</p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground italic">Sem descrição</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border pt-4 sm:border-t-0 sm:pt-0 sm:shrink-0">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border ${
                      p.stock <= 5 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-card text-muted-foreground border-border'
                    }`}>
                      <Hash className="w-4 h-4" />
                      <span>{p.stock} em estoque</span>
                    </div>
                    <div className="flex items-center text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                      <span className="text-base">R${p.price.toFixed(2)}</span>
                    </div>
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
                      <DropdownMenuItem onClick={() => { setEditingProduct(p); setModalOpen(true) }} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteProduct(p.id, p.name)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
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
              <Package className="w-10 h-10 text-primary drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
            </div>
            <p className="text-lg font-serif font-bold text-foreground mb-2">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Adicione produtos como pomadas, óleos e balms que você vende na barbearia.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6 rounded-xl"
            >
              <Plus className="w-4 h-4" /> Adicionar Primeiro Produto
            </Button>
          </div>
        )}
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null) }}
        product={editingProduct}
        onSaved={() => { mutate(); setModalOpen(false); setEditingProduct(null) }}
      />
    </div>
  )
}
