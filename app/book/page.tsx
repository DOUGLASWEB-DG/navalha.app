'use client'

import { useState, Suspense, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { format, addDays, isBefore, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Scissors,
  Clock,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ArrowRight,
  User,
  Phone,
  CalendarDays,
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const WHATSAPP_NUMBER = '5569992476425'

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
]

type Step = 'service' | 'barber' | 'datetime' | 'details' | 'success'

interface BookingData {
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

function buildWhatsAppLink(data: Partial<BookingData>) {
  const msg = data.serviceName
    ? `Olá! Gostaria de agendar um(a) *${data.serviceName}*${data.date ? ` no dia *${format(new Date(data.date + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}*` : ''}${data.time ? ` às *${data.time}*` : ''}. Esse horário está disponível?`
    : `Olá! Gostaria de agendar um horário. Quais horários estão disponíveis?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

function BookingContent() {
  const [step, setStep] = useState<Step>('service')
  const [booking, setBooking] = useState<Partial<BookingData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedId, setConfirmedId] = useState<string | null>(null)

  const { data: apiData, isLoading: loadingInit } = useSWR('/api/book', fetcher)
  const services = apiData?.services || []
  const barbers = apiData?.barbers || []

  const { data: availabilityData, isLoading: loadingAvail } = useSWR(
    booking.date ? `/api/book/availability?date=${booking.date}` : null,
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
        setBooking(prev => ({ ...prev, barberId: barbers[0]?.id || 'any' }))
        setStep('datetime')
      }
    }
  }, [step, barbers])

  async function submit(details: { name: string; phone: string; notes: string }) {
    if (!booking.serviceId || !booking.date || !booking.time) return
    setIsSubmitting(true)
    
    const finalBooking = { ...booking, ...details }
    setBooking(finalBooking)

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          serviceId: booking.serviceId,
          barberId: booking.barberId,
          date: booking.date,
          time: booking.time,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Falha de validação.')
      }

      const result = await res.json()
      setConfirmedId(result.appointment?.id)
      setStep('success')
      toast.success('Sucesso!', { description: 'Seu horário foi reservado.' })
    } catch (err: any) {
      toast.error('Erro', { description: err.message || 'Falha ao realizar agendamento.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verifica se um slot está livre
  function isSlotAvailable(slot: string) {
    if (!availabilityData) return true
    
    const [h, m] = slot.split(':').map(Number)
    const reqStart = h * 60 + m
    const reqEnd = reqStart + (booking.serviceDuration || 30)

    // Precisamos checar se existe *algum* barbeiro livre
    // Se o cliente escolheu "Qualquer um" (any), qualquer barbeiro serve.
    // Se escolheu um específico, checamos apenas ele.
    
    const targetBarbers = booking.barberId && booking.barberId !== 'any' 
      ? barbers.filter((b: any) => b.id === booking.barberId)
      : barbers

    if (targetBarbers.length === 0) return true

    // Checa se pelo menos um barbeiro está livre
    const hasFreeBarber = targetBarbers.some((barber: any) => {
      // Pega todos agendamentos desse barbeiro
      const barberAppts = availabilityData.filter((a: any) => a.barberId === barber.id)
      
      // Checa se há conflito
      const hasConflict = barberAppts.some((appt: any) => {
        const d = new Date(appt.date)
        const apptStart = d.getHours() * 60 + d.getMinutes()
        const apptEnd = apptStart + (appt.service?.durationMins || 30)
        
        // Verifica sobreposição
        return (reqStart < apptEnd && reqEnd > apptStart)
      })

      return !hasConflict
    })

    // Se é hoje, não permitir agendar no passado
    if (booking.date === format(new Date(), 'yyyy-MM-dd')) {
      const now = new Date()
      const currentMins = now.getHours() * 60 + now.getMinutes()
      if (reqStart <= currentMins) return false
    }

    return hasFreeBarber
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
          <span className="text-base sm:text-lg font-bold font-serif tracking-tight text-foreground truncate max-w-[120px] sm:max-w-none uppercase">
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
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-bold sm:inline hidden">Dúvidas?</span>
          </Button>
        </a>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 sm:py-12 flex flex-col">
        {step !== 'success' && (
          <div className="flex items-center justify-between mb-8 px-1">
            {(['service', 'barber', 'datetime', 'details'] as const).map((s, i) => {
              const stepLabels = { service: 'Serviço', barber: 'Barbeiro', datetime: 'Horário', details: 'Dados' }
              const stepIndex = ['service', 'barber', 'datetime', 'details'].indexOf(step)
              const done = i < stepIndex
              const active = i === stepIndex
              return (
                <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0',
                    done ? 'bg-primary text-primary-foreground shadow-sm' :
                    active ? 'border-2 border-primary text-primary bg-primary/10' :
                    'border-2 border-border text-muted-foreground bg-muted/50'
                  )}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden sm:block',
                    active ? 'text-foreground' : done ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {stepLabels[s]}
                  </span>
                  {i < 3 && (
                    <div className="flex-1 h-[1.5px] mx-1 rounded-full overflow-hidden bg-border">
                      <div className={cn("h-full transition-all duration-500", done ? "bg-primary w-full" : "w-0")} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PASSO 1 */}
        {step === 'service' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-extrabold font-serif text-foreground tracking-tight">O que vamos fazer?</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Escolha o serviço perfeito para o seu visual.</p>
            </div>

            {loadingInit ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Consultando...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {services?.map((svc: any) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setBooking({
                        ...booking,
                        serviceId: svc.id,
                        serviceName: svc.name,
                        servicePrice: svc.price,
                        serviceDuration: svc.durationMins,
                      })
                      setTimeout(() => setStep('barber'), 200)
                    }}
                    className={cn(
                      'w-full text-left bg-card backdrop-blur-md border rounded-2xl p-5 transition-all duration-200 group active:scale-[0.97] shadow-sm',
                      booking.serviceId === svc.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/40 hover:bg-accent/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                          booking.serviceId === svc.id ? "bg-primary text-primary-foreground scale-110 shadow-sm" : "bg-muted border border-border text-primary"
                        )}>
                          <Scissors className="w-6 h-6" />
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
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider justify-end mt-1">
                          <Clock className="w-3 h-3" />
                          {svc.durationMins} min
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASSO 2 - BARBEIRO */}
        {step === 'barber' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-4">
              <button onClick={() => setStep('service')} className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h1 className="text-3xl font-extrabold font-serif text-foreground">Quem vai te atender?</h1>
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
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Primeiro livre</p>
                </div>
              </button>

              {barbers?.map((b: any) => (
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
                    <p className="text-[10px] text-primary/70 font-medium uppercase tracking-widest mt-1">Barbeiro</p>
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
                onClick={() => setStep('barber')}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <h1 className="text-3xl font-extrabold font-serif text-foreground">Quando?</h1>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Escolha o Dia
              </p>
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
                      <span className={cn("text-[10px] font-bold uppercase tracking-tighter mb-1", isSelected ? "text-zinc-900" : "text-muted-foreground")}>
                         {format(date, 'EEE', { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-black leading-none">{format(date, 'd')}</span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-tighter mt-1", isSelected ? "text-zinc-800" : "text-muted-foreground")}>
                        {format(date, 'MMM', { locale: ptBR })}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={cn("transition-all duration-500", booking.date ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-4")}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Escolha o Horário
                </p>
                {loadingAvail && <span className="text-xs text-primary animate-pulse">Atualizando...</span>}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = booking.time === slot
                  const available = isSlotAvailable(slot)

                  return (
                    <button
                      key={slot}
                      disabled={!available}
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
            </div>

            <Button
              onClick={() => setStep('details')}
              disabled={!booking.date || !booking.time}
              className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest mt-4 active:scale-[0.98] transition-all"
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
              <h1 className="text-3xl font-black font-serif text-foreground tracking-tighter italic uppercase">Agendado!</h1>
              <p className="text-base text-muted-foreground mt-3 font-medium max-w-xs mx-auto">
                Tudo pronto, <span className="text-primary font-bold">{booking.name?.split(' ')[0] || 'Campeão'}</span>! Sua vaga está garantida.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 text-left relative overflow-hidden shadow-lg max-w-xs mx-auto mb-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
                  <img src={tenantConfig.logoUrl} className="w-full h-full object-contain p-0" alt="Logo" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Serviço</p>
                  <p className="text-lg font-bold text-foreground truncate">{booking.serviceName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Data</p>
                  <p className="text-sm font-bold text-foreground">
                    {booking.date && format(new Date(booking.date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Horário</p>
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
                <Button className="w-full bg-success text-success-foreground hover:bg-success/90 h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow border-none">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Abrir WhatsApp
                </Button>
              </a>
              <Button 
                variant="ghost" 
                onClick={() => window.location.reload()} 
                className="w-full text-muted-foreground hover:text-foreground h-12 font-bold uppercase tracking-widest text-[10px]"
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

function DetailsStep({ booking, onBack, onSubmit, isSubmitting }: any) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<any>({})

  function validate() {
    const e: any = {}
    if (!name.trim()) e.name = 'Como podemos te chamar?'
    if (!phone.trim()) e.phone = 'Precisamos do seu WhatsApp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col gap-4">
        <button onClick={onBack} disabled={isSubmitting} className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors w-fit disabled:opacity-50">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-3xl font-extrabold font-serif text-foreground">Quem é você?</h1>
        <p className="text-sm text-muted-foreground">Complete seus dados para finalizar a reserva.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="min-w-0">
          <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{booking.serviceName}</p>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">
              {booking.date && format(new Date(booking.date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })} às {booking.time}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-foreground leading-none">R${booking.servicePrice}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit({ name, phone, notes }) }} className="flex flex-col gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Seu Nome Completo</Label>
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
          {errors.name && <p className="text-[10px] font-bold text-destructive uppercase tracking-tight ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Seu WhatsApp</Label>
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
          {errors.phone && <p className="text-[10px] font-bold text-destructive uppercase tracking-tight ml-1">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Observações</Label>
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
          className="w-full h-14 rounded-2xl text-base font-black uppercase tracking-widest mt-4 active:scale-[0.98] transition-all"
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
        <p className="text-sm font-bold text-primary uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
