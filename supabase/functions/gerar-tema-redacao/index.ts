import { callLovableAI, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. Gere temas de redação no estilo dos concursos da PMSC.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { area } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Gere um tema de redação para concurso${area ? ` na área de ${area}` : ""}. Responda apenas com o tema, sem explicações adicionais.` },
    ];
    const tema = await callLovableAI(messages, { temperature: 0.8 });
    return successResponse({ tema: tema.trim() });
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
