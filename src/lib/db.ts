import { supabase } from './supabase'
import type { Database, DisciplineSkips, Json, Lancamento, SkipState } from './curriculum'
import type { Json } from '@/integrations/supabase/types'

// ============================================================================
// Camada central de acesso ao banco (Lovable Cloud).
// Toda leitura/escrita de dados do usuário passa por aqui.
// ============================================================================

// ---------- Lançamentos (sessões de estudo / questões respondidas) ----------

export async function fetchLancamentos(userId: string): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('id, disciplina_id, topico_id, quantidade, acertos, minutos, data')
    .eq('user_id', userId)
    .order('data', { ascending: true })

  if (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    disciplinaId: row.disciplina_id,
    topicoId: row.topico_id,
    quantidade: row.quantidade,
    acertos: row.acertos,
    minutos: row.minutos,
    data: row.data,
  }))
}

export async function insertLancamentos(
  userId: string,
  entries: Omit<Lancamento, 'id'>[]
): Promise<Lancamento[]> {
  const rows = entries.map((e) => ({
    user_id: userId,
    disciplina_id: e.disciplinaId,
    topico_id: e.topicoId,
    quantidade: e.quantidade,
    acertos: e.acertos,
    minutos: e.minutos,
    data: e.data,
  }))

  const { data, error } = await supabase.from('lancamentos').insert(rows).select()
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    disciplinaId: row.disciplina_id,
    topicoId: row.topico_id,
    quantidade: row.quantidade,
    acertos: row.acertos,
    minutos: row.minutos,
    data: row.data,
  }))
}

export async function deleteLancamento(id: string): Promise<void> {
  const { error } = await supabase.from('lancamentos').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllLancamentos(userId: string): Promise<void> {
  const { error } = await supabase.from('lancamentos').delete().eq('user_id', userId)
  if (error) throw error
}

// ---------- Links de material ----------

export type SavedLink = { id: string; url: string; createdAt: number }

export async function fetchMaterialLinks(
  userId: string,
  discId: string,
  topicId: string
): Promise<SavedLink[]> {
  const { data, error } = await supabase
    .from('material_links')
    .select('id, url, created_at')
    .eq('user_id', userId)
    .eq('disciplina_id', discId)
    .eq('topico_id', topicId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar links:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    url: row.url,
    createdAt: new Date(row.created_at).getTime(),
  }))
}

export async function insertMaterialLink(
  userId: string,
  discId: string,
  topicId: string,
  url: string
): Promise<SavedLink> {
  const { data, error } = await supabase
    .from('material_links')
    .insert({ user_id: userId, disciplina_id: discId, topico_id: topicId, url })
    .select()
    .single()

  if (error) throw error

  return { id: data.id, url: data.url, createdAt: new Date(data.created_at).getTime() }
}

export async function deleteMaterialLink(id: string): Promise<void> {
  const { error } = await supabase.from('material_links').delete().eq('id', id)
  if (error) throw error
}

// ---------- Materiais gerados por IA (lei seca, resumo, questões) ----------

export type AiMaterialKind = 'leiseca' | 'resumo' | 'questoes'

export async function fetchAiMaterial(
  userId: string,
  discId: string,
  topicId: string,
  kind: AiMaterialKind
): Promise<string | null> {
  const { data, error } = await supabase
    .from('ai_materials')
    .select('content')
    .eq('user_id', userId)
    .eq('disciplina_id', discId)
    .eq('topico_id', topicId)
    .eq('kind', kind)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar material de IA:', error)
    return null
  }
  return data?.content ?? null
}

export async function upsertAiMaterial(
  userId: string,
  discId: string,
  topicId: string,
  kind: AiMaterialKind,
  content: string
): Promise<void> {
  const { error } = await supabase.from('ai_materials').upsert(
    {
      user_id: userId,
      disciplina_id: discId,
      topico_id: topicId,
      kind,
      content,
    },
    { onConflict: 'user_id,disciplina_id,topico_id,kind' }
  )
  if (error) console.error('Erro ao salvar material de IA:', error)
}

// ---------- Briefing diário ----------

export async function fetchDailyBriefing(
  userId: string,
  date: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('daily_briefings')
    .select('content')
    .eq('user_id', userId)
    .eq('briefing_date', date)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar briefing:', error)
    return null
  }
  return data?.content ?? null
}

export async function upsertDailyBriefing(
  userId: string,
  date: string,
  content: string
): Promise<void> {
  const { error } = await supabase.from('daily_briefings').upsert(
    { user_id: userId, briefing_date: date, content },
    { onConflict: 'user_id,briefing_date' }
  )
  if (error) console.error('Erro ao salvar briefing:', error)
}

// ---------- Configurações do usuário ----------

export async function fetchUserSettings(
  userId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar configurações:', error)
    return {}
  }
  return (data?.settings as Record<string, unknown>) ?? {}
}

export async function upsertUserSettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings: settings as Json }, { onConflict: 'user_id' })
  if (error) console.error('Erro ao salvar configurações:', error)
}

// ---------- Pulos de disciplina (trava da disciplina ativa) ----------

export async function fetchDisciplineSkips(userId: string): Promise<DisciplineSkips> {
  const { data, error } = await supabase
    .from('discipline_skips')
    .select('disciplina_id, skip_count, consecutive_skips')
    .eq('user_id', userId)

  if (error) {
    console.error('Erro ao buscar pulos de disciplina:', error)
    return {}
  }

  const out: DisciplineSkips = {}
  for (const row of data ?? []) {
    out[row.disciplina_id] = {
      skipCount: row.skip_count,
      consecutiveSkips: row.consecutive_skips,
    }
  }
  return out
}

/** Registra um pulo: incrementa total e sequência (urgência escalonada). */
export async function registerDisciplineSkip(
  userId: string,
  discId: string,
  current?: SkipState
): Promise<SkipState> {
  const next: SkipState = {
    skipCount: (current?.skipCount ?? 0) + 1,
    consecutiveSkips: (current?.consecutiveSkips ?? 0) + 1,
  }

  const { error } = await supabase.from('discipline_skips').upsert(
    {
      user_id: userId,
      disciplina_id: discId,
      skip_count: next.skipCount,
      consecutive_skips: next.consecutiveSkips,
      last_skipped_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,disciplina_id' }
  )
  if (error) throw error

  return next
}

/** Zera a sequência de pulos quando a disciplina é efetivamente concluída. */
export async function clearDisciplineSkipStreak(
  userId: string,
  discId: string
): Promise<void> {
  const { error } = await supabase
    .from('discipline_skips')
    .update({ consecutive_skips: 0 })
    .eq('user_id', userId)
    .eq('disciplina_id', discId)
  if (error) console.error('Erro ao zerar sequência de pulos:', error)
}

// ---------- Redações (tema gerado por IA + correção) ----------

export type Redacao = {
  id: string
  tema: string
  texto: string
  nota: number | null
  feedback: Record<string, string> | null
  comentario: string | null
  criadoEm: string
}

type RedacaoRow = {
  id: string
  tema: string
  texto: string
  nota: number | string | null
  feedback_json: unknown
  criado_em: string
}

function mapRedacao(row: RedacaoRow): Redacao {
  const fb = (row.feedback_json ?? null) as
    | ({ comentario?: string } & Record<string, unknown>)
    | null
  const criterios = fb ? { ...fb } : null
  let comentario: string | null = null
  if (criterios && typeof criterios.comentario === 'string') {
    comentario = criterios.comentario
    delete criterios.comentario
  }
  return {
    id: row.id,
    tema: row.tema,
    texto: row.texto,
    nota: row.nota === null ? null : Number(row.nota),
    feedback: (criterios as Record<string, string> | null) ?? null,
    comentario,
    criadoEm: row.criado_em,
  }
}

export async function fetchRedacoes(userId: string): Promise<Redacao[]> {
  const { data, error } = await supabase
    .from('redacoes')
    .select('id, tema, texto, nota, feedback_json, criado_em')
    .eq('user_id', userId)
    .order('criado_em', { ascending: false })

  if (error) {
    console.error('Erro ao buscar redações:', error)
    return []
  }
  return (data ?? []).map((row) => mapRedacao(row as unknown as RedacaoRow))
}

export async function insertRedacao(
  userId: string,
  input: {
    tema: string
    texto: string
    nota: number | null
    feedback: Record<string, string> | null
    comentario?: string | null
  }
): Promise<Redacao> {
  const feedbackJson = input.feedback
    ? ({ ...input.feedback, ...(input.comentario ? { comentario: input.comentario } : {}) } as Json)
    : null

  const { data, error } = await supabase
    .from('redacoes')
    .insert({
      user_id: userId,
      tema: input.tema,
      texto: input.texto,
      nota: input.nota,
      feedback_json: feedbackJson,
    })
    .select('id, tema, texto, nota, feedback_json, criado_em')
    .single()

  if (error) throw error
  return mapRedacao(data as unknown as RedacaoRow)
}

// ---------- Simulados (prova completa 60 questões + redação) ----------

import type { SimuladoQuestion } from './simulado'

export type SimuladoStatus = 'em_andamento' | 'concluida'
export type SimuladoRespostas = Record<string, string>

export type Simulado = {
  id: string
  status: SimuladoStatus
  questoes: SimuladoQuestion[]
  respostas: SimuladoRespostas
  redacaoTema: string | null
  redacaoTexto: string | null
  redacaoNota: number | null
  redacaoFeedback: Record<string, string> | null
  notaObjetiva: number | null
  notaFinal: number | null
  iniciadoEm: string
  finalizadoEm: string | null
}

type SimuladoRow = {
  id: string
  status: string
  questoes: unknown
  respostas: unknown
  redacao_tema: string | null
  redacao_texto: string | null
  redacao_nota: number | string | null
  redacao_feedback: unknown
  nota_objetiva: number | string | null
  nota_final: number | string | null
  iniciado_em: string
  finalizado_em: string | null
}

function mapSimulado(row: SimuladoRow): Simulado {
  return {
    id: row.id,
    status: row.status === 'concluida' ? 'concluida' : 'em_andamento',
    questoes: (row.questoes ?? []) as SimuladoQuestion[],
    respostas: (row.respostas ?? {}) as SimuladoRespostas,
    redacaoTema: row.redacao_tema,
    redacaoTexto: row.redacao_texto,
    redacaoNota: row.redacao_nota === null ? null : Number(row.redacao_nota),
    redacaoFeedback: (row.redacao_feedback ?? null) as Record<string, string> | null,
    notaObjetiva: row.nota_objetiva === null ? null : Number(row.nota_objetiva),
    notaFinal: row.nota_final === null ? null : Number(row.nota_final),
    iniciadoEm: row.iniciado_em,
    finalizadoEm: row.finalizado_em,
  }
}

const SIMULADO_SELECT =
  'id, status, questoes, respostas, redacao_tema, redacao_texto, redacao_nota, redacao_feedback, nota_objetiva, nota_final, iniciado_em, finalizado_em'

export async function fetchSimulados(userId: string): Promise<Simulado[]> {
  const { data, error } = await supabase
    .from('simulados')
    .select(SIMULADO_SELECT)
    .eq('user_id', userId)
    .order('iniciado_em', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Erro ao buscar simulados:', error)
    return []
  }
  return (data ?? []).map((row) => mapSimulado(row as unknown as SimuladoRow))
}

export async function fetchSimuladoEmAndamento(userId: string): Promise<Simulado | null> {
  const { data, error } = await supabase
    .from('simulados')
    .select(SIMULADO_SELECT)
    .eq('user_id', userId)
    .eq('status', 'em_andamento')
    .order('iniciado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar simulado em andamento:', error)
    return null
  }
  return data ? mapSimulado(data as unknown as SimuladoRow) : null
}

export async function insertSimulado(
  userId: string,
  questoes: SimuladoQuestion[]
): Promise<Simulado> {
  const { data, error } = await supabase
    .from('simulados')
    .insert({
      user_id: userId,
      status: 'em_andamento',
      questoes: questoes as unknown as Json,
    })
    .select(SIMULADO_SELECT)
    .single()

  if (error) throw error
  return mapSimulado(data as unknown as SimuladoRow)
}

export type SimuladoPatch = {
  status?: SimuladoStatus
  respostas?: SimuladoRespostas
  redacaoTema?: string
  redacaoTexto?: string
  redacaoNota?: number
  redacaoFeedback?: Record<string, string> | null
  notaObjetiva?: number
  notaFinal?: number
  finalizadoEm?: string
}

export async function updateSimulado(id: string, patch: SimuladoPatch): Promise<void> {
  const row: Database['public']['Update']['simulados'] = {}
  if (patch.status !== undefined) row.status = patch.status
  if (patch.respostas !== undefined) row.respostas = patch.respostas as Json
  if (patch.redacaoTema !== undefined) row.redacao_tema = patch.redacaoTema
  if (patch.redacaoTexto !== undefined) row.redacao_texto = patch.redacaoTexto
  if (patch.redacaoNota !== undefined) row.redacao_nota = patch.redacaoNota
  if (patch.redacaoFeedback !== undefined)
    row.redacao_feedback = (patch.redacaoFeedback ?? null) as Json
  if (patch.notaObjetiva !== undefined) row.nota_objetiva = patch.notaObjetiva
  if (patch.notaFinal !== undefined) row.nota_final = patch.notaFinal
  if (patch.finalizadoEm !== undefined) row.finalizado_em = patch.finalizadoEm

  const { error } = await supabase.from('simulados').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteSimulado(id: string): Promise<void> {
  const { error } = await supabase.from('simulados').delete().eq('id', id)
  if (error) throw error
}
