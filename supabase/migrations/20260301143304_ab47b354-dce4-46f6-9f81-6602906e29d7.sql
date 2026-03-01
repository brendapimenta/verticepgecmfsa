
-- ============================================
-- 1) RENOMEAR ENUM: brenda → sala_principal
-- ============================================
ALTER TYPE public.perfil_usuario RENAME VALUE 'brenda' TO 'sala_principal';

-- ============================================
-- 2) TABELA: atendimentos
-- ============================================
CREATE TABLE public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  nome_cidadao text NOT NULL,
  tipo text NOT NULL,
  tipo_registro text NOT NULL,
  data_agendada text,
  hora_agendada text,
  telefone_contato text NOT NULL DEFAULT '',
  indicado_por text,
  assunto text,
  demanda_principal text NOT NULL,
  descricao text,
  data_chegada text NOT NULL,
  hora_chegada text NOT NULL,
  prioridade text NOT NULL DEFAULT 'Média',
  status text NOT NULL DEFAULT 'Aguardando',
  responsavel text NOT NULL DEFAULT 'Sala Principal',
  observacao_recepcao text,
  encaminhamento text,
  data_conclusao text,
  criado_por uuid NOT NULL REFERENCES public.usuarios(id),
  anotacoes_presidente text,
  anotacoes_presidente_atualizado_em timestamptz,
  anotacoes_sala_principal text,
  anotacoes_sala_principal_atualizado_em timestamptz,
  foto_url text,
  checkin_realizado boolean DEFAULT false,
  checkin_hora text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution atendimentos"
  ON public.atendimentos FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution atendimentos"
  ON public.atendimentos FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution atendimentos"
  ON public.atendimentos FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access atendimentos"
  ON public.atendimentos FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_atendimentos_updated_at
  BEFORE UPDATE ON public.atendimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3) TABELA: comandos
-- ============================================
CREATE TABLE public.comandos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  origem_perfil text NOT NULL,
  destino_perfil text NOT NULL,
  tipo_chamada text NOT NULL,
  descricao_customizada text,
  status text NOT NULL DEFAULT 'Pendente',
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_por_nome text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comandos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution comandos"
  ON public.comandos FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution comandos"
  ON public.comandos FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution comandos"
  ON public.comandos FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access comandos"
  ON public.comandos FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 4) TABELA: mensagens_chat
-- ============================================
CREATE TABLE public.mensagens_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  atendimento_id uuid REFERENCES public.atendimentos(id),
  remetente_id uuid NOT NULL REFERENCES public.usuarios(id),
  remetente_nome text NOT NULL,
  mensagem text NOT NULL,
  lido boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution mensagens"
  ON public.mensagens_chat FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution mensagens"
  ON public.mensagens_chat FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution mensagens"
  ON public.mensagens_chat FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access mensagens"
  ON public.mensagens_chat FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 5) TABELA: notificacoes
-- ============================================
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  usuario_destino_id uuid REFERENCES public.usuarios(id),
  perfil_destino text NOT NULL,
  tipo_notificacao text NOT NULL,
  referencia_tipo text NOT NULL,
  referencia_id text NOT NULL,
  mensagem_resumo text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution notificacoes"
  ON public.notificacoes FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution notificacoes"
  ON public.notificacoes FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own notificacoes"
  ON public.notificacoes FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access notificacoes"
  ON public.notificacoes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 6) TABELA: solicitacoes
-- ============================================
CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  origem_perfil text NOT NULL,
  destino_perfil text NOT NULL,
  atendimento_id uuid REFERENCES public.atendimentos(id),
  descricao_solicitacao text NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution solicitacoes"
  ON public.solicitacoes FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution solicitacoes"
  ON public.solicitacoes FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution solicitacoes"
  ON public.solicitacoes FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access solicitacoes"
  ON public.solicitacoes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 7) TABELA: demandas_atendimento
-- ============================================
CREATE TABLE public.demandas_atendimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  atendimento_id uuid NOT NULL REFERENCES public.atendimentos(id),
  origem_perfil text NOT NULL DEFAULT 'Sala Principal',
  destino_perfil text NOT NULL DEFAULT 'Sala de Espera',
  descricao_demanda text NOT NULL,
  status text NOT NULL DEFAULT 'Pendente',
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas_atendimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution demandas_atendimento"
  ON public.demandas_atendimento FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution demandas_atendimento"
  ON public.demandas_atendimento FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution demandas_atendimento"
  ON public.demandas_atendimento FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access demandas_atendimento"
  ON public.demandas_atendimento FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 8) TABELA: demandas
-- ============================================
CREATE TABLE public.demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  origem_perfil text NOT NULL,
  destino_perfil text NOT NULL,
  atendimento_id uuid REFERENCES public.atendimentos(id),
  prioridade text NOT NULL DEFAULT 'Média',
  status text NOT NULL DEFAULT 'Pendente',
  prazo text,
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution demandas"
  ON public.demandas FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution demandas"
  ON public.demandas FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution demandas"
  ON public.demandas FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access demandas"
  ON public.demandas FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 9) TABELA: autorizacoes_financeiras
-- ============================================
CREATE TABLE public.autorizacoes_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  titulo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  valor numeric,
  status text NOT NULL DEFAULT 'Pendente',
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_por_perfil text NOT NULL DEFAULT 'Sala Principal',
  resolvido_em timestamptz,
  concluido_por_id uuid REFERENCES public.usuarios(id),
  concluido_por_perfil text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.autorizacoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution autorizacoes"
  ON public.autorizacoes_financeiras FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution autorizacoes"
  ON public.autorizacoes_financeiras FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution autorizacoes"
  ON public.autorizacoes_financeiras FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access autorizacoes"
  ON public.autorizacoes_financeiras FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================
-- 10) TABELA: eventos_agenda
-- ============================================
CREATE TABLE public.eventos_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  titulo text NOT NULL,
  descricao text,
  tipo_evento text NOT NULL DEFAULT 'Outro',
  local text,
  data_inicio text NOT NULL,
  hora_inicio text NOT NULL,
  data_fim text NOT NULL,
  hora_fim text NOT NULL,
  relacionado_a_atendimento_id uuid REFERENCES public.atendimentos(id),
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_por_perfil text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution eventos"
  ON public.eventos_agenda FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution eventos"
  ON public.eventos_agenda FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution eventos"
  ON public.eventos_agenda FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users delete own institution eventos"
  ON public.eventos_agenda FOR DELETE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access eventos"
  ON public.eventos_agenda FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_eventos_agenda_updated_at
  BEFORE UPDATE ON public.eventos_agenda
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11) TABELA: pautas_despacho
-- ============================================
CREATE TABLE public.pautas_despacho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid NOT NULL REFERENCES public.instituicoes(id),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Outro',
  tipo_registro text NOT NULL DEFAULT 'Decisão Presidencial',
  descricao_resumida text NOT NULL DEFAULT '',
  contexto_para_fala text NOT NULL DEFAULT '',
  perguntas_para_decisao text NOT NULL DEFAULT '',
  decisao_registrada text,
  comentario_presidente text,
  status text NOT NULL DEFAULT 'Pendente',
  prioridade text NOT NULL DEFAULT 'Média',
  responsavel text NOT NULL DEFAULT 'Sala Principal',
  prazo text,
  criado_por_id uuid NOT NULL REFERENCES public.usuarios(id),
  criado_por_perfil text NOT NULL,
  vinculado_a_tipo text,
  vinculado_a_id text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pautas_despacho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own institution pautas"
  ON public.pautas_despacho FOR SELECT TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users insert own institution pautas"
  ON public.pautas_despacho FOR INSERT TO authenticated
  WITH CHECK (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Users update own institution pautas"
  ON public.pautas_despacho FOR UPDATE TO authenticated
  USING (instituicao_id IN (SELECT u.instituicao_id FROM public.usuarios u WHERE u.auth_user_id = auth.uid()));

CREATE POLICY "Service role full access pautas"
  ON public.pautas_despacho FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_pautas_despacho_updated_at
  BEFORE UPDATE ON public.pautas_despacho
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 12) HABILITAR REALTIME para tabelas críticas
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.atendimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comandos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
