
-- 1. Drop dependent view
DROP VIEW IF EXISTS public.usuarios_public;

-- 2. Add new columns
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS tentativas_login_falhas integer NOT NULL DEFAULT 0;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bloqueado_ate timestamp with time zone;

-- 3. Set default usernames for existing users
UPDATE public.usuarios SET username = LOWER(REPLACE(REPLACE(nome, ' ', '.'), '''', '')) WHERE username IS NULL;

-- 4. Make username NOT NULL and unique
ALTER TABLE public.usuarios ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios (username);

-- 5. Remove google columns
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS google_id;
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS login_google_habilitado;

-- 6. Recreate view
CREATE VIEW public.usuarios_public AS
  SELECT id, nome, email, username, perfil, ativo, auth_user_id, instituicao_id,
         primeiro_login_pendente, ultimo_login_em, criado_em, atualizado_em,
         tentativas_login_falhas, bloqueado_ate
  FROM public.usuarios;
