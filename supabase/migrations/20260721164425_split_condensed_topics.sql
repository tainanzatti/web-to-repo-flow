/*
# Split condensed topics into separate article-range topics

This migration splits topics that had multiple article ranges condensed into a single row
into separate rows, one per range/title, for better granularity in study tracking.

Strategy:
1. Delete old condensed topic rows (and cascade-dependent data via FK)
2. Insert new granular topic rows with proper ordem
*/

-- ============================================
-- 1. Legislação de Trânsito (CTB)
-- ============================================
DELETE FROM topics WHERE id = 'lt-ctb';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('lt-ctb-1', 'legislacao-transito', 'CTB - Arts. 1º a 4º (Disposições Preliminares)', 1),
  ('lt-ctb-26', 'legislacao-transito', 'CTB - Arts. 26 a 67 (Sinalização e Normas Gerais de Circulação)', 2),
  ('lt-ctb-80', 'legislacao-transito', 'CTB - Arts. 80 a 90 (Condutores de Veículos)', 3),
  ('lt-ctb-96', 'legislacao-transito', 'CTB - Arts. 96 a 102 (Registro e Licenciamento)', 4),
  ('lt-ctb-114', 'legislacao-transito', 'CTB - Arts. 114 a 160 (Infrações e Penalidades)', 5),
  ('lt-ctb-256', 'legislacao-transito', 'CTB - Arts. 256 a 279-A (Crimes de Trânsito)', 6),
  ('lt-ctb-291', 'legislacao-transito', 'CTB - Arts. 291 a 312-B (Disposições Finais e Transitórias)', 7);

-- ============================================
-- 2. Direito Constitucional - CF
-- ============================================
DELETE FROM topics WHERE id = 'dc-cf';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dc-cf-1', 'direito-constitucional', 'CF - Arts. 1º a 6º (Fundamentos e Princípios)', 1),
  ('dc-cf-14', 'direito-constitucional', 'CF - Arts. 14 e 15 (Direitos Políticos)', 2),
  ('dc-cf-18', 'direito-constitucional', 'CF - Arts. 18 a 28 (Organização do Estado)', 3),
  ('dc-cf-37', 'direito-constitucional', 'CF - Arts. 37 a 42 (Administração Pública)', 4),
  ('dc-cf-70', 'direito-constitucional', 'CF - Arts. 70 a 75 (Fiscalização e Controle)', 5),
  ('dc-cf-106', 'direito-constitucional', 'CF - Arts. 106 a 110 (Tribunais e Juízes)', 6),
  ('dc-cf-122', 'direito-constitucional', 'CF - Arts. 122 a 144 (Defesa do Estado e Segurança)', 7);

-- ============================================
-- 3. Direito Constitucional - CE/SC
-- ============================================
DELETE FROM topics WHERE id = 'dc-cesc';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dc-cesc-1', 'direito-constitucional', 'CE/SC - Arts. 1º a 40º (Organização do Estado)', 8),
  ('dc-cesc-90', 'direito-constitucional', 'CE/SC - Art. 90 (Poder Executivo)', 9),
  ('dc-cesc-105', 'direito-constitucional', 'CE/SC - Arts. 105 a 109-c (Poder Legislativo e Judiciário)', 10);

-- ============================================
-- 4. Direito Penal - Parte Geral (Títulos I ao VIII)
-- ============================================
DELETE FROM topics WHERE id = 'dp-pg';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dp-pg-t1', 'direito-penal', 'CP - Parte Geral: Título I (Da Aplicação da Lei Penal)', 1),
  ('dp-pg-t2', 'direito-penal', 'CP - Parte Geral: Título II (Do Crime)', 2),
  ('dp-pg-t3', 'direito-penal', 'CP - Parte Geral: Título III (Da Imputabilidade Penal)', 3),
  ('dp-pg-t4', 'direito-penal', 'CP - Parte Geral: Título IV (Do Concurso de Pessoas)', 4),
  ('dp-pg-t5', 'direito-penal', 'CP - Parte Geral: Título V (Das Penas)', 5),
  ('dp-pg-t6', 'direito-penal', 'CP - Parte Geral: Título VI (Dos Efeitos da Condenção)', 6),
  ('dp-pg-t7', 'direito-penal', 'CP - Parte Geral: Título VII (Da Ação Penal)', 7),
  ('dp-pg-t8', 'direito-penal', 'CP - Parte Geral: Título VIII (Da Extinção da Punibilidade)', 8);

-- ============================================
-- 5. Direito Penal - Parte Especial (Títulos I ao XI)
-- ============================================
DELETE FROM topics WHERE id = 'dp-pe';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dp-pe-t1', 'direito-penal', 'CP - Parte Especial: Título I (Crimes contra a Pessoa)', 9),
  ('dp-pe-t2', 'direito-penal', 'CP - Parte Especial: Título II (Crimes contra o Patrimônio)', 10),
  ('dp-pe-t3', 'direito-penal', 'CP - Parte Especial: Título III (Crimes contra a Propriedade Imaterial)', 11),
  ('dp-pe-t4', 'direito-penal', 'CP - Parte Especial: Título IV (Crimes contra a Organização do Trabalho)', 12),
  ('dp-pe-t5', 'direito-penal', 'CP - Parte Especial: Título V (Crimes contra o Sentimento Religioso)', 13),
  ('dp-pe-t6', 'direito-penal', 'CP - Parte Especial: Título VI (Crimes contra os Costumes)', 14),
  ('dp-pe-t7', 'direito-penal', 'CP - Parte Especial: Título VII (Crimes contra a Família)', 15),
  ('dp-pe-t8', 'direito-penal', 'CP - Parte Especial: Título VIII (Crimes contra a Incolumidade Pública)', 16),
  ('dp-pe-t9', 'direito-penal', 'CP - Parte Especial: Título IX (Crimes contra a Paz Pública)', 17),
  ('dp-pe-t10', 'direito-penal', 'CP - Parte Especial: Título X (Crimes contra a Fé Pública)', 18),
  ('dp-pe-t11', 'direito-penal', 'CP - Parte Especial: Título XI (Crimes contra a Administração Pública)', 19);

-- ============================================
-- 6. Direito Penal Militar - Parte Geral (Títulos I ao VIII)
-- ============================================
DELETE FROM topics WHERE id = 'dpm-pg';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dpm-pg-t1', 'direito-penal-militar', 'DPM - Parte Geral: Título I (Da Aplicação da Lei Penal Militar)', 1),
  ('dpm-pg-t2', 'direito-penal-militar', 'DPM - Parte Geral: Título II (Do Crime Militar)', 2),
  ('dpm-pg-t3', 'direito-penal-militar', 'DPM - Parte Geral: Título III (Da Imputabilidade Penal)', 3),
  ('dpm-pg-t4', 'direito-penal-militar', 'DPM - Parte Geral: Título IV (Do Concurso de Pessoas)', 4),
  ('dpm-pg-t5', 'direito-penal-militar', 'DPM - Parte Geral: Título V (Das Penas)', 5),
  ('dpm-pg-t6', 'direito-penal-militar', 'DPM - Parte Geral: Título VI (Dos Efeitos da Condenção)', 6),
  ('dpm-pg-t7', 'direito-penal-militar', 'DPM - Parte Geral: Título VII (Da Ação Penal)', 7),
  ('dpm-pg-t8', 'direito-penal-militar', 'DPM - Parte Geral: Título VIII (Da Extinção da Punibilidade)', 8);

-- ============================================
-- 7. Direito Penal Militar - Parte Especial (Títulos I ao VIII)
-- ============================================
DELETE FROM topics WHERE id = 'dpm-pe';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dpm-pe-t1', 'direito-penal-militar', 'DPM - Parte Especial: Título I (Crimes contra a Segurança Externa do País)', 9),
  ('dpm-pe-t2', 'direito-penal-militar', 'DPM - Parte Especial: Título II (Crimes contra a Segurança Interna do País)', 10),
  ('dpm-pe-t3', 'direito-penal-militar', 'DPM - Parte Especial: Título III (Crimes contra a Segurança das Instituições Militares)', 11),
  ('dpm-pe-t4', 'direito-penal-militar', 'DPM - Parte Especial: Título IV (Crimes contra o Patrimônio sob Administração Militar)', 12),
  ('dpm-pe-t5', 'direito-penal-militar', 'DPM - Parte Especial: Título V (Crimes contra a Incolumidade Pública)', 13),
  ('dpm-pe-t6', 'direito-penal-militar', 'DPM - Parte Especial: Título VI (Crimes contra as Pessoas)', 14),
  ('dpm-pe-t7', 'direito-penal-militar', 'DPM - Parte Especial: Título VII (Crimes contra o Patrimônio)', 15),
  ('dpm-pe-t8', 'direito-penal-militar', 'DPM - Parte Especial: Título VIII (Crimes contra a Administração Militar)', 16);

-- ============================================
-- 8. Direito Processual Penal (Títulos I-III, VII-IX e Livro III, Título I)
-- ============================================
DELETE FROM topics WHERE id = 'dpp-cpp';

INSERT INTO topics (id, disciplina_id, nome, ordem) VALUES
  ('dpp-cpp-t1', 'direito-processual-penal', 'CPP - Título I (Disposições Preliminares)', 1),
  ('dpp-cpp-t2', 'direito-processual-penal', 'CPP - Título II (Do Inquérito Policial)', 2),
  ('dpp-cpp-t3', 'direito-processual-penal', 'CPP - Título III (Da Ação Penal)', 3),
  ('dpp-cpp-t7', 'direito-processual-penal', 'CPP - Título VII (Da Prova)', 4),
  ('dpp-cpp-t8', 'direito-processual-penal', 'CPP - Título VIII (Do Juiz, MP e Funcionários)', 5),
  ('dpp-cpp-t9', 'direito-processual-penal', 'CPP - Título IX (Da Prisão e Liberdade Provisória)', 6),
  ('dpp-cpp-l3-t1', 'direito-processual-penal', 'CPP - Livro III, Título I (Processo de Jurisdição)', 7);
