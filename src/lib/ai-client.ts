export type AIKind = "leiseca" | "resumo" | "questoes" | "flashcards" | "redacao-tema" | "redacao-correcao";
export interface FlashcardPair { pergunta: string; resposta: string; }
export interface RedacaoCorrecaoResult {
  nota: number;
  feedback: { compreensao_tema: string; argumentacao: string; estrutura_coesao: string; norma_culta: string; conclusao_proposta: string; };
}

const AI_GATEWAY_URL = "https://ai-gateway.bolt.app/v1/chat/completions";
const AI_GATEWAY_MODEL = "gpt-4o-mini";

function buildSystemPrompt(kind: AIKind, ctx: { topicoNome?: string; disciplinaNome?: string; textoRedacao?: string }): string {
  switch (kind) {
    case "flashcards":
      return `Você é um especialista em concursos públicos brasileiros. Gere 5 a 10 pares de flashcards (pergunta/resposta) objetivos sobre o tópico "${ctx.topicoNome}" da disciplina "${ctx.disciplinaNome}" para o concurso PMSC Soldado 2026 (banca AOCP). As perguntas devem ser diretas e as respostas concisas (máx 2 frases). Responda APENAS em JSON: {"flashcards":[{"pergunta":"...","resposta":"..."}]}`;
    case "redacao-tema":
      return `Você é um especialista no concurso PMSC Soldado 2026 (banca Instituto AOCP). Gere UM tema de redação dissertativo-argumentativa baseado nos assuntos previstos no edital (Ordem Pública, Sistema de Justiça Criminal, Políticas Públicas, Constituição Federal). O tema deve ser atual, relevante e no estilo da banca AOCP. Responda APENAS em JSON: {"tema":"...","proposta":"breve descrição do que se espera"}`;
    case "redacao-correcao":
      return `Você é um corretor de redações dissertativo-argumentativas para concurso público. Corrija a redação abaixo com base nos critérios: compreensão do tema, argumentação, estrutura/coesão, norma culta, conclusão/proposta. Dê uma nota de 0 a 10 (pode ser decimal) e feedback por critério. Responda APENAS em JSON: {"nota":7.5,"feedback":{"compreensao_tema":"...","argumentacao":"...","estrutura_coesao":"...","norma_culta":"...","conclusao_proposta":"..."}}`;
    default:
      return `Você é um especialista em concursos públicos brasileiros.`;
  }
}

function buildUserPrompt(kind: AIKind, ctx: { topicoNome?: string; disciplinaNome?: string; textoRedacao?: string }): string {
  switch (kind) {
    case "flashcards": return `Gere flashcards sobre: ${ctx.topicoNome} (${ctx.disciplinaNome}).`;
    case "redacao-tema": return `Gere um tema de redação dissertativo-argumentativa para o concurso PMSC Soldado 2026.`;
    case "redacao-correcao": return `Corrija a seguinte redação:\n\n${ctx.textoRedacao ?? ""}`;
    default: return "";
  }
}

export async function callAI<T>(kind: AIKind, ctx: { topicoNome?: string; disciplinaNome?: string; textoRedacao?: string }): Promise<T> {
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      model: AI_GATEWAY_MODEL,
      messages: [{ role: "system", content: buildSystemPrompt(kind, ctx) }, { role: "user", content: buildUserPrompt(kind, ctx) }],
      temperature: 0.7,
      max_tokens: kind === "flashcards" ? 1500 : kind === "redacao-correcao" ? 1200 : 300,
    }),
  });
  if (!response.ok) throw new Error(`AI request failed (${response.status})`);
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI response did not contain valid JSON");
  return JSON.parse(jsonMatch[0]) as T;
}
