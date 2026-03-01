
-- Fix ALL RLS policies: convert from RESTRICTIVE to PERMISSIVE
-- The issue: all policies were created as RESTRICTIVE (using AS RESTRICTIVE),
-- which means NO data is accessible because there are no PERMISSIVE policies.

-- ============ USUARIOS ============
DROP POLICY IF EXISTS "Service role full access" ON public.usuarios;
DROP POLICY IF EXISTS "Users can read own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can read users in same institution" ON public.usuarios;

CREATE POLICY "Service role full access" ON public.usuarios FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can read own profile" ON public.usuarios FOR SELECT TO authenticated USING (auth_user_id = auth.uid());
CREATE POLICY "Users can read users in same institution" ON public.usuarios FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ ATENDIMENTOS ============
DROP POLICY IF EXISTS "Service role full access atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Users insert own institution atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Users read own institution atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Users update own institution atendimentos" ON public.atendimentos;

CREATE POLICY "Service role full access atendimentos" ON public.atendimentos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution atendimentos" ON public.atendimentos FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution atendimentos" ON public.atendimentos FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution atendimentos" ON public.atendimentos FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ AUTORIZACOES_FINANCEIRAS ============
DROP POLICY IF EXISTS "Service role full access autorizacoes" ON public.autorizacoes_financeiras;
DROP POLICY IF EXISTS "Users insert own institution autorizacoes" ON public.autorizacoes_financeiras;
DROP POLICY IF EXISTS "Users read own institution autorizacoes" ON public.autorizacoes_financeiras;
DROP POLICY IF EXISTS "Users update own institution autorizacoes" ON public.autorizacoes_financeiras;

CREATE POLICY "Service role full access autorizacoes" ON public.autorizacoes_financeiras FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution autorizacoes" ON public.autorizacoes_financeiras FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution autorizacoes" ON public.autorizacoes_financeiras FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution autorizacoes" ON public.autorizacoes_financeiras FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ COMANDOS ============
DROP POLICY IF EXISTS "Service role full access comandos" ON public.comandos;
DROP POLICY IF EXISTS "Users insert own institution comandos" ON public.comandos;
DROP POLICY IF EXISTS "Users read own institution comandos" ON public.comandos;
DROP POLICY IF EXISTS "Users update own institution comandos" ON public.comandos;

CREATE POLICY "Service role full access comandos" ON public.comandos FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution comandos" ON public.comandos FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution comandos" ON public.comandos FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution comandos" ON public.comandos FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ DEMANDAS ============
DROP POLICY IF EXISTS "Service role full access demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users insert own institution demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users read own institution demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users update own institution demandas" ON public.demandas;

CREATE POLICY "Service role full access demandas" ON public.demandas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution demandas" ON public.demandas FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution demandas" ON public.demandas FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution demandas" ON public.demandas FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ DEMANDAS_ATENDIMENTO ============
DROP POLICY IF EXISTS "Service role full access demandas_atendimento" ON public.demandas_atendimento;
DROP POLICY IF EXISTS "Users insert own institution demandas_atendimento" ON public.demandas_atendimento;
DROP POLICY IF EXISTS "Users read own institution demandas_atendimento" ON public.demandas_atendimento;
DROP POLICY IF EXISTS "Users update own institution demandas_atendimento" ON public.demandas_atendimento;

CREATE POLICY "Service role full access demandas_atendimento" ON public.demandas_atendimento FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution demandas_atendimento" ON public.demandas_atendimento FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution demandas_atendimento" ON public.demandas_atendimento FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution demandas_atendimento" ON public.demandas_atendimento FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ EVENTOS_AGENDA ============
DROP POLICY IF EXISTS "Service role full access eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users delete own institution eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users insert own institution eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users read own institution eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users update own institution eventos" ON public.eventos_agenda;

CREATE POLICY "Service role full access eventos" ON public.eventos_agenda FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution eventos" ON public.eventos_agenda FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution eventos" ON public.eventos_agenda FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution eventos" ON public.eventos_agenda FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users delete own institution eventos" ON public.eventos_agenda FOR DELETE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ INSTITUICOES ============
DROP POLICY IF EXISTS "Authenticated users can read active institutions" ON public.instituicoes;
DROP POLICY IF EXISTS "Service role can manage institutions" ON public.instituicoes;

CREATE POLICY "Service role can manage institutions" ON public.instituicoes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read active institutions" ON public.instituicoes FOR SELECT TO authenticated USING (ativa = true);

-- ============ LOG_AUDITORIA ============
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.log_auditoria;
DROP POLICY IF EXISTS "Service role can read audit logs" ON public.log_auditoria;

CREATE POLICY "Service role can manage audit logs" ON public.log_auditoria FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins can read audit logs" ON public.log_auditoria FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_user_id = auth.uid() AND u.perfil = 'administrador')
);
CREATE POLICY "Users can insert audit logs" ON public.log_auditoria FOR INSERT TO authenticated WITH CHECK (true);

-- ============ MENSAGENS_CHAT ============
DROP POLICY IF EXISTS "Service role full access mensagens" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users insert own institution mensagens" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users read own institution mensagens" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users update own institution mensagens" ON public.mensagens_chat;

CREATE POLICY "Service role full access mensagens" ON public.mensagens_chat FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution mensagens" ON public.mensagens_chat FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution mensagens" ON public.mensagens_chat FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution mensagens" ON public.mensagens_chat FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ NOTIFICACOES ============
DROP POLICY IF EXISTS "Service role full access notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users insert own institution notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users read own institution notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users update own notificacoes" ON public.notificacoes;

CREATE POLICY "Service role full access notificacoes" ON public.notificacoes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution notificacoes" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own notificacoes" ON public.notificacoes FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ PAUTAS_DESPACHO ============
DROP POLICY IF EXISTS "Service role full access pautas" ON public.pautas_despacho;
DROP POLICY IF EXISTS "Users insert own institution pautas" ON public.pautas_despacho;
DROP POLICY IF EXISTS "Users read own institution pautas" ON public.pautas_despacho;
DROP POLICY IF EXISTS "Users update own institution pautas" ON public.pautas_despacho;

CREATE POLICY "Service role full access pautas" ON public.pautas_despacho FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution pautas" ON public.pautas_despacho FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution pautas" ON public.pautas_despacho FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution pautas" ON public.pautas_despacho FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ SESSOES_USUARIO ============
DROP POLICY IF EXISTS "Service role manages sessions" ON public.sessoes_usuario;

CREATE POLICY "Service role manages sessions" ON public.sessoes_usuario FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can read own sessions" ON public.sessoes_usuario FOR SELECT TO authenticated USING (
  usuario_id IN (SELECT u.id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);

-- ============ SOLICITACOES ============
DROP POLICY IF EXISTS "Service role full access solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users insert own institution solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users read own institution solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users update own institution solicitacoes" ON public.solicitacoes;

CREATE POLICY "Service role full access solicitacoes" ON public.solicitacoes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users read own institution solicitacoes" ON public.solicitacoes FOR SELECT TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users insert own institution solicitacoes" ON public.solicitacoes FOR INSERT TO authenticated WITH CHECK (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
CREATE POLICY "Users update own institution solicitacoes" ON public.solicitacoes FOR UPDATE TO authenticated USING (
  instituicao_id IN (SELECT u.instituicao_id FROM usuarios u WHERE u.auth_user_id = auth.uid())
);
