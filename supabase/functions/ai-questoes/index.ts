import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { topico_nome, disciplina_nome } = body as { topico_nome?: string; disciplina_nome?: string }
    const prompt = `Gere 5 a 10 pares de flashcards (pergunta e resposta objetivas) sobre "${topico_nome ?? 'o tema'}" na disciplina "${disciplina_nome ?? ''}" para concurso de Soldado da PMSC 2026 (banca AOCP). Responda APENAS com JSON no formato: {"flashcards":[{"pergunta":"...","resposta":"..."}]}`
    const data = await callGeminiJSON<{ flashcards: Array<{ pergunta: string; resposta: string }> }>(prompt, 'Você é um professor de concursos. Gere flashcards curtos e objetivos.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
