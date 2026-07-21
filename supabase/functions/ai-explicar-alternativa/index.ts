import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { enunciado, alternativa_correta, alternativas, disciplina, system_prompt } = await req.json();

    if (!enunciado || !alternativa_correta || !alternativas) {
      return errorResponse("Enunciado, alternativa correta e alternativas são obrigatórios", 400);
    }

    const altsStr = alternativas.map((a: { letra: string; texto: string }) => `${a.letra}) ${a.texto}`).join("\n");

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Explique detalhadamente por que a alternativa ${alternativa_correta} é a resposta correta para a questão abaixo, e por que as outras alternativas estão incorretas.\n\nDisciplina: ${disciplina}\n\nEnunciado:\n${enunciado}\n\nAlternativas:\n${altsStr}\n\nResposta correta: ${alternativa_correta}\n\nForneça uma explicação didática e completa.` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.3, maxTokens: 1500 });

    if (error) return errorResponse(error, 502);

    return successResponse({ content });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
