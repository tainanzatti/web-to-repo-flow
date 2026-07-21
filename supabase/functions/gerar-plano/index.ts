import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, corsHeaders, optionsResponse, errorResponse, successResponse, extractJSON, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { topicos, system_prompt } = await req.json();

    if (!topicos || !Array.isArray(topicos) || topicos.length === 0) {
      return errorResponse("Tópicos são obrigatórios", 400);
    }

    const topicosStr = topicos.map((t: Record<string, unknown>, i: number) => {
      const mn = t.mastery as number; const rv = t.revisoes as number; const dlu = t.dias_desde_ultima as number;
      const qs = t.questoes as number; const ta = t.taxa_acertos as number; const te = t.taxa_erros as number; const pe = t.peso_edital as number;
      return `${i + 1}. ${t.disciplina_nome} - ${t.topico_nome} | Domínio: ${mn.toFixed(0)}% | Revisões: ${rv} | Dias desde última: ${dlu} | Questões: ${qs} | Acertos: ${ta.toFixed(0)}% | Erros: ${te.toFixed(0)}% | Peso edital: ${pe}`;
    }).join("\n");

    const messages: LovableMessage[] = [
      { role: "system", content: system_prompt ?? "Você é um professor especialista em concursos públicos para a PMSC, banca AOCP." },
      { role: "user", content: `Com base nos dados de estudo do candidato abaixo, crie um plano de estudos para hoje com no máximo 60 minutos.\n\nDados dos tópicos (ordenados por prioridade):\n${topicosStr}\n\nRegras:\n- Selecione os tópicos mais prioritários (baixo domínio, alto esquecimento, muitos erros, peso alto no edital)\n- Distribua o tempo total de 60 minutos entre os tópicos selecionados\n- Atribua uma prioridade: "Alta", "Média" ou "Baixa"\n- Para cada tópico, explique brevemente o motivo da priorização\n\nRetorne APENAS um JSON válido no formato:\n{"itens": [{"topico_id": "...", "topico_nome": "...", "disciplina_nome": "...", "tempo_minutos": 30, "prioridade": "Alta", "motivo": "..."}], "tempo_total": 60}` },
    ];

    const { content, error } = await callLovableAI(messages, { temperature: 0.4, maxTokens: 1500, jsonMode: true });

    if (error) return errorResponse(error, 502);

    const plano = extractJSON(content);
    if (!plano || !plano.itens) {
      return errorResponse("Resposta da IA em formato inválido", 502);
    }

    return successResponse({ plano });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
