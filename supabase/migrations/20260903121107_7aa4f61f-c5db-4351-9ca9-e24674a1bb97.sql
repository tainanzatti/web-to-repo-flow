GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_links TO authenticated;
GRANT ALL ON public.material_links TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_materials TO authenticated;
GRANT ALL ON public.ai_materials TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_briefings TO authenticated;
GRANT ALL ON public.daily_briefings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discipline_skips TO authenticated;
GRANT ALL ON public.discipline_skips TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes TO authenticated;
GRANT ALL ON public.redacoes TO service_role;