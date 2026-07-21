export const MAX_PESO_EDITAL = 10;

export const LEITNER_BOXES = [1, 2, 4, 8, 16] as const;
export const MASTERY_THRESHOLD = 60;

export type Tier = "ruim" | "medio" | "bom" | "otimo";

export interface Discipline {
  id: string;
  nome: string;
  peso_edital: number;
  ordem: number;
  is_redacao?: boolean;
}

export interface Topic {
  id: string;
  disciplina_id: string;
  nome: string;
  ordem: number;
}

export interface Lancamento {
  id: string;
  disciplina_id: string;
  topico_id: string | null;
  mastery: number;
  criado_em: string;
}

export interface DisciplinaData {
  discipline: Discipline;
  topics: Topic[];
  lancamentos: Lancamento[];
  dominioMedio: number;
  topicosNaoDominados: number;
  fatorEsquecimento: number;
  multiplicadorUrgencia: number;
  score: number;
}

export function tierFromMastery(mastery: number): Tier {
  if (mastery < 30) return "ruim";
  if (mastery < 60) return "medio";
  if (mastery < 85) return "bom";
  return "otimo";
}

export function fatorEsquecimento(lancamentos: Lancamento[]): number {
  if (lancamentos.length === 0) return 1.5;
  const last = lancamentos
    .map((l) => new Date(l.criado_em).getTime())
    .sort((a, b) => b - a)[0];
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  if (days > 25) return 1.5;
  if (days > 15) return 1.3;
  if (days > 7) return 1.15;
  if (days > 3) return 1.05;
  return 1.0;
}

export function dominioMedio(lancamentos: Lancamento[]): number {
  if (lancamentos.length === 0) return 0;
  const byTopic = new Map<string, number[]>();
  for (const l of lancamentos) {
    const key = l.topico_id ?? "_disc";
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key)!.push(Number(l.mastery));
  }
  let sum = 0;
  for (const arr of byTopic.values()) {
    sum += arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  return sum / byTopic.size;
}

export function maxTopicsForDiscipline(disciplinaData: DisciplinaData): number {
  const n = disciplinaData.topicosNaoDominados;
  if (n >= 3) return 3;
  if (n === 2) return 2;
  return 1;
}

export function allocateTopics(
  topics: Topic[],
  lancamentos: Lancamento[],
  max: number
): Topic[] {
  const byTopic = new Map<string, Lancamento[]>();
  for (const l of lancamentos) {
    if (!l.topico_id) continue;
    if (!byTopic.has(l.topico_id)) byTopic.set(l.topico_id, []);
    byTopic.get(l.topico_id)!.push(l);
  }
  const withScore = topics.map((t) => {
    const arr = byTopic.get(t.id) ?? [];
    const avg = arr.length > 0 ? arr.reduce((a, b) => a + Number(b.mastery), 0) / arr.length : 0;
    const lastDate = arr.length > 0
      ? arr.map((l) => new Date(l.criado_em).getTime()).sort((a, b) => b - a)[0]
      : 0;
    const daysSince = lastDate ? (Date.now() - lastDate) / (1000 * 60 * 60 * 24) : 999;
    return { topic: t, avg, daysSince };
  });
  withScore.sort((a, b) => {
    if (a.avg !== b.avg) return a.avg - b.avg;
    return b.daysSince - a.daysSince;
  });
  return withScore.slice(0, max).map((x) => x.topic);
}

export function computeScore(
  pesoEdital: number,
  dominioMedioVal: number,
  fatorEsquecimentoVal: number,
  multiplicadorUrgencia: number
): number {
  const pesoNormalizado = pesoEdital / MAX_PESO_EDITAL;
  return pesoNormalizado * (1 - dominioMedioVal / 100) * fatorEsquecimentoVal * multiplicadorUrgencia;
}

export function computeDisciplinaData(
  discipline: Discipline,
  topics: Topic[],
  lancamentos: Lancamento[],
  multiplicadorUrgencia: number = 1
): DisciplinaData {
  const dom = dominioMedio(lancamentos);
  const fe = fatorEsquecimento(lancamentos);
  const naoDominados = topics.filter((t) => {
    const arr = lancamentos.filter((l) => l.topico_id === t.id);
    if (arr.length === 0) return true;
    const avg = arr.reduce((a, b) => a + Number(b.mastery), 0) / arr.length;
    return avg < MASTERY_THRESHOLD;
  }).length;
  const score = computeScore(discipline.peso_edital, dom, fe, multiplicadorUrgencia);
  return {
    discipline,
    topics,
    lancamentos,
    dominioMedio: dom,
    topicosNaoDominados: naoDominados,
    fatorEsquecimento: fe,
    multiplicadorUrgencia,
    score,
  };
}

export function nextHeroDiscipline(
  allData: DisciplinaData[],
  excludeDisciplinaId?: string
): DisciplinaData | null {
  const candidates = allData.filter((d) => d.discipline.id !== excludeDisciplinaId);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}
