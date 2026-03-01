
-- 1) LOG_AUDITORIA: Remover INSERT público e restringir a service_role apenas
DROP POLICY IF EXISTS "log_insert" ON public.log_auditoria;

-- INSERT só via service_role (edge functions)
CREATE POLICY "log_insert_service_only"
ON public.log_auditoria
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2) Garantir que o SELECT do log continue restrito a administradores
-- (já existe log_select_admin, apenas confirmando)

-- 3) SECURITY DEFINER: Restringir get_my_instituicao_id para retornar NULL se não autenticado
CREATE OR REPLACE FUNCTION public.get_my_instituicao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (SELECT instituicao_id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
  END;
$$;
