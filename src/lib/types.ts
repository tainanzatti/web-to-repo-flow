export type Discipline = {
  id: string
  nome: string
  peso_edital: number
  ordem: number
  is_redacao: boolean
}

export type Topic = {
  id: string
  disciplina_id: string
  nome: string
  ordem: number
}

export type Lancamento = {
  id: string
  disciplina_id: string
  topico_id: string | null
  mastery: number
  minutos: number
  is_primeiro_contato: boolean
  criado_em: string
  user_id: string | null
}

export type QuestaoLancamento = {
  id: string
  user_id: string | null
  disciplina_id: string
  topico_id: string | null
  quantidade: number
  acertos: number
  erros: number
  fonte: string | null
  criado_em: string
}

export type SkipCount = {
  disciplina_id: string
  vezes_pulada: number
  multiplicador_urgencia: number
}

export type Flashcard = {
  id: string
  disciplina_id: string
  topico_id: string
  pergunta: string
  resposta: string
  caixa: number
  proxima_revisao: string
  criado_em: string
  user_id: string | null
}

export type Redacao = {
  id: string
  tema: string
  texto: string
  nota: number | null
  feedback_json: Record<string, unknown> | null
  criado_em: string
  user_id: string | null
}

export type AiMaterial = {
  id: string
  disciplina_id: string
  topico_id: string | null
  kind: string
  content_json: Record<string, unknown>
  criado_em: string
}

export type StudyTimeDaily = {
  id: string
  user_id: string | null
  data: string
  tempo_segundos: number
}

export type UserPrefs = {
  id: number
  nome: string
  sidebar_expandida: boolean
  horas_estudo_dia: number
}

export type Profile = {
  id: string
  nome: string
  email: string
  telefone: string | null
  data_nascimento: string | null
  cpf: string | null
  criado_em: string
  tema: string | null
}
