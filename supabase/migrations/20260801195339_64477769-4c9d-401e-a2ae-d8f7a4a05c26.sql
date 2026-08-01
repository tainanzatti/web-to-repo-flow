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

CREATE POLICY "redacoes all own" ON public.redacoes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX redacoes_user_created_idx ON public.redacoes (user_id, criado_em DESC);

CREATE TRIGGER update_redacoes_updated_at
  BEFORE UPDATE ON public.redacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();