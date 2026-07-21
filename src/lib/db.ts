import { supabase } from "./supabase";
import type { Discipline, Topic, Lancamento } from "./curriculum";

export interface SkipCountRow { disciplina_id: string; vezes_pulada: number; multiplicador_urgencia: number; }
export interface UserPrefs { id: number; nome: string; sidebar_expandida: boolean; horas_estudo_dia: number; }
export interface FlashcardRow { id: string; disciplina_id: string; topico_id: string; pergunta: string; resposta: string; caixa: number; proxima_revisao: string; criado_em: string; }
export interface RedacaoRow { id: string; tema: string; texto: string; nota: number | null; feedback_json: Record<string, unknown> | null; criado_em: string; }
export interface AiMaterialRow { id: string; disciplina_id: string; topico_id: string | null; kind: string; content_json: Record<string, unknown>; criado_em: string; }
export interface QuestaoRow { id: string; disciplina_id: string; topico_id: string | null; acertou: boolean; fonte: string | null; criado_em: string; }

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase.from("disciplines").select("*").order("ordem");
  if (error) throw error;
  return data as Discipline[];
}
export async function fetchTopics(): Promise<Topic[]> {
  const { data, error } = await supabase.from("topics").select("*").order("ordem");
  if (error) throw error;
  return data as Topic[];
}
export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase.from("lancamentos").select("*").order("criado_em");
  if (error) throw error;
  return (data ?? []) as Lancamento[];
}
export async function insertLancamento(lanc: Omit<Lancamento, "id" | "criado_em">): Promise<void> {
  const { error } = await supabase.from("lancamentos").insert(lanc);
  if (error) throw error;
}
export async function fetchSkipCounts(): Promise<Map<string, SkipCountRow>> {
  const { data, error } = await supabase.from("skip_counts").select("*");
  if (error) throw error;
  const map = new Map<string, SkipCountRow>();
  for (const row of data ?? []) map.set(row.disciplina_id, row as SkipCountRow);
  return map;
}
export async function incrementSkip(disciplinaId: string): Promise<void> {
  const { data: existing } = await supabase.from("skip_counts").select("*").eq("disciplina_id", disciplinaId).maybeSingle();
  if (existing) {
    const newVezes = (existing.vezes_pulada ?? 0) + 1;
    const newMult = Math.min(3, 1 + newVezes * 0.5);
    const { error } = await supabase.from("skip_counts").update({ vezes_pulada: newVezes, multiplicador_urgencia: newMult }).eq("disciplina_id", disciplinaId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("skip_counts").insert({ disciplina_id: disciplinaId, vezes_pulada: 1, multiplicador_urgencia: 1.5 });
    if (error) throw error;
  }
}
export async function resetSkip(disciplinaId: string): Promise<void> {
  const { error } = await supabase.from("skip_counts").upsert({ disciplina_id: disciplinaId, vezes_pulada: 0, multiplicador_urgencia: 1.0 }, { onConflict: "disciplina_id" });
  if (error) throw error;
}
export async function fetchUserPrefs(): Promise<UserPrefs> {
  const { data, error } = await supabase.from("user_prefs").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: created, error: insErr } = await supabase.from("user_prefs").insert({ id: 1, nome: "Estudante", sidebar_expandida: true, horas_estudo_dia: 4 }).select().single();
    if (insErr) throw insErr;
    return created as UserPrefs;
  }
  return data as UserPrefs;
}
export async function updateUserPrefs(patch: Partial<Pick<UserPrefs, "nome" | "sidebar_expandida" | "horas_estudo_dia">>): Promise<void> {
  const { error } = await supabase.from("user_prefs").update(patch).eq("id", 1);
  if (error) throw error;
}
export async function fetchAiMaterial(topicoId: string, kind: string): Promise<AiMaterialRow | null> {
  const { data, error } = await supabase.from("ai_material").select("*").eq("topico_id", topicoId).eq("kind", kind).maybeSingle();
  if (error) throw error;
  return data as AiMaterialRow | null;
}
export async function upsertAiMaterial(disciplinaId: string, topicoId: string, kind: string, contentJson: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("ai_material").upsert({ disciplina_id: disciplinaId, topico_id: topicoId, kind, content_json: contentJson }, { onConflict: "topico_id,kind" });
  if (error) throw error;
}
export async function fetchFlashcardsPendentes(): Promise<FlashcardRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("flashcards").select("*").lte("proxima_revisao", today).order("proxima_revisao");
  if (error) throw error;
  return (data ?? []) as FlashcardRow[];
}
export async function fetchAllFlashcards(): Promise<FlashcardRow[]> {
  const { data, error } = await supabase.from("flashcards").select("*").order("criado_em");
  if (error) throw error;
  return (data ?? []) as FlashcardRow[];
}
export async function insertFlashcards(rows: Omit<FlashcardRow, "id" | "criado_em" | "caixa" | "proxima_revisao">[]): Promise<void> {
  if (rows.length === 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const payload = rows.map((r) => ({ ...r, caixa: 1, proxima_revisao: today }));
  const { error } = await supabase.from("flashcards").insert(payload);
  if (error) throw error;
}
export async function deleteFlashcardsByTopico(topicoId: string): Promise<void> {
  const { error } = await supabase.from("flashcards").delete().eq("topico_id", topicoId);
  if (error) throw error;
}
const LEITNER_INTERVALS = [1, 2, 4, 8, 16];
export async function updateFlashcardLeitner(flashcardId: string, lembrei: boolean): Promise<void> {
  const { data: card, error: fetchErr } = await supabase.from("flashcards").select("*").eq("id", flashcardId).maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!card) return;
  const novaCaixa = lembrei ? Math.min(5, card.caixa + 1) : 1;
  const intervaloDias = LEITNER_INTERVALS[novaCaixa - 1];
  const proxima = new Date();
  proxima.setDate(proxima.getDate() + intervaloDias);
  const { error } = await supabase.from("flashcards").update({ caixa: novaCaixa, proxima_revisao: proxima.toISOString().slice(0, 10) }).eq("id", flashcardId);
  if (error) throw error;
}
export async function fetchRedacoes(): Promise<RedacaoRow[]> {
  const { data, error } = await supabase.from("redacoes").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RedacaoRow[];
}
export async function insertRedacao(tema: string, texto: string): Promise<RedacaoRow> {
  const { data, error } = await supabase.from("redacoes").insert({ tema, texto }).select().single();
  if (error) throw error;
  return data as RedacaoRow;
}
export async function updateRedacaoCorrecao(id: string, nota: number, feedbackJson: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("redacoes").update({ nota, feedback_json: feedbackJson }).eq("id", id);
  if (error) throw error;
}
export async function fetchQuestoes(): Promise<QuestaoRow[]> {
  const { data, error } = await supabase.from("questoes").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuestaoRow[];
}
export async function insertQuestao(row: Omit<QuestaoRow, "id" | "criado_em">): Promise<void> {
  const { error } = await supabase.from("questoes").insert(row);
  if (error) throw error;
}
export async function deleteQuestao(id: string): Promise<void> {
  const { error } = await supabase.from("questoes").delete().eq("id", id);
  if (error) throw error;
}
