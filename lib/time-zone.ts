// Datas no fuso da barbearia (Barbearia.timezone, IANA), independentes do fuso da máquina.
// O servidor pode rodar em UTC: "hoje", "este mês" e "10:00" são sempre os da barbearia.

export interface ZonedParts {
  year: number
  month: number // 1-12
  day: number
  hour: number
  minute: number
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
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

// Instante UTC do horário de parede informado no fuso. Duas iterações acertam a diferença de offset,
// inclusive em fusos com horário de verão. Aceita mês/dia fora do intervalo (ex.: mês 13 vira janeiro).
export function zonedWallClockToUtc(parts: ZonedParts, timeZone: string): Date {
  const wanted = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
  let timestamp = wanted
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const zoned = getZonedParts(new Date(timestamp), timeZone)
    timestamp += wanted - Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute)
  }
  return new Date(timestamp)
}

// Meia-noite (no fuso) do dia de `date`, deslocada `offsetDays` dias.
export function startOfZonedDay(date: Date, timeZone: string, offsetDays = 0): Date {
  const { year, month, day } = getZonedParts(date, timeZone)
  return zonedWallClockToUtc({ year, month, day: day + offsetDays, hour: 0, minute: 0 }, timeZone)
}

// Segunda-feira 00:00 (no fuso) da semana de `date`.
export function startOfZonedWeek(date: Date, timeZone: string): Date {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const sinceMonday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday)
  return startOfZonedDay(date, timeZone, -sinceMonday)
}

// Dia 1 00:00 (no fuso) do mês de `date`, deslocado `offsetMonths` meses.
export function startOfZonedMonth(date: Date, timeZone: string, offsetMonths = 0): Date {
  const { year, month } = getZonedParts(date, timeZone)
  return zonedWallClockToUtc({ year, month: month + offsetMonths, day: 1, hour: 0, minute: 0 }, timeZone)
}

// Intervalo [start, end) de um mês do calendário (month 1-12) no fuso. Use lt: end, nunca lte.
export function zonedMonthRange(year: number, month: number, timeZone: string) {
  return {
    start: zonedWallClockToUtc({ year, month, day: 1, hour: 0, minute: 0 }, timeZone),
    end: zonedWallClockToUtc({ year, month: month + 1, day: 1, hour: 0, minute: 0 }, timeZone),
  }
}

// "yyyy-MM-dd" vira a meia-noite daquele dia no fuso. new Date('2026-11-01') seria meia-noite UTC, que em
// Porto Velho é 31/10 às 20:00 e cairia no dia (e no mês) anterior. Valor com hora segue como veio.
export function parseZonedDate(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(value)
  return zonedWallClockToUtc({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]), hour: 0, minute: 0 }, timeZone)
}

// Para exibir no navegador com date-fns: devolve um Date cujos campos locais (getHours, getDate, format...)
// mostram o relógio da barbearia, qualquer que seja o fuso do aparelho. Serve só para exibir e comparar dias;
// nunca enviar ao servidor nem usar como instante. Sem fuso (ainda carregando), devolve a data como veio.
export function toZonedWallClock(date: Date | string | number, timeZone?: string | null): Date {
  const instant = new Date(date)
  if (!timeZone) return instant
  const p = getZonedParts(instant, timeZone)
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, instant.getUTCSeconds())
}

// Chaves de agrupamento no fuso ("2026-10-31", "2026-10"); toISOString agruparia pelo dia em UTC.
export function zonedDayKey(date: Date, timeZone: string): string {
  const { year, month, day } = getZonedParts(date, timeZone)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function zonedMonthKey(date: Date, timeZone: string): string {
  return zonedDayKey(date, timeZone).slice(0, 7)
}
