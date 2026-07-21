import { useEffect, useState, useCallback } from "react";
import { User, Mail, Calendar, MapPin, Briefcase, Target, Loader2, Pencil, X, Check, Award, Zap, Flame, BookOpen, Clock } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { fetchPerfil, updatePerfil, fetchRanking, type Perfil, type RankingRow } from "../../lib/db";

export function PerfilView() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [rankingData, setRankingData] = useState<RankingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [p, ranking] = await Promise.all([
        fetchPerfil(user.id),
        fetchRanking("all").then((rows) => rows.find((r) => r.user_id === user.id) ?? null).catch(() => null),
      ]);
      setPerfil(p);
      setRankingData(ranking);
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (error) return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Perfil</h1></div><div className="card p-6 text-center text-error-600 dark:text-error-400">{error}</div></div>;

  const displayName = perfil?.apelido || perfil?.nome_completo || user?.email?.split("@")[0] || "Usuário";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Perfil</h1>
        <button onClick={() => setShowEditModal(true)} className="btn-primary flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          Editar Perfil
        </button>
      </div>

      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">{displayName}</h2>
            {rankingData && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">{rankingData.patente}</span>
                <span className="text-xs text-ink-500 dark:text-ink-400">{rankingData.xp_total} XP</span>
              </div>
            )}
            {perfil?.biografia && <p className="text-sm text-ink-500 dark:text-ink-400 mt-2">{perfil.biografia}</p>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {rankingData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={<Zap className="w-5 h-5" />} label="XP Total" value={String(rankingData.xp_total)} color="brand" />
          <StatCard icon={<Award className="w-5 h-5" />} label="Acertos" value={`${rankingData.taxa_acertos.toFixed(0)}%`} color="success" />
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="Questões" value={String(rankingData.questoes_respondidas)} color="warning" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Horas" value={`${rankingData.horas_estudadas.toFixed(1)}h`} color="ink" />
          <StatCard icon={<Flame className="w-5 h-5" />} label="Streak" value={`${rankingData.dias_consecutivos}d`} color="error" />
          <StatCard icon={<Target className="w-5 h-5" />} label="% Edital" value={`${rankingData.percentual_edital.toFixed(0)}%`} color="brand" />
        </div>
      )}

      {/* Personal info */}
      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4">Informações Pessoais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField icon={<User className="w-4 h-4" />} label="Apelido" value={perfil?.apelido ?? "—"} />
          <InfoField icon={<Mail className="w-4 h-4" />} label="E-mail" value={user?.email ?? "—"} readOnly />
          <InfoField icon={<Calendar className="w-4 h-4" />} label="Data de nascimento" value={perfil?.data_nascimento ? new Date(perfil.data_nascimento).toLocaleDateString("pt-BR") : "—"} />
          <InfoField icon={<MapPin className="w-4 h-4" />} label="Cidade" value={perfil?.cidade ?? "—"} />
          <InfoField icon={<MapPin className="w-4 h-4" />} label="Estado" value={perfil?.estado ?? "—"} />
          <InfoField icon={<Briefcase className="w-4 h-4" />} label="Profissão" value={perfil?.profissao ?? "—"} />
          <InfoField icon={<Target className="w-4 h-4" />} label="Objetivo" value={perfil?.objetivo_estudos ?? "—"} />
          <InfoField icon={<Calendar className="w-4 h-4" />} label="Conta criada em" value={perfil?.criado_em ? new Date(perfil.criado_em).toLocaleDateString("pt-BR") : "—"} readOnly />
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <EditProfileModal
          perfil={perfil}
          userId={user!.id}
          onClose={() => setShowEditModal(false)}
          onSaved={() => { load(); setShowEditModal(false); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const cm: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300",
    success: "bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300",
    ink: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300",
    error: "bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-300",
  };
  return (
    <div className="card p-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cm[color] ?? cm.brand}`}>{icon}</div>
      <p className="text-lg font-bold text-ink-900 dark:text-ink-100">{value}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

function InfoField({ icon, label, value, readOnly }: { icon: React.ReactNode; label: string; value: string; readOnly?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 dark:bg-ink-800/50">
      <div className="w-8 h-8 rounded-lg bg-white dark:bg-ink-900 flex items-center justify-center text-ink-400 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-400">{label}{readOnly && " (somente leitura)"}</p>
        <p className="text-sm font-medium text-ink-800 dark:text-ink-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function EditProfileModal({ perfil, userId, onClose, onSaved }: { perfil: Perfil | null; userId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    apelido: perfil?.apelido ?? "",
    data_nascimento: perfil?.data_nascimento?.split("T")[0] ?? "",
    avatar_url: perfil?.avatar_url ?? "",
    cidade: perfil?.cidade ?? "",
    estado: perfil?.estado ?? "",
    biografia: perfil?.biografia ?? "",
    objetivo_estudos: perfil?.objetivo_estudos ?? "",
    profissao: perfil?.profissao ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (form.apelido && form.apelido.length > 50) { setError("Apelido deve ter no máximo 50 caracteres."); return; }
    if (form.biografia && form.biografia.length > 500) { setError("Biografia deve ter no máximo 500 caracteres."); return; }
    if (form.estado && form.estado.length > 2) { setError("Estado deve ter 2 caracteres (UF)."); return; }
    if (form.data_nascimento) {
      const d = new Date(form.data_nascimento);
      const now = new Date();
      if (d > now) { setError("Data de nascimento não pode ser no futuro."); return; }
    }

    setSaving(true);
    try {
      const updates: Record<string, string | null> = {};
      if (form.apelido !== (perfil?.apelido ?? "")) updates.apelido = form.apelido || null;
      if (form.data_nascimento) updates.data_nascimento = form.data_nascimento;
      else if (perfil?.data_nascimento) updates.data_nascimento = null;
      if (form.avatar_url) updates.avatar_url = form.avatar_url;
      else if (perfil?.avatar_url) updates.avatar_url = null;
      if (form.cidade) updates.cidade = form.cidade;
      else if (perfil?.cidade) updates.cidade = null;
      if (form.estado) updates.estado = form.estado.toUpperCase();
      else if (perfil?.estado) updates.estado = null;
      if (form.biografia) updates.biografia = form.biografia;
      else if (perfil?.biografia) updates.biografia = null;
      if (form.objetivo_estudos) updates.objetivo_estudos = form.objetivo_estudos;
      else if (perfil?.objetivo_estudos) updates.objetivo_estudos = null;
      if (form.profissao) updates.profissao = form.profissao;
      else if (perfil?.profissao) updates.profissao = null;
      await updatePerfil(userId, updates);
      setSuccess(true);
      setTimeout(() => onSaved(), 800);
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 animate-fadeIn" onClick={onClose}>
      <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">Editar Perfil</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-success-50 dark:bg-success-900/30 flex items-center justify-center mb-4"><Check className="w-8 h-8 text-success-500" /></div>
            <p className="text-sm font-medium text-success-600 dark:text-success-400">Perfil atualizado com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Apelido (nickname)" maxLength={50}>
              <input type="text" value={form.apelido} onChange={(e) => setForm({ ...form, apelido: e.target.value })} className="input-base" maxLength={50} placeholder="Como deseja ser chamado" />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} className="input-base" />
            </Field>
            <Field label="Avatar (URL da foto)">
              <input type="url" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className="input-base" placeholder="https://..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade">
                <input type="text" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="input-base" placeholder="Sua cidade" />
              </Field>
              <Field label="Estado (UF)">
                <input type="text" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase().slice(0, 2) })} className="input-base" maxLength={2} placeholder="SC" />
              </Field>
            </div>
            <Field label="Profissão (opcional)">
              <input type="text" value={form.profissao} onChange={(e) => setForm({ ...form, profissao: e.target.value })} className="input-base" placeholder="Sua profissão" />
            </Field>
            <Field label="Objetivo de estudos">
              <input type="text" value={form.objetivo_estudos} onChange={(e) => setForm({ ...form, objetivo_estudos: e.target.value })} className="input-base" placeholder="Ex: Passar no concurso da PMSC" />
            </Field>
            <Field label="Biografia curta" maxLength={500}>
              <textarea value={form.biografia} onChange={(e) => setForm({ ...form, biografia: e.target.value })} className="input-base resize-none" rows={3} maxLength={500} placeholder="Conte um pouco sobre você" />
              <p className="text-xs text-ink-400 mt-1">{form.biografia.length}/500</p>
            </Field>

            {error && <p className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-3 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar Alterações
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, maxLength }: { label: string; children: React.ReactNode; maxLength?: number }) {
  return (
    <div>
      <label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">{label}</label>
      {children}
      {maxLength && <p className="text-xs text-ink-400 mt-1 sr-only">Máximo {maxLength} caracteres</p>}
    </div>
  );
}
