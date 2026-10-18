import { AppointmentStatus } from '@prisma/client'
import { getZonedParts, zonedWallClockToUtc } from '@/lib/time-zone'

// Regras de agenda no fuso da barbearia (Barbearia.timezone). Todas as funções exigem o fuso: não há padrão,
// para que nenhuma chamada caia no fuso da máquina ou de outra barbearia.
export const OPENING_MINUTES = 8 * 60
export const CLOSING_MINUTES = 20 * 60
export const CANCELLATION_NOTICE_MINUTES = 120

export class AppointmentRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppointmentRuleError'
  }
}

export function parseAppointmentDate(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value)
  if (!match) throw new AppointmentRuleError('Data do agendamento inválida.')

  const [, yearText, monthText, dayText, hourText = '00', minuteText = '00'] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const date = zonedWallClockToUtc({ year, month, day, hour, minute }, timeZone)
  const parsed = getZonedParts(date, timeZone)

  if (
    parsed.year !== year ||
    parsed.month !== month ||
    parsed.day !== day ||
    parsed.hour !== hour ||
    parsed.minute !== minute
  ) {
    throw new AppointmentRuleError('Data ou horário inválido.')
  }

  return date
}

export function parseIncomingAppointmentDate(value: string, timeZone: string): Date {
  if (value.includes('Z') || value.includes('+')) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw new AppointmentRuleError('Data do agendamento inválida.')
    return date
  }
  return parseAppointmentDate(value, timeZone)
}

// Intervalo [start, end) do dia informado (yyyy-MM-dd) no fuso da barbearia.
export function getAppointmentDayRange(dateValue: string, timeZone: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  if (!match) throw new AppointmentRuleError('Data inválida.')
  const start = parseAppointmentDate(`${dateValue}T00:00`, timeZone)
  const end = zonedWallClockToUtc(
    { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) + 1, hour: 0, minute: 0 },
    timeZone,
  )
  return { start, end }
}

export function validateAppointmentSchedule(date: Date, durationMins: number, timeZone: string, checkPast = true) {
  const now = new Date()
  const current = getZonedParts(now, timeZone)
  const scheduled = getZonedParts(date, timeZone)
  const todayStart = zonedWallClockToUtc({ ...current, hour: 0, minute: 0 }, timeZone)

  if (checkPast && date < todayStart) {
    throw new AppointmentRuleError('Não é possível agendar em uma data passada.')
  }
  if (checkPast && date < now) {
    throw new AppointmentRuleError('Escolha um horário futuro.')
  }
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  if (weekday === 'Sun') {
    throw new AppointmentRuleError('A barbearia não funciona aos domingos.')
  }

  const startMinutes = scheduled.hour * 60 + scheduled.minute
  const end = new Date(date.getTime() + durationMins * 60_000)
  const closing = zonedWallClockToUtc({ ...scheduled, hour: 20, minute: 0 }, timeZone)

  // Minuto no fuso da barbearia (date.getMinutes() usaria o fuso da máquina)
  if (startMinutes < OPENING_MINUTES || startMinutes >= CLOSING_MINUTES || scheduled.minute % 30 !== 0) {
    throw new AppointmentRuleError('Escolha um horário entre 08:00 e 19:30, em intervalos de 30 minutos.')
  }
  if (end > closing) {
    throw new AppointmentRuleError('Esse serviço precisa terminar até as 20:00.')
  }

  return end
}

export function assertStatusTransition(
  current: AppointmentStatus,
  next: AppointmentStatus,
  appointmentDate: Date,
  isAdmin: boolean = false
) {
  if (current === next) return

  const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
    PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELED],
    CONFIRMED: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELED],
    COMPLETED: [],
    CANCELED: [],
  }

  // Se for admin, pode transitar livremente (ex: de cancelado pra pendente, ou concluído pra cancelado se errou)
  if (!isAdmin && !allowed[current].includes(next)) {
    throw new AppointmentRuleError(`Não é possível alterar um agendamento de ${current} para ${next}.`)
  }

  if (!isAdmin && next === AppointmentStatus.CONFIRMED && appointmentDate <= new Date()) {
    throw new AppointmentRuleError('Agendamentos passados não podem ser confirmados.')
  }
  if (!isAdmin && next === AppointmentStatus.COMPLETED && appointmentDate > new Date()) {
    throw new AppointmentRuleError('O agendamento só pode ser concluído após o horário marcado.')
  }
  if (!isAdmin && next === AppointmentStatus.CANCELED && appointmentDate <= new Date()) {
    throw new AppointmentRuleError('Agendamentos passados não podem ser cancelados.')
  }
  if (
    !isAdmin &&
    next === AppointmentStatus.CANCELED &&
    appointmentDate.getTime() - new Date().getTime() < CANCELLATION_NOTICE_MINUTES * 60_000
  ) {
    throw new AppointmentRuleError('Cancelamentos devem ser feitos com pelo menos 2 horas de antecedência.')
  }
}
