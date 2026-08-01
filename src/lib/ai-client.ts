import { generateStudyMaterial, corrigirRedacao, type CorrecaoResult } from './ai.functions'

export type AIKind = 'leiseca' | 'resumo' | 'questoes' | 'briefing' | 'redacao-tema'

export type { CorrecaoResult, RedacaoFeedback } from './ai.functions'

export async function generateAI(payload: {
  kind: AIKind
  discName?: string
  topicName?: string
  summary?: string
}): Promise<string> {
  const result = await generateStudyMaterial({ data: payload })
  if ('error' in result) throw new Error(result.error)
  return result.text
}

export async function corrigirRedacaoAI(tema: string, texto: string): Promise<CorrecaoResult> {
  const result = await corrigirRedacao({ data: { tema, texto } })
  if ('error' in result) throw new Error(result.error)
  return result
}
