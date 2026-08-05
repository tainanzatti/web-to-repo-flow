-- Trigger-only functions: should never be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Ranking stats: signed-in users only
REVOKE ALL ON FUNCTION public.get_ranking_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ranking_stats() TO authenticated;