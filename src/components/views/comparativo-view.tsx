import { useEffect, useState, useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { fetchDisciplines, fetchAllTopics, fetchLancamentos } from '../../lib/db'
import type { Discipline, Topic, Lancamento } from '../../lib/types'
import { computeDisciplineMastery } from '../../lib/curriculum'

export default function ComparativoView() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchDisciplines(),
      fetchAllTopics(),
      fetchLancamentos(),
    ]).then(([d, t, l]) => {
      setDisciplines(d)
      setTopics(t)
      setLancamentos(l)
      setLoading(false)
    })
  }, [])

  const chartData = useMemo(() => {
    return disciplines
      .filter((d) => !d.is_redacao)
      .map((d) => {
        const dm = computeDisciplineMastery(d, topics, lancamentos)
        return {
          subject: d.nome.length > 18 ? d.nome.slice(0, 16) + '…' : d.nome,
          domínio: Math.round(dm.masteryMedio),
          peso: d.peso_edital * 10,
        }
      })
  }, [disciplines, topics, lancamentos])

  if (loading) {
    return <div className="loading-spinner">Carregando comparativo...</div>
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">Comparativo</h1>
        <p className="view-subtitle">
          Radar de domínio entre disciplinas (azul) sobreposto ao peso no edital
          (verde).
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <ResponsiveContainer width="100%" height={450}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              stroke="var(--border)"
            />
            <Radar
              name="Domínio"
              dataKey="domínio"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.3}
            />
            <Radar
              name="Peso edital (×10)"
              dataKey="peso"
              stroke="var(--success)"
              fill="var(--success)"
              fillOpacity={0.15}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                fontSize: 13,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Heatmap de dias estudados
        </h3>
        <Heatmap lancamentos={lancamentos} />
      </div>
    </div>
  )
}

function Heatmap({ lancamentos }: { lancamentos: Lancamento[] }) {
  const days = useMemo(() => {
    const map = new Map<string, number>()
    for (const l of lancamentos) {
      const day = l.criado_em.slice(0, 10)
      map.set(day, (map.get(day) ?? 0) + l.minutos)
    }
    return map
  }, [lancamentos])

  const weeks: Array<Array<{ date: string; minutes: number }>> = []
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 7 * 16)
  start.setDate(start.getDate() - start.getDay())

  for (let w = 0; w < 16; w++) {
    const week: Array<{ date: string; minutes: number }> = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(date.getDate() + w * 7 + d)
      const dateStr = date.toISOString().slice(0, 10)
      week.push({ date: dateStr, minutes: days.get(dateStr) ?? 0 })
    }
    weeks.push(week)
  }

  function colorFor(min: number): string {
    if (min === 0) return 'var(--neutral-800)'
    if (min < 30) return 'rgba(59,130,246,0.25)'
    if (min < 60) return 'rgba(59,130,246,0.5)'
    if (min < 120) return 'rgba(59,130,246,0.75)'
    return 'var(--primary)'
  }

  return (
    <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.minutes} min`}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: colorFor(day.minutes),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
