import { useEffect, useState, useCallback } from "react";
import { BarChart3, Loader2, Sparkles, AlertCircle, TrendingUp, Star, Target } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { fetchRanking, fetchLancamentos, type RankingRow, type Lancamento } from "../../lib/db";
import { aiAnaliseDesempenho, aiRecomendacoes, type AnaliseDesempenho } from "../../lib/ai.service";

export function DesempenhoView() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingRow | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [analise, setAnalise] = useState<AnaliseDesempenho | null>(null);
  const [recomendacoes, setRecomendacoes] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rows, lans] = await Promise.all([
        fetchRanking("all").then((r) => r.find((x) => x.user_id === user.id) ?? null).catch(() => null),
        fetchLancamentos(100).catch(() => []),
      ]);
      setRanking(rows);
      setLancamentos(lans);
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAnalise = async () => {
    setLoadingAI(true); setError(null);
    try {
      const dados = {
        xp_total: ranking?.xp_total ?? 0,
        taxa_acertos: ranking?.taxa_acertos ?? 0,
        questoes_respondidas: ranking?.questoes_respondidas ?? 0,
        questoes_corretas: ranking?.questoes_corretas ?? 0,
        horas_estudadas: ranking?.horas_estudadas ?? 0,
        topicos_estudados: ranking?.topicos_estudados ?? 0,
        dias_consecutivos: ranking?.dias_consecutivos ?? 0,
        percentual_edital: ranking?.percentual_edital ?? 0,
        lancamentos: lancamentos.slice(0, 20),
      };
      const [a, r] = await Promise.all([aiAnaliseDesempenho(dados), aiRecomendacoes(dados)]);
      setAnalise(a);
      setRecomendacoes(r);
    } catch (err) { setError((err as Error).message); }
    setLoadingAI(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><BarChart3 className="w-7 h-7 text-brand-600" />Desempenho</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Analise seu progresso com IA.</p></div>
        <button onClick={handleAnalise} disabled={loadingAI} className="btn-primary flex items-center gap-2">{loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Analisar com IA</button>
      </div>

      {error && <div className="card p-4 text-sm text-error-600 dark:text-error-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Target className="w-5 h-5" />} label="XP" value={String(ranking?.xp_total ?? 0)} color="brand" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Acertos" value={`${(ranking?.taxa_acertos ?? 0).toFixed(0)}%`} color="success" />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Questões" value={String(ranking?.questoes_respondidas ?? 0)} color="warning" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Horas" value={`${(ranking?.horas_estudadas ?? 0).toFixed(1)}h`} color="ink" />
        <StatCard icon={<Star className="w-5 h-5" />} label="Tópicos" value={String(ranking?.topicos_estudados ?? 0)} color="brand" />
        <StatCard icon={<Target className="w-5 h-5" />} label="% Edital" value={`${(ranking?.percentual_edital ?? 0).toFixed(0)}%`} color="error" />
      </div>

      {analise && (
        <div className="space-y-4 animate-slideUp">
          <div className="card p-6"><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-2">Resumo</h3><p className="text-sm text-ink-700 dark:text-ink-300">{analise.resumo}</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6"><h3 className="text-sm font-bold text-success-600 dark:text-success-400 mb-3 flex items-center gap-2"><Star className="w-4 h-4" />Pontos Fortes</h3><ul className="space-y-2">{analise.pontos_fortes.map((p, i) => <li key={i} className="text-sm text-ink-700 dark:text-ink-300 flex items-start gap-2"><CheckMini /> {p}</li>)}</ul></div>
            <div className="card p-6"><h3 className="text-sm font-bold text-error-600 dark:text-error-400 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Pontos Fracos</h3><ul className="space-y-2">{analise.pontos_fracos.map((p, i) => <li key={i} className="text-sm text-ink-700 dark:text-ink-300 flex items-start gap-2"><AlertMini /> {p}</li>)}</ul></div>
          </div>
          {analise.sugestoes.length > 0 && (
            <div className="card p-6"><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3">Sugestões</h3><ul className="space-y-2">{analise.sugestoes.map((s, i) => <li key={i} className="text-sm text-ink-700 dark:text-ink-300 flex items-start gap-2"><Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" /> {s}</li>)}</ul></div>
          )}
        </div>
      )}

      {recomendacoes.length > 0 && (
        <div className="card p-6 animate-slideUp"><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" />Recomendações Personalizadas</h3><ul className="space-y-2">{recomendacoes.map((r, i) => <li key={i} className="text-sm text-ink-700 dark:text-ink-300 flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span> {r}</li>)}</ul></div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const cm: Record<string, string> = { brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300", success: "bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-300", warning: "bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-300", ink: "bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300", error: "bg-error-50 text-error-600 dark:bg-error-900/30 dark:text-error-300" };
  return <div className="card p-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cm[color] ?? cm.brand}`}>{icon}</div><p className="text-lg font-bold text-ink-900 dark:text-ink-100">{value}</p><p className="text-xs text-ink-500 dark:text-ink-400">{label}</p></div>;
}
function CheckMini() { return <svg className="w-4 h-4 text-success-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>; }
function AlertMini() { return <svg className="w-4 h-4 text-error-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>; }
