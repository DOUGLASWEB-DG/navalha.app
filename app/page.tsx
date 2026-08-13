"use client"

import Link from 'next/link'
import { Scissors, Clock, Star, MapPin, Phone, Instagram, MessageCircle, ArrowRight, CheckCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { animate, useInView, useMotionValue, motion } from "framer-motion"
import { tenantConfig } from '@/config/tenant'

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  
  // Extrai apenas os números (ex: "500+" vira 500)
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""))
  
  const motionValue = useMotionValue(0)

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, numericValue, {
        duration: 3.5, // Bem mais lento
        ease: "easeOut"
      })
      return controls.stop
    }
  }, [isInView, motionValue, numericValue])

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) {
        const isDecimal = value.includes(".")
        const formatted = isDecimal 
          ? latest.toFixed(1) 
          : Math.floor(latest).toLocaleString()
        
        // Adiciona o sufixo original (como o "+") de volta
        ref.current.textContent = formatted + (value.includes("+") ? "+" : "")
      }
    })
  }, [motionValue, value])

  return <span ref={ref}>0</span>
}

function HeroTitle() {
  return (
    <h1 className="text-5xl md:text-7xl font-bold font-serif text-balance leading-tight mb-6 flex flex-col items-center">
      {/* Primeira linha cortada devagar */}
      <div className="relative inline-block">
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
        >
          A Arte do
        </motion.div>
        <motion.div
          initial={{ left: "-10%", opacity: 0 }}
          animate={{ 
            left: "105%", 
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-muted-foreground z-10"
        >
          <motion.div
            animate={{ rotate: [0, -30, 0, -30, 0, -30, 0] }}
            transition={{ duration: 1.2, ease: "linear", delay: 0.2 }}
          >
            <Scissors className="w-10 h-10 md:w-14 md:h-14" />
          </motion.div>
        </motion.div>
      </div>

      {/* Segunda linha cortada muito rápido (sapidão) */}
      <div className="relative inline-block mt-1 md:mt-2">
        <motion.div
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 1.6 }}
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
          transition={{ duration: 0.5, ease: "easeOut", delay: 1.6 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-primary z-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
        >
          <motion.div
            animate={{ rotate: [0, -40, 0, -40, 0] }}
            transition={{ duration: 0.5, ease: "linear", delay: 1.6 }}
          >
            <Scissors className="w-12 h-12 md:w-16 md:h-16" />
          </motion.div>
        </motion.div>
      </div>
    </h1>
  )
}

const WHATSAPP_NUMBER = tenantConfig.whatsappNumber

const services = [
  {
     name: 'Corte Clássico',
     price: 35,
     duration: '30 min',
     desc: 'Corte na tesoura ou máquina sob medida para seu estilo',
     image: 'https://images.pexels.com/photos/32329615/pexels-photo-32329615.jpeg' 
  }, 
  {
     name: 'Barba',
     price: 20, 
     duration: '20 min', 
     desc: 'Alinhamento e modelagem de barba com acabamento impecável',
     image: 'https://images.pexels.com/photos/18298041/pexels-photo-18298041.jpeg' 
  },
  { 
    name: 'Corte + Barba', 
    price: 50, 
    duration: '50 min',
    desc: 'Pacote completo — nosso serviço mais procurado',
    image: 'https://images.pexels.com/photos/1813346/pexels-photo-1813346.jpeg' 
  },
  {
     name: 'Barboterapia', 
     price: 40, 
     duration: '40 min', 
     desc: 'Barba com toalha quente e navalha tradicional',
     image: 'https://images.pexels.com/photos/12304504/pexels-photo-12304504.jpeg ' 
  },
  { 
    name: 'Corte Infantil', 
    price: 25, 
    duration: '25 min', 
    desc: 'Cortes para crianças até 12 anos',
    image: 'https://images.pexels.com/photos/19664866/pexels-photo-19664866.jpeg' 
  },
]

const reasons = tenantConfig.reasons

function buildWhatsAppLink(serviceName?: string, date?: string, time?: string) {
  const msg = serviceName
    ? `Olá! Gostaria de agendar um(a) ${serviceName}${date ? ` no dia ${date}` : ''}${time ? ` às ${time}` : ''}. Esse horário está disponível?`
    : `Olá! Gostaria de agendar um horário. Quais horários estão disponíveis?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
              <img 
                src={tenantConfig.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain p-0" 
              />
          </div>
          <span className="text-base font-bold font-serif text-foreground">{tenantConfig.name.toUpperCase()}</span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            scrolled ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          )}>
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-success/40 text-success hover:bg-success/10 gap-2 hidden sm:flex">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </a>
            <Link href="/book">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                Agendar <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <div className="h-6 w-px bg-border/50 mx-1 hidden sm:block"></div>
          <Link href="/login" title="Entrar no sistema">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Entrar</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, hsl(138, 20%, 34%) 0, hsl(145, 87%, 21%) 1px, transparent 0, transparent 50%)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        

        <div className="relative text-center px-6 max-w-4xl mx-auto">
          
          <HeroTitle />
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            {tenantConfig.description}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/book">
              <Button size="lg" className="bg-primary text-primary-foreground h-14 px-8 text-base gap-2 rounded-full font-bold shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 group">
                Agendar Horário
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
             
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base bg-zinc-900 border-2 border-success/30 text-success gap-2 rounded-full font-bold shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:border-success/80 hover:bg-success/10 hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:scale-105 active:scale-95 transition-all duration-300">
                <MessageCircle className="w-5 h-5" />
                Agendar via WhatsApp
              </Button>
            </a>
          </div>

         {/* Stats */}
<div className="flex items-center justify-center gap-8 mt-14 flex-wrap">
  {[
    { value: '500+', label: 'Clientes Satisfeitos' },
    { value: '6+', label: 'Anos de Experiência' },
    { value: '4.9', label: 'Avaliação' },
  ].map((stat, index) => (
    <motion.div 
      key={stat.label} 
      className="text-center min-w-[120px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
    >
      <p className="text-3xl font-bold font-serif text-primary">
        <Counter value={stat.value} />
      </p>
      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter">
        {stat.label}
      </p>
    </motion.div>
  ))}
</div>  
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs text-primary tracking-widest uppercase font-semibold mb-2">O Que Oferecemos</p>
          <h2 className="text-4xl font-bold font-serif text-balance">Nossos Serviços</h2>
        </div>

       {/* Serviços com Fotos */}
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {services.map((svc) => (
    <div
      key={svc.name}
      className="bg-card border border-border/40 rounded-2xl overflow-hidden flex flex-col hover:border-primary/40 transition-all duration-300 group shadow-soft hover:shadow-premium"
    >
      {/* Container da Imagem */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={svc.image} 
          alt={svc.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Overlay de Gradiente para dar leitura ao preço sobre a foto se quiser, 
            ou mantemos o preço no corpo do card para ficar mais limpo: */}
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50">
           <p className="text-sm font-bold text-primary">R${svc.price}</p>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-5 flex flex-col flex-grow gap-3">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-foreground">{svc.name}</p>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            <Clock className="w-3 h-3" />
            {svc.duration}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {svc.desc}
        </p>

        <a
          href={buildWhatsAppLink(svc.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-2"
        >
          <Button
            variant="outline"
            className="w-full gap-2 border-border group-hover:border-primary group-hover:text-primary transition-colors bg-secondary/30"
          >
            <MessageCircle className="w-4 h-4" />
            Agendar
          </Button>
        </a>
      </div>
    </div>
  ))}

  {/* CTA Card adaptado para manter a altura */}
  <div className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center sm:col-span-2 lg:col-span-1 min-h-[350px] shadow-soft hover:shadow-premium transition-all duration-300">
    <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
      <Star className="w-7 h-7 text-primary fill-primary/20" />
    </div>
    <div className="space-y-2">
      <p className="text-lg font-bold text-foreground">Pacote Personalizado?</p>
      <p className="text-sm text-muted-foreground px-4">Fale conosco sobre uma combinação de serviços sob medida</p>
    </div>
    <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="w-full max-w-[200px]">
      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
        <MessageCircle className="w-4 h-4" />
        Fale Conosco
      </Button>
    </a>
  </div>
</div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-20 px-6 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs text-primary tracking-widest uppercase font-semibold mb-2">Sobre Nós</p>
            <h2 className="text-4xl font-bold font-serif text-balance mb-4">
              Feito com Precisão
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Acreditamos que cada cliente merece uma experiência incrível — não apenas um corte de cabelo. 
              Nossa barbearia é construída sobre habilidade, estilo e atenção aos detalhes. 
              Seja um corte clássico ou um estilo moderno, nós temos o que você precisa.
            </p>
            <div className="flex flex-col gap-3">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-start gap-3">
                  <Scissors className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Horários */}
          <div className="bg-background border border-border/50 rounded-xl p-6 flex flex-col gap-4 shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Horário de Funcionamento</h3>
            </div>
            {tenantConfig.businessHours.map((row) => (
              <div key={row.day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{row.day}</span>
                <span className="text-sm font-semibold text-foreground">{row.time}</span>
              </div>
            ))}
            <div className="pt-2">
              <Link href="/book">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  Agendar Horário <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold font-serif text-balance">Encontre-nos</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: MapPin, label: 'Endereço', value: tenantConfig.address },
            { icon: Phone, label: 'Telefone', value: tenantConfig.phoneDisplay },
            { icon: Instagram, label: 'Instagram', value: tenantConfig.instagram },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border border-border/50 rounded-xl p-5 flex flex-col items-center text-center gap-3 shadow-soft hover:shadow-premium transition-all duration-300">
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6 border-t border-border bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-serif text-balance mb-3">Pronto para um Corte Novo?</h2>
          <p className="text-muted-foreground mb-6">Agende online em segundos ou mande uma mensagem no WhatsApp</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/book">
              <Button size="lg" className="bg-primary text-primary-foreground h-14 px-8 text-base gap-2 rounded-full font-bold shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-300 group">
                Agendar Online <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base bg-zinc-900 border-2 border-success/30 text-success gap-2 rounded-full font-bold shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:border-success/80 hover:bg-success/10 hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:scale-105 active:scale-95 transition-all duration-300">
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-card">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center overflow-hidden shadow-lg">
              <img 
                src={tenantConfig.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain p-0" 
              />
            </div>
            <span className="text-sm font-bold font-serif text-foreground uppercase tracking-tight">{tenantConfig.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {tenantConfig.name}. Powered by <span className="font-bold">Navalha.app</span>.
          </p>
        </div>
      </footer>
    </div>
  )
}
