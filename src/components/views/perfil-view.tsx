import { useEffect, useState, useCallback } from "react";
import { Loader2, User, Mail, Phone, Calendar, CreditCard, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { fetchProfile, type ProfileRow } from "../../lib/db";
import { maskCPF, maskPhone } from "../../lib/validations";

export function PerfilView() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Perfil</h1>
        <p className="text-sm text-ink-500 mt-1">Seus dados de cadastro para o concurso Soldado PMSC 2026.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">{profile?.nome ?? "—"}</h2>
            <p className="text-sm text-ink-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <ProfileField icon={<Mail className="w-4 h-4" />} label="E-mail" value={profile?.email ?? user?.email ?? "—"} />
          <ProfileField icon={<Phone className="w-4 h-4" />} label="Telefone" value={profile?.telefone ? maskPhone(profile.telefone) : "—"} />
          <ProfileField icon={<Calendar className="w-4 h-4" />} label="Data de nascimento" value={profile?.data_nascimento ? new Date(profile.data_nascimento).toLocaleDateString("pt-BR") : "—"} />
          <ProfileField icon={<CreditCard className="w-4 h-4" />} label="CPF" value={profile?.cpf ? maskCPF(profile.cpf) : "—"} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 mb-2">Concurso</h3>
        <div className="space-y-1 text-sm text-ink-600">
          <p><span className="font-medium text-ink-700">Cargo:</span> Soldado PMSC</p>
          <p><span className="font-medium text-ink-700">Banca:</span> Instituto AOCP</p>
          <p><span className="font-medium text-ink-700">Edital:</span> 2026</p>
        </div>
      </div>

      <button onClick={signOut} className="btn-danger">
        <LogOut className="w-4 h-4" /> Sair da conta
      </button>
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-ink-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-ink-100 flex items-center justify-center text-ink-500 shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm text-ink-800">{value}</p>
      </div>
    </div>
  );
}
