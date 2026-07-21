import { generateFlashcardsAI, generateRedacaoTemaAI, corrigirRedacaoAI } from "./ai-client";
import { fetchAIMaterial, insertAIMaterial, insertFlashcards, type FlashcardRow } from "./db";

export async function fetchOrGenerateFlashcards(
  disciplinaId: string,
  disciplinaNome: string,
  topicoId: string,
  topicoNome: string
): Promise<FlashcardRow[]> {
  const cached = await fetchAIMaterial(topicoId, "flashcards");
  if (cached) {
    try {
      const parsed = JSON.parse(cached.conteudo) as FlashcardRow[];
      return parsed;
    } catch {
      // fall through to generation
    }
  }
  const { data, error } = await generateFlashcardsAI(disciplinaNome, topicoNome);
  if (error || !data) return [];
  await insertAIMaterial(disciplinaId, topicoId, "flashcards", data);
  try {
    const cards = JSON.parse(data) as { pergunta: string; resposta: string }[];
    const rows = await insertFlashcards(
      cards.map((c) => ({
        disciplina_id: disciplinaId,
        topico_id: topicoId,
        pergunta: c.pergunta,
        resposta: c.resposta,
      }))
    );
    return rows;
  } catch {
    return [];
  }
}

export async function ensureFlashcardsForTopic(
  disciplinaId: string,
  disciplinaNome: string,
  topicoId: string,
  topicoNome: string
): Promise<void> {
  const cached = await fetchAIMaterial(topicoId, "flashcards");
  if (cached) return;
  const { data, error } = await generateFlashcardsAI(disciplinaNome, topicoNome);
  if (error || !data) return;
  await insertAIMaterial(disciplinaId, topicoId, "flashcards", data);
  try {
    const cards = JSON.parse(data) as { pergunta: string; resposta: string }[];
    await insertFlashcards(
      cards.map((c) => ({
        disciplina_id: disciplinaId,
        topico_id: topicoId,
        pergunta: c.pergunta,
        resposta: c.resposta,
      }))
    );
  } catch {
    // ignore parse errors
  }
}

export async function generateRedacaoTema(): Promise<string> {
  const { data, error } = await generateRedacaoTemaAI();
  if (error || !data) return "Tema não disponível no momento";
  return data;
}

export interface RedacaoCorrecao {
  nota: number;
  correcao: string;
}

export async function corrigirRedacao(tema: string, texto: string): Promise<RedacaoCorrecao | null> {
  const { data, error } = await corrigirRedacaoAI(tema, texto);
  if (error || !data) return null;
  try {
    const parsed = JSON.parse(data) as RedacaoCorrecao;
    return parsed;
  } catch {
    return null;
  }
}
