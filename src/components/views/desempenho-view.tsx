import { useEffect, useState, useCallback } from "react";
import { Loader2, BarChart3, AlertCircle } from "lucide-react";
import { fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchQuestoes, fetchSkipCounts, type QuestaoRow } from "../../lib/db";
import { computeDisciplinaData, tierFromMastery, type Discipline, type Topic, type Lancamento } from "../../lib/curriculum";

export function DesempenhoView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [d, t, l, q, s] = await Promise.all([
      fetchDisciplines(),
      fetchAllTopics(),
      fetchLancamentos(),
      fetchQuestoes(),
      fetchSkipCounts(),
    ]);
    setDisciplines(d);
    setTopics(t);
    setLancamentos(l);
    setQuestoes(q);
    setSkipCounts(s);
    setLoading(false);
  }, []);

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

  const rows = disciplines.map((d) => {
    const dTopics = topics.filter((t) => t.disciplina_id === d.id);
    const dLancs = lancamentos.filter((l) => l.disciplina_id === d.id);
    const dQuestoes = questoes.filter((q) => q.disciplina_id === d.id);
    const data = computeDisciplinaData(d, dTopics, dLancs, (skipCounts[d.id] ?? 0) > 0 ? 1.5 : 1);
    const acertos = dQuestoes.filter((q) => q.acertou).length;
    return {
      discipline: d,
      dominio: data.dominioMedio,
      topicosNaoDominados: data.topicosNaoDominados,
      totalTopicos: dTopics.length,
      questoes: dQuestoes.length,
      acertos,
      taxa: dQuestoes.length > 0 ? (acertos / dQuestoes.length) * 100 : 0,
      skips: skipCounts[d.id] ?? 0,
      tier: tierFromMastery(data.dominioMedio),
    };
  });

  const tierColor: Record<string, string> = {
    ruim: "text-error-600 bg-error-50",
    medio: "text-warning-600 bg-warning-50",
    bom: "text-success-600 bg-success-50",
    otimo: "text-success-700 bg-success-100",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Desempenho</h1>
        <p className="text-sm text-ink-500 mt-1">Acompanhe seu domínio, questões e pulos por disciplina.</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="text-left font-semibold text-ink-600 px-4 py-3">Disciplina</th>
              <th className="text-center font-semibold text-ink-600 px-4 py-3">Domínio</th>
              <th className="text-center font-semibold text-ink-600 px-4 py-3">Tópicos</th>
              <th className="text-center font-semibold text-ink-600 px-4 py-3">Questões</th>
              <th className="text-center font-semibold text-ink-600 px-4 py-3">Acertos</th>
              <th className="text-center font-semibold text-ink-600 px-4 py-3">Pulos</th>
              <th className="text-center font-semibold text-ink-600 px-4 py-3">Nível</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.discipline.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-800">{r.discipline.nome}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${r.dominio}%` }} />
                    </div>
                    <span className="text-xs text-ink-500">{Math.round(r.dominio)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-ink-600">
                  {r.totalTopicos - r.topicosNaoDominados}/{r.totalTopicos}
                </td>
                <td className="px-4 py-3 text-center text-ink-600">{r.questoes}</td>
                <td className="px-4 py-3 text-center text-ink-600">
                  {r.questoes > 0 ? `${r.taxa.toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.skips > 0 ? (
                    <span className="inline-flex items-center gap-1 text-warning-600">
                      <AlertCircle className="w-3 h-3" /> {r.skips}
                    </span>
                  ) : (
                    <span className="text-ink-300">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${tierColor[r.tier]}`}>{r.tier}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-ink-500">Domínio geral</p>
            <p className="text-lg font-bold text-ink-900">
              {rows.length > 0 ? Math.round(rows.reduce((a, b) => a + b.dominio, 0) / rows.length) : 0}%
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <p className="text-xs text-ink-500">Total de questões</p>
            <p className="text-lg font-bold text-ink-900">{questoes.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-warning-600" />
          </div>
          <div>
            <p className="text-xs text-ink-500">Total de pulos</p>
            <p className="text-lg font-bold text-ink-900">{Object.values(skipCounts).reduce((a, b) => a + b, 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
