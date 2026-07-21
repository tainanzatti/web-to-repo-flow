import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, extractJSON, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { disciplina, topico, quantidade, system_prompt } = await req.json();

    if (!disciplina || !topico) {
      return errorResponse("Disciplina e tópico são obrigatórios", 400);
    }

    const qtd = Math.min(Math.max(quantidade ?? 5, 1), 10);

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Crie ${qtd} questões de múltipla escolha (5 alternativas A-E) sobre "${topico}" da disciplina "${disciplina}", no estilo da banca AOCP para o concurso da PMSC.\n\nAs questões devem:\n- Ter enunciado claro e objetivo\n- Ter 5 alternativas (A, B, C, D, E)\n- Ter exatamente uma resposta correta\n- Incluir explicação detalhada do porquê a resposta correta está certa e as outras erradas\n- Ser no nível de dificuldade de um concurso real\n\nRetorne APENAS um JSON válido no formato:\n{"questoes": [{"enunciado": "...", "alternativas": [{"letra": "A", "texto": "..."}, {"letra": "B", "texto": "..."}, {"letra": "C", "texto": "..."}, {"letra": "D", "texto": "..."}, {"letra": "E", "texto": "..."}], "correta": "A", "explicacao": "..."}]}` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.6, maxTokens: 3000, jsonMode: true });

    if (error) return errorResponse(error, 502);

    const parsed = extractJSON(content);
    if (!parsed || !parsed.questoes) {
      return errorResponse("Resposta da IA em formato inválido", 502);
    }

    return successResponse({ questoes: parsed.questoes });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
