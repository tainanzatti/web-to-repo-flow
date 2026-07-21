import { callLovableAI, extractJSON, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um orientador de estudos especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC). Crie um plano de estudos personalizado. Responda APENAS com JSON válido.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { dias, horas_por_dia, disciplinas, nivel } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Crie um plano de estudos para ${dias} dias, ${horas_por_dia} horas por dia, disciplinas: ${disciplinas?.join(", ") ?? "todas"}, nível: ${nivel ?? "intermediário"}. Responda em JSON: {"plano": string}` },
    ];
    const raw = await callLovableAI(messages, { jsonMode: true, temperature: 0.5 });
    const parsed = extractJSON<{ plano: string }>(raw);
    return successResponse(parsed);
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
