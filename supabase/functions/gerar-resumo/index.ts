import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, corsHeaders, optionsResponse, errorResponse, successResponse, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { topico_nome, disciplina_nome, lei_seca_contexto, system_prompt } = await req.json();

    if (!topico_nome || !disciplina_nome) {
      return errorResponse("Tópico e disciplina são obrigatórios", 400);
    }

    const ctx = lei_seca_contexto
      ? `\n\nMateriais de lei seca fornecidos pelo candidato:\n${lei_seca_contexto}`
      : "";

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Crie um resumo de estudo claro, objetivo e bem estruturado sobre o tópico "${topico_nome}" da disciplina "${disciplina_nome}".\n\nO resumo deve:\n- Ter no máximo 800 palavras\n- Usar linguagem clara e direta\n- Destacar os pontos mais importantes para prova\n- Usar formatação em tópicos quando relevante\n- Focar no que cai em provas da AOCP\n- Ser em português brasileiro${ctx}\n\nRetorne APENAS o resumo, sem comentários adicionais.` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.3, maxTokens: 1500 });

    if (error) return errorResponse(error, 502);

    return successResponse({ resumo: content });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
