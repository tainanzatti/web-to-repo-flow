import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { dados } = body as { dados?: string }
    const prompt = `Com base no desempenho, gere recomendações de estudo. Dados: ${dados ?? 'sem dados'}. Responda APENAS com JSON: {"recomendacoes":["...","..."]}`
    const data = await callGeminiJSON(prompt, 'Você é um orientador de concursos.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
