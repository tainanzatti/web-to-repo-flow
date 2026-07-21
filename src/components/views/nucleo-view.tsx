import { useEffect, useState, useCallback } from 'react'
import { Lock, ChevronDown, ChevronUp, SkipForward, Clock, BookOpen, AlertTriangle } from 'lucide-react'
import {
  fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchSkipCounts,
  upsertSkipCount, resetSkipCount, insertLancamento,
} from '../../lib/db'
import type { Discipline, Topic, Lancamento, SkipCount } from '../../lib/types'
import {
  computeAllScores, computeDisciplineMastery, tetoTopicosPorDesempenho,
  selectTopicsForSession, nextSkipMultiplier, type DisciplineScore,
} from '../../lib/curriculum'

type Props = { onStudy: (disciplineId: string, topicId: string | null) => void }

export default function NucleoView({ onStudy }: Props) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [skipCounts, setSkipCounts] = useState<SkipCount[]>([])
  const [scores, setScores] = useState<DisciplineScore[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const [d, t, l, s] = await Promise.all([
      fetchDisciplines(), fetchAllTopics(), fetchLancamentos(), fetchSkipCounts(),
    ])
    setDisciplines(d); setTopics(t); setLancamentos(l); setSkipCounts(s)
    setScores(computeAllScores(d, t, l, s))
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const activeId = scores.length > 0 ? scores[0].discipline.id : null

  function toggleExpand(id: string) {
    if (id !== activeId) return
    setExpandedId(expandedId === id ? null : id)
  }

  async function handleSkip() {
    if (!activeId) return
    const existing = skipCounts.find((s) => s.disciplina_id === activeId)
    const currentMult = existing ? Number(existing.multiplicador_urgencia) : 1
    const currentVezes = existing ? existing.vezes_pulada : 0
    await upsertSkipCount(activeId, currentVezes + 1, nextSkipMultiplier(currentMult))
    setShowSkipConfirm(false)
    setExpandedId(null)
    await loadData()
  }

  if (loading) return <div className="loading-spinner">Carregando Núcleo...</div>

  const activeScore = scores[0]
  const activeDiscipline = activeScore?.discipline
  const activeMastery = activeDiscipline
    ? computeDisciplineMastery(activeDiscipline, topics, lancamentos)
    : null

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Núcleo de Estudos</h1>
        <p className="view-subtitle">
          A disciplina em destaque é a que mais precisa da sua atenção agora. As demais ficam bloqueadas até você dominar a ativa.
        </p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {scores.map((score) => {
          const isActive = score.discipline.id === activeId
          const isExpanded = expandedId === score.discipline.id
          const isRedacao = score.discipline.is_redacao
          const dm = computeDisciplineMastery(score.discipline, topics, lancamentos)
          return (
            <div
              key={score.discipline.id}
              className="card slide-up"
              style={{
                opacity: isActive ? 1 : 0.6,
                borderColor: isActive ? 'var(--primary)' : isRedacao ? 'var(--warning)' : 'var(--border)',
                cursor: isActive ? 'pointer' : 'default',
                position: 'relative',
              }}
              onClick={() => toggleExpand(score.discipline.id)}
            >
              {isRedacao && (
                <span className="badge badge-warning" style={{ position: 'absolute', top: 12, right: 12 }}>Redação</span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {!isActive && <Lock size={16} color="var(--text-muted)" />}
                {isActive && <span className="badge badge-primary">Ativa</span>}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, paddingRight: isRedacao ? 60 : 0 }}>
                {score.discipline.nome}
              </h3>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>Domínio</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(score.masteryMedio)}%</span>
                </div>
                <div className="mastery-bar">
                  <div
                    className={`mastery-bar-fill ${score.masteryMedio < 40 ? 'low' : score.masteryMedio < 70 ? 'mid' : 'high'}`}
                    style={{ width: `${score.masteryMedio}%` }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} />
                {score.diasSemRevisao !== null
                  ? `há ${score.diasSemRevisao} ${score.diasSemRevisao === 1 ? 'dia' : 'dias'} sem revisão`
                  : 'nunca revisada'}
              </div>
              {isActive && !isExpanded && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary-light)', fontSize: 13 }}>
                  Expandir <ChevronDown size={16} />
                </div>
              )}
              {isExpanded && dm && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text)' }}>Por que esta disciplina agora:</strong><br />
                    {score.motivo}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                      Tópicos ({dm.topics.length})
                    </div>
                    {(() => {
                      const teto = tetoTopicosPorDesempenho(score.masteryMedio)
                      const selected = selectTopicsForSession(dm, teto)
                      const toShow = selected.length > 0 ? selected : dm.topics.slice(0, teto)
                      return toShow.map((tm) => (
                        <div key={tm.topic.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tm.topic.nome}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {tm.isPrimeiroContato ? 'Primeiro contato' : `${Math.round(tm.mastery)}% · ${tm.tier}`}
                            </div>
                          </div>
                          <button className="btn btn-sm btn-ghost" onClick={() => onStudy(score.discipline.id, tm.topic.id)} style={{ marginLeft: 8, flexShrink: 0 }}>
                            <BookOpen size={14} />
                          </button>
                        </div>
                      ))
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => onStudy(score.discipline.id, null)}>Estudar disciplina</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowSkipConfirm(true)}>
                      <SkipForward size={14} /> Pular
                    </button>
                    <button onClick={() => setExpandedId(null)} style={{ marginLeft: 'auto', color: 'var(--text-muted)', padding: 8 }}>
                      <ChevronUp size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showSkipConfirm && (
        <div className="modal-overlay" onClick={() => setShowSkipConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertTriangle size={24} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3>Pular esta disciplina?</h3>
                <p>Pular não te livra dela — ela volta com prioridade maior e fica registrado. A próxima disciplina mais urgente assume o lugar de ativa.</p>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowSkipConfirm(false)}>Cancelar</button>
              <button className="btn btn-warning" onClick={handleSkip}>Sim, pular</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
