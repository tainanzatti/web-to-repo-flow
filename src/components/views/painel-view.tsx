import { useEffect, useState, useMemo } from 'react'
import { Clock, Target, TrendingUp, Layers, Calendar, ArrowRight, Info } from 'lucide-react'
import {
  fetchDisciplines, fetchAllTopics, fetchLancamentos, fetchSkipCounts,
  fetchStudyTimeDaily, fetchQuestaoLancamentos, fetchFlashcards, fetchProfile,
} from '../../lib/db'
import type {
  Discipline, Topic, Lancamento, SkipCount, StudyTimeDaily,
  QuestaoLancamento, Flashcard, Profile,
} from '../../lib/types'
import { computeAllScores, computeDisciplineMastery, type DisciplineScore } from '../../lib/curriculum'

type Props = { onNavigate: (v: 'nucleo' | 'flashcards') => void }

export default function PainelView({ onNavigate }: Props) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [skipCounts, setSkipCounts] = useState<SkipCount[]>([])
  const [studyTime, setStudyTime] = useState<StudyTimeDaily[]>([])
  const [questoes, setQuestoes] = useState<QuestaoLancamento[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [horasSlider, setHorasSlider] = useState(2)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchDisciplines(), fetchAllTopics(), fetchLancamentos(), fetchSkipCounts(),
      fetchStudyTimeDaily(), fetchQuestaoLancamentos(), fetchFlashcards(), fetchProfile(),
    ]).then(([d, t, l, s, st, q, f, p]) => {
      setDisciplines(d); setTopics(t); setLancamentos(l); setSkipCounts(s)
      setStudyTime(st); setQuestoes(q); setFlashcards(f); setProfile(p)
      setLoading(false)
    })
  }, [])

  const scores = useMemo(
    () => computeAllScores(disciplines, topics, lancamentos, skipCounts),
    [disciplines, topics, lancamentos, skipCounts],
  )

  const today = new Date().toISOString().slice(0, 10)
  const todaySeconds = studyTime.find((s) => s.data === today)?.tempo_segundos ?? 0
  const todayHours = todaySeconds / 3600
  const totalHours = studyTime.reduce((s, d) => s + d.tempo_segundos, 0) / 3600
  const totalQuestoes = questoes.reduce((s, q) => s + q.quantidade, 0)
  const totalAcertos = questoes.reduce((s, q) => s + q.acertos, 0)
  const aproveitamento = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0

  const allMasteries = disciplines.map((d) => computeDisciplineMastery(d, topics, lancamentos))
  const bomOuOtimo = allMasteries.filter((dm) => dm.masteryMedio >= 60).length
  const pctBomOuOtimo = disciplines.length > 0 ? Math.round((bomOuOtimo / disciplines.length) * 100) : 0
  const todayFlashcards = flashcards.filter((c) => c.proxima_revisao <= today).length

  const revisoesVencendo = useMemo(() => {
    return allMasteries
      .flatMap((dm) => dm.topics
        .filter((tm) => !tm.isPrimeiroContato && tm.daysSinceReview !== null && tm.daysSinceReview >= 7)
        .map((tm) => ({ dm, tm })))
      .sort((a, b) => (b.tm.daysSinceReview ?? 0) - (a.tm.daysSinceReview ?? 0))
      .slice(0, 5)
  }, [allMasteries])

  const topicosNaoTocados = allMasteries.reduce((s, dm) => s + dm.topicsNaoIniciados, 0)

  const ritmoMedio = useMemo(() => {
    const ultimos30 = studyTime.slice(0, 30)
    if (ultimos30.length === 0) return 0
    const diasAtivos = ultimos30.filter((d) => d.tempo_segundos > 0).length
    if (diasAtivos === 0) return 0
    const mediaMinutos = ultimos30.reduce((s, d) => s + d.tempo_segundos, 0) / diasAtivos / 60
    return mediaMinutos / 30
  }, [studyTime])

  const diasParaCobrir = ritmoMedio > 0 ? Math.ceil(topicosNaoTocados / ritmoMedio) : 0

  const minutosPorTopicoNovo = useMemo(() => {
    const primeiroContato = lancamentos.filter((l) => l.is_primeiro_contato)
    if (primeiroContato.length === 0) return 30
    return Math.round(primeiroContato.reduce((s, l) => s + l.minutos, 0) / primeiroContato.length)
  }, [lancamentos])

  const diasHipoteticos = ritmoMedio > 0
    ? Math.ceil((topicosNaoTocados * minutosPorTopicoNovo) / (horasSlider * 60) / Math.max(ritmoMedio, 0.5))
    : 0

  const activeScore: DisciplineScore | undefined = scores[0]

  if (loading) return <div className="loading-spinner">Carregando painel...</div>

  const nome = profile?.nome ?? 'Concurseiro'

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Olá, {nome.split(' ')[0]}</h1>
        <p className="view-subtitle">
          {activeScore ? `${activeScore.discipline.nome} é a disciplina que mais precisa de você agora — ${activeScore.motivo}.` : 'Comece estudando a disciplina ativa no Núcleo.'}
        </p>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 24 }}>
        <StatCard icon={Clock} label="Horas hoje" value={todayHours.toFixed(1) + 'h'} color="var(--primary)" />
        <StatCard icon={Clock} label="Horas totais" value={totalHours.toFixed(0) + 'h'} color="var(--accent)" />
        <StatCard icon={TrendingUp} label="Aproveitamento" value={aproveitamento + '%'} color="var(--success)" />
        <StatCard icon={Target} label="Domínio bom/ótimo" value={pctBomOuOtimo + '%'} color="var(--warning)" />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Prévia do Núcleo</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('nucleo')}>Ver tudo <ArrowRight size={14} /></button>
          </div>
          {scores.slice(0, 4).map((s) => (
            <div key={s.discipline.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{s.discipline.nome}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 60, height: 6, borderRadius: 3, background: 'var(--neutral-700)', overflow: 'hidden' }}>
                  <div className={`mastery-bar-fill ${s.masteryMedio < 40 ? 'low' : s.masteryMedio < 70 ? 'mid' : 'high'}`} style={{ width: `${s.masteryMedio}%`, height: '100%' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>{Math.round(s.masteryMedio)}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Revisões vencendo</h3>
          {revisoesVencendo.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma revisão vencida. Tudo em dia!</p>
          ) : (
            revisoesVencendo.map(({ tm }) => (
              <div key={tm.topic.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{tm.topic.nome}</span>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{tm.daysSinceReview}d</span>
              </div>
            ))
          )}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="var(--primary-light)" />
            <span style={{ fontSize: 14 }}>{todayFlashcards} flashcard{todayFlashcards !== 1 ? 's' : ''} pendente{todayFlashcards !== 1 ? 's' : ''} hoje</span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onNavigate('flashcards')}>Ir <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Calendar size={20} color="var(--accent)" />
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Projeção de cobertura</h3>
        </div>
        {topicosNaoTocados > 0 ? (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 20 }}>
              No seu ritmo atual, você verá todos os {topicosNaoTocados} tópicos restantes pela primeira vez em{' '}
              <strong style={{ color: 'var(--text)' }}>{diasParaCobrir > 0 ? `${diasParaCobrir} dias` : '—'}</strong>.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                Calculadora: e se eu estudar {horasSlider}h por dia?
              </label>
              <input type="range" min={1} max={8} step={1} value={horasSlider} onChange={(e) => setHorasSlider(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>1h/dia</span><span>8h/dia</span>
              </div>
            </div>
            {diasHipoteticos > 0 && (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 16, fontSize: 15 }}>
                Nesse ritmo de <strong>{horasSlider}h/dia</strong>, levaria{' '}
                <strong style={{ color: 'var(--primary-light)' }}>{diasHipoteticos} dias</strong> para cobrir todos os tópicos pela primeira vez.
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--text-muted)' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Estimativa baseada no seu ritmo médio real de estudo. Não considera revisões, apenas o primeiro contato com cada tópico.</span>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--success)', fontSize: 15 }}>Você já tocou todos os tópicos pelo menos uma vez. Foque nas revisões!</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number; color?: string }>
  label: string; value: string; color: string
}) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <Icon size={24} color={color} />
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}
