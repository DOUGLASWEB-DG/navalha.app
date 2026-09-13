"use client"

import Link from 'next/link'
import { Scissors, Clock, Star, MapPin, Phone, Instagram, ArrowRight, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { motion, useScroll, useTransform } from "framer-motion"
import { tenantConfig } from '@/config/tenant'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'

// Logotipo Tipográfico Minimalista (Sem ícone, com .app em azul sem duplicação)
function AppBrand({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  }

  // Tratamento para remover .app do nome caso já exista no tenantConfig e evitar duplicar
  const baseName = tenantConfig.name.toLowerCase().replace(/\.?app$/i, '')

  return (
    <div className="flex items-center font-sans select-none tracking-tight">
      <span className={cn("font-bold text-foreground", textSizes[size])}>
        {baseName}
        <span className="text-primary font-semibold">.app</span>
      </span>
    </div>
  )
}

function HairParticles({ isPrimary = false }: { isPrimary?: boolean }) {
  const particles = Array.from({ length: 6 })
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((_, i) => (
        <motion.span
          key={i}
          initial={{
            opacity: 0,
            x: `${(i + 1) * 15}%`,
            y: "40%",
            rotate: Math.random() * 40 - 20,
          }}
          animate={{
            opacity: [0, 1, 0],
            y: ["40%", "130%"],
            x: [`${(i + 1) * 15}%`, `${(i + 1) * 15 + (Math.random() * 10 - 5)}%`],
            rotate: Math.random() * 120 - 60,
          }}
          transition={{
            duration: 0.6,
            delay: (isPrimary ? 1.6 : 0.2) + i * 0.05,
            ease: "easeOut"
          }}
          className={cn(
            "absolute w-[1.5px] h-2.5 rounded-full",
            isPrimary ? "bg-primary" : "bg-muted-foreground/40"
          )}
        />
      ))}
    </div>
  )
}

function HeroTitle() {
  return (
    <h1 className="text-4xl sm:text-6xl font-bold font-serif text-balance leading-tight mb-6 flex flex-col items-center tracking-tight">
      <div className="relative inline-block py-1">
        <HairParticles />
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
        >
          A Arte do
        </motion.div>
        
        <motion.div
          initial={{ left: "-10%", opacity: 0 }}
          animate={{ 
            left: "105%", 
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-muted-foreground z-10"
        >
          <motion.div
            animate={{ rotate: [0, -20, 0, -20, 0] }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
          >
            <Scissors className="w-8 h-8 md:w-10 md:h-10 transform -scale-x-100" />
          </motion.div>
        </motion.div>
      </div>

      <div className="relative inline-block py-1">
        <HairParticles isPrimary />
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 1.4 }}
          className="text-primary"
        >
          Corte Perfeito
        </motion.div>

        <motion.div
          initial={{ left: "-10%", opacity: 0 }}
          animate={{ 
            left: "105%", 
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 1.4 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-primary z-10"
        >
          <motion.div
            animate={{ rotate: [0, -30, 0] }}
            transition={{ duration: 0.5, ease: "linear", delay: 1.4 }}
          >
            <Scissors className="w-10 h-10 md:w-12 md:h-12 transform -scale-x-100" />
          </motion.div>
        </motion.div>
      </div>
    </h1>
  )
}

const WHATSAPP_NUMBER = tenantConfig.whatsappNumber
const services = tenantConfig.services
const reasons = tenantConfig.reasons

function buildWhatsAppLink(serviceName?: string, date?: string, time?: string) {
  const msg = serviceName
    ? `Olá! Gostaria de agendar um(a) ${serviceName}${date ? ` no dia ${date}` : ''}${time ? ` às ${time}` : ''}. Esse horário está disponível?`
    : `Olá! Gostaria de agendar um horário. Quais horários estão disponíveis?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'client' | 'pro'>('client')

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const headerButtonsOpacity = useTransform(scrollYProgress, [0.25, 0.35], [0, 1])
  const heroButtonsOpacity = useTransform(scrollYProgress, [0.15, 0.25], [1, 0])

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Header com a nova marca corrigida */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center px-6 justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <AppBrand size="md" />
        </Link>
        
        <div className="flex items-center gap-2">
          <motion.div 
            style={{ opacity: headerButtonsOpacity }}
            className="flex items-center gap-2"
          >
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent gap-2 hidden sm:flex">
                <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                WhatsApp
              </Button>
            </a>
            <Link href="/book">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                Agendar <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </motion.div>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
          <Link href="/login" title="Entrar no sistema">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Entrar</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-28 pb-16 min-h-[90vh] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          <HeroTitle />
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            {tenantConfig.description}
          </p>

          <motion.div 
            style={{ opacity: heroButtonsOpacity }}
            className="flex items-center justify-center gap-3 flex-wrap mb-12"
          >
            <Link href="/book">
              <Button size="lg" className="bg-primary text-primary-foreground h-12 px-7 rounded-xl font-semibold gap-2 hover:bg-primary/90 transition-all">
                Agendar Horário
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
              
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-12 px-7 rounded-xl border-border font-semibold gap-2 hover:bg-accent transition-all">
                <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                WhatsApp
              </Button>
            </a>
          </motion.div>

          {/* Interface / Preview do Sistema */}
          <div className="w-full max-w-2xl border border-border/80 rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/30">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-border inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-border inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-border inline-block" />
              </div>

              <div className="flex bg-muted p-0.5 rounded-lg text-xs font-medium">
                <button 
                  onClick={() => setActiveTab('client')}
                  className={cn("px-3 py-1 rounded-md transition-all", activeTab === 'client' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  Cliente
                </button>
                <button 
                  onClick={() => setActiveTab('pro')}
                  className={cn("px-3 py-1 rounded-md transition-all", activeTab === 'pro' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
                >
                  Barbeiro
                </button>
              </div>
            </div>

            <div className="p-6 text-left">
              {activeTab === 'client' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider">Agendamento Online</p>
                      <h4 className="text-base font-bold text-foreground">Corte + Barba</h4>
                    </div>
                    <span className="text-base font-bold text-primary">R$ 60,00</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['09:00', '10:30', '14:00', '15:30', '17:00', '18:30'].map((time, idx) => (
                      <div 
                        key={time} 
                        className={cn(
                          "py-2 rounded-lg border text-center text-xs font-medium transition-colors",
                          idx === 2 ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border/60 text-muted-foreground"
                        )}
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-primary text-primary-foreground h-10 rounded-lg text-sm font-semibold gap-2">
                    <Sparkles className="w-4 h-4" /> Confirmar Horário
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border border-border/60 rounded-xl bg-muted/20">
                      <p className="text-xs text-muted-foreground">Atendimentos</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">14 hoje</p>
                    </div>
                    <div className="p-3 border border-border/60 rounded-xl bg-muted/20">
                      <p className="text-xs text-muted-foreground">Faturamento</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">R$ 840,00</p>
                    </div>
                    <div className="p-3 border border-border/60 rounded-xl bg-muted/20">
                      <p className="text-xs text-muted-foreground">Presença</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">100%</p>
                    </div>
                  </div>

                  <div className="p-3 border border-border/60 rounded-xl flex items-center justify-between bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        JD
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">João Data</p>
                        <p className="text-[11px] text-muted-foreground">Corte — 14:00</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Confirmado
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-16 px-6 max-w-5xl mx-auto border-t border-border/40">
        <div className="text-center mb-10">
          <p className="text-xs text-primary tracking-widest uppercase font-semibold mb-1">O Que Oferecemos</p>
          <h2 className="text-3xl font-bold font-serif">Nossos Serviços</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <div 
              key={svc.name}
              className="bg-card border border-border/60 rounded-xl overflow-hidden flex flex-col hover:border-border transition-colors group"
            >
              <div className="relative h-44 w-full overflow-hidden bg-muted">
                <img 
                  src={svc.image} 
                  alt={svc.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 bg-background/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-border text-xs font-bold text-primary">
                  R${svc.price}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow gap-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-base font-bold text-foreground">{svc.name}</p>
                  <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground font-semibold">
                    <Clock className="w-3 h-3" />
                    {svc.duration}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {svc.desc}
                </p>

                <a
                  href={buildWhatsAppLink(svc.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto pt-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-border/80 hover:bg-accent text-xs font-semibold rounded-lg"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500" />
                    Agendar
                  </Button>
                </a>
              </div>
            </div>
          ))}

          {/* Card Personalizado */}
          <div className="bg-muted/20 border border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">Pacote Personalizado?</p>
              <p className="text-xs text-muted-foreground">Fale conosco sobre combinações sob medida</p>
            </div>
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="w-full max-w-[180px]">
              <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs rounded-lg">
                <WhatsAppIcon className="w-3.5 h-3.5" />
                Fale Conosco
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-16 px-6 bg-muted/20 border-y border-border/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs text-primary tracking-widest uppercase font-semibold mb-1">Sobre Nós</p>
            <h2 className="text-3xl font-bold font-serif mb-3">
              Feito com Precisão
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5">
              Acreditamos que cada cliente merece uma experiência incrível. 
              Nossa barbearia é construída sobre habilidade, estilo e atenção aos detalhes.
            </p>
            <div className="flex flex-col gap-2.5">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-start gap-2.5">
                  <Scissors className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs sm:text-sm text-foreground">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/60 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Horário de Funcionamento</h3>
            </div>
            {tenantConfig.businessHours.map((row) => (
              <div key={row.day} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
                <span className="text-muted-foreground">{row.day}</span>
                <span className="font-semibold text-foreground">{row.time}</span>
              </div>
            ))}
            <div className="pt-2">
              <Link href="/book">
                <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-xs rounded-lg">
                  Agendar Horário <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-serif">Encontre-nos</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: MapPin, label: 'Endereço', value: tenantConfig.address, link: tenantConfig.googleMapsLink },
            { icon: Phone, label: 'Telefone', value: tenantConfig.phoneDisplay, link: buildWhatsAppLink() },
            { icon: Instagram, label: 'Instagram', value: tenantConfig.instagram, link: tenantConfig.instagramLink },
          ].map(({ icon: Icon, label, value, link }) => (
            <a href={link} target="_blank" rel="noopener noreferrer" key={label} className="bg-card border border-border/60 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-border transition-colors">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
              </div>
            </a>
          ))}
        </div>
        
        {tenantConfig.googleMapsEmbedUrl && (
          <div className="w-full h-[320px] rounded-xl overflow-hidden border border-border/60">
            <iframe 
              src={tenantConfig.googleMapsEmbedUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-6 bg-card">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <AppBrand size="sm" />
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} {tenantConfig.name}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}