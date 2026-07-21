/*
# Tabela de Lançamento de Questões

## Visão Geral
Permite que o candidato registre questões respondidas (de simulados, provas anteriores,
cadernos de exercícios) por disciplina e tópico, acompanhando acertos/erros e alimentando
o cálculo de mastery e aproveitamento.

## Nova Tabela: questoes
- id (uuid, PK)
- disciplina_id (text, FK → disciplines) — disciplina da questão
- topico_id (text, FK → topics, nullable) — tópico relacionado, se aplicável
- acertou (bool, not null) — true = acertou, false = errou
- fonte (text, nullable) — origem da questão (ex: "Simulado AOCP", "Prova 2023")
- criado_em (timestamptz)

## Segurança
RLS habilitado. CRUD completo para anon + authenticated (single-tenant).
*/

CREATE TABLE IF NOT EXISTS questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id text NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
  topico_id text REFERENCES topics(id) ON DELETE SET NULL,
  acertou boolean NOT NULL,
  fonte text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_questoes_disciplina ON questoes(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_questoes_topico ON questoes(topico_id);
CREATE INDEX IF NOT EXISTS idx_questoes_criado ON questoes(criado_em);

ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_questoes" ON questoes;
CREATE POLICY "anon_select_questoes" ON questoes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_questoes" ON questoes;
CREATE POLICY "anon_insert_questoes" ON questoes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_questoes" ON questoes;
CREATE POLICY "anon_update_questoes" ON questoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_questoes" ON questoes;
CREATE POLICY "anon_delete_questoes" ON questoes FOR DELETE TO anon, authenticated USING (true);
