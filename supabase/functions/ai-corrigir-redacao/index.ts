import { callLovableAI, extractJSON, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um corretor de redações especialista em concursos públicos. Avalie a redação com notas de 0 a 10 em cada critério. Responda APENAS com JSON válido.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { tema, conteudo } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Tema: ${tema}\n\nRedação:\n${conteudo}\n\nAvalie a redação com os critérios: Adequação ao tema, Coesão e Coerência, Gramática e Ortografia, Argumentação. Dê nota 0-10 para cada critério e um feedback geral. Responda em JSON: {"nota": number, "criterios": [{"nome": string, "nota": number, "comentario": string}], "feedback": string}` },
    ];
    const raw = await callLovableAI(messages, { jsonMode: true, temperature: 0.3 });
    const parsed = extractJSON<{ nota: number; criterios: { nome: string; nota: number; comentario: string }[]; feedback: string }>(raw);
    return successResponse(parsed);
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
