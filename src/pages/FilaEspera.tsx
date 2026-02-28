import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Prioridade } from '@/types';
import { Clock, FileText, Users, X, Phone, User, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const prioridadeStyles: Record<Prioridade, string> = {
  Alta: 'bg-red-100 text-red-800 border-red-300',
  Média: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Baixa: 'bg-green-100 text-green-800 border-green-300',
};

const prioridadeOrder: Record<Prioridade, number> = { Alta: 0, Média: 1, Baixa: 2 };

const getTempoEspera = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  const chegada = new Date();
  chegada.setHours(h, m, 0, 0);
  const diff = Math.floor((Date.now() - chegada.getTime()) / 60000);
  return diff > 0 ? diff : 0;
};

const FilaEspera: React.FC = () => {
  const { atendimentos } = useData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hoje = new Date().toISOString().split('T')[0];
  const fila = atendimentos
    .filter(a => a.status === 'Aguardando' && a.data_chegada === hoje)
    .sort((a, b) => {
      const pDiff = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      if (pDiff !== 0) return pDiff;
      return a.hora_chegada.localeCompare(b.hora_chegada);
    });

  const selected = fila.find(a => a.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Fila de Espera</h1>
        <p className="text-sm text-muted-foreground mt-1">{fila.length} aguardando atendimento hoje</p>
      </div>

      <div className="space-y-3">
        {fila.map(a => {
          const tempo = getTempoEspera(a.hora_chegada);
          const tempoAlerta = tempo > 60 ? 'border-l-red-500' : tempo > 30 ? 'border-l-yellow-500' : 'border-l-transparent';

          return (
            <div
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={cn(
                "bg-card rounded-lg border p-4 border-l-4 transition-all cursor-pointer hover:shadow-md",
                tempoAlerta
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{a.nome_cidadao}</span>
                    <Badge variant="outline" className="text-xs">{a.tipo_registro}</Badge>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", prioridadeStyles[a.prioridade])}>
                      {a.prioridade}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-start gap-1">
                    <FileText className="w-3 h-3 mt-1 flex-shrink-0" />
                    {a.demanda_principal}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.hora_chegada}</span>
                    {tempo > 30 && (
                      <span className="flex items-center gap-1 font-medium text-destructive">
                        <AlertCircle className="w-3 h-3" /> {tempo} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {fila.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum cidadão aguardando</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedId(null)}>
          <div className="bg-card rounded-xl border shadow-lg w-full max-w-lg mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Detalhes do Atendimento</h2>
              <button onClick={() => setSelectedId(null)} className="p-1 rounded hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-base">{selected.nome_cidadao}</span>
                <Badge variant="outline">{selected.tipo}</Badge>
                <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", prioridadeStyles[selected.prioridade])}>
                  {selected.prioridade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Tipo Registro:</span><p className="font-medium">{selected.tipo_registro}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p className="font-medium">{selected.status}</p></div>
                <div><span className="text-muted-foreground">Chegada:</span><p className="font-medium">{selected.hora_chegada}</p></div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /><p className="font-medium">{selected.telefone_contato}</p></div>
              </div>

              {selected.indicado_por && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="w-3 h-3" /> Indicado por: <span className="font-medium text-foreground">{selected.indicado_por}</span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">Assunto:</span>
                <p className="font-medium">{selected.assunto}</p>
              </div>

              <div>
                <span className="text-muted-foreground">Demanda Principal:</span>
                <p className="font-medium">{selected.demanda_principal}</p>
              </div>

              {selected.descricao && (
                <div>
                  <span className="text-muted-foreground">Descrição:</span>
                  <p>{selected.descricao}</p>
                </div>
              )}

              {selected.observacao_recepcao && (
                <div>
                  <span className="text-muted-foreground">Observação da Recepção:</span>
                  <p>{selected.observacao_recepcao}</p>
                </div>
              )}

              {selected.data_agendada && (
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Data Agendada:</span><p className="font-medium">{selected.data_agendada}</p></div>
                  <div><span className="text-muted-foreground">Hora Agendada:</span><p className="font-medium">{selected.hora_agendada}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilaEspera;
