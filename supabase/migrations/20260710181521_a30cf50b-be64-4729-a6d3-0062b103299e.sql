-- ===== Função utilitária para updated_at =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===== 1) PERFIS =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  date_of_birth date,
  cpf text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cria perfil automaticamente no cadastro (usa metadados do signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, date_of_birth, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'date_of_birth', '')::date,
    NULLIF(NEW.raw_user_meta_data ->> 'cpf', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== 2) LANÇAMENTOS (sessões de estudo / questões respondidas) =====
CREATE TABLE public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  disciplina_id text NOT NULL,
  topico_id text NOT NULL,
  quantidade integer NOT NULL CHECK (quantidade >= 0),
  acertos integer NOT NULL CHECK (acertos >= 0),
  minutos integer NOT NULL DEFAULT 0 CHECK (minutos >= 0),
  data date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lancamentos select own" ON public.lancamentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "lancamentos insert own" ON public.lancamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lancamentos update own" ON public.lancamentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lancamentos delete own" ON public.lancamentos FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX lancamentos_user_id_idx ON public.lancamentos (user_id);
CREATE INDEX lancamentos_user_data_idx ON public.lancamentos (user_id, data);
CREATE INDEX lancamentos_user_topic_idx ON public.lancamentos (user_id, disciplina_id, topico_id);
CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 3) LINKS DE MATERIAL =====
CREATE TABLE public.material_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  disciplina_id text NOT NULL,
  topico_id text NOT NULL,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_links TO authenticated;
GRANT ALL ON public.material_links TO service_role;
ALTER TABLE public.material_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "material_links select own" ON public.material_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "material_links insert own" ON public.material_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "material_links delete own" ON public.material_links FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX material_links_user_topic_idx ON public.material_links (user_id, disciplina_id, topico_id);
CREATE TRIGGER update_material_links_updated_at BEFORE UPDATE ON public.material_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 4) MATERIAIS DE ESTUDO GERADOS POR IA (lei seca, resumos, questões) =====
CREATE TABLE public.ai_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  disciplina_id text NOT NULL,
  topico_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('leiseca', 'resumo', 'questoes')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, disciplina_id, topico_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_materials TO authenticated;
GRANT ALL ON public.ai_materials TO service_role;
ALTER TABLE public.ai_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_materials all own" ON public.ai_materials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_materials_user_topic_idx ON public.ai_materials (user_id, disciplina_id, topico_id);
CREATE TRIGGER update_ai_materials_updated_at BEFORE UPDATE ON public.ai_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 5) BRIEFINGS DIÁRIOS (coach de estudos do dia) =====
CREATE TABLE public.daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  briefing_date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, briefing_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_briefings TO authenticated;
GRANT ALL ON public.daily_briefings TO service_role;
ALTER TABLE public.daily_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_briefings all own" ON public.daily_briefings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX daily_briefings_user_date_idx ON public.daily_briefings (user_id, briefing_date);
CREATE TRIGGER update_daily_briefings_updated_at BEFORE UPDATE ON public.daily_briefings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 6) CONFIGURAÇÕES DO USUÁRIO =====
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings all own" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();