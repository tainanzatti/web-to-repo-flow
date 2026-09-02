import { useState } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell, FieldError } from '@/components/auth-shell';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useHydrated } from '@/hooks/use-hydrated';

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate({ to: '/' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para continuar seu ciclo de estudos."
      footer={
        <span className="text-muted-foreground">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={() => navigate({ to: '/signup' })}
            className="font-medium text-primary transition hover:brightness-125"
          >
            Cadastre-se
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
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
            disabled={isLoading}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !hydrated}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate({ to: '/forgot-password' })}
            className="text-[12px] text-muted-foreground transition hover:text-primary"
          >
            Esqueci minha senha
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [
      { title: 'Entrar — Operação PMSC' },
      { name: 'description', content: 'Acesse sua conta da Operação PMSC e continue seu ciclo de estudos para Soldado PMSC 2026.' },
      { property: 'og:title', content: 'Entrar — Operação PMSC' },
      { property: 'og:description', content: 'Acesse sua conta da Operação PMSC e continue seu ciclo de estudos para Soldado PMSC 2026.' },
    ],
  }),
  component: LoginPage,
})
