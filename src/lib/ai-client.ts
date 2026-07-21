import { supabase } from './supabase'

export type AIKind =
  | 'leiseca'
  | 'resumo'
  | 'questoes'
  | 'flashcards'
  | 'redacao-tema'
  | 'redacao-correcao'
  | 'chat'
  | 'explicar'
  | 'explicar-alternativa'
  | 'corrigir-redacao'
  | 'analise-desempenho'
  | 'recomendacoes'
  | 'plano'
  | 'tema-redacao'

type AiPayload = {
  disciplina_id?: string
  topico_id?: string | null
  topico_nome?: string
  disciplina_nome?: string
  texto?: string
  tema?: string
  pergunta?: string
  alternativa?: string
  [key: string]: unknown
}

export async function callAiFunction(
  slug: string,
  payload: AiPayload,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke(slug, {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
  if (error) throw error
  return (data as Record<string, unknown>) ?? {}
}

export function slugForKind(kind: AIKind): string {
  const map: Record<AIKind, string> = {
    leiseca: 'ai-explicar',
    resumo: 'gerar-resumo',
    questoes: 'ai-questoes',
    flashcards: 'ai-questoes',
    'redacao-tema': 'gerar-tema-redacao',
    'redacao-correcao': 'ai-corrigir-redacao',
    chat: 'ai-chat',
    explicar: 'ai-explicar',
    'explicar-alternativa': 'ai-explicar-alternativa',
    'corrigir-redacao': 'ai-corrigir-redacao',
    'analise-desempenho': 'ai-analise-desempenho',
    recomendacoes: 'ai-recomendacoes',
    plano: 'gerar-plano',
    'tema-redacao': 'gerar-tema-redacao',
  }
  return map[kind]
}
