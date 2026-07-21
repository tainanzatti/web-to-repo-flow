import { useEffect, useState, useCallback } from "react";
import { LayoutDashboard, Zap, Flame, BookOpen, Clock, Target, Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { fetchRanking, fetchLancamentos, type RankingRow, type Lancamento } from "../../lib/db";
import { LineChart } from "../ui/Charts";

export function PainelView() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingRow | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rows, lans] = await Promise.all([
        fetchRanking("all").then((r) => r.find((x) => x.user_id === user.id) ?? null).catch(() => null),
        fetchLancamentos(30).catch(() => []),
      ]);
      setRanking(rows);
      setLancamentos(lans);
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const displayName = user?.email?.split("@")[0] ?? "Usuário";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><LayoutDashboard className="w-7 h-7 text-brand-600" />Painel</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Bem-vindo de volta, {displayName}!</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<Zap className="w-5 h-5" />} label="XP Total" value={String(ranking?.xp_total ?? 0)} color="brand" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Acertos" value={`${(ranking?.taxa_acertos ?? 0).toFixed(0)}%`} color="success" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Questões" value={String(ranking?.questoes_respondidas ?? 0)} color="warning" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Horas" value={`${(ranking?.horas_estudadas ?? 0).toFixed(1)}h`} color="ink" />
        <StatCard icon={<Flame className="w-5 h-5" />} label="Streak" value={`${ranking?.dias_consecutivos ?? 0}d`} color="error" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="% Edital" value={`${(ranking?.percentual_edital ?? 0).toFixed(0)}%`} color="brand" />
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4">Atividades Recentes</h3>
        {lancamentos.length === 0 ? (
          <p className="text-sm text-ink-400 text-center py-8">Nenhuma atividade registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {lancamentos.slice(0, 10).map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 dark:bg-ink-800/50">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                  {l.tipo === "estudo" ? <BookOpen className="w-4 h-4" /> : l.tipo === "questao" ? <Target className="w-4 h-4" /> : l.tipo === "redacao" ? <BookOpen className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-200 capitalize">{l.tipo}</p>
                  <p className="text-xs text-ink-400">{l.duracao_minutos} min · {new Date(l.criado_em).toLocaleDateString("pt-BR")}</p>
                </div>
                {l.acertos != null && <span className="text-xs font-medium text-success-600 dark:text-success-400">{l.acertos} acertos</span>}
              </div>
            ))}
          </div>
        )}
      </div>
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
