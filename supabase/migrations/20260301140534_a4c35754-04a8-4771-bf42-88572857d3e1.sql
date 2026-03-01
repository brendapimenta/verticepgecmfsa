
-- Tabela de Instituições (multi-tenancy)
CREATE TABLE public.instituicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_instituicao TEXT NOT NULL,
  sigla TEXT NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#0C2A4D',
  cor_secundaria TEXT DEFAULT '#3C5C7A',
  dominio TEXT,
  observacoes TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

-- Leitura pública para usuários autenticados (necessário para login/filtros)
CREATE POLICY "Authenticated users can read active institutions"
  ON public.instituicoes FOR SELECT
  TO authenticated
  USING (ativa = true);

-- Apenas service_role pode inserir/atualizar (admin via edge function no futuro)
CREATE POLICY "Service role can manage institutions"
  ON public.instituicoes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_instituicoes_updated_at
  BEFORE UPDATE ON public.instituicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir registro padrão da CMFS
INSERT INTO public.instituicoes (nome_instituicao, sigla, cor_primaria, cor_secundaria)
VALUES ('Câmara Municipal de Feira de Santana', 'CMFS', '#0C2A4D', '#3C5C7A');
