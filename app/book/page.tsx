'use client'

import { useState, Suspense, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import {
  addDays,
  addMonths,
  endOfMonth,
  eachDayOfInterval,
  format,
  isBefore,
  isSameDay,
  startOfMonth,
  startOfToday,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Scissors,
  Clock,
  Undo2,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  User,
  Phone,
  CalendarDays,
  ChevronLeft,
  FileText,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { tenantConfig } from '@/config/tenant'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'

const fetcher = async <T,>(url: string) => {
  const response = await fetch(url)
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : 'Não foi possível carregar os dados.')
  }
  return body as T
}

const WHATSAPP_NUMBER = '5569992476425'

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
]

const SERVICE_IMAGES: Record<string, string> = {
  barba: '/assets/servico-barba.jpg',
  coloracao: '/assets/servico-artistico.jpg',
  corte: '/assets/servico-corte.jpg',
  luzes: '/assets/servico-nevou.jpg',
  nevou: '/assets/servico-nevou.jpg',
  pezinho: '/assets/servico-listra.jpg',
  pigmentacao: '/assets/servico-artistico.jpg',
  selagem: '/assets/servico-corte.jpg',
  sobrancelha: '/assets/servico-listra.jpg',
}

type Step = 'service' | 'barber' | 'datetime' | 'details' | 'success'

interface BookingData {
  serviceIds: string[]
  serviceNames: string[]
  totalPrice: number
  totalDuration: number
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  barberId?: string
  date: string
  time: string
  name: string
  phone: string
  notes: string
}

interface Service {
  id: string
  name: string
  price: number
  durationMins: number
  description: string | null
}

interface Barber {
  id: string
  name: string
  role: string
}

interface AppointmentAvailability {
  barberId: string | null
  date: string
  service: {
    durationMins: number
  }
}

interface AvailabilityResponse {
  requestedDurationMins?: number
  appointments: AppointmentAvailability[]
}

interface BookingApiData {
  services: Service[]
  barbers: Barber[]
}

interface DetailsStepProps {
  booking: Partial<BookingData>
  onBack: () => void
  onSubmit: (details: { name: string; phone: string; notes: string }) => void
  isSubmitting: boolean
}

interface ApiErrorResponse {
  error?: string | Array<{ message?: string }>
}

function buildWhatsAppLink(data: Partial<BookingData>) {
  const serviceLabel = data.serviceNames?.length ? data.serviceNames.join(', ') : data.serviceName
  const msg = serviceLabel
    ? `Olá! Gostaria de agendar *${serviceLabel}*${data.date ? ` no dia *${format(new Date(data.date + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}*` : ''}${data.time ? ` às *${data.time}*` : ''}. Esse horário está disponível?`
    : `Olá! Gostaria de agendar um horário. Quais horários estão disponíveis?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

function getServiceImage(serviceName: string) {
  const normalizedName = serviceName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  return SERVICE_IMAGES[normalizedName] || '/assets/servico-corte.jpg'
}

interface CalendarPickerProps {
  month: Date
  selectedDate?: string
  minimumDate: Date
  onMonthChange: (month: Date) => void
  onSelect: (date: Date) => void
}

function CalendarPicker({
  month,
  selectedDate,
  minimumDate,
  onMonthChange,
  onSelect,
}: CalendarPickerProps) {
  const monthStart = startOfMonth(month)
  const monthDays = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) })
  const leadingDays = Array.from({ length: (monthStart.getDay() + 6) % 7 })
  const selected = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null

  return (
    <div className="rounded-[2rem] border border-border/80 bg-card p-4 shadow-xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(month, 1))}
          disabled={isBefore(endOfMonth(subMonths(month, 1)), minimumDate)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-black capitalize text-foreground">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
          <span key={`${day}-${index}`} className="py-2 text-[10px] font-black text-muted-foreground">
            {day}
          </span>
        ))}
        {leadingDays.map((_, index) => <span key={`empty-${index}`} />)}
        {monthDays.map((date) => {
          const disabled = date.getDay() === 0 || isBefore(date, minimumDate)
          const active = selected !== null && isSameDay(date, selected)
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={cn(
                'mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all',
                active
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : disabled
                    ? 'cursor-not-allowed text-muted-foreground/25'
                    : 'text-foreground hover:bg-primary/10 hover:text-primary'
              )}
              aria-label={format(date, "d 'de' MMMM", { locale: ptBR })}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BookingContent() {
  const [step, setStep] = useState<Step>('service')
  const [booking, setBooking] = useState<Partial<BookingData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(startOfToday())
  const [showCalendar, setShowCalendar] = useState(false)

  const {
    data: apiData,
    error: initError,
    isLoading: loadingInit,
    mutate: reloadInit,
  } = useSWR<BookingApiData>('/api/book', fetcher)
  const services = apiData?.services ?? []
  const barbers = apiData?.barbers ?? []
  const firstBarberId = barbers[0]?.id

  const {
    data: availabilityData,
    error: availabilityError,
    isLoading: loadingAvail,
    mutate: reloadAvailability,
  } = useSWR<AvailabilityResponse>(
    booking.date ? `/api/book/availability?date=${booking.date}&serviceIds=${(booking.serviceIds || []).join(',')}` : null,
    fetcher
  )

  const today = startOfToday()
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(today, i + 0)).filter(
    (d) => d.getDay() !== 0
  )

  // Skip barber step if only 1 barber exists
  useEffect(() => {
    if (step === 'barber') {
      if (barbers.length <= 1) {
        setBooking(prev => ({ ...prev, barberId: firstBarberId || 'any' }))
        setStep('datetime')
      }
    }
  }, [step, barbers.length, firstBarberId])

  function goBackFromDateTime() {
    setStep(barbers.length <= 1 ? 'service' : 'barber')
  }

  async function submit(details: { name: string; phone: string; notes: string }) {
    if (!booking.serviceIds?.length || !booking.date || !booking.time) return
    setIsSubmitting(true)
    
    const finalBooking = { ...booking, ...details }
    setBooking(finalBooking)

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          serviceIds: booking.serviceIds,
          serviceId: booking.serviceId,
          barberId: booking.barberId,
          date: booking.date,
          time: booking.time,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.json() as ApiErrorResponse
        const message = Array.isArray(errorBody.error)
          ? errorBody.error.map((item) => item.message).filter(Boolean).join(', ')
          : errorBody.error
        throw new Error(message || 'Falha de validação.')
      }

      await res.json()
      setStep('success')
      toast.success('Sucesso!', { description: 'Seu horário foi reservado.' })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao realizar agendamento.'
      toast.error('Não foi possível agendar', { description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verifica se um slot está livre
  function isSlotAvailable(slot: string) {
    if (!availabilityData) return true
    
    const [h, m] = slot.split(':').map(Number)
    const reqStart = h * 60 + m
    const reqEnd = reqStart + Number(booking.totalDuration || booking.serviceDuration || 30)

    // O ultimo horario precisa terminar ate as 20h, horario de fechamento.
    if (reqEnd > 20 * 60) return false

    // Precisamos checar se existe *algum* barbeiro livre
    // Se o cliente escolheu "Qualquer um" (any), qualquer barbeiro serve.
    // Se escolheu um específico, checamos apenas ele.
    
    const targetBarbers = booking.barberId && booking.barberId !== 'any' 
      ? barbers.filter((barber) => barber.id === booking.barberId)
      : barbers

    if (targetBarbers.length === 0) return true

    // Checa se pelo menos um barbeiro está livre
    const hasFreeBarber = targetBarbers.some((barber) => {
      // Pega todos agendamentos desse barbeiro
      const barberAppts = availabilityData.appointments.filter((appointment) => appointment.barberId === barber.id)
      
      // Checa se há conflito
      const hasConflict = barberAppts.some((appointment) => {
        const apptDate = new Date(appointment.date)
        const tzString = apptDate.toLocaleString('en-US', { timeZone: 'America/Porto_Velho' })
        const zonedDate = new Date(tzString)
        const apptStart = zonedDate.getHours() * 60 + zonedDate.getMinutes()
        const apptEnd = apptStart + Number(appointment.service.durationMins)
        
        // Verifica sobreposição
        return (reqStart < apptEnd && reqEnd > apptStart)
      })

      return !hasConflict
    })

    // Se é hoje, não permitir agendar no passado
    if (booking.date === format(new Date(), 'yyyy-MM-dd')) {
      const nowTzString = new Date().toLocaleString('en-US', { timeZone: 'America/Porto_Velho' })
      const nowZoned = new Date(nowTzString)
      const currentMins = nowZoned.getHours() * 60 + nowZoned.getMinutes()
      if (reqStart <= currentMins) return false
    }

    return hasFreeBarber
  }

  function selectDate(date: Date) {
    if (date.getDay() === 0 || isBefore(date, today)) {
      toast.error('Data indisponível', {
        description: date.getDay() === 0
          ? 'A barbearia não funciona aos domingos.'
          : 'Escolha uma data a partir de hoje.',
      })
      return
    }

    const value = format(date, 'yyyy-MM-dd')
    setBooking({ ...booking, date: value, time: undefined })
    setCalendarMonth(startOfMonth(date))
    setShowCalendar(false)
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-x-hidden">
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3 transition-transform active:scale-95 shrink-0">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
            <img 
              src={tenantConfig.logoUrl} 
              alt="Logo" 
              className="w-full h-full object-contain p-0" 
            />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate max-w-[120px] sm:max-w-none ">
            {tenantConfig.name}
          </span>
        </Link>
        <a
          href={buildWhatsAppLink(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button variant="outline" size="sm" className="border-success/20 bg-success/10 text-success hover:bg-success/20 gap-2 h-9 rounded-xl px-4">
            <WhatsAppIcon className="w-4 h-4" />
            <span className="text-xs font-bold sm:inline hidden">Dúvidas?</span>
          </Button>
        </a>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-12 flex flex-col">
        {step !== 'success' && (
          <div className="mb-8 px-1">
            <div className="flex gap-1.5" aria-label="Progresso do agendamento">
              {(['service', 'barber', 'datetime', 'details'] as const).map((s, i) => {
                const stepIndex = ['service', 'barber', 'datetime', 'details'].indexOf(step)
                return (
                  <div
                    key={s}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors duration-500',
                      i <= stepIndex ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )
              })}
            </div>
            <p className="mt-2 text-center text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              {step === 'service' && 'Escolha o serviço'}
              {step === 'barber' && 'Escolha o barbeiro'}
              {step === 'datetime' && 'Escolha data e horário'}
              {step === 'details' && 'Seus dados'}
            </p>
          </div>
        )}

        {/* PASSO 1 */}
        {step === 'service' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">O que vamos fazer?</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Escolha o serviço perfeito para o seu visual.</p>
            </div>

            {loadingInit ? (
              <div className="space-y-3" aria-label="Carregando serviços">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex h-28 animate-pulse items-center gap-4 rounded-2xl border border-border bg-card p-5">
                    <div className="h-16 w-16 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-2/5 rounded-full bg-muted" />
                      <div className="h-3 w-4/5 rounded-full bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : initError ? (
              <div className="rounded-3xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
                <p className="text-base font-bold text-foreground">Não conseguimos carregar os serviços</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verifique sua conexão e tente novamente.
                </p>
                <Button type="button" variant="outline" onClick={() => reloadInit()} className="mt-5 rounded-xl">
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      const selectedIds = booking.serviceIds || []
                      const serviceIds = selectedIds.includes(svc.id)
                        ? selectedIds.filter((id) => id !== svc.id)
                        : [...selectedIds, svc.id]
                      const selectedServices = services.filter((service) => serviceIds.includes(service.id))
                      setBooking({
                        ...booking,
                        serviceIds,
                        serviceId: serviceIds[0],
                        serviceNames: selectedServices.map((service) => service.name),
                        serviceName: selectedServices.map((service) => service.name).join(', '),
                        servicePrice: selectedServices.reduce((total, service) => total + Number(service.price), 0),
                        serviceDuration: selectedServices.reduce((total, service) => total + Number(service.durationMins), 0),
                        totalPrice: selectedServices.reduce((total, service) => total + Number(service.price), 0),
                        totalDuration: selectedServices.reduce((total, service) => total + Number(service.durationMins), 0),
                      })
                    }}
                    className={cn(
                      'w-full text-left bg-card backdrop-blur-md border rounded-2xl p-5 transition-all duration-200 group active:scale-[0.97] shadow-sm',
                      (booking.serviceIds || []).includes(svc.id)
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/40 hover:bg-accent/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                          <img
                            src={getServiceImage(svc.name)}
                            alt={`Imagem do serviço ${svc.name}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-foreground truncate">{svc.name}</p>
                          {svc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{svc.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-primary">R${svc.price}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground tracking-wider justify-end mt-1">
                          <Clock className="w-3 h-3" />
                          {svc.durationMins} min
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                <div className="sticky bottom-4 mt-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {(booking.serviceIds || []).length} serviço(s) selecionado(s)
                      </p>
                      <p className="text-lg font-black text-primary">
                        R${(booking.totalPrice || 0).toFixed(2)} · {booking.totalDuration || 0} min
                      </p>
                    </div>
                    <Button
                      type="button"
                      disabled={!booking.serviceIds?.length}
                      onClick={() => setStep('barber')}
                      className="rounded-xl"
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASSO 2 - BARBEIRO */}
        {step === 'barber' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-4">
              <button onClick={() => setStep('service')} className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest hover:text-foreground transition-colors w-fit">
                <Undo2 className="w-4 h-4" /> Voltar
              </button>
              <h1 className="text-3xl font-extrabold text-foreground">Quem vai te atender?</h1>
              <p className="text-sm text-muted-foreground">Escolha o seu barbeiro de preferência.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setBooking({ ...booking, barberId: 'any' })
                  setTimeout(() => setStep('datetime'), 200)
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-200 active:scale-95 shadow-sm',
                  booking.barberId === 'any' || !booking.barberId
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-card text-foreground hover:bg-accent/50'
                )}
              >
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">Qualquer Um</p>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-widest mt-1">Primeiro livre</p>
                </div>
              </button>

              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBooking({ ...booking, barberId: b.id })
                    setTimeout(() => setStep('datetime'), 200)
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border transition-all duration-200 active:scale-95 shadow-sm',
                    booking.barberId === b.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-foreground hover:bg-accent/50'
                  )}
                >
                  <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold truncate w-full px-2">{b.name}</p>
                    <p className="text-[10px] text-primary/70 font-medium tracking-widest mt-1">Barbeiro</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 3 — Data e Hora */}
        {step === 'datetime' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-4">
              <button
                onClick={goBackFromDateTime}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest hover:text-foreground transition-colors w-fit"
              >
                <Undo2 className="w-4 h-4" /> Voltar
              </button>
              <h1 className="text-3xl font-extrabold text-foreground">Quando?</h1>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Escolha o Dia
                </p>
                <button
                  type="button"
                  onClick={() => setShowCalendar((visible) => !visible)}
                  className="relative flex h-9 items-center gap-2 overflow-hidden rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition-all duration-200 hover:bg-primary/20 active:scale-95"
                  aria-expanded={showCalendar}
                  aria-controls="booking-calendar"
                >
                  <CalendarPlus className="h-4 w-4" />
                  <span>Ver calendário</span>
                </button>
              </div>
              {showCalendar && (
                <div id="booking-calendar" className="mb-4">
                  <CalendarPicker
                    month={calendarMonth}
                    selectedDate={booking.date}
                    minimumDate={today}
                    onMonthChange={setCalendarMonth}
                    onSelect={selectDate}
                  />
                </div>
              )}
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {availableDates.map((date) => {
                  const val = format(date, 'yyyy-MM-dd')
                  const isSelected = booking.date === val
                  const isPast = isBefore(date, today)
                  return (
                    <button
                      key={val}
                      disabled={isPast}
                      onClick={() => setBooking({ ...booking, date: val, time: undefined })}
                      className={cn(
                        'flex flex-col items-center justify-center min-w-[70px] h-[90px] rounded-2xl border transition-all shrink-0 snap-center active:scale-95 shadow-sm',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground shadow-md scale-105'
                          : isPast
                          ? 'border-border bg-muted/50 text-muted-foreground/30 cursor-not-allowed'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50'
                      )}
                    >
                      <span className={cn("text-[10px] font-bold tracking-tighter mb-1", isSelected ? "text-zinc-900" : "text-muted-foreground")}>
                         {format(date, 'EEE', { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-black leading-none">{format(date, 'd')}</span>
                      <span className={cn("text-[10px] font-bold tracking-tighter mt-1", isSelected ? "text-zinc-800" : "text-muted-foreground")}>
                        {format(date, 'MMM', { locale: ptBR })}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-center text-[11px] text-muted-foreground sm:text-left">
                Deslize para ver os próximos dias ou use o calendário.
              </p>
            </div>

            <div className={cn("transition-all duration-500", booking.date ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-4")}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Escolha o Horário
                </p>
                {loadingAvail && <span className="text-xs text-primary animate-pulse">Atualizando...</span>}
              </div>
              {availabilityError ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Não foi possível consultar os horários.</p>
                  <button
                    type="button"
                    onClick={() => reloadAvailability()}
                    className="mt-2 text-xs font-bold text-primary underline underline-offset-4"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = booking.time === slot
                    const available = isSlotAvailable(slot)

                  return (
                    <button
                      key={slot}
                      disabled={!available || loadingAvail || Boolean(availabilityError)}
                      onClick={() => setBooking({ ...booking, time: slot })}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-black transition-all active:scale-95 shadow-sm',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground shadow-md'
                          : !available
                          ? 'border-border bg-muted/30 text-muted-foreground/30 cursor-not-allowed line-through'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50'
                      )}
                    >
                      {slot}
                    </button>
                  )
                })}
                </div>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">
                Horários em cinza já passaram ou estão ocupados.
              </p>
            </div>

            <Button
              onClick={() => setStep('details')}
              disabled={!booking.date || !booking.time}
              className="w-full h-14 rounded-2xl text-base font-black tracking-widest mt-4 active:scale-[0.98] transition-all"
            >
              Próximo Passo
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        )}

        {/* PASSO 4 */}
        {step === 'details' && (
          <DetailsStep
            booking={booking}
            onBack={() => setStep('datetime')}
            onSubmit={submit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* SUCESSO */}
        {step === 'success' && (
          <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-success rounded-full flex items-center justify-center shadow-lg border-4 border-card">
                <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Agendado!</h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs mx-auto">
                Tudo pronto, <span className="text-foreground font-bold">{booking.name?.split(' ')[0] || 'Campeão'}</span>! Sua vaga está garantida.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-5 text-left relative shadow-sm max-w-xs mx-auto mb-10">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl" />
              <div className="flex items-center gap-4 mb-5">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Serviço(s)</p>
                  <p className="text-sm font-bold text-foreground leading-tight mt-0.5 line-clamp-2">
                    {booking.serviceNames?.join(', ') || booking.serviceName}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Data</p>
                  <p className="text-sm font-bold text-foreground">
                    {booking.date && format(new Date(booking.date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">Horário</p>
                  <p className="text-sm font-bold text-foreground">{booking.time}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <a
                href={buildWhatsAppLink(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block"
              >
                <Button className="w-full bg-success text-success-foreground hover:bg-success/90 h-14 rounded-2xl text-base font-black tracking-widest shadow border-none">
                  <WhatsAppIcon className="w-5 h-5 mr-2" />
                  Abrir WhatsApp
                </Button>
              </a>
              <Button 
                variant="ghost" 
                onClick={() => window.location.reload()} 
                className="w-full text-muted-foreground hover:text-foreground h-12 font-bold tracking-widest text-[10px]"
              >
                Novo Agendamento
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function DetailsStep({ booking, onBack, onSubmit, isSubmitting }: DetailsStepProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'name' | 'phone', string>>>({})

  function validate() {
    const e: Partial<Record<'name' | 'phone', string>> = {}
    if (!name.trim()) e.name = 'Como podemos te chamar?'
    if (!phone.trim()) e.phone = 'Precisamos do seu WhatsApp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-4">
        <button onClick={onBack} disabled={isSubmitting} className="flex items-center gap-2 text-xs font-bold text-muted-foreground tracking-widest hover:text-foreground transition-colors w-fit disabled:opacity-50">
          <Undo2 className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-3xl font-extrabold text-foreground">Quem é você?</h1>
        <p className="text-sm text-muted-foreground">Complete seus dados para finalizar a reserva.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="min-w-0">
          <p className="text-xs font-black text-primary tracking-widest mb-1">{booking.serviceNames?.join(', ') || booking.serviceName}</p>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">
              {booking.date && format(new Date(booking.date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })} às {booking.time}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-foreground leading-none">R${(booking.totalPrice || booking.servicePrice || 0).toFixed(2)}</p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{booking.totalDuration || booking.serviceDuration || 0} min</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit({ name, phone, notes }) }} className="flex flex-col gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground tracking-widest ml-1">Seu Nome Completo</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Digite seu nome"
              className={cn("pl-12 h-14 rounded-2xl text-base border-border bg-card shadow-sm", errors.name && "border-destructive")}
            />
          </div>
          {errors.name && <p className="text-[10px] font-bold text-destructive tracking-tight ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground tracking-widest ml-1">Seu WhatsApp</Label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              type="tel"
              placeholder="(00) 90000-0000"
              className={cn("pl-12 h-14 rounded-2xl text-base border-border bg-card shadow-sm", errors.phone && "border-destructive")}
            />
          </div>
          {errors.phone && <p className="text-[10px] font-bold text-destructive tracking-tight ml-1">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground tracking-widest ml-1">Observações</Label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Deseja deixar algum aviso?"
              rows={3}
              className="pl-12 rounded-2xl text-base py-4 border-border bg-card shadow-sm resize-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full h-14 rounded-2xl text-base font-black tracking-widest mt-4 active:scale-[0.98] transition-all"
        >
          Finalizar Agendamento
        </Button>
      </form>
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-primary tracking-widest animate-pulse">Carregando...</p>
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
