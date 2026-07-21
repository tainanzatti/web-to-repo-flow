import { corsHeaders, errorResponse, jsonResponse, parseBody, callGemini } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { topico_nome, disciplina_nome } = body as { topico_nome?: string; disciplina_nome?: string }
    const prompt = `Gere um resumo de estudo objetivo e completo sobre "${topico_nome ?? 'o tema'}" na disciplina "${disciplina_nome ?? ''}" para concurso de Soldado da PMSC 2026 (banca AOCP). Estruture em tópicos claros, destaque pontos mais cobrados. Responda em português.`
    const text = await callGemini(prompt, 'Você é um professor especializado em concursos públicos brasileiros. Gere resumos claros, objetivos e bem estruturados.')
    return jsonResponse({ texto: text })
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
