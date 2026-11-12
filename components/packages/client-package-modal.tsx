'use client'

import { SystemIcon } from '@/components/shared/system-icon'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Package, DollarSign, Calendar, Sparkles } from 'lucide-react'
import { apiRequest, apiFetcher } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

const schema = z.object({
  clientId: z.string().min(1, 'Selecione o cliente'),
  packageId: z.string().min(1, 'Selecione o pacote'),
  barberId: z.string().optional(),
  paidToAdmin: z.boolean().default(true),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export function ClientPackageModal({ open, onClose, onSaved }: Props) {
  const { data: clients } = useSWR('/api/clients?minimal=true', apiFetcher)
  const { data: packages } = useSWR('/api/packages', apiFetcher)
  const { data: usersData } = useSWR('/api/users', apiFetcher)
  const barbers = (usersData || []).filter((u: any) => u.active !== false && u.role === 'BARBER')

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      packageId: '',
      barberId: 'none',
      paidToAdmin: true,
      notes: '',
    },
  })

  const selectedPackageId = watch('packageId')
  const selectedPackage = (packages || []).find((p: any) => p.id === selectedPackageId)

  async function onSubmit(data: FormData) {
    try {
      await apiRequest('/api/client-packages', {
        method: 'POST',
        json: {
          clientId: data.clientId,
          packageId: data.packageId,
          barberId: data.barberId === 'none' ? null : data.barberId,
          paidToAdmin: data.paidToAdmin,
          notes: data.notes || null,
        },
      })

      toast.success('Pacote atribuído ao cliente!', {
        description: data.paidToAdmin
          ? 'Receita lançada no financeiro e cartela digital ativada.'
          : 'Cartela ativada com pagamento pendente.',
      })
      reset()
      onSaved()
    } catch (error) {
      showError('Não foi possível associar o pacote ao cliente', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-10 text-foreground"><span><SystemIcon name="lista-de-clientes" className="h-8 w-8"  />
            Adicionar Cliente ao Pacote</span></DialogTitle>
          <DialogDescription>Selecione o cliente e confira as condições do pacote.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Selecionar Cliente */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Cliente *</Label>
            <div className="relative">
              <SystemIcon name="clientes" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
              <Select onValueChange={(v) => setValue('clientId', v)} value={watch('clientId')}>
                <SelectTrigger className="pl-11">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.clientId && <p className="text-xs text-destructive">{errors.clientId.message}</p>}
          </div>

          {/* Selecionar Modelo de Pacote */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Pacote Escolhido *</Label>
            <div className="relative">
              <SystemIcon name="produtos-estoque" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
              <Select onValueChange={(v) => setValue('packageId', v)} value={watch('packageId')}>
                <SelectTrigger className="pl-11">
                  <SelectValue placeholder="Selecione o plano/pacote..." />
                </SelectTrigger>
                <SelectContent>
                  {packages?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.totalCuts} cortes - R$ {p.price.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.packageId && <p className="text-xs text-destructive">{errors.packageId.message}</p>}
          </div>

          {/* Resumo do Pacote Selecionado */}
          {selectedPackage && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">{selectedPackage.name}</p>
                <p className="text-muted-foreground">
                  {selectedPackage.totalCuts} cortes inclusos • Validade de {selectedPackage.validityDays} dias
                </p>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-primary">
                  R$ {selectedPackage.price.toFixed(2)}
                </span>
                <p className="text-muted-foreground">
                  (R$ {(selectedPackage.price / selectedPackage.totalCuts).toFixed(2)} / corte)
                </p>
              </div>
            </div>
          )}

          {/* Barbeiro Responsável */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Barbeiro Vinculado (Opcional)</Label>
            <div className="relative">
              <SystemIcon name="equipe" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10 pointer-events-none"  />
              <Select onValueChange={(v) => setValue('barberId', v)} value={watch('barberId')}>
                <SelectTrigger className="pl-11">
                  <SelectValue placeholder="Qualquer Barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Livre (Qualquer Barbeiro)</SelectItem>
                  {barbers.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status de Pagamento */}
          <div className="flex items-center gap-3 rounded-xl border border-border p-3 bg-muted/20">
            <input
              type="checkbox"
              id="paidToAdmin"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              checked={watch('paidToAdmin')}
              onChange={(e) => setValue('paidToAdmin', e.target.checked)}
            />
            <label htmlFor="paidToAdmin" className="cursor-pointer text-sm">
              <span className="font-semibold block text-foreground">Já pago no balcão (Pix / Dinheiro)</span>
              <span className="text-xs text-muted-foreground">
                Lança automaticamente a receita no fluxo financeiro da barbearia.
              </span>
            </label>
          </div>

          {/* Observações */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-foreground">Observações (opcional)</Label>
            <Textarea
              onChange={(e) => setValue('notes', e.target.value)}
              placeholder="Ex: Pagou metade no dinheiro, resto no Pix..."
              className="resize-none"
              rows={2}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="px-6">
              Confirmar Pacote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
