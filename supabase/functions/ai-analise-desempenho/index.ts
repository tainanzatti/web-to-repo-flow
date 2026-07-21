import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { dados } = body as { dados?: string }
    const prompt = `Analise o desempenho do candidato e dê recomendações. Dados: ${dados ?? 'sem dados'}. Responda APENAS com JSON: {"analise":"...","recomendacoes":["...","..."]}`
    const data = await callGeminiJSON(prompt, 'Você é um orientador de concursos públicos.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
