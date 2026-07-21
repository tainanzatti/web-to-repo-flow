/**
 * Re-export from the centralized ai.service.ts.
 * This file is kept for backward compatibility with existing imports.
 * All new code should import directly from ai.service.ts.
 */
export {
  aiChat,
  aiExplicar,
  aiResumo as gerarResumo,
  aiGerarQuestoes,
  aiExplicarAlternativa,
  aiCorrigirRedacao,
  aiAnaliseDesempenho,
  aiRecomendacoes,
  aiGerarTemaRedacao as gerarTemaRedacao,
  aiGerarPlano as gerarPlanoAI,
  type ChatMessage,
  type QuestaoGerada,
  type CorrecaoRedacao,
  type AnaliseDesempenho,
  type PlanoAIInput,
} from "./ai.service";
