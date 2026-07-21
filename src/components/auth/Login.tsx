import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { AuthLayout } from "../ui/AuthLayout";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/FormField";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "../../lib/auth-context";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); const ne: typeof errors = {};
    if (!email) ne.email = "E-mail é obrigatório"; if (!password) ne.password = "Senha é obrigatória";
    if (Object.keys(ne).length > 0) { setErrors(ne); return; }
    setLoading(true); const { error } = await signIn(email, password); setLoading(false);
    if (error) setErrors({ form: error });
  };
  return <><ThemeToggle /><AuthLayout title="Entrar" subtitle="Acesse sua conta para continuar os estudos"><form onSubmit={handleSubmit} className="space-y-4">{errors.form && <div className="rounded-xl bg-error-50 dark:bg-error-900/30 px-4 py-3 text-sm text-error-700 dark:text-error-300 animate-fadeIn">{errors.form}</div>}<div><Input label="E-mail" type="email" placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" /><ErrorMessage message={errors.email} /></div><div><PasswordInput label="Senha" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="current-password" /><ErrorMessage message={errors.password} /></div><Button type="submit" loading={loading} className="w-full btn-primary">Entrar</Button></form><div className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">Não tem uma conta? <Link to="/cadastro" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold transition-colors">Cadastre-se</Link></div></AuthLayout></>;
}
