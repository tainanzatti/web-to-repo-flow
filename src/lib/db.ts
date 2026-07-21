import { supabase } from './supabase'
import type {
  Discipline,
  Topic,
  Lancamento,
  QuestaoLancamento,
  SkipCount,
  Flashcard,
  Redacao,
  AiMaterial,
  StudyTimeDaily,
  UserPrefs,
  Profile,
} from './types'

const USER_ID = '00000000-0000-0000-0000-000000000000'

export function getUserId(): string {
  return USER_ID
}

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase
    .from('disciplines')
    .select('*')
    .order('ordem')
  if (error) throw error
  return data ?? []
}

export async function fetchTopics(disciplinaId?: string): Promise<Topic[]> {
  let q = supabase.from('topics').select('*').order('ordem')
  if (disciplinaId) q = q.eq('disciplina_id', disciplinaId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function fetchAllTopics(): Promise<Topic[]> {
  return fetchTopics()
}

export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertLancamento(
  payload: Omit<Lancamento, 'id' | 'criado_em' | 'user_id'>,
): Promise<void> {
  const { error } = await supabase.from('lancamentos').insert({
    ...payload,
    user_id: USER_ID,
  })
  if (error) throw error
}

export async function fetchQuestaoLancamentos(): Promise<QuestaoLancamento[]> {
  const { data, error } = await supabase
    .from('questao_lancamentos')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertQuestaoLancamento(
  payload: Omit<QuestaoLancamento, 'id' | 'criado_em' | 'user_id'>,
): Promise<void> {
  const { error } = await supabase.from('questao_lancamentos').insert({
    ...payload,
    user_id: USER_ID,
  })
  if (error) throw error
}

export async function fetchSkipCounts(): Promise<SkipCount[]> {
  const { data, error } = await supabase.from('skip_counts').select('*')
  if (error) throw error
  return data ?? []
}

export async function upsertSkipCount(
  disciplinaId: string,
  vezesPulada: number,
  multiplicador: number,
): Promise<void> {
  const { error } = await supabase.from('skip_counts').upsert({
    disciplina_id: disciplinaId,
    vezes_pulada: vezesPulada,
    multiplicador_urgencia: multiplicador,
  })
  if (error) throw error
}

export async function resetSkipCount(disciplinaId: string): Promise<void> {
  const { error } = await supabase.from('skip_counts').upsert({
    disciplina_id: disciplinaId,
    vezes_pulada: 0,
    multiplicador_urgencia: 1,
  })
  if (error) throw error
}

export async function fetchFlashcards(): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .order('proxima_revisao', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function insertFlashcards(
  cards: Array<
    Omit<Flashcard, 'id' | 'criado_em' | 'user_id' | 'caixa' | 'proxima_revisao'>
  >,
): Promise<void> {
  const today = new Date()
  const rows = cards.map((c) => ({
    ...c,
    user_id: USER_ID,
    caixa: 1,
    proxima_revisao: today.toISOString().slice(0, 10),
  }))
  const { error } = await supabase.from('flashcards').insert(rows)
  if (error) throw error
}

export async function updateFlashcardBox(
  id: string,
  caixa: number,
  proximaRevisao: string,
): Promise<void> {
  const { error } = await supabase
    .from('flashcards')
    .update({ caixa, proxima_revisao: proximaRevisao })
    .eq('id', id)
  if (error) throw error
}

export async function deleteFlashcardsForTopic(topicoId: string): Promise<void> {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('topico_id', topicoId)
  if (error) throw error
}

export async function fetchRedacoes(): Promise<Redacao[]> {
  const { data, error } = await supabase
    .from('redacoes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function insertRedacao(
  tema: string,
  texto: string,
): Promise<Redacao | null> {
  const { data, error } = await supabase
    .from('redacoes')
    .insert({ tema, texto, user_id: USER_ID })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateRedacaoCorrecao(
  id: string,
  nota: number,
  feedbackJson: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('redacoes')
    .update({ nota, feedback_json: feedbackJson })
    .eq('id', id)
  if (error) throw error
}

export async function fetchAiMaterial(
  disciplinaId: string,
  topicoId: string | null,
  kind: string,
): Promise<AiMaterial | null> {
  let q = supabase
    .from('ai_material')
    .select('*')
    .eq('disciplina_id', disciplinaId)
    .eq('kind', kind)
  if (topicoId) q = q.eq('topico_id', topicoId)
  else q = q.is('topico_id', null)
  const { data, error } = await q.order('criado_em', { ascending: false }).limit(1)
  if (error) throw error
  return data && data.length > 0 ? data[0] : null
}

export async function upsertAiMaterial(
  disciplinaId: string,
  topicoId: string | null,
  kind: string,
  contentJson: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from('ai_material').insert({
    disciplina_id: disciplinaId,
    topico_id: topicoId,
    kind,
    content_json: contentJson,
  })
  if (error) throw error
}

export async function fetchStudyTimeDaily(): Promise<StudyTimeDaily[]> {
  const { data, error } = await supabase
    .from('study_time_daily')
    .select('*')
    .order('data', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertStudyTime(
  data: string,
  tempoSegundos: number,
): Promise<void> {
  const { error } = await supabase
    .from('study_time_daily')
    .upsert(
      { user_id: USER_ID, data, tempo_segundos: tempoSegundos },
      { onConflict: 'user_id,data' },
    )
  if (error) throw error
}

export async function fetchUserPrefs(): Promise<UserPrefs | null> {
  const { data, error } = await supabase
    .from('user_prefs')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertUserPrefs(
  prefs: Partial<Omit<UserPrefs, 'id'>>,
): Promise<void> {
  const { error } = await supabase
    .from('user_prefs')
    .upsert({ id: 1, ...prefs })
  if (error) throw error
}

export async function fetchProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProfile(
  profile: Partial<Omit<Profile, 'id' | 'criado_em'>> & { id?: string },
): Promise<void> {
  const existing = await fetchProfile()
  if (existing) {
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('profiles').insert({
      nome: profile.nome ?? 'Concurseiro',
      email: profile.email ?? '',
      ...profile,
    })
    if (error) throw error
  }
}
