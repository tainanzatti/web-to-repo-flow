// Cronograma até a prova: datas e fase de estudo que ajustam o motor de prioridade.

export const EXAM_DATE = '2026-12-13'
/** Último dia de estudo planejado (véspera da véspera da prova). */
export const STUDY_END_DATE = '2026-12-11'

export type StudyPhaseKey = 'base' | 'intensivo' | 'reta-final' | 'encerrado'

export type StudyPhase = {
  key: StudyPhaseKey
  label: string
  /** Dias de estudo restantes, contando hoje. */
  diasEstudo: number
  diasProva: number
  /** Dias sem revisão para um tópico dominado voltar à fila. */
  maintenanceDueDays: number
  /** Divisor do esquecimento (menor = disciplinas voltam mais rápido). */
  forgettingDivisor: number
  /** Peso mínimo de tópico novo (nunca estudado) para entrar na fila. */
  minFibNovo: number
}

function diffDays(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)
}

export function studyPhase(today = new Date().toISOString().slice(0, 10)): StudyPhase {
  const diasEstudo = Math.max(0, diffDays(today, STUDY_END_DATE) + 1)
  const diasProva = Math.max(0, diffDays(today, EXAM_DATE))
  if (diasEstudo === 0)
    return { key: 'encerrado', label: 'Descanso pré-prova', diasEstudo, diasProva, maintenanceDueDays: 5, forgettingDivisor: 3, minFibNovo: 8 }
  if (diasEstudo <= 10)
    return { key: 'reta-final', label: 'Reta final — só revisão do que mais cai', diasEstudo, diasProva, maintenanceDueDays: 5, forgettingDivisor: 3, minFibNovo: 8 }
  if (diasEstudo <= 28)
    return { key: 'intensivo', label: 'Intensivo — revisões frequentes', diasEstudo, diasProva, maintenanceDueDays: 10, forgettingDivisor: 4, minFibNovo: 3 }
  return { key: 'base', label: 'Base — cobrir o edital', diasEstudo, diasProva, maintenanceDueDays: 21, forgettingDivisor: 5, minFibNovo: 0 }
}
