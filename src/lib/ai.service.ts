/**
 * Centralized AI Service Layer
 *
 * ALL AI calls go through edge functions (server-side) to keep LOVABLE_API_KEY
 * secret. This module is the single frontend entry point for AI features.
 *
 * Provider: Lovable AI Gateway
 * Endpoint: https://ai.gateway.lovable.dev/v1/chat/completions
 * Model: google/gemini-3-flash-preview
 *
 * The actual API key and model live server-side in the edge functions.
 * This client layer just calls the edge functions and handles responses.
 */

import { supabase } from "./supabase";

const SYSTEM_PROMPT =
  "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. " +
  "Você deve: explicar conteúdos conforme o edital; utilizar linguagem didática; criar questões semelhantes ao padrão AOCP; " +
  "analisar erros dos alunos; sugerir revisões. Sempre responda em português brasileiro.";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

async function callEdgeFunction(slug: string, body: Record<string, unknown>): Promise<AIResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { content: "", error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${slug}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return { content: "", error: errBody.error ?? `Erro ${response.status}` };
    }

    const json = await response.json();
    if (json.error) return { content: "", error: json.error };
    return { content: json.content ?? json.resumo ?? json.tema ?? "" };
  } catch (err) {
    return { content: "", error: (err as Error).message };
  }
}

/** Chat inteligente de estudos — conversa livre com contexto de estudo */
export async function aiChat(
  messages: ChatMessage[],
  context?: { disciplina?: string; topico?: string }
): Promise<AIResponse> {
  return callEdgeFunction("ai-chat", {
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    disciplina: context?.disciplina,
    topico: context?.topico,
  });
}

/** Explicação de conteúdos — explica um tópico específico */
export async function aiExplicar(
  topico: string,
  disciplina: string,
  pergunta?: string
): Promise<AIResponse> {
  return callEdgeFunction("ai-explicar", {
    topico,
    disciplina,
    pergunta,
    system_prompt: SYSTEM_PROMPT,
  });
}

/** Resumos automáticos — gera um resumo de estudo */
export async function aiResumo(
  topico: string,
  disciplina: string,
  leiSecaContexto?: string
): Promise<AIResponse> {
  return callEdgeFunction("ai-resumo", {
    topico,
    disciplina,
    lei_seca_contexto: leiSecaContexto,
    system_prompt: SYSTEM_PROMPT,
  });
}

/** Criação de questões no estilo AOCP */
export interface QuestaoGerada {
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  correta: string;
  explicacao: string;
}

export async function aiGerarQuestoes(
  disciplina: string,
  topico: string,
  quantidade: number = 5
): Promise<{ questoes: QuestaoGerada[]; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { questoes: [], error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-questoes`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ disciplina, topico, quantidade, system_prompt: SYSTEM_PROMPT }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { questoes: [], error: err.error ?? `Erro ${response.status}` };
    }

    const json = await response.json();
    if (json.error) return { questoes: [], error: json.error };
    return { questoes: json.questoes ?? [] };
  } catch (err) {
    return { questoes: [], error: (err as Error).message };
  }
}

/** Explicação de alternativa — por que uma alternativa está certa/errada */
export async function aiExplicarAlternativa(
  enunciado: string,
  alternativaCorreta: string,
  alternativas: { letra: string; texto: string }[],
  disciplina: string
): Promise<AIResponse> {
  return callEdgeFunction("ai-explicar-alternativa", {
    enunciado,
    alternativa_correta: alternativaCorreta,
    alternativas,
    disciplina,
    system_prompt: SYSTEM_PROMPT,
  });
}

/** Correção de redação discursiva */
export interface CorrecaoRedacao {
  nota: number;
  feedback: string;
  criterios: { nome: string; nota: number; comentario: string }[];
}

export async function aiCorrigirRedacao(
  tema: string,
  texto: string
): Promise<{ correcao: CorrecaoRedacao | null; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { correcao: null, error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-corrigir-redacao`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tema, texto, system_prompt: SYSTEM_PROMPT }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { correcao: null, error: err.error ?? `Erro ${response.status}` };
    }

    const json = await response.json();
    if (json.error) return { correcao: null, error: json.error };
    return { correcao: json.correcao ?? null };
  } catch (err) {
    return { correcao: null, error: (err as Error).message };
  }
}

/** Análise de desempenho do aluno */
export interface AnaliseDesempenho {
  resumo: string;
  pontosFortes: string[];
  pontosFracos: string[];
  recomendacoes: string[];
}

export async function aiAnaliseDesempenho(dados: {
  disciplinas: { nome: string; dominio: number; questoes: number; acertos: number; taxa: number }[];
  taxaAcertosGeral: number;
  horasEstudadas: number;
  topicosEstudados: number;
  diasConsecutivos: number;
}): Promise<{ analise: AnaliseDesempenho | null; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { analise: null, error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analise-desempenho`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...dados, system_prompt: SYSTEM_PROMPT }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { analise: null, error: err.error ?? `Erro ${response.status}` };
    }

    const json = await response.json();
    if (json.error) return { analise: null, error: json.error };
    return { analise: json.analise ?? null };
  } catch (err) {
    return { analise: null, error: (err as Error).message };
  }
}

/** Recomendações personalizadas de estudo */
export async function aiRecomendacoes(dados: {
  disciplinas: { nome: string; dominio: number; peso_edital: number; topicosNaoDominados: number }[];
  diasRestantes: number;
}): Promise<{ recomendacoes: string[] | null; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { recomendacoes: null, error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-recomendacoes`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...dados, system_prompt: SYSTEM_PROMPT }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { recomendacoes: null, error: err.error ?? `Erro ${response.status}` };
    }

    const json = await response.json();
    if (json.error) return { recomendacoes: null, error: json.error };
    return { recomendacoes: json.recomendacoes ?? null };
  } catch (err) {
    return { recomendacoes: null, error: (err as Error).message };
  }
}

/** Geração de tema de redação (mantém compatibilidade com o código existente) */
export async function aiGerarTemaRedacao(conteudoUsuario: string): Promise<{ tema?: string; error?: string }> {
  const { content, error } = await callEdgeFunction("ai-tema-redacao", {
    conteudo: conteudoUsuario,
    system_prompt: SYSTEM_PROMPT,
  });
  if (error) return { error };
  return { tema: content };
}

/** Geração de plano de estudo com IA (mantém compatibilidade) */
export interface PlanoAIInput {
  topico_id: string;
  topico_nome: string;
  disciplina_nome: string;
  mastery: number;
  revisoes: number;
  dias_desde_ultima: number;
  questoes: number;
  acertos: number;
  taxa_acertos: number;
  taxa_erros: number;
  peso_edital: number;
}

export async function aiGerarPlano(
  topicos: PlanoAIInput[]
): Promise<{ plano?: { itens: { topico_id: string; topico_nome: string; disciplina_nome: string; tempo_minutos: number; prioridade: string; motivo: string }[]; tempo_total: number }; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { error: "Não autenticado" };

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-plano`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ topicos, system_prompt: SYSTEM_PROMPT }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { error: err.error ?? `Erro ${response.status}` };
    }

    const json = await response.json();
    if (json.error) return { error: json.error };
    return { plano: json.plano };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
