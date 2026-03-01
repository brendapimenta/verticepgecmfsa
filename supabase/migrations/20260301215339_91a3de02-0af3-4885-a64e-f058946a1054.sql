
-- System config table for VAPID keys etc
CREATE TABLE public.sistema_config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sistema_config ENABLE ROW LEVEL SECURITY;
-- No permissive policies for anon/authenticated = only service_role can access

-- Push subscription storage
CREATE TABLE public.notificacoes_push_dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  navegador TEXT,
  dispositivo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ativo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(usuario_id, endpoint)
);
ALTER TABLE public.notificacoes_push_dispositivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_select_own" ON public.notificacoes_push_dispositivos FOR SELECT
  USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));
CREATE POLICY "push_insert_own" ON public.notificacoes_push_dispositivos FOR INSERT
  WITH CHECK (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));
CREATE POLICY "push_update_own" ON public.notificacoes_push_dispositivos FOR UPDATE
  USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));
CREATE POLICY "push_delete_own" ON public.notificacoes_push_dispositivos FOR DELETE
  USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));

-- Notification preferences per user
CREATE TABLE public.preferencias_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  push_ativo BOOLEAN NOT NULL DEFAULT true,
  som_alerta_urgente BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.preferencias_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_own" ON public.preferencias_notificacao FOR SELECT
  USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));
CREATE POLICY "prefs_insert_own" ON public.preferencias_notificacao FOR INSERT
  WITH CHECK (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));
CREATE POLICY "prefs_update_own" ON public.preferencias_notificacao FOR UPDATE
  USING (usuario_id IN (SELECT id FROM usuarios WHERE auth_user_id = auth.uid()));
