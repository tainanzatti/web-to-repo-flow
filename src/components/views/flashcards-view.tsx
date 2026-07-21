import { useEffect, useState, useCallback } from "react";
import { Layers, Loader2, Plus, RotateCcw, Check, X } from "lucide-react";
import { fetchFlashcards, createFlashcard, reviewFlashcard, type Flashcard } from "../../lib/db";

export function FlashcardsView() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setFlashcards(await fetchFlashcards()); } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createFlashcard({ pergunta, resposta });
    setPergunta(""); setResposta(""); setShowCreate(false);
    load();
  };

  const handleReview = async (id: string, acertou: boolean) => {
    await reviewFlashcard(id, acertou);
    setFlipped(false);
    setCurrentIdx((i) => (i + 1) % flashcards.length);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  const current = flashcards[currentIdx];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100 flex items-center gap-2"><Layers className="w-7 h-7 text-brand-600" />Flashcards</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Revisão espaçada para memorização.</p></div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Novo</button>
      </div>

      {flashcards.length === 0 ? (
        <div className="card p-12 text-center"><Layers className="w-12 h-12 text-ink-300 dark:text-ink-700 mx-auto mb-4" /><p className="text-sm text-ink-400">Nenhum flashcard ainda. Crie o primeiro!</p></div>
      ) : (
        <div className="card p-8 max-w-2xl mx-auto">
          <div className="text-center mb-4"><span className="text-xs text-ink-400">{currentIdx + 1} / {flashcards.length}</span></div>
          <div onClick={() => setFlipped(!flipped)} className="cursor-pointer min-h-[200px] flex items-center justify-center p-8 rounded-xl bg-ink-50 dark:bg-ink-800/50 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
            <p className="text-center text-lg font-medium text-ink-900 dark:text-ink-100">{flipped ? current.resposta : current.pergunta}</p>
          </div>
          <p className="text-xs text-ink-400 text-center mt-2">Clique para {flipped ? "ver a pergunta" : "ver a resposta"}</p>
          {flipped && (
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleReview(current.id, false)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-error-600 dark:text-error-400"><X className="w-4 h-4" />Errei</button>
              <button onClick={() => handleReview(current.id, true)} className="btn-primary flex-1 flex items-center justify-center gap-2"><Check className="w-4 h-4" />Acertei</button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 animate-fadeIn" onClick={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="card p-6 max-w-md w-full animate-slideUp space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">Novo Flashcard</h2>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Pergunta</label><input type="text" required value={pergunta} onChange={(e) => setPergunta(e.target.value)} className="input-base" /></div>
            <div><label className="text-sm font-medium text-ink-700 dark:text-ink-300 mb-1 block">Resposta</label><textarea required value={resposta} onChange={(e) => setResposta(e.target.value)} className="input-base resize-none" rows={3} /></div>
            <div className="flex gap-3"><button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancelar</button><button type="submit" className="btn-primary flex-1">Criar</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
