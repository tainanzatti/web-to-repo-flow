import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/FormField";
import { useAuth } from "../../lib/auth-context";
import { isValidEmail } from "../../lib/validations";

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "E-mail é obrigatório";
    else if (!isValidEmail(email)) e.email = "E-mail inválido";
    if (!password) e.password = "Senha é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const { error } = await signIn(email, password);
    if (error) {
      setErrors({ form: error });
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/painel"), 500);
    }
  };

  return (
    <AuthLayout title="Operação PMSC" subtitle="Acesse sua plataforma de estudos para o concurso Soldado PMSC 2026">
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" /> Login realizado com sucesso!
        </div>
      )}

      {errors.form && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <Button type="submit" loading={loading} className="w-full">
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
