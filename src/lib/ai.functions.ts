import { callAI, type AIKind, type FlashcardPair, type RedacaoCorrecaoResult } from "./ai-client";
import { fetchAiMaterial, upsertAiMaterial, insertFlashcards, deleteFlashcardsByTopico } from "./db";

export type { AIKind, FlashcardPair, RedacaoCorrecaoResult };

interface TopicContext {
  topicoId: string;
  topicoNome: string;
  disciplinaId: string;
  disciplinaNome: string;
}

export async function fetchOrGenerateFlashcards(ctx: TopicContext): Promise<FlashcardPair[]> {
  const cached = await fetchAiMaterial(ctx.topicoId, "flashcards");
  if (cached?.content_json?.flashcards) {
    return cached.content_json.flashcards as FlashcardPair[];
  }

  const result = await callAI<{ flashcards: FlashcardPair[] }>("flashcards", {
    topicoNome: ctx.topicoNome,
    disciplinaNome: ctx.disciplinaNome,
  });

  await upsertAiMaterial(ctx.disciplinaId, ctx.topicoId, "flashcards", result as Record<string, unknown>);
  return result.flashcards;
}

export async function ensureFlashcardsForTopic(ctx: TopicContext): Promise<void> {
  const pairs = await fetchOrGenerateFlashcards(ctx);
  await deleteFlashcardsByTopico(ctx.topicoId);
  await insertFlashcards(
    pairs.map((p) => ({
      disciplina_id: ctx.disciplinaId,
      topico_id: ctx.topicoId,
      pergunta: p.pergunta,
      resposta: p.resposta,
    }))
  );
}

export async function generateRedacaoTema(): Promise<{ tema: string; proposta: string }> {
  const cached = await fetchAiMaterial("redacao", "redacao-tema");
  if (cached?.content_json?.tema) {
    return cached.content_json as { tema: string; proposta: string };
  }

  const result = await callAI<{ tema: string; proposta: string }>("redacao-tema", {});
  await upsertAiMaterial("redacao", "redacao", "redacao-tema", result as Record<string, unknown>);
  return result;
}

export async function corrigirRedacao(texto: string): Promise<RedacaoCorrecaoResult> {
  const result = await callAI<RedacaoCorrecaoResult>("redacao-correcao", {
    textoRedacao: texto,
  });
  return result;
}
