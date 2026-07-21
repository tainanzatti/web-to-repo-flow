import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const prompt = `Gere um tema de redação dissertativo-argumentativa para concurso de Soldado da PMSC 2026, baseado em assuntos de segurança pública, direitos humanos, cidadania e atualidades. O tema deve ser atual e relevante. Responda APENAS com JSON: {"tema":"...","proposta":"..."}`
    const data = await callGeminiJSON<{ tema: string; proposta: string }>(prompt, 'Você é um professor de redação para concursos.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
