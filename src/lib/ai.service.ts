import { supabase } from "./supabase";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface QuestaoGerada {
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: "A" | "B" | "C" | "D" | "E";
  explicacao: string;
}

export interface CorrecaoRedacao {
  nota: number;
  criterios: { nome: string; nota: number; comentario: string }[];
  feedback: string;
}

export interface AnaliseDesempenho {
  resumo: string;
  pontos_fortes: string[];
  pontos_fracos: string[];
  sugestoes: string[];
}

export interface PlanoAIInput {
  dias: number;
  horas_por_dia: number;
  disciplinas: string[];
  nivel: string;
}

const SYSTEM_PROMPT =
  "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. " +
  "Sua missão é ajudar o aluno com explicações claras, questões no estilo AOCP, correções de redação e orientações de estudo. " +
  "Sempre use linguagem didática, precisa e motivadora. Adapte o nível ao aluno.";

async function callEdgeFunction(name: string, body: Record<string, unknown> | object): Promise<Record<string, unknown>> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;
  if (!token) throw new Error("Não autenticado");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Erro ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

export async function aiChat(messages: ChatMessage[], context?: { disciplina?: string; topico?: string }): Promise<string> {
  const data = await callEdgeFunction("ai-chat", { messages, context });
  return (data as { resposta: string }).resposta ?? "";
}

export async function aiExplicar(topico: string, disciplina?: string): Promise<string> {
  const data = await callEdgeFunction("ai-explicar", { topico, disciplina });
  return (data as { resposta: string }).resposta ?? "";
}

export async function aiResumo(conteudo: string): Promise<string> {
  const data = await callEdgeFunction("gerar-resumo", { conteudo });
  return (data as { resumo: string }).resumo ?? "";
}

export async function aiGerarQuestoes(disciplina: string, topico: string, quantidade = 5): Promise<QuestaoGerada[]> {
  const data = await callEdgeFunction("ai-questoes", { disciplina, topico, quantidade });
  return (data as { questoes: QuestaoGerada[] }).questoes ?? [];
}

export async function aiExplicarAlternativa(enunciado: string, alternativa: string, correta: boolean, explicacao?: string): Promise<string> {
  const data = await callEdgeFunction("ai-explicar-alternativa", { enunciado, alternativa, correta, explicacao });
  return (data as { resposta: string }).resposta ?? "";
}

export async function aiCorrigirRedacao(tema: string, conteudo: string): Promise<CorrecaoRedacao> {
  const data = await callEdgeFunction("ai-corrigir-redacao", { tema, conteudo });
  return data as unknown as CorrecaoRedacao;
}

export async function aiAnaliseDesempenho(dados: Record<string, unknown>): Promise<AnaliseDesempenho> {
  const data = await callEdgeFunction("ai-analise-desempenho", { dados });
  return data as unknown as AnaliseDesempenho;
}

export async function aiRecomendacoes(dados: Record<string, unknown>): Promise<string[]> {
  const data = await callEdgeFunction("ai-recomendacoes", { dados });
  return (data as { recomendacoes: string[] }).recomendacoes ?? [];
}

export async function aiGerarTemaRedacao(area?: string): Promise<string> {
  const data = await callEdgeFunction("gerar-tema-redacao", { area });
  return (data as { tema: string }).tema ?? "";
}

export async function aiGerarPlano(input: PlanoAIInput): Promise<string> {
  const data = await callEdgeFunction("gerar-plano", input);
  return (data as { plano: string }).plano ?? "";
}
