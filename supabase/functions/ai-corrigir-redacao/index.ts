import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, extractJSON, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { tema, texto, system_prompt } = await req.json();

    if (!tema || !texto || texto.trim().length < 50) {
      return errorResponse("Tema e texto (mínimo 50 caracteres) são obrigatórios", 400);
    }

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Corrija a seguinte redação dissertativa-argumentativa do candidato, considerando os critérios da banca AOCP para PMSC.\n\nTema: ${tema}\n\nRedação:\n${texto}\n\nAvalie considerando os seguintes critérios (cada um de 0 a 100):\n1. Adequação ao tema\n2. Coerência e coesão\n3. Argumentação\n4. Norma culta (gramática, ortografia, pontuação)\n5. Estrutura dissertativa-argumentativa\n\nCalcule a nota final como média dos critérios.\n\nRetorne APENAS um JSON válido no formato:\n{"nota": 75.0, "feedback": "Comentário geral sobre a redação...", "criterios": [{"nome": "Adequação ao tema", "nota": 80, "comentario": "..."}, {"nome": "Coerência e coesão", "nota": 70, "comentario": "..."}, {"nome": "Argumentação", "nota": 75, "comentario": "..."}, {"nome": "Norma culta", "nota": 80, "comentario": "..."}, {"nome": "Estrutura dissertativa-argumentativa", "nota": 70, "comentario": "..."}]}` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.3, maxTokens: 2000, jsonMode: true });

    if (error) return errorResponse(error, 502);

    const correcao = extractJSON(content);
    if (!correcao || correcao.nota === undefined) {
      return errorResponse("Resposta da IA em formato inválido", 502);
    }

    return successResponse({ correcao });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
