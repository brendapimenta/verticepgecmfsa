
-- Drop the overly permissive same-institution SELECT policy
DROP POLICY IF EXISTS "usuarios_select_same_inst" ON public.usuarios;

-- Add admin-only policy for full institution SELECT
CREATE POLICY "usuarios_select_admin" ON public.usuarios
  FOR SELECT TO authenticated
  USING (
    instituicao_id = public.get_my_instituicao_id()
    AND EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.auth_user_id = auth.uid()
        AND u.perfil = 'administrador'::perfil_usuario
    )
  );

-- Keep existing usuarios_select_own (own record only) for non-admins
-- It already exists: USING (auth_user_id = auth.uid())

-- Fix usuarios_public view: recreate excluding sensitive fields and add RLS
DROP VIEW IF EXISTS public.usuarios_public;

CREATE VIEW public.usuarios_public AS
  SELECT id, nome, username, email, perfil, ativo, instituicao_id, auth_user_id,
         criado_em, atualizado_em, primeiro_login_pendente, ultimo_login_em
  FROM public.usuarios;

-- Enable RLS on the view
ALTER VIEW public.usuarios_public SET (security_invoker = true);
