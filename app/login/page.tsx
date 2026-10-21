'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Scissors, Lock, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { tenantConfig } from '@/config/tenant'
import { safeRedirect } from '@/lib/safe-redirect'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Falha no login', {
          description: data.error || 'Verifique seu e-mail e senha.',
        })
        return
      }

      toast.success('Login Realizado!', {
        description: `Bem-vindo de volta, ${data.user.name}!`,
      })
      router.push(redirect)
      router.refresh()
    } catch {
      toast.error('Erro de Conexão', {
        description: 'Não foi possível conectar com o servidor.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="flex justify-center">
            <img
              src={tenantConfig.logoWordmarkUrl}
              alt={tenantConfig.name}
              className="h-14 w-auto max-w-full object-contain"
            />
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Painel Administrativo</p>
        </div>

        {/* Card de Login */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acesse o painel administrativo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-foreground font-medium">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                autoComplete="email"
                autoFocus
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-foreground font-medium">Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão */}
            <Button
              type="submit"
              isLoading={isLoading}
              className="h-11 font-medium mt-2 w-full gap-2"
            >
              {!isLoading && <LogIn className="w-4 h-4" />}
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

         </div>

        {/* Link para voltar */}
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
