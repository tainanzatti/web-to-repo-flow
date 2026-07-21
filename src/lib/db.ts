import { supabase } from "./supabase";
import type { Discipline, Topic, Lancamento } from "./curriculum";

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase.from("disciplines").select("*").order("ordem");
  if (error) throw error;
  return (data ?? []) as Discipline[];
}

export async function fetchAllTopics(): Promise<Topic[]> {
  const { data, error } = await supabase.from("topics").select("*").order("ordem");
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function fetchLancamentos(disciplinaId?: string): Promise<Lancamento[]> {
  let query = supabase.from("lancamentos").select("*");
  if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
  const { data, error } = await query.order("criado_em", { ascending: false });
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
    map[(row as { disciplina_id: string }).disciplina_id] = (row as { vezes_pulada: number }).vezes_pulada;
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
      .update({ vezes_pulada: (data as { vezes_pulada: number }).vezes_pulada + 1 })
      .eq("disciplina_id", disciplinaId);
    if (e2) throw e2;
  } else {
    const { error: e3 } = await supabase
      .from("skip_counts")
      .insert({ disciplina_id: disciplinaId, vezes_pulada: 1 });
    if (e3) throw e3;
  }
}

export async function resetSkipCount(disciplinaId: string): Promise<void> {
  const { error } = await supabase.from("skip_counts").delete().eq("disciplina_id", disciplinaId);
  if (error) throw error;
}

export interface FlashcardRow {
  id: string;
  disciplina_id: string;
  topico_id: string;
  pergunta: string;
  resposta: string;
  caixa: number;
  proxima_revisao: string | null;
  criado_em: string;
}

export async function fetchFlashcards(disciplinaId?: string): Promise<FlashcardRow[]> {
  let query = supabase.from("flashcards").select("*");
  if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
  const { data, error } = await query.order("criado_em");
  if (error) throw error;
  return (data ?? []) as FlashcardRow[];
}

export async function updateFlashcardBox(id: string, caixa: number): Promise<void> {
  const today = new Date();
  const days = LEITNER_BOXES[Math.min(caixa - 1, LEITNER_BOXES.length - 1)];
  const next = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const { error } = await supabase
    .from("flashcards")
    .update({ caixa, proxima_revisao: next.toISOString().slice(0, 10) })
    .eq("id", id);
  if (error) throw error;
}

import { LEITNER_BOXES } from "./curriculum";

export interface QuestaoRow {
  id: string;
  disciplina_id: string;
  topico_id: string | null;
  acertou: boolean;
  fonte: string | null;
  criado_em: string;
}

export async function fetchQuestoes(disciplinaId?: string): Promise<QuestaoRow[]> {
  let query = supabase.from("questoes").select("*");
  if (disciplinaId) query = query.eq("disciplina_id", disciplinaId);
  const { data, error } = await query.order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as QuestaoRow[];
}

export async function insertQuestao(
  disciplinaId: string,
  topicoId: string | null,
  acertou: boolean,
  fonte: string | null
): Promise<void> {
  const { error } = await supabase
    .from("questoes")
    .insert({ disciplina_id: disciplinaId, topico_id: topicoId, acertou, fonte });
  if (error) throw error;
}

export interface RedacaoRow {
  id: string;
  tema: string;
  texto: string;
  nota: number | null;
  feedback_json: { nota?: number; correcao?: string } | null;
  criado_em: string;
}

export async function fetchRedacoes(): Promise<RedacaoRow[]> {
  const { data, error } = await supabase.from("redacoes").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RedacaoRow[];
}

export async function insertRedacao(tema: string, texto: string): Promise<RedacaoRow> {
  const { data, error } = await supabase
    .from("redacoes")
    .insert({ tema, texto, nota: null, feedback_json: null })
    .select("*")
    .single();
  if (error) throw error;
  return data as RedacaoRow;
}

export async function updateRedacaoCorrecao(id: string, nota: number, feedback: object): Promise<void> {
  const { error } = await supabase
    .from("redacoes")
    .update({ nota, feedback_json: feedback })
    .eq("id", id);
  if (error) throw error;
}

export interface ProfileRow {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  data_nascimento: string | null;
  cpf: string | null;
  criado_em: string;
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

// --- Lei Seca ---

export interface LeiSecaRow {
  id: string;
  topico_id: string;
  tipo: "link" | "arquivo";
  titulo: string;
  url: string;
  criado_em: string;
}

export async function fetchLeiSeca(topicoId: string): Promise<LeiSecaRow[]> {
  const { data, error } = await supabase
    .from("lei_seca")
    .select("*")
    .eq("topico_id", topicoId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeiSecaRow[];
}

export async function insertLeiSecaLink(topicoId: string, titulo: string, url: string): Promise<void> {
  const { error } = await supabase
    .from("lei_seca")
    .insert({ topico_id: topicoId, tipo: "link", titulo, url });
  if (error) throw error;
}

export async function uploadLeiSecaFile(topicoId: string, file: File): Promise<LeiSecaRow | null> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${topicoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("lei-seca")
    .upload(path, file);
  if (uploadErr) throw uploadErr;
  const { data: pub } = supabase.storage.from("lei-seca").getPublicUrl(path);
  const { data, error } = await supabase
    .from("lei_seca")
    .insert({ topico_id: topicoId, tipo: "arquivo", titulo: file.name, url: pub.publicUrl })
    .select("*")
    .single();
  if (error) throw error;
  return data as LeiSecaRow;
}

export async function deleteLeiSeca(id: string): Promise<void> {
  const { error } = await supabase.from("lei_seca").delete().eq("id", id);
  if (error) throw error;
}

// --- AI Resumo ---

export interface AIMaterialRow {
  id: string;
  disciplina_id: string;
  topico_id: string;
  kind: string;
  content_json: { resumo?: string } | null;
  criado_em: string;
}

export async function fetchResumo(topicoId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_material")
    .select("*")
    .eq("topico_id", topicoId)
    .eq("kind", "resumo")
    .maybeSingle();
  if (error) throw error;
  const row = data as AIMaterialRow | null;
  return row?.content_json?.resumo ?? null;
}

export async function insertResumo(
  disciplinaId: string,
  topicoId: string,
  resumo: string
): Promise<void> {
  const { error } = await supabase
    .from("ai_material")
    .insert({
      disciplina_id: disciplinaId,
      topico_id: topicoId,
      kind: "resumo",
      content_json: { resumo },
    });
  if (error) throw error;
}

export async function fetchLeiSecaContexto(topicoId: string): Promise<string> {
  const items = await fetchLeiSeca(topicoId);
  const links = items.filter((i) => i.tipo === "link").map((i) => `${i.titulo}: ${i.url}`);
  const arquivos = items.filter((i) => i.tipo === "arquivo").map((i) => `${i.titulo} (arquivo anexado)`);
  return [...links, ...arquivos].join("\n");
}
