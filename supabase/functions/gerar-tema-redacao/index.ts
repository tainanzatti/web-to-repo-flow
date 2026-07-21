import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { area } = body as { area?: string }
    const prompt = `Gere um tema de redação dissertativo-argumentativa para concurso de Soldado da PMSC 2026, baseado em assuntos de segurança pública, direitos humanos, cidadania e atualidades${area ? ` na área de ${area}` : ''}. O tema deve ser atual e relevante. Responda APENAS com JSON: {"tema":"...","proposta":"..."}`
    const data = await callGeminiJSON<{ tema: string; proposta: string }>(prompt, 'Você é um professor de redação para concursos.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
