import { supabase } from "./supabase";
import type { Discipline, Topic, Lancamento, QuestaoRow } from "./curriculum";
import { LEITNER_BOXES } from "./curriculum";

export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data, error } = await supabase.from("disciplines").select("*").order("ordem"); if (error) throw error; return (data ?? []) as Discipline[];
}
export async function fetchAllTopics(): Promise<Topic[]> {
  const { data, error } = await supabase.from("topics").select("*").order("ordem"); if (error) throw error; return (data ?? []) as Topic[];
}
export async function fetchLancamentos(disciplinaId?: string): Promise<Lancamento[]> {
  let q = supabase.from("lancamentos").select("*"); if (disciplinaId) q = q.eq("disciplina_id", disciplinaId);
  const { data, error } = await q.order("criado_em", { ascending: false }); if (error) throw error; return (data ?? []) as Lancamento[];
}
export async function insertLancamento(disciplinaId: string, topicoId: string | null, mastery: number): Promise<void> {
  const { error } = await supabase.from("lancamentos").insert({ disciplina_id: disciplinaId, topico_id: topicoId, mastery }); if (error) throw error;
}
export async function fetchSkipCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("skip_counts").select("*"); if (error) throw error;
  const map: Record<string, number> = {}; for (const row of data ?? []) map[(row as { disciplina_id: string }).disciplina_id] = (row as { vezes_pulada: number }).vezes_pulada; return map;
}
export async function incrementSkipCount(disciplinaId: string): Promise<void> {
  const { data, error } = await supabase.from("skip_counts").select("*").eq("disciplina_id", disciplinaId).maybeSingle(); if (error) throw error;
  if (data) { const { error: e2 } = await supabase.from("skip_counts").update({ vezes_pulada: (data as { vezes_pulada: number }).vezes_pulada + 1 }).eq("disciplina_id", disciplinaId); if (e2) throw e2; }
  else { const { error: e3 } = await supabase.from("skip_counts").insert({ disciplina_id: disciplinaId, vezes_pulada: 1 }); if (e3) throw e3; }
}
export async function resetSkipCount(disciplinaId: string): Promise<void> {
  const { error } = await supabase.from("skip_counts").delete().eq("disciplina_id", disciplinaId); if (error) throw error;
}
export interface FlashcardRow { id: string; disciplina_id: string; topico_id: string; pergunta: string; resposta: string; caixa: number; proxima_revisao: string | null; criado_em: string; }
export async function fetchFlashcards(disciplinaId?: string): Promise<FlashcardRow[]> {
  let q = supabase.from("flashcards").select("*"); if (disciplinaId) q = q.eq("disciplina_id", disciplinaId);
  const { data, error } = await q.order("criado_em"); if (error) throw error; return (data ?? []) as FlashcardRow[];
}
export async function updateFlashcardBox(id: string, caixa: number): Promise<void> {
  const days = LEITNER_BOXES[Math.min(caixa - 1, LEITNER_BOXES.length - 1)];
  const next = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const { error } = await supabase.from("flashcards").update({ caixa, proxima_revisao: next }).eq("id", id); if (error) throw error;
}
export async function fetchQuestoes(disciplinaId?: string): Promise<QuestaoRow[]> {
  let q = supabase.from("questoes").select("*"); if (disciplinaId) q = q.eq("disciplina_id", disciplinaId);
  const { data, error } = await q.order("criado_em", { ascending: false }); if (error) throw error; return (data ?? []) as QuestaoRow[];
}
export async function insertQuestao(disciplinaId: string, topicoId: string | null, acertou: boolean, fonte: string | null): Promise<void> {
  const { error } = await supabase.from("questoes").insert({ disciplina_id: disciplinaId, topico_id: topicoId, acertou, fonte }); if (error) throw error;
}
export async function deleteQuestao(id: string): Promise<void> {
  const { error } = await supabase.from("questoes").delete().eq("id", id); if (error) throw error;
}

// --- Questão Lançamentos ---
export interface QuestaoLancamentoRow { id: string; user_id: string; disciplina_id: string; topico_id: string | null; quantidade: number; acertos: number; erros: number; fonte: string | null; criado_em: string; }
export async function fetchQuestaoLancamentos(): Promise<QuestaoLancamentoRow[]> {
  const { data, error } = await supabase.from("questao_lancamentos").select("*").order("criado_em", { ascending: false }); if (error) throw error; return (data ?? []) as QuestaoLancamentoRow[];
}
export async function insertQuestaoLancamento(disciplinaId: string, topicoId: string | null, quantidade: number, acertos: number, fonte: string | null): Promise<QuestaoLancamentoRow | null> {
  const erros = Math.max(0, quantidade - acertos);
  const { data, error } = await supabase.from("questao_lancamentos").insert({ disciplina_id: disciplinaId, topico_id: topicoId || null, quantidade, acertos, erros, fonte }).select("*").single(); if (error) throw error; return data as QuestaoLancamentoRow;
}
export async function deleteQuestaoLancamento(id: string): Promise<void> {
  const { error } = await supabase.from("questao_lancamentos").delete().eq("id", id); if (error) throw error;
}

// --- Redação ---
export interface RedacaoRow { id: string; tema: string; texto: string; nota: number | null; feedback_json: { nota?: number; correcao?: string } | null; criado_em: string; }
export async function fetchRedacoes(): Promise<RedacaoRow[]> {
  const { data, error } = await supabase.from("redacoes").select("*").order("criado_em", { ascending: false }); if (error) throw error; return (data ?? []) as RedacaoRow[];
}
export async function insertRedacao(tema: string, texto: string): Promise<RedacaoRow> {
  const { data, error } = await supabase.from("redacoes").insert({ tema, texto, nota: null, feedback_json: null }).select("*").single(); if (error) throw error; return data as RedacaoRow;
}

// --- Profile ---
export interface ProfileRow { id: string; nome: string; email: string; telefone: string | null; data_nascimento: string | null; cpf: string | null; tema: string | null; criado_em: string; }
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(); if (error) throw error; return data as ProfileRow | null;
}

// --- Lei Seca ---
export interface LeiSecaRow { id: string; topico_id: string; tipo: "link" | "arquivo"; titulo: string; url: string; criado_em: string; }
export async function fetchLeiSeca(topicoId: string): Promise<LeiSecaRow[]> {
  const { data, error } = await supabase.from("lei_seca").select("*").eq("topico_id", topicoId).order("criado_em", { ascending: false }); if (error) throw error; return (data ?? []) as LeiSecaRow[];
}
export async function insertLeiSecaLink(topicoId: string, titulo: string, url: string): Promise<void> {
  const { error } = await supabase.from("lei_seca").insert({ topico_id: topicoId, tipo: "link", titulo, url }); if (error) throw error;
}
export async function uploadLeiSecaFile(topicoId: string, file: File): Promise<LeiSecaRow | null> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${topicoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("lei-seca").upload(path, file); if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("lei-seca").getPublicUrl(path);
  const { data, error } = await supabase.from("lei_seca").insert({ topico_id: topicoId, tipo: "arquivo", titulo: file.name, url: pub.publicUrl }).select("*").single(); if (error) throw error; return data as LeiSecaRow;
}
export async function deleteLeiSeca(id: string): Promise<void> {
  const { error } = await supabase.from("lei_seca").delete().eq("id", id); if (error) throw error;
}

// --- AI Resumo ---
export interface AIMaterialRow { id: string; disciplina_id: string; topico_id: string; kind: string; content_json: { resumo?: string } | null; criado_em: string; }
export async function fetchResumo(topicoId: string): Promise<string | null> {
  const { data, error } = await supabase.from("ai_material").select("*").eq("topico_id", topicoId).eq("kind", "resumo").maybeSingle(); if (error) throw error; return (data as AIMaterialRow | null)?.content_json?.resumo ?? null;
}
export async function insertResumo(disciplinaId: string, topicoId: string, resumo: string): Promise<void> {
  const { error } = await supabase.from("ai_material").insert({ disciplina_id: disciplinaId, topico_id: topicoId, kind: "resumo", content_json: { resumo } }); if (error) throw error;
}
export async function fetchLeiSecaContexto(topicoId: string): Promise<string> {
  const items = await fetchLeiSeca(topicoId);
  const links = items.filter((i) => i.tipo === "link").map((i) => `${i.titulo}: ${i.url}`);
  const arquivos = items.filter((i) => i.tipo === "arquivo").map((i) => `${i.titulo} (arquivo anexado)`);
  return [...links, ...arquivos].join("\n");
}

// --- Plano de Estudo ---
export interface PlanoEstudoRow { id: string; data: string; plano_json: { itens: { topico_id: string; topico_nome: string; disciplina_nome: string; tempo_minutos: number; prioridade: string; motivo: string }[]; tempo_total: number }; criado_em: string; }
export async function fetchPlanoHoje(): Promise<PlanoEstudoRow | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("planos_estudo").select("*").eq("data", today).maybeSingle(); if (error) throw error; return data as PlanoEstudoRow | null;
}
export async function savePlanoHoje(plano: { itens: PlanoEstudoRow["plano_json"]["itens"]; tempo_total: number }): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("planos_estudo").delete().eq("data", today);
  const { error } = await supabase.from("planos_estudo").insert({ data: today, plano_json: plano }); if (error) throw error;
}

// --- Study Timer ---
export interface StudySessionRow { id: string; user_id: string; inicio: string; fim: string | null; duracao_segundos: number | null; criado_em: string; }
export async function startStudySession(): Promise<StudySessionRow | null> {
  const { data, error } = await supabase.from("study_sessions").insert({ inicio: new Date().toISOString(), fim: null, duracao_segundos: null }).select("*").single(); if (error) throw error; return data as StudySessionRow;
}
export async function endStudySession(sessionId: string, duracaoSegundos: number): Promise<void> {
  const { error } = await supabase.from("study_sessions").update({ fim: new Date().toISOString(), duracao_segundos: duracaoSegundos }).eq("id", sessionId); if (error) throw error;
}
export async function fetchActiveSession(): Promise<StudySessionRow | null> {
  const { data, error } = await supabase.from("study_sessions").select("*").is("fim", null).order("inicio", { ascending: false }).limit(1).maybeSingle(); if (error) throw error; return data as StudySessionRow | null;
}
export async function addDailyTime(segundos: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("study_time_daily").select("*").eq("data", today).maybeSingle(); if (error) throw error;
  if (data) { const current = (data as { tempo_segundos: number }).tempo_segundos; const { error: e2 } = await supabase.from("study_time_daily").update({ tempo_segundos: current + segundos }).eq("data", today); if (e2) throw e2; }
  else { const { error: e3 } = await supabase.from("study_time_daily").insert({ data: today, tempo_segundos: segundos }); if (e3) throw e3; }
}
export interface StudyTimeStats { today: number; week: number; month: number; total: number; }
export async function fetchStudyTimeStats(): Promise<StudyTimeStats> {
  const { data, error } = await supabase.from("study_time_daily").select("*"); if (error) throw error;
  const now = new Date(); const todayStr = now.toISOString().slice(0, 10);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); const weekStartStr = weekStart.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  let today = 0, week = 0, month = 0, total = 0;
  for (const row of data ?? []) { const r = row as { data: string; tempo_segundos: number }; total += r.tempo_segundos; if (r.data === todayStr) today += r.tempo_segundos; if (r.data >= weekStartStr) week += r.tempo_segundos; if (r.data >= monthStart) month += r.tempo_segundos; }
  return { today, week, month, total };
}

// --- Reset Progress ---
export async function resetAllProgress(): Promise<void> {
  const tables = ["lancamentos", "questoes", "questao_lancamentos", "flashcards", "skip_counts", "planos_estudo", "study_sessions", "study_time_daily", "ai_material", "lei_seca", "redacoes"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { /* some tables may have different PK types, try text filter */ try { await supabase.from(table).delete().neq("criado_em", "1900-01-01"); } catch {} }
  }
}
