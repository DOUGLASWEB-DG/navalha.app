'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Package, DollarSign, Pencil, Trash2, MoreVertical } from 'lucide-react'
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
import { ProductFormModal } from '@/components/products/product-form-modal'
import { PageHeader } from '@/components/dashboard/page-header'

import { ErrorState, GridSkeleton } from '@/components/shared/data-state'
import { apiFetcher } from '@/lib/http-errors'
import { apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const fetcher = apiFetcher

export default function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const { data: products, error, isLoading, mutate } = useSWR('/api/products', fetcher)

  async function deleteProduct(id: string, name: string) {
    const ok = await confirmAction({
      title: `Excluir produto "${name}"?`,
      confirmLabel: 'Excluir',
      tone: 'danger',
    })
    if (!ok) return
    try {
      await apiRequest(`/api/products/${id}`, { method: 'DELETE' })
      mutate()
      toast.success('Produto excluído', { description: `"${name}" saiu da lista de produtos.` })
    } catch (error) {
      showError('Não foi possível excluir o produto', error)
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

      <div className="w-full">
        {isLoading ? (
          <GridSkeleton message="Carregando produtos..." />
        ) : error ? (
          <ErrorState message="Não foi possível carregar os produtos." onRetry={() => mutate()} />
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <div
                key={p.id}
                className={`group relative flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40 ${
                  !p.active ? 'opacity-60' : ''
                }`}
              >
                {/* Header (Ícone e Ações) */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                      <Package className="w-6 h-6 text-primary" />
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
                      <DropdownMenuItem onClick={() => { setEditingProduct(p); setModalOpen(true) }} className="gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteProduct(p.id, p.name)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Corpo do Card */}
                <div className="flex-1 mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-bold text-foreground line-clamp-1">{p.name}</p>
                    {!p.active && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border shrink-0">Inativo</span>
                    )}
                  </div>
                  {p.description ? (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground italic">Sem descrição</p>
                  )}
                  
                  {/* Vermelho só quando falta (0); estoque baixo é aviso (laranja), não erro */}
                  <div className={`mt-4 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border w-fit ${
                      p.stock <= 0
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : p.stock <= 5
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-success/10 text-success border-success/20'
                    }`}>
                    <span>{p.stock <= 0 ? 'Sem estoque' : p.stock <= 5 ? `Estoque baixo: ${p.stock}` : `${p.stock} em estoque`}</span>
                  </div>
                </div>

                {/* Rodapé (Preço) */}
                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <span className="text-sm font-bold text-foreground">
                    Valor
                  </span>
                  <span className="text-base font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    R$ {p.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground mb-2">Nenhum produto cadastrado</p>
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
