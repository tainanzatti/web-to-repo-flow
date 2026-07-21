import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, Target, Clock, BookOpen, Calculator, Sparkles, Calendar, AlertCircle, ChevronRight, Timer } from "lucide-react";
import { fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchQuestoes, fetchSkipCounts, fetchPlanoHoje, savePlanoHoje } from "../../lib/db";
import { computeDisciplinaData, computeTopicoStats, computeDailyPlan, dominioMedio, type Discipline, type Topic, type Lancamento, type QuestaoRow, type PlanoEstudo, type Prioridade } from "../../lib/curriculum";
import { gerarPlanoAI, type PlanoAIInput } from "../../lib/ai-client";
import { StatCard } from "../ui/StatCard";
import { StudyTimer } from "../ui/StudyTimer";
import { useTimer, formatTime } from "../../lib/timer-context";

export function PainelView() {
  const { studyStats, refreshStats } = useTimer();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([]);
  const [skipCounts, setSkipCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [metaDias, setMetaDias] = useState(180);
  const [plano, setPlano] = useState<PlanoEstudo | null>(null);
  const [planoLoading, setPlanoLoading] = useState(true);
  const [gerandoPlano, setGerandoPlano] = useState(false);
  const [planoErro, setPlanoErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [d, t, l, q, s] = await Promise.all([fetchDisciplines(), fetchAllTopics(), fetchLancamentos(), fetchQuestoes(), fetchSkipCounts()]);
    setDisciplines(d); setTopics(t); setLancamentos(l); setQuestoes(q); setSkipCounts(s); setLoading(false);
    const ps = await fetchPlanoHoje();
    if (ps) setPlano(ps.plano_json as PlanoEstudo);
    else { const stats = computeTopicoStats(t, d, l, q); setPlano(computeDailyPlan(stats, new Date().toISOString().slice(0, 10))); }
    setPlanoLoading(false); refreshStats();
  }, [refreshStats]);

  useEffect(() => { load(); }, [load]);

  const handleGerarPlanoAI = async () => {
    if (gerandoPlano) return; setGerandoPlano(true); setPlanoErro(null);
    const stats = computeTopicoStats(topics, disciplines, lancamentos, questoes);
    const inputs: PlanoAIInput[] = stats.slice(0, 10).map((s) => ({ topico_id: s.topic.id, topico_nome: s.topic.nome, disciplina_nome: s.discipline.nome, mastery: s.masteryMedio, revisoes: s.revisoes, dias_desde_ultima: s.diasDesdeUltimaRevisao, questoes: s.questoesRespondidas, acertos: s.acertos, taxa_acertos: s.taxaAcertos, taxa_erros: s.taxaErros, peso_edital: s.discipline.peso_edital }));
    const { plano: aiPlano, error } = await gerarPlanoAI(inputs);
    if (error || !aiPlano) { setPlanoErro(error ?? "Erro ao gerar plano"); setGerandoPlano(false); return; }
    await savePlanoHoje(aiPlano);
    setPlano({ data: new Date().toISOString().slice(0, 10), itens: aiPlano.itens.map((i) => ({ ...i, prioridade: (["Alta", "Média", "Baixa"].includes(i.prioridade) ? i.prioridade : "Média") as Prioridade })), tempo_total: aiPlano.tempo_total });
    setGerandoPlano(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const totalLanc = lancamentos.length; const totalQuestoes = questoes.length;
  const totalAcertos = questoes.filter((q) => q.acertou).length;
  const taxaAcertos = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;
  const allData = disciplines.map((d) => { const dT = topics.filter((t) => t.disciplina_id === d.id); const dL = lancamentos.filter((l) => l.disciplina_id === d.id); const mult = (skipCounts[d.id] ?? 0) > 0 ? 1.5 : 1; return computeDisciplinaData(d, dT, dL, mult); });
  const domGeral = allData.length > 0 ? allData.reduce((a, b) => a + b.dominioMedio, 0) / allData.length : 0;
  const topicosNaoDominados = allData.reduce((a, b) => a + b.topicosNaoDominados, 0);
  const totalTopicos = topics.length;
  const diasEstudados = new Set(lancamentos.map((l) => l.criado_em.slice(0, 10))).size;
  const pace = diasEstudados > 0 ? totalLanc / diasEstudados : 1;
  const diasParaCobrir = pace > 0 ? Math.ceil(topicosNaoDominados / pace) : 0;
  const pc: Record<string, string> = { Alta: "bg-error-50 text-error-700 border-error-200 dark:bg-error-900/30 dark:text-error-300 dark:border-error-800", "Média": "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-800", Baixa: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-300 dark:border-success-800" };

  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Painel</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Visão geral do seu progresso no concurso Soldado PMSC 2026.</p></div><StudyTimer /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard icon={<Clock className="w-5 h-5" />} label="Tempo estudado hoje" value={formatTime(studyStats?.today ?? 0)} color="brand" /><StatCard icon={<Timer className="w-5 h-5" />} label="Esta semana" value={formatTime(studyStats?.week ?? 0)} color="success" /><StatCard icon={<Timer className="w-5 h-5" />} label="Este mês" value={formatTime(studyStats?.month ?? 0)} color="warning" /><StatCard icon={<Timer className="w-5 h-5" />} label="Tempo total" value={formatTime(studyStats?.total ?? 0)} color="ink" /></div><div className="card p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" /><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Plano de Estudos de Hoje</h3></div><button onClick={handleGerarPlanoAI} disabled={gerandoPlano} className="btn-primary text-xs">{gerandoPlano ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Sparkles className="w-3.5 h-3.5" /> Gerar com IA</>}</button></div>{planoLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div> : plano && plano.itens.length > 0 ? <div className="space-y-4"><div className="flex items-center gap-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20"><Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" /><div><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Tempo previsto: {plano.tempo_total} minutos</p><p className="text-xs text-ink-500 dark:text-ink-400">{plano.itens.length} tópico(s) para estudar hoje</p></div></div><div className="space-y-3">{plano.itens.map((item, i) => <div key={i} className="border border-ink-100 dark:border-ink-800 rounded-xl p-4 hover:border-brand-200 dark:hover:border-brand-700 transition-colors"><div className="flex items-start justify-between gap-3 mb-2"><div className="flex-1"><p className="text-xs text-ink-400 mb-0.5">{item.disciplina_nome}</p><div className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-brand-500 shrink-0" /><p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{item.topico_nome}</p></div></div><span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 ${pc[item.prioridade] ?? pc["Média"]}`}>{item.prioridade}</span></div><div className="flex items-center gap-3 ml-6"><span className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.tempo_minutos} min</span></div><p className="text-xs text-ink-500 dark:text-ink-400 mt-2 ml-6 italic">{item.motivo}</p></div>)}</div></div> : <div className="text-center py-8"><p className="text-sm text-ink-400">Nenhum plano disponível. Clique em "Gerar com IA" para criar seu plano personalizado.</p></div>}{planoErro && <p className="text-xs text-error-600 dark:text-error-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {planoErro}</p>}</div><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCard icon={<TrendingUp className="w-5 h-5" />} label="Domínio geral" value={`${Math.round(domGeral)}%`} color="brand" /><StatCard icon={<Target className="w-5 h-5" />} label="Taxa de acertos" value={`${taxaAcertos.toFixed(0)}%`} color="success" /><StatCard icon={<BookOpen className="w-5 h-5" />} label="Tópicos não dominados" value={`${topicosNaoDominados}/${totalTopicos}`} color="warning" /><StatCard icon={<Clock className="w-5 h-5" />} label="Lançamentos" value={`${totalLanc}`} color="ink" /></div><div className="card p-6"><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4" /> Projeção de cobertura</h3><div className="space-y-4"><div><label className="text-sm text-ink-600 dark:text-ink-400 mb-1 block">Meta de dias até a prova: {metaDias}</label><input type="range" min={30} max={365} step={10} value={metaDias} onChange={(e) => setMetaDias(Number(e.target.value))} className="w-full accent-brand-600" /></div><div className="grid grid-cols-2 gap-4 text-sm"><div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-4"><p className="text-ink-500 dark:text-ink-400">Ritmo atual</p><p className="text-lg font-bold text-ink-900 dark:text-ink-100">{pace.toFixed(1)} lanc/dia</p></div><div className="rounded-xl bg-ink-50 dark:bg-ink-800 p-4"><p className="text-ink-500 dark:text-ink-400">Dias para cobrir tópicos restantes</p><p className="text-lg font-bold text-ink-900 dark:text-ink-100">{diasParaCobrir} dias</p></div></div>{diasParaCobrir > metaDias && <p className="text-sm text-warning-600 dark:text-warning-400">No ritmo atual, você ultrapassará a meta. Considere aumentar o ritmo de estudo.</p>}</div></div><div className="card p-6"><h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-4">Progresso por disciplina</h3><div className="space-y-3">{allData.sort((a, b) => b.score - a.score).map(({ discipline, dominioMedio: dom }) => <div key={discipline.id} className="flex items-center gap-3"><span className="text-sm text-ink-700 dark:text-ink-300 w-40 truncate">{discipline.nome}</span><div className="flex-1 h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${dom}%` }} /></div><span className="text-xs text-ink-500 dark:text-ink-400 w-10 text-right">{Math.round(dom)}%</span></div>)}</div></div></div>;
}
