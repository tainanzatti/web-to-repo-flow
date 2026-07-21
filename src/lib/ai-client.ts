const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL ?? "";

interface AIResponse {
  data?: string;
  error?: string;
}

export async function callAI(endpoint: string, body: unknown): Promise<AIResponse> {
  try {
    const url = AI_GATEWAY_URL ? `${AI_GATEWAY_URL}/${endpoint}` : `/api/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { error: `Erro ${res.status}` };
    }
    const json = await res.json();
    return { data: json.result ?? json.text ?? JSON.stringify(json) };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function generateFlashcardsAI(disciplina: string, topico: string): Promise<AIResponse> {
  return callAI("flashcards", { disciplina, topico });
}

export async function generateRedacaoTemaAI(): Promise<AIResponse> {
  return callAI("redacao-tema", {});
}

export async function corrigirRedacaoAI(tema: string, texto: string): Promise<AIResponse> {
  return callAI("redacao-correcao", { tema, texto });
}
