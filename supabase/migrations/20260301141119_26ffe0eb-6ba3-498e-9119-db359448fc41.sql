
-- ============================================
-- PERFIL ENUM
-- ============================================
CREATE TYPE public.perfil_usuario AS ENUM ('administrador', 'sala_espera', 'brenda', 'presidente');

-- ============================================
-- TABELA USUARIOS (profiles linked to auth.users)
-- ============================================
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil perfil_usuario NOT NULL DEFAULT 'sala_espera',
  ativo BOOLEAN NOT NULL DEFAULT true,
  login_google_habilitado BOOLEAN NOT NULL DEFAULT false,
  google_id TEXT,
  ultimo_login_em TIMESTAMP WITH TIME ZONE,
  primeiro_login_pendente BOOLEAN NOT NULL DEFAULT true,
  instituicao_id UUID REFERENCES public.instituicoes(id) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.usuarios FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Service role can do everything (admin operations via edge functions)
CREATE POLICY "Service role full access"
  ON public.usuarios FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VIEW PÚBLICA (sem dados sensíveis)
-- ============================================
CREATE VIEW public.usuarios_public
WITH (security_invoker = on) AS
  SELECT id, nome, email, perfil, ativo, login_google_habilitado, 
         ultimo_login_em, primeiro_login_pendente, instituicao_id, 
         criado_em, atualizado_em, auth_user_id
  FROM public.usuarios;

-- ============================================
-- TABELA LOG_AUDITORIA (imutável)
-- ============================================
CREATE TABLE public.log_auditoria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_ator_id UUID,
  usuario_alvo_id UUID,
  tipo_acao TEXT NOT NULL,
  modulo TEXT,
  descricao TEXT NOT NULL,
  referencia_tipo TEXT,
  referencia_id TEXT,
  valor_anterior TEXT,
  valor_novo TEXT,
  nivel_sensibilidade TEXT NOT NULL DEFAULT 'normal',
  ip TEXT,
  user_agent TEXT,
  instituicao_id UUID REFERENCES public.instituicoes(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (via edge functions)
CREATE POLICY "Service role can insert audit logs"
  ON public.log_auditoria FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only service role can read (admin reads via edge function)
CREATE POLICY "Service role can read audit logs"
  ON public.log_auditoria FOR SELECT
  TO service_role
  USING (true);

-- No update or delete policies = immutable

-- ============================================
-- TABELA SESSOES_USUARIO
-- ============================================
CREATE TABLE public.sessoes_usuario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES public.usuarios(id) NOT NULL,
  ip TEXT,
  user_agent TEXT,
  metodo_login TEXT NOT NULL DEFAULT 'senha',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  encerrado_em TIMESTAMP WITH TIME ZONE,
  instituicao_id UUID REFERENCES public.instituicoes(id)
);

ALTER TABLE public.sessoes_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sessions"
  ON public.sessoes_usuario FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- INSERT DEFAULT ADMIN USER (will be linked to auth.users later)
-- ============================================
INSERT INTO public.usuarios (nome, email, perfil, ativo, instituicao_id)
SELECT 'Administrador', 'admin@cmfs.gov.br', 'administrador', true, i.id
FROM public.instituicoes i WHERE i.sigla = 'CMFS';

INSERT INTO public.usuarios (nome, email, perfil, ativo, instituicao_id)
SELECT 'Recepção', 'recepcao@cmfs.gov.br', 'sala_espera', true, i.id
FROM public.instituicoes i WHERE i.sigla = 'CMFS';

INSERT INTO public.usuarios (nome, email, perfil, ativo, instituicao_id)
SELECT 'Brenda', 'brenda@cmfs.gov.br', 'brenda', true, i.id
FROM public.instituicoes i WHERE i.sigla = 'CMFS';

INSERT INTO public.usuarios (nome, email, perfil, ativo, instituicao_id)
SELECT 'Presidente', 'presidente@cmfs.gov.br', 'presidente', true, i.id
FROM public.instituicoes i WHERE i.sigla = 'CMFS';
