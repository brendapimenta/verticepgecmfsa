
-- 1. Make get_my_instituicao_id() SECURITY DEFINER to bypass RLS on usuarios
CREATE OR REPLACE FUNCTION public.get_my_instituicao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (SELECT instituicao_id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
  END;
$$;

-- 2. Create helper to check perfil without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_perfil()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT perfil::text FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- 3. Fix usuarios policies - drop the recursive one
DROP POLICY IF EXISTS "usuarios_select_admin" ON public.usuarios;
DROP POLICY IF EXISTS "usuarios_select_own" ON public.usuarios;

-- Own record: auth_user_id = auth.uid() (no recursion)
CREATE POLICY "usuarios_select_own"
ON public.usuarios
FOR SELECT
USING (auth_user_id = auth.uid());

-- Admin sees all in same institution using SECURITY DEFINER helpers
CREATE POLICY "usuarios_select_admin"
ON public.usuarios
FOR SELECT
USING (
  instituicao_id = get_my_instituicao_id()
  AND get_my_perfil() = 'administrador'
);

-- 4. Fix log_auditoria policy that also queries usuarios directly
DROP POLICY IF EXISTS "log_select_admin" ON public.log_auditoria;

CREATE POLICY "log_select_admin"
ON public.log_auditoria
FOR SELECT
TO authenticated
USING (get_my_perfil() = 'administrador');
