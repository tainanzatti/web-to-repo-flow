export type DisciplineId = string;
export type TopicId = string;

export interface Discipline {
  id: DisciplineId;
  nome: string;
  peso_edital: number;
  ordem: number;
  is_redacao: boolean;
}

export interface Topic {
  id: TopicId;
  disciplina_id: DisciplineId;
  nome: string;
  ordem: number;
}

export interface Lancamento {
  id: string;
  disciplina_id: DisciplineId;
  topico_id: TopicId | null;
  mastery: number;
  minutos: number;
  is_primeiro_contato: boolean;
  criado_em: string;
}

export interface TopicWithMastery extends Topic {
  mastery: number;
  movingAverageMastery: number;
  tier: TopicTier;
  ultimoContatoDias: number | null;
  isPrimeiroContato: boolean;
}

export interface AllocatedTopic {
  topic: TopicWithMastery;
  minutos: number;
  isManutencao: boolean;
}

export interface DisciplinaScore {
  disciplinaId: DisciplineId;
  nome: string;
  pesoEdital: number;
  dominioMedio: number;
  diasDesdeUltimaRevisao: number;
  fatorEsquecimento: number;
  multiplicadorUrgencia: number;
  vezesPulada: number;
  score: number;
  motivoPrioridade: string;
}

export type TopicTier = "ruim" | "medio" | "bom" | "otimo" | "dominado";

export const TIER_THRESHOLDS = { bom: 60, otimo: 80, dominado: 90 } as const;

export function tierFromMastery(mastery: number): TopicTier {
  if (mastery >= 90) return "dominado";
  if (mastery >= 80) return "otimo";
  if (mastery >= 60) return "bom";
  if (mastery >= 40) return "medio";
  return "ruim";
}

const MINUTOS_POR_TOPICO_NOVO = 25;
const MINUTOS_POR_TOPICO_REVISAO = 12;
const MINUTOS_MANUTENCAO = 7;
const DIAS_RESSURGIMENTO_DOMINADO = 25;
const MAX_PESO_EDITAL = 10;

export function fatorEsquecimento(dias: number): number {
  return Math.min(2.5, 1 + dias / 5);
}

export function movingAverage(masteryValues: number[]): number {
  if (masteryValues.length === 0) return 0;
  const window = masteryValues.slice(-5);
  return window.reduce((a, b) => a + b, 0) / window.length;
}

export function diasDesde(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export interface DisciplinaComTopicos {
  disciplina: Discipline;
  topicos: TopicWithMastery[];
  dominioMedio: number;
  diasDesdeUltimaRevisao: number;
  topicosAbaixoBom: number;
}

export function computeTopicMastery(topic: Topic, lancamentos: Lancamento[]): TopicWithMastery {
  const topicLanc = lancamentos
    .filter((l) => l.topico_id === topic.id)
    .sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());
  const masteryValues = topicLanc.map((l) => l.mastery);
  const latestMastery = masteryValues.length > 0 ? masteryValues[masteryValues.length - 1] : 0;
  const mAvg = movingAverage(masteryValues);
  const ultimo = topicLanc.length > 0 ? topicLanc[topicLanc.length - 1] : null;
  const ultimoContatoDias = ultimo ? diasDesde(ultimo.criado_em) : null;
  return {
    ...topic,
    mastery: latestMastery,
    movingAverageMastery: mAvg,
    tier: tierFromMastery(mAvg),
    ultimoContatoDias,
    isPrimeiroContato: topicLanc.length === 0,
  };
}

export function computeDisciplinaData(disciplina: Discipline, topics: Topic[], lancamentos: Lancamento[]): DisciplinaComTopicos {
  const topicos = topics.map((t) => computeTopicMastery(t, lancamentos));
  const dominioMedio = topicos.length > 0 ? topicos.reduce((s, t) => s + t.movingAverageMastery, 0) / topicos.length : 0;
  const discLanc = lancamentos
    .filter((l) => l.disciplina_id === disciplina.id)
    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  const diasDesdeUltimaRevisao = discLanc.length > 0 ? diasDesde(discLanc[0].criado_em) : 9999;
  const topicosAbaixoBom = topicos.filter((t) => t.tier !== "bom" && t.tier !== "otimo" && t.tier !== "dominado").length;
  return { disciplina, topicos, dominioMedio, diasDesdeUltimaRevisao, topicosAbaixoBom };
}

export function computeScore(
  disciplina: Discipline,
  dominioMedio: number,
  diasDesdeUltimaRevisao: number,
  multiplicadorUrgencia: number = 1,
  vezesPulada: number = 0
): DisciplinaScore {
  const pesoNormalizado = disciplina.peso_edital / MAX_PESO_EDITAL;
  const dias = diasDesdeUltimaRevisao >= 9999 ? 0 : diasDesdeUltimaRevisao;
  const fator = fatorEsquecimento(dias);
  const score = pesoNormalizado * (1 - dominioMedio / 100) * fator * multiplicadorUrgencia;
  const motivo = `peso ${disciplina.peso_edital} no edital, domínio médio ${Math.round(dominioMedio)}%, sem revisão há ${diasDesdeUltimaRevisao >= 9999 ? "nunca" : diasDesdeUltimaRevisao + " dias"}${vezesPulada > 0 ? `, pulada ${vezesPulada}x` : ""}`;
  return {
    disciplinaId: disciplina.id, nome: disciplina.nome, pesoEdital: disciplina.peso_edital,
    dominioMedio, diasDesdeUltimaRevisao: dias, fatorEsquecimento: fator,
    multiplicadorUrgencia, vezesPulada, score, motivoPrioridade: motivo,
  };
}

export function nextHeroDiscipline(
  disciplinas: DisciplinaComTopicos[],
  skipData: Map<DisciplineId, { vezes_pulada: number; multiplicador_urgencia: number }>,
  excludeDisciplinaId?: DisciplineId | null
): DisciplinaScore | null {
  if (disciplinas.length === 0) return null;
  const candidates = excludeDisciplinaId ? disciplinas.filter((d) => d.disciplina.id !== excludeDisciplinaId) : disciplinas;
  if (candidates.length === 0) return null;
  const scores = candidates.map((d) => {
    const skip = skipData.get(d.disciplina.id);
    return computeScore(d.disciplina, d.dominioMedio, d.diasDesdeUltimaRevisao, skip?.multiplicador_urgencia ?? 1, skip?.vezes_pulada ?? 0);
  });
  scores.sort((a, b) => b.score - a.score);
  return scores[0];
}

export function maxTopicsForDiscipline(d: DisciplinaComTopicos): number {
  return Math.min(3, Math.max(1, d.topicosAbaixoBom));
}

export function allocateTopics(d: DisciplinaComTopicos, minutosTotal: number = 45): AllocatedTopic[] {
  const max = maxTopicsForDiscipline(d);
  const tecto = Math.min(max, d.topicos.length);
  const naoDominados = d.topicos.filter((t) => t.tier !== "dominado").sort((a, b) => a.movingAverageMastery - b.movingAverageMastery);
  const dominadosParaRessurgir = d.topicos
    .filter((t) => t.tier === "dominado" && t.ultimoContatoDias !== null && t.ultimoContatoDias >= DIAS_RESSURGIMENTO_DOMINADO)
    .sort((a, b) => (b.ultimoContatoDias ?? 0) - (a.ultimoContatoDias ?? 0));
  const slotsPrincipais = Math.max(1, tecto - (dominadosParaRessurgir.length > 0 ? 1 : 0));
  const principais = naoDominados.slice(0, slotsPrincipais);
  const manutencao = dominadosParaRessurgir.slice(0, 1);
  const minutosManutencao = manutencao.length * MINUTOS_MANUTENCAO;
  const minutosDisponiveis = Math.max(0, minutosTotal - minutosManutencao);
  const minutosPorTopico = principais.length > 0 ? Math.floor(minutosDisponiveis / principais.length) : 0;
  const allocated: AllocatedTopic[] = principais.map((t) => ({
    topic: t, minutos: t.isPrimeiroContato ? MINUTOS_POR_TOPICO_NOVO : MINUTOS_POR_TOPICO_REVISAO, isManutencao: false,
  }));
  manutencao.forEach((t) => { allocated.push({ topic: t, minutos: MINUTOS_MANUTENCAO, isManutencao: true }); });
  return allocated;
}

export function topicosParaFlashcards(disciplinas: DisciplinaComTopicos[]): { topicoId: string; disciplinaId: string; topicoNome: string }[] {
  const result: { topicoId: string; disciplinaId: string; topicoNome: string }[] = [];
  for (const d of disciplinas) {
    for (const t of d.topicos) {
      if (t.movingAverageMastery < TIER_THRESHOLDS.bom) {
        result.push({ topicoId: t.id, disciplinaId: d.disciplina.id, topicoNome: t.nome });
      }
    }
  }
  return result;
}

export const PROJECTION_NOTE = "Estimativa baseada no seu ritmo médio real de estudo. Não considera revisões, apenas o primeiro contato com cada tópico.";
