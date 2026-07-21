import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { conteudo, system_prompt } = await req.json();

    if (!conteudo || typeof conteudo !== "string") {
      return errorResponse("Conteúdo é obrigatório", 400);
    }

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Com base no conteúdo de estudo fornecido abaixo, gere UM tema de redação dissertativa-argumentativa que seja relevante para o concurso da PMSC e que se relacione com os temas estudados pelo candidato.\n\nO tema deve ser:\n- Atual e relevante para a realidade da segurança pública\n- Relacionado ao conteúdo estudado quando possível\n- No formato de tema de redação dissertativa-argumentativa (conciso, claro, provocativo)\n- No máximo 120 caracteres\n\nRetorne APENAS o tema, sem explicações, sem aspas, sem texto adicional.\n\nConteúdo de estudo do candidato:\n${conteudo.slice(0, 4000)}` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.7, maxTokens: 150 });

    if (error) return errorResponse(error, 502);

    return successResponse({ tema: content });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
