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

CREATE POLICY "discipline_skips all own"
ON public.discipline_skips
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_discipline_skips_updated_at
BEFORE UPDATE ON public.discipline_skips
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();