import { useEffect, useState, useCallback } from "react";
import { PenTool, Loader2, Sparkles, Check, X, AlertCircle, ChevronRight } from "lucide-react";
import { fetchQuestoes, registrarRespostaQuestao, type Questao } from "../../lib/db";
import { aiGerarQuestoes, aiExplicarAlternativa, type QuestaoGerada } from "../../lib/ai.service";

export function QuestoesView() {
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | "E" | null>(null);
  const [answered, setAnswered] = useState(false);
  const [explicacao, setExplicacao] = useState<string | null>(null);
  const [loadingExplicacao, setLoadingExplicacao] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disciplinaGerar, setDisciplinaGerar] = useState("");
  const [topicoGerar, setTopicoGerar] = useState("");
  const [showGerar, setShowGerar] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setQuestoes(await fetchQuestoes(20)); } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = questoes[currentIdx];

  const handleAnswer = async (alt: "A" | "B" | "C" | "D" | "E") => {
    if (answered || !current) return;
    setSelected(alt);
    setAnswered(true);
    const correta = alt === current.resposta_correta;
    await registrarRespostaQuestao(current.id, alt, correta);
  };

  const handleExplicar = async () => {
    if (!current || !selected) return;
    setLoadingExplicacao(true);
    try {
      const txt = await aiExplicarAlternativa(current.enunciado, selected, selected === current.resposta_correta, current.explicacao);
      setExplicacao(txt);
    } catch (err) { setError((err as Error).message); }
    setLoadingExplicacao(false);
  };

  const handleNext = () => {
    setSelected(null); setAnswered(false); setExplicacao(null);
    setCurrentIdx((i) => (i + 1) % questoes.length);
  };

  const handleGerar = async () => {
    setGerando(true); setError(null);
    try {
      const geradas = await aiGerarQuestoes(disciplinaGerar, topicoGerar, 5);
      // Convert generated questions to Questao format and prepend
      const novas: Questao[] = geradas.map((q: QuestaoGerada, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        enunciado: q.enunciado,
        alternativa_a: q.alternativa_a, alternativa_b: q.alternativa_b, alternativa_c: q.alternativa_c,
        alternativa_d: q.alternativa_d, alternativa_e: q.alternativa_e,
        resposta_correta: q.resposta_correta, explicacao: q.explicacao,
        criado_em: new Date().toISOString(),
      }));
      setQuestoes([...novas, ...questoes]);
      setCurrentIdx(0); setSelected(null); setAnswered(false); setExplicacao(null);
      setShowGerar(false);
    } catch (err) { setError((err as Error).message); }
    setGerando(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const alternativas: { key: "A" | "B" | "C" | "D" | "E"; text: string }[] = current ? [
    { key: "A", text: current.alternativa_a }, { key: "B", text: current.alternativa_b },
    { key: "C", text: current.alternativa_c }, { key: "D", text: current.alternativa_d },
    { key: "E", text: current.alternativa_e },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><PenTool className="w-7 h-7 text-brand-600" />Questões</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Treine com questões no estilo AOCP.</p></div>
        <button onClick={() => setShowGerar(true)} className="btn-primary flex items-center gap-2"><Sparkles className="w-4 h-4" />Gerar com IA</button>
      </div>

      {error && <div className="card p-4 text-sm text-error-600 dark:text-error-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}

      {questoes.length === 0 ? (
        <div className="card p-12 text-center"><PenTool className="w-12 h-12 text-ink-300 dark:text-ink-700 mx-auto mb-4" /><p className="text-sm text-ink-400">Nenhuma questão disponível. Gere questões com IA!</p></div>
      ) : (
        <div className="card p-6 max-w-3xl mx-auto space-y-4">
          <div className="text-center"><span className="text-xs text-ink-400">{currentIdx + 1} / {questoes.length}</span></div>
          <p className="text-base font-medium text-ink-900 dark:text-ink-100">{current.enunciado}</p>
          <div className="space-y-2">
            {alternativas.map((alt) => {
              const isCorrect = answered && alt.key === current.resposta_correta;
              const isWrong = answered && selected === alt.key && alt.key !== current.resposta_correta;
              return (
                <button key={alt.key} onClick={() => handleAnswer(alt.key)} disabled={answered}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${isCorrect ? "bg-success-50 dark:bg-success-900/20 border-success-300 dark:border-success-700" : isWrong ? "bg-error-50 dark:bg-error-900/20 border-error-300 dark:border-error-700" : "border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700"} ${answered ? "cursor-default" : "cursor-pointer"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? "bg-success-500 text-white" : isWrong ? "bg-error-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-500"}`}>{alt.key}</span>
                  <span className="text-sm text-ink-800 dark:text-ink-200 flex-1">{alt.text}</span>
                  {isCorrect && <Check className="w-4 h-4 text-success-500" />}{isWrong && <X className="w-4 h-4 text-error-500" />}
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="space-y-3">
              {current.explicacao && <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20"><p className="text-sm text-ink-700 dark:text-ink-300">{current.explicacao}</p></div>}
              {!explicacao && <button onClick={handleExplicar} disabled={loadingExplicacao} className="btn-secondary flex items-center gap-2">{loadingExplicacao ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Explicar com IA</button>}
              {explicacao && <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20"><p className="text-sm text-ink-700 dark:text-ink-300">{explicacao}</p></div>}
              <button onClick={handleNext} className="btn-primary flex items-center gap-2">Próxima <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {showGerar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 animate-fadeIn" onClick={() => setShowGerar(false)}>
          <div className="card p-6 max-w-md w-full animate-slideUp space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">Gerar Questões com IA</h2>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Disciplina</label><input type="text" value={disciplinaGerar} onChange={(e) => setDisciplinaGerar(e.target.value)} className="input-base" placeholder="Ex: Direito Constitucional" /></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Tópico</label><input type="text" value={topicoGerar} onChange={(e) => setTopicoGerar(e.target.value)} className="input-base" placeholder="Ex: Direitos fundamentais" /></div>
            <div className="flex gap-3"><button onClick={() => setShowGerar(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={handleGerar} disabled={gerando || !disciplinaGerar || !topicoGerar} className="btn-primary flex-1 flex items-center justify-center gap-2">{gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Gerar 5 questões</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
