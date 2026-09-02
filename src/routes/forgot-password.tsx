import { useState } from 'react';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell, FieldError } from '@/components/auth-shell';
import { toast } from 'sonner';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useHydrated } from '@/hooks/use-hydrated';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword(data.email);
      setSuccess(true);
      toast.success('Email de recuperação enviado!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar email';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell title="Email enviado" subtitle="Confira sua caixa de entrada.">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="text-[13px] text-muted-foreground">
            Enviamos as instruções de recuperação de senha para o seu email. O link expira em
            pouco tempo — use assim que receber.
          </p>
          <Button onClick={() => navigate({ to: '/login' })} className="w-full">
            Voltar ao login
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Digite seu email para receber as instruções."
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

        <Button type="submit" className="w-full" disabled={isLoading || !hydrated}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
        </Button>
      </form>
    </AuthShell>
  );
}

export const Route = createFileRoute('/forgot-password')({
  head: () => ({
    meta: [
      { title: 'Recuperar senha — Operação PMSC' },
      { name: 'description', content: 'Recupere o acesso à sua conta da Operação PMSC e volte aos estudos para a PMSC 2026.' },
      { property: 'og:title', content: 'Recuperar senha — Operação PMSC' },
      { property: 'og:description', content: 'Recupere o acesso à sua conta da Operação PMSC e volte aos estudos para a PMSC 2026.' },
    ],
  }),
  component: ForgotPasswordPage,
})
