
-- CORREÇÃO CRÍTICA: Restringir TODAS as políticas _service ao role service_role
-- Isso bloqueia acesso anônimo via anon key

-- ATENDIMENTOS
DROP POLICY IF EXISTS "atendimentos_service" ON public.atendimentos;
CREATE POLICY "atendimentos_service" ON public.atendimentos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AUTORIZACOES_FINANCEIRAS
DROP POLICY IF EXISTS "autorizacoes_service" ON public.autorizacoes_financeiras;
CREATE POLICY "autorizacoes_service" ON public.autorizacoes_financeiras FOR ALL TO service_role USING (true) WITH CHECK (true);

-- COMANDOS
DROP POLICY IF EXISTS "comandos_service" ON public.comandos;
CREATE POLICY "comandos_service" ON public.comandos FOR ALL TO service_role USING (true) WITH CHECK (true);

-- DEMANDAS
DROP POLICY IF EXISTS "demandas_service" ON public.demandas;
CREATE POLICY "demandas_service" ON public.demandas FOR ALL TO service_role USING (true) WITH CHECK (true);

-- DEMANDAS_ATENDIMENTO
DROP POLICY IF EXISTS "demandas_atend_service" ON public.demandas_atendimento;
CREATE POLICY "demandas_atend_service" ON public.demandas_atendimento FOR ALL TO service_role USING (true) WITH CHECK (true);

-- EVENTOS_AGENDA
DROP POLICY IF EXISTS "eventos_service" ON public.eventos_agenda;
CREATE POLICY "eventos_service" ON public.eventos_agenda FOR ALL TO service_role USING (true) WITH CHECK (true);

-- INSTITUICOES
DROP POLICY IF EXISTS "instituicoes_service" ON public.instituicoes;
CREATE POLICY "instituicoes_service" ON public.instituicoes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- LOG_AUDITORIA
DROP POLICY IF EXISTS "log_service" ON public.log_auditoria;
CREATE POLICY "log_service" ON public.log_auditoria FOR ALL TO service_role USING (true) WITH CHECK (true);

-- MENSAGENS_CHAT
DROP POLICY IF EXISTS "mensagens_service" ON public.mensagens_chat;
CREATE POLICY "mensagens_service" ON public.mensagens_chat FOR ALL TO service_role USING (true) WITH CHECK (true);

-- NOTIFICACOES
DROP POLICY IF EXISTS "notificacoes_service" ON public.notificacoes;
CREATE POLICY "notificacoes_service" ON public.notificacoes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- PAUTAS_DESPACHO
DROP POLICY IF EXISTS "pautas_service" ON public.pautas_despacho;
CREATE POLICY "pautas_service" ON public.pautas_despacho FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SESSOES_USUARIO
DROP POLICY IF EXISTS "sessoes_service" ON public.sessoes_usuario;
CREATE POLICY "sessoes_service" ON public.sessoes_usuario FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SOLICITACOES
DROP POLICY IF EXISTS "solicitacoes_service" ON public.solicitacoes;
CREATE POLICY "solicitacoes_service" ON public.solicitacoes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- USUARIOS
DROP POLICY IF EXISTS "usuarios_service_role" ON public.usuarios;
CREATE POLICY "usuarios_service_role" ON public.usuarios FOR ALL TO service_role USING (true) WITH CHECK (true);

-- LOG_AUDITORIA INSERT: também restringir ao service_role
DROP POLICY IF EXISTS "log_insert_service_only" ON public.log_auditoria;
CREATE POLICY "log_insert_service_only" ON public.log_auditoria FOR INSERT TO service_role WITH CHECK (true);
