import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { topico, disciplina, pergunta, system_prompt } = await req.json();

    if (!topico || !disciplina) {
      return errorResponse("Tópico e disciplina são obrigatórios", 400);
    }

    const userContent = pergunta
      ? `Explique o tópico "${topico}" da disciplina "${disciplina}". O candidato tem a seguinte dúvida específica: ${pergunta}`
      : `Explique de forma didática o tópico "${topico}" da disciplina "${disciplina}", com foco no que cai em provas da AOCP para PMSC. Use exemplos práticos quando possível.`;

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: userContent },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.4, maxTokens: 2000 });

    if (error) return errorResponse(error, 502);

    return successResponse({ content });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
