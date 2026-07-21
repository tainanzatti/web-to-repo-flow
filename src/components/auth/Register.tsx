import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import { Loader2, Shield } from "lucide-react";

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) setError(error);
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 p-4">
      <div className="card p-8 max-w-md w-full animate-slideUp">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white"><Shield className="w-6 h-6" /></div>
          <div><h1 className="text-xl font-bold text-ink-900 dark:text-ink-100">Concurso PMSC</h1><p className="text-sm text-ink-500 dark:text-ink-400">Criar nova conta</p></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">E-mail</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-base" placeholder="seu@email.com" /></div>
          <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Senha</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" placeholder="Mínimo 6 caracteres" /></div>
          <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Confirmar senha</label><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-base" placeholder="••••••••" /></div>
          {error && <p className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-3 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />}Cadastrar</button>
        </form>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-4 text-center">Já tem conta? <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
