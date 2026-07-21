import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { horas_disponiveis, disciplinas } = body as { horas_disponiveis?: number; disciplinas?: string }
    const prompt = `Gere um plano de estudo para hoje com ${horas_disponiveis ?? 2} horas. Disciplinas: ${disciplinas ?? 'todas'}. Responda APENAS com JSON: {"plano":[{"disciplina":"...","topico":"...","minutos":30}]}`
    const data = await callGeminiJSON(prompt, 'Você é um orientador de concursos. Monte planos realistas.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
