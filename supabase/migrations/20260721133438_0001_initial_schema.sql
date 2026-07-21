/*
# Operação PMSC — Schema Inicial

## Visão Geral
Plataforma de estudos para o concurso Soldado PMSC 2026 (banca Instituto AOCP).
App single-tenant (sem autenticação): todos os dados são compartilhados/públicos,
acessíveis via anon key.

## Tabelas Criadas

### disciplines
Disciplinas do edital. `id` é um slug textual (ex: "portugues").
- id (text, PK)
- nome (text)
- peso_edital (int) — peso da disciplina no concurso
- ordem (int) — ordem de exibição
- is_redacao (bool) — true para a disciplina de redação (tratamento especial)

### topics
Tópicos dentro de cada disciplina.
- id (text, PK)
- disciplina_id (text, FK → disciplines)
- nome (text)
- ordem (int)

### lancamentos
Registros de estudo (sessões). Cada lançamento registra o mastery de um tópico
após uma sessão de estudo, minutos gastos, e se foi primeiro contato.
- id (uuid, PK)
- disciplina_id (text, FK)
- topico_id (text, FK, nullable)
- mastery (numeric 0-100) — nível de domínio registrado
- minutos (int) — minutos estudados
- is_primeiro_contato (bool) — se foi a primeira vez que o tópico foi tocado
- criado_em (timestamptz)

### ai_material
Cache de material gerado por IA, indexado por tópico + kind.
- id (uuid, PK)
- disciplina_id (text, FK)
- topico_id (text, FK, nullable)
- kind (text) — 'leiseca', 'resumo', 'questoes', 'flashcards', 'redacao-tema', 'redacao-correcao'
- content_json (jsonb)
- criado_em (timestamptz)
- UNIQUE (topico_id, kind) onde topico_id não é null

### flashcards
Cartões de reforço com repetição espaçada (Leitner simplificado).
- id (uuid, PK)
- disciplina_id (text, FK)
- topico_id (text, FK)
- pergunta (text)
- resposta (text)
- caixa (int 1-5, default 1)
- proxima_revisao (date)
- criado_em (timestamptz)

### redacoes
Redações escritas pelo usuário com correção por IA.
- id (uuid, PK)
- tema (text)
- texto (text)
- nota (numeric 0-10, nullable até corrigir)
- feedback_json (jsonb, nullable)
- criado_em (timestamptz)

### skip_counts
Contador de vezes que cada disciplina foi pulada e multiplicador de urgência.
- disciplina_id (text, PK, FK → disciplines)
- vezes_pulada (int, default 0)
- multiplicador_urgencia (numeric, default 1.0)

### user_prefs
Preferências do usuário (singleton — sempre id=1).
- id (int, PK, default 1)
- nome (text)
- sidebar_expandida (bool, default true)
- horas_estudo_dia (int, default 4)

## Segurança
RLS habilitado em todas as tabelas. Políticas permitem CRUD completo para
anon + authenticated (single-tenant, dados intencionalmente compartilhados).
*/

-- ============================================================
-- DISCIPLINES
-- ============================================================
CREATE TABLE IF NOT EXISTS disciplines (
  id text PRIMARY KEY,
  nome text NOT NULL,
  peso_edital int NOT NULL DEFAULT 1,
  ordem int NOT NULL DEFAULT 0,
  is_redacao boolean NOT NULL DEFAULT false
);

-- ============================================================
-- TOPICS
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
  id text PRIMARY KEY,
  disciplina_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_topics_disciplina ON topics(disciplina_id);

-- ============================================================
-- LANCAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topico_id text REFERENCES topics(id) ON DELETE SET NULL,
  mastery numeric NOT NULL DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  minutos int NOT NULL DEFAULT 0,
  is_primeiro_contato boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lancamentos_disciplina ON lancamentos(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_topico ON lancamentos(topico_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_criado ON lancamentos(criado_em);

-- ============================================================
-- AI_MATERIAL (cache)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_material (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topico_id text REFERENCES topics(id) ON DELETE CASCADE,
  kind text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topico_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_ai_material_kind ON ai_material(kind);

-- ============================================================
-- FLASHCARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topico_id text NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  pergunta text NOT NULL,
  resposta text NOT NULL,
  caixa int NOT NULL DEFAULT 1 CHECK (caixa >= 1 AND caixa <= 5),
  proxima_revisao date NOT NULL DEFAULT CURRENT_DATE,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_flashcards_topico ON flashcards(topico_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_proxima ON flashcards(proxima_revisao);

-- ============================================================
-- REDACOES
-- ============================================================
CREATE TABLE IF NOT EXISTS redacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tema text NOT NULL,
  texto text NOT NULL DEFAULT '',
  nota numeric CHECK (nota IS NULL OR (nota >= 0 AND nota <= 10)),
  feedback_json jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_redacoes_criado ON redacoes(criado_em);

-- ============================================================
-- SKIP_COUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS skip_counts (
  disciplina_id text PRIMARY KEY REFERENCES disciplines(id) ON DELETE CASCADE,
  vezes_pulada int NOT NULL DEFAULT 0,
  multiplicador_urgencia numeric NOT NULL DEFAULT 1.0
);

-- ============================================================
-- USER_PREFS (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_prefs (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nome text NOT NULL DEFAULT 'Estudante',
  sidebar_expandida boolean NOT NULL DEFAULT true,
  horas_estudo_dia int NOT NULL DEFAULT 4
);

-- ============================================================
-- RLS — single-tenant, anon + authenticated full CRUD
-- ============================================================
ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE skip_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prefs ENABLE ROW LEVEL SECURITY;

-- Helper: apply 4 CRUD policies to a table for anon+authenticated
-- We write them out explicitly for each table.

-- disciplines
DROP POLICY IF EXISTS "anon_select_disciplines" ON disciplines;
CREATE POLICY "anon_select_disciplines" ON disciplines FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_disciplines" ON disciplines;
CREATE POLICY "anon_insert_disciplines" ON disciplines FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_disciplines" ON disciplines;
CREATE POLICY "anon_update_disciplines" ON disciplines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_disciplines" ON disciplines;
CREATE POLICY "anon_delete_disciplines" ON disciplines FOR DELETE TO anon, authenticated USING (true);

-- topics
DROP POLICY IF EXISTS "anon_select_topics" ON topics;
CREATE POLICY "anon_select_topics" ON topics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_topics" ON topics;
CREATE POLICY "anon_insert_topics" ON topics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_topics" ON topics;
CREATE POLICY "anon_update_topics" ON topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_topics" ON topics;
CREATE POLICY "anon_delete_topics" ON topics FOR DELETE TO anon, authenticated USING (true);

-- lancamentos
DROP POLICY IF EXISTS "anon_select_lancamentos" ON lancamentos;
CREATE POLICY "anon_select_lancamentos" ON lancamentos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_lancamentos" ON lancamentos;
CREATE POLICY "anon_insert_lancamentos" ON lancamentos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_lancamentos" ON lancamentos;
CREATE POLICY "anon_update_lancamentos" ON lancamentos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_lancamentos" ON lancamentos;
CREATE POLICY "anon_delete_lancamentos" ON lancamentos FOR DELETE TO anon, authenticated USING (true);

-- ai_material
DROP POLICY IF EXISTS "anon_select_ai_material" ON ai_material;
CREATE POLICY "anon_select_ai_material" ON ai_material FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ai_material" ON ai_material;
CREATE POLICY "anon_insert_ai_material" ON ai_material FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ai_material" ON ai_material;
CREATE POLICY "anon_update_ai_material" ON ai_material FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ai_material" ON ai_material;
CREATE POLICY "anon_delete_ai_material" ON ai_material FOR DELETE TO anon, authenticated USING (true);

-- flashcards
DROP POLICY IF EXISTS "anon_select_flashcards" ON flashcards;
CREATE POLICY "anon_select_flashcards" ON flashcards FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_flashcards" ON flashcards;
CREATE POLICY "anon_insert_flashcards" ON flashcards FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_flashcards" ON flashcards;
CREATE POLICY "anon_update_flashcards" ON flashcards FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_flashcards" ON flashcards;
CREATE POLICY "anon_delete_flashcards" ON flashcards FOR DELETE TO anon, authenticated USING (true);

-- redacoes
DROP POLICY IF EXISTS "anon_select_redacoes" ON redacoes;
CREATE POLICY "anon_select_redacoes" ON redacoes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_redacoes" ON redacoes;
CREATE POLICY "anon_insert_redacoes" ON redacoes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_redacoes" ON redacoes;
CREATE POLICY "anon_update_redacoes" ON redacoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_redacoes" ON redacoes;
CREATE POLICY "anon_delete_redacoes" ON redacoes FOR DELETE TO anon, authenticated USING (true);

-- skip_counts
DROP POLICY IF EXISTS "anon_select_skip_counts" ON skip_counts;
CREATE POLICY "anon_select_skip_counts" ON skip_counts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_skip_counts" ON skip_counts;
CREATE POLICY "anon_insert_skip_counts" ON skip_counts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_skip_counts" ON skip_counts;
CREATE POLICY "anon_update_skip_counts" ON skip_counts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_skip_counts" ON skip_counts;
CREATE POLICY "anon_delete_skip_counts" ON skip_counts FOR DELETE TO anon, authenticated USING (true);

-- user_prefs
DROP POLICY IF EXISTS "anon_select_user_prefs" ON user_prefs;
CREATE POLICY "anon_select_user_prefs" ON user_prefs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_user_prefs" ON user_prefs;
CREATE POLICY "anon_insert_user_prefs" ON user_prefs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_user_prefs" ON user_prefs;
CREATE POLICY "anon_update_user_prefs" ON user_prefs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_user_prefs" ON user_prefs;
CREATE POLICY "anon_delete_user_prefs" ON user_prefs FOR DELETE TO anon, authenticated USING (true);
