// ============================================================================
// Geração de questões de simulado por IA (em lotes, por disciplina)
// ============================================================================
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { SimuladoQuestion } from './simulado'

const inputSchema = z.object({
  discName: z.string().min(1),
  batches: z
    .array(
      z.object({
        topicName: z.string().min(1),
        count: z.number().int().min(1).max(10),
      })
    )
    .min(1),
})

type Body = z.infer<typeof inputSchema>

function buildPrompt(body: Body): string {
  const lista = body.batches
    .map((b) => `- ${b.count} questão(ões) sobre: ${b.topicName}`)
    .join('\n')
  const total = body.batches.reduce((a, b) => a + b.count, 0)
  return `Você é elaborador de questões do concurso de Soldado da PM de Santa Catarina 2026 (banca Instituto AOCP). Disciplina: ${body.discName}.

Crie exatamente ${total} questões INÉDITAS de múltipla escolha, no estilo AOCP (objetivas, com pegadinhas típicas da banca), distribuídas NESTA ORDEM entre os assuntos:
${lista}

Regras:
- 4 alternativas (A, B, C, D), apenas UMA correta, distribua a correta entre as letras.
- Enunciado claro; para direito, cobre artigos, prazos e exceções; para português, use trechos curtos de texto quando o assunto pedir.
- Nível: difícil-médio, igual ao da prova real.
- "explicacao": 1 a 2 frases dizendo por que a correta está correta e/ou por que as erradas estão erradas.

Responda APENAS com JSON válido, sem cercas de código, no formato:
{"questions":[{"enunciado":"...","alternativas":{"A":"...","B":"...","C":"...","D":"..."},"correta":"A","explicacao":"..."}]}`
}

async function callGateway(
  messages: { role: string; content: string }[],
  maxTokens: number
): Promise<{ text: string } | { error: string }> {
  if (!process.env.LOVABLE_API_KEY) {
    console.error('[AI] LOVABLE_API_KEY ausente no ambiente do servidor')
    return { error: 'Serviço de IA não configurado. Tente novamente mais tarde.' }
  }
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_completion_tokens: maxTokens,
      }),
    })
    if (res.status === 429)
      return { error: 'Limite de requisições atingido. Aguarde um momento e tente novamente.' }
    if (res.status === 402)
      return { error: 'Créditos de IA esgotados. Adicione créditos no workspace Lovable.' }
    if (!res.ok) {
      console.error('AI gateway error', res.status, await res.text())
      return { error: `Falha na geração (HTTP ${res.status}).` }
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = json.choices?.[0]?.message?.content ?? ''
    if (!text) return { error: 'A IA retornou uma resposta vazia.' }
    return { text }
  } catch (err) {
    console.error(err)
    return { error: 'Não foi possível conectar ao serviço de IA.' }
  }
}

type RawQuestion = {
  enunciado?: unknown
  alternativas?: unknown
  correta?: unknown
  explicacao?: unknown
}

function parseQuestions(text: string): SimuladoQuestion[] {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return []
  let parsed: { questions?: RawQuestion[] }
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as { questions?: RawQuestion[] }
  } catch {
    return []
  }
  const letras = ['A', 'B', 'C', 'D'] as const
  const out: SimuladoQuestion[] = []
  for (const q of parsed.questions ?? []) {
    if (typeof q.enunciado !== 'string' || !q.enunciado.trim()) continue
    const alts = q.alternativas as Record<string, unknown> | undefined
    if (!alts) continue
    const alternativas: SimuladoQuestion['alternativas'] = {
      A: typeof alts.A === 'string' ? alts.A : '',
      B: typeof alts.B === 'string' ? alts.B : '',
      C: typeof alts.C === 'string' ? alts.C : '',
      D: typeof alts.D === 'string' ? alts.D : '',
    }
    if (Object.values(alternativas).some((v) => !v.trim())) continue
    const correta = String(q.correta ?? '').toUpperCase()
    if (!letras.includes(correta as (typeof letras)[number])) continue
    out.push({
      disciplinaId: '',
      topicoId: '',
      enunciado: q.enunciado.trim(),
      alternativas,
      correta: correta as SimuladoQuestion['correta'],
      explicacao: typeof q.explicacao === 'string' ? q.explicacao.trim() : '',
    })
  }
  return out
}

export const gerarQuestoesSimulado = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(
    async ({ data }): Promise<{ questions: SimuladoQuestion[] } | { error: string }> => {
      const total = data.batches.reduce((a, b) => a + b.count, 0)
      const res = await callGateway(
        [
          {
            role: 'system',
            content: 'Você responde exclusivamente com JSON válido, sem cercas de código.',
          },
          { role: 'user', content: buildPrompt(data) },
        ],
        6000
      )
      if ('error' in res) return res
      let questions = parseQuestions(res.text)
      if (questions.length < total) {
        // Uma tentativa de recuperação quando vierem menos questões que o pedido.
        const retry = await callGateway(
          [
            {
              role: 'system',
              content: 'Você responde exclusivamente com JSON válido, sem cercas de código.',
            },
            { role: 'user', content: buildPrompt(data) },
          ],
          6000
        )
        if (!('error' in retry)) {
          const again = parseQuestions(retry.text)
          if (again.length > questions.length) questions = again
        }
      }
      if (questions.length === 0) return { error: 'A IA não retornou questões válidas. Tente novamente.' }
      return { questions }
    }
  )
