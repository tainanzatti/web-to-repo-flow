import { callLovableAI, corsHeaders, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. Sua missão é ajudar o aluno com explicações claras, questões no estilo AOCP, correções de redação e orientações de estudo. Sempre use linguagem didática, precisa e motivadora.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { messages, context } = await req.json();
    const ctxMsg = context?.disciplina || context?.topico
      ? `\n\nContexto: Disciplina: ${context.disciplina ?? "—"}, Tópico: ${context.topico ?? "—"}`
      : "";
    const fullMessages = [
      { role: "system", content: SYSTEM_PROMPT + ctxMsg },
      ...messages,
    ];
    const resposta = await callLovableAI(fullMessages);
    return successResponse({ resposta });
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
