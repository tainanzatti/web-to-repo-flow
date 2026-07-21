import { useState, useEffect, useCallback } from "react";
import { User, Award, Clock, CheckCircle, Calendar, Save } from "lucide-react";
import { fetchUserPrefs, updateUserPrefs, fetchLancamentos, fetchQuestoes, type UserPrefs } from "../../lib/db";

const PROVA_DATE = new Date("2026-12-06");
const CONCURSO = "PMSC Soldado 2026";
const BANCA = "Instituto AOCP";

export default function PerfilView() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ horasTotal: 0, questoesFeitas: 0, aproveitamento: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, lancs, quests] = await Promise.all([fetchUserPrefs(), fetchLancamentos(), fetchQuestoes()]);
      setPrefs(p); setNome(p.nome);
      const horasTotal = lancs.reduce((s, l) => s + l.minutos, 0) / 60;
      const questoesAcertos = quests.filter((q) => q.acertou).length;
      const questoesAproveitamento = quests.length > 0 ? Math.round((questoesAcertos / quests.length) * 100) : 0;
      const lancAproveitamento = lancs.length > 0 ? lancs.reduce((s, l) => s + l.mastery, 0) / lancs.length : 0;
      setStats({ horasTotal, questoesFeitas: quests.length, aproveitamento: questoesAproveitamento || lancAproveitamento });
    } catch (err) { console.error("Erro ao carregar perfil:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateUserPrefs({ nome }); setPrefs((p) => p ? { ...p, nome } : p); }
    catch (err) { console.error("Erro ao salvar:", err); }
    finally { setSaving(false); }
  };

  const diasAteProva = Math.ceil((PROVA_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-ink-400 text-sm">Carregando perfil...</div></div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6"><h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><User className="w-6 h-6 text-brand-600" /> Perfil do Candidato</h1></div>

      <div className="card p-5 mb-6">
        <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Concurso</h3>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Concurso" value={CONCURSO} />
          <InfoItem label="Banca" value={BANCA} />
          <InfoItem label="Dias até a prova" value={`${diasAteProva} dias`} highlight={diasAteProva < 100} icon={Calendar} />
          <InfoItem label="Data da prova" value="06/12/2026" />
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Estatísticas de Estudo</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem icon={Clock} label="Horas estudadas" value={`${stats.horasTotal.toFixed(1)}h`} />
          <StatItem icon={CheckCircle} label="Questões feitas" value={String(stats.questoesFeitas)} />
          <StatItem icon={Award} label="Aproveitamento" value={`${Math.round(stats.aproveitamento)}%`} />
          <StatItem icon={Calendar} label="Horas/dia meta" value={`${prefs?.horas_estudo_dia ?? 4}h`} />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Dados Pessoais</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink-700 block mb-1.5">Nome</label>
            <div className="flex gap-2">
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Seu nome" />
              <button onClick={handleSave} disabled={saving} className="btn-primary"><Save className="w-4 h-4" /> Salvar</button>
            </div>
          </div>
          <p className="text-xs text-ink-400">Os dados pessoais (CPF, telefone, etc.) não são necessários para o estudo. Mantenha o foco no que importa para o concurso.</p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight, icon: Icon }: { label: string; value: string; highlight?: boolean; icon?: typeof Calendar }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 flex items-center gap-1.5 ${highlight ? "text-warning-600" : "text-ink-900"}`}>{Icon && <Icon className="w-4 h-4" />}{value}</p>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-ink-50">
      <Icon className="w-4 h-4 text-ink-400 mb-2" />
      <p className="text-lg font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
