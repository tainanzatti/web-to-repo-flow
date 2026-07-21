/*
# Create lei_seca table + storage bucket for file uploads

1. New Tables
- `lei_seca` — stores links and file references per topic
  - `id` (uuid, PK)
  - `topico_id` (text, FK to topics.id, ON DELETE CASCADE)
  - `tipo` (text: 'link' | 'arquivo')
  - `titulo` (text, label for the resource)
  - `url` (text, the link URL or storage path)
  - `criado_em` (timestamptz, default now())

2. Storage
- Create public bucket `lei-seca` for user file uploads (PDFs, images, docs)

3. Security
- RLS on `lei_seca`: owner-scoped CRUD (authenticated users manage their own entries)
- Storage policies: authenticated users can upload/read/delete in `lei-seca` bucket
- `ai_material` already exists and will be reused for resumos (kind = 'resumo')
*/

CREATE TABLE IF NOT EXISTS lei_seca (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id text NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'link' CHECK (tipo IN ('link', 'arquivo')),
  titulo text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE lei_seca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lei_seca" ON lei_seca;
CREATE POLICY "select_own_lei_seca" ON lei_seca FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lei_seca" ON lei_seca;
CREATE POLICY "insert_own_lei_seca" ON lei_seca FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lei_seca" ON lei_seca;
CREATE POLICY "update_own_lei_seca" ON lei_seca FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lei_seca" ON lei_seca;
CREATE POLICY "delete_own_lei_seca" ON lei_seca FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('lei-seca', 'lei-seca', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "auth_upload_lei_seca" ON storage.objects;
CREATE POLICY "auth_upload_lei_seca" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'lei-seca');

DROP POLICY IF EXISTS "auth_read_lei_seca" ON storage.objects;
CREATE POLICY "auth_read_lei_seca" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'lei-seca');

DROP POLICY IF EXISTS "auth_delete_lei_seca" ON storage.objects;
CREATE POLICY "auth_delete_lei_seca" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'lei-seca');
