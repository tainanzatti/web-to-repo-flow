import { useState } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupFormData } from '@/lib/validation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell, FieldError } from '@/components/auth-shell';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useHydrated } from '@/hooks/use-hydrated';

function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await signUp(data.email, data.password, data.fullName, data.dateOfBirth, data.cpf);

      toast.success('Cadastro realizado com sucesso!');
      navigate({ to: '/' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Preencha os dados para começar a operação."
      footer={
        <span className="text-muted-foreground">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={() => navigate({ to: '/login' })}
            className="font-medium text-primary transition hover:brightness-125"
          >
            Faça login
          </button>
        </span>
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
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="João da Silva"
            aria-invalid={!!errors.fullName}
            {...register('fullName')}
            disabled={isLoading}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="dateOfBirth">Data de nascimento</Label>
            <Input
              id="dateOfBirth"
              type="date"
              className="w-full"
              aria-invalid={!!errors.dateOfBirth}
              {...register('dateOfBirth')}
              disabled={isLoading}
            />
            <FieldError message={errors.dateOfBirth?.message} />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              aria-invalid={!!errors.cpf}
              {...register('cpf')}
              disabled={isLoading}
            />
            <FieldError message={errors.cpf?.message} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            {...register('email')}
            disabled={isLoading}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
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
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
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
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </form>
    </AuthShell>
  );
}

export const Route = createFileRoute('/signup')({
  head: () => ({
    meta: [
      { title: 'Criar conta — Operação PMSC' },
      { name: 'description', content: 'Crie sua conta gratuita e comece o ciclo de estudos guiado para o concurso Soldado PMSC 2026.' },
      { property: 'og:title', content: 'Criar conta — Operação PMSC' },
      { property: 'og:description', content: 'Crie sua conta gratuita e comece o ciclo de estudos guiado para o concurso Soldado PMSC 2026.' },
    ],
  }),
  component: SignupPage,
})
