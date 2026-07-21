import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { callLovableAI, optionsResponse, errorResponse, successResponse, type LovableMessage } from "../_shared/lovable-ai.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();

  try {
    const { messages, disciplina, topico } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse("Mensagens são obrigatórias", 400);
    }

    const contextStr = disciplina || topico
      ? `\n\nContexto do candidato: ${disciplina ? `Disciplina: ${disciplina}` : ""}${disciplina && topico ? " · " : ""}${topico ? `Tópico: ${topico}` : ""}`
      : "";

    const lastUserMsg = messages[messages.length - 1];
    if (contextStr && lastUserMsg) {
      lastUserMsg.content = lastUserMsg.content + contextStr;
    }

    const { content, error } = await callLovableAI(messages, { temperature: 0.5, maxTokens: 2000 });

    if (error) return errorResponse(error, 502);

    return successResponse({ content });
  } catch (error) {
    return errorResponse((error as Error).message);
  }
});
