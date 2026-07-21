import { useEffect, useState, useCallback } from "react";
import { Shield, SkipForward, Lock, BookOpen, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchSkipCounts,
  incrementSkipCount, insertLancamento, resetSkipCount,
} from "../../lib/db";
import {
  computeDisciplinaData, nextHeroDiscipline, maxTopicsForDiscipline,
  allocateTopics, tierFromMastery, dominioMedio,
  type Discipline, type Topic, type Lancamento,
} from "../../lib/curriculum";
import { TopicCard } from "./topic-card";

export function NucleoView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [allLancamentos, setAllLancamentos] = useState<Lancamento[]>([]);
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmSkip, setConfirmSkip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (excludeId?: string) => {
    const [discs, topics, lancs, skips] = await Promise.all([
      fetchDisciplines(), fetchAllTopics(), fetchLancamentos(), fetchSkipCounts(),
    ]);
    setDisciplines(discs); setAllTopics(topics); setAllLancamentos(lancs); setSkipCounts(skips);
    const allData = discs.map((d) => {
      const dTopics = topics.filter((t) => t.disciplina_id === d.id);
      const dLancs = lancs.filter((l) => l.disciplina_id === d.id);
      const mult = (skips[d.id] ?? 0) > 0 ? 1.5 : 1;
      return computeDisciplinaData(d, dTopics, dLancs, mult);
    });
    const hero = nextHeroDiscipline(allData, excludeId);
    setActiveId(hero?.discipline.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeDisc = disciplines.find((d) => d.id === activeId);
  const activeTopics = activeDisc ? allTopics.filter((t) => t.disciplina_id === activeDisc.id) : [];
  const activeLancs = activeDisc ? allLancamentos.filter((l) => l.disciplina_id === activeDisc.id) : [];
  const activeData = activeDisc
    ? computeDisciplinaData(activeDisc, activeTopics, activeLancs, (skipCounts[activeDisc.id] ?? 0) > 0 ? 1.5 : 1)
    : null;

  const maxTopics = activeData ? maxTopicsForDiscipline(activeData) : 1;
  const allocated = activeData ? allocateTopics(activeTopics, activeLancs, maxTopics) : [];

  const handleSkip = async () => {
    if (!confirmSkip) return;
    await incrementSkipCount(confirmSkip);
    await loadData(confirmSkip);
    setConfirmSkip(null);
  };

  const handleStudy = async (topicoId: string, mastery: number) => {
    if (!activeId) return;
    await insertLancamento(activeId, topicoId, mastery);
    await loadData();
  };

  const handleCompleteDiscipline = async () => {
    if (!activeId) return;
    await resetSkipCount(activeId);
    await loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Núcleo de Estudo</h1>
        <p className="text-sm text-ink-500 mt-1">A disciplina em destaque é escolhida automaticamente com base no peso do edital, domínio e esquecimento.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {disciplines.map((d) => {
          const dTopics = allTopics.filter((t) => t.disciplina_id === d.id);
          const dLancs = allLancamentos.filter((l) => l.disciplina_id === d.id);
          const dom = dominioMedio(dLancs);
          const isActive = d.id === activeId;
          const skipCount = skipCounts[d.id] ?? 0;
          return (
            <div key={d.id} className={`card p-4 transition-all ${isActive ? "ring-2 ring-brand-500 shadow-md" : "opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-400">{d.peso_edital}q</span>
                {isActive ? <Shield className="w-4 h-4 text-brand-600" /> : <Lock className="w-4 h-4 text-ink-300" />}
              </div>
              <p className="text-sm font-semibold text-ink-900 leading-snug mb-2">{d.nome}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${dom}%` }} />
                </div>
                <span className="text-xs text-ink-500">{Math.round(dom)}%</span>
              </div>
              {skipCount > 0 && (
                <p className="text-xs text-warning-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pulou {skipCount}x</p>
              )}
            </div>
          );
        })}
      </div>

      {activeDisc && activeData && (
        <div className="card p-6 animate-fadeIn">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-bold text-ink-900">{activeDisc.nome}</h2>
              </div>
              <p className="text-sm text-ink-500">
                Domínio: {Math.round(activeData.dominioMedio)}% · Tópicos não dominados: {activeData.topicosNaoDominados} · Score: {activeData.score.toFixed(2)}
              </p>
            </div>
            <button onClick={() => setConfirmSkip(activeDisc.id)} className="btn-ghost text-sm"><SkipForward className="w-4 h-4" /> Pular</button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-700">Tópicos sugeridos para esta sessão ({allocated.length}):</p>
            {allocated.map((t) => {
              const tLancs = activeLancs.filter((l) => l.topico_id === t.id);
              const tDom = tLancs.length > 0 ? tLancs.reduce((a, b) => a + Number(b.mastery), 0) / tLancs.length : 0;
              const tier = tierFromMastery(tDom);
              const tierColor = { ruim: "text-error-600 bg-error-50", medio: "text-warning-600 bg-warning-50", bom: "text-success-600 bg-success-50", otimo: "text-success-700 bg-success-100" }[tier];
              return (
                <div key={t.id} className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-ink-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink-800">{t.nome}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tierColor}`}>{tier}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleStudy(t.id, 40)} className="btn-secondary text-xs px-3 py-1.5">Estudei</button>
                      <button onClick={() => handleStudy(t.id, 70)} className="btn-secondary text-xs px-3 py-1.5">Revisei</button>
                      <button onClick={() => handleStudy(t.id, 90)} className="btn-primary text-xs px-3 py-1.5"><CheckCircle className="w-3 h-3" /> Dominei</button>
                    </div>
                  </div>
                  <TopicCard topic={t} discipline={activeDisc} />
                </div>
              );
            })}
          </div>

          <button onClick={handleCompleteDiscipline} className="btn-ghost text-sm mt-4 text-success-600"><CheckCircle className="w-4 h-4" /> Concluir disciplina</button>
        </div>
      )}

      {confirmSkip && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="card p-6 max-w-sm w-full animate-fadeIn">
            <div className="flex items-center gap-3 mb-3"><Clock className="w-6 h-6 text-warning-600" /><h3 className="text-lg font-bold text-ink-900">Pular disciplina?</h3></div>
            <p className="text-sm text-ink-500 mb-5">A disciplina será priorizada com multiplicador de urgência x1.5. Você poderá voltar a ela depois.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmSkip(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSkip} className="btn-danger">Pular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
