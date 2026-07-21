import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Phone, Calendar, CreditCard } from "lucide-react";
import { AuthLayout } from "../ui/AuthLayout";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/FormField";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "../../lib/auth-context";
import { maskCPF, maskPhone, validateCPF, validateEmail, validatePhone, validatePassword, validateBirthDate, passwordStrength } from "../../lib/validations";
import { supabase } from "../../lib/supabase";

export function Register() {
  const { signUp } = useAuth(); const navigate = useNavigate();
  const [nome, setNome] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState(""); const [phone, setPhone] = useState(""); const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({});
  const strength = passwordStrength(password);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); const ne: Record<string, string> = {};
    if (!nome.trim()) ne.nome = "Nome é obrigatório"; if (!validateEmail(email)) ne.email = "E-mail inválido";
    const pw = validatePassword(password); if (!pw.valid) ne.password = pw.message!;
    if (!validateCPF(cpf)) ne.cpf = "CPF inválido"; if (!validatePhone(phone)) ne.phone = "Telefone inválido";
    if (!birthDate) ne.birthDate = "Data obrigatória"; else if (!validateBirthDate(birthDate)) ne.birthDate = "Mínimo 16 anos";
    if (Object.keys(ne).length > 0) { setErrors(ne); return; }
    setLoading(true); const { error } = await signUp(email, password);
    if (error) { setErrors({ form: error }); setLoading(false); return; }
    const { data: sd } = await supabase.auth.getSession(); const uid = sd.session?.user?.id;
    if (uid) await supabase.from("profiles").insert({ id: uid, nome, email, cpf: cpf.replace(/\D/g, ""), telefone: phone.replace(/\D/g, ""), data_nascimento: birthDate });
    setLoading(false); navigate("/painel");
  };
  return <><ThemeToggle /><AuthLayout title="Criar conta" subtitle="Cadastre-se para começar a estudar para o Soldado PMSC 2026"><form onSubmit={handleSubmit} className="space-y-4">{errors.form && <div className="rounded-xl bg-error-50 dark:bg-error-900/30 px-4 py-3 text-sm text-error-700 dark:text-error-300 animate-fadeIn">{errors.form}</div>}<div><Input label="Nome completo" placeholder="Seu nome" icon={<User className="w-4 h-4" />} value={nome} onChange={(e) => setNome(e.target.value)} error={errors.nome} autoComplete="name" /><ErrorMessage message={errors.nome} /></div><div><Input label="E-mail" type="email" placeholder="seu@email.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" /><ErrorMessage message={errors.email} /></div><div><PasswordInput label="Senha" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" /><ErrorMessage message={errors.password} />{password && <div className="mt-2"><div className="flex gap-1">{Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-ink-100 dark:bg-ink-800"}`} />)}</div><p className="text-xs text-ink-400 mt-1">{strength.label}</p></div>}</div><div className="grid grid-cols-2 gap-3"><div><Input label="CPF" placeholder="000.000.000-00" icon={<CreditCard className="w-4 h-4" />} value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} error={errors.cpf} maxLength={14} /><ErrorMessage message={errors.cpf} /></div><div><Input label="Telefone" placeholder="(48) 99999-9999" icon={<Phone className="w-4 h-4" />} value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} error={errors.phone} maxLength={15} /><ErrorMessage message={errors.phone} /></div></div><div><Input label="Data de nascimento" type="date" icon={<Calendar className="w-4 h-4" />} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} error={errors.birthDate} /><ErrorMessage message={errors.birthDate} /></div><Button type="submit" loading={loading} className="w-full btn-primary">Criar conta</Button></form><div className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">Já tem uma conta? <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold transition-colors">Entrar</Link></div></AuthLayout></>;
}
