CREATE TABLE public.simulados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'em_andamento',
  questoes jsonb NOT NULL DEFAULT '[]'::jsonb,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  redacao_tema text,
  redacao_texto text,
  redacao_nota numeric,
  redacao_feedback jsonb,
  nota_objetiva numeric,
  nota_final numeric,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  finalizado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulados TO authenticated;
GRANT ALL ON public.simulados TO service_role;

ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulados select own" ON public.simulados FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "simulados insert own" ON public.simulados FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "simulados update own" ON public.simulados FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "simulados delete own" ON public.simulados FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_simulados_updated_at BEFORE UPDATE ON public.simulados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_simulados_user_status ON public.simulados (user_id, status);