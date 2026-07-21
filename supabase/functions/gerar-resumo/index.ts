import { callLovableAI, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. Gere um resumo claro e didático do conteúdo.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { conteudo } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Gere um resumo do seguinte conteúdo:\n\n${conteudo}` },
    ];
    const resumo = await callLovableAI(messages);
    return successResponse({ resumo });
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
