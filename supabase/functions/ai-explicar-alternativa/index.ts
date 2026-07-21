import { corsHeaders, errorResponse, jsonResponse, parseBody, callGemini } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { pergunta, alternativa, topico_nome } = body as { pergunta?: string; alternativa?: string; topico_nome?: string }
    const prompt = `Explique por que a alternativa "${alternativa ?? ''}" é correta ou incorreta para a questão: "${pergunta ?? ''}" sobre o tópico "${topico_nome ?? ''}". Seja didático.`
    const text = await callGemini(prompt, 'Você é um professor de concursos que explica alternativas de questões de forma didática.')
    return jsonResponse({ texto: text })
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
