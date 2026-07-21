/*
# Study timer persistence + theme preference

1. New Tables
- `study_sessions` — individual study sessions (start, end, duration)
  - `id` (uuid, PK)
  - `user_id` (uuid, owner, FK auth.users)
  - `inicio` (timestamptz)
  - `fim` (timestamptz, nullable — null while running)
  - `duracao_segundos` (integer, nullable — set on end)
  - `criado_em` (timestamptz)

- `study_time_daily` — aggregated daily study time (one row per user per day)
  - `id` (uuid, PK)
  - `user_id` (uuid, owner, FK auth.users)
  - `data` (date)
  - `tempo_segundos` (integer, default 0)
  - `criado_em` (timestamptz)
  - UNIQUE (user_id, data)

2. Alter
- `profiles` — add `tema` column (text, default 'light')

3. Security
- RLS enabled on both new tables, owner-scoped CRUD
*/

-- Study sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  inicio timestamptz NOT NULL DEFAULT now(),
  fim timestamptz,
  duracao_segundos integer,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON study_sessions;
CREATE POLICY "select_own_sessions" ON study_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON study_sessions;
CREATE POLICY "insert_own_sessions" ON study_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON study_sessions;
CREATE POLICY "update_own_sessions" ON study_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON study_sessions;
CREATE POLICY "delete_own_sessions" ON study_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Daily study time aggregation
CREATE TABLE IF NOT EXISTS study_time_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT CURRENT_DATE,
  tempo_segundos integer NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  UNIQUE (user_id, data)
);

ALTER TABLE study_time_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily" ON study_time_daily;
CREATE POLICY "select_own_daily" ON study_time_daily FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily" ON study_time_daily;
CREATE POLICY "insert_own_daily" ON study_time_daily FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily" ON study_time_daily;
CREATE POLICY "update_own_daily" ON study_time_daily FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_daily" ON study_time_daily;
CREATE POLICY "delete_own_daily" ON study_time_daily FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add theme column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tema text DEFAULT 'light';
