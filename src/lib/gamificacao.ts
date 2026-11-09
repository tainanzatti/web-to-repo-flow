// Gamificação: sequência de dias, meta diária de questões e patentes por XP.
import type { Lancamento } from './curriculum'

const iso = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (s: string, n: number) => {
  const d = new Date(s + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}

/** Dias seguidos com estudo. Se hoje ainda não houve estudo, conta a sequência até ontem. */
export function calcularSequencia(lancamentos: Lancamento[], hoje = iso(new Date())) {
  const dias = new Set(lancamentos.filter((l) => l.quantidade > 0 || l.minutos > 0).map((l) => l.data))
  let cursor = dias.has(hoje) ? hoje : addDays(hoje, -1)
  let atual = 0
  while (dias.has(cursor)) { atual++; cursor = addDays(cursor, -1) }
  const ordenados = [...dias].sort()
  let recorde = 0, run = 0, prev: string | null = null
  for (const d of ordenados) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    recorde = Math.max(recorde, run)
    prev = d
  }
  return { atual, recorde, estudouHoje: dias.has(hoje) }
}

/** XP: 1 por questão feita + 2 por acerto + 1 a cada 10 min de estudo. */
export function calcularXP(lancamentos: Lancamento[]): number {
  return lancamentos.reduce((a, l) => a + l.quantidade + l.acertos * 2 + Math.floor(l.minutos / 10), 0)
}

export const PATENTES = [
  { nome: 'Recruta', xp: 0 },
  { nome: 'Soldado', xp: 500 },
  { nome: 'Cabo', xp: 1500 },
  { nome: '3º Sargento', xp: 3500 },
  { nome: '2º Sargento', xp: 6000 },
  { nome: '1º Sargento', xp: 9000 },
  { nome: 'Subtenente', xp: 13000 },
  { nome: 'Aspirante', xp: 18000 },
  { nome: 'Tenente', xp: 25000 },
  { nome: 'Capitão', xp: 35000 },
  { nome: 'Major', xp: 50000 },
  { nome: 'Coronel', xp: 70000 },
] as const

export function patenteAtual(xp: number) {
  let i = 0
  while (i + 1 < PATENTES.length && xp >= PATENTES[i + 1].xp) i++
  const prox = PATENTES[i + 1] ?? null
  const base = PATENTES[i].xp
  const progresso = prox ? (xp - base) / (prox.xp - base) : 1
  return { patente: PATENTES[i], proxima: prox, progresso, nivel: i + 1 }
}

export function questoesHoje(lancamentos: Lancamento[], hoje = iso(new Date())) {
  return lancamentos.filter((l) => l.data === hoje).reduce((a, l) => a + l.quantidade, 0)
}

export const META_PADRAO = 60
