// ============================================================================
// Operação PMSC — Motor do ciclo de estudos e dados do currículo
// Lógica portada do protótipo original, tipada em TypeScript.
// ============================================================================

export type Topic = {
  id: string
  name: string
  /** Peso Fibonacci: maior = mais cobrado na prova */
  fib: number
}

export type Discipline = {
  name: string
  /** Nº de questões na prova, ou "P2" para fase eliminatória (redação) */
  questoes: number | 'P2'
  topics: Topic[]
}

export type Lancamento = {
  id: string
  disciplinaId: string
  topicoId: string
  quantidade: number
  acertos: number
  minutos: number
  data: string // YYYY-MM-DD
}

export type TopicWithMastery = Topic & {
  mastery: number | null
  /** Tópico dominado que voltou à fila apenas como teste de manutenção. */
  maintenance?: boolean
  /** Dias desde a última revisão deste tópico (null = nunca revisado). */
  daysSinceReview?: number | null
}
export type AllocatedTopic = TopicWithMastery & { minutes: number }

export const CURRICULUM: Record<string, Discipline> = {
  legislacaoInstitucional: {
    name: 'Legislação Institucional',
    questoes: 10,
    topics: [
      { id: 'estatuto', name: 'Lei 6.218/1983 — Estatuto dos Policiais Militares de SC', fib: 21 },
      { id: 'pad', name: 'Portaria 009/2001 — Regulamento do PAD na PMSC', fib: 13 },
      { id: 'leiorganica', name: 'Lei 14.751/2023 — Lei Orgânica Nacional das PMs e CBMs', fib: 13 },
      { id: 'orgbasica', name: 'Decreto 1.601/2021 — Regulamento da Organização Básica da PMSC (Lei 6.217/1983)', fib: 8 },
      { id: 'ingresso', name: 'LC 587/2013 — Ingresso nas carreiras militares de SC', fib: 5 },
      { id: 'promocao', name: 'LC 801/2022 — Promoção das praças militares estaduais', fib: 5 },
      { id: 'remuneracao', name: 'LC 765/2020 — Regime Remuneratório Especial dos Militares Estaduais', fib: 3 },
      { id: 'conselhodisciplina', name: 'Lei 5.209/1976 — Conselho de Disciplina da PMSC', fib: 3 },
    ],
  },
  direitoConstitucional: {
    name: 'Direito Constitucional',
    questoes: 8,
    topics: [
      { id: 'teoriaconst', name: 'Teoria da Constituição — conceito, estrutura, elementos, classificação e Poder Constituinte', fib: 2 },
      { id: 'cf1a6', name: 'CF Arts. 1º a 4º — Princípios Fundamentais', fib: 5 },
      { id: 'cf5', name: 'CF Art. 5º — Direitos e deveres individuais e coletivos e remédios constitucionais', fib: 21 },
      { id: 'cf6a11', name: 'CF Arts. 6º a 11 — Direitos Sociais', fib: 3 },
      { id: 'cf12a13', name: 'CF Arts. 12 e 13 — Nacionalidade', fib: 2 },
      { id: 'cf14a15', name: 'CF Arts. 14 a 17 — Direitos Políticos e Partidos', fib: 3 },
      { id: 'cf18a28', name: 'CF Arts. 18 a 36 — Organização do Estado e Intervenção', fib: 8 },
      { id: 'cf37a42', name: 'CF Arts. 37 a 42 — Administração Pública, servidores e militares dos Estados', fib: 8 },
      { id: 'cf44a69', name: 'CF Arts. 44 a 69 — Poder Legislativo e processo legislativo', fib: 3 },
      { id: 'cf70a75', name: 'CF Arts. 70 a 75 — Fiscalização Contábil, Financeira e Orçamentária', fib: 2 },
      { id: 'cf76a91', name: 'CF Arts. 76 a 91 — Poder Executivo', fib: 2 },
      { id: 'cf106a110', name: 'CF Arts. 92 a 100 e 122 a 126 — Poder Judiciário, Justiça Militar e Justiça dos Estados', fib: 5 },
      { id: 'cf127a135', name: 'CF Arts. 127 a 135 — Funções Essenciais à Justiça', fib: 5 },
      { id: 'cf122a144', name: 'CF Arts. 136 a 144 — Defesa do Estado, Forças Armadas e Segurança Pública', fib: 8 },
      { id: 'cesc1a40', name: 'CE/SC Arts. 1º a 31 — Princípios, direitos, organização e Administração Pública', fib: 5 },
      { id: 'cesc32a76', name: 'CE/SC Arts. 32 a 76 — Legislativo (arts. 32–40 e 50–62) e Executivo', fib: 3 },
      { id: 'cesc90e105', name: 'CE/SC Art. 90 e Arts. 105 a 109-C — Justiça Militar e Segurança Pública', fib: 3 },
    ],
  },
  linguaPortuguesa: {
    name: 'Língua Portuguesa',
    questoes: 8,
    topics: [
      { id: 'interpretacao', name: 'Compreensão e interpretação de textos, tipologias e gêneros, funções da linguagem', fib: 21 },
      { id: 'significacao', name: 'Semântica — denotação, conotação, sinonímia, antonímia, figuras e significação', fib: 3 },
      { id: 'estruturapalavras', name: 'Estrutura e formação das palavras', fib: 2 },
      { id: 'ortografia', name: 'Ortografia oficial', fib: 2 },
      { id: 'acentuacao', name: 'Acentuação gráfica', fib: 2 },
      { id: 'classes', name: 'Emprego das classes de palavras', fib: 3 },
      { id: 'sintaxe', name: 'Sintaxe da oração e do período — termos e relações sintático-semânticas', fib: 8 },
      { id: 'concordancia', name: 'Concordância nominal e verbal', fib: 5 },
      { id: 'crase', name: 'Emprego do sinal indicativo de crase', fib: 5 },
      { id: 'regencia', name: 'Regências nominal e verbal', fib: 3 },
      { id: 'reescrita', name: 'Reescrita de orações, períodos, frases e parágrafos', fib: 5 },
      { id: 'pontuacao', name: 'Pontuação e sua função no texto', fib: 8 },
      { id: 'tipologia', name: 'Elementos de coesão e função textual dos vocábulos', fib: 8 },
    ],
  },
  direitoPenal: {
    name: 'Direito Penal',
    questoes: 6,
    topics: [
      { id: 'principios', name: 'Princípios aplicáveis ao Direito Penal', fib: 5 },
      { id: 'pg1', name: 'Lei penal — interpretação, vigência, tempo, espaço, conflito aparente', fib: 8 },
      { id: 'pg2', name: 'Teoria geral do crime — fato típico, erro, iter criminis, ilicitude, culpabilidade, concurso de pessoas', fib: 5 },
      { id: 'pg5', name: 'Das penas — espécies, aplicação, concurso de crimes, sursis, livramento, efeitos, reabilitação e medidas de segurança', fib: 3 },
      { id: 'pg8', name: 'Extinção da punibilidade', fib: 3 },
      { id: 'pe1', name: 'Parte Especial — Crimes contra a pessoa', fib: 5 },
      { id: 'pe2', name: 'Parte Especial — Crimes contra o patrimônio', fib: 5 },
      { id: 'pe6', name: 'Parte Especial — Crimes contra a dignidade sexual', fib: 5 },
      { id: 'pe10', name: 'Parte Especial — Crimes contra a fé pública', fib: 3 },
      { id: 'pe11', name: 'Parte Especial — Crimes contra a administração pública', fib: 21 },
      { id: 'ambientais', name: 'Lei 9.605/1998 — Crimes Ambientais', fib: 2 },
      { id: 'sumulaspenal', name: 'Súmulas e jurisprudência dos Tribunais Superiores', fib: 2 },
    ],
  },
  direitoProcessualPenal: {
    name: 'Direito Processual Penal',
    questoes: 6,
    topics: [
      { id: 'nocoes', name: 'Noções introdutórias — princípios, sistemas, lei processual, fontes e interpretação', fib: 3 },
      { id: 'cppI', name: 'Investigação preliminar — inquérito policial, ANPP e controle externo', fib: 5 },
      { id: 'cppII', name: 'Ação penal e ação civil ex delicto', fib: 13 },
      { id: 'competencia', name: 'Jurisdição e competência criminal', fib: 5 },
      { id: 'cppVII', name: 'Provas — teoria geral, meios de prova e de obtenção de prova', fib: 13 },
      { id: 'cppIX', name: 'Medidas cautelares pessoais, prisões e liberdade provisória', fib: 13 },
      { id: 'incidentes', name: 'Questões e processos incidentes', fib: 2 },
      { id: 'cautelaresreais', name: 'Medidas cautelares reais (assecuratórias)', fib: 2 },
      { id: 'cppVIII', name: 'Sujeitos do processo e comunicação dos atos processuais', fib: 3 },
      { id: 'procedimentos', name: 'Procedimento comum — ordinário, sumário e sumaríssimo', fib: 2 },
      { id: 'cppL3TI', name: 'Nulidades', fib: 3 },
      { id: 'recursos', name: 'Sentença, recursos e ações autônomas de impugnação (habeas corpus)', fib: 5 },
      { id: 'prisaotemp', name: 'Lei 7.960/1989 — Prisão Temporária', fib: 5 },
      { id: 'juizados', name: 'Lei 9.099/1995 — Juizados Especiais Criminais', fib: 3 },
      { id: 'interceptacao', name: 'Lei 9.296/1996 — Interceptação Telefônica', fib: 3 },
      { id: 'sumulasdpp', name: 'Súmulas e jurisprudência', fib: 2 },
    ],
  },
  direitoPenalMilitar: {
    name: 'Direito Penal Militar',
    questoes: 6,
    topics: [
      { id: 'pgI', name: 'Parte Geral, Título I — Da Aplicação da Lei Penal Militar', fib: 21 },
      { id: 'pgII', name: 'Parte Geral, Título II — Do Crime', fib: 3 },
      { id: 'pgIII', name: 'Parte Geral, Título III — Da Imputabilidade Penal', fib: 3 },
      { id: 'pgIV', name: 'Parte Geral, Título IV — Do Concurso de Agentes', fib: 2 },
      { id: 'pgV', name: 'Parte Geral, Título V — Das Penas (aplicação, sursis, livramento, efeitos, reabilitação)', fib: 21 },
      { id: 'pgVI', name: 'Parte Geral, Título VI — Das Medidas de Segurança', fib: 2 },
      { id: 'pgVII', name: 'Parte Geral, Título VII — Da Ação Penal', fib: 2 },
      { id: 'pgVIII', name: 'Parte Geral, Título VIII — Da Extinção da Punibilidade', fib: 2 },
      { id: 'peI', name: 'Parte Especial, Título I — Crimes contra a Segurança Externa do País', fib: 2 },
      { id: 'peII', name: 'Parte Especial, Título II — Crimes contra a Autoridade ou Disciplina Militar', fib: 8 },
      { id: 'peIII', name: 'Parte Especial, Título III — Crimes contra o Serviço e o Dever Militar', fib: 8 },
      { id: 'peIV', name: 'Parte Especial, Título IV — Crimes contra a Pessoa', fib: 8 },
      { id: 'peV', name: 'Parte Especial, Título V — Crimes contra o Patrimônio', fib: 3 },
      { id: 'peVI', name: 'Parte Especial, Título VI — Crimes contra a Incolumidade Pública', fib: 2 },
      { id: 'peVII', name: 'Parte Especial, Título VII — Crimes contra a Administração Militar', fib: 3 },
      { id: 'peVIII', name: 'Parte Especial, Título VIII — Crimes contra a Administração da Justiça Militar', fib: 2 },
    ],
  },
  legislacaoEspecial: {
    name: 'Legislação Especial',
    questoes: 6,
    topics: [
      { id: 'hediondos', name: 'Lei 8.072/1990 — Crimes Hediondos', fib: 2 },
      { id: 'racismo', name: 'Lei 7.716/1989 — Crimes de Preconceito de Raça ou Cor', fib: 2 },
      { id: 'tortura', name: 'Lei 9.455/1997 — Tortura', fib: 2 },
      { id: 'crimeorganizado', name: 'Lei 12.850/2013 — Organização Criminosa', fib: 2 },
      { id: 'drogas', name: 'Lei 11.343/2006 — Lei de Drogas', fib: 3 },
      { id: 'abusoautoridade', name: 'Lei 13.869/2019 — Abuso de Autoridade', fib: 2 },
      { id: 'desarmamento', name: 'Lei 10.826/2003 — Estatuto do Desarmamento', fib: 3 },
      { id: 'mariadapenha', name: 'Lei 11.340/2006 — Lei Maria da Penha', fib: 5 },
      { id: 'eca', name: 'Lei 8.069/1990 — ECA', fib: 21 },
      { id: 'idoso', name: 'Lei 10.741/2003 — Estatuto da Pessoa Idosa', fib: 5 },
      { id: 'identificacao', name: 'Lei 12.037/2009 — Identificação Criminal', fib: 2 },
    ],
  },
  legislacaoTransito: {
    name: 'Legislação de Trânsito',
    questoes: 5,
    topics: [
      { id: 'disposicoes', name: 'Arts. 1º a 4º — Disposições Preliminares', fib: 2 },
      { id: 'competenciapm', name: 'Art. 23 — Competências da Polícia Militar', fib: 3 },
      { id: 'normasgerais', name: 'Arts. 26 a 67 — Normas Gerais de Circulação e Conduta', fib: 8 },
      { id: 'sinalizacao', name: 'Arts. 80 a 90 — Sinalização de Trânsito', fib: 3 },
      { id: 'veiculos', name: 'Arts. 96 a 102 — Classificação e características dos veículos', fib: 2 },
      { id: 'habilitacao', name: 'Arts. 114 a 160 — Registro, licenciamento e habilitação', fib: 5 },
      { id: 'infracoes', name: 'Arts. 256 a 279-A — Infrações, penalidades e processo administrativo', fib: 13 },
      { id: 'autoinfracao', name: 'Art. 280 — Auto de Infração', fib: 3 },
      { id: 'crimestransito', name: 'Arts. 291 a 312-B — Crimes de Trânsito', fib: 21 },
    ],
  },
  informatica: {
    name: 'Informática',
    questoes: 5,
    topics: [
      { id: 'conceitosbasicos', name: 'Conceitos de hardware e software', fib: 13 },
      { id: 'internet', name: 'Tecnologias, ferramentas, aplicativos e procedimentos de informática', fib: 5 },
      { id: 'libreoffice', name: 'LibreOffice 7 — Writer, Calc e Impress', fib: 5 },
      { id: 'windows11', name: 'Windows 11', fib: 8 },
      { id: 'nuvemlgpd', name: 'Colaboração e armazenamento em nuvem; LGPD (Lei 13.709/2018)', fib: 8 },
      { id: 'navegacao', name: 'Navegadores (Edge, Chrome e Firefox) e correio eletrônico', fib: 13 },
      { id: 'seguranca', name: 'Segurança e proteção — vírus, worms e derivados; antivírus', fib: 21 },
    ],
  },
  redacao: {
    name: 'Redação',
    questoes: 'P2',
    topics: [
      { id: 'estrutura', name: 'Texto dissertativo — Ordem Pública (justiça criminal, políticas públicas, CF/88 e Polícia Militar)', fib: 21 },
    ],
  },
}

export const ROTATION_ORDER = [
  'legislacaoInstitucional',
  'direitoConstitucional',
  'linguaPortuguesa',
  'direitoPenal',
  'direitoProcessualPenal',
  'direitoPenalMilitar',
  'legislacaoEspecial',
  'legislacaoTransito',
  'informatica',
  'redacao',
] as const


export const ALL_TOPICS_COUNT = Object.values(CURRICULUM).reduce(
  (a, d) => a + d.topics.length,
  0
)

// ============================== Níveis de domínio ==============================

export type TierKey = 'sem-dados' | 'fraco' | 'mediano' | 'bom' | 'dominado'

export type TierInfo = { key: TierKey; label: string; token: string }

export function tierInfo(mastery: number | null | undefined): TierInfo {
  if (mastery === null || mastery === undefined)
    return { key: 'sem-dados', label: 'Sem dados', token: 'var(--tier-none)' }
  if (mastery < 50) return { key: 'fraco', label: 'Fraco', token: 'var(--tier-weak)' }
  if (mastery < 75) return { key: 'mediano', label: 'Mediano', token: 'var(--tier-mid)' }
  if (mastery < 90) return { key: 'bom', label: 'Bom', token: 'var(--tier-good)' }
  return { key: 'dominado', label: 'Dominado', token: 'var(--tier-mastered)' }
}

export function explainAllocation(t: TopicWithMastery): string {
  const tier = tierInfo(t.mastery)
  if (t.maintenance)
    return `Dominado, mas sem revisão há ${t.daysSinceReview} dias — teste curto de manutenção.`
  if (tier.key === 'sem-dados') return `Ainda sem lançamentos — prioridade máxima (peso ${t.fib}).`
  if (tier.key === 'fraco') return `Média abaixo de 50% — mantém prioridade alta.`
  if (tier.key === 'mediano') return `Entre 50–75% — tempo reduzido, em consolidação.`
  if (tier.key === 'bom') return `Entre 75–90% — tempo reduzido, quase dominado.`
  return `Acima de 90% — piso mínimo de manutenção.`
}

// ============================== Cálculos de desempenho ==============================

export function movingAverageMastery(
  lancamentos: Lancamento[],
  disciplinaId: string,
  topicoId: string,
  n = 5
): number | null {
  const entries = lancamentos
    .filter((l) => l.disciplinaId === disciplinaId && l.topicoId === topicoId)
    .sort((a, b) => (a.data < b.data ? 1 : -1))
    .slice(0, n)
  if (entries.length === 0) return null
  const avg =
    entries.reduce((s, e) => s + (e.acertos / e.quantidade) * 100, 0) / entries.length
  return Math.round(avg)
}

const TIER_MULT: Record<TierKey, number> = {
  'sem-dados': 1,
  fraco: 1,
  mediano: 0.6,
  bom: 0.35,
  dominado: 0.15,
}

// Fatia fixa de manutenção para tópicos dominados que ressurgiram (5–10 min conforme peso).
export function maintenanceMinutes(fib: number): number {
  return Math.max(5, Math.min(10, Math.round(5 + ((fib - 2) / (21 - 2)) * 5)))
}

// Distribui 60 min entre os tópicos ativos, respeitando peso Fibonacci + domínio.
// Tópicos em "manutenção" (dominados que ressurgiram) recebem apenas uma fatia fixa curta;
// o restante do tempo é dividido normalmente entre os demais.
export function allocateMinutes(activeTopics: TopicWithMastery[]): AllocatedTopic[] {
  if (activeTopics.length === 0) return []

  const maintenanceIdx = activeTopics
    .map((t, i) => (t.maintenance ? i : -1))
    .filter((i) => i >= 0)
  const mainIdx = activeTopics.map((_, i) => i).filter((i) => !maintenanceIdx.includes(i))

  const result = new Array<number>(activeTopics.length).fill(0)

  // Se só há tópicos de manutenção, dividem a hora inteira entre si.
  if (mainIdx.length === 0) {
    const each = Math.round(60 / activeTopics.length)
    activeTopics.forEach((_, i) => (result[i] = each))
    const rest = 60 - result.reduce((a, b) => a + b, 0)
    result[0] += rest
    return activeTopics.map((t, i) => ({ ...t, minutes: result[i] }))
  }

  let budget = 60
  for (const i of maintenanceIdx) {
    const m = maintenanceMinutes(activeTopics[i].fib)
    result[i] = m
    budget -= m
  }
  budget = Math.max(mainIdx.length, budget)

  const main = mainIdx.map((i) => activeTopics[i])
  const sumFib = main.reduce((a, t) => a + t.fib, 0)
  const base = main.map((t) => (t.fib / sumFib) * budget)
  const adjusted = main.map((t, i) => base[i] * TIER_MULT[tierInfo(t.mastery).key])
  const freed = base.reduce((a, b) => a + b, 0) - adjusted.reduce((a, b) => a + b, 0)

  const recipients = main
    .map((t, i) => ({ i, fib: t.fib, tier: tierInfo(t.mastery).key }))
    .filter((r) => r.tier !== 'dominado')
    .sort((a, b) => b.fib - a.fib)

  const finalRaw = [...adjusted]
  if (freed > 0.01) {
    if (recipients.length > 0) finalRaw[recipients[0].i] += freed
    else finalRaw.forEach((_, i) => (finalRaw[i] += freed / finalRaw.length))
  }

  const minutes = finalRaw.map((m) => Math.max(1, Math.round(m)))
  const diff = budget - minutes.reduce((a, b) => a + b, 0)
  if (diff !== 0) minutes[minutes.indexOf(Math.max(...minutes))] += diff
  mainIdx.forEach((origIdx, k) => (result[origIdx] = minutes[k]))

  return activeTopics.map((t, i) => ({ ...t, minutes: result[i] }))
}

// Dias desde a última revisão de um tópico específico (null = nunca revisado).
export function daysSinceTopicReview(
  lancamentos: Lancamento[],
  discId: string,
  topicId: string
): number | null {
  const entries = lancamentos
    .filter((l) => l.disciplinaId === discId && l.topicoId === topicId)
    .map((l) => l.data)
    .sort()
  if (entries.length === 0) return null
  const today = new Date().toISOString().slice(0, 10)
  return Math.round(
    (new Date(today).getTime() - new Date(entries[entries.length - 1]).getTime()) / 86400000
  )
}

export function disciplineTopicsWithMastery(
  lancamentos: Lancamento[],
  discId: string
): TopicWithMastery[] {
  return CURRICULUM[discId].topics.map((t) => ({
    ...t,
    mastery: movingAverageMastery(lancamentos, discId, t.id),
    daysSinceReview: daysSinceTopicReview(lancamentos, discId, t.id),
  }))
}

export function disciplineAggregate(lancamentos: Lancamento[], discId: string) {
  const entries = lancamentos.filter((l) => l.disciplinaId === discId)
  const quantidade = entries.reduce((a, e) => a + e.quantidade, 0)
  const acertos = entries.reduce((a, e) => a + e.acertos, 0)
  return {
    quantidade,
    acertos,
    pct: quantidade > 0 ? Math.round((acertos / quantidade) * 100) : null,
  }
}

export function computeStreak(lancamentos: Lancamento[]): number {
  const dates = [...new Set(lancamentos.map((l) => l.data))].sort().reverse()
  if (dates.length === 0) return 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 0; i < dates.length - 1; i++) {
    const diffDays = Math.round(
      (new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000
    )
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

// Peso normalizado da disciplina no edital (questões / maior nº de questões entre disciplinas objetivas).
const MAX_QUESTOES_OBJETIVAS = Math.max(
  ...Object.values(CURRICULUM)
    .map((d) => (typeof d.questoes === 'number' ? d.questoes : 0))
)

function editalWeight(discId: string): number {
  const d = CURRICULUM[discId]
  if (!d || typeof d.questoes !== 'number') return 0
  return d.questoes / MAX_QUESTOES_OBJETIVAS
}

// Domínio médio de uma disciplina (0–100), null se sem lançamentos.
function disciplineAverageMastery(lancamentos: Lancamento[], discId: string): number | null {
  const entries = lancamentos.filter((l) => l.disciplinaId === discId)
  if (entries.length === 0) return null
  const quantidade = entries.reduce((a, e) => a + e.quantidade, 0)
  if (quantidade === 0) return null
  const acertos = entries.reduce((a, e) => a + e.acertos, 0)
  return Math.round((acertos / quantidade) * 100)
}

// Dias desde a última revisão da disciplina (null se nunca tocada).
function daysSinceLastDisciplineReview(lancamentos: Lancamento[], discId: string): number | null {
  const entries = lancamentos
    .filter((l) => l.disciplinaId === discId)
    .sort((a, b) => (a.data < b.data ? 1 : -1))
  if (entries.length === 0) return null
  const today = new Date().toISOString().slice(0, 10)
  return Math.round((new Date(today).getTime() - new Date(entries[0].data).getTime()) / 86400000)
}

// Fator de esquecimento cresce com o tempo desde a última revisão da disciplina.
function forgettingFactor(days: number | null): number {
  if (days === null) return 2.5 // nunca tocada — prioridade máxima
  return Math.min(2.5, 1 + days / 5)
}

// Estado de "pulos" por disciplina (persistido em discipline_skips).
export type SkipState = { skipCount: number; consecutiveSkips: number }
export type DisciplineSkips = Record<string, SkipState>

// Multiplicador de urgência escalonado: 1 pulo = ×1.5, 2 = ×2.0, 3 = ×2.5 (teto ×3).
export function skipMultiplier(consecutiveSkips: number): number {
  if (!consecutiveSkips || consecutiveSkips <= 0) return 1
  return Math.min(3, 1 + consecutiveSkips * 0.5)
}

export type DisciplineScore = {
  discId: string
  peso: number
  questoes: number | 'P2'
  dominio: number | null
  dias: number | null
  esquecimento: number
  skipMult: number
  consecutiveSkips: number
  score: number
}

export function disciplineScore(
  lancamentos: Lancamento[],
  discId: string,
  skips: DisciplineSkips = {}
): DisciplineScore {
  const peso = editalWeight(discId)
  const dominio = disciplineAverageMastery(lancamentos, discId)
  const dominioNorm = dominio === null ? 0 : dominio / 100
  const dias = daysSinceLastDisciplineReview(lancamentos, discId)
  const esquecimento = forgettingFactor(dias)
  const consecutiveSkips = skips[discId]?.consecutiveSkips ?? 0
  const skipMult = skipMultiplier(consecutiveSkips)
  return {
    discId,
    peso,
    questoes: CURRICULUM[discId]?.questoes ?? 0,
    dominio,
    dias,
    esquecimento,
    skipMult,
    consecutiveSkips,
    score: peso * (1 - dominioNorm) * esquecimento * skipMult,
  }
}

// Explicação em texto simples do motivo da prioridade.
export function explainPriority(s: DisciplineScore): string {
  const parts: string[] = []
  parts.push(
    typeof s.questoes === 'number' ? `peso ${s.questoes} no edital` : 'fase eliminatória (redação)'
  )
  parts.push(s.dominio === null ? 'sem domínio medido' : `domínio médio ${s.dominio}%`)
  if (s.dias === null) parts.push('nunca revisada')
  else if (s.dias === 0) parts.push('revisada hoje')
  else parts.push(`sem revisão há ${s.dias} ${s.dias === 1 ? 'dia' : 'dias'}`)
  if (s.consecutiveSkips > 0)
    parts.push(`pulada ${s.consecutiveSkips}× seguidas (urgência ×${s.skipMult.toFixed(1)})`)
  return parts.join(', ')
}

export function rankedDisciplines(
  lancamentos: Lancamento[],
  skips: DisciplineSkips = {}
): DisciplineScore[] {
  return ROTATION_ORDER.map((d) => disciplineScore(lancamentos, d, skips)).sort(
    (a, b) => b.score - a.score
  )
}

// Fila de prioridade ponderada: score = pesoEdital × (1 − domínio/100) × fatorEsquecimento × urgênciaDePulo.
// A disciplina de maior score vira a próxima ativa. Garante que nenhuma disciplina fique
// mais de um ciclo completo sem ser tocada: ao final de um ciclo completo (todas tocadas),
// o esquecimento das primeiras já as impulsiona de novo.
export function nextHeroDiscipline(
  lancamentos: Lancamento[],
  skips: DisciplineSkips = {}
): string {
  const skipped = Object.values(skips).some((s) => s.consecutiveSkips > 0)
  if (lancamentos.length === 0 && !skipped) return ROTATION_ORDER[0]

  let best: string = ROTATION_ORDER[0]
  let bestScore = -Infinity
  for (const discId of ROTATION_ORDER) {
    const { score } = disciplineScore(lancamentos, discId, skips)
    if (score > bestScore) {
      bestScore = score
      best = discId
    }
  }
  return best
}

// Usa a ordem de inserção real (não a data) — reflete a sequência de ações do usuário.
export function computeCycleStats(lancamentos: Lancamento[]) {
  let covered = new Set<string>()
  let completedCycles = 0
  let lastCompletionWasFinalEntry = false
  lancamentos.forEach((l, idx) => {
    covered.add(l.disciplinaId)
    lastCompletionWasFinalEntry = false
    if (covered.size === ROTATION_ORDER.length) {
      completedCycles++
      covered = new Set()
      lastCompletionWasFinalEntry = idx === lancamentos.length - 1
    }
  })
  return {
    completedCycles,
    coverage: covered.size,
    total: ROTATION_ORDER.length,
    justCompleted: lastCompletionWasFinalEntry,
  }
}

export function daysSinceLastStudy(lancamentos: Lancamento[]): number | null {
  if (lancamentos.length === 0) return null
  const dates = [...new Set(lancamentos.map((l) => l.data))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  return Math.round((new Date(today).getTime() - new Date(dates[0]).getTime()) / 86400000)
}

// Teto de tópicos por desempenho real da disciplina: min(3, nº de tópicos ainda abaixo de "bom").
// Disciplina fraca concentra tempo em poucos tópicos; disciplina forte divide entre os poucos que restam.
export function maxTopicsForDiscipline(
  topicsWithMastery: TopicWithMastery[]
): number {
  const belowGood = topicsWithMastery.filter((t) => {
    const key = tierInfo(t.mastery).key
    return key !== 'bom' && key !== 'dominado'
  }).length
  return Math.min(3, Math.max(1, belowGood))
}

// Mantido por compatibilidade com chamadas existentes — agora sempre retorna o teto (3).
// Prefira maxTopicsForDiscipline(topicsWithMastery) no novo fluxo.
export function maxTopicsForCycle(cycleNumber: number): number {
  void cycleNumber
  return 3
}

const TIER_ORDER: Record<TierKey, number> = {
  'sem-dados': 0,
  fraco: 1,
  mediano: 2,
  bom: 3,
  dominado: 4,
}

// Janela de manutenção: tópico dominado sem revisão há mais de N dias volta à fila.
export const MAINTENANCE_DUE_DAYS = 21
// Nº máximo de tópicos de manutenção que podem ressurgir por sessão.
const MAX_MAINTENANCE_SLOTS = 2

// Tópicos dominados que já passaram da janela de manutenção, do mais esquecido para o menos.
export function maintenanceDueTopics(
  topicsWithMastery: TopicWithMastery[]
): TopicWithMastery[] {
  return topicsWithMastery
    .filter(
      (t) =>
        tierInfo(t.mastery).key === 'dominado' &&
        typeof t.daysSinceReview === 'number' &&
        t.daysSinceReview >= MAINTENANCE_DUE_DAYS
    )
    .sort((a, b) => (b.daysSinceReview ?? 0) - (a.daysSinceReview ?? 0))
}

// Seleciona quais tópicos disputam a hora desta disciplina no ciclo atual.
export function selectActiveTopics(
  topicsWithMastery: TopicWithMastery[],
  discId: string,
  lancamentos: Lancamento[],
  maxCount?: number
): TopicWithMastery[] {
  const cap = maxCount ?? maxTopicsForDiscipline(topicsWithMastery)
  const touchedIds = new Set(
    lancamentos.filter((l) => l.disciplinaId === discId).map((l) => l.topicoId)
  )
  const touched = topicsWithMastery
    .filter((t) => touchedIds.has(t.id))
    .sort((a, b) => {
      const ta = TIER_ORDER[tierInfo(a.mastery).key]
      const tb = TIER_ORDER[tierInfo(b.mastery).key]
      return ta !== tb ? ta - tb : b.fib - a.fib
    })
  const untouched = topicsWithMastery
    .filter((t) => !touchedIds.has(t.id))
    .sort((a, b) => b.fib - a.fib)

  let selected = [...touched]
  while (selected.length < cap && untouched.length > 0) selected.push(untouched.shift()!)
  if (selected.length > cap) selected = selected.slice(0, cap)

  const allDominado =
    selected.length > 0 && selected.every((t) => tierInfo(t.mastery).key === 'dominado')
  if (allDominado && untouched.length > 0) selected = [...selected.slice(1), untouched[0]]

  // Ressurgimento espaçado: tópicos dominados há muito tempo sem revisão voltam
  // a disputar a hora da disciplina, mas apenas com uma fatia curta de manutenção.
  const selectedIds = new Set(selected.map((t) => t.id))
  const due = maintenanceDueTopics(topicsWithMastery)
    .filter((t) => !selectedIds.has(t.id))
    .slice(0, MAX_MAINTENANCE_SLOTS)
    .map((t) => ({ ...t, maintenance: true }))

  return [...selected, ...due]
}

// ============================== Revisão por cores ==============================

export function targetViews(fib: number): number {
  return Math.round(8 + ((fib - 2) / (21 - 2)) * (20 - 8))
}

export function viewCount(lancamentos: Lancamento[], discId: string, topicId: string): number {
  return lancamentos.filter((l) => l.disciplinaId === discId && l.topicoId === topicId).length
}

export function lerpColor(hexA: string, hexB: string, t: number): string {
  t = Math.max(0, Math.min(1, t))
  const parse = (h: string) => h.replace('#', '').match(/\w\w/g)!.map((v) => parseInt(v, 16))
  const a = parse(hexA)
  const b = parse(hexB)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`
}
