
-- Step 1: Create a SECURITY DEFINER function to get institution_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_my_instituicao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT instituicao_id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Step 2: Drop ALL existing policies on usuarios
DROP POLICY IF EXISTS "Service role full access" ON public.usuarios;
DROP POLICY IF EXISTS "Users can read own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can read users in same institution" ON public.usuarios;

-- Recreate usuarios policies as PERMISSIVE using the helper function
CREATE POLICY "usuarios_select_own" ON public.usuarios FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "usuarios_select_same_inst" ON public.usuarios FOR SELECT
  USING (instituicao_id = public.get_my_instituicao_id());

CREATE POLICY "usuarios_service_role" ON public.usuarios FOR ALL
  USING (true) WITH CHECK (true);

-- Step 3: Fix all other tables - drop RESTRICTIVE, recreate PERMISSIVE with helper function

-- ATENDIMENTOS
DROP POLICY IF EXISTS "Service role full access atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Users read own institution atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Users insert own institution atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Users update own institution atendimentos" ON public.atendimentos;

CREATE POLICY "atendimentos_select" ON public.atendimentos FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "atendimentos_insert" ON public.atendimentos FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "atendimentos_update" ON public.atendimentos FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "atendimentos_service" ON public.atendimentos FOR ALL USING (true) WITH CHECK (true);

-- AUTORIZACOES_FINANCEIRAS
DROP POLICY IF EXISTS "Service role full access autorizacoes" ON public.autorizacoes_financeiras;
DROP POLICY IF EXISTS "Users read own institution autorizacoes" ON public.autorizacoes_financeiras;
DROP POLICY IF EXISTS "Users insert own institution autorizacoes" ON public.autorizacoes_financeiras;
DROP POLICY IF EXISTS "Users update own institution autorizacoes" ON public.autorizacoes_financeiras;

CREATE POLICY "autorizacoes_select" ON public.autorizacoes_financeiras FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "autorizacoes_insert" ON public.autorizacoes_financeiras FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "autorizacoes_update" ON public.autorizacoes_financeiras FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "autorizacoes_service" ON public.autorizacoes_financeiras FOR ALL USING (true) WITH CHECK (true);

-- COMANDOS
DROP POLICY IF EXISTS "Service role full access comandos" ON public.comandos;
DROP POLICY IF EXISTS "Users read own institution comandos" ON public.comandos;
DROP POLICY IF EXISTS "Users insert own institution comandos" ON public.comandos;
DROP POLICY IF EXISTS "Users update own institution comandos" ON public.comandos;

CREATE POLICY "comandos_select" ON public.comandos FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "comandos_insert" ON public.comandos FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "comandos_update" ON public.comandos FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "comandos_service" ON public.comandos FOR ALL USING (true) WITH CHECK (true);

-- DEMANDAS
DROP POLICY IF EXISTS "Service role full access demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users read own institution demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users insert own institution demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users update own institution demandas" ON public.demandas;

CREATE POLICY "demandas_select" ON public.demandas FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "demandas_insert" ON public.demandas FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "demandas_update" ON public.demandas FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "demandas_service" ON public.demandas FOR ALL USING (true) WITH CHECK (true);

-- DEMANDAS_ATENDIMENTO
DROP POLICY IF EXISTS "Service role full access demandas_atendimento" ON public.demandas_atendimento;
DROP POLICY IF EXISTS "Users read own institution demandas_atendimento" ON public.demandas_atendimento;
DROP POLICY IF EXISTS "Users insert own institution demandas_atendimento" ON public.demandas_atendimento;
DROP POLICY IF EXISTS "Users update own institution demandas_atendimento" ON public.demandas_atendimento;

CREATE POLICY "demandas_atend_select" ON public.demandas_atendimento FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "demandas_atend_insert" ON public.demandas_atendimento FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "demandas_atend_update" ON public.demandas_atendimento FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "demandas_atend_service" ON public.demandas_atendimento FOR ALL USING (true) WITH CHECK (true);

-- EVENTOS_AGENDA
DROP POLICY IF EXISTS "Service role full access eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users read own institution eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users insert own institution eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users update own institution eventos" ON public.eventos_agenda;
DROP POLICY IF EXISTS "Users delete own institution eventos" ON public.eventos_agenda;

CREATE POLICY "eventos_select" ON public.eventos_agenda FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "eventos_insert" ON public.eventos_agenda FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "eventos_update" ON public.eventos_agenda FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "eventos_delete" ON public.eventos_agenda FOR DELETE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "eventos_service" ON public.eventos_agenda FOR ALL USING (true) WITH CHECK (true);

-- MENSAGENS_CHAT
DROP POLICY IF EXISTS "Service role full access mensagens" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users read own institution mensagens" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users insert own institution mensagens" ON public.mensagens_chat;
DROP POLICY IF EXISTS "Users update own institution mensagens" ON public.mensagens_chat;

CREATE POLICY "mensagens_select" ON public.mensagens_chat FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "mensagens_insert" ON public.mensagens_chat FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "mensagens_update" ON public.mensagens_chat FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "mensagens_service" ON public.mensagens_chat FOR ALL USING (true) WITH CHECK (true);

-- NOTIFICACOES
DROP POLICY IF EXISTS "Service role full access notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users read own institution notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users insert own institution notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Users update own notificacoes" ON public.notificacoes;

CREATE POLICY "notificacoes_select" ON public.notificacoes FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "notificacoes_insert" ON public.notificacoes FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "notificacoes_update" ON public.notificacoes FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "notificacoes_service" ON public.notificacoes FOR ALL USING (true) WITH CHECK (true);

-- PAUTAS_DESPACHO
DROP POLICY IF EXISTS "Service role full access pautas" ON public.pautas_despacho;
DROP POLICY IF EXISTS "Users read own institution pautas" ON public.pautas_despacho;
DROP POLICY IF EXISTS "Users insert own institution pautas" ON public.pautas_despacho;
DROP POLICY IF EXISTS "Users update own institution pautas" ON public.pautas_despacho;

CREATE POLICY "pautas_select" ON public.pautas_despacho FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "pautas_insert" ON public.pautas_despacho FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "pautas_update" ON public.pautas_despacho FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "pautas_service" ON public.pautas_despacho FOR ALL USING (true) WITH CHECK (true);

-- SOLICITACOES
DROP POLICY IF EXISTS "Service role full access solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users read own institution solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users insert own institution solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users update own institution solicitacoes" ON public.solicitacoes;

CREATE POLICY "solicitacoes_select" ON public.solicitacoes FOR SELECT USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "solicitacoes_insert" ON public.solicitacoes FOR INSERT WITH CHECK (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "solicitacoes_update" ON public.solicitacoes FOR UPDATE USING (instituicao_id = public.get_my_instituicao_id());
CREATE POLICY "solicitacoes_service" ON public.solicitacoes FOR ALL USING (true) WITH CHECK (true);

-- INSTITUICOES - fix restrictive
DROP POLICY IF EXISTS "Authenticated users can read active institutions" ON public.instituicoes;
DROP POLICY IF EXISTS "Service role can manage institutions" ON public.instituicoes;

CREATE POLICY "instituicoes_select" ON public.instituicoes FOR SELECT USING (ativa = true);
CREATE POLICY "instituicoes_service" ON public.instituicoes FOR ALL USING (true) WITH CHECK (true);

-- LOG_AUDITORIA - fix restrictive
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.log_auditoria;
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.log_auditoria;
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.log_auditoria;

CREATE POLICY "log_select_admin" ON public.log_auditoria FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.usuarios u WHERE u.auth_user_id = auth.uid() AND u.perfil = 'administrador'));
CREATE POLICY "log_insert" ON public.log_auditoria FOR INSERT WITH CHECK (true);
CREATE POLICY "log_service" ON public.log_auditoria FOR ALL USING (true) WITH CHECK (true);

-- SESSOES_USUARIO - fix restrictive
DROP POLICY IF EXISTS "Service role manages sessions" ON public.sessoes_usuario;
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessoes_usuario;

CREATE POLICY "sessoes_select" ON public.sessoes_usuario FOR SELECT
  USING (usuario_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()));
CREATE POLICY "sessoes_service" ON public.sessoes_usuario FOR ALL USING (true) WITH CHECK (true);
