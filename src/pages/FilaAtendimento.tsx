import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prioridade, StatusAtendimento } from '@/types';
import { Clock, Phone, User, FileText, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const prioridadeOrder: Record<Prioridade, number> = { Alta: 0, Média: 1, Baixa: 2 };

const prioridadeBadge: Record<Prioridade, string> = {
  Alta: 'bg-red-100 text-red-800 border-red-300',
  Média: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Baixa: 'bg-green-100 text-green-800 border-green-300',
};

const statusBadge: Record<StatusAtendimento, string> = {
  Aguardando: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Em Atendimento': 'bg-blue-100 text-blue-800 border-blue-300',
  Concluído: 'bg-green-100 text-green-800 border-green-300',
  Adiado: 'bg-gray-100 text-gray-700 border-gray-300',
};

const getTempoEspera = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  const chegada = new Date();
  chegada.setHours(h, m, 0, 0);
  const diff = Math.floor((Date.now() - chegada.getTime()) / 60000);
  return diff > 0 ? diff : 0;
};

const FilaAtendimento: React.FC = () => {
  const { atendimentos, updateAtendimento } = useData();
  const { usuario } = useAuth();
  const isBrenda = usuario?.perfil === 'brenda' || usuario?.perfil === 'administrador';
  const [concluirId, setConcluirId] = useState<string | null>(null);
  const canConcluir = isBrenda || usuario?.perfil === 'presidente';

  const hoje = new Date().toISOString().split('T')[0];
  const filaHoje = atendimentos
    .filter(a => a.data_chegada === hoje && a.status !== 'Concluído')
    .sort((a, b) => {
      const pDiff = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      if (pDiff !== 0) return pDiff;
      return a.hora_chegada.localeCompare(b.hora_chegada);
    });

  const concluidos = atendimentos.filter(a => a.data_chegada === hoje && a.status === 'Concluído');

  const handleConcluir = () => {
    if (!concluirId || !usuario) return;
    const updates: Partial<typeof atendimentos[0]> = {
      status: 'Concluído' as StatusAtendimento,
      data_conclusao: new Date().toISOString(),
    };
    if (usuario.perfil === 'brenda') {
      const atendimento = atendimentos.find(a => a.id === concluirId);
      if (atendimento && !atendimento.responsavel) {
        updates.responsavel = usuario.nome;
      }
    }
    updateAtendimento(concluirId, updates);
    setConcluirId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Fila de Atendimento</h1>
        <p className="text-sm text-muted-foreground mt-1">{filaHoje.length} em espera ou em atendimento</p>
      </div>

      <div className="space-y-3">
        {filaHoje.map(a => {
          const tempo = getTempoEspera(a.hora_chegada);
          const tempoAlerta = tempo > 60 ? 'border-l-red-500' : tempo > 30 ? 'border-l-yellow-500' : 'border-l-transparent';

          return (
            <div key={a.id} className={cn("bg-card rounded-lg border p-4 border-l-4 transition-all", tempoAlerta)}>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{a.nome_cidadao}</span>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", prioridadeBadge[a.prioridade])}>
                      {a.prioridade}
                    </span>
                    <Badge variant="outline" className="text-xs">{a.tipo}</Badge>
                    <Badge variant="outline" className="text-xs">{a.tipo_registro}</Badge>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", statusBadge[a.status])}>
                      {a.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.hora_chegada}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {a.telefone_contato}</span>
                    {a.indicado_por && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {a.indicado_por}</span>}
                  </div>

                  <div className="flex items-start gap-1 text-sm">
                    <FileText className="w-3 h-3 mt-1 text-muted-foreground flex-shrink-0" />
                    <span>{a.demanda_principal}</span>
                  </div>

                  {tempo > 30 && (
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      <span>{tempo} min de espera</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 items-center flex-shrink-0 flex-wrap">
                  {isBrenda && (
                    <Select
                      value={a.prioridade}
                      onValueChange={(v) => updateAtendimento(a.id, { prioridade: v as Prioridade })}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {isBrenda && (
                    <Select
                      value={a.status}
                      onValueChange={(v) => updateAtendimento(a.id, { status: v as StatusAtendimento, ...(v === 'Concluído' ? { data_conclusao: new Date().toISOString() } : {}) })}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aguardando">Aguardando</SelectItem>
                        <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Adiado">Adiado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {canConcluir && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                      onClick={() => setConcluirId(a.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filaHoje.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum atendimento na fila</p>
          </div>
        )}
      </div>

      {concluidos.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">Concluídos Hoje ({concluidos.length})</h2>
          <div className="space-y-2 opacity-60">
            {concluidos.map(a => (
              <div key={a.id} className="bg-card rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{a.nome_cidadao}</span>
                  <Badge variant="outline" className="text-xs">{a.tipo}</Badge>
                  <span className="text-xs text-green-600 font-medium">✓ Concluído</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.demanda_principal}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!concluirId} onOpenChange={(open) => !open && setConcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar este atendimento como CONCLUÍDO?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConcluir}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FilaAtendimento;
