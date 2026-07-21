import { corsHeaders, errorResponse, jsonResponse, parseBody, callGeminiJSON } from '../_shared/ai.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })
  try {
    const body = await parseBody(req)
    const { tema, texto } = body as { tema?: string; texto?: string }
    const prompt = `Corrija a seguinte redação dissertativo-argumentativa para concurso de Soldado da PMSC 2026.\n\nTema: ${tema ?? ''}\n\nRedação:\n${texto ?? ''}\n\nAvalie por critérios: compreensao_do_tema, argumentacao, estrutura_coesao, norma_culta, conclusao_proposta. Dê nota de 0 a 10. Responda APENAS com JSON: {"nota":7.5,"feedback":{"compreensao_do_tema":"...","argumentacao":"...","estrutura_coesao":"...","norma_culta":"...","conclusao_proposta":"..."}}`
    const data = await callGeminiJSON<{ nota: number; feedback: Record<string, string> }>(prompt, 'Você é um corretor de redação para concursos públicos. Seja rigoroso mas justo.')
    return jsonResponse(data)
  } catch (e) {
    return errorResponse(500, String(e))
  }
})
