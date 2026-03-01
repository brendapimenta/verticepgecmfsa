
-- Fix security definer view - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.usuarios_public;
CREATE VIEW public.usuarios_public WITH (security_invoker = true) AS
  SELECT id, nome, email, username, perfil, ativo, auth_user_id, instituicao_id,
         primeiro_login_pendente, ultimo_login_em, criado_em, atualizado_em,
         tentativas_login_falhas, bloqueado_ate
  FROM public.usuarios;
