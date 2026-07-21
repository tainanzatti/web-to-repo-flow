import { callLovableAI, extractJSON, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um orientador de estudos especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC). Analise o desempenho do aluno e identifique pontos fortes, fracos e sugestões. Responda APENAS com JSON válido.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { dados } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Dados de desempenho do aluno: ${JSON.stringify(dados)}\n\nAnalise e responda em JSON: {"resumo": string, "pontos_fortes": [string], "pontos_fracos": [string], "sugestoes": [string]}` },
    ];
    const raw = await callLovableAI(messages, { jsonMode: true, temperature: 0.5 });
    const parsed = extractJSON<{ resumo: string; pontos_fortes: string[]; pontos_fracos: string[]; sugestoes: string[] }>(raw);
    return successResponse(parsed);
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
