import { prisma } from '@/lib/prisma'
import { AppointmentRuleError } from '@/lib/appointment-rules'

export interface AppointmentServiceSnapshot {
  id: string
  name: string
  price: number
  durationMins: number
}

export function normalizeServiceIds(serviceIds?: string[], serviceId?: string) {
  const ids = serviceIds?.length ? serviceIds : serviceId ? [serviceId] : []
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) throw new AppointmentRuleError('Selecione pelo menos um serviço.')
  return unique
}

export async function getActiveServices(serviceIds: string[]) {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, active: true },
    select: { id: true, name: true, price: true, durationMins: true },
  })
  if (services.length !== serviceIds.length) {
    throw new AppointmentRuleError('Um ou mais serviços não foram encontrados ou estão indisponíveis.')
  }
  const byId = new Map(services.map((service) => [service.id, service]))
  return serviceIds.map((id) => byId.get(id)!)
}

export function getServiceTotals(services: Pick<AppointmentServiceSnapshot, 'price' | 'durationMins'>[]) {
  return services.reduce(
    (totals, service) => ({
      price: totals.price + service.price,
      durationMins: totals.durationMins + service.durationMins,
    }),
    { price: 0, durationMins: 0 },
  )
}

export function getAppointmentServiceTotals(
  appointment: {
    service?: Pick<AppointmentServiceSnapshot, 'price' | 'durationMins'> | null
    appointmentServices?: Array<Pick<AppointmentServiceSnapshot, 'price' | 'durationMins'>>
  },
) {
  const services = appointment.appointmentServices?.length
    ? appointment.appointmentServices
    : appointment.service
      ? [appointment.service]
      : []
  return getServiceTotals(services)
}

export function appointmentServiceCreateData(
  services: AppointmentServiceSnapshot[],
) {
  return services.map((service) => ({
    serviceId: service.id,
    price: service.price,
    durationMins: service.durationMins,
  }))
}
