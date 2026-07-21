import { useState, useEffect, useCallback } from "react";
import { BarChart3, SkipForward, Loader2 } from "lucide-react";
import { fetchDisciplines, fetchTopics, fetchLancamentos, fetchSkipCounts, fetchQuestoes } from "../../lib/db";
import { computeDisciplinaData, type DisciplinaComTopicos } from "../../lib/curriculum";

const TIER_COLORS: Record<string, string> = { ruim: "bg-error-500", medio: "bg-warning-500", bom: "bg-brand-500", otimo: "bg-success-500", dominado: "bg-success-700" };

export default function DesempenhoView() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaComTopicos[]>([]);
  const [skipCounts, setSkipCounts] = useState<Map<string, { vezes_pulada: number; multiplicador_urgencia: number }>>(new Map());
  const [questoesPorDisc, setQuestoesPorDisc] = useState<Map<string, { total: number; acertos: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [discs, tops, lancs, skips, quests] = await Promise.all([fetchDisciplines(), fetchTopics(), fetchLancamentos(), fetchSkipCounts(), fetchQuestoes()]);
      const discData = discs.map((d) => { const topicsForDisc = tops.filter((t) => t.disciplina_id === d.id); return computeDisciplinaData(d, topicsForDisc, lancs); });
      setDisciplinas(discData); setSkipCounts(skips);
      const qMap = new Map<string, { total: number; acertos: number }>();
      for (const q of quests) { const existing = qMap.get(q.disciplina_id) ?? { total: 0, acertos: 0 }; existing.total++; if (q.acertou) existing.acertos++; qMap.set(q.disciplina_id, existing); }
      setQuestoesPorDisc(qMap);
    } catch (err) { console.error("Erro ao carregar desempenho:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-ink-400" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-brand-600" /> Desempenho</h1>
        <p className="text-sm text-ink-500 mt-1">Visão geral por disciplina, com contador de evasão e questões.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                <th className="text-left px-4 py-3 font-semibold text-ink-600">Disciplina</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-600">Domínio</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-600">Tópicos</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-600">Questões</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-600">Tier</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-600"><span className="flex items-center justify-center gap-1"><SkipForward className="w-3.5 h-3.5" /> Evasão</span></th>
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((d) => {
                const skip = skipCounts.get(d.disciplina.id);
                const vezes = skip?.vezes_pulada ?? 0;
                const mult = skip?.multiplicador_urgencia ?? 1;
                const questStats = questoesPorDisc.get(d.disciplina.id);
                return (
                  <tr key={d.disciplina.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink-800">{d.disciplina.nome}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-ink-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${d.dominioMedio >= 80 ? "bg-success-500" : d.dominioMedio >= 60 ? "bg-brand-500" : d.dominioMedio >= 40 ? "bg-warning-500" : "bg-error-500"}`} style={{ width: `${Math.min(100, d.dominioMedio)}%` }} /></div>
                        <span className="text-xs font-semibold text-ink-600 w-8">{Math.round(d.dominioMedio)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-ink-600">{d.topicos.length}</td>
                    <td className="px-4 py-3 text-center">
                      {questStats && questStats.total > 0 ? (
                        <span className="text-xs"><span className="text-success-600 font-semibold">{questStats.acertos}</span><span className="text-ink-400">/</span><span className="text-ink-600">{questStats.total}</span><span className="text-ink-400 ml-1">({Math.round((questStats.acertos / questStats.total) * 100)}%)</span></span>
                      ) : <span className="text-ink-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {d.topicos.slice(0, 5).map((t) => <div key={t.id} className={`w-2 h-2 rounded-full ${TIER_COLORS[t.tier]}`} title={`${t.nome}: ${Math.round(t.movingAverageMastery)}%`} />)}
                        {d.topicos.length > 5 && <span className="text-xs text-ink-400">+{d.topicos.length - 5}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {vezes > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning-100 text-warning-700 text-xs font-semibold">{vezes}x{mult > 1 && <span className="text-warning-500">({mult.toFixed(1)}x)</span>}</span>
                      ) : <span className="text-ink-300 text-xs">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-error-500" /> Ruim</span>
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-warning-500" /> Médio</span>
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-500" /> Bom</span>
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success-500" /> Ótimo</span>
        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success-700" /> Dominado</span>
      </div>
    </div>
  );
}
