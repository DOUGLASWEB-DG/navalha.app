import { prisma } from '@/lib/prisma'
import { AppointmentRuleError } from '@/lib/appointment-rules'
import { notFound } from '@/lib/api-error'

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

// Serviço de outra barbearia é tratado como inexistente (mesma mensagem), sem revelar que o id existe.
export async function getActiveServices(barbeariaId: string, serviceIds: string[]) {
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, barbeariaId, active: true },
    select: { id: true, name: true, price: true, durationMins: true },
  })
  if (services.length !== serviceIds.length) {
    throw notFound('Um ou mais serviços não foram encontrados ou estão indisponíveis.')
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

export function getAppointmentServiceSummary(
  appointment: {
    service?: { name: string; price?: number; durationMins?: number } | null
    appointmentServices?: Array<{
      service?: { name: string } | null
      price: number
      durationMins: number
    }>
  },
) {
  const hasPivot = Boolean(appointment.appointmentServices && appointment.appointmentServices.length > 0)
  
  if (hasPivot && appointment.appointmentServices) {
    const names = appointment.appointmentServices
      .map((item) => item.service?.name)
      .filter((name): name is string => Boolean(name))

    const totals = appointment.appointmentServices.reduce(
      (acc, item) => ({
        price: acc.price + item.price,
        durationMins: acc.durationMins + item.durationMins,
      }),
      { price: 0, durationMins: 0 },
    )

    return {
      names,
      namesJoined: names.join(', ') || (appointment.service?.name ?? ''),
      totalPrice: totals.price,
      totalDurationMins: totals.durationMins,
      count: appointment.appointmentServices.length,
    }
  }

  const fallbackName = appointment.service?.name ? [appointment.service.name] : []
  return {
    names: fallbackName,
    namesJoined: appointment.service?.name ?? '',
    totalPrice: appointment.service?.price ?? 0,
    totalDurationMins: appointment.service?.durationMins ?? 0,
    count: fallbackName.length,
  }
}
