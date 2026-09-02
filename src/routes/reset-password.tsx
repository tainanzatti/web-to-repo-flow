import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthShell, FieldError } from '@/components/auth-shell'
import { toast } from 'sonner'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useHydrated } from '@/hooks/use-hydrated';

const schema = z
  .object({
    password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não correspondem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      await updatePassword(data.password, '')
      toast.success('Senha atualizada com sucesso!')
      navigate({ to: '/login' })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível atualizar a senha. Abra novamente o link do email.'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      title="Definir nova senha"
      subtitle="Escolha uma nova senha para sua conta."
      footer={
        <button
          type="button"
          onClick={() => navigate({ to: '/login' })}
          className="text-muted-foreground transition hover:text-primary"
        >
          Voltar ao login
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
            disabled={isLoading}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !hydrated}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>
    </AuthShell>
  )
}

export const Route = createFileRoute('/reset-password')({
  head: () => ({
    meta: [
      { title: 'Definir nova senha — Operação PMSC' },
      {
        name: 'description',
        content: 'Defina uma nova senha para sua conta da Operação PMSC e retome os estudos.',
      },
      { property: 'og:title', content: 'Definir nova senha — Operação PMSC' },
      {
        property: 'og:description',
        content: 'Defina uma nova senha para sua conta da Operação PMSC e retome os estudos.',
      },
    ],
  }),
  component: ResetPasswordPage,
})
