-- 1) Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2) Public ranking stats: aggregated per user, safe columns only
CREATE OR REPLACE VIEW public.ranking_stats
WITH (security_invoker = true)
AS
SELECT
  p.id AS user_id,
  p.full_name,
  COALESCE(SUM(l.quantidade), 0)::int AS total_questoes,
  COALESCE(SUM(l.acertos), 0)::int    AS total_acertos,
  COALESCE(SUM(l.minutos), 0)::int    AS total_minutos,
  COUNT(DISTINCT l.data)::int         AS dias_ativos,
  CASE
    WHEN COALESCE(SUM(l.quantidade), 0) > 0
    THEN ROUND((SUM(l.acertos)::numeric / SUM(l.quantidade)::numeric) * 100, 2)
    ELSE 0
  END AS pct_acertos
FROM public.profiles p
LEFT JOIN public.lancamentos l ON l.user_id = p.id
GROUP BY p.id, p.full_name;

-- 3) Allow authenticated users to read the aggregated ranking view
--    (RLS on underlying tables still applies via security_invoker; we add
--     a permissive SELECT policy on lancamentos limited to aggregate columns
--     is not possible — instead we expose a SECURITY DEFINER function.)
DROP VIEW IF EXISTS public.ranking_stats;

CREATE OR REPLACE FUNCTION public.get_ranking_stats()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  total_questoes int,
  total_acertos int,
  total_minutos int,
  dias_ativos int,
  pct_acertos numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    COALESCE(SUM(l.quantidade), 0)::int,
    COALESCE(SUM(l.acertos), 0)::int,
    COALESCE(SUM(l.minutos), 0)::int,
    COUNT(DISTINCT l.data)::int,
    CASE
      WHEN COALESCE(SUM(l.quantidade), 0) > 0
      THEN ROUND((SUM(l.acertos)::numeric / SUM(l.quantidade)::numeric) * 100, 2)
      ELSE 0
    END
  FROM public.profiles p
  LEFT JOIN public.lancamentos l ON l.user_id = p.id
  WHERE auth.uid() IS NOT NULL
  GROUP BY p.id, p.full_name;
$$;

REVOKE ALL ON FUNCTION public.get_ranking_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ranking_stats() TO authenticated;
