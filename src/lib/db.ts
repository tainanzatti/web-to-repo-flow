import { supabase } from "./supabase";
import type { Discipline, Topic, Lancamento } from "./curriculum";

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase
    .from("disciplines")
    .select("*")
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as Discipline[];
}

export async function fetchTopics(disciplinaId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("disciplina_id", disciplinaId)
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function fetchAllTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("ordem");
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function fetchLancamentos(disciplinaId?: string): Promise<Lancamento[]> {
  let query = supabase.from("lancamentos").select("*");
  if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lancamento[];
}

export async function insertLancamento(
  disciplinaId: string,
  topicoId: string | null,
  mastery: number
): Promise<void> {
  const { error } = await supabase
    .from("lancamentos")
    .insert({ disciplina_id: disciplinaId, topico_id: topicoId, mastery });
  if (error) throw error;
}

export async function fetchSkipCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("skip_counts").select("*");
  if (error) throw error;
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[(row as { disciplina_id: string }).disciplina_id] = (row as { count: number }).count;
  }
  return map;
}

export async function incrementSkipCount(disciplinaId: string): Promise<void> {
  const { data, error } = await supabase
    .from("skip_counts")
    .select("*")
    .eq("disciplina_id", disciplinaId)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const { error: e2 } = await supabase
      .from("skip_counts")
      .update({ count: (data as { count: number }).count + 1 })
      .eq("disciplina_id", disciplinaId);
    if (e2) throw e2;
  } else {
    const { error: e3 } = await supabase
      .from("skip_counts")
      .insert({ disciplina_id: disciplinaId, count: 1 });
    if (e3) throw e3;
  }
}

export async function resetSkipCount(disciplinaId: string): Promise<void> {
  const { error } = await supabase
    .from("skip_counts")
    .delete()
    .eq("disciplina_id", disciplinaId);
  if (error) throw error;
}

export async function fetchUserPrefs(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from("user_prefs").select("*").maybeSingle();
  if (error) throw error;
  return (data as Record<string, unknown>) ?? {};
}

export async function upsertUserPrefs(prefs: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("user_prefs").upsert(prefs);
  if (error) throw error;
}

export interface FlashcardRow {
  id: string;
  disciplina_id: string;
  topico_id: string;
  pergunta: string;
  resposta: string;
  box: number;
  last_reviewed: string | null;
  created_at: string;
}

export async function fetchFlashcards(disciplinaId?: string): Promise<FlashcardRow[]> {
  let query = supabase.from("flashcards").select("*");
  if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
  const { data, error } = await query.order("created_at");
  if (error) throw error;
  return (data ?? []) as FlashcardRow[];
}

export async function insertFlashcards(rows: Omit<FlashcardRow, "id" | "created_at" | "box" | "last_reviewed">[]): Promise<FlashcardRow[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .insert(rows.map((r) => ({ ...r, box: 1, last_reviewed: null })))
    .select("*");
  if (error) throw error;
  return (data ?? []) as FlashcardRow[];
}

export async function updateFlashcardBox(id: string, box: number): Promise<void> {
  const { error } = await supabase
    .from("flashcards")
    .update({ box, last_reviewed: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFlashcardsByTopic(topicoId: string): Promise<void> {
  const { error } = await supabase.from("flashcards").delete().eq("topico_id", topicoId);
  if (error) throw error;
}

export interface RedacaoRow {
  id: string;
  tema: string;
  texto: string;
  nota: number | null;
  correcao: string | null;
  created_at: string;
}

export async function fetchRedacoes(): Promise<RedacaoRow[]> {
  const { data, error } = await supabase.from("redacoes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RedacaoRow[];
}

export async function insertRedacao(tema: string, texto: string): Promise<RedacaoRow> {
  const { data, error } = await supabase
    .from("redacoes")
    .insert({ tema, texto, nota: null, correcao: null })
    .select("*")
    .single();
  if (error) throw error;
  return data as RedacaoRow;
}

export async function updateRedacaoCorrecao(id: string, nota: number, correcao: string): Promise<void> {
  const { error } = await supabase
    .from("redacoes")
    .update({ nota, correcao })
    .eq("id", id);
  if (error) throw error;
}

export interface QuestaoRow {
  id: string;
  disciplina_id: string;
  topico_id: string | null;
  acertou: boolean;
  banca: string | null;
  created_at: string;
}

export async function fetchQuestoes(disciplinaId?: string): Promise<QuestaoRow[]> {
  let query = supabase.from("questoes").select("*");
  if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuestaoRow[];
}

export async function insertQuestao(
  disciplinaId: string,
  topicoId: string | null,
  acertou: boolean,
  banca: string | null
): Promise<void> {
  const { error } = await supabase
    .from("questoes")
    .insert({ disciplina_id: disciplinaId, topico_id: topicoId, acertou, banca });
  if (error) throw error;
}

export interface AIMaterialRow {
  id: string;
  disciplina_id: string;
  topico_id: string;
  tipo: string;
  conteudo: string;
  created_at: string;
}

export async function fetchAIMaterial(topicoId: string, tipo: string): Promise<AIMaterialRow | null> {
  const { data, error } = await supabase
    .from("ai_material")
    .select("*")
    .eq("topico_id", topicoId)
    .eq("tipo", tipo)
    .maybeSingle();
  if (error) throw error;
  return data as AIMaterialRow | null;
}

export async function insertAIMaterial(
  disciplinaId: string,
  topicoId: string,
  tipo: string,
  conteudo: string
): Promise<void> {
  const { error } = await supabase
    .from("ai_material")
    .insert({ disciplina_id: disciplinaId, topico_id: topicoId, tipo, conteudo });
  if (error) throw error;
}

export interface ProfileRow {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  created_at: string;
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}
