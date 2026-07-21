import { useState, useEffect, useCallback } from "react";
import { Lock, ChevronDown, ChevronRight, Play, SkipForward, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { fetchDisciplines, fetchTopics, fetchLancamentos, fetchSkipCounts, incrementSkip, resetSkip, insertLancamento } from "../../lib/db";
import { computeDisciplinaData, nextHeroDiscipline, allocateTopics, type DisciplinaComTopicos, type DisciplinaScore, type AllocatedTopic } from "../../lib/curriculum";

const TIER_COLORS: Record<string, string> = { ruim: "bg-error-500", medio: "bg-warning-500", bom: "bg-brand-500", otimo: "bg-success-500", dominado: "bg-success-700" };
const TIER_LABELS: Record<string, string> = { ruim: "Ruim", medio: "Médio", bom: "Bom", otimo: "Ótimo", dominado: "Dominado" };

export default function NucleoView() {
  const [disciplinas, setDisciplinas] = useState<DisciplinaComTopicos[]>([]);
  const [heroScore, setHeroScore] = useState<DisciplinaScore | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [skipConfirm, setSkipConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estudando, setEstudando] = useState<AllocatedTopic[] | null>(null);
  const [skipping, setSkipping] = useState(false);

  const loadData = useCallback(async (excludeId?: string | null) => {
    setLoading(true);
    try {
      const [discs, tops, lancs, skipMap] = await Promise.all([fetchDisciplines(), fetchTopics(), fetchLancamentos(), fetchSkipCounts()]);
      const discData = discs.map((d) => { const topicsForDisc = tops.filter((t) => t.disciplina_id === d.id); return computeDisciplinaData(d, topicsForDisc, lancs); });
      setDisciplinas(discData);
      const hero = nextHeroDiscipline(discData, skipMap, excludeId ?? null);
      setHeroScore(hero);
      if (hero) setExpandedId(hero.disciplinaId);
    } catch (err) { console.error("Erro ao carregar núcleo:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSkip = async (disciplinaId: string) => {
    setSkipping(true);
    try { await incrementSkip(disciplinaId); setSkipConfirm(null); await loadData(disciplinaId); }
    catch (err) { console.error("Erro ao pular:", err); }
    finally { setSkipping(false); }
  };

  const handleEstudar = async (d: DisciplinaComTopicos) => { setEstudando(allocateTopics(d, 45)); };

  const handleConcluirSessao = async () => {
    if (!estudando) return;
    const discId = estudando[0].topic.disciplina_id;
    for (const alloc of estudando) {
      await insertLancamento({ disciplina_id: alloc.topic.disciplina_id, topico_id: alloc.topic.id, mastery: Math.min(100, alloc.topic.movingAverageMastery + 15), minutos: alloc.minutos, is_primeiro_contato: alloc.topic.isPrimeiroContato });
    }
    await resetSkip(discId);
    setEstudando(null);
    await loadData();
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-ink-400 text-sm">Carregando núcleo...</div></div>;

  if (estudando) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-fadeIn">
        <h2 className="text-xl font-bold text-ink-900 mb-1">Sessão de Estudo</h2>
        <p className="text-sm text-ink-500 mb-6">{estudando.length} tópico(s) — conclua cada um para registrar o progresso</p>
        <div className="space-y-3">
          {estudando.map((alloc, i) => (
            <div key={alloc.topic.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-ink-400">#{i + 1}</span>
                    {alloc.isManutencao && <span className="text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full font-semibold">Manutenção</span>}
                  </div>
                  <h3 className="font-semibold text-ink-900">{alloc.topic.nome}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {alloc.minutos} min</span>
                    <span>Domínio atual: {Math.round(alloc.topic.movingAverageMastery)}% ({TIER_LABELS[alloc.topic.tier]})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleConcluirSessao} className="btn-primary flex-1">Concluir e Registrar</button>
          <button onClick={() => setEstudando(null)} className="btn-secondary">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Núcleo de Estudos</h1>
        <p className="text-sm text-ink-500 mt-1">A disciplina ativa é definida pelo seu score de prioridade. As demais ficam bloqueadas até serem ativadas.</p>
      </div>

      {heroScore && (
        <div className="card p-4 mb-6 bg-brand-50 border-brand-200">
          <div className="flex items-center gap-2 text-brand-800"><Sparkles className="w-5 h-5" /><span className="font-semibold text-sm">Disciplina ativa: {heroScore.nome}</span></div>
          <p className="text-sm text-ink-600 mt-1.5">{heroScore.motivoPrioridade}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {disciplinas.map((d) => {
          const isActive = heroScore?.disciplinaId === d.disciplina.id;
          const isExpanded = expandedId === d.disciplina.id;
          const isRedacao = d.disciplina.is_redacao;
          return (
            <div key={d.disciplina.id} className={`card overflow-hidden transition-all ${isActive ? "ring-2 ring-brand-500" : "opacity-70"} ${isRedacao ? "border-l-4 border-l-warning-500" : ""}`}>
              <div className={`p-4 ${isActive ? "cursor-pointer hover:bg-ink-50" : ""}`} onClick={() => isActive && setExpandedId(isExpanded ? null : d.disciplina.id)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!isActive ? <Lock className="w-4 h-4 text-ink-400" /> : isExpanded ? <ChevronDown className="w-4 h-4 text-brand-600" /> : <ChevronRight className="w-4 h-4 text-brand-600" />}
                    <h3 className={`font-semibold text-sm ${isActive ? "text-ink-900" : "text-ink-500"}`}>{d.disciplina.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full font-semibold">{d.disciplina.peso_edital}q</span>
                    {isRedacao && <span className="text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full font-semibold">Redação</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-ink-500"><span>Domínio</span><span className="font-semibold">{Math.round(d.dominioMedio)}%</span></div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${d.dominioMedio >= 80 ? "bg-success-500" : d.dominioMedio >= 60 ? "bg-brand-500" : d.dominioMedio >= 40 ? "bg-warning-500" : "bg-error-500"}`} style={{ width: `${Math.min(100, d.dominioMedio)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-400"><Clock className="w-3.5 h-3.5" /><span>{d.diasDesdeUltimaRevisao >= 9999 ? "Nunca revisada" : `Há ${d.diasDesdeUltimaRevisao} dias sem revisão`}</span></div>
              </div>
              {isActive && isExpanded && (
                <div className="px-4 pb-4 border-t border-ink-100 animate-fadeIn">
                  {heroScore && <div className="mt-3 mb-3 p-3 bg-ink-50 rounded-xl"><p className="text-xs text-ink-600 font-medium">{heroScore.motivoPrioridade}</p></div>}
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Tópicos</h4>
                    {d.topicos.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-ink-700 truncate">{t.nome}</span>
                        <div className="flex items-center gap-2 shrink-0"><span className="text-xs text-ink-500">{Math.round(t.movingAverageMastery)}%</span><div className={`w-2 h-2 rounded-full ${TIER_COLORS[t.tier]}`} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEstudar(d)} className="btn-primary flex-1"><Play className="w-4 h-4" /> Estudar</button>
                    <button onClick={() => setSkipConfirm(d.disciplina.id)} className="btn-ghost" title="Pular esta disciplina"><SkipForward className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {skipConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3"><AlertTriangle className="w-6 h-6 text-warning-500" /><h3 className="text-lg font-bold text-ink-900">Pular disciplina?</h3></div>
            <p className="text-sm text-ink-600 mb-5">Pular não te livra dela — ela volta com prioridade maior e fica registrado.</p>
            <div className="flex gap-3">
              <button onClick={() => handleSkip(skipConfirm)} disabled={skipping} className="btn-danger flex-1">{skipping ? "Pulando..." : "Sim, pular"}</button>
              <button onClick={() => setSkipConfirm(null)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
