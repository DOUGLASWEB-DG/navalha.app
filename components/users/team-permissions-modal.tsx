'use client'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SystemIcon } from '@/components/shared/system-icon'
import { PERMISSION_DEFINITIONS, DEFAULT_BARBER_PERMISSIONS, type Permissions } from '@/lib/permissions'
import { apiFetcher, apiRequest } from '@/lib/http-errors'
import { showError } from '@/lib/feedback'

export function TeamPermissionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, error, isLoading, mutate } = useSWR(open ? '/api/team-permissions' : null, apiFetcher)
  const [permissions, setPermissions] = useState<Permissions>({ ...DEFAULT_BARBER_PERMISSIONS })
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (data?.permissions) setPermissions(data.permissions) }, [data])
  async function save() {
    setSaving(true)
    try {
      await apiRequest('/api/team-permissions', { method: 'PATCH', json: { permissions } })
      await mutate()
      toast.success('Permissões da equipe atualizadas')
      onClose()
    } catch (e) { showError('Não foi possível atualizar as permissões', e) }
    finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={next => { if (!next && !saving) onClose() }}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 pr-10"><SystemIcon name="equipe" className="h-8 w-8" />Permissões dos barbeiros</DialogTitle>
        <DialogDescription>Defina o padrão da equipe. Na edição de cada profissional, você pode criar exceções.</DialogDescription>
      </DialogHeader>
      <p className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">O barbeiro sempre vê apenas a própria agenda. Caixa, equipe e configurações continuam exclusivos do administrador.</p>
      {error ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as permissões. Feche e tente novamente.</p>
      : isLoading ? <p role="status">Carregando permissões...</p>
      : <div className="space-y-2">{PERMISSION_DEFINITIONS.map(({ key, label, description }) =>
        <label key={key} className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border p-3">
          <span><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-muted-foreground">{description}</span></span>
          <input type="checkbox" checked={permissions[key]} disabled={saving} onChange={e => setPermissions(current => ({ ...current, [key]: e.target.checked }))} className="h-5 w-5 shrink-0 accent-primary" />
        </label>)}</div>}
      <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button><Button type="button" isLoading={saving} disabled={isLoading || Boolean(error)} onClick={save}>Salvar permissões</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
