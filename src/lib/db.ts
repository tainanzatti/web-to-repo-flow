import { supabase } from "./supabase";

// ─── Types ───

export interface Disciplina {
  id: string;
  nome: string;
  cor: string;
  icon?: string;
  topicos?: Topico[];
}

export interface Topico {
  id: string;
  disciplina_id: string;
  nome: string;
  estudado: boolean;
  ordem: number;
}

export interface Flashcard {
  id: string;
  pergunta: string;
  resposta: string;
  disciplina_id?: string;
  topico_id?: string;
  caixa: number;
  ultima_revisao: string | null;
  proxima_revisao: string | null;
  user_id?: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: "A" | "B" | "C" | "D" | "E";
  explicacao?: string;
  disciplina_id?: string;
  topico_id?: string;
  user_id?: string;
  criado_em: string;
}

export interface QuestaoLancamento {
  id: string;
  questao_id: string;
  resposta_usuario: "A" | "B" | "C" | "D" | "E";
  correta: boolean;
  criado_em: string;
}

export interface Lancamento {
  id: string;
  tipo: "estudo" | "questao" | "simulado" | "redacao";
  disciplina_id?: string;
  topico_id?: string;
  duracao_minutos: number;
  acertos?: number;
  erros?: number;
  criado_em: string;
  user_id?: string;
}

export interface Redacao {
  id: string;
  tema: string;
  conteudo: string;
  nota?: number;
  correcao_ia?: string;
  criado_em: string;
  user_id?: string;
}

export interface Perfil {
  id?: string;
  user_id?: string;
  apelido?: string;
  nome_completo?: string;
  data_nascimento?: string;
  avatar_url?: string;
  cidade?: string;
  estado?: string;
  biografia?: string;
  objetivo_estudos?: string;
  profissao?: string;
  email?: string;
  criado_em?: string;
}

export interface RankingRow {
  user_id: string;
  nome: string;
  xp_total: number;
  taxa_acertos: number;
  questoes_respondidas: number;
  questoes_corretas: number;
  topicos_estudados: number;
  horas_estudadas: number;
  dias_consecutivos: number;
  percentual_edital: number;
  patente: string;
  patente_level: number;
  ultima_atividade: string | null;
}

export interface UserEvolutionRow {
  data: string;
  xp_gained: number;
  xp_acumulado: number;
}

export interface UserDisciplinaPerf {
  disciplina_id: string;
  disciplina_nome: string;
  dominio: number;
  questoes: number;
  acertos: number;
}

// ─── Disciplinas & Tópicos ───

export async function fetchDisciplinas(): Promise<Disciplina[]> {
  const { data: disc, error: e1 } = await supabase.from("disciplinas").select("*").order("nome");
  if (e1) throw e1;
  const { data: tops, error: e2 } = await supabase.from("topicos").select("*").order("ordem");
  if (e2) throw e2;
  return (disc ?? []).map((d: Disciplina) => ({
    ...d,
    topicos: (tops ?? []).filter((t: Topico) => t.disciplina_id === d.id),
  }));
}

export async function toggleTopicoEstudado(topicoId: string, estudado: boolean): Promise<void> {
  const { error } = await supabase.from("topicos").update({ estudado }).eq("id", topicoId);
  if (error) throw error;
}

// ─── Flashcards ───

export async function fetchFlashcards(): Promise<Flashcard[]> {
  const { data, error } = await supabase.from("flashcards").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createFlashcard(fc: Omit<Flashcard, "id" | "criado_em" | "ultima_revisao" | "proxima_revisao" | "caixa">): Promise<void> {
  const { error } = await supabase.from("flashcards").insert({ ...fc, caixa: 1, ultima_revisao: null, proxima_revisao: new Date().toISOString() });
  if (error) throw error;
}

export async function reviewFlashcard(id: string, acertou: boolean): Promise<void> {
  const { data, error } = await supabase.from("flashcards").select("caixa").eq("id", id).maybeSingle();
  if (error) throw error;
  const caixa = data?.caixa ?? 1;
  const novaCaixa = acertou ? Math.min(caixa + 1, 5) : 1;
  const dias = [1, 2, 4, 8, 16][novaCaixa - 1] ?? 1;
  const proxima = new Date();
  proxima.setDate(proxima.getDate() + dias);
  const { error: u } = await supabase.from("flashcards").update({ caixa: novaCaixa, ultima_revisao: new Date().toISOString(), proxima_revisao: proxima.toISOString() }).eq("id", id);
  if (u) throw u;
}

// ─── Questões ───

export async function fetchQuestoes(limit = 20): Promise<Questao[]> {
  const { data, error } = await supabase.from("questoes").select("*").order("criado_em", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function registrarRespostaQuestao(questaoId: string, resposta: "A" | "B" | "C" | "D" | "E", correta: boolean): Promise<void> {
  const { error } = await supabase.from("questao_lancamentos").insert({ questao_id: questaoId, resposta_usuario: resposta, correta });
  if (error) throw error;
}

// ─── Lancamentos ───

export async function fetchLancamentos(limit = 50): Promise<Lancamento[]> {
  const { data, error } = await supabase.from("lancamentos").select("*").order("criado_em", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createLancamento(l: Omit<Lancamento, "id" | "criado_em">): Promise<void> {
  const { error } = await supabase.from("lancamentos").insert({ ...l, criado_em: new Date().toISOString() });
  if (error) throw error;
}

// ─── Redações ───

export async function fetchRedacoes(): Promise<Redacao[]> {
  const { data, error } = await supabase.from("redacoes").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRedacao(tema: string, conteudo: string): Promise<Redacao | null> {
  const { data, error } = await supabase.from("redacoes").insert({ tema, conteudo, criado_em: new Date().toISOString() }).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRedacaoNota(id: string, nota: number, correcaoIa: string): Promise<void> {
  const { error } = await supabase.from("redacoes").update({ nota, correcao_ia: correcaoIa }).eq("id", id);
  if (error) throw error;
}

// ─── Perfil ───

export async function fetchPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase.from("perfis").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  // Create default profile if none exists
  const { data: created, error: ce } = await supabase.from("perfis").insert({ user_id: userId }).select().maybeSingle();
  if (ce) throw ce;
  return created;
}

export async function updatePerfil(userId: string, updates: Partial<Record<string, string | null>>): Promise<void> {
  const { error } = await supabase.from("perfis").update(updates).eq("user_id", userId);
  if (error) throw error;
}

// ─── Ranking ───

export async function fetchRanking(period: "all" | "week" | "month" | "year" = "all"): Promise<RankingRow[]> {
  const { data, error } = await supabase.rpc("get_ranking", { p_period: period });
  if (error) throw error;
  return (data ?? []) as RankingRow[];
}

export async function fetchUserEvolution(userId: string, days = 30): Promise<UserEvolutionRow[]> {
  const { data, error } = await supabase.rpc("get_user_evolution", { p_uid: userId, p_days: days });
  if (error) throw error;
  return (data ?? []) as UserEvolutionRow[];
}

export async function fetchUserDisciplinasPerformance(userId: string): Promise<UserDisciplinaPerf[]> {
  const { data, error } = await supabase.rpc("get_user_disciplinas_performance", { p_uid: userId });
  if (error) throw error;
  return (data ?? []) as UserDisciplinaPerf[];
}

// ─── Study time ───

export async function recordStudyTime(disciplinaId: string | null, topicoId: string | null, minutos: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const { data: existing, error: fe } = await supabase
    .from("study_time_daily")
    .select("*")
    .eq("data", today)
    .maybeSingle();
  if (fe) throw fe;
  if (existing) {
    const { error } = await supabase
      .from("study_time_daily")
      .update({ minutos: (existing.minutos ?? 0) + minutos })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("study_time_daily")
      .insert({ data: today, minutos, disciplina_id: disciplinaId, topico_id: topicoId });
    if (error) throw error;
  }
}
