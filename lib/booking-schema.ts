// Formato aceito pelo agendamento público (POST /api/book). Fica aqui, e não na rota, para poder ser testado:
// uma rota do Next não pode exportar outras coisas além dos métodos HTTP.
import { z } from 'zod'
import { LIMITES } from '@/lib/input-limits'
import { normalizeBrazilPhone } from '@/lib/format'

export const bookingSchema = z.object({
  // O nome entra no texto do WhatsApp: tamanho limitado, sem quebras de linha nem links.
  name: z.string().trim().min(1, 'Name is required').max(60, 'Nome muito longo.')
    .refine((value) => !/[\r\n]/.test(value), 'Nome inválido.')
    .refine((value) => !/(https?:|www\.|:\/\/)/i.test(value), 'Nome inválido.'),
  phone: z.string().max(LIMITES.telefone).refine((value) => normalizeBrazilPhone(value) !== null, 'Telefone inválido. Use DDD + número.'),
  serviceIds: z.array(z.string().min(1).max(LIMITES.id)).min(1).max(LIMITES.ids).optional(),
  serviceId: z.string().min(1).max(LIMITES.id).optional(),
  barberId: z.string().max(LIMITES.id).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.'),
  notes: z.string().max(LIMITES.notas).optional(),
})
