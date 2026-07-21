/*
# Create profiles table for user authentication

## Visão Geral
Tabela para armazenar dados adicionais dos usuários autenticados via Supabase Auth.
A senha NÃO é armazenada aqui — ela fica apenas no auth.users do Supabase.

## Nova Tabela: profiles
- id (uuid, PK) — mesma chave que auth.users.id (FK)
- nome (text, not null) — nome completo do usuário
- email (text, not null) — e-mail do usuário
- telefone (text, nullable) — telefone com máscara
- data_nascimento (date, nullable) — data de nascimento
- cpf (text, nullable) — CPF com máscara
- criado_em (timestamptz) — timestamp de criação

## Segurança
- RLS habilitado
- Usuários só podem ler/atualizar seu próprio perfil (auth.uid() = id)
- INSERT: apenas o próprio usuário pode inserir seu perfil
- DELETE: apenas o próprio usuário pode deletar seu perfil
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  data_nascimento date,
  cpf text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
