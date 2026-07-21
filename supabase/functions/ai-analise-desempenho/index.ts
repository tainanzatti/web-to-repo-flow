import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, extractJSON, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { disciplinas, taxaAcertosGeral, horasEstudadas, topicosEstudados, diasConsecutivos, system_prompt } = await req.json();

    if (!disciplinas || !Array.isArray(disciplinas)) {
      return errorResponse("Dados de desempenho são obrigatórios", 400);
    }

    const discStr = disciplinas.map((d: { nome: string; dominio: number; questoes: number; acertos: number; taxa: number }) =>
      `- ${d.nome}: Domínio ${d.dominio.toFixed(0)}%, ${d.questoes} questões, ${d.acertos} acertos (${d.taxa.toFixed(0)}% de acerto)`
    ).join("\n");

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Analise o desempenho do candidato abaixo e forneça uma análise detalhada.\n\nEstatísticas gerais:\n- Taxa de acertos geral: ${taxaAcertosGeral?.toFixed(0) ?? 0}%\n- Horas estudadas: ${horasEstudadas ?? 0}\n- Tópicos estudados: ${topicosEstudados ?? 0}\n- Dias consecutivos estudando: ${diasConsecutivos ?? 0}\n\nDesempenho por disciplina:\n${discStr}\n\nForneça:\n1. Um resumo geral do desempenho\n2. Pontos fortes identificados\n3. Pontos fracos que precisam de atenção\n4. Recomendações específicas de estudo\n\nRetorne APENAS um JSON válido no formato:\n{"resumo": "...", "pontosFortes": ["...", "..."], "pontosFracos": ["...", "..."], "recomendacoes": ["...", "..."]}` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.4, maxTokens: 2000, jsonMode: true });

    if (error) return errorResponse(error, 502);

    const analise = extractJSON(content);
    if (!analise || !analise.resumo) {
      return errorResponse("Resposta da IA em formato inválido", 502);
    }

    return successResponse({ analise });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
