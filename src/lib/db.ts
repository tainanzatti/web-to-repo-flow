import { supabase } from "./supabase";
import type { Discipline, Topic, Lancamento, QuestaoRow } from "./curriculum";

export interface ProfileRow { id: string; nome: string; email: string; telefone: string | null; data_nascimento: string | null; cpf: string | null; tema: string | null; }
export interface FlashcardRow { id: string; disciplina_id: string; topico_id: string; pergunta: string; resposta: string; caixa: number; proxima_revisao: string; }
export interface QuestaoLancamentoRow { id: string; user_id: string; disciplina_id: string; topico_id: string | null; quantidade: number; acertos: number; erros: number; fonte: string | null; criado_em: string; }
export interface LeiSecaRow { id: string; topico_id: string; tipo: string; titulo: string; url: string; criado_em: string; }
export interface RedacaoRow { id: string; tema: string; texto: string; nota: number | null; criado_em: string; }
export interface StudyTimeStats { today: number; week: number; month: number; total: number; }

export async function fetchProfile(uid: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  return data as ProfileRow | null;
}
export async function fetchDisciplines(): Promise<Discipline[]> {
  const { data } = await supabase.from("disciplines").select("*").order("ordem");
  return (data ?? []) as Discipline[];
}
export async function fetchAllTopics(): Promise<Topic[]> {
  const { data } = await supabase.from("topics").select("*").order("ordem");
  return (data ?? []) as Topic[];
}
export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data } = await supabase.from("lancamentos").select("*").order("criado_em", { ascending: false });
  return (data ?? []) as Lancamento[];
}
export async function insertLancamento(disciplinaId: string, topicoId: string, mastery: number): Promise<void> {
  const { error } = await supabase.from("lancamentos").insert({ disciplina_id: disciplinaId, topico_id: topicoId, mastery, is_primeiro_contato: false });
  if (error) throw error;
}
export async function fetchQuestoes(): Promise<QuestaoRow[]> {
  const { data } = await supabase.from("questoes").select("*").order("criado_em", { ascending: false });
  return (data ?? []) as QuestaoRow[];
}
export async function insertQuestao(disciplinaId: string, topicoId: string | null, acertou: boolean, fonte: string | null): Promise<void> {
  const { error } = await supabase.from("questoes").insert({ disciplina_id: disciplinaId, topico_id: topicoId, acertou, fonte });
  if (error) throw error;
}
export async function deleteQuestao(id: string): Promise<void> {
  const { error } = await supabase.from("questoes").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchQuestaoLancamentos(): Promise<QuestaoLancamentoRow[]> {
  const { data } = await supabase.from("questao_lancamentos").select("*").order("criado_em", { ascending: false });
  return (data ?? []) as QuestaoLancamentoRow[];
}
export async function insertQuestaoLancamento(disciplinaId: string, topicoId: string | null, quantidade: number, acertos: number, fonte: string | null): Promise<QuestaoLancamentoRow | null> {
  const erros = Math.max(0, quantidade - acertos);
  const { data, error } = await supabase.from("questao_lancamentos").insert({ disciplina_id: disciplinaId, topico_id: topicoId, quantidade, acertos, erros, fonte }).select().single();
  if (error) throw error;
  return data as QuestaoLancamentoRow | null;
}
export async function deleteQuestaoLancamento(id: string): Promise<void> {
  const { error } = await supabase.from("questao_lancamentos").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchSkipCounts(): Promise<Record<string, number>> {
  const { data } = await supabase.from("skip_counts").select("*");
  const m: Record<string, number> = {}; for (const r of data ?? []) m[r.disciplina_id] = r.vezes_pulada;
  return m;
}
export async function incrementSkipCount(disciplinaId: string): Promise<void> {
  const { data } = await supabase.from("skip_counts").select("*").eq("disciplina_id", disciplinaId).maybeSingle();
  if (data) await supabase.from("skip_counts").update({ vezes_pulada: (data as { vezes_pulada: number }).vezes_pulada + 1 }).eq("disciplina_id", disciplinaId);
  else await supabase.from("skip_counts").insert({ disciplina_id: disciplinaId, vezes_pulada: 1, multiplicador_urgencia: 1.5 });
}
export async function resetSkipCount(disciplinaId: string): Promise<void> {
  await supabase.from("skip_counts").delete().eq("disciplina_id", disciplinaId);
}
export async function fetchFlashcards(): Promise<FlashcardRow[]> {
  const { data } = await supabase.from("flashcards").select("*");
  return (data ?? []) as FlashcardRow[];
}
export async function updateFlashcardBox(id: string, caixa: number): Promise<void> {
  const today = new Date(); const days = [1,2,4,8,16][caixa - 1] ?? 1; today.setDate(today.getDate() + days);
  const { error } = await supabase.from("flashcards").update({ caixa, proxima_revisao: today.toISOString().slice(0, 10) }).eq("id", id);
  if (error) throw error;
}
export async function fetchLeiSeca(topicoId: string): Promise<LeiSecaRow[]> {
  const { data } = await supabase.from("lei_seca").select("*").eq("topico_id", topicoId).order("criado_em", { ascending: false });
  return (data ?? []) as LeiSecaRow[];
}
export async function insertLeiSecaLink(topicoId: string, titulo: string, url: string): Promise<void> {
  const { error } = await supabase.from("lei_seca").insert({ topico_id: topicoId, tipo: "link", titulo, url });
  if (error) throw error;
}
export async function uploadLeiSecaFile(topicoId: string, file: File): Promise<void> {
  const fileName = `${topicoId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("lei-seca").upload(fileName, file);
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from("lei-seca").getPublicUrl(fileName);
  const { error } = await supabase.from("lei_seca").insert({ topico_id: topicoId, tipo: "arquivo", titulo: file.name, url: urlData.publicUrl });
  if (error) throw error;
}
export async function deleteLeiSeca(id: string): Promise<void> {
  const { error } = await supabase.from("lei_seca").delete().eq("id", id);
  if (error) throw error;
}
export async function fetchLeiSecaContexto(topicoId: string): Promise<string> {
  const items = await fetchLeiSeca(topicoId);
  if (items.length === 0) return "";
  return items.map((i) => `${i.titulo}: ${i.url}`).join("\n");
}
export async function fetchResumo(topicoId: string): Promise<string | null> {
  const { data } = await supabase.from("ai_material").select("content_json").eq("topico_id", topicoId).eq("kind", "resumo").order("criado_em", { ascending: false }).limit(1).maybeSingle();
  const json = data as { content_json?: { resumo?: string } } | null;
  return json?.content_json?.resumo ?? null;
}
export async function insertResumo(disciplinaId: string, topicoId: string, resumo: string): Promise<void> {
  const { error } = await supabase.from("ai_material").insert({ disciplina_id: disciplinaId, topico_id: topicoId, kind: "resumo", content_json: { resumo } });
  if (error) throw error;
}
export async function fetchRedacoes(): Promise<RedacaoRow[]> {
  const { data } = await supabase.from("redacoes").select("*").order("criado_em", { ascending: false });
  return (data ?? []) as RedacaoRow[];
}
export async function insertRedacao(tema: string, texto: string): Promise<void> {
  const { error } = await supabase.from("redacoes").insert({ tema, texto });
  if (error) throw error;
}
export async function updateRedacaoNota(id: string, nota: number): Promise<void> {
  const { error } = await supabase.from("redacoes").update({ nota }).eq("id", id);
  if (error) throw error;
}
export async function fetchPlanoHoje(): Promise<{ id: string; plano_json: unknown } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("planos_estudo").select("id, plano_json").eq("data", today).maybeSingle();
  return data as { id: string; plano_json: unknown } | null;
}
export async function savePlanoHoje(plano: unknown): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await fetchPlanoHoje();
  if (existing) await supabase.from("planos_estudo").update({ plano_json: plano }).eq("id", existing.id);
  else await supabase.from("planos_estudo").insert({ data: today, plano_json: plano });
}
export async function fetchStudyTimeStats(): Promise<StudyTimeStats> {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
  const { data: todayData } = await supabase.from("study_time_daily").select("tempo_segundos").eq("data", today).maybeSingle();
  const { data: weekData } = await supabase.from("study_time_daily").select("tempo_segundos").gte("data", weekAgo.toISOString().slice(0, 10));
  const { data: monthData } = await supabase.from("study_time_daily").select("tempo_segundos").gte("data", monthAgo.toISOString().slice(0, 10));
  const { data: allData } = await supabase.from("study_time_daily").select("tempo_segundos");
  const sum = (arr: { tempo_segundos: number }[] | null) => (arr ?? []).reduce((a, b) => a + b.tempo_segundos, 0);
  return { today: (todayData as { tempo_segundos: number } | null)?.tempo_segundos ?? 0, week: sum(weekData as { tempo_segundos: number }[] | null), month: sum(monthData as { tempo_segundos: number }[] | null), total: sum(allData as { tempo_segundos: number }[] | null) };
}
export async function startStudySession(): Promise<{ id: string } | null> {
  const { data, error } = await supabase.from("study_sessions").insert({ inicio: new Date().toISOString() }).select("id").single();
  if (error) throw error;
  return data as { id: string } | null;
}
export async function endStudySession(id: string, duracao: number): Promise<void> {
  await supabase.from("study_sessions").update({ fim: new Date().toISOString(), duracao_segundos: duracao }).eq("id", id);
}
export async function fetchActiveSession(): Promise<{ id: string; inicio: string } | null> {
  const { data } = await supabase.from("study_sessions").select("id, inicio").is("fim", null).order("criado_em", { ascending: false }).limit(1).maybeSingle();
  return data as { id: string; inicio: string } | null;
}
export async function addDailyTime(seconds: number): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("study_time_daily").select("id, tempo_segundos").eq("data", today).maybeSingle();
  if (data) await supabase.from("study_time_daily").update({ tempo_segundos: (data as { tempo_segundos: number }).tempo_segundos + seconds }).eq("id", (data as { id: string }).id);
  else await supabase.from("study_time_daily").insert({ data: today, tempo_segundos: seconds });
}
export async function resetAllProgress(): Promise<void> {
  const tables = ["lancamentos", "questoes", "questao_lancamentos", "flashcards", "skip_counts", "planos_estudo", "study_sessions", "study_time_daily", "ai_material", "lei_seca", "redacoes"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) { try { await supabase.from(table).delete().neq("criado_em", "1900-01-01"); } catch {} }
  }
}

export interface RankingRow {
  user_id: string; nome: string; email: string; xp_total: number; patente: string; patente_level: number;
  questoes_respondidas: number; questoes_corretas: number; taxa_acertos: number; topicos_estudados: number;
  horas_estudadas: number; dias_consecutivos: number; percentual_edital: number; ultima_atividade: string | null;
}
export async function fetchRanking(period: string): Promise<RankingRow[]> {
  const { data, error } = await supabase.rpc("get_ranking", { period });
  if (error) throw error;
  return (data ?? []) as RankingRow[];
}
export interface UserEvolutionRow { data: string; xp_gained: number; }
export async function fetchUserEvolution(uid: string, days: number = 30): Promise<UserEvolutionRow[]> {
  const { data, error } = await supabase.rpc("get_user_evolution", { uid, days_count: days });
  if (error) throw error;
  return (data ?? []) as UserEvolutionRow[];
}
export interface UserDisciplinaPerf { disciplina_id: string; disciplina_nome: string; dominio: number; questoes: number; acertos: number; taxa_acertos: number; }
export async function fetchUserDisciplinasPerformance(uid: string): Promise<UserDisciplinaPerf[]> {
  const { data, error } = await supabase.rpc("get_user_disciplinas_performance", { uid });
  if (error) throw error;
  return (data ?? []) as UserDisciplinaPerf[];
}
