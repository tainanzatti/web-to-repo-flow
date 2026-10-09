CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, COALESCE(u.email,''), COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email,''),'@',1))
FROM auth.users u ON CONFLICT (id) DO NOTHING;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_ranking_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ranking_stats() TO authenticated;