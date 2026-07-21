import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, AlertTriangle, SkipForward } from 'lucide-react'
import {
  fetchDisciplines,
  fetchAllTopics,
  fetchLancamentos,
  fetchSkipCounts,
  fetchQuestaoLancamentos,
} from '../../lib/db'
import type {
  Discipline,
  Topic,
  Lancamento,
  SkipCount,
  QuestaoLancamento,
} from '../../lib/types'
import { computeDisciplineMastery } from '../../lib/curriculum'

export default function DesempenhoView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [skipCounts, setSkipCounts] = useState<SkipCount[]>([])
  const [questoes, setQuestoes] = useState<QuestaoLancamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchDisciplines(),
      fetchAllTopics(),
      fetchLancamentos(),
      fetchSkipCounts(),
      fetchQuestaoLancamentos(),
    ]).then(([d, t, l, s, q]) => {
      setDisciplines(d)
      setTopics(t)
      setLancamentos(l)
      setSkipCounts(s)
      setQuestoes(q)
      setLoading(false)
    })
  }, [])

  const rows = useMemo(() => {
    return disciplines.map((d) => {
      const dm = computeDisciplineMastery(d, topics, lancamentos)
      const skip = skipCounts.find((s) => s.disciplina_id === d.id)
      const discQuestoes = questoes.filter(
        (q) => q.disciplina_id === d.id,
      )
      const totalQ = discQuestoes.reduce((s, q) => s + q.quantidade, 0)
      const acertosQ = discQuestoes.reduce((s, q) => s + q.acertos, 0)
      const apr = totalQ > 0 ? Math.round((acertosQ / totalQ) * 100) : 0
      return {
        discipline: d,
        masteryMedio: dm.masteryMedio,
        topicsTotal: dm.topics.length,
        topicsNaoIniciados: dm.topicsNaoIniciados,
        topicsDominados: dm.topicsDominados,
        topicsResurgir: dm.topicsResurgir.length,
        vezesPulada: skip?.vezes_pulada ?? 0,
        multiplicador: skip ? Number(skip.multiplicador_urgencia) : 1,
        aproveitamento: apr,
        totalQuestoes: totalQ,
      }
    })
  }, [disciplines, topics, lancamentos, skipCounts, questoes])

  if (loading) {
    return <div className="loading-spinner">Carregando desempenho...</div>
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Desempenho</h1>
        <p className="view-subtitle">
          Visão detalhada por disciplina, incluindo evasão e tópicos que
          precisam de ressurgeência.
        </p>
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <Th>Disciplina</Th>
              <Th>Domínio</Th>
              <Th>Tópicos</Th>
              <Th>Não iniciados</Th>
              <Th>Dominados</Th>
              <Th>Resurgir</Th>
              <Th>Questões</Th>
              <Th>Aprov.</Th>
              <Th>
                <SkipForward size={14} style={{ verticalAlign: 'middle' }} />
                {' '}Pulos
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.discipline.id}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <Td>
                  <span style={{ fontWeight: 600 }}>{r.discipline.nome}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginLeft: 6,
                    }}
                  >
                    peso {r.discipline.peso_edital}
                  </span>
                </Td>
                <Td>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--neutral-700)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className={`mastery-bar-fill ${
                          r.masteryMedio < 40
                            ? 'low'
                            : r.masteryMedio < 70
                              ? 'mid'
                              : 'high'
                        }`}
                        style={{
                          width: `${r.masteryMedio}%`,
                          height: '100%',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {Math.round(r.masteryMedio)}%
                    </span>
                  </div>
                </Td>
                <Td>{r.topicsTotal}</Td>
                <Td>
                  {r.topicsNaoIniciados > 0 ? (
                    <span className="badge badge-error">
                      {r.topicsNaoIniciados}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0</span>
                  )}
                </Td>
                <Td>
                  {r.topicsDominados > 0 ? (
                    <span className="badge badge-success">
                      {r.topicsDominados}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0</span>
                  )}
                </Td>
                <Td>
                  {r.topicsResurgir > 0 ? (
                    <span
                      className="badge badge-warning"
                      style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}
                    >
                      <AlertTriangle size={11} />
                      {r.topicsResurgir}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0</span>
                  )}
                </Td>
                <Td>{r.totalQuestoes}</Td>
                <Td>
                  {r.totalQuestoes > 0 ? (
                    <span
                      style={{
                        color:
                          r.aproveitamento >= 60
                            ? 'var(--success-light)'
                            : 'var(--warning-light)',
                        fontWeight: 600,
                      }}
                    >
                      {r.aproveitamento}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </Td>
                <Td>
                  {r.vezesPulada > 0 ? (
                    <span
                      className="badge badge-error"
                      title={`Multiplicador de urgência: ×${r.multiplicador.toFixed(1)}`}
                    >
                      {r.vezesPulada}x
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className="card"
        style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}
      >
        <TrendingUp size={20} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text)' }}>Resurgimento espaçado:</strong>{' '}
          tópicos dominados há mais de 25 dias sem revisão voltam à fila como
          teste de manutenção (5-10 min). Indicados pelo ícone de alerta na coluna
          "Resurgir".
        </div>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '12px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>
      {children}
    </td>
  )
}
