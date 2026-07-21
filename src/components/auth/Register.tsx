import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Phone, Calendar, CreditCard } from "lucide-react";
import { AuthLayout } from "../ui/AuthLayout";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/FormField";
import { useAuth } from "../../lib/auth-context";
import {
  maskCPF, maskPhone, validateCPF, validateEmail, validatePhone,
  validatePassword, validateBirthDate, passwordStrength,
} from "../../lib/validations";
import { supabase } from "../../lib/supabase";

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = passwordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!validateEmail(email)) newErrors.email = "E-mail inválido";
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) newErrors.password = pwCheck.message!;
    if (!validateCPF(cpf)) newErrors.cpf = "CPF inválido";
    if (!validatePhone(phone)) newErrors.phone = "Telefone inválido";
    if (!birthDate) newErrors.birthDate = "Data de nascimento é obrigatória";
    else if (!validateBirthDate(birthDate)) newErrors.birthDate = "Você deve ter pelo menos 16 anos";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setErrors({ form: error });
      setLoading(false);
      return;
    }
    // Create profile
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (userId) {
      await supabase.from("profiles").insert({
        id: userId,
        nome,
        email,
        cpf: cpf.replace(/\D/g, ""),
        telefone: phone.replace(/\D/g, ""),
        data_nascimento: birthDate,
      });
    }
    setLoading(false);
    navigate("/painel");
  };

  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se para começar a estudar para o Soldado PMSC 2026">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700 animate-fadeIn">
            {errors.form}
          </div>
        )}
        <div>
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            icon={<User className="w-4 h-4" />}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            error={errors.nome}
            autoComplete="name"
          />
          <ErrorMessage message={errors.nome} />
        </div>
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
            autoComplete="new-password"
          />
          <ErrorMessage message={errors.password} />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${i < strength.score ? strength.color : "bg-ink-100"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-ink-400 mt-1">{strength.label}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              icon={<CreditCard className="w-4 h-4" />}
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              error={errors.cpf}
              maxLength={14}
            />
            <ErrorMessage message={errors.cpf} />
          </div>
          <div>
            <Input
              label="Telefone"
              placeholder="(48) 99999-9999"
              icon={<Phone className="w-4 h-4" />}
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              error={errors.phone}
              maxLength={15}
            />
            <ErrorMessage message={errors.phone} />
          </div>
        </div>
        <div>
          <Input
            label="Data de nascimento"
            type="date"
            icon={<Calendar className="w-4 h-4" />}
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={errors.birthDate}
          />
          <ErrorMessage message={errors.birthDate} />
        </div>
        <Button type="submit" loading={loading} className="w-full btn-primary">
          Criar conta
        </Button>
      </form>
      <div className="mt-6 text-center text-sm text-ink-500">
        Já tem uma conta?{" "}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
          Entrar
        </Link>
      </div>
    </AuthLayout>
  );
}
