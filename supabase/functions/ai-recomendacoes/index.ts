import { callLovableAI, extractJSON, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um orientador de estudos especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC). Dê recomendações personalizadas de estudo. Responda APENAS com JSON válido.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { dados } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Dados do aluno: ${JSON.stringify(dados)}\n\nDê 5 recomendações personalizadas de estudo. Responda em JSON: {"recomendacoes": [string]}` },
    ];
    const raw = await callLovableAI(messages, { jsonMode: true, temperature: 0.6 });
    const parsed = extractJSON<{ recomendacoes: string[] }>(raw);
    return successResponse(parsed);
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
