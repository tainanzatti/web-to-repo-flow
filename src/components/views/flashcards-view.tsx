import { useEffect, useState, useCallback } from "react";
import { Layers, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { fetchFlashcards, updateFlashcardBox, type FlashcardRow } from "../../lib/db";
import { LEITNER_BOXES } from "../../lib/curriculum";

export function FlashcardsView() {
  const [cards, setCards] = useState<FlashcardRow[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => { const data = await fetchFlashcards(); setCards(data); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const current = cards[index];
  const handleReview = async (acertou: boolean) => {
    if (!current) return;
    const newBox = acertou ? Math.min(current.caixa + 1, LEITNER_BOXES.length) : 1;
    await updateFlashcardBox(current.id, newBox);
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(cards.length, 1));
    await load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (cards.length === 0) return <div className="text-center py-20"><Layers className="w-12 h-12 text-ink-300 dark:text-ink-700 mx-auto mb-4" /><h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">Nenhum flashcard ainda</h2><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Flashcards serão gerados automaticamente quando você estudar tópicos no Núcleo.</p></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">Flashcards</h1><p className="text-sm text-ink-500 dark:text-ink-400 mt-1">Repetição espaçada (Leitner). Cartão {index + 1} de {cards.length}.</p></div>
      <div className="flex justify-center">
        <div onClick={() => setFlipped(!flipped)} className="card w-full max-w-lg min-h-[240px] p-8 flex items-center justify-center cursor-pointer select-none hover:shadow-md transition-shadow animate-flipIn" key={current?.id}>
          {flipped ? <div className="text-center"><p className="text-xs text-ink-400 mb-2">Resposta</p><p className="text-lg text-ink-900 dark:text-ink-100 font-medium">{current?.resposta}</p></div> : <div className="text-center"><p className="text-xs text-ink-400 mb-2">Pergunta</p><p className="text-lg text-ink-900 dark:text-ink-100 font-medium">{current?.pergunta}</p><p className="text-xs text-ink-400 mt-4">Clique para virar</p></div>}
        </div>
      </div>
      {flipped && <div className="flex justify-center gap-3 animate-fadeIn"><button onClick={() => handleReview(false)} className="btn-danger"><X className="w-4 h-4" /> Errei</button><button onClick={() => handleReview(true)} className="btn-primary"><Check className="w-4 h-4" /> Acertei</button></div>}
      <div className="flex items-center justify-center gap-2 text-sm text-ink-500 dark:text-ink-400"><RotateCcw className="w-4 h-4" />Caixa {current?.caixa ?? 1} de {LEITNER_BOXES.length} · próxima revisão em {LEITNER_BOXES[(current?.caixa ?? 1) - 1]} dias</div>
    </div>
  );
}
