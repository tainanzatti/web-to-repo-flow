import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { AuthLayout } from "../ui/AuthLayout";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/FormField";
import { useAuth } from "../../lib/auth-context";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "E-mail é obrigatório";
    if (!password) newErrors.password = "Senha é obrigatória";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setErrors({ form: error });
    }
  };

  return (
    <AuthLayout title="Entrar" subtitle="Acesse sua conta para continuar os estudos">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 animate-fadeIn">
            {errors.form}
          </div>
        )}
        <div>
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <ErrorMessage message={errors.email} />
        </div>
        <div>
          <PasswordInput
            label="Senha"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
          <ErrorMessage message={errors.password} />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-ink-300 accent-brand-600"
            />
            Lembrar de mim
          </label>
          <button type="button" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Esqueci minha senha
          </button>
        </div>
        <Button type="submit" loading={loading} className="w-full btn-primary">
          Entrar
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-ink-500">
        Não tem uma conta?{" "}
        <Link to="/cadastro" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
          Cadastre-se
        </Link>
      </div>
    </AuthLayout>
  );
}
