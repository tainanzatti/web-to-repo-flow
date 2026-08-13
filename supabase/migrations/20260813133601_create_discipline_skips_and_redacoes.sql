-- ============================================================
-- discipline_skips — tracks how many times each discipline was skipped
-- ============================================================
CREATE TABLE public.discipline_skips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplina_id text NOT NULL,
  skip_count integer NOT NULL DEFAULT 0,
  consecutive_skips integer NOT NULL DEFAULT 0,
  last_skipped_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, disciplina_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discipline_skips TO authenticated;
GRANT ALL ON public.discipline_skips TO service_role;

ALTER TABLE public.discipline_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discipline_skips_select_own" ON public.discipline_skips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "discipline_skips_insert_own" ON public.discipline_skips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discipline_skips_update_own" ON public.discipline_skips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discipline_skips_delete_own" ON public.discipline_skips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_discipline_skips_updated_at
  BEFORE UPDATE ON public.discipline_skips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- redacoes — essays with AI correction
-- ============================================================
CREATE TABLE public.redacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tema text NOT NULL,
  texto text NOT NULL,
  nota numeric(4,2),
  feedback_json jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redacoes TO authenticated;
GRANT ALL ON public.redacoes TO service_role;

ALTER TABLE public.redacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "redacoes_select_own" ON public.redacoes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "redacoes_insert_own" ON public.redacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "redacoes_update_own" ON public.redacoes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "redacoes_delete_own" ON public.redacoes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX redacoes_user_created_idx ON public.redacoes (user_id, criado_em DESC);

CREATE TRIGGER update_redacoes_updated_at
  BEFORE UPDATE ON public.redacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();