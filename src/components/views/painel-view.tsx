import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, Target, Clock, BookOpen, Calculator } from "lucide-react";
import { fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchQuestoes, fetchSkipCounts } from "../../lib/db";
import { computeDisciplinaData, dominioMedio, type Discipline, type Topic, type Lancamento } from "../../lib/curriculum";
import type { QuestaoRow } from "../../lib/db";

export function PainelView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [metaDias, setMetaDias] = useState(180);

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

  const totalLanc = lancamentos.length;
  const totalQuestoes = questoes.length;
  const totalAcertos = questoes.filter((q) => q.acertou).length;
  const taxaAcertos = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

  const allData = disciplines.map((d) => {
    const dTopics = topics.filter((t) => t.disciplina_id === d.id);
    const dLancs = lancamentos.filter((l) => l.disciplina_id === d.id);
    const mult = (skipCounts[d.id] ?? 0) > 0 ? 1.5 : 1;
    return computeDisciplinaData(d, dTopics, dLancs, mult);
  });

  const domGeral = allData.length > 0 ? allData.reduce((a, b) => a + b.dominioMedio, 0) / allData.length : 0;
  const topicosNaoDominados = allData.reduce((a, b) => a + b.topicosNaoDominados, 0);
  const totalTopicos = topics.length;

  // Projection: pace = lancamentos per day
  const diasEstudados = new Set(lancamentos.map((l) => l.created_at.slice(0, 10))).size;
  const pace = diasEstudados > 0 ? totalLanc / diasEstudados : 1;
  const diasParaCobrir = pace > 0 ? Math.ceil(topicosNaoDominados / pace) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Painel</h1>
        <p className="text-sm text-ink-500 mt-1">Visão geral do seu progresso no concurso Soldado PMSC 2026.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Domínio geral" value={`${Math.round(domGeral)}%`} color="brand" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Taxa de acertos" value={`${taxaAcertos.toFixed(0)}%`} color="success" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Tópicos não dominados" value={`${topicosNaoDominados}/${totalTopicos}`} color="warning" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="Lançamentos" value={`${totalLanc}`} color="ink" />
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Projeção de cobertura
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-ink-600 mb-1 block">Meta de dias até a prova: {metaDias}</label>
            <input
              type="range"
              min={30}
              max={365}
              step={10}
              value={metaDias}
              onChange={(e) => setMetaDias(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="text-ink-500">Ritmo atual</p>
              <p className="text-lg font-bold text-ink-900">{pace.toFixed(1)} lanc/dia</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-4">
              <p className="text-ink-500">Dias para cobrir tópicos restantes</p>
              <p className="text-lg font-bold text-ink-900">{diasParaCobrir} dias</p>
            </div>
          </div>
          {diasParaCobrir > metaDias && (
            <p className="text-sm text-warning-600">
              No ritmo atual, você ultrapassará a meta. Considere aumentar o ritmo de estudo.
            </p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-ink-900 mb-4">Progresso por disciplina</h3>
        <div className="space-y-3">
          {allData
            .sort((a, b) => b.score - a.score)
            .map(({ discipline, dominioMedio: dom }) => (
              <div key={discipline.id} className="flex items-center gap-3">
                <span className="text-sm text-ink-700 w-40 truncate">{discipline.nome}</span>
                <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${dom}%` }} />
                </div>
                <span className="text-xs text-ink-500 w-10 text-right">{Math.round(dom)}%</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    ink: "bg-ink-100 text-ink-600",
  };
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );
}
