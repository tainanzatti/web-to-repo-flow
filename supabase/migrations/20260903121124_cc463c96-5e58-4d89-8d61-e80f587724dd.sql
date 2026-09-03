REVOKE EXECUTE ON FUNCTION public.get_ranking_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_ranking_stats() TO service_role;