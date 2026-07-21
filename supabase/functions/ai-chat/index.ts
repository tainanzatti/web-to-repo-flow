import { corsHeaders, errorResponse, jsonResponse, parseBody, callGemini } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { pergunta } = body as { pergunta?: string }
    const prompt = pergunta ?? 'Olá'
    const text = await callGemini(prompt, 'Você é um assistente de estudos para concurso de Soldado da PMSC 2026 (banca AOCP). Responda de forma clara e objetiva em português.')
    return jsonResponse({ resposta: text })
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
