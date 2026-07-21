import { useEffect, useState, useCallback } from 'react'
import { RotateCw, Check, X, Layers, RefreshCw } from 'lucide-react'
import {
  fetchFlashcards, fetchDisciplines, fetchAllTopics, updateFlashcardBox,
  insertFlashcards, deleteFlashcardsForTopic, fetchLancamentos,
} from '../../lib/db'
import type { Flashcard, Discipline, Topic, Lancamento } from '../../lib/types'
import { computeTopicMastery } from '../../lib/curriculum'
import { callAiFunction, slugForKind } from '../../lib/ai-client'

const BOX_INTERVALS = [1, 2, 4, 8, 16]

function nextReviewDate(caixa: number): string {
  const days = BOX_INTERVALS[Math.min(caixa - 1, BOX_INTERVALS.length - 1)]
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function FlashcardsView() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const [c, d, t, l] = await Promise.all([
      fetchFlashcards(), fetchDisciplines(), fetchAllTopics(), fetchLancamentos(),
    ])
    setCards(c); setDisciplines(d); setTopics(t); setLancamentos(l)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const today = new Date().toISOString().slice(0, 10)
  const pending = cards.filter((c) => c.proxima_revisao <= today)
  const current = pending[currentIdx]

  async function handleAnswer(lembr: boolean) {
    if (!current) return
    const newCaixa = lembr ? Math.min(current.caixa + 1, 5) : 1
    await updateFlashcardBox(current.id, newCaixa, lembr ? nextReviewDate(newCaixa) : nextReviewDate(1))
    setFlipped(false)
    setCurrentIdx((i) => i + 1)
    await loadData()
  }

  async function generateForTopic(topicoId: string, disciplinaId: string) {
    setGenerating(topicoId)
    try {
      const topic = topics.find((t) => t.id === topicoId)
      if (!topic) return
      await deleteFlashcardsForTopic(topicoId)
      const result = await callAiFunction(slugForKind('flashcards'), {
        disciplina_id: disciplinaId, topico_id: topicoId, topico_nome: topic.nome,
      })
      const pairs = (result.flashcards as Array<{ pergunta: string; resposta: string }>) ?? []
      if (pairs.length > 0) {
        await insertFlashcards(pairs.map((p) => ({
          disciplina_id: disciplinaId, topico_id: topicoId,
          pergunta: p.pergunta, resposta: p.resposta,
        })))
      }
      await loadData()
    } finally { setGenerating(null) }
  }

  const topicsNeedingCards = topics.filter((t) => {
    const tm = computeTopicMastery(t, lancamentos)
    return tm.mastery < 60 && tm.mastery > 0
  })

  if (loading) return <div className="loading-spinner">Carregando flashcards...</div>

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Flashcards</h1>
        <p className="view-subtitle">Repetição espaçada para reforçar tópicos com domínio abaixo de 60%.</p>
      </div>
      {pending.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Layers size={48} color="var(--text-muted)" />
          <h3 style={{ marginTop: 16, marginBottom: 8 }}>Nenhum flashcard pendente hoje</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Tópicos com domínio abaixo de 60% podem gerar flashcards de reforço.</p>
          {topicsNeedingCards.length > 0 && (
            <div style={{ textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>Tópicos que precisam de reforço:</div>
              {topicsNeedingCards.slice(0, 10).map((t) => {
                const tm = computeTopicMastery(t, lancamentos)
                const disc = disciplines.find((d) => d.id === t.disciplina_id)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.nome}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{disc?.nome} · {Math.round(tm.mastery)}%</div>
                    </div>
                    <button className="btn btn-sm btn-primary" disabled={generating === t.id} onClick={() => generateForTopic(t.id, t.disciplina_id)}>
                      {generating === t.id ? <RefreshCw size={14} className="spin" /> : 'Gerar'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cartão {Math.min(currentIdx + 1, pending.length)} de {pending.length}</span>
            <span className="badge badge-primary">Caixa {current?.caixa ?? 1}</span>
          </div>
          {currentIdx >= pending.length ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <Check size={48} color="var(--success)" />
              <h3 style={{ marginTop: 16 }}>Todos os flashcards de hoje revisados!</h3>
              <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => setCurrentIdx(0)}>
                <RotateCw size={16} /> Recomeçar
              </button>
            </div>
          ) : (
            <div
              className="card"
              onClick={() => setFlipped(!flipped)}
              style={{
                minHeight: 280, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
                textAlign: 'center', background: flipped ? 'var(--bg-elevated)' : 'var(--bg-card)',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {flipped ? 'Resposta' : 'Pergunta'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, maxWidth: 480 }}>
                {flipped ? current.resposta : current.pergunta}
              </div>
              {!flipped && <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>Toque para revelar</div>}
            </div>
          )}
          {currentIdx < pending.length && flipped && (
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button className="btn btn-danger" onClick={() => handleAnswer(false)}><X size={18} /> Não lembrei</button>
              <button className="btn btn-primary" onClick={() => handleAnswer(true)}><Check size={18} /> Lembrei</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
