
-- Add DELETE policies for tables that legitimately need deletion
-- notificacoes: users clear old notifications
CREATE POLICY "notificacoes_delete" ON public.notificacoes
  FOR DELETE TO authenticated
  USING (instituicao_id = public.get_my_instituicao_id());

-- mensagens_chat: users delete own messages
CREATE POLICY "mensagens_delete" ON public.mensagens_chat
  FOR DELETE TO authenticated
  USING (instituicao_id = public.get_my_instituicao_id());

-- comandos: users clear completed commands
CREATE POLICY "comandos_delete" ON public.comandos
  FOR DELETE TO authenticated
  USING (instituicao_id = public.get_my_instituicao_id());
