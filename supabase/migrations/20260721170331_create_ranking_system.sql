/*
# Create Ranking System with XP and User Stats

1. Schema Changes
- Add `user_id uuid DEFAULT auth.uid()` to `lancamentos`, `questoes`, `flashcards`, `redacoes` so per-user stats can be computed.
- Create `user_stats` table storing aggregated XP, streak, and patente per user.

2. New Tables
- `user_stats`: user_id (PK), xp_total, dias_consecutivos, ultima_atividade, meta_diaria_data, meta_diaria_concluida

3. Functions
- `get_ranking(period text)`: Returns all users with computed stats. Period: 'all', 'week', 'month', 'year'.
- `get_user_stats_detail(uid uuid)`: Returns single user stats for profile modal.
- `get_user_evolution(uid uuid, days int)`: Returns daily XP evolution for chart.
- `get_user_disciplinas_performance(uid uuid)`: Returns strongest/weakest disciplines.

4. Security
- `user_stats`: SELECT open to all authenticated (public leaderboard). INSERT/UPDATE/DELETE owner-only.
- Functions run as SECURITY DEFINER to aggregate across all users.

5. XP System
- Questao correta: +10 XP, errada: +2 XP, topico concluido: +50 XP, meta diaria: +30 XP, streak bonus: streak*5, simulado: +100 XP

6. Patente System (12 levels based on XP)
*/

ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE questoes ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE redacoes ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_total integer NOT NULL DEFAULT 0,
  dias_consecutivos integer NOT NULL DEFAULT 0,
  ultima_atividade timestamptz,
  meta_diaria_data date,
  meta_diaria_concluida boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_user_stats" ON user_stats;
CREATE POLICY "select_all_user_stats" ON user_stats FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_user_stats" ON user_stats;
CREATE POLICY "insert_own_user_stats" ON user_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_stats" ON user_stats;
CREATE POLICY "update_own_user_stats" ON user_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_stats" ON user_stats;
CREATE POLICY "delete_own_user_stats" ON user_stats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_patente(xp integer)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN xp >= 10000 THEN 'Capitão'
    WHEN xp >= 8000 THEN '1º Tenente'
    WHEN xp >= 6000 THEN '2º Tenente'
    WHEN xp >= 4500 THEN 'Aspirante'
    WHEN xp >= 3300 THEN 'Subtenente'
    WHEN xp >= 2300 THEN '1º Sargento'
    WHEN xp >= 1500 THEN '2º Sargento'
    WHEN xp >= 1000 THEN '3º Sargento'
    WHEN xp >= 600 THEN 'Cabo'
    WHEN xp >= 300 THEN 'Soldado 1ª Classe'
    WHEN xp >= 100 THEN 'Soldado 2ª Classe'
    ELSE 'Recruta'
  END;
$$;

CREATE OR REPLACE FUNCTION get_patente_level(xp integer)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN xp >= 10000 THEN 12
    WHEN xp >= 8000 THEN 11
    WHEN xp >= 6000 THEN 10
    WHEN xp >= 4500 THEN 9
    WHEN xp >= 3300 THEN 8
    WHEN xp >= 2300 THEN 7
    WHEN xp >= 1500 THEN 6
    WHEN xp >= 1000 THEN 5
    WHEN xp >= 600 THEN 4
    WHEN xp >= 300 THEN 3
    WHEN xp >= 100 THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION get_ranking(period text DEFAULT 'all')
RETURNS TABLE (
  user_id uuid,
  nome text,
  email text,
  xp_total bigint,
  patente text,
  patente_level int,
  questoes_respondidas bigint,
  questoes_corretas bigint,
  taxa_acertos numeric,
  topicos_estudados bigint,
  horas_estudadas numeric,
  dias_consecutivos int,
  percentual_edital numeric,
  ultima_atividade timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_filter timestamptz;
BEGIN
  date_filter := CASE period
    WHEN 'week' THEN now() - interval '7 days'
    WHEN 'month' THEN now() - interval '30 days'
    WHEN 'year' THEN now() - interval '365 days'
    ELSE '1970-01-01'::timestamptz
  END;

  RETURN QUERY
  WITH
  q_stats AS (
    SELECT q.user_id,
      COUNT(*) AS q_total,
      COUNT(*) FILTER (WHERE q.acertou) AS q_correct
    FROM questoes q
    WHERE q.criado_em >= date_filter AND q.user_id IS NOT NULL
    GROUP BY q.user_id
  ),
  ql_stats AS (
    SELECT ql.user_id,
      COALESCE(SUM(ql.quantidade), 0) AS ql_total,
      COALESCE(SUM(ql.acertos), 0) AS ql_correct,
      COALESCE(SUM(ql.erros), 0) AS ql_errors,
      COUNT(*) FILTER (WHERE ql.fonte ILIKE '%simulado%') AS simulados
    FROM questao_lancamentos ql
    WHERE ql.criado_em >= date_filter AND ql.user_id IS NOT NULL
    GROUP BY ql.user_id
  ),
  l_stats AS (
    SELECT l.user_id,
      COUNT(DISTINCT l.topico_id) FILTER (WHERE l.mastery >= 60) AS topics_mastered,
      COUNT(DISTINCT l.topico_id) AS topics_studied
    FROM lancamentos l
    WHERE l.criado_em >= date_filter AND l.user_id IS NOT NULL
    GROUP BY l.user_id
  ),
  st_stats AS (
    SELECT std.user_id,
      COALESCE(SUM(std.tempo_segundos), 0) AS total_seconds
    FROM study_time_daily std
    WHERE std.data >= date_filter::date AND std.user_id IS NOT NULL
    GROUP BY std.user_id
  ),
  streak_calc AS (
    SELECT su.user_id,
      COALESCE((
        SELECT COUNT(*) FROM generate_series(
          (CURRENT_DATE - 365)::date, CURRENT_DATE, interval '1 day'
        ) AS d(d)
        WHERE d.d <= CURRENT_DATE
        AND EXISTS (
          SELECT 1 FROM study_time_daily st
          WHERE st.user_id = su.user_id AND st.data = d.d AND st.tempo_segundos > 0
        )
        AND NOT EXISTS (
          SELECT 1 FROM generate_series(
            (d.d + 1)::date, CURRENT_DATE, interval '1 day'
          ) AS gap(g)
          WHERE gap.g > d.d AND gap.g < CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM study_time_daily st2
            WHERE st2.user_id = su.user_id AND st2.data = gap.g AND st2.tempo_segundos > 0
          )
        )
        AND d.d >= COALESCE((
          SELECT MAX(miss.d) FROM (
            SELECT g.d FROM generate_series(
              (CURRENT_DATE - 365)::date, CURRENT_DATE, interval '1 day'
            ) AS g(d)
            WHERE g.d < CURRENT_DATE
            AND NOT EXISTS (
              SELECT 1 FROM study_time_daily st3
              WHERE st3.user_id = su.user_id AND st3.data = g.d AND st3.tempo_segundos > 0
            )
          ) AS miss(d)
        ), (CURRENT_DATE - 365)::date)
      ), 0) AS streak
    FROM (SELECT DISTINCT user_id FROM study_time_daily WHERE user_id IS NOT NULL) su
  ),
  xp_calc AS (
    SELECT p.id AS uid,
      COALESCE(qs.q_correct, 0) * 10 +
      COALESCE(qs.q_total - qs.q_correct, 0) * 2 +
      COALESCE(qls.ql_correct, 0) * 10 +
      COALESCE(qls.ql_errors, 0) * 2 +
      COALESCE(qls.simulados, 0) * 100 +
      COALESCE(ls.topics_mastered, 0) * 50 +
      COALESCE(sc.streak, 0) * 5 AS xp
    FROM profiles p
    LEFT JOIN q_stats qs ON qs.user_id = p.id
    LEFT JOIN ql_stats qls ON qls.user_id = p.id
    LEFT JOIN l_stats ls ON ls.user_id = p.id
    LEFT JOIN streak_calc sc ON sc.user_id = p.id
  )
  SELECT
    p.id AS user_id,
    p.nome,
    p.email,
    COALESCE(xc.xp, 0)::bigint AS xp_total,
    get_patente(COALESCE(xc.xp, 0)::int) AS patente,
    get_patente_level(COALESCE(xc.xp, 0)::int) AS patente_level,
    (COALESCE(qs.q_total, 0) + COALESCE(qls.ql_total, 0))::bigint AS questoes_respondidas,
    (COALESCE(qs.q_correct, 0) + COALESCE(qls.ql_correct, 0))::bigint AS questoes_corretas,
    CASE
      WHEN (COALESCE(qs.q_total, 0) + COALESCE(qls.ql_total, 0)) > 0
      THEN ROUND((COALESCE(qs.q_correct, 0) + COALESCE(qls.ql_correct, 0))::numeric /
        (COALESCE(qs.q_total, 0) + COALESCE(qls.ql_total, 0)) * 100, 1)
      ELSE 0
    END AS taxa_acertos,
    COALESCE(ls.topics_studied, 0)::bigint AS topicos_estudados,
    ROUND(COALESCE(sts.total_seconds, 0)::numeric / 3600, 1) AS horas_estudadas,
    COALESCE(sc.streak, 0) AS dias_consecutivos,
    CASE
      WHEN (SELECT COUNT(*) FROM topics) > 0
      THEN ROUND(COALESCE(ls.topics_mastered, 0)::numeric / (SELECT COUNT(*) FROM topics) * 100, 1)
      ELSE 0
    END AS percentual_edital,
    (
      SELECT MAX(activity_date) FROM (
        SELECT MAX(criado_em) FROM questoes WHERE user_id = p.id
        UNION ALL SELECT MAX(criado_em) FROM questao_lancamentos WHERE user_id = p.id
        UNION ALL SELECT MAX(criado_em) FROM lancamentos WHERE user_id = p.id
        UNION ALL SELECT MAX(criado_em) FROM redacoes WHERE user_id = p.id
      ) AS acts(activity_date)
    ) AS ultima_atividade
  FROM profiles p
  LEFT JOIN q_stats qs ON qs.user_id = p.id
  LEFT JOIN ql_stats qls ON qls.user_id = p.id
  LEFT JOIN l_stats ls ON ls.user_id = p.id
  LEFT JOIN st_stats sts ON sts.user_id = p.id
  LEFT JOIN streak_calc sc ON sc.user_id = p.id
  LEFT JOIN xp_calc xc ON xc.uid = p.id
  ORDER BY xp_total DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_stats_detail(uid uuid)
RETURNS TABLE (
  user_id uuid, nome text, email text, xp_total bigint,
  patente text, patente_level int,
  questoes_respondidas bigint, questoes_corretas bigint,
  taxa_acertos numeric, topicos_estudados bigint,
  horas_estudadas numeric, dias_consecutivos int,
  percentual_edital numeric, ultima_atividade timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_ranking('all') WHERE user_id = uid;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_evolution(uid uuid, days_count int DEFAULT 30)
RETURNS TABLE (data date, xp_gained int)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE start_date date;
BEGIN
  start_date := CURRENT_DATE - days_count;
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(start_date, CURRENT_DATE, interval '1 day')::date AS d
  ),
  daily_xp AS (
    SELECT dr.d AS data,
      COALESCE(
        (SELECT COUNT(*) * 10 FROM questoes WHERE user_id = uid AND acertou AND criado_em::date = dr.d) +
        (SELECT COUNT(*) * 2 FROM questoes WHERE user_id = uid AND NOT acertou AND criado_em::date = dr.d) +
        (SELECT COALESCE(SUM(acertos * 10), 0) FROM questao_lancamentos WHERE user_id = uid AND criado_em::date = dr.d) +
        (SELECT COALESCE(SUM(erros * 2), 0) FROM questao_lancamentos WHERE user_id = uid AND criado_em::date = dr.d) +
        (SELECT COUNT(*) * 50 FROM lancamentos WHERE user_id = uid AND mastery >= 60 AND criado_em::date = dr.d),
        0
      ) AS xp_gained
    FROM date_range dr
  )
  SELECT * FROM daily_xp ORDER BY data;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_disciplinas_performance(uid uuid)
RETURNS TABLE (
  disciplina_id text, disciplina_nome text,
  dominio numeric, questoes bigint, acertos bigint, taxa_acertos numeric
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.nome,
    CASE WHEN COUNT(l.id) > 0 THEN ROUND(AVG(l.mastery)::numeric, 1) ELSE 0 END AS dominio,
    COUNT(q.id)::bigint AS questoes,
    COUNT(q.id) FILTER (WHERE q.acertou)::bigint AS acertos,
    CASE WHEN COUNT(q.id) > 0
      THEN ROUND(COUNT(q.id) FILTER (WHERE q.acertou)::numeric / COUNT(q.id) * 100, 1)
      ELSE 0
    END AS taxa_acertos
  FROM disciplines d
  LEFT JOIN lancamentos l ON l.disciplina_id = d.id AND l.user_id = uid
  LEFT JOIN questoes q ON q.disciplina_id = d.id AND q.user_id = uid
  GROUP BY d.id, d.nome
  ORDER BY dominio DESC;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON lancamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_questoes_user_id ON questoes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_redacoes_user_id ON redacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_criado_em ON lancamentos(criado_em);
CREATE INDEX IF NOT EXISTS idx_questoes_criado_em ON questoes(criado_em);
CREATE INDEX IF NOT EXISTS idx_study_time_daily_user_data ON study_time_daily(user_id, data);
