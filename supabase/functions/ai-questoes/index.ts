import { callLovableAI, extractJSON, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. Gere questões de múltipla escolha (5 alternativas A-E) no estilo AOCP. Responda APENAS com JSON válido.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { disciplina, topico, quantidade } = await req.json();
    const qtd = Math.min(quantidade ?? 5, 10);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Gere ${qtd} questões sobre "${topico}" da disciplina "${disciplina}". Cada questão deve ter: enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, resposta_correta (A/B/C/D/E), explicacao. Responda em JSON: {"questoes": [...]}` },
    ];
    const raw = await callLovableAI(messages, { jsonMode: true, temperature: 0.8 });
    const parsed = extractJSON<{ questoes: unknown[] }>(raw);
    return successResponse(parsed);
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
