CREATE TABLE public.caderno_erros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  origem text NOT NULL,
  disciplina_id text NOT NULL,
  topico_id text NOT NULL,
  questao jsonb NOT NULL,
  resposta text,
  resolvida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.caderno_erros TO authenticated;
GRANT ALL ON public.caderno_erros TO service_role;
ALTER TABLE public.caderno_erros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erros select own" ON public.caderno_erros FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "erros insert own" ON public.caderno_erros FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "erros update own" ON public.caderno_erros FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "erros delete own" ON public.caderno_erros FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_caderno_erros_user ON public.caderno_erros (user_id, resolvida);