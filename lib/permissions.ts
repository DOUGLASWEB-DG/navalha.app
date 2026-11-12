// Capabilities are independent of commercial plans. Roles and tenant isolation remain mandatory.
export const PERMISSION_DEFINITIONS = [
  { key: 'appointments.create', label: 'Cadastrar agendamentos', description: 'Reservar horários na própria agenda.' },
  { key: 'appointments.edit', label: 'Editar agendamentos', description: 'Alterar dados e horários da própria agenda.' },
  { key: 'appointments.confirm', label: 'Confirmar agendamentos', description: 'Confirmar os próprios horários.' },
  { key: 'appointments.complete', label: 'Concluir atendimentos', description: 'Concluir os próprios atendimentos, respeitando o horário.' },
  { key: 'appointments.cancel', label: 'Cancelar agendamentos', description: 'Cancelar os próprios horários, respeitando a antecedência.' },
  { key: 'clients.create', label: 'Cadastrar clientes', description: 'Adicionar clientes para realizar os atendimentos.' },
] as const
export type Permission = typeof PERMISSION_DEFINITIONS[number]['key']
export type PermissionOverrides = Partial<Record<Permission, boolean>>
export type Permissions = Record<Permission, boolean>
export const DEFAULT_BARBER_PERMISSIONS: Permissions = {
  'appointments.create': true, 'appointments.edit': true,
  'appointments.confirm': true, 'appointments.complete': true,
  'appointments.cancel': true, 'clients.create': true,
}
export function readPermissionOverrides(value: unknown): PermissionOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const result: PermissionOverrides = {}
  for (const { key } of PERMISSION_DEFINITIONS) if (typeof input[key] === 'boolean') result[key] = input[key] as boolean
  return result
}
export function resolvePermissions(role: string, group: unknown, individual: unknown): Permissions {
  const defaults = { ...DEFAULT_BARBER_PERMISSIONS }
  if (role === 'ADMIN') return defaults
  if (role !== 'BARBER') return Object.fromEntries(PERMISSION_DEFINITIONS.map(({ key }) => [key, false])) as Permissions
  return { ...defaults, ...readPermissionOverrides(group), ...readPermissionOverrides(individual) }
}
