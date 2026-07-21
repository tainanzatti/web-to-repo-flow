import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, User, Phone, Calendar, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/FormField";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import {
  isValidEmail,
  isValidCPF,
  isValidPassword,
  getPasswordStrength,
  maskPhone,
  maskCPF,
  isValidBirthDate,
  sanitize,
  type PasswordStrength,
} from "../../lib/validations";

interface FormErrors {
  nome?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  cpf?: string;
  senha?: string;
  confirmarSenha?: string;
  form?: string;
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; bar: string }> = {
  fraca: { label: "Fraca", color: "text-error-600", bar: "bg-error-500 w-1/3" },
  media: { label: "Média", color: "text-warning-600", bar: "bg-warning-500 w-2/3" },
  forte: { label: "Forte", color: "text-success-600", bar: "bg-success-500 w-full" },
};

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = senha ? getPasswordStrength(senha) : null;

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!nome.trim()) e.nome = "Nome é obrigatório";
    else if (nome.trim().length < 3) e.nome = "Nome deve ter no mínimo 3 caracteres";

    if (!email) e.email = "E-mail é obrigatório";
    else if (!isValidEmail(email)) e.email = "E-mail inválido";

    if (!telefone) e.telefone = "Telefone é obrigatório";
    else if (telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone incompleto";

    const birthCheck = isValidBirthDate(dataNascimento);
    if (!birthCheck.valid) e.dataNascimento = birthCheck.error;

    if (!cpf) e.cpf = "CPF é obrigatório";
    else if (!isValidCPF(cpf)) e.cpf = "CPF inválido";

    if (!senha) e.senha = "Senha é obrigatória";
    else if (!isValidPassword(senha))
      e.senha = "Senha deve ter no mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial";

    if (!confirmarSenha) e.confirmarSenha = "Confirme sua senha";
    else if (confirmarSenha !== senha) e.confirmarSenha = "As senhas não coincidem";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const cleanEmail = sanitize(email);
    const { error } = await signUp(cleanEmail, senha);

    if (error) {
      setErrors({ form: error });
      setLoading(false);
      return;
    }

    // Insert profile data
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        nome: sanitize(nome),
        email: cleanEmail,
        telefone: telefone,
        data_nascimento: dataNascimento || null,
        cpf: cpf,
      });

      if (profileError) {
        console.error("Erro ao salvar perfil:", profileError.message);
      }
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate("/painel"), 1200);
  };

  return (
    <AuthLayout title="Cadastro" subtitle="Crie sua conta e comece a estudar para o concurso Soldado PMSC 2026">
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" /> Cadastro realizado com sucesso!
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
            label="Nome completo"
            type="text"
            placeholder="João da Silva"
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
          <Input
            label="Telefone"
            type="tel"
            placeholder="(99) 99999-9999"
            icon={<Phone className="w-4 h-4" />}
            value={telefone}
            onChange={(e) => setTelefone(maskPhone(e.target.value))}
            error={errors.telefone}
            autoComplete="tel"
          />
          <ErrorMessage message={errors.telefone} />
        </div>

        <div>
          <Input
            label="Data de nascimento"
            type="date"
            icon={<Calendar className="w-4 h-4" />}
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            error={errors.dataNascimento}
            max={new Date().toISOString().slice(0, 10)}
          />
          <ErrorMessage message={errors.dataNascimento} />
        </div>

        <div>
          <Input
            label="CPF"
            type="text"
            placeholder="999.999.999-99"
            icon={<CreditCard className="w-4 h-4" />}
            value={cpf}
            onChange={(e) => setCpf(maskCPF(e.target.value))}
            error={errors.cpf}
            inputMode="numeric"
          />
          <ErrorMessage message={errors.cpf} />
        </div>

        <div>
          <PasswordInput
            label="Senha"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            error={errors.senha}
            autoComplete="new-password"
          />
          <ErrorMessage message={errors.senha} />
          {strength && (
            <div className="mt-2">
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${STRENGTH_CONFIG[strength].bar}`} />
              </div>
              <p className={`text-xs mt-1 font-medium ${STRENGTH_CONFIG[strength].color}`}>
                Força da senha: {STRENGTH_CONFIG[strength].label}
              </p>
            </div>
          )}
        </div>

        <div>
          <PasswordInput
            label="Confirmar senha"
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            error={errors.confirmarSenha}
            autoComplete="new-password"
          />
          <ErrorMessage message={errors.confirmarSenha} />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Cadastrar
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-500">
        Já tem uma conta?{" "}
        <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold transition-colors">
          Faça login
        </Link>
      </div>
    </AuthLayout>
  );
}
