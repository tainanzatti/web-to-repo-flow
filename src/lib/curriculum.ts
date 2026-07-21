import type { Discipline, Topic, Lancamento, SkipCount } from './types'

export type TopicMastery = {
  topic: Topic
  mastery: number
  tier: 'nao_iniciado' | 'iniciado' | 'medio' | 'bom' | 'dominado'
  lastReviewed: Date | null
  daysSinceReview: number | null
  isPrimeiroContato: boolean
}

export type DisciplineMastery = {
  discipline: Discipline
  masteryMedio: number
  topics: TopicMastery[]
  lastReviewed: Date | null
  daysSinceReview: number | null
  topicsNaoIniciados: number
  topicsDominados: number
  topicsResurgir: TopicMastery[]
}

export type DisciplineScore = {
  discipline: Discipline
  score: number
  masteryMedio: number
  pesoNormalizado: number
  fatorEsquecimento: number
  diasSemRevisao: number | null
  multiplicadorUrgencia: number
  vezesPulada: number
  motivo: string
}

const RESURGIR_DIAS = 25

export function computeTopicMastery(
  topic: Topic,
  lancamentos: Lancamento[],
): TopicMastery {
  const topicLanc = lancamentos.filter((l) => l.topico_id === topic.id)
  const isFirst = topicLanc.length === 0
  const mastery = topicLanc.length > 0
    ? topicLanc.reduce((s, l) => s + (l.mastery ?? 0), 0) / topicLanc.length
    : 0
  const lastLanc = topicLanc
    .map((l) => new Date(l.criado_em))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const daysSince = lastLanc
    ? Math.floor((Date.now() - lastLanc.getTime()) / 86400000)
    : null
  return {
    topic,
    mastery: Math.round(mastery * 10) / 10,
    tier: tierFor(mastery, isFirst),
    lastReviewed: lastLanc ?? null,
    daysSinceReview: daysSince,
    isPrimeiroContato: isFirst,
  }
}

function tierFor(mastery: number, isFirst: boolean): TopicMastery['tier'] {
  if (isFirst) return 'nao_iniciado'
  if (mastery < 25) return 'iniciado'
  if (mastery < 50) return 'medio'
  if (mastery < 80) return 'bom'
  return 'dominado'
}

export function computeDisciplineMastery(
  discipline: Discipline,
  topics: Topic[],
  lancamentos: Lancamento[],
): DisciplineMastery {
  const discTopics = topics.filter((t) => t.disciplina_id === discipline.id)
  const topicMasteries = discTopics.map((t) => computeTopicMastery(t, lancamentos))
  const reviewed = topicMasteries.filter((tm) => !tm.isPrimeiroContato)
  const masteryMedio =
    reviewed.length > 0
      ? reviewed.reduce((s, tm) => s + tm.mastery, 0) / reviewed.length
      : 0
  const lastReviewed = reviewed
    .map((tm) => tm.lastReviewed)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
  const daysSince = lastReviewed
    ? Math.floor((Date.now() - lastReviewed.getTime()) / 86400000)
    : null
  const topicsNaoIniciados = topicMasteries.filter(
    (tm) => tm.tier === 'nao_iniciado',
  ).length
  const topicsDominados = topicMasteries.filter(
    (tm) => tm.tier === 'dominado',
  ).length
  const topicsResurgir = topicMasteries.filter(
    (tm) =>
      tm.tier === 'dominado' &&
      tm.daysSinceReview !== null &&
      tm.daysSinceReview >= RESURGIR_DIAS,
  )
  return {
    discipline,
    masteryMedio: Math.round(masteryMedio * 10) / 10,
    topics: topicMasteries,
    lastReviewed,
    daysSinceReview: daysSince,
    topicsNaoIniciados,
    topicsDominados,
    topicsResurgir,
  }
}

export function computeAllScores(
  disciplines: Discipline[],
  topics: Topic[],
  lancamentos: Lancamento[],
  skipCounts: SkipCount[],
): DisciplineScore[] {
  const maxPeso = Math.max(...disciplines.map((d) => d.peso_edital), 1)
  const masteries = disciplines.map((d) =>
    computeDisciplineMastery(d, topics, lancamentos),
  )
  const scores: DisciplineScore[] = masteries.map((dm) => {
    const pesoNorm = dm.discipline.peso_edital / maxPeso
    const dominioNorm = dm.masteryMedio / 100
    const dias = dm.daysSinceReview ?? 9999
    const fatorEsquecimento = Math.min(2.5, 1 + dias / 5)
    const skip = skipCounts.find((s) => s.disciplina_id === dm.discipline.id)
    const multiplicador = skip ? Number(skip.multiplicador_urgencia) : 1
    const vezesPulada = skip ? skip.vezes_pulada : 0
    const score = pesoNorm * (1 - dominioNorm) * fatorEsquecimento * multiplicador
    return {
      discipline: dm.discipline,
      score: Math.round(score * 100) / 100,
      masteryMedio: dm.masteryMedio,
      pesoNormalizado: Math.round(pesoNorm * 100) / 100,
      fatorEsquecimento: Math.round(fatorEsquecimento * 100) / 100,
      diasSemRevisao: dm.daysSinceReview,
      multiplicadorUrgencia: multiplicador,
      vezesPulada,
      motivo: buildMotivo(dm, fatorEsquecimento, dias, vezesPulada),
    }
  })
  return scores.sort((a, b) => b.score - a.score)
}

function buildMotivo(
  dm: DisciplineMastery,
  fatorEsc: number,
  dias: number,
  vezesPulada: number,
): string {
  const parts: string[] = []
  parts.push(`peso ${dm.discipline.peso_edital} no edital`)
  if (dm.masteryMedio > 0) {
    parts.push(`domínio médio ${Math.round(dm.masteryMedio)}%`)
  } else {
    parts.push(`sem tópicos revisados ainda`)
  }
  if (dm.daysSinceReview !== null) {
    parts.push(`sem revisão há ${dias} ${dias === 1 ? 'dia' : 'dias'}`)
  } else {
    parts.push(`nunca revisada`)
  }
  if (vezesPulada > 0) {
    parts.push(`pulada ${vezesPulada}x (urgência ×${fatorEsc.toFixed(1)})`)
  }
  return parts.join(', ')
}

export function nextHeroDiscipline(
  disciplines: Discipline[],
  topics: Topic[],
  lancamentos: Lancamento[],
  skipCounts: SkipCount[],
): DisciplineScore {
  const scores = computeAllScores(disciplines, topics, lancamentos, skipCounts)
  return scores[0]
}

export function tetoTopicosPorDesempenho(masteryMedio: number): number {
  if (masteryMedio < 25) return 2
  if (masteryMedio < 50) return 3
  if (masteryMedio < 75) return 4
  return 5
}

export function selectTopicsForSession(
  dm: DisciplineMastery,
  teto: number,
): TopicMastery[] {
  const resurgir = dm.topicsResurgir
  if (resurgir.length > 0) {
    return [resurgir[0]]
  }
  const naoIniciados = dm.topics.filter((t) => t.tier === 'nao_iniciado')
  const iniciados = dm.topics.filter(
    (t) => t.tier === 'iniciado' || t.tier === 'medio',
  )
  const prioritarios = [...naoIniciados, ...iniciados]
  if (prioritarios.length === 0) {
    const bom = dm.topics.filter((t) => t.tier === 'bom')
    return bom.slice(0, teto)
  }
  return prioritarios.slice(0, teto)
}

export function nextSkipMultiplier(current: number): number {
  return Math.min(3, Number(current) + 0.5)
}
