import { useState, useEffect, useCallback } from "react";
import { Layers, RotateCcw, Check, X, Loader2, Inbox } from "lucide-react";
import { fetchFlashcardsPendentes, fetchAllFlashcards, updateFlashcardLeitner, insertFlashcards, deleteFlashcardsByTopico, fetchDisciplines, fetchTopics, fetchLancamentos, type FlashcardRow } from "../../lib/db";
import { computeDisciplinaData, topicosParaFlashcards } from "../../lib/curriculum";
import { ensureFlashcardsForTopic } from "../../lib/ai.functions";

export default function FlashcardsView() {
  const [pendentes, setPendentes] = useState<FlashcardRow[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [respondidos, setRespondidos] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const syncFlashcards = useCallback(async () => {
    setSyncing(true);
    try {
      const [discs, tops, lancs, existing] = await Promise.all([fetchDisciplines(), fetchTopics(), fetchLancamentos(), fetchAllFlashcards()]);
      const discData = discs.map((d) => { const topicsForDisc = tops.filter((t) => t.disciplina_id === d.id); return computeDisciplinaData(d, topicsForDisc, lancs); });
      const needsFlashcards = topicosParaFlashcards(discData);
      const existingTopicoIds = new Set(existing.map((f) => f.topico_id));
      for (const t of needsFlashcards) {
        if (!existingTopicoIds.has(t.topicoId)) {
          const disc = discData.find((d) => d.disciplina.id === t.disciplinaId);
          if (!disc) continue;
          try { await ensureFlashcardsForTopic({ topicoId: t.topicoId, topicoNome: t.topicoNome, disciplinaId: t.disciplinaId, disciplinaNome: disc.disciplina.nome }); }
          catch (err) { console.error(`Erro ao gerar flashcards para ${t.topicoNome}:`, err); }
        }
      }
      const needsSet = new Set(needsFlashcards.map((t) => t.topicoId));
      for (const f of existing) { if (!needsSet.has(f.topico_id)) { await deleteFlashcardsByTopico(f.topico_id); } }
    } catch (err) { console.error("Erro ao sincronizar flashcards:", err); }
    finally { setSyncing(false); }
  }, []);

  const loadFlashcards = useCallback(async () => {
    setLoading(true);
    try { await syncFlashcards(); const data = await fetchFlashcardsPendentes(); setPendentes(data); setCurrentIdx(0); setRevealed(false); setRespondidos(0); setAcertos(0); }
    catch (err) { console.error("Erro ao carregar flashcards:", err); }
    finally { setLoading(false); }
  }, [syncFlashcards]);

  useEffect(() => { loadFlashcards(); }, [loadFlashcards]);

  const handleResposta = async (lembrei: boolean) => {
    const card = pendentes[currentIdx];
    if (!card) return;
    await updateFlashcardLeitner(card.id, lembrei);
    setRespondidos((r) => r + 1);
    if (lembrei) setAcertos((a) => a + 1);
    setRevealed(false);
    setCurrentIdx((i) => i + 1);
  };

  const currentCard = pendentes[currentIdx];
  const isDone = currentIdx >= pendentes.length;

  if (loading) return <div className="flex flex-col items-center justify-center h-96 gap-3"><Loader2 className="w-6 h-6 animate-spin text-ink-400" />{syncing && <span className="text-sm text-ink-400">Sincronizando flashcards...</span>}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2"><Layers className="w-6 h-6 text-brand-600" /> Flashcards</h1>
        <p className="text-sm text-ink-500 mt-1">Repetição espaçada tipo Leitner. Cartões são gerados automaticamente para tópicos com domínio abaixo de 60%.</p>
      </div>

      {pendentes.length === 0 ? (
        <div className="card p-12 text-center"><Inbox className="w-12 h-12 mx-auto text-ink-300 mb-3" /><h3 className="font-semibold text-ink-700">Nenhum cartão pendente</h3><p className="text-sm text-ink-500 mt-1">Cartões aparecem aqui automaticamente quando um tópico está abaixo de 60% de domínio. Volte depois de estudar.</p></div>
      ) : isDone ? (
        <div className="card p-8 text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-4"><Check className="w-8 h-8 text-success-600" /></div>
          <h3 className="text-xl font-bold text-ink-900">Revisão concluída!</h3>
          <p className="text-sm text-ink-500 mt-2">{respondidos} cartão(s) respondido(s) — {acertos} acerto(s) e {respondidos - acertos} erro(s)</p>
          <p className="text-xs text-ink-400 mt-1">Aproveitamento: {respondidos > 0 ? Math.round((acertos / respondidos) * 100) : 0}%</p>
          <button onClick={loadFlashcards} className="btn-primary mt-6"><RotateCcw className="w-4 h-4" /> Recarregar</button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 text-sm text-ink-500"><span>Cartão {currentIdx + 1} de {pendentes.length}</span><span>Caixa {currentCard.caixa}/5</span></div>
          <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-6"><div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${(currentIdx / pendentes.length) * 100}%` }} /></div>
          <div className="card p-8 min-h-[280px] flex flex-col items-center justify-center text-center cursor-pointer select-none animate-flipIn" onClick={() => setRevealed(!revealed)} key={currentCard.id}>
            {!revealed ? (<><span className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-4">Pergunta</span><p className="text-lg font-medium text-ink-900">{currentCard.pergunta}</p><p className="text-xs text-ink-400 mt-6">Toque para revelar a resposta</p></>) : (<><span className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-4">Resposta</span><p className="text-lg font-medium text-ink-900">{currentCard.resposta}</p><p className="text-xs text-ink-400 mt-6">Você lembrou?</p></>)}
          </div>
          {revealed && (
            <div className="flex gap-3 mt-6 animate-fadeIn">
              <button onClick={() => handleResposta(false)} className="btn-danger flex-1"><X className="w-5 h-5" /> Não lembrei</button>
              <button onClick={() => handleResposta(true)} className="btn-primary flex-1 bg-success-600 hover:bg-success-700 shadow-success-600/20"><Check className="w-5 h-5" /> Lembrei</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
