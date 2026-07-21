import { corsHeaders, errorResponse, jsonResponse, parseBody, callGemini } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { topico_nome, disciplina_nome } = body as { topico_nome?: string; disciplina_nome?: string }
    const prompt = `Explique de forma clara e didática o conteúdo sobre "${topico_nome ?? 'o tema'}" da disciplina "${disciplina_nome ?? ''}" para concurso de Soldado da PMSC 2026. Use exemplos práticos quando possível.`
    const text = await callGemini(prompt, 'Você é um professor especializado em concursos públicos.')
    return jsonResponse({ texto: text })
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
