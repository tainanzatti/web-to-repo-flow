import { callLovableAI, optionsResponse, errorResponse, successResponse } from "../_shared/lovable-ai.ts";

const SYSTEM_PROMPT = "Você é um professor especialista em concursos públicos, com foco no concurso da Polícia Militar de Santa Catarina (PMSC), banca AOCP. Explique por que uma alternativa está correta ou incorreta de forma didática.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const { enunciado, alternativa, correta, explicacao } = await req.json();
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Questão: ${enunciado}\nAlternativa escolhida: ${alternativa}\nCorreta: ${correta ? "Sim" : "Não"}\n${explicacao ? `Explicação oficial: ${explicacao}` : ""}\n\nExplique de forma detalhada por que esta alternativa está ${correta ? "correta" : "incorreta"}.` },
    ];
    const resposta = await callLovableAI(messages);
    return successResponse({ resposta });
  } catch (err) {
    return errorResponse(500, (err as Error).message);
  }
});
