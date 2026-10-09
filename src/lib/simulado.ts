// ============================================================================
// Operação PMSC — Simulado no padrão da prova (60 questões + redação, 5h)
// ============================================================================
import { CURRICULUM, movingAverageMastery, type Lancamento } from './curriculum'

export type SimuladoQuestion = {
  disciplinaId: string
  topicoId: string
  enunciado: string
  alternativas: { A: string; B: string; C: string; D: string }
  correta: 'A' | 'B' | 'C' | 'D'
  explicacao: string
}

export const SIMULADO_DISTRIBUTION: { discId: string; count: number }[] = [
  { discId: 'legislacaoInstitucional', count: 10 },
  { discId: 'direitoConstitucional', count: 8 },
  { discId: 'linguaPortuguesa', count: 8 },
  { discId: 'direitoPenal', count: 6 },
  { discId: 'direitoProcessualPenal', count: 6 },
  { discId: 'direitoPenalMilitar', count: 6 },
  { discId: 'legislacaoEspecial', count: 6 },
  { discId: 'legislacaoTransito', count: 5 },
  { discId: 'informatica', count: 5 },
]

export const SIMULADO_TOTAL = SIMULADO_DISTRIBUTION.reduce((a, d) => a + d.count, 0) // 60
export const SIMULADO_LIMIT_MIN = 300 // 5 horas
export const SIMULADO_PESO_OBJETIVA = 0.75
export const SIMULADO_PESO_REDACAO = 0.25

/** Nota objetiva 0–10 = acertos/60 × 10. */
export function calcularNotaObjetiva(acertos: number): number {
  return Math.round((acertos / SIMULADO_TOTAL) * 100) / 10
}

/** Nota final = 75% objetiva + 25% redação (0–10). */
export function calcularNotaFinal(
  notaObjetiva: number,
  notaRedacao: number | null
): number | null {
  if (notaRedacao === null) return null
  return Math.round((notaObjetiva * SIMULADO_PESO_OBJETIVA + notaRedacao * SIMULADO_PESO_REDACAO) * 10) / 10
}

// Peso de sorteio do tópico: peso do edital × fator de fraqueza.
function pesoTopico(fib: number, mastery: number | null): number {
  let fator: number
  if (mastery === null) fator = 1.6
  else if (mastery < 50) fator = 1.3
  else if (mastery < 75) fator = 1
  else if (mastery < 90) fator = 0.6
  else fator = 0.3
  return fib * fator
}

export type Batch = { topicoId: string; topicoName: string; count: number }

/**
 * Distribui `count` questões da disciplina entre seus tópicos, priorizando
 * peso no edital (fib) e domínio fraco/sem dados.
 */
export function distribuirTopicos(
  discId: string,
  count: number,
  lancamentos: Lancamento[]
): Batch[] {
  const topics = CURRICULUM[discId]?.topics ?? []
  if (topics.length === 0) return []

  const weighed = topics
    .map((t) => ({ t, w: pesoTopico(t.fib, movingAverageMastery(lancamentos, discId, t.id)) }))
    .sort((a, b) => b.w - a.w)

  const maxTopics = Math.min(weighed.length, Math.max(2, Math.ceil(count * 0.6)))
  const chosen = weighed.slice(0, maxTopics)
  const totalW = chosen.reduce((s, c) => s + c.w, 0)
  const raw = chosen.map((c) => (c.w / totalW) * count)

  const counts = raw.map((r) => Math.max(1, Math.floor(r)))
  let rest = count - counts.reduce((a, b) => a + b, 0)
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
  let oi = 0
  while (rest > 0) {
    counts[order[oi % order.length].i]++
    rest--
    oi++
  }
  while (rest < 0) {
    const idx = counts.indexOf(Math.max(...counts))
    if (counts[idx] <= 1) break
    counts[idx]--
    rest++
  }

  return chosen
    .map((c, i) => ({ topicoId: c.t.id, topicoName: c.t.name, count: counts[i] }))
    .filter((b) => b.count > 0)
}

/** hh:mm:ss a partir de segundos. */
export function formatTempo(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export type DisciplinaResultado = {
  discId: string
  discName: string
  total: number
  acertos: number
  pct: number
}

/** Agrrega o resultado objetivo por disciplina. */
export function resultadoPorDisciplina(questoes: SimuladoQuestion[], respostas: Record<string, string>): DisciplinaResultado[] {
  return SIMULADO_DISTRIBUTION.map(({ discId }) => {
    const idxs = questoes
      .map((q, i) => (q.disciplinaId === discId ? i : -1))
      .filter((i) => i >= 0)
    const acertos = idxs.filter((i) => respostas[String(i)] === questoes[i].correta).length
    return {
      discId,
      discName: CURRICULUM[discId]?.name ?? discId,
      total: idxs.length,
      acertos,
      pct: idxs.length > 0 ? Math.round((acertos / idxs.length) * 100) : 0,
    }
  })
}
