import { useState, useEffect, useCallback } from 'react'
import { X, RefreshCw, BookOpen, FileText, HelpCircle, Check } from 'lucide-react'
import {
  fetchAiMaterial, upsertAiMaterial, insertLancamento, insertQuestaoLancamento, fetchAllTopics,
} from '../lib/db'
import type { Discipline, Topic } from '../lib/types'
import { callAiFunction, slugForKind } from '../lib/ai-client'

type Aba = 'leiseca' | 'resumo' | 'questoes'

type Props = {
  discipline: Discipline
  topicId: string | null
  onClose: () => void
}

export default function MaterialModal({ discipline, topicId, onClose }: Props) {
  const [aba, setAba] = useState<Aba>('resumo')
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null)
  const [questoes, setQuestoes] = useState<Array<{ pergunta: string; alternativas: string[]; correta: number }>>([])
  const [questaoIdx, setQuestaoIdx] = useState(0)

  useEffect(() => {
    fetchAllTopics().then((topics) => { setTopic(topics.find((t) => t.id === topicId) ?? null) })
  }, [topicId])

  const loadContent = useCallback(async (kind: Aba, force = false) => {
    setLoading(true)
    try {
      if (!force) {
        const cached = await fetchAiMaterial(discipline.id, topicId, kind)
        if (cached) {
          const json = cached.content_json
          if (kind === 'questoes') {
            setQuestoes((json.questoes as Array<{ pergunta: string; alternativas: string[]; correta: number }>) ?? [])
          } else {
            setContent((json.texto as string) ?? (json.conteudo as string) ?? JSON.stringify(json))
          }
          setLoading(false)
          return
        }
      }
      setGenerating(true)
      const result = await callAiFunction(slugForKind(kind), {
        disciplina_id: discipline.id, topico_id: topicId, topico_nome: topic?.nome, disciplina_nome: discipline.nome,
      })
      await upsertAiMaterial(discipline.id, topicId, kind, result)
      if (kind === 'questoes') {
        setQuestoes((result.questoes as Array<{ pergunta: string; alternativas: string[]; correta: number }>) ?? [])
      } else {
        setContent((result.texto as string) ?? (result.conteudo as string) ?? JSON.stringify(result))
      }
    } finally { setLoading(false); setGenerating(false) }
  }, [discipline, topicId, topic])

  useEffect(() => { loadContent(aba) }, [aba, loadContent])

  async function logStudy(mastery: number, minutos: number) {
    await insertLancamento({ disciplina_id: discipline.id, topico_id: topicId, mastery, minutos, is_primeiro_contato: false })
    onClose()
  }

  async function registrarQuestao(acertou: boolean) {
    await insertQuestaoLancamento({
      disciplina_id: discipline.id, topico_id: topicId, quantidade: 1,
      acertos: acertou ? 1 : 0, erros: acertou ? 0 : 1, fonte: 'AI',
    })
    setRespostaSelecionada(null)
    setQuestaoIdx((i) => i + 1)
  }

  const abas: Array<{ key: Aba; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { key: 'leiseca', label: 'Lei Seca', icon: BookOpen },
    { key: 'resumo', label: 'Resumo', icon: FileText },
    { key: 'questoes', label: 'Questões', icon: HelpCircle },
  ]

  const questaoAtual = questoes[questaoIdx]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720, maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 20, marginBottom: 4 }}>{discipline.nome}</h3>
            {topic && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{topic.nome}</p>}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
        </div>
        {!discipline.is_redacao && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {abas.map((a) => {
              const Icon = a.icon
              const active = aba === a.key
              return (
                <button key={a.key} onClick={() => setAba(a.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                  color: active ? 'var(--primary-light)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500, fontSize: 14, marginBottom: '-1px',
                }}>
                  <Icon size={16} />{a.label}
                </button>
              )
            })}
          </div>
        )}
        {loading || generating ? (
          <div className="loading-spinner"><RefreshCw size={24} className="spin" /><span>{generating ? 'Gerando conteúdo...' : 'Carregando...'}</span></div>
        ) : aba === 'questoes' ? (
          <div>
            {questaoAtual ? (
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{questaoAtual.pergunta}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {questaoAtual.alternativas?.map((alt, i) => {
                    const isCorrect = i === questaoAtual.correta
                    const isSelected = respostaSelecionada === i
                    let bg = 'var(--bg-elevated)'
                    if (respostaSelecionada !== null) {
                      if (isCorrect) bg = 'rgba(16,185,129,0.2)'
                      else if (isSelected) bg = 'rgba(239,68,68,0.2)'
                    }
                    return (
                      <button key={i} disabled={respostaSelecionada !== null} onClick={() => setRespostaSelecionada(i)} style={{
                        textAlign: 'left', padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)', background: bg, fontSize: 14,
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)', minWidth: 20 }}>{String.fromCharCode(65 + i)}</span>
                        {alt}
                        {respostaSelecionada !== null && isCorrect && <Check size={16} color="var(--success)" style={{ marginLeft: 'auto' }} />}
                      </button>
                    )
                  })}
                </div>
                {respostaSelecionada !== null && (
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => registrarQuestao(respostaSelecionada === questaoAtual.correta)}>Próxima questão</button>
                )}
              </div>
            ) : (
              <div className="empty-state"><HelpCircle size={32} color="var(--text-muted)" /><p style={{ marginTop: 12 }}>Sem questões geradas.</p></div>
            )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => loadContent('questoes', true)}><RefreshCw size={14} /> Gerar novas</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{content}</div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => loadContent(aba, true)}><RefreshCw size={14} /> Regenerar</button>
          </div>
        )}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={() => logStudy(60, 30)}>Marcar como estudado (30 min)</button>
          <button className="btn btn-ghost btn-sm" onClick={() => logStudy(80, 45)}>Estudei bem (45 min)</button>
        </div>
      </div>
    </div>
  )
}
