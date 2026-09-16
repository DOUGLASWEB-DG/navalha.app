import { AppointmentStatus } from '@prisma/client'

export const APPOINTMENT_TIME_ZONE = 'America/Porto_Velho'
export const OPENING_MINUTES = 8 * 60
export const CLOSING_MINUTES = 20 * 60
export const CANCELLATION_NOTICE_MINUTES = 120

export class AppointmentRuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AppointmentRuleError'
  }
}

interface AppointmentDateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function getPartsInTimeZone(date: Date): AppointmentDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APPOINTMENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  }
}

function wallClockToUtc(parts: AppointmentDateParts): Date {
  let timestamp = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const zoned = getPartsInTimeZone(new Date(timestamp))
    const zonedAsUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute)
    timestamp += Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - zonedAsUtc
  }
  return new Date(timestamp)
}

export function parseAppointmentDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value)
  if (!match) throw new AppointmentRuleError('Data do agendamento inválida.')

  const [, yearText, monthText, dayText, hourText = '00', minuteText = '00'] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const hour = Number(hourText)
  const minute = Number(minuteText)
  const date = wallClockToUtc({ year, month, day, hour, minute })
  const parsed = getPartsInTimeZone(date)

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

export function parseIncomingAppointmentDate(value: string): Date {
  if (value.includes('Z') || value.includes('+')) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) throw new AppointmentRuleError('Data do agendamento inválida.')
    return date
  }
  return parseAppointmentDate(value)
}

export function getAppointmentDayRange(dateValue: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  if (!match) throw new AppointmentRuleError('Data inválida.')
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const start = parseAppointmentDate(`${dateValue}T00:00`)
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1))
  const nextDayValue = [
    nextDay.getUTCFullYear(),
    String(nextDay.getUTCMonth() + 1).padStart(2, '0'),
    String(nextDay.getUTCDate()).padStart(2, '0'),
  ].join('-')
  return { start, end: parseAppointmentDate(`${nextDayValue}T00:00`) }
}

export function validateAppointmentSchedule(date: Date, durationMins: number, checkPast = true) {
  const now = new Date()
  const current = getPartsInTimeZone(now)
  const scheduled = getPartsInTimeZone(date)
  const todayStart = wallClockToUtc({ ...current, hour: 0, minute: 0 })

  if (checkPast && date < todayStart) {
    throw new AppointmentRuleError('Não é possível agendar em uma data passada.')
  }
  if (checkPast && date < now) {
    throw new AppointmentRuleError('Escolha um horário futuro.')
  }
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: APPOINTMENT_TIME_ZONE,
    weekday: 'short',
  }).format(date)
  if (weekday === 'Sun') {
    throw new AppointmentRuleError('A barbearia não funciona aos domingos.')
  }

  const startMinutes = scheduled.hour * 60 + scheduled.minute
  const end = new Date(date.getTime() + durationMins * 60_000)
  const closing = wallClockToUtc({ ...scheduled, hour: 20, minute: 0 })

  if (startMinutes < OPENING_MINUTES || startMinutes >= CLOSING_MINUTES || date.getMinutes() % 30 !== 0) {
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
