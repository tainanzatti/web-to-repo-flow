export const MAX_PESO_EDITAL = 10;
export const LEITNER_BOXES = [1, 2, 4, 8, 16] as const;
export const MASTERY_THRESHOLD = 60;
export const MAX_DAILY_MINUTES = 60;

export type Tier = "ruim" | "medio" | "bom" | "otimo";
export type Prioridade = "Alta" | "Média" | "Baixa";

export interface Discipline { id: string; nome: string; peso_edital: number; ordem: number; is_redacao?: boolean; }
export interface Topic { id: string; disciplina_id: string; nome: string; ordem: number; }
export interface Lancamento { id: string; disciplina_id: string; topico_id: string | null; mastery: number; minutos: number; is_primeiro_contato: boolean; criado_em: string; }
export interface QuestaoRow { id: string; disciplina_id: string; topico_id: string | null; acertou: boolean; fonte: string | null; criado_em: string; }

export interface DisciplinaData {
  discipline: Discipline; topics: Topic[]; lancamentos: Lancamento[];
  dominioMedio: number; topicosNaoDominados: number;
  fatorEsquecimento: number; multiplicadorUrgencia: number; score: number;
}

export interface TopicoStats {
  topic: Topic; discipline: Discipline;
  masteryMedio: number; revisoes: number; diasDesdeUltimaRevisao: number;
  questoesRespondidas: number; acertos: number; taxaAcertos: number;
  erros: number; taxaErros: number; score: number;
}

export interface PlanoItem { topico_id: string; topico_nome: string; disciplina_nome: string; tempo_minutos: number; prioridade: Prioridade; motivo: string; }
export interface PlanoEstudo { data: string; itens: PlanoItem[]; tempo_total: number; }

export function tierFromMastery(mastery: number): Tier {
  if (mastery < 30) return "ruim"; if (mastery < 60) return "medio"; if (mastery < 85) return "bom"; return "otimo";
}
export function dominioLabel(mastery: number): string {
  if (mastery < 20) return "Muito baixo"; if (mastery < 40) return "Baixo";
  if (mastery < 60) return "Médio"; if (mastery < 85) return "Bom"; return "Excelente";
}
export function fatorEsquecimento(lancamentos: Lancamento[]): number {
  if (lancamentos.length === 0) return 1.5;
  const last = lancamentos.map((l) => new Date(l.criado_em).getTime()).sort((a, b) => b - a)[0];
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  if (days > 25) return 1.5; if (days > 15) return 1.3; if (days > 7) return 1.15; if (days > 3) return 1.05; return 1.0;
}
export function dominioMedio(lancamentos: Lancamento[]): number {
  if (lancamentos.length === 0) return 0;
  const byTopic = new Map<string, number[]>();
  for (const l of lancamentos) { const key = l.topico_id ?? "_disc"; if (!byTopic.has(key)) byTopic.set(key, []); byTopic.get(key)!.push(Number(l.mastery)); }
  let sum = 0; for (const arr of byTopic.values()) sum += arr.reduce((a, b) => a + b, 0) / arr.length;
  return sum / byTopic.size;
}
export function maxTopicsForDiscipline(d: DisciplinaData): number { const n = d.topicosNaoDominados; if (n >= 3) return 3; if (n === 2) return 2; return 1; }
export function allocateTopics(topics: Topic[], lancamentos: Lancamento[], max: number): Topic[] {
  const byTopic = new Map<string, Lancamento[]>();
  for (const l of lancamentos) { if (!l.topico_id) continue; if (!byTopic.has(l.topico_id)) byTopic.set(l.topico_id, []); byTopic.get(l.topico_id)!.push(l); }
  const withScore = topics.map((t) => {
    const arr = byTopic.get(t.id) ?? [];
    const avg = arr.length > 0 ? arr.reduce((a, b) => a + Number(b.mastery), 0) / arr.length : 0;
    const lastDate = arr.length > 0 ? arr.map((l) => new Date(l.criado_em).getTime()).sort((a, b) => b - a)[0] : 0;
    const daysSince = lastDate ? (Date.now() - lastDate) / (1000 * 60 * 60 * 24) : 999;
    return { topic: t, avg, daysSince };
  });
  withScore.sort((a, b) => { if (a.avg !== b.avg) return a.avg - b.avg; return b.daysSince - a.daysSince; });
  return withScore.slice(0, max).map((x) => x.topic);
}
export function computeScore(peso: number, dom: number, fe: number, mult: number): number { return (peso / MAX_PESO_EDITAL) * (1 - dom / 100) * fe * mult; }
export function computeDisciplinaData(discipline: Discipline, topics: Topic[], lancamentos: Lancamento[], mult: number = 1): DisciplinaData {
  const dom = dominioMedio(lancamentos); const fe = fatorEsquecimento(lancamentos);
  const naoDominados = topics.filter((t) => {
    const arr = lancamentos.filter((l) => l.topico_id === t.id);
    if (arr.length === 0) return true;
    return arr.reduce((a, b) => a + Number(b.mastery), 0) / arr.length < MASTERY_THRESHOLD;
  }).length;
  return { discipline, topics, lancamentos, dominioMedio: dom, topicosNaoDominados: naoDominados, fatorEsquecimento: fe, multiplicadorUrgencia: mult, score: computeScore(discipline.peso_edital, dom, fe, mult) };
}
export function nextHeroDiscipline(all: DisciplinaData[], exclude?: string): DisciplinaData | null {
  const c = all.filter((d) => d.discipline.id !== exclude); if (c.length === 0) return null;
  c.sort((a, b) => b.score - a.score); return c[0];
}
export function computeTopicoStats(topics: Topic[], disciplines: Discipline[], lancamentos: Lancamento[], questoes: QuestaoRow[]): TopicoStats[] {
  const discMap = new Map(disciplines.map((d) => [d.id, d]));
  return topics.map((t) => {
    const disc = discMap.get(t.disciplina_id)!;
    const tLancs = lancamentos.filter((l) => l.topico_id === t.id);
    const tQuestoes = questoes.filter((q) => q.topico_id === t.id);
    const acertos = tQuestoes.filter((q) => q.acertou).length;
    const masteryMedio = tLancs.length > 0 ? tLancs.reduce((a, b) => a + Number(b.mastery), 0) / tLancs.length : 0;
    const lastDate = tLancs.length > 0 ? tLancs.map((l) => new Date(l.criado_em).getTime()).sort((a, b) => b - a)[0] : 0;
    const diasDesde = lastDate ? Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24)) : 999;
    const taxaAcertos = tQuestoes.length > 0 ? (acertos / tQuestoes.length) * 100 : 0;
    const erros = tQuestoes.length - acertos;
    const taxaErros = tQuestoes.length > 0 ? (erros / tQuestoes.length) * 100 : 0;
    const pesoNorm = disc.peso_edital / MAX_PESO_EDITAL;
    const urgenciaEsquecimento = diasDesde > 25 ? 1.5 : diasDesde > 15 ? 1.3 : diasDesde > 7 ? 1.15 : diasDesde > 3 ? 1.05 : 1.0;
    const fatorErros = 1 + taxaErros / 100;
    const fatorNovidade = tLancs.length === 0 ? 2.0 : 1 + 1 / (tLancs.length + 1);
    const score = pesoNorm * (1 - masteryMedio / 100) * urgenciaEsquecimento * fatorErros * fatorNovidade;
    return { topic: t, discipline: disc, masteryMedio, revisoes: tLancs.length, diasDesdeUltimaRevisao: diasDesde, questoesRespondidas: tQuestoes.length, acertos, taxaAcertos, erros, taxaErros, score };
  });
}
export function computeDailyPlan(topicoStats: TopicoStats[], dataStr: string): PlanoEstudo {
  const sorted = [...topicoStats].sort((a, b) => b.score - a.score);
  const avgMastery = sorted.length > 0 ? sorted.reduce((a, b) => a + b.masteryMedio, 0) / sorted.length : 0;
  let maxTopicos: number;
  if (avgMastery < 40) maxTopicos = 1; else if (avgMastery < 60) maxTopicos = 2; else if (avgMastery < 80) maxTopicos = 3; else maxTopicos = 4;
  const avgErrorRate = sorted.length > 0 ? sorted.reduce((a, b) => a + b.taxaErros, 0) / sorted.length : 0;
  if (avgErrorRate > 40 && maxTopicos > 1) maxTopicos = Math.max(1, maxTopicos - 1);
  const selected = sorted.slice(0, maxTopicos);
  const totalWeight = selected.reduce((sum, s) => sum + (100 - s.masteryMedio + 10), 0);
  const itens: PlanoItem[] = selected.map((s) => {
    const weight = (100 - s.masteryMedio + 10) / totalWeight;
    const tempo = Math.max(10, Math.round(MAX_DAILY_MINUTES * weight));
    let prioridade: Prioridade = "Média";
    if (s.score > 1.5 || s.masteryMedio < 30 || s.taxaErros > 50) prioridade = "Alta";
    else if (s.masteryMedio > 70 && s.taxaErros < 20) prioridade = "Baixa";
    const motivos: string[] = [];
    if (s.revisoes === 0) motivos.push("Este tópico ainda não foi estudado nenhuma vez.");
    else {
      if (s.taxaAcertos < 60 && s.questoesRespondidas > 0) motivos.push(`Seu índice de acertos foi de apenas ${Math.round(s.taxaAcertos)}%.`);
      if (s.diasDesdeUltimaRevisao > 7) motivos.push(`Última revisão foi há ${s.diasDesdeUltimaRevisao} dias.`);
      if (s.masteryMedio < 40) motivos.push(`Domínio atual baixo (${Math.round(s.masteryMedio)}%).`);
      if (s.revisoes < 3) motivos.push(`Apenas ${s.revisoes} revisão(ões) registrada(s).`);
    }
    if (s.discipline.peso_edital >= 8) motivos.push(`Disciplina de alta importância no edital (peso ${s.discipline.peso_edital}).`);
    if (motivos.length === 0) motivos.push("Revisão de manutenção recomendada.");
    return { topico_id: s.topic.id, topico_nome: s.topic.nome, disciplina_nome: s.discipline.nome, tempo_minutos: tempo, prioridade, motivo: motivos.join(" ") };
  });
  let tempoTotal = itens.reduce((a, b) => a + b.tempo_minutos, 0);
  if (tempoTotal > MAX_DAILY_MINUTES) { const ratio = MAX_DAILY_MINUTES / tempoTotal; itens.forEach((i) => { i.tempo_minutos = Math.max(10, Math.round(i.tempo_minutos * ratio)); }); tempoTotal = itens.reduce((a, b) => a + b.tempo_minutos, 0); }
  return { data: dataStr, itens, tempo_total: tempoTotal };
}
