import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const inputSchema = z.object({
  kind: z.enum(['leiseca', 'resumo', 'questoes', 'briefing', 'redacao-tema']),
  discName: z.string().optional(),
  topicName: z.string().optional(),
  summary: z.string().optional(),
})

type Body = z.infer<typeof inputSchema>

function buildPrompt(body: Body): string {
  const { kind, discName = '', topicName = '', summary = '' } = body
  switch (kind) {
    case 'leiseca':
      return `Você é um assistente jurídico para o concurso de Soldado da PM de Santa Catarina (banca Instituto AOCP). Tópico: "${topicName}" (disciplina: ${discName}).\n\nRetorne os artigos de lei mais cobrados em provas policiais para este tópico específico. Cite o número do artigo em negrito antes de cada trecho. Sem introdução, sem comentário — só os artigos-chave, até uns 600 palavras. Se o tópico for extenso, priorize os trechos historicamente mais cobrados e finalize indicando onde consultar o texto integral. Formate em markdown simples.`
    case 'resumo':
      return `Você é professor de cursinho para o concurso de Soldado da PM de Santa Catarina (banca AOCP). Tópico: "${topicName}" (disciplina: ${discName}).\n\nEscreva um resumo direto (400-500 palavras) com o que mais cai em prova: conceitos centrais, pegadinhas típicas da banca AOCP e exceções cobradas como "incorreta". Use marcadores quando ajudar. Sintetize com suas próprias palavras.`
    case 'questoes':
      return `Você é professor de cursinho para o concurso de Soldado da PM de Santa Catarina (banca AOCP). Tópico: "${topicName}" (disciplina: ${discName}).\n\nDeixe claro no início que são questões de TREINO inéditas, não questões reais de provas anteriores. Depois crie 3 questões de múltipla escolha originais no estilo AOCP sobre este tópico, 4 alternativas (A-D) cada, indique a correta e explique objetivamente por que cada alternativa errada está errada.`
    case 'redacao-tema':
      return `Você é banca examinadora da prova discursiva do concurso de Soldado da PM de Santa Catarina 2026 (Instituto AOCP). Gere UM comando inédito de TEXTO DISSERTATIVO, ancorado nos assuntos do edital do PMSC: segurança pública, direitos humanos, cidadania, ética e disciplina militar, atualidades brasileiras e catarinenses.\n\nFormato da resposta em markdown, exatamente nesta ordem e sem qualquer texto extra:\n\n**Tema:** uma frase clara.\n\n**Comando:** 2 a 3 linhas contextualizando e pedindo um texto dissertativo, no estilo AOCP (ex.: "Redija um texto dissertativo abordando os seguintes aspectos:"), seguido de 2 ou 3 aspectos numerados que o candidato deve obrigatoriamente desenvolver.\n\n**Repertório sugerido:** 3 bullets curtos de dados, leis ou fatos.\n\n**Critérios:** Conteúdo (apresentação, estrutura e desenvolvimento do tema) e domínio da modalidade escrita (grafia, morfossintaxe, pontuação, propriedade vocabular). Extensão: 20 a 30 linhas.\n\nNão escreva o texto.`
    case 'briefing':
      return `Você é um coach de estudos para o concurso de Soldado da PM de Santa Catarina (banca AOCP). Desempenho real do candidato por tópico (peso 1-21, maior = mais cobrado; "sem dados" = nunca praticado):\n\n${summary}\n\nEscreva um briefing curto (150-200 palavras), tom direto de coach experiente: aponte 2-3 pontos mais urgentes desta semana (cruzando peso alto com desempenho fraco ou sem dados), reconheça o que já está bem encaminhado e termine com uma recomendação prática de tempo de estudo.`
  }
}

async function callGateway(
  messages: { role: string; content: string }[],
  maxTokens = 1600,
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

export const generateStudyMaterial = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ text: string } | { error: string }> =>
    callGateway([{ role: 'user', content: buildPrompt(data) }]),
  )

// ---------- Correção de redação ----------

const redacaoSchema = z.object({
  tema: z.string().min(1),
  texto: z.string().min(1),
})

export type RedacaoFeedback = Record<string, string>

export type CorrecaoResult = {
  nota: number
  feedback: RedacaoFeedback
  comentario?: string
  nc?: number
  ne?: number
  tl?: number
}

type RawCorrecao = {
  nc1?: unknown
  nc2?: unknown
  ne?: unknown
  comentario?: unknown
  feedback?: Record<string, unknown>
}

export const corrigirRedacao = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => redacaoSchema.parse(data))
  .handler(async ({ data }): Promise<CorrecaoResult | { error: string }> => {
    // TL = linhas efetivamente escritas
    const tl = data.texto.split('\n').filter((l) => l.trim().length > 0).length

    const prompt = `Você é banca examinadora da prova discursiva do concurso de Soldado da PMSC 2026 (Instituto AOCP). Corrija o TEXTO DISSERTATIVO abaixo seguindo estritamente o edital:

- A prova avalia o conteúdo (conhecimento do tema), a capacidade de expressão escrita e o uso da norma culta. O texto deve ser dissertativo, atender ao comando da banca e primar pela coerência e coesão.
- NOTA DE CONTEÚDO (NC, 0 a 10): soma de apresentação e estrutura textuais + desenvolvimento do tema. Atue como DOIS examinadores distintos e independentes (nc1 e nc2). As duas notas devem ser convergentes (diferença máxima de 2,5 pontos).
- NÚMERO DE ERROS (NE): conte cada erro de grafia, morfossintaxe, pontuação e propriedade vocabular.
- Texto que fuja ao tema ou não seja dissertativo recebe NC baixa (próxima de 0).

Tema/comando proposto:
${data.tema}

Texto do candidato (${tl} linhas escritas):
${data.texto}

Em cada critério escreva 2 a 4 frases, apontando trechos concretos e como corrigir. Em "modalidade_escrita", liste os erros contados.

Responda APENAS com JSON válido, sem markdown, no formato:
{"nc1": 7.5, "nc2": 7.0, "ne": 4, "comentario": "duas frases de veredito geral", "feedback": {"apresentacao_estrutura": "...", "desenvolvimento_tema": "...", "coerencia_coesao": "...", "modalidade_escrita": "..."}}`

    const res = await callGateway(
      [
        { role: 'system', content: 'Você responde exclusivamente com JSON válido, sem cercas de código.' },
        { role: 'user', content: prompt },
      ],
      2500,
    )
    if ('error' in res) return res

    const cleaned = res.text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) return { error: 'Resposta da IA em formato inesperado.' }
    try {
      const p = JSON.parse(cleaned.slice(start, end + 1)) as RawCorrecao
      const clamp = (v: unknown) => Math.max(0, Math.min(10, Number(v)))
      let nc1 = clamp(p.nc1)
      let nc2 = clamp(p.nc2)
      if (Number.isNaN(nc1) && Number.isNaN(nc2)) return { error: 'A IA não retornou uma nota válida.' }
      if (Number.isNaN(nc1)) nc1 = nc2
      if (Number.isNaN(nc2)) nc2 = nc1
      // Convergência: diferença até 25% da nota máxima (2,5)
      if (Math.abs(nc1 - nc2) > 2.5) {
        const lo = Math.min(nc1, nc2)
        nc1 = lo
        nc2 = lo + 2.5
      }
      const nc = Math.round(((nc1 + nc2) / 2) * 100) / 100
      const ne = Math.max(0, Math.round(Number(p.ne) || 0))
      // NPD = NC − 2 × NE / TL
      const nota = tl > 0 ? Math.max(0, Math.round((nc - (2 * ne) / tl) * 10) / 10) : 0

      const feedback: RedacaoFeedback = {}
      for (const [k, v] of Object.entries(p.feedback ?? {})) if (typeof v === 'string') feedback[k] = v
      feedback.calculo = `Examinador 1: ${nc1.toFixed(1)} · Examinador 2: ${nc2.toFixed(1)} → NC = ${nc.toFixed(2)}. Erros (NE) = ${ne}. Linhas (TL) = ${tl}. Nota = NC − 2 × NE/TL = ${nota.toFixed(1)}.`

      return {
        nota,
        nc,
        ne,
        tl,
        feedback,
        comentario: typeof p.comentario === 'string' ? p.comentario : undefined,
      }
    } catch {
      return { error: 'Não foi possível interpretar a correção da IA.' }
    }
  })

