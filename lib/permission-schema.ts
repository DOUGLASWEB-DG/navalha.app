import { z } from 'zod'
export const permissionOverridesSchema = z.object({
  'appointments.create': z.boolean().optional(),
  'appointments.edit': z.boolean().optional(),
  'appointments.confirm': z.boolean().optional(),
  'appointments.complete': z.boolean().optional(),
  'appointments.cancel': z.boolean().optional(),
  'clients.create': z.boolean().optional(),
}).strict()
