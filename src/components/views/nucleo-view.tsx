import { useEffect, useState, useCallback, useRef } from "react";
import { BookOpen, CheckCircle2, Circle, Loader2, ChevronRight, Filter, AlertCircle } from "lucide-react";
import { fetchDisciplinas, toggleTopicoEstudado, type Disciplina, type Topico } from "../../lib/db";
import { useTimer } from "../../lib/timer-context";
import { recordStudyTime } from "../../lib/db";

export function NucleoView() {
  const { start } = useTimer();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCompleteSuggestion, setShowCompleteSuggestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDisciplinas();
      setDisciplinas(data);
      if (!selectedDisciplinaId && data.length > 0) setSelectedDisciplinaId(data[0].id);
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }, [selectedDisciplinaId]);

  useEffect(() => { load(); }, [load]);

  // Preserve scroll position across re-renders
  useEffect(() => {
    if (scrollRef.current && scrollPosition.current > 0) {
      scrollRef.current.scrollTop = scrollPosition.current;
    }
  });

  const selectedDisciplina = disciplinas.find((d) => d.id === selectedDisciplinaId) ?? null;

  const filteredTopicos = (selectedDisciplina?.topicos ?? []).filter((t) => {
    if (filter === "pending") return !t.estudado;
    if (filter === "done") return t.estudado;
    return true;
  });

  const handleToggleTopico = async (topico: Topico) => {
    // Save scroll position
    if (scrollRef.current) scrollPosition.current = scrollRef.current.scrollTop;

    setTogglingId(topico.id);
    const novoStatus = !topico.estudado;
    try {
      await toggleTopicoEstudado(topico.id, novoStatus);
      // Update only the toggled topic in state - keep disciplina selected
      setDisciplinas((prev) => prev.map((d) => ({
        ...d,
        topicos: d.topicos?.map((t) => t.id === topico.id ? { ...t, estudado: novoStatus } : t),
      })));

      // Record study time
      if (novoStatus) {
        await recordStudyTime(selectedDisciplinaId, topico.id, 15);
        start();
      }

      // Check if all topics in current disciplina are now done
      if (novoStatus && selectedDisciplina) {
        const allDone = selectedDisciplina.topicos?.every((t) => t.id === topico.id ? true : t.estudado);
        if (allDone && selectedDisciplina.topicos && selectedDisciplina.topicos.length > 0) {
          // Find next disciplina with pending topics
          const nextDisc = disciplinas.find((d) =>
            d.id !== selectedDisciplina.id &&
            d.topicos?.some((t) => !t.estudado)
          );
          if (nextDisc) {
            setShowCompleteSuggestion(nextDisc.id);
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setTogglingId(null);
  };

  const handleGoToSuggested = () => {
    if (showCompleteSuggestion) {
      setSelectedDisciplinaId(showCompleteSuggestion);
      scrollPosition.current = 0;
    }
    setShowCompleteSuggestion(null);
  };

  const handleSelectDisciplina = (id: string) => {
    setSelectedDisciplinaId(id);
    scrollPosition.current = 0;
    setShowCompleteSuggestion(null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (error) return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Núcleo</h1></div><div className="card p-6 text-center text-error-600 dark:text-error-400">{error}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><BookOpen className="w-7 h-7 text-brand-600" />Núcleo de Estudos</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Acompanhe seu progresso por disciplina e tópico.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Disciplinas list */}
        <div className="card p-4 lg:col-span-1">
          <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-3">Disciplinas</h2>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto" ref={scrollRef}>
            {disciplinas.map((d) => {
              const total = d.topicos?.length ?? 0;
              const done = d.topicos?.filter((t) => t.estudado).length ?? 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isActive = d.id === selectedDisciplinaId;
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectDisciplina(d.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${isActive ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" : "hover:bg-ink-50 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-300"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{d.nome}</span>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-ink-400 shrink-0">{done}/{total}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tópicos */}
        <div className="card p-4 lg:col-span-2">
          {selectedDisciplina ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100">{selectedDisciplina.nome}</h2>
                <div className="flex items-center gap-1">
                  <Filter className="w-4 h-4 text-ink-400" />
                  {(["all", "pending", "done"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${filter === f ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300" : "text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800"}`}
                    >
                      {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Concluídos"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {filteredTopicos.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-10 h-10 text-success-500 mx-auto mb-3" />
                    <p className="text-sm text-ink-400">{filter === "done" ? "Nenhum tópico concluído ainda." : filter === "pending" ? "Todos os tópicos concluídos!" : "Nenhum tópico nesta disciplina."}</p>
                  </div>
                ) : (
                  filteredTopicos.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleToggleTopico(t)}
                      disabled={togglingId === t.id}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${t.estudado ? "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800" : "bg-white dark:bg-ink-900 border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700"}`}
                    >
                      {togglingId === t.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-brand-600 shrink-0" />
                      ) : t.estudado ? (
                        <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-ink-300 dark:text-ink-600 shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${t.estudado ? "text-success-700 dark:text-success-300 line-through" : "text-ink-800 dark:text-ink-200"}`}>{t.nome}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12"><AlertCircle className="w-10 h-10 text-ink-300 dark:text-ink-700 mx-auto mb-3" /><p className="text-sm text-ink-400">Selecione uma disciplina.</p></div>
          )}
        </div>
      </div>

      {/* Completion suggestion modal */}
      {showCompleteSuggestion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 animate-fadeIn" onClick={() => setShowCompleteSuggestion(null)}>
          <div className="card p-6 max-w-sm w-full animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-success-500" /></div>
              <div>
                <h3 className="text-base font-bold text-ink-900 dark:text-ink-100">Disciplina concluída!</h3>
                <p className="text-sm text-ink-500 dark:text-ink-400">Você concluiu todos os tópicos.</p>
              </div>
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-400 mb-4">Deseja ir para a próxima disciplina com tópicos pendentes?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteSuggestion(null)} className="btn-secondary flex-1">Permanecer</button>
              <button onClick={handleGoToSuggested} className="btn-primary flex-1">Ir para próxima</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
