/*
# Questão Lançamentos — batch question entries with filters, stats, and owner-scoped RLS

1. New Table
- `questao_lancamentos` — batch question entries (one row = one study session with N questions)
  - `id` (uuid, PK)
  - `user_id` (uuid, owner, FK auth.users)
  - `disciplina_id` (text, FK disciplines)
  - `topico_id` (text, nullable, FK topics)
  - `quantidade` (integer, total questions in this batch)
  - `acertos` (integer, correct answers)
  - `erros` (integer, wrong answers — computed as quantidade - acertos)
  - `fonte` (text, nullable — banca/exam source)
  - `criado_em` (timestamptz, default now())

2. Security
- RLS enabled, owner-scoped CRUD via auth.uid()
*/

-- Questão lançamentos (batch entries)
CREATE TABLE IF NOT EXISTS questao_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topico_id text REFERENCES topics(id) ON DELETE SET NULL,
  quantidade integer NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  acertos integer NOT NULL DEFAULT 0 CHECK (acertos >= 0),
  erros integer NOT NULL DEFAULT 0 CHECK (erros >= 0),
  fonte text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE questao_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lancamentos_q" ON questao_lancamentos;
CREATE POLICY "select_own_lancamentos_q" ON questao_lancamentos FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lancamentos_q" ON questao_lancamentos;
CREATE POLICY "insert_own_lancamentos_q" ON questao_lancamentos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lancamentos_q" ON questao_lancamentos;
CREATE POLICY "update_own_lancamentos_q" ON questao_lancamentos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lancamentos_q" ON questao_lancamentos;
CREATE POLICY "delete_own_lancamentos_q" ON questao_lancamentos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_questao_lancamentos_user_data ON questao_lancamentos(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_questao_lancamentos_disciplina ON questao_lancamentos(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_questao_lancamentos_topico ON questao_lancamentos(topico_id);
