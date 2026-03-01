
-- Add recorrencia_id column for recurring event groups
ALTER TABLE public.eventos_agenda
ADD COLUMN recorrencia_id uuid DEFAULT NULL;

-- Index for efficient group queries
CREATE INDEX idx_eventos_agenda_recorrencia_id ON public.eventos_agenda(recorrencia_id) WHERE recorrencia_id IS NOT NULL;
