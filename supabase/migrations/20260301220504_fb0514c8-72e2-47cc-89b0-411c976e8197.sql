
-- Change get_my_instituicao_id from SECURITY DEFINER to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_my_instituicao_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN NULL
    ELSE (SELECT instituicao_id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1)
  END;
$function$;
