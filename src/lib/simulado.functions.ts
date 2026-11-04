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

Crie exatamente ${total} questões INÉDITAS de múltipla escolha, reproduzindo fielmente o estilo de cobrança do Instituto AOCP em concursos de carreiras policiais (PM, PC, Polícia Penal), distribuídas NESTA ORDEM entre os assuntos:
${lista}

Regras de formato:
- 5 alternativas (A, B, C, D, E), apenas UMA correta; distribua o gabarito de forma equilibrada entre as 5 letras.
- Varie os modelos de questão, como a AOCP faz:
  • situação-problema: um caso concreto com policial militar, ocorrência, abordagem, servidor público etc., pedindo a solução jurídica/técnica;
  • "Assinale a alternativa CORRETA" e "Assinale a alternativa INCORRETA" (escreva CORRETA/INCORRETA em maiúsculas no enunciado), alternando entre elas;
  • questões com itens em algarismos romanos (I, II, III, IV e, se preciso, V), cada item em uma linha própria dentro do enunciado, pedindo "Está(ão) correta(s)" ou "Está(ão) incorreta(s)", com alternativas do tipo "Apenas I e III.", "Apenas II, III e IV.", "I, II, III e IV.";
  • questões de "De acordo com a Lei nº ..., ..." cobrando literalidade de artigos, prazos, competências e exceções.
- Use quebras de linha (\n) para separar parágrafos e itens.
- Nível: médio-difícil, igual à prova real, com pegadinhas típicas (troca de prazos, "sempre/nunca", competências trocadas).

Regras específicas para LÍNGUA PORTUGUESA:
- Questões de interpretação, coesão, coerência ou sentido devem vir com um texto-base completo no campo "texto": um texto jornalístico, crônica ou artigo de opinião ORIGINAL de 3 a 5 parágrafos (cerca de 250 a 400 palavras), com título e, ao final, uma referência fictícia entre parênteses. Várias questões podem usar o mesmo texto: repita-o no campo "texto" de cada uma.
- Questões de gramática (concordância, regência, crase, pontuação, classes de palavras, sintaxe) devem trazer frases ou trechos do texto, e as palavras/expressões a analisar devem aparecer GRIFADAS, marcadas com colchetes duplos, ex.: "No trecho 'Os policiais [[que]] atuaram...', o termo destacado...". Use [[ ]] tanto no texto-base quanto no enunciado e alternativas.
- Para as demais disciplinas, deixe "texto" vazio ("").

Regras para disciplinas de DIREITO e LEGISLAÇÃO:
- Além da letra da lei, cobre JURISPRUDÊNCIA e ENTENDIMENTOS SUMULADOS do STF e do STJ (súmulas, súmulas vinculantes, teses de repercussão geral e recursos repetitivos, informativos relevantes) e do TJSC quando pertinente, como a AOCP faz. Pelo menos 1 a cada 3 questões de Direito deve envolver jurisprudência ou súmula, citando-a corretamente (ex.: "Conforme a Súmula Vinculante nº 11 do STF..."). Use apenas súmulas e entendimentos reais e vigentes; não invente números.

- "explicacao": 1 a 3 frases dizendo por que a correta está correta e por que as principais erradas estão erradas (cite o artigo, a súmula ou o julgado quando houver).
- "comentarios": para CADA alternativa (A a E), 1 a 2 frases explicando por que ela está certa ou o que exatamente está errado nela.

Responda APENAS com JSON válido, sem cercas de código, no formato:
{"questions":[{"texto":"","enunciado":"...","alternativas":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correta":"A","explicacao":"...","comentarios":{"A":"...","B":"...","C":"...","D":"...","E":"..."}}]}}`
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
  texto?: unknown
  enunciado?: unknown
  alternativas?: unknown
  correta?: unknown
  explicacao?: unknown
  comentarios?: unknown
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
  const letras = ['A', 'B', 'C', 'D', 'E'] as const
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
      E: typeof alts.E === 'string' ? alts.E : '',
    }
    if (Object.values(alternativas).some((v) => !v?.trim())) continue
    const correta = String(q.correta ?? '').toUpperCase()
    if (!letras.includes(correta as (typeof letras)[number])) continue
    const cm = q.comentarios as Record<string, unknown> | undefined
    const comentarios: SimuladoQuestion['comentarios'] = {}
    if (cm && typeof cm === 'object')
      for (const l of letras) if (typeof cm[l] === 'string' && (cm[l] as string).trim()) comentarios[l] = (cm[l] as string).trim()
    out.push({
      comentarios: Object.keys(comentarios).length ? comentarios : undefined,
      disciplinaId: '',
      topicoId: '',
      texto: typeof q.texto === 'string' && q.texto.trim() ? q.texto.trim() : undefined,
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
        16000
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
          16000
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
