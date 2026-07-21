import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, extractJSON, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { disciplinas, diasRestantes, system_prompt } = await req.json();

    if (!disciplinas || !Array.isArray(disciplinas)) {
      return errorResponse("Dados das disciplinas são obrigatórios", 400);
    }

    const discStr = disciplinas.map((d: { nome: string; dominio: number; peso_edital: number; topicosNaoDominados: number }) =>
      `- ${d.nome}: Domínio ${d.dominio.toFixed(0)}%, Peso no edital ${d.peso_edital}, ${d.topicosNaoDominados} tópicos não dominados`
    ).join("\n");

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Com base nos dados do candidato abaixo, forneça recomendações personalizadas de estudo.\n\nDias restantes até a prova: ${diasRestantes ?? 180}\n\nSituação por disciplina:\n${discStr}\n\nForneça de 5 a 8 recomendações específicas, práticas e acionáveis. Considere:\n- Priorização por peso no edital\n- Tópicos não dominados\n- Tempo restante\n- Distribuição equilibrada de estudo\n\nRetorne APENAS um JSON válido no formato:\n{"recomendacoes": ["recomendação 1", "recomendação 2", ...]}` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.5, maxTokens: 1500, jsonMode: true });

    if (error) return errorResponse(error, 502);

    const parsed = extractJSON(content);
    if (!parsed || !parsed.recomendacoes) {
      return errorResponse("Resposta da IA em formato inválido", 502);
    }

    return successResponse({ recomendacoes: parsed.recomendacoes });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
