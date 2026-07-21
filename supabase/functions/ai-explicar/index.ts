import { callLovableAI, corsHeaders, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. Explique o tópico de forma clara, didática e com exemplos práticos.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { topico, disciplina } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Explique sobre: ${topico}${disciplina ? ` (Disciplina: ${disciplina})` : ""}` },
    ];
    const resposta = await callLovableAI(messages);
    return successResponse({ resposta });
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
